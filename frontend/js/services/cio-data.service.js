(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{}; const txt=v=>v==null?'':String(v).trim();
  function client(){try{return global.obterSupabaseSIGEE?.()||global.criarClienteSupabaseSIGEE?.()||global.SIGEE_SUPABASE?.criarCliente?.()||null}catch(_){return null}}
  function nteProc(p){return NS.context.nteCanonico(p?.nte||p?.nte_nome||p?.grupo||(p?.nte_id?`NTE-${p.nte_id}`:''));}
  function aplicarEscopo(lista,ctx){const a=Array.isArray(lista)?lista:[];if(ctx.escopo==='ESTADUAL')return a.slice();return a.filter(p=>nteProc(p)===ctx.nte);}
  async function tabela(nome,local,limite=10000){
    if(Array.isArray(global[local])&&global[local].length)return global[local].slice();
    const c=client(); if(!c)return [];
    try{const {data,error}=await c.from(nome).select('*').limit(limite);if(error)throw error;return data||[];}catch(e){console.warn(`[SIGEE CIO] ${nome} indisponível:`,e);return [];}
  }
  async function carregar(ctx,{force=false}={}){
    if(!ctx?.permitido)throw new Error('Acesso ao CIO não autorizado.');
    const key=`dados:${ctx.escopo}:${ctx.nte||'TODOS'}`; if(!force){const cached=NS.cache?.get(key);if(cached)return cached;}
    const [processos,usuarios]=await Promise.all([tabela('processos','processosDB'),tabela('usuarios_sigee','usuariosDB',1000)]);
    const dados={contexto:ctx,processos:aplicarEscopo(processos,ctx),usuarios:ctx.escopo==='ESTADUAL'?usuarios:usuarios.filter(u=>NS.context.nteCanonico(u?.nte||u?.grupo||(u?.nte_id?`NTE-${u.nte_id}`:''))===ctx.nte),carregadoEm:new Date().toISOString()};
    return NS.cache?.set(key,dados,120000)||dados;
  }
  NS.dataService=Object.freeze({carregar,aplicarEscopo,invalidar:()=>NS.cache?.clear('dados:')});
})(window);