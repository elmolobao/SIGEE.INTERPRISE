/* =====================================================================
   SIGEE Sprint 3.8 — Classificador seguro de componentes
   Não altera posição, conteúdo, eventos ou persistência.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_COMPONENTS_380__)return;
  window.__SIGEE_WORKFLOW_COMPONENTS_380__=true;
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  function processar(modal){
    if(!modal||modal.nodeType!==1)return;
    modal.querySelectorAll('select').forEach(select=>{
      let bloco=select.closest('.sigee-wam-selection,.sigee-wam-responsible,.sigee-wfe-responsible,.sigee-selecao-obrigatoria093,fieldset,section,article');
      if(!bloco)return;
      const t=norm(bloco.textContent);
      if(t.includes('RESPONSAVEL')||t.includes('SELECAO OBRIGATORIA')) bloco.classList.add('sigee-responsavel-card');
    });
    modal.querySelectorAll('input[type="checkbox"]').forEach(check=>{
      const bloco=check.closest('.sigee-wam-task,.sigee-wfe-action,.sigee-tarefa-obrigatoria33,section,article,fieldset');
      if(!bloco)return;
      const t=norm(bloco.textContent);
      if(t.includes('TAREFA OBRIGATORIA')||t.includes('ENVIAR E-MAIL')||t.includes('CONFIRMO')){
        bloco.classList.add('sigee-tarefa-card');
        check.closest('label')?.classList.add('sigee-tarefa-confirmacao');
      }
    });
  }
  function aplicarNo(no){
    if(!(no instanceof Element))return;
    if(no.matches('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)'))processar(no);
    no.querySelectorAll?.('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)').forEach(processar);
  }
  const observer=new MutationObserver(lista=>lista.forEach(m=>m.addedNodes.forEach(aplicarNo)));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>aplicarNo(document.documentElement));
  console.info('[SIGEE] Componentes seguros 3.8 carregados.');
})();
