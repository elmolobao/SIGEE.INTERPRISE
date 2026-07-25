(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};
  function saudacao(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';}
  function gerar(ctx,m){
    const nome=ctx.usuario?.nome||ctx.usuario?.nome_completo||'Gestor';
    const territorio=ctx.escopo==='ESTADUAL'?'Estado da Bahia':ctx.nte;
    const carga=m.sobrecarregados.length?` Há ${m.sobrecarregados.length} técnico(s) acima da carga média.`:'';
    const tendencia=m.tendencias?.d30?.saldo>0?` O backlog cresceu em ${m.tendencias.d30.saldo} processo(s) nos últimos 30 dias.`:m.tendencias?.d30?.saldo<0?` O backlog reduziu em ${Math.abs(m.tendencias.d30.saldo)} processo(s) nos últimos 30 dias.`:'';
    return {saudacao:`${saudacao()}, ${nome}.`,territorio,texto:`${territorio} possui ${m.totalAtivos} processos ativos. ${m.emRisco} estão em risco operacional, ${m.vencem3} vencem em até 3 dias e o maior backlog está em ${m.gargalo?.etapa||'nenhuma etapa identificada'} com ${m.gargalo?.total||0} processo(s).${carga}${tendencia}`};
  }
  NS.summary=Object.freeze({gerar});
})(window);
