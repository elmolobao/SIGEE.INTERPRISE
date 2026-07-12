
// Workflow Event Manager v0.9.3.4
(function(global){
 const EVENTS={
 DOCUMENTO_RECEBIDO:{code:'DOCUMENTO_RECEBIDO',global:true},
 SEND_REITERACAO:{code:'SEND_REITERACAO'},
 SEND_REITERACAO_URGENTE:{code:'SEND_REITERACAO_URGENTE'},
 CONFIRMAR_DADOS:{code:'CONFIRMAR_DADOS'},
 RETIFICAR_DADOS:{code:'RETIFICAR_DADOS'},
 LOCALIZAR_PASTA:{code:'LOCALIZAR_PASTA'},
 PEDIDO_ATAS:{code:'PEDIDO_ATAS'}
 };
 const api={
  get:c=>EVENTS[c]||null,
  exists:c=>!!EVENTS[c],
  list:()=>Object.values(EVENTS),
  isAllowed:(stateCfg,eventCode)=>{
    if(EVENTS[eventCode]?.global) return true;
    return !!(stateCfg && stateCfg.allowedEvents && stateCfg.allowedEvents.includes(eventCode));
  }
 };
 global.EventManager=api;
})(window);
