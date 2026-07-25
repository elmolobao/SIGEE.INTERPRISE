(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  if (root.cache) return;

  const store = new Map();
  const inflight = new Map();

  function set(key, value, ttlMs = 60000) {
    store.set(key, { value, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : Infinity });
    return value;
  }
  function get(key) {
    const item = store.get(key);
    if (!item) return undefined;
    if (item.expiresAt <= Date.now()) { store.delete(key); return undefined; }
    return item.value;
  }
  function has(key) { return get(key) !== undefined; }
  function del(key) { inflight.delete(key); return store.delete(key); }
  function clear(prefix) {
    if (!prefix) { store.clear(); inflight.clear(); return; }
    for (const key of store.keys()) if (String(key).startsWith(prefix)) store.delete(key);
    for (const key of inflight.keys()) if (String(key).startsWith(prefix)) inflight.delete(key);
  }
  async function remember(key, loader, ttlMs = 60000) {
    const cached = get(key);
    if (cached !== undefined) return cached;
    if (inflight.has(key)) return inflight.get(key);
    const task = Promise.resolve().then(loader).then((value) => set(key, value, ttlMs)).finally(() => inflight.delete(key));
    inflight.set(key, task);
    return task;
  }
  root.cache = Object.freeze({ set, get, has, delete: del, clear, remember, size: () => store.size });
})(window);
