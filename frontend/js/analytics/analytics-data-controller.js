/* SIGEE RC5.5.0 — Controle unificado de comunicação analítica com Supabase. */
(function(window){
  'use strict';
  if(window.__SIGEE_ANALYTICS_DATA_CONTROLLER_RC550__) return;
  window.__SIGEE_ANALYTICS_DATA_CONTROLLER_RC550__=true;

  const TTL=180000, PAGE=1000;
  const CAMPOS='id,aluno_nome,escola_nome,escola_id,cod_mec,documento_tipo,nivel_oferta,modalidade,etapa_atual,etapa_codigo,dias_decorridos,nte,tecnico_responsavel,prioridade,data_etapa,data_etapa_atual,prazo_etapa,prazo_inicio,prazo_fim,status,ativo,codigo_sigee,created_at,updated_at,workflow_instance_id,processo_migrado,origem_registro,migracao_lote_id,data_migracao,finalizado_em,deferido_em,retirado_em';
  let dados=[], carregadoEm=0, promessa=null, erroAtual=null;
  const rpcCache=new Map(), rpcInflight=new Map();
  const txt=v=>v==null?'':String(v).trim();
  const cliente=()=>{try{return window.obterSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||null}catch(_){return null}};
  const usuario=()=>window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;
  const ehGlobal=()=>window.SIGEE_ESCOPO?.ehGlobal?.(usuario())===true;
  const nteUsuario=()=>txt(usuario()?.nte||usuario()?.nte_nome||usuario()?.grupo).match(/\d{1,2}/)?.[0]||'';

  async function pagina(c,inicio,fim){
    let q=c.from('processos').select(CAMPOS).eq('ativo',true).eq('status','ATIVO').order('id',{ascending:true}).range(inicio,fim);
    const n=nteUsuario();
    if(!ehGlobal()&&n) q=q.in('nte',[n,`NTE ${Number(n)}`,`NTE-${String(Number(n)).padStart(2,'0')}`,`NTE ${String(Number(n)).padStart(2,'0')}`]);
    return q;
  }
  async function carregar(forcar=false){
    if(!forcar&&dados.length&&Date.now()-carregadoEm<TTL) return dados;
    if(promessa) return promessa;
    promessa=(async()=>{
      const c=cliente(); if(!c) throw new Error('Supabase indisponível para leitura analítica.');
      const todos=[]; let inicio=0;
      while(true){
        const {data,error}=await pagina(c,inicio,inicio+PAGE-1);
        if(error) throw error;
        const lote=Array.isArray(data)?data:[]; todos.push(...lote);
        if(lote.length<PAGE) break;
        inicio+=PAGE;
      }
      dados=todos; carregadoEm=Date.now(); erroAtual=null;
      window.__SIGEE_ANALYTICS_PROCESSOS__=dados;
      window.dispatchEvent(new CustomEvent('sigee:analytics-base-carregada',{detail:{total:dados.length,carregadoEm}}));
      window.dispatchEvent(new CustomEvent('sigee:processos-atualizados',{detail:{origem:'analytics-controller',total:dados.length}}));
      return dados;
    })().catch(e=>{erroAtual=e;console.error('[SIGEE Analytics Data]',e);throw e}).finally(()=>{promessa=null});
    return promessa;
  }
  function atual(){return dados.slice()}
  function invalidar(){carregadoEm=0;rpcCache.clear()}
  async function rpcDashboard(params={},forcar=false){
    const chave=JSON.stringify(params);
    const salvo=rpcCache.get(chave);
    if(!forcar&&salvo&&Date.now()-salvo.em<TTL)return salvo.valor;
    if(rpcInflight.has(chave))return rpcInflight.get(chave);
    const p=(async()=>{
      const c=cliente();if(!c)throw new Error('Supabase indisponível.');
      const [a,b]=await Promise.all([
        c.rpc('sigee_dashboard_resumo',params),
        c.rpc('sigee_dashboard_complemento',params)
      ]);
      if(a.error)throw a.error;
      if(b.error)console.warn('[SIGEE Analytics Data] Complemento RPC indisponível:',b.error);
      const valor={resumo:typeof a.data==='string'?JSON.parse(a.data):a.data||{},complemento:typeof b.data==='string'?JSON.parse(b.data):b.data||{}};
      rpcCache.set(chave,{em:Date.now(),valor});return valor;
    })().finally(()=>rpcInflight.delete(chave));
    rpcInflight.set(chave,p);return p;
  }
  window.SIGEE_ANALYTICS_DATA=Object.freeze({carregar,atual,invalidar,rpcDashboard,estado:()=>({total:dados.length,carregadoEm,carregando:!!promessa,erro:erroAtual?.message||null}),versao:'RC5.5.0'});
  document.addEventListener('sigee:usuario-logado',()=>carregar(true).catch(()=>{}));
  window.addEventListener('sigee:processo-salvo',()=>{invalidar();carregar(true).catch(()=>{})});
})(window);
