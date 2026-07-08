/**
 * SIGEE Enterprise 2.0 - Entrega 5C
 * Módulo: Dashboard
 * Objetivo: centralizar e estabilizar a renderização do Dashboard sem alterar banco, layout ou app.js.
 * Observação: este módulo faz override seguro das funções globais após o carregamento do app.js.
 */

(function () {
  'use strict';

  function texto(v) {
    return (v === null || v === undefined) ? '' : String(v);
  }

  function normalizar(v) {
    return texto(v)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function perfilAtual() {
    const u = window.usuarioLogado || {};
    if (typeof window.perfilCanonicoSIGEE === 'function') return window.perfilCanonicoSIGEE(u.perfil);
    const p = normalizar(u.perfil);
    if (p === 'TECNICO' || p === 'TÉCNICO') return 'Tecnico';
    if (p === 'ADMINISTRADOR') return 'Administrador';
    if (p === 'CONSULTA') return 'Consulta';
    if (p === 'SEC') return 'SEC';
    if (p === 'MASTER') return 'Master';
    return texto(u.perfil);
  }

  function isGlobal() {
    const p = perfilAtual();
    return p === 'Master' || p === 'SEC';
  }

  function nteUsuario() {
    const u = window.usuarioLogado || {};
    return texto(u.nte || u.grupo || u.nte_nome || '').trim();
  }

  function mesmoNte(a, b) {
    return normalizar(a).replace(/\s/g, '') === normalizar(b).replace(/\s/g, '');
  }

  function valorNteFiltroDashboard() {
    const select = document.getElementById('filtro-dashboard-nte');
    if (select && select.value) return select.value;
    return window.filtroDashboardNteAtualSIGEE || 'GLOBAL';
  }

  function filtrarPorAbrangencia(lista, campoNte) {
    const arr = Array.isArray(lista) ? lista : [];
    if (isGlobal()) {
      const filtro = valorNteFiltroDashboard();
      if (!filtro || filtro === 'GLOBAL') return arr;
      return arr.filter(item => mesmoNte(item && item[campoNte], filtro));
    }
    const nte = nteUsuario();
    return arr.filter(item => mesmoNte(item && item[campoNte], nte));
  }

  function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor;
  }

  function acervoRecolhido(escola) {
    const raw = escola && (escola.status_acervo || escola.acervo || '');
    const v = normalizar(raw);
    return v === 'RECOLHIDO' || v.includes('RECOLHIDO');
  }

  function dependenciaEstadual(escola) {
    const raw = escola && (escola.dependencia_adm || escola.dependencia || '');
    return normalizar(raw).includes('ESTADUAL');
  }

  function obterEtapaProcesso(p) {
    return texto(p && (p.etapa || p.etapa_atual || p.fase_atual || '')).trim();
  }

  function dataProcesso(p) {
    return p && (p.data_etapa_atual || p.created_at || p.criado_em || p.data_criacao || '');
  }

  function diasEntreHoje(data) {
    if (!data) return 0;
    let d;
    if (typeof data === 'string' && data.includes('/')) {
      const partes = data.split('/');
      if (partes.length === 3) d = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
    } else {
      d = new Date(data);
    }
    if (!d || isNaN(d.getTime())) return 0;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return Math.max(0, Math.floor((hoje.getTime() - d.getTime()) / 86400000));
  }

  function inicializarFiltroDashboardMasterSIGEE() {
    const box = document.getElementById('box-filtro-dashboard-master');
    const select = document.getElementById('filtro-dashboard-nte');
    if (!box || !select || !window.usuarioLogado) return;

    if (!isGlobal()) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    const valorAnterior = select.value || window.filtroDashboardNteAtualSIGEE || 'GLOBAL';
    select.innerHTML = '<option value="GLOBAL">GLOBAL - TODOS OS NTEs</option>';

    let ntes = [];
    if (Array.isArray(window.LISTA_OFICIAL_27_NTES) && window.LISTA_OFICIAL_27_NTES.length) {
      ntes = window.LISTA_OFICIAL_27_NTES;
    } else {
      const escolas = Array.isArray(window.escolasDB) ? window.escolasDB : [];
      const processos = Array.isArray(window.processosDB) ? window.processosDB : [];
      ntes = [...new Set([
        ...escolas.map(e => e.nte).filter(Boolean),
        ...processos.map(p => p.nte).filter(Boolean)
      ])].sort();
    }

    ntes.forEach(nte => {
      const opt = document.createElement('option');
      opt.value = nte;
      opt.textContent = nte;
      select.appendChild(opt);
    });

    select.value = [...select.options].some(o => o.value === valorAnterior) ? valorAnterior : 'GLOBAL';
    window.filtroDashboardNteAtualSIGEE = select.value;
    select.onchange = function () {
      window.filtroDashboardNteAtualSIGEE = this.value;
      window.carregarDadosDashboardReal();
    };
  }

  function atualizarDashboardTecnicoSIGEE(procVisiveis, escolasVisiveis) {
    const processos = Array.isArray(procVisiveis) ? procVisiveis : [];
    const topBox = document.getElementById('dash-tec-top-escolas');

    if (topBox) {
      const mapa = {};
      processos.forEach(p => {
        const nome = texto(p.escola || p.escola_nome || p.nome_escola || 'NÃO INFORMADA').toUpperCase();
        if (!mapa[nome]) mapa[nome] = { nome, nte: p.nte || '', qtd: 0 };
        mapa[nome].qtd++;
      });

      const top = Object.values(mapa).sort((a,b) => b.qtd - a.qtd).slice(0,5);
      topBox.innerHTML = top.length
        ? top.map((x, i) => `<div class="flex justify-between gap-2 border-b border-gray-100 py-1">
              <span>${i + 1}. ${x.nome}<br><small class="text-gray-400">${x.nte || '-'}</small></span>
              <strong>${x.qtd}</strong>
            </div>`).join('')
        : 'Sem dados';
    }

    const concluidos = processos.filter(p => ['Retirado','Deferido','Aguardando Retirada'].includes(obterEtapaProcesso(p)));
    const mediaEntrega = concluidos.length
      ? Math.round(concluidos.reduce((s,p) => s + diasEntreHoje(dataProcesso(p)), 0) / concluidos.length)
      : 0;

    const diasAbertura = {};
    processos.forEach(p => {
      const d = dataProcesso(p);
      const chave = d ? texto(d).slice(0,10) : 'SEM DATA';
      diasAbertura[chave] = (diasAbertura[chave] || 0) + 1;
    });
    const qtdDias = Math.max(1, Object.keys(diasAbertura).length);
    const mediaPedidosDia = (processos.length / qtdDias).toFixed(1).replace('.', ',');

    const pastas = processos.filter(p => normalizar(p.tipo_arquivo || p.tipo_arquivo_recebido || '').includes('PASTA')).length;
    const mediaPastaDia = (pastas / qtdDias).toFixed(1).replace('.', ',');

    setText('dash-tec-media-entrega', `${mediaEntrega} dia${mediaEntrega === 1 ? '' : 's'}`);
    setText('dash-tec-media-pedidos-dia', mediaPedidosDia);
    setText('dash-tec-media-pasta-dia', mediaPastaDia);
  }

  function carregarDadosDashboardReal() {
    if (!window.usuarioLogado) return;

    inicializarFiltroDashboardMasterSIGEE();

    const escolasVisiveis = filtrarPorAbrangencia(window.escolasDB || [], 'nte');
    const procVisiveis = filtrarPorAbrangencia(window.processosDB || [], 'nte');

    setText('dash-escolas', escolasVisiveis.length);
    setText('dash-acervos', escolasVisiveis.filter(acervoRecolhido).length);
    setText('dash-estaduais', escolasVisiveis.filter(dependenciaEstadual).length);
    setText('dash-municipios', new Set(escolasVisiveis.map(e => normalizar(e.municipio)).filter(Boolean)).size);
    setText('dash-usuarios', Array.isArray(window.usuariosDB) ? window.usuariosDB.length : 0);

    const etapas = {
      'dash-proc-desarquivamento': ['DESARQUIVAMENTO'],
      'dash-proc-analise': ['ANALISE', 'ANÁLISE'],
      'dash-proc-pendencia': ['PENDENCIA', 'PENDÊNCIA'],
      'dash-proc-digitacao': ['DIGITACAO', 'DIGITAÇÃO'],
      'dash-proc-conferencia': ['CONFERENCIA', 'CONFERÊNCIA'],
      'dash-proc-assinatura': ['ASSINATURA'],
      'dash-proc-aguardando': ['AGUARDANDO RETIRADA', 'DEFERIDO'],
      'dash-proc-retirado': ['RETIRADO']
    };

    Object.entries(etapas).forEach(([id, nomes]) => {
      const count = procVisiveis.filter(p => nomes.includes(normalizar(obterEtapaProcesso(p)))).length;
      setText(id, count);
    });

    atualizarDashboardTecnicoSIGEE(procVisiveis, escolasVisiveis);
  }

  function dadosDashboardExecutivoSIGEE() {
    const escolas = filtrarPorAbrangencia(window.escolasDB || [], 'nte');
    const processos = filtrarPorAbrangencia(window.processosDB || [], 'nte');
    const recolhidas = escolas.filter(acervoRecolhido).length;
    const abrangencia = isGlobal() ? (valorNteFiltroDashboard() || 'GLOBAL') : nteUsuario();

    return [
      { Indicador: 'Abrangência', Valor: abrangencia },
      { Indicador: 'Escolas Catalogadas', Valor: escolas.length },
      { Indicador: 'Acervos Recolhidos', Valor: recolhidas },
      { Indicador: 'Municípios', Valor: new Set(escolas.map(e => normalizar(e.municipio)).filter(Boolean)).size },
      { Indicador: 'Processos', Valor: processos.length },
      { Indicador: 'Usuários', Valor: Array.isArray(window.usuariosDB) ? window.usuariosDB.length : 0 }
    ];
  }

  function instalarDashboardSIGEE() {
    window.inicializarFiltroDashboardMasterSIGEE = inicializarFiltroDashboardMasterSIGEE;
    window.atualizarDashboardTecnicoSIGEE = atualizarDashboardTecnicoSIGEE;
    window.carregarDadosDashboardReal = carregarDadosDashboardReal;
    window.dadosDashboardExecutivoSIGEE = dadosDashboardExecutivoSIGEE;

    if (window.usuarioLogado) {
      try { inicializarFiltroDashboardMasterSIGEE(); } catch (e) { console.warn('SIGEE Dashboard filtro:', e); }
      try { carregarDadosDashboardReal(); } catch (e) { console.warn('SIGEE Dashboard carga:', e); }
    }
  }

  // Executa após o app.js também ter carregado, para garantir override estável.
  setTimeout(instalarDashboardSIGEE, 0);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(instalarDashboardSIGEE, 0);
  });
})();
