/* =====================================================================
   SIGEE Enterprise 2.0 - Parte 4
   Módulo: Processos
   Objetivo: centralizar listagem, filtros, contadores, permissões e ações
   administrativas dos processos sem alterar a base Supabase nem a UI.
   Este módulo é aplicado após o app legado carregar.
   ===================================================================== */
(function () {
    'use strict';

    const ETAPAS = ['Desarquivamento', 'Análise', 'Pendência', 'Digitação', 'Conferência', 'Assinatura', 'Aguardando Retirada', 'Retirado'];
    const GRUPO_SEC = 'SEC - TODOS OS NTEs';
    let filtroEtapaModulo = 'TODOS';

    function texto(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }
    function semAcento(v) { return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function normalizar(v) { return semAcento(v).toUpperCase().replace(/\s+/g, ' '); }
    function minusculo(v) { return texto(v).toLowerCase(); }
    function hojeBR() { return new Date().toLocaleDateString('pt-BR'); }
    function usuario() { return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }

    function perfil(u) {
        const p = normalizar(u && u.perfil || 'Tecnico');
        if (p.includes('SEC')) return 'SEC';
        if (p.includes('MASTER')) return 'Master';
        if (p.includes('ADMIN')) return 'Administrador';
        if (p.includes('CONSULT')) return 'Consulta';
        return 'Tecnico';
    }
    function isSEC(u) { return perfil(u) === 'SEC' || minusculo(u && u.email) === 'sec@enova.educacao.ba.gov.br'; }
    function isMaster(u) { return perfil(u) === 'Master'; }
    function isAdmin(u) { return perfil(u) === 'Administrador'; }
    function isTecnico(u) { return perfil(u) === 'Tecnico'; }
    function isConsulta(u) { return perfil(u) === 'Consulta'; }
    function isGlobal(u) { return isSEC(u) || isMaster(u); }
    function podeGerirProcessos(u) { return isSEC(u) || isMaster(u); }

    function numeroNte(v) {
        const m = texto(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
        return m ? Number(m[1]) : null;
    }
    function normalizarNte(v) {
        const n = numeroNte(v);
        return n ? 'NTE' + String(n).padStart(2, '0') : normalizar(v).replace(/[^A-Z0-9]/g, '');
    }
    function nteUsuario(u) {
        return isSEC(u) ? GRUPO_SEC : texto(u && (u.nte || u.nte_nome || u.nte_vinculado || u.grupo) || 'NTE-26 Salvador');
    }
    function mesmoNte(a, b) {
        if (isGlobal(usuario())) return true;
        if (!a || !b) return false;
        const na = numeroNte(a), nb = numeroNte(b);
        return na && nb ? na === nb : normalizarNte(a) === normalizarNte(b);
    }
    function processoNte(p) { return texto(p && (p.nte || p.nte_nome || p.grupo || p.NTE)); }
    function processoEtapa(p) { return texto(p && (p.etapa || p.etapa_atual || p.fase_atual)) || 'Desarquivamento'; }
    function processoAluno(p) { return texto(p && (p.aluno || p.aluno_nome || p.nome_solicitante)); }
    function processoEscola(p) { return texto(p && (p.escola || p.escola_nome || p.nome_escola || p.instituicao)); }
    function processoDocumento(p) { return texto(p && (p.documento || p.documento_tipo || p.documento_solicitado)); }

    function listaProcessos() {
        const base = Array.isArray(window.processosDB) ? window.processosDB : (typeof processosDB !== 'undefined' && Array.isArray(processosDB) ? processosDB : []);
        window.processosDB = base;
        try { processosDB = base; } catch (e) {}
        return base;
    }

    function processosVisiveis() {
        const u = usuario();
        let lista = listaProcessos().slice();
        if (!isGlobal(u)) lista = lista.filter(p => mesmoNte(nteUsuario(u), processoNte(p)));
        const etapa = filtroEtapaModulo || (typeof etapaFiltroAtual !== 'undefined' ? etapaFiltroAtual : 'TODOS');
        if (etapa && etapa !== 'TODOS') lista = lista.filter(p => normalizar(processoEtapa(p)) === normalizar(etapa));
        const busca = normalizar(document.getElementById('busca-proc-nome')?.value || '');
        if (busca) lista = lista.filter(p => normalizar(processoAluno(p) + ' ' + processoEscola(p) + ' ' + processoDocumento(p)).includes(busca));
        return lista;
    }

    function registrar(acao) {
        try { if (typeof registrarLog === 'function') registrarLog(acao); }
        catch (e) { console.warn('Falha ao registrar log:', e); }
    }
    function supabaseClient() {
        try { return (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : null; }
        catch (e) { return null; }
    }
    function processoPayload(p) {
        try { if (typeof processoParaSupabaseSIGEE === 'function') return processoParaSupabaseSIGEE(p); } catch (e) {}
        return {
            id: p.id,
            aluno_nome: processoAluno(p),
            escola_nome: processoEscola(p),
            documento_tipo: processoDocumento(p),
            etapa_atual: processoEtapa(p),
            nte: processoNte(p),
            modalidade: p.modalidade || p.oferta_modalidade || null,
            nivel_oferta: p.ensino || p.nivel_oferta || p.oferta_nivel || null,
            dias_decorridos: Number(p.dias_decorridos || 0)
        };
    }
    async function salvarProcesso(p) {
        try { if (typeof salvarBancoLocalSIGEE === 'function') salvarBancoLocalSIGEE(); } catch (e) {}
        try {
            const c = supabaseClient();
            if (!c || !p) return;
            await c.from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.processos) || 'processos')
                .upsert(processoPayload(p), { onConflict: 'id' });
        } catch (e) { console.warn('SIGEE Parte 4: processo salvo localmente; Supabase não confirmou.', e); }
    }
    async function excluirProcessoSupabase(id) {
        try {
            const c = supabaseClient();
            if (!c) return;
            await c.from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.processos) || 'processos').delete().eq('id', id);
            try { await c.from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.solicitacoes) || 'solicitacoes_sigee').delete().eq('id', id); } catch (e) {}
        } catch (e) { console.warn('SIGEE Parte 4: exclusão de processo não confirmada no Supabase.', e); }
    }
    function atualizarTelas() {
        try { carregarEContarProcessosHorizontais(); } catch (e) {}
        try { if (typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal(); } catch (e) {}
        try { window.SIGEE_PERMISSOES_V44 && window.SIGEE_PERMISSOES_V44.aplicarPermissoesV44(); } catch (e) {}
    }

    function diasDesde(valor) {
        if (!valor) return 0;
        let data = null;
        const s = texto(valor);
        if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
            const p = s.slice(0, 10).split('/').map(Number);
            data = new Date(p[2], p[1] - 1, p[0]);
        } else {
            data = new Date(s);
        }
        if (!data || Number.isNaN(data.getTime())) return 0;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        data.setHours(0, 0, 0, 0);
        return Math.max(0, Math.floor((hoje - data) / 86400000));
    }
    function corEtapa(etapa) {
        const e = normalizar(etapa);
        if (e.includes('ANAL')) return 'bg-purple-600';
        if (e.includes('PEND')) return 'bg-red-600';
        if (e.includes('DIGIT')) return 'bg-orange-500';
        if (e.includes('CONFER')) return 'bg-green-600';
        if (e.includes('ASSIN')) return 'bg-blue-700';
        if (e.includes('AGUARD')) return 'bg-teal-600';
        if (e.includes('RETIR')) return 'bg-gray-700';
        return 'bg-sky-600';
    }
    function alertaPrazo(p) {
        const etapa = normalizar(processoEtapa(p));
        const dias = diasDesde(p.data_etapa_atual || p.created_at || p.criado_em);
        if (etapa.includes('DESARQ')) {
            if (dias >= 52) return '<span class="block bg-red-700 text-white text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5">SOLICITAR ATAS SEM PASTA</span>';
            if (dias >= 45) return '<span class="block bg-red-600 text-white text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5">CONFIRMAR DADOS DA BUSCA</span>';
            if (dias >= 38) return '<span class="block bg-orange-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5">REITERAÇÃO COM URGÊNCIA</span>';
            if (dias >= 31) return '<span class="block bg-amber-500 text-gray-900 text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5">REITERAÇÃO</span>';
        }
        if ((etapa.includes('ANAL') && dias > 7) || (etapa.includes('DIGIT') && dias > 15) || (etapa.includes('CONFER') && dias > 10) || (etapa.includes('ASSIN') && dias > 7)) {
            return '<span class="block bg-red-700 text-white text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5">VENCIDO</span>';
        }
        return '';
    }
    function podeMovimentar(p) {
        const u = usuario();
        return isSEC(u) || isMaster(u) || isAdmin(u) || (isTecnico(u) && mesmoNte(nteUsuario(u), processoNte(p)));
    }
    function acaoFluxo(p) {
        if (isConsulta(usuario())) return '<span class="text-gray-400 font-bold">Consulta</span>';
        if (!podeMovimentar(p)) return '<span class="text-gray-400 font-bold">Sem ação</span>';
        const e = normalizar(processoEtapa(p));
        if (e.includes('ANAL')) return `<button onclick="abrirModalFluxoAnalise(${p.id})" class="bg-purple-700 text-white font-bold px-2 py-1 rounded text-[10px]">Análise Realizada</button>`;
        if (e.includes('PEND')) return `<button onclick="abrirModalFluxoPendencia(${p.id})" class="bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px]">Tratar Pendência</button>`;
        if (e.includes('DIGIT')) return `<button onclick="abrirModalFluxoDigitacao(${p.id})" class="bg-orange-600 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Digitado</button>`;
        if (e.includes('CONFER')) return `<button onclick="abrirModalFluxoConferencia(${p.id})" class="bg-green-700 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Conferido</button>`;
        if (e.includes('ASSIN')) return `<button onclick="abrirModalFluxoAssinatura(${p.id})" class="bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px]">Deferido</button>`;
        if (e.includes('AGUARD')) return `<button onclick="abrirModalFluxoAguardando(${p.id})" class="bg-gray-700 text-white font-bold px-2 py-1 rounded text-[10px]">Retirado</button>`;
        if (e.includes('RETIR')) return '<span class="text-gray-300 font-bold">Finalizado</span>';
        return `<button onclick="abrirModalFluxoDesarquivamento(${p.id})" class="bg-sky-700 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Recebido</button>`;
    }

    function renderizarProcessos() {
        const corpo = document.getElementById('tabela-processos-corpo');
        if (!corpo) return;
        corpo.innerHTML = '';
        processosVisiveis().forEach(p => {
            const etapa = processoEtapa(p);
            const botoesMaster = podeGerirProcessos(usuario()) ? `
                <div class="mt-1 flex flex-wrap justify-center gap-1">
                    <button onclick="editarProcessoMasterSIGEE(${p.id})" class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">Editar</button>
                    <button onclick="regredirProcessoMasterSIGEE(${p.id})" class="bg-amber-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Regredir</button>
                    <button onclick="avancarProcessoMasterSIGEE(${p.id})" class="bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Avançar</button>
                    <button onclick="excluirProcessoMasterSIGEE(${p.id})" class="bg-red-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Excluir</button>
                </div>` : '';
            corpo.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-white/10 text-white">
                    <td class="p-2.5 font-bold truncate">
                        <span class="block uppercase truncate">${processoAluno(p)}</span>
                        <span class="text-[10px] text-cyan-200 font-extrabold">${processoDocumento(p)}</span>
                    </td>
                    <td class="p-2.5 truncate">
                        <span class="block font-bold text-white truncate text-[10px]">${processoEscola(p)}</span>
                        <span class="text-[9px] text-cyan-200 block font-semibold uppercase truncate">${processoNte(p)}</span>
                    </td>
                    <td class="p-2.5 text-center">
                        <span class="px-2 py-1 ${corEtapa(etapa)} text-white font-black rounded text-[9px] uppercase block">${etapa}</span>
                        ${alertaPrazo(p)}
                    </td>
                    <td class="p-2.5 text-center font-bold">${diasDesde(p.data_etapa_atual || p.created_at || p.criado_em)} dias</td>
                    <td class="p-2.5 text-center">${acaoFluxo(p)}${botoesMaster}</td>
                </tr>`);
        });
    }

    function atualizarContadoresProcessos() {
        const u = usuario();
        let lista = listaProcessos().slice();
        if (!isGlobal(u)) lista = lista.filter(p => mesmoNte(nteUsuario(u), processoNte(p)));
        const set = (id, valor) => { const el = document.getElementById(id); if (el) el.innerText = valor; };
        set('count-horiz-todos', lista.length);
        const mapa = {
            'count-horiz-desarquivamento': 'Desarquivamento',
            'count-horiz-analise': 'Análise',
            'count-horiz-pendencia': 'Pendência',
            'count-horiz-digitacao': 'Digitação',
            'count-horiz-conferencia': 'Conferência',
            'count-horiz-assinatura': 'Assinatura',
            'count-horiz-aguardando': 'Aguardando Retirada',
            'count-horiz-retirado': 'Retirado'
        };
        Object.entries(mapa).forEach(([id, etapa]) => set(id, lista.filter(p => normalizar(processoEtapa(p)) === normalizar(etapa)).length));
        renderizarProcessos();
    }

    function filtrarProcessosPorEtapa(etapa) {
        filtroEtapaModulo = etapa || 'TODOS';
        try { etapaFiltroAtual = filtroEtapaModulo; } catch (e) {}
        renderizarProcessos();
    }

    async function editarProcessoMaster(id) {
        if (!podeGerirProcessos(usuario())) return alert('Apenas SEC e Master podem editar processos diretamente.');
        const p = listaProcessos().find(x => String(x.id) === String(id));
        if (!p) return;
        const aluno = prompt('Aluno:', processoAluno(p)); if (aluno === null) return;
        const escola = prompt('Instituição:', processoEscola(p)); if (escola === null) return;
        const doc = prompt('Documento:', processoDocumento(p) || 'HISTÓRICO'); if (doc === null) return;
        const nte = prompt('NTE:', processoNte(p)); if (nte === null) return;
        p.aluno = p.aluno_nome = texto(aluno).toUpperCase();
        p.escola = p.escola_nome = texto(escola).toUpperCase();
        p.documento = p.documento_tipo = texto(doc).toUpperCase();
        p.nte = texto(nte) || p.nte;
        registrar(`[MASTER] Editou processo ID ${p.id}.`);
        await salvarProcesso(p);
        atualizarTelas();
    }
    async function moverMaster(id, direcao) {
        if (!podeGerirProcessos(usuario())) return alert('Apenas SEC e Master podem movimentar processos diretamente.');
        const p = listaProcessos().find(x => String(x.id) === String(id));
        if (!p) return;
        const atual = ETAPAS.findIndex(e => normalizar(e) === normalizar(processoEtapa(p)));
        const novoIndice = direcao > 0 ? Math.min(ETAPAS.length - 1, Math.max(0, atual) + 1) : Math.max(0, (atual < 0 ? 0 : atual) - 1);
        p.etapa = p.etapa_atual = ETAPAS[novoIndice];
        p.data_etapa_atual = hojeBR();
        registrar(`[MASTER] ${direcao > 0 ? 'Avançou' : 'Regrediu'} processo ID ${p.id} para ${p.etapa}.`);
        await salvarProcesso(p);
        atualizarTelas();
    }
    async function excluirProcessoMaster(id) {
        if (!podeGerirProcessos(usuario())) return alert('Apenas SEC e Master podem excluir processos.');
        const base = listaProcessos();
        const idx = base.findIndex(x => String(x.id) === String(id));
        if (idx < 0) return;
        const p = base[idx];
        if (!confirm(`Confirma excluir o processo de ${processoAluno(p) || 'aluno'}?`)) return;
        base.splice(idx, 1);
        await excluirProcessoSupabase(id);
        registrar(`[MASTER] Excluiu processo ID ${id}.`);
        atualizarTelas();
    }

    function aplicarModuloProcessos() {
        window.carregarEContarProcessosHorizontais = atualizarContadoresProcessos;
        window.renderizarProcessosFlutuantes = renderizarProcessos;
        window.filtrarProcessosPorEtapa = filtrarProcessosPorEtapa;
        window.editarProcessoMasterSIGEE = editarProcessoMaster;
        window.editarProcessoMasterV45 = editarProcessoMaster;
        window.avancarProcessoMasterSIGEE = id => moverMaster(id, 1);
        window.avancarProcessoMasterV45 = id => moverMaster(id, 1);
        window.regredirProcessoMasterSIGEE = id => moverMaster(id, -1);
        window.regredirProcessoMasterV45 = id => moverMaster(id, -1);
        window.excluirProcessoMasterSIGEE = excluirProcessoMaster;
        window.excluirProcessoMasterV45 = excluirProcessoMaster;
    }

    window.SIGEE_Processos = {
        listar: listaProcessos,
        visiveis: processosVisiveis,
        renderizar: renderizarProcessos,
        contar: atualizarContadoresProcessos,
        salvar: salvarProcesso,
        diasDesde,
        podeMovimentar,
        podeGerirProcessos
    };

    window.addEventListener('load', aplicarModuloProcessos);
})();

/* =====================================================================
   SIGEE Sprint 2.6.2 - Processos: Estagiário visualiza, mas não edita
   ===================================================================== */
(function(){
  'use strict';
  function txt(v){ return (v===null||v===undefined)?'':String(v).trim(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return semAcento(v).toUpperCase(); }
  function perfil(u){
    const p = up((u||window.usuarioLogado||{}).perfil);
    if (p.includes('SEC')) return 'SEC'; if (p.includes('MASTER')) return 'Master'; if (p.includes('ADMIN')) return 'Administrador'; if (p.includes('ESTAG')) return 'Estagiario'; if (p.includes('CONSULT')) return 'Consulta'; if (p.includes('TECNIC')) return 'Tecnico'; return p;
  }
  function usuario(){ return window.usuarioLogado || null; }
  function isEstagiario(){ return perfil(usuario()) === 'Estagiario'; }
  const oldEditar1 = window.editarProcessoMasterSIGEE;
  const oldEditar2 = window.editarProcessoMasterV45;
  window.editarProcessoMasterSIGEE = window.editarProcessoMasterV45 = function(){
    if (isEstagiario()) return alert('Perfil Estagiário pode visualizar processos, mas não pode editar.');
    const fn = oldEditar1 || oldEditar2;
    if (typeof fn === 'function') return fn.apply(this, arguments);
  };
  function ocultarBotaoEditar(){
    if (!isEstagiario()) return;
    document.querySelectorAll('button').forEach(btn=>{
      const texto = up(btn.textContent);
      const onclick = up(btn.getAttribute('onclick') || '');
      if (texto === 'EDITAR' || onclick.includes('EDITARPROCESSO')) btn.classList.add('hidden');
    });
  }
  const oldRender = window.renderizarProcessosFlutuantes;
  window.renderizarProcessosFlutuantes = function(){
    const r = typeof oldRender === 'function' ? oldRender.apply(this, arguments) : undefined;
    setTimeout(ocultarBotaoEditar, 20);
    return r;
  };
  document.addEventListener('DOMContentLoaded', ()=>setInterval(ocultarBotaoEditar, 1200));
  window.addEventListener('load', ()=>setTimeout(ocultarBotaoEditar, 500));
})();

