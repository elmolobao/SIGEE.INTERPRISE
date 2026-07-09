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
    if (!existe(EMAIL_SEC)) base.push({id:prox(900000), nome:'USUARIO SEC', email:EMAIL_SEC, senha:'123', perfil:'SEC', grupo:'SEC', nte:GRUPO_SEC, ativo:true});
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
    if (perfilSel) perfilSel.innerHTML = '<option value="SEC">SEC</option><option value="Master">Master</option><option value="Administrador">Administrador</option><option value="Tecnico">Tecnico</option><option value="Consulta">Consulta</option>';
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
    if (perfilSel) { perfilSel.innerHTML = '<option value="SEC">SEC</option><option value="Master">Master</option><option value="Administrador">Administrador</option><option value="Tecnico">Tecnico</option><option value="Consulta">Consulta</option>'; perfilSel.value = u.perfil; }
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

/* ==========================================================================
   SIGEE Sprint 2.4 - Usuários: persistência Supabase definitiva
   Correções:
   - Criar usuário sem erro técnico de duplicate key
   - Editar usuário persistindo no Supabase
   - Resetar senha alterando senha e senha_hash
   - Atualizar campos ativo e Ativo
   ========================================================================== */
(function(){
  'use strict';

  const TABELA_USUARIOS_SIGEE = 'usuarios_sigee';

  function txt(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function normal(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }

  function clientSIGEE(){
    try {
      if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE();
    } catch(e) {}
    return window.supabaseClient || window.supabase || null;
  }

  function baseUsuarios(){
    if (!Array.isArray(window.usuariosDB)) window.usuariosDB = [];
    try { usuariosDB = window.usuariosDB; } catch(e) {}
    return window.usuariosDB;
  }

  function perfilCanonico(valor){
    const p = normal(valor || 'Tecnico');
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }

  function numeroNte(valor){
    const texto = txt(valor);
    const m = texto.match(/(\d{1,2})/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n >= 1 && n <= 27 ? n : null;
  }

  function formatarNte(valor, perfil){
    if (perfilCanonico(perfil) === 'SEC') return 'SEC - TODOS OS NTES';
    const n = numeroNte(valor);
    return n ? `NTE ${String(n).padStart(2, '0')}` : txt(valor || '');
  }

  function usuarioLogadoAtual(){
    try { return window.usuarioLogado || usuarioLogado || null; } catch(e) { return window.usuarioLogado || null; }
  }

  function podeGerirUsuarios(){
    const u = usuarioLogadoAtual() || {};
    const p = perfilCanonico(u.perfil);
    return p === 'Master' || p === 'SEC';
  }

  function getFormUsuario(){
    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const senha = txt(document.getElementById('user-form-senha')?.value) || '123';
    const perfil = perfilCanonico(document.getElementById('user-form-perfil')?.value);
    const nteInformado = txt(document.getElementById('user-form-nte')?.value);
    const nte = formatarNte(nteInformado, perfil);
    const nte_id = perfil === 'SEC' ? null : numeroNte(nteInformado || nte);
    return { id, nome, email, senha, perfil, nte, nte_id, ativo: true };
  }

  function payloadUsuario(u){
    const perfil = perfilCanonico(u.perfil);
    const nte = formatarNte(u.nte || u.nte_id, perfil);
    const nte_id = perfil === 'SEC' ? null : (u.nte_id || numeroNte(nte));
    const senha = txt(u.senha || u.senha_hash || '123');
    return {
      nome: txt(u.nome).toUpperCase(),
      email: low(u.email),
      perfil,
      nte,
      nte_id,
      senha,
      senha_hash: senha,
      ativo: u.ativo !== false,
      Ativo: u.ativo !== false,
      forcar_troca_senha: false,
      ultima_atividade: new Date().toISOString()
    };
  }

  async function localizarUsuarioSupabase(email, id){
    const client = clientSIGEE();
    if (!client || !client.from) return null;

    if (id) {
      const { data } = await client.from(TABELA_USUARIOS_SIGEE).select('*').eq('id', id).maybeSingle();
      if (data) return data;
    }

    if (email) {
      const { data } = await client.from(TABELA_USUARIOS_SIGEE).select('*').eq('email', low(email)).maybeSingle();
      if (data) return data;
    }

    return null;
  }

  async function salvarUsuarioSupabaseDefinitivo(u, modo){
    const client = clientSIGEE();
    if (!client || !client.from) throw new Error('Cliente Supabase não inicializado.');

    const payload = payloadUsuario(u);
    const existente = await localizarUsuarioSupabase(payload.email, u.id);

    if (modo === 'criar' && existente) {
      return { ok:false, duplicado:true, data:existente };
    }

    if (existente && existente.id) {
      const { data, error } = await client
        .from(TABELA_USUARIOS_SIGEE)
        .update(payload)
        .eq('id', existente.id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return { ok:true, data: data || Object.assign({}, existente, payload) };
    }

    const { data, error } = await client
      .from(TABELA_USUARIOS_SIGEE)
      .insert(payload)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return { ok:true, data: data || payload };
  }

  function sincronizarUsuarioLocal(uSalvo){
    if (!uSalvo) return;
    const base = baseUsuarios();
    const email = low(uSalvo.email);
    const idx = base.findIndex(x => String(x.id) === String(uSalvo.id) || low(x.email) === email);
    const normalizado = {
      id: uSalvo.id,
      nome: txt(uSalvo.nome).toUpperCase(),
      email,
      senha: txt(uSalvo.senha || uSalvo.senha_hash || '123'),
      senha_hash: txt(uSalvo.senha_hash || uSalvo.senha || '123'),
      perfil: perfilCanonico(uSalvo.perfil),
      nte: formatarNte(uSalvo.nte || uSalvo.nte_id, uSalvo.perfil),
      nte_id: uSalvo.nte_id || numeroNte(uSalvo.nte),
      ativo: uSalvo.ativo !== false && uSalvo.Ativo !== false,
      Ativo: uSalvo.ativo !== false && uSalvo.Ativo !== false,
      forcar_troca_senha: false
    };
    if (idx >= 0) base[idx] = Object.assign({}, base[idx], normalizado);
    else base.push(normalizado);
    try { localStorage.setItem('SIGEE_USUARIOS_COMPLETO_V41', JSON.stringify(base)); } catch(e) {}
    try { window.usuariosDB = base; usuariosDB = base; } catch(e) { window.usuariosDB = base; }
  }

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }

    if (!podeGerirUsuarios()) return alert('Operação permitida apenas para Master ou SEC.');

    const form = getFormUsuario();
    if (!form.nome || !form.email) return alert('Informe nome e e-mail do usuário.');
    if (form.perfil !== 'SEC' && !form.nte_id) return alert('Informe o NTE do usuário.');

    const modo = form.id ? 'editar' : 'criar';

    try {
      const result = await salvarUsuarioSupabaseDefinitivo(form, modo);

      if (result.duplicado) {
        alert('E-mail já cadastrado. Use Editar usuário ou informe outro e-mail.');
        return;
      }

      sincronizarUsuarioLocal(result.data);

      try { if (typeof registrarLog === 'function') registrarLog(`${modo === 'criar' ? 'Cadastrou' : 'Editou'} usuário: ${form.email}`); } catch(e) {}
      try { if (typeof fecharModalUsuario === 'function') fecharModalUsuario(); else document.getElementById('modal-cadastro-usuario')?.classList.add('hidden'); } catch(e) {}
      try { if (typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios(); } catch(e) {}
      alert('Usuário salvo no Supabase com sucesso.');
    } catch(e) {
      console.error('SIGEE usuário - erro ao salvar:', e);
      alert('Erro ao salvar usuário: ' + (e.message || JSON.stringify(e)));
    }
  };

  window.resetarSenhaUsuarioMaster = async function(id){
    if (!podeGerirUsuarios()) return alert('Operação permitida apenas para Master ou SEC.');
    const base = baseUsuarios();
    const u = base.find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');

    try {
      const atualizado = Object.assign({}, u, { senha:'123', senha_hash:'123', forcar_troca_senha:false });
      const result = await salvarUsuarioSupabaseDefinitivo(atualizado, 'editar');
      sincronizarUsuarioLocal(result.data || atualizado);
      try { if (typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios(); } catch(e) {}
      alert(`Senha de ${u.nome} resetada para: 123`);
    } catch(e) {
      console.error('SIGEE usuário - erro ao resetar senha:', e);
      alert('Erro ao resetar senha: ' + (e.message || JSON.stringify(e)));
    }
  };

  window.toggleStatusUsuarioMaster = async function(id){
    if (!podeGerirUsuarios()) return alert('Operação permitida apenas para Master ou SEC.');
    const base = baseUsuarios();
    const u = base.find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');

    try {
      const atualizado = Object.assign({}, u, { ativo: !(u.ativo !== false), Ativo: !(u.ativo !== false) });
      const result = await salvarUsuarioSupabaseDefinitivo(atualizado, 'editar');
      sincronizarUsuarioLocal(result.data || atualizado);
      try { if (typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios(); } catch(e) {}
    } catch(e) {
      console.error('SIGEE usuário - erro ao alterar status:', e);
      alert('Erro ao alterar status: ' + (e.message || JSON.stringify(e)));
    }
  };

  function capturarSubmitFormularioUsuario(){
    const modal = document.getElementById('modal-cadastro-usuario');
    if (!modal) return;
    const form = modal.querySelector('form');
    if (!form || form.dataset.sigeeUsuariosSubmitV24 === '1') return;
    form.dataset.sigeeUsuariosSubmitV24 = '1';
    form.addEventListener('submit', window.salvarNovoUsuarioFormularioMaster, true);
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(capturarSubmitFormularioUsuario, 100);
    setTimeout(capturarSubmitFormularioUsuario, 800);
    setTimeout(capturarSubmitFormularioUsuario, 2000);
  });
  window.addEventListener('load', function(){ setTimeout(capturarSubmitFormularioUsuario, 500); });

  window.SIGEE_USUARIOS_PERSISTENCIA_V24 = {
    salvarUsuarioSupabaseDefinitivo,
    localizarUsuarioSupabase,
    payloadUsuario
  };
})();

/* =====================================================================
   SIGEE Sprint 2.6.1 - Consolidação definitiva de Usuários
   - Perfis oficiais: Master, SEC, Administrador, Tecnico, Estagiario, Consulta
   - Senha padrão: SEC@2026
   - Primeiro acesso: forcar_troca_senha=true até cadastrar nova senha
   - CRUD usando Supabase como fonte única de verdade
   ===================================================================== */
(function(){
  'use strict';

  const TABELA = 'usuarios_sigee';
  const SENHA_PADRAO = 'SEC@2026';
  const PERFIS = [
    { value:'', label:'Selecione o Perfil' },
    { value:'Master', label:'Master' },
    { value:'SEC', label:'SEC' },
    { value:'Administrador', label:'Administrator' },
    { value:'Tecnico', label:'Tecnico' },
    { value:'Estagiario', label:'Estagiário' },
    { value:'Consulta', label:'Consulta' }
  ];

  function txt(v){ return (v === null || v === undefined) ? '' : String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return semAcento(v).toUpperCase(); }
  function client(){
    try { if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE(); } catch(e) {}
    try { if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') return window.SIGEE_SUPABASE.criarCliente(); } catch(e) {}
    return window.SIGEE_SUPABASE_CLIENT || window.supabaseClient || null;
  }
  function usuarioAtual(){ try { return window.usuarioLogado || usuarioLogado || null; } catch(e){ return window.usuarioLogado || null; } }
  function perfilCanonico(v){
    const p = up(v);
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiario';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Tecnico';
    return '';
  }
  function numeroNte(v){
    const s = txt(v);
    const n0 = Number(s);
    if (Number.isFinite(n0) && n0 >= 1 && n0 <= 27) return n0;
    const m = s.match(/(\d{1,2})/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n >= 1 && n <= 27 ? n : null;
  }
  function formatarNte(v, perfil){
    if (perfilCanonico(perfil) === 'SEC') return 'SEC - TODOS OS NTEs';
    const n = numeroNte(v);
    return n ? `NTE ${String(n).padStart(2,'0')}` : txt(v);
  }
  function nteId(v, perfil){ return perfilCanonico(perfil) === 'SEC' ? null : numeroNte(v); }
  function ativo(u){ return u && u.ativo !== false && u.Ativo !== false; }
  function podeGerir(){ const p = perfilCanonico((usuarioAtual()||{}).perfil); return p === 'Master' || p === 'SEC'; }
  function isEstagiario(u){ return perfilCanonico((u||usuarioAtual()||{}).perfil) === 'Estagiario'; }
  function isGlobal(u){ const p = perfilCanonico((u||usuarioAtual()||{}).perfil); return p === 'Master' || p === 'SEC'; }

  function normalizarUsuario(u){
    const perfil = perfilCanonico(u && u.perfil) || 'Tecnico';
    const senha = txt((u||{}).senha || (u||{}).senha_hash || SENHA_PADRAO);
    const nte = formatarNte((u||{}).nte || (u||{}).nte_id, perfil);
    const idNte = nteId((u||{}).nte_id || nte, perfil);
    return {
      ...(u||{}),
      id: (u||{}).id,
      nome: txt((u||{}).nome || (u||{}).name || 'USUÁRIO').toUpperCase(),
      email: low((u||{}).email),
      senha,
      senha_hash: txt((u||{}).senha_hash || senha),
      perfil,
      nte,
      nte_id: idNte,
      ativo: ativo(u),
      Ativo: ativo(u),
      pode_editar: perfil === 'Estagiario' || perfil === 'Consulta' ? false : ((u||{}).pode_editar !== false),
      forcar_troca_senha: (u||{}).forcar_troca_senha === true
    };
  }
  function baseUsuarios(){
    if (!Array.isArray(window.usuariosDB)) window.usuariosDB = [];
    try { usuariosDB = window.usuariosDB; } catch(e) {}
    return window.usuariosDB;
  }
  function sincronizarBase(lista){
    window.usuariosDB = (lista || []).map(normalizarUsuario).filter(u => u.email && u.nome);
    try { usuariosDB = window.usuariosDB; } catch(e) {}
    try { localStorage.setItem('SIGEE_USUARIOS_COMPLETO_V41', JSON.stringify(window.usuariosDB)); } catch(e) {}
    return window.usuariosDB;
  }
  async function carregarUsuariosSupabase(){
    const c = client();
    if (!c) return baseUsuarios();
    const { data, error } = await c.from(TABELA).select('*').order('nome', { ascending:true });
    if (error) throw error;
    return sincronizarBase(data || []);
  }
  function payload(u, modo){
    const n = normalizarUsuario(u);
    const p = {
      nome: n.nome,
      email: n.email,
      perfil: n.perfil,
      nte: n.nte,
      nte_id: n.nte_id,
      ativo: n.ativo,
      Ativo: n.ativo,
      senha: n.senha,
      senha_hash: n.senha_hash,
      forcar_troca_senha: n.forcar_troca_senha,
      pode_editar: n.pode_editar
    };
    if (modo === 'editar' && n.id) p.id = n.id;
    return p;
  }
  async function salvarUsuario(u, modo){
    const c = client();
    if (!c) throw new Error('Cliente Supabase indisponível.');
    const p = payload(u, modo);
    if (modo === 'criar') {
      const { data: existente, error: errConsulta } = await c.from(TABELA).select('*').eq('email', p.email).maybeSingle();
      if (errConsulta) throw errConsulta;
      if (existente) throw new Error('E-mail já cadastrado. Use outro e-mail ou edite o usuário existente.');
      delete p.id;
      const { data, error } = await c.from(TABELA).insert(p).select('*').single();
      if (error) throw error;
      return normalizarUsuario(data || p);
    }
    const q = p.id ? c.from(TABELA).update(p).eq('id', p.id) : c.from(TABELA).update(p).eq('email', p.email);
    const { data, error } = await q.select('*').single();
    if (error) throw error;
    return normalizarUsuario(data || p);
  }
  async function excluirUsuario(u){
    const c = client(); if (!c) throw new Error('Cliente Supabase indisponível.');
    if (u.id) {
      const { error } = await c.from(TABELA).delete().eq('id', u.id);
      if (error) throw error;
    } else {
      const { error } = await c.from(TABELA).delete().eq('email', u.email);
      if (error) throw error;
    }
  }
  function preencherPerfis(select, valor){
    if (!select) return;
    select.innerHTML = PERFIS.map(p => `<option value="${p.value}">${p.label}</option>`).join('');
    select.value = valor || '';
  }
  function preencherNtes(select, valor){
    if (!select) return;
    const atual = valor || '';
    let html = '<option value="">Selecione o NTE</option><option value="SEC - TODOS OS NTEs">SEC - TODOS OS NTEs</option>';
    for(let i=1;i<=27;i++) html += `<option value="NTE ${String(i).padStart(2,'0')}">NTE ${String(i).padStart(2,'0')}</option>`;
    select.innerHTML = html;
    if (atual) select.value = formatarNte(atual, document.getElementById('user-form-perfil')?.value || '');
  }
  function prepararSelectsUsuario(valorPerfil, valorNte){
    preencherPerfis(document.getElementById('user-form-perfil'), valorPerfil);
    preencherNtes(document.getElementById('user-form-nte'), valorNte);
    const pf = document.getElementById('user-form-perfil');
    const nt = document.getElementById('user-form-nte');
    if (pf && !pf.dataset.sigee26Change) {
      pf.dataset.sigee26Change = '1';
      pf.addEventListener('change', () => {
        if (perfilCanonico(pf.value) === 'SEC') { if (nt) nt.value = 'SEC - TODOS OS NTEs'; }
      });
    }
  }
  function formUsuario(){
    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const perfil = perfilCanonico(document.getElementById('user-form-perfil')?.value);
    const nteRaw = txt(document.getElementById('user-form-nte')?.value);
    const senhaInformada = txt(document.getElementById('user-form-senha')?.value);
    const modo = id ? 'editar' : 'criar';
    const senha = modo === 'criar' ? SENHA_PADRAO : (senhaInformada || SENHA_PADRAO);
    return { id, nome, email, perfil, nte: formatarNte(nteRaw, perfil), nte_id: nteId(nteRaw, perfil), senha, senha_hash: senha, ativo:true, Ativo:true, forcar_troca_senha: modo === 'criar', pode_editar: perfil !== 'Estagiario' && perfil !== 'Consulta' };
  }
  function renderTabelaUsuarios(){
    const corpo = document.getElementById('tabela-usuarios-corpo');
    if (!corpo) return;
    const uLog = usuarioAtual();
    corpo.innerHTML = '';
    baseUsuarios().slice().sort((a,b)=>txt(a.nome).localeCompare(txt(b.nome))).forEach(u0 => {
      const u = normalizarUsuario(u0);
      const botoes = podeGerir() ? `<div class="flex items-center justify-center gap-1.5 flex-wrap">
        <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
        <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo?'Desativar':'Ativar'}</button>
        <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
        <button onclick="excluirUsuarioSistemaMasterV45(${u.id})" class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button>
      </div>` : '<span class="text-xs text-gray-400 italic">Sem permissão</span>';
      corpo.insertAdjacentHTML('beforeend', `<tr class="text-xs">
        <td class="p-3 font-bold">${u.nome}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td>
        <td class="p-3 font-medium">${u.perfil === 'Estagiario' ? 'Estagiário' : u.perfil}</td>
        <td class="p-3 font-semibold text-gray-600">${u.nte || ''}</td>
        <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo?'ATIVO':'INATIVO'}</span></td>
        <td class="p-3 text-center">${botoes}</td>
      </tr>`);
    });
  }
  async function atualizarListaUsuarios(){
    try { await carregarUsuariosSupabase(); } catch(e) { console.warn('[SIGEE 2.6] Falha ao carregar usuários do Supabase:', e); }
    renderTabelaUsuarios();
  }

  window.abrirModalNovoUsuarioMaster = function(){
    if (!podeGerir()) return alert('Apenas Master ou SEC podem cadastrar usuários.');
    prepararSelectsUsuario('', '');
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
    set('user-form-id',''); set('user-form-nome',''); set('user-form-email',''); set('user-form-senha', SENHA_PADRAO);
    const modal = document.getElementById('modal-cadastro-usuario'); if (modal) modal.classList.remove('hidden');
  };
  window.abrirModalEditarUsuarioMaster = function(id){
    if (!podeGerir()) return alert('Apenas Master ou SEC podem editar usuários.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    prepararSelectsUsuario(u.perfil, u.nte);
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
    set('user-form-id', u.id); set('user-form-nome', u.nome); set('user-form-email', u.email); set('user-form-senha', u.senha || u.senha_hash || SENHA_PADRAO);
    const modal = document.getElementById('modal-cadastro-usuario'); if (modal) modal.classList.remove('hidden');
  };
  window.salvarNovoUsuarioFormularioMaster = async function(ev){
    if (ev) { ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    if (!podeGerir()) return alert('Apenas Master ou SEC podem salvar usuários.');
    const u = formUsuario();
    if (!u.nome) return alert('Informe o nome do usuário.');
    if (!u.email) return alert('Informe o e-mail do usuário.');
    if (!u.perfil) return alert('Selecione o Perfil.');
    if (u.perfil !== 'SEC' && !u.nte_id) return alert('Selecione o NTE.');
    try {
      const salvo = await salvarUsuario(u, u.id ? 'editar' : 'criar');
      await atualizarListaUsuarios();
      const modal = document.getElementById('modal-cadastro-usuario'); if (modal) modal.classList.add('hidden');
      alert('Usuário salvo com sucesso.');
      return salvo;
    } catch(e) {
      console.error('[SIGEE 2.6] Erro ao salvar usuário:', e);
      alert('Erro ao salvar usuário: ' + (e.message || e));
    }
  };
  window.resetarSenhaUsuarioMaster = async function(id){
    if (!podeGerir()) return alert('Apenas Master ou SEC podem resetar senha.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    try {
      u.senha = SENHA_PADRAO; u.senha_hash = SENHA_PADRAO; u.forcar_troca_senha = true;
      await salvarUsuario(u, 'editar');
      await atualizarListaUsuarios();
      alert('Senha resetada para SEC@2026. No próximo login, o usuário deverá cadastrar nova senha.');
    } catch(e) { alert('Erro ao resetar senha: ' + (e.message || e)); }
  };
  window.toggleStatusUsuarioMaster = async function(id){
    if (!podeGerir()) return alert('Apenas Master ou SEC podem ativar/desativar usuários.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    try { u.ativo = u.Ativo = !u.ativo; await salvarUsuario(u, 'editar'); await atualizarListaUsuarios(); } catch(e){ alert('Erro ao alterar usuário: ' + (e.message || e)); }
  };
  window.excluirUsuarioSistemaMasterV45 = window.excluirUsuarioSistemaSIGEE = async function(id){
    if (!podeGerir()) return alert('Apenas Master ou SEC podem excluir usuários.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    if (!confirm(`Confirma excluir o usuário ${u.nome}?`)) return;
    try { await excluirUsuario(u); await atualizarListaUsuarios(); alert('Usuário excluído.'); } catch(e){ alert('Erro ao excluir usuário: ' + (e.message || e)); }
  };

  function capturarSubmit(){
    const modal = document.getElementById('modal-cadastro-usuario');
    const form = modal && modal.querySelector('form');
    prepararSelectsUsuario(document.getElementById('user-form-perfil')?.value || '', document.getElementById('user-form-nte')?.value || '');
    if (form && form.dataset.sigee26Submit !== '1') {
      form.dataset.sigee26Submit = '1';
      form.addEventListener('submit', window.salvarNovoUsuarioFormularioMaster, true);
    }
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(capturarSubmit, 300); setTimeout(atualizarListaUsuarios, 700); });
  window.addEventListener('load', function(){ setTimeout(capturarSubmit, 600); setTimeout(atualizarListaUsuarios, 1000); });
  window.carregarListaUsuarios = atualizarListaUsuarios;
  try { carregarListaUsuarios = window.carregarListaUsuarios; } catch(e) {}

  window.SIGEE_USUARIOS_26 = { SENHA_PADRAO, PERFIS, perfilCanonico, normalizarUsuario, carregarUsuariosSupabase, salvarUsuario, atualizarListaUsuarios, isEstagiario, isGlobal };
})();

