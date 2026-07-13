/* =====================================================================
   SIGEE - Usuários CRUD Supabase FINAL
   Objetivo: substituir as rotinas antigas em memória (usuariosDB) por
   operações reais na tabela public.usuarios_sigee.
   Carregar este arquivo por último no index.html.
   ===================================================================== */
(function(){
  'use strict';

  const TABELA = 'usuarios_sigee';
  const SENHA_PADRAO = '123';

  function texto(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
  function emailNorm(v){ return texto(v).toLowerCase(); }
  function semAcento(v){ return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function perfilCanonico(v){
    const p = semAcento(v || 'Tecnico').toUpperCase();
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }
  function nteIdDeValor(v){
    const s = texto(v);
    if (!s || /SEC|TODOS/i.test(s)) return null;
    const m = s.match(/(\d{1,2})/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n >= 1 && n <= 27 ? n : null;
  }
  function nteTexto(id, original){
    const n = id || nteIdDeValor(original);
    return n ? `NTE ${String(n).padStart(2,'0')}` : 'SEC - TODOS OS NTES';
  }
  function usuarioAtual(){
    try { return window.usuarioLogado || usuarioLogado || null; } catch(e){ return window.usuarioLogado || null; }
  }
  function podeGerenciarUsuarios(){
    const u = usuarioAtual() || {};
    const p = perfilCanonico(u.perfil);
    return p === 'Master' || p === 'SEC';
  }
  function client(){
    try { if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE(); } catch(e) {}
    try { if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient; } catch(e) {}
    try { if (window.__SIGEE_V38_CLIENT && window.__SIGEE_V38_CLIENT.from) return window.__SIGEE_V38_CLIENT; } catch(e) {}
    return null;
  }

  function mapUsuario(u){
    const nteId = u.nte_id ?? nteIdDeValor(u.nte);
    const ativo = (u.ativo !== undefined && u.ativo !== null) ? !!u.ativo : ((u.Ativo !== undefined && u.Ativo !== null) ? !!u.Ativo : true);
    return {
      id: u.id,
      nome: texto(u.nome).toUpperCase(),
      email: emailNorm(u.email),
      senha: texto(u.senha || u.senha_hash || SENHA_PADRAO),
      senha_hash: texto(u.senha_hash || u.senha || SENHA_PADRAO),
      perfil: perfilCanonico(u.perfil),
      nte_id: nteId,
      nte: nteTexto(nteId, u.nte),
      ativo,
      Ativo: ativo,
      forcar_troca_senha: !!u.forcar_troca_senha,
      grupo_id: u.grupo_id || null,
      perfil_acesso_id: u.perfil_acesso_id || null,
      permissoes_override: u.permissoes_override || {},
      ultima_atividade: u.ultima_atividade,
      criado_em: u.criado_em
    };
  }

  function payloadUsuario({nome,email,senha,perfil,nte}){
    const p = perfilCanonico(perfil);
    const nteId = (p === 'SEC') ? null : nteIdDeValor(nte);
    const ativo = true;
    const senhaFinal = texto(senha) || SENHA_PADRAO;
    return {
      nome: texto(nome).toUpperCase(),
      email: emailNorm(email),
      senha: senhaFinal,
      senha_hash: senhaFinal,
      perfil: p,
      nte_id: nteId,
      nte: p === 'SEC' ? 'SEC - TODOS OS NTES' : nteTexto(nteId, nte),
      ativo,
      Ativo: ativo,
      forcar_troca_senha: false
    };
  }

  async function buscarUsuariosSupabase(){
    const c = client();
    if (!c) throw new Error('Cliente Supabase não localizado.');
    const { data, error } = await c.from(TABELA).select('*').order('nome', { ascending: true });
    if (error) throw error;
    const lista = (data || []).map(mapUsuario);
    window.usuariosDB = lista;
    try { usuariosDB = lista; } catch(e) {}
    return lista;
  }

  function popularNtes(){
    const sel = document.getElementById('user-form-nte');
    if (!sel) return;
    sel.innerHTML = '';
    const optSec = document.createElement('option');
    optSec.value = 'SEC - TODOS OS NTES';
    optSec.textContent = 'SEC - TODOS OS NTES';
    sel.appendChild(optSec);
    for (let i=1;i<=27;i++){
      const opt = document.createElement('option');
      opt.value = `NTE ${String(i).padStart(2,'0')}`;
      opt.textContent = `NTE ${String(i).padStart(2,'0')}`;
      sel.appendChild(opt);
    }
  }

  function popularPerfis(){
    const sel = document.getElementById('user-form-perfil');
    if (!sel) return;
    sel.innerHTML = '<option value="SEC">SEC</option><option value="Master">Master</option><option value="Administrador">Administrador</option><option value="Tecnico">Tecnico</option><option value="Consulta">Consulta</option>';
  }

  function renderizarUsuarios(lista){
    const corpo = document.getElementById('tabela-usuarios-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    (lista || window.usuariosDB || []).forEach(u0 => {
      const u = mapUsuario(u0);
      const statusClass = u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      corpo.innerHTML += `
        <tr class="text-xs">
          <td class="p-3 font-bold">${u.nome}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td>
          <td class="p-3 font-medium">${u.perfil}</td>
          <td class="p-3 font-semibold text-gray-600">${u.nte}</td>
          <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${statusClass}">${u.ativo ? 'ATIVO' : 'INATIVO'}</span></td>
          <td class="p-3 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
              <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo ? 'bg-red-600' : 'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo ? 'Desativar' : 'Ativar'}</button>
              <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
              <button type="button" class="sigee-btn-editar-acessos bg-indigo-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer" data-user-id="${String(u.id).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">Editar acessos</button>
              <button onclick="excluirUsuarioSistemaSIGEE(${u.id})" class="bg-red-800 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button>
            </div>
          </td>
        </tr>`;
    });
  }

  window.carregarListaUsuarios = async function(){
    try {
      const lista = await buscarUsuariosSupabase();
      renderizarUsuarios(lista);
    } catch(e) {
      console.error('SIGEE Usuários: erro ao carregar usuários.', e);
      alert('Erro ao carregar usuários: ' + (e.message || e));
    }
  };

  window.abrirModalCriarUsuarioMaster = function(){
    if (!podeGerenciarUsuarios()) return alert('Cadastro de usuários permitido apenas para SEC e Master.');
    popularNtes();
    popularPerfis();
    document.getElementById('titulo-modal-usuario').innerText = '👥 Cadastrar Usuário';
    document.getElementById('user-form-id').value = '';
    document.getElementById('user-form-nome').value = '';
    document.getElementById('user-form-email').value = '';
    document.getElementById('user-form-senha').value = SENHA_PADRAO;
    document.getElementById('user-form-perfil').value = 'Tecnico';
    document.getElementById('user-form-nte').value = 'NTE 26';
    document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
  };

  window.abrirModalEditarUsuarioMaster = async function(id){
    if (!podeGerenciarUsuarios()) return alert('Edição de usuários permitida apenas para SEC e Master.');
    let lista = window.usuariosDB || [];
    if (!lista.length) lista = await buscarUsuariosSupabase();
    const u = lista.map(mapUsuario).find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    popularNtes();
    popularPerfis();
    document.getElementById('titulo-modal-usuario').innerText = '📝 Editar Usuário';
    document.getElementById('user-form-id').value = u.id;
    document.getElementById('user-form-nome').value = u.nome;
    document.getElementById('user-form-email').value = u.email;
    document.getElementById('user-form-senha').value = u.senha || SENHA_PADRAO;
    document.getElementById('user-form-perfil').value = u.perfil;
    document.getElementById('user-form-nte').value = u.nte || nteTexto(u.nte_id);
    document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
  };

  window.fecharModalUsuario = function(){
    document.getElementById('modal-cadastro-usuario')?.classList.add('hidden');
  };

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if (event) event.preventDefault();
    if (!podeGerenciarUsuarios()) return alert('Operação permitida apenas para SEC e Master.');
    const c = client();
    if (!c) return alert('Cliente Supabase não localizado.');

    const id = texto(document.getElementById('user-form-id')?.value);
    const payload = payloadUsuario({
      nome: document.getElementById('user-form-nome')?.value,
      email: document.getElementById('user-form-email')?.value,
      senha: document.getElementById('user-form-senha')?.value,
      perfil: document.getElementById('user-form-perfil')?.value,
      nte: document.getElementById('user-form-nte')?.value
    });

    if (!payload.nome || !payload.email) return alert('Informe nome e e-mail.');

    try {
      if (id) {
        const { error } = await c.from(TABELA).update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data: existente, error: buscaErro } = await c.from(TABELA).select('id,email').eq('email', payload.email).maybeSingle();
        if (buscaErro) throw buscaErro;
        if (existente && existente.id) {
          alert('Este e-mail já existe. O cadastro existente será atualizado.');
          const { error } = await c.from(TABELA).update(payload).eq('id', existente.id);
          if (error) throw error;
        } else {
          const { error } = await c.from(TABELA).insert(payload);
          if (error) throw error;
        }
      }
      window.fecharModalUsuario();
      await window.carregarListaUsuarios();
      alert('Usuário salvo no Supabase.');
    } catch(e) {
      console.error('Erro ao salvar usuário:', e);
      alert('Erro ao salvar usuário: ' + (e.message || e));
    }
  };

  window.resetarSenhaUsuarioMaster = async function(id){
    if (!podeGerenciarUsuarios()) return alert('Operação permitida apenas para SEC e Master.');
    const c = client();
    if (!c) return alert('Cliente Supabase não localizado.');
    try {
      const { error } = await c.from(TABELA).update({ senha: SENHA_PADRAO, senha_hash: SENHA_PADRAO, forcar_troca_senha: false }).eq('id', id);
      if (error) throw error;
      await window.carregarListaUsuarios();
      alert('Senha resetada para: ' + SENHA_PADRAO);
    } catch(e) {
      console.error('Erro ao resetar senha:', e);
      alert('Erro ao resetar senha: ' + (e.message || e));
    }
  };

  window.toggleStatusUsuarioMaster = async function(id){
    if (!podeGerenciarUsuarios()) return alert('Operação permitida apenas para SEC e Master.');
    const lista = window.usuariosDB || [];
    const u = lista.map(mapUsuario).find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    const novo = !u.ativo;
    const c = client();
    try {
      const { error } = await c.from(TABELA).update({ ativo: novo, Ativo: novo }).eq('id', id);
      if (error) throw error;
      await window.carregarListaUsuarios();
    } catch(e) {
      console.error('Erro ao alterar status:', e);
      alert('Erro ao alterar status: ' + (e.message || e));
    }
  };

  window.excluirUsuarioSistemaSIGEE = async function(id){
    if (!podeGerenciarUsuarios()) return alert('Exclusão de usuários permitida apenas para SEC e Master.');
    const lista = window.usuariosDB || [];
    const u = lista.map(mapUsuario).find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    if (!confirm(`Confirma excluir o usuário ${u.nome}?`)) return;
    const c = client();
    try {
      const { error } = await c.from(TABELA).delete().eq('id', id);
      if (error) throw error;
      await window.carregarListaUsuarios();
      alert('Usuário excluído do Supabase.');
    } catch(e) {
      console.error('Erro ao excluir usuário:', e);
      alert('Erro ao excluir usuário: ' + (e.message || e));
    }
  };

  // Reaplica as funções após os scripts legados terminarem de registrar handlers.
  setTimeout(() => { try { window.carregarListaUsuarios(); } catch(e){} }, 800);
})();


/* =====================================================================
   SIGEE - Gestão integrada de grupos, perfis e acessos
   Integrada ao módulo de usuários existente. Não depende de arquivo extra.
   ===================================================================== */
(function(){
  'use strict';

  const CHAVES = [
    ['dashboard.visualizar','Visualizar Dashboard','Dashboard'],
    ['processos.visualizar','Visualizar processos','Processos'],
    ['processos.criar','Criar solicitações','Processos'],
    ['processos.editar','Editar processos','Processos'],
    ['processos.movimentar','Executar movimentações','Processos'],
    ['processos.excluir','Excluir processos','Processos'],
    ['escolas.visualizar','Visualizar escolas','Escolas'],
    ['escolas.criar','Cadastrar escolas','Escolas'],
    ['escolas.editar','Editar escolas','Escolas'],
    ['escolas.excluir','Excluir escolas','Escolas'],
    ['usuarios.visualizar','Visualizar usuários','Usuários'],
    ['usuarios.criar','Cadastrar usuários','Usuários'],
    ['usuarios.editar','Editar usuários','Usuários'],
    ['usuarios.excluir','Excluir usuários','Usuários'],
    ['acessos.gerenciar','Gerenciar grupos, perfis e acessos','Administração'],
    ['logs.visualizar','Visualizar logs e conectados','Auditoria'],
    ['importar','Importar planilhas','Dados'],
    ['exportar','Exportar relatórios','Dados']
  ];

  let grupos = [];
  let perfis = [];

  function texto(v){ return v == null ? '' : String(v).trim(); }
  function norm(v){ return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
  function esc(v){ return texto(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function parse(v){ if (!v) return {}; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch(e){ return {}; } }
  function usuarioAtual(){ return window.usuarioLogado || null; }
  function ehMaster(){ return norm(usuarioAtual()?.perfil) === 'master'; }
  function cliente(){
    try { if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE(); } catch(e) {}
    try { return window.SIGEE_SUPABASE?.criarCliente?.() || window.supabaseClient || null; } catch(e) { return null; }
  }
  function registrar(acao){ try { window.registrarLog?.(acao); } catch(e){} }

  async function carregarEstruturas(){
    const c = cliente();
    if (!c) throw new Error('Cliente Supabase não localizado.');
    const [rg,rp] = await Promise.all([
      c.from('grupos_usuarios_sigee').select('*').order('nome'),
      c.from('perfis_acesso_sigee').select('*').order('nome')
    ]);
    if (rg.error) throw rg.error;
    if (rp.error) throw rp.error;
    grupos = rg.data || [];
    perfis = rp.data || [];
    window.SIGEE_GRUPOS = grupos;
    window.SIGEE_PERFIS_ACESSO = perfis;
  }

  function perfilBase(u){
    return perfis.find(p => String(p.id) === String(u?.perfil_acesso_id)) ||
           perfis.find(p => norm(p.nome) === norm(u?.perfil));
  }
  function permissoesEfetivas(u = usuarioAtual()){
    if (!u) return {};
    if (norm(u.perfil) === 'master') return Object.fromEntries(CHAVES.map(x => [x[0], true]));
    return Object.assign({}, parse(perfilBase(u)?.permissoes), parse(u.permissoes_override));
  }
  function pode(chave, u = usuarioAtual()){
    if (norm(u?.perfil) === 'master') return true;
    return permissoesEfetivas(u)[chave] === true;
  }

  function injetarInterface(){
    const sec = document.getElementById('aba-usuarios');
    if (!sec) return;
    const topo = sec.querySelector('.sigee-modulo-cabecalho');
    if (topo && !document.getElementById('btn-gerenciar-acessos-integrado')) {
      topo.insertAdjacentHTML('beforeend', '<button id="btn-gerenciar-acessos-integrado" type="button" class="hidden bg-blue-900 hover:bg-blue-950 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">🔐 Grupos, Perfis e Acessos</button>');
    }
    if (!document.getElementById('sigee-modal-acessos-integrado')) {
      document.body.insertAdjacentHTML('beforeend', `<div id="sigee-modal-acessos-integrado" class="hidden fixed inset-0 bg-blue-950/70 z-[99999] p-4 overflow-y-auto">
        <div class="bg-white max-w-6xl mx-auto rounded-2xl shadow-2xl overflow-hidden">
          <div class="bg-blue-950 text-white p-5 flex justify-between items-start"><div><h2 class="font-black text-xl">🔐 Controle de Acessos</h2><p class="text-xs text-blue-200">Grupos, perfis personalizados e permissões individuais</p></div><button type="button" id="sigee-fechar-acessos" class="font-black text-xl">✕</button></div>
          <div class="p-5"><div class="flex flex-wrap gap-2 mb-5"><button type="button" data-aba-acesso="grupos" class="px-4 py-2 rounded bg-blue-100 font-bold text-xs">Grupos</button><button type="button" data-aba-acesso="perfis" class="px-4 py-2 rounded bg-blue-100 font-bold text-xs">Perfis</button><button type="button" data-aba-acesso="usuarios" class="px-4 py-2 rounded bg-blue-100 font-bold text-xs">Acessos por usuário</button></div><div id="sigee-acessos-conteudo"></div></div>
        </div></div>`);
    }
    const formPerfil = document.getElementById('user-form-perfil');
    const form = formPerfil?.closest('form');
    if (form && !document.getElementById('user-form-grupo')) {
      formPerfil.closest('div')?.insertAdjacentHTML('afterend', `<div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Grupo</label><select id="user-form-grupo" class="w-full p-2 border rounded-lg text-xs bg-gray-50"></select></div><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Perfil de Acesso</label><select id="user-form-perfil-acesso" class="w-full p-2 border rounded-lg text-xs bg-gray-50"></select></div>`);
    }
  }

  function preencherSelects(){
    const g = document.getElementById('user-form-grupo');
    const p = document.getElementById('user-form-perfil-acesso');
    if (g) g.innerHTML = '<option value="">Sem grupo</option>' + grupos.filter(x => x.ativo !== false).map(x => `<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join('');
    if (p) p.innerHTML = '<option value="">Usar perfil padrão</option>' + perfis.filter(x => x.ativo !== false).map(x => `<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join('');
  }

  function htmlPermissoes(valores = {}){
    return CHAVES.map(([chave,label,grupo]) => `<label class="flex gap-2 items-center border rounded p-2"><input type="checkbox" data-permissao="${esc(chave)}" ${valores[chave] === true ? 'checked' : ''}><span><b class="text-xs">${esc(label)}</b><small class="block text-gray-400">${esc(grupo)}</small></span></label>`).join('');
  }

  async function abrirGestao(){
    if (!ehMaster()) return alert('Apenas o usuário Master pode gerenciar grupos, perfis e acessos.');
    try { await carregarEstruturas(); preencherSelects(); document.getElementById('sigee-modal-acessos-integrado')?.classList.remove('hidden'); renderAba('grupos'); }
    catch(e){ alert('Erro ao carregar controle de acessos: ' + (e.message || e)); }
  }
  function fecharGestao(){ document.getElementById('sigee-modal-acessos-integrado')?.classList.add('hidden'); }

  function renderAba(tipo){
    const c = document.getElementById('sigee-acessos-conteudo');
    if (!c) return;
    if (tipo === 'grupos') {
      c.innerHTML = `<div class="flex justify-between mb-3"><h3 class="font-black text-blue-950">Grupos de usuários</h3><button type="button" data-acao-acesso="novo-grupo" class="bg-amber-500 text-white px-3 py-2 rounded text-xs font-bold">Novo grupo</button></div><div class="grid gap-2">${grupos.map(g => `<div class="border rounded p-3 flex justify-between gap-3"><div><b>${esc(g.nome)}</b><p class="text-xs text-gray-500">${esc(g.descricao || '')}</p></div><div><button type="button" data-editar-grupo="${esc(g.id)}" class="text-blue-700 font-bold text-xs mr-3">Editar</button><button type="button" data-excluir-grupo="${esc(g.id)}" class="text-red-700 font-bold text-xs">Excluir</button></div></div>`).join('') || '<p class="text-gray-400">Nenhum grupo cadastrado.</p>'}</div>`;
    } else if (tipo === 'perfis') {
      c.innerHTML = `<div class="flex justify-between mb-3"><h3 class="font-black text-blue-950">Perfis de acesso</h3><button type="button" data-acao-acesso="novo-perfil" class="bg-amber-500 text-white px-3 py-2 rounded text-xs font-bold">Novo perfil</button></div><div class="grid gap-2">${perfis.map(p => `<div class="border rounded p-3 flex justify-between gap-3"><div><b>${esc(p.nome)}</b>${p.sistema ? '<span class="ml-2 text-[10px] bg-gray-200 px-2 rounded">Sistema</span>' : ''}<p class="text-xs text-gray-500">${esc(p.descricao || '')}</p></div><button type="button" data-editar-perfil="${esc(p.id)}" class="text-blue-700 font-bold text-xs">Editar permissões</button></div>`).join('') || '<p class="text-gray-400">Nenhum perfil cadastrado.</p>'}</div>`;
    } else {
      const usuarios = Array.isArray(window.usuariosDB) ? window.usuariosDB : [];
      c.innerHTML = `<h3 class="font-black text-blue-950 mb-3">Acessos individuais</h3><div class="grid gap-2">${usuarios.map(u => `<div class="border rounded p-3 flex justify-between items-center gap-3"><div><b>${esc(u.nome)}</b><p class="text-xs text-gray-500">${esc(u.email)} • ${esc(u.perfil || '')}</p></div><button type="button" data-editar-acesso-usuario="${esc(u.id)}" class="bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold">Editar acessos</button></div>`).join('') || '<p class="text-gray-400">Nenhum usuário carregado.</p>'}</div>`;
    }
  }

  async function editarGrupo(id){
    const atual = id ? grupos.find(x => String(x.id) === String(id)) : null;
    const nome = prompt('Nome do grupo:', atual?.nome || ''); if (!nome) return;
    const descricao = prompt('Descrição:', atual?.descricao || '') || '';
    const c = cliente();
    const q = atual ? c.from('grupos_usuarios_sigee').update({nome,descricao,updated_at:new Date().toISOString()}).eq('id',id) : c.from('grupos_usuarios_sigee').insert({nome,descricao});
    const r = await q; if (r.error) return alert(r.error.message);
    await carregarEstruturas(); preencherSelects(); renderAba('grupos'); registrar(`${atual ? 'Grupo editado' : 'Grupo criado'}: ${nome}`);
  }
  async function excluirGrupo(id){
    if (!confirm('Excluir este grupo? Os usuários permanecerão cadastrados.')) return;
    const r = await cliente().from('grupos_usuarios_sigee').delete().eq('id',id); if (r.error) return alert(r.error.message);
    await carregarEstruturas(); preencherSelects(); renderAba('grupos'); registrar('Grupo de usuários excluído.');
  }
  function editarPerfil(id){
    const atual = id ? perfis.find(x => String(x.id) === String(id)) : null;
    const c = document.getElementById('sigee-acessos-conteudo');
    c.innerHTML = `<h3 class="font-black mb-3">${atual ? 'Editar' : 'Novo'} perfil</h3><input id="sigee-pa-nome" class="w-full border p-2 rounded mb-2" placeholder="Nome" value="${esc(atual?.nome || '')}"><textarea id="sigee-pa-desc" class="w-full border p-2 rounded mb-3" placeholder="Descrição">${esc(atual?.descricao || '')}</textarea><div class="grid md:grid-cols-3 gap-2">${htmlPermissoes(parse(atual?.permissoes))}</div><button type="button" data-salvar-perfil="${esc(id || '')}" class="mt-4 bg-emerald-600 text-white px-4 py-2 rounded font-bold text-xs">Salvar perfil</button>`;
  }
  async function salvarPerfil(id){
    const nome = texto(document.getElementById('sigee-pa-nome')?.value); if (!nome) return alert('Informe o nome do perfil.');
    const permissoes = {}; document.querySelectorAll('#sigee-acessos-conteudo [data-permissao]').forEach(x => permissoes[x.dataset.permissao] = x.checked);
    const payload = {nome,descricao:texto(document.getElementById('sigee-pa-desc')?.value),permissoes,updated_at:new Date().toISOString()};
    const q = id ? cliente().from('perfis_acesso_sigee').update(payload).eq('id',id) : cliente().from('perfis_acesso_sigee').insert(payload);
    const r = await q; if (r.error) return alert(r.error.message);
    await carregarEstruturas(); preencherSelects(); renderAba('perfis'); registrar(`Perfil de acesso ${id ? 'editado' : 'criado'}: ${nome}`);
  }

  async function localizarUsuario(id){
    let u = (window.usuariosDB || []).find(x => String(x.id) === String(id));
    if (u) return u;
    const r = await cliente().from('usuarios_sigee').select('*').eq('id',id).maybeSingle();
    if (r.error) throw r.error;
    return r.data || null;
  }
  async function editarAcessosUsuario(id){
    try {
      const u = await localizarUsuario(id); if (!u) return alert('Usuário não localizado.');
      const base = parse(perfilBase(u)?.permissoes), efetivas = Object.assign({}, base, parse(u.permissoes_override));
      const c = document.getElementById('sigee-acessos-conteudo');
      c.innerHTML = `<h3 class="font-black mb-1">${esc(u.nome)}</h3><p class="text-xs text-gray-500 mb-3">${esc(u.email)}</p><div class="grid md:grid-cols-2 gap-3 mb-3"><label class="text-xs font-bold">Grupo<select id="sigee-ua-grupo" class="block w-full border p-2 rounded mt-1"><option value="">Sem grupo</option>${grupos.map(g => `<option value="${esc(g.id)}" ${String(u.grupo_id) === String(g.id) ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select></label><label class="text-xs font-bold">Perfil de acesso<select id="sigee-ua-perfil" class="block w-full border p-2 rounded mt-1"><option value="">Perfil padrão</option>${perfis.map(p => `<option value="${esc(p.id)}" ${String(u.perfil_acesso_id) === String(p.id) ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label></div><p class="text-xs mb-2">As marcações abaixo serão salvas como permissões individuais.</p><div class="grid md:grid-cols-3 gap-2">${htmlPermissoes(efetivas)}</div><button type="button" data-salvar-acesso-usuario="${esc(id)}" class="mt-4 bg-emerald-600 text-white px-4 py-2 rounded font-bold text-xs">Salvar acessos do usuário</button>`;
    } catch(e){ alert('Erro ao abrir os acessos: ' + (e.message || e)); }
  }
  async function salvarAcessosUsuario(id){
    try {
      const u = await localizarUsuario(id); if (!u) return alert('Usuário não localizado.');
      if (norm(u.perfil) === 'master') return alert('O perfil Master mantém acesso integral e não pode ser restringido.');
      const perfilId = document.getElementById('sigee-ua-perfil')?.value || null;
      const p = perfis.find(x => String(x.id) === String(perfilId)) || perfis.find(x => norm(x.nome) === norm(u.perfil));
      const base = parse(p?.permissoes), override = {};
      document.querySelectorAll('#sigee-acessos-conteudo [data-permissao]').forEach(x => { if (x.checked !== (base[x.dataset.permissao] === true)) override[x.dataset.permissao] = x.checked; });
      const payload = {grupo_id:document.getElementById('sigee-ua-grupo')?.value || null,perfil_acesso_id:perfilId,permissoes_override:override};
      const r = await cliente().from('usuarios_sigee').update(payload).eq('id',id); if (r.error) throw r.error;
      Object.assign(u,payload); registrar(`Acessos individuais atualizados: ${u.email}`); alert('Acessos atualizados. Serão aplicados no próximo login do usuário.'); renderAba('usuarios');
    } catch(e){ alert('Erro ao salvar acessos: ' + (e.message || e)); }
  }

  function aplicarInterface(){
    const master = ehMaster();
    document.getElementById('btn-gerenciar-acessos-integrado')?.classList.toggle('hidden', !master);
    if (!usuarioAtual()) return;
    const mapa = [['menu-central-processos','processos.visualizar'],['menu-usuarios','usuarios.visualizar'],['menu-logs','logs.visualizar']];
    mapa.forEach(([id,chave]) => document.getElementById(id)?.classList.toggle('hidden', !pode(chave)));
    document.querySelectorAll('.export-only').forEach(x => x.classList.toggle('hidden', !pode('exportar')));
    document.querySelectorAll('[onclick*="abrirFormularioNovaSolicitacao"]').forEach(x => x.style.display = pode('processos.criar') ? '' : 'none');
    document.querySelectorAll('[onclick*="abrirModalNovaEscola"]').forEach(x => x.style.display = pode('escolas.criar') ? '' : 'none');
  }

  function instalarEventos(){
    document.addEventListener('click', async function(ev){
      const btn = ev.target.closest('button'); if (!btn) return;
      if (btn.id === 'btn-gerenciar-acessos-integrado') return abrirGestao();
      if (btn.id === 'sigee-fechar-acessos') return fecharGestao();
      if (btn.dataset.abaAcesso) return renderAba(btn.dataset.abaAcesso);
      if (btn.dataset.acaoAcesso === 'novo-grupo') return editarGrupo(null);
      if (btn.dataset.acaoAcesso === 'novo-perfil') return editarPerfil(null);
      if (btn.dataset.editarGrupo) return editarGrupo(btn.dataset.editarGrupo);
      if (btn.dataset.excluirGrupo) return excluirGrupo(btn.dataset.excluirGrupo);
      if (btn.dataset.editarPerfil) return editarPerfil(btn.dataset.editarPerfil);
      if (btn.hasAttribute('data-salvar-perfil')) return salvarPerfil(btn.dataset.salvarPerfil || null);
      if (btn.dataset.editarAcessoUsuario) return editarAcessosUsuario(btn.dataset.editarAcessoUsuario);
      if (btn.hasAttribute('data-salvar-acesso-usuario')) return salvarAcessosUsuario(btn.dataset.salvarAcessoUsuario);
      if (btn.classList.contains('sigee-btn-editar-acessos')) { if (!ehMaster()) return alert('Apenas o usuário Master pode editar acessos.'); await abrirGestao(); return editarAcessosUsuario(btn.dataset.userId); }
    });
  }

  function integrarFormularioUsuario(){
    const originalAbrirNovo = window.abrirModalCriarUsuarioMaster;
    const originalAbrirEditar = window.abrirModalEditarUsuarioMaster;
    const originalSalvar = window.salvarNovoUsuarioFormularioMaster;
    window.abrirModalCriarUsuarioMaster = function(){ originalAbrirNovo?.(); setTimeout(() => { preencherSelects(); const g=document.getElementById('user-form-grupo'),p=document.getElementById('user-form-perfil-acesso'); if(g)g.value=''; if(p)p.value=''; },30); };
    window.abrirModalEditarUsuarioMaster = async function(id){ await originalAbrirEditar?.(id); setTimeout(async () => { try { const u=await localizarUsuario(id); preencherSelects(); if(u){ const g=document.getElementById('user-form-grupo'),p=document.getElementById('user-form-perfil-acesso'); if(g)g.value=u.grupo_id||''; if(p)p.value=u.perfil_acesso_id||''; } } catch(e){} },30); };
    window.salvarNovoUsuarioFormularioMaster = async function(event){
      const email = texto(document.getElementById('user-form-email')?.value).toLowerCase();
      const grupoId = document.getElementById('user-form-grupo')?.value || null;
      const perfilId = document.getElementById('user-form-perfil-acesso')?.value || null;
      await originalSalvar?.(event);
      if (email) { const r=await cliente().from('usuarios_sigee').update({grupo_id:grupoId,perfil_acesso_id:perfilId}).eq('email',email); if (r.error) console.warn('Falha ao salvar grupo/perfil do usuário:',r.error); }
    };
  }

  async function iniciar(){
    injetarInterface(); instalarEventos();
    try { await carregarEstruturas(); preencherSelects(); } catch(e){ console.warn('Controle de acessos ainda não disponível:',e); }
    integrarFormularioUsuario(); aplicarInterface(); setTimeout(aplicarInterface,1200);
  }

  window.SIGEE_ACESSOS_INTEGRADO = {pode,permissoesEfetivas,carregar:carregarEstruturas,aplicar:aplicarInterface};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(iniciar,500)); else setTimeout(iniciar,500);
})();
