/* =====================================================================
   SIGEE Sprint 3.7 — Template Institucional Único das Janelas
   Reorganiza apenas a estrutura visual; preserva listeners e regras.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_COMPONENTS_370__)return;
  window.__SIGEE_WORKFLOW_COMPONENTS_370__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  function localizarBlocoResponsavel(modal){
    const selects=[...modal.querySelectorAll('select')];
    selects.forEach(select=>{
      let bloco=select.closest('.sigee-wam-selection,.sigee-wam-responsible,.sigee-wfe-responsible,fieldset,section,article');
      if(!bloco){
        let atual=select.parentElement;
        while(atual&&atual!==modal){
          const t=norm(atual.textContent);
          if(t.includes('RESPONSAVEL')||t.includes('SELECAO OBRIGATORIA')){bloco=atual;break;}
          atual=atual.parentElement;
        }
      }
      if(!bloco)return;
      const texto=norm(bloco.textContent);
      if(!texto.includes('RESPONSAVEL')&&!texto.includes('SELECAO OBRIGATORIA'))return;
      bloco.classList.add('sigee-responsavel-card');
      [...bloco.querySelectorAll('h1,h2,h3,h4,strong,span,p,small')].forEach(el=>{
        const t=norm(el.textContent);
        if(t.includes('SELECAO OBRIGATORIA'))el.classList.add('sigee-selecao-obrigatoria-titulo');
        else if(t.includes('RESPONSAVEL PELA')&&!el.closest('label'))el.classList.add('sigee-selecao-obrigatoria-subtitulo');
      });
      let status=[...bloco.querySelectorAll('div,p,span,small')].find(el=>{
        const t=norm(el.textContent);return t.includes('SELECIONE UM PROFISSIONAL')||t.includes('PROFISSIONAL SELECIONADO');
      });
      if(status)status.classList.add('sigee-responsavel-status');
      const atualizar=()=>{
        const opt=select.selectedOptions?.[0];
        const valido=String(select.value||'').trim()&&!/SELECIONE/i.test(opt?.textContent||'');
        status?.classList.toggle('pendente',!valido);
      };
      if(select.dataset.sigeeStatusLigado!=='1'){
        select.addEventListener('change',atualizar);
        select.dataset.sigeeStatusLigado='1';
      }
      atualizar();
    });
  }

  function localizarTarefa(modal){
    [...modal.querySelectorAll('input[type="checkbox"]')].forEach(check=>{
      let bloco=check.closest('.sigee-tarefa-obrigatoria33,.sigee-wam-task,.sigee-wam-message,.sigee-wfe-action,section,article,fieldset');
      if(!bloco)return;
      const texto=norm(bloco.textContent);
      if(!texto.includes('TAREFA OBRIGATORIA')&&!texto.includes('MENSAGEM INSTITUCIONAL')&&!texto.includes('ENVIAR E-MAIL')&&!texto.includes('CONFIRMO'))return;
      bloco.classList.add('sigee-tarefa-card');
      check.closest('label')?.classList.add('sigee-tarefa-confirmacao');
    });
  }

  function classeBotao(btn){
    const t=norm(btn.textContent);
    if(t.includes('HISTORICO')) return 'sigee-btn-historico';
    if(t.includes('CANCELAR')||t.includes('VOLTAR')||t==='X'||t==='✕') return 'sigee-btn-cancelar';
    if(t.includes('INDEFER')) return 'sigee-btn-indeferir';
    if(t.includes('PENDENCIA')) return 'sigee-btn-pendencia';
    if(t.includes('DIGITACAO')) return 'sigee-btn-digitacao';
    if(t.includes('CONFERENCIA')) return 'sigee-btn-conferencia';
    if(t.includes('ASSINATURA')) return 'sigee-btn-assinatura';
    if(t.includes('DEFER')) return 'sigee-btn-deferido';
    if(t.includes('RETIRADA')||t.includes('RETIRADO')) return 'sigee-btn-retirada';
    if(t.includes('RETIFIC')) return 'sigee-btn-retificacao';
    if(t.includes('ATAS')) return 'sigee-btn-atas';
    if(t.includes('DOCUMENTO RECEBIDO')||t.includes('RECEBER DOCUMENTO')) return 'sigee-btn-documento';
    if(t.includes('ANALISE')) return 'sigee-btn-analise';
    if(t.includes('CONCLUIR')||t.includes('CONFIRMAR')||t.includes('PROSSEGUIR')||t.includes('AVANCAR')) return 'sigee-btn-sucesso';
    return '';
  }

  function classificarBotoes(modal){
    modal.querySelectorAll('button').forEach(btn=>{
      const classe=classeBotao(btn);
      if(classe)btn.classList.add(classe);
    });
  }

  function corpoModal(modal){
    return modal.querySelector(':scope > .sigee-modal33-body,:scope > .sigee-wam-body,:scope > .sigee-wfe-body')||
      modal.querySelector('.sigee-modal33-body,.sigee-wam-body,.sigee-wfe-body');
  }

  function ehResumo(el){
    return el.matches?.('.sigee-resumo33,.sigee-wam-summary,.sigee-wfe-summary');
  }
  function ehTarefa(el){
    return el.matches?.('.sigee-tarefa-card,.sigee-tarefa-obrigatoria33,.sigee-wam-task,.sigee-wam-message');
  }
  function ehRodapeOriginal(el){
    if(el.matches?.('.sigee-wam-footer,.sigee-wfe-footer'))return true;
    if(el.matches?.('.sigee-acoes33')){
      const tx=norm(el.textContent);
      return tx.includes('CANCELAR')||tx.includes('ENVIAR PARA')||tx.includes('DEFERIDO')||tx.includes('CONCLUIR RETIRADA')||tx.includes('REINICIAR CICLO')||tx.includes('RECEBER DOCUMENTO');
    }
    return false;
  }

  function padronizarEstrutura(modal){
    if(!modal||modal.dataset.sigeeTemplate370==='1')return;
    const body=corpoModal(modal);
    if(!body)return;

    modal.classList.add('sigee-modal-padrao');
    const filhos=[...body.children];
    const resumo=filhos.find(ehResumo);
    const tarefas=filhos.filter(ehTarefa);
    const rodapes=filhos.filter(ehRodapeOriginal);
    const historicos=filhos.filter(el=>el.matches?.('.sigee-linkhistorico33')||norm(el.textContent).includes('HISTORICO COMPLETO'));

    const conteudo=document.createElement('div');
    conteudo.className='sigee-janela-conteudo';
    filhos.forEach(el=>{
      if(el===resumo||tarefas.includes(el)||rodapes.includes(el)||historicos.includes(el))return;
      conteudo.appendChild(el);
    });

    const rodape=document.createElement('div');
    rodape.className='sigee-janela-rodape';
    historicos.forEach(el=>rodape.appendChild(el));
    rodapes.forEach(el=>{
      while(el.firstChild)rodape.appendChild(el.firstChild);
      el.remove();
    });

    if(resumo)body.appendChild(resumo);
    if(conteudo.childElementCount)body.appendChild(conteudo);
    tarefas.forEach(el=>body.appendChild(el));
    if(rodape.childElementCount)body.appendChild(rodape);

    modal.dataset.sigeeTemplate370='1';
  }

  function processar(modal){
    localizarBlocoResponsavel(modal);
    localizarTarefa(modal);
    classificarBotoes(modal);
    padronizarEstrutura(modal);
  }

  function aplicar(){
    document.querySelectorAll('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden) > div').forEach(processar);
  }

  let agendado=false;
  const observer=new MutationObserver(()=>{
    if(agendado)return;agendado=true;
    requestAnimationFrame(()=>{agendado=false;aplicar();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,300));
  console.info('[SIGEE] Template Institucional das Janelas 3.7 carregado.');
})();
