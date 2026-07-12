/* =====================================================================
 * SIGEE Enterprise — Fonte única de permissões
 * Sprint 0.9.3.1 — Consolidação do Workflow
 *
 * Mantém compatibilidade com os scripts legados e centraliza:
 * - normalização de perfis;
 * - escopo global/NTE;
 * - permissões por ação;
 * - aplicação de visibilidade no menu e nos controles da interface.
 * ===================================================================== */
(function (window) {
  'use strict';

  if (window.__SIGEE_PERMISSOES_0931__) return;
  window.__SIGEE_PERMISSOES_0931__ = true;

  const PERFIS = Object.freeze({
    SEC: 'SEC',
    MASTER: 'MASTER',
    ADMINISTRADOR: 'ADMINISTRADOR',
    TECNICO: 'TECNICO',
    CONSULTA: 'CONSULTA',
    ESTAGIARIO: 'ESTAGIARIO'
  });

  const PERFIS_LEGADOS = Object.freeze({
    [PERFIS.SEC]: 'SEC',
    [PERFIS.MASTER]: 'Master',
    [PERFIS.ADMINISTRADOR]: 'Administrador',
    [PERFIS.TECNICO]: 'Tecnico',
    [PERFIS.CONSULTA]: 'Consulta',
    [PERFIS.ESTAGIARIO]: 'Estagiario'
  });

  const ACOES = Object.freeze({
    VER_TODOS_NTES: 'verTodosNtes',
    GERENCIAR_USUARIOS: 'gerenciarUsuarios',
    VER_LOGS: 'verLogs',
    IMPORTAR: 'importar',
    EXPORTAR: 'exportar',
    ABRIR_SOLICITACAO: 'abrirSolicitacao',
    VISUALIZAR_PROCESSO: 'visualizarProcesso',
    MOVIMENTAR_PROCESSO: 'movimentarProcesso',
    EDITAR_PROCESSO: 'editarProcesso',
    EXCLUIR_PROCESSO: 'excluirProcesso',
    EDITAR_ESCOLA: 'editarEscola',
    SELECIONAR_RESPONSAVEL: 'selecionarResponsavel'
  });

  const MATRIZ = Object.freeze({
    [PERFIS.SEC]: Object.freeze({
      verTodosNtes: true,
      gerenciarUsuarios: false,
      verLogs: true,
      importar: true,
      exportar: true,
      abrirSolicitacao: true,
      visualizarProcesso: true,
      movimentarProcesso: true,
      editarProcesso: true,
      excluirProcesso: true,
      editarEscola: true,
      selecionarResponsavel: true
    }),
    [PERFIS.MASTER]: Object.freeze({
      verTodosNtes: true,
      gerenciarUsuarios: true,
      verLogs: true,
      importar: true,
      exportar: true,
      abrirSolicitacao: true,
      visualizarProcesso: true,
      movimentarProcesso: true,
      editarProcesso: true,
      excluirProcesso: true,
      editarEscola: true,
      selecionarResponsavel: true
    }),
    [PERFIS.ADMINISTRADOR]: Object.freeze({
      verTodosNtes: false,
      gerenciarUsuarios: false,
      verLogs: true,
      importar: true,
      exportar: true,
      abrirSolicitacao: true,
      visualizarProcesso: true,
      movimentarProcesso: true,
      editarProcesso: true,
      excluirProcesso: false,
      editarEscola: true,
      selecionarResponsavel: true
    }),
    [PERFIS.TECNICO]: Object.freeze({
      verTodosNtes: false,
      gerenciarUsuarios: false,
      verLogs: false,
      importar: false,
      exportar: false,
      abrirSolicitacao: true,
      visualizarProcesso: true,
      movimentarProcesso: true,
      editarProcesso: false,
      excluirProcesso: false,
      editarEscola: true,
      selecionarResponsavel: true
    }),
    [PERFIS.ESTAGIARIO]: Object.freeze({
      verTodosNtes: false,
      gerenciarUsuarios: false,
      verLogs: false,
      importar: false,
      exportar: false,
      abrirSolicitacao: true,
      visualizarProcesso: true,
      movimentarProcesso: false,
      editarProcesso: false,
      excluirProcesso: false,
      editarEscola: false,
      selecionarResponsavel: false
    }),
    [PERFIS.CONSULTA]: Object.freeze({
      verTodosNtes: false,
      gerenciarUsuarios: false,
      verLogs: false,
      importar: false,
      exportar: false,
      abrirSolicitacao: false,
      visualizarProcesso: true,
      movimentarProcesso: false,
      editarProcesso: false,
      excluirProcesso: false,
      editarEscola: false,
      selecionarResponsavel: false
    })
  });

  function texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor).trim();
  }

  function normalizarTexto(valor) {
    return texto(valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ');
  }

  function usuarioAtual() {
    return window.usuarioLogado || null;
  }

  function normalizarPerfil(valorOuUsuario) {
    const usuario = valorOuUsuario && typeof valorOuUsuario === 'object'
      ? valorOuUsuario
      : null;

    const email = normalizarTexto(usuario && usuario.email);
    const bruto = normalizarTexto(
      usuario
        ? (usuario.perfil || usuario.role || usuario.tipo_perfil || usuario.tipo || usuario.nivel || usuario.acesso)
        : valorOuUsuario
    );

    if (email === 'SEC@ENOVA.EDUCACAO.BA.GOV.BR') return PERFIS.SEC;
    if (bruto === 'SEC' || bruto.includes('TODOS OS NTES') || bruto.includes('SECRETARIA')) return PERFIS.SEC;
    if (bruto.includes('MASTER')) return PERFIS.MASTER;
    if (bruto.includes('ADMIN')) return PERFIS.ADMINISTRADOR;
    if (bruto.includes('TECN')) return PERFIS.TECNICO;
    if (bruto.includes('ESTAG')) return PERFIS.ESTAGIARIO;
    if (bruto.includes('CONSULT')) return PERFIS.CONSULTA;

    return PERFIS.CONSULTA;
  }

  function perfilAtual() {
    return normalizarPerfil(usuarioAtual());
  }

  function perfilLegado(valorOuUsuario) {
    return PERFIS_LEGADOS[normalizarPerfil(valorOuUsuario)] || 'Consulta';
  }

  function pode(acao, usuario) {
    const perfil = normalizarPerfil(usuario || usuarioAtual());
    return Boolean(MATRIZ[perfil] && MATRIZ[perfil][acao]);
  }

  function ehPerfil(perfil, usuario) {
    return normalizarPerfil(usuario || usuarioAtual()) === perfil;
  }

  function ehGlobal(usuario) {
    return pode(ACOES.VER_TODOS_NTES, usuario);
  }

  function numeroNte(valor) {
    const match = texto(valor).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    return match ? Number(match[1]) : null;
  }

  function normalizarNte(valor) {
    const numero = numeroNte(valor);
    return numero
      ? `NTE${String(numero).padStart(2, '0')}`
      : normalizarTexto(valor).replace(/[^A-Z0-9]/g, '');
  }

  function nteDoUsuario(usuario) {
    const u = usuario || usuarioAtual() || {};
    return texto(u.nte || u.nte_nome || u.nte_vinculado || u.grupo);
  }

  function mesmoNte(a, b) {
    if (!a || !b) return false;
    const numeroA = numeroNte(a);
    const numeroB = numeroNte(b);
    return numeroA && numeroB
      ? numeroA === numeroB
      : normalizarNte(a) === normalizarNte(b);
  }

  function podeNoNte(acao, nteAlvo, usuario) {
    const u = usuario || usuarioAtual();
    if (!pode(acao, u)) return false;
    if (ehGlobal(u)) return true;
    return mesmoNte(nteDoUsuario(u), nteAlvo);
  }

  function alternar(seletor, visivel) {
    document.querySelectorAll(seletor).forEach(function (elemento) {
      elemento.classList.toggle('hidden', !visivel);
    });
  }

  function aplicarMenu(usuario) {
    const u = usuario || usuarioAtual();
    alternar('#menu-usuarios', pode(ACOES.GERENCIAR_USUARIOS, u));
    alternar('#menu-logs', pode(ACOES.VER_LOGS, u));
    alternar('#btn-importar-dados-master,.import-only', pode(ACOES.IMPORTAR, u));
    alternar('.export-only', pode(ACOES.EXPORTAR, u));
    alternar('[onclick*="editarProcesso"],.btn-editar-processo', pode(ACOES.EDITAR_PROCESSO, u));
    alternar('[onclick*="excluirProcesso"],.btn-excluir-processo', pode(ACOES.EXCLUIR_PROCESSO, u));
  }

  const API = Object.freeze({
    PERFIS,
    ACOES,
    MATRIZ,
    normalizarPerfil,
    perfilAtual,
    perfilLegado,
    pode,
    podeNoNte,
    ehPerfil,
    ehGlobal,
    numeroNte,
    normalizarNte,
    nteDoUsuario,
    mesmoNte,
    aplicarMenu,
    isSEC: usuario => ehPerfil(PERFIS.SEC, usuario),
    isMaster: usuario => ehPerfil(PERFIS.MASTER, usuario),
    isAdministrador: usuario => ehPerfil(PERFIS.ADMINISTRADOR, usuario),
    isTecnico: usuario => ehPerfil(PERFIS.TECNICO, usuario),
    isConsulta: usuario => ehPerfil(PERFIS.CONSULTA, usuario),
    isEstagiario: usuario => ehPerfil(PERFIS.ESTAGIARIO, usuario)
  });

  window.SIGEE_PERMISSOES = API;
  window.SIGEE_PERMISSOES_0931 = API;
  window.aplicarPermissoesMenuPorPerfil = aplicarMenu;

  document.addEventListener('DOMContentLoaded', function () {
    aplicarMenu();
  });

  window.addEventListener('load', function () {
    setTimeout(aplicarMenu, 250);
  });
})(window);
