/* SIGEE Enterprise — M5.3.0 | Centro de Auditoria + Preflight Transacional
   Uso exclusivo Master. Consulta a base e valida a infraestrutura SQL.
   NÃO insere, atualiza, sobrescreve ou exclui processos. */
(function () {
  'use strict';

  const VERSION = 'M5.3.0';
  let hashArquivo = '';
  let ultimoArquivo = null;
  let ultimoDiagnostico = null;
  let ultimoPreflightBanco = null;

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

  function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
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
          <h2>Centro de Auditoria e Preparação</h2>
          <p>Diagnóstico do lote e preflight transacional no Supabase, sem gravação operacional.</p>
        </div>
        <strong>🧭 M5.3</strong>
      </header>
      <div class="m5-alerta">A M5.3 consolida auditoria, decisões do Master, preflight e preparação da importação. As correções afetam somente o lote em memória e preservam a planilha original.</div>
      <div class="m5-acoes">
        <button id="m5-preverificar" type="button">🛡️ Pré-verificação local</button>
        <button id="m5-preflight-banco" type="button" disabled>🧪 Validar infraestrutura e lote</button>
        <button id="m5-exportar" type="button" disabled>📄 Exportar diagnóstico</button>
        <button id="m5-importar" type="button" disabled title="A importação definitiva é executada no painel controlado abaixo">🔒 Importar definitivamente</button>
      </div>
      <div id="m5-status" class="m5-status">Aguardando homologação M4 com qualidade de 100%.</div>
      <div id="m5-resumo" class="m5-resumo hidden"></div>
      <article id="m5-checks-box" class="m5-checks-box hidden">
        <header><h3>Checklist de autorização</h3><span id="m5-autorizacao">NÃO EXECUTADO</span></header>
        <div id="m5-checks" class="m5-checks"></div>
      </article>
      <article id="m5-preflight-box" class="m5-preflight-box hidden">
        <header><h3>Preflight transacional do Supabase — M5.3</h3><span id="m5-preflight-status">NÃO EXECUTADO</span></header>
        <div id="m5-preflight-conteudo" class="m5-preflight-conteudo"></div>
      </article>
      <article id="m5-conflitos-box" class="m5-conflitos-box hidden">
        <header><h3>Conferência contra processos atuais</h3><span id="m5-conflitos-resumo"></span></header>
        <div class="m5-tabela-wrap"><table><thead><tr><th>Aluno</th><th>Escola</th><th>Data</th><th>Resultado</th><th>Observação</th></tr></thead><tbody id="m5-conflitos"></tbody></table></div>
      </article>`;
    host.appendChild(painel);

    document.getElementById('m5-preverificar').addEventListener('click', executarPreVerificacao);
    document.getElementById('m5-preflight-banco').addEventListener('click', executarPreflightBanco);
    document.getElementById('m5-exportar').addEventListener('click', exportarDiagnostico);

    const input = document.getElementById('mig-arquivo');
    input?.addEventListener('change', async () => {
      ultimoArquivo = input.files?.[0] || null;
      hashArquivo = '';
      ultimoDiagnostico = null;
      ultimoPreflightBanco = null;
      document.getElementById('m5-preflight-banco').disabled = true;
      if (ultimoArquivo) {
        status('Calculando hash SHA-256 da planilha...', 'carregando');
        try {
          hashArquivo = await sha256(ultimoArquivo);
          status('Arquivo identificado. Conclua a M4 e execute a pré-verificação.', 'ok');
        } catch (e) {
          console.error('[SIGEE M5.1] Hash', e);
          status('Não foi possível calcular o hash do arquivo.', 'erro');
        }
      }
    });
  }

  async function lerProcessosAtuais(client, nte) {
    const campos = 'id,aluno_nome,escola_nome,escola_id,cod_mec,nte,created_at,data_etapa_atual,codigo_sigee,workflow_instance_id,migration_key,processo_migrado,migracao_lote_id';
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
    const porMigrationKey = new Map(atuais.filter(a => texto(a.migration_key)).map(a => [texto(a.migration_key), a]));
    const porAlunoEscola = new Map();
    atuais.forEach(a => {
      const k = chaveSemData(a);
      if (!porAlunoEscola.has(k)) porAlunoEscola.set(k, []);
      porAlunoEscola.get(k).push(a);
    });
    return lote.map(p => {
      const exato = porMigrationKey.get(texto(p.migration_key));
      if (exato) return { processo:p, resultado:'DUPLICADO', observacao:`migration_key já incorporada em ${exato.codigo_sigee || ('ID ' + exato.id)}.` };
      const similares = porAlunoEscola.get(chaveSemData(p)) || [];
      if (!similares.length) return { processo:p, resultado:'NOVO', observacao:'Nenhum processo atual com o mesmo aluno e escola no NTE.' };
      return { processo:p, resultado:'REVISAR', observacao:`${similares.length} registro(s) atual(is) semelhante(s): ${similares.map(x=>x.codigo_sigee || ('ID '+x.id)).join(', ')}` };
    });
  }

  function prepararPayloadBanco(r, nte) {
    return {
      versao: VERSION,
      nte: `NTE-${nte}`,
      arquivo: r.arquivo || ultimoArquivo?.name || '',
      hash_sha256: hashArquivo,
      qualidade_m4: r.validacao_final?.qualidade_percentual || 0,
      executor: {
        nome: window.usuarioLogado?.nome || 'Master',
        email: window.usuarioLogado?.email || '',
        perfil: window.usuarioLogado?.perfil || ''
      },
      processos: (r.processos || []).filter(p => p.status_validacao === 'PRONTO' && !p.ignorar_migracao).map(p => ({
        migration_key: p.migration_key,
        aluno_nome: p.aluno_nome,
        escola_nome: p.escola_nome_original || p.escola_nome,
        escola_id: p.escola_id,
        nte: `NTE ${Number(nte)}`,
        data_solicitacao: p.data_solicitacao,
        etapa_atual: p.etapa_atual,
        workflow_instance_id: p.workflow_instance_id || uuid(),
        auditoria_migracao: p.auditoria_m53 || [],
        decisao_master: p.decisao_m53 || 'IMPORTAR',
        eventos: (p.eventos_validos || []).map(e => ({
          etapa: e.etapa || '',
          evento: e.evento || '',
          data: e.data || '',
          tipo_data: e.tipo_data || 'REAL',
          responsavel: e.responsavel || '',
          status: e.status || '',
          aba: e.aba || ''
        }))
      }))
    };
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
      const [atuais, colMigration, colMigrado, colLote, colOrigem] = await Promise.all([
        lerProcessosAtuais(client, nte),
        verificarColuna(client, 'migration_key'),
        verificarColuna(client, 'processo_migrado'),
        verificarColuna(client, 'migracao_lote_id'),
        verificarColuna(client, 'origem_registro')
      ]);

      const lote = r.processos || [];
      const conflitos = classificarConflitos(lote, atuais);
      const novos = conflitos.filter(x => x.resultado === 'NOVO').length;
      const revisar = conflitos.filter(x => x.resultado === 'REVISAR').length;
      const duplicados = conflitos.filter(x => x.resultado === 'DUPLICADO').length;
      const hashOk = !!hashArquivo;
      const checks = [
        ['Perfil Master confirmado', true, window.usuarioLogado?.nome || 'Master'],
        ['Homologação M4 concluída', r.validacao_final.qualidade_percentual === 100, r.validacao_final.qualidade_percentual + '%'],
        ['NTE do lote confirmado', !!nte, 'NTE-' + nte],
        ['Todos os processos aptos', lote.every(p => p.status_validacao === 'PRONTO'), `${lote.filter(p=>p.status_validacao==='PRONTO').length}/${lote.length}`],
        ['Hash SHA-256 calculado', hashOk, hashOk ? hashArquivo.slice(0,16) + '…' : 'Recarregue a planilha'],
        ['Supabase acessível', true, `${atuais.length} processos atuais lidos no NTE`],
        ['Coluna migration_key', colMigration.existe, colMigration.existe ? 'Disponível' : 'Execute o SQL M5.1'],
        ['Coluna processo_migrado', colMigrado.existe, colMigrado.existe ? 'Disponível' : 'Execute o SQL M5.1'],
        ['Coluna migracao_lote_id', colLote.existe, colLote.existe ? 'Disponível' : 'Execute o SQL M5.1'],
        ['Coluna origem_registro', colOrigem.existe, colOrigem.existe ? 'Disponível' : 'Execute o SQL M5.1'],
        ['Sem duplicidades exatas', duplicados === 0, duplicados ? `${duplicados} já incorporado(s)` : 'Nenhuma migration_key repetida'],
        ['Sem semelhanças para revisão', revisar === 0, revisar ? `${revisar} caso(s) para auditoria` : 'Nenhum conflito aparente']
      ];
      const estruturaPronta = colMigration.existe && colMigrado.existe && colLote.existe && colOrigem.existe;
      const autorizadoPreflightBanco = checks.every(x => x[1]);

      ultimoDiagnostico = {
        versao: VERSION,
        executado_em: new Date().toISOString(),
        modo: 'PREPARACAO_SEM_GRAVACAO_OPERACIONAL',
        nte: 'NTE-' + nte,
        arquivo: r.arquivo,
        hash_sha256: hashArquivo,
        qualidade_m4: r.validacao_final.qualidade_percentual,
        processos_lote: lote.length,
        processos_atuais_nte: atuais.length,
        novos_aparentes: novos,
        revisar,
        duplicados,
        estrutura_m51_pronta: estruturaPronta,
        autorizado_preflight_banco: autorizadoPreflightBanco,
        checks: checks.map(([nome,ok,detalhe])=>({nome,ok,detalhe})),
        conflitos: conflitos.map(x=>({migration_key:x.processo.migration_key, aluno:x.processo.aluno_nome, escola:x.processo.escola_nome_original, data:x.processo.data_solicitacao, resultado:x.resultado, observacao:x.observacao}))
      };

      renderizar(checks, conflitos, ultimoDiagnostico);
      document.getElementById('m5-exportar').disabled = false;
      document.getElementById('m5-preflight-banco').disabled = !autorizadoPreflightBanco;
      status(autorizadoPreflightBanco ? 'Pré-verificação aprovada. Execute agora o preflight transacional M5.1.' : 'Pré-verificação concluída com itens pendentes.', autorizadoPreflightBanco ? 'ok' : 'atencao');
    } catch (e) {
      console.error('[SIGEE M5.1 Pré-importação]', e);
      status('Falha na pré-verificação: ' + (e.message || e), 'erro');
    }
  }

  async function executarPreflightBanco() {
    if (!ultimoDiagnostico?.autorizado_preflight_banco) return status('Conclua primeiro a pré-verificação local sem pendências.', 'erro');
    const r = resultadoM4();
    const nte = numeroNte(ultimoDiagnostico.nte);
    const motor = window.SIGEE_MOTOR_PERSISTENCIA;
    if (!motor?.preflight) return status('Motor de Persistência M5.3 não carregado.', 'erro');

    status('Executando preflight transacional no Supabase...', 'carregando');
    try {
      const payload = prepararPayloadBanco(r, nte);
      ultimoPreflightBanco = await motor.preflight(payload);
      ultimoDiagnostico.preflight_banco = ultimoPreflightBanco;
      renderizarPreflight(ultimoPreflightBanco);
      document.getElementById('m5-exportar').disabled = false;
      const ok = ultimoPreflightBanco.autorizado === true;
      status(ok ? 'Infraestrutura e lote validados. A importação controlada pode ser preparada.' : 'Preflight do banco encontrou bloqueios. Nenhuma gravação foi executada.', ok ? 'ok' : 'atencao');
    } catch (e) {
      console.error('[SIGEE M5.1 Preflight banco]', e);
      renderizarPreflight({ autorizado:false, erro:e.message || String(e) });
      status('Falha no preflight M5.3: ' + (e.message || e), 'erro');
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
      <article><span>Duplicados</span><strong>${d.duplicados}</strong></article>
      <article><span>Qualidade M4</span><strong>${d.qualidade_m4}%</strong></article>`;

    const box = document.getElementById('m5-checks-box');
    box.classList.remove('hidden');
    document.getElementById('m5-checks').innerHTML = checks.map(([nome,ok,detalhe]) => `
      <div class="m5-check ${ok?'ok':'pendente'}"><i>${ok?'✓':'!'}</i><div><strong>${html(nome)}</strong><span>${html(detalhe)}</span></div></div>`).join('');
    const auth = document.getElementById('m5-autorizacao');
    auth.textContent = d.autorizado_preflight_banco ? 'PREFLIGHT LIBERADO' : 'REVISÃO NECESSÁRIA';
    auth.className = d.autorizado_preflight_banco ? 'ok' : 'pendente';

    const cbox = document.getElementById('m5-conflitos-box');
    cbox.classList.remove('hidden');
    document.getElementById('m5-conflitos-resumo').textContent = `${d.novos_aparentes} novos • ${d.revisar} revisar • ${d.duplicados} duplicados`;
    document.getElementById('m5-conflitos').innerHTML = conflitos.map(x => `
      <tr><td>${html(x.processo.aluno_nome)}</td><td>${html(x.processo.escola_nome_original)}</td><td>${html(x.processo.data_solicitacao)}</td><td><span class="m5-badge ${x.resultado.toLowerCase()}">${html(x.resultado)}</span></td><td>${html(x.observacao)}</td></tr>`).join('');
  }

  function renderizarPreflight(d) {
    const box = document.getElementById('m5-preflight-box');
    box.classList.remove('hidden');
    const badge = document.getElementById('m5-preflight-status');
    const ok = d?.autorizado === true;
    badge.textContent = ok ? 'APROVADO' : 'BLOQUEADO';
    badge.className = ok ? 'ok' : 'pendente';
    const itens = [
      ['Infraestrutura SQL', d?.infraestrutura_ok, d?.infraestrutura_ok ? 'Tabelas, colunas e RPC disponíveis' : (d?.erro || 'Não validada')],
      ['Hash já utilizado', !d?.hash_ja_utilizado, d?.hash_ja_utilizado ? 'Lote já registrado' : 'Hash inédito'],
      ['NTE já concluído', !d?.nte_ja_migrado, d?.nte_ja_migrado ? 'Território já marcado como migrado' : 'Território disponível'],
      ['Chaves duplicadas no lote', Number(d?.duplicadas_no_lote || 0) === 0, `${d?.duplicadas_no_lote || 0} ocorrência(s)`],
      ['Chaves já existentes no SIGEE', Number(d?.ja_existentes || 0) === 0, `${d?.ja_existentes || 0} ocorrência(s)`],
      ['Processos preparados', Number(d?.processos_recebidos || 0) > 0, `${d?.processos_recebidos || 0} processo(s)`]
    ];
    document.getElementById('m5-preflight-conteudo').innerHTML = `
      <div class="m5-preflight-grade">${itens.map(([nome,valido,detalhe]) => `<div class="m5-check ${valido?'ok':'pendente'}"><i>${valido?'✓':'!'}</i><div><strong>${html(nome)}</strong><span>${html(detalhe)}</span></div></div>`).join('')}</div>
      <div class="m5-preflight-nota ${ok?'ok':'pendente'}">${ok ? 'A M5.3 confirmou que a base e o lote estão preparados. Nenhum processo foi gravado nesta etapa.' : html(d?.mensagem || d?.erro || 'A importação permanece bloqueada.')}</div>`;
  }

  function exportarDiagnostico() {
    if (!ultimoDiagnostico) return;
    const blob = new Blob([JSON.stringify(ultimoDiagnostico, null, 2)], {type:'application/json;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sigee_m5_3_auditoria_preflight_${ultimoDiagnostico.nte.replace('-','_')}.json`;
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
    executarPreflightBanco,
    diagnostico: () => ultimoDiagnostico,
    preflightBanco: () => ultimoPreflightBanco
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
