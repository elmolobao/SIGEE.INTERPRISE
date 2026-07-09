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
