/* SIGEE Sprint 02 - Autocomplete de Escola por NTE
   Substitui o select tradicional da Nova Solicitação por campo pesquisável.
   Carregar APÓS js/app.js no index.html.
*/
(function () {
  'use strict';

  const IDS = {
    select: 'novo-proc-escola',
    input: 'novo-proc-escola-autocomplete',
    lista: 'novo-proc-escola-resultados',
    box: 'novo-proc-escola-autocomplete-box'
  };

  let escolaSelecionadaSIGEE = null;
  let timerBuscaSIGEE = null;

  function texto(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }
  function semAcento(v) { return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function norm(v) { return semAcento(v).toUpperCase().replace(/\s+/g, ' ').trim(); }
  function perfilAtual() { return norm(window.usuarioLogado && window.usuarioLogado.perfil); }
  function nteAtual() { return texto(window.usuarioLogado && window.usuarioLogado.nte); }
  function isGlobal() { return perfilAtual() === 'MASTER' || perfilAtual() === 'SEC'; }
  function nomeEscola(e) { return texto(e && (e.nome || e.nome_escola || e.instituicao)); }
  function nteEscola(e) { return texto(e && (e.nte || e.nte_nome || e.nte_associado)); }
  function codMec(e) { return texto(e && (e.cod_mec || e.codigo_mec || e.mec)); }
  function municipioEscola(e) { return texto(e && (e.municipio || e.cidade)); }

  function nteNumero(v) {
    const m = texto(v).match(/NTE\s*-?\s*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }

  function mesmoNte(a, b) {
    const na = nteNumero(a);
    const nb = nteNumero(b);
    if (na && nb) return na === nb;
    return norm(a) === norm(b);
  }

  function escolasBase() {
    try {
      if (Array.isArray(window.escolasDB)) return window.escolasDB;
      if (typeof escolasDB !== 'undefined' && Array.isArray(escolasDB)) return escolasDB;
    } catch (e) {}
    return [];
  }

  function escolasPermitidas() {
    const todas = escolasBase();
    if (isGlobal()) return todas;
    const nteUser = nteAtual();
    if (!nteUser || /TODOS OS NTES|SEC/i.test(nteUser)) return [];
    return todas.filter(e => mesmoNte(nteEscola(e), nteUser));
  }

  function limparAutofill() {
    ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  function preencherAutofill(e) {
    if (!e) return limparAutofill();
    const mapa = {
      'novo-autofill-mec': codMec(e),
      'novo-autofill-nte': nteEscola(e),
      'novo-autofill-municipio': municipioEscola(e),
      'novo-autofill-dep': texto(e.dependencia || e.dependencia_adm || e.dep_administrativo),
      'novo-autofill-situacao': texto(e.situacao || e.situacao_funcional),
      'novo-autofill-acervo': texto(e.status_acervo || e.acervo).toUpperCase(),
      'novo-autofill-local-acervo': texto(e.local_acervo || e.local_fisico_acervo)
    };
    Object.entries(mapa).forEach(([id, valor]) => {
      const el = document.getElementById(id);
      if (el) el.value = valor;
    });
    try { if (typeof aplicarClasseStatusAcervoSIGEE === 'function') aplicarClasseStatusAcervoSIGEE(); } catch (e) {}
  }

  function renderMensagem(msg) {
    const lista = document.getElementById(IDS.lista);
    if (!lista) return;
    lista.innerHTML = `<div class="sigee-auto-msg">${msg}</div>`;
    lista.classList.remove('hidden');
  }

  function ocultarLista() {
    const lista = document.getElementById(IDS.lista);
    if (lista) lista.classList.add('hidden');
  }

  function selecionarEscola(e) {
    escolaSelecionadaSIGEE = e;
    const select = document.getElementById(IDS.select);
    const input = document.getElementById(IDS.input);
    const nome = nomeEscola(e).toUpperCase();

    if (select) {
      select.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = `${nome} - ${municipioEscola(e)} (${nteEscola(e)})`;
      opt.selected = true;
      select.appendChild(opt);
      select.value = nome;
      select.dataset.codMecSelecionado = codMec(e);
    }

    if (input) input.value = nome;
    preencherAutofill(e);
    ocultarLista();
  }

  function buscarLocal(termo) {
    const q = norm(termo);
    const base = escolasPermitidas();
    if (q.length < 2) return [];

    const partes = q.split(' ').filter(Boolean);
    const resultados = [];

    for (const e of base) {
      const nome = norm(nomeEscola(e));
      const municipio = norm(municipioEscola(e));
      const mec = norm(codMec(e));
      const textoBusca = `${nome} ${municipio} ${mec}`;
      if (partes.every(p => textoBusca.includes(p))) {
        resultados.push(e);
        if (resultados.length >= 30) break;
      }
    }
    return resultados;
  }

  function renderResultados(listaEscolas, termo) {
    const lista = document.getElementById(IDS.lista);
    if (!lista) return;

    if (!termo || norm(termo).length < 2) {
      renderMensagem('Digite pelo menos 2 letras para pesquisar a escola.');
      return;
    }

    if (!listaEscolas.length) {
      renderMensagem('Nenhuma escola encontrada para este NTE.');
      return;
    }

    lista.innerHTML = '';
    listaEscolas.forEach(e => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'sigee-auto-item';
      item.innerHTML = `
        <strong>${nomeEscola(e).toUpperCase()}</strong>
        <span>MEC: ${codMec(e) || '-'} | ${municipioEscola(e) || '-'} | ${nteEscola(e) || '-'}</span>
      `;
      item.addEventListener('mousedown', ev => {
        ev.preventDefault();
        selecionarEscola(e);
      });
      lista.appendChild(item);
    });
    lista.classList.remove('hidden');
  }

  function pesquisar() {
    const input = document.getElementById(IDS.input);
    if (!input) return;
    const termo = input.value;
    escolaSelecionadaSIGEE = null;

    const select = document.getElementById(IDS.select);
    if (select) {
      select.innerHTML = '<option value="">SELECIONE UMA ESCOLA PELA PESQUISA</option>';
      select.value = '';
      delete select.dataset.codMecSelecionado;
    }
    limparAutofill();

    clearTimeout(timerBuscaSIGEE);
    timerBuscaSIGEE = setTimeout(() => {
      const resultados = buscarLocal(termo);
      renderResultados(resultados, termo);
    }, 120);
  }

  function instalarAutocomplete() {
    const select = document.getElementById(IDS.select);
    if (!select) return;

    let box = document.getElementById(IDS.box);
    if (!box) {
      box = document.createElement('div');
      box.id = IDS.box;
      box.className = 'sigee-auto-box';
      box.innerHTML = `
        <input id="${IDS.input}" type="text" autocomplete="off" placeholder="🔎 Digite trecho do nome da escola, município ou MEC..." class="sigee-auto-input">
        <div id="${IDS.lista}" class="sigee-auto-lista hidden"></div>
      `;
      select.parentNode.insertBefore(box, select.nextSibling);
    }

    select.style.display = 'none';
    select.innerHTML = '<option value="">SELECIONE UMA ESCOLA PELA PESQUISA</option>';
    select.value = '';

    const input = document.getElementById(IDS.input);
    const lista = document.getElementById(IDS.lista);
    if (!input || !lista) return;

    input.value = '';
    input.oninput = pesquisar;
    input.onfocus = () => {
      if (norm(input.value).length < 2) renderMensagem('Digite pelo menos 2 letras para pesquisar a escola.');
      else renderResultados(buscarLocal(input.value), input.value);
    };
    input.onkeydown = (ev) => {
      if (ev.key === 'Enter') {
        const primeiro = lista.querySelector('.sigee-auto-item');
        if (primeiro && !lista.classList.contains('hidden')) {
          ev.preventDefault();
          primeiro.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        }
      }
    };

    document.addEventListener('click', ev => {
      if (!box.contains(ev.target)) ocultarLista();
    }, { once: false });
  }

  function resetarNovaSolicitacao() {
    const setVal = (id, valor) => { const el = document.getElementById(id); if (el) el.value = valor; };
    setVal('novo-proc-aluno', '');
    ['novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => setVal(id, ''));
    const chk = document.getElementById('f01-chk-acolhido');
    if (chk) chk.checked = false;
    const btn = document.getElementById('btn-submeter-nova-solicitacao');
    if (btn) btn.disabled = true;
    escolaSelecionadaSIGEE = null;
    limparAutofill();
  }

  // Substitui a abertura antiga para não montar um select com milhares de opções.
  window.abrirFormularioNovaSolicitacao = function () {
    const modal = document.getElementById('modal-nova-solicitacao');
    if (!modal) return;
    resetarNovaSolicitacao();
    modal.classList.remove('hidden');
    setTimeout(instalarAutocomplete, 30);
  };

  // Mantém compatibilidade com chamadas antigas.
  window.handleSelecaoInstituicaoFluxoAutomatico = function () {
    const select = document.getElementById(IDS.select);
    const valor = select ? select.value : '';
    const cod = select && select.dataset ? select.dataset.codMecSelecionado : '';
    const esc = escolaSelecionadaSIGEE || escolasBase().find(e => norm(nomeEscola(e)) === norm(valor) || texto(codMec(e)) === texto(cod));
    preencherAutofill(esc || null);
  };

  // Validação extra antes de salvar.
  const salvarOriginal = window.salvarNovaSolicitacao;
  if (typeof salvarOriginal === 'function') {
    window.salvarNovaSolicitacao = function (event) {
      const select = document.getElementById(IDS.select);
      if (select && !select.value) {
        if (event) event.preventDefault();
        alert('Selecione a instituição de ensino pela pesquisa antes de enviar para desarquivamento.');
        const input = document.getElementById(IDS.input);
        if (input) input.focus();
        return false;
      }
      return salvarOriginal.call(this, event);
    };
  }

  function injetarCSS() {
    if (document.getElementById('sigee-auto-css')) return;
    const style = document.createElement('style');
    style.id = 'sigee-auto-css';
    style.textContent = `
      .sigee-auto-box{position:relative;width:100%;}
      .sigee-auto-input{width:100%;padding:.72rem .85rem;border:1px solid #0891b2;border-radius:.55rem;background:#020617;color:#e5f7ff;font-size:.78rem;font-weight:700;outline:none;box-shadow:0 0 0 1px rgba(6,182,212,.12);}
      .sigee-auto-input:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.18);}
      .sigee-auto-input::placeholder{color:#8fb5c8;}
      .sigee-auto-lista{position:absolute;z-index:99999;left:0;right:0;top:calc(100% + 4px);max-height:300px;overflow:auto;background:#ffffff;border:1px solid #0891b2;border-radius:.55rem;box-shadow:0 18px 45px rgba(0,0,0,.35);padding:.25rem;}
      .sigee-auto-lista.hidden{display:none;}
      .sigee-auto-item{display:block;width:100%;text-align:left;background:#fff;border:0;border-bottom:1px solid #e5e7eb;padding:.65rem .75rem;cursor:pointer;color:#0f172a;}
      .sigee-auto-item:hover,.sigee-auto-item:focus{background:#e0f2fe;outline:none;}
      .sigee-auto-item strong{display:block;font-size:.78rem;color:#0f172a;line-height:1.2;}
      .sigee-auto-item span{display:block;font-size:.68rem;color:#475569;margin-top:.18rem;font-weight:600;}
      .sigee-auto-msg{padding:.75rem;color:#475569;font-size:.78rem;font-weight:700;background:#f8fafc;}
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    injetarCSS();
    if (document.getElementById('modal-nova-solicitacao')) instalarAutocomplete();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
