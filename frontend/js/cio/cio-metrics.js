(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};
  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const SLAS={ANALISE:7,PENDENCIA:7,DIGITACAO:15,CONFERENCIA:10,ASSINATURA:7,DESARQUIVAMENTO:30};
  const finalizado=p=>/RETIRADO|INDEFERIDO/.test(norm(p?.etapa_atual||p?.etapa))||p?.ativo===false;
  function data(v){const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d:null;}
  function dias(a,b=new Date()){const x=data(a);return x?Math.max(0,(b-x)/86400000):0;}
  function dentroJanela(v,diasJanela){const d=data(v);if(!d)return false;const agora=new Date();const inicio=new Date(agora.getTime()-diasJanela*86400000);return d>=inicio&&d<=agora;}
  function etapa(p){return txt(p?.etapa_atual||p?.etapa||'Não informada');}
  function responsavel(p){
    const candidatos=[
      p?.tecnico_atribuido_nome,p?.tecnico_atribuido,
      p?.tecnico_responsavel_nome,p?.tecnico_responsavel,
      p?.responsavel_etapa_nome,p?.responsavel_etapa,
      p?.responsavel_nome,p?.responsavel,
      p?.analista_nome,p?.analista,
      p?.digitador_nome,p?.digitador,
      p?.conferente_nome,p?.conferente,
      p?.responsavel_assinatura_nome,p?.responsavel_assinatura,
      p?.usuario_lancamento_nome,p?.usuario_lancamento,
      p?.usuario_criacao_nome,p?.usuario_criacao,
      p?.criado_por_nome,p?.criado_por,
      p?.solicitante_nome,p?.nome_solicitante
    ];
    for(const candidato of candidatos){const valor=txt(candidato);if(valor&&!/^(NAO ATRIBUIDO|NÃO ATRIBUÍDO|SEM RESPONSAVEL|SEM RESPONSÁVEL)$/i.test(valor))return valor;}
    return 'Sem responsável';
  }
  function limite(p){const e=norm(etapa(p));for(const [k,v] of Object.entries(SLAS))if(e.includes(k))return v;return Number(p?.prazo_etapa)||null;}
  function prazo(p){const fim=data(p?.prazo_fim);if(fim)return (fim-new Date())/86400000;const l=limite(p);return l==null?null:l-dias(p?.data_etapa_atual||p?.data_etapa||p?.updated_at||p?.created_at);}
  function risco(p){
    if(finalizado(p))return {nivel:'FINALIZADO',score:0,diasRestantes:null,tempoParado:0};
    const r=prazo(p),parado=dias(p?.data_etapa_atual||p?.updated_at||p?.created_at),pri=norm(p?.prioridade);let s=0;
    if(r!=null){if(r<0)s+=60;else if(r<=3)s+=35;else if(r<=7)s+=15;}
    if(pri.includes('ALTA')||pri.includes('URG'))s+=20;
    if(parado>=15)s+=20;else if(parado>=7)s+=10;
    return {nivel:s>=70?'CRITICO':s>=45?'ALTO':s>=20?'MEDIO':'NORMAL',score:s,diasRestantes:r,tempoParado:parado};
  }
  function tendencia(processos,diasJanela){
    const entradas=processos.filter(p=>dentroJanela(p?.created_at||p?.data_solicitacao,diasJanela)).length;
    const saidas=processos.filter(p=>dentroJanela(p?.retirado_em||p?.finalizado_em||p?.deferido_em,diasJanela)).length;
    const saldo=entradas-saidas;
    return {dias:diasJanela,entradas,saidas,saldo,direcao:saldo>0?'ALTA':saldo<0?'QUEDA':'ESTAVEL'};
  }
  function calcular(dados){
    const todos=Array.isArray(dados?.processos)?dados.processos:[];
    const ativos=todos.filter(p=>!finalizado(p));
    const backlog={},cargas={}; let vencidos=0,vencem3=0,dentro=0,avaliados=0,totalDias=0;
    const riscos=[];
    for(const p of ativos){
      const e=etapa(p);backlog[e]=(backlog[e]||0)+1;
      const resp=responsavel(p);cargas[resp]=(cargas[resp]||0)+1;
      const r=risco(p);
      riscos.push({...r,id:p.id,codigo:p.codigo_sigee,aluno:p.aluno_nome,escola:p.escola_nome,etapa:e,responsavel:resp,nte:p.nte||p.nte_nome,prioridade:p.prioridade,processo:p});
      if(r.diasRestantes!=null){avaliados++;if(r.diasRestantes<0)vencidos++;else{dentro++;if(r.diasRestantes<=3)vencem3++;}}
      totalDias+=dias(p.created_at);
    }
    const backlogOrdenado=Object.entries(backlog).sort((a,b)=>b[1]-a[1]).map(([etapa,total])=>({etapa,total,percentual:ativos.length?Math.round(total/ativos.length*1000)/10:0}));
    const cargaEntries=Object.entries(cargas).filter(([n])=>n!=='Sem responsável');
    const mediaCarga=cargaEntries.length?cargaEntries.reduce((s,[,v])=>s+v,0)/cargaEntries.length:0;
    const capacidade=cargaEntries.sort((a,b)=>b[1]-a[1]).map(([nome,total])=>({nome,total,media:mediaCarga,percentualMedia:mediaCarga?Math.round(total/mediaCarga*100):0,status:total>=Math.max(5,mediaCarga*1.25)?'ACIMA':total<=mediaCarga*.75?'ABAIXO':'EQUILIBRADO'}));
    const sobrecarregados=capacidade.filter(x=>x.status==='ACIMA').map(x=>({...x,excesso:Math.max(0,Math.round(x.total-mediaCarga))}));
    const niveis={CRITICO:0,ALTO:0,MEDIO:0,NORMAL:0};
    riscos.forEach(r=>{if(niveis[r.nivel]!=null)niveis[r.nivel]++;});
    const gargalo=backlogOrdenado[0]||null;
    const riscosOrdenados=riscos.sort((a,b)=>b.score-a.score||((a.diasRestantes??9999)-(b.diasRestantes??9999))||((b.tempoParado??0)-(a.tempoParado??0)));
    const filaPrioritaria=riscosOrdenados.filter(r=>['CRITICO','ALTO'].includes(r.nivel)).slice(0,50);
    const semResponsavel=riscosOrdenados.filter(r=>r.responsavel==='Sem responsável');
    const territorialMap={};
    for(const r of riscosOrdenados){
      const bruto=txt(r.nte||'NTE não informado');
      const m=bruto.match(/(?:NTE\s*[-:]?\s*)?(\d{1,2})/i);
      const nte=m?`NTE-${String(Number(m[1])).padStart(2,'0')}`:(bruto||'NTE não informado').toUpperCase();
      const item=territorialMap[nte]||(territorialMap[nte]={nte,total:0,criticos:0,altos:0,medios:0,normais:0,semResponsavel:0,score:0});
      item.total++;
      if(r.nivel==='CRITICO')item.criticos++;
      else if(r.nivel==='ALTO')item.altos++;
      else if(r.nivel==='MEDIO')item.medios++;
      else item.normais++;
      if(r.responsavel==='Sem responsável')item.semResponsavel++;
      item.score+=r.score||0;
    }
    const territorial=Object.values(territorialMap).map(x=>({...x,indiceRisco:x.total?Math.round((x.criticos*4+x.altos*3+x.medios*2)/x.total*25):0})).sort((a,b)=>b.criticos-a.criticos||b.indiceRisco-a.indiceRisco||b.total-a.total);
    return {
      totalAtivos:ativos.length,totalProcessos:todos.length,ativos,backlog,backlogOrdenado,gargalo,
      riscos:riscosOrdenados,niveisRisco:niveis,filaPrioritaria,semResponsavel,territorial,
      emRisco:niveis.CRITICO+niveis.ALTO,criticos:niveis.CRITICO,vencidos,vencem3,
      dentroSla:avaliados?Math.round(dentro/avaliados*100):null,avaliados,
      tempoMedioDias:ativos.length?totalDias/ativos.length:0,
      cargas,capacidade,sobrecarregados,mediaCarga,
      tecnicosTotal:capacidade.length,equilibrados:capacidade.filter(x=>x.status==='EQUILIBRADO').length,abaixoMedia:capacidade.filter(x=>x.status==='ABAIXO').length,
      tendencias:{d7:tendencia(todos,7),d30:tendencia(todos,30),d90:tendencia(todos,90)}
    };
  }
  NS.metrics=Object.freeze({calcular,risco,responsavel,SLAS,version:'RC6.3.1'});
})(window);
