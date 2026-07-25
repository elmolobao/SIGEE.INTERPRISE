(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};
  async function analisar({force=false,user=null}={}){
    const contexto=NS.context.getContext(user);
    if(!contexto.permitido)throw new Error(contexto.motivo==='NTE_NAO_IDENTIFICADO'?'Usuário sem NTE vinculado para acesso ao CIO.':'Perfil sem acesso ao CIO.');
    const dados=await NS.dataService.carregar(contexto,{force});
    const metricas=NS.metrics.calcular(dados);
    const alertas=NS.alerts.gerar(metricas);
    const recomendacoes=NS.recommendations.gerar(metricas);
    const resumo=NS.summary.gerar(contexto,metricas);
    return Object.freeze({version:'RC6.2.1',contexto,metricas,alertas,recomendacoes,resumo,diagnostico:dados.diagnostico,geradoEm:new Date().toISOString()});
  }
  NS.engine=Object.freeze({analisar,invalidar:()=>NS.dataService.invalidar()});
})(window);
