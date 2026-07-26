/* SIGEE RC7.1.0 — Bootstrap administrativo final
   Executado por último. Agrupa uma única vez os botões originais, sem observar navegação. */
(function (window, document) {
  'use strict';
  if (window.__SIGEE_ADMIN_BOOTSTRAP_RC710__) return;
  window.__SIGEE_ADMIN_BOOTSTRAP_RC710__ = true;

  const MAX_TENTATIVAS = 35;
  const INTERVALO = 180;
  let timer = null;
  let tentativas = 0;

  const texto = value => String(value || '').trim();
  const token = value => texto(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const usuarioAtual = () => window.usuarioLogado || window.usuarioAtual || window.currentUser ||
    window.SIGEE_USUARIO_ATUAL || window.SIGEE_SESSION?.getUser?.() || null;
  const master = () => token(usuarioAtual()?.perfil).includes('MASTER');

  function esconderViews() {
    document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]').forEach(section => {
      section.classList.add('hidden');
    });
  }

  function garantirTelaDiagnostico() {
    let aba = document.getElementById('aba-diagnostico');
    if (aba) return aba;
    const main = document.querySelector('#sistema-dashboard main');
    if (!main) return null;
    aba = document.createElement('section');
    aba.id = 'aba-diagnostico';
    aba.className = 'hidden space-y-5';
    aba.innerHTML = `
      <header class="sigee-admin-page-head">
        <div><span>ADMINISTRAÇÃO</span><h1>Centro de Diagnóstico</h1><p>Verificação dos componentes, conectividade e integração operacional do SIGEE.</p></div>
        <button type="button" id="btn-atualizar-diagnostico">↻ Atualizar diagnóstico</button>
      </header>
      <section id="diagnostico-resumo" class="bg-white rounded-xl border shadow-sm p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article><small>Status geral</small><strong id="diag-status-geral">Aguardando</strong></article>
          <article><small>Última atualização</small><strong id="diag-atualizado">—</strong></article>
          <article><small>Conectividade</small><strong id="diag-conectividade">—</strong></article>
          <article><small>Processos</small><strong id="diag-processos">0</strong></article>
          <article><small>Escolas</small><strong id="diag-escolas">0</strong></article>
          <article><small>Usuários</small><strong id="diag-usuarios">0</strong></article>
          <article><small>Tempo de cálculo</small><strong id="diag-tempo-calculo">—</strong></article>
          <article><small>Última sincronização</small><strong id="diag-ultima-sync">—</strong></article>
        </div>
      </section>
      <section id="diag-componentes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></section>`;
    main.appendChild(aba);
    aba.querySelector('#btn-atualizar-diagnostico')?.addEventListener('click', () => {
      window.atualizarDiagnosticoSIGEE?.(true);
    });
    return aba;
  }

  function garantirBotaoDiagnostico() {
    let button = document.getElementById('menu-diagnostico');
    if (button) return button;
    button = document.createElement('button');
    button.id = 'menu-diagnostico';
    button.type = 'button';
    button.className = 'sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
    button.textContent = '🩺 Centro de Diagnóstico';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const aba = garantirTelaDiagnostico();
      if (!aba) return;
      esconderViews();
      aba.classList.remove('hidden');
      window.atualizarDiagnosticoSIGEE?.();
      document.querySelectorAll('.sigee-menu-item').forEach(item => item.classList.remove('bg-blue-800'));
      button.classList.add('bg-blue-800');
    });
    return button;
  }

  function criarGrupo(nav) {
    let group = document.getElementById('menu-administrativo-grupo');
    if (group) return group;
    group = document.createElement('div');
    group.id = 'menu-administrativo-grupo';
    group.className = 'sigee-menu-grupo';
    group.innerHTML = `
      <button type="button" id="menu-administrativo-titulo"
        class="sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer"
        aria-expanded="false">
        <span>⚙️ Administrativo</span><span id="menu-administrativo-seta" style="float:right">▼</span>
      </button>
      <div id="submenu-administracao" class="hidden" style="padding-left:.55rem;margin-top:.25rem;border-left:2px solid rgba(250,204,21,.75)"></div>`;
    const title = group.querySelector('#menu-administrativo-titulo');
    title.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const submenu = group.querySelector('#submenu-administracao');
      const open = submenu.classList.contains('hidden');
      submenu.classList.toggle('hidden', !open);
      title.setAttribute('aria-expanded', String(open));
      group.querySelector('#menu-administrativo-seta').textContent = open ? '▲' : '▼';
    });
    nav.appendChild(group);
    return group;
  }

  function formatarSubitem(element) {
    element.classList.add('sigee-menu-item');
    element.style.width = '100%';
    element.style.margin = '0';
  }

  function consolidar() {
    const nav = document.getElementById('sigee-menu-dinamico');
    if (!nav) return false;

    const users = document.getElementById('menu-usuarios');
    const logs = document.getElementById('menu-logs');
    const migration = document.getElementById('menu-migracao-historica');
    const access = document.getElementById('menu-controle-acesso-ntes');

    // Aguarda os dois itens oficiais essenciais. Os módulos Master podem chegar depois.
    if (!users || !logs) return false;

    const group = criarGrupo(nav);
    const submenu = group.querySelector('#submenu-administracao');
    const diagnosis = garantirBotaoDiagnostico();

    logs.textContent = '📜 Histórico de Atividades';
    logs.setAttribute('aria-label', 'Histórico de Atividades');
    logs.title = 'Histórico de Atividades';

    [users, logs, diagnosis, access, migration].filter(Boolean).forEach(element => {
      formatarSubitem(element);
      if (element.parentElement !== submenu) submenu.appendChild(element);
    });

    diagnosis.classList.toggle('hidden', !master());
    access?.classList.toggle('hidden', !master());
    migration?.classList.toggle('hidden', !master());

    // Posição fixa após Sala de Situação; não é recalculada durante navegação.
    const sala = document.getElementById('menu-sala-situacao');
    if (sala?.parentElement === nav && sala.nextElementSibling !== group) {
      sala.insertAdjacentElement('afterend', group);
    } else if (group.parentElement !== nav) {
      nav.appendChild(group);
    }

    group.classList.toggle('hidden', ![...submenu.children].some(el => !el.classList.contains('hidden')));
    group.dataset.consolidado = 'true';
    return true;
  }

  const PASSAGENS = [0, 350, 900, 1800, 3200, 5200];
  let agendamentos = [];

  function cancelarAgendamentos() {
    agendamentos.forEach(id => clearTimeout(id));
    agendamentos = [];
  }

  function executarPassagens() {
    cancelarAgendamentos();
    PASSAGENS.forEach(atraso => {
      agendamentos.push(setTimeout(() => {
        consolidar();
      }, atraso));
    });
  }

  function iniciar() {
    executarPassagens();
  }

  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  window.addEventListener('load', iniciar, { once: true });
  document.addEventListener('sigee:usuario-logado', iniciar);
  window.addEventListener('sigee:login-concluido', iniciar);
  window.SIGEE_ADMIN_MENU = { iniciar, consolidar, versao: 'RC7.1.0' };
})(window, document);
