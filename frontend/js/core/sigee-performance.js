(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  if (root.performance) return;
  const metrics = [];
  function start(name, meta) {
    const startedAt = performance.now();
    return function finish(extra) {
      const metric = { name, durationMs: +(performance.now() - startedAt).toFixed(2), at: new Date().toISOString(), meta: { ...(meta || {}), ...(extra || {}) } };
      metrics.push(metric);
      if (metrics.length > 200) metrics.shift();
      root.events?.emit('performance:metric', metric);
      return metric;
    };
  }
  root.performance = Object.freeze({ start, snapshot: () => metrics.slice(), clear: () => { metrics.length = 0; } });
})(window);
