/* SIGEE RC4.6.7 — Normalização territorial institucional */
(function (window) {
  'use strict';

  function normalizarNte(valor) {
    const texto = valor == null ? '' : String(valor).trim();
    if (!texto) return '';
    if (/^SEC\b/i.test(texto) || /TODOS\s+OS\s+NTE/i.test(texto)) return texto;
    const match = texto.match(/(?:NTE\s*[- ]?\s*)?(\d{1,2})/i);
    if (!match) return texto;
    const numero = Number(match[1]);
    if (!Number.isInteger(numero) || numero < 1 || numero > 27) return texto;
    return `NTE-${String(numero).padStart(2, '0')}`;
  }

  function normalizarPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    if (Object.prototype.hasOwnProperty.call(payload, 'nte')) {
      payload.nte = normalizarNte(payload.nte) || null;
    }
    return payload;
  }

  window.SIGEE_NORMALIZACAO_NTE = Object.freeze({
    normalizar: normalizarNte,
    aplicarPayload: normalizarPayload
  });
  window.normalizarNteSIGEE = normalizarNte;
})(window);
