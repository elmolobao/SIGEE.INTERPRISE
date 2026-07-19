(function(){
  'use strict';
  if(window.__SIGEE_ADMIN_UNIFICADA_250__) return;
  window.__SIGEE_ADMIN_UNIFICADA_250__=true;

  function perfil(){
    return String(window.usuarioLogado?.perfil||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  }
  function autenticado(){
    const sistema=document.getElementById('sistema-dashboard');
    return !!window.usuarioLogado && !!sistema && !sistema.classList.contains('hidden');
  }
  function permitido(){ return perfil().includes('MASTER'); }

  function removerDuplicidades(){
    document.querySelectorAll('#menu-administracao-bloco').forEach((el,i)=>{ if(i>0) el.remove(); });
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
        <div><span>Versão instalada</span><strong>2.5.0</strong></div>
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

  function montar(){
    if(!autenticado()) return;
    const menuUsuarios=document.getElementById('menu-usuarios');
    const menuLogs=document.getElementById('menu-logs');
    const nav=(menuUsuarios||menuLogs)?.parentElement;
    if(!nav) return;

    removerDuplicidades();
    if(!permitido()){
      menuUsuarios?.classList.add('hidden');
      menuLogs?.classList.add('hidden');
      document.getElementById('menu-administracao-bloco')?.remove();
      return;
    }

    criarDiagnostico();
    menuUsuarios?.classList.add('hidden');
    menuLogs?.classList.add('hidden');

    let bloco=document.getElementById('menu-administracao-bloco');
    if(!bloco){
      bloco=document.createElement('div');
      bloco.id='menu-administracao-bloco';
      bloco.className='sigee-admin-menu';
      bloco.innerHTML=`
        <button type="button" id="menu-administracao-principal" class="sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer flex items-center justify-between">
          <span>⚙️ Administração</span><span id="admin-menu-seta">▾</span>
        </button>
        <div id="submenu-administracao" class="hidden sigee-admin-submenu">
          <button type="button" data-admin="usuarios">👥 Gestão de Usuários</button>
          <button type="button" data-admin="historico">📝 Histórico de Atividades</button>
          <button type="button" data-admin="diagnostico">🩺 Centro de Diagnóstico</button>
        </div>`;
      nav.insertBefore(bloco, menuUsuarios || menuLogs || null);
      bloco.querySelector('#menu-administracao-principal').addEventListener('click',()=>{
        const sub=bloco.querySelector('#submenu-administracao');
        sub.classList.toggle('hidden');
        bloco.querySelector('#admin-menu-seta').textContent=sub.classList.contains('hidden')?'▾':'▴';
      });
      bloco.querySelector('#submenu-administracao').addEventListener('click',evento=>{
        const acao=evento.target.closest('[data-admin]')?.dataset.admin;
        if(!acao) return;
        if(acao==='usuarios') window.navegar?.('usuarios');
        else if(acao==='historico') window.navegar?.('logs');
        else {
          document.querySelectorAll('main > section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));
          document.getElementById('aba-diagnostico')?.classList.remove('hidden');
          window.atualizarDiagnosticoSIGEE?.();
        }
      });
    }
    bloco.classList.remove('hidden');
  }

  function agendar(){ setTimeout(montar,0); }
  document.addEventListener('DOMContentLoaded',agendar,{once:true});
  window.addEventListener('load',agendar,{once:true});
  document.addEventListener('sigee:usuario-logado',agendar);
  window.addEventListener('sigee:login-concluido',agendar);
  document.addEventListener('sigee:navegacao',()=>{
    if(autenticado()) removerDuplicidades();
  });
  window.SIGEE_MONTAR_ADMINISTRACAO=montar;
})();
