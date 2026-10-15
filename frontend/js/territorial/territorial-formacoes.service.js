/** SIGEE Enterprise — GT-04.1 Cobertura das Formações e Dossiê Territorial. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_FORMACOES_SERVICE?.versao==='GT-04.1') return;
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
// Paginação para não truncar o histórico territorial no limite padrão do Supabase.
async function todas(queryFactory){
  const itens=[];const pagina=500;
  for(let inicio=0;inicio<100000;inicio+=pagina){
    const {data,error}=await queryFactory().range(inicio,inicio+pagina-1);
    if(error)throw error;
    const lote=data||[];itens.push(...lote);
    if(lote.length<pagina)return itens;
  }
  throw new Error('Limite de segurança na leitura do histórico territorial.');
}
async function agenda(){const c=exigir();return todas(()=>c.from('gt_agenda').select('*').order('inicio',{ascending:true}).order('id',{ascending:true}));}
async function monitoramento(){const c=exigir();return todas(()=>c.from('gt_monitoramento').select('*').order('data_registro',{ascending:false}).order('id',{ascending:false}));}
async function carregar(){const [a,m]=await Promise.all([agenda(),monitoramento()]);return{agenda:a,monitoramento:m};}
async function carregarDossie(nte){
  const c=exigir(), n=Number(nte);
  const [agendaNte,monitor,notificacoes]=await Promise.all([
    todas(()=>c.from('gt_agenda').select('*').contains('ntes',[n]).order('inicio',{ascending:false}).order('id',{ascending:false})),
    todas(()=>c.from('gt_monitoramento').select('*').eq('nte_numero',n).order('data_registro',{ascending:false}).order('id',{ascending:false})),
    todas(()=>c.from('gt_monitoramento_notificacoes').select('*').eq('nte_numero',n).order('data_notificacao',{ascending:false}).order('id',{ascending:false}))
  ]);
  const ids=monitor.map(x=>x.id), acoes=[];
  if(ids.length){
    const rows=[];
    for(let i=0;i<ids.length;i+=100){
      rows.push(...await todas(()=>c.from('gt_monitoramento_acoes').select('*').in('monitoramento_id',ids.slice(i,i+100)).order('data_acao',{ascending:true}).order('id',{ascending:true})));
    }
    if(rows.length){
      const tecnicos=[];
      for(let i=0;i<rows.length;i+=100){
        tecnicos.push(...await todas(()=>c.from('gt_monitoramento_acao_tecnicos').select('*').in('acao_id',rows.slice(i,i+100).map(x=>x.id)).order('id',{ascending:true})));
      }
      const mapa=new Map();tecnicos.forEach(t=>{if(!mapa.has(t.acao_id))mapa.set(t.acao_id,[]);mapa.get(t.acao_id).push(t);});
      rows.forEach(x=>acoes.push({...x,tecnicos:mapa.get(x.id)||[]}));
    }
  }
  return {agenda:agendaNte,monitoramento:monitor,acoes,notificacoes};
}
window.SIGEE_TERRITORIAL_FORMACOES_SERVICE=Object.freeze({agenda,monitoramento,carregar,carregarDossie,master,versao:'GT-04.1'});
})(window);
