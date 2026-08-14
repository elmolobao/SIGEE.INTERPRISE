/** SIGEE Enterprise — GT-07 Controle SEI (Master). */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_SEI_SERVICE) return;
const TABELA='gt_controle_sei';
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function autor(){const u=usuario()||{};return {criado_por_id:u.id||null,criado_por_nome:u.nome||u.name||'',criado_por_email:String(u.email||'').toLowerCase()||null};}
function ntes(v){return [...new Set((Array.isArray(v)?v:[]).map(Number).filter(n=>n>=1&&n<=27))].sort((a,b)=>a-b);}
function erroBanco(error){
 const msg=String(error?.message||error||'Erro desconhecido'),code=String(error?.code||'');
 if(code==='42P01'||code==='PGRST205'||/relation ["']?(public\.)?gt_controle_sei["']? does not exist/i.test(msg)){const e=new Error('A tabela do Controle SEI ainda não foi criada no Supabase. Execute o SQL GT-07_CONTROLE_SEI.sql.');e.code='GT07_SCHEMA_AUSENTE';throw e;}
 const detalhe=[error?.details,error?.hint].filter(Boolean).join(' | ');throw new Error(`Falha no Controle SEI: ${msg}${detalhe?` — ${detalhe}`:''}`);
}
async function listar(f={}){
 if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');
 let q=c.from(TABELA).select('*').order('data_entrada',{ascending:false}).order('id',{ascending:false});
 if(f.tipo)q=q.eq('tipo',f.tipo);if(f.status)q=q.eq('status',f.status);if(f.nte)q=q.contains('ntes',[Number(f.nte)]);
 const {data,error}=await q;if(error)erroBanco(error);return data||[];
}
async function salvar(p){
 if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');
 const arr=ntes(p.ntes);const reg={
  tipo:String(p.tipo||'').toUpperCase(),numero_sei:String(p.numero_sei||'').trim(),assunto:String(p.assunto||'').trim(),
  origem:String(p.origem||'').trim()||null,destino:String(p.destino||'').trim()||null,responsavel:String(p.responsavel||'').trim()||null,
  data_entrada:p.data_entrada||new Date().toISOString().slice(0,10),data_encaminhamento:p.data_encaminhamento||null,prazo:p.prazo||null,
  status:String(p.status||'ATIVO').toUpperCase(),providencia:String(p.providencia||'').trim()||null,observacoes:String(p.observacoes||'').trim()||null,
  data_conclusao:String(p.status||'ATIVO').toUpperCase()==='CONCLUIDO'?(p.data_conclusao||new Date().toISOString().slice(0,10)):null,
  abrangencia_todos:p.abrangencia_todos===true,ntes:p.abrangencia_todos===true?[]:arr,updated_at:new Date().toISOString()
 };
 if(!reg.tipo)throw new Error('Selecione o tipo de SEI.');if(!reg.numero_sei)throw new Error('Informe o número do processo/documento SEI.');if(!reg.assunto)throw new Error('Informe o assunto.');if(!reg.abrangencia_todos&&!reg.ntes.length)throw new Error('Selecione um NTE ou marque TODOS.');
 let r;if(p.id)r=await c.from(TABELA).update(reg).eq('id',p.id).select('*').single();else{Object.assign(reg,autor());r=await c.from(TABELA).insert(reg).select('*').single();}
 if(r.error)erroBanco(r.error);try{window.registrarLog?.(`${p.id?'Atualizou':'Cadastrou'} Controle SEI: ${reg.numero_sei}`,'',{modulo:'gestao_territorial'});}catch(_){}
 document.dispatchEvent(new CustomEvent('sigee:gt-sei-atualizado'));return r.data;
}
async function excluir(id){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');const {error}=await c.from(TABELA).delete().eq('id',id);if(error)erroBanco(error);document.dispatchEvent(new CustomEvent('sigee:gt-sei-atualizado'));return true;}
window.SIGEE_TERRITORIAL_SEI_SERVICE=Object.freeze({listar,salvar,excluir,master,versao:'GT-07.0'});
})(window);
