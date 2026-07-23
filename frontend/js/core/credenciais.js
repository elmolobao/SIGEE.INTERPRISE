/**
 * SIGEE Enterprise RC4.5.0 — Autoridade única de credenciais.
 * Centraliza login, logout, primeiro acesso, recadastramento e reset de senha.
 */
(function (window, document) {
  'use strict';

  if (window.__SIGEE_CREDENCIAIS_RC450__) return;
  window.__SIGEE_CREDENCIAIS_RC450__ = true;

  const SENHA_PROVISORIA = 'SEC@2026';
  const TABELA_USUARIOS = 'usuarios_sigee';
  let usuarioPendenteTroca = null;
  let salvandoSenha = false;

  function texto(valor) {
    return valor == null ? '' : String(valor).trim();
  }

  function emailNormalizado(valor) {
    return texto(valor).toLowerCase();
  }

  function valorVerdadeiro(valor) {
    if (valor === true || valor === 1) return true;
    return ['true', '1', 't', 'sim', 'yes'].includes(texto(valor).toLowerCase());
  }

  function valorAtivo(valor) {
    if (valor === false || valor === 0) return false;
    return !['false', '0', 'inativo', 'desativado', 'bloqueado', 'não', 'nao'].includes(texto(valor).toLowerCase());
  }

  function cliente() {
    return window.SIGEE_SUPABASE?.criarCliente?.()
      || window.criarClienteSupabaseSIGEE?.()
      || window.SIGEE_SUPABASE_CLIENT
      || null;
  }

  async function consultarUsuarioPorEmail(email) {
    const c = cliente();
    if (!c) throw new Error('Cliente Supabase indisponível.');
    const { data, error } = await c.from(TABELA_USUARIOS).select('*').ilike('email', email).limit(1).maybeSingle();
    if (error) throw error;
    return data || null;
  }

  function senhaConfere(usuario, senha) {
    return [usuario?.senha, usuario?.senha_hash, usuario?.password, usuario?.password_hash]
      .map(texto)
      .filter(Boolean)
      .some(function (salva) { return salva === senha; });
  }

  function usuarioAtivo(usuario) {
    if (!usuario) return false;
    if ('ativo' in usuario && !valorAtivo(usuario.ativo)) return false;
    if ('Ativo' in usuario && !valorAtivo(usuario.Ativo)) return false;
    if ('status' in usuario && !valorAtivo(usuario.status)) return false;
    return true;
  }

  function exigeTroca(usuario, senhaUsada) {
    return valorVerdadeiro(usuario?.forcar_troca_senha) || senhaUsada === SENHA_PROVISORIA;
  }

  function bloquearLogin(bloquear) {
    const botao = document.querySelector('#form-login button[type="submit"]');
    if (!botao) return;
    botao.disabled = !!bloquear;
    botao.textContent = bloquear ? 'Validando acesso...' : 'Entrar no Sistema';
  }

  function atualizarIdentidade(usuario) {
    const nome = document.getElementById('user-nome');
    const perfil = document.getElementById('user-perfil');
    if (nome) nome.textContent = usuario.nome || usuario.nome_completo || usuario.email || '';
    if (perfil) perfil.textContent = `${usuario.perfil || ''}${usuario.nte ? ` | ${usuario.nte}` : ''}`;
    window.SIGEE_PERMISSOES?.aplicar?.();
    window.SIGEE_FOOTER_INSTITUCIONAL?.atualizar?.();
  }

  function garantirModal() {
    let modal = document.getElementById('modal-troca-senha-primeiro-acesso');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'modal-troca-senha-primeiro-acesso';
    modal.className = 'hidden fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <form id="form-primeiro-acesso-sigee" class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-gray-900">
        <h2 class="text-xl font-black text-blue-900 mb-2">Cadastro de nova senha</h2>
        <p class="text-sm text-gray-600 mb-4">Por segurança, cadastre uma senha pessoal para continuar no SIGEE.</p>
        <label class="text-xs font-bold uppercase text-gray-600" for="primeiro-acesso-nova-senha">Nova senha</label>
        <input id="primeiro-acesso-nova-senha" name="new-password" type="password" autocomplete="new-password" class="w-full border rounded-lg p-3 mb-3" required minlength="6">
        <label class="text-xs font-bold uppercase text-gray-600" for="primeiro-acesso-confirma-senha">Confirmar senha</label>
        <input id="primeiro-acesso-confirma-senha" name="confirm-password" type="password" autocomplete="new-password" class="w-full border rounded-lg p-3 mb-4" required minlength="6">
        <button id="btn-salvar-primeiro-acesso" type="submit" class="w-full bg-blue-700 text-white font-black rounded-lg p-3">Salvar nova senha</button>
      </form>`;
    document.body.appendChild(modal);
    modal.querySelector('form').addEventListener('submit', salvarNovaSenha);
    return modal;
  }

  function abrirModal(usuario) {
    usuarioPendenteTroca = usuario;
    const modal = garantirModal();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      modal.querySelector('#primeiro-acesso-nova-senha')?.focus();
    }, 0);
  }

  function fecharModal() {
    document.getElementById('modal-troca-senha-primeiro-acesso')?.classList.add('hidden');
    document.body.style.overflow = '';
    usuarioPendenteTroca = null;
  }

  async function salvarNovaSenha(event) {
    event?.preventDefault?.();
    if (salvandoSenha) return false;

    const senha = texto(document.getElementById('primeiro-acesso-nova-senha')?.value);
    const confirmacao = texto(document.getElementById('primeiro-acesso-confirma-senha')?.value);
    if (senha.length < 6) return alert('A nova senha deve ter pelo menos 6 caracteres.');
    if (senha === SENHA_PROVISORIA) return alert('Escolha uma senha diferente da senha provisória.');
    if (senha !== confirmacao) return alert('As senhas não conferem.');

    const usuario = usuarioPendenteTroca || window.SIGEE_SESSION?.getUser?.();
    if (!usuario?.email) return alert('Sessão não localizada. Faça login novamente.');
    const c = cliente();
    if (!c) return alert('Cliente Supabase indisponível.');

    salvandoSenha = true;
    const botao = document.getElementById('btn-salvar-primeiro-acesso');
    if (botao) { botao.disabled = true; botao.textContent = 'Salvando...'; }

    try {
      const payload = { senha, senha_hash: senha, forcar_troca_senha: false };
      const { data, error } = await c.from(TABELA_USUARIOS)
        .update(payload)
        .ilike('email', emailNormalizado(usuario.email))
        .select('*')
        .maybeSingle();
      if (error) throw error;

      const atualizado = Object.assign({}, usuario, data || {}, payload);
      window.SIGEE_SESSION?.setUser?.(atualizado, {
        source: 'credenciais-rc4.5.0', forceProfile: true, persist: true, emit: true
      });
      fecharModal();
      alert('Nova senha cadastrada com sucesso.');
      return true;
    } catch (erro) {
      console.error('[SIGEE RC4.5.0] Erro ao salvar nova senha.', erro);
      alert('Erro ao salvar nova senha: ' + (erro.message || erro));
      return false;
    } finally {
      salvandoSenha = false;
      if (botao) { botao.disabled = false; botao.textContent = 'Salvar nova senha'; }
    }
  }

  async function login(event) {
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();

    const email = emailNormalizado(document.getElementById('login-email')?.value);
    const senha = texto(document.getElementById('login-senha')?.value);
    if (!email || !senha) {
      alert('Informe e-mail e senha.');
      return false;
    }

    bloquearLogin(true);
    try {
      const oficial = await consultarUsuarioPorEmail(email);
      if (!oficial || !senhaConfere(oficial, senha)) {
        alert('E-mail ou senha inválidos.');
        return false;
      }
      if (!usuarioAtivo(oficial)) {
        alert('Usuário desativado. Procure o administrador do SIGEE.');
        return false;
      }
      if (!window.SIGEE_SESSION?.normalizarUsuario || !window.SIGEE_SESSION?.setUser) {
        throw new Error('Módulo de sessão não carregado.');
      }

      const canonico = window.SIGEE_SESSION.normalizarUsuario(oficial);
      if (!canonico?.perfil) {
        alert('Perfil de usuário inválido. Procure o administrador.');
        return false;
      }

      // Preserva explicitamente o sinal de primeiro acesso no objeto de sessão.
      canonico.forcar_troca_senha = oficial.forcar_troca_senha;
      window.SIGEE_SESSION.setUser(canonico, {
        source: 'login-credenciais-rc4.5.0', forceProfile: true, persist: true, emit: true
      });

      document.getElementById('tela-login')?.classList.add('hidden');
      document.getElementById('sistema-dashboard')?.classList.remove('hidden');
      atualizarIdentidade(canonico);
      try { window.registrarLog?.('Acesso realizado ao SIGEE.'); } catch (_) {}
      // A rota inicial é definida exclusivamente por SIGEE_AUTORIZACAO.
      try { window.carregarEContarProcessosHorizontais?.(); } catch (_) {}

      // A decisão é feita com o mesmo registro oficial usado para autenticar.
      if (exigeTroca(oficial, senha)) abrirModal(Object.assign({}, canonico, oficial));

      setTimeout(function () {
        try { window.sincronizarSupabaseSegundoPlanoSIGEE?.(); } catch (_) {}
      }, 300);
      return true;
    } catch (erro) {
      console.error('[SIGEE RC4.5.0] Falha no login.', erro);
      alert('Não foi possível validar o acesso no banco de dados. Atualize a página e tente novamente.');
      return false;
    } finally {
      bloquearLogin(false);
    }
  }

  function logout() {
    fecharModal();
    window.SIGEE_SESSION?.clear?.({ source: 'logout-credenciais-rc4.5.0', persist: true, emit: true });
    document.getElementById('sistema-dashboard')?.classList.add('hidden');
    document.getElementById('tela-login')?.classList.remove('hidden');
    document.getElementById('form-login')?.reset?.();
    return true;
  }

  async function resetarSenhaUsuarioMaster(id) {
    const usuarioAtual = window.SIGEE_SESSION?.getUser?.();
    const perfil = window.SIGEE_SESSION?.normalizarPerfil?.(usuarioAtual?.perfil) || texto(usuarioAtual?.perfil);
    if (perfil !== 'Master') return alert('Operação permitida apenas para o perfil Master.');
    if (!id) return alert('Usuário não localizado.');
    if (!confirm(`Resetar a senha para ${SENHA_PROVISORIA} e exigir novo cadastro no próximo acesso?`)) return false;

    const c = cliente();
    if (!c) return alert('Cliente Supabase indisponível.');
    try {
      const { error } = await c.from(TABELA_USUARIOS)
        .update({ senha: SENHA_PROVISORIA, senha_hash: SENHA_PROVISORIA, forcar_troca_senha: true })
        .eq('id', id);
      if (error) throw error;
      await window.carregarListaUsuarios?.();
      alert(`Senha redefinida para ${SENHA_PROVISORIA}. O recadastramento será obrigatório no próximo login.`);
      return true;
    } catch (erro) {
      console.error('[SIGEE RC4.5.0] Erro no reset de senha.', erro);
      alert('Erro ao resetar senha: ' + (erro.message || erro));
      return false;
    }
  }

  function instalarAutoridade() {
    window.handleLogin = login;
    window.logout = logout;
    window.resetarSenhaUsuarioMaster = resetarSenhaUsuarioMaster;
    window.SIGEE_CREDENCIAIS = Object.freeze({
      login, logout, resetarSenhaUsuarioMaster, salvarNovaSenha,
      abrirModalTrocaSenha: abrirModal, senhaProvisoria: SENHA_PROVISORIA
    });
    try {
      globalThis.handleLogin = login;
      globalThis.logout = logout;
      globalThis.resetarSenhaUsuarioMaster = resetarSenhaUsuarioMaster;
    } catch (_) {}

    const form = document.getElementById('form-login');
    if (form) {
      form.onsubmit = login;
      form.setAttribute('onsubmit', 'return SIGEE_CREDENCIAIS.login(event)');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarAutoridade, { once: true });
  } else {
    instalarAutoridade();
  }
  window.addEventListener('load', instalarAutoridade, { once: true });
})(window, document);
