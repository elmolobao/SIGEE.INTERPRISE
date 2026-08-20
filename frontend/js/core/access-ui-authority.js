/**
 * SIGEE RC11.2.2 — Autoridade final de identidade e controles por Access Scope.
 * Impede módulos legados de reclassificarem Secretaria como SEC e mantém
 * cabeçalho/Nova Solicitação coerentes com SIGEE_SESSION + SIGEE_ESCOPO.
 */
(function(window,document){
'use strict';
if(window.__SIGEE_ACCESS_UI_AUTHORITY_1122__)return;
window.__SIGEE_ACCESS_UI_AUTHORITY_1122__=true;
let aplicando=false,agendado=false;
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||window.currentUser||null;}
function perfil(u){return window.SIGEE_PERFIS?.normalizar?.(u?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(u?.perfil)||String(u?.perfil||'').trim();}
function contexto(u){return window.SIGEE_ESCOPO?.contexto?.(u)||null;}
function podeCriar(u){return window.SIGEE_PERMISSOES?.pode?.('processos.criar',u)===true;}
function textoContexto(c){
 if(!c)return '';
 if(c.tipo==='GLOBAL')return 'GLOBAL';
 if(c.tipo==='SEC')return 'SEC · TODOS OS NTEs';
 if(c.tipo==='ESCOLA')return `ESCOLA · ${c.nte||('NTE-'+String(c.nteId||'').padStart(2,'0'))}`;
 if(c.tipo==='NTE')return c.nte||(`NTE-${String(c.nteId||'').padStart(2,'0')}`);
 return c.tipo||'';
}
function aplicar(){
 if(aplicando)return false; aplicando=true;
 try{
   const u=usuario(); if(!u)return false;
   const p=perfil(u); const c=contexto(u);
   // Restaura a nomenclatura canônica após qualquer patch legado.
   if(p && u.perfil!==p)u.perfil=p;
   if(window.usuarioLogado && window.usuarioLogado!==u && p)window.usuarioLogado.perfil=p;
   const nome=document.getElementById('user-nome'); if(nome && u.nome)nome.textContent=u.nome;
   const perfilEl=document.getElementById('user-perfil');
   const tctx=textoContexto(c); const texto=`${p}${tctx?' | '+tctx:''}`;
   if(perfilEl && perfilEl.textContent!==texto)perfilEl.textContent=texto;
   if(document.body){document.body.dataset.sigeePerfil=p;document.body.dataset.sigeeEscopo=c?.tipo||'';}
   const okNova=podeCriar(u);
   document.querySelectorAll('#btn-nova-solicitacao,[data-acao="nova-solicitacao"],.btn-nova-solicitacao').forEach(el=>{
      el.classList.toggle('hidden',!okNova); el.hidden=!okNova;
      el.style.setProperty('display',okNova?'flex':'none','important');
      el.style.setProperty('visibility',okNova?'visible':'hidden','important');
      el.style.setProperty('opacity',okNova?'1':'0','important');
      el.style.setProperty('pointer-events',okNova?'auto':'none','important');
      if('disabled' in el)el.disabled=!okNova;
      el.setAttribute('aria-hidden',okNova?'false':'true');
   });
   return true;
 }finally{aplicando=false;}
}
function schedule(){if(agendado)return;agendado=true;queueMicrotask(()=>{agendado=false;aplicar();});}
window.SIGEE_RENDERIZAR_IDENTIDADE_EFETIVA=aplicar;
document.addEventListener('sigee:usuario-logado',schedule);
window.addEventListener('sigee:session-ready',schedule);
document.addEventListener('sigee:navegacao-concluida',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const alvo=document.getElementById('user-perfil');
if(alvo&&window.MutationObserver)new MutationObserver(schedule).observe(alvo,{childList:true,characterData:true,subtree:true});
window.SIGEE_ACCESS_UI_AUTHORITY=Object.freeze({aplicar,versao:'RC11.2.2'});
})(window,document);
