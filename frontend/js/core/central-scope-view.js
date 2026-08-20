/**
 * SIGEE RC11.2.1 — Coerência visual do Access Scope na Central.
 * Mantém cabeçalho e filtro alinhados à autoridade SIGEE_ESCOPO.
 */
(function(window){'use strict';
if(window.__SIGEE_CENTRAL_SCOPE_VIEW_1121__)return;window.__SIGEE_CENTRAL_SCOPE_VIEW_1121__=true;
let applying=false,timer=0;
function user(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function profile(u){return window.SIGEE_SESSION?.normalizarPerfil?.(u?.perfil)||String(u?.perfil||'').trim();}
function apply(){
  if(applying)return; applying=true;
  try{
    const u=user(); if(!u)return;
    const c=window.SIGEE_ESCOPO?.contexto?.(u); if(!c)return;
    const nome=document.getElementById('user-nome');
    const perfilEl=document.getElementById('user-perfil');
    if(nome && u.nome && nome.textContent!==u.nome) nome.textContent=u.nome;
    let contexto='';
    if(c.tipo==='GLOBAL') contexto='GLOBAL';
    else if(c.tipo==='SEC') contexto='SEC · TODOS OS NTEs';
    else if(c.tipo==='NTE') contexto=c.nte||'NTE';
    else if(c.tipo==='ESCOLA') contexto=`ESCOLA · ${c.nte||'NTE vinculado'}`;
    const texto=`${profile(u)}${contexto?' | '+contexto:''}`;
    if(perfilEl && perfilEl.textContent!==texto){perfilEl.textContent=texto;perfilEl.title=c.tipo==='ESCOLA'?`Acesso restrito à escola vinculada (ID ${c.escolaId||'-'}).`:texto;}
    try{window.SIGEE_Processos?.configurarFiltroNte?.();}catch(_){ }
  }finally{applying=false;}
}
function schedule(delay=40){clearTimeout(timer);timer=setTimeout(apply,delay);}
document.addEventListener('sigee:usuario-logado',()=>schedule(0));
window.addEventListener('sigee:session-ready',()=>schedule(0));
document.addEventListener('sigee:navegacao-concluida',ev=>{const rota=ev?.detail?.rota||ev?.detail?.aba||'';if(rota==='processos')schedule(0);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
const perfilEl=document.getElementById('user-perfil');
if(perfilEl && window.MutationObserver){new MutationObserver(()=>schedule(0)).observe(perfilEl,{childList:true,characterData:true,subtree:true});}
})(window);
