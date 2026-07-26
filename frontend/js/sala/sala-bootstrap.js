/* SIGEE Enterprise RC6.4.0.3 — Bootstrap definitivo da Sala de Situação 2.0 */
(function(){
  'use strict';
  if(window.__SIGEE_SALA_6402__) return;
  window.__SIGEE_SALA_6402__=true;
  const VERSION='RC6.4.0.3';
  let runtimePromise=null;

  function carregarRuntime(){
    if(window.SIGEE_SALA_2?.abrir) return Promise.resolve(window.SIGEE_SALA_2);
    if(runtimePromise) return runtimePromise;
    runtimePromise=new Promise((resolve,reject)=>{
      const old=document.querySelector('script[data-sala-runtime]');
      if(old) old.remove();
      const s=document.createElement('script');
      s.src='js/sala/sala-runtime.js?v='+VERSION;
      s.async=false;
      s.dataset.salaRuntime=VERSION;
      s.onload=()=>window.SIGEE_SALA_2?.abrir
        ? resolve(window.SIGEE_SALA_2)
        : reject(new Error('Runtime da Sala 2.0 carregou sem disponibilizar a interface.'));
      s.onerror=()=>reject(new Error('Falha ao carregar js/sala/sala-runtime.js'));
      document.body.appendChild(s);
    }).catch(e=>{runtimePromise=null;throw e;});
    return runtimePromise;
  }

  function mostrarErro(e){
    console.error('[SIGEE Sala 2.0 RC6.4.0.3]',e);
    const sec=document.getElementById('aba-sala-situacao');
    if(!sec) return;
    sec.classList.remove('hidden');
    sec.innerHTML='<div class="sala2-root"><header class="sala2-hero"><div><small>CENTRO DE OPERAÇÕES</small><h1>Sala de Situação 2.0</h1><p>Monitoramento territorial, alertas e resposta rápida da operação.</p></div></header><div class="sala2-error"><strong>Não foi possível inicializar a Sala 2.0.</strong><br><small>'+String(e?.message||e)+'</small><br><button id="sala2-tentar-novamente">Tentar novamente</button></div></div>';
    sec.querySelector('#sala2-tentar-novamente')?.addEventListener('click',abrir);
  }

  async function abrir(){
    try{
      const app=await carregarRuntime();
      await app.abrir();
      setTimeout(()=>app.restaurar?.(),250);
      setTimeout(()=>app.restaurar?.(),1000);
    }catch(e){mostrarErro(e);}
  }

  function interceptar(e){
    const qualquerMenu=e.target?.closest?.('.menu-item,.menu-link,[id^="menu-"]');
    const menu=e.target?.closest?.('#menu-sala-situacao');
    if(!menu){
      if(qualquerMenu) window.SIGEE_SALA_2?.desativar?.();
      return;
    }
    // Impede qualquer controlador legado de renderizar depois da Sala 2.0.
    e.preventDefault();
    e.stopImmediatePropagation();
    document.querySelectorAll('main section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));
    document.getElementById('aba-sala-situacao')?.classList.remove('hidden');
    document.querySelectorAll('.menu-item.active,.menu-link.active').forEach(x=>x.classList.remove('active'));
    menu.classList.add('active');
    abrir();
  }

  document.addEventListener('click',interceptar,true);
  window.SIGEE_SALA_BOOTSTRAP={version:VERSION,abrir,recarregar:()=>{runtimePromise=null;return abrir();}};
  console.info('[SIGEE RC6.4.0.3] Sala de Situação 2.0 em runtime único; módulo legado isolado.');
})();
