/* SIGEE RC4.6.1 — Central paginada e reconexão Supabase */
(function (window, document) {
  'use strict';
  if (window.__SIGEE_CENTRAL_PROCESSOS_4527__) return;
  window.__SIGEE_CENTRAL_PROCESSOS_4527__ = true;

  let timer = 0;
  let executando = false;
  let pendente = false;

  function centralVisivel() {
    const aba = document.getElementById('aba-processos');
    return !!aba && !aba.classList.contains('hidden') && aba.getClientRects().length > 0;
  }

  function modulo() {
    return window.SIGEE_Processos || null;
  }

  function executar(forcarContadores) {
    if (executando) {
      pendente = true;
      return;
    }
    if (!centralVisivel()) return;
    const m = modulo();
    if (!m) return;

    executando = true;
    try {
      if (forcarContadores && typeof m.contar === 'function') m.contar();
      else if (typeof m.renderizar === 'function') m.renderizar();
    } catch (erro) {
      console.warn('[SIGEE RC4.5.27] Falha ao atualizar a Central:', erro);
    } finally {
      executando = false;
      if (pendente) {
        pendente = false;
        agendar(false, 80);
      }
    }
  }

  function agendar(forcarContadores = false, atraso = 60) {
    clearTimeout(timer);
    timer = setTimeout(() => executar(forcarContadores), atraso);
  }

  function instalar() {
    const m = modulo();
    if (!m || typeof m.renderizar !== 'function') return false;

    // Todas as chamadas legadas convergem para uma fila única.
    window.renderizarProcessosFlutuantes = function () {
      agendar(false, 35);
    };
    window.carregarEContarProcessosHorizontais = function () {
      agendar(true, 35);
    };
    try { renderizarProcessosFlutuantes = window.renderizarProcessosFlutuantes; } catch (_) {}
    try { carregarEContarProcessosHorizontais = window.carregarEContarProcessosHorizontais; } catch (_) {}

    const busca = document.getElementById('busca-proc-nome');
    if (busca && busca.dataset.sigeeCentral4527 !== '1') {
      busca.dataset.sigeeCentral4527 = '1';
      busca.removeAttribute('oninput');
      let buscaTimer=0; busca.addEventListener('input', () => { clearTimeout(buscaTimer); buscaTimer=setTimeout(()=>window.recarregarCentralProcessosSIGEE?.(true,true),350); });
    }

    const filtroNte = document.getElementById('filtro-processos-nte');
    if (filtroNte && filtroNte.dataset.sigeeCentralNte !== '1') {
      filtroNte.dataset.sigeeCentralNte = '1';
      filtroNte.removeAttribute('onchange');
      filtroNte.addEventListener('change', () => window.recarregarCentralProcessosSIGEE?.(true,true));
    }
    if (typeof m.configurarFiltroNte === 'function') m.configurarFiltroNte();

    window.SIGEE_CENTRAL_PROCESSOS = {
      atualizar: () => agendar(true, 0),
      renderizar: () => agendar(false, 0),
      instalar
    };
    agendar(true, 0);
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else instalar();
  window.addEventListener('load', instalar, { once: true });
  document.addEventListener('sigee:navegacao-concluida', () => {
    if (centralVisivel()) agendar(true, 40);
  });
})(window, document);
