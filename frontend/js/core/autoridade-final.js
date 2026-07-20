/**
 * SIGEE RC4.1.13 — Autoridade final de identidade, perfil e permissões.
 * Deve ser o último script local carregado no index.html.
 */
(function (window, document) {
  'use strict';
  if (window.__SIGEE_AUTHORITY_4113__) return;
  window.__SIGEE_AUTHORITY_4113__ = true;

  function normalize(value) {
    try {
      if (window.SIGEE_PERMISSOES?.normalizarPerfil) return window.SIGEE_PERMISSOES.normalizarPerfil(value);
      if (window.SIGEE_SESSION?.normalizarPerfil) return window.SIGEE_SESSION.normalizarPerfil(value);
    } catch (_) {}
    const p = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    if (p.includes('MASTER')) return 'Master';
    if (p === 'SEC' || p.includes('SECRETARIA')) return 'SEC';
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiário';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Técnico';
    return String(value || '').trim();
  }

  function sameEmail(a, b) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  function readStoredUsers() {
    const arrays = [];
    if (Array.isArray(window.usuariosDB)) arrays.push(window.usuariosDB);
    ['SIGEE_USUARIOS_DB','usuariosDB','usuarios_sigee_cache'].forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || 'null');
        if (Array.isArray(data)) arrays.push(data);
      } catch (_) {}
    });
    return arrays.flat();
  }

  function reconcileUser() {
    let base = null;
    try { base = window.SIGEE_SESSION?.getUser?.() || null; } catch (_) {}
    if (!base && window.usuarioLogado) base = window.usuarioLogado;
    if (!base) return null;

    const email = base.email || base.login || base.usuario;
    const cadastrado = readStoredUsers().find(u => sameEmail(u?.email || u?.login, email));
    const merged = Object.assign({}, base, cadastrado || {});
    merged.perfil = normalize((cadastrado && (cadastrado.perfil || cadastrado.tipo || cadastrado.role)) || base.perfil || base.tipo || base.role);
    if (!merged.perfil) return null;

    const mudou = normalize(base.perfil) !== normalize(merged.perfil)
      || String(base.nte || base.nte_nome || '') !== String(merged.nte || merged.nte_nome || '')
      || !sameEmail(base.email || base.login, merged.email || merged.login);
    try {
      if (mudou && window.SIGEE_SESSION?.setUser) window.SIGEE_SESSION.setUser(merged, { persist: true, emit: false });
    } catch (_) {}
    window.usuarioLogado = merged;
    try { usuarioLogado = merged; } catch (_) {}
    return merged;
  }

  function current() { return reconcileUser(); }
  function can(action) {
    const user = current();
    return Boolean(user && window.SIGEE_PERMISSOES?.pode?.(action, user));
  }

  function visibility(selector, visible) {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.toggle('hidden', !visible);
      el.style.display = visible ? '' : 'none';
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if ('disabled' in el) el.disabled = !visible;
    });
  }

  function updateIdentity(user) {
    if (!user) return;
    const perfil = normalize(user.perfil);
    const nte = user.nte || user.nte_nome || user.grupo || user.territorio || '';

    const nomeCard = document.getElementById('user-nome');
    if (nomeCard) nomeCard.textContent = user.nome || user.email || 'USUÁRIO SIGEE';
    const card = document.getElementById('user-perfil');
    if (card) card.textContent = `${perfil} | ${nte}`;

    document.querySelectorAll('[data-sigee-user-profile],#perfil-usuario-logado,#usuario-perfil-logado').forEach(el => {
      el.textContent = perfil;
    });

    try { window.SIGEE_FOOTER_INSTITUCIONAL?.atualizar?.(); } catch (_) {}
  }

  function apply() {
    const user = current();
    if (!user || !document.body) return;
    document.body.dataset.sigeePerfil = user.perfil;
    updateIdentity(user);

    visibility('#menu-usuarios,#menu-logs,#menu-administracao-bloco', can('usuarios'));
    visibility('#menu-relatorios', can('relatorios'));
    visibility('#menu-sala-situacao', can('salaSituacao'));
    visibility('#menu-inteligencia', can('inteligencia'));
    visibility('#btn-nova-solicitacao,[data-acao="nova-solicitacao"],.btn-nova-solicitacao,button[onclick*="abrirFormularioNovaSolicitacao"]', can('abrirSolicitacao'));
    visibility('[data-sigee-permissao="editar-escola"],.btn-editar-escola,.btn-alterar-escola-sigee,button[onclick*="editarEscola"],button[onclick*="abrirModalEditarEscola"]', can('editarEscola'));

    if (!can('usuarios')) visibility('#aba-usuarios,#aba-logs,#aba-diagnostico', false);
    if (!can('salaSituacao')) visibility('#aba-sala-situacao', false);
    if (!can('inteligencia')) visibility('#aba-inteligencia', false);
  }

  function guard(name, action, message) {
    const fn = window[name];
    if (typeof fn !== 'function' || fn.__SIGEE_4112_GUARD__) return;
    const wrapped = function () {
      if (!can(action)) {
        alert(message || 'Seu perfil não possui permissão para esta ação.');
        return false;
      }
      return fn.apply(this, arguments);
    };
    wrapped.__SIGEE_4112_GUARD__ = true;
    window[name] = wrapped;
    try { globalThis[name] = wrapped; } catch (_) {}
  }


  function protegerModuloEscolas() {
    const modulo = window.SIGEE_Escolas;
    if (!modulo || modulo.__SIGEE_4113_GUARD__) return;
    const proteger = (nome) => {
      const original = modulo[nome];
      if (typeof original !== 'function' || original.__SIGEE_4113_GUARD__) return;
      const wrapper = function () {
        if (!can('editarEscola')) {
          alert('Seu perfil não possui permissão para editar escolas.');
          return false;
        }
        return original.apply(this, arguments);
      };
      wrapper.__SIGEE_4113_GUARD__ = true;
      modulo[nome] = wrapper;
    };
    ['abrirNova','abrirEditar','abrirEditarRegistro','salvar'].forEach(proteger);
    modulo.__SIGEE_4113_GUARD__ = true;
  }

  function guards() {
    guard('abrirFormularioNovaSolicitacao', 'abrirSolicitacao');
    ['abrirModalEditarEscolaSIGEE','editarEscolaSIGEE','editarEscolaSIGEEV45','abrirModalEditarEscolaV37']
      .forEach(name => guard(name, 'editarEscola', 'Seu perfil não possui permissão para editar escolas.'));
  }

  function enforce() {
    protegerModuloEscolas();
    guards();
    apply();
  }

  function burst() {
    [0, 100, 500].forEach(ms => setTimeout(enforce, ms));
  }

  document.addEventListener('DOMContentLoaded', burst);
  document.addEventListener('sigee:usuario-logado', burst);
  document.addEventListener('sigee:login-concluido', burst);
  document.addEventListener('sigee:navegacao-concluida', burst);
  window.addEventListener('load', burst);
  setInterval(enforce, 2000);

  const previousNavigate = window.navegar;
  if (typeof previousNavigate === 'function' && !previousNavigate.__SIGEE_4112_NAV__) {
    const nav = function (aba) {
      if (['usuarios','logs','diagnostico'].includes(aba) && !can('usuarios')) { alert('Acesso permitido apenas ao perfil Master.'); aba = 'painel'; }
      if (aba === 'sala-situacao' && !can('salaSituacao')) { alert('Seu perfil não possui acesso à Sala de Situação.'); aba = 'painel'; }
      if ((aba === 'inteligencia' || aba === 'centro-inteligencia') && !can('inteligencia')) { alert('Acesso permitido apenas ao perfil Master.'); aba = 'painel'; }
      const out = previousNavigate.call(this, aba);
      burst();
      return out;
    };
    nav.__SIGEE_4112_NAV__ = true;
    window.navegar = nav;
    try { globalThis.navegar = nav; } catch (_) {}
  }

  window.SIGEE_AUTORIDADE_FINAL = Object.freeze({ aplicar: enforce, reaplicar: burst, reconciliarUsuario: reconcileUser });
})(window, document);
