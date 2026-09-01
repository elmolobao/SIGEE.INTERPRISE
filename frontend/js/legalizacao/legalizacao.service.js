/** SIGEE Enterprise RC12.0.2 — Serviço do Prontuário Institucional e Credenciamento. */
(function(window){
'use strict';
if(window.__SIGEE_LEGALIZACAO_SERVICE_RC1202__)return;
window.__SIGEE_LEGALIZACAO_SERVICE_RC1202__=true;
const MOD='LEGALIZACAO';
function client(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||null;}catch(_){return null;}}
function user(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function master(){return window.SIGEE_MODULOS?.ehMaster?.(user())===true;}
function nteId(){return window.SIGEE_MODULOS?.nteNoModulo?.(MOD,user()) ?? user()?.nte_id ?? null;}
function assertAccess(){if(!window.SIGEE_MODULOS?.podeAcessar?.(MOD,user()))throw new Error('Acesso ao módulo Legalização não autorizado.');}
function scoped(q){const n=nteId();return !master()&&n!=null?q.eq('nte_id',n):q;}
function clean(v){const s=String(v??'').trim();return s||null;}
function intOrNull(v){const n=parseInt(v,10);return Number.isFinite(n)?n:null;}
function upper(v){return String(v||'').trim().toUpperCase();}
function today(){return new Date().toISOString().slice(0,10);}
function currentUserId(){return user()?.id??null;}
async function oneScoped(table,id){assertAccess();const c=client();let q=c.from(table).select('*').eq('id',id);q=scoped(q);const {data,error}=await q.maybeSingle();if(error)throw error;if(!data)throw new Error('Registro não encontrado na sua abrangência.');return data;}
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
    (async()=>{const c=client();const {data,error}=await c.from('legalizacao_ofertas').select('id,situacao,ano_fim_vigencia,instituicao_id').limit(2000);if(error)throw error;const ids=new Set(inst.map(i=>String(i.id)));return(data||[]).filter(o=>ids.has(String(o.instituicao_id)));})(),
    (async()=>{const c=client();const {data,error}=await c.from('legalizacao_autorizacoes_carimbo').select('id,situacao,ano_fim,instituicao_id').limit(2000);if(error)return[];const ids=new Set(inst.map(i=>String(i.id)));return(data||[]).filter(o=>ids.has(String(o.instituicao_id)));})()
  ]);
  const ativos=proc.filter(p=>!['CONCLUIDO','ARQUIVADO','CANCELADO'].includes(upper(p.status)));
  return {instituicoes:inst.length,credenciadas:inst.filter(i=>['CREDENCIADA','REGULAR'].includes(upper(i.situacao_regulatoria))).length,
    emCredenciamento:inst.filter(i=>upper(i.situacao_regulatoria)==='EM_CREDENCIAMENTO').length,processosAtivos:ativos.length,
    aguardandoPublicacao:ativos.filter(p=>upper(p.etapa_atual).includes('PUBLIC')).length,ofertas:ofertas.length,
    ofertasCriticas:ofertas.filter(o=>['EM_ANALISE','EM_RENOVACAO'].includes(upper(o.situacao))||((o.ano_fim_vigencia||9999)<=new Date().getFullYear())).length,
    carimbos:carimbos.length,carimbosCriticos:carimbos.filter(o=>['A_VENCER','VENCIDA','EM_RENOVACAO','EM_AUTORIZACAO'].includes(upper(o.situacao))).length,
    fiscalizacoes:fisc.filter(f=>!['REGULARIZADA','ARQUIVADA'].includes(upper(f.status))).length,
    averiguacoes:avg.filter(a=>!['ARQUIVADA','NAO_CONFIRMADA','VINCULADA_INSTITUICAO'].includes(upper(a.status))).length};
}
async function listarNtes(){const c=client();if(!c)return[];const {data,error}=await c.from('ntes_sigee').select('*').order('id',{ascending:true});if(error)return[];return data||[];}
async function criarInstituicao(payload){
  assertAccess();const c=client();if(!c)throw new Error('Cliente Supabase indisponível.');const n=master()?payload.nte_id:nteId();if(n==null||n==='')throw new Error('NTE obrigatório.');
  const tipo=upper(payload.tipo_cadastro||'PUBLICA'),rede=tipo==='PRIVADA'?'PRIVADA':upper(payload.rede||'ESTADUAL');
  const registro={nte_id:Number(n),nome_instituicao:String(payload.nome_instituicao||'').trim(),tipo_cadastro:tipo,rede,
    natureza:tipo==='PRIVADA'?'PRIVADA':(rede==='MUNICIPAL'?'PUBLICA_MUNICIPAL':'PUBLICA_ESTADUAL'),cod_sec:tipo==='PUBLICA'?clean(payload.cod_sec):null,cod_inep:clean(payload.cod_inep),cnpj:tipo==='PRIVADA'?clean(payload.mantenedora_cnpj):clean(payload.cnpj),municipio:clean(payload.municipio),
    telefone:clean(payload.telefone),whatsapp:clean(payload.whatsapp),email:clean(payload.email),logradouro:clean(payload.logradouro),numero:clean(payload.numero),complemento:clean(payload.complemento),bairro:clean(payload.bairro),cep:clean(payload.cep),uf:'BA',
    porte:clean(payload.porte),matriculas_referencia:intOrNull(payload.matriculas_referencia),ano_base_matriculas:intOrNull(payload.ano_base_matriculas),sistema_municipal_ensino:rede==='MUNICIPAL'?clean(payload.sistema_municipal_ensino):null,
    situacao_regulatoria:'EM_CADASTRO',origem:'CADASTRO_LEGALIZACAO',legado_sigee:false,criado_por_id:currentUserId(),atualizado_por_id:currentUserId()};
  if(!registro.nome_instituicao)throw new Error('Nome da instituição é obrigatório.');
  const {data,error}=await c.from('legalizacao_instituicoes').insert(registro).select('*').single();if(error)throw error;
  if(tipo==='PRIVADA'&&clean(payload.mantenedora_razao_social)){const {error:em}=await c.from('legalizacao_mantenedoras').insert({instituicao_id:data.id,razao_social:clean(payload.mantenedora_razao_social),cnpj:clean(payload.mantenedora_cnpj),representante_legal:clean(payload.mantenedora_representante),telefone:clean(payload.mantenedora_telefone),whatsapp:clean(payload.mantenedora_whatsapp),email:clean(payload.mantenedora_email),municipio:clean(payload.mantenedora_municipio),uf:'BA'});if(em)throw em;}
  for(const tipoResp of ['DIRETOR','SECRETARIO']){const pfx=tipoResp==='DIRETOR'?'diretor':'secretario';if(clean(payload[pfx+'_nome'])){const {error:er}=await c.from('legalizacao_responsaveis').insert({instituicao_id:data.id,tipo:tipoResp,nome:clean(payload[pfx+'_nome']),cpf:clean(payload[pfx+'_cpf']),telefone:clean(payload[pfx+'_telefone']),whatsapp:clean(payload[pfx+'_whatsapp']),email:clean(payload[pfx+'_email'])});if(er)throw er;}}
  return data;
}
async function obterProntuario(instituicaoId){
  const c=client(),instituicao=await oneScoped('legalizacao_instituicoes',instituicaoId);
  const iid=instituicao.id;
  const queries=await Promise.all([
    c.from('legalizacao_mantenedoras').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false}),
    c.from('legalizacao_responsaveis').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false}),
    c.from('legalizacao_autorizacoes_carimbo').select('*').eq('instituicao_id',iid).order('ano_fim',{ascending:false}),
    c.from('legalizacao_ofertas').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false}),
    c.from('legalizacao_processos').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false}),
    c.from('legalizacao_fiscalizacoes').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false}),
    c.from('legalizacao_inspecoes').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false}),
    c.from('legalizacao_handoff_acervo').select('*').eq('instituicao_id',iid).order('created_at',{ascending:false})
  ]);
  for(const r of queries){if(r.error)throw r.error;}
  const [mantenedoras,responsaveis,carimbos,ofertas,processos,fiscalizacoes,inspecoes,handoffs]=queries.map(r=>r.data||[]);
  const cred=processos.find(p=>upper(p.tipo)==='CREDENCIAMENTO'&&!['CONCLUIDO','ARQUIVADO','CANCELADO'].includes(upper(p.status)))||processos.find(p=>upper(p.tipo)==='CREDENCIAMENTO')||null;
  let checklist=[];if(cred){
    const {data:it,error:ei}=await c.from('legalizacao_checklist_processo').select('*').eq('processo_id',cred.id).order('id',{ascending:true});if(ei)throw ei;
    const ids=[...new Set((it||[]).map(x=>x.catalogo_id).filter(Boolean))];let cat=[];if(ids.length){const {data,error}=await c.from('legalizacao_checklist_catalogo').select('*').in('id',ids).order('ordem',{ascending:true});if(error)throw error;cat=data||[];}
    const by=new Map(cat.map(x=>[String(x.id),x]));checklist=(it||[]).map(x=>({...x,catalogo:by.get(String(x.catalogo_id))||null})).sort((a,b)=>(a.catalogo?.ordem||0)-(b.catalogo?.ordem||0));
  }
  return {instituicao,mantenedoras,responsaveis,carimbos,ofertas,processos,fiscalizacoes,inspecoes,handoffs,credenciamento:cred,checklist};
}
async function historicoProcesso(processoId,tipo,descricao,meta=null){const c=client();const {error}=await c.from('legalizacao_processos_historico').insert({processo_id:processoId,tipo,descricao,meta,usuario_id:currentUserId()});if(error)throw error;}
async function iniciarCredenciamento(instituicaoId,payload={}){
  assertAccess();const c=client(),inst=await oneScoped('legalizacao_instituicoes',instituicaoId),sei=clean(payload.numero_sei);if(!sei)throw new Error('Processo SEI é obrigatório para credenciamento.');
  const {data:exist,error:ee}=await c.from('legalizacao_processos').select('id,status').eq('instituicao_id',inst.id).eq('tipo','CREDENCIAMENTO').limit(20);if(ee)throw ee;if((exist||[]).some(x=>!['CONCLUIDO','ARQUIVADO','CANCELADO'].includes(upper(x.status))))throw new Error('Já existe credenciamento ativo para esta instituição.');
  const processo={instituicao_id:inst.id,nte_id:inst.nte_id,tipo:'CREDENCIAMENTO',numero_sei:sei,status:'EM_ANDAMENTO',etapa_atual:'TRIAGEM_DOCUMENTAL',data_protocolo:payload.data_protocolo||today(),observacao:clean(payload.observacao),criado_por_id:currentUserId(),atualizado_por_id:currentUserId()};
  const {data:p,error}=await c.from('legalizacao_processos').insert(processo).select('*').single();if(error)throw error;
  let cq=c.from('legalizacao_checklist_catalogo').select('*').eq('tipo_processo','CREDENCIAMENTO').eq('ativo',true).order('ordem',{ascending:true});
  cq=upper(inst.tipo_cadastro)==='PRIVADA'?cq.eq('aplica_privada',true):cq.eq('aplica_publica',true);
  const {data:catalogo,error:ec}=await cq;if(ec)throw ec;
  if((catalogo||[]).length){const rows=catalogo.map(x=>({processo_id:p.id,catalogo_id:x.id,status:'NAO_APRESENTADO'}));const {error:er}=await c.from('legalizacao_checklist_processo').insert(rows);if(er)throw er;}
  const {error:ui}=await c.from('legalizacao_instituicoes').update({situacao_regulatoria:'EM_CREDENCIAMENTO',atualizado_por_id:currentUserId(),updated_at:new Date().toISOString()}).eq('id',inst.id);if(ui)throw ui;
  await historicoProcesso(p.id,'ABERTURA','Credenciamento iniciado no SIGEE.',{numero_sei:sei,tipo_cadastro:inst.tipo_cadastro});return p;
}
async function atualizarChecklist(itemId,payload={}){
  assertAccess();const c=client(),status=upper(payload.status);const valid=['NAO_APRESENTADO','APRESENTADO','EM_ANALISE','CONFORME','NAO_CONFORME','NAO_SE_APLICA'];if(!valid.includes(status))throw new Error('Situação de checklist inválida.');
  const {data:ant,error:ea}=await c.from('legalizacao_checklist_processo').select('*').eq('id',itemId).single();if(ea)throw ea;const {data:proc,error:eproc}=await c.from('legalizacao_processos').select('id,nte_id').eq('id',ant.processo_id).single();if(eproc)throw eproc;if(!master()&&Number(proc.nte_id)!==Number(nteId()))throw new Error('Item fora da sua abrangência.');
  const registro={status,observacao:clean(payload.observacao),analisado_por_id:currentUserId(),analisado_em:new Date().toISOString()};const {data,error}=await c.from('legalizacao_checklist_processo').update(registro).eq('id',itemId).select('*').single();if(error)throw error;
  const {error:eh}=await c.from('legalizacao_checklist_historico').insert({checklist_item_id:itemId,processo_id:ant.processo_id,status_anterior:ant.status,status_novo:status,observacao:clean(payload.observacao),usuario_id:currentUserId()});if(eh)throw eh;return data;
}
async function emitirDiligencia(processoId,observacao){assertAccess();const c=client();const {data:p,error:ep}=await c.from('legalizacao_processos').select('*').eq('id',processoId).single();if(ep)throw ep;if(!master()&&Number(p.nte_id)!==Number(nteId()))throw new Error('Processo fora da sua abrangência.');const {error}=await c.from('legalizacao_processos').update({status:'EM_DILIGENCIA',etapa_atual:'DILIGENCIA',diligencia_em:new Date().toISOString(),observacao:clean(observacao)||p.observacao,atualizado_por_id:currentUserId(),updated_at:new Date().toISOString()}).eq('id',processoId);if(error)throw error;await historicoProcesso(processoId,'DILIGENCIA','Processo colocado em diligência documental.',{observacao:clean(observacao)});}
async function retomarAnalise(processoId){assertAccess();const c=client();const {data:p,error:ep}=await c.from('legalizacao_processos').select('*').eq('id',processoId).single();if(ep)throw ep;if(!master()&&Number(p.nte_id)!==Number(nteId()))throw new Error('Processo fora da sua abrangência.');const {error}=await c.from('legalizacao_processos').update({status:'EM_ANDAMENTO',etapa_atual:'ANALISE_DOCUMENTAL',atualizado_por_id:currentUserId(),updated_at:new Date().toISOString()}).eq('id',processoId);if(error)throw error;await historicoProcesso(processoId,'RETOMADA_ANALISE','Análise documental retomada após diligência.');}
async function prepararInspecao(processoId){
  assertAccess();const c=client();const {data:p,error:ep}=await c.from('legalizacao_processos').select('*').eq('id',processoId).single();if(ep)throw ep;if(!master()&&Number(p.nte_id)!==Number(nteId()))throw new Error('Processo fora da sua abrangência.');
  const {data:it,error:ei}=await c.from('legalizacao_checklist_processo').select('status,catalogo_id').eq('processo_id',processoId);if(ei)throw ei;const catIds=[...new Set((it||[]).map(x=>x.catalogo_id).filter(Boolean))];let obrigatorios=new Set();if(catIds.length){const {data:cats,error:ec}=await c.from('legalizacao_checklist_catalogo').select('id,obrigatorio').in('id',catIds);if(ec)throw ec;obrigatorios=new Set((cats||[]).filter(x=>x.obrigatorio).map(x=>String(x.id)));}
  const pend=(it||[]).filter(x=>obrigatorios.has(String(x.catalogo_id))&&!['CONFORME','NAO_SE_APLICA'].includes(upper(x.status)));if(pend.length)throw new Error(`Ainda existem ${pend.length} item(ns) obrigatório(s) pendente(s) no checklist.`);
  const {data:ins,error:eins}=await c.from('legalizacao_inspecoes').select('id').eq('processo_id',processoId).limit(1);if(eins)throw eins;if(!(ins||[]).length){const {error}=await c.from('legalizacao_inspecoes').insert({processo_id:processoId,instituicao_id:p.instituicao_id,nte_id:p.nte_id,status:'AGENDAMENTO',responsavel_id:null});if(error)throw error;}
  const now=new Date().toISOString();const {error}=await c.from('legalizacao_processos').update({status:'EM_ANDAMENTO',etapa_atual:'AGUARDANDO_INSPECAO',checklist_concluido_em:now,checklist_concluido_por_id:currentUserId(),atualizado_por_id:currentUserId(),updated_at:now}).eq('id',processoId);if(error)throw error;await historicoProcesso(processoId,'CHECKLIST_CONCLUIDO','Checklist documental concluído; processo preparado para inspeção.');
}
window.SIGEE_LEGALIZACAO_SERVICE=Object.freeze({listarInstituicoes,resumo,listarNtes,criarInstituicao,obterProntuario,iniciarCredenciamento,atualizarChecklist,emitirDiligencia,retomarAnalise,prepararInspecao,ehMaster:master,nteId});
})(window);
