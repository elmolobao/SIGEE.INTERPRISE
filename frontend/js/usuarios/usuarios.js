/* =====================================================================
   SIGEE Enterprise 2.0 - Entrega Usuarios/Permissoes
   Arquivo: frontend/js/usuarios.js
   Objetivo: centralizar regras de usuarios, perfis e reforco de menu
   Compatibilidade: funciona sobre o app.js atual, sem remover logica existente.
   ===================================================================== */
(function(){
  'use strict';
  // RC8.0: implementação legada desativada. A autoridade CRUD está no módulo 2.6.1 abaixo.
  return;

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
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiario';
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
    if (p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }

  function normalizarUsuario(u){
    u = u || {};
    const email = low(u.email);
    let perfil = perfilCanonico(u.perfil || u.tipo || u.role || 'Tecnico');
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

  function isSEC(u){ u = u || usuarioAtual(); return perfilCanonico(u && u.perfil) === 'SEC'; }
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
    cadastrarEscola: u => isMaster(u),
    alterarEscola: u => isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u),
    alterarEscolaCompleta: u => isMaster(u),
    alterarEscolaLimitada: u => isTecnico(u) || isAdmin(u),
    excluirEscola: u => isMaster(u),
    importarDados: u => isMaster(u),
    exportarDados: u => isSEC(u) || isMaster(u) || isAdmin(u),
    abrirSolicitacao: u => isMaster(u) || isAdmin(u) || isTecnico(u) || perfilCanonico(u&&u.perfil)==='Estagiario',
    movimentarFluxo: u => isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u),
    gerirUsuarios: u => isMaster(u),
    alterarUsuarios: u => isMaster(u),
    cadastrarUsuarios: u => isMaster(u),
    excluirUsuarios: u => isMaster(u),
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

  // RC7.3.0: Usuários é domínio de CRUD e persistência.
  // Menus, navegação e controles globais pertencem exclusivamente a SIGEE_AUTORIZACAO.
  function aplicarPermissoes(){
    const u = normalizarUsuario(usuarioAtual() || {});
    if (!u.email && !u.nome) return false;
    try { if (usuarioAtual()) Object.assign(usuarioAtual(), u); } catch(e) {}
    window.SIGEE_PERMISSOES?.aplicar?.();
    return true;
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
    if (!Perm.cadastrarUsuarios(usuarioAtual())) return alert('Cadastro de usuários permitido apenas para o perfil Master.');
    document.getElementById('titulo-modal-usuario').innerText = '👥 Cadastrar Técnico';
    document.getElementById('user-form-id').value = '';
    document.getElementById('user-form-nome').value = '';
    document.getElementById('user-form-email').value = '';
    document.getElementById('user-form-senha').value = 'SECBA2026';
    try { if (typeof inicializarSelectsNteEcosystem === 'function') inicializarSelectsNteEcosystem(); } catch(e) {}
    const perfilSel = document.getElementById('user-form-perfil');
    if (perfilSel) perfilSel.innerHTML = '<option value="Master">Master</option><option value="SEC">SEC</option><option value="Gestor">Gestor</option><option value="Administrador">Administrador</option><option value="Técnico">Técnico</option><option value="Estagiário">Estagiário</option><option value="Consulta">Consulta</option>';
    document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
  };

  window.abrirModalCriarUsuarioMaster = window.abrirModalNovoUsuarioMaster;
  window.abrirModalEditarUsuarioMaster = function(id){
    const u = baseUsuarios().map(normalizarUsuario).find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    if (!Perm.alterarUsuarios(usuarioAtual())) return alert('Edição de usuários permitida apenas para o perfil Master.');
    document.getElementById('titulo-modal-usuario').innerText = '📝 Editar Informações do Usuário';
    document.getElementById('user-form-id').value = u.id;
    document.getElementById('user-form-nome').value = u.nome;
    document.getElementById('user-form-email').value = u.email;
    document.getElementById('user-form-senha').value = u.senha || '123';
    try { if (typeof inicializarSelectsNteEcosystem === 'function') inicializarSelectsNteEcosystem(); } catch(e) {}
    const nte = document.getElementById('user-form-nte'); if (nte) nte.value = nteUsuario(u);
    const perfilSel = document.getElementById('user-form-perfil');
    if (perfilSel) { perfilSel.innerHTML = '<option value="Master">Master</option><option value="SEC">SEC</option><option value="Gestor">Gestor</option><option value="Administrador">Administrador</option><option value="Técnico">Técnico</option><option value="Estagiário">Estagiário</option><option value="Consulta">Consulta</option>'; perfilSel.value = u.perfil; }
    document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
  };

  window.fecharModalUsuario = function(){ document.getElementById('modal-cadastro-usuario')?.classList.add('hidden'); };

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if (event) event.preventDefault();
    if (!Perm.cadastrarUsuarios(usuarioAtual())) return alert('Operação permitida apenas para o perfil Master.');
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
    if (!Perm.alterarUsuarios(usuarioAtual())) return alert('Operação permitida apenas para o perfil Master.');
    const u = baseUsuarios().find(x => String(x.id) === String(id));
    if (!u) return;
    u.ativo = !(u.ativo !== false);
    await salvarUsuarioSupabase(u);
    try { if (typeof registrarLog === 'function') registrarLog(`${u.ativo ? 'Ativou' : 'Desativou'} usuário: ${u.nome}`); } catch(e) {}
    window.carregarListaUsuarios();
  };

  window.resetarSenhaUsuarioMaster = async function(id){
    if (!Perm.alterarUsuarios(usuarioAtual())) return alert('Operação permitida apenas para o perfil Master.');
    const u = baseUsuarios().find(x => String(x.id) === String(id));
    if (!u) return;
    u.senha = '123';
    await salvarUsuarioSupabase(u);
    alert(`Senha de ${u.nome} resetada para: 123`);
    try { if (typeof registrarLog === 'function') registrarLog(`Resetou senha do usuário: ${u.nome}`); } catch(e) {}
    window.carregarListaUsuarios();
  };

  window.excluirUsuarioSistemaSIGEE = async function(id){
    if (!Perm.excluirUsuarios(usuarioAtual())) return alert('Exclusão de usuários permitida apenas para o perfil Master.');
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

  // RC7.3.0: inicialização local sem envolver handleLogin, navegar ou controles de outros módulos.
  function iniciarUsuarios(){
    garantirUsuariosBase();
    aplicarPermissoes();
  }
  document.addEventListener('DOMContentLoaded', iniciarUsuarios, { once:true });
  document.addEventListener('sigee:usuario-logado', iniciarUsuarios);

  window.SIGEE_USUARIOS = {
    normalizarUsuario, perfilCanonico, isSEC, isMaster, isAdmin, isTecnico, isConsulta, isGlobal, Perm,
    aplicarPermissoes, carregarListaUsuarios: () => window.carregarListaUsuarios()
  };
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
  // RC8.0: persistência duplicada desativada; o módulo 2.6.1 é a única autoridade.
  return;

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
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiario';
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
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
    return p === 'Master';
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
    // RC4.1.6: listener legado desativado; o submit é ligado uma única vez ao final do arquivo.
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
  const TABELA_MODULOS = 'usuarios_modulos_sigee';
  const MODULOS_DISPONIVEIS = Object.freeze(['ESCOLAS_EXTINTAS','LEGALIZACAO']);
  const SENHA_PADRAO = 'SEC@2026';
  const PERFIS = (window.SIGEE_CONFIG_UTILS?.listarPerfis?.() || [
    { value:'Master', label:'Master' }, { value:'SEC', label:'SEC' },
    { value:'Gestor', label:'Gestor' }, { value:'Administrador', label:'Administrador' },
    { value:'Técnico', label:'Técnico' }, { value:'Estagiário', label:'Estagiário' },
    { value:'Consulta', label:'Consulta' }
  ]).map(function(item){ return { value:item.value, label:item.label }; });


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
    if (window.SIGEE_SESSION?.normalizarPerfil) return window.SIGEE_SESSION.normalizarPerfil(v);
    const p = up(v);
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiário';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Técnico';
    return txt(v);
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
  function ehVinculoGlobal(v){ const n=up(v); return n.includes('SEC') && n.includes('TODOS'); }
  function formatarNte(v, perfil){
    const p=perfilCanonico(perfil);
    if (p === 'SEC' || (p === 'Gestor' && ehVinculoGlobal(v))) return 'SEC - TODOS OS NTEs';
    const n = numeroNte(v);
    return n ? `NTE ${String(n).padStart(2,'0')}` : txt(v);
  }
  function nteId(v, perfil){ const p=perfilCanonico(perfil); return (p === 'SEC' || (p === 'Gestor' && ehVinculoGlobal(v))) ? null : numeroNte(v); }
  function ativo(u){ return u ? u.ativo !== false : false; }
  function capacidade(nome, alvo){ return window.SIGEE_PERMISSOES?.pode?.(nome, alvo || usuarioAtual()) === true; }
  function podeGerirGlobal(){ return capacidade('usuarios.gerenciar_global'); }
  function podeGerirNte(){ return capacidade('usuarios.gerenciar_nte'); }
  function podeVisualizarNte(){ return capacidade('usuarios.visualizar_nte') || podeGerirNte(); }
  function podeVisualizarUsuarios(){ return podeGerirGlobal() || podeVisualizarNte(); }
  function podeGerir(){ return podeGerirGlobal() || podeGerirNte(); }
  function isEstagiario(u){ return perfilCanonico((u||usuarioAtual()||{}).perfil) === 'Estagiário'; }
  function isGlobal(u){ return window.SIGEE_ESCOPO?.ehGlobal?.(u || usuarioAtual()) === true; }
  function nteAtualId(){ return window.SIGEE_ESCOPO?.nteIdUsuario?.(usuarioAtual()) ?? numeroNte(usuarioAtual()?.nte_id ?? usuarioAtual()?.nte); }
  function mesmoEscopo(u){
    if (podeGerirGlobal()) return true;
    const proprio = nteAtualId();
    const alvo = numeroNte(u?.nte_id ?? u?.nte);
    return proprio !== null && alvo !== null && proprio === alvo;
  }
  const PERFIS_GERENCIAVEIS_NTE = new Set(['Técnico','Atendimento','Estagiário','Consulta']);
  function perfilGerenciavelNoNte(perfil){ return PERFIS_GERENCIAVEIS_NTE.has(perfilCanonico(perfil)); }
  function podeEditarAlvo(u){
    if (!u) return false;
    if (podeGerirGlobal()) return true;
    return podeGerirNte() && mesmoEscopo(u) && perfilGerenciavelNoNte(u.perfil);
  }

  function normalizarUsuario(u){
    const perfil = perfilCanonico(u && u.perfil) || 'Técnico';
    const nte = formatarNte((u||{}).nte || (u||{}).nte_id, perfil);
    const idNte = nteId((u||{}).nte_id || nte, perfil);
    return {
      ...(u||{}),
      id: (u||{}).id,
      nome: txt((u||{}).nome || (u||{}).name || 'USUÁRIO').toUpperCase(),
      email: low((u||{}).email),
      perfil,
      nte,
      nte_id: idNte,
      ativo: ativo(u),
      pode_editar: perfil === 'Estagiário' || perfil === 'Consulta' ? false : ((u||{}).pode_editar !== false),
      forcar_troca_senha: (u||{}).forcar_troca_senha === true,
      grupo_id: (u||{}).grupo_id ?? null,
      perfil_acesso_id: (u||{}).perfil_acesso_id ?? null,
      unidade_tipo: txt((u||{}).unidade_tipo || (idNte ? 'NTE' : '')).toUpperCase() || null,
      escola_id: (u||{}).escola_id == null || (u||{}).escola_id === '' ? null : (Number((u||{}).escola_id) || null),
      permissoes_override: (u||{}).permissoes_override ?? null,
      vinculos_modulo: Array.isArray((u||{}).vinculos_modulo) ? (u||{}).vinculos_modulo : [],
      modulos_acesso: Array.isArray((u||{}).modulos_acesso) ? (u||{}).modulos_acesso : []
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
    try { localStorage.removeItem('SIGEE_USUARIOS_COMPLETO_V41'); } catch(e) {}
    return window.usuariosDB;
  }
  let consultaUsuariosEmAndamento = null;
  let ultimaConsultaUsuarios = 0;
  const TTL_USUARIOS_MS = 30000;

  function rotuloModulo(codigo){
    return codigo === 'LEGALIZACAO' ? 'Legalização Escolar' : 'Escolas Extintas';
  }
  function modulosLegado(u){
    const n=normalizarUsuario(u||{});
    if(n.perfil==='Master') return MODULOS_DISPONIVEIS.slice();
    return ['ESCOLAS_EXTINTAS'];
  }
  async function carregarVinculosModulos(lista){
    const usuarios=(lista||[]).filter(u=>u&&u.id!=null);
    if(!usuarios.length) return lista||[];
    const c=client(); if(!c) return lista||[];
    try{
      const ids=usuarios.map(u=>u.id);
      const {data,error}=await c.from(TABELA_MODULOS)
        .select('id,usuario_id,modulo_codigo,perfil_codigo,nte_id,ativo,pode_configurar')
        .in('usuario_id',ids);
      if(error) throw error;
      const porUsuario=new Map();
      (data||[]).filter(v=>v&&v.ativo!==false).forEach(v=>{
        const chave=String(v.usuario_id);
        if(!porUsuario.has(chave)) porUsuario.set(chave,[]);
        porUsuario.get(chave).push(v);
      });
      (lista||[]).forEach(u=>{
        const vinculos=porUsuario.get(String(u.id))||[];
        const mods=vinculos.length ? vinculos.map(v=>v.modulo_codigo).filter(m=>MODULOS_DISPONIVEIS.includes(m)) : modulosLegado(u);
        u.vinculos_modulo=vinculos;
        u.modulos_acesso=[...new Set(mods)];
      });
    }catch(e){
      console.warn('[SIGEE Usuários] Vínculos modulares indisponíveis; mantendo compatibilidade com Escolas Extintas.',e?.message||e);
      (lista||[]).forEach(u=>{ u.modulos_acesso=modulosLegado(u); u.vinculos_modulo=[]; });
    }
    return lista||[];
  }
  async function salvarVinculosModulos(usuarioSalvo, modulos){
    const c=client(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const id=usuarioSalvo?.id;
    if(id==null) throw new Error('Usuário salvo sem identificador para configurar os módulos.');
    let selecionados=[...new Set((modulos||[]).filter(m=>MODULOS_DISPONIVEIS.includes(m)))];
    if(perfilCanonico(usuarioSalvo.perfil)==='Master') selecionados=MODULOS_DISPONIVEIS.slice();
    if(!selecionados.length) throw new Error('Selecione pelo menos um módulo de acesso.');
    const perfil=perfilCanonico(usuarioSalvo.perfil)||'Consulta';
    const nte=usuarioSalvo.nte_id ?? null;
    const rows=selecionados.map(modulo_codigo=>({
      usuario_id:id, modulo_codigo, perfil_codigo:perfil, nte_id:nte, ativo:true,
      pode_configurar:['Master','Administrador','Gestor'].includes(perfil)
    }));
    const {error:upsertError}=await c.from(TABELA_MODULOS).upsert(rows,{onConflict:'usuario_id,modulo_codigo'});
    if(upsertError) throw new Error('Não foi possível configurar os módulos do usuário: '+(upsertError.message||upsertError));
    for(const modulo of MODULOS_DISPONIVEIS.filter(m=>!selecionados.includes(m))){
      const {error}=await c.from(TABELA_MODULOS).update({ativo:false}).eq('usuario_id',id).eq('modulo_codigo',modulo);
      if(error) throw new Error('Não foi possível desativar o módulo '+rotuloModulo(modulo)+': '+(error.message||error));
    }
    usuarioSalvo.modulos_acesso=selecionados;
    usuarioSalvo.vinculos_modulo=rows;
    return rows;
  }
  async function carregarUsuariosSupabase(opcoes={}){
    if (!podeVisualizarUsuarios()) throw new Error('Seu perfil não possui permissão para visualizar usuários.');
    const agora=Date.now();
    if(!opcoes.forcar && baseUsuarios().length && (agora-ultimaConsultaUsuarios)<TTL_USUARIOS_MS) return baseUsuarios();
    if(consultaUsuariosEmAndamento && !opcoes.forcar) return consultaUsuariosEmAndamento;
    const c = client();
    if (!c) throw new Error('Cliente Supabase indisponível.');
    consultaUsuariosEmAndamento=(async()=>{
      let q = c.from(TABELA)
        .select('id,nome,email,perfil,nte,nte_id,ativo,forcar_troca_senha,pode_editar,criado_em,ultima_atividade,grupo_id,perfil_acesso_id,permissoes_override,unidade_tipo,escola_id')
        .order('nome', { ascending:true });
      if (!podeGerirGlobal() && !isGlobal(usuarioAtual())) {
        const idNte = nteAtualId();
        if (!idNte) throw new Error('Usuário territorial sem NTE válido.');
        q = q.eq('nte_id', idNte);
      }
      const { data, error } = await q;
      if (error) throw error;
      const lista = (data || []).filter(u => podeGerirGlobal() || isGlobal(usuarioAtual()) || mesmoEscopo(u));
      const sincronizados=sincronizarBase(lista);
      await carregarVinculosModulos(sincronizados);
      ultimaConsultaUsuarios=Date.now();
      return sincronizados;
    })();
    try{return await consultaUsuariosEmAndamento;}finally{consultaUsuariosEmAndamento=null;}
  }
  function payload(u, modo){
    const n = normalizarUsuario(u);
    // RC8.5.0: somente colunas canônicas. Campos legados não podem invalidar
    // toda a operação quando ausentes no schema atual do Supabase.
    const p = {
      nome: n.nome,
      email: n.email,
      perfil: n.perfil,
      nte: n.nte,
      nte_id: n.nte_id,
      ativo: n.ativo,
      Ativo: n.ativo,
      pode_editar: n.pode_editar,
      grupo_id: n.grupo_id,
      perfil_acesso_id: n.perfil_acesso_id,
      unidade_tipo: n.unidade_tipo,
      escola_id: n.escola_id,
      permissoes_override: n.permissoes_override
    };
    if (modo === 'criar') {
      p.senha = txt(u?.senha || SENHA_PADRAO);
      p.senha_hash = txt(u?.senha_hash || u?.senha || SENHA_PADRAO);
      p.forcar_troca_senha = true;
    }
    return p;
  }
  function erroColunaAusente(error){
    const msg = String(error?.message || error?.details || error || '').toLowerCase();
    return error?.code === 'PGRST204' || msg.includes('column') || msg.includes('coluna') || msg.includes('schema cache');
  }
  async function executarMutacaoCompativel(c, modo, filtro, p){
    const tentativas = [
      p,
      Object.fromEntries(Object.entries(p).filter(([k]) => !['pode_editar'].includes(k))),
      Object.fromEntries(Object.entries(p).filter(([k]) => ['nome','email','perfil','nte_id','ativo','senha','senha_hash','forcar_troca_senha'].includes(k))),
      Object.fromEntries(Object.entries(p).filter(([k]) => ['nome','email','perfil','nte_id','ativo'].includes(k)))
    ];
    let ultimoErro = null;
    for (const candidato of tentativas) {
      let q = modo === 'criar' ? c.from(TABELA).insert(candidato) : c.from(TABELA).update(candidato);
      if (modo !== 'criar') q = filtro.id ? q.eq('id', filtro.id) : q.eq('email', filtro.emailOriginal || filtro.email);
      const { data, error } = await q.select('id,nome,email,perfil,nte,nte_id,ativo,forcar_troca_senha,pode_editar,grupo_id,perfil_acesso_id,permissoes_override,unidade_tipo,escola_id').maybeSingle();
      if (!error) return normalizarUsuario(data || { ...filtro, ...candidato });
      ultimoErro = error;
      if (!erroColunaAusente(error)) break;
    }
    throw ultimoErro || new Error('A alteração do usuário não foi confirmada pelo Supabase.');
  }
  async function salvarUsuario(u, modo, original){
    const c = client();
    if (!c) throw new Error('Cliente Supabase indisponível.');
    if (modo === 'criar') {
      if (!podeGerir()) throw new Error('Seu perfil não possui permissão para cadastrar usuários.');
      if (!podeGerirGlobal()) {
        if (!podeGerirNte()) throw new Error('Seu perfil não possui permissão para cadastrar usuários.');
        if (!perfilGerenciavelNoNte(u.perfil)) throw new Error('Administrador territorial não pode criar perfis administrativos ou globais.');
        u.nte_id = nteAtualId();
        u.nte = formatarNte(u.nte_id, u.perfil);
      }
    } else {
      const alvo = original || u;
      if (!podeEditarAlvo(alvo)) throw new Error('Acesso negado: o usuário não pertence ao seu escopo de gestão.');
      if (!podeGerirGlobal() && !perfilGerenciavelNoNte(u.perfil)) throw new Error('Administrador territorial não pode promover usuários para perfis administrativos ou globais.');
      if (!podeGerirGlobal()) {
        u.nte_id = nteAtualId();
        u.nte = formatarNte(u.nte_id, u.perfil);
      }
    }
    const p = payload(u, modo);
    if (modo === 'criar') {
      const { data: existente, error: errConsulta } = await c.from(TABELA).select('id,email').eq('email', p.email).maybeSingle();
      if (errConsulta) throw errConsulta;
      if (existente) throw new Error('E-mail já cadastrado. Use outro e-mail ou edite o usuário existente.');
      const salvo = await executarMutacaoCompativel(c, 'criar', {}, p);
      await salvarVinculosModulos(salvo, u.modulos_acesso);
      ultimaConsultaUsuarios = 0;
      return salvo;
    }
    const filtro = { id: u.id || original?.id, email: p.email, emailOriginal: low(original?.email || p.email) };
    if (!filtro.id && !filtro.emailOriginal) throw new Error('Identificador do usuário não localizado.');
    const salvo = await executarMutacaoCompativel(c, 'editar', filtro, p);
    await salvarVinculosModulos(salvo, u.modulos_acesso);
    ultimaConsultaUsuarios = 0;
    return salvo;
  }
  async function excluirUsuario(u){
    if (!podeGerirGlobal()) throw new Error('Exclusão de usuários é exclusiva do perfil Master.');
    const atual = usuarioAtual();
    if (String(u?.id || '') === String(atual?.id || '') || low(u?.email) === low(atual?.email)) throw new Error('Não é permitido excluir o próprio usuário conectado.');
    const c = client(); if (!c) throw new Error('Cliente Supabase indisponível.');
    let q = u.id ? c.from(TABELA).delete().eq('id', u.id) : c.from(TABELA).delete().eq('email', u.email);
    const { data, error } = await q.select('id,email');
    if (error) throw error;
    if (!Array.isArray(data) || data.length !== 1) throw new Error('O Supabase não confirmou a exclusão de exatamente um usuário.');
    ultimaConsultaUsuarios = 0;
    return data[0];
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
    const pf = document.getElementById('user-form-perfil');
    const nt = document.getElementById('user-form-nte');
    if (podeGerirGlobal()) {
      if (window.SIGEE_CONFIG_UTILS?.preencherSelectPerfis) window.SIGEE_CONFIG_UTILS.preencherSelectPerfis(pf, valorPerfil, true);
      else preencherPerfis(pf, valorPerfil);
      preencherNtes(nt, valorNte);
      if (nt) nt.disabled = false;
    } else {
      if (pf) {
        const permitidos = PERFIS.filter(item => PERFIS_GERENCIAVEIS_NTE.has(perfilCanonico(item.value)));
        pf.innerHTML = permitidos.map(p => `<option value="${p.value}">${p.label}</option>`).join('');
        pf.value = perfilGerenciavelNoNte(valorPerfil) ? perfilCanonico(valorPerfil) : 'Técnico';
      }
      if (nt) {
        const idNte = nteAtualId();
        nt.innerHTML = idNte ? `<option value="NTE ${String(idNte).padStart(2,'0')}">NTE ${String(idNte).padStart(2,'0')}</option>` : '<option value="">NTE indisponível</option>';
        nt.value = idNte ? `NTE ${String(idNte).padStart(2,'0')}` : '';
        nt.disabled = true;
      }
    }
    if (pf && !pf.dataset.sigee26Change) {
      pf.dataset.sigee26Change = '1';
      pf.addEventListener('change', () => {
        if (podeGerirGlobal() && ['SEC','Gestor'].includes(perfilCanonico(pf.value)) && nt && !nt.value) nt.value = 'SEC - TODOS OS NTEs';
        const atuais=lerModulosFormulario(pf.value);
        aplicarModulosFormulario(atuais.length?atuais:['ESCOLAS_EXTINTAS'],pf.value);
      });
    }
  }
  function aplicarModulosFormulario(modulos, perfil){
    const ext=document.getElementById('user-form-modulo-extintas');
    const leg=document.getElementById('user-form-modulo-legalizacao');
    let selecionados=Array.isArray(modulos)&&modulos.length ? modulos : ['ESCOLAS_EXTINTAS'];
    const master=perfilCanonico(perfil)==='Master';
    if(master) selecionados=MODULOS_DISPONIVEIS.slice();
    if(ext){ ext.checked=selecionados.includes('ESCOLAS_EXTINTAS'); ext.disabled=master; }
    if(leg){ leg.checked=selecionados.includes('LEGALIZACAO'); leg.disabled=master; }
  }
  function lerModulosFormulario(perfil){
    if(perfilCanonico(perfil)==='Master') return MODULOS_DISPONIVEIS.slice();
    const mods=[];
    if(document.getElementById('user-form-modulo-extintas')?.checked) mods.push('ESCOLAS_EXTINTAS');
    if(document.getElementById('user-form-modulo-legalizacao')?.checked) mods.push('LEGALIZACAO');
    return mods;
  }
  function formUsuario(){
    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const perfil = perfilCanonico(document.getElementById('user-form-perfil')?.value);
    const nteRaw = txt(document.getElementById('user-form-nte')?.value);
    const modo = id ? 'editar' : 'criar';
    const existente = id ? normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {}) : null;
    const estaAtivo = modo === 'criar' ? true : (existente ? existente.ativo !== false : true);
    return { id, nome, email, perfil, nte: formatarNte(nteRaw, perfil), nte_id: nteId(nteRaw, perfil), senha:SENHA_PADRAO, senha_hash:SENHA_PADRAO, ativo:estaAtivo, forcar_troca_senha: modo === 'criar', pode_editar: perfil !== 'Estagiário' && perfil !== 'Consulta', modulos_acesso: lerModulosFormulario(perfil) };
  }
  function renderTabelaUsuarios(){
    const corpo = document.getElementById('tabela-usuarios-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    const lista = baseUsuarios().filter(u => podeGerirGlobal() || isGlobal(usuarioAtual()) || mesmoEscopo(u));
    lista.slice().sort((a,b)=>txt(a.nome).localeCompare(txt(b.nome))).forEach(u0 => {
      const u = normalizarUsuario(u0);
      const editar = podeEditarAlvo(u);
      const excluir = podeGerirGlobal();
      const botoes = editar ? `<div class="flex items-center justify-center gap-1.5 flex-wrap">
        <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
        <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo?'Desativar':'Ativar'}</button>
        <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
        ${excluir ? `<button onclick="excluirUsuarioSistemaMasterV45(${u.id})" class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button>` : ''}
      </div>` : '<span class="text-xs text-gray-400 italic">Consulta</span>';
      corpo.insertAdjacentHTML('beforeend', `<tr class="text-xs">
        <td class="p-3 font-bold">${u.nome}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td>
        <td class="p-3 font-medium">${u.perfil === 'Estagiário' ? 'Estagiário' : u.perfil}</td>
        <td class="p-3 font-semibold text-gray-600">${u.nte || ''}</td>
        <td class="p-3"><div class="flex flex-wrap gap-1">${(u.modulos_acesso?.length?u.modulos_acesso:modulosLegado(u)).map(m=>`<span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[9px] font-bold">${m==='LEGALIZACAO'?'LEGALIZAÇÃO':'EXTINTAS'}</span>`).join('')}</div></td>
        <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo?'ATIVO':'INATIVO'}</span></td>
        <td class="p-3 text-center">${botoes}</td>
      </tr>`);
    });
  }
  async function atualizarListaUsuarios(){
    try { await carregarUsuariosSupabase({forcar:true}); } catch(e) { console.warn('[SIGEE 2.6] Falha ao carregar usuários do Supabase:', e); }
    renderTabelaUsuarios();
  }

  window.abrirModalNovoUsuarioMaster = function(){
    if (!podeGerir()) return alert('Seu perfil não possui permissão para cadastrar usuários.');
    prepararSelectsUsuario('', '');
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
    set('user-form-id',''); set('user-form-nome',''); set('user-form-email',''); set('user-form-senha','');
    const titulo=document.getElementById('titulo-modal-usuario'); if(titulo) titulo.innerText='👥 Cadastrar Usuário';
    aplicarModulosFormulario(['ESCOLAS_EXTINTAS'], document.getElementById('user-form-perfil')?.value||'');
    const modal = document.getElementById('modal-cadastro-usuario'); if (modal) modal.classList.remove('hidden');
  };
  window.abrirModalEditarUsuarioMaster = function(id){
    if (!podeGerir()) return alert('Seu perfil não possui permissão para editar usuários.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    if (!podeEditarAlvo(u)) return alert('Acesso negado: usuário fora do seu escopo de gestão.');
    prepararSelectsUsuario(u.perfil, u.nte);
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
    set('user-form-id', u.id); set('user-form-nome', u.nome); set('user-form-email', u.email); set('user-form-senha','');
    const titulo=document.getElementById('titulo-modal-usuario'); if(titulo) titulo.innerText='📝 Editar Usuário';
    aplicarModulosFormulario(u.modulos_acesso?.length?u.modulos_acesso:modulosLegado(u),u.perfil);
    const modal = document.getElementById('modal-cadastro-usuario'); if (modal) modal.classList.remove('hidden');
  };
  let salvamentoEmAndamento = false;
  window.salvarNovoUsuarioFormularioMaster = async function(ev){
    if (ev) { ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    if (salvamentoEmAndamento) return false;
    if (!podeGerir()) return alert('Seu perfil não possui permissão para salvar usuários.');
    const sessaoAntes = window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null;
    const u = formUsuario();
    const original = u.id ? normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(u.id)) || {}) : null;
    if (!u.nome) return alert('Informe o nome do usuário.');
    if (!u.email) return alert('Informe o e-mail do usuário.');
    if (!u.perfil) return alert('Selecione o Perfil.');
    if (!Array.isArray(u.modulos_acesso) || !u.modulos_acesso.length) return alert('Selecione pelo menos um módulo de acesso.');
    const gestorGlobal = u.perfil === 'Gestor' && ehVinculoGlobal(u.nte);
    if (!['SEC','Master'].includes(u.perfil) && !gestorGlobal && !u.nte_id) return alert('Selecione um NTE específico ou, para Gestor SEC, use SEC - TODOS OS NTEs.');
    const botao = document.querySelector('#form-cadastro-usuario button[type="submit"]');
    salvamentoEmAndamento = true;
    if (botao) { botao.disabled = true; botao.dataset.textoOriginal = botao.textContent; botao.textContent = 'Salvando...'; }
    try {
      const salvo = await salvarUsuario(u, u.id ? 'editar' : 'criar', original);
      await carregarUsuariosSupabase({forcar:true});
      renderTabelaUsuarios();
      document.getElementById('modal-cadastro-usuario')?.classList.add('hidden');
      alert('Usuário salvo com sucesso.');
      return salvo;
    } catch(e) {
      console.error('[SIGEE 2.6] Erro ao salvar usuário:', e);
      alert('Não foi possível salvar o usuário. A sessão Master foi preservada.\n\n' + (e.message || e));
      return false;
    } finally {
      salvamentoEmAndamento = false;
      if (botao) { botao.disabled = false; botao.textContent = botao.dataset.textoOriginal || 'Salvar Configurações'; }
      if (sessaoAntes?.email) {
        const atual = window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null;
        if (!atual?.email || low(atual.email) !== low(sessaoAntes.email)) {
          window.SIGEE_SESSION?.setUser?.(sessaoAntes,{source:'usuarios-crud-invariant',persist:true,emit:false});
          window.usuarioLogado = sessaoAntes;
        }
        document.getElementById('tela-login')?.classList.add('hidden');
        document.getElementById('sistema-dashboard')?.classList.remove('hidden');
        window.SIGEE_AUTORIZACAO?.aplicarMenus?.();
      }
    }
  };
  window.resetarSenhaUsuarioMaster = async function(id){
    if (!podeGerir()) return alert('Seu perfil não possui permissão para resetar senha.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    if (!podeEditarAlvo(u)) return alert('Acesso negado: usuário fora do seu escopo de gestão.');
    try {
      const c = client(); if (!c) throw new Error('Cliente Supabase indisponível.');
      const { data, error } = await c.from(TABELA)
        .update({senha:SENHA_PADRAO, senha_hash:SENHA_PADRAO, forcar_troca_senha:true})
        .eq('id', u.id).select('id,email,forcar_troca_senha').maybeSingle();
      if (error) throw error;
      if (!data || String(data.id) !== String(u.id)) throw new Error('O Supabase não confirmou o reset de senha.');
      ultimaConsultaUsuarios = 0;
      await atualizarListaUsuarios();
      alert('Senha resetada para SEC@2026. No próximo login, o usuário deverá cadastrar nova senha.');
    } catch(e) { alert('Erro ao resetar senha: ' + (e.message || e)); }
  };
  window.toggleStatusUsuarioMaster = async function(id){
    if (!podeGerir()) return alert('Seu perfil não possui permissão para ativar/desativar usuários.');
    const u = normalizarUsuario(baseUsuarios().find(x => String(x.id) === String(id)) || {});
    if (!u.email) return alert('Usuário não localizado.');
    if (!podeEditarAlvo(u)) return alert('Acesso negado: usuário fora do seu escopo de gestão.');
    const atual = usuarioAtual();
    if ((String(u.id||'') === String(atual?.id||'') || low(u.email) === low(atual?.email)) && u.ativo) return alert('Não é permitido inativar o próprio usuário conectado.');
    try {
      const c = client(); if (!c) throw new Error('Cliente Supabase indisponível.');
      const novoStatus = !u.ativo;
      const { data, error } = await c.from(TABELA).update({ativo:novoStatus, Ativo:novoStatus}).eq('id',u.id).select('id,email,ativo,Ativo').maybeSingle();
      if (error) throw error;
      if (!data || data.ativo !== novoStatus || data.Ativo !== novoStatus) throw new Error('O Supabase não confirmou a alteração de status.');
      ultimaConsultaUsuarios = 0;
      await atualizarListaUsuarios();
    } catch(e){ alert('Erro ao alterar usuário: ' + (e.message || e)); }
  };
  window.excluirUsuarioSistemaMasterV45 = window.excluirUsuarioSistemaSIGEE = async function(id){
    if (!podeGerirGlobal()) return alert('Exclusão de usuários é exclusiva do perfil Master.');
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
      form.addEventListener('submit', function(event){
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        return window.salvarNovoUsuarioFormularioMaster(event);
      }, true);
    }
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(capturarSubmit, 300); setTimeout(atualizarListaUsuarios, 700); });
  window.addEventListener('load', function(){ setTimeout(capturarSubmit, 600); setTimeout(atualizarListaUsuarios, 1000); });
  window.carregarListaUsuarios = atualizarListaUsuarios;
  try { carregarListaUsuarios = window.carregarListaUsuarios; } catch(e) {}

  window.SIGEE_USUARIOS_26 = { SENHA_PADRAO, PERFIS, perfilCanonico, normalizarUsuario, carregarUsuariosSupabase, salvarUsuario, atualizarListaUsuarios, isEstagiario, isGlobal, podeGerirGlobal, podeGerirNte, podeEditarAlvo, versao:'RC12.0.10A.8' };
})();


/* RC10.8.40 — Guarda de domínio do CRUD de Usuários por capacidade e escopo. */
(function(window){
  'use strict';
  const ACOES_GERIR = [
    'abrirModalCriarUsuarioMaster','abrirModalNovoUsuarioMaster','abrirModalEditarUsuarioMaster',
    'salvarNovoUsuarioFormularioMaster','toggleStatusUsuarioMaster','resetarSenhaUsuarioMaster'
  ];
  const ACOES_GLOBAL = ['excluirUsuarioSistemaSIGEE','excluirUsuarioSistemaMasterV45'];
  function autorizadoGerir(){
    return window.SIGEE_PERMISSOES?.pode?.('usuarios.gerenciar_global') === true ||
           window.SIGEE_PERMISSOES?.pode?.('usuarios.gerenciar_nte') === true;
  }
  function autorizadoGlobal(){ return window.SIGEE_PERMISSOES?.pode?.('usuarios.gerenciar_global') === true; }
  function proteger(nome, verificador, mensagem){
    const original=window[nome];
    if(typeof original!=='function'||original.__SIGEE_USUARIOS_DOMAIN_GUARD__)return;
    const protegido=function(){
      if(!verificador()){ alert(mensagem); return false; }
      return original.apply(this,arguments);
    };
    protegido.__SIGEE_USUARIOS_DOMAIN_GUARD__=true;
    protegido.__original=original;
    window[nome]=protegido;
  }
  function instalar(){
    ACOES_GERIR.forEach(nome=>proteger(nome,autorizadoGerir,'Seu perfil não possui permissão para gerenciar usuários.'));
    ACOES_GLOBAL.forEach(nome=>proteger(nome,autorizadoGlobal,'Exclusão de usuários é exclusiva do perfil Master.'));
  }
  document.addEventListener('DOMContentLoaded',instalar,{once:true});
  document.addEventListener('sigee:usuario-logado',instalar);
  window.addEventListener('load',instalar,{once:true});
})(window);

/* RC7.3.0 — Construtor legado de Administração removido.
   O menu administrativo pertence exclusivamente a js/core/autorizacao.js. */
