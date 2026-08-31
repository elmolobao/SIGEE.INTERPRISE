/** SIGEE Enterprise — GT-05.2.4 Monitoramento Territorial — critérios técnicos + Pesquisa de Satisfação. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE?.versao==='GT-05.2.4') return;
const TABELA='gt_monitoramento', ACOES='gt_monitoramento_acoes', TECNICOS='gt_monitoramento_acao_tecnicos', NOTIFS='gt_monitoramento_notificacoes';
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function numeroNte(v){return window.SIGEE_TERRITORIAL_DATA?.numeroNte?.(v)||null;}
function autor(){const u=usuario()||{};return{criado_por_id:u.id||null,criado_por_nome:u.nome||u.name||'',criado_por_email:String(u.email||'').toLowerCase()||null};}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
function erroBanco(error){const msg=String(error?.message||error||'Erro desconhecido');if(/gt_monitoramento|relation .* does not exist|schema cache/i.test(msg)){throw new Error('Estrutura do Monitoramento Territorial incompleta. Execute os SQLs GT-03 e GT-03.1 no Supabase.');}throw error;}
function txt(v){return String(v??'').trim();}
async function faseDoNte(nte){
  const c=exigir(); const n=numeroNte(nte); if(!n)return 'PRE_FORMACAO';
  const {data,error}=await c.from('gt_agenda').select('id,fim,situacao,ntes').eq('tipo','FORMACAO_TERRITORIAL').eq('situacao','REALIZADO').contains('ntes',[n]).order('fim',{ascending:false}).limit(1);
  if(error){console.warn('[GT-03.1] Não foi possível consultar formação realizada:',error);return 'PRE_FORMACAO';}
  return data?.length?'POS_FORMACAO':'PRE_FORMACAO';
}
async function listar(){const c=exigir();const {data,error}=await c.from(TABELA).select('*').order('data_registro',{ascending:false});if(error)erroBanco(error);return data||[];}
async function salvarOcorrencia(payload){
  const c=exigir();const nte=numeroNte(payload.nte_numero);if(!nte)throw new Error('Selecione o NTE relacionado.');
  const fase=await faseDoNte(nte);
  const item=String(payload.item_monitoria||'').toUpperCase();
  const avaliacao=String(payload.avaliacao||'').toUpperCase();
  const categoriasPorItem={COMUNICACAO_EMAIL:'COMUNICACAO',REGISTRO_SISTEMA:'CADASTRO',CUMPRIMENTO_PRAZOS:'PRAZO',EXECUCAO_PROCEDIMENTO:'PROCEDIMENTO',PESQUISA_SATISFACAO:'PESQUISA'};
  if(!['COMUNICACAO_EMAIL','REGISTRO_SISTEMA','CUMPRIMENTO_PRAZOS','EXECUCAO_PROCEDIMENTO','PESQUISA_SATISFACAO'].includes(item))throw new Error('Selecione o item de monitoria.');
  if(!['POSITIVA','NEGATIVA'].includes(avaliacao))throw new Error('Selecione se a constatação é positiva ou negativa.');
  const relevancia=String(payload.relevancia||'').toUpperCase();
  if(!['INFORMATIVA','BAIXA','MODERADA','ALTA','CRITICA'].includes(relevancia))throw new Error('Selecione a relevância da constatação.');
  const registro={nte_numero:nte,fase,natureza:'OCORRENCIA',item_monitoria:item,avaliacao,data_registro:payload.data_registro||new Date().toISOString(),titulo:txt(payload.titulo),descricao:txt(payload.descricao),categoria:categoriasPorItem[item]||'OUTRA',relevancia,processo_id:payload.processo_id?Number(payload.processo_id):null,codigo_sigee:txt(payload.codigo_sigee)||null,aluno_nome:txt(payload.aluno_nome)||null,conteudo_formacao:fase==='POS_FORMACAO'?String(payload.conteudo_formacao||'NAO').toUpperCase():'NAO_SE_APLICA',resultado:String(payload.resultado||'EM_ACOMPANHAMENTO').toUpperCase(),prazo:payload.prazo||null,concluido_at:payload.concluido_at||null,evidencia_referencia:txt(payload.evidencia_referencia)||null,observacoes:txt(payload.observacoes)||null,updated_at:new Date().toISOString()};
  if(!registro.titulo)throw new Error('Informe o título da ocorrência.');if(!registro.descricao)throw new Error('Descreva a ocorrência identificada.');
  let r;if(payload.id)r=await c.from(TABELA).update(registro).eq('id',payload.id).select('*').single();else{Object.assign(registro,autor());r=await c.from(TABELA).insert(registro).select('*').single();}
  if(r.error)erroBanco(r.error);
  if(avaliacao==='NEGATIVA' && window.SIGEE_TERRITORIAL_PLANO_ACAO_SERVICE?.criarDaOcorrencia){
    try{await window.SIGEE_TERRITORIAL_PLANO_ACAO_SERVICE.criarDaOcorrencia(r.data);}catch(e){console.error('[Plano de Ação] ocorrência salva, mas a tarefa corretiva não foi criada:',e);}
  }
  document.dispatchEvent(new CustomEvent('sigee:gt-monitoramento-atualizado'));return r.data;
}
async function excluir(id){const c=exigir();const {error}=await c.from(TABELA).delete().eq('id',id);if(error)erroBanco(error);document.dispatchEvent(new CustomEvent('sigee:gt-monitoramento-atualizado'));return true;}
async function listarAcoes(ids=[]){const c=exigir();if(!ids.length)return[];const {data,error}=await c.from(ACOES).select('*').in('monitoramento_id',ids).order('data_acao',{ascending:true});if(error)erroBanco(error);const a=data||[];if(!a.length)return a;const {data:t,error:et}=await c.from(TECNICOS).select('*').in('acao_id',a.map(x=>x.id));if(et)erroBanco(et);const mapa=new Map();(t||[]).forEach(x=>{if(!mapa.has(x.acao_id))mapa.set(x.acao_id,[]);mapa.get(x.acao_id).push(x);});return a.map(x=>({...x,tecnicos:mapa.get(x.id)||[]}));}
async function salvarAcao(payload){
  const c=exigir();const registro={monitoramento_id:Number(payload.monitoramento_id),tipo:String(payload.tipo||'').toUpperCase(),modalidade:String(payload.modalidade||'').toUpperCase(),data_acao:new Date().toISOString(),observacoes:txt(payload.observacoes)||null,updated_at:new Date().toISOString(),...autor()};
  if(!registro.monitoramento_id||!registro.tipo||!registro.modalidade)throw new Error('Informe o tipo e a modalidade da ação.');
  const {data,error}=await c.from(ACOES).insert(registro).select('*').single();if(error)erroBanco(error);
  const tecnicos=(payload.tecnicos||[]).map(u=>({acao_id:data.id,usuario_id:u.id||null,usuario_nome:txt(u.nome)||'Técnico',usuario_email:txt(u.email)||null,usuario_perfil:txt(u.perfil)||null}));
  if(tecnicos.length){const {error:et}=await c.from(TECNICOS).insert(tecnicos);if(et)erroBanco(et);}
  document.dispatchEvent(new CustomEvent('sigee:gt-monitoramento-atualizado'));return data;
}
async function listarTecnicos(){const c=exigir();const {data,error}=await c.from('usuarios_sigee').select('id,nome,email,perfil,nte,ativo').eq('ativo',true).order('nome');if(error){console.warn(error);return Array.isArray(window.usuariosDB)?window.usuariosDB.filter(x=>x.ativo!==false):[];}return data||[];}
function processoNte(p){return numeroNte(p?.nte??p?.nte_nome??p?.nte_id);}
async function buscarProcessos(nte,termo){
  const n=numeroNte(nte),q=txt(termo);if(!n||q.length<2)return[];
  const locais=(Array.isArray(window.processosDB)?window.processosDB:[]).filter(p=>processoNte(p)===n&&(txt(p.codigo_sigee).toLowerCase().includes(q.toLowerCase())||txt(p.aluno_nome).toLowerCase().includes(q.toLowerCase()))).slice(0,12).map(p=>({id:p.id,codigo_sigee:p.codigo_sigee,aluno_nome:p.aluno_nome}));
  if(locais.length)return locais;
  const c=exigir();const safe=q.replace(/[%_,]/g,'');const {data,error}=await c.from('processos').select('id,codigo_sigee,aluno_nome,nte').or(`codigo_sigee.ilike.%${safe}%,aluno_nome.ilike.%${safe}%`).limit(40);if(error){console.warn(error);return[];}return(data||[]).filter(p=>processoNte(p)===n).slice(0,12).map(p=>({id:p.id,codigo_sigee:p.codigo_sigee,aluno_nome:p.aluno_nome}));
}

async function listarAgendaAtuacoes(){
  const c=exigir();
  const {data,error}=await c.from('gt_agenda').select('id,tipo,titulo,motivo,objetivo,inicio,fim,situacao,ntes').in('tipo',['REUNIAO','VISITA_TECNICA']).eq('situacao','REALIZADO').order('inicio',{ascending:false});
  if(error){console.warn('[GT-04] Falha ao carregar reuniões/visitas:',error);return[];}
  return data||[];
}

async function listarNotificacoes(nte){const c=exigir();let q=c.from(NOTIFS).select('*').order('data_notificacao',{ascending:false});if(nte)q=q.eq('nte_numero',Number(nte));const {data,error}=await q;if(error)erroBanco(error);return data||[];}
async function salvarNotificacao(payload){const c=exigir();const n=numeroNte(payload.nte_numero);if(!n)throw new Error('NTE inválido.');const reg={nte_numero:n,monitoramento_id:payload.monitoramento_id?Number(payload.monitoramento_id):null,data_notificacao:new Date().toISOString(),tipo:'INSTITUCIONAL',numero_documento:txt(payload.numero_documento)||null,referencia_sei:txt(payload.referencia_sei)||null,destinatario:txt(payload.destinatario)||null,assunto:txt(payload.assunto),resumo:txt(payload.resumo)||null,observacoes:txt(payload.observacoes)||null,updated_at:new Date().toISOString(),...autor()};if(!reg.assunto)throw new Error('Informe o assunto da notificação.');const {data,error}=await c.from(NOTIFS).insert(reg).select('*').single();if(error)erroBanco(error);document.dispatchEvent(new CustomEvent('sigee:gt-monitoramento-atualizado'));return data;}
window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE=Object.freeze({listar,salvarOcorrencia,excluir,faseDoNte,listarAcoes,salvarAcao,listarTecnicos,buscarProcessos,listarAgendaAtuacoes,listarNotificacoes,salvarNotificacao,master,versao:'GT-05.2.4'});
})(window);
