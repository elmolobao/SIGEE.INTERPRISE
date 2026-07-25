(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  const listeners = [];

  function observar() {
    if (listeners.length) return;
    ['workflow:changed', 'processo:updated', 'log:created', 'documento:uploaded'].forEach((eventName) => {
      listeners.push(root.events.on(eventName, (payload) => {
        const id = payload?.processoId || payload?.processo_id || payload?.id;
        if (id) root.timelineService?.invalidar(id);
        root.events.emit('timeline:invalidated', { processoId: id || null, reason: eventName });
      }));
    });
  }

  async function carregar(processoId) {
    if (!processoId) throw new Error('processoId é obrigatório para a Timeline.');
    const timeline = await root.timelineService.carregar(processoId);
    root.events.emit('timeline:loaded', { processoId, totalEventos: timeline.eventos.length });
    return timeline;
  }

  const engine = Object.freeze({ observar, carregar, stop: () => listeners.splice(0).forEach((off) => off()) });
  root.timeline = engine;
  root.core?.register('timeline.engine', engine, { mode: 'observation', version: 'RC6.0.2' });
  observar();
})(window);
