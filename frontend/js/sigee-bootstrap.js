(function (global) {
  'use strict';
  if (global.__SIGEE6_BOOTSTRAP__) return;
  global.__SIGEE6_BOOTSTRAP__ = { version: 'RC6.0.2', state: 'loading', loaded: [] };

  const base = 'js/';
  const modules = [
    'core/sigee-events.js',
    'core/sigee-performance.js',
    'core/sigee-cache.js',
    'core/sigee-api.js',
    'core/sigee-core.js',
    'services/timeline.service.js',
    'timeline/timeline-engine.js'
  ];

  function load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${base}${src}?v=RC6.0.2`;
      script.async = false;
      script.onload = () => {
        global.__SIGEE6_BOOTSTRAP__.loaded.push(src);
        resolve(src);
      };
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function start() {
    try {
      for (const module of modules) await load(module);
      global.__SIGEE6_BOOTSTRAP__.state = 'ready';
      console.info('[SIGEE RC6.0.2] Foundation consolidada carregada por bootstrap único.');
      global.dispatchEvent(new CustomEvent('sigee6:bootstrap-ready', {
        detail: { version: 'RC6.0.2', modules: modules.slice() }
      }));
    } catch (error) {
      global.__SIGEE6_BOOTSTRAP__.state = 'error';
      global.__SIGEE6_BOOTSTRAP__.error = error.message;
      console.error('[SIGEE RC6.0.2] Falha no bootstrap:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window);
