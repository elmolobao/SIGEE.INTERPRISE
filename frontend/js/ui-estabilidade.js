/* SIGEE 3.6.0 — Estabilidade de navegação e interface
   - uma única aba visível por vez;
   - impede sincronizações de abrirem Usuários sozinhas;
   - restaura menu do Master sem intervalos/observers;
   - não executa consultas nem sincronizações. */
(function(){
  'use strict';
  if(window.__SIGEE_UI_ESTABILIDADE_360__) return;
  window.__SIGEE_UI_ESTABILIDADE_360__=true;

  const MAPA={painel:'aba-painel',processos:'aba-processos',escolas:'aba-escolas',usuarios:'aba-usuarios',logs:'aba-logs','sala-situacao':'aba-sala-situacao',inteligencia:'aba-inteligencia','centro-inteligencia':'aba-inteligencia',diagnostico:'aba-diagnostico'};
  let ultimoCliqueUsuarios=0;

  function normalizar(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
  function perfilAtual(){return normalizar(window.usuarioLogado?.perfil || document.getElementById('user-perfil')?.textContent);}
  function master(){return perfilAtual().includes('MASTER');}

  function exibir(el,sim){
    if(!el)return;
    el.hidden=!sim;
    el.classList.toggle('hidden',!sim);
    el.style.removeProperty('display');
    if(!sim) el.style.setProperty('display','none','important');
    el.setAttribute('aria-hidden',sim?'false':'true');
  }

  function aplicarMenu(){
    const p=perfilAtual(); if(!p)return;
    const isMaster=p.includes('MASTER'), isSec=p==='SEC'||p.includes('SECRETARIA'), isGestor=p.includes('GESTOR'), isAdmin=p.includes('ADMIN');
    exibir(document.getElementById('menu-central-processos'),true);
    exibir(document.getElementById('menu-escolas'),true);
    exibir(document.getElementById('menu-usuarios'),isMaster);
    exibir(document.getElementById('menu-relatorios'),isMaster||isSec||isGestor||isAdmin);
    exibir(document.getElementById('menu-sala-situacao'),isMaster||isSec||isGestor);
    exibir(document.getElementById('menu-logs'),isMaster);
  }

  function ocultarAbas(){
    document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]').forEach(sec=>{
      sec.classList.add('hidden'); sec.hidden=true; sec.setAttribute('aria-hidden','true');
      sec.style.setProperty('display','none','important');
    });
  }

  function pos(aba){
    try{
      if(aba==='painel') window.carregarDadosDashboardReal?.();
      else if(aba==='processos') window.carregarEContarProcessosHorizontais?.();
      else if(aba==='escolas') window.renderizarListaEscolasBufferMemoria?.();
      else if(aba==='usuarios') window.carregarListaUsuarios?.();
      else if(aba==='logs') window.carregarLogs?.();
      else if(aba==='sala-situacao') window.SIGEE_SALA_SITUACAO?.render?.();
    }catch(e){console.warn('[SIGEE UI] pós-navegação:',e);}
  }

  function navegarEstavel(aba){
    const chave=String(aba||'').trim().toLowerCase();
    if(chave==='usuarios' && Date.now()-ultimoCliqueUsuarios>1200){
      console.warn('[SIGEE UI] navegação automática para Usuários bloqueada.');
      return false;
    }
    const alvo=document.getElementById(MAPA[chave]||('aba-'+chave));
    if(!alvo)return false;
    ocultarAbas();
    alvo.hidden=false; alvo.classList.remove('hidden'); alvo.style.removeProperty('display'); alvo.setAttribute('aria-hidden','false');
    document.querySelectorAll('.sigee-sidebar-nav button').forEach(b=>{b.classList.remove('sigee-menu-ativo');b.removeAttribute('aria-current');});
    const menu=document.querySelector(`.sigee-sidebar-nav button[onclick*="'${chave}'"],.sigee-sidebar-nav button[onclick*='"${chave}"']`);
    if(menu){menu.classList.add('sigee-menu-ativo');menu.setAttribute('aria-current','page');}
    pos(chave); return true;
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('#menu-usuarios');
    if(btn && e.isTrusted) ultimoCliqueUsuarios=Date.now();
  },true);

  function instalar(){
    aplicarMenu();
    window.navegar=navegarEstavel;
    try{navegar=navegarEstavel;}catch(_){ }
    window.SIGEE_NAVIGATION={...(window.SIGEE_NAVIGATION||{}),navegar:navegarEstavel,install:instalar,version:'3.6.0'};
    const visiveis=[...document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]')].filter(s=>!s.classList.contains('hidden')&&!s.hidden);
    if(visiveis.length>1){
      const manter=visiveis.find(s=>s.id==='aba-processos')||visiveis[0]; ocultarAbas(); manter.hidden=false; manter.classList.remove('hidden'); manter.style.removeProperty('display');
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
  window.addEventListener('sigee:login-concluido',instalar);
  document.addEventListener('sigee:usuario-logado',instalar);
})();
