/**
 * SIGEE RC4.4.0 — Autenticação oficial centralizada e recadastramento auditado.
 *
 * Regras:
 * - o registro oficial de usuarios_sigee é a única autoridade para login;
 * - cache/localStorage/usuariosDB não autorizam nem bloqueiam acesso;
 * - senha e status são validados no mesmo registro oficial;
 * - o cache local é atualizado somente depois da autenticação aprovada.
 */
(function (window, document) {
  'use strict';

  if (window.__SIGEE_LOGIN_RC430__) return;
  window.__SIGEE_LOGIN_RC430__ = true;

  function texto(valor) {
    return valor == null ? '' : String(valor).trim();
  }

  function emailNormalizado(valor) {
    return texto(valor).toLowerCase();
  }

  function booleanoAtivo(valor) {
    if (valor === false || valor === 0 || valor === '0') return false;
    const token = texto(valor).toLowerCase();
    if (['false', 'inativo', 'desativado', 'não', 'nao'].includes(token)) return false;
    return true;
  }

  function obterCliente() {
    return window.SIGEE_SUPABASE?.criarCliente?.()
      || window.criarClienteSupabaseSIGEE?.()
      || window.SIGEE_SUPABASE_CLIENT
      || null;
  }

  function obterTabelaUsuarios() {
    return window.SIGEE_CONFIG?.tabelas?.usuarios
      || window.SIGEE_SUPABASE_TABELAS?.usuarios
      || 'usuarios_sigee';
  }

  async function consultarUsuarioOficial(email) {
    const cliente = obterCliente();
    if (!cliente) throw new Error('Cliente Supabase indisponível.');

    const { data, error } = await cliente
      .from(obterTabelaUsuarios())
      .select('*')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  function senhaConfere(usuario, senhaInformada) {
    const candidatos = [
      usuario?.senha,
      usuario?.senha_hash,
      usuario?.password,
      usuario?.password_hash
    ].map(texto).filter(Boolean);

    return candidatos.some(function (senhaSalva) {
      return senhaSalva === senhaInformada;
    });
  }

  function usuarioEstaAtivo(usuario) {
    if (!usuario) return false;
    if ('ativo' in usuario && !booleanoAtivo(usuario.ativo)) return false;
    if ('Ativo' in usuario && !booleanoAtivo(usuario.Ativo)) return false;
    if ('status' in usuario) {
      const status = texto(usuario.status).toLowerCase();
      if (['inativo', 'desativado', 'bloqueado'].includes(status)) return false;
    }
    return true;
  }

  function sincronizarCacheDepoisDoLogin(usuario) {
    try {
      const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : [];
      const email = emailNormalizado(usuario.email || usuario.login);
      const indice = base.findIndex(function (item) {
        return emailNormalizado(item?.email || item?.login) === email;
      });

      if (indice >= 0) base[indice] = Object.assign({}, base[indice], usuario);
      else base.push(Object.assign({}, usuario));

      window.usuariosDB = base;
      try { globalThis.usuariosDB = base; } catch (_) {}
    } catch (erro) {
      console.warn('[SIGEE RC4.3.0] Cache local não pôde ser sincronizado.', erro);
    }
  }

  function renderizarUsuario(usuario) {
    const nome = document.getElementById('user-nome');
    const perfil = document.getElementById('user-perfil');

    if (nome) nome.textContent = usuario.nome || usuario.nome_completo || usuario.email || '';
    if (perfil) perfil.textContent = `${usuario.perfil || ''}${usuario.nte ? ` | ${usuario.nte}` : ''}`;

    window.SIGEE_PERMISSOES?.aplicar?.();
    window.SIGEE_FOOTER_INSTITUCIONAL?.atualizar?.();
  }

  function bloquearBotaoLogin(bloquear) {
    const botao = document.querySelector('#form-login button[type="submit"]');
    if (!botao) return;
    botao.disabled = !!bloquear;
    botao.textContent = bloquear ? 'Validando acesso...' : 'Entrar no Sistema';
  }

  async function login(event) {
    event?.preventDefault?.();

    const email = emailNormalizado(document.getElementById('login-email')?.value);
    const senha = texto(document.getElementById('login-senha')?.value);

    if (!email || !senha) {
      alert('Informe e-mail e senha.');
      return false;
    }

    bloquearBotaoLogin(true);

    try {
      const oficial = await consultarUsuarioOficial(email);

      if (!oficial || !senhaConfere(oficial, senha)) {
        alert('E-mail ou senha inválidos.');
        return false;
      }

      if (!usuarioEstaAtivo(oficial)) {
        alert('Usuário desativado. Procure o administrador do SIGEE.');
        return false;
      }

      if (!window.SIGEE_SESSION?.normalizarUsuario || !window.SIGEE_SESSION?.setUser) {
        throw new Error('Módulo de sessão não foi carregado.');
      }

      const canonico = window.SIGEE_SESSION.normalizarUsuario(oficial);
      if (!canonico?.perfil) {
        alert('Perfil de usuário inválido. Procure o administrador.');
        return false;
      }

      sincronizarCacheDepoisDoLogin(oficial);
      window.SIGEE_SESSION.setUser(canonico, {
        source: 'supabase-login-rc4.3.0',
        forceProfile: true,
        persist: true,
        emit: true
      });

      document.getElementById('tela-login')?.classList.add('hidden');
      document.getElementById('sistema-dashboard')?.classList.remove('hidden');
      renderizarUsuario(canonico);

      try { window.registrarLog?.('Acesso realizado ao SIGEE.'); } catch (_) {}
      try { window.navegar?.('processos'); } catch (_) {}
      try { window.carregarEContarProcessosHorizontais?.(); } catch (_) {}

      setTimeout(function () {
        try { window.sincronizarSupabaseSegundoPlanoSIGEE?.(); } catch (_) {}
      }, 300);

      // O login-controller é o último script que redefine handleLogin. Portanto,
      // ele deve marcar o login manual e enviar explicitamente o usuário oficial
      // ao controlador de recadastramento. O evento emitido pela sessão ocorre
      // antes desta marcação e não é suficiente sozinho.
      window.__SIGEE_LOGIN_CONCLUIDO__ = true;
      const contextoPrimeiroAcesso = {
        detail: {
          usuario: canonico,
          loginConcluido: true,
          senhaProvisoriaUsada: senha === (window.SIGEE_AUTH?.SENHA_PADRAO || 'SEC@2026')
        }
      };
      await window.SIGEE_AUTH?.verificarPrimeiroAcesso?.(contextoPrimeiroAcesso);
      document.dispatchEvent(new CustomEvent('sigee:login-concluido', contextoPrimeiroAcesso));
      return true;
    } catch (erro) {
      console.error('[SIGEE RC4.3.0] Falha na autenticação oficial.', erro);
      alert('Não foi possível validar o acesso no banco de dados. Atualize a página e tente novamente.');
      return false;
    } finally {
      bloquearBotaoLogin(false);
    }
  }

  function logout() {
    window.__SIGEE_LOGIN_CONCLUIDO__ = false;
    window.SIGEE_SESSION?.clear?.({ persist: true, emit: true });
    document.getElementById('sistema-dashboard')?.classList.add('hidden');
    document.getElementById('tela-login')?.classList.remove('hidden');
    document.getElementById('form-login')?.reset?.();
    return true;
  }

  window.handleLogin = login;
  window.logout = logout;
  try {
    globalThis.handleLogin = login;
    globalThis.logout = logout;
  } catch (_) {}
})(window, document);
