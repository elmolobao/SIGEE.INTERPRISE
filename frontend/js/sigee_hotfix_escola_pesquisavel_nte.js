/*
  SIGEE - Hotfix Escola Pesquisável por NTE
  Objetivo:
  1) Trocar o select de instituição da Nova Solicitação por campo digitável.
  2) Permitir pesquisa por trecho do nome, município ou código MEC.
  3) Filtrar a lista pelo NTE do usuário para perfis não globais.
  4) Preservar Master/SEC com visão global.
*/
(function () {
  'use strict';

  const ID_SELECT = 'novo-proc-escola';
  const ID_INPUT = 'novo-proc-escola-busca-sigee';
  const ID_LISTA = 'novo-proc-escola-lista-sigee';

  function texto(v) {
    return String(v ?? '').trim();
  }

  function normalizar(v) {
    return texto(v)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function nteNumero(v) {
    const m = normalizar(v).match(/NTE\s*[- ]?\s*(\d{1,2})/);
    return m ? String(Number(m[1])).padStart(2, '0') : '';
  }

  function perfilUsuario() {
    return normalizar(window.usuarioLogado?.perfil || window.usuarioLogado?.tipo || '');
  }

  function ehPerfilGlobal() {
    const p = perfilUsuario();
    const email = normalizar(window.usuarioLogado?.email || '');
    const grupo = normalizar(window.usuarioLogado?.grupo || '');
    return p === 'MASTER' || p === 'SEC' || email === 'SEC@ENOVA.EDUCACAO.BA.GOV.BR' || grupo === 'SEC';
  }

  function mesmaNte(a, b) {
    const na = normalizar(a);
    const nb = normalizar(b);
    if (!na || !nb) return false;
    const ca = nteNumero(na);
    const cb = nteNumero(nb);
    if (ca && cb) return ca === cb;
    return na === nb;
  }

  function nomeEscola(e) {
    return texto(e?.nome || e?.nome_escola || e?.instituicao || e?.escola_nome || '');
  }

  function municipioEscola(e) {
    return texto(e?.municipio || e?.cidade || '');
  }

  function mecEscola(e) {
    return texto(e?.cod_mec || e?.mec || e?.codigo_mec || '');
  }

  function nteEscola(e) {
    return texto(e?.nte || e?.nte_nome || e?.nte_associado || e?.dep_adm || e?.departamento || '');
  }

  function listaEscolasPorPerfil() {
    const base = Array.isArray(window.escolasDB) ? window.escolasDB : [];
    if (ehPerfilGlobal()) return base;

    const nteUsuario = texto(window.usuarioLogado?.nte || window.usuarioLogado?.grupo || '');
    return base.filter(e => mesmaNte(nteEscola(e), nteUsuario));
  }

  function garantirComponentes() {
    const select = document.getElementById(ID_SELECT);
    if (!select || !select.parentNode) return null;

    let input = document.getElementById(ID_INPUT);
    let lista = document.getElementById(ID_LISTA);

    if (!input) {
      input = document.createElement('input');
      input.type = 'text';
      input.id = ID_INPUT;
      input.autocomplete = 'off';
      input.placeholder = 'DIGITE TRECHOS DO NOME DA ESCOLA, MUNICÍPIO OU MEC...';
      input.className = 'w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold mb-1';
      select.parentNode.insertBefore(input, select);
    }

    if (!lista) {
      lista = document.createElement('div');
      lista.id = ID_LISTA;
      lista.className = 'hidden max-h-56 overflow-y-auto border rounded-lg bg-white shadow-lg text-xs z-[10000]';
      lista.style.position = 'relative';
      select.parentNode.insertBefore(lista, select.nextSibling);
    }

    select.classList.add('hidden');
    select.required = false;
    select.tabIndex = -1;

    input.oninput = () => renderizarLista(input.value || '');
    input.onfocus = () => renderizarLista(input.value || '');
    input.onclick = ev => { ev.stopPropagation(); renderizarLista(input.value || ''); };
    lista.onclick = ev => ev.stopPropagation();

    if (!window.__SIGEE_ESCOLA_PESQUISAVEL_CLICK__) {
      window.__SIGEE_ESCOLA_PESQUISAVEL_CLICK__ = true;
      document.addEventListener('click', ev => {
        const i = document.getElementById(ID_INPUT);
        const l = document.getElementById(ID_LISTA);
        if (!i || !l) return;
        if (ev.target !== i && !l.contains(ev.target)) l.classList.add('hidden');
      });
    }

    return { select, input, lista };
  }

  function preencherSelectOculto(escola) {
    const select = document.getElementById(ID_SELECT);
    if (!select) return;

    const mec = mecEscola(escola);
    const nome = nomeEscola(escola);
    const valor = mec || nome;

    select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = valor;
    opt.textContent = nome;
    opt.selected = true;
    select.appendChild(opt);
    select.value = valor;
    select.dataset.codMecSelecionado = mec;
    select.dataset.nomeSelecionado = nome;
  }

  function selecionarEscola(escola) {
    const input = document.getElementById(ID_INPUT);
    const lista = document.getElementById(ID_LISTA);
    const nome = nomeEscola(escola);
    const mec = mecEscola(escola);
    const mun = municipioEscola(escola);
    const nte = nteEscola(escola);

    if (input) {
      input.value = `${nome}${mun ? ' - ' + mun : ''}${nte ? ' (' + nte + ')' : ''}`;
      input.dataset.codMecSelecionado = mec;
      input.dataset.nomeSelecionado = nome;
    }

    preencherSelectOculto(escola);
    if (lista) lista.classList.add('hidden');

    if (typeof window.handleSelecaoInstituicaoFluxoAutomatico === 'function') {
      window.handleSelecaoInstituicaoFluxoAutomatico();
    }
  }

  function renderizarLista(termo) {
    const comp = garantirComponentes();
    if (!comp) return;
    const { lista } = comp;
    const q = normalizar(termo);

    let resultados = listaEscolasPorPerfil();

    if (q) {
      resultados = resultados.filter(e => {
        const alvo = [nomeEscola(e), municipioEscola(e), mecEscola(e), nteEscola(e)].map(normalizar).join(' ');
        return alvo.includes(q);
      });
    }

    resultados = resultados.slice(0, 80);
    lista.innerHTML = '';

    if (!resultados.length) {
      lista.innerHTML = '<div class="p-3 text-gray-500 font-semibold bg-white">Nenhuma instituição localizada para o NTE do usuário.</div>';
      lista.classList.remove('hidden');
      return;
    }

    const frag = document.createDocumentFragment();
    resultados.forEach(escola => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'block w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 text-gray-800 bg-white';
      btn.innerHTML = `
        <span class="font-bold">${nomeEscola(escola) || 'SEM NOME'}</span><br>
        <span class="text-[10px] text-gray-500">MEC: ${mecEscola(escola) || '-'} | ${municipioEscola(escola) || '-'} | ${nteEscola(escola) || '-'}</span>
      `;
      btn.onmousedown = ev => {
        ev.preventDefault();
        ev.stopPropagation();
        selecionarEscola(escola);
      };
      frag.appendChild(btn);
    });

    lista.appendChild(frag);
    lista.classList.remove('hidden');
  }

  function limparCamposNovaSolicitacao() {
    const input = document.getElementById(ID_INPUT);
    const select = document.getElementById(ID_SELECT);
    const lista = document.getElementById(ID_LISTA);

    if (input) {
      input.value = '';
      delete input.dataset.codMecSelecionado;
      delete input.dataset.nomeSelecionado;
    }
    if (select) {
      select.innerHTML = '<option value="" selected>SELECIONE A INSTITUIÇÃO</option>';
      delete select.dataset.codMecSelecionado;
      delete select.dataset.nomeSelecionado;
    }
    if (lista) lista.classList.add('hidden');
  }

  // Sobrescreve a abertura da Nova Solicitação depois que o app.js terminar de carregar.
  function instalarHotfix() {
    const originalAbrir = window.abrirFormularioNovaSolicitacao;

    window.abrirFormularioNovaSolicitacao = function () {
      if (typeof originalAbrir === 'function') {
        try { originalAbrir.apply(this, arguments); } catch (e) { console.warn('SIGEE hotfix: abertura original falhou, seguindo com fallback.', e); }
      } else {
        const modal = document.getElementById('modal-nova-solicitacao');
        if (modal) modal.classList.remove('hidden');
      }

      setTimeout(() => {
        garantirComponentes();
        limparCamposNovaSolicitacao();
        renderizarLista('');
        const lista = document.getElementById(ID_LISTA);
        if (lista) lista.classList.add('hidden');
      }, 80);
    };

    const originalHandle = window.handleSelecaoInstituicaoFluxoAutomatico;
    window.handleSelecaoInstituicaoFluxoAutomatico = function () {
      const select = document.getElementById(ID_SELECT);
      const input = document.getElementById(ID_INPUT);
      const cod = texto(select?.dataset.codMecSelecionado || input?.dataset.codMecSelecionado || select?.value || '');
      const nome = normalizar(select?.dataset.nomeSelecionado || input?.dataset.nomeSelecionado || input?.value || select?.value || '');
      const escola = (Array.isArray(window.escolasDB) ? window.escolasDB : []).find(e =>
        texto(mecEscola(e)) === cod || normalizar(nomeEscola(e)) === nome
      );

      if (escola) {
        const set = (id, valor) => { const el = document.getElementById(id); if (el) el.value = valor || ''; };
        set('novo-autofill-mec', mecEscola(escola));
        set('novo-autofill-nte', nteEscola(escola));
        set('novo-autofill-municipio', municipioEscola(escola));
        set('novo-autofill-dep', escola.dependencia || escola.dependencia_adm || '');
        set('novo-autofill-situacao', escola.situacao || escola.situacao_funcional || '');
        set('novo-autofill-acervo', escola.status_acervo || escola.acervo || '');
        set('novo-autofill-local-acervo', escola.local_acervo || escola.local || '');
        if (typeof window.aplicarClasseStatusAcervoSIGEE === 'function') window.aplicarClasseStatusAcervoSIGEE();
        return;
      }

      if (typeof originalHandle === 'function') return originalHandle.apply(this, arguments);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalarHotfix);
  } else {
    instalarHotfix();
  }

  window.SIGEE_HOTFIX_ESCOLA_PESQUISAVEL_NTE = {
    garantirComponentes,
    renderizarLista,
    listaEscolasPorPerfil
  };
})();
