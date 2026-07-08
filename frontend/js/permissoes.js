/* =====================================================================
 * SIGEE ENTERPRISE 2.0 - permissoes.js
 * Matriz central de permissões do SIGEE.
 * Esta fase centraliza a regra, sem remover a lógica existente do app.js.
 * ===================================================================== */
(function (window) {
  'use strict';

  const P = {
    SEC: 'SEC',
    MASTER: 'Master',
    ADMIN: 'Administrador',
    TECNICO: 'Tecnico',
    CONSULTA: 'Consulta'
  };

  const MATRIZ = {
    [P.SEC]: {
      global: true, usuarios: true, logs: true, importar: true, exportar: true,
      cadastrarEscola: true, editarEscola: true, excluirEscola: true,
      abrirSolicitacao: true, moverProcesso: true, editarProcesso: true, excluirProcesso: true,
      selecionarTecnicoGlobal: true
    },
    [P.MASTER]: {
      global: true, usuarios: true, logs: true, importar: true, exportar: true,
      cadastrarEscola: true, editarEscola: true, excluirEscola: true,
      abrirSolicitacao: true, moverProcesso: true, editarProcesso: true, excluirProcesso: true,
      selecionarTecnicoGlobal: true
    },
    [P.ADMIN]: {
      global: false, usuarios: false, logs: true, importar: true, exportar: true,
      cadastrarEscola: true, editarEscola: true, excluirEscola: false,
      abrirSolicitacao: true, moverProcesso: true, editarProcesso: true, excluirProcesso: false,
      selecionarTecnicoGlobal: false
    },
    [P.TECNICO]: {
      global: false, usuarios: false, logs: false, importar: false, exportar: false,
      cadastrarEscola: true, editarEscola: true, excluirEscola: false,
      abrirSolicitacao: true, moverProcesso: true, editarProcesso: false, excluirProcesso: false,
      selecionarTecnicoGlobal: false,
      camposEdicaoEscola: ['situacao', 'status_acervo', 'local_acervo', 'acervo']
    },
    [P.CONSULTA]: {
      global: false, usuarios: false, logs: false, importar: false, exportar: false,
      cadastrarEscola: false, editarEscola: false, excluirEscola: false,
      abrirSolicitacao: false, moverProcesso: false, editarProcesso: false, excluirProcesso: false,
      selecionarTecnicoGlobal: false
    }
  };

  function normalizarPerfil(perfil) {
    if (window.SIGEE_AUTH && window.SIGEE_AUTH.normalizarPerfil) {
      return window.SIGEE_AUTH.normalizarPerfil(perfil);
    }
    const p = String(perfil || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (p === 'sec') return P.SEC;
    if (p === 'master') return P.MASTER;
    if (p === 'administrador') return P.ADMIN;
    if (p === 'tecnico') return P.TECNICO;
    if (p === 'consulta') return P.CONSULTA;
    return String(perfil || '').trim();
  }

  function usuarioAtual() {
    return window.usuarioLogado || null;
  }

  function perfilAtual() {
    const u = usuarioAtual();
    return normalizarPerfil(u && u.perfil);
  }

  function pode(acao, usuario) {
    const perfil = normalizarPerfil((usuario || usuarioAtual() || {}).perfil);
    return Boolean(MATRIZ[perfil] && MATRIZ[perfil][acao]);
  }

  function ehGlobal(usuario) {
    return pode('global', usuario);
  }

  function aplicarMenu() {
    const perfil = perfilAtual();
    const regra = MATRIZ[perfil] || MATRIZ[P.CONSULTA];

    const menuUsuarios = document.getElementById('menu-usuarios');
    const menuLogs = document.getElementById('menu-logs');
    if (menuUsuarios) menuUsuarios.classList.toggle('hidden', !regra.usuarios);
    if (menuLogs) menuLogs.classList.toggle('hidden', !regra.logs);

    document.querySelectorAll('.export-only').forEach(el => {
      el.classList.toggle('hidden', !regra.exportar);
    });

    document.querySelectorAll('#btn-importar-dados-master, .import-only').forEach(el => {
      el.classList.toggle('hidden', !regra.importar);
    });
  }

  window.SIGEE_PERMISSOES = {
    PERFIS: P,
    MATRIZ,
    normalizarPerfil,
    perfilAtual,
    pode,
    ehGlobal,
    aplicarMenu
  };

  // Compatibilidade com correções anteriores do menu instável.
  window.aplicarPermissoesMenuPorPerfil = window.aplicarPermissoesMenuPorPerfil || aplicarMenu;
})(window);
