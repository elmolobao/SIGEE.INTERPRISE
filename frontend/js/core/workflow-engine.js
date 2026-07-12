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

  const VERSION = '0.9.3.2';

  const STATES = Object.freeze({
    DES: Object.freeze({ code: 'DES', name: 'Desarquivamento', deadline: 30 }),
    RET: Object.freeze({ code: 'RET', name: 'Reiteração', deadline: 7 }),
    REU: Object.freeze({ code: 'REU', name: 'Reiteração Urgente', deadline: 7 }),
    CFD: Object.freeze({ code: 'CFD', name: 'Confirmação dos Dados', deadline: 7 }),
    PLA: Object.freeze({ code: 'PLA', name: 'Pasta Localizada', deadline: null }),
    ANA: Object.freeze({ code: 'ANA', name: 'Análise', deadline: 7 }),
    PEN: Object.freeze({ code: 'PEN', name: 'Pendência', deadline: null }),
    DIG: Object.freeze({ code: 'DIG', name: 'Digitação', deadline: null }),
    CON: Object.freeze({ code: 'CON', name: 'Conferência', deadline: null }),
    ASS: Object.freeze({ code: 'ASS', name: 'Assinatura', deadline: null }),
    DEF: Object.freeze({ code: 'DEF', name: 'Deferido', deadline: null }),
    RTR: Object.freeze({ code: 'RTR', name: 'Retirado', deadline: null })
  });

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
    return Object.prototype.hasOwnProperty.call(STATES, normalizeCode(stateCode));
  }

  function eventExists(eventCode) {
    return Object.prototype.hasOwnProperty.call(EVENTS, normalizeCode(eventCode));
  }

  function getState(stateCode) {
    const code = normalizeCode(stateCode);
    return stateExists(code) ? clone(STATES[code]) : null;
  }

  function getEvent(eventCode) {
    const code = normalizeCode(eventCode);
    return eventExists(code) ? clone(EVENTS[code]) : null;
  }

  function allowedEvents(stateCode) {
    const code = normalizeCode(stateCode);
    if (!stateExists(code)) return [];

    const localEvents = Object.keys(TRANSITIONS[code] || {});
    const globalEvents = Object.keys(EVENTS).filter(function (eventCode) {
      return EVENTS[eventCode].type === 'GLOBAL';
    });

    return Array.from(new Set(localEvents.concat(globalEvents)));
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
      executedAt: new Date().toISOString()
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
    // Workflow Engine 0.9.3.2
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
