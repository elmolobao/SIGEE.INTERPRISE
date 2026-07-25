(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};
  function avaliar(m){
    const a=[];
    if(m.criticos)a.push({tipo:'CRITICO',titulo:'Processos críticos',mensagem:`${m.criticos} processo(s) exigem priorização imediata.`,filtro:'CRITICO'});
    if(m.vencem3)a.push({tipo:'ATENCAO',titulo:'Vencimentos próximos',mensagem:`${m.vencem3} processo(s) vencem em até 3 dias.`,filtro:'VENCE_3'});
    if(m.sobrecarregados.length)a.push({tipo:'CAPACIDADE',titulo:'Carga acima da média',mensagem:`${m.sobrecarregados.length} técnico(s) estão acima de 125% da carga média.`,filtro:'SOBRECARGA'});
    if(m.gargalo)a.push({tipo:'GARGALO',titulo:'Maior concentração',mensagem:`${m.gargalo.etapa} concentra ${m.gargalo.total} processo(s) ativos.`,filtro:'GARGALO'});
    if(m.tendencias?.d30?.saldo>0)a.push({tipo:'TENDENCIA',titulo:'Backlog em crescimento',mensagem:`Nos últimos 30 dias entraram ${m.tendencias.d30.entradas} e saíram ${m.tendencias.d30.saidas} processos.`,filtro:'TENDENCIA'});
    return a;
  }
  NS.rules=Object.freeze({avaliar});
})(window);
