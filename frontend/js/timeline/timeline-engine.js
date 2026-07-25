(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  const VERSION = 'RC6.1.0';
  const listeners = [];

  function observar() {
    if (listeners.length || !root.events?.on) return;
    ['workflow:changed', 'processo:updated', 'log:created', 'documento:uploaded', 'pasta:received'].forEach((eventName) => {
      listeners.push(root.events.on(eventName, (payload) => {
        const id = payload?.processoId || payload?.processo_id || payload?.id;
        if (id) root.timelineService?.invalidar(id);
        root.events.emit('timeline:invalidated', { processoId: id || null, reason: eventName });
      }));
    });
  }

  async function carregar(processoId, processoBase) {
    if (!processoId) throw new Error('processoId é obrigatório para a Timeline.');
    const timeline = await root.timelineService.carregar(processoId, processoBase);
    root.events?.emit?.('timeline:loaded', {
      processoId,
      totalEventos: timeline.eventos.length,
      pastaRecebida: timeline.marcos?.pastaRecebida === true,
      tiposExecutados: timeline.marcos?.tiposExecutados || []
    });
    return timeline;
  }

  const engine = Object.freeze({
    VERSION,
    observar,
    carregar,
    stop: () => listeners.splice(0).forEach((off) => off())
  });

  root.timeline = engine;
  root.core?.register?.('timeline.engine', engine, { mode: 'observation', version: VERSION });
  observar();
})(window);
