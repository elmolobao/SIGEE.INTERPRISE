/* SIGEE RC10.1.0 — resolvedor temporal único do ciclo externo */
(function (window) {
  'use strict';
  if (window.SIGEE_WORKFLOW_TEMPORAL) return;

  const DAY = 86400000;
  const STATES = Object.freeze([
    Object.freeze({ min: 52, code: 'PAS', name: 'Pedido de Atas sem Pasta', action: 'PEDIDO_ATAS_DESARQUIVAMENTO', actionTitle: 'Executar Pedido de Atas sem Pasta' }),
    Object.freeze({ min: 45, code: 'CFD', name: 'Confirmação dos Dados', action: 'CONFIRMAR_DADOS', actionTitle: 'Executar Confirmação dos Dados' }),
    Object.freeze({ min: 38, code: 'REU', name: 'Reiteração Urgente', action: 'SEND_REITERACAO_URGENTE', actionTitle: 'Executar Reiteração Urgente' }),
    Object.freeze({ min: 31, code: 'RET', name: 'Reiteração', action: 'SEND_REITERACAO', actionTitle: 'Executar Reiteração' }),
    Object.freeze({ min: 0, code: 'DES', name: 'Desarquivamento', action: null, actionTitle: 'Aguardando prazo de Reiteração' })
  ]);

  function validDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function dayNumber(value) {
    const date = validDate(value);
    if (!date) return null;
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
  }

  function nowDate() {
    const clock = window.SIGEE_WORKFLOW_CLOCK;
    const value = clock && typeof clock.now === 'function' ? clock.now() : new Date();
    return validDate(value) || new Date();
  }

  function explicitAnchor(process) {
    if (!process) return null;
    return process.data_inicio_desarquivamento ||
      process.data_inicio_ciclo ||
      process.inicio_ciclo ||
      process.data_desarquivamento ||
      process.data_etapa_inicial ||
      process.prazo_inicio_ciclo ||
      process.prazo_inicio ||
      process.created_at ||
      process.criado_em ||
      process.data_etapa_atual ||
      process.data_etapa ||
      null;
  }

  function anchor(process, now) {
    const current = dayNumber(now || nowDate());
    const candidates = [
      explicitAnchor(process),
      process && process.created_at,
      process && process.criado_em,
      process && process.data_etapa_atual,
      process && process.data_etapa
    ];
    for (const value of candidates) {
      const day = dayNumber(value);
      if (day != null && (current == null || day <= current)) return value;
    }
    return explicitAnchor(process);
  }

  function elapsedDays(process, now) {
    const current = dayNumber(now || nowDate());
    const start = dayNumber(anchor(process, now));
    if (current == null || start == null) return 0;
    return Math.max(0, current - start);
  }

  function stateForDays(days) {
    const safe = Math.max(0, Number.isFinite(Number(days)) ? Number(days) : 0);
    return STATES.find(item => safe >= item.min) || STATES[STATES.length - 1];
  }

  function resolve(process, now) {
    const days = elapsedDays(process, now);
    const state = stateForDays(days);
    return Object.freeze({
      days,
      anchor: anchor(process, now),
      code: state.code,
      name: state.name,
      action: state.action,
      actionTitle: state.actionTitle
    });
  }

  window.SIGEE_WORKFLOW_TEMPORAL = Object.freeze({
    version: 'RC10.1.0',
    resolve,
    elapsedDays,
    stateForDays,
    anchor
  });
})(window);
