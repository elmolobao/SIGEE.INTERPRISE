/* SIGEE RC5.8.6 — Gerenciador de desempenho e ciclo de vida */
(function () {
  'use strict';
  if (window.SIGEE_PERFORMANCE) return;

  const tarefas = new Map();
  const metricas = {
    iniciadasEm: new Date().toISOString(),
    tarefasAtivas: 0,
    execucoes: 0,
    execucoesIgnoradas: 0,
    longTasks: 0,
    maiorLongTaskMs: 0
  };

  const agora = () => (window.performance?.now?.() ?? Date.now());

  function debounce(fn, espera = 120) {
    let timer = 0;
    return function () {
      const contexto = this;
      const argumentos = arguments;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(contexto, argumentos), espera);
    };
  }

  function aCada(chave, fn, intervaloMs, opcoes = {}) {
    if (!chave || typeof fn !== 'function') return () => {};
    cancelar(chave);

    const estado = {
      chave,
      ativo: true,
      timer: 0,
      intervaloMs: Math.max(1000, Number(intervaloMs) || 1000),
      somenteVisivel: opcoes.somenteVisivel !== false,
      condicao: typeof opcoes.condicao === 'function' ? opcoes.condicao : null,
      executarAgora: opcoes.executarAgora === true,
      ultimaExecucao: 0
    };

    async function ciclo() {
      if (!estado.ativo) return;
      const inicio = agora();
      const visivel = !estado.somenteVisivel || document.visibilityState !== 'hidden';
      const permitido = !estado.condicao || estado.condicao() === true;
      if (visivel && permitido) {
        try {
          estado.ultimaExecucao = Date.now();
          metricas.execucoes++;
          await fn();
        } catch (erro) {
          console.warn(`[SIGEE Performance] Falha na tarefa ${chave}:`, erro);
        }
      } else {
        metricas.execucoesIgnoradas++;
      }
      const gasto = Math.max(0, agora() - inicio);
      estado.timer = setTimeout(ciclo, Math.max(250, estado.intervaloMs - gasto));
    }

    tarefas.set(chave, estado);
    metricas.tarefasAtivas = tarefas.size;
    estado.timer = setTimeout(ciclo, estado.executarAgora ? 0 : estado.intervaloMs);
    return () => cancelar(chave);
  }

  function cancelar(chave) {
    const estado = tarefas.get(chave);
    if (!estado) return false;
    estado.ativo = false;
    clearTimeout(estado.timer);
    tarefas.delete(chave);
    metricas.tarefasAtivas = tarefas.size;
    return true;
  }

  function executarQuandoVisivel(fn) {
    if (document.visibilityState !== 'hidden') return Promise.resolve().then(fn);
    return new Promise(resolve => {
      const aoVoltar = () => {
        if (document.visibilityState === 'hidden') return;
        document.removeEventListener('visibilitychange', aoVoltar);
        Promise.resolve().then(fn).then(resolve, resolve);
      };
      document.addEventListener('visibilitychange', aoVoltar);
    });
  }

  try {
    if ('PerformanceObserver' in window) {
      const observador = new PerformanceObserver(lista => {
        for (const entrada of lista.getEntries()) {
          metricas.longTasks++;
          metricas.maiorLongTaskMs = Math.max(metricas.maiorLongTaskMs, Math.round(entrada.duration || 0));
        }
      });
      observador.observe({ entryTypes: ['longtask'] });
    }
  } catch (_) {}

  window.SIGEE_PERFORMANCE = Object.freeze({
    versao: 'RC5.8.6',
    debounce,
    aCada,
    cancelar,
    executarQuandoVisivel,
    metricas: () => ({ ...metricas, tarefas: [...tarefas.keys()] })
  });

  console.info('[SIGEE] Gerenciador de desempenho RC5.8.6 ativo.');
})();
