/* =====================================================================
 * SIGEE ENTERPRISE 2.0 - auth.js
 * Funções auxiliares de autenticação e sessão.
 * O handleLogin atual permanece no app.js durante esta fase.
 * ===================================================================== */
(function (window) {
  'use strict';

  function normalizarEmailSIGEE(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizarPerfilSIGEE(perfil) {
    const p = String(perfil || '').trim();
    if (!p) return '';
    const base = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (base === 'sec') return 'SEC';
    if (base === 'master') return 'Master';
    if (base === 'administrador') return 'Administrador';
    if (base === 'tecnico') return 'Tecnico';
    if (base === 'consulta') return 'Consulta';
    return p;
  }

  function obterUsuarioLogadoSIGEE() {
    return window.usuarioLogado || null;
  }

  function usuarioTemPerfilSIGEE(...perfis) {
    const u = obterUsuarioLogadoSIGEE();
    const perfilUsuario = normalizarPerfilSIGEE(u && u.perfil);
    return perfis.map(normalizarPerfilSIGEE).includes(perfilUsuario);
  }

  window.SIGEE_AUTH = {
    normalizarEmail: normalizarEmailSIGEE,
    normalizarPerfil: normalizarPerfilSIGEE,
    obterUsuarioLogado: obterUsuarioLogadoSIGEE,
    usuarioTemPerfil: usuarioTemPerfilSIGEE
  };

  window.normalizarPerfilSIGEE = window.normalizarPerfilSIGEE || normalizarPerfilSIGEE;
})(window);
