/* SIGEE Enterprise — M5.0.0 | Pré-importação Oficial
   Uso exclusivo Master. Executa somente leitura e diagnóstico.
   NÃO executa INSERT, UPDATE, UPSERT, DELETE ou RPC de gravação. */
(function () {
  'use strict';

  const VERSION = 'M5.0.0';
  let hashArquivo = '';
  let ultimoArquivo = null;
  let ultimoDiagnostico = null;

  const texto = v => v == null ? '' : String(v).trim();
  const normalizar = v => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const html = v => texto(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const numeroNte = v => {
    const m = texto(v).match(/(?:NTE\s*[-–]?\s*)?(\d{1,2})/i);
    return m ? String(Number(m[1])).padStart(2, '0') : '';
  };
  const perfilMaster = () => normalizar(window.usuarioLogado?.perfil).includes('MASTER');
  const clienteSupabase = () => [window.supabaseClient, window.supaClient, window.sb, window.SUPABASE_CLIENT].find(c => c && typeof c.from === 'function') || null;
  const resultadoM4 = () => window.SIGEE_MIGRACAO_HISTORICA?.resultado?.() || null;

  async function sha256(file) {
    if (!file || !window.crypto?.subtle) return '';
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function status(msg, tipo) {
    const el = document.getElementById('m5-status');
    if (!el) return;
    el.className = 'm5-status ' + (tipo || '');
    el.textContent = msg;
  }

  function garantirPainel() {
    const host = document.getElementById('aba-migracao-historica');
    if (!host || document.getElementById('m5-painel')) return;
    const painel = document.createElement('section');
    painel.id = 'm5-painel';
    painel.className = 'm5-painel';
    painel.innerHTML = `
      <header class="m5-topo">
        <div>
          <span>SIGEE IMPORT ENGINE ${VERSION}</span>
          <h2>Pré-importação Oficial</h2>
          <p>Conferência final do lote homologado contra a base atual do Supabase.</p>
        </div>
        <strong>🔐 Somente leitura</strong>
      </header>
      <div class="m5-alerta">Esta etapa não grava dados. O botão de importação definitiva permanecerá bloqueado até a camada transacional M5.1 estar instalada e validada.</div>
      <div class="m5-acoes">
        <button id="m5-preverificar" type="button">🛡️ Executar pré-verificação</button>
        <button id="m5-exportar" type="button" disabled>📄 Exportar diagnóstico</button>
        <button id="m5-importar" type="button" disabled title="Disponível somente após instalação da M5.1">🔒 Importar definitivamente</button>
      </div>
      <div id="m5-status" class="m5-status">Aguardando homologação M4 com qualidade de 100%.</div>
      <div id="m5-resumo" class="m5-resumo hidden"></div>
      <article id="m5-checks-box" class="m5-checks-box hidden">
        <header><h3>Checklist de autorização</h3><span id="m5-autorizacao">NÃO EXECUTADO</span></header>
        <div id="m5-checks" class="m5-checks"></div>
      </article>
      <article id="m5-conflitos-box" class="m5-conflitos-box hidden">
        <header><h3>Conferência contra processos atuais</h3><span id="m5-conflitos-resumo"></span></header>
        <div class="m5-tabela-wrap"><table><thead><tr><th>Aluno</th><th>Escola</th><th>Data</th><th>Resultado</th><th>Observação</th></tr></thead><tbody id="m5-conflitos"></tbody></table></div>
      </article>`;
    host.appendChild(painel);

    document.getElementById('m5-preverificar').addEventListener('click', executarPreVerificacao);
    document.getElementById('m5-exportar').addEventListener('click', exportarDiagnostico);

    const input = document.getElementById('mig-arquivo');
    input?.addEventListener('change', async () => {
      ultimoArquivo = input.files?.[0] || null;
      hashArquivo = '';
      if (ultimoArquivo) {
        status('Calculando hash SHA-256 da planilha...', 'carregando');
        try {
          hashArquivo = await sha256(ultimoArquivo);
          status('Arquivo identificado. Conclua a M4 e execute a pré-verificação.', 'ok');
        } catch (e) {
          console.error('[SIGEE M5] Hash', e);
          status('Não foi possível calcular o hash do arquivo.', 'erro');
        }
      }
    });
  }

  async function lerProcessosAtuais(client, nte) {
    const campos = 'id,aluno_nome,escola_nome,escola_id,cod_mec,nte,created_at,data_etapa_atual,codigo_sigee,workflow_instance_id';
    const { data, error } = await client.from('processos').select(campos).in('nte', [`NTE ${Number(nte)}`, `NTE-${nte}`, `NTE ${nte}`, nte]);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  async function verificarColuna(client, coluna) {
    const { error } = await client.from('processos').select(coluna).limit(1);
    return { existe: !error, erro: error?.message || '' };
  }

  function chaveSemData(p) {
    return [normalizar(p.aluno_nome), normalizar(p.escola_nome || p.escola_nome_original)].join('|');
  }

  function classificarConflitos(lote, atuais) {
    const porAlunoEscola = new Map();
    atuais.forEach(a => {
      const k = chaveSemData(a);
      if (!porAlunoEscola.has(k)) porAlunoEscola.set(k, []);
      porAlunoEscola.get(k).push(a);
    });
    return lote.map(p => {
      const similares = porAlunoEscola.get(chaveSemData(p)) || [];
      if (!similares.length) return { processo:p, resultado:'NOVO', observacao:'Nenhum processo atual com o mesmo aluno e escola no NTE.' };
      return {
        processo:p,
        resultado:'REVISAR',
        observacao:`${similares.length} registro(s) atual(is) semelhante(s): ${similares.map(x=>x.codigo_sigee || ('ID '+x.id)).join(', ')}`
      };
    });
  }

  async function executarPreVerificacao() {
    if (!perfilMaster()) return status('A pré-importação é exclusiva do perfil Master.', 'erro');
    const r = resultadoM4();
    if (!r) return status('Primeiro processe e homologue a planilha na M4.', 'erro');
    if (!r.validacao_final?.executada || r.validacao_final.qualidade_percentual !== 100) return status('A Validação Final da M4 precisa atingir 100%.', 'erro');

    const nteTela = numeroNte(document.getElementById('mig-nte')?.value);
    const nteLote = numeroNte(r.nte_selecionado || r.processos?.[0]?.nte_origem || '');
    const nte = nteTela || nteLote;
    if (!nte) return status('Selecione explicitamente o NTE do lote.', 'erro');
    if (nteTela && nteLote && nteTela !== nteLote) return status(`Divergência territorial: tela NTE-${nteTela} e lote NTE-${nteLote}.`, 'erro');

    const client = clienteSupabase();
    if (!client) return status('Cliente Supabase do SIGEE não foi localizado.', 'erro');

    status('Consultando a base atual do Supabase em modo somente leitura...', 'carregando');
    try {
      const [atuais, colMigration, colMigrado, colLote] = await Promise.all([
        lerProcessosAtuais(client, nte),
        verificarColuna(client, 'migration_key'),
        verificarColuna(client, 'processo_migrado'),
        verificarColuna(client, 'migracao_lote_id')
      ]);

      const lote = r.processos || [];
      const conflitos = classificarConflitos(lote, atuais);
      const novos = conflitos.filter(x => x.resultado === 'NOVO').length;
      const revisar = conflitos.length - novos;
      const hashOk = !!hashArquivo;
      const checks = [
        ['Perfil Master confirmado', true, window.usuarioLogado?.nome || 'Master'],
        ['Homologação M4 concluída', r.validacao_final.qualidade_percentual === 100, r.validacao_final.qualidade_percentual + '%'],
        ['NTE do lote confirmado', !!nte, 'NTE-' + nte],
        ['Todos os processos aptos', lote.every(p => p.status_validacao === 'PRONTO'), `${lote.filter(p=>p.status_validacao==='PRONTO').length}/${lote.length}`],
        ['Hash SHA-256 calculado', hashOk, hashOk ? hashArquivo.slice(0,16) + '…' : 'Recarregue a planilha'],
        ['Supabase acessível', true, `${atuais.length} processos atuais lidos no NTE`],
        ['Coluna migration_key', colMigration.existe, colMigration.existe ? 'Disponível' : 'Pendente na M5.1'],
        ['Coluna processo_migrado', colMigrado.existe, colMigrado.existe ? 'Disponível' : 'Pendente na M5.1'],
        ['Coluna migracao_lote_id', colLote.existe, colLote.existe ? 'Disponível' : 'Pendente na M5.1'],
        ['Sem semelhanças para revisão', revisar === 0, revisar ? `${revisar} caso(s) para auditoria` : 'Nenhum conflito aparente']
      ];
      const estruturaPronta = colMigration.existe && colMigrado.existe && colLote.existe;
      const autorizadoM51 = checks.slice(0,6).every(x=>x[1]) && revisar === 0;

      ultimoDiagnostico = {
        versao: VERSION,
        executado_em: new Date().toISOString(),
        modo: 'SOMENTE_LEITURA',
        nte: 'NTE-' + nte,
        arquivo: r.arquivo,
        hash_sha256: hashArquivo,
        qualidade_m4: r.validacao_final.qualidade_percentual,
        processos_lote: lote.length,
        processos_atuais_nte: atuais.length,
        novos_aparentes: novos,
        revisar,
        estrutura_m51_pronta: estruturaPronta,
        autorizado_para_instalar_m51: autorizadoM51,
        checks: checks.map(([nome,ok,detalhe])=>({nome,ok,detalhe})),
        conflitos: conflitos.map(x=>({migration_key:x.processo.migration_key, aluno:x.processo.aluno_nome, escola:x.processo.escola_nome_original, data:x.processo.data_solicitacao, resultado:x.resultado, observacao:x.observacao}))
      };

      renderizar(checks, conflitos, ultimoDiagnostico);
      document.getElementById('m5-exportar').disabled = false;
      status(autorizadoM51 ? 'Pré-verificação concluída. Lote apto para preparação da camada transacional M5.1.' : 'Pré-verificação concluída com itens para revisão.', autorizadoM51 ? 'ok' : 'atencao');
    } catch (e) {
      console.error('[SIGEE M5 Pré-importação]', e);
      status('Falha na pré-verificação: ' + (e.message || e), 'erro');
    }
  }

  function renderizar(checks, conflitos, d) {
    const resumo = document.getElementById('m5-resumo');
    resumo.classList.remove('hidden');
    resumo.innerHTML = `
      <article><span>Lote</span><strong>${html(d.nte)}</strong></article>
      <article><span>Processos homologados</span><strong>${d.processos_lote}</strong></article>
      <article><span>Novos aparentes</span><strong>${d.novos_aparentes}</strong></article>
      <article><span>Revisar</span><strong>${d.revisar}</strong></article>
      <article><span>Qualidade M4</span><strong>${d.qualidade_m4}%</strong></article>
      <article><span>Modo</span><strong>LEITURA</strong></article>`;

    const box = document.getElementById('m5-checks-box');
    box.classList.remove('hidden');
    document.getElementById('m5-checks').innerHTML = checks.map(([nome,ok,detalhe]) => `
      <div class="m5-check ${ok?'ok':'pendente'}"><i>${ok?'✓':'!'}</i><div><strong>${html(nome)}</strong><span>${html(detalhe)}</span></div></div>`).join('');
    const auth = document.getElementById('m5-autorizacao');
    auth.textContent = d.autorizado_para_instalar_m51 ? 'M5.1 AUTORIZADA' : 'REVISÃO NECESSÁRIA';
    auth.className = d.autorizado_para_instalar_m51 ? 'ok' : 'pendente';

    const cbox = document.getElementById('m5-conflitos-box');
    cbox.classList.remove('hidden');
    document.getElementById('m5-conflitos-resumo').textContent = `${d.novos_aparentes} novos • ${d.revisar} revisar`;
    document.getElementById('m5-conflitos').innerHTML = conflitos.map(x => `
      <tr><td>${html(x.processo.aluno_nome)}</td><td>${html(x.processo.escola_nome_original)}</td><td>${html(x.processo.data_solicitacao)}</td><td><span class="m5-badge ${x.resultado==='NOVO'?'novo':'revisar'}">${html(x.resultado)}</span></td><td>${html(x.observacao)}</td></tr>`).join('');
  }

  function exportarDiagnostico() {
    if (!ultimoDiagnostico) return;
    const blob = new Blob([JSON.stringify(ultimoDiagnostico, null, 2)], {type:'application/json;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sigee_m5_preverificacao_${ultimoDiagnostico.nte.replace('-','_')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function iniciar() {
    garantirPainel();
    setTimeout(garantirPainel, 800);
    setInterval(garantirPainel, 4000);
  }

  window.SIGEE_IMPORTACAO_OFICIAL = {
    versao: VERSION,
    executarPreVerificacao,
    diagnostico: () => ultimoDiagnostico
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
