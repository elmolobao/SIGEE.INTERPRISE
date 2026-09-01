/** SIGEE Enterprise RC12.0.1 — Serviço do módulo Legalização Escolar. */
(function(window){
'use strict';
if(window.__SIGEE_LEGALIZACAO_SERVICE_RC1201__)return;
window.__SIGEE_LEGALIZACAO_SERVICE_RC1201__=true;
const MOD='LEGALIZACAO';
function client(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||null;}catch(_){return null;}}
function user(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function master(){return window.SIGEE_MODULOS?.ehMaster?.(user())===true;}
function nteId(){return window.SIGEE_MODULOS?.nteNoModulo?.(MOD,user()) ?? user()?.nte_id ?? null;}
function assertAccess(){if(!window.SIGEE_MODULOS?.podeAcessar?.(MOD,user()))throw new Error('Acesso ao módulo Legalização não autorizado.');}
function scoped(q){const n=nteId();return !master()&&n!=null?q.eq('nte_id',n):q;}
function clean(v){const s=String(v??'').trim();return s||null;}
function intOrNull(v){const n=parseInt(v,10);return Number.isFinite(n)?n:null;}
async function listarInstituicoes(filtros={}){
  assertAccess();const c=client();if(!c)throw new Error('Cliente Supabase indisponível.');
  let q=c.from('legalizacao_instituicoes').select('*').order('nome_instituicao',{ascending:true});q=scoped(q);
  if(filtros.situacao)q=q.eq('situacao_regulatoria',filtros.situacao);
  if(filtros.tipoCadastro)q=q.eq('tipo_cadastro',filtros.tipoCadastro);
  if(filtros.busca){const b=String(filtros.busca).trim().replace(/[,()]/g,' ');if(b)q=q.or(`nome_instituicao.ilike.%${b}%,razao_social.ilike.%${b}%,cnpj.ilike.%${b}%,municipio.ilike.%${b}%,cod_sec.ilike.%${b}%,cod_inep.ilike.%${b}%`);}
  const {data,error}=await q.limit(700);if(error)throw error;return data||[];
}
async function listScoped(table,select='*',limit=1000){const c=client();let q=c.from(table).select(select);q=scoped(q);const {data,error}=await q.limit(limit);if(error)throw error;return data||[];}
async function resumo(){
  assertAccess();const [inst,proc,fisc,avg,ofertas,carimbos]=await Promise.all([
    listarInstituicoes(),listScoped('legalizacao_processos','id,status,tipo,etapa_atual,nte_id'),
    listScoped('legalizacao_fiscalizacoes','id,status,nte_id'),listScoped('legalizacao_averiguacoes','id,status,nte_id'),
    (async()=>{const c=client();let q=c.from('legalizacao_ofertas').select('id,situacao,ano_fim_vigencia,instituicao_id');const {data,error}=await q.limit(2000);if(error)throw error;const ids=new Set(inst.map(i=>String(i.id)));return (data||[]).filter(o=>ids.has(String(o.instituicao_id)));})(),
    (async()=>{const c=client();let q=c.from('legalizacao_autorizacoes_carimbo').select('id,situacao,ano_fim,instituicao_id');const {data,error}=await q.limit(2000);if(error)return[];const ids=new Set(inst.map(i=>String(i.id)));return (data||[]).filter(o=>ids.has(String(o.instituicao_id)));})()
  ]);
  const ativos=proc.filter(p=>!['CONCLUIDO','ARQUIVADO','CANCELADO'].includes(String(p.status||'').toUpperCase()));
  const emCred=inst.filter(i=>String(i.situacao_regulatoria||'').toUpperCase()==='EM_CREDENCIAMENTO').length;
  return {instituicoes:inst.length,credenciadas:inst.filter(i=>['CREDENCIADA','REGULAR'].includes(String(i.situacao_regulatoria||'').toUpperCase())).length,
    emCredenciamento:emCred,processosAtivos:ativos.length,aguardandoPublicacao:ativos.filter(p=>String(p.etapa_atual||'').toUpperCase().includes('PUBLIC')).length,
    ofertas:ofertas.length,ofertasCriticas:ofertas.filter(o=>['EM_ANALISE','EM_RENOVACAO'].includes(String(o.situacao||'').toUpperCase())||((o.ano_fim_vigencia||9999)<=new Date().getFullYear())).length,
    carimbos:carimbos.length,carimbosCriticos:carimbos.filter(o=>['A_VENCER','VENCIDA','EM_RENOVACAO','EM_AUTORIZACAO'].includes(String(o.situacao||'').toUpperCase())).length,
    fiscalizacoes:fisc.filter(f=>!['REGULARIZADA','ARQUIVADA'].includes(String(f.status||'').toUpperCase())).length,
    averiguacoes:avg.filter(a=>!['ARQUIVADA','NAO_CONFIRMADA','VINCULADA_INSTITUICAO'].includes(String(a.status||'').toUpperCase())).length};
}
async function listarNtes(){const c=client();if(!c)return[];const {data,error}=await c.from('ntes_sigee').select('*').order('id',{ascending:true});if(error)return[];return data||[];}
async function criarInstituicao(payload){
  assertAccess();const c=client();if(!c)throw new Error('Cliente Supabase indisponível.');const u=user();const n=master()?payload.nte_id:nteId();if(n==null||n==='')throw new Error('NTE obrigatório.');
  const tipo=String(payload.tipo_cadastro||'PUBLICA').toUpperCase();const rede=tipo==='PRIVADA'?'PRIVADA':String(payload.rede||'ESTADUAL').toUpperCase();
  const registro={nte_id:Number(n),nome_instituicao:String(payload.nome_instituicao||'').trim(),tipo_cadastro:tipo,rede,
    natureza:tipo==='PRIVADA'?'PRIVADA':(rede==='MUNICIPAL'?'PUBLICA_MUNICIPAL':'PUBLICA_ESTADUAL'),cod_sec:tipo==='PUBLICA'?clean(payload.cod_sec):null,cod_inep:clean(payload.cod_inep),cnpj:tipo==='PRIVADA'?clean(payload.mantenedora_cnpj):clean(payload.cnpj),municipio:clean(payload.municipio),
    telefone:clean(payload.telefone),whatsapp:clean(payload.whatsapp),email:clean(payload.email),logradouro:clean(payload.logradouro),numero:clean(payload.numero),complemento:clean(payload.complemento),bairro:clean(payload.bairro),cep:clean(payload.cep),uf:'BA',
    porte:clean(payload.porte),matriculas_referencia:intOrNull(payload.matriculas_referencia),ano_base_matriculas:intOrNull(payload.ano_base_matriculas),sistema_municipal_ensino:rede==='MUNICIPAL'?clean(payload.sistema_municipal_ensino):null,
    situacao_regulatoria:'EM_CADASTRO',origem:'CADASTRO_LEGALIZACAO',legado_sigee:false,criado_por_id:u?.id??null,atualizado_por_id:u?.id??null};
  if(!registro.nome_instituicao)throw new Error('Nome da instituição é obrigatório.');
  const {data,error}=await c.from('legalizacao_instituicoes').insert(registro).select('*').single();if(error)throw error;
  if(tipo==='PRIVADA'&&clean(payload.mantenedora_razao_social)){
    const {error:em}=await c.from('legalizacao_mantenedoras').insert({instituicao_id:data.id,razao_social:clean(payload.mantenedora_razao_social),cnpj:clean(payload.mantenedora_cnpj),representante_legal:clean(payload.mantenedora_representante),telefone:clean(payload.mantenedora_telefone),whatsapp:clean(payload.mantenedora_whatsapp),email:clean(payload.mantenedora_email),municipio:clean(payload.mantenedora_municipio),uf:'BA'});if(em)throw em;
  }
  for(const tipoResp of ['DIRETOR','SECRETARIO']){const pfx=tipoResp==='DIRETOR'?'diretor':'secretario';if(clean(payload[pfx+'_nome'])){const {error:er}=await c.from('legalizacao_responsaveis').insert({instituicao_id:data.id,tipo:tipoResp,nome:clean(payload[pfx+'_nome']),cpf:clean(payload[pfx+'_cpf']),telefone:clean(payload[pfx+'_telefone']),whatsapp:clean(payload[pfx+'_whatsapp']),email:clean(payload[pfx+'_email'])});if(er)throw er;}}
  return data;
}
window.SIGEE_LEGALIZACAO_SERVICE=Object.freeze({listarInstituicoes,resumo,listarNtes,criarInstituicao,ehMaster:master,nteId});
})(window);
