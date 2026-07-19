/**
 * SIGEE Enterprise RC4.1 — Sessão central.
 * Fonte única para leitura, gravação e eventos do usuário autenticado.
 */
(function (window) {
  'use strict';

  const STORAGE_KEYS = Object.freeze(['SIGEE_USUARIO_LOGADO', 'usuarioLogadoSIGEE']);
  let currentUser = null;

  function parseJSON(value) {
    try { return value ? JSON.parse(value) : null; } catch (_) { return null; }
  }

  function readStorage() {
    for (const key of STORAGE_KEYS) {
      const user = parseJSON(window.localStorage && localStorage.getItem(key));
      if (user && typeof user === 'object') return user;
    }
    return null;
  }

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function getUser() {
    if (currentUser) return currentUser;
    if (window.usuarioLogado && typeof window.usuarioLogado === 'object') {
      currentUser = window.usuarioLogado;
      return currentUser;
    }
    currentUser = readStorage();
    if (currentUser) window.usuarioLogado = currentUser;
    return currentUser;
  }

  function setUser(user, options) {
    const opts = Object.assign({ persist: true, emit: true }, options || {});
    currentUser = user && typeof user === 'object' ? user : null;
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

  window.SIGEE_SESSION = Object.freeze({ getUser, setUser, patchUser, clear, STORAGE_KEYS });
})(window);
