/* SIGEE RC11.3.8 — Autocomplete elegível por escopo antes do LIMIT */
(function () {
  'use strict';

  const IDS_AUTOFILL = {
    mec: 'novo-autofill-mec',
    nte: 'novo-autofill-nte',
    municipio: 'novo-autofill-municipio',
    dependencia: 'novo-autofill-dep',
    situacao: 'novo-autofill-situacao',
    acervo: 'novo-autofill-acervo',
    local: 'novo-autofill-local-acervo'
  };

  let timerBusca = null;
  let requisicaoAtual = 0;
  let escolaSelecionada = null;
  let form = null;
  let botao = null;

  const texto = (v) => (v == null ? '' : String(v).trim());
  const normalizar = (v) => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const campo = (id) => document.getElementById(id);

  function clienteSupabase() {
    try {
      if (typeof window.obterSupabaseSIGEE === 'function') return window.obterSupabaseSIGEE();
      if (typeof window.criarClienteSupabaseSIGEE === 'function') return window.criarClienteSupabaseSIGEE();
      if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') return window.SIGEE_SUPABASE.criarCliente();
    } catch (erro) {
      console.warn('[SIGEE RC4.5.23] Supabase indisponível:', erro);
    }
    return null;
  }

  function usuarioCanonico() {
    /* A sessão RC11 é a autoridade para unidade_tipo/escola_id.
       usuarioLogado pode ser um espelho legado sem esses campos. */
    let sessao = {};
    try { sessao = window.SIGEE_SESSION?.getUser?.() || {}; } catch (_) {}
    let autorizado = {};
    try { autorizado = window.SIGEE_AUTORIZACAO?.usuario?.() || {}; } catch (_) {}
    const legado = (window.usuarioLogado && typeof window.usuarioLogado === 'object') ? window.usuarioLogado : {};
    return { ...legado, ...autorizado, ...sessao };
  }

  function perfilAtual() {
    return normalizar(usuarioCanonico().perfil || '');
  }

  function nteAtual() {
    const u = usuarioCanonico();
    const direto = Number(u.nte_id || u.nteId || u.id_nte || 0);
    if (direto) return direto;
    const m = texto(u.nte || u.nte_nome || u.grupo).match(/\d{1,2}/);
    return m ? Number(m[0]) : null;
  }

  function contextoEscopo() {
    try {
      if (window.SIGEE_ESCOPO && typeof window.SIGEE_ESCOPO.contexto === 'function') {
        return window.SIGEE_ESCOPO.contexto(usuarioCanonico());
      }
    } catch (_) {}
    return { tipo: 'NTE', nteId: nteAtual(), escolaId: null };
  }

  function ehRecolhido(valor) { return normalizar(valor) === 'RECOLHIDO'; }
  function ehExtinta(valor) { return normalizar(valor) === 'EXTINTA'; }
  function ehEstadual(valor) { return normalizar(valor) === 'ESTADUAL'; }
  function ehAtiva(valor) { return normalizar(valor) === 'ATIVA'; }

  function validarPoliticaEscola(escola, contexto = contextoEscopo()) {
    const e = formatarEscola(escola);
    if (contexto.tipo === 'ESCOLA') {
      if (!contexto.escolaId || Number(e.id) !== Number(contexto.escolaId)) return { ok:false, motivo:'Esta conta só pode abrir processos para a própria unidade escolar.' };
      if (!ehEstadual(e.dependencia) || !ehAtiva(e.situacao) || escola.ativo === false) return { ok:false, motivo:'A unidade vinculada precisa permanecer Estadual, Ativa e habilitada no catálogo.' };
      return { ok:true };
    }
    if (contexto.tipo === 'NTE') {
      if (!contexto.nteId || Number(e.nte_id) !== Number(contexto.nteId)) return { ok:false, motivo:'A escola não pertence ao NTE deste usuário.' };
      if (!ehExtinta(e.situacao)) return { ok:false, motivo:'Para usuários de NTE, somente escolas Extintas podem receber nova solicitação.' };
      /* acervo é o campo canônico; status_acervo não autoriza abertura. */
      const acervoCanonico = texto(escola.acervo);
      if (!ehRecolhido(acervoCanonico)) return { ok:false, motivo:'Para usuários de NTE, a escola extinta precisa estar com o acervo oficialmente Recolhido.' };
      return { ok:true };
    }
    /* GLOBAL/SEC preservam a operação administrativa atual; duplicidade continua obrigatória. */
    return { ok:true };
  }

  function limparAutofill() {
    Object.values(IDS_AUTOFILL).forEach((id) => {
      const el = campo(id);
      if (el) el.value = '';
    });
  }

  function limparIdentidadeEscola({ limparTexto = true } = {}) {
    escolaSelecionada = null;
    const hidden = campo('novo-proc-escola-id');
    const select = campo('novo-proc-escola');
    const input = campo('novo-proc-escola-busca-v23');
    const lista = campo('novo-proc-escola-lista-v23');

    if (hidden) hidden.value = '';
    if (select) {
      select.innerHTML = '<option value="">SELECIONE A INSTITUIÇÃO</option>';
      select.value = '';
      delete select.dataset.escolaId;
      delete select.dataset.codMec;
      select.classList.add('hidden');
      select.required = false;
    }
    if (input) {
      if (limparTexto) input.value = '';
      delete input.dataset.escolaId;
      delete input.dataset.codMec;
      delete input.dataset.escolaSelecionada;
    }
    if (lista) {
      lista.innerHTML = '';
      lista.classList.add('hidden');
    }

    window.SIGEE_ESCOLA_NOVA_SOLICITACAO = null;
    window.SIGEE_NOVA_SOLICITACAO_ESCOLA_ID = '';
    window.SIGEE_NOVA_SOLICITACAO_ESCOLA_NOME = '';
    window.SIGEE_NOVA_SOLICITACAO_COD_MEC = '';
    limparAutofill();
  }

  function garantirPainelEscolaVinculada() {
    const select = campo('novo-proc-escola');
    if (!select || !select.parentNode) return null;
    let painel = campo('novo-proc-escola-vinculada-rc1124');
    if (!painel) {
      painel = document.createElement('div');
      painel.id = 'novo-proc-escola-vinculada-rc1124';
      painel.setAttribute('role', 'status');
      painel.style.cssText = 'display:none;width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #93c5fd;border-radius:8px;background:#eff6ff;color:#0f3f72;font-weight:800;font-size:12px;line-height:1.35;';
      select.parentNode.insertBefore(painel, select);
    }
    return painel;
  }

  function modoVisualEscolaVinculada(ativo, escola) {
    const input = campo('novo-proc-escola-busca-v23');
    const lista = campo('novo-proc-escola-lista-v23');
    const select = campo('novo-proc-escola');
    const painel = garantirPainelEscolaVinculada();
    if (ativo) {
      if (input) { input.style.display = 'none'; input.disabled = true; input.required = false; }
      if (lista) { lista.classList.add('hidden'); lista.style.display = 'none'; }
      if (select) { select.classList.add('hidden'); select.style.display = 'none'; select.required = false; }
      if (painel) {
        const e = formatarEscola(escola || escolaSelecionada || {});
        painel.textContent = e.nome || 'Carregando unidade escolar vinculada...';
        painel.title = e.nome || '';
        painel.style.display = 'block';
      }
    } else {
      if (painel) { painel.textContent = ''; painel.style.display = 'none'; }
      if (input) { input.style.display = ''; input.disabled = false; input.readOnly = false; input.required = true; }
      if (lista) lista.style.display = '';
      if (select) select.style.display = '';
    }
  }

  function garantirCampoPesquisa() {
    const select = campo('novo-proc-escola');
    if (!select || !select.parentNode) return null;

    let input = campo('novo-proc-escola-busca-v23');
    if (input) {
      const novo = input.cloneNode(false);
      novo.value = input.value || '';
      input.replaceWith(novo);
      input = novo;
    } else {
      input = document.createElement('input');
      input.id = 'novo-proc-escola-busca-v23';
      input.type = 'text';
      input.placeholder = 'Digite pelo menos 2 letras da escola...';
      input.autocomplete = 'off';
      input.className = select.className;
      select.parentNode.insertBefore(input, select);
    }

    input.disabled = false;
    input.readOnly = false;
    input.required = true;
    input.setAttribute('aria-autocomplete', 'list');

    let lista = campo('novo-proc-escola-lista-v23');
    if (!lista) {
      lista = document.createElement('div');
      lista.id = 'novo-proc-escola-lista-v23';
      lista.className = 'hidden max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-xl relative z-50';
      select.parentNode.insertBefore(lista, select);
    }

    input.addEventListener('input', () => {
      limparIdentidadeEscola({ limparTexto: false });
      clearTimeout(timerBusca);
      const termo = input.value;
      timerBusca = setTimeout(() => pesquisarEscolas(termo), 250);
    });
    input.addEventListener('focus', () => {
      if (texto(input.value).length >= 2 && !escolaSelecionada) pesquisarEscolas(input.value);
    });

    select.classList.add('hidden');
    select.required = false;
    return input;
  }

  async function pesquisarEscolas(termo) {
    const input = campo('novo-proc-escola-busca-v23');
    const lista = campo('novo-proc-escola-lista-v23');
    if (!input || !lista) return;

    const busca = texto(termo);
    if (busca.length < 2) {
      lista.innerHTML = '<div class="p-3 text-gray-500 font-semibold">Digite pelo menos 2 letras da escola.</div>';
      lista.classList.remove('hidden');
      return;
    }

    const token = ++requisicaoAtual;
    lista.innerHTML = '<div class="p-3 text-gray-500 font-semibold">Pesquisando...</div>';
    lista.classList.remove('hidden');

    try {
      // RC11.3.8: a política de escopo/eligibilidade precisa ser aplicada NO BANCO
      // antes do LIMIT. O fluxo anterior consultava 30 escolas genéricas do NTE via
      // SIGEE_CORE_V2 e só depois descartava as que não eram Extintas + Recolhidas.
      // Em NTEs com catálogo grande isso produzia falso "Nenhuma escola encontrada".
      const client = clienteSupabase();
      if (!client) throw new Error('Conexão com o catálogo de escolas indisponível.');
      const safe = busca.replace(/[,%_]/g, ' ').trim();
      let query = client
        .from('escolas_sigee')
        .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo,ativo')
        .or(`nome_escola.ilike.%${safe}%,nome.ilike.%${safe}%,cod_mec.ilike.%${safe}%`)
        .order('nome_escola', { ascending: true, nullsFirst: false });

      const contexto = contextoEscopo();
      if (contexto.tipo === 'ESCOLA') {
        if (!contexto.escolaId) throw new Error('Usuário escolar sem escola vinculada.');
        query = query
          .eq('id', contexto.escolaId)
          .eq('dependencia_adm', 'Estadual')
          .eq('situacao_funcional', 'Ativa')
          .eq('ativo', true);
      } else if (contexto.tipo === 'NTE') {
        if (!contexto.nteId) throw new Error('Usuário territorial sem NTE válido.');
        // Para Escolas Extintas a regra homologada permanece:
        // mesmo NTE + situação Extinta + acervo canônico Recolhido.
        // Não exigimos ativo=true aqui porque o validador considera bloqueio apenas
        // quando ativo === false; registros legados com ativo NULL continuam elegíveis.
        query = query
          .eq('nte_id', contexto.nteId)
          .eq('situacao_funcional', 'Extinta')
          .eq('acervo', 'Recolhido')
          .neq('ativo', false);
      }

      query = query.limit(30);
      const { data, error } = await query;
      if (error) throw error;
      const resultados = data || [];

      if (token !== requisicaoAtual) return;
      renderizarResultados(resultados);
    } catch (erro) {
      if (token !== requisicaoAtual) return;
      console.error('[SIGEE RC4.5.23] Falha na pesquisa de escolas:', erro);
      lista.innerHTML = `<div class="p-3 text-red-600 font-bold">Não foi possível pesquisar. ${texto(erro?.message)}</div>`;
    }
  }



  function garantirModalCadastroNaoPermitido() {
    let modal = campo('sigee-modal-cadastro-nao-permitido');
    if (modal) return modal;

    const style = document.createElement('style');
    style.id = 'sigee-modal-cadastro-nao-permitido-style';
    style.textContent = `
      #sigee-modal-cadastro-nao-permitido {
        position: fixed; inset: 0; z-index: 100000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px; background: rgba(15, 39, 66, .58);
        backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
      }
      #sigee-modal-cadastro-nao-permitido.sigee-hidden { display: none; }
      .sigee-cnp-card {
        width: min(435px, calc(100vw - 32px)); overflow: hidden;
        background: #fff; border-radius: 12px;
        box-shadow: 0 24px 70px rgba(0,0,0,.36);
        border: 1px solid rgba(255,255,255,.55);
        font-family: inherit;
      }
      .sigee-cnp-header {
        padding: 18px 16px; color: #fff; font-size: 14px; font-weight: 900;
        background: linear-gradient(135deg, #075b9c, #0b79c9);
      }
      .sigee-cnp-body { padding: 18px 16px 15px; color: #334155; }
      .sigee-cnp-body p { margin: 0 0 13px; font-size: 12px; line-height: 1.55; }
      .sigee-cnp-body p:first-child { color: #182235; font-weight: 800; }
      .sigee-cnp-status { color: #b91c1c; font-weight: 950; }
      .sigee-cnp-unidade {
        margin-top: 14px; padding: 12px 13px; border-radius: 6px;
        background: #3d4a5d; color: #fff; font-size: 11px;
        text-transform: uppercase; overflow-wrap: anywhere;
      }
      .sigee-cnp-unidade strong { color: #cbd5e1; font-weight: 800; }
      .sigee-cnp-footer {
        display: flex; justify-content: flex-end; padding: 12px 14px;
        border-top: 1px solid #e2e8f0; background: #f8fafc;
      }
      .sigee-cnp-btn {
        border: 0; border-radius: 10px; padding: 10px 17px;
        background: linear-gradient(135deg, #dc3545, #c93443);
        color: #fff; font-weight: 900; font-size: 12px; cursor: pointer;
        box-shadow: 0 5px 15px rgba(201,52,67,.28);
      }
      .sigee-cnp-btn:hover { filter: brightness(.96); }
      .sigee-cnp-btn:focus-visible { outline: 3px solid rgba(37,99,235,.35); outline-offset: 2px; }
    `;
    document.head.appendChild(style);

    modal = document.createElement('div');
    modal.id = 'sigee-modal-cadastro-nao-permitido';
    modal.className = 'sigee-hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'sigee-cnp-titulo');
    modal.innerHTML = `
      <section class="sigee-cnp-card">
        <header class="sigee-cnp-header" id="sigee-cnp-titulo">Cadastro não permitido</header>
        <div class="sigee-cnp-body">
          <p>O acervo desta unidade de ensino está registrado como <span class="sigee-cnp-status">NÃO RECOLHIDO</span>.</p>
          <p>A solicitação não pode ser cadastrada no fluxo de Escolas Extintas enquanto o acervo não estiver oficialmente recolhido ou enquanto a situação cadastral não for regularizada.</p>
          <p>A escola deverá ter a situação corrigida no Catálogo de Escolas antes de permitir uma nova solicitação.</p>
          <div class="sigee-cnp-unidade"><strong>Unidade:</strong> <span id="sigee-cnp-unidade-nome"></span></div>
        </div>
        <footer class="sigee-cnp-footer">
          <button type="button" class="sigee-cnp-btn" id="sigee-cnp-entendi">Entendi</button>
        </footer>
      </section>`;
    document.body.appendChild(modal);

    const fechar = () => {
      modal.classList.add('sigee-hidden');
      modal.setAttribute('aria-hidden', 'true');
      setTimeout(() => campo('novo-proc-escola-busca-v23')?.focus(), 0);
    };
    campo('sigee-cnp-entendi')?.addEventListener('click', fechar);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) fechar(); });
    modal.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fechar(); });
    modal.__sigeeFechar = fechar;
    return modal;
  }

  function exibirCadastroNaoPermitido(escola) {
    const lista = campo('novo-proc-escola-lista-v23');
    if (lista) {
      lista.innerHTML = '';
      lista.classList.add('hidden');
    }
    const modal = garantirModalCadastroNaoPermitido();
    const unidade = campo('sigee-cnp-unidade-nome');
    if (unidade) unidade.textContent = texto(escola?.nome || 'UNIDADE NÃO IDENTIFICADA').toUpperCase();
    modal.classList.remove('sigee-hidden');
    modal.removeAttribute('aria-hidden');
    setTimeout(() => campo('sigee-cnp-entendi')?.focus(), 0);
  }

  function statusAcervoBloqueiaSolicitacao(valor) {
    const status = normalizar(valor);
    return status.includes('NAO RECOLHIDO') ||
      status.includes('NAO ACOLHIDO') ||
      status.includes('ACERVO NAO RECOLHIDO');
  }

  function formatarEscola(e) {
    return {
      ...e,
      id: texto(e.id || e.escola_id),
      nome: texto(e.nome_escola || e.nome || e.escola),
      cod_mec: texto(e.cod_mec),
      municipio: texto(e.municipio),
      nte_id: Number(e.nte_id || 0) || null,
      nte: texto(e.nte || (e.nte_id ? `NTE ${String(e.nte_id).padStart(2, '0')}` : '')),
      dependencia: texto(e.dependencia_adm || e.dependencia),
      situacao: texto(e.situacao_funcional || e.situacao),
      acervo: texto(e.acervo),
      status_acervo: texto(e.status_acervo),
      ativo: e.ativo !== false,
      local_acervo: texto(e.local_acervo)
    };
  }

  function renderizarResultados(resultados) {
    const lista = campo('novo-proc-escola-lista-v23');
    if (!lista) return;
    lista.innerHTML = '';
    const escolas = (Array.isArray(resultados) ? resultados : []).map(formatarEscola).filter((e) => e.id && e.nome && validarPoliticaEscola(e).ok);
    if (!escolas.length) {
      lista.innerHTML = '<div class="p-3 text-red-600 font-bold">Nenhuma escola encontrada.</div>';
      lista.classList.remove('hidden');
      return;
    }

    escolas.forEach((escola) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'block w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 bg-white';
      btn.innerHTML = `<div class="font-black text-blue-900"></div><div class="text-[10px] text-gray-600"></div>`;
      btn.children[0].textContent = escola.nome;
      btn.children[1].textContent = `MEC: ${escola.cod_mec || '-'} | ${escola.municipio || '-'} | ${escola.nte || ''}`;
      btn.addEventListener('click', () => selecionarEscola(escola));
      lista.appendChild(btn);
    });
    lista.classList.remove('hidden');
  }

  function selecionarEscola(escola) {
    const e = formatarEscola(escola);
    if (!e.id || !e.nome) return;

    const politica = validarPoliticaEscola(escola);
    if (!politica.ok) {
      limparIdentidadeEscola();
      if (botao) { botao.disabled = true; botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento'; }
      alert(politica.motivo);
      return;
    }

    escolaSelecionada = e;

    const input = campo('novo-proc-escola-busca-v23');
    const hidden = campo('novo-proc-escola-id');
    const select = campo('novo-proc-escola');
    const lista = campo('novo-proc-escola-lista-v23');

    if (input) {
      input.value = e.nome;
      input.dataset.escolaId = e.id;
      input.dataset.codMec = e.cod_mec;
      input.dataset.escolaSelecionada = '1';
    }
    if (hidden) hidden.value = e.id;
    if (select) {
      select.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = e.nome;
      opt.textContent = e.nome;
      opt.dataset.escolaId = e.id;
      opt.dataset.codMec = e.cod_mec;
      opt.selected = true;
      select.appendChild(opt);
      select.value = e.nome;
      select.dataset.escolaId = e.id;
      select.dataset.codMec = e.cod_mec;
    }
    if (lista) {
      lista.innerHTML = '';
      lista.classList.add('hidden');
    }

    window.SIGEE_ESCOLA_NOVA_SOLICITACAO = { ...e, escola_id: e.id, nome_escola: e.nome };
    window.SIGEE_NOVA_SOLICITACAO_ESCOLA_ID = e.id;
    window.SIGEE_NOVA_SOLICITACAO_ESCOLA_NOME = e.nome;
    window.SIGEE_NOVA_SOLICITACAO_COD_MEC = e.cod_mec;

    const valores = {
      [IDS_AUTOFILL.mec]: e.cod_mec,
      [IDS_AUTOFILL.nte]: e.nte,
      [IDS_AUTOFILL.municipio]: e.municipio,
      [IDS_AUTOFILL.dependencia]: e.dependencia,
      [IDS_AUTOFILL.situacao]: e.situacao,
      [IDS_AUTOFILL.acervo]: e.acervo,
      [IDS_AUTOFILL.local]: e.local_acervo
    };
    Object.entries(valores).forEach(([id, valor]) => { const el = campo(id); if (el) el.value = valor || ''; });
    try { window.aplicarClasseStatusAcervoSIGEE?.(); } catch (_) {}
    try { window.aplicarStatusBotaoNovaSolicitacaoV25?.(); } catch (_) {}
    if (contextoEscopo().tipo === 'ESCOLA') modoVisualEscolaVinculada(true, e);
    if (botao) {
      botao.disabled = false;
      botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento';
    }
  }

  function resetarFormulario() {
    clearTimeout(timerBusca);
    requisicaoAtual++;
    limparIdentidadeEscola();
    modoVisualEscolaVinculada(false);
    const aluno = campo('novo-proc-aluno');
    if (aluno) aluno.value = '';
    ['novo-proc-documento', 'novo-proc-modalidade', 'novo-proc-ensino'].forEach((id) => {
      const el = campo(id);
      if (el) el.selectedIndex = 0;
    });
    const chk = campo('f01-chk-acolhido');
    if (chk) chk.checked = false;
    if (form) delete form.dataset.sigeeEnviando;
    if (botao) {
      botao.disabled = true;
      botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento';
    }
  }

  async function abrir() {
    const modal = campo('modal-nova-solicitacao');
    if (!modal) return false;
    const input = garantirCampoPesquisa();
    resetarFormulario();
    modal.classList.remove('hidden');
    const contexto = contextoEscopo();
    const labelEscola = document.querySelector('label[for="novo-proc-escola"], #novo-proc-escola')?.closest?.('div')?.querySelector?.('label') || campo('novo-proc-escola')?.parentElement?.querySelector?.('label');
    if (labelEscola) labelEscola.textContent = contexto.tipo === 'ESCOLA' ? 'Unidade Escolar Vinculada' : 'Selecione a Instituição de Ensino';
    if (contexto.tipo === 'ESCOLA') {
      modoVisualEscolaVinculada(true);
      try {
        const client = clienteSupabase();
        if (!client || !contexto.escolaId) throw new Error('Vínculo escolar indisponível.');
        const { data, error } = await client.from('escolas_sigee')
          .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo,ativo')
          .eq('id', contexto.escolaId).maybeSingle();
        if (error) throw error;
        const politica = validarPoliticaEscola(data || {}, contexto);
        if (!data || !politica.ok) throw new Error(politica.motivo || 'Escola vinculada não localizada.');
        selecionarEscola(data);
        modoVisualEscolaVinculada(true, data);
      } catch (erro) {
        alert('Não foi possível validar a unidade escolar vinculada. ' + texto(erro?.message || erro));
        fechar();
        return false;
      }
    } else if (input) {
      modoVisualEscolaVinculada(false);
      input.disabled = false;
      input.placeholder = 'Digite pelo menos 2 letras da escola...';
    }
    requestAnimationFrame(() => campo('novo-proc-aluno')?.focus());
    return true;
  }

  function fechar() {
    const modal = campo('modal-nova-solicitacao');
    if (modal) modal.classList.add('hidden');
    resetarFormulario();
  }

  async function recuperarEscolaSelecionadaOficial() {
    const hidden = campo('novo-proc-escola-id');
    const input = campo('novo-proc-escola-busca-v23');
    const select = campo('novo-proc-escola');
    const global = window.SIGEE_ESCOLA_NOVA_SOLICITACAO || {};

    const id = texto(
      hidden?.value ||
      escolaSelecionada?.id ||
      global.id ||
      global.escola_id ||
      input?.dataset?.escolaId ||
      select?.dataset?.escolaId ||
      window.SIGEE_NOVA_SOLICITACAO_ESCOLA_ID
    );

    if (!id) return null;

    // Quando outro módulo homologado concluiu a seleção, reconstrói o estado
    // interno usando o mesmo ID oficial, sem depender apenas do texto exibido.
    const candidata = formatarEscola({
      ...global,
      id,
      escola_id: id,
      nome_escola: global.nome_escola || global.nome || input?.value || select?.value,
      nome: global.nome || global.nome_escola || input?.value || select?.value,
      cod_mec: global.cod_mec || input?.dataset?.codMec || select?.dataset?.codMec || campo(IDS_AUTOFILL.mec)?.value,
      nte: global.nte || campo(IDS_AUTOFILL.nte)?.value,
      municipio: global.municipio || campo(IDS_AUTOFILL.municipio)?.value,
      dependencia_adm: global.dependencia_adm || global.dependencia || campo(IDS_AUTOFILL.dependencia)?.value,
      situacao_funcional: global.situacao_funcional || global.situacao || campo(IDS_AUTOFILL.situacao)?.value,
      status_acervo: global.status_acervo || global.acervo || campo(IDS_AUTOFILL.acervo)?.value,
      local_acervo: global.local_acervo || campo(IDS_AUTOFILL.local)?.value
    });

    // A autoridade final é o catálogo: consulta pelo ID para impedir que uma
    // escola digitada ou um estado antigo seja gravado no processo.
    try {
      const client = clienteSupabase();
      if (client && typeof client.from === 'function') {
        const { data, error } = await client
          .from('escolas_sigee')
          .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo,ativo')
          .eq('id', Number(id) || id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const oficial = formatarEscola(data);
        if (texto(oficial.id) !== id) return null;
        selecionarEscola(oficial);
        return oficial;
      }
    } catch (erro) {
      console.warn('[SIGEE RC4.5.31] Não foi possível reconfirmar a escola no catálogo:', erro);
    }

    // Em indisponibilidade transitória, só aceita o estado já homologado se
    // houver ID, nome e código MEC coerentes. Nunca resolve escola apenas por nome.
    if (candidata.id && candidata.nome && candidata.cod_mec && texto(candidata.id) === id) {
      selecionarEscola(candidata);
      return candidata;
    }
    return null;
  }

  async function enviar(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!form || form.dataset.sigeeEnviando === '1') return false;

    const escolaOficial = await recuperarEscolaSelecionadaOficial();
    const id = texto(campo('novo-proc-escola-id')?.value || escolaOficial?.id);
    if (!id || !escolaOficial || texto(escolaOficial.id) !== id) {
      alert(contextoEscopo().tipo === 'ESCOLA' ? 'A unidade escolar vinculada não foi carregada. Feche e abra a Nova Solicitação novamente.' : 'Selecione a instituição de ensino na lista antes de cadastrar.');
      return false;
    }
    escolaSelecionada = escolaOficial;

    const politica = validarPoliticaEscola(escolaOficial);
    if (!politica.ok) {
      alert(politica.motivo);
      return false;
    }

    const duplicidade = window.SIGEE_DUPLICIDADE_NOVA_SOLICITACAO;
    if (!duplicidade || typeof duplicidade.validar !== 'function') {
      alert('A validação de duplicidade não está disponível. O cadastro foi interrompido por segurança.');
      return false;
    }

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Verificando duplicidade...';
    }

    let permitido = false;
    try {
      permitido = await duplicidade.validar();
    } catch (erro) {
      console.error('[SIGEE RC4.5.29] Falha na validação de duplicidade:', erro);
      alert('Não foi possível validar a duplicidade com segurança. O cadastro foi interrompido. Tente novamente.');
      if (botao) {
        botao.disabled = false;
        botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento';
      }
      return false;
    }

    if (!permitido) {
      if (botao) {
        botao.disabled = false;
        botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento';
      }
      return false;
    }

    const segura = window.SIGEE_SALVAR_NOVA_SOLICITACAO_SEGURO;
    if (typeof segura !== 'function') {
      alert('A rotina de gravação da Nova Solicitação não está disponível.');
      if (botao) {
        botao.disabled = false;
        botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento';
      }
      return false;
    }

    form.dataset.sigeeEnviando = '1';
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
    }
    try {
      return await segura.call(form, event);
    } catch (erro) {
      console.error('[SIGEE RC4.5.23] Falha ao cadastrar:', erro);
      alert('Não foi possível cadastrar a solicitação. ' + texto(erro?.message || erro));
      return false;
    } finally {
      delete form.dataset.sigeeEnviando;
      if (botao && !campo('modal-nova-solicitacao')?.classList.contains('hidden')) {
        botao.disabled = false;
        botao.textContent = contextoEscopo().tipo === 'ESCOLA' ? 'Criar Solicitação' : 'Enviar para Desarquivamento';
      }
    }
  }

  function instalar() {
    form = document.querySelector('#modal-nova-solicitacao form');
    if (!form || form.dataset.sigeeNovaSolicitacaoController === '1') return;

    form.dataset.sigeeNovaSolicitacaoController = '1';
    form.removeAttribute('onsubmit');
    botao = campo('btn-submeter-nova-solicitacao');

    garantirCampoPesquisa();
    form.addEventListener('submit', enviar, true);
    if (botao) {
      botao.type = 'submit';
      botao.onclick = null;
      botao.removeAttribute('onclick');
    }

    window.abrirFormularioNovaSolicitacao = abrir;
    window.fecharModalNovaSolicitacao = fechar;
    window.handleSelecaoInstituicaoFluxoAutomatico = () => !!texto(campo('novo-proc-escola-id')?.value);
    window.SIGEE_NOVA_SOLICITACAO_CONTROLLER = { abrir, fechar, limpar: resetarFormulario, selecionarEscola, validarPoliticaEscola, versao: 'RC11.3.1' };

    // Defesa de autoridade: builds legados reaplicavam o autocomplete em timers tardios.
    // Reafirma o controlador canônico sem reconstruir o modal ou apagar dados digitados.
    [600, 1700].forEach((ms) => setTimeout(() => {
      window.abrirFormularioNovaSolicitacao = abrir;
      try { abrirFormularioNovaSolicitacao = window.abrirFormularioNovaSolicitacao; } catch (_) {}
    }, ms));

    // Garante estado visual neutro na instalação do controlador único.
    resetarFormulario();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
