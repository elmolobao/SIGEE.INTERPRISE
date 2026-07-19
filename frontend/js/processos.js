/* SIGEE PROCESSOS PATCH 2.5.4 — edição por perfil, escola e responsável persistentes */
/* SIGEE PROCESSOS PATCH 2.5.1A — responsável persistente */
/* SIGEE PATCH 2.5.3 — compatibilidade do payload processos */
/* SIGEE PATCH 2.5.2 — payload compatível com public.processos */
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

    const CICLO_DESARQUIVAMENTO = [
        'DESARQUIVAMENTO',
        'REITERACAO',
        'REITERACAO COM URGENCIA',
        'REITERACAO URGENTE',
        'CONFIRMACAO DOS DADOS DA BUSCA',
        'CONFIRMAR DADOS DA BUSCA',
        'PEDIDO DE ATAS SEM PASTA'
    ];

    function pertenceCicloDesarquivamento(etapaOuProcesso) {
        const p = etapaOuProcesso && typeof etapaOuProcesso === 'object' ? etapaOuProcesso : null;
        const codigo = normalizar(p && p.etapa_codigo);
        if (['DES', 'RET', 'REU', 'CFD'].includes(codigo)) return true;
        const etapa = p ? processoEtapa(p) : etapaOuProcesso;
        const e = normalizar(etapa);
        return CICLO_DESARQUIVAMENTO.includes(e);
    }

    function deslocamentoEstadoCiclo(p) {
        const codigo = normalizar(p && p.etapa_codigo);
        const etapa = normalizar(processoEtapa(p));
        if (codigo === 'RET' || etapa === 'REITERACAO') return 30;
        if (codigo === 'REU' || etapa.includes('REITERACAO URG')) return 37;
        if (codigo === 'CFD' || etapa.includes('CONFIRMACAO') || etapa.includes('CONFIRMAR DADOS')) return 44;
        return 0;
    }

    function inferirInicioCicloLegado(p) {
        if (!p) return null;
        const referencia = p.data_etapa_atual || p.data_etapa || p.etapa_iniciada_em || p.updated_at;
        const deslocamento = deslocamentoEstadoCiclo(p);
        if (!referencia || !deslocamento) return null;
        const data = new Date(referencia);
        if (Number.isNaN(data.getTime())) return null;
        data.setDate(data.getDate() - deslocamento);
        return data.toISOString();
    }

    function dataInicioCiclo(p) {
        if (!p) return null;
        return p.data_inicio_desarquivamento ||
               p.data_inicio_ciclo ||
               p.inicio_ciclo ||
               p.data_desarquivamento ||
               p.data_etapa_inicial ||
               p.prazo_inicio_ciclo ||
               inferirInicioCicloLegado(p) ||
               p.created_at ||
               p.criado_em ||
               p.prazo_inicio ||
               p.data_etapa_atual;
    }

    function garantirInicioCiclo(p) {
        if (!p) return p;

        /*
         * A data de início do ciclo é criada uma única vez e permanece
         * inalterada durante Reiteração, Reiteração Urgente, Confirmação
         * dos Dados e Pedido de Atas. Somente a Retificação cria novo ciclo.
         */
        const existente =
            p.data_inicio_desarquivamento ||
            p.data_inicio_ciclo ||
            p.inicio_ciclo ||
            p.data_desarquivamento ||
            p.data_etapa_inicial ||
            p.prazo_inicio_ciclo ||
            inferirInicioCicloLegado(p);

        if (!existente) {
            const origem =
                p.created_at ||
                p.criado_em ||
                p.prazo_inicio ||
                p.data_etapa_atual ||
                new Date().toISOString();

            p.data_inicio_desarquivamento = origem;
            p.data_inicio_ciclo = origem;
        } else {
            p.data_inicio_desarquivamento = existente;
            p.data_inicio_ciclo = existente;
        }

        return p;
    }

    const GRUPO_SEC = 'SEC - TODOS OS NTEs';
    let filtroEtapaModulo = 'TODOS';

    function texto(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }
    function semAcento(v) { return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function normalizar(v) { return semAcento(v).toUpperCase().replace(/\s+/g, ' '); }
    function minusculo(v) { return texto(v).toLowerCase(); }
    function agoraWorkflow() {
        const clock = window.SIGEE_WORKFLOW_CLOCK;
        return clock && typeof clock.now === 'function' ? clock.now() : new Date();
    }
    function hojeBR() { return agoraWorkflow().toLocaleDateString('pt-BR'); }
    function usuario() { return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }

    function perfil(u) {
        const p = normalizar(u && u.perfil || 'Tecnico');
        if (p.includes('SEC')) return 'SEC';
        if (p.includes('MASTER')) return 'Master';
        if (p.includes('ADMIN')) return 'Administrador';
        if (p.includes('CONSULT')) return 'Consulta';
        if (p.includes('ESTAG')) return 'Estagiario';
        return 'Tecnico';
    }
    function isSEC(u) { return perfil(u) === 'SEC'; }
    function isMaster(u) { return perfil(u) === 'Master'; }
    function isAdmin(u) { return perfil(u) === 'Administrador'; }
    function isTecnico(u) { return perfil(u) === 'Tecnico'; }
    function isGestor(u) { return perfil(u) === 'Gestor'; }
    function isConsulta(u) { return perfil(u) === 'Consulta'; }
    function isEstagiario(u) { return perfil(u) === 'Estagiario'; }
    function isGlobal(u) { return isSEC(u) || isMaster(u) || isGestor(u); }
    function podeGerirProcessos(u) { return isMaster(u); }

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
    function processoCodigoSec(p) { return texto(p && (p.codigo_sec || p.cod_sec || p.codigo_sec_escola || p.escola_codigo_sec || p.codigo_escola || p.cod_escola)); }
    function processoDocumento(p) { return texto(p && (p.documento || p.documento_tipo || p.documento_solicitado)); }
    function processoModalidade(p) {
        if (!p) return '';
        const modalidade = texto(p.modalidade || p.oferta_modalidade || p.modalidade_ensino || p.tipo_modalidade);
        const nivel = texto(p.nivel_oferta || p.oferta_nivel || p.ensino || p.nivel_ensino);
        if (modalidade && nivel && normalizar(modalidade) !== normalizar(nivel)) return `${modalidade} / ${nivel}`;
        return modalidade || nivel || 'Não informado';
    }
    function processoPrioridade(p) { return texto(p && p.prioridade) || 'Normal'; }
    function processoResponsavel(p) {
        if (!p) return 'Não atribuído';
        const etapa = normalizar(processoEtapa(p));
        const porEtapa = etapa.includes('ANAL')
            ? (p.analista_nome || p.analista || p.tecnico_analista || p.analista_selecionado_nome || p.analista_selecionado)
            : etapa.includes('DIGIT')
                ? (p.digitador_nome || p.digitador || p.digitador_selecionado_nome || p.digitador_selecionado)
                : etapa.includes('CONFER')
                    ? (p.conferente_nome || p.conferente || p.conferente_selecionado_nome || p.conferente_selecionado)
                    : etapa.includes('ASSIN')
                        ? (p.responsavel_assinatura_nome || p.responsavel_assinatura || p.enviado_assinatura_por)
                        : null;
        return texto(
            porEtapa ||
            p.tecnico_responsavel_nome || p.tecnico_responsavel ||
            p.responsavel_nome || p.responsavel ||
            p.usuario_responsavel_nome || p.usuario_responsavel ||
            p.tecnico_nome ||
            p.analista_nome || p.analista || p.analista_selecionado_nome || p.analista_selecionado ||
            p.digitador_nome || p.digitador ||
            p.conferente_nome || p.conferente ||
            p.atribuido_para_nome || p.atribuido_para ||
            p.responsavel_etapa_nome || p.responsavel_etapa ||
            p.criado_por_nome || p.criado_por
        ) || (p.processo_migrado ? 'Migrado' : 'Atribuição pendente');
    }

    function consolidarResponsavelProcesso(p) {
        if (!p) return p;
        const responsavel = processoResponsavel(p);
        if (!responsavel || ['Não atribuído','Atribuição pendente','Migrado'].includes(responsavel)) return p;
        const etapa = normalizar(processoEtapa(p));
        p.tecnico_responsavel = responsavel;
        p.tecnico_responsavel_nome = p.tecnico_responsavel_nome || responsavel;
        p.responsavel = p.responsavel || responsavel;
        p.responsavel_nome = p.responsavel_nome || responsavel;
        if (etapa.includes('ANAL')) {
            p.analista = p.analista || responsavel;
            p.analista_nome = p.analista_nome || responsavel;
        } else if (etapa.includes('DIGIT')) {
            p.digitador = p.digitador || responsavel;
            p.digitador_nome = p.digitador_nome || responsavel;
        } else if (etapa.includes('CONFER')) {
            p.conferente = p.conferente || responsavel;
            p.conferente_nome = p.conferente_nome || responsavel;
        }
        return p;
    }
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
        const dias = diasDesde(dataInicioCiclo(p));
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
        if (etapa && etapa !== 'TODOS') {
            if (normalizar(etapa) === 'DESARQUIVAMENTO') {
                lista = lista.filter(p => pertenceCicloDesarquivamento(p));
            } else {
                lista = lista.filter(p => normalizar(processoEtapa(p)) === normalizar(etapa));
            }
        }
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

    function normalizarDataSupabaseSIGEEProcesso(valor) {
        if (!valor || typeof valor !== 'string') return valor || null;
        const m = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : valor;
    }
    function protegerDatasPayloadSIGEE(payload) {
        Object.keys(payload || {}).forEach(chave => {
            const n = chave.toLowerCase();
            if (n.includes('data') || n.includes('prazo') || n.includes('inicio') || n.includes('fim') || n.includes('created') || n.includes('updated') || n.includes('finalizado')) {
                payload[chave] = normalizarDataSupabaseSIGEEProcesso(payload[chave]);
            }
        });
        return payload;
    }

    function gerarWorkflowInstanceIdSIGEE() {
        try {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }
        } catch (e) {}
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async function garantirWorkflowInstanceIdSIGEE(p, cliente) {
        if (!p) return null;
        if (p.workflow_instance_id) return p.workflow_instance_id;

        /*
         * Em processos existentes, preserva a instância já registrada no banco.
         * Para processos novos ou registros antigos sem instância, cria UUID.
         */
        if (p.id && cliente) {
            try {
                const tabela = (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.processos) || 'processos';
                const { data, error } = await cliente
                    .from(tabela)
                    .select('workflow_instance_id')
                    .eq('id', p.id)
                    .maybeSingle();

                if (!error && data && data.workflow_instance_id) {
                    p.workflow_instance_id = data.workflow_instance_id;
                    return p.workflow_instance_id;
                }
            } catch (e) {
                console.warn('[SIGEE Processos] Não foi possível recuperar workflow_instance_id existente.', e);
            }
        }

        p.workflow_instance_id = gerarWorkflowInstanceIdSIGEE();
        return p.workflow_instance_id;
    }

    function processoPayload(p) {
        garantirInicioCiclo(p);
        consolidarResponsavelProcesso(p);
        try {
            if (typeof processoParaSupabaseSIGEE === 'function') {
                const payload = processoParaSupabaseSIGEE(p) || {};
                payload.workflow_instance_id = p.workflow_instance_id || payload.workflow_instance_id || gerarWorkflowInstanceIdSIGEE();
                p.workflow_instance_id = payload.workflow_instance_id;
                const responsavelAtual = processoResponsavel(p);
                if (responsavelAtual && responsavelAtual !== 'Não atribuído') {
                    payload.tecnico_responsavel = responsavelAtual;
                }
                /*
                 * PATCH 2.5.2:
                 * Estes campos são mantidos somente na memória para cálculo
                 * visual do ciclo. Eles não existem na tabela public.processos.
                 */
                delete payload.data_inicio_desarquivamento;
                delete payload.data_inicio_ciclo;
                delete payload.prazo_inicio_ciclo;
                delete payload.inicio_ciclo;
                delete payload.data_desarquivamento;
                delete payload.data_etapa_inicial;
                delete payload.etapa; // coluna inexistente em public.processos
                return protegerDatasPayloadSIGEE(payload);
            }
        } catch (e) {}
        return {
            id: p.id,
            aluno_nome: processoAluno(p),
            escola_nome: processoEscola(p),
            documento_tipo: processoDocumento(p),
            etapa_atual: processoEtapa(p),
            nte: processoNte(p),
            cod_mec: p.cod_mec || p.mec || null,
            escola_id: p.escola_id == null || p.escola_id === '' ? null : (Number(p.escola_id) || p.escola_id),
            modalidade: p.modalidade || p.oferta_modalidade || null,
            nivel_oferta: p.ensino || p.nivel_oferta || p.oferta_nivel || null,
            dias_decorridos: Number(p.dias_decorridos || 0),
            codigo_sigee: codigoSIGEE(p),
            prioridade: processoPrioridade(p),
            tecnico_responsavel: ['Não atribuído','Atribuição pendente','Migrado'].includes(processoResponsavel(p)) ? null : processoResponsavel(p),
            pendencia_aluno_itens: p.pendencia_aluno_itens || [],
            pendencia_instituicao_itens: p.pendencia_instituicao_itens || [],
            pendencia_aluno_complemento: p.pendencia_aluno_complemento || null,
            pendencia_instituicao_complemento: p.pendencia_instituicao_complemento || null,
            pendencia_aberta: Boolean(p.pendencia_aberta),
            motivo_indeferimento: p.motivo_indeferimento || null,
            justificativa_indeferimento: p.justificativa_indeferimento || null,
            processo_sei_indeferimento: p.processo_sei_indeferimento || null,
            finalizado_em: p.finalizado_em || null,
            etapa_codigo: p.etapa_codigo || null,
            data_etapa_atual: p.data_etapa_atual || null,
            prazo_etapa: p.prazo_etapa == null ? null : Number(p.prazo_etapa),
            prazo_inicio: p.prazo_inicio || null,
            prazo_fim: p.prazo_fim || null,
            workflow_ciclo: Number(p.workflow_ciclo || p.ciclo || 1),
            ciclo: Number(p.ciclo || p.workflow_ciclo || 1),
            ultimo_evento_workflow: p.ultimo_evento_workflow || null,
            ultima_mensagem_workflow: p.ultima_mensagem_workflow || null,
            contexto_analise: p.contexto_analise || null,
            workflow_instance_id: p.workflow_instance_id || gerarWorkflowInstanceIdSIGEE(),
            updated_at: p.updated_at || new Date().toISOString()
        };
    }
    async function salvarProcesso(p) {
        try { if (typeof salvarBancoLocalSIGEE === 'function') salvarBancoLocalSIGEE(); } catch (e) {}
        try {
            const c = supabaseClient();
            if (!c || !p) return;
            await garantirWorkflowInstanceIdSIGEE(p, c);
            const payload = processoPayload(p);
            const { error } = await c.from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.processos) || 'processos')
                .upsert(payload, { onConflict: 'id' });
            if (error) throw error;
            return payload;
        } catch (e) {
            console.error('SIGEE Parte 4: Supabase não confirmou o processo.', e);
            throw e;
        }
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
        const hoje = agoraWorkflow();
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
        const dias = diasDesde(dataInicioCiclo(p));
        if (pertenceCicloDesarquivamento(etapa)) {
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

    function alertaChave(p) {
        const dias = diasDesde(dataInicioCiclo(p));
        const etapa = normalizar(processoEtapa(p));
        if (!pertenceCicloDesarquivamento(etapa)) return '';
        if (dias >= 52) return 'PEDIDO_ATAS_SEM_PASTA';
        if (dias >= 45) return 'CONFIRMAR_DADOS';
        if (dias >= 38) return 'REITERACAO_URGENTE';
        if (dias >= 31) return 'REITERACAO';
        return 'DESARQUIVAMENTO';
    }


    function marcarAcaoWorkflowExecutada(p, chave) {
        p.acoes_executadas = Array.isArray(p.acoes_executadas) ? p.acoes_executadas : [];
        if (!p.acoes_executadas.includes(chave)) {
            p.acoes_executadas.push(chave);
        }
        p.ultima_acao_workflow = chave;
        p.data_ultima_acao_workflow = new Date().toISOString();
    }

    function retificacaoDisponivel(alerta) {
        return [
            'REITERACAO',
            'REITERACAO_URGENTE',
            'CONFIRMAR_DADOS'
        ].includes(alerta);
    }

    function acaoJaExecutada(p, chave) {
        return (Array.isArray(p.acoes_executadas) && p.acoes_executadas.includes(chave)) || p.ultima_acao_workflow === chave;
    }

    function registrarAcaoExecutada(p, chave) {
        p.acoes_executadas = Array.isArray(p.acoes_executadas) ? p.acoes_executadas : [];
        if (!p.acoes_executadas.includes(chave)) p.acoes_executadas.push(chave);
    }

    function podeMovimentar(p) {
        const u = usuario();
        if (isMaster(u)) return true;
        if (isAdmin(u) || isTecnico(u)) return mesmoNte(nteUsuario(u), processoNte(p));
        return false; // SEC, Consulta e Estagiário não movimentam
    }
    function acaoFluxo(p) {
        if (isSEC(usuario())) return '<span class="text-gray-400 font-bold">Supervisão SEC</span>';
        if (isGestor(usuario())) return '<span class="text-gray-400 font-bold">Consulta Gestor</span>';
        if (isConsulta(usuario())) return '<span class="text-gray-400 font-bold">Consulta</span>';
        if (isEstagiario(usuario())) return '<span class="text-gray-400 font-bold">Consulta</span>';
        if (!podeMovimentar(p)) return '<span class="text-gray-400 font-bold">Sem ação</span>';
        const e = normalizar(processoEtapa(p));
        if (e.includes('ANAL')) return `<button onclick="abrirAnaliseSIGEE(${p.id})" class="sigee-btn-acao sigee-acao-analise">Abrir Análise</button>`;
        if (e.includes('PEND')) return `<button onclick="abrirPendenciaSIGEE(${p.id})" class="sigee-btn-acao sigee-acao-pendencia sigee-btn-tratar-pendencia">Tratar Pendência</button>`;
        if (e.includes('INDEFER')) return '<span class="text-red-300 font-bold">Finalizado</span>';
        if (e.includes('DIGIT')) return `<button onclick="abrirModalFluxoDigitacao(${p.id})" class="sigee-btn-acao sigee-acao-digitacao">Documento Digitado</button>`;
        if (e.includes('CONFER')) return `<button onclick="abrirModalFluxoConferencia(${p.id})" class="sigee-btn-acao sigee-acao-conferido">Documento Conferido</button>`;
        if (e.includes('ASSIN')) return `<button onclick="abrirModalFluxoAssinatura(${p.id})" class="sigee-btn-acao sigee-acao-deferido">Deferido</button>`;
        if (e.includes('AGUARD')) return `<button onclick="abrirModalFluxoAguardando(${p.id})" class="sigee-btn-acao sigee-acao-retirado">Retirado</button>`;
        if (e.includes('RETIR')) return '<span class="text-gray-300 font-bold">Finalizado</span>';

        const codigoEtapa = normalizar(p.etapa_codigo);
        const alertaPorEtapa = codigoEtapa === 'RET' ? 'REITERACAO'
            : codigoEtapa === 'REU' ? 'REITERACAO_URGENTE'
            : codigoEtapa === 'CFD' ? 'CONFIRMAR_DADOS'
            : null;
        const alerta = alertaPorEtapa || alertaChave(p);
        const permiteRetificacao = ['RET', 'REU', 'CFD'].includes(codigoEtapa) || retificacaoDisponivel(alerta);
        const executada = acaoJaExecutada(p, alerta);
        const botaoRetificacao = permiteRetificacao ? `<button onclick="abrirRetificacaoDadosSIGEE(${p.id})" class="sigee-btn-acao sigee-acao-retificacao">Retificação dos Dados</button>` : '';
        if (alerta === 'REITERACAO') return (executada
            ? '<span class="text-gray-400 font-bold">Reiteração executada</span>'
            : `<button onclick="abrirModalFluxoDesarquivamento(${p.id}, 'REITERACAO')" class="sigee-btn-acao sigee-acao-reiteracao">Executar Reiteração</button>`) + botaoRetificacao;
        if (alerta === 'REITERACAO_URGENTE') return (executada
            ? '<span class="text-gray-400 font-bold">Reiteração urgente executada</span>'
            : `<button onclick="abrirModalFluxoDesarquivamento(${p.id}, 'REITERACAO_URGENTE')" class="sigee-btn-acao sigee-acao-reiteracao-urgente">Executar Reiteração Urgente</button>`) + botaoRetificacao;
        if (alerta === 'CONFIRMAR_DADOS') return (executada
            ? '<span class="text-gray-400 font-bold">Dados confirmados</span>'
            : `<button onclick="abrirModalFluxoDesarquivamento(${p.id}, 'CONFIRMAR_DADOS')" class="sigee-btn-acao sigee-acao-confirmacao">Confirmar Dados da Busca</button>`) + botaoRetificacao;
        if (alerta === 'PEDIDO_ATAS_SEM_PASTA') return executada
            ? '<span class="text-gray-400 font-bold">Atas solicitadas</span>'
            : `<button onclick="abrirModalFluxoDesarquivamento(${p.id}, 'PEDIDO_ATAS_SEM_PASTA')" class="sigee-btn-acao sigee-acao-atas">Solicitar Atas sem Pasta</button>`;

        return `<button onclick="abrirModalFluxoDesarquivamento(${p.id}, 'DESARQUIVAMENTO')" class="sigee-btn-acao sigee-acao-documento-recebido">Documento Recebido</button>`;
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
            const uAtual = usuario();
            let botoesAdministrativos = '';
            if (isMaster(uAtual)) {
                botoesAdministrativos = `
                <div class="mt-1 flex flex-wrap justify-center gap-1">
                    <button onclick="editarProcessoMasterSIGEE(${p.id})" class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">Editar</button>
                    <button onclick="regredirProcessoMasterSIGEE(${p.id})" class="bg-amber-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Regredir</button>
                    <button onclick="avancarProcessoMasterSIGEE(${p.id})" class="bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Avançar</button>
                    <button onclick="excluirProcessoMasterSIGEE(${p.id})" class="bg-red-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Excluir</button>
                </div>`;
            } else if (isAdmin(uAtual) && mesmoNte(nteUsuario(uAtual), processoNte(p))) {
                botoesAdministrativos = `
                <div class="mt-1 flex flex-wrap justify-center gap-1">
                    <button onclick="editarProcessoMasterSIGEE(${p.id})" class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">Corrigir Cadastro</button>
                </div>`;
            }
            corpo.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-blue-950/70 text-white transition-colors">
                    <td class="p-2.5">
                        <span class="sigee-aluno-nome" title="${processoAluno(p)}">${processoAluno(p)}</span>
                        <span class="sigee-codigo-linha">
                            <button type="button" data-sigee-codigo="${codigo}" class="sigee-codigo-copiavel font-black text-cyan-200 hover:text-white tracking-wide" title="Clique para copiar">${codigo} <span aria-hidden="true">📋</span></button>
                        </span>
                    </td>
                    <td class="p-2.5">
                        <span class="sigee-escola-nome" title="${processoEscola(p)}">${processoEscola(p)}</span>
                        <span class="sigee-escola-meta">${processoNte(p) || '-'}${processoCodigoSec(p) ? ` - Cód. SEC ${processoCodigoSec(p)}` : ''}</span>
                    </td>
                    <td class="p-2.5 text-center text-[10px] font-semibold">${processoModalidade(p) || '-'}</td>
                    <td class="p-2.5 text-center">${prioridadeBadge(processoPrioridade(p))}</td>
                    <td class="p-2.5 text-center">${prazoVisual(p)}${alertaPrazo(p)}</td>
                    <td class="p-2.5 text-center text-[10px] font-semibold">${processoResponsavel(p)}</td>
                    <td class="p-2.5 text-center"><span class="sigee-etapa-badge ${corEtapa(etapa)} ${normalizar(p.contexto_analise).includes("DESARQUIVAMENTO") ? "sigee-etapa-analise-desarquivamento" : ""}">${etapa}</span></td>
                    <td class="p-2.5 text-center">${acaoFluxo(p)}<button onclick="abrirHistoricoSIGEE(${p.id})" class="ml-1 bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1 rounded text-[10px]">Histórico</button>${botoesAdministrativos}</td>
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
        Object.entries(mapa).forEach(([id, etapa]) => {
            const total = normalizar(etapa) === 'DESARQUIVAMENTO'
                ? lista.filter(p => pertenceCicloDesarquivamento(p)).length
                : lista.filter(p => normalizar(processoEtapa(p)) === normalizar(etapa)).length;
            set(id, total);
        });
        renderizarProcessos();
    }

    function filtrarProcessosPorEtapa(etapa) {
        filtroEtapaModulo = etapa || 'TODOS';
        try { etapaFiltroAtual = filtroEtapaModulo; } catch (e) {}
        renderizarProcessos();
    }

    function garantirEstiloEdicaoProcessoSIGEE() {
        if (document.getElementById('sigee-edicao-processo-style')) return;
        const style = document.createElement('style');
        style.id = 'sigee-edicao-processo-style';
        style.textContent = `
          .sigee-editproc-backdrop{position:fixed;inset:0;z-index:100005;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(2,8,23,.78);backdrop-filter:blur(7px)}
          .sigee-editproc-panel{width:min(720px,100%);max-height:calc(100vh - 40px);overflow:auto;border:1px solid rgba(125,211,252,.28);border-radius:18px;background:#0b1f35;color:#fff;box-shadow:0 28px 90px rgba(0,0,0,.55)}
          .sigee-editproc-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:linear-gradient(135deg,#075985,#1e3a8a);border-bottom:1px solid rgba(255,255,255,.12)}
          .sigee-editproc-head h2{margin:0;color:#fff!important;font-size:18px}.sigee-editproc-close{border:0;background:transparent!important;color:#fff!important;font-size:24px;cursor:pointer;box-shadow:none!important}
          .sigee-editproc-body{padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:15px}.sigee-editproc-body label{display:flex;flex-direction:column;gap:6px;color:#dbeafe!important;font-size:11px;font-weight:900;text-transform:uppercase}
          .sigee-editproc-body label.full{grid-column:1/-1}.sigee-editproc-body input,.sigee-editproc-body select{width:100%;padding:11px 12px;border:1px solid rgba(125,211,252,.28)!important;border-radius:10px;background:#07182a!important;color:#fff!important;outline:none}
          .sigee-editproc-meta{grid-column:1/-1;padding:10px 12px;border-radius:10px;background:rgba(14,165,233,.09);color:#bae6fd;font-size:11px}
          .sigee-editproc-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.10)}
          .sigee-editproc-actions button{padding:10px 15px;border-radius:10px;font-weight:900;cursor:pointer}.sigee-editproc-cancel{background:#334155!important;color:#fff!important}.sigee-editproc-save{background:#059669!important;color:#fff!important}
          @media(max-width:620px){.sigee-editproc-body{grid-template-columns:1fr}.sigee-editproc-body label.full,.sigee-editproc-meta,.sigee-editproc-actions{grid-column:auto}}
        `;
        document.head.appendChild(style);
    }

    async function carregarCatalogoEdicaoSIGEE() {
        let escolas = Array.isArray(window.escolasDB) ? window.escolasDB.slice() : [];
        let usuarios = Array.isArray(window.usuariosDB) ? window.usuariosDB.slice() : [];
        const c = supabaseClient();
        async function buscarTodos(tabela, colunas) {
            if (!c) return [];
            const saida = [];
            for (let inicio = 0; inicio < 50000; inicio += 1000) {
                const { data, error } = await c.from(tabela).select(colunas).range(inicio, inicio + 999);
                if (error) throw error;
                const lote = data || [];
                saida.push(...lote);
                if (lote.length < 1000) break;
            }
            return saida;
        }
        try {
            if (!escolas.length) escolas = await buscarTodos((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.escolas) || 'escolas_sigee', '*');
        } catch (e) { console.warn('[SIGEE] Catálogo de escolas indisponível para edição.', e); }
        try {
            if (!usuarios.length) usuarios = await buscarTodos((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee', '*');
        } catch (e) { console.warn('[SIGEE] Usuários indisponíveis para edição.', e); }
        return { escolas, usuarios };
    }

    function nteRegistroEdicao(item) {
        return texto(item && (item.nte || item.nte_nome || item.grupo || item.territorio || (item.nte_id ? `NTE-${String(item.nte_id).padStart(2,'0')}` : '')));
    }

    function listaDocumentosEdicaoSIGEE() {
        const padrao = [
            'Histórico Escolar',
            'Declaração',
            'Certificado',
            'Atestado',
            'Veracidade de Documento',
            'Segunda Via'
        ];
        const existentes = listaProcessos().map(processoDocumento).filter(Boolean);
        return Array.from(new Set([...padrao, ...existentes]))
            .sort((a, b) => texto(a).localeCompare(texto(b), 'pt-BR'));
    }

    function listaAlunosEdicaoSIGEE() {
        return Array.from(new Set(listaProcessos().map(processoAluno).filter(Boolean)))
            .sort((a, b) => texto(a).localeCompare(texto(b), 'pt-BR'));
    }

    async function editarProcessoMaster(id) {
        const u = usuario();
        const p = listaProcessos().find(x => String(x.id) === String(id));
        if (!p) return alert('Processo não localizado.');
        const admin = isAdmin(u);
        const master = isMaster(u);
        if (admin && !mesmoNte(nteUsuario(u), processoNte(p))) return alert('Administrador só pode corrigir processos do próprio NTE.');
        if (!master && !admin) return alert('Correção cadastral permitida apenas para Master e Administrador.');

        garantirEstiloEdicaoProcessoSIGEE();
        document.getElementById('sigee-modal-edicao-processo')?.remove();
        const catalogo = await carregarCatalogoEdicaoSIGEE();
        const modal = document.createElement('div');
        modal.id = 'sigee-modal-edicao-processo';
        modal.className = 'sigee-editproc-backdrop';
        const nteAtual = processoNte(p) || nteUsuario(u);
        const alunoAtual = processoAluno(p);
        const documentoAtual = processoDocumento(p);
        const responsavelAtual = processoResponsavel(p) === 'Não atribuído' ? '' : processoResponsavel(p);
        const escHtml = v => texto(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const opcoesNte = Array.from({length:27},(_,i)=>{ const v=`NTE-${String(i+1).padStart(2,'0')}`; return `<option value="${v}" ${normalizar(v)===normalizar(nteAtual)?'selected':''}>${v}</option>`; }).join('');
        const opcoesAlunos = listaAlunosEdicaoSIGEE().map(nome => `<option value="${escHtml(nome)}"></option>`).join('');
        const documentos = listaDocumentosEdicaoSIGEE();
        if (documentoAtual && !documentos.some(x => normalizar(x) === normalizar(documentoAtual))) documentos.unshift(documentoAtual);
        const opcoesDocumento = documentos.map(doc => `<option value="${escHtml(doc)}" ${normalizar(doc)===normalizar(documentoAtual)?'selected':''}>${escHtml(doc)}</option>`).join('');

        modal.innerHTML = `
          <section class="sigee-editproc-panel" role="dialog" aria-modal="true" aria-labelledby="sigee-editproc-title">
            <header class="sigee-editproc-head"><h2 id="sigee-editproc-title">✏️ ${admin?'Corrigir Cadastro':'Editar Processo'}</h2><button type="button" class="sigee-editproc-close" aria-label="Fechar">×</button></header>
            <form class="sigee-editproc-body">
              <div class="sigee-editproc-meta">Processo <strong>${escHtml(codigoSIGEE(p))}</strong> · Etapa atual: <strong>${escHtml(processoEtapa(p))}</strong></div>
              <label class="full">Nome do requerente/aluno
                <input id="sigee-editproc-aluno" list="sigee-editproc-alunos-lista" required value="${escHtml(alunoAtual)}" autocomplete="off">
                <datalist id="sigee-editproc-alunos-lista">${opcoesAlunos}</datalist>
              </label>
              ${master
                ? `<label>NTE<select id="sigee-editproc-nte">${opcoesNte}</select></label>`
                : `<label>NTE<input id="sigee-editproc-nte-view" value="${escHtml(nteAtual)}" readonly aria-readonly="true"></label><input type="hidden" id="sigee-editproc-nte" value="${escHtml(nteAtual)}">`}
              <label>Escola/Instituição<select id="sigee-editproc-escola" required><option value="">Carregando catálogo...</option></select></label>
              <label>Documento solicitado
                <select id="sigee-editproc-documento">${opcoesDocumento}</select>
              </label>
              <label>Responsável pela tarefa<select id="sigee-editproc-responsavel"><option value="">Carregando responsáveis...</option></select></label>
              <div class="sigee-editproc-actions"><button type="button" class="sigee-editproc-cancel">Cancelar</button><button type="submit" class="sigee-editproc-save">Salvar alterações</button></div>
            </form>
          </section>`;
        document.body.appendChild(modal);

        const selNte = modal.querySelector('#sigee-editproc-nte');
        const selEscola = modal.querySelector('#sigee-editproc-escola');
        const selResponsavel = modal.querySelector('#sigee-editproc-responsavel');
        const selDocumento = modal.querySelector('#sigee-editproc-documento');

        function preencherEscolas() {
            const alvo = texto(selNte.value || nteAtual);
            const lista = catalogo.escolas
                .filter(e => !alvo || mesmoNte(alvo, nteRegistroEdicao(e)))
                .sort((a,b)=>texto(a.nome_escola||a.nome||a.escola).localeCompare(texto(b.nome_escola||b.nome||b.escola),'pt-BR'));
            const atualId = texto(p.escola_id);
            const atualNome = processoEscola(p);
            let encontrouAtual = false;
            const opcoes = lista.map(e=>{
                const idEsc = texto(e.id);
                const nome = texto(e.nome_escola||e.nome||e.escola);
                const mec = texto(e.cod_mec||e.codigo_mec||e.mec);
                const selected = (atualId && atualId===idEsc) || normalizar(nome)===normalizar(atualNome);
                if (selected) encontrouAtual = true;
                return `<option value="${escHtml(idEsc)}" data-nome="${escHtml(nome)}" data-mec="${escHtml(mec)}" ${selected?'selected':''}>${escHtml(nome)}${mec?' · MEC '+escHtml(mec):''}</option>`;
            }).join('');
            const opcaoLegada = !encontrouAtual && atualNome
                ? `<option value="${escHtml(atualId || '__ATUAL__')}" data-nome="${escHtml(atualNome)}" data-mec="${escHtml(p.cod_mec||p.codigo_mec||'')}" selected>${escHtml(atualNome)} · Escola atual</option>`
                : '';
            selEscola.innerHTML = '<option value="">-- Selecione a escola cadastrada --</option>' + opcaoLegada + opcoes;
            if (!selEscola.value && atualNome) {
                const correspondente = Array.from(selEscola.options).find(o => normalizar(o.dataset.nome) === normalizar(atualNome));
                if (correspondente) selEscola.value = correspondente.value;
            }
        }

        function preencherResponsaveis() {
            const alvo = texto(selNte.value || nteAtual);
            const lista = catalogo.usuarios
                .filter(x => x.ativo !== false && mesmoNte(alvo, nteRegistroEdicao(x)) && ['TECNICO','ADMINISTRADOR','MASTER'].some(k=>normalizar(x.perfil).includes(k)))
                .sort((a,b)=>texto(a.nome||a.nome_completo||a.email).localeCompare(texto(b.nome||b.nome_completo||b.email),'pt-BR'));
            let encontrouAtual = false;
            const opcoes = lista.map(x=>{
                const nome=texto(x.nome||x.nome_completo||x.email);
                const selected = normalizar(nome)===normalizar(responsavelAtual);
                if (selected) encontrouAtual = true;
                return `<option value="${escHtml(nome)}" ${selected?'selected':''}>${escHtml(nome)} · ${escHtml(x.perfil||'Técnico')}</option>`;
            }).join('');
            const opcaoAtual = responsavelAtual && !encontrouAtual
                ? `<option value="${escHtml(responsavelAtual)}" selected>${escHtml(responsavelAtual)} · Responsável atual</option>`
                : '';
            selResponsavel.innerHTML = '<option value="">Não atribuído</option>' + opcaoAtual + opcoes;
            if (responsavelAtual && !selResponsavel.value) selResponsavel.value = responsavelAtual;
        }

        preencherEscolas();
        preencherResponsaveis();
        if (master) selNte.addEventListener('change',()=>{ preencherEscolas(); preencherResponsaveis(); });

        const fechar = () => modal.remove();
        modal.querySelector('.sigee-editproc-close').addEventListener('click', fechar);
        modal.querySelector('.sigee-editproc-cancel').addEventListener('click', fechar);
        modal.addEventListener('click', e => { if (e.target === modal) fechar(); });
        modal.querySelector('form').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = modal.querySelector('.sigee-editproc-save');
            const optEscola = selEscola.selectedOptions[0];
            if (!optEscola || !optEscola.value) return alert('Selecione uma escola cadastrada no catálogo.');
            const novoAluno = texto(modal.querySelector('#sigee-editproc-aluno').value).toUpperCase();
            if (!novoAluno) return alert('Informe o nome do requerente/aluno.');

            const antes = {
                aluno: processoAluno(p), nte: processoNte(p), escola: processoEscola(p),
                documento: processoDocumento(p), responsavel: processoResponsavel(p)
            };
            btn.disabled = true; btn.textContent = 'Salvando...';
            try {
                p.aluno = p.aluno_nome = novoAluno;
                if (optEscola.value !== '__ATUAL__') p.escola_id = optEscola.value;
                p.escola = p.escola_nome = texto(optEscola.dataset.nome).toUpperCase();
                if (optEscola.dataset.mec) p.cod_mec = p.codigo_mec = optEscola.dataset.mec;
                p.documento = p.documento_tipo = texto(selDocumento.value).toUpperCase();
                if (master) {
                    p.nte = texto(selNte.value) || p.nte;
                }
                const resp = texto(selResponsavel.value);
                p.tecnico_responsavel = p.tecnico_responsavel_nome = resp || null;
                p.responsavel = p.responsavel_nome = resp || null;
                const et = normalizar(processoEtapa(p));
                if (et.includes('ANAL')) p.analista = p.analista_nome = resp || null;
                else if (et.includes('DIGIT')) p.digitador = p.digitador_nome = resp || null;
                else if (et.includes('CONFER')) p.conferente = p.conferente_nome = resp || null;
                else if (et.includes('ASSIN')) p.responsavel_assinatura = p.responsavel_assinatura_nome = resp || null;

                const alteracoes = [];
                if (normalizar(antes.aluno) !== normalizar(processoAluno(p))) alteracoes.push(`nome: ${antes.aluno} → ${processoAluno(p)}`);
                if (normalizar(antes.escola) !== normalizar(processoEscola(p))) alteracoes.push(`escola: ${antes.escola} → ${processoEscola(p)}`);
                if (master && normalizar(antes.nte) !== normalizar(processoNte(p))) alteracoes.push(`NTE: ${antes.nte} → ${processoNte(p)}`);
                if (normalizar(antes.documento) !== normalizar(processoDocumento(p))) alteracoes.push(`documento: ${antes.documento} → ${processoDocumento(p)}`);
                if (normalizar(antes.responsavel) !== normalizar(processoResponsavel(p))) alteracoes.push(`responsável: ${antes.responsavel} → ${processoResponsavel(p)}`);

                registrar(`[${admin?'ADMINISTRADOR':'MASTER'}] Editou processo ID ${p.id}${alteracoes.length ? ' — ' + alteracoes.join('; ') : ' — sem alteração de valores'}.`);
                await salvarProcesso(p);
                atualizarTelas();
                fechar();
                try { if (typeof mostrarToast === 'function') mostrarToast('Processo atualizado com sucesso.'); } catch (_) {}
            } catch (erro) {
                console.error('[SIGEE] Falha ao editar processo:', erro);
                alert('Não foi possível salvar a edição do processo.');
                btn.disabled = false; btn.textContent = 'Salvar alterações';
            }
        });
        setTimeout(()=>modal.querySelector('#sigee-editproc-aluno')?.focus(), 30);
    }
    async function moverMaster(id, direcao) {
        if (!isMaster(usuario())) return alert('Avanço ou regressão manual permitido apenas para o perfil Master.');
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
        if (!isMaster(usuario())) return alert('Exclusão de processos permitida apenas para o perfil Master.');
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



/* =====================================================================
   SIGEE Sprint 3.2.1 — sincronização operacional em tempo real
   ===================================================================== */
(function(){
  'use strict';
  if (window.__SIGEE_REALTIME_PROCESSOS_321__) return;
  window.__SIGEE_REALTIME_PROCESSOS_321__ = true;

  let canal = null;
  let atualizando = false;
  let timer = null;

  function tabelaProcessos(){
    return (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.processos) || 'processos';
  }
  function cliente(){
    try {
      if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') return window.SIGEE_SUPABASE.criarCliente();
      if (typeof window.criarClienteSupabaseSIGEE === 'function') return window.criarClienteSupabaseSIGEE();
      if (typeof window.obterSupabaseSIGEE === 'function') return window.obterSupabaseSIGEE();
    } catch(e) { console.warn('[SIGEE] Cliente Supabase indisponível.', e); }
    return null;
  }
  function indicador(){
    let el=document.getElementById('sigee-sync-status');
    if(el) return el;
    const alvo=document.querySelector('#aba-processos h2, #aba-processos h1, .sigee-central-header') || document.querySelector('#aba-processos');
    if(!alvo) return null;
    el=document.createElement('span');
    el.id='sigee-sync-status';
    el.className='ml-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black bg-gray-700 text-white';
    el.textContent='🟡 Conectando...';
    if(alvo.parentNode && alvo.matches('h1,h2')) alvo.parentNode.insertBefore(el, alvo.nextSibling); else alvo.prepend(el);
    return el;
  }
  function status(tipo, texto){
    const el=indicador(); if(!el) return;
    const cls={ok:'bg-emerald-700', wait:'bg-amber-600', off:'bg-red-700'}[tipo] || 'bg-gray-700';
    el.className=`ml-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black ${cls} text-white`;
    el.textContent=texto;
  }
  function mapear(r){
    if(!r) return null;

    /*
     * SIGEE PATCH 2.5.1A — autoridade do responsável na Central
     * O conversor global do app.js pode devolver um objeto parcial.
     * A Central agora reconcilia esse objeto com o registro bruto do
     * Supabase e nunca descarta tecnico_responsavel.
     */
    if(typeof window.processoDoSupabaseParaLocalSIGEE==='function') {
      try {
        const convertido = window.processoDoSupabaseParaLocalSIGEE(r) || {};
        const responsavel =
          convertido.tecnico_responsavel ||
          convertido.tecnico_responsavel_nome ||
          convertido.responsavel ||
          convertido.responsavel_nome ||
          convertido.responsavel_etapa ||
          convertido.responsavel_etapa_nome ||
          convertido.analista ||
          convertido.analista_nome ||
          convertido.digitador ||
          convertido.digitador_nome ||
          convertido.conferente ||
          convertido.conferente_nome ||
          r.tecnico_responsavel ||
          r.tecnico_responsavel_nome ||
          r.responsavel ||
          r.responsavel_nome ||
          r.responsavel_etapa ||
          r.responsavel_etapa_nome ||
          r.analista ||
          r.analista_nome ||
          r.digitador ||
          r.digitador_nome ||
          r.conferente ||
          r.conferente_nome ||
          '';

        return {
          ...r,
          ...convertido,
          id: Number(convertido.id ?? r.id) || convertido.id || r.id,
          modalidade:
            convertido.modalidade ||
            convertido.oferta_modalidade ||
            convertido.nivel_oferta ||
            convertido.oferta_nivel ||
            convertido.ensino ||
            r.modalidade ||
            r.oferta_modalidade ||
            r.nivel_oferta ||
            r.oferta_nivel ||
            r.ensino ||
            '',
          nivel_oferta:
            convertido.nivel_oferta ||
            convertido.oferta_nivel ||
            convertido.ensino ||
            r.nivel_oferta ||
            r.oferta_nivel ||
            r.ensino ||
            '',
          tecnico_responsavel: responsavel,
          tecnico_responsavel_nome:
            convertido.tecnico_responsavel_nome ||
            r.tecnico_responsavel_nome ||
            responsavel,
          responsavel:
            convertido.responsavel ||
            r.responsavel ||
            responsavel,
          responsavel_nome:
            convertido.responsavel_nome ||
            r.responsavel_nome ||
            responsavel,
          responsavel_etapa:
            convertido.responsavel_etapa ||
            r.responsavel_etapa ||
            responsavel,
          responsavel_etapa_nome:
            convertido.responsavel_etapa_nome ||
            r.responsavel_etapa_nome ||
            responsavel,
          analista:
            convertido.analista ||
            r.analista ||
            (String(convertido.etapa_atual || r.etapa_atual || '').toUpperCase().includes('ANÁLI')
              ? responsavel : ''),
          analista_nome:
            convertido.analista_nome ||
            r.analista_nome ||
            convertido.analista ||
            r.analista ||
            '',
          digitador:
            convertido.digitador ||
            r.digitador ||
            (String(convertido.etapa_atual || r.etapa_atual || '').toUpperCase().includes('DIGIT')
              ? responsavel : ''),
          digitador_nome:
            convertido.digitador_nome ||
            r.digitador_nome ||
            convertido.digitador ||
            r.digitador ||
            '',
          conferente:
            convertido.conferente ||
            r.conferente ||
            (String(convertido.etapa_atual || r.etapa_atual || '').toUpperCase().includes('CONFER')
              ? responsavel : ''),
          conferente_nome:
            convertido.conferente_nome ||
            r.conferente_nome ||
            convertido.conferente ||
            r.conferente ||
            '',
          responsavel_assinatura:
            convertido.responsavel_assinatura ||
            r.responsavel_assinatura ||
            (String(convertido.etapa_atual || r.etapa_atual || '').toUpperCase().includes('ASSIN')
              ? responsavel : ''),
          responsavel_assinatura_nome:
            convertido.responsavel_assinatura_nome ||
            r.responsavel_assinatura_nome ||
            convertido.responsavel_assinatura ||
            r.responsavel_assinatura ||
            ''
        };
      } catch(e) {
        console.warn('[SIGEE Processos] Conversor global falhou; usando mapeamento próprio.', e);
      }
    }
    return {
      ...r,
      id: Number(r.id) || r.id,
      aluno: r.aluno_nome || r.aluno || r.nome_solicitante || '',
      aluno_nome: r.aluno_nome || r.aluno || '',
      escola: r.escola_nome || r.escola || r.nome_escola || r.instituicao || '',
      escola_nome: r.escola_nome || r.escola || '',
      documento: r.documento_tipo || r.documento || r.documento_solicitado || '',
      documento_tipo: r.documento_tipo || r.documento || '',
      etapa: r.etapa_atual || r.etapa || r.fase_atual || 'Desarquivamento',
      etapa_atual: r.etapa_atual || r.etapa || 'Desarquivamento',
      nte: r.nte || r.nte_nome || r.grupo || '',
      modalidade: r.modalidade || r.oferta_modalidade || r.modalidade_ensino || r.tipo_modalidade || r.nivel_oferta || r.oferta_nivel || r.ensino || r.nivel_ensino || '',
      prioridade: r.prioridade || 'Normal',
      tecnico_responsavel: r.tecnico_responsavel_nome || r.tecnico_responsavel || r.responsavel_nome || r.responsavel || r.usuario_responsavel_nome || r.usuario_responsavel || r.tecnico_nome || r.analista_nome || r.analista || r.analista_selecionado_nome || r.analista_selecionado || r.digitador_nome || r.digitador || r.conferente_nome || r.conferente || r.atribuido_para_nome || r.atribuido_para || '',
      tecnico_responsavel_nome: r.tecnico_responsavel_nome || r.tecnico_responsavel || '',
      responsavel: r.responsavel || r.tecnico_responsavel || '',
      responsavel_nome: r.responsavel_nome || r.tecnico_responsavel_nome || r.tecnico_responsavel || '',
      analista: r.analista || r.analista_nome || r.analista_selecionado || '',
      analista_nome: r.analista_nome || r.analista || r.analista_selecionado_nome || r.analista_selecionado || '',
      digitador: r.digitador || r.digitador_nome || '',
      digitador_nome: r.digitador_nome || r.digitador || '',
      conferente: r.conferente || r.conferente_nome || '',
      conferente_nome: r.conferente_nome || r.conferente || '',
      data_inicio_desarquivamento: r.data_inicio_desarquivamento || r.data_inicio_ciclo || r.prazo_inicio_ciclo || null,
      data_inicio_ciclo: r.data_inicio_ciclo || r.data_inicio_desarquivamento || r.prazo_inicio_ciclo || null,
      prazo_inicio_ciclo: r.prazo_inicio_ciclo || r.data_inicio_desarquivamento || r.data_inicio_ciclo || null,
      codigo_sigee: r.codigo_sigee || '',
      pendencia_aluno_itens: r.pendencia_aluno_itens || [],
      pendencia_instituicao_itens: r.pendencia_instituicao_itens || [],
      pendencia_aluno_complemento: r.pendencia_aluno_complemento || '',
      pendencia_instituicao_complemento: r.pendencia_instituicao_complemento || '',
      pendencia_aberta: Boolean(r.pendencia_aberta),
      motivo_indeferimento: r.motivo_indeferimento || '',
      justificativa_indeferimento: r.justificativa_indeferimento || '',
      processo_sei_indeferimento: r.processo_sei_indeferimento || '',
      finalizado_em: r.finalizado_em || null,
      data_etapa_atual: r.data_etapa_atual || r.updated_at || r.created_at,
      created_at: r.created_at
    };
  }
  function redesenhar(){
    try { if(window.SIGEE_Processos && typeof window.SIGEE_Processos.contar==='function') window.SIGEE_Processos.contar();
      else if(typeof window.carregarEContarProcessosHorizontais==='function') window.carregarEContarProcessosHorizontais();
    } catch(e){ console.warn('[SIGEE] Falha ao redesenhar Central.',e); }
  }
  async function recarregar(silencioso=true){
    if(atualizando) return;
    const c=cliente(); if(!c) { status('off','🔴 Sem conexão'); return; }
    atualizando=true; status('wait','🟡 Atualizando...');
    try{
      const {data,error}=await c.from(tabelaProcessos()).select('*').order('id',{ascending:false});
      if(error) throw error;
      const lista=(data||[]).map(mapear).filter(Boolean);
      window.processosDB=lista;
      try { processosDB=lista; } catch(e){}
      redesenhar();
      status('ok','🟢 Sincronizado');
    }catch(e){
      status('off','🔴 Sem conexão');
      if(!silencioso) console.error('[SIGEE] Falha ao sincronizar processos:',e);
    }finally{ atualizando=false; }
  }
  function agendar(){
    clearTimeout(timer);
    timer=setTimeout(()=>recarregar(true),180);
  }
  function iniciarRealtime(){
    const c=cliente(); if(!c || typeof c.channel!=='function') return;
    try { if(canal) c.removeChannel(canal); } catch(e){}
    canal=c.channel('sigee-processos-central-v321')
      .on('postgres_changes',{event:'*',schema:'public',table:tabelaProcessos()},agendar)
      .subscribe((estado)=>{
        if(estado==='SUBSCRIBED') status('ok','🟢 Sincronizado');
        else if(estado==='CHANNEL_ERROR' || estado==='TIMED_OUT' || estado==='CLOSED') status('off','🔴 Sem conexão');
        else status('wait','🟡 Conectando...');
      });
  }
  async function copiar(valor){
    valor=String(valor||'').trim(); if(!valor) return;
    try{
      if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(valor);
      else {
        const ta=document.createElement('textarea'); ta.value=valor; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.focus(); ta.select();
        if(!document.execCommand('copy')) throw new Error('copy falhou'); ta.remove();
      }
      if(typeof window.mostrarToast==='function') window.mostrarToast('Código SIGEE copiado.');
      else {
        const aviso=document.createElement('div'); aviso.textContent='✓ Código SIGEE copiado'; aviso.className='fixed right-4 bottom-4 z-[99999] bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-xl'; document.body.appendChild(aviso); setTimeout(()=>aviso.remove(),1800);
      }
    }catch(e){ prompt('Copie o Código SIGEE:',valor); }
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-sigee-codigo]'); if(!b) return;
    e.preventDefault(); copiar(b.getAttribute('data-sigee-codigo'));
  });
  window.copiarCodigoSIGEE=copiar;
  window.recarregarCentralProcessosSIGEE=recarregar;
  window.iniciarRealtimeProcessosSIGEE=iniciarRealtime;

  window.addEventListener('online',()=>{ iniciarRealtime(); recarregar(true); });
  window.addEventListener('offline',()=>status('off','🔴 Offline'));
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) recarregar(true); });
  window.addEventListener('focus',()=>recarregar(true));
  window.addEventListener('load',()=>{ indicador(); iniciarRealtime(); setTimeout(()=>recarregar(true),400); });
})();


/* =====================================================================
   SIGEE Sprint 3.3.1A — Motor de Pendências e Checklist Operacional
   Base funcional: Sprint 3.3
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_FLUXO_ANALISE_331A__) return;
  window.__SIGEE_FLUXO_ANALISE_331A__=true;

  const MOTIVOS_INDEFERIMENTO=[
    'Não encontrados registros de curso/aprovação','Aluno desistente','Abandono de matrícula',
    'Indício de irregularidade','Matrícula cancelada',
    'Solicitação fora da competência do Setor de Escolas Extintas','Outros'
  ];
  const PEND_ALUNO=['RG','Histórico Ensino Fundamental','Histórico Ensino Médio','Outros'];
  const PEND_INST=['Atas','Caderneta','Diário de Classe','Outros'];
  let contextoRetorno=null;

  function txt(v){return v===null||v===undefined?'':String(v).trim();}
  function norm(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
  function usuario(){return window.usuarioLogado||{};}
  function identidadeSessao(){
    const u=usuario();
    return Object.freeze({
      id:u.id||null,
      nome:txt(u.nome||u.name||u.email||'Usuário SIGEE'),
      email:txt(u.email).toLowerCase()||null,
      perfil:txt(u.perfil)||null,
      nte:txt(u.nte||u.nte_nome||u.nte_vinculado||u.grupo)||null
    });
  }
  function perfil(){return norm(usuario().perfil);}
  function somenteLeitura(){return perfil().includes('ESTAG')||perfil().includes('CONSULT');}
  function lista(){return Array.isArray(window.processosDB)?window.processosDB:[];}
  function processo(id){return lista().find(p=>String(p.id)===String(id));}
  function cliente(){try{return window.obterSupabaseSIGEE?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.();}catch(e){return null;}}
  function agoraISO(){return new Date().toISOString();}
  function escapar(v){return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function nomeUsuario(){return txt(usuario().nome||usuario().email||'Usuário SIGEE');}
  function fecharModal(){document.getElementById('sigee-modal-fluxo33')?.remove();}
  function modal(titulo,conteudo,classe=''){
    fecharModal(); const el=document.createElement('div'); el.id='sigee-modal-fluxo33'; el.className='sigee-modal33-backdrop';
    el.innerHTML=`<section class="sigee-modal33 ${classe}"><header class="sigee-modal33-header"><h2>${titulo}</h2><button type="button" data-fechar-modal33>×</button></header><div class="sigee-modal33-body">${conteudo}</div></section>`;
    document.body.appendChild(el); el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-fechar-modal33]')) fecharModal();}); return el;
  }
  function toast(msg,tipo='ok'){if(typeof window.mostrarToast==='function')return window.mostrarToast(msg);const el=document.createElement('div');el.className=`sigee-toast33 ${tipo}`;el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2200);}
  async function registrarHistorico(p,etapa,acao,observacao='',dados={},ator=null){
    const c=cliente();
    const identidade=ator||identidadeSessao();
    const registro={
      processo_id:p.id,
      codigo_sigee:p.codigo_sigee||'',
      etapa:etapa||p.etapa_atual||p.etapa||'',
      acao,
      observacao:observacao||null,
      usuario_nome:identidade.nome,
      usuario_email:identidade.email,
      usuario_perfil:identidade.perfil,
      nte:identidade.nte||txt(p.nte||p.nte_nome)||null,
      dados:Object.assign({},dados||{},{
        usuario_id:identidade.id,
        usuario_nome:identidade.nome,
        usuario_email:identidade.email,
        usuario_perfil:identidade.perfil,
        usuario_nte:identidade.nte
      }),
      created_at:agoraISO()
    };
    try{if(!c)throw new Error('Cliente Supabase indisponível');const {error}=await c.from('historico_processos').insert(registro);if(error)throw error;return true;}catch(e){console.error('[SIGEE] Histórico não gravado.',e);toast('A ação foi salva, mas o histórico não pôde ser registrado.','erro');return false;}
  }
  async function salvar(p){if(window.SIGEE_Processos?.salvar)await window.SIGEE_Processos.salvar(p);if(window.recarregarCentralProcessosSIGEE)await window.recarregarCentralProcessosSIGEE(true);else window.SIGEE_Processos?.contar?.();}
  function resumo(p){const etapa=txt(p.etapa_atual||p.etapa),dias=window.SIGEE_Processos?.diasDesde?.(p.data_etapa_atual||p.created_at)||0,e=norm(etapa),limite=e.includes('ANAL')?7:e.includes('DIGIT')?15:e.includes('CONFER')?10:e.includes('ASSIN')?7:(p.prazo_etapa||null);const resp=p.tecnico_responsavel_nome||p.tecnico_responsavel||p.responsavel_nome||p.responsavel||p.analista_nome||p.analista||p.digitador_nome||p.digitador||p.conferente_nome||p.conferente||'Não atribuído';return `<div class="sigee-resumo33"><div><span>Aluno</span><strong>${escapar(p.aluno||p.aluno_nome||'-')}</strong></div><div><span>Código SIGEE</span><strong>${escapar(p.codigo_sigee||p.id||'-')}</strong></div><div><span>Escola</span><strong>${escapar(p.escola||p.escola_nome||'-')}</strong></div><div><span>NTE</span><strong>${escapar(p.nte||p.nte_nome||'-')}</strong></div><div><span>Responsável</span><strong>${escapar(resp)}</strong></div><div><span>Prazo</span><strong>${limite?`${dias}/${limite} dias`:`${dias} dias`}</strong></div></div>`;}
  function mensagemPendencia(aluno,inst){if(!aluno.length&&!inst.length)return null;if(aluno.length&&inst.length)return {codigo:'09',texto:'09 - Aluno Pendência (INSTITUIÇÃO e REQUERENTE)'};if(inst.length)return {codigo:'08',texto:'08 - Aluno Pendência (INSTITUIÇÃO)'};return {codigo:'07',texto:'07 - Aluno Pendência (Aluno)'};}
  function cardTarefa(msg,confirmado=false){if(!msg)return '';return `<section class="sigee-tarefa-obrigatoria33"><div class="sigee-tarefa-icone33">📧</div><div class="sigee-tarefa-conteudo33"><span>TAREFA OBRIGATÓRIA</span><strong>ENVIAR E-MAIL: ${escapar(msg.texto)}</strong><p>Execute a mensagem institucional na ferramenta de e-mail e confirme abaixo antes de registrar a pendência.</p><label><input type="checkbox" id="pend-email33" ${confirmado?'checked':''}> Confirmo que executei esta tarefa.</label></div></section>`;}
  function checks(valores,nome,selecionados=[]){return valores.map(v=>`<label class="sigee-check33"><input type="checkbox" name="${nome}" value="${escapar(v)}" ${selecionados.includes(v)?'checked':''}><span>${escapar(v)}</span></label>`).join('');}
  function marcados(el,nome){return [...el.querySelectorAll(`input[name="${nome}"]:checked`)].map(i=>i.value);}

  async function carregarPendencias(id){const c=cliente();if(!c)return [];try{const {data,error}=await c.from('processo_pendencias').select('*').eq('processo_id',id).order('id',{ascending:true});if(error)throw error;return data||[];}catch(e){console.error('[SIGEE] Falha ao carregar pendências.',e);return [];}}
  async function substituirPendencias(p,aluno,inst,compAluno,compInst,msg,ator){
    const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível');
    const identidade=ator||identidadeSessao();
    const {error:delError}=await c.from('processo_pendencias').delete().eq('processo_id',p.id).eq('status','pendente');if(delError)throw delError;
    const base={
      processo_id:p.id,
      codigo_sigee:p.codigo_sigee||'',
      complemento:null,
      status:'pendente',
      mensagem_codigo:msg.codigo,
      mensagem_texto:msg.texto,
      tarefa_confirmada:true,
      criado_por:identidade.nome,
      criado_por_email:identidade.email
    };
    const linhas=[
      ...aluno.map(item=>Object.assign({},base,{grupo:'aluno',item,complemento:compAluno||null})),
      ...inst.map(item=>Object.assign({},base,{grupo:'instituicao',item,complemento:compInst||null}))
    ];
    const {error}=await c.from('processo_pendencias').insert(linhas);if(error)throw error;
  }
  async function marcarRecebidas(ids,ator){
    if(!ids.length)return;
    const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível');
    const identidade=ator||identidadeSessao();
    const {error}=await c.from('processo_pendencias').update({
      status:'recebido',
      recebido_em:agoraISO(),
      recebido_por:identidade.nome,
      recebido_por_email:identidade.email
    }).in('id',ids);
    if(error)throw error;
  }

  function retornarAnaliseConsolidada(id){
    fecharModal();
    if(window.SIGEE_WORKFLOW_093 && typeof window.SIGEE_WORKFLOW_093.abrirAnalise==='function'){
      return window.SIGEE_WORKFLOW_093.abrirAnalise(id);
    }
    if(typeof window.abrirAnaliseSIGEE==='function' && window.abrirAnaliseSIGEE!==abrirAnalise){
      return window.abrirAnaliseSIGEE(id);
    }
    return abrirAnalise(id);
  }
  async function prosseguirAnalise(id){
    const p=processo(id);if(!p)return;
    /* Segurança: a Análise nunca pode alterar diretamente a etapa.
       O avanço obrigatório passa pela seleção do digitador e confirmação da mensagem. */
    if(window.SIGEE_WORKFLOW_093 && typeof window.SIGEE_WORKFLOW_093.abrirEncaminharDigitacao==='function'){
      return window.SIGEE_WORKFLOW_093.abrirEncaminharDigitacaoAnalise(id);
    }
    if(typeof window.abrirEncaminharDigitacaoSIGEE==='function'){
      return window.abrirEncaminharDigitacaoSIGEE(id,{origem:'Análise realizada'});
    }
    alert('A janela obrigatória de encaminhamento para Digitação não está disponível. O processo não foi alterado.');
  }
  function abrirAnalise(id){const p=processo(id);if(!p)return;contextoRetorno=()=>abrirAnalise(id);const bloqueio=somenteLeitura()?'<p class="sigee-aviso33">Perfil com acesso somente para consulta.</p>':'';const acoes=somenteLeitura()?'':`<div class="sigee-acoes33"><button type="button" class="btn33 btn33-amarelo" data-prosseguir33>✍️ Prosseguir para Digitação</button><button type="button" class="btn33 btn33-roxo" data-pendencia33>⚠️ Registrar Pendência</button><button type="button" class="btn33 btn33-vermelho" data-indeferir33>⛔ Indeferir Processo</button></div>`;const el=modal(`🔍 Análise Realizada — ${escapar(p.codigo_sigee||p.id)}`,`${resumo(p)}${bloqueio}${acoes}<div class="sigee-linkhistorico33"><button data-historico33>📜 Ver histórico completo</button></div>`,'analise');el.querySelector('[data-prosseguir33]')?.addEventListener('click',()=>prosseguirAnalise(id));el.querySelector('[data-pendencia33]')?.addEventListener('click',()=>abrirFormularioPendencia(id));el.querySelector('[data-indeferir33]')?.addEventListener('click',()=>abrirFormularioIndeferimento(id));el.querySelector('[data-historico33]')?.addEventListener('click',()=>abrirHistorico(id,()=>abrirAnalise(id)));}

  async function abrirFormularioPendencia(id){
    const p=processo(id);if(!p||somenteLeitura())return; contextoRetorno=()=>abrirFormularioPendencia(id);
    /* Ao abrir “Registrar Pendência”, todas as opções começam desmarcadas.
       Pendências já existentes são tratadas na janela própria “Tratar Pendência”. */
    const selecionadosAluno=[]; const selecionadosInst=[];
    const compAluno=''; const compInst='';
    const el=modal(`⚠️ Registrar Pendência — ${escapar(p.codigo_sigee||p.id)}`,`${resumo(p)}<div class="sigee-gridpend33"><fieldset><legend>Pendência do Aluno</legend>${checks(PEND_ALUNO,'pendAluno',selecionadosAluno)}<label id="label-pend-aluno-comp33">Complemento (opcional)<textarea id="pend-aluno-comp33">${escapar(compAluno)}</textarea></label></fieldset><fieldset><legend>Pendência da Instituição</legend>${checks(PEND_INST,'pendInst',selecionadosInst)}<label id="label-pend-inst-comp33">Complemento (opcional)<textarea id="pend-inst-comp33">${escapar(compInst)}</textarea></label></fieldset></div><div id="tarefa-email33"></div><div class="sigee-acoes33"><button type="button" class="btn33 btn33-cinza" data-voltar33>Voltar</button><button type="button" class="btn33 btn33-roxo" data-salvar-pend33 disabled>Registrar Pendência</button></div>`,'pendencia');
    const botao=el.querySelector('[data-salvar-pend33]');
    function atualizarTarefa(){
      const a=marcados(el,'pendAluno'),i=marcados(el,'pendInst'),m=mensagemPendencia(a,i);
      const outrosAluno=a.includes('Outros'),outrosInst=i.includes('Outros');
      const la=el.querySelector('#label-pend-aluno-comp33'),li=el.querySelector('#label-pend-inst-comp33');
      if(la)la.childNodes[0].nodeValue=outrosAluno?'Descrição de “Outros” (obrigatória)':'Complemento (opcional)';
      if(li)li.childNodes[0].nodeValue=outrosInst?'Descrição de “Outros” (obrigatória)':'Complemento (opcional)';
      el.querySelector('#pend-aluno-comp33')?.toggleAttribute('required',outrosAluno);
      el.querySelector('#pend-inst-comp33')?.toggleAttribute('required',outrosInst);
      el.querySelector('#tarefa-email33').innerHTML=cardTarefa(m,false);
      const check=el.querySelector('#pend-email33');
      if(check)check.addEventListener('change',()=>{botao.disabled=!check.checked;});
      botao.disabled=true;
    }
    el.querySelectorAll('input[name="pendAluno"],input[name="pendInst"]').forEach(i=>i.addEventListener('change',atualizarTarefa)); atualizarTarefa();
    el.querySelector('[data-voltar33]').addEventListener('click',()=>retornarAnaliseConsolidada(id));
    botao.addEventListener('click',async()=>{const aluno=marcados(el,'pendAluno'),inst=marcados(el,'pendInst');if(!aluno.length&&!inst.length)return alert('Selecione ao menos uma pendência.');if(!el.querySelector('#pend-email33')?.checked)return alert('Confirme a execução da tarefa obrigatória.');const ca=txt(el.querySelector('#pend-aluno-comp33').value),ci=txt(el.querySelector('#pend-inst-comp33').value),msg=mensagemPendencia(aluno,inst);if(aluno.includes('Outros')&&!ca)return alert('Informe a descrição da pendência “Outros” do Aluno/Requerente.');if(inst.includes('Outros')&&!ci)return alert('Informe a descrição da pendência “Outros” da Instituição.');botao.disabled=true;try{const ator=identidadeSessao();await substituirPendencias(p,aluno,inst,ca,ci,msg,ator);p.pendencia_aluno_itens=aluno;p.pendencia_instituicao_itens=inst;p.pendencia_aluno_complemento=ca;p.pendencia_instituicao_complemento=ci;p.pendencia_aberta=true;p.etapa=p.etapa_atual='Pendência';p.data_etapa_atual=agoraISO();p.tecnico_responsavel=ator.nome;await salvar(p);const obs=[aluno.length?`Aluno: ${aluno.join(', ')}`:'',inst.length?`Instituição: ${inst.join(', ')}`:'',ca?`Complemento aluno: ${ca}`:'',ci?`Complemento instituição: ${ci}`:'',`Tarefa confirmada: ENVIAR E-MAIL ${msg.texto}`].filter(Boolean).join(' | ');await registrarHistorico(p,'Pendência','Pendência registrada',obs,{aluno,instituicao:inst,mensagem:msg,tarefa_confirmada:true},ator);
        fecharModal();
        if (typeof window.filtrarProcessosPorEtapa === 'function') {
          window.filtrarProcessosPorEtapa('Pendência');
        }
        if (typeof window.carregarEContarProcessosHorizontais === 'function') {
          window.carregarEContarProcessosHorizontais();
        } else if (window.SIGEE_Processos && typeof window.SIGEE_Processos.contar === 'function') {
          window.SIGEE_Processos.contar();
        }
        toast('Pendência registrada. Processo movido para a aba Pendência.');}catch(e){console.error(e);alert('Não foi possível registrar a pendência: '+(e.message||e));botao.disabled=false;}});
  }

  async function abrirTratarPendencia(id){
    const p=processo(id);if(!p)return;contextoRetorno=()=>abrirTratarPendencia(id);const dados=await carregarPendencias(id);const pendentes=dados.filter(x=>x.status==='pendente'),recebidos=dados.filter(x=>x.status==='recebido');
    if(!pendentes.length){modal(`⚠️ Pendência — ${escapar(p.codigo_sigee||p.id)}`,`${resumo(p)}<div class="sigee-vazio33">Não há pendências abertas para este processo.</div><div class="sigee-acoes33"><button class="btn33 btn33-vermelho" data-hist33>Histórico</button></div>`,'pendencia').querySelector('[data-hist33]')?.addEventListener('click',()=>abrirHistorico(id,()=>abrirTratarPendencia(id)));return;}
    const itens=pendentes.map(x=>`<label class="sigee-pend-item331"><input type="checkbox" name="receb331" value="${x.id}"><span><strong>${escapar(x.item)}</strong><small>${x.grupo==='aluno'?'Aluno/Requerente':'Instituição'}${x.complemento?` — ${escapar(x.complemento)}`:''}</small></span></label>`).join('');
    const msg=pendentes[0]?.mensagem_texto||mensagemPendencia(pendentes.filter(x=>x.grupo==='aluno'),pendentes.filter(x=>x.grupo==='instituicao')).texto;
    const ator=identidadeSessao();
    const responsavel=`<section class="sigee-responsavel-acao33"><div class="sigee-responsavel-icone33">👤</div><div><span>RESPONSÁVEL PELA AÇÃO</span><input type="text" value="${escapar(ator.nome)}" disabled><small>${escapar(ator.perfil||'Usuário')} · ${escapar(ator.nte||'SIGEE')}</small></div></section>`;
    const tarefa=`<section class="sigee-tarefa-obrigatoria33"><div class="sigee-tarefa-icone33">📧</div><div class="sigee-tarefa-conteudo33"><span>TAREFA OBRIGATÓRIA</span><strong>ENVIAR E-MAIL: ${escapar(msg)}</strong><p>Execute a mensagem institucional e confirme a realização da tarefa antes de registrar o recebimento.</p><label><input type="checkbox" id="wf-pend-retorno-email33"> Confirmo que executei esta tarefa.</label></div></section>`;
    const el=modal(`⚠️ Tratar Pendência — ${escapar(p.codigo_sigee||p.id)}`,`${resumo(p)}${responsavel}<section class="sigee-pend-atual33"><h3>Pendências abertas</h3>${itens}</section>${recebidos.length?`<p class="sigee-recebidos331">Já recebidos: ${escapar(recebidos.map(x=>x.item).join(', '))}</p>`:''}${tarefa}<div class="sigee-acoes33"><button class="btn33 sigee-historico33" data-hist33>📜 Histórico</button>${somenteLeitura()?'':`<button class="btn33 btn33-verde" data-salvar-receb33 disabled>Registrar Documento Recebido</button>`}</div>`,'pendencia');
    const btn=el.querySelector('[data-salvar-receb33]'); const chkEmail=el.querySelector('#wf-pend-retorno-email33');
    const validar=()=>{if(btn)btn.disabled=!(chkEmail?.checked&&el.querySelector('input[name="receb331"]:checked'));};
    chkEmail?.addEventListener('change',validar);el.querySelectorAll('input[name="receb331"]').forEach(x=>x.addEventListener('change',validar));
    el.querySelector('[data-hist33]')?.addEventListener('click',()=>abrirHistorico(id,()=>abrirTratarPendencia(id)));
    btn?.addEventListener('click',async()=>{const ids=[...el.querySelectorAll('input[name="receb331"]:checked')].map(x=>Number(x.value));if(!ids.length)return alert('Marque ao menos um item recebido.');if(!chkEmail?.checked)return alert('Confirme o envio da mensagem institucional.');try{btn.disabled=true;await marcarRecebidas(ids,ator);const restantes=pendentes.filter(x=>!ids.includes(Number(x.id)));const completo=restantes.length===0;p.pendencia_aberta=!completo;p.etapa=p.etapa_atual='Pendência';p.data_etapa_atual=agoraISO();p.tecnico_responsavel=ator.nome;p.pendencia_aluno_itens=restantes.filter(x=>x.grupo==='aluno').map(x=>x.item);p.pendencia_instituicao_itens=restantes.filter(x=>x.grupo==='instituicao').map(x=>x.item);await salvar(p);const recebidosAgora=pendentes.filter(x=>ids.includes(Number(x.id))).map(x=>x.item);await registrarHistorico(p,'Pendência',completo?'Pendência resolvida':'Recebimento parcial',`Recebido: ${recebidosAgora.join(', ')} | Mensagem confirmada: ${msg}`,{itens_recebidos:recebidosAgora,pendencia_resolvida:completo,mensagem_confirmada:msg},ator);if(completo){fecharModal();toast('Pendência totalmente resolvida. Selecione o digitador e confirme a mensagem obrigatória.');setTimeout(()=>{const wf=window.SIGEE_WORKFLOW_093; if(wf?.abrirEncaminharDigitacaoPendencia) wf.abrirEncaminharDigitacaoPendencia(id); else window.abrirEncaminharDigitacaoPendenciaSIGEE?.(id);},0);}else{toast('Recebimento parcial registrado.');await abrirTratarPendencia(id);}}catch(e){console.error(e);btn.disabled=false;alert('Não foi possível registrar o recebimento: '+(e.message||e));}});
  }

  function formatarSEI(v){const d=txt(v).replace(/\D/g,'').slice(0,20);let o='';if(d.length)o+=d.slice(0,3);if(d.length>3)o+='.'+d.slice(3,7);if(d.length>7)o+='.'+d.slice(7,11);if(d.length>11)o+='.'+d.slice(11,18);if(d.length>18)o+='-'+d.slice(18,20);return o;}
  function seiValido(v){return /^\d{3}\.\d{4}\.\d{4}\.\d{7}-\d{2}$/.test(txt(v));}
  function abrirFormularioIndeferimento(id){
    const p=processo(id);
    if(!p||somenteLeitura())return;
    contextoRetorno=()=>abrirFormularioIndeferimento(id);
    const radios=MOTIVOS_INDEFERIMENTO.map(m=>`<label class="sigee-radio33"><input type="radio" name="motivoInd33" value="${escapar(m)}"><span>${escapar(m)}</span></label>`).join('');
    const el=modal(
      `⛔ Indeferir Processo — ${escapar(p.codigo_sigee||p.id)}`,
      `${resumo(p)}<fieldset class="sigee-field33"><legend>Motivo do indeferimento (selecione apenas um)</legend>${radios}</fieldset><div id="box-sei33" class="hidden sigee-condicional33"><label>Nº do Processo SEI *<input id="processo-sei33" maxlength="24" placeholder="011.7644.2025.0117641-86"></label></div><div id="box-outros33" class="hidden sigee-condicional33"><label>Justificativa *<textarea id="justificativa-ind33"></textarea></label></div><div class="sigee-acoes33"><button type="button" class="btn33 btn33-cinza" data-voltar33>Voltar</button><button type="button" class="btn33 btn33-vermelho" data-confirmar-ind33>Confirmar Indeferimento</button></div>`,
      'indeferimento'
    );
    const boxSei=el.querySelector('#box-sei33');
    const boxOutros=el.querySelector('#box-outros33');
    const inpSei=el.querySelector('#processo-sei33');
    const btn=el.querySelector('[data-confirmar-ind33]');
    el.querySelectorAll('input[name="motivoInd33"]').forEach(r=>r.addEventListener('change',()=>{
      const v=el.querySelector('input[name="motivoInd33"]:checked')?.value||'';
      boxSei.classList.toggle('hidden',!v.startsWith('Solicitação fora'));
      boxOutros.classList.toggle('hidden',v!=='Outros');
    }));
    inpSei.addEventListener('input',()=>inpSei.value=formatarSEI(inpSei.value));
    el.querySelector('[data-voltar33]').addEventListener('click',()=>retornarAnaliseConsolidada(id));
    btn.addEventListener('click',async()=>{
      const motivo=el.querySelector('input[name="motivoInd33"]:checked')?.value;
      if(!motivo)return alert('Selecione um motivo de indeferimento.');
      const fora=motivo.startsWith('Solicitação fora');
      const outros=motivo==='Outros';
      const sei=txt(inpSei.value);
      const just=txt(el.querySelector('#justificativa-ind33').value);
      if(fora&&!seiValido(sei))return alert('Informe um número de Processo SEI válido.');
      if(outros&&!just)return alert('Informe a justificativa do indeferimento.');
      if(!confirm('Confirma o indeferimento? O processo será finalizado imediatamente.'))return;
      btn.disabled=true;
      try{
        const instante=agoraISO();
        p.motivo_indeferimento=motivo;
        p.processo_sei_indeferimento=fora?sei:null;
        p.justificativa_indeferimento=outros?just:null;
        p.etapa='Indeferido';
        p.etapa_atual='Indeferido';
        p.data_etapa_atual=instante;
        p.finalizado_em=instante;
        p.updated_at=instante;
        p.tecnico_responsavel=nomeUsuario();
        p.pendencia_aberta=false;
        await salvar(p);
        await registrarHistorico(p,'Indeferido','Processo indeferido',[motivo,fora?`Processo SEI: ${sei}`:'',outros?just:''].filter(Boolean).join(' | '),{motivo,processo_sei:sei||null});
        fecharModal();
        if(typeof window.filtrarProcessosPorEtapa==='function')window.filtrarProcessosPorEtapa('Indeferido');
        if(typeof window.carregarEContarProcessosHorizontais==='function')window.carregarEContarProcessosHorizontais();
        toast('Processo indeferido e registrado no histórico.');
      }catch(e){
        console.error('[SIGEE] Falha ao indeferir processo.',e);
        alert('Não foi possível indeferir o processo: '+(e.message||e));
        btn.disabled=false;
      }
    });
  }

  async function abrirHistorico(id,retorno){const p=processo(id);if(!p)return;const voltar=retorno||contextoRetorno;const el=modal(`📜 Histórico — ${escapar(p.codigo_sigee||p.id)}`,'<div class="sigee-loading33">Carregando histórico...</div>','historico');let dados=[];try{const c=cliente();if(c){const {data,error}=await c.from('historico_processos').select('*').eq('processo_id',p.id).order('created_at',{ascending:false});if(error)throw error;dados=data||[];}}catch(e){console.error(e);}const corpo=el.querySelector('.sigee-modal33-body');corpo.innerHTML=`${dados.length?`<div class="sigee-timeline33">${dados.map(h=>`<article><span class="sigee-timeline-dot33"></span><time>${escapar(new Date(h.created_at).toLocaleString('pt-BR'))}</time><h3>${escapar(h.acao)}</h3><p><strong>${escapar(h.etapa||'')}</strong> — ${escapar(h.usuario_nome||'')}</p>${h.observacao?`<p>${escapar(h.observacao)}</p>`:''}</article>`).join('')}</div>`:'<div class="sigee-vazio33">Nenhuma movimentação registrada.</div>'}<div class="sigee-acoes33"><button class="btn33 btn33-cinza" data-voltar-hist331>Voltar</button></div>`;corpo.querySelector('[data-voltar-hist331]').addEventListener('click',()=>{
      fecharModal();
      if(typeof voltar==='function') setTimeout(()=>voltar(),0);
    });}

  window.abrirAnaliseSIGEE=abrirAnalise;
  window.abrirRegistrarPendenciaSIGEE=abrirFormularioPendencia;
  window.abrirIndeferimentoSIGEE=abrirFormularioIndeferimento;
  window.abrirPendenciaSIGEE=abrirTratarPendencia;
  window.abrirHistoricoProcessoSIGEE=abrirHistorico;
  window.abrirHistoricoSIGEE=abrirHistorico;
})();

/* =====================================================================
   SIGEE Enterprise v0.9.3 — Workflow Operacional Consolidado
   Regras: comunicação institucional é uma trava de segurança; o SIGEE
   não envia e-mail automaticamente. O técnico confirma a execução.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_093__) return;
  window.__SIGEE_WORKFLOW_093__ = true;

  const MENSAGENS = {
    digitacao:   {codigo:'03', texto:'03 - Aluno (Digitação)'},
    conferencia: {codigo:'04', texto:'04 - Aluno (Conferência)'},
    assinatura:  {codigo:'05', texto:'05 - Aluno (Assinatura)'},
    deferido:    {codigo:'06', texto:'06 - Aluno (Deferido)'}
  };

  function txt(v){ return v === null || v === undefined ? '' : String(v).trim(); }
  function norm(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function esc(v){ return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function usuario(){ return window.usuarioLogado || {}; }
  function somenteLeitura(){ const p=norm(usuario().perfil); return p.includes('ESTAG') || p.includes('CONSULT'); }
  function processos(){ return Array.isArray(window.processosDB) ? window.processosDB : []; }
  function processo(id){ return processos().find(p=>String(p.id)===String(id)); }
  function agora(){ return new Date().toISOString(); }
  function nomeUsuario(){ return txt(usuario().nome || usuario().email || 'Usuário SIGEE'); }
  function cliente(){ try{return window.obterSupabaseSIGEE?.() || window.criarClienteSupabaseSIGEE?.() || window.SIGEE_SUPABASE?.criarCliente?.();}catch(e){return null;} }
  function nteNumero(v){ const m=txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i); return m?Number(m[1]):null; }
  function mesmoNte(a,b){ const x=nteNumero(a),y=nteNumero(b); return x&&y ? x===y : norm(a)===norm(b); }

  function fechar(){ document.getElementById('sigee-modal-workflow093')?.remove(); }
  function modal(titulo,conteudo,etapa='padrao'){
    fechar();
    const el=document.createElement('div');
    el.id='sigee-modal-workflow093';
    el.className='sigee-modal33-backdrop';
    el.innerHTML=`<section class="sigee-modal33 workflow093 sigee-wf-etapa-${etapa}"><header class="sigee-modal33-header"><h2>${titulo}</h2><button type="button" data-fechar093>×</button></header><div class="sigee-modal33-body">${conteudo}</div></section>`;
    document.body.appendChild(el);
    el.addEventListener('click',e=>{ if(e.target===el || e.target.closest('[data-fechar093]')) fechar(); });
    return el;
  }
  function toast(msg){ if(typeof window.mostrarToast==='function') return window.mostrarToast(msg); alert(msg); }
  function responsavelAtual(p){
    return txt(p.tecnico_responsavel_nome||p.tecnico_responsavel||p.responsavel_nome||p.responsavel||p.analista_nome||p.analista||p.digitador_nome||p.digitador||p.conferente_nome||p.conferente)||'Não atribuído';
  }
  function prazoAtual(p){
    const etapa=norm(p.etapa_atual||p.etapa); const inicio=p.data_etapa_atual||p.prazo_inicio||p.created_at;
    let dias=0; if(inicio){ const d=new Date(inicio); if(!Number.isNaN(d.getTime())) dias=Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)); }
    const limite=etapa.includes('ANAL')?7:etapa.includes('DIGIT')?15:etapa.includes('CONFER')?10:etapa.includes('ASSIN')?7:(p.prazo_etapa||null);
    return limite?`${dias}/${limite} dias`:`${dias} dias`;
  }
  function cabecalho(p){
    const codigo=txt(p.codigo_sigee || p.id);
    return `<div class="sigee-resumo33"><div><span>Aluno</span><strong>${esc(p.aluno||p.aluno_nome||'-')}</strong></div><div><span>Código SIGEE</span><strong>${esc(codigo)}</strong></div><div><span>Escola</span><strong>${esc(p.escola||p.escola_nome||'-')}</strong></div><div><span>NTE</span><strong>${esc(p.nte||p.nte_nome||'-')}</strong></div><div><span>Responsável</span><strong>${esc(responsavelAtual(p))}</strong></div><div><span>Prazo</span><strong>${esc(prazoAtual(p))}</strong></div></div>`;
  }
  function responsavelOperador(){
    const u=usuario();
    return `<section class="sigee-responsavel-acao33"><div class="sigee-responsavel-icone33">👤</div><div><span>RESPONSÁVEL PELA AÇÃO</span><input type="text" value="${esc(nomeUsuario())}" disabled><small>${esc(txt(u.perfil)||'Usuário')} · ${esc(txt(u.nte||u.nte_nome||u.grupo)||'SIGEE')}</small></div></section>`;
  }
  function tarefa(msg,id='wf-email093'){
    return `<section class="sigee-tarefa-obrigatoria33"><div class="sigee-tarefa-icone33">📧</div><div class="sigee-tarefa-conteudo33"><span>TAREFA OBRIGATÓRIA</span><strong>ENVIAR E-MAIL: ${esc(msg.texto)}</strong><p>Execute a mensagem institucional na ferramenta de e-mail. Em seguida, confirme a realização da tarefa para liberar o avanço.</p><label><input type="checkbox" id="${id}"> Confirmo que executei esta tarefa.</label></div></section>`;
  }
  function perfilAtualWorkflow(){
    const u=usuario();
    const email=norm(u.email);
    const bruto=norm(u.perfil || u.role || u.tipo_perfil || u.tipo || u.nivel || u.acesso);
    if(email==='ELMO.LOBAO@ENOVA.EDUCACAO.BA.GOV.BR') return 'MASTER';
    if(email==='SEC@ENOVA.EDUCACAO.BA.GOV.BR') return 'SEC';
    if(bruto.includes('MASTER')) return 'MASTER';
    if(bruto==='SEC' || bruto.includes('TODOS OS NTES')) return 'SEC';
    if(bruto.includes('ADMIN')) return 'ADMINISTRADOR';
    if(bruto.includes('TECN')) return 'TECNICO';
    if(bruto.includes('ESTAG')) return 'ESTAGIARIO';
    if(bruto.includes('CONSULT')) return 'CONSULTA';
    return bruto;
  }
  function usuarioTemAcessoGlobal(){
    const p=perfilAtualWorkflow();
    return p==='MASTER' || p==='SEC';
  }
  function nteCadastroUsuario(){
    const u=usuario();
    return txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo);
  }
  function normalizarUsuarioTecnico(u){
    if(!u) return null;
    return {
      ...u,
      nome: txt(u.nome || u.nome_completo || u.display_name || u.email),
      email: txt(u.email),
      perfil: txt(u.perfil || u.role || u.tipo_perfil),
      nte: txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo),
      ativo: u.ativo !== false && norm(u.status || 'ATIVO') !== 'INATIVO'
    };
  }
  async function usuariosElegiveis(p){
    const mapa=new Map();
    const adicionar=(u)=>{
      const item=normalizarUsuarioTecnico(u);
      if(!item) return;
      const chave=norm(item.email || item.nome) + '|' + norm(item.nte);
      if(chave && !mapa.has(chave)) mapa.set(chave,item);
    };
    (Array.isArray(window.usuariosDB)?window.usuariosDB:[]).forEach(adicionar);

    /* Para Master e SEC, garante a leitura de todos os técnicos no Supabase,
       mesmo quando o cache local foi carregado apenas com o NTE do último acesso. */
    if(usuarioTemAcessoGlobal()){
      try{
        const c=cliente();
        if(c){
          const {data,error}=await c.from('usuarios_sigee').select('*');
          if(error) throw error;
          (data||[]).forEach(adicionar);
        }
      }catch(e){
        console.warn('[SIGEE] Não foi possível complementar a lista global de técnicos.',e);
      }
    }

    let base=[...mapa.values()].filter(u=>u.ativo && norm(u.perfil).includes('TECNIC'));

    /* Somente Master e SEC têm visão global. Todos os demais perfis ficam
       limitados ao NTE cadastrado no próprio usuário, e não ao NTE do processo. */
    if(!usuarioTemAcessoGlobal()){
      const ntePermitido=nteCadastroUsuario();
      base=base.filter(u=>mesmoNte(u.nte,ntePermitido));
    }
    return base.sort((a,b)=>{
      const na=nteNumero(a.nte)||99;
      const nb=nteNumero(b.nte)||99;
      return na-nb || txt(a.nome||a.email).localeCompare(txt(b.nome||b.email),'pt-BR');
    });
  }
  function selectTecnico(p,id,rotulo,lista){
    lista=Array.isArray(lista)?lista:[];
    const op=lista.map(u=>`<option value="${esc(u.nome||u.email)}">${esc(u.nome||u.email)}${(u.nte||u.nte_nome||u.grupo)?` — ${esc(u.nte||u.nte_nome||u.grupo)}`:''}</option>`).join('');
    const escopo=usuarioTemAcessoGlobal()?'Todos os NTEs':'NTE de cadastro do usuário';
    return `<section class="sigee-selecao-obrigatoria093" data-selecao-tecnico093 style="margin:18px 0;padding:20px;border:3px solid #f59e0b;border-radius:18px;background:linear-gradient(135deg,rgba(146,64,14,.58),rgba(15,23,42,.98));box-shadow:0 0 0 5px rgba(245,158,11,.16),0 16px 34px rgba(0,0,0,.38)">
      <div class="sigee-selecao-cabecalho093">
        <span class="sigee-selecao-icone093">👤</span>
        <div><strong>SELEÇÃO OBRIGATÓRIA</strong><small>${esc(rotulo)} — ${esc(escopo)}</small></div>
      </div>
      <label class="sigee-workflow-campo093"><span>${esc(rotulo)} *</span><select id="${id}"><option value="">Selecione o profissional...</option>${op}</select></label>
      <p class="sigee-selecao-aviso093" data-aviso-tecnico093>⚠ Selecione um profissional para liberar o avanço.</p>
      ${lista.length?'':`<p class="sigee-selecao-semusuarios093">Nenhum técnico ativo foi localizado para este escopo.</p>`}
    </section>`;
  }
  async function preencherSelectTecnicoWorkflow(select,p){
    if(!select) return;
    const valorAnterior=select.value;
    /* Usa a mesma fonte/regra consolidada do seletor de Analista.
       Master e SEC veem todos os NTEs; demais perfis, somente o NTE de cadastro. */
    if(typeof window.preencherSelectTecnicosPorNte==='function'){
      try{
        const nteFiltro=usuarioTemAcessoGlobal() ? 'SEC - TODOS OS NTEs' : nteCadastroUsuario();
        window.preencherSelectTecnicosPorNte(select.id,nteFiltro);
        if(valorAnterior && [...select.options].some(o=>o.value===valorAnterior)) select.value=valorAnterior;
        return;
      }catch(e){ console.warn('[SIGEE] Falha ao usar seletor oficial de técnicos.',e); }
    }
    const lista=await usuariosElegiveis(p);
    select.innerHTML='<option value="">Selecione o profissional...</option>'+lista.map(u=>`<option value="${esc(u.nome||u.email)}">${esc(u.nome||u.email)}${u.nte?` — ${esc(u.nte)}`:''}</option>`).join('');
  }

  function atualizarDestaqueTecnico(el,sel){
    const box=el.querySelector('[data-selecao-tecnico093]');
    const aviso=el.querySelector('[data-aviso-tecnico093]');
    if(!box||!aviso) return;
    const ok=Boolean(sel.value);
    box.classList.toggle('selecionado',ok);
    aviso.textContent=ok?`✓ Profissional selecionado: ${sel.value}`:'⚠ Selecione um profissional para liberar o avanço.';
  }
  async function historico(p,etapa,acao,observacao,dados={}){
    const c=cliente();
    const reg={processo_id:p.id,codigo_sigee:p.codigo_sigee||'',etapa,acao,observacao:observacao||null,usuario_nome:nomeUsuario(),usuario_email:txt(usuario().email)||null,usuario_perfil:txt(usuario().perfil)||null,nte:txt(p.nte||p.nte_nome)||null,dados,created_at:agora()};
    try{ if(!c) throw new Error('Cliente indisponível'); const {error}=await c.from('historico_processos').insert(reg); if(error) throw error; }
    catch(e){ console.error('[SIGEE] Falha ao registrar histórico do workflow.',e); }
  }
  async function salvar(p){
    if(window.SIGEE_Processos?.salvar) await window.SIGEE_Processos.salvar(p);
    if(window.recarregarCentralProcessosSIGEE) await window.recarregarCentralProcessosSIGEE(true);
    else window.SIGEE_Processos?.contar?.();
  }
  function bloquearLeitura(){ if(!somenteLeitura()) return false; alert('Este perfil possui acesso somente para consulta.'); return true; }

  async function abrirEncaminharDigitacao(id,opcoes={}){
    const p=processo(id); if(!p || bloquearLeitura()) return;
    const etapaOrigem=norm(p.etapa_atual||p.etapa);
    const origemTipo=norm(opcoes.tipo||opcoes.origem||'ANALISE');
    const veioPendencia=origemTipo.includes('PENDENCIA');
    const origemEsperada=veioPendencia?'PENDENCIA':'ANALISE';

    if(etapaOrigem!==origemEsperada){
      alert(`A ação não pode ser executada: o processo está em ${p.etapa_atual||p.etapa||'etapa desconhecida'}, mas esta janela pertence à etapa ${veioPendencia?'Pendência':'Análise'}.`);
      return;
    }
    if(veioPendencia && p.pendencia_aberta){
      alert('Ainda existem pendências abertas. Registre o recebimento de todos os itens antes de encaminhar para Digitação.');
      return;
    }

    const msg=MENSAGENS.digitacao;
    const origem=veioPendencia?'Pendência resolvida':'Análise realizada';
    const idCheck=veioPendencia?'wf-email-pendencia093':'wf-email-analise093';
    const titulo=veioPendencia?'✍️ Pendência Sanada — Enviar para Digitação':'✍️ Análise Concluída — Enviar para Digitação';
    const el=modal(`${titulo} — ${esc(p.codigo_sigee||p.id)}`,`${cabecalho(p)}${selectTecnico(p,'wf-digitador093','Responsável pela Digitação',[])}${tarefa(msg,idCheck)}<div class="sigee-acoes33"><button type="button" class="btn33 btn33-vermelho" data-cancelar093>Cancelar</button><button type="button" class="btn33 btn33-verde" data-confirmar093 disabled>Enviar para Digitação</button></div>`,'digitacao');
    const sel=el.querySelector('#wf-digitador093'),chk=el.querySelector('#'+idCheck),btn=el.querySelector('[data-confirmar093]');
    chk.checked=false;
    chk.dataset.confirmado='0';
    await preencherSelectTecnicoWorkflow(sel,p);
    const semUsuarios=el.querySelector('.sigee-selecao-semusuarios093'); if(semUsuarios) semUsuarios.remove();
    const validar=()=>{
      atualizarDestaqueTecnico(el,sel);
      btn.disabled=!(sel.value && chk.checked && chk.dataset.confirmado==='1');
    };
    sel.addEventListener('change',validar);
    chk.addEventListener('change',()=>{ chk.dataset.confirmado=chk.checked?'1':'0'; validar(); });
    validar();
    el.querySelector('[data-cancelar093]').addEventListener('click',fechar);
    btn.addEventListener('click',async()=>{
      const etapaNoClique=norm(p.etapa_atual||p.etapa);
      if(etapaNoClique!==origemEsperada){
        alert('A etapa do processo foi alterada durante a operação. Reabra a janela antes de continuar.');
        fechar();
        return;
      }
      if(!sel.value) return alert('Selecione o responsável pela Digitação.');
      if(!chk.checked || chk.dataset.confirmado!=='1') return alert('Confirme manualmente o envio da mensagem institucional 03.');
      btn.disabled=true;
      const digitador=sel.value;
      const instante=agora();
      try{
        p.etapa_atual='Digitação';
        delete p.etapa;
        p.etapa_codigo=null;
        p.data_etapa_atual=instante;
        p.prazo_inicio=instante;
        p.prazo_fim=null;
        p.prazo_etapa=15;
        p.updated_at=instante;
        p.tecnico_responsavel=digitador;
        p.tecnico_responsavel_nome=digitador;
        p.responsavel=digitador;
        p.responsavel_nome=digitador;
        p.digitador=digitador;
        p.digitador_nome=digitador;
        if(veioPendencia){
          p.pendencia_aberta=false;
          p.pendencia_aluno_itens=[];
          p.pendencia_instituicao_itens=[];
          p.pendencia_aluno_complemento=null;
          p.pendencia_instituicao_complemento=null;
          p.pendencia_restante=null;
          p.ultimo_evento_workflow='PENDENCIA_SANADA_PARA_DIGITACAO';
        }else{
          p.ultimo_evento_workflow='ANALISE_PARA_DIGITACAO';
        }
        p.ultima_mensagem_workflow=msg.codigo;

        await salvar(p);
        await historico(
          p,
          'Digitação',
          veioPendencia?'Pendência sanada — encaminhado para Digitação':'Análise concluída — encaminhado para Digitação',
          `${origem}. Digitador: ${digitador}. Tarefa confirmada: ENVIAR E-MAIL ${msg.texto}.`,
          {origem:origemEsperada,digitador,mensagem:msg,tarefa_confirmada:true,pendencia_sanada:veioPendencia}
        );

        fechar();
        if(window.filtrarProcessosPorEtapa) window.filtrarProcessosPorEtapa('Digitação');
        if(window.SIGEE_Processos?.contar) window.SIGEE_Processos.contar();
        toast(veioPendencia?'Pendência sanada. Processo encaminhado para Digitação.':'Análise concluída. Processo encaminhado para Digitação.');
      }catch(e){
        console.error('[SIGEE] Falha ao encaminhar processo para Digitação.',e);
        btn.disabled=false;
        alert('Não foi possível encaminhar o processo para Digitação: '+(e?.message||e));
      }
    });
  }

  function abrirEncaminharDigitacaoAnalise(id){
    return abrirEncaminharDigitacao(id,{tipo:'ANALISE'});
  }
  function abrirEncaminharDigitacaoPendencia(id){
    return abrirEncaminharDigitacao(id,{tipo:'PENDENCIA'});
  }

  async function abrirDigitacao(id){
    const p=processo(id); if(!p || bloquearLeitura()) return;
    const msg=MENSAGENS.conferencia;
    const el=modal(`✍️ Digitação Concluída — ${esc(p.codigo_sigee||p.id)}`,`${cabecalho(p)}${selectTecnico(p,'wf-conferente093','Responsável pela Conferência',[])}${tarefa(msg)}<div class="sigee-acoes33"><button class="btn33 btn33-vermelho" data-cancelar093>Cancelar</button><button class="btn33 btn33-verde" data-confirmar093 disabled>Enviar para Conferência</button></div>`,'digitacao');
    const sel=el.querySelector('#wf-conferente093'),chk=el.querySelector('#wf-email093'),btn=el.querySelector('[data-confirmar093]');
    await preencherSelectTecnicoWorkflow(sel,p);
    const semUsuarios=el.querySelector('.sigee-selecao-semusuarios093'); if(semUsuarios) semUsuarios.remove();
    const validar=()=>{atualizarDestaqueTecnico(el,sel);btn.disabled=!(sel.value&&chk.checked);}; sel.addEventListener('change',validar); chk.addEventListener('change',validar);
    el.querySelector('[data-cancelar093]').addEventListener('click',fechar);
    btn.addEventListener('click',async()=>{btn.disabled=true;p.etapa=p.etapa_atual='Conferência';p.data_etapa_atual=agora();p.tecnico_responsavel=sel.value;p.conferente=sel.value;await salvar(p);await historico(p,'Conferência','Encaminhado para Conferência',`Digitação concluída. Conferente: ${sel.value}. Tarefa confirmada: ENVIAR E-MAIL ${msg.texto}.`,{conferente:sel.value,mensagem:msg,tarefa_confirmada:true});fechar();if(window.filtrarProcessosPorEtapa)window.filtrarProcessosPorEtapa('Conferência');toast('Processo encaminhado para Conferência.');});
  }

  function abrirConferencia(id){
    const p=processo(id); if(!p || bloquearLeitura()) return;
    const msg=MENSAGENS.assinatura;
    const el=modal(`✔️ Conferência Concluída — ${esc(p.codigo_sigee||p.id)}`,`${cabecalho(p)}${responsavelOperador()}${tarefa(msg)}<div class="sigee-acoes33"><button class="btn33 btn33-vermelho" data-cancelar093>Cancelar</button><button class="btn33 btn33-verde" data-confirmar093 disabled>Enviar para Assinatura</button></div>`,'conferencia');
    const chk=el.querySelector('#wf-email093'),btn=el.querySelector('[data-confirmar093]'); chk.addEventListener('change',()=>btn.disabled=!chk.checked);
    el.querySelector('[data-cancelar093]').addEventListener('click',fechar);
    btn.addEventListener('click',async()=>{btn.disabled=true;p.etapa=p.etapa_atual='Assinatura';p.data_etapa_atual=agora();p.tecnico_responsavel=nomeUsuario();p.enviado_assinatura_por=nomeUsuario();await salvar(p);await historico(p,'Assinatura','Encaminhado para Assinatura',`Conferência concluída. Enviado para assinatura por ${nomeUsuario()}. Tarefa confirmada: ENVIAR E-MAIL ${msg.texto}.`,{enviado_por:nomeUsuario(),mensagem:msg,tarefa_confirmada:true});fechar();if(window.filtrarProcessosPorEtapa)window.filtrarProcessosPorEtapa('Assinatura');toast('Processo encaminhado para Assinatura.');});
  }

  function abrirAssinatura(id){
    const p=processo(id); if(!p || bloquearLeitura()) return;
    const msg=MENSAGENS.deferido;
    const el=modal(`🖋️ Documento Assinado — ${esc(p.codigo_sigee||p.id)}`,`${cabecalho(p)}<p class="sigee-aviso33">Confirme somente após o retorno do documento assinado pelo Diretor do NTE.</p>${tarefa(msg)}<div class="sigee-acoes33"><button class="btn33 btn33-vermelho" data-cancelar093>Cancelar</button><button class="btn33 btn33-verde" data-confirmar093 disabled>Deferido</button></div>`,'assinatura');
    const chk=el.querySelector('#wf-email093'),btn=el.querySelector('[data-confirmar093]'); chk.addEventListener('change',()=>btn.disabled=!chk.checked);
    el.querySelector('[data-cancelar093]').addEventListener('click',fechar);
    btn.addEventListener('click',async()=>{btn.disabled=true;p.etapa=p.etapa_atual='Aguardando Retirada';p.data_etapa_atual=agora();p.tecnico_responsavel=nomeUsuario();p.deferido_em=agora();await salvar(p);await historico(p,'Aguardando Retirada','Processo deferido',`Documento retornou assinado e está disponível para retirada. Tarefa confirmada: ENVIAR E-MAIL ${msg.texto}.`,{mensagem:msg,tarefa_confirmada:true});fechar();if(window.filtrarProcessosPorEtapa)window.filtrarProcessosPorEtapa('Aguardando Retirada');toast('Processo deferido e disponível para retirada.');});
  }

  function abrirRetirada(id){
    const p=processo(id); if(!p || bloquearLeitura()) return;
    const el=modal(`📤 Registrar Retirada — ${esc(p.codigo_sigee||p.id)}`,`${cabecalho(p)}<fieldset class="sigee-field33"><legend>Quem retirou o documento?</legend><label class="sigee-radio33"><input type="radio" name="wf-retirada093" value="Titular"><span>Titular / Requerente</span></label><label class="sigee-radio33"><input type="radio" name="wf-retirada093" value="Terceiro"><span>Terceiro</span></label></fieldset><div id="wf-terceiro-box093" class="hidden sigee-condicional33"><label>Nome completo *<input id="wf-terceiro-nome093"></label><label>RG *<input id="wf-terceiro-rg093"></label><label>Telefone *<input id="wf-terceiro-telefone093"></label></div><div class="sigee-acoes33"><button class="btn33 btn33-vermelho" data-cancelar093>Cancelar</button><button class="btn33 btn33-verde" data-confirmar093 disabled>Concluir Retirada</button></div>`);
    const box=el.querySelector('#wf-terceiro-box093'),btn=el.querySelector('[data-confirmar093]');
    const validar=()=>{const tipo=el.querySelector('input[name="wf-retirada093"]:checked')?.value;if(!tipo){btn.disabled=true;return;}if(tipo==='Titular'){btn.disabled=false;return;}btn.disabled=!(txt(el.querySelector('#wf-terceiro-nome093').value)&&txt(el.querySelector('#wf-terceiro-rg093').value)&&txt(el.querySelector('#wf-terceiro-telefone093').value));};
    el.querySelectorAll('input[name="wf-retirada093"]').forEach(r=>r.addEventListener('change',()=>{box.classList.toggle('hidden',r.value!=='Terceiro'||!r.checked);validar();}));
    ['#wf-terceiro-nome093','#wf-terceiro-rg093','#wf-terceiro-telefone093'].forEach(s=>el.querySelector(s).addEventListener('input',validar));
    el.querySelector('[data-cancelar093]').addEventListener('click',fechar);
    btn.addEventListener('click',async()=>{const tipo=el.querySelector('input[name="wf-retirada093"]:checked')?.value;if(!tipo)return;const terceiro=tipo==='Terceiro'?{nome:txt(el.querySelector('#wf-terceiro-nome093').value),rg:txt(el.querySelector('#wf-terceiro-rg093').value),telefone:txt(el.querySelector('#wf-terceiro-telefone093').value)}:null;btn.disabled=true;p.etapa=p.etapa_atual='Retirado';p.data_etapa_atual=agora();p.finalizado_em=agora();p.tecnico_responsavel=nomeUsuario();await salvar(p);await historico(p,'Retirado','Documento retirado',tipo==='Terceiro'?`Retirada por terceiro. Nome: ${terceiro.nome} | RG: ${terceiro.rg} | Telefone: ${terceiro.telefone}`:'Retirada pelo titular/requerente.',{tipo,terceiro,entregue_por:nomeUsuario()});fechar();if(window.filtrarProcessosPorEtapa)window.filtrarProcessosPorEtapa('Retirado');toast('Retirada registrada. Processo concluído.');});
  }

  /* Sobrescreve somente as entradas públicas do fluxo legado. */
  window.abrirEncaminharDigitacaoSIGEE=abrirEncaminharDigitacaoAnalise;
    window.abrirEncaminharDigitacaoAnaliseSIGEE=abrirEncaminharDigitacaoAnalise;
    window.abrirEncaminharDigitacaoPendenciaSIGEE=abrirEncaminharDigitacaoPendencia;
  window.abrirModalFluxoDigitacao=abrirDigitacao;
  window.abrirModalFluxoConferencia=abrirConferencia;
  window.abrirModalFluxoAssinatura=abrirAssinatura;
  window.abrirModalFluxoAguardando=abrirRetirada;

  /* Análise moderna: mantém Pendência, Indeferimento e Histórico já homologados. */
  const abrirAnaliseAnterior=window.abrirAnaliseSIGEE;
  function abrirAnaliseWorkflow093(id){
    const p=processo(id); if(!p) return;
    if(somenteLeitura() && typeof abrirAnaliseAnterior==='function') return abrirAnaliseAnterior(id);
    const el=modal(`🔍 Análise Realizada — ${esc(p.codigo_sigee||p.id)}`,`${cabecalho(p)}${responsavelOperador()}<section class="sigee-area-etapa33"><h3>Ação da Análise</h3><div class="sigee-acoes33"><button class="btn33 btn33-verde" data-dig093>✍️ Prosseguir para Digitação</button><button class="btn33 btn33-amarelo" data-pend093>⚠️ Registrar Pendência</button><button class="btn33 btn33-vermelho" data-ind093>⛔ Indeferir Processo</button></div></section><div class="sigee-rodape33"><button class="btn33 sigee-historico33" data-hist093>📜 Histórico do Processo</button></div>`,'analise');
    el.querySelector('[data-dig093]').addEventListener('click',()=>abrirEncaminharDigitacaoAnalise(id));
    el.querySelector('[data-pend093]').addEventListener('click',()=>{
      fechar();
      if(typeof window.abrirRegistrarPendenciaSIGEE==='function')return window.abrirRegistrarPendenciaSIGEE(id);
      alert('A janela de Registro de Pendência não está disponível. O processo não foi alterado.');
    });
    el.querySelector('[data-ind093]').addEventListener('click',()=>{
      fechar();
      if(typeof window.abrirIndeferimentoSIGEE==='function')return window.abrirIndeferimentoSIGEE(id);
      alert('A janela de Indeferimento não está disponível. O processo não foi alterado.');
    });
    el.querySelector('[data-hist093]').addEventListener('click',()=>{fechar(); if(typeof window.abrirHistoricoProcessoSIGEE==='function')window.abrirHistoricoProcessoSIGEE(id,()=>abrirAnaliseWorkflow093(id));});
  }

  function instalarInterceptadores093(){
    if(window.__SIGEE_WORKFLOW_093_INTERCEPTADORES__) return;
    window.__SIGEE_WORKFLOW_093_INTERCEPTADORES__=true;
    document.addEventListener('click',function(evento){
      const botao=evento.target && evento.target.closest ? evento.target.closest('button[onclick]') : null;
      if(!botao) return;
      const codigo=botao.getAttribute('onclick')||'';
      let achou=codigo.match(/(?:window\.)?abrirAnaliseSIGEE\((\d+)\)/);
      if(achou){
        evento.preventDefault();
        evento.stopPropagation();
        evento.stopImmediatePropagation();
        abrirAnaliseWorkflow093(Number(achou[1]));
        return;
      }
      achou=codigo.match(/(?:window\.)?abrirHistoricoSIGEE\((\d+)\)/);
      if(achou){
        evento.preventDefault();
        evento.stopPropagation();
        evento.stopImmediatePropagation();
        if(typeof window.abrirHistoricoProcessoSIGEE==='function'){
          window.abrirHistoricoProcessoSIGEE(Number(achou[1]));
        }
      }
    },true);
  }

  function instalarWorkflow093(){
    window.abrirEncaminharDigitacaoSIGEE=abrirEncaminharDigitacaoAnalise;
    window.abrirEncaminharDigitacaoAnaliseSIGEE=abrirEncaminharDigitacaoAnalise;
    window.abrirEncaminharDigitacaoPendenciaSIGEE=abrirEncaminharDigitacaoPendencia;
    window.abrirModalFluxoDigitacao=abrirDigitacao;
    window.abrirModalFluxoConferencia=abrirConferencia;
    window.abrirModalFluxoAssinatura=abrirAssinatura;
    window.abrirModalFluxoAguardando=abrirRetirada;
    window.abrirAnaliseSIGEE=abrirAnaliseWorkflow093;
    if(typeof window.abrirHistoricoProcessoSIGEE==='function'){
      window.abrirHistoricoSIGEE=window.abrirHistoricoProcessoSIGEE;
    }
    window.SIGEE_WORKFLOW_093={
      abrirAnalise:abrirAnaliseWorkflow093,
      abrirRegistrarPendencia:function(id){return window.abrirRegistrarPendenciaSIGEE?.(id);},
      abrirIndeferimento:function(id){return window.abrirIndeferimentoSIGEE?.(id);},
      abrirEncaminharDigitacao:abrirEncaminharDigitacaoAnalise,
      abrirEncaminharDigitacaoAnalise:abrirEncaminharDigitacaoAnalise,
      abrirEncaminharDigitacaoPendencia:abrirEncaminharDigitacaoPendencia,
      abrirHistorico:function(id){
        if(typeof window.abrirHistoricoProcessoSIGEE==='function') return window.abrirHistoricoProcessoSIGEE(id);
      },
      abrirDigitacao:abrirDigitacao,
      abrirConferencia:abrirConferencia,
      abrirAssinatura:abrirAssinatura,
      abrirRetirada:abrirRetirada
    };
    instalarInterceptadores093();
    try{
      if(typeof window.carregarEContarProcessosHorizontais==='function') window.carregarEContarProcessosHorizontais();
      else if(typeof window.renderizarProcessosFlutuantes==='function') window.renderizarProcessosFlutuantes();
    }catch(e){ console.warn('[SIGEE] Não foi possível atualizar imediatamente a lista do workflow.',e); }
  }

  function instalarEstilosWorkflow093(){
    if(document.getElementById('sigee-workflow093-estilos')) return;
    const st=document.createElement('style');
    st.id='sigee-workflow093-estilos';
    st.textContent=`
      .sigee-selecao-obrigatoria093{margin:18px 0;padding:20px;border:3px solid #f59e0b;border-radius:18px;background:linear-gradient(135deg,rgba(146,64,14,.48),rgba(30,41,59,.94));box-shadow:0 0 0 5px rgba(245,158,11,.14),0 16px 34px rgba(0,0,0,.34);transition:.2s ease}
      .sigee-selecao-obrigatoria093.selecionado{border-color:#10b981;background:linear-gradient(135deg,rgba(6,95,70,.52),rgba(30,41,59,.94));box-shadow:0 0 0 5px rgba(16,185,129,.14),0 16px 34px rgba(0,0,0,.34)}
      .sigee-selecao-cabecalho093{display:flex;align-items:center;gap:11px;margin-bottom:12px}.sigee-selecao-icone093{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:rgba(245,158,11,.18);font-size:21px}
      .sigee-selecao-cabecalho093 strong{display:block;color:#fef3c7;font-size:12px;letter-spacing:.08em}.sigee-selecao-cabecalho093 small{display:block;color:#cbd5e1;margin-top:2px;font-size:11px}
      .sigee-selecao-obrigatoria093 select{width:100%;min-height:44px;font-weight:800;border-width:2px!important;border-color:rgba(245,158,11,.68)!important}.sigee-selecao-obrigatoria093.selecionado select{border-color:rgba(16,185,129,.8)!important}
      .sigee-selecao-aviso093{margin-top:9px;font-size:11px;font-weight:800;color:#fde68a}.sigee-selecao-obrigatoria093.selecionado .sigee-selecao-aviso093{color:#a7f3d0}.sigee-selecao-semusuarios093{margin-top:8px;color:#fecaca;font-size:11px;font-weight:800}
      .sigee-selecao-cabecalho093{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(251,191,36,.4)}.sigee-selecao-cabecalho093 strong{display:block;color:#fff7ed;font-size:14px;letter-spacing:.08em}.sigee-selecao-cabecalho093 small{display:block;margin-top:3px;color:#fde68a;font-weight:800}.sigee-selecao-icone093{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#f59e0b;color:#111827;font-size:24px;box-shadow:0 0 18px rgba(245,158,11,.45)}.sigee-selecao-obrigatoria093.selecionado .sigee-selecao-icone093{background:#10b981}.sigee-selecao-obrigatoria093 select{font-size:14px!important;padding:10px 12px!important}
    `;
    document.head.appendChild(st);
  }

  instalarEstilosWorkflow093();
  instalarWorkflow093();
  window.addEventListener('DOMContentLoaded',instalarWorkflow093,{once:true});
  window.addEventListener('load',instalarWorkflow093,{once:true});
})();


/* SIGEE 1.0.2.003B — Guarda final de permissões dos processos */
(function(window){
  'use strict';
  function perfil(){
    const p=String((window.usuarioLogado||{}).perfil||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    if(p.includes('MASTER'))return 'Master';
    if(p.includes('SEC'))return 'SEC';
    if(p.includes('ADMIN'))return 'Administrador';
    if(p.includes('CONSULT'))return 'Consulta';
    if(p.includes('ESTAG'))return 'Estagiario';
    return 'Tecnico';
  }
  function protegerMaster(nome,mensagem){
    const original=window[nome];
    if(typeof original!=='function'||original.__SIGEE_MASTER_PROCESSO__)return;
    const protegido=function(){
      if(perfil()!=='Master'){
        alert(mensagem);
        return false;
      }
      return original.apply(this,arguments);
    };
    protegido.__SIGEE_MASTER_PROCESSO__=true;
    window[nome]=protegido;
  }
  function aplicar(){
    protegerMaster('regredirProcessoMasterSIGEE','Regressão manual permitida apenas para o perfil Master.');
    protegerMaster('regredirProcessoMasterV45','Regressão manual permitida apenas para o perfil Master.');
    protegerMaster('avancarProcessoMasterSIGEE','Avanço manual permitido apenas para o perfil Master.');
    protegerMaster('avancarProcessoMasterV45','Avanço manual permitido apenas para o perfil Master.');
    protegerMaster('excluirProcessoMasterSIGEE','Exclusão permitida apenas para o perfil Master.');
    protegerMaster('excluirProcessoMasterV45','Exclusão permitida apenas para o perfil Master.');
  }
  window.addEventListener('load',()=>setTimeout(aplicar,0));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,500));
  setTimeout(aplicar,1500);
})(window);


/* SIGEE 1.0.2.003B1 — Guarda da Nova Solicitação */
(function(window){
  'use strict';
  function perfilAtual(){
    const p=String((window.usuarioLogado||{}).perfil||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    if(p.includes('MASTER'))return 'Master';
    if(p.includes('SEC'))return 'SEC';
    if(p.includes('ADMIN'))return 'Administrador';
    if(p.includes('CONSULT'))return 'Consulta';
    if(p.includes('ESTAG'))return 'Estagiario';
    return 'Tecnico';
  }
  function podeCriar(){
    return ['Master','Administrador','Tecnico','Estagiario'].includes(perfilAtual());
  }
  function aplicar(){
    const original=window.abrirFormularioNovaSolicitacao;
    if(typeof original==='function'&&!original.__SIGEE_NOVA_SOLICITACAO_GUARD__){
      const protegido=function(){
        if(!podeCriar()){
          alert('Seu perfil não possui permissão para criar nova solicitação.');
          return false;
        }
        return original.apply(this,arguments);
      };
      protegido.__SIGEE_NOVA_SOLICITACAO_GUARD__=true;
      window.abrirFormularioNovaSolicitacao=protegido;
      try{abrirFormularioNovaSolicitacao=protegido}catch(e){}
    }

    document.querySelectorAll(
      '[onclick*="abrirFormularioNovaSolicitacao"],.btn-nova-solicitacao,#btn-nova-solicitacao,[data-acao="nova-solicitacao"]'
    ).forEach(el=>{
      const permitido=podeCriar();
      el.classList.toggle('hidden',!permitido);
      el.style.display=permitido?'':'none';
      el.style.visibility=permitido?'visible':'hidden';
      if('disabled' in el)el.disabled=!permitido;
    });
  }
  window.addEventListener('load',()=>setTimeout(aplicar,0));
  document.addEventListener('DOMContentLoaded',()=>{
    aplicar();
    setTimeout(aplicar,500);
    setTimeout(aplicar,1500);
  });
})(window);
