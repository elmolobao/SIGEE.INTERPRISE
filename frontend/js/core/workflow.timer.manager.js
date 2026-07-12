/* =====================================================================
 * SIGEE — Workflow Timer Manager
 * Sprint 1.0 — PE-01 / versão 0.9.4.0
 *
 * Calcula prazos e disponibiliza gatilhos temporais declarativos.
 * Não altera etapas, não envia mensagens e não persiste processos.
 * ===================================================================== */
(function (window) {
  'use strict';

  const VERSION = '0.9.4.0';
  const clock = window.SIGEE_WORKFLOW_CLOCK;
  const stateManager = window.SIGEE_STATE_MANAGER;

  if (!clock) throw new Error('SIGEE_WORKFLOW_CLOCK deve ser carregado antes do Timer Manager.');
  if (!stateManager) throw new Error('SIGEE_STATE_MANAGER deve ser carregado antes do Timer Manager.');

  const TRIGGERS = Object.freeze({
    DES: Object.freeze({ afterDays: 30, event: 'SEND_REITERACAO' }),
    RET: Object.freeze({ afterDays: 7, event: 'SEND_REITERACAO_URGENTE' }),
    REU: Object.freeze({ afterDays: 7, event: 'CONFIRMAR_DADOS' }),
    CFD: Object.freeze({ afterDays: 7, event: 'PEDIR_ATAS' })
  });

  const DAY_MS = 24 * 60 * 60 * 1000;

  function parseDate(value) {
    if (value instanceof Date) return new Date(value.getTime());
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfDay(date) {
    const result = new Date(date.getTime());
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function addDays(date, days) {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + Number(days || 0));
    return result;
  }

  function differenceInCalendarDays(later, earlier) {
    return Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY_MS);
  }

  function getTrigger(stateCode) {
    const code = String(stateCode || '').trim().toUpperCase();
    const trigger = TRIGGERS[code];
    return trigger ? JSON.parse(JSON.stringify(trigger)) : null;
  }

  function calculate(stateCode, startedAt, referenceDate) {
    const code = String(stateCode || '').trim().toUpperCase();
    if (!stateManager.exists(code)) {
      return Object.freeze({ ok: false, error: 'INVALID_STATE', state: code || null });
    }

    const start = parseDate(startedAt);
    if (!start) {
      return Object.freeze({ ok: false, error: 'INVALID_START_DATE', state: code });
    }

    const reference = parseDate(referenceDate) || clock.now();
    const trigger = getTrigger(code);
    const deadlineDays = trigger ? trigger.afterDays : stateManager.getDeadline(code);
    const elapsedDays = Math.max(0, differenceInCalendarDays(reference, start));
    const dueAt = deadlineDays == null ? null : addDays(startOfDay(start), deadlineDays);
    const remainingDays = deadlineDays == null ? null : Math.max(0, deadlineDays - elapsedDays);
    const due = deadlineDays != null && elapsedDays >= deadlineDays;

    return Object.freeze({
      ok: true,
      state: code,
      startedAt: start.toISOString(),
      referenceAt: reference.toISOString(),
      deadlineDays: deadlineDays,
      elapsedDays: elapsedDays,
      remainingDays: remainingDays,
      dueAt: dueAt ? dueAt.toISOString() : null,
      due: due,
      availableEvent: due && trigger ? trigger.event : null,
      trigger: trigger
    });
  }

  function isEventAvailable(stateCode, eventCode, startedAt, referenceDate) {
    const result = calculate(stateCode, startedAt, referenceDate);
    if (!result.ok) return false;
    return result.availableEvent === String(eventCode || '').trim().toUpperCase();
  }

  function availableEvents(stateCode, startedAt, referenceDate) {
    const result = calculate(stateCode, startedAt, referenceDate);
    return result.ok && result.availableEvent ? [result.availableEvent] : [];
  }

  window.SIGEE_TIMER_MANAGER = Object.freeze({
    version: VERSION,
    triggers: TRIGGERS,
    getTrigger: getTrigger,
    calculate: calculate,
    isEventAvailable: isEventAvailable,
    availableEvents: availableEvents
  });
})(window);
