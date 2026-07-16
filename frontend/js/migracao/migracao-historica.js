/* SIGEE Enterprise — Migração Histórica M2
   Validação cronológica, normalização, conferência com o SIGEE e simulação.
   NÃO grava no Supabase. */
(function () {
  'use strict';

  const VERSION = 'M3.0.0';
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
    return window.escolas || window.escolasSIGEE || window.listaEscolas || [];
  }
  function listaUsuarios() {
    return window.usuarios || window.usuariosSIGEE || window.listaUsuarios || [];
  }
  function campo(obj, nomes) {
    for (const n of nomes) if (obj && obj[n] != null && texto(obj[n])) return obj[n];
    return '';
  }
  function localizarEscola(codigoMec, nome, nte) {
    const escolas = listaEscolas();
    const mec = normalizar(codigoMec).replace(/\D/g, '');
    let achou = escolas.find(e => normalizar(campo(e,['cod_mec','codigo_mec','mec'])).replace(/\D/g,'') === mec && mec);
    if (!achou) {
      achou = escolas.find(e =>
        normalizar(campo(e,['nome_escola','nome','escola_nome'])) === normalizar(nome) &&
        (!nte || normalizar(campo(e,['nte','nte_nome','nte_id'])) === normalizar(nte))
      );
    }
    return achou || null;
  }
  function localizarUsuario(nome, nte) {
    if (!texto(nome)) return null;
    return listaUsuarios().find(u =>
      normalizar(campo(u,['nome','nome_completo','display_name'])) === normalizar(nome) &&
      (!nte || normalizar(campo(u,['nte','nte_nome','nte_id'])) === normalizar(nte))
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
          <span>SIGEE MIGRATION ENGINE ${VERSION}</span>
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
        <div class="mig-acoes">
          <button id="mig-analisar" type="button">🔎 Ler e validar</button>
          <button id="mig-simular" type="button" disabled>🧪 Simular migração</button>
          <button id="mig-exportar" type="button" disabled>📤 Exportar lote JSON</button>
        </div>
      </div>

      <div id="mig-status" class="mig-status">Aguardando seleção do arquivo.</div>

      <div id="mig-kpis" class="mig-kpis mig-kpis-6 hidden">
        <article><span>Processos</span><strong id="mig-kpi-processos">0</strong></article>
        <article><span>Prontos</span><strong id="mig-kpi-prontos">0</strong></article>
        <article><span>Pendentes</span><strong id="mig-kpi-pendentes">0</strong></article>
        <article><span>Eventos válidos</span><strong id="mig-kpi-eventos">0</strong></article>
        <article><span>Escolas localizadas</span><strong id="mig-kpi-escolas">0</strong></article>
        <article><span>Técnicos localizados</span><strong id="mig-kpi-tecnicos">0</strong></article>
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
    sec.querySelector('#mig-analisar').addEventListener('click', () => {
      if (!input.files || !input.files[0]) return atualizarStatus('Selecione uma planilha antes de continuar.', 'erro');
      analisarArquivo(input.files[0]);
    });
    sec.querySelector('#mig-simular').addEventListener('click', simularMigracao);
    sec.querySelector('#mig-exportar').addEventListener('click', exportarResultado);
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
      document.getElementById('mig-exportar').disabled = false;
    } catch (e) {
      console.error('[SIGEE Migração M2]', e);
      atualizarStatus('Falha ao analisar a planilha: ' + (e.message || e), 'erro');
    }
  }
  function sheetJson(wb, name) {
    const ws = wb.Sheets[name];
    return ws ? XLSX.utils.sheet_to_json(ws, { defval: null, raw: true }) : [];
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
      const nte = texto(r['LOCAL ARQUIVO']).match(/NTE[-\s]?\d+/i)?.[0] || '';
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
      const add = (etapa, evento, dataOriginal, resp, status, aba) => {
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
          valido_cronologia: classificacaoData === 'REAL' && !futuro
        };
        ev.push(item);
        eventos.push({ aluno_nome:nome, escola_nome:escola, ...item });
      };

      add('Desarquivamento','Nova Solicitação',r['DATA ENVIO'],'','',origemNome);
      add('Desarquivamento','Documento Recebido',r['DATA RETORNO'],'',r['SITUAÇÃO'],origemNome);
      if (imp) add('Desarquivamento','Documento Recebido / Triagem',imp['Data de Chegada'] || imp['DATA IMPRESSÃO'],'',imp.STATUS,'01 - IMPRESSÃO');
      if (ana) {
        add('Análise','Entrada em Análise',ana['ENVIO ANÁLISE'],ana.ANALISTA,ana.STATUS,'02 - ANÁLISE');
        add('Análise','Saída da Análise',ana.RETORNO,ana.ANALISTA,ana.STATUS,'02 - ANÁLISE');
      }
      if (pen) add('Pendência','Pendência registrada',pen['Data de Retorno'],'',pen.STATUS,'03 - PENDÊNCIA');
      if (dig) {
        add('Digitação','Entrada em Digitação',dig['data de envio'],dig.DIGITADOR,dig.STATUS,'04- DIGITAÇÃO');
        add('Digitação','Saída da Digitação',dig['data de retorno'],dig.DIGITADOR,dig.STATUS,'04- DIGITAÇÃO');
      }
      if (con) {
        const resp = con['Conferente 01'] || con['DIG.'];
        add('Conferência','Entrada em Conferência',con['Data envio'],resp,con.STATUS,'05 - CONFERENCIA');
        add('Conferência','Saída da Conferência',con['Data Retorno'],resp,con.STATUS,'05 - CONFERENCIA');
      }
      if (ass) {
        add('Assinatura','Envio para Assinatura',ass['ENVIO ASSINATURA'],'',ass['Situação'],'06 - ASSINATURA');
        add('Assinatura','Retorno da Assinatura',ass['RETORNO ASSINATURA'],'',ass['Situação'],'06 - ASSINATURA');
      }
      if (def) {
        add('Aguardando Retirada','Deferido',def['DATA ASSINATURA'],'',def.STATUS,'07 - DEFERIDO');
        if (normalizar(def.STATUS).includes('RETIR')) add('Retirado','Documento Retirado',def['DATA DA RETIRADA'],'',def.STATUS,'07 - DEFERIDO');
      }

      const validos = ev.filter(e => e.valido_cronologia && e.data).sort((a,b) => a.data.localeCompare(b.data));
      let maiorOrdem = 0;
      let ultimoEvento = validos[0] || null;
      validos.forEach(e => {
        const ordem = ORDEM_ETAPAS[e.etapa] || 0;
        if (ordem + 10 < maiorOrdem) {
          addIssue('REGRESSAO_CRONOLOGICA', 'Alta', `${e.evento} (${e.data}) aparece após uma etapa mais avançada`, e.aba);
        }
        maiorOrdem = Math.max(maiorOrdem, ordem);
        if (!ultimoEvento || e.data > ultimoEvento.data || (e.data === ultimoEvento.data && ordem >= (ORDEM_ETAPAS[ultimoEvento.etapa] || 0))) {
          ultimoEvento = e;
        }
      });

      if (ass) {
        const envio = excelData(ass['ENVIO ASSINATURA']);
        const retorno = excelData(ass['RETORNO ASSINATURA']);
        if (envio && retorno && retorno < envio) {
          addIssue('ORDEM_DATAS', 'Alta', `Retorno da assinatura (${iso(retorno)}) anterior ao envio (${iso(envio)})`, '06 - ASSINATURA');
        }
      }

      const codigoMec = texto(r['COD. MEC']);
      if (!codigoMec) addIssue('SEM_COD_MEC', 'Média', 'Código MEC ausente', origemNome);

      const responsavelHistorico = nomeProprio(
        [...validos].reverse().find(e => texto(e.responsavel))?.responsavel || ''
      );
      const escolaSIGEE = localizarEscola(codigoMec, escola, nte);
      const tecnicoSIGEE = localizarUsuario(responsavelHistorico, nte);

      if (!escolaSIGEE) addIssue('ESCOLA_NAO_LOCALIZADA', 'Alta', 'Escola não localizada no catálogo atual do SIGEE', origemNome);
      if (responsavelHistorico && !tecnicoSIGEE) addIssue('TECNICO_NAO_LOCALIZADO', 'Média', `Responsável histórico "${responsavelHistorico}" não localizado no cadastro`, 'Usuários SIGEE');

      // Regra oficial de equivalência Planilha → SIGEE:
      // Documento Recebido encerra o Desarquivamento e posiciona o processo em Análise.
      let etapaAtual = 'Desarquivamento';
      if (recebimento || imp) etapaAtual = 'Análise';
      if (ana) etapaAtual = normalizar(ana.STATUS).includes('PEND') ? 'Pendência' : 'Análise';
      if (pen && ['AGUARDANDO','PENDENCIA'].includes(normalizar(pen.STATUS))) etapaAtual = 'Pendência';
      if (dig) etapaAtual = 'Digitação';
      if (con) etapaAtual = 'Conferência';
      if (ass) etapaAtual = 'Assinatura';
      if (def) etapaAtual = normalizar(def.STATUS).includes('RETIR') ? 'Retirado' : 'Aguardando Retirada';

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
        linha_origem: linhaBase + 2,
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
        tecnico_localizado: !responsavelHistorico || !!tecnicoSIGEE,
        quantidade_datas_reais: ev.filter(e => e.tipo_data === 'REAL').length,
        quantidade_datas_ficticias: ev.filter(e => e.tipo_data === 'FICTICIA').length,
        possui_data_ficticia: ev.some(e => e.tipo_data === 'FICTICIA'),
        status_validacao: procIssues.some(x => x.gravidade === 'Alta') ? 'PENDENTE' : 'PRONTO',
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
      `<tr>
        <td>${html(p.aluno_nome)}</td>
        <td>${html(p.escola_nome_original)}</td>
        <td>${html(p.data_solicitacao)}</td>
        <td>${html(p.etapa_atual)}</td>
        <td>${html(p.tecnico_responsavel_historico)}</td>
        <td><span class="mig-badge ${p.escola_localizada?'ok':'erro'}">${p.escola_localizada?'LOCALIZADA':'NÃO LOCALIZADA'}</span></td>
        <td><span class="mig-badge ${p.tecnico_localizado?'ok':'atencao'}">${p.tecnico_localizado?'LOCALIZADO':'REVISAR'}</span></td>
        <td>
          <span class="mig-badge ${p.status_validacao==='PRONTO'?'ok':'pendente'}">${p.status_validacao}</span>
          <span class="mig-badge migrado">MIGRADO</span>
          ${p.possui_data_ficticia ? '<span class="mig-badge ficticia">DATA FICTÍCIA</span>' : ''}
        </td>
      </tr>`).join('');

    document.getElementById('mig-inconsistencias').innerHTML = r.inconsistencias.length
      ? r.inconsistencias.slice(0,800).map(x =>
        `<tr><td>${html(x.aluno)}</td><td>${html(x.tipo)}</td><td><span class="mig-gravidade ${normalizar(x.gravidade)==='ALTA'?'alta':'media'}">${html(x.gravidade)}</span></td><td>${html(x.descricao)}</td><td>${html(x.origem)}</td></tr>`
      ).join('')
      : '<tr><td colspan="5">Nenhuma inconsistência identificada.</td></tr>';

    document.getElementById('mig-simulacao-box').classList.add('hidden');
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
        motivo: 'Pendência de validação'
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
    resultado: () => resultadoAtual
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();