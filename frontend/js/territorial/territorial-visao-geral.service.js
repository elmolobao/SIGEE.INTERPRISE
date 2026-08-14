/** SIGEE Enterprise — GT-08 Visão Geral Executiva. Consolidação somente leitura. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_VISAO_GERAL_SERVICE) return;
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
async function seguro(fn,fallback){try{return await fn();}catch(e){console.warn('[GT-08]',e);return fallback;}}
async function carregar(){
 if(!master()) throw new Error('Acesso restrito ao perfil Master.');
 const [indices,monitor,agenda,pesquisa,sei]=await Promise.all([
  seguro(()=>window.SIGEE_TERRITORIAL_INDICADORES_SERVICE?.carregar?.(),[]),
  seguro(()=>window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE?.listar?.(),[]),
  seguro(()=>window.SIGEE_TERRITORIAL_AGENDA_SERVICE?.listar?.(),[]),
  seguro(()=>window.SIGEE_TERRITORIAL_PESQUISA_SERVICE?.resumo?.(),{total:0,naoLidas:0,triagem:0,media:null}),
  seguro(()=>window.SIGEE_TERRITORIAL_SEI_SERVICE?.listar?.(),[])
 ]);
 const hoje=new Date(); hoje.setHours(0,0,0,0);
 const seiAtivos=sei.filter(x=>x.status==='ATIVO');
 const seiVencidos=seiAtivos.filter(x=>x.prazo&&new Date(`${x.prazo}T00:00:00`)<hoje);
 const formacoes=agenda.filter(x=>x.tipo==='FORMACAO_TERRITORIAL'&&x.situacao!=='CANCELADO');
 const realizados=formacoes.filter(x=>x.situacao==='REALIZADO');
 const ntesFormados=new Set(realizados.flatMap(x=>(x.ntes||[]).map(Number)));
 const ocorrAtivas=monitor.filter(x=>x.resultado!=='CONCLUIDO');
 const ocorrConcluidas=monitor.filter(x=>x.resultado==='CONCLUIDO');
 const negativas=monitor.filter(x=>x.avaliacao==='NEGATIVA');
 const positivas=monitor.filter(x=>x.avaliacao==='POSITIVA');
 const criticos=indices.filter(x=>['CRITICO','ALERTA'].includes(x.classeDesempenho));
 const atencao=indices.filter(x=>x.classeDesempenho==='ATENCAO');
 return {indices,monitor,agenda,sei,pesquisa,seiAtivos:seiAtivos.length,seiVencidos:seiVencidos.length,seiConcluidos:sei.filter(x=>x.status==='CONCLUIDO').length,formacoesRealizadas:realizados.length,ntesFormados:ntesFormados.size,ocorrAtivas:ocorrAtivas.length,ocorrConcluidas:ocorrConcluidas.length,positivas:positivas.length,negativas:negativas.length,criticos:criticos.length,atencao:atencao.length};
}
window.SIGEE_TERRITORIAL_VISAO_GERAL_SERVICE=Object.freeze({carregar,master,versao:'GT-08.0'});
})(window);
