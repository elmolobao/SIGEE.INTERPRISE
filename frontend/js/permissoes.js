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

/* =====================================================================
   SIGEE Sprint 2.6.2 - Perfis e permissões oficiais
   ===================================================================== */
(function(){
  'use strict';
  function txt(v){ return (v===null||v===undefined)?'':String(v).trim(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function normalizarPerfil(v){
    const p = semAcento(v).toUpperCase();
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiario';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Tecnico';
    return txt(v);
  }
  const P = { MASTER:'Master', SEC:'SEC', ADMIN:'Administrador', TECNICO:'Tecnico', ESTAGIARIO:'Estagiario', CONSULTA:'Consulta' };
  const MATRIZ = {
    Master:        { global:true,  usuarios:true,  logs:true,  importar:true,  exportar:true,  abrirSolicitacao:true, visualizarProcesso:true, moverProcesso:true,  editarProcesso:true,  excluirProcesso:true, editarEscola:true },
    SEC:           { global:true,  usuarios:true,  logs:true,  importar:true,  exportar:true,  abrirSolicitacao:true, visualizarProcesso:true, moverProcesso:true,  editarProcesso:true,  excluirProcesso:true, editarEscola:true },
    Administrador: { global:false, usuarios:false, logs:true,  importar:true,  exportar:true,  abrirSolicitacao:true, visualizarProcesso:true, moverProcesso:true,  editarProcesso:true,  excluirProcesso:false, editarEscola:true },
    Tecnico:       { global:false, usuarios:false, logs:false, importar:false, exportar:false, abrirSolicitacao:true, visualizarProcesso:true, moverProcesso:true,  editarProcesso:false, excluirProcesso:false, editarEscola:true },
    Estagiario:    { global:false, usuarios:false, logs:false, importar:false, exportar:false, abrirSolicitacao:true, visualizarProcesso:true, moverProcesso:false, editarProcesso:false, excluirProcesso:false, editarEscola:false },
    Consulta:      { global:false, usuarios:false, logs:false, importar:false, exportar:false, abrirSolicitacao:false,visualizarProcesso:true, moverProcesso:false, editarProcesso:false, excluirProcesso:false, editarEscola:false }
  };
  function usuario(){ return window.usuarioLogado || null; }
  function pode(acao, u){ const p=normalizarPerfil((u||usuario()||{}).perfil); return Boolean(MATRIZ[p] && MATRIZ[p][acao]); }
  function aplicarMenu(){
    const u = usuario();
    document.querySelectorAll('#menu-usuarios').forEach(el=>el.classList.toggle('hidden', !pode('usuarios', u)));
    document.querySelectorAll('#menu-logs').forEach(el=>el.classList.toggle('hidden', !pode('logs', u)));
    document.querySelectorAll('#btn-importar-dados-master,.import-only').forEach(el=>el.classList.toggle('hidden', !pode('importar', u)));
    document.querySelectorAll('.export-only').forEach(el=>el.classList.toggle('hidden', !pode('exportar', u)));
    if (normalizarPerfil(u && u.perfil) === 'Estagiario') {
      document.querySelectorAll('[onclick*="editarProcesso"],[onclick*="Editar Processo"],.btn-editar-processo').forEach(el=>el.classList.add('hidden'));
    }
  }
  window.SIGEE_PERMISSOES = { PERFIS:P, MATRIZ, normalizarPerfil, pode, ehGlobal:(u)=>pode('global',u), aplicarMenu };
  window.aplicarPermissoesMenuPorPerfil = aplicarMenu;
  document.addEventListener('DOMContentLoaded', ()=>setInterval(aplicarMenu, 1200));
  window.addEventListener('load', ()=>setTimeout(aplicarMenu, 500));
})();

