/* =====================================================================
   SIGEE Sprint 3.7.2 — Classificador Visual Oficial
   A etapa vem exclusivamente do título; os botões usam cor por ação.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_DESIGN_372__)return;
  window.__SIGEE_WORKFLOW_DESIGN_372__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const classesEtapa=[
    'sigee-wf-etapa-documento','sigee-wf-etapa-reiteracao-urgente','sigee-wf-etapa-reiteracao',
    'sigee-wf-etapa-retificacao','sigee-wf-etapa-confirmacao','sigee-wf-etapa-atas',
    'sigee-wf-etapa-indeferido','sigee-wf-etapa-deferido','sigee-wf-etapa-retirado',
    'sigee-wf-etapa-assinatura','sigee-wf-etapa-conferencia','sigee-wf-etapa-digitacao',
    'sigee-wf-etapa-pendencia','sigee-wf-etapa-analise'
  ];
  const classesBotao=[
    'sigee-btn-enviar','sigee-btn-avancar','sigee-btn-receber','sigee-btn-concluir','sigee-btn-sucesso',
    'sigee-btn-historico','sigee-btn-cancelar','sigee-btn-secundario','sigee-btn-indeferir','sigee-btn-perigo',
    'sigee-btn-pendencia','sigee-btn-retificacao','sigee-btn-reiteracao','sigee-btn-reiteracao-urgente',
    'sigee-btn-confirmacao','sigee-btn-atas','sigee-btn-deferido'
  ];

  function tituloModal(modal){
    const header=modal.querySelector(':scope > .sigee-modal33-header,:scope > .sigee-wam-header,:scope > .sigee-wfe-head,:scope > header') ||
      modal.querySelector('.sigee-modal33-header,.sigee-wam-header,.sigee-wfe-head,header');
    const titulo=header?.querySelector('h1,h2,h3,strong')?.textContent || header?.textContent || '';
    return norm(titulo.replace(/[×✕]/g,''));
  }

  function classeEtapa(t){
    if(t.includes('DOCUMENTO RECEBIDO')||t.includes('PASTA LOCALIZADA'))return 'sigee-wf-etapa-documento';
    if(t.includes('REITERACAO URGENTE')||t.includes('REITERACAO COM URGENCIA'))return 'sigee-wf-etapa-reiteracao-urgente';
    if(t.includes('REITERACAO'))return 'sigee-wf-etapa-reiteracao';
    if(t.includes('RETIFICACAO'))return 'sigee-wf-etapa-retificacao';
    if(t.includes('CONFIRMACAO DOS DADOS')||t.includes('CONFIRMAR DADOS'))return 'sigee-wf-etapa-confirmacao';
    if(t.includes('PEDIDO DE ATAS')||t.includes('CONSULTA DE ATAS'))return 'sigee-wf-etapa-atas';
    if(t.includes('INDEFER'))return 'sigee-wf-etapa-indeferido';
    if(t.includes('RETIRADA')||t.includes('RETIRADO'))return 'sigee-wf-etapa-retirado';
    if(t.includes('DOCUMENTO ASSINADO')||t.includes('ASSINATURA'))return 'sigee-wf-etapa-assinatura';
    if(t.includes('CONFERENCIA'))return 'sigee-wf-etapa-conferencia';
    if(t.includes('DIGITACAO'))return 'sigee-wf-etapa-digitacao';
    if(t.includes('PENDENCIA'))return 'sigee-wf-etapa-pendencia';
    if(t.includes('ANALISE'))return 'sigee-wf-etapa-analise';
    if(t.includes('DEFERIDO'))return 'sigee-wf-etapa-deferido';
    return '';
  }

  function classificarBotao(btn){
    if(!btn||btn.closest('header,.sigee-modal33-header,.sigee-wam-header,.sigee-wfe-head'))return;
    classesBotao.forEach(c=>btn.classList.remove(c));
    const t=norm(btn.textContent);
    if(!t)return;
    if(t.includes('HISTORICO'))return btn.classList.add('sigee-btn-historico');
    if(t.includes('CANCELAR')||t.includes('VOLTAR'))return btn.classList.add('sigee-btn-cancelar');
    if(t.includes('INDEFER'))return btn.classList.add('sigee-btn-indeferir');
    if(t.includes('REGISTRAR PENDENCIA')||t==='PENDENCIA')return btn.classList.add('sigee-btn-pendencia');
    if(t.includes('RETIFIC'))return btn.classList.add('sigee-btn-retificacao');
    if(t.includes('REITERACAO URGENTE'))return btn.classList.add('sigee-btn-reiteracao-urgente');
    if(t.includes('REITERACAO'))return btn.classList.add('sigee-btn-reiteracao');
    if(t.includes('CONFIRMAR DADOS'))return btn.classList.add('sigee-btn-confirmacao');
    if(t.includes('PEDIDO DE ATAS')||t.includes('SOLICITAR ATAS'))return btn.classList.add('sigee-btn-atas');

    /* Regra homologada: toda ação de enviar/avançar/receber/concluir é verde. */
    if(t.includes('ENVIAR')||t.includes('PROSSEGUIR')||t.includes('AVANCAR')){
      return btn.classList.add('sigee-workflow-acao-principal','sigee-btn-enviar');
    }
    if(t.includes('RECEBER DOCUMENTO')||t.includes('DOCUMENTO RECEBIDO')){
      return btn.classList.add('sigee-workflow-acao-principal','sigee-btn-receber');
    }
    if(t.includes('CONCLUIR')||t.includes('FINALIZAR')){
      return btn.classList.add('sigee-workflow-acao-principal','sigee-btn-concluir');
    }
    if(t.includes('DEFERIR')||t==='DEFERIDO'){
      return btn.classList.add('sigee-workflow-acao-principal','sigee-btn-deferido');
    }
    if(t.includes('CONFIRMAR'))return btn.classList.add('sigee-workflow-acao-principal','sigee-btn-sucesso');
  }

  function preparar(modal){
    if(!modal)return;
    classesEtapa.forEach(c=>modal.classList.remove(c));
    const etapa=classeEtapa(tituloModal(modal));
    if(etapa)modal.classList.add(etapa);
    modal.querySelectorAll('button').forEach(classificarBotao);
    modal.dataset.sigeeDesign372='1';
  }

  function aplicar(){
    document.querySelectorAll('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden) > div').forEach(preparar);
  }
  let agendado=false;
  new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;aplicar();});})
    .observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,250));
  console.info('[SIGEE] Design System oficial 3.7.2 carregado.');
})();
