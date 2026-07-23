/**
 * SIGEE Enterprise RC5.4.2 — Menu dinâmico e navegação única por perfil.
 * Autoridade exclusiva para menus, rotas e destino pós-login.
 */
(function(window, document){
'use strict';
if (window.__SIGEE_AUTORIZACAO_RC542__) return;
window.__SIGEE_AUTORIZACAO_RC542__ = true;

const ROTAS = Object.freeze({
  painel: 'indicadores.visualizar',
  processos: 'processos.visualizar',
  escolas: 'escolas.visualizar',
  usuarios: ['usuarios.gerenciar_global', 'usuarios.gerenciar_nte'],
  logs: 'logs.visualizar',
  'sala-situacao': 'indicadores.visualizar',
  'centro-inteligencia': 'indicadores.visualizar',
  'nova-solicitacao': 'processos.criar',
  relatorios: 'relatorios.visualizar',
  'migracao-historica': 'migracao.executar'
});

const MENU = Object.freeze([
  { id:'menu-painel', rota:'painel', icone:'📊', rotulo:'Painel Gerencial', capacidade:'indicadores.visualizar', perfis:['Gestor'] },
  { id:'menu-central-processos', rota:'processos', icone:'📋', rotulo:'Central de Processos', capacidade:'processos.visualizar', perfis:['Master','SEC','Gestor','Administrador','Técnico','Atendimento','Estagiário','Consulta'] },
  { id:'menu-catalogo-escolas', rota:'escolas', icone:'🏫', rotulo:'Catálogo de Escolas', capacidade:'escolas.visualizar' },
  { id:'menu-relatorios', rota:'relatorios', icone:'📑', rotulo:'Relatórios', capacidade:'relatorios.visualizar', perfis:['Master','SEC','Gestor','Administrador','Técnico','Atendimento','Estagiário','Consulta'] },
  { id:'menu-usuarios', rota:'usuarios', icone:'👥', rotulo:'Usuários do NTE', capacidade:['usuarios.gerenciar_global','usuarios.gerenciar_nte'], perfis:['Master','Administrador'] },
  { id:'menu-centro-inteligencia', rota:'centro-inteligencia', icone:'🧠', rotulo:'Centro de Inteligência', capacidade:'indicadores.visualizar', perfis:['Master','SEC'] },
  { id:'menu-sala-situacao', rota:'sala-situacao', icone:'📡', rotulo:'Sala de Situação', capacidade:'indicadores.visualizar', perfis:['Master','SEC','Gestor'] },
  { id:'menu-logs', rota:'logs', icone:'⚙️', rotulo:'Configurações', capacidade:'logs.visualizar', perfis:['Master'] },
  { id:'menu-migracao-historica', rota:'migracao-historica', icone:'🧬', rotulo:'Migração Histórica', capacidade:'migracao.executar', perfis:['Master'] }
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
function rotaCanonica(rota){
  const chave = String(rota || '').trim();
  // A base atual não possui uma seção #aba-relatorios. O relatório institucional
  // é o painel analítico territorial/estadual já existente em #aba-painel.
  return chave === 'relatorios' ? 'painel' : chave;
}
function capacidadeRota(rota){ return ROTAS[String(rota || '').trim()] || null; }
function autorizarRota(rota, silencioso=false){
  const chave = String(rota || '').trim();
  const u = usuario();
  if (chave === 'painel' && perfil(u) !== 'Gestor') {
    if (!silencioso) alert('O Painel Gerencial é exclusivo do perfil Gestor.');
    return false;
  }
  const cap = capacidadeRota(chave);
  if (!cap || pode(cap,u)) return true;
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
  const p = perfil();
  let rotulo = item.rotulo;
  if (item.rota === 'painel') rotulo = 'Painel Gerencial';
  if (item.rota === 'usuarios' && p === 'Master') rotulo = 'Usuários';
  botao.textContent = `${item.icone} ${rotulo}`;
  botao.addEventListener('click', () => navegarPara(item.rota, { manual:true }));
  return botao;
}
function mostrarElemento(el, visivel){
  if(!el)return;
  el.classList.toggle('hidden', !visivel);
  el.hidden = !visivel;
  el.setAttribute('aria-hidden', visivel ? 'false' : 'true');
  el.style.setProperty('display', visivel ? '' : 'none', 'important');
  if('disabled' in el) el.disabled = !visivel;
}
function aplicarControlesCatalogo(){
  const podeCadastrar = pode('escolas.editar_cadastral');
  const podeImportar = pode('escolas.importar');
  const podeExportar = pode('escolas.exportar');
  document.querySelectorAll('#aba-escolas button[onclick*="abrirModalNovaEscola"], [data-sigee-acao="cadastrar-escola"]').forEach(el=>mostrarElemento(el,podeCadastrar));
  document.querySelectorAll('#btn-importar-dados-master, #input-importar-excel').forEach(el=>mostrarElemento(el,podeImportar));
  document.querySelectorAll('#aba-escolas .export-only, #aba-escolas button[onclick*="exportarEscolasSIGEE"]').forEach(el=>mostrarElemento(el,podeExportar));
}
function garantirNovaSolicitacaoNaCentral(){
  const central = document.getElementById('aba-processos');
  if(!central)return;

  // Remove cópias criadas por patches anteriores e preserva apenas um botão oficial.
  central.querySelectorAll('#btn-nova-solicitacao-central').forEach(el=>el.remove());

  let botao = central.querySelector('#btn-nova-solicitacao, [data-acao="nova-solicitacao"]');
  const autorizado = pode('processos.criar');

  // Alguns módulos legados removem o botão do DOM. Recria somente quando autorizado.
  if(!botao && autorizado){
    const cabecalho = central.querySelector('.sigee-central-cabecalho, .sigee-modulo-cabecalho, header, .bg-white');
    if(cabecalho){
      botao = document.createElement('button');
      botao.type = 'button';
      botao.id = 'btn-nova-solicitacao';
      botao.dataset.acao = 'nova-solicitacao';
      botao.className = 'bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition';
      botao.textContent = '➕ Nova Solicitação';
      botao.addEventListener('click', ()=>window.abrirFormularioNovaSolicitacao?.());
      cabecalho.appendChild(botao);
    }
  }
  if(botao) mostrarElemento(botao, autorizado);
}
function aplicarControlesExportacao(){
  const podeExportar = pode('relatorios.exportar');
  document.querySelectorAll(
    '#aba-processos .export-only, #aba-processos button[onclick*="exportar"], ' +
    '#aba-processos [data-sigee-acao="exportar"], #aba-processos [id*="exportar"]'
  ).forEach(el=>mostrarElemento(el,podeExportar));
}
function aplicarControlesDaInterface(){
  aplicarControlesCatalogo();
  garantirNovaSolicitacaoNaCentral();
  aplicarControlesExportacao();
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
  aplicarControlesDaInterface();
  return true;
}
function atualizarIdentidade(){
  const u = usuario(); if (!u) return;
  const p = perfil(u);
  const meta = window.SIGEE_PERFIS?.obter?.(p) || null;
  const global = window.SIGEE_ESCOPO?.ehGlobal?.(u) === true;
  const nte = window.SIGEE_ESCOPO?.nteUsuario?.(u) || u.nte || '';
  const titulo = document.getElementById('sigee-escopo-titulo');
  const subtitulo = document.getElementById('sigee-escopo-subtitulo');

  if (titulo) titulo.textContent = meta?.titulo || (global ? 'VISÃO ESTADUAL' : 'GESTÃO TERRITORIAL');
  if (subtitulo) {
    subtitulo.textContent = global
      ? (meta?.subtitulo || 'SEC / BA')
      : (nte || meta?.subtitulo || 'NTE vinculado');
  }

  document.body.dataset.sigeePerfil = p;
  document.body.dataset.sigeeEscopo = global ? 'GLOBAL' : 'NTE';
  document.body.dataset.sigeeNatureza = meta?.natureza || '';
  atualizarRotuloPerfilUsuario();
}
function rotuloPerfil(p){
  const mapa={
    Master:'Master',
    SEC:'Visão Estadual',
    Gestor:'Gestor Territorial',
    Administrador:'Administrador Territorial',
    'Técnico':'Técnico do NTE',
    Atendimento:'Atendimento Territorial',
    'Estagiário':'Apoio Operacional',
    Consulta:'Consulta Territorial'
  };
  return mapa[p] || p;
}
function atualizarRotuloPerfilUsuario(){
  const u=usuario(); if(!u)return;
  const p=perfil(u), nte=window.SIGEE_ESCOPO?.nteUsuario?.(u)||u.nte||'';
  const complemento = p==='Master' ? 'SEC - TODOS OS NTEs' : nte;
  const textoPerfil = `${rotuloPerfil(p)}${complemento?` | ${complemento}`:''}`;
  const el=document.getElementById('user-perfil');
  if(el) el.textContent=textoPerfil;
  document.querySelectorAll('[data-sigee-perfil-usuario], #footer-perfil, #rodape-perfil')
    .forEach(x=>x.textContent=rotuloPerfil(p));
}
function garantirRotaVisivel(rota){
  const mapa={
    painel:'aba-painel', processos:'aba-processos', escolas:'aba-escolas',
    usuarios:'aba-usuarios', logs:'aba-logs', relatorios:'aba-painel',
    'sala-situacao':'aba-sala-situacao', 'centro-inteligencia':'aba-centro-inteligencia',
    'migracao-historica':'aba-migracao-historica'
  };
  const id=mapa[rota];
  if(!id)return;
  const alvo=document.getElementById(id);
  if(!alvo)return;
  const oculto=alvo.classList.contains('hidden') || alvo.hidden || getComputedStyle(alvo).display==='none';
  if(!oculto)return;
  document.querySelectorAll('[id^="aba-"]').forEach(sec=>{
    if(sec===alvo)return;
    sec.classList.add('hidden'); sec.hidden=true;
  });
  alvo.classList.remove('hidden'); alvo.hidden=false; alvo.style.removeProperty('display');
  if(rota==='painel'){
    window.carregarDadosDashboardReal?.();
    window.atualizarDashboardPeloMotorSIGEE?.();
  }
  document.dispatchEvent(new CustomEvent('sigee:navegacao-concluida',{detail:{rota,origem:'autorizacao-rc542'}}));
}
function primeiraRota(u=usuario()){
  const p = perfil(u);
  if (p === 'Gestor' && pode('indicadores.visualizar',u)) return 'painel';
  if (pode('processos.visualizar',u)) return 'processos';
  if (pode('relatorios.visualizar',u)) return 'relatorios';
  if (pode('escolas.visualizar',u)) return 'escolas';
  return '';
}
function aplicarRotaInicialForcada(){
  const u = usuario();
  if(!u)return false;
  const destino = perfil(u)==='Gestor' ? 'painel' : 'processos';
  if(destino==='processos' && !pode('processos.visualizar',u)) return false;
  navegarPara(destino,{silencioso:true});
  setTimeout(()=>garantirRotaVisivel(destino),40);
  return true;
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
    if (typeof original === 'function') original.call(window, 'processos');
    setTimeout(() => window.abrirFormularioNovaSolicitacao?.(), 30);
    renderizarMenu();
    return true;
  }

  if (rota === 'relatorios') {
    // Relatórios reutiliza a seção analítica, mas não chama a rota protegida "painel".
    garantirRotaVisivel('relatorios');
    window.carregarDadosDashboardReal?.();
    window.atualizarDashboardPeloMotorSIGEE?.();
    queueMicrotask(renderizarMenu);
    setTimeout(aplicarControlesDaInterface, 30);
    return true;
  }

  if (rota === 'migracao-historica') {
    garantirRotaVisivel('migracao-historica');
    queueMicrotask(renderizarMenu);
    return true;
  }

  const destino = rotaCanonica(rota);
  const resultado = typeof original === 'function' ? original.call(window, destino) : undefined;
  queueMicrotask(renderizarMenu);
  setTimeout(()=>{
    garantirRotaVisivel(rota);
    aplicarControlesDaInterface();
  }, 60);
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

    if (String(rota||'').trim() === 'relatorios') {
      garantirRotaVisivel('relatorios');
      window.carregarDadosDashboardReal?.();
      window.atualizarDashboardPeloMotorSIGEE?.();
      queueMicrotask(renderizarMenu);
      setTimeout(aplicarControlesDaInterface, 30);
      return true;
    }

    if (String(rota||'').trim() === 'migracao-historica') {
      garantirRotaVisivel('migracao-historica');
      queueMicrotask(renderizarMenu);
      return true;
    }

    const args = Array.from(arguments);
    args[0] = rotaCanonica(rota);
    const resultado = original.apply(this, args);
    queueMicrotask(renderizarMenu);
    setTimeout(()=>{
      garantirRotaVisivel(rota);
      aplicarControlesDaInterface();
    }, 60);
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
        aplicarRotaInicialForcada();
        setTimeout(aplicarRotaInicialForcada,120);
        setTimeout(aplicarRotaInicialForcada,320);
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
  aplicarRotaInicialForcada();
  setTimeout(aplicarRotaInicialForcada,120);
}, 0));
document.addEventListener('sigee:navegacao-concluida', renderizarMenu);
window.addEventListener('sigee:login-concluido', () => setTimeout(iniciar, 0));
window.addEventListener('load', () => setTimeout(iniciar, 50));

window.SIGEE_AUTORIZACAO = Object.freeze({
  usuario, perfil, pode, rotaCanonica, capacidadeRota, autorizarRota,
  aplicarMenus:renderizarMenu, renderizarMenu, primeiraRota, aplicarRotaInicialForcada,
  navegarPara, garantirRotaVisivel, protegerNavegacao:instalarNavegacao, instalarLogin,
  exigir:(cap,mensagem)=>pode(cap)||((mensagem!==false)&&alert(mensagem||'Ação não autorizada.'),false)
});
})(window, document);
