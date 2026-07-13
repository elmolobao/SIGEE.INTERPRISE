/* =====================================================================
 * SIGEE ENTERPRISE 1.0.2 — PATCH 001: Dashboard consolidado
 * Fonte autoritativa dos indicadores. Carregar após app.js e logs.js.
 * Não altera workflow nem persistência.
 * ===================================================================== */
(function (window) {
  'use strict';

  const txt = (v) => (v === null || v === undefined ? '' : String(v).trim());
  const norm = (v) => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ');
  const digits = (v) => (txt(v).match(/\d{1,2}/) || [])[0] || '';
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = String(value); };
  const usuario = () => window.usuarioLogado || null;

  function perfil() {
    const p = norm(usuario()?.perfil);
    if (p.includes('MASTER')) return 'MASTER';
    if (p === 'SEC' || p.includes('SEC -')) return 'SEC';
    if (p.includes('ADMIN')) return 'ADMINISTRADOR';
    if (p.includes('CONSULT')) return 'CONSULTA';
    if (p.includes('ESTAG')) return 'ESTAGIARIO';
    return 'TECNICO';
  }

  const visaoGlobal = () => ['MASTER', 'SEC'].includes(perfil());

  function nteId(obj) {
    if (!obj) return null;
    const direto = obj.nte_id ?? obj.nteId;
    if (direto !== null && direto !== undefined && txt(direto) !== '') return Number(direto) || null;
    return Number(digits(obj.nte || obj.nte_nome || obj.nte_vinculado || obj.grupo || obj.territorio)) || null;
  }

  function mesmoNte(obj, alvo) {
    const alvoId = Number(alvo) || Number(digits(alvo));
    const itemId = nteId(obj);
    if (alvoId && itemId) return alvoId === itemId;
    return norm(obj?.nte || obj?.nte_nome || obj?.grupo) === norm(alvo);
  }

  function filtroAtual() {
    return txt(document.getElementById('filtro-dashboard-nte')?.value || window.filtroDashboardNteAtualSIGEE || 'TODOS');
  }

  function filtrarAbrangencia(lista) {
    const base = Array.isArray(lista) ? lista : [];
    if (visaoGlobal()) {
      const filtro = filtroAtual();
      if (!filtro || ['TODOS', 'GLOBAL', 'SEC - TODOS OS NTES'].includes(norm(filtro))) return base;
      return base.filter((item) => mesmoNte(item, filtro));
    }
    const id = nteId(usuario());
    if (id) return base.filter((item) => nteId(item) === id);
    return base.filter((item) => mesmoNte(item, usuario()?.nte || usuario()?.grupo || ''));
  }

  function preencherFiltro() {
    const box = document.getElementById('box-filtro-dashboard-master');
    const select = document.getElementById('filtro-dashboard-nte');
    if (!box || !select || !usuario()) return;

    if (!visaoGlobal()) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    const anterior = filtroAtual();
    select.innerHTML = '<option value="TODOS">GLOBAL - TODOS OS NTEs</option>';
    for (let id = 1; id <= 27; id += 1) {
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = `NTE-${String(id).padStart(2, '0')}`;
      select.appendChild(opt);
    }
    select.value = [...select.options].some((o) => o.value === anterior) ? anterior : 'TODOS';
    window.filtroDashboardNteAtualSIGEE = select.value;
    select.onchange = function () {
      window.filtroDashboardNteAtualSIGEE = this.value;
      carregarImediato();
    };
  }

  function etapa(processo) {
    return norm(processo?.etapa || processo?.etapa_atual || processo?.fase_atual || 'DESARQUIVAMENTO');
  }

  function pertenceCicloDesarquivamento(processo) {
    const codigo = norm(processo?.etapa_codigo);
    if (['DES', 'RET', 'REU', 'CFD'].includes(codigo)) return true;
    return [
      'DESARQUIVAMENTO', 'REITERACAO', 'REITERACAO COM URGENCIA', 'REITERACAO URGENTE',
      'CONFIRMACAO DOS DADOS DA BUSCA', 'CONFIRMAR DADOS DA BUSCA', 'PEDIDO DE ATAS SEM PASTA'
    ].includes(etapa(processo));
  }

  function acervoRecolhido(escola) {
    const valor = norm(escola?.status_acervo || escola?.acervo || '');
    return valor === 'RECOLHIDO' || valor.startsWith('RECOLHIDO ');
  }

  function dataValida(valor) {
    if (!valor) return null;
    const s = txt(valor);
    const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const d = br ? new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1])) : new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function dataAbertura(p) { return dataValida(p.data_abertura || p.data_solicitacao || p.created_at || p.criado_em || p.data_inicio); }
  function dataConclusao(p) { return dataValida(p.data_conclusao || p.finalizado_em || p.retirado_em || p.updated_at); }
  function diferencaDias(a, b) { return Math.max(0, Math.ceil((b - a) / 86400000)); }

  function atualizarIndicadoresTecnicos(processos) {
    const top = document.getElementById('dash-tec-top-escolas');
    if (top) {
      const mapa = new Map();
      processos.forEach((p) => {
        const nome = txt(p.escola_nome || p.escola || p.nome_escola || p.instituicao || 'Não informada');
        const chave = `${norm(nome)}|${nteId(p) || norm(p.nte)}`;
        const atual = mapa.get(chave) || { nome, nte: txt(p.nte || p.nte_nome || ''), qtd: 0 };
        atual.qtd += 1;
        mapa.set(chave, atual);
      });
      const lista = [...mapa.values()].sort((a, b) => b.qtd - a.qtd || a.nome.localeCompare(b.nome, 'pt-BR')).slice(0, 5);
      top.innerHTML = lista.length
        ? lista.map((x, i) => `<div class="flex justify-between gap-2 border-b border-gray-100 py-1"><span>${i + 1}. ${x.nome}<br><small class="text-gray-400">${x.nte || '-'}</small></span><strong>${x.qtd}</strong></div>`).join('')
        : 'Sem dados';
    }

    const concluidos = processos
      .map((p) => ({ inicio: dataAbertura(p), fim: dataConclusao(p), etapa: etapa(p) }))
      .filter((x) => x.inicio && x.fim && ['RETIRADO', 'AGUARDANDO RETIRADA', 'DEFERIDO', 'INDEFERIDO'].includes(x.etapa));
    const media = concluidos.length
      ? Math.round(concluidos.reduce((soma, x) => soma + diferencaDias(x.inicio, x.fim), 0) / concluidos.length)
      : 0;
    set('dash-tec-media-entrega', `${media} ${media === 1 ? 'dia' : 'dias'}`);

    const aberturas = processos.map(dataAbertura).filter(Boolean);
    let periodo = 1;
    if (aberturas.length) {
      const menor = new Date(Math.min(...aberturas));
      const maior = new Date(Math.max(...aberturas));
      periodo = Math.max(1, diferencaDias(menor, maior) + 1);
    }
    set('dash-tec-media-pedidos-dia', (processos.length / periodo).toFixed(1).replace('.', ','));
    const pastas = processos.filter((p) => norm(p.tipo_arquivo || p.tipo_arquivo_recebido || p.arquivo_tipo).includes('PASTA'));
    set('dash-tec-media-pasta-dia', (pastas.length / periodo).toFixed(1).replace('.', ','));
  }

  function quantidadeMunicipios() {
    const filtro = filtroAtual();
    const global = visaoGlobal() && (!filtro || ['TODOS', 'GLOBAL', 'SEC - TODOS OS NTES'].includes(norm(filtro)));
    if (global) return Number(window.SIGEE_TOTAL_MUNICIPIOS_BAHIA || 417);
    const id = visaoGlobal() ? Number(digits(filtro)) : nteId(usuario());
    return Number(window.SIGEE_MUNICIPIOS_POR_NTE?.[id] || 0);
  }

  function carregarImediato() {
    if (!usuario()) return;
    preencherFiltro();

    const escolas = filtrarAbrangencia(window.escolasDB || []);
    const processos = filtrarAbrangencia(window.processosDB || []);
    const usuariosAtivos = filtrarAbrangencia((window.usuariosDB || []).filter((u) => u.ativo !== false && norm(u.status) !== 'INATIVO'));
    const tecnicos = usuariosAtivos.filter((u) => ['TECNICO', 'ESTAGIARIO'].includes((() => {
      const p = norm(u.perfil);
      return p.includes('ESTAG') ? 'ESTAGIARIO' : p.includes('TECN') ? 'TECNICO' : p;
    })()));

    set('dash-escolas', escolas.length);
    set('dash-acervos', escolas.filter(acervoRecolhido).length);
    set('dash-estaduais', escolas.filter((e) => norm(e.dependencia_adm || e.dependencia).includes('ESTADUAL')).length);
    set('dash-municipios', quantidadeMunicipios());
    set('dash-usuarios', tecnicos.length);

    set('dash-proc-desarquivamento', processos.filter(pertenceCicloDesarquivamento).length);
    const contar = (nome) => processos.filter((p) => etapa(p) === nome).length;
    set('dash-proc-analise', contar('ANALISE'));
    set('dash-proc-pendencia', contar('PENDENCIA'));
    set('dash-proc-digitacao', contar('DIGITACAO'));
    set('dash-proc-conferencia', contar('CONFERENCIA'));
    set('dash-proc-assinatura', contar('ASSINATURA'));
    set('dash-proc-aguardando', processos.filter((p) => ['AGUARDANDO RETIRADA', 'DEFERIDO'].includes(etapa(p))).length);
    set('dash-proc-retirado', contar('RETIRADO'));

    atualizarIndicadoresTecnicos(processos);
  }

  let timer = null;
  function carregar() {
    clearTimeout(timer);
    timer = setTimeout(carregarImediato, 40);
  }

  window.carregarDadosDashboardReal = carregar;
  window.carregarDadosDashboardRealImediato = carregarImediato;
  window.inicializarFiltroDashboardMasterSIGEE = preencherFiltro;

  const navegarAnterior = window.navegar;
  window.navegar = function (aba) {
    const retorno = typeof navegarAnterior === 'function' ? navegarAnterior.apply(this, arguments) : undefined;
    if (aba === 'painel') carregar();
    return retorno;
  };
  try { navegar = window.navegar; } catch (e) {}

  window.addEventListener('load', () => setTimeout(carregarImediato, 900));
  setInterval(() => {
    const painel = document.getElementById('aba-painel');
    if (painel && !painel.classList.contains('hidden')) carregarImediato();
  }, 60000);
})(window);
