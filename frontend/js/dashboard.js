/* ================================================================
   SIGEE Enterprise - Sprint 2.1 Núcleo/Dashboard Estável
   Objetivo: consolidar a função global de Dashboard e evitar
   sobrescritas/hotfixes paralelos. Deve ser a ÚLTIMA definição.
   ================================================================ */
(function(){
  'use strict';
  if (window.__SIGEE_DASHBOARD_ESTAVEL_INSTALADO__) return;
  window.__SIGEE_DASHBOARD_ESTAVEL_INSTALADO__ = true;

  const texto = (v) => (v === null || v === undefined) ? '' : String(v);
  const normalizar = (v) => texto(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
  const soDigitos = (v) => texto(v).match(/\d+/)?.[0] || '';
  const nteLabel = (id) => id ? `NTE ${String(id).padStart(2,'0')}` : '';

  function perfilAtual(){
    const p = normalizar(window.usuarioLogado?.perfil);
    if (p === 'MASTER') return 'Master';
    if (p === 'SEC') return 'SEC';
    if (p === 'ADMINISTRADOR') return 'Administrador';
    if (p === 'TECNICO') return 'Tecnico';
    if (p === 'CONSULTA') return 'Consulta';
    return texto(window.usuarioLogado?.perfil || '');
  }

  function isGlobal(){
    const p = perfilAtual();
    return p === 'Master' || p === 'SEC';
  }

  function nteIdUsuario(){
    const u = window.usuarioLogado || {};
    if (u.nte_id !== null && u.nte_id !== undefined && texto(u.nte_id) !== '') return Number(u.nte_id);
    return Number(soDigitos(u.nte || u.grupo || u.nte_nome || '')) || null;
  }

  function nteTextoUsuario(){
    const id = nteIdUsuario();
    return id ? nteLabel(id) : texto(window.usuarioLogado?.nte || window.usuarioLogado?.grupo || '');
  }

  function itemNteId(item){
    if (!item) return null;
    if (item.nte_id !== null && item.nte_id !== undefined && texto(item.nte_id) !== '') return Number(item.nte_id);
    return Number(soDigitos(item.nte || item.nte_nome || item.grupo || '')) || null;
  }

  function mesmoNteItem(item, alvo){
    const alvoId = Number(alvo) || Number(soDigitos(alvo));
    const itemId = itemNteId(item);
    if (alvoId && itemId) return itemId === alvoId;
    return normalizar(item?.nte).replace(/\s/g,'') === normalizar(alvo).replace(/\s/g,'');
  }

  function valorFiltro(){
    const select = document.getElementById('filtro-dashboard-nte');
    return texto(select?.value || window.filtroDashboardNteAtualSIGEE || 'TODOS');
  }

  function filtrarAbrangencia(lista){
    const arr = Array.isArray(lista) ? lista : [];
    if (isGlobal()) {
      const filtro = valorFiltro();
      if (!filtro || ['GLOBAL','TODOS','SEC - TODOS OS NTES','SEC - TODOS OS NTEs'].includes(filtro)) return arr;
      return arr.filter(item => mesmoNteItem(item, filtro));
    }
    const id = nteIdUsuario();
    if (id) return arr.filter(item => itemNteId(item) === id);
    const nte = nteTextoUsuario();
    return arr.filter(item => mesmoNteItem(item, nte));
  }

  function setText(id, valor){
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function acervoRecolhido(e){
    const v = normalizar(e?.status_acervo || e?.acervo || '');
    return v.includes('RECOLHIDO');
  }

  function dependenciaEstadual(e){
    return normalizar(e?.dependencia_adm || e?.dependencia || '').includes('ESTADUAL');
  }

  function etapa(p){
    return normalizar(p?.etapa || p?.etapa_atual || p?.fase_atual || '');
  }

  function carregarFiltroMaster(){
    const box = document.getElementById('box-filtro-dashboard-master');
    const select = document.getElementById('filtro-dashboard-nte');
    if (!box || !select || !window.usuarioLogado) return;

    if (!isGlobal()) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    const anterior = valorFiltro();
    const ntesSet = new Set();
    [...(window.escolasDB || []), ...(window.processosDB || [])].forEach(item => {
      const id = itemNteId(item);
      if (id) ntesSet.add(id);
    });

    select.innerHTML = '<option value="TODOS">TODOS</option>';
    [...ntesSet].sort((a,b)=>a-b).forEach(id => {
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = nteLabel(id);
      select.appendChild(opt);
    });
    select.value = [...select.options].some(o => o.value === anterior) ? anterior : 'TODOS';
    window.filtroDashboardNteAtualSIGEE = select.value;
    select.onchange = function(){
      window.filtroDashboardNteAtualSIGEE = this.value;
      window.carregarDadosDashboardReal();
    };
  }

  function atualizarIndicadoresTecnicos(processos){
    const topBox = document.getElementById('dash-tec-top-escolas');
    if (topBox) {
      const mapa = {};
      processos.forEach(p => {
        const nome = texto(p.escola || p.escola_nome || p.nome_escola || 'NÃO INFORMADA').toUpperCase();
        if (!mapa[nome]) mapa[nome] = { nome, nte: p.nte || '', qtd: 0 };
        mapa[nome].qtd++;
      });
      const top = Object.values(mapa).sort((a,b)=>b.qtd-a.qtd).slice(0,5);
      topBox.innerHTML = top.length ? top.map((x,i)=>`<div class="flex justify-between gap-2 border-b border-gray-100 py-1"><span>${i+1}. ${x.nome}<br><small class="text-gray-400">${x.nte || '-'}</small></span><strong>${x.qtd}</strong></div>`).join('') : 'Sem dados';
    }
    setText('dash-tec-media-entrega', '0 dias');
    setText('dash-tec-media-pedidos-dia', processos.length ? String(processos.length).replace('.', ',') : '0');
    setText('dash-tec-media-pasta-dia', '0');
  }

  function carregarDadosDashboardReal(){
    if (!window.usuarioLogado) return;
    carregarFiltroMaster();

    const escolas = filtrarAbrangencia(window.escolasDB || []);
    const processos = filtrarAbrangencia(window.processosDB || []);

    setText('dash-escolas', escolas.length);
    setText('dash-acervos', escolas.filter(acervoRecolhido).length);
    setText('dash-estaduais', escolas.filter(dependenciaEstadual).length);
    setText('dash-municipios', new Set(escolas.map(e => normalizar(e.municipio)).filter(Boolean)).size);
    setText('dash-usuarios', Array.isArray(window.usuariosDB) ? window.usuariosDB.length : 0);

    const mapaEtapas = {
      'dash-proc-desarquivamento': ['DESARQUIVAMENTO'],
      'dash-proc-analise': ['ANALISE'],
      'dash-proc-pendencia': ['PENDENCIA'],
      'dash-proc-digitacao': ['DIGITACAO'],
      'dash-proc-conferencia': ['CONFERENCIA'],
      'dash-proc-assinatura': ['ASSINATURA'],
      'dash-proc-aguardando': ['AGUARDANDO RETIRADA','DEFERIDO'],
      'dash-proc-retirado': ['RETIRADO']
    };
    Object.entries(mapaEtapas).forEach(([id, nomes]) => setText(id, processos.filter(p => nomes.includes(etapa(p))).length));
    atualizarIndicadoresTecnicos(processos);
  }

  let timer = null;
  function carregarDashboardDebounced(){
    clearTimeout(timer);
    timer = setTimeout(carregarDadosDashboardReal, 30);
  }

  window.inicializarFiltroDashboardMasterSIGEE = carregarFiltroMaster;
  window.carregarDadosDashboardReal = carregarDashboardDebounced;
  window.carregarDadosDashboardRealImediato = carregarDadosDashboardReal;
  window.atualizarDashboardTecnicoSIGEE = function(proc){ atualizarIndicadoresTecnicos(Array.isArray(proc) ? proc : []); };

  const navAnterior = window.navegar;
  if (!window.__SIGEE_NAV_DASHBOARD_ESTAVEL__) {
    window.__SIGEE_NAV_DASHBOARD_ESTAVEL__ = true;
    window.navegar = function(aba){
      const ret = typeof navAnterior === 'function' ? navAnterior.apply(this, arguments) : undefined;
      if (aba === 'painel') carregarDashboardDebounced();
      return ret;
    };
    try { navegar = window.navegar; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', function(){
    if (window.usuarioLogado) carregarDashboardDebounced();
  });
})();
