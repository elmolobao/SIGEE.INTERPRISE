/**
 * SIGEE Enterprise RC5.0.0 — Núcleo Único de Autorização.
 * Única autoridade de sessão, capacidades, escopo, menus e navegação.
 */
(function(window,document){
'use strict';
if(window.__SIGEE_AUTORIZACAO_RC500__) return;
window.__SIGEE_AUTORIZACAO_RC500__=true;

const ROTAS=Object.freeze({
  painel:'indicadores.visualizar',
  processos:'processos.visualizar',
  escolas:'escolas.visualizar',
  usuarios:'usuarios.visualizar_nte',
  logs:'logs.visualizar',
  'sala-situacao':'indicadores.visualizar',
  'centro-inteligencia':'indicadores.visualizar',
  relatorios:'relatorios.visualizar',
  'nova-solicitacao':'processos.criar'
});
const MENUS=Object.freeze({
  'menu-painel':'indicadores.visualizar',
  'menu-central-processos':'processos.visualizar',
  'menu-catalogo-escolas':'escolas.visualizar',
  'menu-escolas':'escolas.visualizar',
  'menu-usuarios':['usuarios.gerenciar_global','usuarios.gerenciar_nte'],
  'menu-logs':'logs.visualizar',
  'menu-relatorios':'relatorios.visualizar',
  'menu-sala-situacao':'indicadores.visualizar',
  'menu-inteligencia':'indicadores.visualizar',
  'btn-nova-solicitacao':'processos.criar',
  'menu-controle-acesso-ntes':'sistema.suspender_nte'
});
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||window.currentUser||null;}
function perfil(u=usuario()){return window.SIGEE_PERFIS?.normalizar?.(u?.perfil)||'';}
function pode(cap,u=usuario()){
  if(Array.isArray(cap)) return cap.some(c=>pode(c,u));
  return window.SIGEE_PERMISSOES?.pode?.(cap,u)===true;
}
function mostrar(el,ok){if(!el)return;el.hidden=!ok;el.classList.toggle('hidden',!ok);el.setAttribute('aria-hidden',ok?'false':'true');el.style.setProperty('display',ok?'':'none','important');if('disabled' in el)el.disabled=!ok;}
function aplicarMenus(){const u=usuario();if(!u)return false;
  Object.entries(MENUS).forEach(([id,cap])=>mostrar(document.getElementById(id),pode(cap,u)));
  document.querySelectorAll('[data-sigee-capacidade]').forEach(el=>mostrar(el,pode(el.dataset.sigeeCapacidade,u)));
  document.querySelectorAll('[data-acao="nova-solicitacao"],.btn-nova-solicitacao').forEach(el=>mostrar(el,pode('processos.criar',u)));
  document.body.dataset.sigeeAutorizacao='pronta';
  document.body.dataset.sigeePerfil=perfil(u);
  document.body.dataset.sigeeEscopo=window.SIGEE_ESCOPO?.ehGlobal?.(u)?'GLOBAL':'NTE';
  return true;
}
function capacidadeRota(aba){return ROTAS[String(aba||'').trim()]||null;}
function autorizarRota(aba,silencioso=false){const cap=capacidadeRota(aba);if(!cap||pode(cap))return true;if(!silencioso)alert('Seu perfil não possui permissão para acessar esta área.');return false;}
function protegerNavegacao(){
  const atual=window.navegar;
  if(typeof atual!=='function'||atual.__sigeeRc500)return false;
  function protegida(aba){if(!autorizarRota(aba))return false;const r=atual.apply(this,arguments);queueMicrotask(aplicarMenus);return r;}
  protegida.__sigeeRc500=true;protegida.__original=atual;window.navegar=protegida;try{globalThis.navegar=protegida}catch(_){ }
  return true;
}
function destino(el){
  if(!el)return '';
  if(el.id==='btn-nova-solicitacao'||el.matches?.('[data-acao="nova-solicitacao"],.btn-nova-solicitacao'))return 'nova-solicitacao';
  const mapa={'menu-painel':'painel','menu-central-processos':'processos','menu-catalogo-escolas':'escolas','menu-escolas':'escolas','menu-usuarios':'usuarios','menu-logs':'logs','menu-relatorios':'relatorios','menu-sala-situacao':'sala-situacao','menu-inteligencia':'centro-inteligencia'};
  return mapa[el.id]||'';
}
document.addEventListener('click',ev=>{const el=ev.target.closest?.('button,a,[data-acao]');const aba=destino(el);if(aba&&!autorizarRota(aba,true)){ev.preventDefault();ev.stopImmediatePropagation();alert('Seu perfil não possui permissão para acessar esta área.');}},true);
let tentativas=0;function sincronizar(){aplicarMenus();protegerNavegacao();if(++tentativas<40)setTimeout(sincronizar,250);}
function iniciar(){tentativas=0;sincronizar();}
document.addEventListener('DOMContentLoaded',iniciar,{once:true});
document.addEventListener('sigee:usuario-logado',iniciar);window.addEventListener('sigee:login-concluido',iniciar);window.addEventListener('load',()=>setTimeout(iniciar,50));
window.SIGEE_AUTORIZACAO=Object.freeze({usuario,perfil,pode,exigir:(c,m)=>pode(c)||((m!==false)&&alert(m||'Ação não autorizada.'),false),capacidadeRota,autorizarRota,aplicarMenus,protegerNavegacao});
})(window,document);
