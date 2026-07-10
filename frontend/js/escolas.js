/* =====================================================================
   SIGEE Enterprise 2.0 - Sprint 2.2
   Módulo: Escolas
   Produção: catálogo paginado, filtro por NTE e autocomplete da Nova Solicitação.
   Substitui a lógica dependente de listas locais grandes e evita limite de 1000 registros.
   ===================================================================== */
(function () {
  'use strict';

  let paginaAtual = 1;
  const porPagina = 25;
  let totalAtual = 0;
  let cachePagina = [];
  let ultimaBusca = '';

  function texto(v) { return (v === null || v === undefined) ? '' : String(v).trim(); }
  function normalizar(v) { return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim(); }
  function somenteDigitos(v) { return texto(v).replace(/\D+/g, ''); }
  function escapeHtml(v) { return texto(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function perfilAtual() {
    const u = window.usuarioLogado || {};
    const p = normalizar(u.perfil);
    if (p === 'TECNICO' || p === 'TÉCNICO') return 'TECNICO';
    if (p === 'ADMINISTRADOR') return 'ADMINISTRADOR';
    if (p === 'CONSULTA') return 'CONSULTA';
    if (p === 'MASTER') return 'MASTER';
    if (p === 'SEC') return 'SEC';
    return p;
  }
  function isGlobal() { const p = perfilAtual(); return p === 'MASTER' || p === 'SEC'; }
  function isTecnico() { return perfilAtual() === 'TECNICO'; }
  function podeCadastrarEditar() { const p = perfilAtual(); return ['MASTER','SEC','ADMINISTRADOR','TECNICO'].includes(p); }
  function podeEditarCompleto() { const p = perfilAtual(); return ['MASTER','SEC','ADMINISTRADOR'].includes(p); }
  function podeEditarLimitado() { return isTecnico() && !podeEditarCompleto(); }
  function nteIdUsuario() {
    const u = window.usuarioLogado || {};
    const direto = Number(u.nte_id || u.nteId || u.id_nte || 0);
    if (direto) return direto;
    const extraido = Number((texto(u.nte || u.grupo || u.nte_nome).match(/\d{1,2}/) || [0])[0]);
    return extraido || null;
  }
  function nteTextoUsuario() {
    const id = nteIdUsuario();
    if (id) return 'NTE ' + String(id).padStart(2, '0');
    return texto((window.usuarioLogado || {}).nte || (window.usuarioLogado || {}).grupo || (window.usuarioLogado || {}).nte_nome);
  }
  function supabaseClient() {
    try {
      if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') return window.SIGEE_SUPABASE.criarCliente();
      if (typeof window.criarClienteSupabaseSIGEE === 'function') return window.criarClienteSupabaseSIGEE();
      if (typeof window.obterSupabaseSIGEE === 'function') return window.obterSupabaseSIGEE();
    } catch (e) { console.warn('[SIGEE Escolas] Cliente Supabase indisponível:', e); }
    return null;
  }
  function tabelaEscolas() {
    return window.SIGEE_CONFIG?.supabase?.tabelas?.escolas || 'escolas_sigee';
  }
  function escolaNome(e) { return texto(e?.nome_escola || e?.nome || e?.escola || e?.instituicao); }
  function escolaNte(e) { return texto(e?.nte || (e?.nte_id ? 'NTE ' + String(e.nte_id).padStart(2, '0') : '')); }
  function escolaDep(e) { return texto(e?.dependencia_adm || e?.dependencia || ''); }
  function escolaSituacao(e) { return texto(e?.situacao_funcional || e?.situacao || ''); }
  function escolaAcervo(e) { return texto(e?.status_acervo || e?.acervo || ''); }
  function escolaLocal(e) { return texto(e?.local_acervo || ''); }
  function badge(valor, tipo) {
    const v = texto(valor) || '-';
    const n = normalizar(v);
    let cls = 'bg-gray-700 text-white';
    if (tipo === 'situacao') {
      if (n.includes('ATIVA')) cls = 'bg-emerald-700 text-white';
      if (n.includes('EXTINTA')) cls = 'bg-red-700 text-white';
    }
    if (tipo === 'acervo') {
      if (n.includes('RECOLHIDO')) cls = 'bg-emerald-700 text-white';
      if (n.includes('NAO') || n.includes('NÃO')) cls = 'bg-red-700 text-white';
    }
    return `<span class="px-2 py-1 rounded-full text-[10px] font-black ${cls}">${escapeHtml(v.toUpperCase())}</span>`;
  }
  function upsertCacheLocal(escola) {
    if (!escola) return;
    window.escolasDB = Array.isArray(window.escolasDB) ? window.escolasDB : [];
    try { if (typeof escolasDB !== 'undefined' && !Array.isArray(escolasDB)) escolasDB = window.escolasDB; } catch (e) {}
    const idx = window.escolasDB.findIndex(x => String(x.id || '') === String(escola.id || '') || (texto(x.cod_mec) && texto(x.cod_mec) === texto(escola.cod_mec)));
    if (idx >= 0) window.escolasDB[idx] = { ...window.escolasDB[idx], ...escola };
    else window.escolasDB.push(escola);
    try { escolasDB = window.escolasDB; } catch (e) {}
  }
  function aplicarFiltrosQuery(query, termo) {
    const nteId = nteIdUsuario();
    if (!isGlobal()) {
      if (nteId) query = query.eq('nte_id', nteId);
      else if (nteTextoUsuario()) query = query.eq('nte', nteTextoUsuario());
    }
    const busca = texto(termo);
    if (busca) {
      const safe = busca.replace(/[,%]/g, ' ').trim();
      if (safe) {
        query = query.or([
          `nome_escola.ilike.%${safe}%`,
          `nome.ilike.%${safe}%`,
          `municipio.ilike.%${safe}%`,
          `cod_mec.ilike.%${safe}%`,
          `nte.ilike.%${safe}%`
        ].join(','));
      }
    }
    return query;
  }
  async function buscarEscolas(termo = '', page = paginaAtual, limit = porPagina) {
    const client = supabaseClient();
    if (!client) return buscarEscolasLocal(termo, page, limit);
    const inicio = (page - 1) * limit;
    let query = client
      .from(tabelaEscolas())
      .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo,ativo', { count: 'exact' });
    query = aplicarFiltrosQuery(query, termo);
    query = query.order('nome_escola', { ascending: true, nullsFirst: false }).range(inicio, inicio + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    const lista = data || [];
    lista.forEach(upsertCacheLocal);
    return { lista, total: count ?? lista.length };
  }
  function buscarEscolasLocal(termo = '', page = paginaAtual, limit = porPagina) {
    let lista = Array.isArray(window.escolasDB) ? window.escolasDB.slice() : [];
    if (!isGlobal()) {
      const nteId = nteIdUsuario();
      const nt = normalizar(nteTextoUsuario()).replace(/\s/g, '');
      lista = lista.filter(e => (nteId && Number(e.nte_id) === nteId) || normalizar(escolaNte(e)).replace(/\s/g, '') === nt);
    }
    const b = normalizar(termo);
    if (b) lista = lista.filter(e => [e.cod_mec, escolaNome(e), e.municipio, escolaNte(e)].some(v => normalizar(v).includes(b)));
    lista.sort((a,b) => escolaNome(a).localeCompare(escolaNome(b), 'pt-BR'));
    const total = lista.length;
    const ini = (page - 1) * limit;
    return { lista: lista.slice(ini, ini + limit), total };
  }
  function desenharTabela(lista) {
    const corpo = document.getElementById('tabela-escolas-corpo');
    if (!corpo) return;
    corpo.innerHTML = (lista || []).map(e => {
      const botao = podeCadastrarEditar()
        ? `<button onclick="abrirModalEditarEscolaSIGEE(${Number(e.id) || `'${escapeHtml(e.cod_mec)}'`})" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded text-[10px] font-bold">Alterar</button>`
        : `<span class="text-gray-400 text-[10px] font-bold">Consulta</span>`;
      return `<tr class="hover:bg-white/10 text-[11px] text-white border-b border-white/10">
        <td class="p-3 font-mono font-bold">${escapeHtml(e.cod_mec)}</td>
        <td class="p-3 font-bold uppercase">${escapeHtml(escolaNome(e))}</td>
        <td class="p-3 uppercase font-medium">${escapeHtml(texto(e.municipio).toUpperCase())}</td>
        <td class="p-3 font-semibold text-blue-100">${escapeHtml(escolaNte(e))}<br><span class="text-[9px] bg-white/10 font-bold px-1 rounded">${escapeHtml(escolaDep(e))}</span></td>
        <td class="p-3">${badge(escolaSituacao(e), 'situacao')}</td>
        <td class="p-3">${badge(escolaAcervo(e), 'acervo')}<br><small class="text-blue-100">${escapeHtml(escolaLocal(e))}</small></td>
        <td class="p-3 text-center">${botao}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="7" class="p-6 text-center text-gray-400 font-bold">Nenhuma escola encontrada.</td></tr>`;
  }
  function atualizarPaginacao() {
    const totalPaginas = Math.max(1, Math.ceil(totalAtual / porPagina));
    const pag = document.getElementById('txt-escola-paginacao');
    if (pag) pag.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
    const ant = document.getElementById('btn-escola-anterior');
    const prox = document.getElementById('btn-escola-proxima');
    if (ant) ant.disabled = paginaAtual <= 1;
    if (prox) prox.disabled = paginaAtual >= totalPaginas;
    const info = document.getElementById('info-quantidade-escolas-carregadas');
    if (info) {
      const escopo = isGlobal() ? 'Global' : nteTextoUsuario();
      info.innerText = `Exibindo ${cachePagina.length} de ${totalAtual} registros | ${escopo}`;
    }
  }
  async function renderizarLista() {
    const corpo = document.getElementById('tabela-escolas-corpo');
    if (!corpo) return;
    const buscaEl = document.getElementById('busca-escola');
    const busca = texto(buscaEl ? buscaEl.value : '');
    ultimaBusca = busca;
    corpo.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-blue-100 font-bold">Carregando escolas...</td></tr>`;
    try {
      const resp = await buscarEscolas(busca, paginaAtual, porPagina);
      cachePagina = resp.lista || [];
      totalAtual = resp.total || 0;
      desenharTabela(cachePagina);
      atualizarPaginacao();
    } catch (e) {
      console.error('[SIGEE Escolas] Falha ao carregar catálogo:', e);
      corpo.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-200 font-bold">Erro ao carregar escolas.</td></tr>`;
    }
  }
  function filtrar() { paginaAtual = 1; renderizarLista(); }
  function mudarPagina(dir) {
    const totalPaginas = Math.max(1, Math.ceil(totalAtual / porPagina));
    paginaAtual = Math.min(totalPaginas, Math.max(1, paginaAtual + Number(dir || 0)));
    renderizarLista();
  }
  function garantirModalEscola() {
    if (document.getElementById('modal-cadastro-escola')) return;
    const div = document.createElement('div');
    div.id = 'modal-cadastro-escola';
    div.className = 'hidden fixed inset-0 bg-blue-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50';
    div.innerHTML = `<div class="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
      <div class="bg-blue-900 text-white px-5 py-4 flex justify-between items-center"><h3 class="font-bold text-sm">🏫 Cadastrar/Editar Escola</h3><button onclick="fecharModalEscola()" class="text-white font-bold cursor-pointer">✕</button></div>
      <form onsubmit="salvarEscolaFormularioSIGEE(event)" class="p-5 space-y-3">
        <input type="hidden" id="escola-form-id">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código MEC</label><input id="escola-form-mec" class="w-full p-2 border rounded text-xs font-bold"></div><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Município</label><input id="escola-form-municipio" class="w-full p-2 border rounded text-xs font-bold uppercase"></div></div>
        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Escola</label><input id="escola-form-nome" class="w-full p-2 border rounded text-xs font-bold uppercase"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">NTE</label><input id="escola-form-nte" class="w-full p-2 border rounded text-xs font-bold"></div><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Dependência</label><input id="escola-form-dep" class="w-full p-2 border rounded text-xs font-bold"></div></div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3"><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação</label><select id="escola-form-situacao" class="w-full p-2 border rounded text-xs font-bold"><option>Ativa</option><option>Extinta</option></select></div><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status do Acervo</label><select id="escola-form-acervo" class="w-full p-2 border rounded text-xs font-bold"><option>Recolhido</option><option>Não recolhido</option><option>Não acolhido</option></select></div><div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Local do Acervo</label><input id="escola-form-local" class="w-full p-2 border rounded text-xs font-bold"></div></div>
        <div class="flex justify-end gap-2 border-t pt-3"><button type="button" onclick="fecharModalEscola()" class="px-4 py-2 border rounded-lg text-xs font-semibold bg-gray-100">Cancelar</button><button type="submit" class="bg-blue-900 text-white font-bold px-5 py-2 rounded-lg text-xs shadow">Salvar Escola</button></div>
      </form></div>`;
    document.body.appendChild(div);
  }
  function setDisabled(ids, disabled) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = disabled; }); }
  async function obterEscolaPorId(id) {
    const local = (Array.isArray(window.escolasDB) ? window.escolasDB : []).find(x => String(x.id) === String(id) || texto(x.cod_mec) === texto(id));
    if (local) return local;
    const client = supabaseClient();
    if (!client) return null;
    let query = client.from(tabelaEscolas()).select('*').limit(1);
    if (somenteDigitos(id)) query = query.eq('id', Number(id)); else query = query.eq('cod_mec', texto(id));
    const { data, error } = await query;
    if (error) throw error;
    const e = (data || [])[0] || null;
    if (e) upsertCacheLocal(e);
    return e;
  }
  function abrirNovaEscola() {
    if (!podeCadastrarEditar()) return alert('Perfil sem permissão para cadastrar escola.');
    garantirModalEscola();
    ['id','mec','nome','municipio','nte','dep','local'].forEach(k => { const el = document.getElementById(`escola-form-${k}`); if (el) el.value = ''; });
    const nteEl = document.getElementById('escola-form-nte');
    if (nteEl && !isGlobal()) nteEl.value = nteTextoUsuario();
    setDisabled(['escola-form-mec','escola-form-nome','escola-form-municipio','escola-form-nte','escola-form-dep'], false);
    document.getElementById('modal-cadastro-escola').classList.remove('hidden');
  }
  async function abrirEditarEscola(id) {
    if (!podeCadastrarEditar()) return alert('Perfil sem permissão para alterar escola.');
    garantirModalEscola();
    let e;
    try { e = await obterEscolaPorId(id); } catch (err) { console.error(err); }
    if (!e) return alert('Escola não localizada.');
    if (!isGlobal()) {
      const nteId = nteIdUsuario();
      if (nteId && Number(e.nte_id) !== nteId) return alert('Acesso permitido apenas às escolas do seu NTE.');
    }
    document.getElementById('escola-form-id').value = e.id || '';
    document.getElementById('escola-form-mec').value = texto(e.cod_mec);
    document.getElementById('escola-form-nome').value = escolaNome(e);
    document.getElementById('escola-form-municipio').value = texto(e.municipio);
    document.getElementById('escola-form-nte').value = escolaNte(e);
    document.getElementById('escola-form-dep').value = escolaDep(e);
    document.getElementById('escola-form-situacao').value = escolaSituacao(e) || 'Extinta';
    document.getElementById('escola-form-acervo').value = escolaAcervo(e) || 'Recolhido';
    document.getElementById('escola-form-local').value = escolaLocal(e);
    setDisabled(['escola-form-mec','escola-form-nome','escola-form-municipio','escola-form-nte','escola-form-dep'], podeEditarLimitado());
    document.getElementById('modal-cadastro-escola').classList.remove('hidden');
  }
  async function salvarEscola(event) {
    event.preventDefault();
    const id = texto(document.getElementById('escola-form-id')?.value);
    const existente = id ? await obterEscolaPorId(id) : null;
    const payload = existente ? { ...existente } : {};
    if (!existente || podeEditarCompleto()) {
      payload.cod_mec = texto(document.getElementById('escola-form-mec').value);
      payload.nome_escola = texto(document.getElementById('escola-form-nome').value).toUpperCase();
      payload.nome = payload.nome_escola;
      payload.municipio = texto(document.getElementById('escola-form-municipio').value);
      payload.nte = texto(document.getElementById('escola-form-nte').value || nteTextoUsuario());
      payload.nte_id = Number((payload.nte.match(/\d{1,2}/) || [payload.nte_id || nteIdUsuario() || 0])[0]) || payload.nte_id || nteIdUsuario();
      payload.dependencia_adm = texto(document.getElementById('escola-form-dep').value);
      payload.dependencia = payload.dependencia_adm;
    }
    payload.situacao_funcional = texto(document.getElementById('escola-form-situacao').value);
    payload.situacao = payload.situacao_funcional;
    payload.status_acervo = texto(document.getElementById('escola-form-acervo').value);
    payload.acervo = payload.status_acervo;
    payload.local_acervo = texto(document.getElementById('escola-form-local').value);
    if (id) payload.id = Number(id) || id;
    const client = supabaseClient();
    try {
      if (client) {
        const { data, error } = await client.from(tabelaEscolas()).upsert(payload, { onConflict: payload.id ? 'id' : 'cod_mec' }).select().limit(1);
        if (error) throw error;
        if (data && data[0]) Object.assign(payload, data[0]);
      }
      upsertCacheLocal(payload);
      if (typeof registrarLog === 'function') registrarLog(`${existente ? 'Alterou' : 'Cadastrou'} escola: ${payload.nome_escola || payload.nome}`);
      fecharModal();
      renderizarLista();
      if (typeof window.carregarDadosDashboardReal === 'function') window.carregarDadosDashboardReal();
    } catch (e) {
      console.error('[SIGEE Escolas] Falha ao salvar escola:', e);
      alert('Não foi possível salvar a escola. Verifique o console.');
    }
  }
  function fecharModal() { const m = document.getElementById('modal-cadastro-escola'); if (m) m.classList.add('hidden'); }

  function preencherAutofillNovaSolicitacao(e) {
    if (!e) return;
    upsertCacheLocal(e);
    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.value = valor || ''; };
    set('novo-autofill-mec', e.cod_mec || '');
    set('novo-autofill-nte', escolaNte(e));
    set('novo-autofill-municipio', e.municipio || '');
    set('novo-autofill-dep', escolaDep(e));
    set('novo-autofill-situacao', escolaSituacao(e));
    set('novo-autofill-acervo', escolaAcervo(e).toUpperCase());
    set('novo-autofill-local-acervo', escolaLocal(e));
    const select = document.getElementById('novo-proc-escola');
    const nome = escolaNome(e);
    if (select) {
      select.innerHTML = `<option selected value="${escapeHtml(nome)}">${escapeHtml(nome)}</option>`;
      select.value = nome;
    }
    const btn = document.getElementById('btn-submeter-nova-solicitacao');
    if (btn) btn.disabled = false;
    try { if (typeof aplicarClasseStatusAcervoSIGEE === 'function') aplicarClasseStatusAcervoSIGEE(); } catch (err) {}
  }
  function garantirAutocompleteNovaSolicitacao() {
    const select = document.getElementById('novo-proc-escola');
    if (!select) return;
    select.style.display = 'none';
    let input = document.getElementById('novo-proc-escola-busca-v23') || document.getElementById('novo-proc-escola-busca-sigee');
    if (!input) {
      input = document.createElement('input');
      input.id = 'novo-proc-escola-busca-v23';
      input.type = 'text';
      input.placeholder = 'Digite pelo menos 2 letras para pesquisar a escola...';
      input.className = select.className || 'w-full p-2 rounded border';
      select.parentNode.insertBefore(input, select);
    }
    let lista = document.getElementById('novo-proc-escola-resultados-sigee') || document.getElementById('novo-proc-escola-sugestoes-v23');
    if (!lista) {
      lista = document.createElement('div');
      lista.id = 'novo-proc-escola-resultados-sigee';
      lista.className = 'mt-1 max-h-64 overflow-y-auto rounded-lg border border-cyan-700 bg-slate-950 text-white shadow-xl text-xs';
      input.insertAdjacentElement('afterend', lista);
    }
    let timer = null;
    input.oninput = function () {
      clearTimeout(timer);
      const termo = texto(input.value);
      if (termo.length < 2) { lista.innerHTML = '<div class="p-2 text-blue-100">Digite pelo menos 2 letras.</div>'; return; }
      lista.innerHTML = '<div class="p-2 text-blue-100">Pesquisando...</div>';
      timer = setTimeout(async () => {
        try {
          const resp = await buscarEscolas(termo, 1, 20);
          const resultados = resp.lista || [];
          lista.innerHTML = resultados.length ? resultados.map((e, i) => `<button type="button" data-i="${i}" class="block w-full text-left px-3 py-2 hover:bg-cyan-900 border-b border-white/10"><strong>${escapeHtml(escolaNome(e))}</strong><br><span class="text-cyan-200">MEC: ${escapeHtml(e.cod_mec)} | ${escapeHtml(e.municipio)} | ${escapeHtml(escolaNte(e))}</span></button>`).join('') : '<div class="p-2 text-blue-100">Nenhuma escola localizada.</div>';
          Array.from(lista.querySelectorAll('button[data-i]')).forEach(btn => {
            btn.onclick = () => { const e = resultados[Number(btn.dataset.i)]; input.value = escolaNome(e); lista.innerHTML = ''; preencherAutofillNovaSolicitacao(e); };
          });
        } catch (e) {
          console.error('[SIGEE Escolas] Falha no autocomplete:', e);
          lista.innerHTML = '<div class="p-2 text-red-200">Erro ao pesquisar escola.</div>';
        }
      }, 250);
    };
  }
  function abrirFormularioNovaSolicitacaoSIGEE() {
    const modal = document.getElementById('modal-nova-solicitacao');
    if (!modal) return;
    const aluno = document.getElementById('novo-proc-aluno'); if (aluno) aluno.value = '';
    ['novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const btn = document.getElementById('btn-submeter-nova-solicitacao'); if (btn) btn.disabled = true;
    modal.classList.remove('hidden');
    setTimeout(garantirAutocompleteNovaSolicitacao, 30);
  }
  function handleSelecaoInstituicaoSIGEE() {
    const select = document.getElementById('novo-proc-escola');
    const input = document.getElementById('novo-proc-escola-busca-v23');
    const valor = texto(select?.value || input?.value);
    const esc = (window.escolasDB || []).find(e => normalizar(escolaNome(e)) === normalizar(valor) || texto(e.cod_mec) === texto(valor));
    if (esc) preencherAutofillNovaSolicitacao(esc);
  }

  function protegerCamposPesquisaEscolaContraAutofill() {
    const ids = [
      'busca-escola',
      'novo-proc-escola-busca-v23',
      'novo-proc-escola-busca-sigee'
    ];

    const emailLogado = texto((window.usuarioLogado || {}).email).toLowerCase();

    ids.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;

      // Impede que gerenciadores de senha tratem a pesquisa de escola como login.
      input.type = 'search';
      input.autocomplete = 'new-password';
      input.setAttribute('autocapitalize', 'none');
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('inputmode', 'search');
      input.setAttribute('role', 'searchbox');
      input.setAttribute('data-form-type', 'other');
      input.setAttribute('data-lpignore', 'true');
      input.setAttribute('data-1p-ignore', 'true');
      input.name = `sigee_pesquisa_escola_${id}`;

      const limparEmailPreenchido = () => {
        const valor = texto(input.value).toLowerCase();
        const pareceEmailInstitucional = valor.includes('@enova.educacao.ba.gov.br');
        if ((emailLogado && valor === emailLogado) || pareceEmailInstitucional) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      limparEmailPreenchido();
      setTimeout(limparEmailPreenchido, 50);
      setTimeout(limparEmailPreenchido, 300);
      input.addEventListener('focus', limparEmailPreenchido, { passive: true });
    });
  }

  function observarCamposPesquisaEscola() {
    protegerCamposPesquisaEscolaContraAutofill();
    if (window.__SIGEE_OBSERVER_PESQUISA_ESCOLA__) return;
    window.__SIGEE_OBSERVER_PESQUISA_ESCOLA__ = true;

    const observer = new MutationObserver(() => {
      protegerCamposPesquisaEscolaContraAutofill();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function aplicarModulo() {
    observarCamposPesquisaEscola();
    window.renderizarListaEscolasBufferMemoria = renderizarLista;
    window.filtrarPorBusca = filtrar;
    window.mudarPaginaEscola = mudarPagina;
    window.abrirModalNovaEscola = abrirNovaEscola;
    window.abrirModalEditarEscolaSIGEE = abrirEditarEscola;
    window.salvarEscolaFormularioSIGEE = salvarEscola;
    window.fecharModalEscola = fecharModal;
    window.abrirFormularioNovaSolicitacao = abrirFormularioNovaSolicitacaoSIGEE;
    window.handleSelecaoInstituicaoFluxoAutomatico = handleSelecaoInstituicaoSIGEE;
  }
  window.SIGEE_Escolas = {
    renderizar: renderizarLista,
    buscar: buscarEscolas,
    abrirNova: abrirNovaEscola,
    abrirEditar: abrirEditarEscola,
    salvar: salvarEscola,
    autocompleteNovaSolicitacao: garantirAutocompleteNovaSolicitacao
  };
  window.addEventListener('load', aplicarModulo);
/* ============================================================
   SIGEE - Nova Solicitação com pesquisa digitável de escola
   Usa a mesma lógica do Catálogo e respeita o NTE do usuário
   ============================================================ */

(function instalarNovaSolicitacaoDigitavelSIGEE() {
    let timerBuscaEscola = null;

    function campo(id) {
        return document.getElementById(id);
    }

    function limparAutofillNovaSolicitacao() {
        [
            'novo-autofill-mec',
            'novo-autofill-nte',
            'novo-autofill-municipio',
            'novo-autofill-dep',
            'novo-autofill-situacao',
            'novo-autofill-acervo',
            'novo-autofill-local-acervo'
        ].forEach(id => {
            const el = campo(id);
            if (el) el.value = '';
        });
    }

    function escolaFormatada(e) {
        return {
            id: e.id,
            nome: texto(e.nome_escola || e.nome || e.escola || e.instituicao),
            cod_mec: texto(e.cod_mec),
            municipio: texto(e.municipio),
            nte: texto(e.nte || e.nte_nome),
            nte_id: e.nte_id,
            dependencia: texto(e.dependencia_adm || e.dependencia),
            situacao: texto(e.situacao_funcional || e.situacao),
            acervo: texto(e.status_acervo || e.acervo),
            local_acervo: texto(e.local_acervo)
        };
    }

    async function buscarEscolasNovaSolicitacao(termo) {
        const busca = texto(termo);

        if (window.SIGEE_CORE_V2 && typeof window.SIGEE_CORE_V2.queryEscolasBase === 'function') {
            return await window.SIGEE_CORE_V2.queryEscolasBase({
                termo: busca,
                limit: 30,
                offset: 0
            });
        }

        let lista = escolasVisiveis().map(escolaFormatada);

        if (busca.length >= 2) {
            const n = normalizar(busca);
            lista = lista.filter(e =>
                normalizar(e.nome).includes(n) ||
                normalizar(e.municipio).includes(n) ||
                normalizar(e.cod_mec).includes(n)
            );
        }

        return lista.slice(0, 30);
    }

    function preencherEscolaNovaSolicitacao(escola) {
        const select = campo('novo-proc-escola');
        const input = campo('novo-proc-escola-busca-v23');
        const lista = campo('novo-proc-escola-lista-v23');

        if (input) {
            input.value = escola.nome;
            input.dataset.escolaSelecionada = '1';
        }

        if (select) {
            select.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = escola.nome;
            opt.textContent = escola.nome;
            opt.selected = true;
            select.appendChild(opt);
            select.value = escola.nome;
        }

        if (lista) {
            lista.classList.add('hidden');
            lista.innerHTML = '';
        }

        const set = (id, valor) => {
            const el = campo(id);
            if (el) el.value = valor || '';
        };

        set('novo-autofill-mec', escola.cod_mec);
        set('novo-autofill-nte', escola.nte || (escola.nte_id ? `NTE ${String(escola.nte_id).padStart(2, '0')}` : ''));
        set('novo-autofill-municipio', escola.municipio);
        set('novo-autofill-dep', escola.dependencia);
        set('novo-autofill-situacao', escola.situacao);
        set('novo-autofill-acervo', escola.acervo);
        set('novo-autofill-local-acervo', escola.local_acervo);

        if (typeof aplicarClasseStatusAcervoSIGEE === 'function') {
            aplicarClasseStatusAcervoSIGEE();
        }

        if (typeof aplicarStatusBotaoNovaSolicitacaoV25 === 'function') {
            aplicarStatusBotaoNovaSolicitacaoV25();
        }
    }

    async function renderizarBuscaNovaSolicitacao(termo) {
        const lista = campo('novo-proc-escola-lista-v23');
        if (!lista) return;

        if (texto(termo).length < 2) {
            lista.innerHTML = '<div class="p-3 text-gray-500 font-semibold">Digite pelo menos 2 letras.</div>';
            lista.classList.remove('hidden');
            return;
        }

        lista.innerHTML = '<div class="p-3 text-gray-500 font-semibold">Pesquisando...</div>';
        lista.classList.remove('hidden');

        const resultados = await buscarEscolasNovaSolicitacao(termo);

        if (!resultados.length) {
            lista.innerHTML = '<div class="p-3 text-red-600 font-bold">Nenhuma escola encontrada.</div>';
            return;
        }

        lista.innerHTML = '';

        resultados.forEach(item => {
            const escola = escolaFormatada(item);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'block w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 bg-white';
            btn.innerHTML = `
                <div class="font-black text-blue-900">${escola.nome}</div>
                <div class="text-[10px] text-gray-600">
                    MEC: ${escola.cod_mec || '-'} | ${escola.municipio || '-'} | ${escola.nte || ''}
                </div>
            `;

            btn.onclick = () => preencherEscolaNovaSolicitacao(escola);
            lista.appendChild(btn);
        });
    }

    function prepararCampoEscolaNovaSolicitacao() {
        const select = campo('novo-proc-escola');
        if (!select) return;

        let input = campo('novo-proc-escola-busca-v23');
        let lista = campo('novo-proc-escola-lista-v23');

        if (!input) {
            input = document.createElement('input');
            input.type = 'text';
            input.id = 'novo-proc-escola-busca-v23';
            input.placeholder = 'Digite parte do nome da escola...';
            input.autocomplete = 'off';
            input.className = 'w-full p-2 border rounded-lg text-xs font-semibold bg-white mb-1';
            select.parentNode.insertBefore(input, select);
        }

        if (!lista) {
            lista = document.createElement('div');
            lista.id = 'novo-proc-escola-lista-v23';
            lista.className = 'hidden max-h-56 overflow-y-auto border rounded-lg bg-white shadow-lg text-xs z-[9999]';
            select.parentNode.insertBefore(lista, select.nextSibling);
        }

        select.classList.add('hidden');
        select.required = false;

        input.oninput = function () {
            input.dataset.escolaSelecionada = '';
            select.innerHTML = '<option value="">SELECIONE A INSTITUIÇÃO</option>';
            limparAutofillNovaSolicitacao();

            clearTimeout(timerBuscaEscola);
            timerBuscaEscola = setTimeout(() => {
                renderizarBuscaNovaSolicitacao(input.value);
            }, 300);
        };

        input.onfocus = function () {
            renderizarBuscaNovaSolicitacao(input.value);
        };
    }

    window.abrirFormularioNovaSolicitacao = function () {
        const modal = campo('modal-nova-solicitacao');
        if (!modal) return;

        modal.classList.remove('hidden');

        prepararCampoEscolaNovaSolicitacao();
        protegerCamposPesquisaEscolaContraAutofill();

        const input = campo('novo-proc-escola-busca-v23');
        const select = campo('novo-proc-escola');

        if (input) {
            input.value = '';
            input.dataset.escolaSelecionada = '';
        }

        if (select) {
            select.innerHTML = '<option value="">SELECIONE A INSTITUIÇÃO</option>';
            select.value = '';
        }

        const aluno = campo('novo-proc-aluno');
        if (aluno) aluno.value = '';

        ['novo-proc-documento', 'novo-proc-modalidade', 'novo-proc-ensino'].forEach(id => {
            const el = campo(id);
            if (el) el.value = '';
        });

        const chk = campo('f01-chk-acolhido');
        if (chk) chk.checked = false;

        const btn = campo('btn-submeter-nova-solicitacao');
        if (btn) btn.disabled = true;

        limparAutofillNovaSolicitacao();
    };
})();
})();
