// SIGEE Enterprise 1.0
// Núcleo de inicialização e utilitários globais. O código funcional principal foi preservado em app.js para manter compatibilidade total nesta primeira versão Enterprise.
// Mantido separado para evolução modular sem custo adicional e sem regressões.

/* ============================================================
   SIGEE Enterprise 2.1 — Identidade e mensagem de boas-vindas
   Atualiza apenas elementos visuais; não interfere no login.
   ============================================================ */
(function(){
  'use strict';
  if (window.__SIGEE_UI_210__) return;
  window.__SIGEE_UI_210__ = true;

  function texto(v){ return v == null ? '' : String(v).trim(); }

  function obterUsuario(){
    try {
      return window.usuarioLogado ||
        (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null) ||
        null;
    } catch(e) {
      return window.usuarioLogado || null;
    }
  }

  function primeiroNome(nome){
    const limpo = texto(nome);
    return limpo ? limpo.split(/\s+/)[0] : 'Usuário SIGEE';
  }

  function atualizarBoasVindas(){
    const alvo = document.getElementById('sigee-boas-vindas-nome');
    if (!alvo) return;
    const usuario = obterUsuario();
    alvo.textContent = primeiroNome(usuario && (usuario.nome || usuario.name || usuario.email));
  }

  function observarAcesso(){
    const dashboard = document.getElementById('sistema-dashboard');
    if (!dashboard) return;

    const observer = new MutationObserver(function(){
      if (!dashboard.classList.contains('hidden')) {
        atualizarBoasVindas();
      }
    });

    observer.observe(dashboard, {attributes:true, attributeFilter:['class']});
  }

  document.addEventListener('DOMContentLoaded', function(){
    atualizarBoasVindas();
    observarAcesso();
  });

  window.addEventListener('load', function(){
    atualizarBoasVindas();
    setTimeout(atualizarBoasVindas, 350);
    setTimeout(atualizarBoasVindas, 1000);
  });

  window.SIGEE_UI = Object.freeze({
    version:'2.1.0',
    atualizarBoasVindas:atualizarBoasVindas
  });
})();
