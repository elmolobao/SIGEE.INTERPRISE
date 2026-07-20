/* SIGEE RC4.3.1 — Gerenciador de estabilidade e retomada */
(function () {
  'use strict';
  if (window.__SIGEE_STABILITY_MANAGER__) return;
  window.__SIGEE_STABILITY_MANAGER__ = true;

  let retomadaTimer = 0;
  let retomadaEmAndamento = false;

  function removerEstadosTravados() {
    document.documentElement.classList.remove('loading', 'is-loading', 'sigee-loading');
    document.body?.classList.remove('loading', 'is-loading', 'sigee-loading');
    document.querySelectorAll('[data-sigee-loading-overlay="true"]').forEach(el => el.remove());
  }

  function retomar() {
    clearTimeout(retomadaTimer);
    retomadaTimer = setTimeout(function () {
      if (document.hidden || retomadaEmAndamento) return;
      retomadaEmAndamento = true;
      try {
        removerEstadosTravados();
        // Não reinicializa a aplicação inteira. Apenas solicita atualização do
        // módulo visível, evitando rajadas de timers e consultas acumuladas.
        const processos = document.getElementById('aba-processos');
        const escolas = document.getElementById('aba-escolas');
        if (processos && !processos.classList.contains('hidden')) {
          window.SIGEE_REINSTALAR_CENTRAL_PROCESSOS_257B?.();
        } else if (escolas && !escolas.classList.contains('hidden')) {
          window.SIGEE_Escolas?.renderizar?.();
        }
      } catch (erro) {
        console.warn('[SIGEE RC4.3.1] Retomada segura não concluída.', erro);
      } finally {
        retomadaEmAndamento = false;
      }
    }, 250);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) retomar();
  }, { passive: true });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) retomar();
  }, { passive: true });

  window.SIGEE_STABILITY = { retomar, version: 'RC4.3.1' };
})();
