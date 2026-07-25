(function(global){
  'use strict'; const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};
  const txt=v=>v==null?'':String(v).trim(); const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const SLAS={ANALISE:7,PENDENCIA:7,DIGITACAO:15,CONFERENCIA:10,ASSINATURA:7,DESARQUIVAMENTO:30};
  const finalizado=p=>/RETIRADO|INDEFERIDO/.test(norm(p?.etapa_atual||p?.etapa))||p?.ativo===false;
  function data(v){const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d:null;}
  function dias(a,b=new Date()){const x=data(a);return x?Math.max(0,(b-x)/86400000):0;}
  function etapa(p){return txt(p?.etapa_atual||p?.etapa||'Não informada');}
  function responsavel(p){return txt(p?.tecnico_responsavel||p?.tecnico_responsavel_nome||p?.responsavel||p?.responsavel_nome||p?.analista_nome||p?.analista)||'Não atribuído';}
  function limite(p){const e=norm(etapa(p));for(const [k,v] of Object.entries(SLAS))if(e.includes(k))return v;return Number(p?.prazo_etapa)||null;}
  function prazo(p){const fim=data(p?.prazo_fim);if(fim)return (fim-new Date())/86400000;const l=limite(p);return l==null?null:l-dias(p?.data_etapa_atual||p?.data_etapa||p?.updated_at||p?.created_at);}
  function risco(p){if(finalizado(p))return {nivel:'FINALIZADO',score:0,diasRestantes:null};const r=prazo(p),parado=dias(p?.data_etapa_atual||p?.updated_at||p?.created_at),pri=norm(p?.prioridade);let s=0;if(r!=null){if(r<0)s+=60;else if(r<=3)s+=35;else if(r<=7)s+=15;}if(pri.includes('ALTA')||pri.includes('URG'))s+=20;if(parado>=15)s+=20;else if(parado>=7)s+=10;return {nivel:s>=70?'CRITICO':s>=45?'ALTO':s>=20?'MEDIO':'BAIXO',score:s,diasRestantes:r,tempoParado:parado};}
  function calcular(dados){
    const ativos=dados.processos.filter(p=>!finalizado(p)); const backlog={}; const cargas={}; let vencidos=0,vencem3=0,dentro=0,avaliados=0,totalDias=0;
    const riscos=[];
    for(const p of ativos){const e=etapa(p);backlog[e]=(backlog[e]||0)+1;const resp=responsavel(p);cargas[resp]=(cargas[resp]||0)+1;const r=risco(p);riscos.push({...r,id:p.id,codigo:p.codigo_sigee,aluno:p.aluno_nome,etapa:e,responsavel:resp,nte:p.nte});if(r.diasRestantes!=null){avaliados++;if(r.diasRestantes<0)vencidos++;else{dentro++;if(r.diasRestantes<=3)vencem3++;}}totalDias+=dias(p.created_at);}
    const backlogOrdenado=Object.entries(backlog).sort((a,b)=>b[1]-a[1]); const cargaEntries=Object.entries(cargas).filter(([n])=>n!=='Não atribuído'); const mediaCarga=cargaEntries.length?cargaEntries.reduce((s,[,v])=>s+v,0)/cargaEntries.length:0;
    const sobrecarregados=cargaEntries.filter(([,v])=>v>=Math.max(5,mediaCarga*1.25)).sort((a,b)=>b[1]-a[1]).map(([nome,total])=>({nome,total,media:mediaCarga,excesso:Math.max(0,Math.round(total-mediaCarga))}));
    return {totalAtivos:ativos.length,totalProcessos:dados.processos.length,backlog,backlogOrdenado,gargalo:backlogOrdenado[0]?{etapa:backlogOrdenado[0][0],total:backlogOrdenado[0][1]}:null,riscos:riscos.sort((a,b)=>b.score-a.score),emRisco:riscos.filter(r=>['ALTO','CRITICO'].includes(r.nivel)).length,criticos:riscos.filter(r=>r.nivel==='CRITICO').length,vencidos,vencem3,dentroSla:avaliados?Math.round(dentro/avaliados*100):null,avaliados,tempoMedioDias:ativos.length?totalDias/ativos.length:0,cargas,sobrecarregados,mediaCarga};
  }
  NS.metrics=Object.freeze({calcular,risco,SLAS});
})(window);