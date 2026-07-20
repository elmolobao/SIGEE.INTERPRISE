/* SIGEE Enterprise — Migração Histórica M2
   Validação cronológica, normalização, conferência com o SIGEE e simulação.
   NÃO grava no Supabase. */
(function () {
  'use strict';

  const VERSION = 'M4.2.0';
  const LIMITE_FUTURO_DIAS = 1;
  const DATA_PADRAO_ANO = 2000;

  const OPERACIONAIS = {
    '00 - DESARQUIVAR': { tipo: 'origem', etapa: 'Desarquivamento' },
    '01 - IMPRESSÃO': { tipo: 'evento', etapa: 'Documento Recebido' },
    '02 - ANÁLISE': { tipo: 'etapa', etapa: 'Análise' },
    '03 - PENDÊNCIA': { tipo: 'etapa', etapa: 'Pendência' },
    '04- DIGITAÇÃO': { tipo: 'etapa', etapa: 'Digitação' },
    '05 - CONFERENCIA': { tipo: 'etapa', etapa: 'Conferência' },
    '06 - ASSINATURA': { tipo: 'etapa', etapa: 'Assinatura' },
    '07 - DEFERIDO': { tipo: 'fechamento', etapa: 'Aguardando Retirada / Retirado' }
  };

  const IGNORADAS = ['CONSULTA PROCESSO', 'CONSULTA ACERVO', 'ACERVO', 'DADOS'];
  const ORDEM_ETAPAS = {
    'Desarquivamento': 10,
    'Análise': 20,
    'Pendência': 30,
    'Digitação': 40,
    'Conferência': 50,
    'Assinatura': 60,
    'Aguardando Retirada': 70,
    'Retirado': 80,
    'Indeferido': 80
  };

  let resultadoAtual = null;
  let escolasMestres = [];
  let usuariosMestres = [];
  let ntesMestres = [];
  let dadosMestresCarregados = false;

  function texto(v) { return v == null ? '' : String(v).trim(); }
  function normalizar(v) {
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/\s+/g, ' ').trim();
  }
  function nomeProprio(v) {
    const s = texto(v).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
    if (!s) return '';
    return s.split(' ').map(p => {
      if (['da','de','do','das','dos','e'].includes(p)) return p;
      return p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1);
    }).join(' ');
  }
  function perfilAtual() {
    const p = normalizar(window.usuarioLogado && window.usuarioLogado.perfil);
    return p.includes('MASTER') ? 'MASTER' : p;
  }
  function excelData(v) {
    if (v == null || v === '') return null;
    let d = null;
    if (v instanceof Date && !isNaN(v)) d = new Date(v.getTime());
    else if (typeof v === 'number') {
      d = new Date(Date.UTC(1899, 11, 30));
      d.setUTCDate(d.getUTCDate() + Math.floor(v));
    } else {
      const s = texto(v);
      const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      d = br ? new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1])) : new Date(s);
    }
    if (!d || isNaN(d)) return null;
    return d;
  }
  function iso(d) { return d && !isNaN(d) ? d.toISOString().slice(0, 10) : ''; }
  function tipoData(d) {
    return d && d.getFullYear() === DATA_PADRAO_ANO ? 'FICTICIA' : 'REAL';
  }
  function chave(nome, escola, data) {
    return [normalizar(nome), normalizar(escola), iso(data)].join('|');
  }
  function html(v) {
    return texto(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  }
  function dataFutura(d) {
    if (!d) return false;
    return d.getTime() > Date.now() + LIMITE_FUTURO_DIAS * 86400000;
  }
  function dataValidaCronologia(d) {
    return !!d && !isNaN(d) && d.getFullYear() !== DATA_PADRAO_ANO && !dataFutura(d);
  }
  function listaEscolas() {
    if (escolasMestres.length) return escolasMestres;
    const candidatos = [window.escolas, window.escolasSIGEE, window.listaEscolas, window.catalogoEscolas, window.dadosEscolas];
    return candidatos.find(Array.isArray) || [];
  }
  function listaUsuarios() {
    if (usuariosMestres.length) return usuariosMestres;
    const candidatos = [window.usuarios, window.usuariosSIGEE, window.listaUsuarios, window.usuariosSistema, window.dadosUsuarios];
    return candidatos.find(Array.isArray) || [];
  }
  function clienteSupabase() {
    const candidatos = [window.supabaseClient, window.supaClient, window.sb, window.SUPABASE_CLIENT];
    return candidatos.find(c => c && typeof c.from === 'function') || null;
  }
  async function buscarTabelaPaginada(tabela, campos) {
    const client = clienteSupabase();
    if (!client) throw new Error('Cliente Supabase do SIGEE não foi localizado.');
    const lote = 1000;
    const dados = [];
    for (let inicio = 0; ; inicio += lote) {
      const fim = inicio + lote - 1;
      const { data, error } = await client.from(tabela).select(campos || '*').range(inicio, fim);
      if (error) throw error;
      const parte = Array.isArray(data) ? data : [];
      dados.push(...parte);
      if (parte.length < lote) break;
    }
    return dados;
  }
  function numeroNte(v) {
    const m = texto(v).match(/(?:NTE\s*[-–]?\s*)?(\d{1,2})/i);
    return m ? String(Number(m[1])).padStart(2, '0') : '';
  }
  function nteSelecionado() {
    return numeroNte(document.getElementById('mig-nte')?.value || '');
  }
  function atualizarDadosMestresUI(tipo, mensagem) {
    const el = document.getElementById('mig-dados-mestres');
    if (!el) return;
    el.className = 'mig-dados-mestres ' + (tipo || '');
    el.textContent = mensagem;
  }
  async function carregarDadosMestres(forcar) {
    if (dadosMestresCarregados && !forcar) return;
    atualizarDadosMestresUI('carregando', '⏳ Carregando catálogo de escolas, NTEs e usuários atuais...');
    const client = clienteSupabase();
    if (!client) {
      escolasMestres = listaEscolas();
      usuariosMestres = listaUsuarios();
      if (!escolasMestres.length) throw new Error('O catálogo não está disponível na memória e o cliente Supabase não foi localizado.');
      dadosMestresCarregados = true;
      atualizarDadosMestresUI('ok', `✔ Dados atuais disponíveis: ${escolasMestres.length} escolas e ${usuariosMestres.length} usuários.`);
      return;
    }
    const [ntes, escolas, usuarios] = await Promise.all([
      buscarTabelaPaginada('ntes_sigee', '*'),
      buscarTabelaPaginada('escolas_sigee', 'id,cod_mec,nome_escola,nte_id,municipio,ativo'),
      buscarTabelaPaginada('usuarios_sigee', '*')
    ]);
    ntesMestres = ntes;
    const mapaNte = new Map();
    ntes.forEach(n => {
      const id = texto(campo(n, ['id']));
      const numero = numeroNte(campo(n, ['numero','nte','nome','codigo','sigla']));
      if (id && numero) mapaNte.set(id, numero);
    });
    escolasMestres = escolas.map(e => ({ ...e, _nte_numero: mapaNte.get(texto(e.nte_id)) || numeroNte(campo(e,['nte','nte_nome'])) }));
    usuariosMestres = usuarios.map(u => ({ ...u, _nte_numero: mapaNte.get(texto(campo(u,['nte_id']))) || numeroNte(campo(u,['nte','nte_nome'])) }));
    dadosMestresCarregados = true;
    atualizarDadosMestresUI('ok', `✔ Base atual carregada: ${escolasMestres.length} escolas, ${usuariosMestres.length} usuários e ${ntesMestres.length} NTEs.`);
  }
  function campo(obj, nomes) {
    for (const n of nomes) if (obj && obj[n] != null && texto(obj[n])) return obj[n];
    return '';
  }

  function campoFlexivel(obj, nomes) {
    if (!obj) return '';
    const chaves = Object.keys(obj);
    for (const nome of nomes) {
      const alvo = normalizar(nome);
      const chave = chaves.find(k => normalizar(k) === alvo);
      if (chave && obj[chave] != null && texto(obj[chave])) return obj[chave];
    }
    return '';
  }

  function detalhesPendencia(registro) {
    return texto(campoFlexivel(registro, [
      'PENDÊNCIA','PENDENCIA','DETALHAMENTO','DESCRIÇÃO','DESCRICAO',
      'OBSERVAÇÃO','OBSERVACAO','MOTIVO','ASSUNTO','INFORMAÇÃO','INFORMACAO'
    ]));
  }

  function dataAberturaPendencia(registro) {
    return campoFlexivel(registro, [
      'DATA ENVIO','DATA DE ENVIO','Data de Envio','ENVIO PENDÊNCIA',
      'ENVIO PENDENCIA','DATA DA PENDÊNCIA','DATA DA PENDENCIA','DATA'
    ]);
  }

  function dataRecebimentoPendencia(registro) {
    return campoFlexivel(registro, [
      'DATA RECEBIMENTO','DATA DE RECEBIMENTO','Data de Recebimento',
      'DATA RETORNO','DATA DE RETORNO','Data de Retorno','RETORNO'
    ]);
  }
  function nteDoRegistro(obj) {
    return numeroNte(campo(obj, ['_nte_numero','nte','nte_nome','numero_nte','codigo_nte','nte_id']));
  }
  function localizarEscola(codigoMec, nome, nte) {
    const nteAlvo = numeroNte(nte) || nteSelecionado();
    const escolas = listaEscolas().filter(e => !nteAlvo || nteDoRegistro(e) === nteAlvo);
    const mec = normalizar(codigoMec).replace(/\D/g, '');
    const nomeAlvo = normalizar(nome);
    let achou = escolas.find(e => mec && normalizar(campo(e,['cod_mec','codigo_mec','mec'])).replace(/\D/g,'') === mec);
    if (!achou) achou = escolas.find(e => normalizar(campo(e,['nome_escola','nome','escola_nome'])) === nomeAlvo);
    return achou || null;
  }
  function localizarUsuario(nome, nte) {
    if (!texto(nome)) return null;
    const nteAlvo = numeroNte(nte) || nteSelecionado();
    return listaUsuarios().find(u =>
      normalizar(campo(u,['nome','nome_completo','display_name'])) === normalizar(nome) &&
      (!nteAlvo || nteDoRegistro(u) === nteAlvo)
    ) || null;
  }

  function garantirTela() {
    const main = document.querySelector('#sistema-dashboard main');
    if (!main || document.getElementById('aba-migracao-historica')) return;

    const sec = document.createElement('section');
    sec.id = 'aba-migracao-historica';
    sec.className = 'hidden sigee-migracao';
    sec.innerHTML = `
      <header class="mig-topo">
        <div>
          <span>SIGEE ENTERPRISE</span>
          <h1>Migração Histórica dos NTEs</h1>
          <p>Leitura, validação cronológica, conferência cadastral e simulação segura.</p>
        </div>
        <div class="mig-seguranca">🔒 Exclusivo Master</div>
      </header>

      <div class="mig-aviso">
        Modo simulação: nenhum processo será gravado no Supabase.
      </div>

      <div class="mig-card">
        <label class="mig-upload">
          <strong>Selecionar planilha do NTE</strong>
          <span>Formato .xlsx ou .xls</span>
          <input id="mig-arquivo" type="file" accept=".xlsx,.xls">
        </label>
        <label class="mig-nte-seletor">
          <strong>NTE da planilha</strong>
          <span>Direciona a validação para o catálogo territorial correto.</span>
          <select id="mig-nte" required>
            <option value="">Selecione o NTE</option>
            ${Array.from({length:27},(_,i)=>String(i+1).padStart(2,'0')).map(n=>`<option value="${n}">NTE-${n}</option>`).join('')}
          </select>
        </label>
        <div class="mig-acoes">
          <button id="mig-analisar" type="button">🔎 Ler e validar</button>
          <button id="mig-simular" type="button" disabled>🧪 Simular migração</button>
          <button id="mig-validar-final" type="button" disabled>✅ Validação final</button>
          <button id="mig-exportar" type="button" disabled>📤 Exportar lote JSON</button>
        </div>
      </div>

      <div id="mig-dados-mestres" class="mig-dados-mestres">Base cadastral ainda não carregada.</div>
      <div id="mig-status" class="mig-status">Aguardando seleção do arquivo.</div>

      <div id="mig-kpis" class="mig-kpis mig-kpis-6 hidden">
        <article><span>Processos</span><strong id="mig-kpi-processos">0</strong></article>
        <article><span>Prontos</span><strong id="mig-kpi-prontos">0</strong></article>
        <article><span>Pendentes</span><strong id="mig-kpi-pendentes">0</strong></article>
        <article><span>Eventos válidos</span><strong id="mig-kpi-eventos">0</strong></article>
        <article><span>Escolas localizadas</span><strong id="mig-kpi-escolas">0</strong></article>
        <article><span>Técnicos atuais vinculados</span><strong id="mig-kpi-tecnicos">0</strong></article>
        <article><span>Datas reais</span><strong id="mig-kpi-datas-reais">0</strong></article>
        <article><span>Datas fictícias</span><strong id="mig-kpi-datas-ficticias">0</strong></article>
      </div>

      <div id="mig-conteudo" class="hidden">
        <div class="mig-grid">
          <article class="mig-painel">
            <header><h2>Abas identificadas</h2></header>
            <div id="mig-abas"></div>
          </article>
          <article class="mig-painel">
            <header><h2>Etapa atual reconstruída</h2></header>
            <div id="mig-etapas"></div>
          </article>
        </div>

        <article id="mig-qualidade-box" class="mig-painel hidden">
          <header class="mig-painel-cab">
            <h2>Qualidade da migração</h2>
            <span id="mig-qualidade-status">Aguardando validação</span>
          </header>
          <div class="mig-qualidade">
            <div class="mig-qualidade-medidor">
              <div class="mig-qualidade-valor" id="mig-qualidade-valor">0%</div>
              <div class="mig-qualidade-barra"><i id="mig-qualidade-barra"></i></div>
            </div>
            <div class="mig-qualidade-itens" id="mig-qualidade-itens"></div>
          </div>
        </article>

        <article class="mig-painel">
          <header class="mig-painel-cab">
            <h2>Prévia dos processos</h2>
            <span id="mig-resumo-validacao"></span>
          </header>
          <div class="mig-tabela-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Escola</th><th>Abertura</th><th>Etapa válida</th><th>Responsável</th><th>Escola SIGEE</th><th>Técnico SIGEE</th><th>Validação</th></tr></thead>
              <tbody id="mig-processos"></tbody>
            </table>
          </div>
        </article>

        <article id="mig-auditoria-tecnica-box" class="mig-painel hidden">
          <header class="mig-painel-cab">
            <div>
              <h2>Auditoria técnica dos processos pendentes</h2>
              <p class="mig-painel-descricao">Diagnóstico consolidado das regras que impedem a homologação, com indicação da origem e da ação recomendada.</p>
            </div>
            <span id="mig-auditoria-tecnica-resumo">0 pendentes</span>
          </header>
          <div class="mig-tabela-wrap mig-auditoria-tecnica-wrap">
            <table>
              <thead><tr><th>Processo / Aluno</th><th>Escola</th><th>Regra</th><th>Motivo do bloqueio</th><th>Origem</th><th>Ação recomendada</th><th>Abrir</th></tr></thead>
              <tbody id="mig-auditoria-tecnica-corpo"></tbody>
            </table>
          </div>
        </article>

        <article id="mig-auditoria-processo-box" class="mig-painel hidden">
          <header class="mig-painel-cab">
            <h2>Auditoria individual do processo</h2>
            <button id="mig-fechar-auditoria" type="button" class="mig-btn-secundario">Fechar</button>
          </header>
          <div id="mig-auditoria-processo"></div>
        </article>

        <article id="mig-simulacao-box" class="mig-painel hidden">
          <header><h2>Resultado da simulação</h2></header>
          <div id="mig-simulacao"></div>
        </article>

        <article class="mig-painel">
          <header><h2>Inconsistências</h2></header>
          <div class="mig-tabela-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Tipo</th><th>Gravidade</th><th>Descrição</th><th>Origem</th></tr></thead>
              <tbody id="mig-inconsistencias"></tbody>
            </table>
          </div>
        </article>
      </div>`;

    main.appendChild(sec);
    const input = sec.querySelector('#mig-arquivo');
    input.addEventListener('change', () => {
      const nome = input.files?.[0]?.name || '';
      const inferido = numeroNte(nome);
      if (inferido) sec.querySelector('#mig-nte').value = inferido;
    });
    sec.querySelector('#mig-analisar').addEventListener('click', async () => {
      if (!input.files || !input.files[0]) return atualizarStatus('Selecione uma planilha antes de continuar.', 'erro');
      if (!nteSelecionado()) return atualizarStatus('Selecione o NTE correspondente à planilha.', 'erro');
      try {
        await carregarDadosMestres(false);
        await analisarArquivo(input.files[0]);
      } catch (e) {
        console.error('[SIGEE Migração M4.1.1]', e);
        atualizarDadosMestresUI('erro', '✖ Falha ao carregar a base atual: ' + (e.message || e));
        atualizarStatus('A validação foi interrompida para evitar correspondências incorretas.', 'erro');
      }
    });
    sec.querySelector('#mig-simular').addEventListener('click', simularMigracao);
    sec.querySelector('#mig-validar-final').addEventListener('click', validarFinal);
    sec.querySelector('#mig-exportar').addEventListener('click', exportarResultado);
    sec.querySelector('#mig-fechar-auditoria').addEventListener('click', () => {
      document.getElementById('mig-auditoria-processo-box')?.classList.add('hidden');
    });
  }

  function garantirMenu() {
    if (perfilAtual() !== 'MASTER') return;
    const nav = document.querySelector('.sigee-sidebar-nav') || document.querySelector('aside nav');
    if (!nav || document.getElementById('menu-migracao-historica')) return;
    const btn = document.createElement('button');
    btn.id = 'menu-migracao-historica';
    btn.className = 'sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
    btn.textContent = '🧬 Migração Histórica';
    btn.addEventListener('click', abrirMigracao);
    nav.appendChild(btn);
  }
  function abrirMigracao() {
    document.querySelectorAll('#sistema-dashboard main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById('aba-migracao-historica')?.classList.remove('hidden');
    document.querySelectorAll('.sigee-menu-item').forEach(b => b.classList.remove('bg-blue-800'));
    document.getElementById('menu-migracao-historica')?.classList.add('bg-blue-800');
    carregarDadosMestres(false).catch(e => {
      console.warn('[SIGEE Migração M4.1.1] Base atual indisponível na abertura:', e);
      atualizarDadosMestresUI('erro', '⚠ Base atual ainda não carregada. Ela será carregada novamente ao iniciar a validação.');
    });
  }
  function atualizarStatus(msg, tipo) {
    const el = document.getElementById('mig-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'mig-status ' + (tipo || '');
  }
  async function analisarArquivo(file) {
    if (!window.XLSX) {
      atualizarStatus('A biblioteca XLSX não está disponível no projeto.', 'erro');
      return;
    }
    atualizarStatus('Lendo, normalizando e validando a planilha...', 'carregando');
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      resultadoAtual = processarWorkbook(wb, file.name);
      renderizar(resultadoAtual);
      atualizarStatus(`Validação M2 concluída: ${resultadoAtual.processos.length} processos, ${resultadoAtual.inconsistencias.length} ocorrências para revisão.`, 'ok');
      document.getElementById('mig-simular').disabled = false;
      document.getElementById('mig-validar-final').disabled = false;
      document.getElementById('mig-exportar').disabled = false;
    } catch (e) {
      console.error('[SIGEE Migração M2]', e);
      atualizarStatus('Falha ao analisar a planilha: ' + (e.message || e), 'erro');
    }
  }
  function sheetJson(wb, name) {
    const ws = wb.Sheets[name];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: null, raw: true })
      .map((registro, indice) => ({ ...registro, __linha_origem: indice + 2 }));
  }

  function processarWorkbook(wb, arquivo) {
    const nomes = wb.SheetNames || [];
    const abas = nomes.map(n => {
      const canon = Object.keys(OPERACIONAIS).find(k => normalizar(k) === normalizar(n));
      const ignorada = IGNORADAS.some(k => normalizar(k) === normalizar(n));
      return {
        nome: n,
        reconhecida: !!canon,
        ignorada,
        classificacao: canon ? OPERACIONAIS[canon] : (ignorada ? {tipo:'ignorada',etapa:'Ignorada'} : {tipo:'desconhecida',etapa:'Revisar'})
      };
    });

    const origemNome = nomes.find(n => normalizar(n) === normalizar('00 - DESARQUIVAR'));
    if (!origemNome) throw new Error('A aba 00 - DESARQUIVAR não foi localizada.');

    const origem = sheetJson(wb, origemNome).filter(r => texto(r.NOME));
    const indices = {};
    nomes.forEach(n => {
      if (!Object.keys(OPERACIONAIS).some(k => normalizar(k) === normalizar(n))) return;
      const map = new Map();
      sheetJson(wb, n).forEach(r => {
        const nome = r.NOME;
        const escola = r['INSTITUIÇÃO'] || r['Instituição'];
        if (!texto(nome)) return;
        const k = [normalizar(nome), normalizar(escola)].join('|');
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      });
      indices[n] = map;
    });

    const processos = [];
    const eventos = [];
    const inconsistencias = [];

    origem.forEach((r, linhaBase) => {
      const nome = texto(r.NOME);
      const escola = texto(r['INSTITUIÇÃO']);
      const abertura = excelData(r['DATA ENVIO']);
      const recebimento = excelData(r['DATA RETORNO']);
      const nte = numeroNte(texto(r['LOCAL ARQUIVO'])) || nteSelecionado();
      const k2 = [normalizar(nome), normalizar(escola)].join('|');

      const get = alvo => {
        const real = nomes.find(n => normalizar(n) === normalizar(alvo));
        return real && indices[real] && (indices[real].get(k2) || [])[0];
      };

      const imp = get('01 - IMPRESSÃO');
      const ana = get('02 - ANÁLISE');
      const pen = get('03 - PENDÊNCIA');
      const dig = get('04- DIGITAÇÃO');
      const con = get('05 - CONFERENCIA');
      const ass = get('06 - ASSINATURA');
      const def = get('07 - DEFERIDO');

      const ev = [];
      const procIssues = [];
      const addIssue = (tipo, gravidade, descricao, origem) => {
        const item = { aluno:nome, tipo, gravidade, descricao, origem };
        procIssues.push(item);
        inconsistencias.push(item);
      };
      const add = (etapa, evento, dataOriginal, resp, status, aba, linhaOrigem) => {
        const data = excelData(dataOriginal);
        if (dataOriginal && !data) {
          addIssue('DATA_INVALIDA', 'Alta', `Data inválida em ${evento}`, aba);
          return;
        }
        if (!data) return;
        const classificacaoData = tipoData(data);
        const futuro = classificacaoData === 'REAL' && dataFutura(data);
        if (futuro) addIssue('DATA_FUTURA', 'Alta', `Data futura ${iso(data)} em ${evento}`, aba);
        const item = {
          etapa, evento, data: iso(data),
          tipo_data: classificacaoData,
          responsavel: nomeProprio(resp),
          status: texto(status), aba,
          linha_origem: linhaOrigem || null,
          valido_cronologia: classificacaoData === 'REAL' && !futuro
        };
        ev.push(item);
        eventos.push({ aluno_nome:nome, escola_nome:escola, ...item });
      };

      add('Desarquivamento','Nova Solicitação',r['DATA ENVIO'],'','',origemNome,r.__linha_origem);
      add('Desarquivamento','Documento Recebido',r['DATA RETORNO'],'',r['SITUAÇÃO'],origemNome,r.__linha_origem);
      if (imp) add('Desarquivamento','Documento Recebido / Triagem',imp['Data de Chegada'] || imp['DATA IMPRESSÃO'],'',imp.STATUS,'01 - IMPRESSÃO',imp.__linha_origem);
      if (ana) {
        add('Análise','Entrada em Análise',ana['ENVIO ANÁLISE'],ana.ANALISTA,ana.STATUS,'02 - ANÁLISE',ana.__linha_origem);
        add('Análise','Saída da Análise',ana.RETORNO,ana.ANALISTA,ana.STATUS,'02 - ANÁLISE',ana.__linha_origem);
      }
      const pendenciaDetalhamento = pen ? detalhesPendencia(pen) : '';
      const pendenciaDataAberturaOriginal = pen ? dataAberturaPendencia(pen) : '';
      const pendenciaDataRecebimentoOriginal = pen ? dataRecebimentoPendencia(pen) : '';
      const pendenciaDataAbertura = excelData(pendenciaDataAberturaOriginal) ||
        excelData(ana && ana.RETORNO) || excelData(ana && ana['ENVIO ANÁLISE']) || abertura;
      const pendenciaDataRecebimento = excelData(pendenciaDataRecebimentoOriginal);
      const pendenciaAberta = !!pen && !pendenciaDataRecebimento;
      if (pen && pendenciaDataAbertura) {
        add('Pendência','Pendência registrada',pendenciaDataAbertura,'',pen.STATUS,'03 - PENDÊNCIA',pen.__linha_origem);
      }
      if (pen && pendenciaDataRecebimento) {
        add('Pendência','Pendência sanada / recebimento registrado',pendenciaDataRecebimento,'',pen.STATUS,'03 - PENDÊNCIA',pen.__linha_origem);
      }
      if (dig) {
        add('Digitação','Entrada em Digitação',dig['data de envio'],dig.DIGITADOR,dig.STATUS,'04- DIGITAÇÃO',dig.__linha_origem);
        add('Digitação','Saída da Digitação',dig['data de retorno'],dig.DIGITADOR,dig.STATUS,'04- DIGITAÇÃO',dig.__linha_origem);
      }
      if (con) {
        const resp = con['Conferente 01'] || con['DIG.'];
        add('Conferência','Entrada em Conferência',con['Data envio'],resp,con.STATUS,'05 - CONFERENCIA',con.__linha_origem);
        add('Conferência','Saída da Conferência',con['Data Retorno'],resp,con.STATUS,'05 - CONFERENCIA',con.__linha_origem);
      }
      if (ass) {
        add('Assinatura','Envio para Assinatura',ass['ENVIO ASSINATURA'],'',ass['Situação'],'06 - ASSINATURA',ass.__linha_origem);
        add('Assinatura','Retorno da Assinatura',ass['RETORNO ASSINATURA'],'',ass['Situação'],'06 - ASSINATURA',ass.__linha_origem);
      }
      if (def) {
        add('Aguardando Retirada','Deferido',def['DATA ASSINATURA'],'',def.STATUS,'07 - DEFERIDO',def.__linha_origem);
        if (normalizar(def.STATUS).includes('RETIR')) add('Retirado','Documento Retirado',def['DATA DA RETIRADA'],'',def.STATUS,'07 - DEFERIDO',def.__linha_origem);
      }

      const validos = ev.filter(e => e.valido_cronologia && e.data).sort((a,b) => {
        const porData = a.data.localeCompare(b.data);
        if (porData) return porData;
        return (ORDEM_ETAPAS[a.etapa] || 0) - (ORDEM_ETAPAS[b.etapa] || 0);
      });

      // Migração histórica adaptativa:
      // - datas iguais são aceitas;
      // - etapas ausentes ou puladas não invalidam o processo;
      // - retornos/retrabalhos entre etapas são preservados como variação histórica;
      // - somente inversões materialmente impossíveis bloqueiam a homologação.
      let maiorOrdem = 0;
      validos.forEach(e => {
        const ordem = ORDEM_ETAPAS[e.etapa] || 0;
        if (ordem + 10 < maiorOrdem) {
          addIssue(
            'VARIACAO_FLUXO_HISTORICO',
            'Média',
            `${e.evento} (${e.data}) indica retorno ou preenchimento fora da sequência linear; histórico preservado`,
            e.aba
          );
        }
        maiorOrdem = Math.max(maiorOrdem, ordem);
      });

      const dataReal = v => {
        const d = excelData(v);
        return d && tipoData(d) === 'REAL' && !dataFutura(d) ? d : null;
      };
      const validarPar = (inicio, fim, descricao, origemPar) => {
        const di = dataReal(inicio);
        const df = dataReal(fim);
        if (di && df && df < di) {
          addIssue('ORDEM_DATAS_CRITICA', 'Alta', `${descricao}: ${iso(df)} anterior a ${iso(di)}`, origemPar);
        }
      };

      if (ana) validarPar(ana['ENVIO ANÁLISE'], ana.RETORNO, 'Saída da Análise anterior à entrada', '02 - ANÁLISE');
      if (dig) validarPar(dig['data de envio'], dig['data de retorno'], 'Saída da Digitação anterior à entrada', '04- DIGITAÇÃO');
      if (con) validarPar(con['Data envio'], con['Data Retorno'], 'Saída da Conferência anterior à entrada', '05 - CONFERENCIA');
      if (ass) validarPar(ass['ENVIO ASSINATURA'], ass['RETORNO ASSINATURA'], 'Retorno da Assinatura anterior ao envio', '06 - ASSINATURA');
      if (def) validarPar(def['DATA ASSINATURA'], def['DATA DA RETIRADA'], 'Retirada anterior ao deferimento', '07 - DEFERIDO');

      const primeiraDataEtapa = etapa => validos.find(e => e.etapa === etapa)?.data || '';
      const dataAnalise = primeiraDataEtapa('Análise');
      const dataDigitacao = primeiraDataEtapa('Digitação');
      const dataConferencia = primeiraDataEtapa('Conferência');
      const dataAssinatura = primeiraDataEtapa('Assinatura');
      const dataRetirada = primeiraDataEtapa('Retirado');

      if (dataAnalise && dataAssinatura && dataAssinatura < dataAnalise) {
        addIssue('ORDEM_DATAS_CRITICA', 'Alta', `Assinatura (${dataAssinatura}) anterior à Análise (${dataAnalise})`, 'Cronologia');
      }
      if (dataDigitacao && dataConferencia && dataConferencia < dataDigitacao) {
        addIssue('ORDEM_DATAS_CRITICA', 'Alta', `Conferência (${dataConferencia}) anterior à Digitação (${dataDigitacao})`, 'Cronologia');
      }
      if (dataDigitacao && dataRetirada && dataRetirada < dataDigitacao) {
        addIssue('ORDEM_DATAS_CRITICA', 'Alta', `Retirada (${dataRetirada}) anterior à Digitação (${dataDigitacao})`, 'Cronologia');
      }

      const codigoMec = texto(r['COD. MEC']);
      if (!codigoMec) addIssue('SEM_COD_MEC', 'Média', 'Código MEC ausente', origemNome);

      const responsavelHistorico = nomeProprio(
        [...validos].reverse().find(e => texto(e.responsavel))?.responsavel || ''
      );
      const escolaSIGEE = localizarEscola(codigoMec, escola, nte);
      const tecnicoSIGEE = localizarUsuario(responsavelHistorico, nte);

      if (!escolaSIGEE) addIssue('ESCOLA_NAO_LOCALIZADA', 'Alta', 'Escola não localizada no catálogo atual do SIGEE', origemNome);
      // Técnico histórico ausente no cadastro atual é informativo: o vínculo fica vazio e não bloqueia o processo.

      // Regra oficial de equivalência Planilha → SIGEE:
      // Documento Recebido encerra o Desarquivamento e posiciona o processo em Análise.
      let etapaAtual = 'Desarquivamento';
      if (recebimento || imp) etapaAtual = 'Análise';
      if (ana) etapaAtual = normalizar(ana.STATUS).includes('PEND') ? 'Pendência' : 'Análise';
      if (pen && pendenciaAberta) etapaAtual = 'Pendência';
      if (dig && !pendenciaAberta) etapaAtual = 'Digitação';
      if (con && !pendenciaAberta) etapaAtual = 'Conferência';
      if (ass && !pendenciaAberta) etapaAtual = 'Assinatura';
      if (def && !pendenciaAberta) etapaAtual = normalizar(def.STATUS).includes('RETIR') ? 'Retirado' : 'Aguardando Retirada';

      // A data da etapa usa somente datas reais. Datas fictícias permanecem no histórico.
      const eventosEtapaReais = validos.filter(e => e.etapa === etapaAtual);
      const ultimoEventoEtapa = eventosEtapaReais[eventosEtapaReais.length - 1] || null;
      const dataEtapaAtual = ultimoEventoEtapa ? ultimoEventoEtapa.data : iso(abertura);

      processos.push({
        migration_key: chave(nome, escola, abertura),
        origem_registro: 'MIGRACAO_PLANILHA',
        processo_migrado: true,
        selo_origem: 'PROCESSO MIGRADO',
        arquivo_origem: arquivo,
        linha_origem: r.__linha_origem || linhaBase + 2,
        aba_origem: origemNome,
        hash_origem: '',
        motor_migracao: 'Engine de Migração 5.5.0',
        auditoria_aprovada: false,
        nte_origem: nte,
        aluno_nome: nome,
        escola_nome_original: escola,
        escola_id: escolaSIGEE ? campo(escolaSIGEE,['id']) : null,
        escola_nome: escolaSIGEE ? campo(escolaSIGEE,['nome_escola','nome','escola_nome']) : escola,
        codigo_mec: codigoMec,
        data_solicitacao: iso(abertura),
        data_primeiro_arquivo_recebido: iso(recebimento),
        tipo_arquivo: texto(r['TIPO DE ARQUIVO']),
        local_arquivo: texto(r['LOCAL ARQUIVO']),
        prioridade: texto(r.Prioridade) || 'Normal',
        etapa_atual: etapaAtual,
        data_etapa_atual: dataEtapaAtual,
        tecnico_responsavel_historico: responsavelHistorico,
        tecnico_responsavel_id: tecnicoSIGEE ? campo(tecnicoSIGEE,['id']) : null,
        escola_localizada: !!escolaSIGEE,
        tecnico_localizado: !!tecnicoSIGEE,
        tecnico_vinculo_informativo: true,
        quantidade_datas_reais: ev.filter(e => e.tipo_data === 'REAL').length,
        quantidade_datas_ficticias: ev.filter(e => e.tipo_data === 'FICTICIA').length,
        possui_data_ficticia: ev.some(e => e.tipo_data === 'FICTICIA'),
        pendencia_migrada: pen ? {
          existe: true,
          aberta: pendenciaAberta,
          status: pendenciaAberta ? 'pendente' : 'recebido',
          detalhamento: pendenciaDetalhamento || 'Detalhamento não disponível na base anterior.',
          data_abertura: iso(pendenciaDataAbertura),
          data_recebimento: iso(pendenciaDataRecebimento),
          arquivo_origem: arquivo,
          aba_origem: '03 - PENDÊNCIA',
          linha_origem: pen.__linha_origem || null,
          grupo: 'aluno',
          mensagem_codigo: 'MIG',
          mensagem_texto: 'Pendência migrada da planilha histórica'
        } : null,
        status_validacao: procIssues.some(x => x.gravidade === 'Alta') ? 'PENDENTE' : 'PRONTO',
        inconsistencias: procIssues,
        diagnostico_cronologia: procIssues.filter(x => ['DATA_INVALIDA','DATA_FUTURA','ORDEM_DATAS_CRITICA','VARIACAO_FLUXO_HISTORICO'].includes(x.tipo)),
        eventos: ev,
        eventos_validos: validos
      });
    });

    return {
      versao: VERSION,
      arquivo,
      abas,
      processos,
      eventos: eventos.filter(e => e.valido_cronologia),
      inconsistencias,
      gravado_supabase: false,
      simulacao_executada: false
    };
  }

  function renderizar(r) {
    document.getElementById('mig-kpis').classList.remove('hidden');
    document.getElementById('mig-conteudo').classList.remove('hidden');

    const prontos = r.processos.filter(p => p.status_validacao === 'PRONTO').length;
    const escolas = r.processos.filter(p => p.escola_localizada).length;
    const tecnicos = r.processos.filter(p => p.tecnico_localizado).length;
    const datasReais = r.processos.reduce((s,p) => s + (p.quantidade_datas_reais || 0), 0);
    const datasFicticias = r.processos.reduce((s,p) => s + (p.quantidade_datas_ficticias || 0), 0);

    document.getElementById('mig-kpi-processos').textContent = r.processos.length;
    document.getElementById('mig-kpi-prontos').textContent = prontos;
    document.getElementById('mig-kpi-pendentes').textContent = r.processos.length - prontos;
    document.getElementById('mig-kpi-eventos').textContent = r.eventos.length;
    document.getElementById('mig-kpi-escolas').textContent = escolas;
    document.getElementById('mig-kpi-tecnicos').textContent = tecnicos;
    document.getElementById('mig-kpi-datas-reais').textContent = datasReais;
    document.getElementById('mig-kpi-datas-ficticias').textContent = datasFicticias;
    document.getElementById('mig-resumo-validacao').textContent = `${prontos} prontos de ${r.processos.length}`;

    document.getElementById('mig-abas').innerHTML = r.abas.map(a =>
      `<div class="mig-linha"><span>${html(a.nome)}</span><b class="${a.reconhecida?'ok':a.ignorada?'ignorada':'atencao'}">${html(a.classificacao.etapa)}</b></div>`
    ).join('');

    const cont = {};
    r.processos.forEach(p => cont[p.etapa_atual] = (cont[p.etapa_atual] || 0) + 1);
    document.getElementById('mig-etapas').innerHTML = Object.entries(cont)
      .sort((a,b) => (ORDEM_ETAPAS[a[0]]||0) - (ORDEM_ETAPAS[b[0]]||0))
      .map(([k,v]) => `<div class="mig-linha"><span>${html(k)}</span><strong>${v}</strong></div>`).join('');

    document.getElementById('mig-processos').innerHTML = r.processos.slice(0,500).map(p =>
      `<tr class="mig-processo-row" data-migration-key="${html(p.migration_key)}">
        <td><button type="button" class="mig-link-processo" data-migration-key="${html(p.migration_key)}">${html(p.aluno_nome)}</button></td>
        <td>${html(p.escola_nome_original)}</td>
        <td>${html(p.data_solicitacao)}</td>
        <td>${html(p.etapa_atual)}</td>
        <td>${html(p.tecnico_responsavel_historico)}</td>
        <td><span class="mig-badge ${p.escola_localizada?'ok':'erro'}">${p.escola_localizada?'LOCALIZADA':'NÃO LOCALIZADA'}</span></td>
        <td><span class="mig-badge ${p.tecnico_localizado?'ok':'atencao'}">${p.tecnico_localizado?'VINCULADO':'SEM VÍNCULO'}</span></td>
        <td>
          <span class="mig-badge ${p.status_validacao==='PRONTO'?'ok':'pendente'}">${p.status_validacao}</span>
          <span class="mig-badge migrado">MIGRADO</span>
          ${p.possui_data_ficticia ? '<span class="mig-badge ficticia">DATA FICTÍCIA</span>' : ''}
        </td>
      </tr>`).join('');

    document.querySelectorAll('.mig-link-processo').forEach(btn => {
      btn.addEventListener('click', () => abrirAuditoriaProcesso(btn.dataset.migrationKey));
    });

    document.getElementById('mig-inconsistencias').innerHTML = r.inconsistencias.length
      ? r.inconsistencias.slice(0,800).map(x =>
        `<tr><td>${html(x.aluno)}</td><td>${html(x.tipo)}</td><td><span class="mig-gravidade ${normalizar(x.gravidade)==='ALTA'?'alta':'media'}">${html(x.gravidade)}</span></td><td>${html(x.descricao)}</td><td>${html(x.origem)}</td></tr>`
      ).join('')
      : '<tr><td colspan="5">Nenhuma inconsistência identificada.</td></tr>';

    document.getElementById('mig-simulacao-box').classList.add('hidden');
    document.getElementById('mig-qualidade-box')?.classList.add('hidden');
    document.getElementById('mig-auditoria-processo-box')?.classList.add('hidden');
    document.getElementById('mig-auditoria-tecnica-box')?.classList.add('hidden');
  }


  function abrirAuditoriaProcesso(migrationKey) {
    if (!resultadoAtual) return;
    const p = resultadoAtual.processos.find(x => x.migration_key === migrationKey);
    if (!p) return;

    const eventosHtml = (p.eventos || []).map(e => `
      <tr>
        <td>${html(e.evento)}</td>
        <td>${html(e.etapa)}</td>
        <td>${html(e.data)}</td>
        <td><span class="mig-badge ${e.tipo_data === 'FICTICIA' ? 'ficticia' : 'ok'}">${html(e.tipo_data)}</span></td>
        <td>${html(e.responsavel)}</td>
        <td>${html(e.aba)}</td>
      </tr>`).join('');

    const diagnosticos = p.diagnostico_cronologia || [];
    const bloqueiosCronologia = diagnosticos.filter(x => ['DATA_INVALIDA','DATA_FUTURA','ORDEM_DATAS_CRITICA'].includes(x.tipo));
    const observacoesCronologia = diagnosticos.filter(x => x.tipo === 'VARIACAO_FLUXO_HISTORICO');
    const diagnosticoHtml = diagnosticos.length ? diagnosticos.map(x => `
      <article class="mig-diagnostico-item ${['DATA_INVALIDA','DATA_FUTURA','ORDEM_DATAS_CRITICA'].includes(x.tipo) ? 'bloqueio' : 'observacao'}">
        <div class="mig-diagnostico-icone">${['DATA_INVALIDA','DATA_FUTURA','ORDEM_DATAS_CRITICA'].includes(x.tipo) ? '✖' : '⚠'}</div>
        <div>
          <strong>${html(x.tipo.replaceAll('_',' '))}</strong>
          <p>${html(x.descricao)}</p>
          <small>Origem: ${html(x.origem)} • Gravidade: ${html(x.gravidade)}</small>
        </div>
      </article>`).join('') : `
      <article class="mig-diagnostico-item ok">
        <div class="mig-diagnostico-icone">✔</div>
        <div><strong>Cronologia sem bloqueios</strong><p>Nenhuma inversão crítica foi identificada neste processo.</p></div>
      </article>`;

    const fidelidadeItens = [
      ['Aluno', !!p.aluno_nome],
      ['Escola', !!p.escola_nome],
      ['Código MEC', !!p.codigo_mec],
      ['Data de abertura', !!p.data_solicitacao],
      ['Etapa atual', !!p.etapa_atual],
      ['Escola localizada', !!p.escola_localizada],
      ['Técnico localizado', !!p.tecnico_localizado]
    ];
    const ok = fidelidadeItens.filter(x => x[1]).length;
    const indice = Math.round((ok / fidelidadeItens.length) * 100);

    document.getElementById('mig-auditoria-processo').innerHTML = `
      <div class="mig-auditoria-resumo">
        <div><span>Índice de fidelidade</span><strong>${indice}%</strong></div>
        <div><span>Origem</span><strong>PROCESSO MIGRADO</strong></div>
        <div><span>Etapa reconstruída</span><strong>${html(p.etapa_atual)}</strong></div>
        <div><span>Status</span><strong>${html(p.status_validacao)}</strong></div>
      </div>
      <div class="mig-comparacao-grid">
        <article><h3>Planilha</h3>
          <dl>
            <div><dt>Aluno</dt><dd>${html(p.aluno_nome)}</dd></div>
            <div><dt>Escola</dt><dd>${html(p.escola_nome_original)}</dd></div>
            <div><dt>Código MEC</dt><dd>${html(p.codigo_mec)}</dd></div>
            <div><dt>Responsável histórico</dt><dd>${html(p.tecnico_responsavel_historico)}</dd></div>
            <div><dt>Prioridade</dt><dd>${html(p.prioridade)}</dd></div>
          </dl>
        </article>
        <article><h3>SIGEE</h3>
          <dl>
            <div><dt>Aluno</dt><dd>${html(p.aluno_nome)}</dd></div>
            <div><dt>Escola vinculada</dt><dd>${html(p.escola_nome)}</dd></div>
            <div><dt>Escola localizada</dt><dd>${p.escola_localizada ? 'SIM' : 'NÃO'}</dd></div>
            <div><dt>Técnico localizado</dt><dd>${p.tecnico_localizado ? 'SIM' : 'NÃO'}</dd></div>
            <div><dt>Etapa final</dt><dd>${html(p.etapa_atual)}</dd></div>
          </dl>
        </article>
      </div>
      <section class="mig-diagnostico-cronologia">
        <header>
          <div>
            <h3>Diagnóstico da cronologia</h3>
            <p>Explicação individual das regras que mantêm o processo pendente ou apenas registram variações históricas.</p>
          </div>
          <div class="mig-diagnostico-contadores">
            <span class="bloqueio">${bloqueiosCronologia.length} bloqueio(s)</span>
            <span class="observacao">${observacoesCronologia.length} observação(ões)</span>
          </div>
        </header>
        <div class="mig-diagnostico-lista">${diagnosticoHtml}</div>
      </section>
      <h3 class="mig-subtitulo">Histórico reconstruído</h3>
      <div class="mig-tabela-wrap">
        <table>
          <thead><tr><th>Evento</th><th>Etapa</th><th>Data</th><th>Tipo</th><th>Responsável</th><th>Origem</th></tr></thead>
          <tbody>${eventosHtml || '<tr><td colspan="6">Sem eventos</td></tr>'}</tbody>
        </table>
      </div>`;

    document.getElementById('mig-auditoria-processo-box')?.classList.remove('hidden');
    document.getElementById('mig-auditoria-processo-box')?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function regraAuditoria(issue) {
    const mapa = {
      DATA_INVALIDA: 'Data inválida',
      DATA_FUTURA: 'Data futura',
      ORDEM_DATAS_CRITICA: 'Inversão cronológica',
      ESCOLA_NAO_LOCALIZADA: 'Vínculo de escola',
      SEM_COD_MEC: 'Código MEC ausente'
    };
    return mapa[issue?.tipo] || texto(issue?.tipo).replaceAll('_',' ');
  }

  function acaoRecomendada(issue) {
    const tipo = issue?.tipo;
    const desc = normalizar(issue?.descricao);
    if (tipo === 'DATA_INVALIDA') return 'Corrigir a célula de data na aba indicada ou substituir por data fictícia identificada, quando a data real não existir.';
    if (tipo === 'DATA_FUTURA') return 'Revisar a data informada na planilha; datas futuras não podem compor o histórico.';
    if (tipo === 'ORDEM_DATAS_CRITICA') {
      if (desc.includes('RETORNO') || desc.includes('SAIDA')) return 'Conferir as datas de entrada e retorno na aba indicada e corrigir somente se houve inversão de preenchimento.';
      if (desc.includes('RETIRADA')) return 'Conferir a data de retirada e a data de deferimento/assinatura.';
      return 'Conferir as datas das etapas citadas. Se a sequência refletir retrabalho real, registrar como variação histórica; se for erro de preenchimento, corrigir a planilha.';
    }
    if (tipo === 'ESCOLA_NAO_LOCALIZADA') return 'Selecionar a escola correspondente dentro do NTE da planilha.';
    return 'Abrir a auditoria individual e conferir o registro de origem.';
  }

  function renderizarAuditoriaTecnica() {
    if (!resultadoAtual) return;
    const box = document.getElementById('mig-auditoria-tecnica-box');
    const corpo = document.getElementById('mig-auditoria-tecnica-corpo');
    const resumo = document.getElementById('mig-auditoria-tecnica-resumo');
    if (!box || !corpo || !resumo) return;

    const pendentes = resultadoAtual.processos.filter(p => p.status_validacao === 'PENDENTE');
    resumo.textContent = `${pendentes.length} pendente(s) de ${resultadoAtual.processos.length}`;
    box.classList.toggle('hidden', pendentes.length === 0);

    if (!pendentes.length) {
      corpo.innerHTML = '<tr><td colspan="7">Nenhum processo pendente.</td></tr>';
      return;
    }

    const linhas = [];
    pendentes.forEach(p => {
      const bloqueios = (p.inconsistencias || []).filter(x => x.gravidade === 'Alta');
      (bloqueios.length ? bloqueios : [{tipo:'REVISAO',descricao:'Processo marcado como pendente sem bloqueio detalhado.',origem:'Validação'}]).forEach((issue, indice) => {
        linhas.push(`
          <tr class="mig-auditoria-tecnica-linha">
            <td><button type="button" class="mig-link-processo" data-mig-key="${html(p.migration_key)}">${html(p.aluno_nome)}</button><small>Linha ${html(p.linha_origem)}</small></td>
            <td>${html(p.escola_nome_original)}</td>
            <td><span class="mig-regra-chip">${html(regraAuditoria(issue))}</span></td>
            <td>${html(issue.descricao)}</td>
            <td>${html(issue.origem)}</td>
            <td>${html(acaoRecomendada(issue))}</td>
            <td><button type="button" class="mig-btn-auditar" data-mig-key="${html(p.migration_key)}">Auditar</button></td>
          </tr>`);
      });
    });
    corpo.innerHTML = linhas.join('');
    corpo.querySelectorAll('[data-mig-key]').forEach(btn => btn.addEventListener('click', () => abrirAuditoriaProcesso(btn.dataset.migKey)));
  }

  function validarFinal() {
    if (!resultadoAtual) return;

    const processos = resultadoAtual.processos;
    const total = processos.length || 1;
    const criterios = {
      processos: processos.length > 0,
      etapas: processos.every(p => !!p.etapa_atual),
      datas: processos.every(p => !!p.data_solicitacao),
      escolas: processos.every(p => p.escola_localizada),
      tecnicos: true,
      workflow: processos.every(p => Array.isArray(p.eventos) && p.eventos.length > 0),
      cronologia: !resultadoAtual.inconsistencias.some(i => ['DATA_INVALIDA','DATA_FUTURA','ORDEM_DATAS_CRITICA'].includes(i.tipo))
    };

    const detalhes = [
      ['Processos identificados', criterios.processos, processos.length],
      ['Etapas reconstruídas', criterios.etapas, processos.filter(p=>p.etapa_atual).length + '/' + total],
      ['Datas de abertura', criterios.datas, processos.filter(p=>p.data_solicitacao).length + '/' + total],
      ['Escolas localizadas', criterios.escolas, processos.filter(p=>p.escola_localizada).length + '/' + total],
      ['Técnicos atuais vinculados (informativo)', true, processos.filter(p=>p.tecnico_localizado).length + '/' + total],
      ['Histórico reconstruído', criterios.workflow, resultadoAtual.eventos.length],
      ['Cronologia válida', criterios.cronologia, criterios.cronologia ? 'OK' : 'REVISAR']
    ];

    const pesos = {processos:15, etapas:20, datas:15, escolas:25, tecnicos:0, workflow:15, cronologia:10};
    let qualidade = 0;
    Object.entries(criterios).forEach(([k,v]) => { if (v) qualidade += pesos[k] || 0; });

    const certificado = qualidade === 100;
    resultadoAtual.validacao_final = {
      executada: true,
      qualidade_percentual: qualidade,
      criterios,
      certificado_emitido: certificado,
      status: certificado ? 'PRONTO_PARA_IMPORTACAO' : 'PENDENTE_DE_AJUSTES',
      validado_em: new Date().toISOString()
    };

    renderizarAuditoriaTecnica();

    const box = document.getElementById('mig-qualidade-box');
    box?.classList.remove('hidden');
    document.getElementById('mig-qualidade-valor').textContent = qualidade + '%';
    document.getElementById('mig-qualidade-barra').style.width = qualidade + '%';
    document.getElementById('mig-qualidade-status').textContent = certificado ? 'CERTIFICADO — PRONTO PARA IMPORTAÇÃO' : 'PENDENTE DE AJUSTES';
    document.getElementById('mig-qualidade-status').className = certificado ? 'mig-certificado-ok' : 'mig-certificado-pendente';
    document.getElementById('mig-qualidade-itens').innerHTML = detalhes.map(([nome,ok,valor]) => `
      <div class="mig-qualidade-item ${ok?'ok':'erro'}">
        <span>${ok?'✔':'✖'} ${html(nome)}</span>
        <strong>${html(valor)}</strong>
      </div>`).join('');

    if (certificado) {
      document.getElementById('mig-qualidade-itens').insertAdjacentHTML('beforeend', `
        <div class="mig-certificado">
          <strong>CERTIFICADO DE HOMOLOGAÇÃO</strong>
          <span>${html(resultadoAtual.arquivo)}</span>
          <b>${processos.length} processos • ${resultadoAtual.eventos.length} eventos • 100% de qualidade</b>
          <small>Pronto para a fase de importação controlada.</small>
        </div>`);
    }

    atualizarStatus(
      certificado
        ? 'Validação final concluída: migração homologada com 100% de qualidade.'
        : `Validação final concluída: qualidade ${qualidade}%. Existem itens pendentes.`,
      certificado ? 'ok' : 'erro'
    );
    if (certificado) {
      resultadoAtual.processos.forEach(p => {
        p.auditoria_aprovada = p.status_validacao === 'PRONTO' && !p.ignorar_migracao;
      });
    }
    box?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function simularMigracao() {
    if (!resultadoAtual) return;
    const prontos = resultadoAtual.processos.filter(p => p.status_validacao === 'PRONTO');
    const pendentes = resultadoAtual.processos.filter(p => p.status_validacao !== 'PRONTO');
    const eventos = prontos.reduce((s,p) => s + p.eventos_validos.length, 0);

    resultadoAtual.simulacao_executada = true;
    resultadoAtual.lote_importacao = {
      processos_prontos: prontos,
      processos_bloqueados: pendentes.map(p => ({
        migration_key: p.migration_key,
        aluno_nome: p.aluno_nome,
        motivo: (p.inconsistencias || []).filter(x => x.gravidade === 'Alta').map(x => x.descricao).join(' | ') || 'Pendência de validação'
      })),
      historico_eventos_prontos: prontos.flatMap(p => p.eventos_validos.map(e => ({
        migration_key: p.migration_key,
        aluno_nome: p.aluno_nome,
        escola_nome: p.escola_nome,
        ...e
      })))
    };

    const box = document.getElementById('mig-simulacao-box');
    box.classList.remove('hidden');
    document.getElementById('mig-simulacao').innerHTML = `
      <div class="mig-simulacao-grid">
        <div><span>Processos que seriam importados</span><strong>${prontos.length}</strong></div>
        <div><span>Processos bloqueados</span><strong>${pendentes.length}</strong></div>
        <div><span>Eventos históricos válidos</span><strong>${eventos}</strong></div>
        <div><span>Gravação no banco</span><strong>NÃO</strong></div>
        <div><span>Identificação de origem</span><strong>MIGRADO</strong></div>
        <div><span>Datas fictícias preservadas</span><strong>${prontos.reduce((s,p)=>s+(p.quantidade_datas_ficticias||0),0)}</strong></div>
      </div>
      <p class="mig-nota">A simulação preparou o lote compatível com a próxima fase. Nenhuma operação de INSERT ou UPDATE foi executada.</p>`;
    atualizarStatus(`Simulação concluída: ${prontos.length} processos aptos e ${pendentes.length} bloqueados.`, 'ok');
  }

  function exportarResultado() {
    if (!resultadoAtual) return;
    if (!resultadoAtual.simulacao_executada) simularMigracao();
    const blob = new Blob([JSON.stringify(resultadoAtual, null, 2)], {type:'application/json;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sigee_m2_lote_' + resultadoAtual.arquivo.replace(/\.[^.]+$/,'') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function iniciar() {
    garantirTela();
    garantirMenu();
    setTimeout(garantirMenu, 1200);
    setInterval(garantirMenu, 5000);
  }

  window.SIGEE_MIGRACAO_HISTORICA = {
    abrir: abrirMigracao,
    versao: VERSION,
    simular: simularMigracao,
    validarFinal: validarFinal,
    auditarProcesso: abrirAuditoriaProcesso,
    resultado: () => resultadoAtual
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();


/* =====================================================================
   SIGEE Enterprise — M5.4 | Centro de Auditoria com Rascunho Persistente
   Correções em memória: escola, datas, ignorar registro e autorização
   excepcional. Não altera a planilha original nem o catálogo do SIGEE.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__SIGEE_M53_AUDITOR__) return;
  window.__SIGEE_M53_AUDITOR__ = true;

  const VERSAO = 'M5.4.0';
  const $ = id => document.getElementById(id);
  const txt = v => v == null ? '' : String(v).trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const esc = v => txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const resultado = () => window.SIGEE_MIGRACAO_HISTORICA?.resultado?.() || null;
  const master = () => norm(window.usuarioLogado?.perfil).includes('MASTER');
  const client = () => [window.supabaseClient,window.supaClient,window.sb,window.SUPABASE_CLIENT]
    .find(c=>c&&typeof c.from==='function') || null;
  const nteAtual = () => {
    const m=txt($('mig-nte')?.value).match(/(\d{1,2})/);
    return m ? String(Number(m[1])).padStart(2,'0') : '';
  };
  const agora = () => new Date().toISOString();

  const TABELA_RASCUNHOS = 'migracoes_historicas_rascunhos';
  let timerSalvarRascunho = null;
  let hashRascunhoAtual = '';

  async function sha256Arquivo(file){
    if(!file||!window.crypto?.subtle)return '';
    const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function usuarioExecutor(){
    return {
      nome: window.usuarioLogado?.nome || 'Master',
      email: window.usuarioLogado?.email || '',
      perfil: window.usuarioLogado?.perfil || ''
    };
  }

  function serializarRascunho(){
    const r=resultado();
    if(!r)return null;
    return {
      versao:VERSAO,
      nte:`NTE-${nteAtual()}`,
      arquivo:r.arquivo||document.getElementById('mig-arquivo')?.files?.[0]?.name||'',
      hash_sha256:hashRascunhoAtual,
      atualizado_em:agora(),
      executor:usuarioExecutor(),
      processos:(r.processos||[]).map(p=>({
        migration_key:p.migration_key,
        escola_id:p.escola_id||null,
        escola_nome:p.escola_nome||'',
        codigo_mec:p.codigo_mec||p.cod_mec||'',
        data_solicitacao:p.data_solicitacao||'',
        data_etapa_atual:p.data_etapa_atual||'',
        eventos:(p.eventos||[]).map(e=>({
          etapa:e.etapa||'',evento:e.evento||'',data:e.data||'',
          tipo_data:e.tipo_data||'REAL',responsavel:e.responsavel||'',
          status:e.status||'',aba:e.aba||''
        })),
        ignorar_migracao:!!p.ignorar_migracao,
        decisao_m53:p.decisao_m53||'',
        auditoria_m53:p.auditoria_m53||[]
      }))
    };
  }

  function aplicarRascunho(draft){
    const r=resultado();
    if(!r||!draft?.processos)return;
    const mapa=new Map(draft.processos.map(p=>[p.migration_key,p]));
    (r.processos||[]).forEach(p=>{
      const d=mapa.get(p.migration_key);
      if(!d)return;
      p.escola_id=d.escola_id;
      p.escola_nome=d.escola_nome;
      p.codigo_mec=d.codigo_mec;
      p.data_solicitacao=d.data_solicitacao;
      p.data_etapa_atual=d.data_etapa_atual;
      if(Array.isArray(d.eventos)&&d.eventos.length)p.eventos=d.eventos;
      p.ignorar_migracao=!!d.ignorar_migracao;
      p.decisao_m53=d.decisao_m53||'';
      p.auditoria_m53=Array.isArray(d.auditoria_m53)?d.auditoria_m53:[];
      revalidar(p);
    });
    atualizarPainel();
  }

  async function salvarRascunhoAgora(){
    const c=client(), draft=serializarRascunho();
    if(!c||!draft||!draft.hash_sha256||!draft.nte)return;
    const payload={
      hash_sha256:draft.hash_sha256,
      nte:draft.nte,
      arquivo_origem:draft.arquivo,
      usuario_email:draft.executor.email,
      usuario_nome:draft.executor.nome,
      status:'EM_AUDITORIA',
      dados:draft,
      updated_at:agora()
    };
    const {error}=await c.from(TABELA_RASCUNHOS)
      .upsert(payload,{onConflict:'hash_sha256'});
    if(error)throw error;
    const el=document.getElementById('mig-m53-salvamento');
    if(el){el.textContent='Salvo automaticamente às '+new Date().toLocaleTimeString('pt-BR');el.className='mig-m53-salvamento ok';}
  }

  function agendarSalvamento(){
    clearTimeout(timerSalvarRascunho);
    const el=document.getElementById('mig-m53-salvamento');
    if(el){el.textContent='Alterações pendentes de salvamento...';el.className='mig-m53-salvamento carregando';}
    timerSalvarRascunho=setTimeout(()=>salvarRascunhoAgora().catch(e=>{
      console.error('[SIGEE M5.4] Falha ao salvar rascunho',e);
      if(el){el.textContent='Falha ao salvar rascunho: '+(e.message||e);el.className='mig-m53-salvamento erro';}
    }),700);
  }

  async function localizarRascunho(hash){
    const c=client();if(!c||!hash)return null;
    const {data,error}=await c.from(TABELA_RASCUNHOS)
      .select('hash_sha256,nte,arquivo_origem,usuario_nome,usuario_email,status,dados,updated_at')
      .eq('hash_sha256',hash).maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function perguntarRetomadaRascunho(file){
    hashRascunhoAtual=await sha256Arquivo(file);
    const draft=await localizarRascunho(hashRascunhoAtual);
    if(!draft?.dados)return;
    const quando=draft.updated_at?new Date(draft.updated_at).toLocaleString('pt-BR'):'data não informada';
    const retomar=confirm(`Rascunho de auditoria localizado.\n\nNTE: ${draft.nte}\nArquivo: ${draft.arquivo_origem}\nÚltima edição: ${quando}\nUsuário: ${draft.usuario_nome||draft.usuario_email}\n\nClique em OK para retomar ou Cancelar para iniciar uma nova auditoria.`);
    if(retomar){
      aplicarRascunho(draft.dados);
      const el=document.getElementById('mig-m53-salvamento');
      if(el){el.textContent='Rascunho retomado com sucesso.';el.className='mig-m53-salvamento ok';}
    }
  }

  async function descartarRascunho(){
    if(!hashRascunhoAtual)return alert('Nenhum rascunho carregado.');
    if(!confirm('Descartar definitivamente o rascunho desta planilha?'))return;
    const c=client();if(!c)return alert('Supabase não localizado.');
    const {error}=await c.from(TABELA_RASCUNHOS).delete().eq('hash_sha256',hashRascunhoAtual);
    if(error)return alert('Não foi possível descartar o rascunho: '+(error.message||error));
    alert('Rascunho descartado.');
    const el=document.getElementById('mig-m53-salvamento');
    if(el){el.textContent='Sem rascunho salvo.';el.className='mig-m53-salvamento';}
  }

  function registrar(p, acao, campo, anterior, novo, motivo) {
    p.auditoria_m53 = Array.isArray(p.auditoria_m53) ? p.auditoria_m53 : [];
    p.auditoria_m53.push({
      versao: VERSAO, acao, campo, valor_anterior: anterior ?? null, valor_novo: novo ?? null,
      motivo: txt(motivo), usuario: window.usuarioLogado?.nome || 'Master',
      email: window.usuarioLogado?.email || '', executado_em: agora()
    });
  }

  function modal(conteudo) {
    document.getElementById('mig-m53-modal')?.remove();
    const bg=document.createElement('div');
    bg.id='mig-m53-modal'; bg.className='mig-m53-modal-bg';
    bg.innerHTML=`<section class="mig-m53-modal">${conteudo}</section>`;
    document.body.appendChild(bg);
    bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
    return bg;
  }

  function processoPorChave(chave) {
    return resultado()?.processos?.find(p=>p.migration_key===chave) || null;
  }

  function tiposDataInvalidos(p) {
    const eventos = Array.isArray(p.eventos) ? p.eventos : [];
    const erros=[];
    let anterior=null;
    eventos.forEach((e,i)=>{
      const s=txt(e.data);
      const valida=/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s+'T12:00:00').getTime());
      if(!valida) erros.push({tipo:'DATA_INVALIDA',indice:i,descricao:`Data inválida em ${e.etapa||e.aba||'evento'}.`});
      if(valida && anterior && s < anterior) erros.push({tipo:'ORDEM_DATAS_CRITICA',indice:i,descricao:`${e.etapa||e.aba||'Evento'} anterior ao evento precedente.`});
      if(valida) anterior=s;
    });
    return erros;
  }

  function revalidar(p) {
    const manter=(p.inconsistencias||[]).filter(i=>{
      const t=norm(i.tipo);
      if(t.includes('ESCOLA') && p.escola_id) return false;
      if(['DATA INVALIDA','DATA FUTURA','ORDEM DATAS CRITICA'].includes(t.replaceAll('_',' '))) return false;
      return true;
    });
    const errosDatas=tiposDataInvalidos(p).map(e=>({
      aluno:p.aluno_nome,tipo:e.tipo,gravidade:'Alta',descricao:e.descricao,origem:'Auditoria M5.3'
    }));
    p.inconsistencias=[...manter,...errosDatas];
    p.eventos_validos=(p.eventos||[]).filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(txt(e.data)));
    p.quantidade_datas_reais=p.eventos_validos.filter(e=>norm(e.tipo_data)==='REAL').length;
    p.quantidade_datas_ficticias=p.eventos_validos.filter(e=>norm(e.tipo_data).includes('FICT')).length;
    p.possui_data_ficticia=p.quantidade_datas_ficticias>0;
    p.status_validacao = p.ignorar_migracao ? 'IGNORADO' :
      (p.inconsistencias.some(i=>norm(i.gravidade)==='ALTA') ? 'PENDENTE' : 'PRONTO');

    const r=resultado();
    if(r){
      r.inconsistencias=r.processos.flatMap(x=>x.inconsistencias||[]);
      r.eventos=r.processos.filter(x=>!x.ignorar_migracao).flatMap(x=>x.eventos_validos||[]);
      r.validacao_final={executada:false,qualidade_percentual:0};
    }
    atualizarPainel();
    agendarSalvamento();
  }

  async function buscarEscolas(termo) {
    const c=client(); if(!c) throw new Error('Cliente Supabase não localizado.');
    const nte=nteAtual();
    const safe=txt(termo).replace(/[,%_]/g,' ');
    let q=c.from('escolas_sigee')
      .select('id,cod_mec,nome_escola,municipio,nte_id,ativo')
      .order('nome_escola',{ascending:true}).limit(40);
    if(safe.length>=2) q=q.or(`nome_escola.ilike.%${safe}%,municipio.ilike.%${safe}%,cod_mec.ilike.%${safe}%`);
    const {data,error}=await q;
    if(error) throw error;
    const base=Array.isArray(data)?data:[];
    if(!nte) return base;
    // nte_id geralmente é o número ou referência correspondente; a validação final ainda confere o NTE.
    return base.filter(e=>{
      const v=txt(e.nte_id);
      const m=v.match(/(\d{1,2})/);
      return !m || String(Number(m[1])).padStart(2,'0')===nte;
    });
  }

  function abrirEscola(chave) {
    const p=processoPorChave(chave); if(!p)return;
    const bg=modal(`
      <header><h3>Corrigir vínculo da escola</h3><button data-fechar>✕</button></header>
      <div class="mig-m53-original"><b>Planilha:</b> ${esc(p.escola_nome_original)}<br><b>NTE:</b> ${esc(nteAtual())}</div>
      <label>Pesquisar no catálogo atual<input id="m53-escola-busca" placeholder="Nome, MEC ou município"></label>
      <div id="m53-escola-resultados" class="mig-m53-resultados">Digite ao menos 2 caracteres.</div>
      <label>Motivo da correção<textarea id="m53-escola-motivo" placeholder="Justificativa obrigatória"></textarea></label>`);
    bg.querySelector('[data-fechar]').onclick=()=>bg.remove();
    const input=bg.querySelector('#m53-escola-busca'), box=bg.querySelector('#m53-escola-resultados');
    let timer;
    input.addEventListener('input',()=>{
      clearTimeout(timer);
      timer=setTimeout(async()=>{
        if(txt(input.value).length<2){box.textContent='Digite ao menos 2 caracteres.';return;}
        box.textContent='Consultando catálogo atualizado...';
        try{
          const escolas=await buscarEscolas(input.value);
          box.innerHTML=escolas.length?escolas.map(e=>`<button type="button" data-id="${esc(e.id)}" data-nome="${esc(e.nome_escola)}" data-mec="${esc(e.cod_mec)}"><b>${esc(e.nome_escola)}</b><span>${esc(e.municipio)} · MEC ${esc(e.cod_mec||'-')}</span></button>`).join(''):'Nenhuma escola localizada no NTE.';
          box.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
            const motivo=txt(bg.querySelector('#m53-escola-motivo').value);
            if(!motivo)return alert('Informe o motivo da correção.');
            const anterior={escola_id:p.escola_id,escola_nome:p.escola_nome,codigo_mec:p.codigo_mec};
            p.escola_id=btn.dataset.id;p.escola_nome=btn.dataset.nome;p.codigo_mec=btn.dataset.mec;
            p.escola_localizada=true;
            registrar(p,'CORRECAO_ESCOLA','escola',anterior,{escola_id:p.escola_id,escola_nome:p.escola_nome,codigo_mec:p.codigo_mec},motivo);
            bg.remove();revalidar(p);
          });
        }catch(e){box.textContent='Falha ao consultar catálogo: '+(e.message||e);}
      },300);
    });
  }

  function abrirDatas(chave) {
    const p=processoPorChave(chave); if(!p)return;
    const eventos=Array.isArray(p.eventos)?p.eventos:[];
    const bg=modal(`
      <header><h3>Corrigir datas do processo</h3><button data-fechar>✕</button></header>
      <div class="mig-m53-eventos">${eventos.map((e,i)=>`
        <div class="mig-m53-evento">
          <div><b>${esc(e.etapa||e.evento||e.aba||('Evento '+(i+1)))}</b><small>${esc(e.aba||'')}</small></div>
          <input type="date" data-data="${i}" value="${esc(e.data)}">
          <select data-tipo="${i}"><option value="REAL" ${norm(e.tipo_data)==='REAL'?'selected':''}>REAL</option><option value="FICTICIA" ${norm(e.tipo_data).includes('FICT')?'selected':''}>FICTÍCIA</option></select>
        </div>`).join('')}</div>
      <label>Motivo da correção<textarea id="m53-data-motivo" placeholder="Justificativa obrigatória"></textarea></label>
      <div class="mig-m53-modal-acoes"><button data-cancelar>Cancelar</button><button data-salvar>Salvar e revalidar</button></div>`);
    bg.querySelector('[data-fechar]').onclick=bg.querySelector('[data-cancelar]').onclick=()=>bg.remove();
    bg.querySelector('[data-salvar]').onclick=()=>{
      const motivo=txt(bg.querySelector('#m53-data-motivo').value);
      if(!motivo)return alert('Informe o motivo da correção.');
      const antes=eventos.map(e=>({data:e.data,tipo_data:e.tipo_data}));
      eventos.forEach((e,i)=>{
        e.data=bg.querySelector(`[data-data="${i}"]`).value;
        e.tipo_data=bg.querySelector(`[data-tipo="${i}"]`).value;
      });
      p.data_solicitacao=eventos.find(e=>txt(e.data))?.data||p.data_solicitacao;
      p.data_etapa_atual=[...eventos].reverse().find(e=>txt(e.data))?.data||p.data_etapa_atual;
      registrar(p,'CORRECAO_DATAS','eventos',antes,eventos.map(e=>({data:e.data,tipo_data:e.tipo_data})),motivo);
      bg.remove();revalidar(p);
    };
  }

  function ignorar(chave) {
    const p=processoPorChave(chave); if(!p)return;
    const motivo=prompt('Informe o motivo para ignorar este processo no lote:');
    if(!txt(motivo))return;
    p.ignorar_migracao=true;p.decisao_m53='IGNORAR';
    registrar(p,'IGNORAR_LOTE','status_validacao',p.status_validacao,'IGNORADO',motivo);
    revalidar(p);
  }

  function restaurar(chave) {
    const p=processoPorChave(chave); if(!p)return;
    p.ignorar_migracao=false;p.decisao_m53='';
    registrar(p,'RESTAURAR_LOTE','status_validacao','IGNORADO','REVALIDAR','Restauração pelo Master');
    revalidar(p);
  }

  function importarMesmoAssim(chave) {
    const p=processoPorChave(chave); if(!p)return;
    if(!p.escola_id)return alert('A autorização excepcional não pode substituir o vínculo obrigatório com uma escola do catálogo.');
    const motivo=prompt('Justificativa obrigatória para importar mesmo assim:');
    if(!txt(motivo))return;
    p.decisao_m53='IMPORTAR_EXCEPCIONAL';
    p.inconsistencias=(p.inconsistencias||[]).map(i=>({...i,gravidade:norm(i.gravidade)==='ALTA'?'Média':i.gravidade,superada_por_master:true}));
    registrar(p,'IMPORTAR_EXCEPCIONAL','status_validacao',p.status_validacao,'PRONTO',motivo);
    revalidar(p);
  }

  function desfazer(chave) {
    const p=processoPorChave(chave); if(!p||!(p.auditoria_m53||[]).length)return;
    alert('A trilha de auditoria foi preservada. Para desfazer escola ou datas, abra novamente o editor e selecione/informe o valor correto.');
  }

  function garantirPainel() {
    const host=$('aba-migracao-historica');
    if(!host||$('mig-m53-centro'))return;
    const box=document.createElement('article');
    box.id='mig-m53-centro';box.className='mig-painel mig-m53-centro hidden';
    box.innerHTML=`
      <header class="mig-painel-cab"><div><h2>Centro de Auditoria de Migração</h2><p class="mig-painel-descricao">Corrija escola ou datas, ignore registros específicos e mantenha o trabalho salvo no Supabase.</p></div><span id="mig-m53-resumo">Aguardando lote</span></header>
      <div class="mig-m53-rascunho-bar"><span id="mig-m53-salvamento" class="mig-m53-salvamento">Sem alterações salvas.</span><div><button id="mig-m53-salvar-agora" type="button">💾 Salvar agora</button><button id="mig-m53-descartar" type="button">🗑️ Descartar rascunho</button></div></div>
      <div class="mig-m53-filtros"><button data-filtro="TODOS">Todos</button><button data-filtro="PENDENTE">Pendentes</button><button data-filtro="IGNORADO">Ignorados</button><button data-filtro="PRONTO">Autorizados</button></div>
      <div class="mig-tabela-wrap"><table><thead><tr><th>Aluno</th><th>Escola / Data</th><th>Problema</th><th>Decisão</th><th>Ações</th></tr></thead><tbody id="mig-m53-corpo"></tbody></table></div>
      <footer class="mig-engine-versao">Engine de Migração 5.4.0</footer>`;
    const antes=$('mig-simulacao-box')||host.lastElementChild;
    antes.parentNode.insertBefore(box,antes);
    box.querySelectorAll('[data-filtro]').forEach(b=>b.onclick=()=>{box.dataset.filtro=b.dataset.filtro;atualizarPainel();});
    box.querySelector('#mig-m53-salvar-agora').onclick=()=>salvarRascunhoAgora().catch(e=>alert('Falha ao salvar: '+(e.message||e)));
    box.querySelector('#mig-m53-descartar').onclick=descartarRascunho;
  }

  function atualizarPainel() {
    garantirPainel();
    const r=resultado(), box=$('mig-m53-centro'); if(!r||!box)return;
    box.classList.remove('hidden');
    const filtro=box.dataset.filtro||'TODOS';
    const todos=r.processos||[];
    const lista=todos.filter(p=>filtro==='TODOS'||p.status_validacao===filtro);
    const prontos=todos.filter(p=>p.status_validacao==='PRONTO'&&!p.ignorar_migracao).length;
    const ignorados=todos.filter(p=>p.ignorar_migracao).length;
    const pendentes=todos.filter(p=>p.status_validacao==='PENDENTE').length;
    $('mig-m53-resumo').textContent=`${prontos} autorizados · ${ignorados} ignorados · ${pendentes} pendentes`;
    $('mig-m53-corpo').innerHTML=lista.map(p=>`
      <tr class="${p.ignorar_migracao?'mig-m53-ignorado':''}">
        <td><b>${esc(p.aluno_nome)}</b><small>Linha ${esc(p.linha_origem||'-')}</small></td>
        <td>${esc(p.escola_nome_original)}<small>${esc(p.data_solicitacao||'Sem data')}</small></td>
        <td>${(p.inconsistencias||[]).length?(p.inconsistencias||[]).map(i=>`<span class="mig-m53-erro">${esc(i.tipo)}</span>`).join(' '):'<span class="mig-m53-ok">Sem bloqueios</span>'}</td>
        <td><b>${esc(p.decisao_m53||(p.ignorar_migracao?'IGNORAR':p.status_validacao))}</b><small>${(p.auditoria_m53||[]).length} ação(ões) auditada(s)</small></td>
        <td class="mig-m53-acoes">
          <button data-escola="${esc(p.migration_key)}">🏫 Escola</button>
          <button data-datas="${esc(p.migration_key)}">📅 Datas</button>
          ${p.ignorar_migracao?`<button data-restaurar="${esc(p.migration_key)}">↩ Restaurar</button>`:`<button data-ignorar="${esc(p.migration_key)}">🚫 Ignorar</button>`}
          ${p.status_validacao==='PENDENTE'?`<button data-excecao="${esc(p.migration_key)}">✅ Exceção</button>`:''}
        </td>
      </tr>`).join('')||'<tr><td colspan="5">Nenhum processo neste filtro.</td></tr>';
    box.querySelectorAll('[data-escola]').forEach(b=>b.onclick=()=>abrirEscola(b.dataset.escola));
    box.querySelectorAll('[data-datas]').forEach(b=>b.onclick=()=>abrirDatas(b.dataset.datas));
    box.querySelectorAll('[data-ignorar]').forEach(b=>b.onclick=()=>ignorar(b.dataset.ignorar));
    box.querySelectorAll('[data-restaurar]').forEach(b=>b.onclick=()=>restaurar(b.dataset.restaurar));
    box.querySelectorAll('[data-excecao]').forEach(b=>b.onclick=()=>importarMesmoAssim(b.dataset.excecao));

    // Atualiza indicadores visíveis da M4 sem reprocessar a planilha.
    if($('mig-kpi-prontos')) $('mig-kpi-prontos').textContent=prontos;
    if($('mig-kpi-pendentes')) $('mig-kpi-pendentes').textContent=pendentes;
    if($('mig-resumo-validacao')) $('mig-resumo-validacao').textContent=`${prontos} autorizados · ${ignorados} ignorados de ${todos.length}`;
  }

  function iniciar() {
    garantirPainel();
    const inputArquivo=document.getElementById('mig-arquivo');
    inputArquivo?.addEventListener('change',async()=>{hashRascunhoAtual='';});
    setInterval(()=>{
      garantirPainel();
      if(resultado()) {
        atualizarPainel();
        const file=document.getElementById('mig-arquivo')?.files?.[0];
        if(file&&!hashRascunhoAtual){perguntarRetomadaRascunho(file).catch(e=>console.warn('[SIGEE M5.4] Rascunho',e));}
      }
    },1500);
  }

  window.SIGEE_MIGRACAO_AUDITOR_M53={
    versao:VERSAO,atualizar:atualizarPainel,revalidar,
    auditoria:()=>resultado()?.processos?.flatMap(p=>(p.auditoria_m53||[]).map(a=>({...a,migration_key:p.migration_key,aluno:p.aluno_nome})))||[]
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
