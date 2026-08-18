(function (global) {
  'use strict';
  if (global.__SIGEE6_BOOTSTRAP__?.state === 'ready') return;

  const VERSION = 'RC6.1.2';
  const BASE = 'js/';
  const manifest = Object.freeze([
    { name: 'events', path: 'core/sigee-events.js' },
    { name: 'performance', path: 'core/sigee-performance.js' },
    { name: 'cache', path: 'core/sigee-cache.js' },
    { name: 'api', path: 'core/sigee-api.js' },
    { name: 'core', path: 'core/sigee-core.js' },
    { name: 'timeline.service', path: 'services/timeline.service.js?v=RC10.8.44' },
    { name: 'timeline.engine', path: 'timeline/timeline-engine.js?v=RC10.1.0' }
  ]);

  const state = global.__SIGEE6_BOOTSTRAP__ = {
    version: VERSION, state: 'loading', loaded: [], manifest: manifest.map(m => ({...m}))
  };

  function load(module) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${BASE}${module.path}${module.path.includes('?') ? '&' : '?'}v=${VERSION}`;
      script.async = false;
      script.dataset.sigee6Module = module.name;
      script.onload = () => { state.loaded.push(module.path); resolve(module.path); };
      script.onerror = () => reject(new Error(`Falha ao carregar ${module.path}`));
      document.head.appendChild(script);
    });
  }

  async function start() {
    try {
      for (const module of manifest) await load(module);
      state.state = 'ready';
      state.readyAt = new Date().toISOString();
      console.info(`[SIGEE ${VERSION}] Foundation consolidada: fonte única da cronologia ativa.`);
      global.dispatchEvent(new CustomEvent('sigee6:bootstrap-ready', {
        detail: { version: VERSION, modules: manifest.map(m => m.name) }
      }));
    } catch (error) {
      state.state = 'error'; state.error = error.message;
      console.error(`[SIGEE ${VERSION}] Falha no bootstrap:`, error);
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', start, { once: true })
    : start();
})(window);
