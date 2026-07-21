/* SIGEE RC4.5.26 — Controlador final do Catálogo de Escolas */
(function () {
  'use strict';

  let timerPesquisa = null;
  let instalado = false;

  function modulo() {
    return window.SIGEE_Escolas || null;
  }

  function renderizar() {
    const m = modulo();
    if (m && typeof m.renderizar === 'function') return m.renderizar();
    return false;
  }

  function filtrar() {
    const m = modulo();
    if (m && typeof m.filtrar === 'function') return m.filtrar();
    return renderizar();
  }

  function mudarPagina(direcao) {
    const m = modulo();
    if (m && typeof m.mudarPagina === 'function') return m.mudarPagina(direcao);
    return false;
  }

  function substituirElementoSemListeners(elemento) {
    if (!elemento || !elemento.parentNode) return elemento;
    const clone = elemento.cloneNode(true);
    elemento.parentNode.replaceChild(clone, elemento);
    return clone;
  }

  function instalarEventos() {
    const buscaOriginal = document.getElementById('busca-escola');
    const anteriorOriginal = document.getElementById('btn-escola-anterior');
    const proximaOriginal = document.getElementById('btn-escola-proxima');
    if (!buscaOriginal || !anteriorOriginal || !proximaOriginal) return false;

    const busca = substituirElementoSemListeners(buscaOriginal);
    const anterior = substituirElementoSemListeners(anteriorOriginal);
    const proxima = substituirElementoSemListeners(proximaOriginal);

    busca.removeAttribute('oninput');
    anterior.removeAttribute('onclick');
    proxima.removeAttribute('onclick');

    busca.addEventListener('input', function () {
      clearTimeout(timerPesquisa);
      timerPesquisa = setTimeout(filtrar, 250);
    });

    anterior.addEventListener('click', function (event) {
      event.preventDefault();
      mudarPagina(-1);
    });

    proxima.addEventListener('click', function (event) {
      event.preventDefault();
      mudarPagina(1);
    });

    return true;
  }

  function reafirmarAutoridade() {
    const m = modulo();
    if (!m || typeof m.renderizar !== 'function') return false;

    window.renderizarListaEscolasBufferMemoria = renderizar;
    window.filtrarPorBusca = filtrar;
    window.mudarPaginaEscola = mudarPagina;

    try { renderizarListaEscolasBufferMemoria = renderizar; } catch (_) {}
    try { filtrarPorBusca = filtrar; } catch (_) {}
    try { mudarPaginaEscola = mudarPagina; } catch (_) {}

    return true;
  }

  function instalar() {
    reafirmarAutoridade();
    if (!instalado) {
      instalado = instalarEventos();
    }

    const aba = document.getElementById('aba-escolas');
    if (aba && !aba.classList.contains('hidden')) renderizar();
    return true;
  }

  // Reafirma a autoridade ao navegar para o Catálogo, sem substituir o navegador oficial.
  document.addEventListener('click', function (event) {
    const alvo = event.target.closest('[onclick*="navegar(\'escolas\')"], [data-aba="escolas"], [data-modulo="escolas"]');
    if (!alvo) return;
    setTimeout(function () {
      reafirmarAutoridade();
      renderizar();
    }, 0);
  }, true);

  window.SIGEE_CATALOGO_CONTROLLER = { instalar, renderizar, filtrar, mudarPagina };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
  window.addEventListener('load', function () {
    instalar();
    setTimeout(reafirmarAutoridade, 0);
    setTimeout(reafirmarAutoridade, 300);
  }, { once: true });
})();
