/**
 * SIGEE RC8.4.0 — Autenticação oficial centralizada e recadastramento auditado.
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

  // Ativado somente após provisionar Supabase Auth e aplicar RLS de produção.
  function authSeguraAtiva() {
    return window.SIGEE_CONFIG?.seguranca?.supabaseAuth === true;
  }

  async function consultarUsuarioAuth(email, senha) {
    const cliente = obterCliente();
    if (!cliente?.auth?.signInWithPassword) throw new Error('Supabase Auth indisponível.');
    const { data: loginData, error: loginError } = await cliente.auth.signInWithPassword({ email, password: senha });
    if (loginError || !loginData?.user) return null;
    // O vínculo deve ser garantido pelo banco via auth.uid(), não pelo e-mail do cliente.
    const { data, error } = await cliente.from(obterTabelaUsuarios())
      .select('id,email,nome,perfil,nte_id,nte,ativo,Ativo,forcar_troca_senha,pode_editar,grupo_id,perfil_acesso_id,permissoes_override,unidade_tipo,escola_id')
      .eq('auth_user_id', loginData.user.id).maybeSingle();
    if (error || !data) {
      await cliente.auth.signOut();
      throw new Error('Identidade sem vínculo autorizado no SIGEE.');
    }
    return data;
  }

  async function consultarUsuarioOficial(email) {
    const cliente = obterCliente();
    if (!cliente) throw new Error('Cliente Supabase indisponível.');

    const { data, error } = await cliente
      .from(obterTabelaUsuarios())
      .select('id,email,nome,perfil,nte_id,nte,ativo,Ativo,auth_user_id,forcar_troca_senha,senha,senha_hash,pode_editar,grupo_id,perfil_acesso_id,permissoes_override,unidade_tipo,escola_id')
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

  // Nunca persistir credenciais ou hashes no cache e na sessão do navegador.
  function usuarioSemCredenciais(usuario) {
    const copia = Object.assign({}, usuario || {});
    ['senha', 'senha_hash', 'password', 'password_hash'].forEach(function (campo) { delete copia[campo]; });
    return copia;
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
    const senha = document.getElementById('login-senha')?.value || ''; 

    if (!email || !senha) {
      alert('Informe e-mail e senha.');
      return false;
    }

    bloquearBotaoLogin(true);

    try {
      // Transição controlada: contas já vinculadas usam exclusivamente Supabase Auth.
      // Contas não provisionadas mantêm o fluxo anterior até a migração definitiva.
      const cadastro = authSeguraAtiva() ? null : await consultarUsuarioOficial(email);
      const usarAuth = authSeguraAtiva() || !!cadastro?.auth_user_id;
      const oficial = usarAuth ? await consultarUsuarioAuth(email, senha) : cadastro;

      if (!oficial || (!usarAuth && !senhaConfere(oficial, senha))) {
        alert('E-mail ou senha inválidos.');
        return false;
      }

      if (!usuarioEstaAtivo(oficial)) {
        if (usarAuth) await obterCliente()?.auth?.signOut?.();
        alert('Usuário desativado. Procure o administrador do SIGEE.');
        return false;
      }

      if (!window.SIGEE_SESSION?.normalizarUsuario || !window.SIGEE_SESSION?.setUser) {
        throw new Error('Módulo de sessão não foi carregado.');
      }

      let canonico = window.SIGEE_SESSION.normalizarUsuario(oficial);
      if (!canonico?.perfil) {
        alert('Perfil de usuário inválido. Procure o administrador.');
        return false;
      }

      // RC12.0.0: hidrata o usuário com vínculos funcionais por módulo.
      // Se a migração ainda não tiver sido aplicada, SIGEE_MODULOS preserva
      // compatibilidade automática com o domínio Escolas Extintas.
      if (window.SIGEE_MODULOS?.hidratarUsuario) {
        canonico = await window.SIGEE_MODULOS.hidratarUsuario(canonico);
        canonico = window.SIGEE_SESSION.normalizarUsuario(canonico);
      }

      const oficialSeguro = usuarioSemCredenciais(oficial);
      canonico = usuarioSemCredenciais(canonico);
      sincronizarCacheDepoisDoLogin(oficialSeguro);
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
      // RC8.4: dados são carregados pelo ciclo de vida da rota inicial.
      // O login não dispara sincronizações paralelas ou dashboards ocultos.

      // O login-controller é o último script que redefine handleLogin. Portanto,
      // ele deve marcar o login manual e enviar explicitamente o usuário oficial
      // ao controlador de recadastramento. O evento emitido pela sessão ocorre
      // antes desta marcação e não é suficiente sozinho.
      window.__SIGEE_LOGIN_CONCLUIDO__ = true;
      const loginId = `login-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const contextoPrimeiroAcesso = {
        detail: {
          login_id: loginId,
          usuario: canonico,
          loginConcluido: true,
          senhaProvisoriaUsada: !usarAuth && senha === (window.SIGEE_AUTH?.SENHA_PADRAO || 'SEC@2026')
        }
      };
      await window.SIGEE_AUTH?.verificarPrimeiroAcesso?.(contextoPrimeiroAcesso);
      document.dispatchEvent(new CustomEvent('sigee:login-concluido', contextoPrimeiroAcesso));
      const rotaInicial = window.SIGEE_MODULOS?.podeAcessar?.('ESCOLAS_EXTINTAS',canonico) === true
        ? 'processos'
        : (window.SIGEE_MODULOS?.podeAcessar?.('LEGALIZACAO',canonico) === true ? 'legalizacao' : '');
      window.dispatchEvent(new CustomEvent('sigee:session-ready', { detail:{ usuario:canonico, rotaInicial } }));
      return true;
    } catch (erro) {
      console.error('[SIGEE RC4.3.0] Falha na autenticação oficial.', erro);
      alert('Não foi possível validar o acesso no banco de dados. Atualize a página e tente novamente.');
      return false;
    } finally {
      bloquearBotaoLogin(false);
    }
  }

  async function logout() {
    if (true) {
      try { await obterCliente()?.auth?.signOut?.(); } catch (e) { console.warn('[SIGEE] Falha no logout remoto', e); }
    }
    window.__SIGEE_LOGIN_CONCLUIDO__ = false;
    window.SIGEE_SESSION?.clear?.({ persist: true, emit: true });
    document.getElementById('sistema-dashboard')?.classList.add('hidden');
    document.getElementById('tela-login')?.classList.remove('hidden');
    document.getElementById('form-login')?.reset?.();
    return true;
  }

  // Referência estável: scripts posteriores podem redefinir window.handleLogin.
  window.SIGEE_LOGIN_AUTH = Object.freeze({ login });
  window.handleLogin = login;
  window.logout = logout;
  try {
    globalThis.handleLogin = login;
    globalThis.logout = logout;
  } catch (_) {}
})(window, document);
