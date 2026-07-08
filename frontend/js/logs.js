/* =====================================================================
   SIGEE Enterprise 2.0 - Entrega 5B
   Módulo: Logs e Usuários Conectados
   Objetivo: centralizar registro de ações, exibição de logs e painel de
   usuários conectados, sem alterar a base Supabase nem o app.js principal.
   ===================================================================== */
(function(){
  'use strict';

  const SIGEE_LOGS_VERSION = '2.0.0-5B';

  function obterUsuarioAtual(){
    try {
      return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    } catch(e){
      return window.usuarioLogado || null;
    }
  }

  function obterLogsDB(){
    try {
      if (Array.isArray(window.logsDB)) return window.logsDB;
      if (typeof logsDB !== 'undefined' && Array.isArray(logsDB)) return logsDB;
    } catch(e){}
    window.logsDB = window.logsDB || [];
    return window.logsDB;
  }

  function definirLogsDB(valor){
    try { window.logsDB = valor; } catch(e){}
    try { if (typeof logsDB !== 'undefined') logsDB = valor; } catch(e){}
  }

  function normalizarPerfil(valor){
    return String(valor || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function normalizarNte(usuario){
    return usuario?.nte || usuario?.grupo || usuario?.nte_nome || usuario?.territorio || '-';
  }

  function agoraBR(){
    return new Date().toLocaleString('pt-BR');
  }

  function persistirLogsLocal(){
    try {
      const logs = obterLogsDB();
      localStorage.setItem('SIGEE_LOGS_DB', JSON.stringify(logs));
      localStorage.setItem('SIGEE_LOGS_BACKUP', JSON.stringify(logs));
    } catch(e) {
      console.warn('SIGEE Logs: não foi possível persistir logs localmente.', e);
    }
  }

  function carregarLogsLocalSeNecessario(){
    const logs = obterLogsDB();
    if (logs.length) return;
    try {
      const bruto = localStorage.getItem('SIGEE_LOGS_DB') || localStorage.getItem('SIGEE_LOGS_BACKUP');
      if (bruto) {
        const salvos = JSON.parse(bruto);
        if (Array.isArray(salvos)) definirLogsDB(salvos);
      }
    } catch(e){}
  }

  function registrarLogSIGEE(acao){
    const usuario = obterUsuarioAtual();
    if (!usuario) return;

    const logs = obterLogsDB();
    const registro = {
      data: agoraBR(),
      nome: usuario.nome || usuario.name || 'Usuário',
      perfil: usuario.perfil || '-',
      nte: normalizarNte(usuario),
      email: usuario.email || '-',
      acao: String(acao || '').trim() || 'Ação não informada'
    };

    logs.unshift(registro);
    if (logs.length > 2000) logs.length = 2000;
    definirLogsDB(logs);
    persistirLogsLocal();

    try { atualizarDashboardUsuariosConectadosSIGEE(); } catch(e){}
    try {
      const abaLogs = document.getElementById('aba-logs');
      if (abaLogs && !abaLogs.classList.contains('hidden')) carregarLogsSIGEE();
    } catch(e){}
  }

  function carregarLogsSIGEE(){
    carregarLogsLocalSeNecessario();
    const corpo = document.getElementById('tabela-logs-corpo');
    if (!corpo) return;

    const usuario = obterUsuarioAtual();
    const perfil = normalizarPerfil(usuario?.perfil);
    const nteUsuario = String(normalizarNte(usuario)).toUpperCase().replace(/\s/g, '');

    let logs = obterLogsDB();

    if (perfil === 'administrador') {
      logs = logs.filter(l => String(l.nte || '').toUpperCase().replace(/\s/g, '') === nteUsuario);
    }

    corpo.innerHTML = '';

    if (!logs.length) {
      corpo.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400 font-semibold">Nenhum registro localizado.</td></tr>';
      atualizarDashboardUsuariosConectadosSIGEE();
      return;
    }

    logs.slice(0, 500).forEach(l => {
      corpo.innerHTML += `
        <tr class="hover:bg-gray-50 text-xs">
          <td class="p-4 font-semibold whitespace-nowrap">${l.data || '-'}</td>
          <td class="p-4 font-bold">${l.nome || '-'}</td>
          <td class="p-4 font-semibold text-blue-900">${l.nte || '-'}</td>
          <td class="p-4 font-mono text-[11px] text-gray-500">${l.email || '-'}</td>
          <td class="p-4">${l.acao || '-'}</td>
        </tr>
      `;
    });

    atualizarDashboardUsuariosConectadosSIGEE();
  }

  function atualizarDashboardUsuariosConectadosSIGEE(){
    carregarLogsLocalSeNecessario();
    const logs = obterLogsDB();
    const acessos = logs.filter(l => String(l.acao || '').toLowerCase().includes('acesso'));

    const emailsUnicos = new Set();
    let master = 0;
    let operacao = 0;

    acessos.forEach(l => {
      if (!l.email) return;
      const email = String(l.email).toLowerCase();
      if (emailsUnicos.has(email)) return;
      emailsUnicos.add(email);

      const p = normalizarPerfil(l.perfil);
      if (p === 'master' || p === 'sec') master++;
      else operacao++;
    });

    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.innerText = valor;
    };

    set('log-usuarios-conectados', emailsUnicos.size);
    set('log-conectados-master', master);
    set('log-conectados-operacao', operacao);
    set('log-ultimo-acesso', acessos[0]?.data || '-');
  }

  function logoutSIGEE(){
    try { registrarLogSIGEE('Logout realizado.'); } catch(e){}
    try { window.usuarioLogado = null; } catch(e){}
    try { if (typeof usuarioLogado !== 'undefined') usuarioLogado = null; } catch(e){}
    const sistema = document.getElementById('sistema-dashboard');
    const login = document.getElementById('tela-login');
    if (sistema) sistema.classList.add('hidden');
    if (login) login.classList.remove('hidden');
  }

  function instalarModuloLogsSIGEE(){
    carregarLogsLocalSeNecessario();

    window.registrarLog = registrarLogSIGEE;
    window.carregarLogs = carregarLogsSIGEE;
    window.atualizarDashboardUsuariosConectadosSIGEE = atualizarDashboardUsuariosConectadosSIGEE;
    window.logout = logoutSIGEE;
    window.SIGEE_LOGS_VERSION = SIGEE_LOGS_VERSION;

    try { atualizarDashboardUsuariosConectadosSIGEE(); } catch(e){}
  }

  window.instalarModuloLogsSIGEE = instalarModuloLogsSIGEE;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(instalarModuloLogsSIGEE, 300));
  } else {
    setTimeout(instalarModuloLogsSIGEE, 300);
  }

  // Reaplica depois que o app.js termina de declarar funções globais.
  window.addEventListener('load', () => setTimeout(instalarModuloLogsSIGEE, 500));
})();
