/* =====================================================================
   SIGEE - Sprint 2.5
   Correções:
   1) Nova Solicitação: autocomplete respeitando NTE também para Estagiário.
   2) Troca obrigatória de senha: salva senha/senha_hash e desativa forcar_troca_senha.
   3) Ajuste visual de campos Perfil/NTE com opção "SELECIONE".
   Carregar por ÚLTIMO no index.html.
   ===================================================================== */
(function () {
  'use strict';

  const TABELA_USUARIOS = 'usuarios_sigee';
  const TABELA_ESCOLAS = 'escolas_sigee';

  const IDS = {
    modalNova: 'modal-nova-solicitacao',
    escola: 'novo-proc-escola',
    aluno: 'novo-proc-aluno',
    btnNova: 'btn-submeter-nova-solicitacao',
    lista: 'novo-proc-escola-resultados-sprint25',
    codMec: 'novo-proc-escola-cod-mec',
    nteId: 'novo-proc-escola-nte-id',
    modalSenha: 'modal-troca-senha-obrigatoria-sigee',
    senha1: 'nova-senha-obrigatoria-sigee',
    senha2: 'confirma-senha-obrigatoria-sigee',
    btnSenha: 'btn-salvar-senha-obrigatoria-sigee'
  };

  function $(id) { return document.getElementById(id); }
  function txt(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function low(v) { return txt(v).toLowerCase(); }
  function up(v) { return txt(v).toUpperCase(); }
  function norm(v) { return up(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  function supabaseClient() {
    const candidatos = [
      window.supabaseClient,
      window.sigeeSupabase,
      window.SIGEE_SUPABASE,
      window.SUPABASE_CLIENT,
      window.db,
      window.supabase
    ];
    for (const c of candidatos) if (c && typeof c.from === 'function') return c;
    try {
      if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE();
    } catch (_) {}
    return null;
  }

  function perfilCanonico(valor) {
    const p = norm(valor || '');
    if (p.includes('MASTER')) return 'Master';
    if (p === 'SEC' || p.includes('TODOS OS NTES')) return 'SEC';
    if (p.includes('ADMIN')) return 'Administrator';
    if (p.includes('ESTAG')) return 'Estagiário';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Tecnico';
    return txt(valor || 'Tecnico');
  }

  function isGlobalPerfil(perfil) {
    const p = perfilCanonico(perfil);
    return p === 'Master' || p === 'SEC';
  }

  function extrairNteId(v) {
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const s = txt(v);
    if (/^\d+$/.test(s)) return Number(s);
    const m = s.match(/(?:NTE\s*[- ]?)?(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }

  function nteTexto(id) {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? `NTE ${String(n).padStart(2, '0')}` : '';
  }

  function getStoredUser() {
    const candidatos = [
      window.usuarioLogado,
      window.usuarioAtual,
      window.currentUser,
      window.SIGEE_USUARIO_LOGADO,
      window.SIGEE_USER
    ];
    for (const u of candidatos) if (u && typeof u === 'object') return { ...u };

    const keys = [
      'usuarioLogado',
      'SIGEE_USUARIO_LOGADO',
      'sigee_usuario_logado',
      'usuario_sigee',
      'sigee_usuario',
      'SIGEE_USER',
      'currentUser'
    ];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (raw) {
          const u = JSON.parse(raw);
          if (u && typeof u === 'object') return { ...u };
        }
      } catch (_) {}
    }
    return null;
  }

  async function getUserCompleto() {
    const u = getStoredUser() || {};
    const email = low(u.email);
    const c = supabaseClient();
    if (c && email) {
      try {
        const { data } = await c
          .from(TABELA_USUARIOS)
          .select('id,email,nome,perfil,nte_id,nte,ativo,Ativo,forcar_troca_senha,pode_editar')
          .eq('email', email)
          .maybeSingle();
        if (data) {
          const merged = { ...u, ...data };
          window.usuarioLogado = merged;
          try { usuarioLogado = merged; } catch (_) {}
          return merged;
        }
      } catch (e) {
        console.warn('[SIGEE 2.5] Não foi possível recarregar usuário no Supabase:', e);
      }
    }
    return u;
  }

  function mapEscola(e) {
    return {
      id: e.id,
      nome: txt(e.nome_escola || e.nome || e.escola || e.instituicao),
      cod_mec: txt(e.cod_mec),
      municipio: txt(e.municipio),
      nte_id: e.nte_id,
      nte: txt(e.nte) || nteTexto(e.nte_id),
      dependencia: txt(e.dependencia_adm || e.dependencia),
      situacao: txt(e.situacao_funcional || e.situacao),
      acervo: txt(e.status_acervo || e.acervo),
      local_acervo: txt(e.local_acervo)
    };
  }

  async function buscarEscolasNovaSolicitacao(termo) {
    const busca = txt(termo);
    const c = supabaseClient();
    const u = await getUserCompleto();
    const perfil = perfilCanonico(u && u.perfil);
    const global = isGlobalPerfil(perfil);
    const nteId = extrairNteId(u && (u.nte_id || u.nte || u.nte_nome));

    // Segurança: qualquer perfil não global sem NTE definido não pode ver base inteira.
    if (!global && !nteId) return [];

    if (c) {
      let q = c
        .from(TABELA_ESCOLAS)
        .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,acervo,status_acervo,local_acervo')
        .order('nome_escola', { ascending: true })
        .limit(30);

      if (!global) q = q.eq('nte_id', nteId);

      if (busca.length >= 2) {
        const safe = busca.replace(/[%_]/g, '');
        q = q.or(`nome_escola.ilike.%${safe}%,nome.ilike.%${safe}%,municipio.ilike.%${safe}%,cod_mec.ilike.%${safe}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapEscola);
    }

    let base = Array.isArray(window.escolasDB) ? window.escolasDB.map(mapEscola) : [];
    if (!global) base = base.filter(e => Number(e.nte_id) === Number(nteId) || norm(e.nte).includes(String(nteId).padStart(2, '0')));
    if (busca.length >= 2) {
      const n = norm(busca);
      base = base.filter(e => norm(e.nome).includes(n) || norm(e.municipio).includes(n) || norm(e.cod_mec).includes(n));
    }
    return base.slice(0, 30);
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value || '';
  }

  function limparAutofillNova() {
    ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => setValue(id, ''));
    setValue(IDS.codMec, '');
    setValue(IDS.nteId, '');
  }

  function habilitarBotaoNova() {
    const btn = $(IDS.btnNova);
    if (!btn) return;
    const escola = $(IDS.escola);
    const aluno = $(IDS.aluno);
    const chk = $('f01-chk-acolhido');
    const okEscola = !!txt(escola && escola.value) && !!txt(escola && escola.dataset && escola.dataset.codMec);
    const okAluno = !!txt(aluno && aluno.value);
    const okTermo = chk ? chk.checked : true;
    btn.disabled = !(okEscola && okAluno && okTermo);
  }

  function selecionarEscolaNova(e) {
    const input = $(IDS.escola);
    const box = $(IDS.lista);
    if (!input) return;

    input.value = e.nome;
    input.dataset.codMec = e.cod_mec || '';
    input.dataset.escolaId = e.id || '';
    input.dataset.nteId = e.nte_id || '';
    input.dataset.escolaSelecionada = '1';

    let cod = $(IDS.codMec);
    if (!cod) {
      cod = document.createElement('input');
      cod.type = 'hidden';
      cod.id = IDS.codMec;
      input.parentElement.appendChild(cod);
    }
    cod.value = e.cod_mec || '';

    let nte = $(IDS.nteId);
    if (!nte) {
      nte = document.createElement('input');
      nte.type = 'hidden';
      nte.id = IDS.nteId;
      input.parentElement.appendChild(nte);
    }
    nte.value = e.nte_id || '';

    setValue('novo-autofill-mec', e.cod_mec);
    setValue('novo-autofill-nte', e.nte || nteTexto(e.nte_id));
    setValue('novo-autofill-municipio', e.municipio);
    setValue('novo-autofill-dep', e.dependencia);
    setValue('novo-autofill-situacao', e.situacao);
    setValue('novo-autofill-acervo', e.acervo);
    setValue('novo-autofill-local-acervo', e.local_acervo);

    if (box) {
      box.classList.add('hidden');
      box.innerHTML = '';
    }
    habilitarBotaoNova();
  }

  let timerNova = null;
  async function renderizarResultadosNova() {
    const input = $(IDS.escola);
    const box = $(IDS.lista);
    if (!input || !box) return;

    const termo = txt(input.value);
    if (termo.length < 2) {
      box.innerHTML = '<div class="p-3 text-gray-600 font-semibold">Digite pelo menos 2 letras da escola.</div>';
      box.classList.remove('hidden');
      return;
    }

    box.innerHTML = '<div class="p-3 text-gray-600 font-semibold">Pesquisando...</div>';
    box.classList.remove('hidden');

    try {
      const lista = await buscarEscolasNovaSolicitacao(termo);
      if (!lista.length) {
        box.innerHTML = '<div class="p-3 text-red-600 font-bold">Nenhuma escola encontrada para o seu NTE.</div>';
        return;
      }

      box.innerHTML = '';
      lista.forEach(e => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'block w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border-b border-gray-100';
        item.innerHTML = `
          <div class="font-black text-blue-900">${e.nome}</div>
          <div class="text-[10px] text-gray-600">${e.municipio || '-'} | MEC ${e.cod_mec || '-'} | ${e.nte || ''}</div>
        `;
        item.addEventListener('click', () => selecionarEscolaNova(e));
        box.appendChild(item);
      });
    } catch (err) {
      console.error('[SIGEE 2.5] Erro no autocomplete da Nova Solicitação:', err);
      box.innerHTML = '<div class="p-3 text-red-600 font-bold">Erro ao pesquisar escolas.</div>';
    }
  }

  function instalarCampoNovaSolicitacao() {
    const atual = $(IDS.escola);
    if (!atual) return false;
    const parent = atual.parentElement;
    if (!parent) return false;

    let input = atual;
    if (atual.tagName === 'SELECT') {
      input = document.createElement('input');
      input.type = 'text';
      input.id = IDS.escola;
      input.name = atual.name || IDS.escola;
      input.required = true;
      input.autocomplete = 'off';
      input.className = atual.className || 'w-full p-2 border rounded-lg text-xs bg-white font-semibold';
      atual.replaceWith(input);
    }

    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = 'Digite pelo menos 2 letras da escola...';
    input.dataset.sprint25 = '1';

    // Remove listeners antigos clonando o campo e reinstalando somente o handler desta sprint.
    if (input.dataset.sprint25Bound !== '1') {
      const clone = input.cloneNode(true);
      clone.dataset.sprint25 = '1';
      clone.dataset.sprint25Bound = '1';
      input.replaceWith(clone);
      input = clone;
    }

    let box = $(IDS.lista);
    if (!box) {
      box = document.createElement('div');
      box.id = IDS.lista;
      box.className = 'hidden absolute z-[99999] bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto w-full text-xs';
      parent.style.position = 'relative';
      parent.appendChild(box);
    }

    input.addEventListener('input', () => {
      input.dataset.codMec = '';
      input.dataset.escolaSelecionada = '';
      limparAutofillNova();
      habilitarBotaoNova();
      clearTimeout(timerNova);
      timerNova = setTimeout(renderizarResultadosNova, 250);
    });
    input.addEventListener('focus', renderizarResultadosNova);

    return true;
  }

  function resetarNovaSolicitacao() {
    ['novo-proc-aluno','novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => {
      const el = $(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    const escola = $(IDS.escola);
    if (escola) {
      escola.value = '';
      escola.dataset.codMec = '';
      escola.dataset.escolaSelecionada = '';
      escola.dataset.nteId = '';
    }
    const chk = $('f01-chk-acolhido');
    if (chk) chk.checked = false;
    const btn = $(IDS.btnNova);
    if (btn) btn.disabled = true;
    limparAutofillNova();
  }

  function abrirNovaSolicitacaoSprint25() {
    const modal = $(IDS.modalNova);
    if (modal) modal.classList.remove('hidden');
    [0, 80, 200, 500, 900].forEach(ms => setTimeout(instalarCampoNovaSolicitacao, ms));
    setTimeout(resetarNovaSolicitacao, 120);
  }

  function instalarNovaSolicitacao() {
    window.abrirFormularioNovaSolicitacao = abrirNovaSolicitacaoSprint25;
    try { abrirFormularioNovaSolicitacao = window.abrirFormularioNovaSolicitacao; } catch (_) {}

    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"]').forEach(btn => {
      btn.onclick = function (ev) {
        ev.preventDefault();
        abrirNovaSolicitacaoSprint25();
        return false;
      };
    });

    ['novo-proc-aluno','f01-chk-acolhido'].forEach(id => {
      const el = $(id);
      if (el && el.dataset.sprint25Bound !== '1') {
        el.dataset.sprint25Bound = '1';
        el.addEventListener('input', habilitarBotaoNova);
        el.addEventListener('change', habilitarBotaoNova);
      }
    });

    const modal = $(IDS.modalNova);
    if (modal && modal.dataset.sprint25Observer !== '1') {
      modal.dataset.sprint25Observer = '1';
      const obs = new MutationObserver(() => {
        if (!modal.classList.contains('hidden')) setTimeout(instalarCampoNovaSolicitacao, 20);
      });
      obs.observe(modal, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }

  async function salvarSenhaObrigatoriaSprint25(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
    }

    const u = await getUserCompleto();
    if (!u || !u.email) return alert('Sessão não localizada. Faça login novamente.');

    const s1 = txt($(IDS.senha1)?.value);
    const s2 = txt($(IDS.senha2)?.value);
    if (s1.length < 4) return alert('A senha deve ter pelo menos 4 caracteres.');
    if (s1 !== s2) return alert('As senhas não conferem.');

    const c = supabaseClient();
    if (!c || !c.from) return alert('Supabase não inicializado.');

    try {
      let erroFinal = null;
      if (u.id) {
        const { error } = await c
          .from(TABELA_USUARIOS)
          .update({ senha: s1, senha_hash: s1, forcar_troca_senha: false })
          .eq('id', u.id);
        if (error) erroFinal = error;
      }

      const { error: errorEmail } = await c
        .from(TABELA_USUARIOS)
        .update({ senha: s1, senha_hash: s1, forcar_troca_senha: false })
        .eq('email', low(u.email));
      if (errorEmail) erroFinal = errorEmail;
      if (erroFinal) throw erroFinal;

      const atualizado = { ...u, senha: s1, senha_hash: s1, forcar_troca_senha: false };
      window.usuarioLogado = atualizado;
      try { usuarioLogado = atualizado; } catch (_) {}

      // Atualiza caches conhecidos para impedir que o app legado reabra o modal por dado antigo.
      const keys = ['usuarioLogado','SIGEE_USUARIO_LOGADO','sigee_usuario_logado','usuario_sigee','sigee_usuario','SIGEE_USER','currentUser'];
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) localStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), ...atualizado }));
        } catch (_) {}
        try {
          const raw = sessionStorage.getItem(key);
          if (raw) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), ...atualizado }));
        } catch (_) {}
      }

      try {
        const cacheRaw = localStorage.getItem('SIGEE_USUARIOS_CACHE');
        if (cacheRaw) {
          const arr = JSON.parse(cacheRaw);
          if (Array.isArray(arr)) {
            const novoCache = arr.map(x => low(x.email) === low(u.email) ? { ...x, ...atualizado } : x);
            localStorage.setItem('SIGEE_USUARIOS_CACHE', JSON.stringify(novoCache));
          }
        }
      } catch (_) {}

      $(IDS.modalSenha)?.classList.add('hidden');
      alert('Senha cadastrada com sucesso.');
    } catch (e) {
      alert('Erro ao salvar nova senha: ' + (e.message || e.details || e));
    }
  }

  function instalarSenhaObrigatoria() {
    const btn = $(IDS.btnSenha);
    if (btn && btn.dataset.sprint25Bound !== '1') {
      btn.dataset.sprint25Bound = '1';
      btn.onclick = null;
      btn.addEventListener('click', salvarSenhaObrigatoriaSprint25, true);
    }
  }

  function ajustarSelectsUsuario() {
    const perfil = $('user-form-perfil');
    if (perfil && perfil.dataset.sprint25Select !== '1') {
      perfil.dataset.sprint25Select = '1';
      const valorAtual = perfil.value;
      const perfis = ['Master','SEC','Administrator','Tecnico','Estagiário','Consulta'];
      perfil.innerHTML = '<option value="">SELECIONE O PERFIL</option>' + perfis.map(p => `<option value="${p}">${p}</option>`).join('');
      if (valorAtual) perfil.value = perfilCanonico(valorAtual);
    }

    const nte = $('user-form-nte');
    if (nte && nte.dataset.sprint25Select !== '1') {
      nte.dataset.sprint25Select = '1';
      const valorAtual = nte.value;
      if (!nte.querySelector('option[value=""]')) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'SELECIONE O NTE';
        nte.insertBefore(opt, nte.firstChild);
      }
      if (!valorAtual) nte.value = '';
    }
  }

  function instalarTudo() {
    instalarNovaSolicitacao();
    instalarSenhaObrigatoria();
    ajustarSelectsUsuario();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarTudo);
  else instalarTudo();

  setTimeout(instalarTudo, 500);
  setTimeout(instalarTudo, 1500);
  setInterval(() => {
    instalarSenhaObrigatoria();
    ajustarSelectsUsuario();
  }, 1500);

  console.info('[SIGEE] Sprint 2.5 Perfil/Senha/Nova Solicitação ativo');
})();
