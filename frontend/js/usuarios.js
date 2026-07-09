/* =====================================================================
   SIGEE Enterprise 2.0 - Entrega Usuarios/Permissoes
   Arquivo: frontend/js/usuarios.js
   Objetivo: centralizar regras de usuarios, perfis e reforco de menu
   Compatibilidade: funciona sobre o app.js atual, sem remover logica existente.
   ===================================================================== */
(function(){
  'use strict';

  const GRUPO_SEC = 'SEC - TODOS OS NTEs';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';
  const STORAGE_USUARIOS = 'SIGEE_USUARIOS_COMPLETO_V41';

  function txt(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function up(v){ return semAcento(v).toUpperCase(); }

  function usuarioAtual(){
    try { return window.usuarioLogado || usuarioLogado || null; } catch(e) { return window.usuarioLogado || null; }
  }

  function baseUsuarios(){
    let base = [];
    try {
      if (Array.isArray(window.usuariosDB)) base = window.usuariosDB;
      else if (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB)) base = usuariosDB;
    } catch(e) {}
    window.usuariosDB = base;
    try { usuariosDB = base; } catch(e) {}
    return base;
  }

  function perfilCanonico(valor){
    const p = up(valor || 'Tecnico');
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }

  function normalizarUsuario(u){
    u = u || {};
    const email = low(u.email);
    let perfil = perfilCanonico(u.perfil || u.tipo || u.role || 'Tecnico');
    if (email === 'elmo.lobao@enova.educacao.ba.gov.br') perfil = 'Master';
    if (email === EMAIL_SEC) perfil = 'SEC';
    let nte = txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo || u.nte_id || 'NTE-26 Salvador');
    if (perfil === 'SEC' || up(nte).includes('SEC') || up(nte).includes('TODOS OS NTES')) nte = GRUPO_SEC;
    return Object.assign({}, u, {
      id: u.id || Date.now(),
      nome: txt(u.nome || u.name || 'USUARIO').toUpperCase(),
      email,
      senha: txt(u.senha || u.password || '123'),
      perfil,
      nte,
      grupo: perfil === 'SEC' ? 'SEC' : (u.grupo || ''),
      ativo: u.ativo !== false
    });
  }

  function isSEC(u){ u = u || usuarioAtual(); return perfilCanonico(u && u.perfil) === 'SEC' || low(u && u.email) === EMAIL_SEC || up(u && u.nte).includes('TODOS OS NTES'); }
  function isMaster(u){ return perfilCanonico(u && u.perfil) === 'Master'; }
  function isAdmin(u){ return perfilCanonico(u && u.perfil) === 'Administrador'; }
  function isTecnico(u){ return perfilCanonico(u && u.perfil) === 'Tecnico'; }
  function isConsulta(u){ return perfilCanonico(u && u.perfil) === 'Consulta'; }
  function isGlobal(u){ return isSEC(u) || isMaster(u); }

  function nteUsuario(u){
    if (isSEC(u)) return GRUPO_SEC;
    return txt(u && (u.nte || u.nte_nome || u.nte_vinculado || u.grupo) || 'NTE-26 Salvador');
  }

  function numeroNte(v){
    const m = txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }

  function mesmoNte(a,b){
    const na = numeroNte(a), nb = numeroNte(b);
    if (na && nb) return na === nb;
    return up(a).replace(/[^A-Z0-9]/g,'') === up(b).replace(/[^A-Z0-9]/g,'');
  }

  const Perm = {
    acessoGlobal: isGlobal,
    visualizarTodosNtes: isGlobal,
    dashboardGlobal: isGlobal,
    cadastrarEscola: u => isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u),
    alterarEscola: u => isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u),
    alterarEscolaCompleta: u => isSEC(u) || isMaster(u) || isAdmin(u),
    alterarEscolaLimitada: u => isTecnico(u),
    excluirEscola: u => isSEC(u) || isMaster(u),
    importarDados: u => isSEC(u) || isMaster(u) || isAdmin(u),
    exportarDados: u => isSEC(u) || isMaster(u) || isAdmin(u),
    abrirSolicitacao: u => isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u),
    movimentarFluxo: u => isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u),
    gerirUsuarios: u => isSEC(u) || isMaster(u),
    alterarUsuarios: u => isSEC(u) || isMaster(u),
    cadastrarUsuarios: u => isSEC(u) || isMaster(u),
    excluirUsuarios: u => isSEC(u) || isMaster(u),
    acessarLogs: u => isSEC(u) || isMaster(u) || isAdmin(u),
    usuariosConectados: u => isSEC(u) || isMaster(u) || isAdmin(u)
  };

  function setHidden(el, ocultar){
    if (!el) return;
    el.classList.toggle('hidden', !!ocultar);
    if (ocultar) el.setAttribute('aria-hidden','true');
    else el.removeAttribute('aria-hidden');
  }

  function lockButton(el, bloquear){
    if (!el) return;
    setHidden(el, bloquear);
    if ('disabled' in el) el.disabled = !!bloquear;
  }

  function aplicarPermissoes(){
    const u = normalizarUsuario(usuarioAtual() || {});
    if (!u.email && !u.nome) return;

    try { if (usuarioAtual()) Object.assign(usuarioAtual(), u); } catch(e) {}
    document.body.dataset.sigeePerfil = u.perfil;

    const nome = document.getElementById('user-nome');
    if (nome) nome.innerText = u.nome || '';
    const perfilEl = document.getElementById('user-perfil');
    if (perfilEl) perfilEl.innerText = `${u.perfil} | ${nteUsuario(u)}`;

    setHidden(document.getElementById('menu-usuarios'), !Perm.gestirUsuarios && !Perm.gerirUsuarios(u));
    setHidden(document.getElementById('menu-logs'), !Perm.acessarLogs(u));

    lockButton(document.getElementById('btn-importar-dados-master'), !Perm.importarDados(u));
    const inputImportar = document.getElementById('input-importar-excel');
    if (inputImportar) inputImportar.disabled = !Perm.importarDados(u);

    document.querySelectorAll('.import-only, [data-sigee-importar], button[onclick*="Importar"], button[onclick*="importar"]').forEach(el => lockButton(el, !Perm.importarDados(u)));
    document.querySelectorAll('.export-only, [data-sigee-exportar], button[onclick*="Exportar"], button[onclick*="exportar"]').forEach(el => lockButton(el, !Perm.exportarDados(u)));
    document.querySelectorAll('button[onclick="abrirModalNovaEscola()"], .btn-nova-escola').forEach(el => lockButton(el, !Perm.cadastrarEscola(u)));
    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"], .btn-nova-solicitacao').forEach(el => lockButton(el, !Perm.abrirSolicitacao(u)));

    const abaUsuarios = document.getElementById('aba-usuarios');
    if (abaUsuarios && !abaUsuarios.classList.contains('hidden') && !Perm.gerirUsuarios(u)) {
      try { window.navegar('painel'); } catch(e) { abaUsuarios.classList.add('hidden'); document.getElementById('aba-painel')?.classList.remove('hidden'); }
    }
    const abaLogs = document.getElementById('aba-logs');
    if (abaLogs && !abaLogs.classList.contains('hidden') && !Perm.acessarLogs(u)) {
      try { window.navegar('painel'); } catch(e) { abaLogs.classList.add('hidden'); document.getElementById('aba-painel')?.classList.remove('hidden'); }
    }
  }

  function salvarCacheUsuarios(){
    try {
      localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(baseUsuarios().map(normalizarUsuario)));
    } catch(e) { console.warn('SIGEE Usuarios: não foi possível salvar cache local de usuários.', e); }
  }

  async function salvarUsuarioSupabase(u){
    salvarCacheUsuarios();
    try {
      const client = (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : (window.supabaseClient || null);
      const tabela = (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
      if (!client || !client.from || !u) return false;
      const payload = { nome: u.nome, email: u.email, perfil: u.perfil, ativo: u.ativo !== false };
      const { error } = await client.from(tabela).upsert(payload, { onConflict: 'email' });
      if (error) throw error;
      return true;
    } catch(e) {
      console.warn('SIGEE Usuarios: Supabase recusou salvamento completo; cache local preservado.', e);
      return false;
    }
  }

  async function excluirUsuarioSupabase(u){
    try {
      const client = (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : (window.supabaseClient || null);
      const tabela = (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
      if (!client || !client.from || !u) return false;
      if (u.id) await client.from(tabela).delete().eq('id', u.id);
      else if (u.email) await client.from(tabela).delete().eq('email', u.email);
      return true;
    } catch(e) {
      console.warn('SIGEE Usuarios: exclusão não confirmada no Supabase.', e);
      return false;
    }
  }

  function garantirUsuariosBase(){
    const base = baseUsuarios();
    const existe = email => base.some(u => low(u.email) === low(email));
    const prox = start => Math.max(start, 0, ...base.map(u => Number(u.id)||0)) + 1;
    // V31.2: não criar automaticamente usuário SEC.
    base.forEach((u,i) => base[i] = normalizarUsuario(u));
    window.usuariosDB = base;
    try { usuariosDB = base; } catch(e) {}
    salvarCacheUsuarios();
  }

  window.carregarListaUsuarios = function(){
    garantirUsuariosBase();
    const corpo = document.getElementById('tabela-usuarios-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    const uLog = normalizarUsuario(usuarioAtual() || {});
    let lista = baseUsuarios().map(normalizarUsuario);
    if (!isGlobal(uLog)) lista = lista.filter(u => mesmoNte(nteUsuario(u), nteUsuario(uLog)));

    lista.forEach(u => {
      const mesmo = mesmoNte(nteUsuario(u), nteUsuario(uLog));
      const podeEditar = isGlobal(uLog) || (isAdmin(uLog) && mesmo && !isGlobal(u));
      const botoes = podeEditar ? `
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
          <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo!==false?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo!==false?'Desativar':'Ativar'}</button>
          <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
          ${Perm.excluirUsuarios(uLog) ? `<button onclick="excluirUsuarioSistemaSIGEE(${u.id})" class="bg-red-800 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button>` : ''}
        </div>` : `<span class="text-xs text-gray-400 italic">Sem permissão</span>`;

      const badgeSec = isSEC(u) ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px]">SEC</span>' : '';
      corpo.innerHTML += `
        <tr class="text-xs">
          <td class="p-3 font-bold">${u.nome}${badgeSec}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td>
          <td class="p-3 font-medium">${u.perfil}</td>
          <td class="p-3 font-semibold text-gray-600">${nteUsuario(u)}</td>
          <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo!==false?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo!==false?'ATIVO':'INATIVO'}</span></td>
          <td class="p-3 text-center">${botoes}</td>
        </tr>`;
    });
    aplicarPermissoes();
  };

  window.abrirModalCriarUsuarioMaster = function(){
    if (!Perm.cadastrarUsuarios(usuarioAtual())) return alert('Cadastro de usuários permitido apenas para SEC e Master.');
    document.getElementById('titulo-modal-usuario').innerText = '👥 Cadastrar Técnico';
    document.getElementById('user-form-id').value = '';
    document.getElementById('user-form-nome').value = '';
    document.getElementById('user-form-email').value = '';
    document.getElementById('user-form-senha').value = 'SECBA2026';
    try { if (typeof inicializarSelectsNteEcosystem === 'function') inicializarSelectsNteEcosystem(); } catch(e) {}
    const perfilSel = document.getElementById('user-form-perfil');
    if (perfilSel) perfilSel.innerHTML = '<option value="Tecnico">Técnico</option><option value="Master">Master</option>';
    document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
  };

  window.abrirModalEditarUsuarioMaster = function(id){
    const u = baseUsuarios().map(normalizarUsuario).find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    if (!Perm.alterarUsuarios(usuarioAtual())) return alert('Edição de usuários permitida apenas para SEC e Master.');
    document.getElementById('titulo-modal-usuario').innerText = '📝 Editar Informações do Usuário';
    document.getElementById('user-form-id').value = u.id;
    document.getElementById('user-form-nome').value = u.nome;
    document.getElementById('user-form-email').value = u.email;
    document.getElementById('user-form-senha').value = u.senha || '123';
    try { if (typeof inicializarSelectsNteEcosystem === 'function') inicializarSelectsNteEcosystem(); } catch(e) {}
    const nte = document.getElementById('user-form-nte'); if (nte) nte.value = nteUsuario(u);
    const perfilSel = document.getElementById('user-form-perfil');
    if (perfilSel) { perfilSel.innerHTML = '<option value="Tecnico">Técnico</option><option value="Master">Master</option>'; perfilSel.value = u.perfil; }
    document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
  };

  window.fecharModalUsuario = function(){ document.getElementById('modal-cadastro-usuario')?.classList.add('hidden'); };

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if (event) event.preventDefault();
    if (!Perm.cadastrarUsuarios(usuarioAtual())) return alert('Operação permitida apenas para SEC e Master.');
    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const senha = txt(document.getElementById('user-form-senha')?.value) || '123';
    const nte = txt(document.getElementById('user-form-nte')?.value);
    const perfil = perfilCanonico(document.getElementById('user-form-perfil')?.value);
    if (!nome || !email) return alert('Informe nome e e-mail.');

    const base = baseUsuarios();
    let u = id ? base.find(x => String(x.id) === String(id)) : null;
    if (!u && base.some(x => low(x.email) === email)) return alert('E-mail já cadastrado.');
    if (!u) { u = { id: Math.max(1, ...base.map(x => Number(x.id)||0)) + 1 }; base.push(u); }
    Object.assign(u, normalizarUsuario({ ...u, nome, email, senha, perfil, nte: perfil === 'SEC' ? GRUPO_SEC : nte, grupo: perfil === 'SEC' ? 'SEC' : u.grupo, ativo: u.ativo !== false }));
    await salvarUsuarioSupabase(u);
    try { if (typeof registrarLog === 'function') registrarLog(`${id ? 'Usuário editado' : 'Usuário cadastrado'}: ${u.nome} (${u.perfil})`); } catch(e) {}
    window.fecharModalUsuario();
    window.carregarListaUsuarios();
    aplicarPermissoes();
  };

  window.toggleStatusUsuarioMaster = async function(id){
    if (!Perm.alterarUsuarios(usuarioAtual())) return alert('Operação permitida apenas para SEC e Master.');
    const u = baseUsuarios().find(x => String(x.id) === String(id));
    if (!u) return;
    u.ativo = !(u.ativo !== false);
    await salvarUsuarioSupabase(u);
    try { if (typeof registrarLog === 'function') registrarLog(`${u.ativo ? 'Ativou' : 'Desativou'} usuário: ${u.nome}`); } catch(e) {}
    window.carregarListaUsuarios();
  };

  window.resetarSenhaUsuarioMaster = async function(id){
    if (!Perm.alterarUsuarios(usuarioAtual())) return alert('Operação permitida apenas para SEC e Master.');
    const u = baseUsuarios().find(x => String(x.id) === String(id));
    if (!u) return;
    u.senha = '123';
    await salvarUsuarioSupabase(u);
    alert(`Senha de ${u.nome} resetada para: 123`);
    try { if (typeof registrarLog === 'function') registrarLog(`Resetou senha do usuário: ${u.nome}`); } catch(e) {}
    window.carregarListaUsuarios();
  };

  window.excluirUsuarioSistemaSIGEE = async function(id){
    if (!Perm.excluirUsuarios(usuarioAtual())) return alert('Exclusão de usuários permitida apenas para SEC e Master.');
    const base = baseUsuarios();
    const idx = base.findIndex(x => String(x.id) === String(id));
    if (idx < 0) return;
    const u = base[idx];
    if (!confirm(`Confirma excluir o usuário ${u.nome}?`)) return;
    base.splice(idx, 1);
    await excluirUsuarioSupabase(u);
    salvarCacheUsuarios();
    try { if (typeof registrarLog === 'function') registrarLog(`Excluiu usuário: ${u.nome}`); } catch(e) {}
    window.carregarListaUsuarios();
  };

  // Reforca navegacao e permissoes após scripts antigos renderizarem menus.
  function instalarPatches(){
    garantirUsuariosBase();

    const navOriginal = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
    if (typeof navOriginal === 'function' && !window.__SIGEE_USUARIOS_NAV_PATCH) {
      window.__SIGEE_USUARIOS_NAV_PATCH = true;
      window.navegar = function(aba){
        const u = usuarioAtual();
        if (aba === 'usuarios' && !Perm.gerirUsuarios(u)) { alert('Acesso ao Controle de Usuários permitido apenas para SEC e Master.'); aba = 'painel'; }
        if (aba === 'logs' && !Perm.acessarLogs(u)) { alert('Acesso aos Logs permitido apenas para SEC, Master e Administrador.'); aba = 'painel'; }
        const r = navOriginal.call(this, aba);
        aplicarPermissoes();
        setTimeout(aplicarPermissoes, 60);
        setTimeout(aplicarPermissoes, 300);
        return r;
      };
      try { navegar = window.navegar; } catch(e) {}
    }

    const loginOriginal = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
    if (typeof loginOriginal === 'function' && !window.__SIGEE_USUARIOS_LOGIN_PATCH) {
      window.__SIGEE_USUARIOS_LOGIN_PATCH = true;
      window.handleLogin = async function(){
        const r = await loginOriginal.apply(this, arguments);
        garantirUsuariosBase();
        aplicarPermissoes();
        setTimeout(aplicarPermissoes, 100);
        setTimeout(aplicarPermissoes, 600);
        return r;
      };
      try { handleLogin = window.handleLogin; } catch(e) {}
    }

    const importOriginal = window.processarImportacaoOtimizada || (typeof processarImportacaoOtimizada !== 'undefined' ? processarImportacaoOtimizada : null);
    if (typeof importOriginal === 'function' && !window.__SIGEE_USUARIOS_IMPORT_PATCH) {
      window.__SIGEE_USUARIOS_IMPORT_PATCH = true;
      window.processarImportacaoOtimizada = function(event){
        if (!Perm.importarDados(usuarioAtual())) {
          alert('Importação permitida apenas para SEC, Master e Administrador.');
          if (event && event.target) event.target.value = '';
          return false;
        }
        return importOriginal.apply(this, arguments);
      };
      try { processarImportacaoOtimizada = window.processarImportacaoOtimizada; } catch(e) {}
    }

    aplicarPermissoes();
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(instalarPatches, 50);
    setTimeout(instalarPatches, 500);
    setTimeout(instalarPatches, 1500);
  });
  window.addEventListener('load', function(){ setTimeout(instalarPatches, 100); });
  setInterval(aplicarPermissoes, 1500);

  window.SIGEE_USUARIOS = { normalizarUsuario, perfilCanonico, isSEC, isMaster, isAdmin, isTecnico, isConsulta, isGlobal, Perm, aplicarPermissoes, carregarListaUsuarios: () => window.carregarListaUsuarios() };
})();
