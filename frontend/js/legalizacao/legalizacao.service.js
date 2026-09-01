/** SIGEE Enterprise RC12.0.4A — base consolidada e importação controlada de atos. */
(function(window){
'use strict';
if(window.__SIGEE_LEGALIZACAO_SERVICE_RC1204A__)return;
window.__SIGEE_LEGALIZACAO_SERVICE_RC1204A__=true;
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
let resumoCache=null,resumoCacheEm=0;const RESUMO_TTL=120000;
const escolaCache=new Map();
function depPrivada(v){const d=upper(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'');return d.includes('PARTICULAR')||d.includes('PRIVAD');}
function escolaParaInstituicao(escola,extensao=null){const dep=escola?.dependencia_adm||escola?.dependencia||'',priv=depPrivada(dep);return {...(extensao||{}),id:extensao?.id||null,prontuario_id:extensao?.id||null,escola_id:escola?.id,nte_id:escola?.nte_id??extensao?.nte_id,nome_instituicao:escola?.nome_escola||escola?.nome||extensao?.nome_instituicao,cod_inep:escola?.cod_mec||extensao?.cod_inep,municipio:escola?.municipio||extensao?.municipio,tipo_cadastro:priv?'PRIVADA':'PUBLICA',rede:priv?'PRIVADA':(upper(dep).includes('MUNICIPAL')?'MUNICIPAL':(upper(dep).includes('FEDERAL')?'FEDERAL':'ESTADUAL')),natureza:priv?'PRIVADA':`PUBLICA_${upper(dep)||'NAO_CLASSIFICADA'}`,dependencia_adm:dep,situacao_funcional:escola?.situacao_funcional||escola?.situacao||null,situacao_regulatoria:extensao?.situacao_regulatoria||'A_CONFERIR',prontuario_habilitado:true,dados_importados_status:extensao?.dados_importados_status||'A_CONFERIR',origem:extensao?.origem||'CATALOGO_SIGEE'};}
async function obterEscolaMestre(escolaId){if(!escolaId)return null;const k=String(escolaId);if(escolaCache.has(k))return escolaCache.get(k);const c=client(),{data,error}=await c.from('escolas_sigee').select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo,ativo').eq('id',escolaId).maybeSingle();if(error)throw error;if(data)escolaCache.set(k,data);return data||null;}
async function oneScoped(table,id){assertAccess();const c=client();let q=c.from(table).select('*').eq('id',id);q=scoped(q);const {data,error}=await q.maybeSingle();if(error)throw error;if(!data)throw new Error('Registro não encontrado na sua abrangência.');if(table==='legalizacao_instituicoes'&&data.escola_id){const escola=await obterEscolaMestre(data.escola_id);if(escola)return escolaParaInstituicao(escola,data);}return data;}
function aplicarFiltrosCatalogo(q,filtros={}){
  if(filtros.situacao)q=q.eq('situacao_regulatoria',filtros.situacao);
  const tipo=upper(filtros.tipoCadastro);
  if(tipo)q=q.eq('tipo_cadastro',tipo);
  if(filtros.busca){const b=String(filtros.busca).trim().replace(/[,()]/g,' ');if(b)q=q.or(`nome_instituicao.ilike.%${b}%,municipio.ilike.%${b}%,cod_inep.ilike.%${b}%,cnpj.ilike.%${b}%,cod_sec.ilike.%${b}%`);}
  return q;
}
async function consultarInstituicoes(filtros={}){
  assertAccess();const c=client();if(!c)throw new Error('Cliente Supabase indisponível.');
  const page=Math.max(1,intOrNull(filtros.page)||1),pageSize=Math.min(100,Math.max(10,intOrNull(filtros.pageSize)||50)),from=(page-1)*pageSize,to=from+pageSize-1;
  let q=c.from('legalizacao_catalogo_v').select('*',{count:'exact'}).order('nome_instituicao',{ascending:true});q=aplicarFiltrosCatalogo(scoped(q),filtros);
  const {data,error,count}=await q.range(from,to);if(error)throw error;const items=data||[];return {items,total:Number(count||0),page,pageSize,pages:Math.max(1,Math.ceil(Number(count||0)/pageSize))};
}
async function listarInstituicoes(filtros={}){return (await consultarInstituicoes(filtros)).items;}
async function contarInstituicoes(filtros={}){assertAccess();const c=client();let q=c.from('legalizacao_catalogo_v').select('escola_id',{count:'exact',head:true});q=aplicarFiltrosCatalogo(scoped(q),filtros);const {count,error}=await q;if(error)throw error;return Number(count||0);}
async function contarTabela(table,configurar){const c=client();let q=c.from(table).select('id',{count:'exact',head:true});if(configurar)q=configurar(q);const {count,error}=await q;if(error)throw error;return Number(count||0);}
async function listScoped(table,select='*',limit=1000){const c=client();if(!c)throw new Error('Cliente Supabase indisponível.');let q=c.from(table).select(select);q=scoped(q);const {data,error}=await q.limit(limit);if(error)throw error;return data||[];}
async function safeListScoped(table,select='*',limit=1000){try{return await listScoped(table,select,limit);}catch(err){console.warn('[Legalização] fonte opcional indisponível:',table,err?.message||err);return[];}}
async function safeChildren(table,select,inst){try{const c=client();const {data,error}=await c.from(table).select(select).limit(2500);if(error)throw error;const ids=new Set((inst||[]).map(i=>String(i.id)));return(data||[]).filter(o=>ids.has(String(o.instituicao_id)));}catch(err){console.warn('[Legalização] fonte complementar indisponível:',table,err?.message||err);return[];}}
async function resumo(force=false){
  assertAccess();if(!force&&resumoCache&&Date.now()-resumoCacheEm<RESUMO_TTL)return resumoCache;const ano=new Date().getFullYear();
  const safe=async p=>{try{return await p;}catch(err){console.warn('[Legalização] contador opcional indisponível:',err?.message||err);return 0;}};
  const [instituicoes,emCredenciamento,ofertasCriticas,carimbosCriticos,fiscalizacoes,averiguacoes]=await Promise.all([
    contarInstituicoes(),contarInstituicoes({situacao:'EM_CREDENCIAMENTO'}),
    safe(contarTabela('legalizacao_ofertas',q=>q.or(`situacao.in.(EM_ANALISE,EM_RENOVACAO,A_VENCER,VENCIDA),ano_fim_vigencia.lte.${ano+1}`))),
    safe(contarTabela('legalizacao_autorizacoes_carimbo',q=>q.in('situacao',['A_VENCER','VENCIDA','EM_RENOVACAO','EM_AUTORIZACAO']))),
    safe(contarTabela('legalizacao_fiscalizacoes',q=>scoped(q).not('status','in','(REGULARIZADA,ARQUIVADA)'))),
    safe(contarTabela('legalizacao_averiguacoes',q=>scoped(q).not('status','in','(ARQUIVADA,NAO_CONFIRMADA,VINCULADA_INSTITUICAO)')))
  ]);
  resumoCache={instituicoes,emCredenciamento,ofertasCriticas,carimbosCriticos,fiscalizacoes,averiguacoes};resumoCacheEm=Date.now();return resumoCache;
}
async function listarProcessosRegulatorios(){
  assertAccess();const c=client();let q=c.from('legalizacao_processos').select('id,instituicao_id,nte_id,tipo,numero_sei,status,etapa_atual,data_protocolo,data_publicacao,updated_at').order('updated_at',{ascending:false}).limit(1000);q=scoped(q);const {data,error}=await q;if(error)throw error;const lista=data||[];const ids=[...new Set(lista.map(x=>x.instituicao_id).filter(Boolean))];let inst=[];if(ids.length){const r=await c.from('legalizacao_instituicoes').select('id,nome_instituicao,tipo_cadastro,rede').in('id',ids);if(!r.error)inst=r.data||[];}const im=new Map(inst.map(x=>[String(x.id),x]));return lista.map(x=>({...x,instituicao:im.get(String(x.instituicao_id))||null}));
}
async function listarOfertasRegulatorias(){
  assertAccess();const inst=await listarInstituicoes();const lista=await safeChildren('legalizacao_ofertas','id,instituicao_id,processo_id,etapa_modalidade,curso_tecnico,eixo_tecnologico,ano_inicio_vigencia,ano_fim_vigencia,situacao,updated_at',inst);const im=new Map(inst.map(x=>[String(x.id),x]));return lista.map(x=>({...x,instituicao:im.get(String(x.instituicao_id))||null}));
}
async function listarCarimbosRegulatorios(){
  assertAccess();const inst=await listarInstituicoes();const lista=await safeChildren('legalizacao_autorizacoes_carimbo','id,instituicao_id,responsavel_id,tipo,ano_inicio,ano_fim,situacao,numero_sei,updated_at',inst);const im=new Map(inst.map(x=>[String(x.id),x]));const rids=[...new Set(lista.map(x=>x.responsavel_id).filter(Boolean))];let resp=[];if(rids.length){const c=client(),r=await c.from('legalizacao_responsaveis').select('id,nome,tipo').in('id',rids);if(!r.error)resp=r.data||[];}const rm=new Map(resp.map(x=>[String(x.id),x]));return lista.map(x=>({...x,instituicao:im.get(String(x.instituicao_id))||null,responsavel:rm.get(String(x.responsavel_id))||null}));
}
async function listarNtes(){const c=client();if(!c)return[];const {data,error}=await c.from('ntes_sigee').select('*').order('id',{ascending:true});if(error)return[];return data||[];}

async function listarInspecoesGerais(){
  assertAccess();const c=client();let q=c.from('legalizacao_inspecoes').select('*').order('created_at',{ascending:false}).limit(500);q=scoped(q);const {data,error}=await q;if(error)throw error;const lista=data||[];if(!lista.length)return[];
  const instIds=[...new Set(lista.map(x=>x.instituicao_id).filter(Boolean))],procIds=[...new Set(lista.map(x=>x.processo_id).filter(Boolean))];
  let inst=[],proc=[];if(instIds.length){const r=await c.from('legalizacao_instituicoes').select('id,nome_instituicao,nte_id').in('id',instIds);if(r.error)throw r.error;inst=r.data||[];}if(procIds.length){const r=await c.from('legalizacao_processos').select('id,numero_sei,tipo,status,etapa_atual').in('id',procIds);if(r.error)throw r.error;proc=r.data||[];}
  const im=new Map(inst.map(x=>[String(x.id),x])),pm=new Map(proc.map(x=>[String(x.id),x]));return lista.map(x=>({...x,instituicao:im.get(String(x.instituicao_id))||null,processo:pm.get(String(x.processo_id))||null}));
}
async function listarHistoricoRegulatorio(){
  assertAccess();const c=client();let q=c.from('legalizacao_processos').select('id,instituicao_id,nte_id,tipo,numero_sei,status,etapa_atual,data_protocolo,created_at,updated_at').order('updated_at',{ascending:false}).limit(700);q=scoped(q);const {data,error}=await q;if(error)throw error;const lista=data||[];if(!lista.length)return[];
  const instIds=[...new Set(lista.map(x=>x.instituicao_id).filter(Boolean))];let inst=[];if(instIds.length){const r=await c.from('legalizacao_instituicoes').select('id,nome_instituicao,nte_id').in('id',instIds);if(r.error)throw r.error;inst=r.data||[];}const im=new Map(inst.map(x=>[String(x.id),x]));return lista.map(x=>({...x,instituicao:im.get(String(x.instituicao_id))||null}));
}
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
async function confirmarCadastroMigrado(instituicaoId){
  assertAccess();const c=client(),inst=await oneScoped('legalizacao_instituicoes',instituicaoId);if(upper(inst.situacao_regulatoria)!=='A_CONFIRMAR')throw new Error('Este cadastro não está aguardando confirmação.');
  const registro={situacao_regulatoria:'EM_CADASTRO',atualizado_por_id:currentUserId(),updated_at:new Date().toISOString()};
  const {data,error}=await c.from('legalizacao_instituicoes').update(registro).eq('id',inst.id).select('*').single();if(error)throw error;resumoCache=null;return data;
}
async function habilitarProntuario(escolaId){
  assertAccess();const c=client(),escola=await obterEscolaMestre(escolaId);if(!escola)throw new Error('Escola não localizada no cadastro mestre do SIGEE.');if(!master()&&Number(escola.nte_id)!==Number(nteId()))throw new Error('Escola fora da sua abrangência.');
  const {data:exist,error:ee}=await c.from('legalizacao_instituicoes').select('*').eq('escola_id',escola.id).order('id',{ascending:false}).limit(1);if(ee)throw ee;let ext=(exist||[])[0]||null;
  if(ext){if(['A_CONFIRMAR','NAO_HABILITADO'].includes(upper(ext.situacao_regulatoria))){const {data,error}=await c.from('legalizacao_instituicoes').update({situacao_regulatoria:'A_CONFERIR',dados_importados_status:'A_CONFERIR',atualizado_por_id:currentUserId(),updated_at:new Date().toISOString()}).eq('id',ext.id).select('*').single();if(error)throw error;ext=data;}resumoCache=null;return escolaParaInstituicao(escola,ext);}
  const priv=depPrivada(escola.dependencia_adm||escola.dependencia),dep=upper(escola.dependencia_adm||escola.dependencia);
  const registro={escola_id:escola.id,nte_id:escola.nte_id,nome_instituicao:escola.nome_escola||escola.nome,tipo_cadastro:priv?'PRIVADA':'PUBLICA',rede:priv?'PRIVADA':(dep.includes('MUNIC')?'MUNICIPAL':(dep.includes('FEDERAL')?'FEDERAL':'ESTADUAL')),natureza:priv?'PRIVADA':(dep.includes('MUNIC')?'PUBLICA_MUNICIPAL':(dep.includes('FEDERAL')?'PUBLICA_FEDERAL':'PUBLICA_ESTADUAL')),cod_inep:clean(escola.cod_mec),municipio:clean(escola.municipio),situacao_regulatoria:'A_CONFERIR',dados_importados_status:'A_CONFERIR',origem:'CATALOGO_SIGEE',legado_sigee:true,criado_por_id:currentUserId(),atualizado_por_id:currentUserId()};
  const {data,error}=await c.from('legalizacao_instituicoes').insert(registro).select('*').single();if(error)throw error;resumoCache=null;return escolaParaInstituicao(escola,data);
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
  let [mantenedoras,responsaveis,carimbos,ofertas,processos,fiscalizacoes,inspecoes,handoffs]=queries.map(r=>r.data||[]);
  if(inspecoes.length){
    const ids=inspecoes.map(x=>x.id);
    const {data:ii,error:eii}=await c.from('legalizacao_inspecao_itens').select('*').in('inspecao_id',ids).order('ordem',{ascending:true});if(eii)throw eii;
    const by=new Map();for(const x of ii||[]){const k=String(x.inspecao_id);if(!by.has(k))by.set(k,[]);by.get(k).push(x);}
    inspecoes=inspecoes.map(x=>({...x,itens:by.get(String(x.id))||[]}));
  }
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
  const {data:ins,error:eins}=await c.from('legalizacao_inspecoes').select('*').eq('processo_id',processoId).limit(1);if(eins)throw eins;let insp=(ins||[])[0]||null;
  if(!insp){const {data:ni,error}=await c.from('legalizacao_inspecoes').insert({processo_id:processoId,instituicao_id:p.instituicao_id,nte_id:p.nte_id,status:'AGENDAMENTO',responsavel_id:currentUserId()}).select('*').single();if(error)throw error;insp=ni;}
  const {data:existItens,error:eex}=await c.from('legalizacao_inspecao_itens').select('id').eq('inspecao_id',insp.id).limit(1);if(eex)throw eex;
  if(!(existItens||[]).length){const {data:cat,error:ecat}=await c.from('legalizacao_inspecao_catalogo').select('*').eq('ativo',true).order('ordem',{ascending:true});if(ecat)throw ecat;if((cat||[]).length){const rows=cat.map(x=>({inspecao_id:insp.id,codigo_item:x.codigo_item,categoria:x.categoria,descricao:x.descricao,referencia_normativa:x.referencia_normativa,resultado:'PENDENTE',ordem:x.ordem}));const {error:eri}=await c.from('legalizacao_inspecao_itens').insert(rows);if(eri)throw eri;}}
  const now=new Date().toISOString();const {error}=await c.from('legalizacao_processos').update({status:'EM_ANDAMENTO',etapa_atual:'AGUARDANDO_INSPECAO',checklist_concluido_em:now,checklist_concluido_por_id:currentUserId(),atualizado_por_id:currentUserId(),updated_at:now}).eq('id',processoId);if(error)throw error;await historicoProcesso(processoId,'CHECKLIST_CONCLUIDO','Checklist documental concluído; processo preparado para inspeção.');return insp;
}
async function agendarInspecao(inspecaoId,dataAgendada){assertAccess();const c=client();const {data:i,error:ei}=await c.from('legalizacao_inspecoes').select('*').eq('id',inspecaoId).single();if(ei)throw ei;if(!master()&&Number(i.nte_id)!==Number(nteId()))throw new Error('Inspeção fora da sua abrangência.');if(!dataAgendada)throw new Error('Informe a data da inspeção.');const now=new Date().toISOString();const {data,error}=await c.from('legalizacao_inspecoes').update({data_agendada:dataAgendada,status:'AGENDADA',responsavel_id:i.responsavel_id||currentUserId(),updated_at:now}).eq('id',inspecaoId).select('*').single();if(error)throw error;await historicoProcesso(i.processo_id,'INSPECAO_AGENDADA','Inspeção agendada.',{data_agendada:dataAgendada});return data;}
async function atualizarItemInspecao(itemId,payload={}){assertAccess();const c=client(),resultado=upper(payload.resultado);if(!['PENDENTE','CONFORME','NAO_CONFORME','NAO_SE_APLICA'].includes(resultado))throw new Error('Resultado de inspeção inválido.');const {data:ant,error:ea}=await c.from('legalizacao_inspecao_itens').select('*').eq('id',itemId).single();if(ea)throw ea;const {data:i,error:ei}=await c.from('legalizacao_inspecoes').select('*').eq('id',ant.inspecao_id).single();if(ei)throw ei;if(!master()&&Number(i.nte_id)!==Number(nteId()))throw new Error('Item fora da sua abrangência.');const {data,error}=await c.from('legalizacao_inspecao_itens').update({resultado,observacao:clean(payload.observacao),orientacao:clean(payload.orientacao),analisado_por_id:currentUserId(),analisado_em:new Date().toISOString()}).eq('id',itemId).select('*').single();if(error)throw error;return data;}
async function registrarRealizacaoInspecao(inspecaoId,dataRealizada){assertAccess();const c=client();const {data:i,error:ei}=await c.from('legalizacao_inspecoes').select('*').eq('id',inspecaoId).single();if(ei)throw ei;if(!master()&&Number(i.nte_id)!==Number(nteId()))throw new Error('Inspeção fora da sua abrangência.');const d=dataRealizada||today(),now=new Date().toISOString();const {data,error}=await c.from('legalizacao_inspecoes').update({data_realizada:d,status:'REALIZADA',responsavel_id:i.responsavel_id||currentUserId(),updated_at:now}).eq('id',inspecaoId).select('*').single();if(error)throw error;await historicoProcesso(i.processo_id,'INSPECAO_REALIZADA','Verificação in loco registrada.',{data_realizada:d});return data;}
async function concluirInspecao(inspecaoId,payload={}){assertAccess();const c=client();const {data:i,error:ei}=await c.from('legalizacao_inspecoes').select('*').eq('id',inspecaoId).single();if(ei)throw ei;if(!master()&&Number(i.nte_id)!==Number(nteId()))throw new Error('Inspeção fora da sua abrangência.');const {data:it,error:eii}=await c.from('legalizacao_inspecao_itens').select('id,resultado').eq('inspecao_id',inspecaoId);if(eii)throw eii;const pend=(it||[]).filter(x=>upper(x.resultado)==='PENDENTE');if(pend.length)throw new Error(`Ainda existem ${pend.length} item(ns) sem conclusão na inspeção.`);const rg=upper(payload.resultado_global);if(!['FAVORAVEL','FAVORAVEL_COM_RESSALVAS','DESFAVORAVEL'].includes(rg))throw new Error('Informe a conclusão técnica da inspeção.');const texto=clean(payload.relatorio_tecnico);if(!texto)throw new Error('Registre a conclusão/relatório técnico.');const now=new Date().toISOString();const {data,error}=await c.from('legalizacao_inspecoes').update({data_realizada:i.data_realizada||today(),status:'CONCLUIDA',resultado_global:rg,relatorio_tecnico:texto,conclusao:texto,relatorio_concluido_em:now,relatorio_concluido_por_id:currentUserId(),updated_at:now}).eq('id',inspecaoId).select('*').single();if(error)throw error;const {error:ep}=await c.from('legalizacao_processos').update({status:'EM_ANDAMENTO',etapa_atual:'ANALISE_FINAL',atualizado_por_id:currentUserId(),updated_at:now}).eq('id',i.processo_id);if(ep)throw ep;await historicoProcesso(i.processo_id,'RELATORIO_TECNICO_CONCLUIDO','Relatório técnico da inspeção concluído.',{resultado_global:rg});return data;}
async function processoCredenciamento(processoId){assertAccess();const c=client();let q=c.from('legalizacao_processos').select('*').eq('id',processoId).eq('tipo','CREDENCIAMENTO');q=scoped(q);const {data,error}=await q.maybeSingle();if(error)throw error;if(!data)throw new Error('Credenciamento não localizado na sua abrangência.');return data;}
async function concluirAnaliseFinal(processoId,payload={}){
  const c=client(),p=await processoCredenciamento(processoId);if(upper(p.etapa_atual)!=='ANALISE_FINAL')throw new Error('O processo não está na etapa de Análise Final.');
  const parecer=clean(payload.parecer_final);if(!parecer)throw new Error('Registre o parecer da análise final.');
  const {data:ins,error:ei}=await c.from('legalizacao_inspecoes').select('id,status,resultado_global').eq('processo_id',p.id).order('created_at',{ascending:false}).limit(1);if(ei)throw ei;const ultima=(ins||[])[0];if(!ultima||upper(ultima.status)!=='CONCLUIDA')throw new Error('A inspeção precisa estar concluída.');if(upper(ultima.resultado_global)==='DESFAVORAVEL')throw new Error('A inspeção desfavorável não pode seguir para publicação. Registre a diligência cabível.');
  const now=new Date().toISOString(),registro={parecer_final:parecer,decisao_final:'DEFERIDO',analise_final_concluida_em:now,analise_final_por_id:currentUserId(),status:'EM_ANDAMENTO',etapa_atual:'AGUARDANDO_PUBLICACAO',atualizado_por_id:currentUserId(),updated_at:now};
  const {data,error}=await c.from('legalizacao_processos').update(registro).eq('id',p.id).select('*').single();if(error)throw error;await historicoProcesso(p.id,'ANALISE_FINAL_CONCLUIDA','Análise final deferida; processo aguardando publicação.',{decisao:'DEFERIDO'});return data;
}
async function registrarPublicacao(processoId,payload={}){
  const c=client(),p=await processoCredenciamento(processoId);if(upper(p.etapa_atual)!=='AGUARDANDO_PUBLICACAO')throw new Error('O processo não está aguardando publicação.');
  const numero=clean(payload.numero_ato),dataAto=clean(payload.data_ato),dataPublicacao=clean(payload.data_publicacao),referencia=clean(payload.referencia_doe);if(!numero||!dataAto||!dataPublicacao||!referencia)throw new Error('Informe número e data do ato, data da publicação e referência do DOE.');
  const inicio=clean(payload.vigencia_inicio),fim=clean(payload.vigencia_fim);if(inicio&&fim&&fim<inicio)throw new Error('O fim da vigência não pode ser anterior ao início.');
  const link=clean(payload.doe_url);if(link&&!/^https?:\/\//i.test(link))throw new Error('O link do DOE deve iniciar com http:// ou https://.');
  const now=new Date().toISOString(),registro={tipo_ato:clean(payload.tipo_ato)||'CREDENCIAMENTO',numero_ato:numero,data_ato:dataAto,data_publicacao:dataPublicacao,referencia_doe:referencia,doe_url:link,vigencia_inicio:inicio,vigencia_fim:fim,publicado_em:now,publicado_por_id:currentUserId(),status:'EM_ANDAMENTO',etapa_atual:'PUBLICADO',atualizado_por_id:currentUserId(),updated_at:now};
  const {data,error}=await c.from('legalizacao_processos').update(registro).eq('id',p.id).select('*').single();if(error)throw error;await historicoProcesso(p.id,'PUBLICACAO_REGISTRADA','Publicação no Diário Oficial registrada no SIGEE.',{numero_ato:numero,data_publicacao:dataPublicacao,referencia_doe:referencia});return data;
}
async function concluirCredenciamento(processoId){
  const c=client(),p=await processoCredenciamento(processoId);if(upper(p.etapa_atual)!=='PUBLICADO'||!p.data_publicacao||!p.numero_ato)throw new Error('Registre a publicação antes de concluir o credenciamento.');
  const now=new Date().toISOString();const {data,error}=await c.from('legalizacao_processos').update({status:'CONCLUIDO',etapa_atual:'CREDENCIAMENTO_CONCLUIDO',credenciamento_concluido_em:now,credenciamento_concluido_por_id:currentUserId(),atualizado_por_id:currentUserId(),updated_at:now}).eq('id',p.id).select('*').single();if(error)throw error;
  const {error:ei}=await c.from('legalizacao_instituicoes').update({situacao_regulatoria:'CREDENCIADA',atualizado_por_id:currentUserId(),updated_at:now}).eq('id',p.instituicao_id);if(ei)throw ei;await historicoProcesso(p.id,'CREDENCIAMENTO_CONCLUIDO','Credenciamento concluído após registro da publicação.',{numero_ato:p.numero_ato,data_publicacao:p.data_publicacao});resumoCache=null;return data;
}
async function obterProntuarioPorEscola(escolaId){const inst=await habilitarProntuario(escolaId);return obterProntuario(inst.id);}
async function importarAtosLote(rows=[]){assertAccess();if(!master())throw new Error('A importação de atos é exclusiva do perfil Master.');if(!Array.isArray(rows)||!rows.length)return[];if(rows.length>200)throw new Error('Cada lote pode conter no máximo 200 registros.');const c=client();const {data,error}=await c.from('legalizacao_atos_importacao').insert(rows).select('id,status_match,escola_id');if(error)throw error;return data||[];}
async function listarAtosImportados(status=''){assertAccess();if(!master())throw new Error('A conferência de importações é exclusiva do perfil Master.');const c=client();let q=c.from('legalizacao_atos_importacao').select('id,lote_id,arquivo_origem,linha_origem,nte_numero,municipio,escola_nome,ato,tipo_ato,numero_publicacao,data_publicacao,numero_processo,vigencia_inicio,vigencia_fim,vigencia_origem,status_match,escola_id,created_at').order('id',{ascending:false}).limit(200);if(status)q=q.eq('status_match',upper(status));const {data,error}=await q;if(error)throw error;return data||[];}
async function resumoImportacaoAtos(){assertAccess();if(!master())return null;const c=client(),contar=async status=>{let q=c.from('legalizacao_atos_importacao').select('id',{count:'exact',head:true});if(status)q=q.eq('status_match',status);const {count,error}=await q;if(error)throw error;return Number(count||0);};const [total,identificados,pendentes,ambiguos,confirmados,duplicados]=await Promise.all([contar(),contar('IDENTIFICADO'),contar('PENDENTE_CONFERENCIA'),contar('AMBIGUO'),contar('CONFIRMADO'),contar('DUPLICADO')]);return{total,identificados,pendentes,ambiguos,confirmados,duplicados};}
async function confirmarAtoImportado(importacaoId,escolaId=null){assertAccess();if(!master())throw new Error('A confirmação de atos é exclusiva do perfil Master.');const c=client();const {data:r,error:er}=await c.from('legalizacao_atos_importacao').select('*').eq('id',importacaoId).single();if(er)throw er;if(upper(r.status_match)==='CONFIRMADO')throw new Error('Este ato já foi confirmado.');const eid=Number(escolaId||r.escola_id);if(!eid)throw new Error('Vincule uma escola antes de confirmar o ato.');const inst=await habilitarProntuario(eid);const registro={instituicao_id:inst.id,escola_id:eid,importacao_id:r.id,ato:r.ato,tipo_ato:r.tipo_ato,numero_ato:r.numero_publicacao,data_publicacao:r.data_publicacao,numero_processo:r.numero_processo,vigencia_inicio:r.vigencia_inicio,vigencia_fim:r.vigencia_fim,vigencia_origem:r.vigencia_origem,detalhe:r.detalhe,fonte:`IMPORTACAO:${r.arquivo_origem}`,situacao_registro:'CONFIRMADO',criado_por_id:currentUserId()};const {data,error}=await c.from('legalizacao_atos_legais').upsert(registro,{onConflict:'importacao_id'}).select('*').single();if(error)throw error;const now=new Date().toISOString();const {error:eu}=await c.from('legalizacao_atos_importacao').update({escola_id:eid,status_match:'CONFIRMADO',confirmado_em:now,confirmado_por_id:currentUserId()}).eq('id',r.id);if(eu)throw eu;if(r.endereco_extraido&&!inst.endereco_importado){await c.from('legalizacao_instituicoes').update({endereco_importado:r.endereco_extraido,endereco_importado_fonte:r.arquivo_origem,dados_importados_status:'A_CONFERIR',updated_at:now}).eq('id',inst.id);}return data;}
async function listarAtosInstituicao(instituicaoId){assertAccess();const inst=await oneScoped('legalizacao_instituicoes',instituicaoId),c=client();const {data,error}=await c.from('legalizacao_atos_legais').select('id,ato,tipo_ato,numero_ato,data_publicacao,numero_processo,vigencia_inicio,vigencia_fim,vigencia_origem,fonte,situacao_registro,created_at').eq('instituicao_id',inst.id).order('data_publicacao',{ascending:false}).limit(300);if(error)throw error;return data||[];}
window.SIGEE_LEGALIZACAO_SERVICE=Object.freeze({listarInstituicoes,consultarInstituicoes,contarInstituicoes,resumo,listarNtes,listarInspecoesGerais,listarHistoricoRegulatorio,listarProcessosRegulatorios,listarOfertasRegulatorias,listarCarimbosRegulatorios,criarInstituicao,confirmarCadastroMigrado,habilitarProntuario,obterProntuario,obterProntuarioPorEscola,iniciarCredenciamento,atualizarChecklist,emitirDiligencia,retomarAnalise,prepararInspecao,agendarInspecao,atualizarItemInspecao,registrarRealizacaoInspecao,concluirInspecao,concluirAnaliseFinal,registrarPublicacao,concluirCredenciamento,importarAtosLote,listarAtosImportados,resumoImportacaoAtos,confirmarAtoImportado,listarAtosInstituicao,ehMaster:master,nteId});
})(window);
