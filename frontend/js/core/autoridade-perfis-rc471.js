/** SIGEE RC4.7.1 — Autoridade final de menus, navegação e escopo territorial. */
(function(window,document){'use strict';
if(window.__SIGEE_AUTORIDADE_PERFIS_RC471__)return;window.__SIGEE_AUTORIDADE_PERFIS_RC471__=true;
const ids={processos:'menu-central-processos',usuarios:'menu-usuarios',relatorios:'menu-relatorios',sala:'menu-sala-situacao',config:'menu-logs',nova:'btn-nova-solicitacao'};
function user(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||window.currentUser||null;}
function can(a){return window.SIGEE_PERMISSOES?.pode?.(a,user())===true;}
function vis(id,ok){const e=document.getElementById(id);if(!e)return;e.classList.toggle('hidden',!ok);e.style.setProperty('display',ok?'':'none','important');e.setAttribute('aria-hidden',ok?'false':'true');if('disabled'in e)e.disabled=!ok;}
function aplicar(){const u=user();if(!u)return false;
 vis(ids.processos,can('processos.visualizar'));
 vis(ids.usuarios,can('usuarios.gerenciar_global')||can('usuarios.gerenciar_nte'));
 vis(ids.relatorios,can('relatorios.visualizar'));
 vis(ids.sala,can('indicadores.visualizar'));
 vis(ids.config,can('logs.visualizar'));
 vis(ids.nova,can('processos.criar'));
 document.querySelectorAll('[data-acao="nova-solicitacao"],.btn-nova-solicitacao').forEach(e=>{const ok=can('processos.criar');e.classList.toggle('hidden',!ok);e.style.setProperty('display',ok?'':'none','important');});
 document.body.dataset.sigeePerfil=window.SIGEE_PERFIS?.normalizar?.(u.perfil)||'';
 document.body.dataset.sigeeEscopo=window.SIGEE_ESCOPO?.ehGlobal?.(u)?'GLOBAL':'NTE';
 return true;
}
const navOriginal=window.navegar;
window.navegar=function(aba){
 const regras={processos:'processos.visualizar',usuarios:'usuarios.gerenciar_nte',logs:'logs.visualizar','sala-situacao':'indicadores.visualizar',painel:'relatorios.visualizar'};
 const cap=regras[aba];
 if(cap){let ok=can(cap);if(aba==='usuarios')ok=can('usuarios.gerenciar_global')||can('usuarios.gerenciar_nte');if(!ok){alert('Seu perfil não possui permissão para acessar esta área.');return false;}}
 const r=typeof navOriginal==='function'?navOriginal.apply(this,arguments):undefined;setTimeout(aplicar,0);return r;
};
let agendado=false;const obs=new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;aplicar();});});
function iniciar(){aplicar();const menu=document.querySelector('aside,nav,#sidebar,#menu-lateral');if(menu)obs.observe(menu,{subtree:true,attributes:true,attributeFilter:['class','style','aria-hidden']});}
document.addEventListener('DOMContentLoaded',iniciar,{once:true});document.addEventListener('sigee:usuario-logado',()=>setTimeout(iniciar,0));document.addEventListener('sigee:navegacao-concluida',()=>setTimeout(aplicar,0));window.addEventListener('load',()=>setTimeout(iniciar,100));
window.SIGEE_AUTORIDADE_PERFIS_RC471=Object.freeze({aplicar});
})(window,document);
