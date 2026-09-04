/**
 * SIGEE Enterprise RC12.0.1D — Navegação modular hierárquica + controles autoritativos por sessão.
 * Autoridade exclusiva para menus, rotas e destino pós-login.
 */
(function(window, document){
'use strict';
if (window.__SIGEE_AUTORIZACAO_RC1201D__) return;
window.__SIGEE_AUTORIZACAO_RC1201D__ = true;

const ROTAS = Object.freeze({
  painel: 'relatorios.visualizar',
  processos: 'processos.visualizar',
  escolas: 'escolas.visualizar',
  usuarios: ['usuarios.gerenciar_global', 'usuarios.gerenciar_nte', 'usuarios.visualizar_nte'],
  logs: 'logs.visualizar',
  diagnostico: 'logs.visualizar',
  'controle-acesso-ntes': 'sistema.suspender_nte',
  'sala-situacao': 'indicadores.visualizar',
  'centro-inteligencia': 'indicadores.visualizar',
  'nova-solicitacao': 'processos.criar',
  relatorios: 'relatorios.visualizar',
  'migracao-historica': 'migracao.executar',
  'gestao-territorial': 'gestao_territorial.gerenciar',
  'plano-acao-territorial': 'processos.visualizar',
  'solicitacao-apoio-territorial': 'processos.visualizar',
  legalizacao: null
});

const MODULO_ROTA = Object.freeze({
  painel:'ESCOLAS_EXTINTAS', processos:'ESCOLAS_EXTINTAS', escolas:'ESCOLAS_EXTINTAS',
  'nova-solicitacao':'ESCOLAS_EXTINTAS', relatorios:'ESCOLAS_EXTINTAS',
  'sala-situacao':'ESCOLAS_EXTINTAS', 'centro-inteligencia':'ESCOLAS_EXTINTAS',
  'plano-acao-territorial':'ESCOLAS_EXTINTAS', 'solicitacao-apoio-territorial':'ESCOLAS_EXTINTAS', legalizacao:'LEGALIZACAO'
});

const MENU_EXTINTAS = Object.freeze([
  { id:'menu-central-processos', rota:'processos', modulo:'ESCOLAS_EXTINTAS', icone:'📋', rotulo:'Central de Processos', capacidade:'processos.visualizar', perfis:['Master','SEC','Secretaria','Gestor','Administrador','Técnico','Atendimento','Estagiário','Consulta'] },
  { id:'menu-catalogo-escolas', rota:'escolas', modulo:'ESCOLAS_EXTINTAS', icone:'🏫', rotulo:'Catálogo de Escolas', capacidade:'escolas.visualizar', perfis:['Master','SEC','Administrador','Técnico','Atendimento','Estagiário','Consulta'] },
  { id:'menu-painel', rota:'painel', modulo:'ESCOLAS_EXTINTAS', icone:'📊', rotulo:'Painel Gerencial', capacidade:'indicadores.visualizar', perfis:['Gestor'] },
  { id:'menu-centro-inteligencia', rota:'centro-inteligencia', modulo:'ESCOLAS_EXTINTAS', icone:'🧠', rotulo:'Centro de Inteligência', capacidade:'indicadores.visualizar', perfis:['Master','Administrador'] },
  { id:'menu-sala-situacao', rota:'sala-situacao', modulo:'ESCOLAS_EXTINTAS', icone:'📡', rotulo:'Sala de Situação', capacidade:'indicadores.visualizar', perfis:['Master','SEC','Gestor'] },
  { id:'menu-relatorios-extintas', tipo:'relatorios', rota:'relatorios', modulo:'ESCOLAS_EXTINTAS', icone:'📑', rotulo:'Relatórios', capacidade:'relatorios.visualizar', perfis:['Master','SEC','Gestor','Administrador'] }
]);

// Acesso operacional independente para o Técnico. Não pertence ao submenu de
// Escolas Extintas nem ao agrupamento Gestão Territorial.
const MENU_DESTAQUES = Object.freeze([
  { id:'menu-plano-acao-tecnico', rota:'plano-acao-territorial', modulo:'ESCOLAS_EXTINTAS', icone:'✅', rotulo:'Plano de Ação', capacidade:'processos.visualizar', perfis:['Técnico'], escopo:'NTE', destaque:true },
  { id:'menu-solicitacao-apoio-tecnico', rota:'solicitacao-apoio-territorial', modulo:'ESCOLAS_EXTINTAS', icone:'🆘', rotulo:'Solicitar Apoio', capacidade:'processos.visualizar', perfis:['Técnico'], escopo:'NTE', destaque:true }
]);

const MENU_LEGALIZACAO = Object.freeze([
  { id:'menu-legalizacao-visao', rota:'legalizacao', area:'visao', icone:'◫', rotulo:'Visão Geral', capacidade:null, perfis:['Master','Administrador','Técnico','Consulta'], modulo:'LEGALIZACAO' },
  { id:'menu-legalizacao-instituicoes', rota:'legalizacao', area:'instituicoes', icone:'🏫', rotulo:'Instituições', capacidade:null, perfis:['Master','Administrador','Técnico','Consulta'], modulo:'LEGALIZACAO' },
  { id:'menu-legalizacao-regulatorio', rota:'legalizacao', area:'regulatorio', icone:'🧭', rotulo:'Controle Regulatório', capacidade:null, perfis:['Master','Administrador','Técnico','Consulta'], modulo:'LEGALIZACAO' },
  // RC12.0.7B.2: Central de Pendências Regulatórias preservada em código, porém desativada para evitar cálculo global/consumo massivo do Supabase.
  { id:'menu-legalizacao-inspecoes', rota:'legalizacao', area:'inspecoes', icone:'📋', rotulo:'Inspeções', capacidade:null, perfis:['Master','Administrador','Técnico','Consulta'], modulo:'LEGALIZACAO' },
  { id:'menu-legalizacao-historico', rota:'legalizacao', area:'historico', icone:'🕘', rotulo:'Histórico', capacidade:null, perfis:['Master','Administrador','Técnico','Consulta'], modulo:'LEGALIZACAO' }
]);

const MENU_GESTAO_TERRITORIAL = Object.freeze([
  { id:'menu-gestao-territorial', rota:'gestao-territorial', icone:'🗺️', rotulo:'Visão Geral Territorial', capacidade:'gestao_territorial.gerenciar', perfis:['Master'] },
  { id:'menu-plano-acao-territorial', rota:'plano-acao-territorial', icone:'✅', rotulo:'Plano de Ação', capacidade:'processos.visualizar', perfis:['Gestor','Administrador','Atendimento','Estagiário','Consulta'], escopo:'NTE', modulo:'ESCOLAS_EXTINTAS' }
]);



const MENU_ADMIN = Object.freeze([
  { id:'menu-usuarios', rota:'usuarios', icone:'👥', rotulo:'Usuários', capacidade:['usuarios.gerenciar_global','usuarios.gerenciar_nte','usuarios.visualizar_nte'], perfis:['Master','Gestor','Administrador'] },
  { id:'menu-logs', rota:'logs', icone:'📜', rotulo:'Histórico de Atividades', capacidade:'logs.visualizar', perfis:['Master'] },
  { id:'menu-diagnostico', rota:'diagnostico', icone:'🩺', rotulo:'Centro de Diagnóstico', capacidade:'logs.visualizar', perfis:['Master'] },
  { id:'menu-controle-acesso-ntes', rota:'controle-acesso-ntes', icone:'⛔', rotulo:'Controle de Acesso dos NTEs', capacidade:'sistema.suspender_nte', perfis:['Master'] },
  { id:'menu-migracao-historica', rota:'migracao-historica', icone:'🧬', rotulo:'Migração Histórica', capacidade:'migracao.executar', perfis:['Master'] }
]);

const RELATORIOS = Object.freeze([
  ['operacional','📊','Operacional'],
  ['sla','⏱️','SLA'],
  ['pendencias','⏸️','Pendências'],
  ['produtividade','👥','Produtividade'],
  ['executivo','📈','Executivo']
]);

let navegacaoAutomatica = false;
let instalando = false;
let observer = null;
let alertaPlanoCache={valor:null,em:0};
let alertaApoioCache={valor:null,em:0};

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
  const modulo = MODULO_ROTA[chave] || null;
  if (modulo && window.SIGEE_MODULOS?.podeAcessar?.(modulo,u)!==true) {
    if (!silencioso) alert('Seu usuário não possui acesso ao módulo solicitado.');
    return false;
  }
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
  if(item.modulo && window.SIGEE_MODULOS?.podeAcessar?.(item.modulo,u)!==true) return false;
  const p = item.modulo
    ? (window.SIGEE_MODULOS?.perfilNoModulo?.(item.modulo,u) || perfil(u))
    : perfil(u);
  if(item.escopo==='NTE' && window.SIGEE_ESCOPO?.ehTerritorial?.(u)!==true) return false;
  const capacidadeOk = item.capacidade ? pode(item.capacidade, u) : true;
  return (!item.perfis || item.perfis.includes(p)) && capacidadeOk;
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
  const destaqueTecnico=item.destaque&&perfil(usuario())==='Técnico'?'sigee-menu-item-destaque':'';
  botao.className = `${classeMenu()} ${classeExtra} ${destaqueTecnico}`.trim();
  botao.dataset.sigeeRota = item.rota;
  if(item.area) botao.dataset.sigeeArea = item.area;
  botao.dataset.sigeeCapacidade = Array.isArray(item.capacidade) ? item.capacidade.join('|') : item.capacidade;
  let rotulo = item.rotulo;
  if (item.rota === 'painel') rotulo = 'Painel Gerencial';
  botao.textContent = `${item.icone} ${rotulo}`;
  if(item.id==='menu-plano-acao-tecnico'){
    const badge=document.createElement('span');badge.className='sigee-menu-alerta hidden';badge.dataset.planoAcaoAlerta='true';badge.setAttribute('aria-hidden','true');botao.appendChild(badge);
  }
  if(item.id==='menu-solicitacao-apoio-tecnico'){
    const badge=document.createElement('span');badge.className='sigee-menu-alerta hidden';badge.dataset.apoioAlerta='true';badge.setAttribute('aria-hidden','true');botao.appendChild(badge);
  }
  botao.addEventListener('click', () => {
    navegarPara(item.rota, { manual:true });
    if(item.rota==='legalizacao' && item.area){
      setTimeout(()=>window.SIGEE_LEGALIZACAO?.switchArea?.(item.area), 25);
    }
  });
  return botao;
}

function garantirEstiloNavegacaoModular(){
  if(document.getElementById('sigee-navegacao-modular-rc1201c')) return;
  const style=document.createElement('style');
  style.id='sigee-navegacao-modular-rc1201c';
  style.textContent=`
    .sigee-modulo-menu{margin:.2rem 0 .35rem;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:.25rem}
    .sigee-modulo-menu-title{width:100%;display:flex;align-items:center;gap:.55rem;padding:.72rem .9rem;border:0;background:transparent;color:#f8fafc;font-weight:800;text-align:left;cursor:pointer;border-radius:.65rem}
    .sigee-modulo-menu-title:hover{background:rgba(255,255,255,.07)}
    .sigee-modulo-menu-title .sigee-modulo-seta{margin-left:auto;font-size:.72rem;opacity:.8}
    .sigee-modulo-submenu{display:none;padding:.1rem 0 .35rem .58rem;margin-left:.72rem;border-left:2px solid rgba(148,163,184,.3)}
    .sigee-modulo-menu.open>.sigee-modulo-submenu{display:block}
    .sigee-modulo-submenu .sigee-menu-item{font-size:.82rem!important;font-weight:650!important;padding:.55rem .72rem!important;margin:.08rem 0!important;opacity:.96}
    .sigee-modulo-menu[data-modulo="LEGALIZACAO"]>.sigee-modulo-menu-title{color:#f8fafc}
    .sigee-submodulo-menu{margin:.18rem 0 .12rem}
    .sigee-submodulo-title{width:100%;display:flex;align-items:center;gap:.45rem;padding:.56rem .68rem;border:0;background:rgba(255,255,255,.035);color:#eef6ff;font-size:.82rem;font-weight:750;text-align:left;cursor:pointer;border-radius:.5rem}
    .sigee-submodulo-title:hover{background:rgba(255,255,255,.075)}
    .sigee-submodulo-title .sigee-submodulo-seta{margin-left:auto;font-size:.68rem;opacity:.8}
    .sigee-submodulo-submenu{display:none;margin:.12rem 0 .2rem .62rem;padding-left:.48rem;border-left:1px solid rgba(148,163,184,.3)}
    .sigee-submodulo-menu.open>.sigee-submodulo-submenu{display:block}
    body[data-sigee-perfil="Técnico"] #menu-plano-acao-tecnico.sigee-menu-item-destaque,
    body[data-sigee-perfil="Técnico"] #menu-solicitacao-apoio-tecnico.sigee-menu-item-destaque{
      display:flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;
      color:#fff!important;background:rgba(16,185,129,.2)!important;
      border-left:4px solid #34d399!important;font-weight:850!important;
      margin:.55rem 0!important;box-shadow:0 0 0 1px rgba(52,211,153,.28),0 8px 18px rgba(2,6,23,.12)!important;
    }
    body[data-sigee-perfil="Técnico"] #menu-plano-acao-tecnico.sigee-menu-item-destaque:hover,
    body[data-sigee-perfil="Técnico"] #menu-solicitacao-apoio-tecnico.sigee-menu-item-destaque:hover{
      background:rgba(16,185,129,.3)!important;
    }
    .sigee-menu-alerta{margin-left:auto;min-width:1.35rem;height:1.35rem;padding:0 .35rem;border-radius:999px;background:#ef4444;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:900;box-shadow:0 0 0 3px rgba(239,68,68,.18)}
    .sigee-menu-alerta.sem-pendencia{background:#64748b;box-shadow:none;color:#fff}
    .sigee-menu-alerta.indisponivel{background:#d97706;box-shadow:none;color:#fff}
  `;
  document.head.appendChild(style);
}

function criarGrupoModulo({id,icone,rotulo,itens,modulo,aberto=false}){
  const grupo=document.createElement('div');
  grupo.id=id;
  grupo.className='sigee-modulo-menu';
  grupo.dataset.modulo=modulo||'';
  if(aberto) grupo.classList.add('open');
  const titulo=document.createElement('button');
  titulo.type='button';
  titulo.className='sigee-modulo-menu-title';
  titulo.setAttribute('aria-expanded',aberto?'true':'false');
  titulo.innerHTML=`<span>${icone}</span><span>${rotulo}</span><span class="sigee-modulo-seta">${aberto?'▲':'▼'}</span>`;
  const submenu=document.createElement('div');
  submenu.className='sigee-modulo-submenu';
  itens.forEach(item=>submenu.appendChild(item.tipo==='relatorios'?criarGrupoRelatorios():criarBotao(item)));
  titulo.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const abrir=!grupo.classList.contains('open');
    grupo.classList.toggle('open',abrir);
    titulo.setAttribute('aria-expanded',String(abrir));
    titulo.querySelector('.sigee-modulo-seta').textContent=abrir?'▲':'▼';
  });
  grupo.append(titulo,submenu);
  return grupo;
}

function criarSubgrupoModulo({id,icone,rotulo,itens,aberto=false}){
  const grupo=document.createElement('div');
  grupo.id=id;
  grupo.className='sigee-submodulo-menu';
  if(aberto) grupo.classList.add('open');
  const titulo=document.createElement('button');
  titulo.type='button';
  titulo.className='sigee-submodulo-title';
  titulo.setAttribute('aria-expanded',aberto?'true':'false');
  titulo.innerHTML=`<span>${icone}</span><span>${rotulo}</span><span class="sigee-submodulo-seta">${aberto?'▲':'▼'}</span>`;
  const submenu=document.createElement('div');
  submenu.className='sigee-submodulo-submenu';
  itens.forEach(item=>submenu.appendChild(criarBotao(item)));
  titulo.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const abrir=!grupo.classList.contains('open');
    grupo.classList.toggle('open',abrir);
    titulo.setAttribute('aria-expanded',String(abrir));
    titulo.querySelector('.sigee-submodulo-seta').textContent=abrir?'▲':'▼';
  });
  grupo.append(titulo,submenu);
  return grupo;
}

function criarGrupoExtintas(itens,territorial){
  const grupo=criarGrupoModulo({id:'menu-modulo-extintas',icone:'🏫',rotulo:'Escolas Extintas',itens,modulo:'ESCOLAS_EXTINTAS',aberto:false});
  if(territorial.length){
    const submenu=grupo.querySelector(':scope > .sigee-modulo-submenu');
    const relatorios=submenu?.querySelector('#menu-relatorios-rc6501');
    const subterritorial=criarSubgrupoModulo({id:'menu-submodulo-territorial',icone:'🗺️',rotulo:'Gestão Territorial',itens:territorial,aberto:false});
    if(relatorios) submenu.insertBefore(subterritorial, relatorios);
    else submenu?.appendChild(subterritorial);
  }
  return grupo;
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
  titulo.innerHTML='📑 Relatórios de Extintas <span>▾</span>';
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

async function atualizarAlertaPlanoAcao(force=false){
  if(perfil(usuario())!=='Técnico')return;
  const botao=document.getElementById('menu-plano-acao-tecnico'),badge=botao?.querySelector('[data-plano-acao-alerta]');if(!botao||!badge)return;
  try{
    const agora=Date.now();let total=alertaPlanoCache.valor;
    if(force||total==null||agora-alertaPlanoCache.em>60000){total=await window.SIGEE_TERRITORIAL_PLANO_ACAO_SERVICE?.contarAbertas?.();alertaPlanoCache={valor:Number(total||0),em:agora};}
    total=Number(total||0);badge.textContent=total>99?'99+':String(total);badge.classList.remove('hidden','indisponivel');badge.classList.toggle('sem-pendencia',total===0);badge.setAttribute('aria-hidden','false');botao.title=total?`${total} ação(ões) pendente(s) para o seu NTE`:'Nenhuma ação pendente para o seu NTE';botao.setAttribute('aria-label',total?`Plano de Ação, ${total} pendente(s)`:'Plano de Ação, nenhuma pendência');
  }catch(err){console.warn('[Menu] alerta do Plano de Ação indisponível:',err?.message||err);badge.textContent='!';badge.classList.remove('hidden','sem-pendencia');badge.classList.add('indisponivel');badge.setAttribute('aria-hidden','false');botao.title='Não foi possível consultar as ações pendentes';}
}


async function atualizarAlertaApoio(force=false){
  if(perfil(usuario())!=='Técnico')return;
  const botao=document.getElementById('menu-solicitacao-apoio-tecnico'),badge=botao?.querySelector('[data-apoio-alerta]');if(!botao||!badge)return;
  try{
    const agora=Date.now();let total=alertaApoioCache.valor;
    if(force||total==null||agora-alertaApoioCache.em>60000){total=await window.SIGEE_TERRITORIAL_APOIO_SERVICE?.contarPendentes?.();alertaApoioCache={valor:Number(total||0),em:agora};}
    total=Number(total||0);badge.textContent=total>99?'99+':String(total);badge.classList.remove('hidden','indisponivel');badge.classList.toggle('sem-pendencia',total===0);badge.setAttribute('aria-hidden','false');botao.title=total?`${total} orientação(ões) aguardando sua ciência`:'Nenhuma orientação nova aguardando ciência';
  }catch(err){console.warn('[Menu] alerta de Apoio Territorial indisponível:',err?.message||err);badge.textContent='!';badge.classList.remove('hidden','sem-pendencia');badge.classList.add('indisponivel');badge.setAttribute('aria-hidden','false');}
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

function definirGrupoAberto(id, aberto){
  const grupo=document.getElementById(id);
  if(!grupo) return;
  grupo.classList.toggle('open', aberto===true);
  const titulo=grupo.querySelector(':scope > .sigee-modulo-menu-title, :scope > .sigee-submodulo-title');
  if(titulo){
    titulo.setAttribute('aria-expanded', String(aberto===true));
    const seta=titulo.querySelector('.sigee-modulo-seta, .sigee-submodulo-seta');
    if(seta) seta.textContent=aberto===true?'▲':'▼';
  }
}
function sincronizarContextoMenu(rota){
  const chave=String(rota||'').trim();
  const legalizacao = chave==='legalizacao';
  const territorial = chave==='gestao-territorial' || chave==='plano-acao-territorial' || chave==='solicitacao-apoio-territorial';
  const extintas = territorial || ['processos','escolas','painel','relatorios','sala-situacao','centro-inteligencia','nova-solicitacao'].includes(chave);
  if(legalizacao){
    definirGrupoAberto('menu-modulo-legalizacao',true);
    definirGrupoAberto('menu-modulo-extintas',false);
    definirGrupoAberto('menu-submodulo-territorial',false);
  } else if(extintas){
    definirGrupoAberto('menu-modulo-legalizacao',false);
    definirGrupoAberto('menu-modulo-extintas',true);
    definirGrupoAberto('menu-submodulo-territorial',territorial);
  }
}

function garantirTelaDiagnostico(){
  let aba=document.getElementById('aba-diagnostico');
  if(aba)return aba;
  const main=document.querySelector('#sistema-dashboard main'); if(!main)return null;
  aba=document.createElement('section'); aba.id='aba-diagnostico'; aba.className='hidden space-y-5';
  aba.innerHTML=`<header class="sigee-admin-page-head"><div><span>ADMINISTRAÇÃO</span><h1>Centro de Diagnóstico</h1><p>Verificação dos componentes, conectividade e integração operacional do SIGEE.</p></div><button type="button" id="btn-atualizar-diagnostico">↻ Atualizar diagnóstico</button></header><section id="diagnostico-resumo" class="bg-white rounded-xl border shadow-sm p-5"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><article><small>Status geral</small><strong id="diag-status-geral">Aguardando</strong></article><article><small>Última atualização</small><strong id="diag-atualizado">—</strong></article><article><small>Conectividade</small><strong id="diag-conectividade">—</strong></article><article><small>Processos</small><strong id="diag-processos">0</strong></article><article><small>Escolas</small><strong id="diag-escolas">0</strong></article><article><small>Usuários</small><strong id="diag-usuarios">0</strong></article><article><small>Tempo de cálculo</small><strong id="diag-tempo-calculo">—</strong></article><article><small>Última sincronização</small><strong id="diag-ultima-sync">—</strong></article></div></section><section id="diag-componentes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></section>`;
  main.appendChild(aba); aba.querySelector('#btn-atualizar-diagnostico')?.addEventListener('click',()=>window.atualizarDiagnosticoSIGEE?.(true)); return aba;
}
function mostrarElemento(el, visivel, displayVisivel=''){
  if(!el)return;
  const permitido=visivel===true;
  el.classList.toggle('hidden', !permitido);
  el.hidden = !permitido;
  el.setAttribute('aria-hidden', permitido ? 'false' : 'true');
  el.style.setProperty('display', permitido ? displayVisivel : 'none', 'important');
  el.style.setProperty('visibility', permitido ? 'visible' : 'hidden', 'important');
  el.style.setProperty('opacity', permitido ? '1' : '0', 'important');
  el.style.setProperty('pointer-events', permitido ? 'auto' : 'none', 'important');
  if('disabled' in el) el.disabled = !permitido;
}
function garantirEstiloControlesAutoritativos(){
  if(document.getElementById('sigee-controles-autoritativos-rc910'))return;
  const style=document.createElement('style');
  style.id='sigee-controles-autoritativos-rc910';
  style.textContent=`
    body[data-sigee-processos-criar="true"] #btn-nova-solicitacao,
    body[data-sigee-processos-criar="true"] [data-acao="nova-solicitacao"]{
      display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;
    }
    body[data-sigee-processos-criar="false"] #btn-nova-solicitacao,
    body[data-sigee-processos-criar="false"] [data-acao="nova-solicitacao"]{
      display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;
    }
  `;
  document.head.appendChild(style);
}
function aplicarControlesCatalogo(){
  const moduloOk = window.SIGEE_MODULOS?.podeAcessar?.('ESCOLAS_EXTINTAS',usuario())===true;
  const podeCadastrar = moduloOk && pode('escolas.editar_cadastral');
  const podeImportar = moduloOk && pode('escolas.importar');
  const podeExportar = moduloOk && pode('escolas.exportar');
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
  // Fonte única: matriz oficial de capacidades e sessão já resolvida.
  const autorizado = window.SIGEE_MODULOS?.podeAcessar?.('ESCOLAS_EXTINTAS',usuario())===true && pode('processos.criar') === true;
  garantirEstiloControlesAutoritativos();
  if(document.body) document.body.dataset.sigeeProcessosCriar = autorizado ? 'true' : 'false';

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
  if(botao){
    botao.dataset.sigeeAutoridadeAcao='processos.criar';
    mostrarElemento(botao, autorizado, 'flex');
  }
}
function aplicarControlesExportacao(){
  const podeExportar = window.SIGEE_MODULOS?.podeAcessar?.('ESCOLAS_EXTINTAS',usuario())===true && pode('relatorios.exportar');
  document.querySelectorAll(
    '#aba-processos .export-only, #aba-processos button[onclick*="exportar"], ' +
    '#aba-processos [data-sigee-acao="exportar"], #aba-processos [id*="exportar"]'
  ).forEach(el=>mostrarElemento(el,podeExportar));
}
function aplicarControlesDaInterface(){
  const u=usuario();
  const extintasOk=window.SIGEE_MODULOS?.podeAcessar?.('ESCOLAS_EXTINTAS',u)===true;
  const legalizacaoOk=window.SIGEE_MODULOS?.podeAcessar?.('LEGALIZACAO',u)===true;
  // Defesa em profundidade: mesmo que um script legado tente reexibir uma seção,
  // o domínio sem vínculo permanece oculto. A navegação já é bloqueada por autorizarRota().
  const secoesExtintas=['aba-processos','aba-escolas','aba-painel','aba-sala-situacao','aba-gestao-territorial','aba-plano-acao-territorial'];
  if(!extintasOk){
    secoesExtintas.forEach(id=>{const el=document.getElementById(id); if(el){el.classList.add('hidden');el.hidden=true;}});
  }
  if(!legalizacaoOk){
    const el=document.getElementById('aba-legalizacao'); if(el){el.classList.add('hidden');el.hidden=true;}
  }
  aplicarControlesCatalogo();
  garantirNovaSolicitacaoNaCentral();
  aplicarControlesExportacao();
}
function removerMenusLegadosSoltos(nav){
  if(!nav) return;
  // RC12.0.1C: relatório não pode existir como domínio de primeiro nível.
  // Remove somente ocorrências soltas; relatórios aninhados no módulo permanecem.
  nav.querySelectorAll(':scope > #menu-relatorios-rc6501, :scope > #menu-relatorios, :scope > .sig-rel-menu').forEach(el=>el.remove());
  // Remove grupos territoriais legados de primeiro nível. A Gestão Territorial pertence a Escolas Extintas.
  nav.querySelectorAll(':scope > #menu-modulo-territorial, :scope > #menu-gestao-territorial-grupo').forEach(el=>el.remove());
}

function renderizarMenu(){
  const u = usuario();
  const nav = containerMenu();
  if (!u || !nav) return false;
  garantirEstiloNavegacaoModular();
  removerMenusLegadosSoltos(nav);
  const legalizacao = MENU_LEGALIZACAO.filter(item => itemPermitido(item, u));
  const extintas = MENU_EXTINTAS.filter(item => itemPermitido(item, u));
  const destaques = MENU_DESTAQUES.filter(item => itemPermitido(item, u));
  const territorial = MENU_GESTAO_TERRITORIAL.filter(item => itemPermitido(item, u));
  const administrativos = MENU_ADMIN.filter(item => itemPermitido(item, u));
  const assinatura = `RC12.0.10A.9|${perfil(u)}|LEG:${legalizacao.map(i=>i.id).join(',')}|EXT:${extintas.map(i=>i.id).join(',')}|DESTAQUES:${destaques.map(i=>i.id).join(',')}|GT:${territorial.map(i=>i.id).join(',')}|ADMIN:${administrativos.map(i=>i.id).join(',')}`;
  const precisaRelatorios = extintas.some(i=>i.tipo==='relatorios');
  const estruturaIntegra = nav.dataset.sigeeMenuAssinatura === assinatura &&
    (!legalizacao.length || document.getElementById('menu-modulo-legalizacao')) &&
    (!extintas.length || document.getElementById('menu-modulo-extintas')) &&
    (!destaques.length || document.getElementById('menu-plano-acao-tecnico')?.parentElement===nav) &&
    (!territorial.length || document.getElementById('menu-submodulo-territorial')) &&
    (!precisaRelatorios || document.getElementById('menu-relatorios-rc6501')) &&
    (!administrativos.length || (document.getElementById('menu-administrativo-grupo') && document.getElementById('submenu-administracao')));
  if (estruturaIntegra) {
    atualizarIdentidade();
    aplicarControlesDaInterface();
    atualizarAlertaPlanoAcao(false);
    atualizarAlertaApoio(false);
    return true;
  }
  instalando = true;
  const fragment=document.createDocumentFragment();
  if(legalizacao.length) fragment.appendChild(criarGrupoModulo({id:'menu-modulo-legalizacao',icone:'⚖️',rotulo:'Legalização Escolar',itens:legalizacao,modulo:'LEGALIZACAO',aberto:false}));
  if(extintas.length) fragment.appendChild(criarGrupoExtintas(extintas,territorial));
  destaques.forEach(item=>fragment.appendChild(criarBotao(item,'sigee-menu-item-principal')));
  if(administrativos.length) fragment.appendChild(criarGrupoAdministrativo(administrativos));
  nav.replaceChildren(fragment);
  nav.dataset.sigeeMenuAssinatura = assinatura;
  instalando = false;
  atualizarIdentidade();
  // RC12.0.1D: módulos iniciam recolhidos; somente navegação do usuário expande o contexto.
  aplicarControlesDaInterface();
  atualizarAlertaPlanoAcao(false);
  atualizarAlertaApoio(false);
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
    'migracao-historica':'aba-migracao-historica', 'gestao-territorial':'aba-gestao-territorial', 'plano-acao-territorial':'aba-plano-acao-territorial', legalizacao:'aba-legalizacao'
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
  document.dispatchEvent(new CustomEvent('sigee:navegacao-concluida',{detail:{rota,origem:'autorizacao-rc743'}}));
}
function primeiraRota(u=usuario()){
  const temExtintas = window.SIGEE_MODULOS?.podeAcessar?.('ESCOLAS_EXTINTAS',u)===true;
  const temLegalizacao = window.SIGEE_MODULOS?.podeAcessar?.('LEGALIZACAO',u)===true;
  // Compatibilidade: usuários atuais permanecem iniciando em Processos.
  // Usuário exclusivo de Legalização entra diretamente no novo módulo.
  if (temExtintas && pode('processos.visualizar',u)) return 'processos';
  if (temLegalizacao) return 'legalizacao';
  if (temExtintas && pode('relatorios.visualizar',u)) return 'relatorios';
  if (temExtintas && pode('escolas.visualizar',u)) return 'escolas';
  return '';
}
function aplicarRotaInicialForcada(){
  const u = usuario();
  if(!u)return false;
  const destino = primeiraRota(u);
  if(!destino)return false;
  navegarPara(destino,{silencioso:true,inicial:true});
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
  if(opcoes.inicial !== true) sincronizarContextoMenu(rota);
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

  if (rota === 'legalizacao') {
    if(window.SIGEE_LEGALIZACAO?.abrir) return window.SIGEE_LEGALIZACAO.abrir();
    alert('O módulo Legalização Escolar ainda não concluiu o carregamento.');
    return false;
  }

  if (rota === 'plano-acao-territorial') {
    if(window.SIGEE_TERRITORIAL_PLANO_ACAO?.abrir) return window.SIGEE_TERRITORIAL_PLANO_ACAO.abrir();
    alert('O Plano de Ação Territorial ainda não concluiu o carregamento.');
    return false;
  }

  if (rota === 'solicitacao-apoio-territorial') {
    if(window.SIGEE_TERRITORIAL_APOIO?.abrir) return window.SIGEE_TERRITORIAL_APOIO.abrir();
    alert('A Solicitação de Apoio Territorial ainda não concluiu o carregamento.');
    return false;
  }

  if (rota === 'gestao-territorial') {
    if(window.SIGEE_GESTAO_TERRITORIAL?.abrir) return window.SIGEE_GESTAO_TERRITORIAL.abrir();
    alert('A Central de Gestão Territorial ainda não concluiu o carregamento.');
    return false;
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
    sincronizarContextoMenu(rota);

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
        requestAnimationFrame(() => aplicarControlesDaInterface());
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

function observarCentral(){
  const central=document.getElementById('aba-processos');
  if(!central || central.dataset.sigeeControleObserver==='1') return;
  central.dataset.sigeeControleObserver='1';
  let agendado=0;
  let corrigindo=false;
  const reconciliar=()=>{
    if(corrigindo)return;
    corrigindo=true;
    try{
      if(usuario()) garantirNovaSolicitacaoNaCentral();
    }finally{
      queueMicrotask(()=>{corrigindo=false;});
    }
  };
  const obs=new MutationObserver((mutacoes)=>{
    const relevante=mutacoes.some(m=>{
      if(m.type==='childList')return true;
      const alvo=m.target;
      return alvo?.id==='btn-nova-solicitacao' || alvo?.matches?.('[data-acao="nova-solicitacao"]');
    });
    if(!relevante)return;
    clearTimeout(agendado);
    agendado=setTimeout(reconciliar,20);
  });
  obs.observe(central,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','disabled','aria-hidden']});
}
function iniciar(){
  garantirEstiloControlesAutoritativos();
  instalarNavegacao();
  instalarLogin();
  renderizarMenu();
  observarCentral();
  aplicarControlesDaInterface();
}

document.addEventListener('DOMContentLoaded', iniciar, { once:true });
document.addEventListener('sigee:usuario-logado', () => setTimeout(() => {
  renderizarMenu();
  aplicarRotaInicialForcada();
  requestAnimationFrame(() => aplicarControlesDaInterface());
}, 0));
window.addEventListener('sigee:session-ready', () => setTimeout(() => {
  iniciar();
  renderizarMenu();
  aplicarRotaInicialForcada();
  requestAnimationFrame(() => aplicarControlesDaInterface());
}, 0));
window.addEventListener('sigee:login-concluido', () => {
  setTimeout(() => { iniciar(); aplicarControlesDaInterface(); }, 0);
});
document.addEventListener('sigee:gt-plano-acao-atualizado',()=>{alertaPlanoCache={valor:null,em:0};atualizarAlertaPlanoAcao(true);});
document.addEventListener('sigee:gt-apoio-atualizado',()=>{alertaApoioCache={valor:null,em:0};atualizarAlertaApoio(true);});
window.addEventListener('load', () => setTimeout(iniciar, 50));

window.SIGEE_AUTORIZACAO = Object.freeze({
  usuario, perfil, pode, rotaCanonica, capacidadeRota, autorizarRota,
  aplicarMenus:renderizarMenu, renderizarMenu, primeiraRota, aplicarRotaInicialForcada,
  navegarPara, garantirRotaVisivel, protegerNavegacao:instalarNavegacao, instalarLogin,
  exigir:(cap,mensagem)=>pode(cap)||((mensagem!==false)&&alert(mensagem||'Ação não autorizada.'),false)
});
})(window, document);
