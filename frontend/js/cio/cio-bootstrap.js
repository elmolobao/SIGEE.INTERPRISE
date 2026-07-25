(function (global) {
  'use strict';

  if (global.__SIGEE_CIO_BOOTSTRAP__?.version === 'RC6.2.1.2') return;

  const state = global.__SIGEE_CIO_BOOTSTRAP__ = {
    version: 'RC6.2.1.2',
    state: 'idle',
    loaded: [],
    loadingPromise: null
  };

  const MODULES = [
    'cio/cio-context.js',
    'cio/cio-cache.js',
    'services/cio-data.service.js',
    'cio/cio-metrics.js',
    'cio/cio-rules.js',
    'cio/cio-alerts.js',
    'cio/cio-recommendations.js',
    'cio/cio-summary.js',
    'cio/cio-engine.js',
    'ui/cio-dashboard.js'
  ];

  function texto(valor) {
    return valor == null ? '' : String(valor).trim();
  }

  function normalizarPerfil(valor) {
    const perfil = texto(valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (perfil.includes('MASTER')) return 'MASTER';
    if (perfil.includes('GESTOR') || perfil.includes('DIRIGENTE')) return 'GESTOR';
    if (perfil.includes('ADMINISTRADOR') || perfil === 'ADMIN') return 'ADMINISTRADOR';
    return perfil;
  }

  function usuarioAtual() {
    try {
      return global.SIGEE_SESSION?.getUser?.() || global.usuarioLogado || null;
    } catch (_) {
      return global.usuarioLogado || null;
    }
  }

  function acessoPermitido() {
    return ['MASTER', 'GESTOR', 'ADMINISTRADOR'].includes(
      normalizarPerfil(usuarioAtual()?.perfil)
    );
  }

  function carregarScript(caminho) {
    return new Promise((resolve, reject) => {
      const id = 'sigee-cio-module-' + caminho.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const existente = document.getElementById(id);
      if (existente?.dataset.loaded === 'true') return resolve();

      const script = existente || document.createElement('script');
      script.id = id;
      script.async = false;
      script.src = 'js/' + caminho + '?v=RC6.2.1.2';
      script.onload = () => {
        script.dataset.loaded = 'true';
        if (!state.loaded.includes(caminho)) state.loaded.push(caminho);
        resolve();
      };
      script.onerror = () => reject(new Error('Falha ao carregar ' + caminho));

      if (!existente) document.head.appendChild(script);
    });
  }

  async function carregarModulos() {
    if (state.state === 'ready') return;
    if (state.loadingPromise) return state.loadingPromise;

    state.state = 'loading';
    state.loadingPromise = (async () => {
      for (const modulo of MODULES) await carregarScript(modulo);
      state.state = 'ready';
      console.info('[SIGEE RC6.2.1.2] Módulos do CIO carregados sob demanda.');
    })().catch((erro) => {
      state.state = 'error';
      state.error = erro.message;
      state.loadingPromise = null;
      throw erro;
    });

    return state.loadingPromise;
  }

  async function abrirCio() {
    const botao = document.querySelector('[data-sigee-cio-lazy]');
    const rotulo = botao?.querySelector('[data-cio-label]');
    const original = rotulo?.textContent || 'Centro de Inteligência Operacional';

    try {
      if (botao) botao.disabled = true;
      if (rotulo) rotulo.textContent = 'Carregando CIO...';
      await carregarModulos();
      if (typeof global.SIGEE_CIO?.ui?.abrir !== 'function') {
        throw new Error('Interface do CIO não foi inicializada.');
      }
      await global.SIGEE_CIO.ui.abrir(false);
    } catch (erro) {
      console.error('[SIGEE CIO]', erro);
      alert('Não foi possível abrir o Centro de Inteligência. Consulte o console para detalhes.');
    } finally {
      if (botao) botao.disabled = false;
      if (rotulo) rotulo.textContent = original;
    }
  }

  function instalarMenu() {
    if (!acessoPermitido()) return false;

    const nav = document.getElementById('sigee-menu-dinamico');
    if (!nav) return false;
    if (nav.querySelector('[data-sigee-cio-lazy]')) return true;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.sigeeCioLazy = '1';
    botao.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold transition sigee-cio-menu';
    botao.innerHTML = '<span aria-hidden="true">🧠</span><span data-cio-label>Centro de Inteligência Operacional</span>';
    botao.addEventListener('click', abrirCio, { passive: true });
    nav.appendChild(botao);
    return true;
  }

  function instalarQuandoDisponivel() {
    let tentativas = 0;
    const timer = global.setInterval(() => {
      tentativas += 1;
      if (instalarMenu() || tentativas >= 20) global.clearInterval(timer);
    }, 500);
  }

  function iniciarLeve() {
    const executar = () => {
      if ('requestIdleCallback' in global) {
        global.requestIdleCallback(instalarQuandoDisponivel, { timeout: 2000 });
      } else {
        global.setTimeout(instalarQuandoDisponivel, 800);
      }
    };

    if (document.readyState === 'complete') executar();
    else global.addEventListener('load', executar, { once: true });
  }

  global.abrirCentroInteligenciaOperacionalSIGEE = abrirCio;
  global.abrirCentroInteligenciaSIGEE = abrirCio; // compatibilidade
  state.open = abrirCio;
  state.load = carregarModulos;
  state.state = 'idle';

  iniciarLeve();
  console.info('[SIGEE RC6.2.1.2] CIO em modo sob demanda; dashboard principal preservado.');
})(window);
