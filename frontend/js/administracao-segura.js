(function(){
  'use strict';
  if(window.__SIGEE_ADMIN_244A__) return;
  window.__SIGEE_ADMIN_244A__=true;

  let montado=false;

  function autenticado(){
    const login=document.getElementById('tela-login');
    const sistema=document.getElementById('sistema-dashboard');
    return !!window.usuarioLogado && !!sistema && sistema.classList.contains('hidden')===false &&
      (!login || login.classList.contains('hidden'));
  }

  function permitido(){
    const perfil=String(window.usuarioLogado?.perfil||'').toUpperCase();
    return perfil.includes('MASTER') || perfil.includes('ADMIN');
  }

  function criarDiagnostico(){
    if(document.getElementById('aba-diagnostico')) return;
    const main=document.querySelector('#sistema-dashboard main');
    if(!main) return;

    const sec=document.createElement('section');
    sec.id='aba-diagnostico';
    sec.className='hidden sigee-diagnostico space-y-5';
    sec.innerHTML=`
      <header class="sigee-admin-page-head">
        <div><span>ADMINISTRAÇÃO</span><h1>Centro de Diagnóstico</h1><p>Saúde, integração e desempenho dos componentes do SIGEE.</p></div>
        <button type="button" id="btn-atualizar-diagnostico">↻ Atualizar diagnóstico</button>
      </header>
      <div id="diagnostico-resumo" class="sigee-diagnostico-resumo">
        <div class="sigee-diag-indicador"><i></i><div><strong id="diag-status-geral">Verificando...</strong><span id="diag-atualizado">Aguardando análise</span></div></div>
        <div><span>Versão instalada</span><strong>2.4.4A</strong></div>
        <div><span>Ambiente</span><strong>Vercel + Supabase</strong></div>
      </div>
      <div class="sigee-diag-grid" id="diag-componentes"></div>
      <div class="sigee-diag-metricas">
        <article><span>Processos em memória</span><strong id="diag-processos">0</strong><small>processosDB</small></article>
        <article><span>Escolas em memória</span><strong id="diag-escolas">0</strong><small>escolasDB</small></article>
        <article><span>Usuários em memória</span><strong id="diag-usuarios">0</strong><small>usuariosDB</small></article>
        <article><span>Tempo do cálculo</span><strong id="diag-tempo-calculo">—</strong><small>Motor Analítico</small></article>
        <article><span>Última sincronização</span><strong id="diag-ultima-sync">—</strong><small>Dados locais</small></article>
        <article><span>Conectividade</span><strong id="diag-conectividade">—</strong><small>Navegador</small></article>
      </div>`;
    main.appendChild(sec);
    document.getElementById('btn-atualizar-diagnostico')?.addEventListener('click',()=>window.atualizarDiagnosticoSIGEE?.(true));
  }

  function montarMenu(){
    if(montado || !autenticado() || !permitido()) return;

    const botaoLogs=document.getElementById('menu-logs');
    if(!botaoLogs || botaoLogs.dataset.adminConvertido==='1') return;

    criarDiagnostico();

    const nav=botaoLogs.parentElement;
    const bloco=document.createElement('div');
    bloco.id='menu-administracao-bloco';
    bloco.className='sigee-admin-menu';

    const principal=document.createElement('button');
    principal.type='button';
    principal.className='sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer flex items-center justify-between';
    principal.innerHTML='<span>⚙️ Administração</span><span id="admin-menu-seta">▾</span>';

    const submenu=document.createElement('div');
    submenu.id='submenu-administracao';
    submenu.className='hidden sigee-admin-submenu';
    submenu.innerHTML=`
      <button type="button" data-admin="historico">📝 Histórico de Atividades</button>
      <button type="button" data-admin="diagnostico">🩺 Centro de Diagnóstico</button>`;

    principal.addEventListener('click',()=>{
      submenu.classList.toggle('hidden');
      const seta=document.getElementById('admin-menu-seta');
      if(seta)seta.textContent=submenu.classList.contains('hidden')?'▾':'▴';
    });

    submenu.addEventListener('click',event=>{
      const acao=event.target.closest('[data-admin]')?.dataset.admin;
      if(!acao)return;
      if(acao==='historico'){
        window.navegar?.('logs');
      }else{
        document.querySelectorAll('main > section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));
        document.getElementById('aba-diagnostico')?.classList.remove('hidden');
        window.atualizarDiagnosticoSIGEE?.();
      }
    });

    bloco.append(principal,submenu);
    botaoLogs.dataset.adminConvertido='1';
    botaoLogs.replaceWith(bloco);
    montado=true;
  }

  // No DOMContentLoaded work that can affect login.
  const intervalo=setInterval(()=>{
    if(autenticado()){
      montarMenu();
      if(montado)clearInterval(intervalo);
    }
  },500);

  window.addEventListener('sigee:login-concluido',montarMenu);
})();
