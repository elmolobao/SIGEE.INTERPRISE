/**
 * SIGEE Enterprise RC4.1 — Autoridade única de perfis e permissões.
 * Não executa polling, MutationObserver ou reaplicações contínuas.
 */
(function (window) {
  'use strict';

  const PROFILES = Object.freeze({
    MASTER: 'Master', SEC: 'SEC', GESTOR: 'Gestor', ADMINISTRADOR: 'Administrador',
    TECNICO: 'Técnico', ESTAGIARIO: 'Estagiário', CONSULTA: 'Consulta'
  });
  const MATRIX = Object.freeze({
    Master: Object.freeze({ global:1, usuarios:1, logs:1, salaSituacao:1, inteligencia:1, relatorios:1, importarEscola:1, exportar:1, abrirSolicitacao:1, visualizarProcesso:1, moverProcesso:1, editarProcesso:1, excluirProcesso:1, regredirProcesso:1, cadastrarEscola:1, editarEscola:1 }),
    SEC: Object.freeze({ global:0, usuarios:0, logs:0, salaSituacao:1, inteligencia:0, relatorios:1, importarEscola:0, exportar:1, abrirSolicitacao:0, visualizarProcesso:1, moverProcesso:0, editarProcesso:0, excluirProcesso:0, regredirProcesso:0, cadastrarEscola:0, editarEscola:1 }),
    Gestor: Object.freeze({ global:0, usuarios:0, logs:0, salaSituacao:1, inteligencia:0, relatorios:1, importarEscola:0, exportar:1, abrirSolicitacao:0, visualizarProcesso:1, moverProcesso:0, editarProcesso:0, excluirProcesso:0, regredirProcesso:0, cadastrarEscola:0, editarEscola:0 }),
    Administrador: Object.freeze({ global:0, usuarios:0, logs:0, salaSituacao:0, inteligencia:0, relatorios:1, importarEscola:0, exportar:1, abrirSolicitacao:1, visualizarProcesso:1, moverProcesso:1, editarProcesso:1, excluirProcesso:0, regredirProcesso:0, cadastrarEscola:0, editarEscola:1 }),
    'Técnico': Object.freeze({ global:0, usuarios:0, logs:0, salaSituacao:0, inteligencia:0, relatorios:0, importarEscola:0, exportar:0, abrirSolicitacao:1, visualizarProcesso:1, moverProcesso:1, editarProcesso:0, excluirProcesso:0, regredirProcesso:0, cadastrarEscola:0, editarEscola:1 }),
    'Estagiário': Object.freeze({ global:0, usuarios:0, logs:0, salaSituacao:0, inteligencia:0, relatorios:0, importarEscola:0, exportar:0, abrirSolicitacao:1, visualizarProcesso:1, moverProcesso:0, editarProcesso:0, excluirProcesso:0, regredirProcesso:0, cadastrarEscola:0, editarEscola:0 }),
    Consulta: Object.freeze({ global:0, usuarios:0, logs:0, salaSituacao:0, inteligencia:0, relatorios:1, importarEscola:0, exportar:0, abrirSolicitacao:0, visualizarProcesso:1, moverProcesso:0, editarProcesso:0, excluirProcesso:0, regredirProcesso:0, cadastrarEscola:0, editarEscola:0 })
  });

  function normalize(value) {
    if (window.SIGEE_SESSION && typeof window.SIGEE_SESSION.normalizarPerfil === 'function') {
      return window.SIGEE_SESSION.normalizarPerfil(value);
    }
    if (window.SIGEE_AUTH && typeof window.SIGEE_AUTH.normalizarPerfil === 'function') {
      return window.SIGEE_AUTH.normalizarPerfil(value);
    }
    return String(value || '').trim();
  }
  function user() {
    return window.usuarioLogado || (window.SIGEE_SESSION ? window.SIGEE_SESSION.getUser() : null);
  }
  function profile(target) { return normalize((target || user() || {}).perfil); }
  function can(action, target) { return Boolean(MATRIX[profile(target)] && MATRIX[profile(target)][action]); }

  function nteAtual(target) {
    const current = target || user() || {};
    return String(current.nte || current.nte_nome || current.grupo || current.territorio || current.nte_id || '').trim();
  }
  function mesmoNte(a, b) {
    const aa = String(a || '').trim(), bb = String(b || '').trim();
    const na = aa.match(/\d{1,2}/), nb = bb.match(/\d{1,2}/);
    if (na && nb) return Number(na[0]) === Number(nb[0]);
    return aa.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase() === bb.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  }
  function nteDoRegistro(item) {
    item = item || {};
    return item.nte || item.nte_nome || item.grupo || item.territorio || item.NTE || item.nte_id || item.id_nte || item.territorio_id || '';
  }
  function filtrarTerritorio(lista, target) {
    const dados = Array.isArray(lista) ? lista : [];
    if (can('global', target)) return dados.slice();
    const nte = nteAtual(target);
    if (!nte) return [];
    return dados.filter(function (item) { return mesmoNte(nteDoRegistro(item), nte); });
  }

  function setVisible(selector, visible) {
    document.querySelectorAll(selector).forEach(function (element) {
      element.classList.toggle('hidden', !visible);
      element.style.display = visible ? '' : 'none';
      element.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if ('disabled' in element) element.disabled = !visible;
    });
  }
  function apply() {
    const current = user();
    if (!current || !document.body) return false;
    current.perfil = profile(current);
    document.body.dataset.sigeePerfil = current.perfil;
    setVisible('#menu-usuarios,#menu-administracao-bloco', can('usuarios', current));
    setVisible('#menu-logs', can('logs', current));
    setVisible('#menu-sala-situacao', can('salaSituacao', current));
    setVisible('#menu-relatorios', can('relatorios', current));
    setVisible('#menu-inteligencia,[onclick*="inteligencia"],[onclick*="centro-inteligencia"]', can('inteligencia', current));
    setVisible('#btn-importar-dados-master,.import-only', can('importarEscola', current));
    setVisible('.export-only', can('exportar', current));
    setVisible('[data-acao="nova-solicitacao"],#btn-nova-solicitacao,.btn-nova-solicitacao,[onclick*="abrirFormularioNovaSolicitacao"]', can('abrirSolicitacao', current));
    setVisible('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola', can('cadastrarEscola', current));
    setVisible('[data-sigee-permissao="editar-escola"],.btn-editar-escola,[onclick*="editarEscola"]', can('editarEscola', current));
    setVisible('[onclick*="editarProcessoMaster"],.btn-editar-processo', can('editarProcesso', current));
    return true;
  }
  function guard(action, message) {
    return function (fn) {
      return function () {
        if (!can(action)) { alert(message || 'Seu perfil não possui permissão para esta ação.'); return false; }
        return fn && fn.apply(this, arguments);
      };
    };
  }
  function protectGlobal(name, action, message) {
    const original = window[name];
    if (typeof original !== 'function' || original.__SIGEE_PERMISSION_GUARD__) return;
    const wrapped = guard(action, message)(original);
    wrapped.__SIGEE_PERMISSION_GUARD__ = true;
    window[name] = wrapped;
  }
  function installGuards() {
    protectGlobal('abrirFormularioNovaSolicitacao', 'abrirSolicitacao');
    protectGlobal('abrirModalNovaEscola', 'cadastrarEscola', 'Somente o perfil Master pode cadastrar escola.');
  }

  const api = Object.freeze({ PERFIS: PROFILES, MATRIZ: MATRIX, normalizarPerfil: normalize, perfilAtual: profile, pode: can, ehGlobal: function (u) { return can('global', u); }, nteAtual: nteAtual, mesmoNte: mesmoNte, filtrarTerritorio: filtrarTerritorio, aplicarMenu: apply, instalarProtecoes: installGuards });
  window.SIGEE_PERMISSOES = api;
  window.SIGEE_PERFIS_OFICIAL = Object.freeze({ perfil: normalize, regras: MATRIX, pode: can, aplicar: apply });
  window.aplicarPermissoesMenuPorPerfil = apply;
  window.SIGEE_REAPLICAR_PERFIS_OFICIAL = apply;

  function initialize() { installGuards(); apply(); }
  document.addEventListener('DOMContentLoaded', initialize);
  document.addEventListener('sigee:usuario-logado', initialize);
  document.addEventListener('sigee:navegacao-concluida', apply);
  window.addEventListener('load', initialize);
})(window);
