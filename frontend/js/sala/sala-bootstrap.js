/* SIGEE Enterprise RC6.4.1 — Integração oficial da Sala 2.0 ao sistema de abas */
(function(){
  'use strict';
  if(window.__SIGEE_SALA_641__) return;
  window.__SIGEE_SALA_641__=true;
  const VERSION='RC6.4.1';
  let runtimePromise=null;

  function carregarRuntime(){
    if(window.SIGEE_SALA_2?.abrir) return Promise.resolve(window.SIGEE_SALA_2);
    if(runtimePromise) return runtimePromise;
    runtimePromise=new Promise((resolve,reject)=>{
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

  async function abrir(){
    try{
      const app=await carregarRuntime();
      await app.abrir();
    }catch(e){
      console.error('[SIGEE Sala 2.0 RC6.4.1]',e);
      const sec=document.getElementById('aba-sala-situacao');
      if(sec){
        sec.innerHTML='<div class="sala2-root"><div class="sala2-error"><strong>Não foi possível inicializar a Sala 2.0.</strong><br><small>'+String(e?.message||e)+'</small><br><button id="sala2-tentar-novamente">Tentar novamente</button></div></div>';
        sec.querySelector('#sala2-tentar-novamente')?.addEventListener('click',abrir);
      }
    }
  }

  function isMenuSala(el){
    const item=el?.closest?.('button,a,.menu-item,.menu-link,[role="button"]');
    if(!item) return false;
    const id=(item.id||'').toLowerCase();
    const text=(item.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    return id.includes('sala-situacao') || text.includes('sala de situacao');
  }

  // Não disputa com a navegação oficial. Aguarda a aba oficial ser ativada e então renderiza.
  document.addEventListener('click',function(e){
    if(!isMenuSala(e.target)) return;
    setTimeout(abrir,0);
    setTimeout(()=>window.SIGEE_SALA_2?.garantirVisivel?.(),120);
  },false);

  // API pública para controladores existentes chamarem diretamente.
  window.SIGEE_SALA_BOOTSTRAP={version:VERSION,abrir,recarregar:()=>{runtimePromise=null;return abrir();}};
  console.info('[SIGEE RC6.4.1] Sala 2.0 integrada à aba oficial do SIGEE.');
})();
