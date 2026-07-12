// Workflow Event Manager v0.9.5.0
(function(global){
 'use strict';
 const EVENTS=Object.freeze({
  DOCUMENTO_RECEBIDO:Object.freeze({code:'DOCUMENTO_RECEBIDO',global:true}),
  SEND_REITERACAO:Object.freeze({code:'SEND_REITERACAO'}),
  SEND_REITERACAO_URGENTE:Object.freeze({code:'SEND_REITERACAO_URGENTE'}),
  CONFIRMAR_DADOS:Object.freeze({code:'CONFIRMAR_DADOS'}),
  RETIFICAR_DADOS:Object.freeze({code:'RETIFICAR_DADOS'}),
  DADOS_CONFIRMADOS:Object.freeze({code:'DADOS_CONFIRMADOS'}),
  LOCALIZAR_PASTA:Object.freeze({code:'LOCALIZAR_PASTA'}),
  INICIAR_ANALISE:Object.freeze({code:'INICIAR_ANALISE'}),
  ABRIR_PENDENCIA:Object.freeze({code:'ABRIR_PENDENCIA'}),
  PEDIDO_ATAS_DESARQUIVAMENTO:Object.freeze({
   code:'PEDIDO_ATAS_DESARQUIVAMENTO',
   workflow:'EXTERNO',
   messageCode:'36',
   analysisContext:'ATAS_SEM_PASTA'
  }),
  PEDIDO_ATAS_ANALISE:Object.freeze({
   code:'PEDIDO_ATAS_ANALISE',
   workflow:'INTERNO',
   messageCode:null,
   analysisContext:'PENDENCIA_ATAS'
  })
 });
 const api=Object.freeze({
  version:'0.9.5.0',
  get:c=>EVENTS[String(c||'').trim().toUpperCase()]||null,
  exists:c=>!!EVENTS[String(c||'').trim().toUpperCase()],
  list:()=>Object.values(EVENTS),
  isAllowed:(stateCfg,eventCode)=>{
   const code=String(eventCode||'').trim().toUpperCase();
   if(EVENTS[code]?.global) return true;
   return !!(stateCfg && stateCfg.allowedEvents && stateCfg.allowedEvents.includes(code));
  }
 });
 global.EventManager=api;
 global.SIGEE_EVENT_MANAGER=api;
})(window);
