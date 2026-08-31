/** SIGEE Enterprise — GT-09 Índices Territoriais. Autoridade analítica unificada. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_INDICADORES_SERVICE?.versao==='GT-09.0') return;
function auth(){const a=window.SIGEE_TERRITORIAL_INDICADORES_AUTHORITY;if(!a)throw new Error('Autoridade de indicadores territoriais indisponível.');return a;}
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
function ntes(){return window.SIGEE_TERRITORIAL_DATA?.NTES||[];}
function eventosNte(agenda,n){return agenda.filter(e=>(e.ntes||[]).map(Number).includes(Number(n)));}
function formacoesRealizadas(agenda,n){return eventosNte(agenda,n).filter(e=>e.tipo==='FORMACAO_TERRITORIAL'&&e.situacao==='REALIZADO').sort((a,b)=>new Date(a.fim||a.inicio)-new Date(b.fim||b.inicio));}
function marcoFormacao(agenda,n){return formacoesRealizadas(agenda,n)[0]||null;}
function statusFormacao(agenda,n){const f=eventosNte(agenda,n).filter(e=>e.tipo==='FORMACAO_TERRITORIAL'&&e.situacao!=='CANCELADO');const agora=Date.now();if(f.some(e=>e.situacao==='REALIZADO'))return'CONCLUIDA';if(f.some(e=>e.situacao==='EM_ANDAMENTO'||(new Date(e.inicio).getTime()<=agora&&new Date(e.fim).getTime()>=agora)))return'EM_REALIZACAO';if(f.some(e=>['PLANEJADO','AGENDADO','REMARCADO'].includes(e.situacao)&&new Date(e.fim).getTime()>=agora))return'AGENDADA';return'PENDENTE';}
async function producaoRemota(){try{return await window.SIGEE_TERRITORIAL_DATA?.producaoPorNteRemota?.()||window.SIGEE_TERRITORIAL_DATA?.producaoPorNte?.()||[];}catch(e){console.warn('[GT-09] Produção remota indisponível, usando fallback local:',e);return window.SIGEE_TERRITORIAL_DATA?.producaoPorNte?.()||[];}}
async function carregar(){const c=exigir(),A=auth();const [ma,ag,pe,ac,prod]=await Promise.all([
 c.from('gt_monitoramento').select('id,nte_numero,item_monitoria,avaliacao,fase,relevancia,resultado,data_registro'),
 c.from('gt_agenda').select('id,tipo,titulo,motivo,inicio,fim,situacao,ntes'),
 c.from('gt_pesquisa_satisfacao').select('nte_numero,score_satisfacao,status_triagem,data_resposta'),
 c.from('gt_monitoramento_acoes').select('id,monitoramento_id,tipo,modalidade,data_acao'),
 producaoRemota()
]);
 if(ma.error)throw ma.error;if(ag.error)throw ag.error;if(pe.error)throw pe.error;if(ac.error)throw ac.error;
 const monitor=ma.data||[],agenda=ag.data||[],pesquisa=pe.data||[],acoes=ac.data||[];
 const ntePorMonitor=new Map(monitor.map(x=>[Number(x.id),Number(x.nte_numero)]));const acoesNte={};acoes.forEach(a=>{const n=ntePorMonitor.get(Number(a.monitoramento_id));if(n)acoesNte[n]=(acoesNte[n]||0)+1;});
 const prodMap=new Map((prod||[]).map(x=>[Number(x.numero),Number(x.processos)||0]));
 return ntes().map(n=>{const num=n.numero,m=monitor.filter(x=>Number(x.nte_numero)===num),p=pesquisa.filter(x=>Number(x.nte_numero)===num),ev=eventosNte(agenda,num),marco=marcoFormacao(agenda,num),status=statusFormacao(agenda,num),split=A.separarPrePos(m,marco),tecGeral=A.notaTecnica(m),tecPre=A.notaTecnica(split.pre),tecPos=A.notaTecnica(split.pos),tec=status==='CONCLUIDA'&&tecPos.amostra?tecPos:tecGeral,sat=A.mediaSatisfacao(p),indice=A.consolidado(tec.nota,sat.nota),risco=A.riscoTerritorial(m),prior=status==='CONCLUIDA'?{nota:null,classe:'NAO_APLICA'}:A.prioridadeFormacao(tecPre.nota??tecGeral.nota,sat.nota,m),reunioes=ev.filter(x=>x.tipo==='REUNIAO'&&x.situacao==='REALIZADO').length,visitas=ev.filter(x=>x.tipo==='VISITA_TECNICA'&&x.situacao==='REALIZADO').length,negativas=m.filter(x=>x.avaliacao==='NEGATIVA').length,positivas=m.filter(x=>x.avaliacao==='POSITIVA').length,evol=A.evolucaoPrePos(m,marco);return{...n,statusFormacao:status,fase:status==='CONCLUIDA'?'POS_FORMACAO':'PRE_FORMACAO',marcoFormacao:marco?.fim||marco?.inicio||null,notaTecnica:tec.nota,notaTecnicaPre:tecPre.nota,notaTecnicaPos:tecPos.nota,evolucaoTecnica:evol.evolucao,amostraTecnica:tec.amostra,coberturaTecnica:tec.criteriosAvaliados,coberturaTecnicaPercentual:tec.coberturaPercentual,confiabilidadeTecnica:tec.confiabilidade,satisfacao:sat.nota,satisfacaoNota5:sat.nota5,amostraSatisfacao:sat.amostra,indiceConsolidado:indice,classeDesempenho:status==='CONCLUIDA'?A.classeDesempenho(indice,{classificavel:tec.classificavel}):'NAO_APLICA',riscoTerritorial:risco.classe,ocorrenciasAbertas:risco.abertas,criticasAbertas:risco.criticas,reincidencias:risco.reincidencias,prioridadeNota:prior.nota,prioridadeClasse:prior.classe,positivas,negativas,reunioes,visitas,acoes:acoesNte[num]||0,producao:prodMap.get(num)||0};});
}
window.SIGEE_TERRITORIAL_INDICADORES_SERVICE=Object.freeze({carregar,master,PESOS:()=>auth().PESOS,classeDesempenho:(n,o)=>auth().classeDesempenho(n,o),versao:'GT-09.0'});
})(window);
