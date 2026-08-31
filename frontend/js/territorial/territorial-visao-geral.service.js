/** SIGEE Enterprise — GT-09 Visão Geral Executiva. Consolidação com integridade explícita. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_VISAO_GERAL_SERVICE?.versao==='GT-09.0') return;
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
async function carregar(){
 if(!master()) throw new Error('Acesso restrito ao perfil Master.');
 const falhas=[];const seguro=async(nome,fn,fallback)=>{try{return await fn();}catch(e){console.warn('[GT-09]',nome,e);falhas.push({fonte:nome,mensagem:String(e?.message||e)});return fallback;}};
 const [indices,monitor,agenda,pesquisa,sei]=await Promise.all([
  seguro('Indicadores territoriais',()=>window.SIGEE_TERRITORIAL_INDICADORES_SERVICE?.carregar?.(),[]),
  seguro('Monitoramento',()=>window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE?.listar?.(),[]),
  seguro('Agenda',()=>window.SIGEE_TERRITORIAL_AGENDA_SERVICE?.listar?.(),[]),
  seguro('Pesquisa de satisfação',()=>window.SIGEE_TERRITORIAL_PESQUISA_SERVICE?.resumo?.(),{total:0,naoLidas:0,triagem:0,media:null,media5:null}),
  seguro('Controle SEI',()=>window.SIGEE_TERRITORIAL_SEI_SERVICE?.listar?.(),[])
 ]);
 const hoje=new Date(); hoje.setHours(0,0,0,0);const A=window.SIGEE_TERRITORIAL_INDICADORES_AUTHORITY;
 const seiAtivos=sei.filter(x=>x.status==='ATIVO'),seiVencidos=seiAtivos.filter(x=>x.prazo&&new Date(`${x.prazo}T00:00:00`)<hoje),formacoes=agenda.filter(x=>x.tipo==='FORMACAO_TERRITORIAL'&&x.situacao!=='CANCELADO'),realizados=formacoes.filter(x=>x.situacao==='REALIZADO'),ntesFormados=new Set(realizados.flatMap(x=>(x.ntes||[]).map(Number)));
 const ocorrAtivas=monitor.filter(x=>A?.ocorrenciaAberta?A.ocorrenciaAberta(x):!['REGULARIZADO','CONCLUIDO'].includes(x.resultado));const ocorrConcluidas=monitor.filter(x=>!(A?.ocorrenciaAberta?A.ocorrenciaAberta(x):!['REGULARIZADO','CONCLUIDO'].includes(x.resultado)));const negativas=monitor.filter(x=>x.avaliacao==='NEGATIVA'),positivas=monitor.filter(x=>x.avaliacao==='POSITIVA'),criticos=indices.filter(x=>['CRITICO','ALERTA'].includes(x.classeDesempenho)),atencao=indices.filter(x=>x.classeDesempenho==='ATENCAO');
 return {indices,monitor,agenda,sei,pesquisa,falhas,dadosCompletos:falhas.length===0,seiAtivos:seiAtivos.length,seiVencidos:seiVencidos.length,seiConcluidos:sei.filter(x=>x.status==='CONCLUIDO').length,formacoesRealizadas:realizados.length,ntesFormados:ntesFormados.size,ocorrAtivas:ocorrAtivas.length,ocorrConcluidas:ocorrConcluidas.length,positivas:positivas.length,negativas:negativas.length,criticos:criticos.length,atencao:atencao.length};
}
window.SIGEE_TERRITORIAL_VISAO_GERAL_SERVICE=Object.freeze({carregar,master,versao:'GT-09.0'});
})(window);
