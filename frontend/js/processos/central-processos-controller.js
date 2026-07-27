/* SIGEE RC8.3.0 — Central autoritativa, fila única e preservação do estado visual. */
(function (window, document) {
  'use strict';
  if (window.__SIGEE_CENTRAL_PROCESSOS_RC830__) return;
  window.__SIGEE_CENTRAL_PROCESSOS_RC830__ = true;

  let timer = 0;
  let executando = false;
  let pendente = false;
  let pendenteContadores = false;

  function centralVisivel() {
    const aba = document.getElementById('aba-processos');
    return !!aba && !aba.classList.contains('hidden') && aba.getClientRects().length > 0;
  }

  function modulo() { return window.SIGEE_Processos || null; }

  function capturarEstado() {
    const lista = document.querySelector('#aba-processos .sigee-central-lista');
    const ativo = document.activeElement;
    return {
      scrollTop: lista?.scrollTop || 0,
      scrollLeft: lista?.scrollLeft || 0,
      focoId: ativo?.id || '',
      selecaoInicio: typeof ativo?.selectionStart === 'number' ? ativo.selectionStart : null,
      selecaoFim: typeof ativo?.selectionEnd === 'number' ? ativo.selectionEnd : null
    };
  }

  function restaurarEstado(estado) {
    requestAnimationFrame(() => {
      const lista = document.querySelector('#aba-processos .sigee-central-lista');
      if (lista) {
        lista.scrollTop = estado.scrollTop;
        lista.scrollLeft = estado.scrollLeft;
      }
      if (estado.focoId) {
        const alvo = document.getElementById(estado.focoId);
        if (alvo && document.activeElement !== alvo) {
          alvo.focus({ preventScroll: true });
          if (estado.selecaoInicio !== null && typeof alvo.setSelectionRange === 'function') {
            try { alvo.setSelectionRange(estado.selecaoInicio, estado.selecaoFim); } catch (_) {}
          }
        }
      }
    });
  }

  function executar(forcarContadores) {
    if (executando) {
      pendente = true;
      pendenteContadores = pendenteContadores || !!forcarContadores;
      return;
    }
    if (!centralVisivel()) return;
    const m = modulo();
    if (!m) return;

    executando = true;
    const estado = capturarEstado();
    try {
      if (forcarContadores && typeof m.contar === 'function') m.contar();
      else if (typeof m.renderizar === 'function') m.renderizar();
    } catch (erro) {
      console.warn('[SIGEE RC8.3.0] Falha ao atualizar a Central:', erro);
    } finally {
      restaurarEstado(estado);
      executando = false;
      if (pendente) {
        const contar = pendenteContadores;
        pendente = false;
        pendenteContadores = false;
        agendar(contar, 80);
      }
    }
  }

  function agendar(forcarContadores = false, atraso = 60) {
    clearTimeout(timer);
    timer = setTimeout(() => executar(forcarContadores), atraso);
  }

  function recarregar(reset = false) {
    if (!centralVisivel()) return;
    if (typeof window.recarregarCentralProcessosSIGEE === 'function') {
      window.recarregarCentralProcessosSIGEE(true, reset);
    } else {
      agendar(true, 0);
    }
  }

  function instalar() {
    const m = modulo();
    if (!m || typeof m.renderizar !== 'function') return false;

    // Compatibilidade: chamadas antigas convergem para a mesma fila, sem recarregar dados.
    window.renderizarProcessosFlutuantes = () => agendar(false, 35);
    window.carregarEContarProcessosHorizontais = () => agendar(true, 35);
    try { renderizarProcessosFlutuantes = window.renderizarProcessosFlutuantes; } catch (_) {}
    try { carregarEContarProcessosHorizontais = window.carregarEContarProcessosHorizontais; } catch (_) {}

    const busca = document.getElementById('busca-proc-nome');
    if (busca && busca.dataset.sigeeCentral830 !== '1') {
      busca.dataset.sigeeCentral830 = '1';
      busca.removeAttribute('oninput');
      let buscaTimer = 0;
      busca.addEventListener('input', () => {
        clearTimeout(buscaTimer);
        buscaTimer = setTimeout(() => recarregar(true), 350);
      });
    }

    const filtroNte = document.getElementById('filtro-processos-nte');
    if (filtroNte && filtroNte.dataset.sigeeCentral830 !== '1') {
      filtroNte.dataset.sigeeCentral830 = '1';
      filtroNte.removeAttribute('onchange');
      filtroNte.addEventListener('change', () => recarregar(true));
    }
    if (typeof m.configurarFiltroNte === 'function') m.configurarFiltroNte();

    window.SIGEE_CENTRAL_PROCESSOS = Object.freeze({
      atualizar: () => agendar(true, 0),
      renderizar: () => agendar(false, 0),
      recarregar: (resetarPagina = false) => recarregar(resetarPagina),
      instalar,
      versao: 'RC8.3.0'
    });
    agendar(true, 0);
    return true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar, { once: true });
  else instalar();
  window.addEventListener('load', instalar, { once: true });

  document.addEventListener('sigee:navegacao-concluida', () => {
    if (centralVisivel()) agendar(true, 40);
  });

  // Uma sincronização em segundo plano solicita uma única recarga remota, sem resetar página.
  document.addEventListener('sigee:processos-dados-atualizados', () => recarregar(false));
  document.addEventListener('sigee:workflow-clock-alterado', () => agendar(true, 40));
})(window, document);
