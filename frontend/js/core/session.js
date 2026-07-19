/**
 * SIGEE Enterprise RC4.1 — Sessão central.
 * Fonte única para leitura, gravação e eventos do usuário autenticado.
 */
(function (window) {
  'use strict';

  const STORAGE_KEYS = Object.freeze(['SIGEE_USUARIO_LOGADO', 'usuarioLogadoSIGEE']);
  const PROFILE_MAP = Object.freeze({
    MASTER: 'Master', SEC: 'SEC', GESTOR: 'Gestor', DIRIGENTE: 'Gestor',
    ADMINISTRADOR: 'Administrador', ADMINISTRATOR: 'Administrador',
    TECNICO: 'Técnico', ESTAGIARIO: 'Estagiário', CONSULTA: 'Consulta'
  });
  let currentUser = null;

  function parseJSON(value) {
    try { return value ? JSON.parse(value) : null; } catch (_) { return null; }
  }

  function token(value) {
    return String(value == null ? '' : value)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  function normalizeProfile(value) {
    const key = token(value);
    if (!key) return '';
    if (PROFILE_MAP[key]) return PROFILE_MAP[key];
    if (key.includes('MASTER')) return 'Master';
    if (key === 'SEC' || key.includes('SECRETARIA')) return 'SEC';
    if (key.includes('GESTOR') || key.includes('DIRIGENTE')) return 'Gestor';
    if (key.includes('ADMIN')) return 'Administrador';
    if (key.includes('TECNIC')) return 'Técnico';
    if (key.includes('ESTAG')) return 'Estagiário';
    if (key.includes('CONSULT')) return 'Consulta';
    return String(value == null ? '' : value).trim();
  }

  function normalizeUser(user) {
    if (!user || typeof user !== 'object') return null;
    const normalized = Object.assign({}, user);
    const rawProfile = normalized.perfil || normalized.tipo || normalized.role;
    if (rawProfile) normalized.perfil = normalizeProfile(rawProfile);
    return normalized;
  }

  function readStorage() {
    for (const key of STORAGE_KEYS) {
      const user = parseJSON(window.localStorage && localStorage.getItem(key));
      if (user && typeof user === 'object') return normalizeUser(user);
    }
    return null;
  }

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function getUser() {
    if (currentUser) return currentUser;
    if (window.usuarioLogado && typeof window.usuarioLogado === 'object') {
      currentUser = normalizeUser(window.usuarioLogado);
      window.usuarioLogado = currentUser;
      return currentUser;
    }
    currentUser = readStorage();
    if (currentUser) window.usuarioLogado = currentUser;
    return currentUser;
  }

  function setUser(user, options) {
    const opts = Object.assign({ persist: true, emit: true }, options || {});
    currentUser = normalizeUser(user);
    window.usuarioLogado = currentUser;

    if (opts.persist && window.localStorage) {
      STORAGE_KEYS.forEach(function (key) {
        if (currentUser) localStorage.setItem(key, JSON.stringify(currentUser));
        else localStorage.removeItem(key);
      });
    }
    if (opts.emit) emit(currentUser ? 'sigee:usuario-logado' : 'sigee:usuario-deslogado', currentUser);
    return currentUser;
  }

  function patchUser(changes, options) {
    const user = Object.assign({}, getUser() || {}, changes || {});
    return setUser(user, options);
  }

  function clear(options) {
    return setUser(null, options);
  }

  window.SIGEE_SESSION = Object.freeze({ getUser, setUser, patchUser, clear, normalizarPerfil: normalizeProfile, STORAGE_KEYS });
})(window);
