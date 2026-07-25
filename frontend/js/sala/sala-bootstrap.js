/* SIGEE Enterprise RC6.4.0.1 — Hotfix de inicialização da Sala de Situação 2.0 */
(function(){
  'use strict';
  const VERSION='RC6.4.0.1';
  const scripts=[
    {src:'js/sala/sala-data.service.js?v='+VERSION, pronto:()=>!!window.SIGEE_SALA_DATA?.carregar},
    {src:'js/sala/sala-engine.js?v='+VERSION, pronto:()=>!!window.SIGEE_SALA_ENGINE?.analisar},
    {src:'js/sala/sala-dashboard.js?v='+VERSION, pronto:()=>!!window.SIGEE_SALA_2?.abrir}
  ];
  let promise=null;

  function aguardar(pronto, limite=8000){
    const inicio=Date.now();
    return new Promise((resolve,reject)=>{
      (function verificar(){
        if(pronto()) return resolve(true);
        if(Date.now()-inicio>=limite) return reject(new Error('Módulo da Sala 2.0 não inicializou no tempo esperado.'));
        setTimeout(verificar,40);
      })();
    });
  }

  function carregarScript(item){
    if(item.pronto()) return Promise.resolve();
    const seletor='script[data-sala-modulo="'+item.src.split('?')[0]+'"]';
    const anterior=document.querySelector(seletor);
    if(anterior) anterior.remove();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=item.src;
      s.async=false;
      s.dataset.salaModulo=item.src.split('?')[0];
      s.onload=()=>aguardar(item.pronto).then(resolve,reject);
      s.onerror=()=>reject(new Error('Falha ao carregar '+item.src));
      document.body.appendChild(s);
    });
  }

  async function ensure(){
    const completo=window.SIGEE_SALA_DATA?.carregar && window.SIGEE_SALA_ENGINE?.analisar && window.SIGEE_SALA_2?.abrir;
    if(completo) return window.SIGEE_SALA_2;
    if(!promise){
      promise=(async()=>{
        for(const item of scripts) await carregarScript(item);
        if(!window.SIGEE_SALA_DATA?.carregar) throw new Error('Serviço de dados da Sala 2.0 indisponível.');
        if(!window.SIGEE_SALA_ENGINE?.analisar) throw new Error('Motor analítico da Sala 2.0 indisponível.');
        if(!window.SIGEE_SALA_2?.abrir) throw new Error('Interface da Sala 2.0 indisponível.');
        return window.SIGEE_SALA_2;
      })().catch(e=>{promise=null;throw e;});
    }
    return promise;
  }

  async function open(){
    try{
      const app=await ensure();
      await app.abrir();
    }catch(e){
      console.error('[SIGEE Sala 2.0]',e);
      const c=document.getElementById('sala2-content');
      if(c) c.innerHTML='<div class="sala2-error">Falha ao inicializar a Sala de Situação 2.0.<br><small>'+String(e.message||e)+'</small></div>';
      else alert('Não foi possível carregar a Sala de Situação 2.0. Consulte o console.');
    }
  }

  function bind(){
    const menu=document.getElementById('menu-sala-situacao');
    if(!menu||menu.dataset.sala6401)return;
    menu.dataset.sala6401='1';
    menu.addEventListener('click',()=>setTimeout(open,80),true);
  }
  const obs=new MutationObserver(bind);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.SIGEE_SALA_BOOTSTRAP={version:VERSION,abrir:open,ensure};
  console.info('[SIGEE RC6.4.0.1] Sala de Situação 2.0 com inicialização protegida.');
})();
