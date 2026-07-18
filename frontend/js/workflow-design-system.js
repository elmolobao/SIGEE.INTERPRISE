/* =====================================================================
   SIGEE Sprint 2.4.5 — Classificador Visual do Workflow
   Não interfere em eventos, submits, permissões ou regras.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_DESIGN_245__) return;
  window.__SIGEE_WORKFLOW_DESIGN_245__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  function classeEtapa(texto){
    const t=norm(texto);
    if(t.includes('DOCUMENTO RECEBIDO')||t.includes('PASTA LOCALIZADA')) return 'sigee-wf-etapa-documento';
    if(t.includes('REITERACAO COM URGENCIA')||t.includes('REITERACAO URGENTE')) return 'sigee-wf-etapa-reiteracao-urgente';
    if(t.includes('REITERACAO')) return 'sigee-wf-etapa-reiteracao';
    if(t.includes('RETIFICACAO')) return 'sigee-wf-etapa-retificacao';
    if(t.includes('CONFIRMACAO DOS DADOS')||t.includes('CONFIRMAR DADOS')) return 'sigee-wf-etapa-confirmacao';
    if(t.includes('PEDIDO DE ATAS')||t.includes('CONSULTA DE ATAS')) return 'sigee-wf-etapa-atas';
    if(t.includes('INDEFER')) return 'sigee-wf-etapa-indeferido';
    if(t.includes('REGISTRAR RETIRADA')||t.includes('ENTREGA E RETIRADA')||t.includes('RETIRADO')) return 'sigee-wf-etapa-retirado';
    if(t.includes('DEFER')||t.includes('AGUARDANDO RETIRADA')) return 'sigee-wf-etapa-deferido';
    if(t.includes('ASSINATURA')) return 'sigee-wf-etapa-assinatura';
    if(t.includes('CONFERENCIA')) return 'sigee-wf-etapa-conferencia';
    if(t.includes('DIGITACAO')) return 'sigee-wf-etapa-digitacao';
    if(t.includes('PENDENCIA')) return 'sigee-wf-etapa-pendencia';
    if(t.includes('ANALISE')) return 'sigee-wf-etapa-analise';
    return 'sigee-wf-etapa-analise';
  }

  function prepararModal(modal){
    if(!modal || modal.dataset.sigeeDesign245==='1') return;

    const texto=[
      modal.querySelector('h1,h2,h3')?.textContent,
      modal.textContent?.slice(0,500)
    ].join(' ');

    modal.classList.add(classeEtapa(texto));

    const botoes=modal.querySelectorAll('button');
    botoes.forEach(btn=>{
      const t=norm(btn.textContent);
      const ehCancelar=t.includes('CANCELAR')||t.includes('VOLTAR')||t==='X'||t==='✕';
      const ehAcao=
        t.includes('ENVIAR PARA')||
        t.includes('DEFERIR')||
        t.includes('INDEFERIR')||
        t.includes('EXECUTAR')||
        t.includes('CONCLUIR')||
        t.includes('FINALIZAR')||
        t.includes('CONFIRMAR')||
        t.includes('AGUARDANDO RETIRADA');

      if(ehCancelar) btn.classList.add('sigee-workflow-acao-secundaria');
      if(ehAcao) btn.classList.add('sigee-workflow-acao-principal');
    });

    modal.dataset.sigeeDesign245='1';
  }

  function aplicar(){
    document.querySelectorAll(
      '.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)'
    ).forEach(prepararModal);
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

  console.info('[SIGEE] Design System do Workflow 2.4.5 carregado.');
})();
