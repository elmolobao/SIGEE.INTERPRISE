(function (global) {
  'use strict';

  if (global.__SIGEE_CIO_BOOTSTRAP__?.version === 'RC6.2.0.1') return;

  const state = global.__SIGEE_CIO_BOOTSTRAP__ = {
    version: 'RC6.2.0.1',
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
    'cio/cio-engine.js'
  ];

  function carregarScript(caminho) {
    return new Promise((resolve, reject) => {
      const id = 'sigee-cio-module-' + caminho.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const existente = document.getElementById(id);
      if (existente?.dataset.loaded === 'true') return resolve();
      const script = existente || document.createElement('script');
      script.id = id;
      script.async = false;
      script.src = 'js/' + caminho + '?v=RC6.2.0.1';
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
      console.info('[SIGEE RC6.2.0.1] Motor do CIO carregado sob demanda.');
    })().catch((erro) => {
      state.state = 'error';
      state.error = erro.message;
      state.loadingPromise = null;
      throw erro;
    });
    return state.loadingPromise;
  }

  state.load = carregarModulos;
  console.info('[SIGEE RC6.2.0.1] Infraestrutura leve do CIO ativa.');
})(window);
