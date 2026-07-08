/* SIGEE Enterprise 2.0 - Autenticação */
(function () {
  function normalizar(txt) {
    return (txt || '').toString().trim().toLowerCase();
  }

  function autenticarLocal(email, senha, usuarios) {
    const e = normalizar(email);
    const s = (senha || '').toString();
    return (usuarios || []).find(u => {
      const ativo = u.ativo !== false;
      const emailOk = normalizar(u.email) === e;
      const senhaUser = (u.senha || u.senha_local || '123').toString();
      return ativo && emailOk && senhaUser === s;
    }) || null;
  }

  function definirUsuarioLogado(usuario) {
    window.usuarioLogado = usuario;
    sessionStorage.setItem('SIGEE_USUARIO_LOGADO', JSON.stringify(usuario || null));
    if (window.SIGEE_PERMISSOES) window.SIGEE_PERMISSOES.aplicarMenu(usuario);
  }

  function obterUsuarioSessao() {
    try { return JSON.parse(sessionStorage.getItem('SIGEE_USUARIO_LOGADO') || 'null'); }
    catch { return null; }
  }

  function limparSessao() {
    sessionStorage.removeItem('SIGEE_USUARIO_LOGADO');
    window.usuarioLogado = null;
  }

  window.SIGEE_AUTH = {
    autenticarLocal,
    definirUsuarioLogado,
    obterUsuarioSessao,
    limparSessao
  };
})();
