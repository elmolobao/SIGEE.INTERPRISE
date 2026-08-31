/** SIGEE Enterprise — GT-06 Índices Territoriais. Leitura consolidada e não destrutiva. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_INDICADORES_SERVICE) return;
const PESOS=Object.freeze({COMUNICACAO_EMAIL:15,REGISTRO_SISTEMA:20,CUMPRIMENTO_PRAZOS:30,EXECUCAO_PROCEDIMENTO:35});
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
function ntes(){return window.SIGEE_TERRITORIAL_DATA?.NTES||[];}
function eventosNte(agenda,n){return agenda.filter(e=>(e.ntes||[]).map(Number).includes(Number(n)));}
function statusFormacao(agenda,n){const f=eventosNte(agenda,n).filter(e=>e.tipo==='FORMACAO_TERRITORIAL'&&e.situacao!=='CANCELADO');const agora=Date.now();if(f.some(e=>e.situacao==='REALIZADO'))return'CONCLUIDA';if(f.some(e=>e.situacao==='EM_ANDAMENTO'||(new Date(e.inicio).getTime()<=agora&&new Date(e.fim).getTime()>=agora)))return'EM_REALIZACAO';if(f.some(e=>['PLANEJADO','AGENDADO','REMARCADO'].includes(e.situacao)&&new Date(e.fim).getTime()>=agora))return'AGENDADA';return'PENDENTE';}
function notaTecnica(rows){let soma=0,peso=0,amostra=0;Object.entries(PESOS).forEach(([item,p])=>{const r=rows.filter(x=>x.item_monitoria===item);if(!r.length)return;const pos=r.filter(x=>x.avaliacao==='POSITIVA').length;soma+=(pos/r.length*100)*p;peso+=p;amostra+=r.length;});return{nota:peso?Math.round(soma/peso*10)/10:null,amostra};}
function mediaSatisfacao(rows){const r=rows.filter(x=>x.score_satisfacao!=null);const bruta=r.length?r.reduce((s,x)=>s+Number(x.score_satisfacao),0)/r.length:null;return{nota:bruta==null?null:Math.round((bruta<=5?bruta/5*100:bruta)*10)/10,nota5:bruta==null?null:Math.round((bruta<=5?bruta:bruta/20)*10)/10,amostra:r.length};}
function consolidado(tec,sat){if(tec==null&&sat==null)return null;if(tec==null)return sat;if(sat==null)return tec;return Math.round((tec*.8+sat*.2)*10)/10;}
function classeDesempenho(n){if(n==null)return'SEM_AMOSTRA';if(n>=90)return'EXCELENTE';if(n>=80)return'BOM';if(n>=70)return'ATENCAO';if(n>=50)return'ALERTA';return'CRITICO';}
function prioridadeFormacao(tec,sat,acoes,totalAcoesMax){const componentes=[];if(tec!=null)componentes.push({v:100-tec,p:60});if(sat!=null)componentes.push({v:100-sat,p:20});if(acoes>0&&totalAcoesMax>0)componentes.push({v:Math.min(100,acoes/totalAcoesMax*100),p:20});if(!componentes.length)return{nota:null,classe:'SEM_EVIDENCIA'};const p=componentes.reduce((s,x)=>s+x.p,0),nota=Math.round(componentes.reduce((s,x)=>s+x.v*x.p,0)/p*10)/10;return{nota,classe:nota>=75?'PRIORITARIA':nota>=50?'ALTA':nota>=25?'MODERADA':'BAIXA'};}
async function carregar(){const c=exigir();const [ma,ag,pe,ac,ta]=await Promise.all([
 c.from('gt_monitoramento').select('id,nte_numero,item_monitoria,avaliacao,fase,relevancia,resultado,data_registro'),
 c.from('gt_agenda').select('id,tipo,titulo,motivo,inicio,fim,situacao,ntes'),
 c.from('gt_pesquisa_satisfacao').select('nte_numero,score_satisfacao,status_triagem,data_resposta'),
 c.from('gt_monitoramento_acoes').select('id,monitoramento_id,tipo,modalidade,data_acao'),
 c.from('gt_tarefas_corretivas').select('id,monitoramento_id,nte_numero,status')
]);
 if(ma.error)throw ma.error;if(ag.error)throw ag.error;if(pe.error)throw pe.error;if(ac.error)throw ac.error;
 if(ta.error)console.warn('[GT Indicadores] Plano de Ação indisponível:',ta.error);
 const monitor=ma.data||[],agenda=ag.data||[],pesquisa=pe.data||[],acoes=ac.data||[],tarefas=(ta.data||[]).filter(t=>String(t.status||'').toUpperCase()!=='CANCELADA');
 const ntePorMonitor=new Map(monitor.map(x=>[Number(x.id),Number(x.nte_numero)]));
 const acoesNte={};acoes.forEach(a=>{const n=ntePorMonitor.get(Number(a.monitoramento_id));if(n)acoesNte[n]=(acoesNte[n]||0)+1;});
 const maxAcoes=Math.max(0,...Object.values(acoesNte));
 const prod=window.SIGEE_TERRITORIAL_DATA?.producaoPorNte?.()||[];const prodMap=new Map(prod.map(x=>[Number(x.numero),Number(x.processos)||0]));
 return ntes().map(n=>{const num=n.numero,m=monitor.filter(x=>Number(x.nte_numero)===num),p=pesquisa.filter(x=>Number(x.nte_numero)===num),ev=eventosNte(agenda,num);const concluidos=new Set(tarefas.filter(t=>Number(t.nte_numero)===num&&['VALIDADA','CONCLUIDA'].includes(String(t.status||'').toUpperCase())).map(t=>Number(t.monitoramento_id)));const mAtual=m.filter(x=>!(x.avaliacao==='NEGATIVA'&&concluidos.has(Number(x.id))));const tec=notaTecnica(m),tecAtual=notaTecnica(mAtual),sat=mediaSatisfacao(p),status=statusFormacao(agenda,num),pos=status==='CONCLUIDA';const indice=consolidado(tec.nota,sat.nota),indiceAtual=consolidado(tecAtual.nota,sat.nota),reunioes=ev.filter(x=>x.tipo==='REUNIAO'&&x.situacao==='REALIZADO').length,visitas=ev.filter(x=>x.tipo==='VISITA_TECNICA'&&x.situacao==='REALIZADO').length,negativas=m.filter(x=>x.avaliacao==='NEGATIVA').length,positivas=m.filter(x=>x.avaliacao==='POSITIVA').length,prior=pos?{nota:null,classe:'NAO_APLICA'}:prioridadeFormacao(tecAtual.nota,sat.nota,acoesNte[num]||0,maxAcoes),tarefasNte=tarefas.filter(t=>Number(t.nte_numero)===num),tarefasConcluidas=tarefasNte.filter(t=>['VALIDADA','CONCLUIDA'].includes(String(t.status||'').toUpperCase())).length;return{...n,statusFormacao:status,fase:pos?'POS_FORMACAO':'PRE_FORMACAO',notaTecnica:tec.nota,notaTecnicaAtual:tecAtual.nota,amostraTecnica:tec.amostra,satisfacao:sat.nota,satisfacao5:sat.nota5,amostraSatisfacao:sat.amostra,indiceConsolidado:indice,indiceConformidadeAtual:indiceAtual,classeDesempenho:pos?classeDesempenho(indiceAtual):'NAO_APLICA',prioridadeNota:prior.nota,prioridadeClasse:prior.classe,positivas,negativas,reunioes,visitas,acoes:acoesNte[num]||0,tarefas:tarefasNte.length,tarefasConcluidas,taxaRegularizacao:tarefasNte.length?Math.round(tarefasConcluidas/tarefasNte.length*100):null,producao:prodMap.get(num)||0};});
}
window.SIGEE_TERRITORIAL_INDICADORES_SERVICE=Object.freeze({carregar,master,PESOS,classeDesempenho,versao:'RC11.3.18'});
})(window);
