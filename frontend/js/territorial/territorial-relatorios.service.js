/** SIGEE Enterprise — GT-05 Relatórios Territoriais. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_RELATORIOS_SERVICE) return;
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
async function carregarNte(nte){
  const c=exigir(), n=Number(nte); if(!n) throw new Error('Selecione um NTE.');
  const [agenda,monitor,notifs]=await Promise.all([
    c.from('gt_agenda').select('*').contains('ntes',[n]).order('inicio',{ascending:true}),
    c.from('gt_monitoramento').select('*').eq('nte_numero',n).order('data_registro',{ascending:true}),
    c.from('gt_monitoramento_notificacoes').select('*').eq('nte_numero',n).order('data_notificacao',{ascending:true})
  ]);
  if(agenda.error)throw agenda.error;if(monitor.error)throw monitor.error;if(notifs.error)throw notifs.error;
  const ocorrencias=monitor.data||[], ids=ocorrencias.map(x=>x.id), acoes=[];
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
  return {agenda:agenda.data||[],ocorrencias,acoes,notificacoes:notifs.data||[]};
}
async function salvarNotificacao(payload){
  const svc=window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE;
  if(!svc?.salvarNotificacao) throw new Error('Serviço de notificações indisponível.');
  return svc.salvarNotificacao(payload);
}
window.SIGEE_TERRITORIAL_RELATORIOS_SERVICE=Object.freeze({carregarNte,salvarNotificacao,master,versao:'GT-05.0'});
})(window);
