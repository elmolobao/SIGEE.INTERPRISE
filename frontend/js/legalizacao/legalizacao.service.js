/** SIGEE RC12.0.0 — Serviço inicial do módulo Legalização Escolar. */
(function(window){
'use strict';
if(window.__SIGEE_LEGALIZACAO_SERVICE_RC1200__)return;
window.__SIGEE_LEGALIZACAO_SERVICE_RC1200__=true;
const MOD='LEGALIZACAO';
function client(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||null;}catch(_){return null;}}
function user(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function master(){return window.SIGEE_MODULOS?.ehMaster?.(user())===true;}
function nteId(){return window.SIGEE_MODULOS?.nteNoModulo?.(MOD,user()) ?? user()?.nte_id ?? null;}
function assertAccess(){if(!window.SIGEE_MODULOS?.podeAcessar?.(MOD,user()))throw new Error('Acesso ao módulo Legalização não autorizado.');}
function scoped(q){const n=nteId();return !master()&&n!=null?q.eq('nte_id',n):q;}
async function listarInstituicoes(filtros={}){
  assertAccess(); const c=client(); if(!c)throw new Error('Cliente Supabase indisponível.');
  let q=c.from('legalizacao_instituicoes').select('*').order('nome_instituicao',{ascending:true});
  q=scoped(q);
  if(filtros.situacao)q=q.eq('situacao_regulatoria',filtros.situacao);
  if(filtros.busca){const b=String(filtros.busca).trim().replace(/[,()]/g,' ');if(b)q=q.or(`nome_instituicao.ilike.%${b}%,razao_social.ilike.%${b}%,cnpj.ilike.%${b}%,municipio.ilike.%${b}%`);}
  const {data,error}=await q.limit(500); if(error)throw error; return data||[];
}
async function resumo(){
  assertAccess(); const c=client(); if(!c)throw new Error('Cliente Supabase indisponível.');
  const [inst,proc]=await Promise.all([
    listarInstituicoes(),
    (async()=>{let q=c.from('legalizacao_processos').select('id,status,tipo,etapa_atual,nte_id');q=scoped(q);const {data,error}=await q.limit(1000);if(error)throw error;return data||[];})()
  ]);
  const ativos=proc.filter(p=>!['CONCLUIDO','ARQUIVADO','CANCELADO'].includes(String(p.status||'').toUpperCase()));
  return {
    instituicoes:inst.length,
    credenciadas:inst.filter(i=>String(i.situacao_regulatoria||'').toUpperCase()==='CREDENCIADA').length,
    processosAtivos:ativos.length,
    inspecoesPendentes:ativos.filter(p=>String(p.etapa_atual||'').toUpperCase().includes('INSPE')).length,
    aguardandoPublicacao:ativos.filter(p=>String(p.etapa_atual||'').toUpperCase().includes('PUBLIC')).length
  };
}
async function listarNtes(){
  const c=client(); if(!c)return[];
  const {data,error}=await c.from('ntes_sigee').select('*').order('id',{ascending:true});
  if(error){console.warn('[Legalização] Não foi possível carregar NTEs.',error);return[];}return data||[];
}
async function criarInstituicao(payload){
  assertAccess(); const c=client(); if(!c)throw new Error('Cliente Supabase indisponível.');
  const u=user(); const n=master()?payload.nte_id:nteId();
  if(n==null||n==='')throw new Error('NTE obrigatório para o cadastro da instituição.');
  const registro={
    nte_id:Number(n), escola_id:payload.escola_id||null,
    nome_instituicao:String(payload.nome_instituicao||'').trim(),
    razao_social:String(payload.razao_social||'').trim()||null,
    cnpj:String(payload.cnpj||'').replace(/\D/g,'')||null,
    natureza:String(payload.natureza||'PRIVADA').trim().toUpperCase(),
    municipio:String(payload.municipio||'').trim()||null,
    endereco:String(payload.endereco||'').trim()||null,
    mantenedora_nome:String(payload.mantenedora_nome||'').trim()||null,
    situacao_regulatoria:'EM_CADASTRO',
    criado_por_id:u?.id||null, atualizado_por_id:u?.id||null
  };
  if(!registro.nome_instituicao)throw new Error('Informe o nome da instituição.');
  const {data,error}=await c.from('legalizacao_instituicoes').insert(registro).select('*').single();
  if(error)throw error; return data;
}
window.SIGEE_LEGALIZACAO_SERVICE=Object.freeze({listarInstituicoes,resumo,listarNtes,criarInstituicao,nteId});
})(window);
