/* =====================================================================
   SIGEE Sprint 2.4.5C — Classificador Seguro dos Componentes do Workflow
   Somente adiciona classes. Não recria, move ou altera campos/eventos.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_COMPONENTS_245C__)return;
  window.__SIGEE_WORKFLOW_COMPONENTS_245C__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  function localizarBlocoResponsavel(modal){
    const selects=[...modal.querySelectorAll('select')];
    selects.forEach(select=>{
      let bloco=select.closest(
        '.sigee-wam-selection,.sigee-wam-responsible,.sigee-wfe-responsible,fieldset,section,article'
      );

      if(!bloco){
        let atual=select.parentElement;
        while(atual && atual!==modal){
          const t=norm(atual.textContent);
          if(t.includes('RESPONSAVEL')||t.includes('SELECAO OBRIGATORIA')){
            bloco=atual;
            break;
          }
          atual=atual.parentElement;
        }
      }

      if(!bloco)return;
      const texto=norm(bloco.textContent);
      if(!texto.includes('RESPONSAVEL')&&!texto.includes('SELECAO OBRIGATORIA'))return;

      bloco.classList.add('sigee-responsavel-card');

      // Apenas classifica textos existentes, sem mudar conteúdo ou posição.
      [...bloco.querySelectorAll('h1,h2,h3,h4,strong,span,p,small')].forEach(el=>{
        const t=norm(el.textContent);
        if(t==='SELECAO OBRIGATORIA' || t.includes('SELECAO OBRIGATORIA')){
          el.classList.add('sigee-selecao-obrigatoria-titulo');
        }else if(t.includes('RESPONSAVEL PELA') && !el.closest('label')){
          el.classList.add('sigee-selecao-obrigatoria-subtitulo');
        }
      });

      let status=bloco.querySelector('.sigee-responsavel-status');
      if(!status){
        const mensagens=[...bloco.querySelectorAll('div,p,span,small')];
        status=mensagens.find(el=>{
          const t=norm(el.textContent);
          return t.includes('SELECIONE UM PROFISSIONAL') ||
                 t.includes('PROFISSIONAL SELECIONADO');
        });
        if(status)status.classList.add('sigee-responsavel-status');
      }

      if(status){
        const atualizar=()=>{
          const opt=select.selectedOptions?.[0];
          const valido=String(select.value||'').trim() &&
            !/SELECIONE/i.test(opt?.textContent||'');
          status.classList.toggle('pendente',!valido);
        };
        if(select.dataset.sigeeStatusLigado!=='1'){
          select.addEventListener('change',atualizar);
          select.dataset.sigeeStatusLigado='1';
        }
        atualizar();
      }
    });
  }

  function localizarTarefa(modal){
    [...modal.querySelectorAll('input[type="checkbox"]')].forEach(check=>{
      let bloco=check.closest('.sigee-wam-task,.sigee-wfe-action,section,article,fieldset');
      if(!bloco)return;
      const texto=norm(bloco.textContent);
      if(!texto.includes('TAREFA OBRIGATORIA') &&
         !texto.includes('ENVIAR E-MAIL') &&
         !texto.includes('CONFIRMO'))return;

      bloco.classList.add('sigee-tarefa-card');
      const label=check.closest('label');
      if(label)label.classList.add('sigee-tarefa-confirmacao');
    });
  }

  function processar(modal){
    localizarBlocoResponsavel(modal);
    localizarTarefa(modal);
  }

  function aplicar(){
    document.querySelectorAll(
      '.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)'
    ).forEach(processar);
  }

  let agendado=false;
  const observer=new MutationObserver(()=>{
    if(agendado)return;
    agendado=true;
    requestAnimationFrame(()=>{
      agendado=false;
      aplicar();
    });
  });

  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,300));

  console.info('[SIGEE] Componentes seguros do Workflow 2.4.5C carregados.');
})();
