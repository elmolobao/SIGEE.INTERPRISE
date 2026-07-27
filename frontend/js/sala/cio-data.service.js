(function(global){
  'use strict';

  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};

  function client(){
    try{
      return global.obterSupabaseSIGEE?.() ||
             global.criarClienteSupabaseSIGEE?.() ||
             global.SIGEE_SUPABASE?.criarCliente?.() || null;
    }catch(_){ return null; }
  }

  function nteProc(p){
    return NS.context.nteCanonico(
      p?.nte || p?.nte_nome || p?.grupo || (p?.nte_id ? `NTE-${p.nte_id}` : '')
    );
  }

  function aplicarEscopo(lista,ctx){
    const dados=Array.isArray(lista)?lista:[];
    if(global.SIGEE_ESCOPO?.filtrar) return global.SIGEE_ESCOPO.filtrar(dados,ctx?.usuario);
    if(ctx.escopo==='ESTADUAL') return dados.slice();
    return dados.filter(item=>nteProc(item)===ctx.nte);
  }

  async function buscarTodasPaginas(nome,{pageSize=1000,maxPages=200,usuario=null}={}){
    const c=client();
    if(!c) return [];

    const resultado=[];
    for(let pagina=0; pagina<maxPages; pagina++){
      const inicio=pagina*pageSize;
      const fim=inicio+pageSize-1;
      let q=c.from(nome).select('*');
      if(nome==='processos'&&global.SIGEE_ESCOPO?.aplicarQueryProcessos)q=global.SIGEE_ESCOPO.aplicarQueryProcessos(q,usuario);
      const {data,error}=await q.range(inicio,fim);
      if(error) throw error;
      const lote=Array.isArray(data)?data:[];
      resultado.push(...lote);
      if(lote.length<pageSize) break;
    }
    return resultado;
  }

  async function tabelaCompleta(nome,local,{pageSize=1000,usuario=null}={}){
    try{
      const remotos=await buscarTodasPaginas(nome,{pageSize,usuario});
      if(remotos.length) return remotos;

      // Fallback somente quando o Supabase estiver indisponível. A coleção local
      // pode representar apenas a página atual da interface e nunca deve ser a
      // fonte principal dos indicadores do CIO.
      return Array.isArray(global[local]) ? global[local].slice() : [];
    }catch(e){
      console.warn(`[SIGEE CIO] ${nome} indisponível; usando fallback local:`,e);
      return Array.isArray(global[local]) ? global[local].slice() : [];
    }
  }

  async function carregar(ctx,{force=false}={}){
    if(!ctx?.permitido) throw new Error('Acesso ao CIO não autorizado.');

    const key=`dados:v740:${ctx.escopo}:${ctx.nte||'TODOS'}`;
    if(!force){
      const cached=NS.cache?.get(key);
      if(cached) return cached;
    }

    const [processos,usuarios]=await Promise.all([
      tabelaCompleta('processos','processosDB',{pageSize:1000,usuario:ctx.usuario}),
      tabelaCompleta('usuarios_sigee','usuariosDB',{pageSize:1000})
    ]);

    const processosEscopo=aplicarEscopo(processos,ctx);
    const usuariosEscopo=global.SIGEE_ESCOPO?.filtrar
      ? global.SIGEE_ESCOPO.filtrar(usuarios,ctx.usuario)
      : (ctx.escopo==='ESTADUAL' ? usuarios : usuarios.filter(u=>NS.context.nteCanonico(u?.nte || u?.grupo || (u?.nte_id ? `NTE-${u.nte_id}` : ''))===ctx.nte));

    const dados={
      contexto:ctx,
      processos:processosEscopo,
      usuarios:usuariosEscopo,
      diagnostico:{
        totalProcessosCarregados:processos.length,
        totalProcessosNoEscopo:processosEscopo.length,
        fonteProcessos:processos.length ? 'SUPABASE_PAGINADO' : 'FALLBACK_LOCAL'
      },
      carregadoEm:new Date().toISOString()
    };

    console.info('[SIGEE CIO] Base analítica carregada:',dados.diagnostico);
    return NS.cache?.set(key,dados,120000)||dados;
  }

  NS.dataService=Object.freeze({
    carregar,
    aplicarEscopo,
    buscarTodasPaginas,
    invalidar:()=>NS.cache?.clear('dados:')
  });
})(window);
