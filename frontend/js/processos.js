/* =====================================================================
   SIGEE Enterprise 2.0 - Parte 4
   Módulo: Processos
   Objetivo: centralizar listagem, filtros, contadores, permissões e ações
   administrativas dos processos sem alterar a base Supabase nem a UI.
   Este módulo é aplicado após o app legado carregar.
   ===================================================================== */
(function () {
    'use strict';

    const ETAPAS = ['Desarquivamento', 'Análise', 'Pendência', 'Digitação', 'Conferência', 'Assinatura', 'Aguardando Retirada', 'Retirado', 'Indeferido'];
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
    function processoModalidade(p) { return texto(p && (p.modalidade || p.oferta_modalidade || p.nivel_oferta || p.ensino)); }
    function processoPrioridade(p) { return texto(p && p.prioridade) || 'Normal'; }
    function processoResponsavel(p) { return texto(p && (p.tecnico_responsavel || p.responsavel || p.usuario_responsavel || p.criado_por)) || 'Não atribuído'; }
    function anoProcesso(p) {
        const bruto = texto(p && (p.data_solicitacao || p.created_at || p.criado_em || p.data_abertura));
        const m = bruto.match(/(20\d{2})/);
        return m ? m[1].slice(-2) : String(new Date().getFullYear()).slice(-2);
    }
    function codigoDocumento(documento) {
        const d = normalizar(documento);
        if (d.includes('DECLAR')) return 'DECL';
        if (d.includes('VERAC')) return 'VERA';
        if (d.includes('ATEST')) return 'ATES';
        if (d.includes('CERT')) return 'CERT';
        return 'HIST';
    }
    function codigoSIGEE(p) {
        if (texto(p && p.codigo_sigee)) return texto(p.codigo_sigee).toUpperCase();
        const doc = codigoDocumento(processoDocumento(p));
        const ano = anoProcesso(p);
        const nte = String(numeroNte(processoNte(p)) || 0).padStart(2, '0');
        const seq = String(Number(p && p.id) || 1).padStart(4, '0');
        return `SEEX.${doc}.${ano}${nte}.${seq}`;
    }
    function prazoEtapa(etapa) {
        const e = normalizar(etapa);
        if (e.includes('ANAL')) return 7;
        if (e.includes('DIGIT')) return 15;
        if (e.includes('CONFER')) return 10;
        if (e.includes('ASSIN')) return 7;
        return null;
    }
    function prazoVisual(p) {
        const dias = diasDesde(p.data_etapa_atual || p.created_at || p.criado_em);
        const limite = prazoEtapa(processoEtapa(p));
        if (!limite) return `${dias} dias`;
        const classe = dias > limite ? 'text-red-300' : dias >= Math.ceil(limite * .8) ? 'text-amber-300' : 'text-emerald-300';
        return `<span class="font-black ${classe}">${dias}/${limite}</span>`;
    }
    function prioridadeBadge(valor) {
        const p = normalizar(valor);
        if (p.includes('ALTA') || p.includes('URG')) return '<span class="sigee-prioridade sigee-prioridade-alta">Alta</span>';
        if (p.includes('BAIX')) return '<span class="sigee-prioridade sigee-prioridade-baixa">Baixa</span>';
        return '<span class="sigee-prioridade sigee-prioridade-normal">Normal</span>';
    }
    function copiarCodigoSIGEE(codigo) {
        const valor = texto(codigo);
        if (!valor) return;
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(valor).catch(()=>{});
        else {
            const ta=document.createElement('textarea'); ta.value=valor; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        }
        try { if (typeof mostrarToast === 'function') mostrarToast('Código SIGEE copiado.'); } catch(e) {}
    }

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
        if (busca) lista = lista.filter(p => normalizar(codigoSIGEE(p) + ' ' + processoAluno(p) + ' ' + processoEscola(p) + ' ' + processoDocumento(p) + ' ' + processoModalidade(p)).includes(busca));
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
            dias_decorridos: Number(p.dias_decorridos || 0),
            codigo_sigee: codigoSIGEE(p),
            prioridade: processoPrioridade(p),
            tecnico_responsavel: processoResponsavel(p)
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
        if (e.includes('DESARQ')) return 'sigee-etapa-desarquivamento';
        if (e.includes('ANAL')) return 'sigee-etapa-analise';
        if (e.includes('PEND')) return 'sigee-etapa-pendencia';
        if (e.includes('DIGIT')) return 'sigee-etapa-digitacao';
        if (e.includes('CONFER')) return 'sigee-etapa-conferencia';
        if (e.includes('ASSIN')) return 'sigee-etapa-assinatura';
        if (e.includes('AGUARD')) return 'sigee-etapa-deferido';
        if (e.includes('RETIR')) return 'sigee-etapa-retirado';
        if (e.includes('INDEFER')) return 'sigee-etapa-indeferido';
        return 'sigee-etapa-nova';
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
        const lista = processosVisiveis();
        if (!lista.length) {
            corpo.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-gray-400 font-bold">Nenhum processo encontrado.</td></tr>';
            return;
        }
        lista.forEach(p => {
            const etapa = processoEtapa(p);
            const codigo = codigoSIGEE(p);
            if (!p.codigo_sigee) p.codigo_sigee = codigo;
            const botoesMaster = podeGerirProcessos(usuario()) ? `
                <div class="mt-1 flex flex-wrap justify-center gap-1">
                    <button onclick="editarProcessoMasterSIGEE(${p.id})" class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">Editar</button>
                    <button onclick="regredirProcessoMasterSIGEE(${p.id})" class="bg-amber-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Regredir</button>
                    <button onclick="avancarProcessoMasterSIGEE(${p.id})" class="bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Avançar</button>
                    <button onclick="excluirProcessoMasterSIGEE(${p.id})" class="bg-red-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Excluir</button>
                </div>` : '';
            corpo.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-blue-950/70 text-white transition-colors">
                    <td class="p-2.5">
                        <button type="button" onclick="copiarCodigoSIGEE('${codigo}')" class="font-black text-cyan-200 hover:text-white text-[10px] tracking-wide" title="Clique para copiar">${codigo}</button>
                        <span class="block uppercase font-bold truncate mt-1">${processoAluno(p)}</span>
                    </td>
                    <td class="p-2.5 truncate">
                        <span class="block font-bold text-white truncate text-[10px]">${processoEscola(p)}</span>
                        <span class="text-[9px] text-cyan-200 block font-semibold uppercase truncate">${processoNte(p)}</span>
                    </td>
                    <td class="p-2.5 text-center text-[10px] font-semibold">${processoModalidade(p) || '-'}</td>
                    <td class="p-2.5 text-center">${prioridadeBadge(processoPrioridade(p))}</td>
                    <td class="p-2.5 text-center">${prazoVisual(p)}${alertaPrazo(p)}</td>
                    <td class="p-2.5 text-center text-[10px] font-semibold">${processoResponsavel(p)}</td>
                    <td class="p-2.5 text-center"><span class="sigee-etapa-badge ${corEtapa(etapa)}">${etapa}</span></td>
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
            'count-horiz-retirado': 'Retirado',
            'count-horiz-indeferido': 'Indeferido'
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
        window.copiarCodigoSIGEE = copiarCodigoSIGEE;
    }

    window.SIGEE_Processos = {
        listar: listaProcessos,
        visiveis: processosVisiveis,
        renderizar: renderizarProcessos,
        contar: atualizarContadoresProcessos,
        salvar: salvarProcesso,
        diasDesde,
        podeMovimentar,
        podeGerirProcessos,
        codigoSIGEE
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
  document.addEventListener('DOMContentLoaded', ocultarBotaoEditar);
  window.addEventListener('load', ()=>setTimeout(ocultarBotaoEditar, 300));
})();

