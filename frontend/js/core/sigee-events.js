(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  if (root.events) return;

  const target = new EventTarget();
  const registry = new Map();

  function on(name, handler, options) {
    if (typeof handler !== 'function') throw new TypeError('handler deve ser função');
    const wrapped = (event) => handler(event.detail, event);
    target.addEventListener(name, wrapped, options);
    if (!registry.has(name)) registry.set(name, new Set());
    registry.get(name).add(wrapped);
    return () => off(name, wrapped);
  }

  function once(name, handler) {
    return on(name, handler, { once: true });
  }

  function off(name, wrapped) {
    target.removeEventListener(name, wrapped);
    registry.get(name)?.delete(wrapped);
  }

  function emit(name, detail) {
    target.dispatchEvent(new CustomEvent(name, { detail }));
    global.dispatchEvent?.(new CustomEvent(`sigee6:${name}`, { detail }));
  }

  root.events = Object.freeze({ on, once, off, emit, listenerCount: (name) => registry.get(name)?.size || 0 });
})(window);
