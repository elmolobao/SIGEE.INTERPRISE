/* =====================================================================
 * SIGEE — Workflow State Manager.
 * Sprint 1.0 — I-001 / versão 0.9.5.0
 *
 * Catálogo central e imutável dos estados oficiais do Workflow.
 * Não persiste dados, não altera telas e não executa transições.
 * ===================================================================== */
(function (window) {
  'use strict';

  const VERSION = '0.9.5.0';

  const STATE_CATALOG = Object.freeze({
    DES: Object.freeze({
      code: 'DES', name: 'Desarquivamento', order: 1, deadline: 30,
      color: '#1976D2', icon: 'folder-open',
      allowedEvents: Object.freeze(['SEND_REITERACAO', 'LOCALIZAR_PASTA', 'DOCUMENTO_RECEBIDO'])
    }),
    RET: Object.freeze({
      code: 'RET', name: 'Reiteração', order: 2, deadline: 7,
      color: '#F9A825', icon: 'mail',
      allowedEvents: Object.freeze(['SEND_REITERACAO_URGENTE', 'LOCALIZAR_PASTA', 'DOCUMENTO_RECEBIDO'])
    }),
    REU: Object.freeze({
      code: 'REU', name: 'Reiteração Urgente', order: 3, deadline: 7,
      color: '#EF6C00', icon: 'alert-triangle',
      allowedEvents: Object.freeze(['CONFIRMAR_DADOS', 'LOCALIZAR_PASTA', 'DOCUMENTO_RECEBIDO'])
    }),
    CFD: Object.freeze({
      code: 'CFD', name: 'Confirmação dos Dados', order: 4, deadline: 7,
      color: '#8E24AA', icon: 'clipboard-check',
      allowedEvents: Object.freeze(['RETIFICAR_DADOS', 'DADOS_CONFIRMADOS', 'PEDIDO_ATAS_DESARQUIVAMENTO', 'LOCALIZAR_PASTA', 'DOCUMENTO_RECEBIDO'])
    }),
    PLA: Object.freeze({
      code: 'PLA', name: 'Pasta Localizada', order: 5, deadline: null,
      color: '#00897B', icon: 'folder-check',
      allowedEvents: Object.freeze(['INICIAR_ANALISE', 'DOCUMENTO_RECEBIDO'])
    }),
    ANA: Object.freeze({
      code: 'ANA', name: 'Análise', order: 6, deadline: 7,
      color: '#3949AB', icon: 'search',
      allowedEvents: Object.freeze(['ABRIR_PENDENCIA', 'PEDIDO_ATAS_ANALISE', 'DOCUMENTO_RECEBIDO'])
    }),
    PEN: Object.freeze({
      code: 'PEN', name: 'Pendência', order: 7, deadline: null,
      color: '#D81B60', icon: 'clock',
      allowedEvents: Object.freeze(['PEDIDO_ATAS_ANALISE', 'DOCUMENTO_RECEBIDO'])
    }),
    DIG: Object.freeze({
      code: 'DIG', name: 'Digitação', order: 8, deadline: null,
      color: '#5E35B1', icon: 'edit-3',
      allowedEvents: Object.freeze(['DOCUMENTO_RECEBIDO'])
    }),
    CON: Object.freeze({
      code: 'CON', name: 'Conferência', order: 9, deadline: null,
      color: '#039BE5', icon: 'check-square',
      allowedEvents: Object.freeze(['DOCUMENTO_RECEBIDO'])
    }),
    ASS: Object.freeze({
      code: 'ASS', name: 'Assinatura', order: 10, deadline: null,
      color: '#6D4C41', icon: 'pen-tool',
      allowedEvents: Object.freeze(['DOCUMENTO_RECEBIDO'])
    }),
    DEF: Object.freeze({
      code: 'DEF', name: 'Deferido', order: 11, deadline: null,
      color: '#43A047', icon: 'check-circle',
      allowedEvents: Object.freeze(['DOCUMENTO_RECEBIDO'])
    }),
    RTR: Object.freeze({
      code: 'RTR', name: 'Retirado', order: 12, deadline: null,
      color: '#546E7A', icon: 'archive',
      allowedEvents: Object.freeze(['DOCUMENTO_RECEBIDO'])
    })
  });

  function normalizeCode(value) {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function exists(code) {
    return Object.prototype.hasOwnProperty.call(STATE_CATALOG, normalizeCode(code));
  }

  function get(code) {
    const normalized = normalizeCode(code);
    return exists(normalized) ? clone(STATE_CATALOG[normalized]) : null;
  }

  function getState(code) {
    return get(code);
  }

  function getStateConfig(code) {
    return get(code);
  }

  function list() {
    return Object.keys(STATE_CATALOG)
      .map(function (code) { return clone(STATE_CATALOG[code]); })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function listStates() {
    return list();
  }

  function getAllowedEvents(code) {
    const state = get(code);
    return state ? state.allowedEvents.slice() : [];
  }

  function getDeadline(code) {
    const state = get(code);
    return state ? state.deadline : null;
  }

  window.SIGEE_STATE_MANAGER = Object.freeze({
    version: VERSION,
    catalog: STATE_CATALOG,
    get: get,
    getState: getState,
    getStateConfig: getStateConfig,
    exists: exists,
    list: list,
    listStates: listStates,
    getAllowedEvents: getAllowedEvents,
    getDeadline: getDeadline
  });
})(window);
