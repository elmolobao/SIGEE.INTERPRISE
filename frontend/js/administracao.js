/* SIGEE Sprint 2.4.4 — Administração */
(function(){
  'use strict';
  if(window.__SIGEE_ADMIN_244__)return;
  window.__SIGEE_ADMIN_244__=true;

  function bloco(){return document.getElementById('menu-administracao-bloco')}
  function submenu(){return document.getElementById('submenu-administracao')}
  function seta(){return document.getElementById('admin-menu-seta')}

  function sincronizarPermissao(){
    const botao=document.getElementById('menu-logs');
    const b=bloco();
    if(!botao||!b)return;
    const permitido=!botao.classList.contains('hidden');
    b.classList.toggle('hidden',!permitido);
    if(permitido)botao.classList.remove('hidden');
  }

  window.toggleMenuAdministracaoSIGEE=function(forcar){
    const sub=submenu();if(!sub)return;
    const abrir=typeof forcar==='boolean'?forcar:sub.classList.contains('hidden');
    sub.classList.toggle('hidden',!abrir);
    if(seta())seta().textContent=abrir?'▴':'▾';
  };

  window.abrirAdministracaoSIGEE=function(secao){
    window.toggleMenuAdministracaoSIGEE(true);
    if(secao==='historico'){
      if(typeof window.navegar==='function')window.navegar('logs');
      return;
    }
    if(secao==='diagnostico'){
      document.querySelectorAll('main > section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));
      document.getElementById('aba-diagnostico')?.classList.remove('hidden');
      window.atualizarDiagnosticoSIGEE?.();
    }
  };

  const obs=new MutationObserver(sincronizarPermissao);
  document.addEventListener('DOMContentLoaded',()=>{
    const botao=document.getElementById('menu-logs');
    if(botao)obs.observe(botao,{attributes:true,attributeFilter:['class']});
    setTimeout(sincronizarPermissao,100);
  });
  window.addEventListener('load',()=>setTimeout(sincronizarPermissao,500));
  console.info('[SIGEE] Administração 2.4.4 carregada.');
})();
