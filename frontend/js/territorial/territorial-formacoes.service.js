/** SIGEE Enterprise — GT-04.1 Cobertura das Formações e Dossiê Territorial. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_FORMACOES_SERVICE?.versao==='GT-04.1') return;
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
async function agenda(){const c=exigir();const {data,error}=await c.from('gt_agenda').select('*').order('inicio',{ascending:true});if(error)throw error;return data||[];}
async function monitoramento(){const c=exigir();const {data,error}=await c.from('gt_monitoramento').select('*').order('data_registro',{ascending:false});if(error)throw error;return data||[];}
async function carregar(){const [a,m]=await Promise.all([agenda(),monitoramento()]);return{agenda:a,monitoramento:m};}
async function carregarDossie(nte){
  const c=exigir(), n=Number(nte);
  const [a,m,nf]=await Promise.all([
    c.from('gt_agenda').select('*').contains('ntes',[n]).order('inicio',{ascending:false}),
    c.from('gt_monitoramento').select('*').eq('nte_numero',n).order('data_registro',{ascending:false}),
    c.from('gt_monitoramento_notificacoes').select('*').eq('nte_numero',n).order('data_notificacao',{ascending:false})
  ]);
  if(a.error)throw a.error;if(m.error)throw m.error;if(nf.error)throw nf.error;
  const monitor=m.data||[], ids=monitor.map(x=>x.id), acoes=[];
  if(ids.length){
    const ra=await c.from('gt_monitoramento_acoes').select('*').in('monitoramento_id',ids).order('data_acao',{ascending:true});
    if(ra.error)throw ra.error;
    const rows=ra.data||[];
    if(rows.length){
      const rt=await c.from('gt_monitoramento_acao_tecnicos').select('*').in('acao_id',rows.map(x=>x.id));
      if(rt.error)throw rt.error;
      const mapa=new Map();(rt.data||[]).forEach(t=>{if(!mapa.has(t.acao_id))mapa.set(t.acao_id,[]);mapa.get(t.acao_id).push(t);});
      rows.forEach(x=>acoes.push({...x,tecnicos:mapa.get(x.id)||[]}));
    }
  }
  return {agenda:a.data||[],monitoramento:monitor,acoes,notificacoes:nf.data||[]};
}
window.SIGEE_TERRITORIAL_FORMACOES_SERVICE=Object.freeze({agenda,monitoramento,carregar,carregarDossie,master,versao:'GT-04.1'});
})(window);
