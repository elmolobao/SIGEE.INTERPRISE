/*
  SIGEE - Hotfix Sprint 01
  Ajustes: Dashboard por perfil/NTE, filtro TODOS, carregamento completo de escolas/processos,
  estabilidade do Técnico e edição limitada de escola para Técnico.
  Carregar este arquivo APÓS js/app.js.
*/
(function(){
  'use strict';

  const SUPABASE_URL = 'https://ckxbvsfjsknbgpfpxcyy.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreGJ2c2Zqc2tuYmdwZnB4Y3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc4MjUsImV4cCI6MjA5ODc3MzgyNX0.ecJr_MYR9GPnaYMZ3V6kgeed7uGtg-vQ4THpdwAtTxk';
  const PAGE_SIZE = 1000;

  let carregandoCompleto = false;
  let carregamentoCompletoExecutado = false;

  function txt(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
  function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function setText(id, valor){ const el = document.getElementById(id); if(el) el.innerText = valor; }

  function perfilUsuario(){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    return up(u && u.perfil);
  }
  function usuarioAtual(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
  function isGlobalUser(){ const p = perfilUsuario(); return p === 'MASTER' || p === 'SEC'; }
  function isTecnico(){ const p = perfilUsuario(); return p === 'TECNICO' || p === 'TECNICO' || p === 'TÉCNICO'; }

  function nteNumero(valor){
    const t = up(valor);
    if(t.includes('SEC') || t.includes('TODOS') || t.includes('GLOBAL')) return 'GLOBAL';
    const m = t.match(/NTE\D*(\d{1,2})/);
    if(m) return String(Number(m[1])).padStart(2,'0');
    const n = Number(t);
    return n ? String(n).padStart(2,'0') : '';
  }
  function nomeNtePorId(id){
    const n = Number(id);
    if(!n) return '';
    const lista = (typeof LISTA_OFICIAL_27_NTES !== 'undefined' && Array.isArray(LISTA_OFICIAL_27_NTES)) ? LISTA_OFICIAL_27_NTES : [];
    return lista.find(x => nteNumero(x) === String(n).padStart(2,'0')) || ('NTE-' + String(n).padStart(2,'0'));
  }
  function nteDoRegistro(obj){
    return nteNumero(obj && (obj.nte || obj.nte_nome || obj.nte_vinculado || obj.nte_id || obj.nucleo || obj.territorio));
  }
  function nteDoUsuario(){
    const u = usuarioAtual();
    return nteNumero(u && (u.nte || u.nte_nome || u.nte_id || u.grupo));
  }
  function escopoDashboard(){
    if(!isGlobalUser()) return nteDoUsuario();
    const select = document.getElementById('filtro-dashboard-nte');
    const val = up(select && select.value);
    if(!val || val === 'GLOBAL' || val === 'TODOS' || val.includes('TODOS')) return 'GLOBAL';
    return nteNumero(select.value);
  }
  function filtrarPorEscopo(lista, escopo){
    if(escopo === 'GLOBAL') return Array.isArray(lista) ? lista.slice() : [];
    return (Array.isArray(lista) ? lista : []).filter(x => nteDoRegistro(x) === escopo);
  }

  function configurarFiltroDashboard(){
    const box = document.getElementById('box-filtro-dashboard-master');
    const select = document.getElementById('filtro-dashboard-nte');
    if(!box || !select) return;
    if(isGlobalUser()){
      box.classList.remove('hidden');
      const atual = select.value || 'GLOBAL';
      select.innerHTML = '<option value="GLOBAL">TODOS</option>';
      const lista = (typeof LISTA_OFICIAL_27_NTES !== 'undefined' && Array.isArray(LISTA_OFICIAL_27_NTES)) ? LISTA_OFICIAL_27_NTES : [];
      lista.forEach(nte => {
        const opt = document.createElement('option');
        opt.value = nte;
        opt.textContent = nte;
        select.appendChild(opt);
      });
      select.value = (atual && atual !== 'SEC') ? atual : 'GLOBAL';
      select.onchange = function(){ window.carregarDadosDashboardReal && window.carregarDadosDashboardReal(); };
    } else {
      box.classList.add('hidden');
      select.innerHTML = '<option value="GLOBAL">TODOS</option>';
    }
  }

  function getClient(){
    if(window.__SIGEE_SPRINT01_CLIENT) return window.__SIGEE_SPRINT01_CLIENT;
    if(window.supabase && window.supabase.createClient){
      window.__SIGEE_SPRINT01_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return window.__SIGEE_SPRINT01_CLIENT;
    }
    if(typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE();
    return null;
  }

  async function readAll(table){
    const client = getClient();
    if(!client) return [];
    let out = [], start = 0;
    while(true){
      const end = start + PAGE_SIZE - 1;
      const {data, error} = await client.from(table).select('*').range(start, end);
      if(error) throw error;
      const rows = data || [];
      out = out.concat(rows);
      if(rows.length < PAGE_SIZE) break;
      start += PAGE_SIZE;
    }
    return out;
  }

  function mapEscola(e){
    const nteNome = e.nte || e.nte_nome || nomeNtePorId(e.nte_id) || '';
    return {
      ...e,
      id: e.id,
      cod_mec: txt(e.cod_mec || e.mec || e.codigo_mec),
      nome: txt(e.nome || e.nome_escola || e.escola || e.instituicao).toUpperCase(),
      nome_escola: txt(e.nome_escola || e.nome || e.escola || e.instituicao).toUpperCase(),
      municipio: txt(e.municipio || e.cidade).toUpperCase(),
      nte: nteNome,
      nte_id: e.nte_id || Number(nteNumero(nteNome)) || null,
      dependencia: txt(e.dependencia || e.dependencia_adm || e.dep_adm || 'Estadual'),
      dependencia_adm: txt(e.dependencia_adm || e.dependencia || e.dep_adm || 'Estadual'),
      situacao: txt(e.situacao || e.situacao_funcional || 'Extinta'),
      situacao_funcional: txt(e.situacao_funcional || e.situacao || 'Extinta'),
      acervo: txt(e.acervo || e.status_acervo || 'Recolhido'),
      status_acervo: txt(e.status_acervo || e.acervo || 'Recolhido'),
      local_acervo: txt(e.local_acervo || e.local || '')
    };
  }
  function mapProcesso(p){
    return {
      ...p,
      id: p.id,
      aluno: txt(p.aluno || p.aluno_nome || p.nome_solicitante).toUpperCase(),
      aluno_nome: txt(p.aluno_nome || p.aluno || p.nome_solicitante).toUpperCase(),
      escola: txt(p.escola || p.escola_nome || p.nome_escola).toUpperCase(),
      escola_nome: txt(p.escola_nome || p.escola || p.nome_escola).toUpperCase(),
      documento: txt(p.documento || p.documento_tipo || p.documento_solicitado || 'Histórico'),
      etapa: txt(p.etapa || p.etapa_atual || p.fase_atual || 'Desarquivamento'),
      etapa_atual: txt(p.etapa_atual || p.etapa || p.fase_atual || 'Desarquivamento'),
      nte: txt(p.nte || p.nte_nome || nomeNtePorId(p.nte_id) || ''),
      municipio: txt(p.municipio || ''),
      data_etapa_atual: p.data_etapa_atual || p.created_at || p.criado_em || new Date().toISOString()
    };
  }

  async function carregarDadosCompletos(silencioso=true){
    if(carregandoCompleto) return false;
    carregandoCompleto = true;
    try{
      const [escolas, processos, solicitacoes] = await Promise.all([
        readAll('escolas_sigee').catch(e => { console.error('Erro escolas_sigee', e); return null; }),
        readAll('processos').catch(e => { console.error('Erro processos', e); return null; }),
        readAll('solicitacoes_sigee').catch(e => { console.error('Erro solicitacoes_sigee', e); return null; })
      ]);
      if(Array.isArray(escolas)){
        window.escolasDB = escolas.map(mapEscola).filter(e => e.cod_mec || e.nome);
        try{ escolasDB = window.escolasDB; }catch(e){}
      }
      let listaProcessos = [];
      if(Array.isArray(processos)) listaProcessos = processos.map(mapProcesso).filter(p => p.aluno || p.escola);
      if(!listaProcessos.length && Array.isArray(solicitacoes)) listaProcessos = solicitacoes.map(mapProcesso).filter(p => p.aluno || p.escola);
      if(listaProcessos.length || Array.isArray(processos)){
        window.processosDB = listaProcessos;
        try{ processosDB = window.processosDB; }catch(e){}
      }
      carregamentoCompletoExecutado = true;
      window.sigEESupabaseOnline = true;
      try{ sigEESupabaseOnline = true; }catch(e){}
      configurarFiltroDashboard();
      try{ window.carregarDadosDashboardReal(); }catch(e){}
      try{ window.renderizarListaEscolasBufferMemoria(); }catch(e){}
      try{ window.carregarEContarProcessosHorizontais && window.carregarEContarProcessosHorizontais(); }catch(e){}
      return true;
    }catch(err){
      console.error('SIGEE Sprint01 - erro no carregamento completo', err);
      if(!silencioso) alert('Erro ao carregar dados completos do Supabase: ' + (err.message || err));
      return false;
    }finally{
      carregandoCompleto = false;
    }
  }
  window.SIGEE_SPRINT01_CARREGAR_COMPLETO = carregarDadosCompletos;

  window.carregarDadosDashboardReal = function(){
    configurarFiltroDashboard();
    const escopo = escopoDashboard();
    const escolas = filtrarPorEscopo(window.escolasDB || (typeof escolasDB !== 'undefined' ? escolasDB : []), escopo);
    const processos = filtrarPorEscopo(window.processosDB || (typeof processosDB !== 'undefined' ? processosDB : []), escopo);
    const usuarios = window.usuariosDB || (typeof usuariosDB !== 'undefined' ? usuariosDB : []);

    setText('dash-escolas', escolas.length);
    setText('dash-acervos', escolas.filter(e => up(e.status_acervo || e.acervo).includes('RECOLHIDO') && !up(e.status_acervo || e.acervo).includes('NAO') && !up(e.status_acervo || e.acervo).includes('NÃO')).length);
    setText('dash-estaduais', escolas.filter(e => up(e.dependencia || e.dependencia_adm).includes('ESTAD')).length);
    setText('dash-municipios', new Set(escolas.map(e => up(e.municipio)).filter(Boolean)).size);
    setText('dash-usuarios', isGlobalUser() ? usuarios.length : filtrarPorEscopo(usuarios, escopo).length);

    const conta = etapa => processos.filter(p => up(p.etapa || p.etapa_atual) === up(etapa)).length;
    setText('dash-proc-desarquivamento', conta('Desarquivamento'));
    setText('dash-proc-analise', conta('Análise'));
    setText('dash-proc-pendencia', conta('Pendência'));
    setText('dash-proc-digitacao', conta('Digitação'));
    setText('dash-proc-conferencia', conta('Conferência'));
    setText('dash-proc-assinatura', conta('Assinatura'));
    setText('dash-proc-aguardando', conta('Aguardando Retirada'));
    setText('dash-proc-retirado', conta('Retirado'));
  };
  try{ carregarDadosDashboardReal = window.carregarDadosDashboardReal; }catch(e){}

  function dadosEscolasVisiveis(){
    const lista = window.escolasDB || (typeof escolasDB !== 'undefined' ? escolasDB : []);
    return filtrarPorEscopo(lista, isGlobalUser() ? 'GLOBAL' : nteDoUsuario());
  }
  function badge(valor, tipo){
    const v = up(valor);
    const ok = tipo === 'situacao' ? v.includes('ATIVA') : (v.includes('RECOLHIDO') && !v.includes('NAO') && !v.includes('NÃO'));
    return `<span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${ok ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}">${txt(valor || '-')}</span>`;
  }

  window.renderizarListaEscolasBufferMemoria = function(){
    const corpo = document.getElementById('tabela-escolas-corpo');
    if(!corpo) return;
    corpo.innerHTML = '';
    let lista = dadosEscolasVisiveis();
    const busca = up(document.getElementById('busca-escola') && document.getElementById('busca-escola').value);
    if(busca){
      lista = lista.filter(e => up([e.cod_mec, e.nome, e.nome_escola, e.municipio, e.nte, e.dependencia, e.situacao, e.status_acervo, e.local_acervo].join(' ')).includes(busca));
    }
    const info = document.getElementById('info-quantidade-escolas-carregadas');
    if(info) info.innerText = `Exibindo: ${lista.length} registros | Banco: ${carregamentoCompletoExecutado ? 'Supabase completo' : 'Supabase'}`;

    const porPagina = (typeof totalPorPaginaEscola !== 'undefined' ? totalPorPaginaEscola : 8);
    try{ if(typeof paginaEscolaAtual === 'undefined') window.paginaEscolaAtual = 1; }catch(e){}
    let pagina = (typeof paginaEscolaAtual !== 'undefined' ? paginaEscolaAtual : (window.paginaEscolaAtual || 1));
    const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
    if(pagina > paginas) pagina = paginas;
    if(pagina < 1) pagina = 1;
    try{ paginaEscolaAtual = pagina; }catch(e){ window.paginaEscolaAtual = pagina; }
    const paginadas = lista.slice((pagina - 1) * porPagina, (pagina - 1) * porPagina + porPagina);

    paginadas.forEach(e => {
      const id = e.id || e.cod_mec;
      corpo.insertAdjacentHTML('beforeend', `
        <tr class="hover:bg-white/10 text-[11px] text-white border-b border-cyan-400/10">
          <td class="p-3 font-mono font-bold">${txt(e.cod_mec)}</td>
          <td class="p-3 font-bold uppercase text-white">${txt(e.nome || e.nome_escola)}</td>
          <td class="p-3 uppercase font-medium text-white/90">${txt(e.municipio)}</td>
          <td class="p-3 font-semibold text-white/80">${txt(e.nte || nomeNtePorId(e.nte_id))}<br><span class="text-[9px] bg-white/10 font-bold px-1 rounded">${txt(e.dependencia || e.dependencia_adm)}</span></td>
          <td class="p-3">${badge(e.situacao || e.situacao_funcional, 'situacao')}</td>
          <td class="p-3 font-bold">${badge(e.status_acervo || e.acervo, 'acervo')}</td>
          <td class="p-3 text-center"><button onclick="abrirModalEditarEscolaV37('${id}')" class="bg-cyan-700/60 hover:bg-cyan-600 text-white px-2 py-1 rounded-lg font-bold text-[10px]">✏️ Alterar</button></td>
        </tr>`);
    });
    setText('txt-escola-paginacao', `Página ${pagina} de ${paginas}`);
    const ant = document.getElementById('btn-escola-anterior'); if(ant) ant.disabled = pagina <= 1;
    const prox = document.getElementById('btn-escola-proxima'); if(prox) prox.disabled = pagina >= paginas;
  };
  try{ renderizarListaEscolasBufferMemoria = window.renderizarListaEscolasBufferMemoria; }catch(e){}

  const oldAbrirEditarEscola = window.abrirModalEditarEscolaV37 || window.abrirModalEditarEscola;
  window.abrirModalEditarEscolaV37 = function(id){
    if(typeof oldAbrirEditarEscola === 'function') oldAbrirEditarEscola(id);
    setTimeout(function(){
      const tecnico = isTecnico();
      const camposBloqueados = ['escola-form-mec','escola-form-nome','escola-form-municipio','escola-form-nte','escola-form-dependencia'];
      const camposLiberados = ['escola-form-situacao','escola-form-acervo','escola-form-local-acervo'];
      camposBloqueados.concat(camposLiberados).forEach(cid => {
        const el = document.getElementById(cid);
        if(!el) return;
        if(tecnico && camposBloqueados.includes(cid)){
          el.readOnly = true;
          el.disabled = el.tagName === 'SELECT';
          el.classList.add('bg-gray-200','opacity-70');
        }else{
          el.readOnly = false;
          el.disabled = false;
          el.classList.remove('bg-gray-200','opacity-70');
        }
      });
    }, 50);
  };
  try{ abrirModalEditarEscolaV37 = window.abrirModalEditarEscolaV37; }catch(e){}

  const oldNav = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  window.navegar = function(aba){
    const r = oldNav ? oldNav.apply(this, arguments) : undefined;
    setTimeout(function(){
      configurarFiltroDashboard();
      if(!carregamentoCompletoExecutado && (aba === 'painel' || aba === 'escolas' || aba === 'processos')) carregarDadosCompletos(true);
      if(aba === 'painel') window.carregarDadosDashboardReal();
      if(aba === 'escolas') window.renderizarListaEscolasBufferMemoria();
    }, 80);
    return r;
  };
  try{ navegar = window.navegar; }catch(e){}

  const oldHandleLogin = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(oldHandleLogin && !window.__SIGEE_SPRINT01_LOGIN_PATCH){
    window.__SIGEE_SPRINT01_LOGIN_PATCH = true;
    window.handleLogin = async function(event){
      const r = await oldHandleLogin.apply(this, arguments);
      setTimeout(function(){
        configurarFiltroDashboard();
        carregarDadosCompletos(true);
      }, 300);
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){ configurarFiltroDashboard(); carregarDadosCompletos(true); }, 600);
  });
})();
