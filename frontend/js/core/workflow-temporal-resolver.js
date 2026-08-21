/* SIGEE RC10.2.1 — resolvedor temporal único do ciclo externo + indicadores globais */
(function (window) {
  'use strict';
  if (window.SIGEE_WORKFLOW_TEMPORAL) return;

  const DAY = 86400000;
  const STATES = Object.freeze([
    Object.freeze({ min: 51, code: 'PAS', name: 'Pedido de Atas sem Pasta', action: 'PEDIDO_ATAS_DESARQUIVAMENTO', actionTitle: 'Executar Pedido de Atas sem Pasta' }),
    Object.freeze({ min: 44, code: 'CFD', name: 'Confirmação dos Dados', action: 'CONFIRMAR_DADOS', actionTitle: 'Executar Confirmação dos Dados' }),
    Object.freeze({ min: 37, code: 'REU', name: 'Reiteração Urgente', action: 'SEND_REITERACAO_URGENTE', actionTitle: 'Executar Reiteração Urgente' }),
    Object.freeze({ min: 30, code: 'RET', name: 'Reiteração', action: 'SEND_REITERACAO', actionTitle: 'Executar Reiteração' }),
    Object.freeze({ min: 0, code: 'DES', name: 'Desarquivamento', action: null, actionTitle: 'Aguardando prazo de Reiteração' })
  ]);

  function validDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
      const copy = new Date(value.getTime());
      return Number.isNaN(copy.getTime()) ? null : copy;
    }

    const raw = String(value).trim();
    /*
     * Datas do Supabase normalmente chegam como ISO com fuso (Z/+00:00).
     * Para os contadores institucionais do SIGEE, a parte YYYY-MM-DD é uma
     * data civil: ela não pode recuar um dia ao ser convertida para o fuso
     * local do navegador. O mesmo tratamento vale para data sem horário.
     */
    let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
    if (match) {
      const localDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      return Number.isNaN(localDate.getTime()) ? null : localDate;
    }

    match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const localDate = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      return Number.isNaN(localDate.getTime()) ? null : localDate;
    }

    const date = new Date(value);
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



  function normalizedStage(process) {
    return String(process && (process.etapa_atual || process.etapa || process.fase_atual) || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  }

  function calendarDaysBetween(startValue, endValue) {
    const start = dayNumber(startValue);
    const end = dayNumber(endValue || nowDate());
    if (start == null || end == null) return 0;
    return Math.max(0, end - start);
  }

  /*
   * Indicadores institucionais do processo.
   * Esta função NÃO participa da liberação de ações do workflow.
   * - contador global: abertura -> deferimento (congelado no deferimento);
   * - contador pós-deferimento: deferimento -> retirada (congelado na retirada);
   * - contador da etapa: entrada na etapa -> agora, ou encerramento aplicável.
   */
  function processMetrics(process, now) {
    const currentNow = validDate(now) || nowDate();
    if (window.SIGEE_TEMPO_PROCESSO?.ehEscola?.(process)) {
      const sla = window.SIGEE_TEMPO_PROCESSO.slaEscola(process, currentNow);
      const stage = normalizedStage(process);
      const stageStart = firstValid([process && process.data_etapa_atual, process && process.etapa_iniciada_em, sla.inicio]);
      const stageDays = stage.includes('PEND') ? 0 : Math.max(0, calendarDaysBetween(stageStart, sla.encerrado ? sla.fim : currentNow) + (stageStart ? 1 : 0));
      return Object.freeze({
        opening: sla.inicio, deferred: process && process.deferido_em || null, withdrawn: process && process.retirado_em || null,
        terminal: sla.encerrado ? sla.fim : null, stageStart, normalEnd: sla.fim, overallEnd: process && process.retirado_em || currentNow,
        totalDays: sla.diasConsumidos, normalDays: sla.diasConsumidos, postDeferredDays: process && process.deferido_em ? calendarDaysBetween(process.deferido_em, process.retirado_em || currentNow) : 0,
        withdrawalDays: process && process.deferido_em ? calendarDaysBetween(process.deferido_em, process.retirado_em || currentNow) : 0,
        overallDays: calendarDaysBetween(sla.inicio, process && process.retirado_em || currentNow) + (sla.inicio ? 1 : 0), stageDays,
        suspendedDays: sla.diasPendencia, remainingDays: sla.diasRestantes, overdueDays: sla.diasAtraso, slaLimit: 30,
        totalFrozen: sla.encerrado, postDeferredFrozen: Boolean(process && process.deferido_em && process.retirado_em), overallFrozen: Boolean(process && process.retirado_em)
      });
    }
    const opening = firstValid([
      process && process.data_abertura,
      process && process.data_solicitacao,
      process && process.created_at,
      process && process.criado_em
    ]);
    const stage = normalizedStage(process);
    const deferred = firstValid([
      process && process.deferido_em,
      process && process.data_deferimento
    ]);
    const withdrawn = firstValid([
      process && process.retirado_em,
      process && process.data_retirada,
      stage === 'RETIRADO' ? process && process.data_etapa_atual : null
    ]);
    const terminal = firstValid([
      stage === 'INDEFERIDO' ? process && process.finalizado_em : null,
      stage === 'RETIRADO' ? (withdrawn || (process && process.finalizado_em)) : null
    ]);
    const stageStart = firstValid([
      (stage === 'AGUARDANDO RETIRADA' || stage === 'DEFERIDO') ? deferred : null,
      process && process.data_etapa_atual,
      process && process.etapa_iniciada_em,
      process && process.prazo_inicio,
      process && process.data_etapa,
      opening
    ]);

    // Contagem normal: abertura até deferimento; indeferimento encerra diretamente.
    const normalEnd = deferred || terminal || currentNow;
    // Espera para retirada: deferimento até retirada.
    const withdrawalEnd = withdrawn || currentNow;
    // Tempo integral: abertura até retirada/indeferimento, ou até agora enquanto aberto.
    const overallEnd = terminal || withdrawn || currentNow;
    const stageEnd = (stage === 'RETIRADO' || stage === 'INDEFERIDO')
      ? (terminal || withdrawn || currentNow)
      : currentNow;

    return Object.freeze({
      opening,
      deferred,
      withdrawn,
      terminal,
      stageStart,
      normalEnd,
      overallEnd,
      totalDays: calendarDaysBetween(opening, normalEnd),
      normalDays: calendarDaysBetween(opening, normalEnd),
      postDeferredDays: deferred ? calendarDaysBetween(deferred, withdrawalEnd) : 0,
      withdrawalDays: deferred ? calendarDaysBetween(deferred, withdrawalEnd) : 0,
      overallDays: calendarDaysBetween(opening, overallEnd),
      stageDays: calendarDaysBetween(stageStart, stageEnd),
      totalFrozen: Boolean(deferred || terminal),
      postDeferredFrozen: Boolean(deferred && withdrawn),
      overallFrozen: Boolean(terminal || withdrawn)
    });
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
    version: 'RC11.3.7',
    resolve,
    elapsedDays,
    stateForDays,
    anchor,
    processMetrics,
    calendarDaysBetween
  });
})(window);
