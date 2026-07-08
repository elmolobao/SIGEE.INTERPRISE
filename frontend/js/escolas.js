/* =====================================================================
   SIGEE Enterprise 2.0 - Parte 3
   Módulo: Escolas
   Objetivo: centralizar catálogo, filtro por NTE e edição limitada do técnico.
   Este módulo é aplicado após o app legado sem alterar a base Supabase.
   ===================================================================== */
(function () {
    'use strict';

    let paginaAtualModulo = 1;
    const porPagina = 8;

    function texto(valor) { return (valor ?? '').toString().trim(); }
    function normalizar(valor) {
        return texto(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ');
    }
    function perfilAtual() {
        const p = normalizar(typeof usuarioLogado !== 'undefined' && usuarioLogado ? usuarioLogado.perfil : '');
        if (p === 'TECNICO') return 'TÉCNICO';
        return p;
    }
    function isSEC() { return perfilAtual() === 'SEC'; }
    function isMaster() { return perfilAtual() === 'MASTER'; }
    function isAdmin() { return perfilAtual() === 'ADMINISTRADOR'; }
    function isTecnico() { return perfilAtual() === 'TÉCNICO'; }
    function isConsulta() { return perfilAtual() === 'CONSULTA'; }
    function isGlobal() { return isSEC() || isMaster(); }
    function podeCadastrarEditar() { return isSEC() || isMaster() || isAdmin() || isTecnico(); }
    function podeEditarCompleto() { return isSEC() || isMaster() || isAdmin(); }
    function podeEditarLimitado() { return isTecnico(); }
    function nteUsuario() { return texto(usuarioLogado?.nte || usuarioLogado?.nte_nome || usuarioLogado?.grupo || ''); }
    function mesmoNte(escola) {
        if (isGlobal()) return true;
        const a = normalizar(nteUsuario());
        const b = normalizar(escola?.nte || escola?.nte_nome || escola?.grupo || '');
        return !!a && !!b && a === b;
    }
    function escolasVisiveis() {
        const lista = Array.isArray(typeof escolasDB !== 'undefined' ? escolasDB : []) ? escolasDB : [];
        return lista.filter(mesmoNte);
    }
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
        return `<span class="px-2 py-1 rounded-full text-[10px] font-black ${cls}">${v.toUpperCase()}</span>`;
    }

    function escolaNome(e) { return texto(e.nome_escola || e.nome || e.escola || e.instituicao); }
    function escolaNte(e) { return texto(e.nte || e.nte_nome || ''); }
    function escolaDep(e) { return texto(e.dependencia_adm || e.dependencia || ''); }
    function escolaSituacao(e) { return texto(e.situacao_funcional || e.situacao || ''); }
    function escolaAcervo(e) { return texto(e.status_acervo || e.acervo || ''); }
    function escolaLocal(e) { return texto(e.local_acervo || ''); }

    function renderizarLista() {
        const corpo = document.getElementById('tabela-escolas-corpo');
        if (!corpo) return;
        let lista = escolasVisiveis();
        const buscaEl = document.getElementById('busca-escola');
        const busca = normalizar(buscaEl ? buscaEl.value : '');
        if (busca) {
            lista = lista.filter(e => [e.cod_mec, escolaNome(e), e.municipio, escolaNte(e)].some(v => normalizar(v).includes(busca)));
        }
        const info = document.getElementById('info-quantidade-escolas-carregadas');
        if (info) info.innerText = `Exibindo: ${lista.length} registros`;

        const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
        if (paginaAtualModulo > totalPaginas) paginaAtualModulo = totalPaginas;
        if (paginaAtualModulo < 1) paginaAtualModulo = 1;
        const inicio = (paginaAtualModulo - 1) * porPagina;
        const pagina = lista.slice(inicio, inicio + porPagina);

        corpo.innerHTML = pagina.map(e => {
            const botao = podeCadastrarEditar()
                ? `<button onclick="abrirModalEditarEscolaSIGEE(${e.id})" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded text-[10px] font-bold">Alterar</button>`
                : `<span class="text-gray-400 text-[10px] font-bold">Consulta</span>`;
            return `
                <tr class="hover:bg-white/10 text-[11px] text-white border-b border-white/10">
                    <td class="p-3 font-mono font-bold">${texto(e.cod_mec)}</td>
                    <td class="p-3 font-bold uppercase">${escolaNome(e)}</td>
                    <td class="p-3 uppercase font-medium">${texto(e.municipio).toUpperCase()}</td>
                    <td class="p-3 font-semibold text-blue-100">${escolaNte(e)}<br><span class="text-[9px] bg-white/10 font-bold px-1 rounded">${escolaDep(e)}</span></td>
                    <td class="p-3">${badge(escolaSituacao(e), 'situacao')}</td>
                    <td class="p-3">${badge(escolaAcervo(e), 'acervo')}<br><small class="text-blue-100">${escolaLocal(e)}</small></td>
                    <td class="p-3 text-center">${botao}</td>
                </tr>`;
        }).join('') || `<tr><td colspan="7" class="p-6 text-center text-gray-400 font-bold">Nenhuma escola encontrada.</td></tr>`;

        const pag = document.getElementById('txt-escola-paginacao');
        if (pag) pag.innerText = `Página ${paginaAtualModulo} de ${totalPaginas}`;
        const ant = document.getElementById('btn-escola-anterior');
        const prox = document.getElementById('btn-escola-proxima');
        if (ant) ant.disabled = paginaAtualModulo <= 1;
        if (prox) prox.disabled = paginaAtualModulo >= totalPaginas;
    }

    function filtrar() { paginaAtualModulo = 1; renderizarLista(); }
    function mudarPagina(dir) { paginaAtualModulo += dir; renderizarLista(); }

    function garantirModalEscola() {
        if (document.getElementById('modal-cadastro-escola')) return;
        const div = document.createElement('div');
        div.id = 'modal-cadastro-escola';
        div.className = 'hidden fixed inset-0 bg-blue-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50';
        div.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                <div class="bg-blue-900 text-white px-5 py-4 flex justify-between items-center">
                    <h3 id="titulo-modal-escola" class="font-bold text-sm">🏫 Cadastrar/Editar Escola</h3>
                    <button onclick="fecharModalEscola()" class="text-white font-bold cursor-pointer">✕</button>
                </div>
                <form onsubmit="salvarEscolaFormularioSIGEE(event)" class="p-5 space-y-3">
                    <input type="hidden" id="escola-form-id">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código MEC</label><input id="escola-form-mec" class="w-full p-2 border rounded text-xs font-bold"></div>
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Município</label><input id="escola-form-municipio" class="w-full p-2 border rounded text-xs font-bold uppercase"></div>
                    </div>
                    <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Escola</label><input id="escola-form-nome" class="w-full p-2 border rounded text-xs font-bold uppercase"></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">NTE</label><input id="escola-form-nte" class="w-full p-2 border rounded text-xs font-bold"></div>
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Dependência</label><input id="escola-form-dep" class="w-full p-2 border rounded text-xs font-bold"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação</label><select id="escola-form-situacao" class="w-full p-2 border rounded text-xs font-bold"><option>Ativa</option><option>Extinta</option></select></div>
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status do Acervo</label><select id="escola-form-acervo" class="w-full p-2 border rounded text-xs font-bold"><option>Recolhido</option><option>Não recolhido</option><option>Não acolhido</option></select></div>
                        <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Local do Acervo</label><input id="escola-form-local" class="w-full p-2 border rounded text-xs font-bold"></div>
                    </div>
                    <div class="flex justify-end gap-2 border-t pt-3">
                        <button type="button" onclick="fecharModalEscola()" class="px-4 py-2 border rounded-lg text-xs font-semibold bg-gray-100">Cancelar</button>
                        <button type="submit" class="bg-blue-900 text-white font-bold px-5 py-2 rounded-lg text-xs shadow">Salvar Escola</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(div);
    }

    function setDisabled(ids, disabled) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = disabled; }); }

    function abrirNovaEscola() {
        if (!podeCadastrarEditar()) { alert('Perfil sem permissão para cadastrar escola.'); return; }
        garantirModalEscola();
        ['id','mec','nome','municipio','nte','dep','local'].forEach(k => { const el = document.getElementById(`escola-form-${k}`); if (el) el.value = ''; });
        const nteEl = document.getElementById('escola-form-nte');
        if (nteEl && !isGlobal()) nteEl.value = nteUsuario();
        setDisabled(['escola-form-mec','escola-form-nome','escola-form-municipio','escola-form-nte','escola-form-dep'], false);
        document.getElementById('modal-cadastro-escola').classList.remove('hidden');
    }

    function abrirEditarEscola(id) {
        if (!podeCadastrarEditar()) { alert('Perfil sem permissão para alterar escola.'); return; }
        garantirModalEscola();
        const e = (Array.isArray(escolasDB) ? escolasDB : []).find(x => String(x.id) === String(id));
        if (!e) return alert('Escola não localizada.');
        if (!isGlobal() && !mesmoNte(e)) return alert('Acesso permitido apenas às escolas do seu NTE.');
        document.getElementById('escola-form-id').value = e.id;
        document.getElementById('escola-form-mec').value = texto(e.cod_mec);
        document.getElementById('escola-form-nome').value = escolaNome(e);
        document.getElementById('escola-form-municipio').value = texto(e.municipio);
        document.getElementById('escola-form-nte').value = escolaNte(e);
        document.getElementById('escola-form-dep').value = escolaDep(e);
        document.getElementById('escola-form-situacao').value = escolaSituacao(e) || 'Extinta';
        document.getElementById('escola-form-acervo').value = escolaAcervo(e) || 'Recolhido';
        document.getElementById('escola-form-local').value = escolaLocal(e);
        const limitado = podeEditarLimitado() && !podeEditarCompleto();
        setDisabled(['escola-form-mec','escola-form-nome','escola-form-municipio','escola-form-nte','escola-form-dep'], limitado);
        document.getElementById('modal-cadastro-escola').classList.remove('hidden');
    }

    async function salvarEscola(event) {
        event.preventDefault();
        const id = document.getElementById('escola-form-id').value;
        const existente = id ? (escolasDB || []).find(e => String(e.id) === String(id)) : null;
        const payload = existente ? { ...existente } : { id: (escolasDB?.length ? Math.max(...escolasDB.map(e => Number(e.id) || 0)) + 1 : 1) };
        if (!existente || podeEditarCompleto()) {
            payload.cod_mec = texto(document.getElementById('escola-form-mec').value);
            payload.nome_escola = texto(document.getElementById('escola-form-nome').value).toUpperCase();
            payload.nome = payload.nome_escola;
            payload.municipio = texto(document.getElementById('escola-form-municipio').value).toUpperCase();
            payload.nte = texto(document.getElementById('escola-form-nte').value || nteUsuario());
            payload.dependencia_adm = texto(document.getElementById('escola-form-dep').value);
            payload.dependencia = payload.dependencia_adm;
        }
        payload.situacao_funcional = texto(document.getElementById('escola-form-situacao').value);
        payload.situacao = payload.situacao_funcional;
        payload.status_acervo = texto(document.getElementById('escola-form-acervo').value);
        payload.acervo = payload.status_acervo;
        payload.local_acervo = texto(document.getElementById('escola-form-local').value);
        if (existente) Object.assign(existente, payload); else escolasDB.push(payload);
        try {
            if (typeof salvarEstadoSupabaseSIGEE === 'function') await salvarEstadoSupabaseSIGEE();
            else if (typeof salvarBancoSupabaseSIGEE === 'function') await salvarBancoSupabaseSIGEE();
        } catch (e) { console.warn('Falha ao salvar escola no Supabase:', e); }
        if (typeof registrarLog === 'function') registrarLog(`${existente ? 'Alterou' : 'Cadastrou'} escola: ${payload.nome_escola || payload.nome}`);
        fecharModalEscola();
        renderizarLista();
        if (typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal();
    }

    function fecharModal() { const m = document.getElementById('modal-cadastro-escola'); if (m) m.classList.add('hidden'); }

    function aplicarModuloEscolas() {
        window.renderizarListaEscolasBufferMemoria = renderizarLista;
        window.filtrarPorBusca = filtrar;
        window.mudarPaginaEscola = mudarPagina;
        window.abrirModalNovaEscola = abrirNovaEscola;
        window.abrirModalEditarEscolaSIGEE = abrirEditarEscola;
        window.salvarEscolaFormularioSIGEE = salvarEscola;
        window.fecharModalEscola = fecharModal;
    }

    window.SIGEE_Escolas = {
        renderizar: renderizarLista,
        visiveis: escolasVisiveis,
        abrirNova: abrirNovaEscola,
        abrirEditar: abrirEditarEscola,
        salvar: salvarEscola
    };

    window.addEventListener('load', aplicarModuloEscolas);
})();
