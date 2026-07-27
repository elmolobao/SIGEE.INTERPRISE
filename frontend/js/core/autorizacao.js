/**
 * SIGEE Enterprise RC7.4.2 — Menu nativo único por perfil.
 * Autoridade exclusiva para menus, rotas e destino pós-login.
 */
(function(window, document){
'use strict';
if (window.__SIGEE_AUTORIZACAO_RC742__) return;
window.__SIGEE_AUTORIZACAO_RC742__ = true;

const ROTAS = Object.freeze({
  painel: 'relatorios.visualizar',
  processos: 'processos.visualizar',
  escolas: 'escolas.visualizar',
  usuarios: ['usuarios.gerenciar_global', 'usuarios.gerenciar_nte'],
  logs: 'logs.visualizar',
  diagnostico: 'logs.visualizar',
  'controle-acesso-ntes': 'usuarios.gerenciar_global',
  'sala-situacao': 'indicadores.visualizar',
  'centro-inteligencia': 'indicadores.visualizar',
  'nova-solicitacao': 'processos.criar',
  relatorios: 'relatorios.visualizar',
  'migracao-historica': 'migracao.executar'
});

const MENU_PRINCIPAL = Object.freeze([
  { id:'menu-painel', rota:'painel', icone:'📊', rotulo:'Painel Gerencial', capacidade:'indicadores.visualizar', perfis:['Gestor'] },
  { id:'menu-central-processos', rota:'processos', icone:'📋', rotulo:'Central de Processos', capacidade:'processos.visualizar', perfis:['Master','SEC','Gestor','Administrador','Técnico','Atendimento','Estagiário','Consulta'] },
  { id:'menu-catalogo-escolas', rota:'escolas', icone:'🏫', rotulo:'Catálogo de Escolas', capacidade:'escolas.visualizar', perfis:['Master','SEC','Administrador','Técnico','Atendimento','Estagiário','Consulta'] },
  { id:'menu-relatorios', tipo:'relatorios', icone:'📑', rotulo:'Relatórios', capacidade:'relatorios.visualizar', perfis:['Master','SEC','Gestor','Administrador'] },
  { id:'menu-centro-inteligencia', rota:'centro-inteligencia', icone:'🧠', rotulo:'Centro de Inteligência', capacidade:'indicadores.visualizar', perfis:['Master','Administrador'] },
  { id:'menu-sala-situacao', rota:'sala-situacao', icone:'📡', rotulo:'Sala de Situação', capacidade:'indicadores.visualizar', perfis:['Master','SEC','Gestor'] }
]);

const MENU_ADMIN = Object.freeze([
  { id:'menu-usuarios', rota:'usuarios', icone:'👥', rotulo:'Usuários', capacidade:['usuarios.gerenciar_global','usuarios.gerenciar_nte'], perfis:['Master','Administrador'] },
  { id:'menu-logs', rota:'logs', icone:'📜', rotulo:'Histórico de Atividades', capacidade:'logs.visualizar', perfis:['Master'] },
  { id:'menu-diagnostico', rota:'diagnostico', icone:'🩺', rotulo:'Centro de Diagnóstico', capacidade:'logs.visualizar', perfis:['Master'] },
  { id:'menu-controle-acesso-ntes', rota:'controle-acesso-ntes', icone:'⛔', rotulo:'Controle de Acesso dos NTEs', capacidade:'usuarios.gerenciar_global', perfis:['Master'] },
  { id:'menu-migracao-historica', rota:'migracao-historica', icone:'🧬', rotulo:'Migração Histórica', capacidade:'migracao.executar', perfis:['Master'] }
]);

const RELATORIOS = Object.freeze([
  ['operacional','📊','Operacional'],
  ['sla','⏱️','SLA'],
  ['territorial','🗺️','Territorial'],
  ['pendencias','⏸️','Pendências'],
  ['produtividade','👥','Produtividade'],
  ['executivo','📈','Executivo']
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
  if (chave === 'painel' && !['Master','Gestor','Administrador','SEC'].includes(perfil(u))) {
    if (!silencioso) alert('Seu perfil não possui permissão para acessar painéis e relatórios.');
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
function criarBotao(item, classeExtra=''){
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = item.id;
  botao.className = `${classeMenu()} ${classeExtra}`.trim();
  botao.dataset.sigeeRota = item.rota;
  botao.dataset.sigeeCapacidade = Array.isArray(item.capacidade) ? item.capacidade.join('|') : item.capacidade;
  let rotulo = item.rotulo;
  if (item.rota === 'painel') rotulo = 'Painel Gerencial';
  botao.textContent = `${item.icone} ${rotulo}`;
  botao.addEventListener('click', () => navegarPara(item.rota, { manual:true }));
  return botao;
}

function criarGrupoRelatorios(){
  const wrap=document.createElement('div');
  wrap.id='menu-relatorios-rc6501';
  wrap.className='sig-rel-menu';
  const titulo=document.createElement('button');
  titulo.type='button';
  titulo.id='menu-relatorios';
  titulo.className='sig-rel-menu-title';
  titulo.setAttribute('aria-expanded','false');
  titulo.innerHTML='📑 Relatórios <span>▾</span>';
  const sub=document.createElement('div');
  RELATORIOS.forEach(([tipo,icone,rotulo])=>{
    const b=document.createElement('button');
    b.type='button'; b.dataset.reportMenu=tipo; b.textContent=`${icone} ${rotulo}`;
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();wrap.classList.add('open');titulo.setAttribute('aria-expanded','true');window.SIGEE_RELATORIOS?.abrir?.(tipo);});
    sub.appendChild(b);
  });
  titulo.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();wrap.classList.toggle('open');titulo.setAttribute('aria-expanded',String(wrap.classList.contains('open')));});
  wrap.append(titulo,sub);
  return wrap;
}

function criarGrupoAdministrativo(itens){
  const grupo=document.createElement('div');
  grupo.id='menu-administrativo-grupo';
  grupo.className='sigee-menu-grupo';
  const titulo=document.createElement('button');
  titulo.type='button'; titulo.id='menu-administrativo-titulo'; titulo.className=classeMenu();
  titulo.setAttribute('aria-expanded','false'); titulo.innerHTML='<span>⚙️ Administrativo</span><span style="float:right">▼</span>';
  const submenu=document.createElement('div');
  submenu.id='submenu-administracao'; submenu.className='hidden';
  submenu.style.cssText='padding-left:.55rem;margin-top:.25rem;border-left:2px solid rgba(250,204,21,.75)';
  itens.forEach(item=>submenu.appendChild(criarBotao(item)));
  titulo.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const abrir=submenu.classList.contains('hidden');submenu.classList.toggle('hidden',!abrir);titulo.setAttribute('aria-expanded',String(abrir));titulo.lastElementChild.textContent=abrir?'▲':'▼';});
  grupo.append(titulo,submenu);
  return grupo;
}

function garantirTelaDiagnostico(){
  let aba=document.getElementById('aba-diagnostico');
  if(aba)return aba;
  const main=document.querySelector('#sistema-dashboard main'); if(!main)return null;
  aba=document.createElement('section'); aba.id='aba-diagnostico'; aba.className='hidden space-y-5';
  aba.innerHTML=`<header class="sigee-admin-page-head"><div><span>ADMINISTRAÇÃO</span><h1>Centro de Diagnóstico</h1><p>Verificação dos componentes, conectividade e integração operacional do SIGEE.</p></div><button type="button" id="btn-atualizar-diagnostico">↻ Atualizar diagnóstico</button></header><section id="diagnostico-resumo" class="bg-white rounded-xl border shadow-sm p-5"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><article><small>Status geral</small><strong id="diag-status-geral">Aguardando</strong></article><article><small>Última atualização</small><strong id="diag-atualizado">—</strong></article><article><small>Conectividade</small><strong id="diag-conectividade">—</strong></article><article><small>Processos</small><strong id="diag-processos">0</strong></article><article><small>Escolas</small><strong id="diag-escolas">0</strong></article><article><small>Usuários</small><strong id="diag-usuarios">0</strong></article><article><small>Tempo de cálculo</small><strong id="diag-tempo-calculo">—</strong></article><article><small>Última sincronização</small><strong id="diag-ultima-sync">—</strong></article></div></section><section id="diag-componentes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></section>`;
  main.appendChild(aba); aba.querySelector('#btn-atualizar-diagnostico')?.addEventListener('click',()=>window.atualizarDiagnosticoSIGEE?.(true)); return aba;
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
  // Fonte única: matriz oficial de capacidades.
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
      botao.addEventListener('click', () => window.SIGEE_NOVA_SOLICITACAO_CONTROLLER?.abrir?.() || window.abrirFormularioNovaSolicitacao?.());
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
  const principais = MENU_PRINCIPAL.filter(item => itemPermitido(item, u));
  const administrativos = MENU_ADMIN.filter(item => itemPermitido(item, u));
  const assinatura = `${perfil(u)}|${principais.map(i=>i.id).join(',')}|ADMIN:${administrativos.map(i=>i.id).join(',')}`;
  const estruturaIntegra = nav.dataset.sigeeMenuAssinatura === assinatura &&
    document.getElementById('menu-relatorios-rc6501') &&
    (!administrativos.length || (document.getElementById('menu-administrativo-grupo') && document.getElementById('submenu-administracao')));
  if (estruturaIntegra) {
    // O menu pode estar íntegro enquanto controles internos foram alterados por
    // módulos tardios de perfil. Reaplica a interface sem reconstruir a sidebar.
    atualizarIdentidade();
    aplicarControlesDaInterface();
    return true;
  }
  instalando = true;
  const fragment=document.createDocumentFragment();
  principais.forEach(item=>fragment.appendChild(item.tipo==='relatorios'?criarGrupoRelatorios():criarBotao(item)));
  if(administrativos.length) fragment.appendChild(criarGrupoAdministrativo(administrativos));
  nav.replaceChildren(fragment);
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
    usuarios:'aba-usuarios', logs:'aba-logs', diagnostico:'aba-diagnostico',
    'controle-acesso-ntes':'aba-controle-acesso-ntes', relatorios:'aba-painel',
    'sala-situacao':'aba-sala-situacao', 'centro-inteligencia':'aba-painel',
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

  if (rota === 'centro-inteligencia') {
    garantirRotaVisivel('centro-inteligencia');
    window.carregarDadosDashboardReal?.();
    window.atualizarDashboardPeloMotorSIGEE?.();
    queueMicrotask(renderizarMenu);
    setTimeout(() => window.SIGEE_CIO_WIDGET?.abrir?.(), 80);
    return true;
  }

  if (rota === 'diagnostico') {
    const aba=garantirTelaDiagnostico();
    if(!aba)return false;
    document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]').forEach(sec=>sec.classList.add('hidden'));
    aba.classList.remove('hidden'); aba.hidden=false; aba.style.removeProperty('display');
    window.atualizarDiagnosticoSIGEE?.();
    return true;
  }

  if (rota === 'controle-acesso-ntes') {
    if(window.SIGEE_CONTROLE_ACESSO_NTES?.abrir){window.SIGEE_CONTROLE_ACESSO_NTES.abrir();return true;}
    alert('O módulo Controle de Acesso dos NTEs ainda não concluiu o carregamento.');
    return false;
  }

  if (rota === 'migracao-historica') {
    if(window.SIGEE_MIGRACAO_HISTORICA?.abrir) window.SIGEE_MIGRACAO_HISTORICA.abrir();
    else garantirRotaVisivel('migracao-historica');
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
        setTimeout(aplicarRotaInicialForcada,900);
        setTimeout(aplicarRotaInicialForcada,1800);
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

function iniciar(){
  instalarNavegacao();
  instalarLogin();
  renderizarMenu();
}

document.addEventListener('DOMContentLoaded', iniciar, { once:true });
document.addEventListener('sigee:usuario-logado', () => setTimeout(() => {
  renderizarMenu();
  aplicarRotaInicialForcada();
  setTimeout(aplicarRotaInicialForcada,120);
  setTimeout(aplicarRotaInicialForcada,900);
  setTimeout(aplicarRotaInicialForcada,1800);
  // Passagens curtas e finitas para cobrir a finalização assíncrona da sessão.
  setTimeout(aplicarControlesDaInterface,180);
  setTimeout(aplicarControlesDaInterface,650);
}, 0));
window.addEventListener('sigee:login-concluido', () => {
  setTimeout(iniciar, 0);
  setTimeout(aplicarControlesDaInterface,180);
  setTimeout(aplicarControlesDaInterface,650);
});
window.addEventListener('load', () => setTimeout(iniciar, 50));

window.SIGEE_AUTORIZACAO = Object.freeze({
  usuario, perfil, pode, rotaCanonica, capacidadeRota, autorizarRota,
  aplicarMenus:renderizarMenu, renderizarMenu, primeiraRota, aplicarRotaInicialForcada,
  navegarPara, garantirRotaVisivel, protegerNavegacao:instalarNavegacao, instalarLogin,
  exigir:(cap,mensagem)=>pode(cap)||((mensagem!==false)&&alert(mensagem||'Ação não autorizada.'),false)
});
})(window, document);
