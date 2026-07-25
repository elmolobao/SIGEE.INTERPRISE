(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  if (root.core?.initialized) return;

  const VERSION = 'RC6.0.2';
  const startedAt = new Date().toISOString();
  const modules = new Map();

  function register(name, module, metadata) {
    if (!name) throw new Error('Nome do módulo é obrigatório.');
    if (modules.has(name)) return modules.get(name).module;
    modules.set(name, { module, metadata: metadata || {}, registeredAt: new Date().toISOString() });
    root.events?.emit('core:module-registered', { name, metadata: metadata || {} });
    return module;
  }
  function resolve(name) { return modules.get(name)?.module; }
  function status() {
    return { version: VERSION, initialized: true, startedAt, modules: Array.from(modules.keys()), cacheEntries: root.cache?.size?.() || 0 };
  }

  root.core = Object.freeze({ VERSION, initialized: true, register, resolve, status });
  root.events?.emit('core:ready', status());
  console.info(`[SIGEE ${VERSION}] Foundation carregada em modo compatibilidade.`);
})(window);
