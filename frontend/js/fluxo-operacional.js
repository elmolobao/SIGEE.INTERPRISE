/* =====================================================================
   SIGEE Enterprise 2.0 - Parte 4
   Módulo: Fluxo Operacional
   Objetivo: centralizar abertura de modais, transições de etapas,
   nova solicitação e seleção de técnicos, preservando o app legado.
   ===================================================================== */
(function () {
    'use strict';

    const GRUPO_SEC = 'SEC - TODOS OS NTEs';

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
    function isGlobal(u) { return isSEC(u) || isMaster(u); }
    function isConsulta(u) { return perfil(u) === 'Consulta'; }
    function numeroNte(v) { const m = texto(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i); return m ? Number(m[1]) : null; }
    function normalizarNte(v) { const n = numeroNte(v); return n ? 'NTE' + String(n).padStart(2, '0') : normalizar(v).replace(/[^A-Z0-9]/g, ''); }
    function nteUsuario(u) { return isSEC(u) ? GRUPO_SEC : texto(u && (u.nte || u.nte_nome || u.nte_vinculado || u.grupo) || 'NTE-26 Salvador'); }
    function mesmoNte(a, b) {
        if (isGlobal(usuario())) return true;
        if (!a || !b) return false;
        const na = numeroNte(a), nb = numeroNte(b);
        return na && nb ? na === nb : normalizarNte(a) === normalizarNte(b);
    }
    function listaProcessos() {
        const base = Array.isArray(window.processosDB) ? window.processosDB : (typeof processosDB !== 'undefined' && Array.isArray(processosDB) ? processosDB : []);
        window.processosDB = base; try { processosDB = base; } catch (e) {}
        return base;
    }
    function listaEscolas() {
        const base = Array.isArray(window.escolasDB) ? window.escolasDB : (typeof escolasDB !== 'undefined' && Array.isArray(escolasDB) ? escolasDB : []);
        window.escolasDB = base; try { escolasDB = base; } catch (e) {}
        return base;
    }
    function listaUsuarios() {
        const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);
        window.usuariosDB = base; try { usuariosDB = base; } catch (e) {}
        return base;
    }
    function processoPorId(id) { return listaProcessos().find(p => String(p.id) === String(id)); }
    function registrar(acao) { try { if (typeof registrarLog === 'function') registrarLog(acao); } catch (e) {} }
    function supabaseClient() { try { return (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : null; } catch (e) { return null; } }

    async function salvarProcesso(p) {
        try { if (window.SIGEE_Processos && typeof window.SIGEE_Processos.salvar === 'function') return await window.SIGEE_Processos.salvar(p); } catch (e) {}
        try { if (typeof salvarBancoLocalSIGEE === 'function') salvarBancoLocalSIGEE(); } catch (e) {}
        try {
            const c = supabaseClient(); if (!c || !p) return;
            await c.from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.processos) || 'processos').upsert({
                id: p.id,
                aluno_nome: p.aluno || p.aluno_nome,
                escola_nome: p.escola || p.escola_nome,
                documento_tipo: p.documento || p.documento_tipo,
                nivel_oferta: p.ensino || p.nivel_oferta || null,
                modalidade: p.modalidade || null,
                etapa_atual: p.etapa || p.etapa_atual,
                nte: p.nte || null
            }, { onConflict: 'id' });
        } catch (e) { console.warn('SIGEE Parte 4: processo salvo localmente; Supabase não confirmou.', e); }
    }
    async function salvarSolicitacao(proc) {
        try {
            const c = supabaseClient(); if (!c || !proc) return;
            const codMec = proc.cod_mec || proc.mec || null;
            await c.from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.solicitacoes) || 'solicitacoes_sigee').upsert({
                nome_solicitante: proc.aluno || proc.aluno_nome || 'NÃO INFORMADO',
                cod_mec: codMec,
                documento_solicitado: proc.documento || proc.documento_tipo || null,
                oferta_nivel: proc.ensino || proc.nivel_oferta || null,
                oferta_modalidade: proc.modalidade || null,
                fase_atual: proc.etapa || proc.etapa_atual || 'Desarquivamento',
                tecnico_responsavel: proc.tecnico_responsavel || null,
                prioridade: proc.prioridade || null
            });
        } catch (e) { console.warn('SIGEE Parte 4: solicitação não confirmada no Supabase.', e); }
    }
    function atualizarTelas() {
        try { if (typeof carregarEContarProcessosHorizontais === 'function') carregarEContarProcessosHorizontais(); } catch (e) {}
        try { if (typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal(); } catch (e) {}
    }
    function fecharModalFluxo(fase) {
        const el = document.getElementById(`modal-fluxo-${fase}`);
        if (el) el.classList.add('hidden');
    }
    function abrirModalFluxo(fase) {
        const el = document.getElementById(`modal-fluxo-${fase}`);
        if (el) el.classList.remove('hidden');
    }
    function toggleBotaoHabilitar(chkId, btnId) {
        const chk = document.getElementById(chkId), btn = document.getElementById(btnId);
        if (chk && btn) btn.disabled = !chk.checked;
    }
    function preencherSelectTecnicos(selectId, nteFiltro) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">-- Selecione o Servidor --</option>';
        const uLog = usuario();
        let lista = listaUsuarios().filter(u => u.ativo !== false && !normalizar(u.perfil).includes('CONSULT'));
        if (!isGlobal(uLog)) lista = lista.filter(u => mesmoNte(nteUsuario(uLog), u.nte || u.grupo || nteFiltro));
        else if (nteFiltro && normalizar(nteFiltro) !== normalizar(GRUPO_SEC)) lista = lista.filter(u => mesmoNte(nteFiltro, u.nte || u.grupo));
        lista.forEach(u => select.insertAdjacentHTML('beforeend', `<option value="${texto(u.nome || u.email)}">${texto(u.nome || u.email)}${u.nte ? ' - ' + u.nte : ''}</option>`));
    }

    function verificarAcaoConsulta() {
        if (isConsulta(usuario())) { alert('Perfil consulta possui acesso somente leitura.'); return true; }
        return false;
    }

    function abrirModalFluxoDesarquivamento(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f00-id').value = p.id;
        ['f00-tipo', 'f00-local', 'f00-prioridade'].forEach(idCampo => { const el = document.getElementById(idCampo); if (el) el.value = ''; });
        const chk = document.getElementById('f00-chk-email'); if (chk) chk.checked = false;
        const submit = document.getElementById('f00-submit'); if (submit) submit.disabled = true;
        preencherSelectTecnicos('f00-analista', p.nte);
        abrirModalFluxo('desarquivamento');
    }
    async function executarTransicaoDesarquivamento(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f00-id').value); if (!p) return;
        p.tipo_arquivo = p.tipo_arquivo_recebido = texto(document.getElementById('f00-tipo').value);
        p.local_arquivo = p.local_acervo_solicitacao = texto(document.getElementById('f00-local').value);
        p.prioridade = texto(document.getElementById('f00-prioridade').value);
        p.analista = texto(document.getElementById('f00-analista').value);
        p.etapa = p.etapa_atual = 'Análise';
        p.data_etapa_atual = hojeBR();
        registrar(`Documento recebido e enviado para Análise: ${p.aluno || p.aluno_nome}`);
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('desarquivamento'); atualizarTelas();
    }

    function abrirModalFluxoAnalise(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f01-id').value = p.id;
        const pend = document.getElementById('f01-pendencia'); if (pend) pend.value = 'não';
        ['f01-p-aluno','f01-p-inst','f01-chk-email'].forEach(i => { const el = document.getElementById(i); if (el) el.checked = false; });
        const txt = document.getElementById('f01-txt-detalhe'); if (txt) txt.value = '';
        preencherSelectTecnicos('f01-digitador', p.nte);
        if (typeof onChangePendenciaAnalise === 'function') onChangePendenciaAnalise();
        if (typeof atualizarBotaoSubmissaoAnalise === 'function') atualizarBotaoSubmissaoAnalise();
        abrirModalFluxo('analise');
    }
    async function executarTransicaoAnalise(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f01-id').value); if (!p) return;
        const pendencia = texto(document.getElementById('f01-pendencia').value).toLowerCase() === 'sim';
        if (pendencia) {
            const aluno = document.getElementById('f01-p-aluno')?.checked;
            const inst = document.getElementById('f01-p-inst')?.checked;
            if (!aluno && !inst) return alert('Informe se a pendência é do aluno e/ou da instituição.');
            p.etapa = p.etapa_atual = 'Pendência';
            p.pendencia_tipo = aluno && inst ? 'Aluno e Instituição' : aluno ? 'Aluno' : 'Instituição';
            p.pendencia_detalhe = texto(document.getElementById('f01-txt-detalhe').value);
            registrar(`Análise registrou pendência: ${p.aluno || p.aluno_nome}`);
        } else {
            const digitador = texto(document.getElementById('f01-digitador').value);
            if (!digitador) return alert('Selecione o digitador.');
            if (!document.getElementById('f01-chk-email')?.checked) return alert('Confirme o envio do e-mail 03-Aluno (Digitação).');
            p.digitador = p.tecnico_responsavel = digitador;
            p.etapa = p.etapa_atual = 'Digitação';
            registrar(`Análise concluída e enviada para Digitação: ${p.aluno || p.aluno_nome}`);
        }
        p.data_etapa_atual = hojeBR();
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('analise'); atualizarTelas();
    }

    function abrirModalFluxoPendencia(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f02-id').value = p.id;
        const rec = document.getElementById('f02-recebimento'); if (rec) rec.value = 'total';
        const txt = document.getElementById('f02-txt-pendente'); if (txt) txt.value = '';
        const chk = document.getElementById('f02-chk-email'); if (chk) chk.checked = false;
        const submit = document.getElementById('f02-submit'); if (submit) submit.disabled = true;
        preencherSelectTecnicos('f02-digitador', p.nte);
        if (typeof onChangeRecebimentoPendencia === 'function') onChangeRecebimentoPendencia();
        abrirModalFluxo('pendencia');
    }
    async function executarTransicaoPendencia(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f02-id').value); if (!p) return;
        const recebimento = texto(document.getElementById('f02-recebimento').value);
        const digitador = texto(document.getElementById('f02-digitador').value);
        if (!digitador) return alert('Selecione o digitador.');
        if (recebimento === 'parcial') {
            const pendente = texto(document.getElementById('f02-txt-pendente').value);
            if (!pendente) return alert('Informe qual documento ainda está pendente.');
            p.pendencia_detalhe = pendente;
        }
        p.digitador = p.tecnico_responsavel = digitador;
        p.etapa = p.etapa_atual = 'Digitação';
        p.data_etapa_atual = hojeBR();
        registrar(`Pendência regularizada e enviada para Digitação: ${p.aluno || p.aluno_nome}`);
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('pendencia'); atualizarTelas();
    }

    function abrirModalFluxoDigitacao(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f05-id').value = p.id;
        const chk = document.getElementById('f05-chk-email'); if (chk) chk.checked = false;
        const submit = document.getElementById('f05-submit'); if (submit) submit.disabled = true;
        preencherSelectTecnicos('f05-conferente', p.nte);
        abrirModalFluxo('digitacao');
    }
    async function executarTransicaoDigitacao(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f05-id').value); if (!p) return;
        const conf = texto(document.getElementById('f05-conferente').value);
        if (!conf) return alert('Selecione o conferente.');
        p.conferente = conf;
        p.etapa = p.etapa_atual = 'Conferência';
        p.data_etapa_atual = hojeBR();
        registrar(`Documento digitado e enviado para Conferência: ${p.aluno || p.aluno_nome}`);
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('digitacao'); atualizarTelas();
    }

    function abrirModalFluxoConferencia(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f06-id').value = p.id;
        const chk = document.getElementById('f06-chk-email'); if (chk) chk.checked = false;
        const submit = document.getElementById('f06-submit'); if (submit) submit.disabled = true;
        abrirModalFluxo('conferencia');
    }
    async function executarTransicaoConferencia(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f06-id').value); if (!p) return;
        p.etapa = p.etapa_atual = 'Assinatura';
        p.data_etapa_atual = hojeBR();
        registrar(`Documento conferido e enviado para Assinatura: ${p.aluno || p.aluno_nome}`);
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('conferencia'); atualizarTelas();
    }

    function abrirModalFluxoAssinatura(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f07-id').value = p.id;
        const chk = document.getElementById('f07-chk-email'); if (chk) chk.checked = false;
        const submit = document.getElementById('f07-submit'); if (submit) submit.disabled = true;
        abrirModalFluxo('assinatura');
    }
    async function executarTransicaoAssinatura(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f07-id').value); if (!p) return;
        p.etapa = p.etapa_atual = 'Aguardando Retirada';
        p.data_etapa_atual = hojeBR();
        registrar(`Processo deferido e aguardando retirada: ${p.aluno || p.aluno_nome}`);
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('assinatura'); atualizarTelas();
    }

    function abrirModalFluxoAguardando(id) {
        if (verificarAcaoConsulta()) return;
        const p = processoPorId(id); if (!p) return;
        document.getElementById('f08-id').value = p.id;
        const retirada = document.getElementById('f08-retirada'); if (retirada) retirada.value = 'solicitante';
        const nome = document.getElementById('f08-nome-terceiro'); if (nome) nome.value = '';
        const rg = document.getElementById('f08-rg-terceiro'); if (rg) rg.value = '';
        onChangeFormaRetirada();
        abrirModalFluxo('aguardando');
    }
    function onChangeFormaRetirada() {
        const forma = document.getElementById('f08-retirada')?.value;
        document.getElementById('box-terceiros-retirada')?.classList.toggle('hidden', forma !== 'terceiros');
    }
    async function executarTransicaoAguardando(event) {
        event.preventDefault();
        const p = processoPorId(document.getElementById('f08-id').value); if (!p) return;
        const forma = texto(document.getElementById('f08-retirada').value);
        if (forma === 'terceiros') {
            const nome = texto(document.getElementById('f08-nome-terceiro').value);
            const rg = texto(document.getElementById('f08-rg-terceiro').value);
            if (!nome || !rg) return alert('Informe nome completo e RG do terceiro.');
            p.retirado_por = nome; p.retirado_rg = rg;
        } else {
            p.retirado_por = 'Solicitante';
        }
        p.etapa = p.etapa_atual = 'Retirado';
        p.data_etapa_atual = hojeBR();
        registrar(`Processo retirado: ${p.aluno || p.aluno_nome}`);
        await salvarProcesso(p); await salvarSolicitacao(p);
        fecharModalFluxo('aguardando'); atualizarTelas();
    }

    function escolasPermitidasParaSolicitacao() {
        let lista = listaEscolas().slice();
        const u = usuario();
        if (!isGlobal(u)) lista = lista.filter(e => mesmoNte(nteUsuario(u), e.nte || e.nte_nome || e.grupo));
        return lista;
    }
    function abrirFormularioNovaSolicitacao() {
        if (verificarAcaoConsulta()) return;
        const select = document.getElementById('novo-proc-escola');
        if (!select) return;
        const lista = escolasPermitidasParaSolicitacao();
        if (!lista.length) return alert('Nenhuma escola catalogada para o seu NTE de origem.');
        select.innerHTML = '<option value="" selected disabled>SELECIONE A INSTITUIÇÃO</option>' + lista.map(e => {
            const nome = texto(e.nome_escola || e.nome || e.escola);
            return `<option value="${nome}" data-id="${e.id}" data-mec="${texto(e.cod_mec)}">${nome} - ${texto(e.municipio)} (${texto(e.nte)})</option>`;
        }).join('');
        ['novo-proc-aluno','novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        ['novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const chk = document.getElementById('f01-chk-acolhido'); if (chk) chk.checked = false;
        const btn = document.getElementById('btn-submeter-nova-solicitacao'); if (btn) btn.disabled = true;
        document.getElementById('modal-nova-solicitacao')?.classList.remove('hidden');
    }
    function handleSelecaoInstituicaoFluxoAutomatico() {
        const nome = document.getElementById('novo-proc-escola')?.value;
        const escola = listaEscolas().find(e => texto(e.nome_escola || e.nome || e.escola) === texto(nome));
        if (!escola) return;
        const set = (id, valor) => { const el = document.getElementById(id); if (el) el.value = valor || ''; };
        set('novo-autofill-mec', escola.cod_mec);
        set('novo-autofill-nte', escola.nte);
        set('novo-autofill-municipio', escola.municipio);
        set('novo-autofill-dep', escola.dependencia_adm || escola.dependencia);
        set('novo-autofill-situacao', escola.situacao_funcional || escola.situacao);
        set('novo-autofill-acervo', escola.status_acervo || escola.acervo);
        set('novo-autofill-local-acervo', escola.local_acervo);
    }
    function fecharModalNovaSolicitacao() {
        document.getElementById('modal-nova-solicitacao')?.classList.add('hidden');
    }
    async function salvarNovaSolicitacao(event) {
        event.preventDefault();
        const aluno = texto(document.getElementById('novo-proc-aluno').value).toUpperCase();
        const escolaNome = texto(document.getElementById('novo-proc-escola').value);
        if (!aluno || !escolaNome) return alert('Informe aluno e instituição.');
        const novoId = listaProcessos().length ? Math.max(...listaProcessos().map(p => Number(p.id) || 0)) + 1 : 101;
        const proc = {
            id: novoId,
            aluno, aluno_nome: aluno,
            escola: escolaNome, escola_nome: escolaNome,
            cod_mec: texto(document.getElementById('novo-autofill-mec').value),
            documento: texto(document.getElementById('novo-proc-documento').value), documento_tipo: texto(document.getElementById('novo-proc-documento').value),
            modalidade: texto(document.getElementById('novo-proc-modalidade').value),
            ensino: texto(document.getElementById('novo-proc-ensino').value), nivel_oferta: texto(document.getElementById('novo-proc-ensino').value),
            etapa: 'Desarquivamento', etapa_atual: 'Desarquivamento',
            data_etapa_atual: hojeBR(), created_at: new Date().toISOString(),
            nte: texto(document.getElementById('novo-autofill-nte').value),
            municipio: texto(document.getElementById('novo-autofill-municipio').value)
        };
        listaProcessos().push(proc);
        registrar(`Nova solicitação cadastrada para ${aluno}.`);
        await salvarProcesso(proc); await salvarSolicitacao(proc);
        fecharModalNovaSolicitacao(); atualizarTelas();
    }

    function aplicarModuloFluxo() {
        window.fecharModalFluxo = fecharModalFluxo;
        window.toggleBotaoHabilitar = toggleBotaoHabilitar;
        window.preencherSelectTecnicosPorNte = preencherSelectTecnicos;
        window.abrirModalFluxoDesarquivamento = abrirModalFluxoDesarquivamento;
        window.executarTransicaoDesarquivamento = executarTransicaoDesarquivamento;
        window.abrirModalFluxoAnalise = abrirModalFluxoAnalise;
        window.executarTransicaoAnalise = executarTransicaoAnalise;
        window.abrirModalFluxoPendencia = abrirModalFluxoPendencia;
        window.executarTransicaoPendencia = executarTransicaoPendencia;
        window.abrirModalFluxoDigitacao = abrirModalFluxoDigitacao;
        window.executarTransicaoDigitacao = executarTransicaoDigitacao;
        window.abrirModalFluxoConferencia = abrirModalFluxoConferencia;
        window.executarTransicaoConferencia = executarTransicaoConferencia;
        window.abrirModalFluxoAssinatura = abrirModalFluxoAssinatura;
        window.executarTransicaoAssinatura = executarTransicaoAssinatura;
        window.abrirModalFluxoAguardando = abrirModalFluxoAguardando;
        window.executarTransicaoAguardando = executarTransicaoAguardando;
        window.onChangeFormaRetirada = onChangeFormaRetirada;
        window.abrirFormularioNovaSolicitacao = abrirFormularioNovaSolicitacao;
        window.handleSelecaoInstituicaoFluxoAutomatico = handleSelecaoInstituicaoFluxoAutomatico;
        window.fecharModalNovaSolicitacao = fecharModalNovaSolicitacao;
        window.salvarNovaSolicitacao = salvarNovaSolicitacao;
    }

    window.SIGEE_FluxoOperacional = {
        aplicar: aplicarModuloFluxo,
        abrirNovaSolicitacao: abrirFormularioNovaSolicitacao,
        preencherTecnicos: preencherSelectTecnicos,
        salvarNovaSolicitacao
    };

    window.addEventListener('load', aplicarModuloFluxo);
})();
