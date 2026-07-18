/* =====================================================================
   SIGEE Sprint 3.8 — Classificador visual estável
   Apenas adiciona classes. Não move, remove ou recria elementos.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_DESIGN_380__) return;
  window.__SIGEE_WORKFLOW_DESIGN_380__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const ETAPAS=[
    'sigee-wf-etapa-desarquivamento','sigee-wf-etapa-documento','sigee-wf-etapa-analise',
    'sigee-wf-etapa-pendencia','sigee-wf-etapa-digitacao','sigee-wf-etapa-conferencia',
    'sigee-wf-etapa-assinatura','sigee-wf-etapa-deferido','sigee-wf-etapa-indeferido',
    'sigee-wf-etapa-retificacao','sigee-wf-etapa-reiteracao','sigee-wf-etapa-reiteracao-urgente',
    'sigee-wf-etapa-confirmacao','sigee-wf-etapa-atas','sigee-wf-etapa-retirado'
  ];

  function tituloModal(modal){
    return modal.querySelector('.sigee-modal33-header h2,.sigee-wam-header h2,.sigee-wfe-head h2,[id^="modal-fluxo-"] h3,[id^="modal-fluxo-"] h2')?.textContent || '';
  }
  function classeEtapa(texto){
    const t=norm(texto);
    if(t.includes('WORKFLOW EXTERNO')||t.includes('DESARQUIVAMENTO')) return 'sigee-wf-etapa-desarquivamento';
    if(t.includes('DOCUMENTO RECEBIDO')||t.includes('PASTA LOCALIZADA')) return 'sigee-wf-etapa-documento';
    if(t.includes('REITERACAO COM URGENCIA')||t.includes('REITERACAO URGENTE')) return 'sigee-wf-etapa-reiteracao-urgente';
    if(t.includes('REITERACAO')) return 'sigee-wf-etapa-reiteracao';
    if(t.includes('RETIFICACAO')) return 'sigee-wf-etapa-retificacao';
    if(t.includes('CONFIRMACAO DOS DADOS')||t.includes('CONFIRMAR DADOS')) return 'sigee-wf-etapa-confirmacao';
    if(t.includes('PEDIDO DE ATAS')||t.includes('CONSULTA DE ATAS')) return 'sigee-wf-etapa-atas';
    if(t.includes('REGISTRAR RETIRADA')||t.includes('RETIRADO')) return 'sigee-wf-etapa-retirado';
    if(t.includes('INDEFER')) return 'sigee-wf-etapa-indeferido';
    if(t.includes('DEFER')||t.includes('AGUARDANDO RETIRADA')) return 'sigee-wf-etapa-deferido';
    if(t.includes('ASSINATURA')||t.includes('DOCUMENTO ASSINADO')) return 'sigee-wf-etapa-assinatura';
    if(t.includes('CONFERENCIA')) return 'sigee-wf-etapa-conferencia';
    if(t.includes('DIGITACAO')) return 'sigee-wf-etapa-digitacao';
    if(t.includes('PENDENCIA')) return 'sigee-wf-etapa-pendencia';
    if(t.includes('ANALISE')) return 'sigee-wf-etapa-analise';
    return '';
  }
  function classeAcao(btn){
    const t=norm(btn.textContent);
    if(t==='X'||t==='×'||t==='✕') return 'sigee-acao-fechar';
    if(t.includes('HISTORICO')||t.includes('PRONTUARIO')) return 'sigee-acao-historico';
    if(t.includes('CANCELAR')||t.includes('VOLTAR')) return 'sigee-acao-cancelar';
    if(t.includes('INDEFER')||t.includes('EXCLUIR')) return 'sigee-acao-perigo';
    if(t.includes('PENDENCIA')||t.includes('RETORNAR')||t.includes('REABRIR')||t.includes('REGREDIR')) return 'sigee-acao-alerta';
    if(t.includes('RETIFIC')) return 'sigee-acao-neutra';
    if(t.includes('PEDIDO DE ATAS')||t.includes('SOLICITAR ATAS')) return 'sigee-acao-preta';
    if(t.includes('REITERACAO URGENTE')) return 'sigee-acao-perigo';
    if(t.includes('REITERACAO')) return 'sigee-acao-alerta';
    if(t.includes('CONFIRMAR DADOS')) return 'sigee-acao-branca';
    if(t.includes('ENVIAR')||t.includes('PROSSEGUIR')||t.includes('AVANCAR')||t.includes('RECEBER')||t.includes('CONCLUIR')||t.includes('DEFERIR')||t.includes('FINALIZAR')) return 'sigee-acao-avancar';
    return '';
  }
  function prepararModal(modal){
    if(!modal || modal.nodeType!==1) return;
    const etapa=classeEtapa(tituloModal(modal));
    ETAPAS.forEach(c=>modal.classList.remove(c));
    if(etapa) modal.classList.add(etapa);
    modal.classList.add('sigee-janela-padrao');
    modal.querySelectorAll('button').forEach(btn=>{
      [...btn.classList].filter(c=>c.startsWith('sigee-acao-')).forEach(c=>btn.classList.remove(c));
      const acao=classeAcao(btn); if(acao) btn.classList.add(acao);
    });
  }
  function aplicarNo(no){
    if(!(no instanceof Element)) return;
    if(no.matches('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)')) prepararModal(no);
    no.querySelectorAll?.('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)').forEach(prepararModal);
  }
  const observer=new MutationObserver(lista=>lista.forEach(m=>m.addedNodes.forEach(aplicarNo)));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>aplicarNo(document.documentElement));
  window.addEventListener('load',()=>aplicarNo(document.documentElement));
  console.info('[SIGEE] Design System estável 3.8 carregado.');
})();
