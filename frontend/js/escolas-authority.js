/* =====================================================================
   SIGEE Sprint 2.4.6D — Autoridade do Módulo de Escolas
   Carregado após app.js para impedir sobrescrita das funções oficiais.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_ESCOLAS_AUTHORITY_246D__)return;
  window.__SIGEE_ESCOLAS_AUTHORITY_246D__=true;

  function modulo(){
    return window.SIGEE_Escolas || null;
  }

  function vincularGlobais(){
    const m=modulo();
    if(!m)return false;

    window.abrirModalNovaEscola=function(){
      return m.abrirNova.apply(m,arguments);
    };
    window.abrirModalEditarEscolaSIGEE=function(id){
      return m.abrirEditar(id);
    };
    window.editarEscolaSIGEE=function(id){
      return m.abrirEditar(id);
    };
    window.editarEscolaSIGEEV45=function(id){
      return m.abrirEditar(id);
    };
    window.renderizarListaEscolasBufferMemoria=function(){
      return m.renderizar.apply(m,arguments);
    };
    return true;
  }

  function idBotaoAlterar(botao){
    const direto=botao.dataset?.escolaId;
    if(direto)return direto;

    const onclick=botao.getAttribute('onclick')||'';
    const match=onclick.match(/(?:abrirModalEditarEscolaSIGEE|editarEscolaSIGEEV45|editarEscolaSIGEE)\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return match?.[1]||'';
  }

  document.addEventListener('click',function(event){
    const novo=event.target.closest(
      'button[onclick*="abrirModalNovaEscola"], .btn-nova-escola, #btn-cadastrar-escola'
    );
    if(novo){
      const m=modulo();
      if(!m)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      m.abrirNova();
      return;
    }

    const alterar=event.target.closest(
      '.btn-alterar-escola-sigee, button[onclick*="abrirModalEditarEscolaSIGEE"], button[onclick*="editarEscolaSIGEEV45"], button[onclick*="editarEscolaSIGEE"]'
    );
    if(alterar){
      const m=modulo();
      if(!m)return;
      const id=idBotaoAlterar(alterar);
      if(!id)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      m.abrirEditar(id);
    }
  },true);

  function iniciar(){
    if(vincularGlobais()){
      console.info('[SIGEE] Autoridade do módulo de Escolas 2.4.6D aplicada.');
      return;
    }
    setTimeout(iniciar,100);
  }

  window.addEventListener('load',()=>setTimeout(iniciar,50));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,50));

  // Reafirma as funções caso algum script tardio tente sobrescrevê-las.
  setTimeout(iniciar,800);
  setTimeout(iniciar,2000);
})();
