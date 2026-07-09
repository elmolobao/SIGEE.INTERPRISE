/* ============================================================
   SIGEE - Sprint 2.3
   Nova Solicitação: campo Escola digitável/autocomplete
   Deve ser carregado por ÚLTIMO no index.html.
   ============================================================ */
(function () {
  'use strict';

  const IDS = {
    modal: 'modal-nova-solicitacao',
    escola: 'novo-proc-escola',
    aluno: 'novo-proc-aluno',
    btn: 'btn-submeter-nova-solicitacao',
    lista: 'novo-proc-escola-resultados-sprint23',
    codMec: 'novo-proc-escola-cod-mec',
    nteId: 'novo-proc-escola-nte-id'
  };

  function $(id) { return document.getElementById(id); }
  function txt(v) { return String(v ?? '').trim(); }
  function up(v) { return txt(v).toUpperCase(); }
  function normalizar(v) {
    return up(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function nteTexto(id) {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? `NTE ${String(n).padStart(2, '0')}` : '';
  }
  function perfilUsuario(u) {
    return txt(u?.perfil || u?.role || '').toLowerCase();
  }
  function isGlobal(u) {
    const p = perfilUsuario(u);
    return p === 'master' || p === 'sec' || p === 'administrador sec' || p === 'adminsec';
  }
  function nteIdUsuario(u) {
    if (!u) return null;
    if (u.nte_id !== null && u.nte_id !== undefined && u.nte_id !== '') return Number(u.nte_id);
    const m = txt(u.nte || u.nte_nome || '').match(/(\d{1,2})/);
    return m ? Number(m[1]) : null;
  }
  function usuarioAtual() {
    const candidatos = [
      window.usuarioLogado,
      window.usuarioAtual,
      window.currentUser,
      window.SIGEE_USUARIO_LOGADO,
      window.SIGEE_USER
    ];
    for (const u of candidatos) if (u && typeof u === 'object') return u;
    for (const key of ['usuarioLogado', 'SIGEE_USUARIO_LOGADO', 'sigee_usuario_logado', 'usuario_sigee']) {
      try {
        const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (raw) {
          const u = JSON.parse(raw);
          if (u && typeof u === 'object') return u;
        }
      } catch (_) {}
    }
    return null;
  }
  function supabaseClient() {
    const candidatos = [
      window.supabaseClient,
      window.sigeeSupabase,
      window.SIGEE_SUPABASE,
      window.SUPABASE_CLIENT,
      window.db,
      window.supabase
    ];
    for (const c of candidatos) {
      if (c && typeof c.from === 'function') return c;
    }
    return null;
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

  async function buscarEscolas(termo) {
    const busca = txt(termo);
    const c = supabaseClient();
    const u = usuarioAtual();
    const nteId = nteIdUsuario(u);

    if (c) {
      let q = c
        .from('escolas_sigee')
        .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,acervo,status_acervo,local_acervo')
        .order('nome_escola', { ascending: true })
        .limit(30);

      if (!isGlobal(u) && nteId) q = q.eq('nte_id', nteId);

      if (busca.length >= 2) {
        const safe = busca.replace(/[%_]/g, '');
        q = q.or(`nome_escola.ilike.%${safe}%,nome.ilike.%${safe}%,municipio.ilike.%${safe}%,cod_mec.ilike.%${safe}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapEscola);
    }

    let base = Array.isArray(window.escolasDB) ? window.escolasDB.map(mapEscola) : [];
    if (!isGlobal(u) && nteId) base = base.filter(e => Number(e.nte_id) === nteId || normalizar(e.nte).includes(String(nteId).padStart(2, '0')));
    if (busca.length >= 2) {
      const n = normalizar(busca);
      base = base.filter(e => normalizar(e.nome).includes(n) || normalizar(e.municipio).includes(n) || normalizar(e.cod_mec).includes(n));
    }
    return base.slice(0, 30);
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value || '';
  }

  function limparAutofill() {
    ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => setValue(id, ''));
    const cod = $(IDS.codMec); if (cod) cod.value = '';
    const nte = $(IDS.nteId); if (nte) nte.value = '';
  }

  function habilitarBotaoSePossivel() {
    const btn = $(IDS.btn);
    const escola = $(IDS.escola);
    const aluno = $(IDS.aluno);
    if (!btn) return;
    const temEscola = txt(escola?.value).length > 0 && txt(escola?.dataset?.codMec).length > 0;
    const temAluno = txt(aluno?.value).length > 0;
    const chk = $('f01-chk-acolhido');
    const termoOk = chk ? chk.checked : true;
    btn.disabled = !(temEscola && temAluno && termoOk);
  }

  function selecionarEscola(e) {
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

    habilitarBotaoSePossivel();
  }

  let timer = null;
  async function renderizarResultados() {
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
      const lista = await buscarEscolas(termo);
      if (!lista.length) {
        box.innerHTML = '<div class="p-3 text-red-600 font-bold">Nenhuma escola encontrada.</div>';
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
        item.addEventListener('click', () => selecionarEscola(e));
        box.appendChild(item);
      });
    } catch (err) {
      console.error('[SIGEE] erro autocomplete nova solicitação:', err);
      box.innerHTML = '<div class="p-3 text-red-600 font-bold">Erro ao pesquisar escolas.</div>';
    }
  }

  function instalarCampoDigitavel() {
    const atual = $(IDS.escola);
    if (!atual) return false;

    const parent = atual.parentElement;
    if (!parent) return false;

    // Se ainda for SELECT, troca por INPUT mantendo o mesmo id usado pelo restante do sistema.
    if (atual.tagName === 'SELECT') {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = IDS.escola;
      input.name = atual.name || IDS.escola;
      input.required = true;
      input.autocomplete = 'off';
      input.placeholder = 'Digite pelo menos 2 letras da escola...';
      input.className = atual.className || 'w-full p-2 border rounded-lg text-xs bg-white font-semibold';
      input.dataset.sprint23 = '1';
      atual.replaceWith(input);
    } else {
      atual.type = 'text';
      atual.autocomplete = 'off';
      atual.placeholder = 'Digite pelo menos 2 letras da escola...';
      atual.dataset.sprint23 = '1';
    }

    const input = $(IDS.escola);
    if (!input) return false;

    let box = $(IDS.lista);
    if (!box) {
      box = document.createElement('div');
      box.id = IDS.lista;
      box.className = 'hidden absolute z-[99999] bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto w-full text-xs';
      parent.style.position = 'relative';
      parent.appendChild(box);
    }

    if (!input.dataset.sprint23Events) {
      input.dataset.sprint23Events = '1';
      input.addEventListener('input', () => {
        input.dataset.codMec = '';
        input.dataset.escolaSelecionada = '';
        limparAutofill();
        habilitarBotaoSePossivel();
        clearTimeout(timer);
        timer = setTimeout(renderizarResultados, 250);
      });
      input.addEventListener('focus', renderizarResultados);
      document.addEventListener('click', ev => {
        if (!parent.contains(ev.target)) box.classList.add('hidden');
      });
    }

    return true;
  }

  function resetarFormulario() {
    ['novo-proc-aluno','novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => {
      const el = $(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    const chk = $('f01-chk-acolhido');
    if (chk) chk.checked = false;
    const btn = $(IDS.btn);
    if (btn) btn.disabled = true;
    limparAutofill();
  }

  function abrirNovaSolicitacaoSprint23() {
    const modal = $(IDS.modal);
    if (modal) modal.classList.remove('hidden');
    resetarFormulario();

    // Executa várias vezes para vencer recriações tardias feitas pelo app legado.
    [0, 80, 200, 500].forEach(ms => setTimeout(instalarCampoDigitavel, ms));
  }

  function instalarOverride() {
    window.abrirFormularioNovaSolicitacao = abrirNovaSolicitacaoSprint23;
    try { abrirFormularioNovaSolicitacao = window.abrirFormularioNovaSolicitacao; } catch (_) {}

    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"]').forEach(btn => {
      btn.onclick = function (ev) {
        ev.preventDefault();
        abrirNovaSolicitacaoSprint23();
        return false;
      };
    });

    const modal = $(IDS.modal);
    if (modal && !modal.dataset.sprint23Observer) {
      modal.dataset.sprint23Observer = '1';
      const obs = new MutationObserver(() => {
        if (!modal.classList.contains('hidden')) instalarCampoDigitavel();
      });
      obs.observe(modal, { childList: true, subtree: true });
    }

    ['novo-proc-aluno','f01-chk-acolhido'].forEach(id => {
      const el = $(id);
      if (el && !el.dataset.sprint23Events) {
        el.dataset.sprint23Events = '1';
        el.addEventListener('input', habilitarBotaoSePossivel);
        el.addEventListener('change', habilitarBotaoSePossivel);
      }
    });

    console.info('[SIGEE] Sprint 2.3 Nova Solicitação autocomplete ativo');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarOverride);
  } else {
    instalarOverride();
  }

  // Reinstala após carregamentos tardios dos scripts legados.
  setTimeout(instalarOverride, 500);
  setTimeout(instalarOverride, 1500);
})();
