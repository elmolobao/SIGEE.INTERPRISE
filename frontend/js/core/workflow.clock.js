/* =====================================================================
 * SIGEE — Workflow Clock
 * Sprint 1.0 — PE-01 / versão 0.9.4.0
 *
 * Fonte temporal única do Workflow. Em produção retorna a data oficial;
 * em homologação permite uma data simulada, restrita ao perfil Master.
 * A simulação é local ao navegador e não altera datas persistidas.
 * ===================================================================== */
(function (window) {
  'use strict';

  const VERSION = '0.9.4.0';
  const STORAGE_KEY = 'SIGEE_WORKFLOW_CLOCK_V1';
  const listeners = [];

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function parseDate(value) {
    if (value instanceof Date) return new Date(value.getTime());
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { enabled: false, simulatedAt: null };
      const parsed = JSON.parse(raw);
      const date = parseDate(parsed.simulatedAt);
      return {
        enabled: parsed.enabled === true && Boolean(date),
        simulatedAt: date ? date.toISOString() : null
      };
    } catch (error) {
      return { enabled: false, simulatedAt: null };
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify();
  }

  function currentUser() {
    return window.usuarioLogado || null;
  }

  function isMaster() {
    const user = currentUser();
    const profile = String(user && user.perfil || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return profile.indexOf('MASTER') >= 0;
  }

  function requireMaster() {
    if (!isMaster()) {
      const error = new Error('Modo Homologação disponível exclusivamente para o perfil Master.');
      error.code = 'MASTER_REQUIRED';
      throw error;
    }
  }

  function now() {
    const state = readState();
    if (state.enabled && state.simulatedAt) return new Date(state.simulatedAt);
    return new Date();
  }

  function officialNow() {
    return new Date();
  }

  function status() {
    const state = readState();
    return Object.freeze({
      enabled: state.enabled,
      simulatedAt: state.simulatedAt,
      now: now().toISOString(),
      officialNow: officialNow().toISOString(),
      master: isMaster()
    });
  }

  function enable(dateValue) {
    requireMaster();
    const date = parseDate(dateValue || officialNow());
    if (!date) throw new Error('Data simulada inválida.');
    writeState({ enabled: true, simulatedAt: date.toISOString() });
    audit('Ativou o Modo Homologação em ' + date.toLocaleString('pt-BR'));
    return status();
  }

  function disable() {
    requireMaster();
    writeState({ enabled: false, simulatedAt: null });
    audit('Retornou ao tempo oficial');
    return status();
  }

  function set(dateValue) {
    requireMaster();
    const date = parseDate(dateValue);
    if (!date) throw new Error('Data simulada inválida.');
    writeState({ enabled: true, simulatedAt: date.toISOString() });
    audit('Definiu a data simulada para ' + date.toLocaleString('pt-BR'));
    return status();
  }

  function advanceDays(days) {
    requireMaster();
    const amount = Number(days);
    if (!Number.isFinite(amount)) throw new Error('Quantidade de dias inválida.');
    const base = now();
    base.setDate(base.getDate() + amount);
    writeState({ enabled: true, simulatedAt: base.toISOString() });
    audit('Avançou o relógio de homologação em ' + amount + ' dia(s)');
    return status();
  }

  function audit(action) {
    try {
      if (typeof window.registrarLog === 'function') {
        window.registrarLog('[HOMOLOGAÇÃO TEMPORAL] ' + action);
      }
    } catch (error) {
      console.warn('SIGEE WorkflowClock: não foi possível registrar log.', error);
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return function () {};
    listeners.push(listener);
    return function () {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  function notify() {
    const snapshot = clone(status());
    listeners.slice().forEach(function (listener) {
      try { listener(snapshot); } catch (error) { console.error(error); }
    });
    try {
      window.dispatchEvent(new CustomEvent('sigee:workflow-clock-change', { detail: snapshot }));
    } catch (error) {}
  }

  window.SIGEE_WORKFLOW_CLOCK = Object.freeze({
    version: VERSION,
    now: now,
    officialNow: officialNow,
    status: status,
    isMaster: isMaster,
    enable: enable,
    disable: disable,
    set: set,
    advanceDays: advanceDays,
    subscribe: subscribe
  });
})(window);
