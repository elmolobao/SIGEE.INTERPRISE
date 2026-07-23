/**
 * SIGEE Enterprise RC5.2.0 — Menu dinâmico e navegação única por perfil.
 * Autoridade exclusiva para menus, rotas e destino pós-login.
 */
(function(window, document){
'use strict';
if (window.__SIGEE_AUTORIZACAO_RC520__) return;
window.__SIGEE_AUTORIZACAO_RC520__ = true;

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

let navegacaoAutomatica = false;
let instalando = false;
let observer = null;

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
function classeMenu(){
  return 'sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
}
function containerMenu(){
  return document.getElementById('sigee-menu-dinamico') || document.querySelector('.sigee-sidebar-nav');
}
function criarBotao(item){
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = item.id;
  botao.className = classeMenu();
  botao.dataset.sigeeRota = item.rota;
  botao.dataset.sigeeCapacidade = Array.isArray(item.capacidade) ? item.capacidade.join('|') : item.capacidade;
  botao.textContent = `${item.icone} ${item.rotulo}`;
  botao.addEventListener('click', () => navegarPara(item.rota, { manual:true }));
  return botao;
}
function renderizarMenu(){
  const u = usuario();
  const nav = containerMenu();
  if (!u || !nav) return false;
  const permitidos = MENU.filter(item => itemPermitido(item, u));
  const assinatura = `${perfil(u)}|${permitidos.map(i=>i.id).join(',')}`;
  if (nav.dataset.sigeeMenuAssinatura === assinatura && nav.children.length === permitidos.length) return true;
  instalando = true;
  nav.replaceChildren(...permitidos.map(criarBotao));
  nav.dataset.sigeeMenuAssinatura = assinatura;
  instalando = false;
  atualizarIdentidade();
  return true;
}
function atualizarIdentidade(){
  const u = usuario(); if (!u) return;
  const p = perfil(u);
  const global = window.SIGEE_ESCOPO?.ehGlobal?.(u) === true;
  const nte = window.SIGEE_ESCOPO?.nteUsuario?.(u) || u.nte || '';
  const titulo = document.getElementById('sigee-escopo-titulo');
  const subtitulo = document.getElementById('sigee-escopo-subtitulo');
  if (titulo) {
    titulo.textContent = global
      ? (p === 'Master' ? 'ADMINISTRAÇÃO GLOBAL' : 'VISÃO ESTADUAL')
      : (p === 'Gestor' ? 'GESTOR TERRITORIAL' : (nte || 'GESTÃO TERRITORIAL'));
  }
  if (subtitulo) {
    subtitulo.textContent = global
      ? 'SEC / BA'
      : (p === 'Gestor' ? (nte || 'NTE vinculado') : `${p} territorial`);
  }
  document.body.dataset.sigeePerfil = p;
  document.body.dataset.sigeeEscopo = global ? 'GLOBAL' : 'NTE';
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
function navegarOriginal(){
  const atual = window.navegar;
  if (typeof atual !== 'function') return null;
  return atual.__sigeeRc520Original || atual;
}
function navegarPara(rota, opcoes={}){
  const silencioso = opcoes.silencioso === true || navegacaoAutomatica === true || opcoes.manual !== true;
  if (!autorizarRota(rota, silencioso)) return false;
  const original = navegarOriginal();
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
  if (atual.__sigeeRc520) return true;
  const original = atual.__sigeeRc520Original || atual;
  const protegida = function(rota){
    const silencioso = navegacaoAutomatica === true;
    if (!autorizarRota(rota, silencioso)) return false;
    const resultado = original.apply(this, arguments);
    queueMicrotask(renderizarMenu);
    return resultado;
  };
  protegida.__sigeeRc520 = true;
  protegida.__sigeeRc520Original = original;
  window.navegar = protegida;
  try { globalThis.navegar = protegida; } catch (_) {}
  return true;
}
function instalarLogin(){
  const atual = window.handleLogin;
  if (typeof atual !== 'function') return false;
  if (atual.__sigeeRc520) return true;
  const original = atual.__sigeeRc520Original || atual;
  const protegido = async function(event){
    navegacaoAutomatica = true;
    try {
      const resultado = await original.apply(this, arguments);
      const u = usuario();
      if (u && !document.getElementById('sistema-dashboard')?.classList.contains('hidden')) {
        renderizarMenu();
        const destino = primeiraRota(u);
        if (destino) navegarPara(destino, { silencioso:true });
      }
      return resultado;
    } finally {
      setTimeout(() => { navegacaoAutomatica = false; }, 80);
    }
  };
  protegido.__sigeeRc520 = true;
  protegido.__sigeeRc520Original = original;
  window.handleLogin = protegido;
  try { globalThis.handleLogin = protegido; } catch (_) {}
  return true;
}
function observarMenu(){
  const nav = containerMenu();
  if (!nav || observer) return;
  observer = new MutationObserver(() => {
    if (!instalando) queueMicrotask(renderizarMenu);
  });
  observer.observe(nav, { childList:true });
}
function iniciar(){
  instalarNavegacao();
  instalarLogin();
  renderizarMenu();
  observarMenu();
}

document.addEventListener('DOMContentLoaded', iniciar, { once:true });
document.addEventListener('sigee:usuario-logado', () => setTimeout(() => {
  renderizarMenu();
  const destino = primeiraRota();
  if (destino) navegarPara(destino, { silencioso:true });
}, 0));
document.addEventListener('sigee:navegacao-concluida', renderizarMenu);
window.addEventListener('sigee:login-concluido', () => setTimeout(iniciar, 0));
window.addEventListener('load', () => setTimeout(iniciar, 50));

window.SIGEE_AUTORIZACAO = Object.freeze({
  usuario, perfil, pode, capacidadeRota, autorizarRota,
  aplicarMenus:renderizarMenu, renderizarMenu, primeiraRota,
  navegarPara, protegerNavegacao:instalarNavegacao, instalarLogin,
  exigir:(cap,mensagem)=>pode(cap)||((mensagem!==false)&&alert(mensagem||'Ação não autorizada.'),false)
});
})(window, document);
