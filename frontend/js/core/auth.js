/**
 * SIGEE Enterprise RC4.3.8 — Autenticação e primeiro acesso.
 * Depende de session.js e supabase.js. Não controla menus ou permissões.
 */
(function (window) {
  'use strict';

  const SENHA_PADRAO = 'SEC@2026';
  const PROFILE_MAP = Object.freeze({
    MASTER: 'Master', SEC: 'SEC', ADMINISTRADOR: 'Administrador', ADMINISTRATOR: 'Administrador',
    TECNICO: 'Técnico', ESTAGIARIO: 'Estagiário', GESTOR: 'Gestor', DIRIGENTE: 'Gestor', CONSULTA: 'Consulta'
  });

  function text(value) { return value == null ? '' : String(value).trim(); }
  function token(value) {
    return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }
  function normalizeEmail(email) { return text(email).toLowerCase(); }
  function normalizeProfile(value) {
    if (window.SIGEE_SESSION && typeof window.SIGEE_SESSION.normalizarPerfil === 'function') return window.SIGEE_SESSION.normalizarPerfil(value);
    const key = token(value);
    if (!key) return '';
    if (PROFILE_MAP[key]) return PROFILE_MAP[key];
    if (key.includes('MASTER')) return 'Master';
    if (key === 'SEC' || key.includes('SECRETARIA')) return 'SEC';
    if (key.includes('ADMIN')) return 'Administrador';
    if (key.includes('TECNIC')) return 'Técnico';
    if (key.includes('ESTAG')) return 'Estagiário';
    if (key.includes('GESTOR') || key.includes('DIRIGENTE')) return 'Gestor';
    if (key.includes('CONSULT')) return 'Consulta';
    return text(value);
  }
  function getUser() {
    return window.SIGEE_SESSION ? window.SIGEE_SESSION.getUser() : (window.usuarioLogado || null);
  }
  function setUser(user, options) {
    if (user && user.perfil) user.perfil = normalizeProfile(user.perfil);
    return window.SIGEE_SESSION ? window.SIGEE_SESSION.setUser(user, options) : (window.usuarioLogado = user);
  }
  function hasProfile() {
    const allowed = Array.from(arguments).map(normalizeProfile);
    return allowed.includes(normalizeProfile((getUser() || {}).perfil));
  }
  function client() {
    try { return window.SIGEE_SUPABASE && window.SIGEE_SUPABASE.criarCliente(); } catch (_) { return null; }
  }

  function ensurePasswordModal() {
    let modal = document.getElementById('modal-troca-senha-primeiro-acesso');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'modal-troca-senha-primeiro-acesso';
    modal.className = 'hidden fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4';
    modal.innerHTML = '<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-gray-900">' +
      '<h2 class="text-xl font-black text-blue-900 mb-2">Primeiro acesso ao SIGEE</h2>' +
      '<p class="text-sm text-gray-600 mb-4">Por segurança, cadastre uma nova senha para continuar.</p>' +
      '<label class="text-xs font-bold uppercase text-gray-600">Nova senha</label>' +
      '<input id="primeiro-acesso-nova-senha" type="password" autocomplete="new-password" class="w-full border rounded-lg p-3 mb-3">' +
      '<label class="text-xs font-bold uppercase text-gray-600">Confirmar senha</label>' +
      '<input id="primeiro-acesso-confirma-senha" type="password" autocomplete="new-password" class="w-full border rounded-lg p-3 mb-4">' +
      '<button id="btn-salvar-primeiro-acesso" type="button" class="w-full bg-blue-700 text-white font-black rounded-lg p-3">Salvar nova senha</button></div>';
    document.body.appendChild(modal);
    modal.querySelector('#btn-salvar-primeiro-acesso').addEventListener('click', saveFirstPassword);
    return modal;
  }
  function showPasswordModal() {
    const modal = ensurePasswordModal();
    modal.classList.remove('hidden');
    setTimeout(function () { modal.querySelector('#primeiro-acesso-nova-senha').focus(); }, 50);
  }
  function hidePasswordModal() { document.getElementById('modal-troca-senha-primeiro-acesso')?.classList.add('hidden'); }
  async function saveFirstPassword() {
    const password = text(document.getElementById('primeiro-acesso-nova-senha')?.value);
    const confirmation = text(document.getElementById('primeiro-acesso-confirma-senha')?.value);
    if (password.length < 6) return alert('A nova senha deve ter pelo menos 6 caracteres.');
    if (password !== confirmation) return alert('As senhas não conferem.');
    const user = getUser();
    const supabase = client();
    if (!user || !user.email) return alert('Sessão não localizada. Faça login novamente.');
    if (!supabase) return alert('Cliente Supabase indisponível.');
    const payload = { senha: password, senha_hash: password, forcar_troca_senha: false };
    const result = await supabase.from('usuarios_sigee').update(payload).eq('email', normalizeEmail(user.email)).select('*').maybeSingle();
    if (result.error) return alert('Erro ao salvar nova senha: ' + result.error.message);
    setUser(Object.assign({}, user, payload, result.data || {}));
    window.__SIGEE_RECADASTRAMENTO_ABERTO__ = false;
    hidePasswordModal();
    alert('Senha cadastrada com sucesso.');
  }
  function authenticatedAreaIsVisible() {
    const login = document.getElementById('tela-login');
    const dashboard = document.getElementById('sistema-dashboard');
    const loginHidden = !login || login.classList.contains('hidden');
    const dashboardVisible = !!dashboard && !dashboard.classList.contains('hidden');
    return loginHidden && dashboardVisible;
  }
  function exigeTrocaSenha(user) {
    const value = user?.forcar_troca_senha;
    if (value === true || value === 1) return true;
    const normalized = text(value).toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 't' || normalized === 'sim' || normalized === 'yes';
  }

  function checkFirstAccess(event) {
    const detail = event && event.detail ? event.detail : {};
    const userFromEvent = detail.usuario || null;
    const user = userFromEvent || getUser();
    const loginCompleted = detail.loginConcluido === true;

    if (!loginCompleted || window.__SIGEE_LOGIN_CONCLUIDO__ !== true) return false;
    if (!user || !exigeTrocaSenha(user)) return false;

    if (userFromEvent) {
      try { setUser(userFromEvent, { emit: false, persist: true }); } catch (_) {}
      window.usuarioLogado = userFromEvent;
      try { localStorage.setItem('SIGEE_USUARIO_LOGADO', JSON.stringify(userFromEvent)); } catch (_) {}
    }

    if (window.__SIGEE_RECADASTRAMENTO_ABERTO__ === true) return true;
    window.__SIGEE_RECADASTRAMENTO_ABERTO__ = true;

    let attempts = 0;
    const openWhenReady = function () {
      attempts += 1;
      if (window.__SIGEE_LOGIN_CONCLUIDO__ !== true) {
        window.__SIGEE_RECADASTRAMENTO_ABERTO__ = false;
        return;
      }
      if (authenticatedAreaIsVisible()) {
        showPasswordModal();
        return;
      }
      if (attempts < 20) setTimeout(openWhenReady, 100);
      else showPasswordModal();
    };
    setTimeout(openWhenReady, 0);
    return true;
  }

  const api = Object.freeze({
    SENHA_PADRAO, normalizarEmail: normalizeEmail, normalizarPerfil: normalizeProfile,
    obterUsuarioLogado: getUser, definirUsuarioLogado: setUser, usuarioTemPerfil: hasProfile,
    mostrarModalTrocaSenha: showPasswordModal, salvarSenhaPrimeiroAcesso: saveFirstPassword,
    verificarPrimeiroAcesso: checkFirstAccess
  });
  window.SIGEE_AUTH = api;
  window.normalizarPerfilSIGEE = normalizeProfile;
  window.perfilCanonicoSIGEE = normalizeProfile;

  document.addEventListener('sigee:usuario-logado', checkFirstAccess);
})(window);
