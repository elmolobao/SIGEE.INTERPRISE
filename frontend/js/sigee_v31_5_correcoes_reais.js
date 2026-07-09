/* =====================================================================
 * SIGEE Enterprise V31.5 - Correções reais
 * 1) Mantém perfis Master, Administrador, Técnico, SEC e Consulta.
 * 2) Remove apenas usuários demonstrativos/padrão.
 * 3) Corrige salvar/excluir usuários pelo Master/SEC no Supabase.
 * 4) Campo escola com autocomplete filtrado pelo NTE do usuário.
 * 5) Dashboard com apenas GLOBAL - TODOS OS NTEs.
 * ===================================================================== */
(function(){
  'use strict';

  const GLOBAL = 'GLOBAL - TODOS OS NTEs';
  const SEC_ANTIGO = 'SEC - TODOS OS NTEs';
  const USUARIOS_DEMO_EMAILS = new Set([
    'sec@enova.educacao.ba.gov.br',
    'administrativo@enova.educacao.ba.gov.br',
    'consulta@enova.educacao.ba.gov.br'
  ]);
  const USUARIOS_DEMO_NOMES = ['USUÁRIO SEC','USUARIO SEC','USUÁRIO ADMINISTRADOR','USUARIO ADMINISTRADOR','USUÁRIO CONSULTA','USUARIO CONSULTA'];

  const $ = id => document.getElementById(id);
  const txt = v => String(v ?? '').trim();
  const low = v => txt(v).toLowerCase();
  const up = v => txt(v).toUpperCase();
  const norm = v => up(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();

  function perfil(v){
    const p = norm(v);
    if (p === 'SEC') return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECN')) return 'Tecnico';
    return txt(v) || 'Tecnico';
  }

  function usuarios(){
    if (Array.isArray(window.usuariosDB)) return window.usuariosDB;
    try { if (Array.isArray(usuariosDB)) { window.usuariosDB = usuariosDB; return usuariosDB; } } catch(e) {}
    window.usuariosDB = [];
    try { usuariosDB = window.usuariosDB; } catch(e) {}
    return window.usuariosDB;
  }

  function escolas(){
    if (Array.isArray(window.escolasDB)) return window.escolasDB;
    try { if (Array.isArray(escolasDB)) { window.escolasDB = escolasDB; return escolasDB; } } catch(e) {}
    return [];
  }

  function usuarioAtual(){
    return window.usuarioLogado || (()=>{ try { return usuarioLogado || null; } catch(e){ return null; } })();
  }

  function isGlobalUser(u){
    const p = perfil(u && u.perfil);
    return p === 'Master' || p === 'SEC' || norm(u && u.nte).includes('TODOS OS NTE');
  }

  function nteUsuario(u){
    if (!u) return '';
    if (isGlobalUser(u)) return GLOBAL;
    return txt(u.nte || u.nte_nome || u.territorio || '');
  }

  function mesmoNte(a,b){
    const A = norm(a).replace(/[^A-Z0-9]/g,'');
    const B = norm(b).replace(/[^A-Z0-9]/g,'');
    return !!A && !!B && (A === B || A.includes(B) || B.includes(A));
  }

  function removerUsuariosDemo(){
    const base = usuarios();
    for (let i = base.length - 1; i >= 0; i--) {
      const u = base[i] || {};
      const email = low(u.email);
      const nome = norm(u.nome);
      const demo = USUARIOS_DEMO_EMAILS.has(email) || USUARIOS_DEMO_NOMES.includes(nome);
      if (demo) base.splice(i,1);
      else {
        u.perfil = perfil(u.perfil);
        if (norm(u.nte) === norm(SEC_ANTIGO)) u.nte = GLOBAL;
      }
    }
    window.usuariosDB = base;
    try { usuariosDB = base; } catch(e) {}
    try { localStorage.setItem('SIGEE_USUARIOS_DB', JSON.stringify(base)); } catch(e) {}
  }

  function prepararSelectPerfis(){
    const sel = $('user-form-perfil');
    if (!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="Master">Master</option><option value="Administrador">Administrador</option><option value="Tecnico">Técnico</option><option value="SEC">SEC</option><option value="Consulta">Consulta</option>';
    if (atual) sel.value = perfil(atual);
  }

  function prepararSelectNTE(){
    const sel = $('user-form-nte');
    if (!sel) return;
    const atual = sel.value;
    const opcoes = [];
    if (Array.isArray(window.LISTA_OFICIAL_27_NTES)) opcoes.push(...window.LISTA_OFICIAL_27_NTES);
    else {
      try { if (Array.isArray(LISTA_OFICIAL_27_NTES)) opcoes.push(...LISTA_OFICIAL_27_NTES); } catch(e) {}
    }
    escolas().forEach(e => { if (e && e.nte) opcoes.push(e.nte); });
    const unicos = Array.from(new Set(opcoes.map(txt).filter(v => v && !norm(v).includes('SEC - TODOS'))));
    sel.innerHTML = '<option value="">Selecione o NTE</option>' + unicos.map(n => `<option value="${n.replace(/"/g,'&quot;')}">${n}</option>`).join('');
    if (atual && unicos.some(n => n === atual)) sel.value = atual;
  }

  function client(){
    try { if (window.SIGEE_SUPABASE && window.SIGEE_SUPABASE.criarCliente) return window.SIGEE_SUPABASE.criarCliente(); } catch(e) {}
    try { if (window.criarClienteSupabaseSIGEE) return window.criarClienteSupabaseSIGEE(); } catch(e) {}
    return null;
  }

  async function salvarUsuarioSupabase(u){
    const c = client();
    if (!c) return false;
    const tabela = 'usuarios_sigee';
    const payloads = [
      { id:u.id, nome:u.nome, email:u.email, senha:u.senha, perfil:u.perfil, nte:u.nte, ativo:u.ativo !== false, grupo:u.grupo || '' },
      { nome:u.nome, email:u.email, senha:u.senha, perfil:u.perfil, nte:u.nte, ativo:u.ativo !== false },
      { nome:u.nome, email:u.email, perfil:u.perfil, nte:u.nte },
      { nome:u.nome, email:u.email, perfil:u.perfil }
    ];
    for (const p of payloads) {
      try {
        const { error } = await c.from(tabela).upsert(p, { onConflict:'email' });
        if (!error) return true;
        console.warn('[SIGEE V31.5] Falha ao salvar usuário; tentando payload menor:', error.message || error);
      } catch(e) { console.warn('[SIGEE V31.5] Erro salvar usuário:', e); }
    }
    return false;
  }

  async function excluirUsuarioSupabase(u){
    const c = client();
    if (!c) return false;
    try {
      let q = c.from('usuarios_sigee').delete();
      if (u.id) q = q.eq('id', u.id); else q = q.eq('email', u.email);
      const { error } = await q;
      if (!error) return true;
    } catch(e) {}
    try {
      const { error } = await c.from('usuarios_sigee').delete().eq('email', u.email);
      return !error;
    } catch(e) { return false; }
  }

  window.abrirModalCriarUsuarioMaster = function(){
    removerUsuariosDemo(); prepararSelectPerfis(); prepararSelectNTE();
    $('titulo-modal-usuario') && ($('titulo-modal-usuario').innerText = '👥 Cadastrar Usuário');
    ['user-form-id','user-form-nome','user-form-email'].forEach(id => { if($(id)) $(id).value = ''; });
    if ($('user-form-senha')) $('user-form-senha').value = '123';
    const u = usuarioAtual();
    if (!isGlobalUser(u) && $('user-form-nte')) $('user-form-nte').value = nteUsuario(u);
    $('modal-cadastro-usuario')?.classList.remove('hidden');
  };

  window.abrirModalEditarUsuarioMaster = function(id){
    removerUsuariosDemo(); prepararSelectPerfis(); prepararSelectNTE();
    const u = usuarios().find(x => String(x.id) === String(id));
    if (!u) return alert('Usuário não localizado.');
    $('titulo-modal-usuario') && ($('titulo-modal-usuario').innerText = '📝 Editar Usuário');
    if ($('user-form-id')) $('user-form-id').value = u.id || '';
    if ($('user-form-nome')) $('user-form-nome').value = u.nome || '';
    if ($('user-form-email')) $('user-form-email').value = u.email || '';
    if ($('user-form-senha')) $('user-form-senha').value = u.senha || '123';
    if ($('user-form-nte')) $('user-form-nte').value = isGlobalUser(u) ? GLOBAL : (u.nte || '');
    if ($('user-form-perfil')) $('user-form-perfil').value = perfil(u.perfil);
    $('modal-cadastro-usuario')?.classList.remove('hidden');
  };

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if (event) event.preventDefault();
    removerUsuariosDemo();
    const base = usuarios();
    const id = txt($('user-form-id')?.value);
    const nome = up($('user-form-nome')?.value);
    const email = low($('user-form-email')?.value);
    const senha = txt($('user-form-senha')?.value) || '123';
    const pf = perfil($('user-form-perfil')?.value);
    let nte = txt($('user-form-nte')?.value);
    if (pf === 'Master' || pf === 'SEC') nte = GLOBAL;
    if (!nome || !email) return alert('Informe nome e e-mail.');
    if (!['Master','Administrador','Tecnico','SEC','Consulta'].includes(pf)) return alert('Perfil inválido.');
    if (!['Master','SEC'].includes(pf) && !nte) return alert('Selecione o NTE do usuário.');
    let u = id ? base.find(x => String(x.id) === String(id)) : null;
    if (!u && base.some(x => low(x.email) === email)) return alert('E-mail já cadastrado.');
    if (!u) { u = { id: Math.max(0, ...base.map(x => Number(x.id)||0)) + 1 }; base.push(u); }
    Object.assign(u, { nome, email, senha, perfil: pf, nte, grupo: pf === 'SEC' ? 'SEC' : '', ativo: u.ativo !== false });
    const ok = await salvarUsuarioSupabase(u);
    try { localStorage.setItem('SIGEE_USUARIOS_DB', JSON.stringify(base)); } catch(e) {}
    $('modal-cadastro-usuario')?.classList.add('hidden');
    if (window.carregarListaUsuarios) window.carregarListaUsuarios();
    alert(ok ? 'Usuário salvo com sucesso.' : 'Usuário salvo localmente. Verifique permissões/RLS da tabela usuarios_sigee no Supabase.');
  };

  window.excluirUsuarioSistemaSIGEE = async function(id){
    removerUsuariosDemo();
    const base = usuarios();
    const idx = base.findIndex(x => String(x.id) === String(id));
    if (idx < 0) return alert('Usuário não localizado.');
    const u = base[idx];
    if (!confirm(`Confirma excluir o usuário ${u.nome}?`)) return;
    base.splice(idx,1);
    await excluirUsuarioSupabase(u);
    try { localStorage.setItem('SIGEE_USUARIOS_DB', JSON.stringify(base)); } catch(e) {}
    if (window.carregarListaUsuarios) window.carregarListaUsuarios();
  };
  window.excluirUsuarioSistemaMaster = window.excluirUsuarioSistemaSIGEE;
  window.excluirUsuarioSistemaMasterV45 = window.excluirUsuarioSistemaSIGEE;

  function instalarAutocompleteEscola(){
    const select = $('novo-proc-escola');
    if (!select || $('novo-proc-escola-autocomplete-v315')) return;
    const input = document.createElement('input');
    input.type = 'text'; input.id = 'novo-proc-escola-autocomplete-v315'; input.autocomplete = 'off';
    input.placeholder = 'Digite nome, código MEC ou município da escola...';
    input.className = 'w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold mb-1';
    const lista = document.createElement('div');
    lista.id = 'novo-proc-escola-lista-v315';
    lista.className = 'hidden max-h-56 overflow-y-auto border rounded-lg bg-white shadow-lg text-xs z-[10000]';
    select.parentNode.insertBefore(input, select);
    select.parentNode.insertBefore(lista, select.nextSibling);
    select.classList.add('hidden'); select.required = false;

    function visiveis(){
      const u = usuarioAtual();
      let arr = escolas().slice();
      if (u && !isGlobalUser(u)) arr = arr.filter(e => mesmoNte(e.nte, nteUsuario(u)));
      return arr;
    }
    function render(termo){
      const q = norm(termo);
      let arr = visiveis().filter(e => !q || norm(`${e.cod_mec||''} ${e.codigo_mec||''} ${e.nome||e.nome_escola||''} ${e.municipio||''} ${e.nte||''}`).includes(q)).slice(0,80);
      lista.innerHTML = arr.length ? arr.map(e => `<button type="button" class="w-full text-left px-3 py-2 hover:bg-blue-50 border-b" data-id="${txt(e.id || e.cod_mec || e.codigo_mec).replace(/"/g,'&quot;')}"><b>${txt(e.nome || e.nome_escola)}</b><br><span class="text-[10px] text-gray-500">${txt(e.cod_mec || e.codigo_mec)} • ${txt(e.municipio)} • ${txt(e.nte)}</span></button>`).join('') : '<div class="px-3 py-2 text-gray-500">Nenhuma escola localizada para o NTE do usuário.</div>';
      lista.classList.remove('hidden'); lista.style.display = 'block';
      lista.querySelectorAll('button[data-id]').forEach(btn => btn.onclick = () => {
        const id = btn.dataset.id;
        const e = visiveis().find(x => String(x.id || x.cod_mec || x.codigo_mec) === String(id));
        if (!e) return;
        input.value = `${txt(e.nome || e.nome_escola)} - ${txt(e.municipio)} (${txt(e.cod_mec || e.codigo_mec)})`;
        select.innerHTML = `<option value="${id.replace(/"/g,'&quot;')}" selected>${input.value.replace(/</g,'&lt;')}</option>`;
        select.value = id;
        input.dataset.escolaSelecionada = id;
        lista.classList.add('hidden'); lista.style.display = 'none';
        try { if (window.handleSelecaoInstituicaoFluxoAutomatico) window.handleSelecaoInstituicaoFluxoAutomatico(); } catch(e) {}
      });
    }
    input.addEventListener('input', () => { input.dataset.escolaSelecionada=''; select.value=''; render(input.value); });
    input.addEventListener('focus', () => render(input.value));
    document.addEventListener('click', ev => { if (ev.target !== input && !lista.contains(ev.target)) { lista.classList.add('hidden'); lista.style.display='none'; } });
  }

  function corrigirDashboardGlobal(){
    const sel = $('filtro-dashboard-nte');
    if (!sel) return;
    const atual = sel.value;
    Array.from(sel.options).forEach(o => { if (norm(o.textContent).includes('SEC - TODOS') || norm(o.value).includes('SEC - TODOS')) o.remove(); });
    if (!Array.from(sel.options).some(o => o.value === 'GLOBAL')) sel.insertAdjacentHTML('afterbegin','<option value="GLOBAL">GLOBAL - TODOS OS NTEs</option>');
    Array.from(sel.options).forEach(o => { if (o.value === 'GLOBAL') o.textContent = GLOBAL; });
    if (!atual || norm(atual).includes('SEC - TODOS')) sel.value = 'GLOBAL';
  }

  function aplicar(){
    removerUsuariosDemo(); prepararSelectPerfis(); corrigirDashboardGlobal(); instalarAutocompleteEscola();
    const btn = document.querySelector('button[onclick="abrirModalCriarUsuarioMaster()"]'); if (btn) btn.textContent = '➕ Cadastrar Usuário';
  }

  const oldLista = window.carregarListaUsuarios;
  window.carregarListaUsuarios = function(){
    removerUsuariosDemo();
    const r = oldLista && oldLista.apply(this, arguments);
    setTimeout(() => {
      document.querySelectorAll('#tabela-usuarios-corpo tr').forEach(tr => {
        if (USUARIOS_DEMO_NOMES.some(n => norm(tr.textContent).includes(n)) || Array.from(USUARIOS_DEMO_EMAILS).some(e => low(tr.textContent).includes(e))) tr.remove();
      });
      document.querySelectorAll('#tabela-usuarios-corpo button').forEach(b => {
        if (/Excluir/i.test(b.textContent || '') && !b.getAttribute('onclick')?.includes('excluirUsuarioSistemaSIGEE')) {
          const m = (b.getAttribute('onclick') || '').match(/\(([^)]+)\)/); if (m) b.setAttribute('onclick', `excluirUsuarioSistemaSIGEE(${m[1]})`);
        }
      });
    }, 50);
    return r;
  };

  document.addEventListener('DOMContentLoaded', () => setTimeout(aplicar, 800));
  setInterval(aplicar, 2500);
})();
