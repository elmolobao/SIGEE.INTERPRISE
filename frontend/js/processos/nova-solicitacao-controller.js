/* SIGEE RC4.5.25 — Controlador único: modal institucional para bloqueio de acervo */
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

  function perfilAtual() {
    return normalizar(window.usuarioLogado?.perfil || window.SIGEE_SESSION?.getUser?.()?.perfil || '');
  }

  function nteAtual() {
    const u = window.usuarioLogado || window.SIGEE_SESSION?.getUser?.() || {};
    const direto = Number(u.nte_id || u.nteId || u.id_nte || 0);
    if (direto) return direto;
    const m = texto(u.nte || u.nte_nome || u.grupo).match(/\d{1,2}/);
    return m ? Number(m[0]) : null;
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
      let resultados = [];
      if (window.SIGEE_CORE_V2 && typeof window.SIGEE_CORE_V2.queryEscolasBase === 'function') {
        resultados = await window.SIGEE_CORE_V2.queryEscolasBase({ termo: busca, limit: 30, offset: 0 });
      } else {
        const client = clienteSupabase();
        if (!client) throw new Error('Conexão com o catálogo de escolas indisponível.');
        const safe = busca.replace(/[,%]/g, ' ').trim();
        let query = client
          .from('escolas_sigee')
          .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo,ativo')
          .or(`nome_escola.ilike.%${safe}%,nome.ilike.%${safe}%,cod_mec.ilike.%${safe}%`)
          .order('nome_escola', { ascending: true, nullsFirst: false })
          .limit(30);
        if (!['MASTER', 'SEC'].includes(perfilAtual())) {
          const nte = nteAtual();
          if (nte) query = query.eq('nte_id', nte);
        }
        const { data, error } = await query;
        if (error) throw error;
        resultados = data || [];
      }

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
      acervo: texto(e.status_acervo || e.acervo),
      local_acervo: texto(e.local_acervo)
    };
  }

  function renderizarResultados(resultados) {
    const lista = campo('novo-proc-escola-lista-v23');
    if (!lista) return;
    lista.innerHTML = '';
    const escolas = (Array.isArray(resultados) ? resultados : []).map(formatarEscola).filter((e) => e.id && e.nome);
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

    if (statusAcervoBloqueiaSolicitacao(e.acervo)) {
      limparIdentidadeEscola();
      if (botao) {
        botao.disabled = true;
        botao.textContent = 'Enviar para Desarquivamento';
      }
      exibirCadastroNaoPermitido(e);
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
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Enviar para Desarquivamento';
    }
  }

  function resetarFormulario() {
    clearTimeout(timerBusca);
    requisicaoAtual++;
    limparIdentidadeEscola();
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
      botao.textContent = 'Enviar para Desarquivamento';
    }
  }

  function abrir() {
    const modal = campo('modal-nova-solicitacao');
    if (!modal) return false;
    garantirCampoPesquisa();
    resetarFormulario();
    modal.classList.remove('hidden');
    requestAnimationFrame(() => campo('novo-proc-aluno')?.focus());
    return true;
  }

  function fechar() {
    const modal = campo('modal-nova-solicitacao');
    if (modal) modal.classList.add('hidden');
    resetarFormulario();
  }

  async function enviar(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!form || form.dataset.sigeeEnviando === '1') return false;

    const id = texto(campo('novo-proc-escola-id')?.value || escolaSelecionada?.id);
    if (!id || !escolaSelecionada || texto(escolaSelecionada.id) !== id) {
      alert('Selecione a instituição de ensino na lista antes de cadastrar.');
      return false;
    }

    const segura = window.SIGEE_SALVAR_NOVA_SOLICITACAO_SEGURO;
    if (typeof segura !== 'function') {
      alert('A rotina de gravação da Nova Solicitação não está disponível.');
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
        botao.textContent = 'Enviar para Desarquivamento';
      }
    }
  }

  function instalar() {
    const original = document.querySelector('#modal-nova-solicitacao form');
    if (!original) return;

    // Substitui o formulário para remover todos os listeners legados acumulados.
    const novoForm = original.cloneNode(true);
    novoForm.removeAttribute('onsubmit');
    original.replaceWith(novoForm);
    form = novoForm;
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
    window.SIGEE_NOVA_SOLICITACAO_CONTROLLER = { abrir, fechar, limpar: resetarFormulario, selecionarEscola };

    // Garante estado visual neutro mesmo quando o formulário clonado herdou
    // texto/disabled de uma tentativa anterior executada por código legado.
    resetarFormulario();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
