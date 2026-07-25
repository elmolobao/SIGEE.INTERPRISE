(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  if (root.api) return;

  function client() {
    const value = global.supabaseClient || global.supabase || global.SUPABASE_CLIENT;
    if (!value || typeof value.from !== 'function') throw new Error('Cliente Supabase do SIGEE não está disponível.');
    return value;
  }

  async function execute(operation, meta) {
    const finish = root.performance?.start(`api:${meta?.name || 'operation'}`, meta);
    root.events?.emit('api:request', meta || {});
    try {
      const result = await operation(client());
      if (result?.error) throw result.error;
      root.events?.emit('api:success', { ...(meta || {}), count: Array.isArray(result?.data) ? result.data.length : undefined });
      finish?.({ ok: true });
      return result;
    } catch (error) {
      root.events?.emit('api:error', { ...(meta || {}), message: error?.message || String(error) });
      finish?.({ ok: false });
      throw error;
    }
  }

  async function cached(key, operation, ttlMs, meta) {
    return root.cache.remember(key, () => execute(operation, meta), ttlMs);
  }

  root.api = Object.freeze({ client, execute, cached });
})(window);
