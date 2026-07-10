/* =====================================================================
 * SIGEE — dashboard.js
 * Dashboard consolidado por perfil, com consultas diretas ao Supabase.
 * MASTER/SEC: visão global ou por NTE. Demais perfis: apenas seu NTE.
 * ===================================================================== */
(function (window) {
  'use strict';

  if (window.__SIGEE_DASHBOARD_V27__) return;
  window.__SIGEE_DASHBOARD_V27__ = true;

  const TABELAS = (window.SIGEE_CONFIG && window.SIGEE_CONFIG.supabase && window.SIGEE_CONFIG.supabase.tabelas) || {
    escolas: 'escolas_sigee',
    processos: 'processos',
    usuarios: 'usuarios_sigee'
  };

  const texto = (v) => (v == null ? '' : String(v).trim());
  const normalizar = (v) => texto(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
  const digitos = (v) => (texto(v).match(/\d+/) || [''])[0];
  const nteLabel = (id) => `NTE ${String(Number(id)).padStart(2, '0')}`;

  let execucaoAtual = 0;
  const cacheMunicipios = new Map();

  function cliente() {
    if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') {
      return window.SIGEE_SUPABASE.criarCliente();
    }
    return window.SIGEE_SUPABASE_CLIENT || null;
  }

  function usuario() {
    return window.usuarioLogado || null;
  }

  function perfil() {
    return normalizar(usuario() && usuario().perfil);
  }

  function perfilGlobal() {
    return ['MASTER', 'SEC'].includes(perfil());
  }

  function nteUsuarioId() {
    const u = usuario() || {};
    const direto = Number(u.nte_id);
    if (Number.isFinite(direto) && direto > 0) return direto;
    const extraido = Number(digitos(u.nte || u.grupo || u.nte_nome));
    return Number.isFinite(extraido) && extraido > 0 ? extraido : null;
  }

  function filtroSelecionado() {
    if (!perfilGlobal()) return nteUsuarioId();
    const valor = texto(document.getElementById('filtro-dashboard-nte')?.value || 'TODOS');
    if (!valor || ['TODOS', 'GLOBAL'].includes(normalizar(valor))) return null;
    const id = Number(digitos(valor));
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function configurarFiltro() {
    const box = document.getElementById('box-filtro-dashboard-master');
    const select = document.getElementById('filtro-dashboard-nte');
    if (!box || !select) return;

    if (!perfilGlobal()) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    const valorAnterior = select.value;
    select.innerHTML = '<option value="TODOS">TODOS</option>' +
      Array.from({ length: 27 }, (_, i) => {
        const id = i + 1;
        return `<option value="${id}">${nteLabel(id)}</option>`;
      }).join('');

    select.value = Array.from(select.options).some(o => o.value === valorAnterior) ? valorAnterior : 'TODOS';
    select.onchange = () => window.carregarDadosDashboardReal();
  }

  function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(valor ?? 0);
  }

  function mostrarCarregando() {
    [
      'dash-escolas','dash-acervos','dash-estaduais','dash-municipios','dash-usuarios',
      'dash-proc-desarquivamento','dash-proc-analise','dash-proc-pendencia','dash-proc-digitacao',
      'dash-proc-conferencia','dash-proc-assinatura','dash-proc-aguardando','dash-proc-retirado'
    ].forEach(id => setTexto(id, '…'));
  }

  async function contar(tabela, aplicarFiltro) {
    const c = cliente();
    if (!c) throw new Error('Cliente Supabase indisponível.');
    let q = c.from(tabela).select('*', { count: 'exact', head: true });
    if (typeof aplicarFiltro === 'function') q = aplicarFiltro(q);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }

  function filtrarEscolaPorNte(q, nteId) {
    return nteId ? q.eq('nte_id', nteId) : q;
  }

  function filtrarUsuarioPorNte(q, nteId) {
    return nteId ? q.eq('nte_id', nteId) : q;
  }

  function filtrarProcessoPorNte(q, nteId) {
    return nteId ? q.eq('nte', nteLabel(nteId)) : q;
  }

  async function contarMunicipios(nteId) {
    const chave = nteId || 'GLOBAL';
    const salvo = cacheMunicipios.get(chave);
    if (salvo && Date.now() - salvo.em < 10 * 60 * 1000) return salvo.total;

    const c = cliente();
    if (!c) return 0;

    const encontrados = new Set();
    const tamanhoPagina = 1000;
    let inicio = 0;

    while (true) {
      let q = c.from(TABELAS.escolas)
        .select('municipio')
        .order('id', { ascending: true })
        .range(inicio, inicio + tamanhoPagina - 1);
      q = filtrarEscolaPorNte(q, nteId);
      const { data, error } = await q;
      if (error) throw error;
      const lista = data || [];
      lista.forEach(item => {
        const nome = normalizar(item.municipio);
        if (nome) encontrados.add(nome);
      });
      if (lista.length < tamanhoPagina) break;
      inicio += tamanhoPagina;
    }

    const total = encontrados.size;
    cacheMunicipios.set(chave, { total, em: Date.now() });
    return total;
  }

  async function contarEtapa(nteId, etapa) {
    return contar(TABELAS.processos, q => filtrarProcessoPorNte(q, nteId).eq('etapa_atual', etapa));
  }

  async function carregarDashboard() {
    const u = usuario();
    if (!u) return;

    const minhaExecucao = ++execucaoAtual;
    configurarFiltro();
    mostrarCarregando();

    const nteId = filtroSelecionado();

    try {
      const resultados = await Promise.all([
        contar(TABELAS.escolas, q => filtrarEscolaPorNte(q, nteId)),
        contar(TABELAS.escolas, q => filtrarEscolaPorNte(q, nteId).ilike('status_acervo', 'RECOLHIDO')),
        contar(TABELAS.escolas, q => filtrarEscolaPorNte(q, nteId).ilike('dependencia_adm', '%ESTADUAL%')),
        contarMunicipios(nteId),
        contar(TABELAS.usuarios, q => filtrarUsuarioPorNte(q, nteId).eq('ativo', true)),
        contarEtapa(nteId, 'Desarquivamento'),
        contarEtapa(nteId, 'Análise'),
        contarEtapa(nteId, 'Pendência'),
        contarEtapa(nteId, 'Digitação'),
        contarEtapa(nteId, 'Conferência'),
        contarEtapa(nteId, 'Assinatura'),
        contarEtapa(nteId, 'Aguardando Retirada'),
        contarEtapa(nteId, 'Retirado')
      ]);

      if (minhaExecucao !== execucaoAtual) return;

      const [
        escolas, acervos, estaduais, municipios, usuarios,
        desarquivamento, analise, pendencia, digitacao,
        conferencia, assinatura, aguardando, retirado
      ] = resultados;

      setTexto('dash-escolas', escolas);
      setTexto('dash-acervos', acervos);
      setTexto('dash-estaduais', estaduais);
      setTexto('dash-municipios', municipios);
      setTexto('dash-usuarios', usuarios);
      setTexto('dash-proc-desarquivamento', desarquivamento);
      setTexto('dash-proc-analise', analise);
      setTexto('dash-proc-pendencia', pendencia);
      setTexto('dash-proc-digitacao', digitacao);
      setTexto('dash-proc-conferencia', conferencia);
      setTexto('dash-proc-assinatura', assinatura);
      setTexto('dash-proc-aguardando', aguardando);
      setTexto('dash-proc-retirado', retirado);
    } catch (erro) {
      console.error('[SIGEE] Falha ao carregar Dashboard:', erro);
      if (minhaExecucao !== execucaoAtual) return;
      mostrarCarregando();
    }
  }

  let timer = null;
  window.carregarDadosDashboardReal = function () {
    clearTimeout(timer);
    timer = setTimeout(carregarDashboard, 40);
  };
  window.carregarDadosDashboardRealImediato = carregarDashboard;
  window.inicializarFiltroDashboardMasterSIGEE = configurarFiltro;

  const navegarAnterior = window.navegar;
  if (!window.__SIGEE_DASHBOARD_NAV_V27__) {
    window.__SIGEE_DASHBOARD_NAV_V27__ = true;
    window.navegar = function (aba) {
      const retorno = typeof navegarAnterior === 'function' ? navegarAnterior.apply(this, arguments) : undefined;
      if (aba === 'painel') window.carregarDadosDashboardReal();
      return retorno;
    };
    try { navegar = window.navegar; } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (usuario()) window.carregarDadosDashboardReal();
  });
})(window);
