/* SIGEE Enterprise RC6.4.0 — Sala de Situação 2.0 (bootstrap sob demanda) */
(function(){
  'use strict';
  if(window.__SIGEE_SALA_640__) return;
  window.__SIGEE_SALA_640__=true;
  const VERSION='RC6.4.0';
  const scripts=[
    'js/sala/sala-data.service.js?v='+VERSION,
    'js/sala/sala-engine.js?v='+VERSION,
    'js/sala/sala-dashboard.js?v='+VERSION
  ];
  let promise=null;
  function load(src){return new Promise((ok,fail)=>{if(document.querySelector(`script[data-sala-src="${src}"]`))return ok();const s=document.createElement('script');s.src=src;s.async=false;s.dataset.salaSrc=src;s.onload=ok;s.onerror=()=>fail(new Error('Falha ao carregar '+src));document.body.appendChild(s);});}
  async function ensure(){
    if(window.SIGEE_SALA_2?.abrir) return window.SIGEE_SALA_2;
    if(!promise) promise=(async()=>{for(const src of scripts) await load(src);return window.SIGEE_SALA_2;})().catch(e=>{promise=null;throw e;});
    return promise;
  }
  async function open(){
    try{const app=await ensure();await app?.abrir?.();}
    catch(e){console.error('[SIGEE Sala 2.0]',e);alert('Não foi possível carregar a Sala de Situação 2.0. Consulte o console.');}
  }
  function bind(){
    const menu=document.getElementById('menu-sala-situacao');
    if(!menu||menu.dataset.sala640)return;
    menu.dataset.sala640='1';
    menu.addEventListener('click',()=>setTimeout(open,80),true);
  }
  const obs=new MutationObserver(bind);obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.SIGEE_SALA_BOOTSTRAP={version:VERSION,abrir:open};
  console.info('[SIGEE RC6.4.0] Sala de Situação 2.0 em modo sob demanda.');
})();
