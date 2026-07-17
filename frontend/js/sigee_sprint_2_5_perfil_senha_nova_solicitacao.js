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

  function fecharTodasListasEscola() {
    [
      IDS.lista,
      'novo-proc-escola-resultados-sigee',
      'novo-proc-escola-sugestoes-v23',
      'novo-proc-escola-lista-v23'
    ].forEach(id => {
      const lista = $(id);
      if (!lista) return;
      lista.classList.add('hidden');
      lista.style.display = 'none';
      lista.innerHTML = '';
      lista.dataset.indiceAtivo = '-1';
    });
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

    fecharTodasListasEscola();
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
      box.style.display = 'block';
      return;
    }

    box.innerHTML = '<div class="p-3 text-gray-600 font-semibold">Pesquisando...</div>';
    box.classList.remove('hidden');
    box.style.display = 'block';

    try {
      const lista = await buscarEscolasNovaSolicitacao(termo);
      if (!lista.length) {
        box.innerHTML = '<div class="p-3 text-red-600 font-bold">Nenhuma escola encontrada para o seu NTE.</div>';
        return;
      }

      box.innerHTML = '';
      box.dataset.indiceAtivo = '-1';
      lista.forEach((e, indice) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.dataset.indice = String(indice);
        item.className = 'block w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border-b border-gray-100';
        item.innerHTML = `
          <div class="font-black text-blue-900">${e.nome}</div>
          <div class="text-[10px] text-gray-600">${e.municipio || '-'} | MEC ${e.cod_mec || '-'} | ${e.nte || ''}</div>
        `;

        // Seleciona antes que o campo perca o foco ou outra rotina redesenhe a lista.
        item.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
          selecionarEscolaNova(e);
        }, true);

        // Compatibilidade para navegadores antigos sem Pointer Events.
        item.addEventListener('mousedown', (event) => {
          if (window.PointerEvent) return;
          event.preventDefault();
          event.stopPropagation();
          selecionarEscolaNova(e);
        }, true);

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

    // Remove autocomplete legado para existir somente uma lista ativa.
    [
      'novo-proc-escola-busca-v23',
      'novo-proc-escola-busca-sigee',
      'novo-proc-escola-resultados-sigee',
      'novo-proc-escola-sugestoes-v23',
      'novo-proc-escola-lista-v23'
    ].forEach(id => {
      const legado = document.getElementById(id);
      if (legado && legado !== input && legado.id !== IDS.lista) legado.remove();
    });

    let box = $(IDS.lista);
    if (!box) {
      box = document.createElement('div');
      box.id = IDS.lista;
      box.className = 'hidden absolute z-[99999] bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto w-full text-xs';
      parent.style.position = 'relative';
      parent.appendChild(box);
    }

    function destacarResultado(indice) {
      const itens = Array.from(box.querySelectorAll('button[data-indice]'));
      if (!itens.length) return;
      const limite = itens.length - 1;
      const novoIndice = Math.max(0, Math.min(limite, indice));
      box.dataset.indiceAtivo = String(novoIndice);
      itens.forEach((item, i) => {
        item.classList.toggle('bg-blue-100', i === novoIndice);
        item.classList.toggle('ring-2', i === novoIndice);
        item.classList.toggle('ring-inset', i === novoIndice);
        item.classList.toggle('ring-blue-500', i === novoIndice);
      });
      itens[novoIndice].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', () => {
      input.dataset.codMec = '';
      input.dataset.escolaSelecionada = '';
      limparAutofillNova();
      habilitarBotaoNova();
      clearTimeout(timerNova);
      timerNova = setTimeout(renderizarResultadosNova, 250);
    });
    input.addEventListener('focus', () => {
      if (input.dataset.escolaSelecionada === '1') return;
      renderizarResultadosNova();
    });
    input.addEventListener('keydown', (event) => {
      const itens = Array.from(box.querySelectorAll('button[data-indice]'));
      if (event.key === 'Escape') {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
      }
      if (!itens.length || box.classList.contains('hidden')) return;

      let atual = Number(box.dataset.indiceAtivo || -1);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        destacarResultado(atual < 0 ? 0 : atual + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        destacarResultado(atual < 0 ? itens.length - 1 : atual - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const escolhido = itens[atual >= 0 ? atual : 0];
        escolhido?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      }
    });

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

/* =====================================================================
   SIGEE — Proteções da Nova Solicitação
   1) Confirmação expressa para requerente com solicitação semelhante.
   2) Bloqueio absoluto para escola com acervo NÃO RECOLHIDO.
   Aplicação em duas camadas: seleção da escola e submit/salvamento.
   ===================================================================== */
(function () {
  'use strict';

  const IDS = {
    form: 'modal-nova-solicitacao',
    aluno: 'novo-proc-aluno',
    escola: 'novo-proc-escola',
    btn: 'btn-submeter-nova-solicitacao'
  };

  function el(id) { return document.getElementById(id); }
  function texto(v) { return v === null || v === undefined ? '' : String(v).trim(); }
  function normalizar(v) {
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  }
  function escapar(v) {
    return texto(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function clienteSupabase() {
    const candidatos = [
      window.supabaseClient, window.sigeeSupabase, window.SUPABASE_CLIENT,
      window.db, window.supabase
    ];
    for (const c of candidatos) if (c && typeof c.from === 'function') return c;
    try {
      if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.from === 'function') return window.SIGEE_SUPABASE;
      if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE();
      if (typeof criarClienteSupabaseSIGEE === 'function') return criarClienteSupabaseSIGEE();
    } catch (_) {}
    return null;
  }
  function tabelaProcessos() {
    return window.SIGEE_CONFIG?.supabase?.tabelas?.processos ||
      window.SIGEE_SUPABASE_TABELAS?.processos || 'processos';
  }
  function tabelaEscolas() {
    return window.SIGEE_CONFIG?.supabase?.tabelas?.escolas || 'escolas_sigee';
  }
  function statusNaoRecolhido(valor) {
    const n = normalizar(valor);
    return n.includes('NAO RECOLHIDO') || n.includes('NAO ACOLHIDO') || n === 'NAO' || n.includes('ACERVO NAO RECOLHIDO') || n.includes('ACERVO NAO ACOLHIDO');
  }
  function codigoProcesso(p) {
    return texto(p?.codigo_sigee || p?.codigo || p?.numero_sigee || p?.protocolo || 'Registro SIGEE');
  }
  function etapaProcesso(p) {
    return texto(p?.etapa_atual || p?.etapa || p?.fase_atual || 'Não informada');
  }
  function escolaProcesso(p) {
    return texto(p?.escola_nome || p?.escola || p?.nome_escola || 'Não informada');
  }
  function dataProcesso(p) {
    const bruto = p?.created_at || p?.criado_em || p?.data_abertura || p?.data_solicitacao;
    if (!bruto) return 'Não informada';
    const d = new Date(bruto);
    return Number.isNaN(d.getTime()) ? texto(bruto) : d.toLocaleDateString('pt-BR');
  }

  function criarModal({ titulo, corpo, botoes, classeTitulo = 'text-blue-900' }) {
    return new Promise(resolve => {
      const fundo = document.createElement('div');
      fundo.className = 'fixed inset-0 z-[100000] bg-black/60 flex items-center justify-center p-4';
      fundo.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200">
          <div class="p-5 border-b bg-gray-50">
            <h3 class="text-lg font-black ${classeTitulo}">${escapar(titulo)}</h3>
          </div>
          <div class="p-5 text-sm text-gray-700 leading-relaxed">${corpo}</div>
          <div class="p-4 bg-gray-50 border-t flex flex-wrap justify-end gap-2" data-acoes></div>
        </div>`;
      const acoes = fundo.querySelector('[data-acoes]');
      botoes.forEach(botao => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = botao.classe || 'px-4 py-2 rounded-lg font-bold text-sm bg-gray-200 text-gray-800';
        b.textContent = botao.texto;
        b.addEventListener('click', () => {
          fundo.remove();
          resolve(botao.valor);
        });
        acoes.appendChild(b);
      });
      fundo.addEventListener('click', e => {
        if (e.target === fundo) {
          fundo.remove();
          resolve('cancelar');
        }
      });
      document.body.appendChild(fundo);
    });
  }

  async function mostrarBloqueioAcervo(escola) {
    await criarModal({
      titulo: 'Cadastro não permitido',
      classeTitulo: 'text-red-700',
      corpo: `
        <p class="font-bold text-gray-900 mb-3">O acervo desta unidade de ensino está registrado como <span class="text-red-700">NÃO RECOLHIDO</span>.</p>
        <p>A solicitação não pode ser cadastrada no fluxo de Escolas Extintas enquanto o acervo não estiver oficialmente recolhido ou enquanto a situação cadastral não for regularizada.</p>
        <p class="mt-3">A escola deverá ter a situação corrigida no Catálogo de Escolas antes de permitir uma nova solicitação.</p>
        ${escola ? `<div class="mt-4 p-3 rounded-lg bg-red-50 border border-red-200"><strong>Unidade:</strong> ${escapar(escola.nome_escola || escola.nome || escola.escola || '')}</div>` : ''}`,
      botoes: [{ texto: 'Entendi', valor: 'ok', classe: 'px-4 py-2 rounded-lg font-bold text-sm bg-red-700 text-white' }]
    });
  }

  function limparEscolaSelecionada() {
    const input = el(IDS.escola);
    if (input) {
      input.value = '';
      input.dataset.codMec = '';
      input.dataset.escolaId = '';
      input.dataset.nteId = '';
      input.dataset.escolaSelecionada = '';
      input.dataset.acervoBloqueado = '1';
    }
    ['novo-proc-escola-cod-mec','novo-proc-escola-nte-id','novo-autofill-mec','novo-autofill-nte',
      'novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo']
      .forEach(id => { const campo = el(id); if (campo) campo.value = ''; });
    const btn = el(IDS.btn);
    if (btn) btn.disabled = true;
  }

  async function consultarEscolaAtual() {
    const input = el(IDS.escola);
    if (!input) return null;
    const id = texto(input.dataset.escolaId);
    const codMec = texto(input.dataset.codMec || el('novo-proc-escola-cod-mec')?.value);
    const nome = texto(input.value);
    const c = clienteSupabase();

    if (c) {
      try {
        let q = c.from(tabelaEscolas())
          .select('id,cod_mec,nome_escola,nome,status_acervo,acervo,local_acervo,nte_id,nte')
          .limit(1);
        if (id) q = q.eq('id', id);
        else if (codMec) q = q.eq('cod_mec', codMec);
        else q = q.or(`nome_escola.ilike.${nome.replace(/[,%]/g, ' ')},nome.ilike.${nome.replace(/[,%]/g, ' ')}`);
        const { data, error } = await q.maybeSingle();
        if (!error && data) return data;
      } catch (erro) {
        console.warn('[SIGEE Proteções] Falha ao consultar escola no Supabase:', erro);
      }
    }

    const base = Array.isArray(window.escolasDB) ? window.escolasDB : [];
    return base.find(e => (id && texto(e.id) === id) ||
      (codMec && texto(e.cod_mec) === codMec) || normalizar(e.nome_escola || e.nome || e.escola) === normalizar(nome)) || null;
  }

  async function validarAcervoAtual({ limpar = true } = {}) {
    const input = el(IDS.escola);
    if (!input || !texto(input.value)) return false;
    const escola = await consultarEscolaAtual();
    const status = escola?.status_acervo ?? escola?.acervo ?? el('novo-autofill-acervo')?.value;
    if (!statusNaoRecolhido(status)) {
      input.dataset.acervoBloqueado = '';
      return true;
    }
    input.dataset.acervoBloqueado = '1';
    if (limpar) limparEscolaSelecionada();
    await mostrarBloqueioAcervo(escola);
    return false;
  }

  async function buscarSolicitacoesSemelhantes(nome, escolaSelecionada) {
    const termo = texto(nome);
    const escolaInformada = texto(escolaSelecionada || el(IDS.escola)?.value);
    if (termo.length < 3 || escolaInformada.length < 2) return [];

    const nomeNormalizado = normalizar(termo);
    const escolaNormalizada = normalizar(escolaInformada);
    const c = clienteSupabase();
    let registros = [];

    const correspondeNomeEEscola = p => {
      const nomeRegistro = normalizar(p?.aluno_nome || p?.aluno || p?.nome_solicitante);
      const escolaRegistro = normalizar(p?.escola_nome || p?.escola || p?.nome_escola);
      return !!nomeRegistro && !!escolaRegistro &&
        nomeRegistro === nomeNormalizado && escolaRegistro === escolaNormalizada;
    };

    if (c) {
      try {
        const safe = termo.replace(/[,%_]/g, ' ').trim();
        const { data, error } = await c.from(tabelaProcessos())
          .select('id,codigo_sigee,aluno_nome,nome_solicitante,escola_nome,escola,etapa_atual,etapa,created_at,data_abertura,data_solicitacao,nte')
          .or(`aluno_nome.ilike.%${safe}%,nome_solicitante.ilike.%${safe}%`)
          .order('created_at', { ascending: false })
          .limit(30);
        if (!error && Array.isArray(data)) registros = data.filter(correspondeNomeEEscola);
      } catch (erro) {
        console.warn('[SIGEE Proteções] Consulta de duplicidade no Supabase falhou:', erro);
      }
    }

    if (!registros.length) {
      const local = Array.isArray(window.processosDB) ? window.processosDB : [];
      registros = local.filter(correspondeNomeEEscola).slice(0, 10);
    }
    return registros;
  }

  function visualizarProcesso(p) {
    const codigo = codigoProcesso(p);
    try { if (typeof navegar === 'function') navegar('processos'); } catch (_) {}
    const busca = document.getElementById('busca-proc-nome');
    if (busca) {
      busca.value = codigo;
      busca.dispatchEvent(new Event('input', { bubbles: true }));
      busca.dispatchEvent(new Event('change', { bubbles: true }));
    }
    try {
      if (window.SIGEE_Processos?.renderizar) window.SIGEE_Processos.renderizar();
      else if (typeof carregarEContarProcessosHorizontais === 'function') carregarEContarProcessosHorizontais();
    } catch (_) {}
  }

  async function confirmarDuplicidade(registros) {
    const p = registros[0];
    const adicionais = registros.length > 1 ? `<p class="mt-3 text-xs text-amber-700 font-bold">Foram encontrados ${registros.length} registros semelhantes. O mais recente é exibido abaixo.</p>` : '';
    const escolha = await criarModal({
      titulo: '⚠ Solicitação existente localizada',
      classeTitulo: 'text-amber-700',
      corpo: `
        <div class="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p><strong>Código SIGEE:</strong> ${escapar(codigoProcesso(p))}</p>
          <p><strong>Etapa atual:</strong> ${escapar(etapaProcesso(p))}</p>
          <p><strong>Escola:</strong> ${escapar(escolaProcesso(p))}</p>
          <p><strong>Data de abertura:</strong> ${escapar(dataProcesso(p))}</p>
        </div>${adicionais}
        <p class="mt-4">A criação de uma nova solicitação somente continuará após confirmação expressa.</p>`,
      botoes: [
        { texto: 'Cancelar', valor: 'cancelar', classe: 'px-4 py-2 rounded-lg font-bold text-sm bg-gray-200 text-gray-800' },
        { texto: 'Visualizar processo', valor: 'visualizar', classe: 'px-4 py-2 rounded-lg font-bold text-sm bg-blue-700 text-white' },
        { texto: 'Continuar e abrir novo chamado', valor: 'continuar', classe: 'px-4 py-2 rounded-lg font-bold text-sm bg-amber-600 text-white' }
      ]
    });
    if (escolha === 'visualizar') visualizarProcesso(p);
    return escolha;
  }

  async function validarDuplicidade() {
    const nome = texto(el(IDS.aluno)?.value);
    const escola = texto(el(IDS.escola)?.value);
    const encontrados = await buscarSolicitacoesSemelhantes(nome, escola);
    if (!encontrados.length) return true;
    const decisao = await confirmarDuplicidade(encontrados);
    return decisao === 'continuar';
  }

  function localizarFormulario() {
    return document.querySelector('#modal-nova-solicitacao form') || el(IDS.btn)?.closest('form');
  }

  function instalarProtecaoSubmit() {
    const form = localizarFormulario();
    if (!form || form.dataset.sigeeProtecoesBound === '1') return;
    form.dataset.sigeeProtecoesBound = '1';
    form.addEventListener('submit', async function (event) {
      if (form.dataset.sigeeProtecoesLiberado === '1') {
        form.dataset.sigeeProtecoesLiberado = '';
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const btn = el(IDS.btn);
      if (btn) { btn.disabled = true; btn.dataset.textoOriginal = btn.textContent; btn.textContent = 'Verificando...'; }
      try {
        const acervoOk = await validarAcervoAtual({ limpar: false });
        if (!acervoOk) return;
        const duplicidadeOk = await validarDuplicidade();
        if (!duplicidadeOk) return;
        // A segunda passagem executa o onsubmit original somente após todas as validações.
        form.dataset.sigeeProtecoesLiberado = '1';
        if (btn) {
          btn.textContent = btn.dataset.textoOriginal || 'Enviar para Desarquivamento';
          btn.disabled = false;
        }
        form.requestSubmit(btn || undefined);
      } catch (erro) {
        console.error('[SIGEE Proteções] Falha na validação da Nova Solicitação:', erro);
        alert('Não foi possível validar a solicitação com segurança. O cadastro foi interrompido. Tente novamente.');
      } finally {
        if (btn && form.dataset.sigeeProtecoesLiberado !== '1') {
          btn.textContent = btn.dataset.textoOriginal || 'Enviar para Desarquivamento';
          btn.disabled = false;
        }
      }
    }, true);
  }

  function instalarProtecaoSelecao() {
    const input = el(IDS.escola);
    if (!input || input.dataset.sigeeAcervoBound === '1') return;
    input.dataset.sigeeAcervoBound = '1';
    input.addEventListener('change', () => setTimeout(() => validarAcervoAtual({ limpar: true }), 50));
    input.addEventListener('click', () => setTimeout(() => {
      if (input.dataset.escolaSelecionada === '1' && texto(input.dataset.escolaId || input.dataset.codMec)) {
        validarAcervoAtual({ limpar: true });
      }
    }, 120));
  }

  function instalarTudo() {
    instalarProtecaoSubmit();
    instalarProtecaoSelecao();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarTudo);
  else instalarTudo();
  [300, 800, 1500, 2500].forEach(ms => setTimeout(instalarTudo, ms));
  setInterval(instalarTudo, 2000);

  window.SIGEE_NOVA_SOLICITACAO_PROTECOES = {
    validarAcervoAtual,
    buscarSolicitacoesSemelhantes,
    validarDuplicidade
  };
  console.info('[SIGEE] Proteções de duplicidade e acervo não recolhido ativas.');
})();
