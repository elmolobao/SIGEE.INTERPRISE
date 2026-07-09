/* =====================================================================
   SIGEE Enterprise V31.2 - Correção final Usuários Master
   - Master salva usuários criados/alterados.
   - Master exclui usuários.
   - Remove usuários padrão SEC, Administrador e Consulta.
   - Remove perfis SEC, Administrador e Consulta do cadastro.
   - Mantém GLOBAL como filtro institucional, sem criar usuário SEC.
   ===================================================================== */
(function(){
  'use strict';

  const STORAGE = 'SIGEE_USUARIOS_COMPLETO_V41';
  const EMAILS_REMOVER = [
    'sec@enova.educacao.ba.gov.br',
    'administrador@enova.educacao.ba.gov.br',
    'admin@enova.educacao.ba.gov.br',
    'consulta@enova.educacao.ba.gov.br'
  ];
  const NOMES_REMOVER = ['USUARIO SEC','USUÁRIO SEC','ADMINISTRADOR SIGEE','USUARIO ADMINISTRADOR','USUÁRIO ADMINISTRADOR','USUARIO CONSULTA','USUÁRIO CONSULTA','CONSULTA SIGEE'];

  function txt(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return semAcento(v).toUpperCase(); }
  function perfil(v){
    const p = up(v || 'Tecnico');
    if (p.includes('MASTER')) return 'Master';
    // Nesta versão, SEC/Administrador/Consulta deixam de ser opções de usuário criável.
    return 'Tecnico';
  }
  function normalizarUsuario(u){
    u = u || {};
    const email = low(u.email);
    return Object.assign({}, u, {
      id: u.id || Date.now(),
      nome: txt(u.nome || u.name || 'USUARIO').toUpperCase(),
      email,
      senha: txt(u.senha || u.password || '123'),
      perfil: low(email) === 'elmo.lobao@enova.educacao.ba.gov.br' ? 'Master' : perfil(u.perfil || u.tipo || u.role),
      nte: txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo || 'NTE-26 Salvador'),
      ativo: u.ativo !== false
    });
  }
  function ehRemovido(u){
    const email = low(u && u.email);
    const nome = up(u && u.nome);
    if (EMAILS_REMOVER.includes(email)) return true;
    if (NOMES_REMOVER.includes(nome)) return true;
    // Remove contas antigas criadas como perfil Consulta, SEC ou Administrador, exceto Master do Elmo.
    const p = up(u && u.perfil);
    if (email !== 'elmo.lobao@enova.educacao.ba.gov.br' && (p === 'SEC' || p === 'CONSULTA' || p === 'ADMINISTRADOR')) return true;
    return false;
  }
  function getUsuarios(){
    let base = [];
    try { if (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB)) base = usuariosDB; } catch(e) {}
    if (!base.length && Array.isArray(window.usuariosDB)) base = window.usuariosDB;
    try { usuariosDB = base; } catch(e) {}
    window.usuariosDB = base;
    return base;
  }
  function setUsuarios(lista){
    const norm = (lista || []).filter(u => u && u.email).filter(u => !ehRemovido(u)).map(normalizarUsuario);
    try { usuariosDB = norm; } catch(e) {}
    window.usuariosDB = norm;
    try { localStorage.setItem(STORAGE, JSON.stringify(norm)); } catch(e) {}
    return norm;
  }
  function purgeUsuariosPadrao(){
    const base = getUsuarios();
    const antes = base.length;
    const limpo = base.filter(u => !ehRemovido(u)).map(normalizarUsuario);
    if (limpo.length !== antes || limpo.some((u,i) => base[i] !== u)) setUsuarios(limpo);
    return getUsuarios();
  }
  function usuarioAtual(){
    try { return window.usuarioLogado || usuarioLogado || null; } catch(e) { return window.usuarioLogado || null; }
  }
  function isMaster(u){ return perfil(u && u.perfil) === 'Master' || low(u && u.email) === 'elmo.lobao@enova.educacao.ba.gov.br'; }
  function nteUsuario(u){ return txt(u && (u.nte || u.nte_nome || u.nte_vinculado) || 'NTE-26 Salvador'); }
  function mesmoNte(a,b){
    const ma = txt(a).match(/NTE\s*[- ]?\s*(\d{1,2})/i), mb = txt(b).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    if (ma && mb) return Number(ma[1]) === Number(mb[1]);
    return up(a).replace(/[^A-Z0-9]/g,'') === up(b).replace(/[^A-Z0-9]/g,'');
  }
  function supabaseClient(){
    try { if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE(); } catch(e) {}
    try { if (typeof criarClienteSupabaseSIGEE === 'function') return criarClienteSupabaseSIGEE(); } catch(e) {}
    try { if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') return window.SIGEE_SUPABASE.criarCliente(); } catch(e) {}
    return window.SIGEE_SUPABASE_CLIENT || window.supabaseClient || null;
  }
  function tabelaUsuarios(){
    return (window.SIGEE_CONFIG && window.SIGEE_CONFIG.supabase && window.SIGEE_CONFIG.supabase.tabelas && window.SIGEE_CONFIG.supabase.tabelas.usuarios) ||
           (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
  }
  async function salvarSupabase(u){
    const c = supabaseClient();
    if (!c || !c.from) return false;
    const tabela = tabelaUsuarios();
    const completo = { nome:u.nome, email:u.email, senha:u.senha, perfil:u.perfil, nte:u.nte, ativo:u.ativo !== false };
    let resp = await c.from(tabela).upsert(completo, { onConflict:'email' }).select();
    if (!resp.error) return true;
    console.warn('[SIGEE V31.2] Upsert completo falhou; tentando payload compatível.', resp.error);
    const minimo = { nome:u.nome, email:u.email, perfil:u.perfil, ativo:u.ativo !== false };
    resp = await c.from(tabela).upsert(minimo, { onConflict:'email' }).select();
    if (resp.error) { console.warn('[SIGEE V31.2] Supabase recusou salvamento de usuário.', resp.error); return false; }
    return true;
  }
  async function excluirSupabase(u){
    const c = supabaseClient();
    if (!c || !c.from || !u) return false;
    const tabela = tabelaUsuarios();
    let ok = false;
    try { if (u.id) { const r = await c.from(tabela).delete().eq('id', u.id); ok = ok || !r.error; } } catch(e) {}
    try { if (u.email) { const r = await c.from(tabela).delete().eq('email', u.email); ok = ok || !r.error; } } catch(e) {}
    return ok;
  }
  function salvarLocal(){ setUsuarios(getUsuarios()); }
  function registrar(acao){ try { if (typeof registrarLog === 'function') registrarLog(acao); } catch(e) {} }
  function refreshUsuarios(){
    purgeUsuariosPadrao();
    try { window.carregarListaUsuarios(); } catch(e) {}
    try { if (typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal(); } catch(e) {}
  }

  function aplicarSelectPerfis(){
    document.querySelectorAll('#user-form-perfil').forEach(sel => {
      const valorAtual = perfil(sel.value || 'Tecnico');
      sel.innerHTML = '<option value="Tecnico">Técnico</option><option value="Master">Master</option>';
      sel.value = valorAtual === 'Master' ? 'Master' : 'Tecnico';
    });
  }

  const abrirCriarAnterior = window.abrirModalCriarUsuarioMaster || (typeof abrirModalCriarUsuarioMaster !== 'undefined' ? abrirModalCriarUsuarioMaster : null);
  window.abrirModalCriarUsuarioMaster = function(){
    if (!isMaster(usuarioAtual())) return alert('Cadastro de usuários permitido apenas para Master.');
    if (typeof abrirCriarAnterior === 'function') abrirCriarAnterior.apply(this, arguments);
    setTimeout(function(){
      const t = document.getElementById('titulo-modal-usuario'); if (t) t.innerText = '👥 Cadastrar Usuário';
      const id = document.getElementById('user-form-id'); if (id) id.value = '';
      const nome = document.getElementById('user-form-nome'); if (nome) nome.value = '';
      const email = document.getElementById('user-form-email'); if (email) email.value = '';
      const senha = document.getElementById('user-form-senha'); if (senha) senha.value = '123';
      aplicarSelectPerfis();
      const nte = document.getElementById('user-form-nte'); if (nte) nte.disabled = false;
      document.getElementById('modal-cadastro-usuario')?.classList.remove('hidden');
    }, 30);
  };
  try { abrirModalCriarUsuarioMaster = window.abrirModalCriarUsuarioMaster; } catch(e) {}

  const abrirEditarAnterior = window.abrirModalEditarUsuarioMaster || (typeof abrirModalEditarUsuarioMaster !== 'undefined' ? abrirModalEditarUsuarioMaster : null);
  window.abrirModalEditarUsuarioMaster = function(id){
    if (!isMaster(usuarioAtual())) return alert('Edição de usuários permitida apenas para Master.');
    const u = getUsuarios().find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    if (ehRemovido(u)) { purgeUsuariosPadrao(); return alert('Este usuário padrão foi removido do sistema.'); }
    if (typeof abrirEditarAnterior === 'function') abrirEditarAnterior.apply(this, arguments);
    setTimeout(function(){
      const t = document.getElementById('titulo-modal-usuario'); if (t) t.innerText = '📝 Editar Usuário';
      const idEl = document.getElementById('user-form-id'); if (idEl) idEl.value = u.id;
      const nome = document.getElementById('user-form-nome'); if (nome) nome.value = u.nome || '';
      const email = document.getElementById('user-form-email'); if (email) email.value = u.email || '';
      const senha = document.getElementById('user-form-senha'); if (senha) senha.value = u.senha || '123';
      const nte = document.getElementById('user-form-nte'); if (nte) { nte.disabled = false; nte.value = nteUsuario(u); }
      aplicarSelectPerfis();
      const perfilEl = document.getElementById('user-form-perfil'); if (perfilEl) perfilEl.value = perfil(u.perfil) === 'Master' ? 'Master' : 'Tecnico';
      document.getElementById('modal-cadastro-usuario')?.classList.remove('hidden');
    }, 30);
  };
  try { abrirModalEditarUsuarioMaster = window.abrirModalEditarUsuarioMaster; } catch(e) {}

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if (event) event.preventDefault();
    if (!isMaster(usuarioAtual())) return alert('Operação permitida apenas para Master.');
    purgeUsuariosPadrao();
    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const senha = txt(document.getElementById('user-form-senha')?.value) || '123';
    const nte = txt(document.getElementById('user-form-nte')?.value) || nteUsuario(usuarioAtual());
    const pf = perfil(document.getElementById('user-form-perfil')?.value);
    if (!nome || !email) return alert('Informe nome e e-mail.');
    if (EMAILS_REMOVER.includes(email)) return alert('Este usuário padrão foi removido e não pode ser recriado.');
    const base = getUsuarios();
    let idx = id ? base.findIndex(x => String(x.id) === String(id)) : -1;
    if (idx < 0 && base.some(x => low(x.email) === email)) return alert('E-mail já cadastrado.');
    const atual = idx >= 0 ? base[idx] : {};
    const novo = normalizarUsuario({ ...atual, id: atual.id || Date.now(), nome, email, senha, perfil: pf, nte, ativo: atual.ativo !== false });
    if (idx >= 0) base[idx] = novo; else base.push(novo);
    salvarLocal();
    await salvarSupabase(novo);
    registrar(`${idx >= 0 ? 'Atualizou' : 'Cadastrou'} usuário: ${novo.nome} (${novo.email})`);
    document.getElementById('modal-cadastro-usuario')?.classList.add('hidden');
    refreshUsuarios();
    alert('Usuário salvo com sucesso.');
  };
  try { salvarNovoUsuarioFormularioMaster = window.salvarNovoUsuarioFormularioMaster; } catch(e) {}

  window.toggleStatusUsuarioMaster = async function(id){
    if (!isMaster(usuarioAtual())) return alert('Operação permitida apenas para Master.');
    const u = getUsuarios().find(x => String(x.id) === String(id));
    if (!u) return;
    u.ativo = !(u.ativo !== false);
    salvarLocal();
    await salvarSupabase(normalizarUsuario(u));
    registrar(`${u.ativo ? 'Ativou' : 'Desativou'} usuário: ${u.nome || u.email}`);
    refreshUsuarios();
  };
  try { toggleStatusUsuarioMaster = window.toggleStatusUsuarioMaster; } catch(e) {}

  window.resetarSenhaUsuarioMaster = async function(id){
    if (!isMaster(usuarioAtual())) return alert('Operação permitida apenas para Master.');
    const u = getUsuarios().find(x => String(x.id) === String(id));
    if (!u) return;
    const nova = prompt('Informe a nova senha provisória:', '123');
    if (nova === null) return;
    u.senha = txt(nova) || '123';
    salvarLocal();
    await salvarSupabase(normalizarUsuario(u));
    registrar(`Resetou senha do usuário: ${u.nome || u.email}`);
    alert('Senha atualizada.');
    refreshUsuarios();
  };
  try { resetarSenhaUsuarioMaster = window.resetarSenhaUsuarioMaster; } catch(e) {}

  window.excluirUsuarioSistemaSIGEE = async function(id){ return window.excluirUsuarioSistemaMasterV31_2(id); };
  window.excluirUsuarioSistemaMasterV45 = async function(id){ return window.excluirUsuarioSistemaMasterV31_2(id); };
  window.excluirUsuarioSistemaMasterV31_2 = async function(id){
    if (!isMaster(usuarioAtual())) return alert('Exclusão de usuários permitida apenas para Master.');
    const base = getUsuarios();
    const idx = base.findIndex(x => String(x.id) === String(id));
    if (idx < 0) return alert('Usuário não localizado.');
    const u = base[idx];
    if (low(u.email) === low(usuarioAtual() && usuarioAtual().email)) return alert('Não é permitido excluir o próprio usuário logado.');
    if (!confirm(`Confirma excluir o usuário ${u.nome || u.email}?`)) return;
    base.splice(idx, 1);
    salvarLocal();
    await excluirSupabase(u);
    registrar(`Excluiu usuário: ${u.nome || u.email}`);
    refreshUsuarios();
    alert('Usuário excluído.');
  };
  try { excluirUsuarioSistemaSIGEE = window.excluirUsuarioSistemaSIGEE; } catch(e) {}
  try { excluirUsuarioSistemaMasterV45 = window.excluirUsuarioSistemaMasterV45; } catch(e) {}

  window.carregarListaUsuarios = function(){
    const corpo = document.getElementById('tabela-usuarios-corpo');
    if (!corpo) return;
    purgeUsuariosPadrao();
    const uLog = usuarioAtual();
    let lista = getUsuarios().slice();
    if (!isMaster(uLog)) lista = lista.filter(u => mesmoNte(nteUsuario(u), nteUsuario(uLog)));
    corpo.innerHTML = '';
    lista.forEach(u => {
      const pode = isMaster(uLog);
      const botoes = pode ? `<div class="flex items-center justify-center gap-1.5">
        <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
        <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo!==false?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo!==false?'Desativar':'Ativar'}</button>
        <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
        <button onclick="excluirUsuarioSistemaMasterV31_2(${u.id})" class="bg-red-800 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button>
      </div>` : '<span class="text-xs text-gray-400 italic">Sem permissão</span>';
      corpo.insertAdjacentHTML('beforeend', `<tr class="text-xs">
        <td class="p-3 font-bold">${u.nome}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td>
        <td class="p-3 font-medium">${perfil(u.perfil)}</td>
        <td class="p-3 font-semibold text-gray-600">${nteUsuario(u)}</td>
        <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo!==false?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo!==false?'ATIVO':'INATIVO'}</span></td>
        <td class="p-3 text-center">${botoes}</td>
      </tr>`);
    });
  };
  try { carregarListaUsuarios = window.carregarListaUsuarios; } catch(e) {}

  function aplicarFix(){
    purgeUsuariosPadrao();
    aplicarSelectPerfis();
    try { if (document.getElementById('aba-usuarios') && !document.getElementById('aba-usuarios').classList.contains('hidden')) window.carregarListaUsuarios(); } catch(e) {}
    // Remove opção SEC/Administrador/Consulta de qualquer select recriado por patches antigos.
    document.querySelectorAll('select').forEach(sel => {
      Array.from(sel.options || []).forEach(opt => {
        const v = up(opt.value + ' ' + opt.textContent);
        if ((sel.id === 'user-form-perfil') && (v.includes('SEC') || v.includes('ADMINISTRADOR') || v.includes('CONSULTA'))) opt.remove();
      });
    });
  }

  const oldLogin = window.handleLogin;
  if (typeof oldLogin === 'function') {
    window.handleLogin = async function(){
      const r = await oldLogin.apply(this, arguments);
      setTimeout(aplicarFix, 50);
      setTimeout(aplicarFix, 500);
      return r;
    };
    try { handleLogin = window.handleLogin; } catch(e) {}
  }
  const oldNavegar = window.navegar;
  if (typeof oldNavegar === 'function') {
    window.navegar = function(){
      const r = oldNavegar.apply(this, arguments);
      setTimeout(aplicarFix, 50);
      setTimeout(aplicarFix, 300);
      return r;
    };
    try { navegar = window.navegar; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(aplicarFix, 100); setTimeout(aplicarFix, 800); setTimeout(aplicarFix, 2000); });
  window.addEventListener('load', function(){ setTimeout(aplicarFix, 200); setTimeout(aplicarFix, 1200); });
  setInterval(aplicarFix, 5000);
  window.SIGEE_V31_2_USUARIOS_MASTER = { aplicarFix, purgeUsuariosPadrao, salvarSupabase, excluirSupabase };
})();
