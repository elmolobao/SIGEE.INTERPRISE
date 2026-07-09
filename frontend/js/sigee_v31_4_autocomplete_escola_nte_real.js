/*
 * SIGEE Enterprise V31.4
 * Correção real: campo Escola com autocomplete e filtro pelo NTE do usuário cadastrado.
 * Mantém os perfis Master, Administrador, Técnico, SEC e Consulta.
 */
(function(){
  'use strict';

  const INPUT_ID = 'novo-proc-escola-busca-v31-4';
  const LISTA_ID = 'novo-proc-escola-lista-v31-4';
  const SELECT_ID = 'novo-proc-escola';

  function norm(v){
    return String(v || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().trim();
  }

  function nteKey(v){
    return norm(v).replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
  }

  function isNteGlobal(nte){
    const k = nteKey(nte);
    return !k || k.includes('GLOBAL') || k.includes('TODOSOSNTES') || k === 'SEC';
  }

  function getNomeEscola(e){ return norm(e && (e.nome || e.nome_escola || e.instituicao || e.escola)); }
  function getMec(e){ return String((e && (e.cod_mec || e.codigo_mec || e.mec)) || '').trim(); }
  function getMunicipio(e){ return norm(e && e.municipio); }
  function getNte(e){ return String((e && (e.nte || e.nte_nome || e.nte_id)) || '').trim(); }

  function escolasPermitidasParaUsuario(){
    const escolas = Array.isArray(window.escolasDB) ? window.escolasDB : (typeof escolasDB !== 'undefined' && Array.isArray(escolasDB) ? escolasDB : []);
    const usuario = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    const nteUsuario = usuario && (usuario.nte || usuario.nte_nome || usuario.nte_id);

    // Regra solicitada: a pesquisa da escola deve respeitar o NTE do usuário cadastrado.
    // Exceção técnica: usuário sem NTE/global mantém acesso ao catálogo para não bloquear Master/SEC sem NTE definido.
    if (!usuario || isNteGlobal(nteUsuario)) return escolas;

    const chaveUsuario = nteKey(nteUsuario);
    return escolas.filter(e => nteKey(getNte(e)) === chaveUsuario);
  }

  function montarItem(e){
    return {
      escola: e,
      nome: getNomeEscola(e),
      mec: getMec(e),
      municipio: getMunicipio(e),
      nte: getNte(e)
    };
  }

  function cacheAutocomplete(){
    return escolasPermitidasParaUsuario()
      .map(montarItem)
      .filter(x => x.nome || x.mec)
      .sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function garantirAutocompleteEscola(){
    const select = document.getElementById(SELECT_ID);
    if (!select || !select.parentNode) return null;

    let input = document.getElementById(INPUT_ID);
    let lista = document.getElementById(LISTA_ID);

    // Remove campos antigos de autocomplete para evitar duplicidade visual.
    ['novo-proc-escola-busca-v23', 'novo-proc-escola-lista-v23'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.id !== INPUT_ID && el.id !== LISTA_ID) el.remove();
    });

    if (!input) {
      input = document.createElement('input');
      input.type = 'text';
      input.id = INPUT_ID;
      input.autocomplete = 'off';
      input.placeholder = 'Digite o nome da escola, código MEC ou município...';
      input.className = 'w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold mb-1';
      select.parentNode.insertBefore(input, select);
    }

    if (!lista) {
      lista = document.createElement('div');
      lista.id = LISTA_ID;
      lista.className = 'hidden max-h-56 overflow-y-auto border rounded-lg bg-white shadow-lg text-xs z-[10000]';
      lista.style.display = 'none';
      select.parentNode.insertBefore(lista, select.nextSibling);
    }

    select.classList.add('hidden');
    select.required = false;

    input.oninput = function(){
      input.dataset.escolaSelecionada = '';
      select.value = '';
      renderizarSugestoes(input.value);
    };
    input.onfocus = function(){ renderizarSugestoes(input.value); };
    input.onclick = function(ev){ ev.stopPropagation(); renderizarSugestoes(input.value); };
    lista.onclick = function(ev){ ev.stopPropagation(); };

    if (!window.__SIGEE_V31_4_CLICK_FORA_ESCOLA__) {
      window.__SIGEE_V31_4_CLICK_FORA_ESCOLA__ = true;
      document.addEventListener('click', function(ev){
        const campo = document.getElementById(INPUT_ID);
        const painel = document.getElementById(LISTA_ID);
        if (!campo || !painel) return;
        if (ev.target !== campo && !painel.contains(ev.target)) fecharSugestoes();
      });
    }

    return input;
  }

  function fecharSugestoes(){
    const lista = document.getElementById(LISTA_ID);
    if (lista) { lista.classList.add('hidden'); lista.style.display = 'none'; }
  }

  function renderizarSugestoes(termo){
    const lista = document.getElementById(LISTA_ID);
    if (!lista) return;

    const q = norm(termo);
    let resultados = cacheAutocomplete();
    if (q) {
      resultados = resultados.filter(x => x.nome.includes(q) || x.municipio.includes(q) || x.mec.includes(q) || norm(x.nte).includes(q));
    }
    resultados = resultados.slice(0, 80);

    lista.innerHTML = '';
    if (!resultados.length) {
      lista.innerHTML = '<div class="p-2 text-gray-500 font-semibold">Nenhuma escola localizada para o NTE do usuário.</div>';
      lista.classList.remove('hidden'); lista.style.display = 'block';
      return;
    }

    const frag = document.createDocumentFragment();
    resultados.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'block w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 text-gray-800 bg-white';
      btn.innerHTML = `<span class="font-bold">${item.nome}</span><br><span class="text-[10px] text-gray-500">MEC: ${item.mec || '-'} | ${item.municipio || '-'} | ${item.nte || '-'}</span>`;
      btn.onmousedown = function(ev){ ev.preventDefault(); ev.stopPropagation(); selecionarEscola(item); };
      frag.appendChild(btn);
    });
    lista.appendChild(frag);
    lista.classList.remove('hidden'); lista.style.display = 'block';
  }

  function selecionarEscola(item){
    const input = document.getElementById(INPUT_ID);
    const select = document.getElementById(SELECT_ID);
    if (!select) return;

    if (input) {
      input.value = item.nome;
      input.dataset.escolaSelecionada = '1';
    }

    select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = item.nome;
    opt.textContent = item.nome;
    opt.selected = true;
    select.appendChild(opt);
    select.value = item.nome;

    fecharSugestoes();
    if (typeof window.handleSelecaoInstituicaoFluxoAutomatico === 'function') window.handleSelecaoInstituicaoFluxoAutomatico();
    else if (typeof handleSelecaoInstituicaoFluxoAutomatico === 'function') handleSelecaoInstituicaoFluxoAutomatico();
  }

  // Sobrescreve/integra as funções antigas sem remover regras do sistema.
  window.garantirCampoBuscaInstituicaoSIGEE_V23 = garantirAutocompleteEscola;
  window.prepararCacheEscolasModalSIGEE_V23 = function(){ return cacheAutocomplete(); };
  window.renderizarSugestoesEscolaSIGEE_V23 = renderizarSugestoes;
  window.renderizarSugestoesEscolaSIGEE_V24 = renderizarSugestoes;
  window.selecionarInstituicaoSIGEE_V23 = selecionarEscola;
  window.selecionarInstituicaoSIGEE_V24 = selecionarEscola;

  // Reforça abertura da nova solicitação com autocomplete filtrado por NTE.
  const abrirOriginal = window.abrirFormularioNovaSolicitacao;
  window.abrirFormularioNovaSolicitacao = function(){
    if (typeof abrirOriginal === 'function') abrirOriginal.apply(this, arguments);
    setTimeout(function(){
      const input = garantirAutocompleteEscola();
      const select = document.getElementById(SELECT_ID);
      if (input) { input.value = ''; input.dataset.escolaSelecionada = ''; }
      if (select) select.innerHTML = '<option value="" selected>SELECIONE A INSTITUIÇÃO</option>';
      fecharSugestoes();
    }, 80);
  };

  // Validação extra: não permite salvar escola fora do NTE permitido nem texto livre não selecionado.
  const salvarOriginal = window.salvarNovaSolicitacao;
  window.salvarNovaSolicitacao = function(event){
    const input = document.getElementById(INPUT_ID);
    const select = document.getElementById(SELECT_ID);
    const nomeSelecionado = norm(select && select.value);
    const permitidas = cacheAutocomplete();
    const existePermitida = permitidas.some(x => x.nome === nomeSelecionado);

    if (!nomeSelecionado || !existePermitida || (input && input.dataset.escolaSelecionada !== '1')) {
      if (event && event.preventDefault) event.preventDefault();
      alert('Selecione uma escola válida na lista de autocomplete do NTE do usuário.');
      return false;
    }
    return salvarOriginal.apply(this, arguments);
  };

  document.addEventListener('DOMContentLoaded', garantirAutocompleteEscola);
})();
