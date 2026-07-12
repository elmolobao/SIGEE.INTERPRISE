/* =====================================================================
 * SIGEE — Workflow Engine declarativo.
 * Sprint 1.0 — S1-E2.1 / versão 0.9.3.2
 *
 * Núcleo em memória responsável por validar estados, eventos e transições.
 * Mantém integralmente a API de compatibilidade criada na versão 0.9.3.1.
 * Não persiste dados, não altera telas e não envia comunicações.
 * ===================================================================== */
(function (window) {
  'use strict';

  const VERSION = '0.9.4.0';

  const stateManager = window.SIGEE_STATE_MANAGER || null;

  if (!stateManager) {
    throw new Error('SIGEE_STATE_MANAGER deve ser carregado antes do Workflow Engine.');
  }

  const STATES = stateManager.catalog;

  const EVENTS = Object.freeze({
    SEND_REITERACAO: Object.freeze({ code: 'SEND_REITERACAO', type: 'MANUAL' }),
    SEND_REITERACAO_URGENTE: Object.freeze({ code: 'SEND_REITERACAO_URGENTE', type: 'MANUAL' }),
    CONFIRMAR_DADOS: Object.freeze({ code: 'CONFIRMAR_DADOS', type: 'MANUAL' }),
    RETIFICAR_DADOS: Object.freeze({ code: 'RETIFICAR_DADOS', type: 'MANUAL' }),
    DADOS_CONFIRMADOS: Object.freeze({ code: 'DADOS_CONFIRMADOS', type: 'MANUAL' }),
    DOCUMENTO_RECEBIDO: Object.freeze({ code: 'DOCUMENTO_RECEBIDO', type: 'GLOBAL' }),
    LOCALIZAR_PASTA: Object.freeze({ code: 'LOCALIZAR_PASTA', type: 'MANUAL' }),
    INICIAR_ANALISE: Object.freeze({ code: 'INICIAR_ANALISE', type: 'MANUAL' }),
    PEDIR_ATAS: Object.freeze({ code: 'PEDIR_ATAS', type: 'MANUAL' }),
    ABRIR_PENDENCIA: Object.freeze({ code: 'ABRIR_PENDENCIA', type: 'MANUAL' })
  });

  const TRANSITIONS = Object.freeze({
    DES: Object.freeze({ SEND_REITERACAO: 'RET', LOCALIZAR_PASTA: 'PLA' }),
    RET: Object.freeze({ SEND_REITERACAO_URGENTE: 'REU', LOCALIZAR_PASTA: 'PLA' }),
    REU: Object.freeze({ CONFIRMAR_DADOS: 'CFD', LOCALIZAR_PASTA: 'PLA' }),
    CFD: Object.freeze({ RETIFICAR_DADOS: 'DES', DADOS_CONFIRMADOS: 'CFD', PEDIR_ATAS: 'PEN', LOCALIZAR_PASTA: 'PLA' }),
    PLA: Object.freeze({ INICIAR_ANALISE: 'ANA' }),
    ANA: Object.freeze({ ABRIR_PENDENCIA: 'PEN' }),
    PEN: Object.freeze({})
  });

  function normalizeCode(value) {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function stateExists(stateCode) {
    return stateManager.exists(stateCode);
  }

  function eventExists(eventCode) {
    return Object.prototype.hasOwnProperty.call(EVENTS, normalizeCode(eventCode));
  }

  function getState(stateCode) {
    return stateManager.get(stateCode);
  }

  function getEvent(eventCode) {
    const code = normalizeCode(eventCode);
    return eventExists(code) ? clone(EVENTS[code]) : null;
  }

  function allowedEvents(stateCode) {
    return stateManager.getAllowedEvents(stateCode).filter(function (eventCode) {
      return eventExists(eventCode);
    });
  }

  function canExecute(stateCode, eventCode) {
    const state = normalizeCode(stateCode);
    const event = normalizeCode(eventCode);
    if (!stateExists(state) || !eventExists(event)) return false;
    if (EVENTS[event].type === 'GLOBAL') return true;
    return Boolean(TRANSITIONS[state] && TRANSITIONS[state][event]);
  }

  function preview(stateCode, eventCode) {
    const state = normalizeCode(stateCode);
    const event = normalizeCode(eventCode);

    if (!stateExists(state)) {
      return Object.freeze({ ok: false, error: 'INVALID_STATE', state: state || null, event: event || null });
    }
    if (!eventExists(event)) {
      return Object.freeze({ ok: false, error: 'INVALID_EVENT', state: state, event: event || null });
    }
    if (!canExecute(state, event)) {
      return Object.freeze({ ok: false, error: 'TRANSITION_NOT_ALLOWED', state: state, event: event });
    }

    const isGlobal = EVENTS[event].type === 'GLOBAL';
    const nextState = isGlobal ? state : TRANSITIONS[state][event];

    return Object.freeze({
      ok: true,
      state: state,
      event: event,
      nextState: nextState,
      changed: nextState !== state,
      global: isGlobal,
      resetDeadlineDays: event === 'RETIFICAR_DADOS' ? 30 : null
    });
  }

  function execute(stateCode, eventCode, context) {
    const result = preview(stateCode, eventCode);
    if (!result.ok) return result;

    return Object.freeze(Object.assign({}, result, {
      context: clone(context || {}),
      executedAt: (window.SIGEE_WORKFLOW_CLOCK ? window.SIGEE_WORKFLOW_CLOCK.now() : new Date()).toISOString()
    }));
  }

  function describeState(stateCode) {
    const state = getState(stateCode);
    if (!state) return null;
    state.allowedEvents = allowedEvents(state.code);
    return state;
  }

  // -------------------------------------------------------------------
  // API legada da Entrega 1 — mantida para compatibilidade das telas.
  // -------------------------------------------------------------------
  function config() { return window.SIGEE_POP_CONFIG || null; }
  function mensagens() { return window.SIGEE_MENSAGENS || null; }

  function obterPop(codigo) {
    const source = config();
    return source && typeof source.obter === 'function' ? source.obter(codigo) : null;
  }

  function comunicacoesDoPop(codigo) {
    const pop = obterPop(codigo);
    const source = mensagens();
    if (!pop || !source) return [];
    return (pop.comunicacoesObrigatorias || []).map(function (numero) {
      return source.obter(numero);
    }).filter(Boolean);
  }

  function validarConfirmacoes(codigo, confirmacoes) {
    const pop = obterPop(codigo);
    if (!pop) return { valido: false, pendencias: ['POP_NAO_ENCONTRADO'] };

    const marcadas = confirmacoes || {};
    const pendencias = (pop.comunicacoesObrigatorias || []).filter(function (numero) {
      return marcadas[numero] !== true;
    });

    return {
      valido: pendencias.length === 0,
      pendencias: pendencias,
      total: (pop.comunicacoesObrigatorias || []).length,
      confirmadas: (pop.comunicacoesObrigatorias || []).length - pendencias.length
    };
  }

  function eventoDisponivel(codigoPop, codigoEvento) {
    const source = config();
    if (!source) return false;
    const evento = source.obterEvento(codigoEvento);
    return Boolean(evento && evento.disponivelEm.indexOf(codigoPop) >= 0);
  }

  function resolverResultado(codigoPop, resultado) {
    const pop = obterPop(codigoPop);
    if (!pop || !pop.resultados) return null;
    return pop.resultados[resultado] || null;
  }

  function proximaAcaoSemRetorno(codigoPop) {
    const pop = obterPop(codigoPop);
    if (!pop) return null;
    if (pop.proximoPopSemRetorno) return { proximoPop: pop.proximoPopSemRetorno };
    return pop.conclusao || null;
  }

  function descrever(codigoPop) {
    const pop = obterPop(codigoPop);
    if (!pop) return null;
    return {
      codigo: pop.codigo,
      nome: pop.nome,
      etapa: pop.etapa || pop.etapaOrigem || null,
      prazoDias: pop.prazoDias == null ? null : pop.prazoDias,
      comunicacoes: comunicacoesDoPop(codigoPop),
      eventoDocumentoRecebido: eventoDisponivel(codigoPop, 'DOCUMENTO_RECEBIDO'),
      homologado: Boolean(pop.homologado)
    };
  }

  window.SIGEE_WORKFLOW = Object.freeze({
    // Workflow Engine 0.9.3.3
    states: STATES,
    events: EVENTS,
    transitions: TRANSITIONS,
    stateExists: stateExists,
    eventExists: eventExists,
    getState: getState,
    getEvent: getEvent,
    describeState: describeState,
    allowedEvents: allowedEvents,
    canExecute: canExecute,
    preview: preview,
    execute: execute,
    clock: window.SIGEE_WORKFLOW_CLOCK || null,
    timer: window.SIGEE_TIMER_MANAGER || null,

    // Compatibilidade 0.9.3.1
    obterPop: obterPop,
    descrever: descrever,
    comunicacoesDoPop: comunicacoesDoPop,
    validarConfirmacoes: validarConfirmacoes,
    eventoDisponivel: eventoDisponivel,
    resolverResultado: resolverResultado,
    proximaAcaoSemRetorno: proximaAcaoSemRetorno,
    versao: VERSION
  });
})(window);
