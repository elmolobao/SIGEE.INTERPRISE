/**
 * SIGEE Enterprise RC5.3.0 — Autorização, menu e navegação centralizados.
 * Única autoridade para menus, rotas e destino pós-login.
 */
(function(window, document){
'use strict';
if (window.__SIGEE_AUTORIZACAO_RC530__) return;
window.__SIGEE_AUTORIZACAO_RC530__ = true;

const ROTAS = Object.freeze({
  painel: 'indicadores.visualizar',
  processos: 'processos.visualizar',
  escolas: 'escolas.visualizar',
  usuarios: ['usuarios.gerenciar_global', 'usuarios.gerenciar_nte'],
  logs: 'logs.visualizar',
  'sala-situacao': 'indicadores.visualizar',
  'centro-inteligencia': 'indicadores.visualizar',
  'nova-solicitacao': 'processos.criar'
});

const MENU = Object.freeze([
  { id:'menu-painel', rota:'painel', icone:'📊', rotulo:'Painel Gerencial', capacidade:'indicadores.visualizar' },
  { id:'menu-central-processos', rota:'processos', icone:'📋', rotulo:'Central de Processos', capacidade:'processos.visualizar' },
  { id:'menu-nova-solicitacao', rota:'nova-solicitacao', icone:'➕', rotulo:'Nova Solicitação', capacidade:'processos.criar' },
  { id:'menu-catalogo-escolas', rota:'escolas', icone:'🏫', rotulo:'Catálogo de Escolas', capacidade:'escolas.visualizar' },
  { id:'menu-usuarios', rota:'usuarios', icone:'👥', rotulo:'Usuários', capacidade:['usuarios.gerenciar_global','usuarios.gerenciar_nte'] },
  { id:'menu-sala-situacao', rota:'sala-situacao', icone:'📡', rotulo:'Sala de Situação', capacidade:'indicadores.visualizar', perfis:['Master','SEC'] },
  { id:'menu-logs', rota:'logs', icone:'⚙️', rotulo:'Configurações', capacidade:'logs.visualizar' }
]);

let instalando = false;
let observer = null;
let navegacaoProtegida = null;
let navegacaoOriginal = null;
let inicializacaoEmCurso = false;

function usuario(){
  return window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || window.usuarioAtual || window.currentUser || null;
}
function perfil(u=usuario()){
  return window.SIGEE_PERFIS?.normalizar?.(u?.perfil) || window.SIGEE_SESSION?.normalizarPerfil?.(u?.perfil) || '';
}
function pode(cap, u=usuario()){
  if (Array.isArray(cap)) return cap.some(item => pode(item, u));
  return window.SIGEE_PERMISSOES?.pode?.(cap, u) === true;
}
function capacidadeRota(rota){ return ROTAS[String(rota || '').trim()] || null; }
function autorizarRota(rota, silencioso=false){
  const cap = capacidadeRota(rota);
  if (!cap || pode(cap)) return true;
  if (!silencioso) alert('Seu perfil não possui permissão para acessar esta área.');
  return false;
}
function itemPermitido(item, u){
  const p = perfil(u);
  return (!item.perfis || item.perfis.includes(p)) && pode(item.capacidade, u);
}
function containerMenu(){
  return document.getElementById('sigee-menu-dinamico') || document.querySelector('.sigee-sidebar-nav');
}
function classeMenu(){
  return 'sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
}
function criarBotao(item){
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = item.id;
  botao.className = classeMenu();
  botao.dataset.sigeeRota = item.rota;
  botao.textContent = `${item.icone} ${item.rotulo}`;
  botao.addEventListener('click', () => navegarPara(item.rota, { manual:true }));
  return botao;
}
function atualizarIdentidade(){
  const u = usuario(); if (!u) return false;
  const p = perfil(u);
  const global = window.SIGEE_ESCOPO?.ehGlobal?.(u) === true;
  const nte = window.SIGEE_ESCOPO?.nteUsuario?.(u) || u.nte || '';
  const titulo = document.getElementById('sigee-escopo-titulo');
  const subtitulo = document.getElementById('sigee-escopo-subtitulo');
  if (titulo) titulo.textContent = global ? (p === 'Master' ? 'ADMINISTRAÇÃO GLOBAL' : 'VISÃO ESTADUAL') : (nte || 'GESTÃO TERRITORIAL');
  if (subtitulo) subtitulo.textContent = global ? 'SEC / BA' : `${p} territorial`;
  document.body.dataset.sigeePerfil = p;
  document.body.dataset.sigeeEscopo = global ? 'GLOBAL' : 'NTE';
  return true;
}
function renderizarMenu(){
  const u = usuario();
  const nav = containerMenu();
  if (!nav) return false;
  if (!u) {
    if (nav.childElementCount) nav.replaceChildren();
    delete nav.dataset.sigeeMenuAssinatura;
    return false;
  }
  const permitidos = MENU.filter(item => itemPermitido(item, u));
  const assinatura = `${perfil(u)}|${permitidos.map(i=>i.id).join(',')}`;
  if (nav.dataset.sigeeMenuAssinatura === assinatura && nav.children.length === permitidos.length) {
    atualizarIdentidade();
    return true;
  }
  instalando = true;
  nav.replaceChildren(...permitidos.map(criarBotao));
  nav.dataset.sigeeMenuAssinatura = assinatura;
  instalando = false;
  atualizarIdentidade();
  return true;
}
function primeiraRota(u=usuario()){
  const p = perfil(u);
  if (p === 'Estagiário' && pode('processos.criar', u)) return 'nova-solicitacao';
  if (['Master','SEC','Gestor'].includes(p) && pode('indicadores.visualizar', u)) return 'painel';
  if (pode('processos.visualizar', u)) return 'processos';
  if (pode('processos.criar', u)) return 'nova-solicitacao';
  if (pode('escolas.visualizar', u)) return 'escolas';
  if (pode('indicadores.visualizar', u)) return 'painel';
  return '';
}
function navegarPara(rota, opcoes={}){
  const silencioso = opcoes.silencioso === true || opcoes.manual !== true || inicializacaoEmCurso;
  if (!autorizarRota(rota, silencioso)) return false;
  const original = navegacaoOriginal || window.navegar;
  if (rota === 'nova-solicitacao') {
    if (typeof original === 'function' && pode('escolas.visualizar')) original.call(window, 'escolas');
    setTimeout(() => window.abrirFormularioNovaSolicitacao?.(), 30);
    renderizarMenu();
    return true;
  }
  const resultado = typeof original === 'function' ? original.call(window, rota) : undefined;
  queueMicrotask(renderizarMenu);
  return resultado;
}
function instalarNavegacao(){
  const atual = window.navegar;
  if (typeof atual !== 'function') return false;
  if (atual === navegacaoProtegida) return true;
  navegacaoOriginal = atual.__sigeeOriginal || atual;
  navegacaoProtegida = function(rota){
    const silencioso = inicializacaoEmCurso === true;
    if (!autorizarRota(rota, silencioso)) return false;
    const resultado = navegacaoOriginal.apply(this, arguments);
    queueMicrotask(renderizarMenu);
    return resultado;
  };
  navegacaoProtegida.__sigeeAutorizacao = true;
  navegacaoProtegida.__sigeeOriginal = navegacaoOriginal;
  window.navegar = navegacaoProtegida;
  try { globalThis.navegar = navegacaoProtegida; } catch (_) {}
  return true;
}
function abrirDestinoInicial(){
  const u = usuario();
  const dashboard = document.getElementById('sistema-dashboard');
  if (!u || dashboard?.classList.contains('hidden')) return false;
  inicializacaoEmCurso = true;
  try {
    renderizarMenu();
    const destino = primeiraRota(u);
    return destino ? navegarPara(destino, { silencioso:true }) : false;
  } finally {
    setTimeout(() => { inicializacaoEmCurso = false; }, 300);
  }
}
function observarMenu(){
  const nav = containerMenu();
  if (!nav || observer) return false;
  observer = new MutationObserver(() => {
    if (!instalando) queueMicrotask(renderizarMenu);
  });
  observer.observe(nav, { childList:true });
  return true;
}
function iniciar(){
  instalarNavegacao();
  renderizarMenu();
  observarMenu();
}

document.addEventListener('DOMContentLoaded', iniciar, { once:true });
document.addEventListener('sigee:usuario-logado', () => setTimeout(renderizarMenu, 0));
document.addEventListener('sigee:usuario-deslogado', () => setTimeout(renderizarMenu, 0));
document.addEventListener('sigee:navegacao-concluida', renderizarMenu);
document.addEventListener('sigee:login-concluido', () => setTimeout(abrirDestinoInicial, 0));
window.addEventListener('sigee:login-concluido', () => setTimeout(abrirDestinoInicial, 0));
window.addEventListener('load', () => setTimeout(iniciar, 50));

window.SIGEE_AUTORIZACAO = Object.freeze({
  usuario, perfil, pode, capacidadeRota, autorizarRota,
  aplicarMenus:renderizarMenu, renderizarMenu, primeiraRota,
  navegarPara, protegerNavegacao:instalarNavegacao, abrirDestinoInicial,
  exigir:(cap,mensagem)=>pode(cap)||((mensagem!==false)&&alert(mensagem||'Ação não autorizada.'),false)
});
})(window, document);
