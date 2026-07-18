/* =====================================================================
   SIGEE Sprint 3.7.2 — Template Oficial das Janelas
   Mantém eventos e campos; apenas normaliza a ordem visual.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_COMPONENTS_372__)return;
  window.__SIGEE_WORKFLOW_COMPONENTS_372__=true;
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();

  function body(modal){return modal.querySelector(':scope > .sigee-modal33-body,:scope > .sigee-wam-body,:scope > .sigee-wfe-body')||modal.querySelector('.sigee-modal33-body,.sigee-wam-body,.sigee-wfe-body');}
  function resumo(el){return el.matches?.('.sigee-resumo33,.sigee-wam-summary,.sigee-wfe-summary');}
  function tarefa(el){
    if(el.matches?.('.sigee-tarefa-card,.sigee-tarefa-obrigatoria33,.sigee-wam-task,.sigee-wam-message'))return true;
    const t=norm(el.textContent);
    return (t.includes('MENSAGEM INSTITUCIONAL')||t.includes('TAREFA OBRIGATORIA')||t.includes('ENVIAR E-MAIL'))&&!!el.querySelector('input[type="checkbox"]');
  }
  function rodape(el){
    if(el.matches?.('.sigee-wam-footer,.sigee-wfe-footer,.sigee-acoes33'))return !!el.querySelector('button');
    return false;
  }
  function historico(el){return el.matches?.('.sigee-linkhistorico33')||norm(el.textContent).includes('HISTORICO COMPLETO');}

  function marcarComponentes(modal){
    modal.querySelectorAll('input[type="checkbox"]').forEach(check=>{
      let bloco=check.closest('.sigee-tarefa-obrigatoria33,.sigee-wam-task,.sigee-wam-message,.sigee-wfe-action,section,article,fieldset,div');
      while(bloco&&bloco!==modal){
        const t=norm(bloco.textContent);
        if(t.includes('MENSAGEM INSTITUCIONAL')||t.includes('TAREFA OBRIGATORIA')||t.includes('ENVIAR E-MAIL'))break;
        bloco=bloco.parentElement;
      }
      if(bloco&&bloco!==modal){bloco.classList.add('sigee-tarefa-card');check.closest('label')?.classList.add('sigee-tarefa-confirmacao');}
    });
    modal.querySelectorAll('select').forEach(select=>{
      let bloco=select.closest('.sigee-wam-selection,.sigee-wam-responsible,.sigee-wfe-responsible,fieldset,section,article');
      if(bloco&&/RESPONSAVEL|SELECAO OBRIGATORIA/.test(norm(bloco.textContent)))bloco.classList.add('sigee-responsavel-card');
    });
  }

  function padronizar(modal){
    if(!modal)return;
    marcarComponentes(modal);
    const b=body(modal);if(!b)return;
    modal.classList.add('sigee-modal-padrao');

    /* Reaplica quando o conteúdo do modal for reconstruído. */
    const filhos=[...b.children].filter(el=>!el.classList.contains('sigee-janela-conteudo')&&!el.classList.contains('sigee-janela-rodape'));
    const r=filhos.find(resumo);
    const tarefas=filhos.filter(tarefa);
    const rodapes=filhos.filter(rodape);
    const historicos=filhos.filter(historico);

    const conteudo=document.createElement('div');conteudo.className='sigee-janela-conteudo';
    filhos.forEach(el=>{if(el===r||tarefas.includes(el)||rodapes.includes(el)||historicos.includes(el))return;conteudo.appendChild(el);});
    const footer=document.createElement('div');footer.className='sigee-janela-rodape';
    historicos.forEach(el=>footer.appendChild(el));
    rodapes.forEach(el=>{while(el.firstChild)footer.appendChild(el.firstChild);el.remove();});

    b.querySelectorAll(':scope > .sigee-janela-conteudo,:scope > .sigee-janela-rodape').forEach(el=>el.remove());
    if(r)b.appendChild(r);
    if(conteudo.childElementCount)b.appendChild(conteudo);
    tarefas.forEach(el=>b.appendChild(el));
    if(footer.childElementCount)b.appendChild(footer);
    modal.dataset.sigeeTemplate372='1';
  }

  function aplicar(){document.querySelectorAll('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden) > div').forEach(padronizar);}
  let agendado=false;
  new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;aplicar();});})
    .observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,300));
  console.info('[SIGEE] Template oficial de janelas 3.7.2 carregado.');
})();
