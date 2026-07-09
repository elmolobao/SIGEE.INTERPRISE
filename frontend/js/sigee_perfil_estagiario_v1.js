/* =====================================================================
   SIGEE - Perfil Estagiário + permissões somente leitura
   Objetivo:
   - Incluir perfil Estagiário no cadastro de usuários.
   - Permitir Nova Solicitação e visualização de processos do próprio NTE.
   - Bloquear edição/movimentação/exclusão para Estagiário.
   - Ativar troca obrigatória de senha quando forcar_troca_senha = true.
   Carregar por último no index.html.
   ===================================================================== */
(function () {
  'use strict';

  const PERFIS_SIGEE = ['Master', 'SEC', 'Administrator', 'Tecnico', 'Estagiário', 'Consulta'];
  const GRUPO_SEC = 'SEC - TODOS OS NTEs';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';

  function txt(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function low(v) { return txt(v).toLowerCase(); }
  function sem(v) { return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function up(v) { return sem(v).toUpperCase(); }
  function user() { return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }

  function perfilCanonico(valor) {
    const p = up(valor || 'Tecnico');
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrator';
    if (p.includes('ESTAG')) return 'Estagiário';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Tecnico';
    return 'Tecnico';
  }

  function isSEC(u = user()) { return perfilCanonico(u && u.perfil) === 'SEC' || low(u && u.email) === EMAIL_SEC; }
  function isMaster(u = user()) { return perfilCanonico(u && u.perfil) === 'Master'; }
  function isAdmin(u = user()) { return perfilCanonico(u && u.perfil) === 'Administrator' || perfilCanonico(u && u.perfil) === 'Administrador'; }
  function isTecnico(u = user()) { return perfilCanonico(u && u.perfil) === 'Tecnico'; }
  function isEstagiario(u = user()) { return perfilCanonico(u && u.perfil) === 'Estagiário'; }
  function isConsulta(u = user()) { return perfilCanonico(u && u.perfil) === 'Consulta'; }
  function isGlobal(u = user()) { return isSEC(u) || isMaster(u); }
  function podeGerirUsuarios(u = user()) { return isSEC(u) || isMaster(u); }
  function podeNovaSolicitacao(u = user()) { return isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u) || isEstagiario(u); }
  function podeEditarProcesso(u = user()) { return isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u); }
  function podeEditarEscola(u = user()) { return isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u); }

  function numeroNte(v) {
    const m = txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }
  function nteFormatado(v) {
    const n = numeroNte(v);
    return n ? 'NTE ' + String(n).padStart(2, '0') : txt(v);
  }
  function nteId(v) {
    const n = numeroNte(v);
    return n || null;
  }
  function client() {
    try { return typeof obterSupabaseSIGEE === 'function' ? obterSupabaseSIGEE() : (window.supabaseClient || null); }
    catch (e) { return window.supabaseClient || null; }
  }
  function tabelaUsuarios() {
    return (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
  }

  function baseUsuarios() {
    const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);
    window.usuariosDB = base;
    try { usuariosDB = base; } catch (e) {}
    return base;
  }

  function normalizarUsuario(u) {
    u = u || {};
    const perfil = perfilCanonico(u.perfil || u.tipo || u.role || 'Tecnico');
    let nte = perfil === 'SEC' ? GRUPO_SEC : txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo || '');
    return {
      ...u,
      nome: txt(u.nome || u.name).toUpperCase(),
      email: low(u.email),
      perfil,
      nte,
      nte_id: perfil === 'SEC' ? null : (u.nte_id || nteId(nte)),
      senha: txt(u.senha || u.senha_hash || '123'),
      senha_hash: txt(u.senha_hash || u.senha || '123'),
      ativo: u.ativo !== false && u.Ativo !== false,
      Ativo: u.ativo !== false && u.Ativo !== false,
      forcar_troca_senha: !!u.forcar_troca_senha,
      pode_editar: perfil === 'Estagiário' || perfil === 'Consulta' ? false : (u.pode_editar !== false)
    };
  }

  function opcoesPerfisHtml(valorAtual) {
    return PERFIS_SIGEE.map(p => `<option value="${p}" ${perfilCanonico(valorAtual) === perfilCanonico(p) ? 'selected' : ''}>${p}</option>`).join('');
  }

  function corrigirSelectPerfil(valorAtual) {
    const sel = document.getElementById('user-form-perfil');
    if (sel) sel.innerHTML = opcoesPerfisHtml(valorAtual || sel.value || 'Tecnico');
  }

  function atualizarCabecalhoUsuario() {
    const u = user();
    if (!u) return;
    u.perfil = perfilCanonico(u.perfil);
    if (isSEC(u)) u.nte = GRUPO_SEC;
    document.body.dataset.sigeePerfil = u.perfil;
    document.body.classList.toggle('sigee-perfil-estagiario', isEstagiario(u));
    const p = document.getElementById('user-perfil');
    if (p) p.innerText = `${u.perfil} | ${u.nte || ''}`;
  }

  function bloquearBotao(el, bloquear) {
    if (!el) return;
    if (bloquear) {
      el.classList.add('hidden');
      el.disabled = true;
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.classList.remove('hidden');
      el.disabled = false;
      el.removeAttribute('aria-hidden');
    }
  }

  function aplicarPermissoesEstagiario() {
    const u = user();
    if (!u) return;
    u.perfil = perfilCanonico(u.perfil);
    atualizarCabecalhoUsuario();

    const est = isEstagiario(u);

    // Menus administrativos.
    const menuUsuarios = document.getElementById('menu-usuarios');
    if (menuUsuarios) menuUsuarios.classList.toggle('hidden', !podeGerirUsuarios(u));
    const menuLogs = document.getElementById('menu-logs');
    if (menuLogs) menuLogs.classList.toggle('hidden', !(isSEC(u) || isMaster(u) || isAdmin(u)));

    // Nova solicitação liberada para Estagiário.
    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"], .btn-nova-solicitacao').forEach(el => bloquearBotao(el, !podeNovaSolicitacao(u)));

    // Estagiário visualiza, mas não edita/movimenta.
    if (est) {
      document.querySelectorAll([
        'button[onclick*="abrirModalFluxo"]',
        'button[onclick*="alterarEtapa"]',
        'button[onclick*="excluirProcesso"]',
        'button[onclick*="salvarFluxo"]',
        'button[onclick*="registrarRetirada"]',
        'button[onclick*="mover"]',
        'button[onclick*="editar"]',
        'button[onclick*="Editar"]',
        '.btn-editar-escola',
        '[data-sigee-permissao="editar-escola"]',
        'button[onclick="abrirModalNovaEscola()"]',
        '.btn-nova-escola',
        '[data-sigee-importar]',
        '[data-sigee-exportar]'
      ].join(',')).forEach(el => {
        const rotulo = up(el.innerText || el.textContent || el.id || '');
        if (rotulo.includes('DETALHE') || rotulo.includes('VISUALIZ')) return;
        bloquearBotao(el, true);
      });
    }
  }

  async function salvarUsuarioSupabase(u) {
    const c = client();
    if (!c || !c.from) throw new Error('Supabase não inicializado.');
    const payload = normalizarUsuario(u);
    const envio = {
      nome: payload.nome,
      email: payload.email,
      perfil: payload.perfil,
      nte: payload.nte,
      nte_id: payload.nte_id,
      ativo: payload.ativo,
      Ativo: payload.Ativo,
      senha: payload.senha,
      senha_hash: payload.senha_hash,
      forcar_troca_senha: payload.forcar_troca_senha,
      pode_editar: payload.pode_editar
    };
    const { data, error } = await c.from(tabelaUsuarios()).upsert(envio, { onConflict: 'email' }).select().single();
    if (error) throw error;
    return normalizarUsuario(data || payload);
  }

  // Cadastro/edição consolidado para aceitar Estagiário e atualizar por e-mail.
  window.salvarNovoUsuarioFormularioMaster = async function (event) {
    if (event) event.preventDefault();
    if (!podeGerirUsuarios(user())) return alert('Operação permitida apenas para SEC e Master.');

    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const senha = txt(document.getElementById('user-form-senha')?.value) || '123';
    const perfil = perfilCanonico(document.getElementById('user-form-perfil')?.value);
    const nte = perfil === 'SEC' ? GRUPO_SEC : txt(document.getElementById('user-form-nte')?.value);

    if (!nome || !email) return alert('Informe nome e e-mail.');
    if (perfil !== 'SEC' && !numeroNte(nte)) return alert('Informe o NTE do usuário.');

    const base = baseUsuarios();
    let local = null;
    if (id) local = base.find(u => String(u.id) === String(id));
    if (!local) local = base.find(u => low(u.email) === email);

    const novo = normalizarUsuario({
      ...(local || {}),
      id: local?.id || id || Math.max(1, ...base.map(x => Number(x.id) || 0)) + 1,
      nome,
      email,
      senha,
      senha_hash: senha,
      perfil,
      nte,
      nte_id: perfil === 'SEC' ? null : numeroNte(nte),
      ativo: true,
      Ativo: true,
      // Usuário novo fica obrigado a trocar senha; edição comum preserva o valor.
      forcar_troca_senha: local ? !!local.forcar_troca_senha : true
    });

    try {
      const salvo = await salvarUsuarioSupabase(novo);
      const idx = local ? base.indexOf(local) : -1;
      if (idx >= 0) base[idx] = { ...base[idx], ...salvo };
      else base.push(salvo);
      window.usuariosDB = base.map(normalizarUsuario);
      try { usuariosDB = window.usuariosDB; } catch (e) {}
      try { localStorage.setItem('SIGEE_USUARIOS_CACHE', JSON.stringify(window.usuariosDB)); } catch (e) {}
      document.getElementById('modal-cadastro-usuario')?.classList.add('hidden');
      alert(local ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.');
      if (typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios();
    } catch (e) {
      alert('Erro ao salvar usuário: ' + (e.message || e.details || e));
    }
  };

  const abrirCriarPrev = window.abrirModalCriarUsuarioMaster;
  window.abrirModalCriarUsuarioMaster = function () {
    if (typeof abrirCriarPrev === 'function') abrirCriarPrev.apply(this, arguments);
    setTimeout(() => {
      corrigirSelectPerfil('Tecnico');
      const senha = document.getElementById('user-form-senha');
      if (senha) senha.value = '123';
    }, 30);
  };

  const abrirEditarPrev = window.abrirModalEditarUsuarioMaster;
  window.abrirModalEditarUsuarioMaster = function (id) {
    if (typeof abrirEditarPrev === 'function') abrirEditarPrev.apply(this, arguments);
    setTimeout(() => {
      const base = baseUsuarios().map(normalizarUsuario);
      const u = base.find(x => String(x.id) === String(id));
      corrigirSelectPerfil(u?.perfil || 'Tecnico');
      const sel = document.getElementById('user-form-perfil');
      if (sel && u) sel.value = perfilCanonico(u.perfil);
    }, 30);
  };

  window.resetarSenhaUsuarioMaster = async function (id) {
    if (!podeGerirUsuarios(user())) return alert('Operação permitida apenas para SEC e Master.');
    const base = baseUsuarios();
    const u = base.find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    const novo = normalizarUsuario({ ...u, senha: '123', senha_hash: '123', forcar_troca_senha: true });
    try {
      const salvo = await salvarUsuarioSupabase(novo);
      Object.assign(u, salvo);
      try { localStorage.setItem('SIGEE_USUARIOS_CACHE', JSON.stringify(base.map(normalizarUsuario))); } catch (e) {}
      alert(`Senha de ${u.nome} resetada para 123. O usuário deverá cadastrar nova senha no próximo acesso.`);
      if (typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios();
    } catch (e) {
      alert('Erro ao resetar senha: ' + (e.message || e.details || e));
    }
  };

  function criarModalTrocaSenha() {
    if (document.getElementById('modal-troca-senha-obrigatoria-sigee')) return;
    const div = document.createElement('div');
    div.id = 'modal-troca-senha-obrigatoria-sigee';
    div.className = 'hidden fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4';
    div.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-blue-700">
        <h2 class="text-xl font-black text-blue-900 mb-2">🔐 Cadastro de nova senha</h2>
        <p class="text-sm text-gray-600 mb-4">Por segurança, cadastre uma nova senha para continuar usando o SIGEE.</p>
        <label class="text-xs font-bold text-gray-700">Nova senha</label>
        <input id="nova-senha-obrigatoria-sigee" type="password" class="w-full border rounded-lg p-3 mb-3" placeholder="Digite a nova senha">
        <label class="text-xs font-bold text-gray-700">Confirmar senha</label>
        <input id="confirma-senha-obrigatoria-sigee" type="password" class="w-full border rounded-lg p-3 mb-4" placeholder="Confirme a nova senha">
        <button id="btn-salvar-senha-obrigatoria-sigee" class="w-full bg-blue-700 text-white font-black py-3 rounded-lg hover:bg-blue-800">Salvar nova senha</button>
      </div>`;
    document.body.appendChild(div);
    document.getElementById('btn-salvar-senha-obrigatoria-sigee').onclick = salvarNovaSenhaObrigatoria;
  }

  async function verificarTrocaSenhaObrigatoria() {
    const u = user();
    if (!u || !u.email) return;
    try {
      const c = client();
      if (!c || !c.from) return;
      const { data } = await c.from(tabelaUsuarios()).select('id,email,forcar_troca_senha').eq('email', u.email).maybeSingle();
      if (data && data.forcar_troca_senha) {
        criarModalTrocaSenha();
        document.getElementById('modal-troca-senha-obrigatoria-sigee')?.classList.remove('hidden');
      }
    } catch (e) { console.warn('SIGEE: não foi possível verificar troca obrigatória de senha.', e); }
  }

  async function salvarNovaSenhaObrigatoria() {
    const u = user();
    if (!u || !u.email) return alert('Sessão não localizada. Faça login novamente.');
    const s1 = txt(document.getElementById('nova-senha-obrigatoria-sigee')?.value);
    const s2 = txt(document.getElementById('confirma-senha-obrigatoria-sigee')?.value);
    if (s1.length < 4) return alert('A senha deve ter pelo menos 4 caracteres.');
    if (s1 !== s2) return alert('As senhas não conferem.');
    try {
      const c = client();
      const { error } = await c.from(tabelaUsuarios()).update({ senha: s1, senha_hash: s1, forcar_troca_senha: false }).eq('email', u.email);
      if (error) throw error;
      u.senha = s1;
      u.senha_hash = s1;
      u.forcar_troca_senha = false;
      document.getElementById('modal-troca-senha-obrigatoria-sigee')?.classList.add('hidden');
      alert('Senha atualizada com sucesso.');
    } catch (e) {
      alert('Erro ao salvar nova senha: ' + (e.message || e.details || e));
    }
  }

  // Bloqueios de segurança: se um botão antigo aparecer, ele não executa ação de edição para Estagiário.
  [
    'abrirModalFluxoAnalise', 'abrirModalFluxoPendencia', 'abrirModalFluxoDigitacao', 'abrirModalFluxoConferencia',
    'abrirModalFluxoAssinatura', 'registrarRetirada', 'alterarEtapaDiretoMaster', 'excluirProcessoSistema',
    'excluirProcesso', 'abrirModalEditarEscola', 'abrirModalNovaEscola'
  ].forEach(nome => {
    const anterior = window[nome];
    if (typeof anterior === 'function') {
      window[nome] = function () {
        if (isEstagiario(user())) return alert('Perfil Estagiário possui acesso somente para cadastro e consulta. Edição ou movimentação não permitida.');
        return anterior.apply(this, arguments);
      };
      try { eval(nome + ' = window[nome]'); } catch (e) {}
    }
  });

  // Compatibilidade global.
  window.perfilCanonicoSIGEE = perfilCanonico;
  try { perfilCanonicoSIGEE = perfilCanonico; } catch (e) {}
  window.SIGEE_PERFIL_ESTAGIARIO_V1 = { perfilCanonico, isEstagiario, aplicarPermissoesEstagiario, verificarTrocaSenhaObrigatoria };

  const loginPrev = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if (typeof loginPrev === 'function') {
    window.handleLogin = async function () {
      const r = await loginPrev.apply(this, arguments);
      setTimeout(aplicarPermissoesEstagiario, 50);
      setTimeout(verificarTrocaSenhaObrigatoria, 300);
      setTimeout(aplicarPermissoesEstagiario, 700);
      return r;
    };
    try { handleLogin = window.handleLogin; } catch (e) {}
  }

  const navPrev = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  if (typeof navPrev === 'function') {
    window.navegar = function (aba) {
      const r = navPrev.apply(this, arguments);
      setTimeout(aplicarPermissoesEstagiario, 20);
      setTimeout(aplicarPermissoesEstagiario, 250);
      return r;
    };
    try { navegar = window.navegar; } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    criarModalTrocaSenha();
    aplicarPermissoesEstagiario();
    setTimeout(aplicarPermissoesEstagiario, 300);
    setTimeout(verificarTrocaSenhaObrigatoria, 800);
  });
  window.addEventListener('load', () => setTimeout(aplicarPermissoesEstagiario, 150));
  setInterval(aplicarPermissoesEstagiario, 1200);
})();
