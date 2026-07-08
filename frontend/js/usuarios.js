/* =====================================================================
   SIGEE Enterprise 2.0 - Entrega 5A
   Módulo: usuarios.js
   Objetivo: centralizar as rotinas de usuários, perfis e permissões
   Base extraída/compatibilizada a partir do app.js SIGEE V45.

   IMPORTANTE:
   - Este módulo NÃO altera banco de dados.
   - Este módulo NÃO remove funções do app.js ainda.
   - Ele sobrescreve, em camada modular, as rotinas de usuário após o app.js carregar.
   - Pode ser editado futuramente sem mexer no app.js inteiro.
   ===================================================================== */

(function () {
  'use strict';

  const GRUPO_SEC = 'SEC - TODOS OS NTEs';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';
  const STORAGE_USUARIOS_COMPLETO = 'SIGEE_USUARIOS_COMPLETO_V41';

  function txt(v) {
    return (v === undefined || v === null) ? '' : String(v).trim();
  }

  function sem(v) {
    return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function up(v) {
    return sem(v).toUpperCase();
  }

  function low(v) {
    return txt(v).toLowerCase();
  }

  function usuarioAtual() {
    return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
  }

  function perfilUsuario(u) {
    const p = up((u && u.perfil) || 'Tecnico');
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }

  function isSEC(u) {
    return perfilUsuario(u) === 'SEC' || low(u && u.email) === EMAIL_SEC;
  }

  function isMaster(u) {
    return perfilUsuario(u) === 'Master';
  }

  function isAdministrador(u) {
    return perfilUsuario(u) === 'Administrador';
  }

  function isTecnico(u) {
    return perfilUsuario(u) === 'Tecnico';
  }

  function isConsulta(u) {
    return perfilUsuario(u) === 'Consulta';
  }

  function isGlobal(u) {
    return isSEC(u) || isMaster(u);
  }

  function numeroNte(v) {
    const m = txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }

  function normalizarNte(v) {
    const n = numeroNte(v);
    return n ? 'NTE' + String(n).padStart(2, '0') : up(v).replace(/[^A-Z0-9]/g, '');
  }

  function nteUsuario(u) {
    if (isSEC(u)) return GRUPO_SEC;
    return txt(u && (u.nte || u.nte_nome || u.nte_vinculado || u.grupo) || 'NTE-26 Salvador');
  }

  function mesmoNte(a, b) {
    const atual = usuarioAtual();
    if (isGlobal(atual)) return true;
    if (!a || !b) return false;
    const na = numeroNte(a);
    const nb = numeroNte(b);
    return (na && nb) ? na === nb : normalizarNte(a) === normalizarNte(b);
  }

  function podeGerirUsuarios(u) {
    return isSEC(u) || isMaster(u);
  }

  function podeExcluirUsuario(u) {
    return isSEC(u) || isMaster(u);
  }

  function listaUsuarios() {
    const base = Array.isArray(window.usuariosDB)
      ? window.usuariosDB
      : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);

    window.usuariosDB = base;
    try { usuariosDB = base; } catch (e) { /* ambiente sem var global editável */ }
    return base;
  }

  function registrarAcao(acao) {
    try {
      if (typeof registrarLog === 'function') registrarLog(acao);
    } catch (e) {
      console.warn('SIGEE usuarios.js: falha ao registrar log.', e);
    }
  }

  function obterSupabase() {
    try {
      return (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : null;
    } catch (e) {
      return null;
    }
  }

  function tabelaUsuarios() {
    return (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
  }

  function persistirUsuariosLocal() {
    try {
      localStorage.setItem(STORAGE_USUARIOS_COMPLETO, JSON.stringify(listaUsuarios()));
    } catch (e) {
      console.warn('SIGEE usuarios.js: não foi possível salvar usuários no localStorage.', e);
    }
  }

  async function salvarUsuarioSupabase(u) {
    persistirUsuariosLocal();

    try {
      const client = obterSupabase();
      if (!client || !u) return;

      await client
        .from(tabelaUsuarios())
        .upsert({
          nome: u.nome,
          email: u.email,
          perfil: u.perfil,
          ativo: u.ativo !== false
        }, { onConflict: 'email' });
    } catch (e) {
      console.warn('SIGEE usuarios.js: usuário preservado localmente; Supabase não confirmou.', e);
    }
  }

  async function excluirUsuarioSupabase(u) {
    try {
      const client = obterSupabase();
      if (!client || !u) return;

      if (u.id) {
        await client.from(tabelaUsuarios()).delete().eq('id', u.id);
      } else if (u.email) {
        await client.from(tabelaUsuarios()).delete().eq('email', u.email);
      }
    } catch (e) {
      console.warn('SIGEE usuarios.js: exclusão de usuário não confirmada no Supabase.', e);
    }
  }

  function atualizarTelaUsuarios() {
    try {
      if (typeof carregarListaUsuarios === 'function' && !document.getElementById('aba-usuarios')?.classList.contains('hidden')) {
        carregarListaUsuarios();
      }
    } catch (e) {}

    try {
      if (window.SIGEE_PERMISSOES_V44 && typeof window.SIGEE_PERMISSOES_V44.aplicarPermissoesV44 === 'function') {
        window.SIGEE_PERMISSOES_V44.aplicarPermissoesV44();
      }
    } catch (e) {}

    try {
      if (typeof aplicarPermissoesMenuPorPerfil === 'function') aplicarPermissoesMenuPorPerfil();
    } catch (e) {}
  }

  function montarLinhaUsuario(u, podeEditar) {
    const perfil = perfilUsuario(u);
    const nte = nteUsuario(u);
    const ativo = u.ativo !== false;

    const badgeSEC = perfil === 'SEC'
      ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px]">SEC</span>'
      : '';

    const botoes = podeEditar
      ? `<div class="flex items-center justify-center gap-1.5">
          <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
          <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${ativo ? 'bg-red-600' : 'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${ativo ? 'Desativar' : 'Ativar'}</button>
          <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
          <button onclick="excluirUsuarioSistemaMaster(${u.id})" class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button>
        </div>`
      : '<span class="text-xs text-gray-400 italic">Sem permissão</span>';

    return `<tr class="text-xs">
      <td class="p-3 font-bold">${u.nome || ''}${badgeSEC}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email || ''}</span></td>
      <td class="p-3 font-medium">${perfil}</td>
      <td class="p-3 font-semibold text-gray-400">${nte}</td>
      <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${ativo ? 'ATIVO' : 'INATIVO'}</span></td>
      <td class="p-3 text-center">${botoes}</td>
    </tr>`;
  }

  function instalarModuloUsuarios() {
    const oldCarregarListaUsuarios = window.carregarListaUsuarios || (typeof carregarListaUsuarios !== 'undefined' ? carregarListaUsuarios : null);

    window.carregarListaUsuarios = function () {
      const corpo = document.getElementById('tabela-usuarios-corpo');
      if (!corpo) {
        if (oldCarregarListaUsuarios) return oldCarregarListaUsuarios.apply(this, arguments);
        return;
      }

      corpo.innerHTML = '';

      const usuarioLogadoAtual = usuarioAtual();
      let lista = listaUsuarios().slice();

      if (!isGlobal(usuarioLogadoAtual)) {
        lista = lista.filter(u => mesmoNte(nteUsuario(u), nteUsuario(usuarioLogadoAtual)));
      }

      const podeEditar = podeGerirUsuarios(usuarioLogadoAtual);
      lista.forEach(u => corpo.insertAdjacentHTML('beforeend', montarLinhaUsuario(u, podeEditar)));
    };
    try { carregarListaUsuarios = window.carregarListaUsuarios; } catch (e) {}

    window.excluirUsuarioSistemaMaster = async function (id) {
      const usuarioLogadoAtual = usuarioAtual();
      if (!podeExcluirUsuario(usuarioLogadoAtual)) {
        alert('Apenas SEC e Master podem excluir usuários.');
        return;
      }

      const base = listaUsuarios();
      const idx = base.findIndex(u => String(u.id) === String(id));
      if (idx < 0) {
        alert('Usuário não localizado.');
        return;
      }

      const alvo = base[idx];
      if (low(alvo.email) === low(usuarioLogadoAtual.email)) {
        alert('Não é permitido excluir o próprio usuário logado.');
        return;
      }

      if (!confirm(`Confirma excluir o usuário ${alvo.nome || alvo.email}?`)) return;

      base.splice(idx, 1);
      persistirUsuariosLocal();
      await excluirUsuarioSupabase(alvo);
      registrarAcao(`[MASTER] Excluiu usuário: ${alvo.nome || alvo.email}`);
      atualizarTelaUsuarios();
    };

    // Mantém compatibilidade com chamadas antigas V45.
    window.excluirUsuarioSistemaMasterV45 = window.excluirUsuarioSistemaMaster;

    window.toggleStatusUsuarioMaster = async function (id) {
      const usuarioLogadoAtual = usuarioAtual();
      if (!podeGerirUsuarios(usuarioLogadoAtual)) {
        alert('Apenas SEC e Master podem ativar/desativar usuários.');
        return;
      }

      const u = listaUsuarios().find(x => String(x.id) === String(id));
      if (!u) return;

      u.ativo = !(u.ativo !== false);
      await salvarUsuarioSupabase(u);
      registrarAcao(`[MASTER] ${u.ativo ? 'Ativou' : 'Desativou'} usuário: ${u.nome || u.email}`);
      atualizarTelaUsuarios();
    };
    try { toggleStatusUsuarioMaster = window.toggleStatusUsuarioMaster; } catch (e) {}

    window.resetarSenhaUsuarioMaster = async function (id) {
      const usuarioLogadoAtual = usuarioAtual();
      if (!podeGerirUsuarios(usuarioLogadoAtual)) {
        alert('Apenas SEC e Master podem resetar senha.');
        return;
      }

      const u = listaUsuarios().find(x => String(x.id) === String(id));
      if (!u) return;

      const nova = prompt('Informe a nova senha provisória:', '123');
      if (nova === null) return;

      u.senha = txt(nova) || '123';
      await salvarUsuarioSupabase(u);
      registrarAcao(`[MASTER] Resetou senha do usuário: ${u.nome || u.email}`);
      alert('Senha atualizada.');
      atualizarTelaUsuarios();
    };
    try { resetarSenhaUsuarioMaster = window.resetarSenhaUsuarioMaster; } catch (e) {}

    const oldSalvarUsuario = window.salvarNovoUsuarioFormularioMaster || (typeof salvarNovoUsuarioFormularioMaster !== 'undefined' ? salvarNovoUsuarioFormularioMaster : null);

    window.salvarNovoUsuarioFormularioMaster = async function (event) {
      if (event) event.preventDefault();

      const usuarioLogadoAtual = usuarioAtual();
      if (!podeGerirUsuarios(usuarioLogadoAtual)) {
        alert('Seu perfil não possui permissão para alterar usuários.');
        return;
      }

      const id = txt(document.getElementById('user-form-id')?.value);
      const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
      const email = low(document.getElementById('user-form-email')?.value);
      const senha = txt(document.getElementById('user-form-senha')?.value) || '123';
      const nte = txt(document.getElementById('user-form-nte')?.value) || 'NTE-26 Salvador';
      const perfil = txt(document.getElementById('user-form-perfil')?.value) || 'Tecnico';

      if (!nome || !email) {
        alert('Informe nome e e-mail do usuário.');
        return;
      }

      const base = listaUsuarios();
      let usuario = id ? base.find(u => String(u.id) === String(id)) : null;

      if (!usuario && base.some(u => low(u.email) === email)) {
        alert('E-mail já cadastrado.');
        return;
      }

      if (!usuario) {
        usuario = {
          id: base.length ? Math.max(...base.map(u => Number(u.id) || 0)) + 1 : 1,
          ativo: true
        };
        base.push(usuario);
      }

      usuario.nome = nome;
      usuario.email = email;
      usuario.senha = senha;
      usuario.nte = perfilUsuario({ perfil }) === 'SEC' ? GRUPO_SEC : nte;
      usuario.grupo = usuario.nte;
      usuario.perfil = perfil;
      usuario.ativo = usuario.ativo !== false;

      await salvarUsuarioSupabase(usuario);
      registrarAcao(`${id ? 'Editou' : 'Cadastrou'} usuário: ${usuario.nome || usuario.email}`);

      try {
        if (typeof fecharModalUsuario === 'function') fecharModalUsuario();
      } catch (e) {}

      atualizarTelaUsuarios();
    };
    try { salvarNovoUsuarioFormularioMaster = window.salvarNovoUsuarioFormularioMaster; } catch (e) {}

    window.SIGEE_USUARIOS_MODULO = {
      perfilUsuario,
      isSEC,
      isMaster,
      isAdministrador,
      isTecnico,
      isConsulta,
      isGlobal,
      nteUsuario,
      mesmoNte,
      podeGerirUsuarios,
      podeExcluirUsuario,
      listaUsuarios,
      salvarUsuarioSupabase,
      instalarModuloUsuarios
    };
  }

  // O index atual carrega módulos antes do app.js em alguns cenários.
  // Por isso, aplicamos depois do carregamento da página e repetimos rapidamente
  // para garantir que as funções antigas do app.js sejam sobrescritas.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarModuloUsuarios);
  } else {
    instalarModuloUsuarios();
  }

  window.addEventListener('load', function () {
    setTimeout(instalarModuloUsuarios, 100);
    setTimeout(instalarModuloUsuarios, 800);
    setTimeout(instalarModuloUsuarios, 2000);
  });
})();
