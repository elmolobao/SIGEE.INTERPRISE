/* SIGEE RC10.2.0 — resolvedor temporal único do ciclo externo */
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

  function firstValid(values) {
    for (const value of values) {
      const date = validDate(value);
      if (date) return value;
    }
    return null;
  }

  function earliestNotFuture(values, now) {
    const current = dayNumber(now || nowDate());
    let selected = null;
    let selectedDay = null;
    values.forEach(function (value) {
      const day = dayNumber(value);
      if (day == null || (current != null && day > current)) return;
      if (selectedDay == null || day < selectedDay) {
        selected = value;
        selectedDay = day;
      }
    });
    return selected;
  }

  function cycleNumber(process) {
    const value = Number(process && (process.workflow_ciclo || process.ciclo || 1));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }

  function explicitCycleAnchor(process) {
    if (!process) return null;
    return firstValid([
      process.data_inicio_desarquivamento,
      process.data_inicio_ciclo,
      process.inicio_ciclo,
      process.data_desarquivamento,
      process.data_etapa_inicial,
      process.prazo_inicio_ciclo
    ]);
  }

  function anchor(process, now) {
    if (!process) return null;

    const currentNow = now || nowDate();
    const cycle = cycleNumber(process);
    const cycleAnchor = explicitCycleAnchor(process);

    /*
     * RC10.2.0 — no primeiro ciclo, datas operacionais que tenham sido
     * inicializadas durante a simulação não podem apagar a abertura real.
     * A âncora é a data válida mais antiga entre abertura/prazo/ciclo.
     * Em ciclos posteriores, a Retificação continua sendo a autoridade e
     * utiliza a âncora explícita do novo ciclo.
     */
    if (cycle <= 1) {
      return earliestNotFuture([
        process.created_at,
        process.criado_em,
        process.prazo_inicio,
        cycleAnchor,
        process.data_etapa_atual,
        process.data_etapa
      ], currentNow) || firstValid([process.created_at, process.prazo_inicio, cycleAnchor]);
    }

    return earliestNotFuture([
      cycleAnchor,
      process.prazo_inicio,
      process.data_etapa_atual,
      process.data_etapa
    ], currentNow) || cycleAnchor || process.prazo_inicio || process.created_at || null;
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
    version: 'RC10.2.0',
    resolve,
    elapsedDays,
    stateForDays,
    anchor
  });
})(window);
