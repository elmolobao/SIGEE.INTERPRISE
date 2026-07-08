// ===== SIGEE Enterprise 1.0 - módulo legado preservado 1 =====
// Relação Oficial e Inalterável dos 27 NTEs da SEC/BA
        const LISTA_OFICIAL_27_NTES = [
            "NTE-01 Irecê", "NTE-02 Bom Jesus da Lapa", "NTE-03 Seabra", "NTE-04 Serrinha", "NTE-05 Itabuna",
            "NTE-06 Valença", "NTE-07 Teixeira de Freitas", "NTE-08 Itapetinga", "NTE-09 Amargosa", "NTE-10 Juazeiro",
            "NTE-11 Barreiras", "NTE-12 Macaúbas", "NTE-13 Caetité", "NTE-14 Itaberaba", "NTE-15 Ipirá",
            "NTE-16 Jacobina", "NTE-17 Ribeira do Pombal", "NTE-18 Alagoinhas", "NTE-19 Feira de Santana", "NTE-20 Vitória da Conquista",
            "NTE-21 Santo Antônio de Jesus", "NTE-22 Jequié", "NTE-23 Santa Maria da Vitória", "NTE-24 Paulo Afonso", "NTE-25 Senhor do Bonfim",
            "NTE-26 Salvador", "NTE-27 Eunápolis"
        ];

        let usuariosDB = [
            { id: 1, nome: "ELMO LOBÃO", email: "elmo.lobao@enova.educacao.ba.gov.br", senha: "123", perfil: "Master", nte: "NTE-26 Salvador", ativo: true },
            { id: 2, nome: "ANA COSTA", email: "ana.costa@enova.educacao.ba.gov.br", senha: "123", perfil: "Técnico", nte: "NTE-26 Salvador", ativo: true },
            { id: 3, nome: "CARLOS SOUZA", email: "carlos.souza@enova.educacao.ba.gov.br", senha: "123", perfil: "Técnico", nte: "NTE-19 Feira de Santana", ativo: true }
        ];

        let escolasDB = [
            { id: 1, cod_mec: "290001", nome: "COLÉGIO ESTADUAL DA BAHIA (EXTINTO)", municipio: "SALVADOR", nte: "NTE-26 Salvador", dependencia: "Estadual", situacao: "Extinta", acervo: "Recolhido", local_acervo: "Acervo do NTE" },
            { id: 2, cod_mec: "290002", nome: "ESCOLA NORMAL DE FEIRA DE SANTANA", municipio: "FEIRA DE SANTANA", nte: "NTE-19 Feira de Santana", dependencia: "Estadual", situacao: "Extinta", acervo: "Recolhido", local_acervo: "Acervo do NTE" }
        ];

        // Controle Dinâmico das Datas das Etapas para a Contabilização Unificada de Prazos
        let processosDB = [
            { id: 101, aluno: "AUGUSTO SILVA SANTOS", escola: "COLÉGIO ESTADUAL DA BAHIA (EXTINTO)", documento: "HISTÓRICO", etapa: "Desarquivamento", data_etapa_atual: "01/06/2026", nte: "NTE-26 Salvador", municipio: "SALVADOR" }
        ];

        let solicitacoesDB = [];

        const ETAPAS_FLUXO_OFICIAL = ["Desarquivamento", "Análise", "Pendência", "Digitação", "Conferência", "Assinatura", "Aguardando Retirada", "Retirado"];
        let logsDB = [];
        let usuarioLogado = null;
        let paginaEscolaAtual = 1;
        const totalPorPaginaEscola = 8;
        let etapaFiltroAtual = 'TODOS';

        // =========================================================================
        // 💾 PERSISTÊNCIA LOCAL DO BANCO DE DADOS DO SIGEE
        // V9: Supabase direto, sem dados de exemplo quando a tabela remota estiver vazia.
        // Mantém escolas, processos, usuários e logs gravados no Supabase.
        // Não altera menus, permissões, layout nem regras de acesso.
        // =========================================================================
        const SIGEE_DB_NOME = 'SIGEE_BANCO_LOCAL';
        const SIGEE_DB_VERSAO = 1;
        const SIGEE_STORE_NOME = 'dados';
        const SIGEE_REGISTRO_UNICO = 'estado_atual';
        const SIGEE_STORAGE_KEYS = {
            usuarios: 'SIGEE_USUARIOS_DB',
            escolas: 'SIGEE_ESCOLAS_DB',
            processos: 'SIGEE_PROCESSOS_DB',
            logs: 'SIGEE_LOGS_DB'
        };

        // =========================================================================
        // ☁️ INTEGRAÇÃO SUPABASE - BANCO REMOTO DO SIGEE
        // Projeto: ckxbvsfjsknbgpfpxcyy / schema public
        // Tabelas integradas: escolas_sigee, ntes_sigee, processos,
        // solicitacoes_sigee e usuarios_sigee.
        // V15: mantém login rápido e Supabase direto, sem tentar gravar usuarios_sigee
        // porque a estrutura atual da tabela não possui coluna nte.
        // A chave abaixo é anon public. Não utilize service_role no navegador.
        // =========================================================================
        const SIGEE_SUPABASE_URL = 'https://ckxbvsfjsknbgpfpxcyy.supabase.co';
        const SIGEE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreGJ2c2Zqc2tuYmdwZnB4Y3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc4MjUsImV4cCI6MjA5ODc3MzgyNX0.ecJr_MYR9GPnaYMZ3V6kgeed7uGtg-vQ4THpdwAtTxk';
        const SIGEE_SUPABASE_TABELAS = {
            escolas: 'escolas_sigee',
            ntes: 'ntes_sigee',
            processos: 'processos',
            solicitacoes: 'solicitacoes_sigee',
            usuarios: 'usuarios_sigee'
        };
        const SIGEE_SUPABASE_CONFLITOS = {
            escolas: 'cod_mec',
            ntes: 'nome',
            processos: 'id',
            solicitacoes: 'id',
            usuarios: 'email'
        };
        let sigEESupabaseClient = null;
        let sigEESupabaseOnline = false;
        let sigEESincronizandoSupabase = false;

        function obterSupabaseSIGEE() {
            if (sigEESupabaseClient) return sigEESupabaseClient;
            if (!window.supabase || !window.supabase.createClient) {
                console.warn('Biblioteca Supabase não carregada. Usando cache local.');
                return null;
            }
            sigEESupabaseClient = window.supabase.createClient(SIGEE_SUPABASE_URL, SIGEE_SUPABASE_ANON_KEY);
            return sigEESupabaseClient;
        }



        function normalizarTextoSIGEE(valor) {
            if (valor === undefined || valor === null) return '';
            return String(valor).trim();
        }

        function normalizarMaiusculoSIGEE(valor) {
            return normalizarTextoSIGEE(valor).toUpperCase();
        }

        function obterNumeroNteSIGEE(valor) {
            const texto = normalizarTextoSIGEE(valor);
            const m = texto.match(/NTE[-\s]*(\d{1,2})/i);
            if (m) return Number(m[1]);
            return 26;
        }

        function obterNomeNtePorIdSIGEE(id) {
            const numero = Number(id);
            const item = LISTA_OFICIAL_27_NTES.find(n => obterNumeroNteSIGEE(n) === numero);
            return item || (numero ? ('NTE-' + String(numero).padStart(2, '0')) : 'NTE-26 Salvador');
        }

        function normalizarValorPermitidoSIGEE(valor, padrao, mapa) {
            const texto = normalizarTextoSIGEE(valor);
            if (!texto) return padrao;
            const chave = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
            return mapa[chave] || texto || padrao;
        }

        function escolaParaSupabaseSIGEE(e) {
            // Adaptado para a estrutura real enviada pelo usuário em 07/07/2026:
            // cod_mec, nome_escola, municipio, nte_id, dependencia_adm,
            // situacao_funcional, acervo, status_acervo, local_acervo.
            const acervo = normalizarTextoSIGEE(e.acervo || e.status_acervo || 'Recolhido');
            return {
                cod_mec: normalizarTextoSIGEE(e.cod_mec),
                nome_escola: normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao),
                municipio: normalizarMaiusculoSIGEE(e.municipio),
                nte_id: (() => {
                    const direto = Number(e.nte_id);
                    if (direto && !Number.isNaN(direto)) return direto;
                    const textoNte = e.nte || e.nte_nome || e.nte_vinculado || e.nucleo || 'NTE-26 Salvador';
                    const calculado = obterNumeroNteSIGEE(textoNte);
                    return (calculado && !Number.isNaN(calculado)) ? calculado : 26;
                })(),
                dependencia_adm: normalizarTextoSIGEE(e.dependencia_adm || e.dependencia || 'Estadual'),
                situacao_funcional: normalizarTextoSIGEE(e.situacao_funcional || e.situacao || 'Extinta'),
                acervo: acervo,
                status_acervo: normalizarTextoSIGEE(e.status_acervo || acervo || 'Recolhido'),
                local_acervo: normalizarTextoSIGEE(e.local_acervo || e.local_do_acervo || e.local || 'Acervo do NTE')
            };
        }

        function escolaDoSupabaseParaLocalSIGEE(e, indice) {
            return {
                id: Number(e.id) || (indice + 1),
                cod_mec: normalizarTextoSIGEE(e.cod_mec || e.codigo_mec || e.mec),
                nome: normalizarMaiusculoSIGEE(e.nome_escola || e.nome || e.instituicao),
                municipio: normalizarMaiusculoSIGEE(e.municipio || e.cidade),
                nte: normalizarTextoSIGEE(e.nte || obterNomeNtePorIdSIGEE(e.nte_id) || 'NTE-26 Salvador'),
                dependencia: normalizarTextoSIGEE(e.dependencia_adm || e.dependencia || 'Estadual'),
                situacao: normalizarTextoSIGEE(e.situacao_funcional || e.situacao || 'Extinta'),
                acervo: normalizarTextoSIGEE(e.status_acervo || e.acervo || 'Recolhido'),
                local_acervo: normalizarTextoSIGEE(e.local_acervo || e.local_do_acervo || e.local || 'Acervo do NTE')
            };
        }

        function usuarioParaSupabaseSIGEE(u) {
            // V14: adaptado à tabela usuarios_sigee atual.
            // Não envia as colunas nte nem ativo, porque elas não existem na estrutura exibida pelo Supabase.
            // O vínculo territorial continua funcionando localmente pelo fallback do sistema.
            return {
                nome: normalizarMaiusculoSIGEE(u.nome),
                email: normalizarTextoSIGEE(u.email).toLowerCase(),
                senha: normalizarTextoSIGEE(u.senha),
                perfil: normalizarTextoSIGEE(u.perfil || 'Técnico')
            };
        }


        async function salvarUsuarioIndividualSupabaseSIGEE(usuario, idOriginal = null, modo = 'editar') {
            // V22: salvamento tolerante à estrutura real da tabela usuarios_sigee.
            // Primeiro tenta salvar nome/email/senha/perfil. Se o Supabase informar que a coluna
            // senha não existe, salva novamente sem esse campo para não bloquear a edição do usuário.
            const client = obterSupabaseSIGEE();
            if (!client) return false;

            const payloadCompleto = usuarioParaSupabaseSIGEE(usuario);
            if (!payloadCompleto.email || !payloadCompleto.nome) {
                alert('Informe nome e e-mail do usuário.');
                return false;
            }

            const executarGravacaoUsuarioSIGEE = async (payload) => {
                const idNumerico = Number(idOriginal || usuario.id);
                if (modo === 'editar' && idNumerico && !Number.isNaN(idNumerico)) {
                    return await client
                        .from(SIGEE_SUPABASE_TABELAS.usuarios)
                        .update(payload)
                        .eq('id', idNumerico)
                        .select('*')
                        .maybeSingle();
                }
                return await client
                    .from(SIGEE_SUPABASE_TABELAS.usuarios)
                    .insert(payload)
                    .select('*')
                    .maybeSingle();
            };

            try {
                let resposta = await executarGravacaoUsuarioSIGEE(payloadCompleto);

                if (resposta.error) {
                    const msg = String(resposta.error.message || resposta.error.details || '');
                    const codigo = String(resposta.error.code || '');
                    if (codigo === 'PGRST204' && msg.toLowerCase().includes('senha')) {
                        const payloadSemSenha = { ...payloadCompleto };
                        delete payloadSemSenha.senha;
                        resposta = await executarGravacaoUsuarioSIGEE(payloadSemSenha);
                    }
                }

                if (resposta.error) throw resposta.error;
                if (resposta.data && resposta.data.id) usuario.id = Number(resposta.data.id);
                sigEESupabaseOnline = true;
                return true;
            } catch (erro) {
                sigEESupabaseOnline = false;
                const detalhe = registrarErroSupabaseTabelaSIGEE(modo === 'editar' ? 'UPDATE' : 'INSERT', SIGEE_SUPABASE_TABELAS.usuarios, erro);
                alert('Não foi possível salvar o cadastro do usuário no Supabase.\n\nDetalhe:\n- ' + detalhe + '\n\nA versão V22 já ignora a coluna senha se ela não existir. Se o erro continuar, confira se usuarios_sigee possui as colunas nome, email e perfil.');
                return false;
            }
        }

        function usuarioDoSupabaseParaLocalSIGEE(u, indice) {
            const emailNormalizado = normalizarTextoSIGEE(u.email).toLowerCase();
            const perfilOrigem = normalizarTextoSIGEE(u.perfil || u.tipo || u.role || 'Técnico');
            const perfilMinusculo = perfilOrigem.toLowerCase();
            let perfilFinal = perfilMinusculo.includes('master') || perfilMinusculo.includes('admin') ? 'Master' : 'Técnico';

            // Garante que o usuário institucional principal mantenha as permissões de Master,
            // mesmo quando a tabela usuarios_sigee não possuir todas as colunas administrativas.
            if (emailNormalizado === 'elmo.lobao@enova.educacao.ba.gov.br') {
                perfilFinal = 'Master';
            }

            return {
                id: Number(u.id) || (indice + 1),
                nome: normalizarMaiusculoSIGEE(u.nome || u.name || 'OPERADOR SIGEE'),
                email: emailNormalizado,
                senha: normalizarTextoSIGEE(u.senha || u.password || '123'),
                perfil: perfilFinal,
                nte: normalizarTextoSIGEE(u.nte || u.nte_vinculado || obterNomeNtePorIdSIGEE(u.nte_id) || 'NTE-26 Salvador'),
                ativo: (u.ativo === undefined || u.ativo === null) ? true : !!u.ativo
            };
        }

        function processoParaSupabaseSIGEE(p) {
            return {
                id: Number(p.id) || gerarProximoIdSIGEE(processosDB, 101),
                aluno_nome: normalizarMaiusculoSIGEE(p.aluno || p.aluno_nome),
                escola_nome: normalizarMaiusculoSIGEE(p.escola || p.escola_nome),
                documento_tipo: normalizarTextoSIGEE(p.documento || p.documento_tipo || 'HISTÓRICO'),
                nivel_oferta: normalizarTextoSIGEE(p.nivel_oferta || p.ensino || null) || null,
                modalidade: normalizarTextoSIGEE(p.modalidade || null) || null,
                etapa_atual: normalizarTextoSIGEE(p.etapa || p.etapa_atual || 'Desarquivamento'),
                nte: normalizarTextoSIGEE(p.nte || 'NTE-26 Salvador')
            };
        }

        function processoDoSupabaseParaLocalSIGEE(p, indice) {
            return {
                id: Number(p.id) || (101 + indice),
                aluno: normalizarMaiusculoSIGEE(p.aluno_nome || p.aluno || p.nome_aluno || p.requerente),
                escola: normalizarMaiusculoSIGEE(p.escola_nome || p.escola || p.instituicao || p.nome_escola),
                documento: normalizarTextoSIGEE(p.documento_tipo || p.documento || p.tipo_documento || 'HISTÓRICO'),
                etapa: normalizarTextoSIGEE(p.etapa_atual || p.etapa || p.status || 'Desarquivamento'),
                data_etapa_atual: normalizarTextoSIGEE(p.data_etapa_atual || p.created_at || obterDataAtualFormatada()),
                nte: normalizarTextoSIGEE(p.nte || p.nte_vinculado || 'NTE-26 Salvador'),
                municipio: normalizarMaiusculoSIGEE(p.municipio || p.cidade || '')
            };
        }

        function nteParaSupabaseSIGEE(nome, indice) {
            const texto = normalizarTextoSIGEE(typeof nome === 'string' ? nome : (nome.nome || nome.nte));
            return { nome: texto };
        }

        function nteDoSupabaseParaLocalSIGEE(n) {
            return normalizarTextoSIGEE(n.nome || n.nte || n.descricao || n.codigo).trim();
        }

        function normalizarDocumentoSolicitacaoSIGEE(valor) {
            return normalizarValorPermitidoSIGEE(valor, 'Histórico', {
                'HISTORICO': 'Histórico',
                'ATESTADO': 'Atestado',
                'AUTENTICIDADE': 'Autenticidade',
                'TEMPO DE SERVICO': 'Tempo de Serviço'
            });
        }

        function normalizarNivelOfertaSIGEE(valor) {
            return normalizarValorPermitidoSIGEE(valor, 'Médio', {
                'FUNDAMENTAL': 'Fundamental',
                'MEDIO': 'Médio'
            });
        }

        function normalizarModalidadeSIGEE(valor) {
            return normalizarValorPermitidoSIGEE(valor, 'Não informado', {
                'REGULAR': 'Regular',
                'TECNICO': 'Técnico',
                'TECNICO': 'Técnico',
                'SUPLENCIA': 'Suplência',
                'NAO INFORMADO': 'Não informado'
            });
        }

        function solicitacaoParaSupabaseSIGEE(s) {
            const escolaNome = normalizarMaiusculoSIGEE(s.escola || s.instituicao || s.nome_escola);
            const escola = escolasDB.find(e => normalizarMaiusculoSIGEE(e.nome) === escolaNome || normalizarTextoSIGEE(e.cod_mec) === normalizarTextoSIGEE(s.cod_mec));
            return {
                id: Number(s.id) || gerarProximoIdSIGEE(solicitacoesDB, 1),
                nome_solicitante: normalizarMaiusculoSIGEE(s.aluno || s.nome_solicitante || s.nome_aluno || s.requerente),
                cod_mec: normalizarTextoSIGEE(s.cod_mec || (escola && escola.cod_mec) || null) || null,
                documento_solicitado: normalizarDocumentoSolicitacaoSIGEE(s.documento || s.documento_solicitado || s.tipo_documento),
                oferta_nivel: normalizarNivelOfertaSIGEE(s.oferta_nivel || s.ensino || s.nivel_oferta),
                oferta_modalidade: normalizarModalidadeSIGEE(s.oferta_modalidade || s.modalidade),
                fase_atual: normalizarTextoSIGEE(s.etapa || s.fase_atual || s.status || 'Desarquivamento'),
                tecnico_responsavel: normalizarTextoSIGEE(s.tecnico_responsavel || s.tecnico || ''),
                prioridade: normalizarTextoSIGEE(s.prioridade || '')
            };
        }

        function solicitacaoDoSupabaseParaLocalSIGEE(s, indice) {
            const escola = escolasDB.find(e => normalizarTextoSIGEE(e.cod_mec) === normalizarTextoSIGEE(s.cod_mec));
            return {
                id: Number(s.id) || (1 + indice),
                aluno: normalizarMaiusculoSIGEE(s.nome_solicitante || s.aluno || s.nome_aluno || s.requerente),
                escola: normalizarMaiusculoSIGEE((escola && escola.nome) || s.escola_nome || s.escola || ''),
                documento: normalizarTextoSIGEE(s.documento_solicitado || s.documento || 'Histórico'),
                etapa: normalizarTextoSIGEE(s.fase_atual || s.etapa || 'Desarquivamento'),
                data_etapa_atual: normalizarTextoSIGEE(s.criado_em || obterDataAtualFormatada()),
                nte: normalizarTextoSIGEE((escola && escola.nte) || 'NTE-26 Salvador'),
                municipio: normalizarMaiusculoSIGEE((escola && escola.municipio) || '')
            };
        }

        function obterMensagemErroSupabaseSIGEE(erro) {
            if (!erro) return 'erro desconhecido';
            return erro.message || erro.details || erro.hint || JSON.stringify(erro);
        }

        function registrarErroSupabaseTabelaSIGEE(operacao, tabela, erro) {
            const msg = obterMensagemErroSupabaseSIGEE(erro);
            const codigo = erro && erro.code ? ` [${erro.code}]` : '';
            const dica = erro && erro.hint ? ` | Dica: ${erro.hint}` : '';
            const detalhe = erro && erro.details ? ` | Detalhe: ${erro.details}` : '';
            console.error(`[SIGEE/Supabase] ${operacao} falhou na tabela ${tabela}:`, erro);
            try {
                const historico = JSON.parse(localStorage.getItem('SIGEE_SUPABASE_ERROS') || '[]');
                historico.unshift({ data: new Date().toLocaleString('pt-BR'), operacao, tabela, codigo: erro && erro.code, mensagem: msg, detalhe: erro && erro.details, dica: erro && erro.hint, conflito: erro && erro.sigeeConflito, exemplo: erro && erro.sigeeExemplo });
                localStorage.setItem('SIGEE_SUPABASE_ERROS', JSON.stringify(historico.slice(0, 20)));
            } catch(e) {}
            return `${tabela}${codigo}: ${msg}${detalhe}${dica}`;
        }

        async function carregarTabelaSupabaseSIGEE(nomeTabela, selectCampos = '*', ordenarPor = null) {
            const client = obterSupabaseSIGEE();
            if (!client) return [];
            let todos = [];
            let inicio = 0;
            const tamanhoPagina = 1000;
            while (true) {
                const fim = inicio + tamanhoPagina - 1;
                let query = client.from(nomeTabela).select(selectCampos).range(inicio, fim);
                if (ordenarPor) query = query.order(ordenarPor, { ascending: true });
                const { data, error } = await query;
                if (error) throw error;
                todos = todos.concat(data || []);
                if (!data || data.length < tamanhoPagina) break;
                inicio += tamanhoPagina;
            }
            return todos;
        }

        async function upsertTabelaSupabaseSIGEE(nomeTabela, payload, conflito = 'id') {
            const client = obterSupabaseSIGEE();
            if (!client) return false;
            const lista = (Array.isArray(payload) ? payload : []).filter(Boolean);
            if (!lista.length) return true;
            const tamanhoLote = 100;
            for (let i = 0; i < lista.length; i += tamanhoLote) {
                const lote = lista.slice(i, i + tamanhoLote);
                const { error } = await client.from(nomeTabela).upsert(lote, { onConflict: conflito, ignoreDuplicates: false });
                if (error) {
                    error.sigeeTabela = nomeTabela;
                    error.sigeeConflito = conflito;
                    error.sigeeExemplo = lote[0];
                    throw error;
                }
            }
            return true;
        }

        async function carregarTodasTabelasSupabaseSIGEE(silencioso = true) {
            const client = obterSupabaseSIGEE();
            if (!client) return false;

            const erros = [];
            const carregarSeguro = async (chave, tabela, ordem, conversor, filtro, aplicar) => {
                try {
                    const dados = await carregarTabelaSupabaseSIGEE(tabela, '*', ordem);
                    const convertidos = Array.isArray(dados) ? dados.map(conversor).filter(filtro || (() => true)) : [];
                    // V9: aplica também lista vazia. Antes, quando o Supabase estava vazio,
                    // o sistema mantinha os 2 registros de exemplo do HTML e parecia que o banco não carregava.
                    aplicar(convertidos);
                    return true;
                } catch (erro) {
                    erros.push(registrarErroSupabaseTabelaSIGEE('SELECT', tabela, erro));
                    return false;
                }
            };

            // Carregamento paralelo: as tabelas são puxadas ao mesmo tempo para reduzir o tempo inicial.
            await Promise.all([
                carregarSeguro('usuarios', SIGEE_SUPABASE_TABELAS.usuarios, null, usuarioDoSupabaseParaLocalSIGEE, u => u.email && u.nome, dados => { usuariosDB = dados; }),
                carregarSeguro('escolas', SIGEE_SUPABASE_TABELAS.escolas, null, escolaDoSupabaseParaLocalSIGEE, e => e.cod_mec && e.nome, dados => { escolasDB = dados; }),
                carregarSeguro('processos', SIGEE_SUPABASE_TABELAS.processos, null, processoDoSupabaseParaLocalSIGEE, p => p.aluno || p.escola, dados => { processosDB = dados; }),
                carregarSeguro('solicitacoes', SIGEE_SUPABASE_TABELAS.solicitacoes, null, solicitacaoDoSupabaseParaLocalSIGEE, s => s.aluno || s.escola, dados => { solicitacoesDB = dados; }),
                carregarSeguro('ntes', SIGEE_SUPABASE_TABELAS.ntes, null, nteDoSupabaseParaLocalSIGEE, Boolean, dados => {
                    if (dados.length) LISTA_OFICIAL_27_NTES.splice(0, LISTA_OFICIAL_27_NTES.length, ...dados);
                })
            ]);

            // Se a tabela usuarios_sigee estiver vazia, mantém usuário master emergencial para não bloquear o acesso.
            if (!usuariosDB.length) {
                usuariosDB = [{ id: 1, nome: "ELMO LOBÃO", email: "elmo.lobao@enova.educacao.ba.gov.br", senha: "123", perfil: "Master", nte: "NTE-26 Salvador", ativo: true }];
            }

            sigEESupabaseOnline = erros.length === 0;
            if (erros.length) {
                if (!silencioso) alert('O Supabase respondeu com erro em uma ou mais tabelas. O sistema carregou o que foi possível diretamente do Supabase.\n\nDetalhes:\n- ' + erros.join('\n- '));
                return false;
            }
            return true;
        }

        async function salvarTodasTabelasSupabaseSIGEE(estado, silencioso = false) {
            const client = obterSupabaseSIGEE();
            if (!client || sigEESincronizandoSupabase) return false;
            sigEESincronizandoSupabase = true;
            const erros = [];

            const salvarSeguro = async (tabela, payload, conflito) => {
                try {
                    await upsertTabelaSupabaseSIGEE(tabela, payload, conflito);
                    return true;
                } catch (erro) {
                    erros.push(registrarErroSupabaseTabelaSIGEE('UPSERT', tabela, erro));
                    return false;
                }
            };

            try {
                // V18: não regrava todo o catálogo em salvamentos gerais para evitar travamento e erros de colunas obrigatórias; escolas são salvas apenas na importação/cadastro.
                // await salvarSeguro(SIGEE_SUPABASE_TABELAS.escolas, (estado.escolas || []).map(escolaParaSupabaseSIGEE).filter(e => e.cod_mec && e.nome_escola && e.municipio && e.nte_id), SIGEE_SUPABASE_CONFLITOS.escolas);
                // V15: usuarios_sigee é usado para login/leitura. Não é salvo em lote pelo frontend,
                // evitando erro PGRST204 quando o banco não possui colunas auxiliares como nte/ativo.
                await salvarSeguro(SIGEE_SUPABASE_TABELAS.processos, (estado.processos || []).map(processoParaSupabaseSIGEE).filter(p => p.id && p.aluno_nome), SIGEE_SUPABASE_CONFLITOS.processos);
                await salvarSeguro(SIGEE_SUPABASE_TABELAS.solicitacoes, (estado.solicitacoes || []).map(solicitacaoParaSupabaseSIGEE).filter(s => s.id && s.nome_solicitante), SIGEE_SUPABASE_CONFLITOS.solicitacoes);
                // A tabela de NTEs é territorial/cadastral. Carrega do Supabase, mas não é sobrescrita pelo frontend.

                sigEESupabaseOnline = erros.length === 0;
                if (erros.length) {
                    if (!silencioso) alert('Não foi possível salvar uma ou mais tabelas no Supabase. Os dados não foram confirmados no Supabase.\n\nDetalhes:\n- ' + erros.join('\n- ') + '\n\nCorreção necessária: execute o arquivo SQL de correção no Supabase. O erro detalhado também fica no console do navegador e no localStorage em SIGEE_SUPABASE_ERROS.');
                    return false;
                }
                return true;
            } finally {
                sigEESincronizandoSupabase = false;
            }
        }

        async function carregarEscolasSupabaseSIGEE() {
            return carregarTodasTabelasSupabaseSIGEE();
        }

        async function salvarEscolasNoSupabaseSIGEE(listaEscolas) {
            try {
                await upsertTabelaSupabaseSIGEE(SIGEE_SUPABASE_TABELAS.escolas, (listaEscolas || []).map(escolaParaSupabaseSIGEE).filter(e => e.cod_mec && e.nome_escola && e.municipio && e.nte_id), SIGEE_SUPABASE_CONFLITOS.escolas);
                sigEESupabaseOnline = true;
                return true;
            } catch (erro) {
                sigEESupabaseOnline = false;
                const detalhe = registrarErroSupabaseTabelaSIGEE('UPSERT', SIGEE_SUPABASE_TABELAS.escolas, erro);
                alert('Não foi possível gravar escolas no Supabase. Os dados não foram confirmados no Supabase.\n\nDetalhe:\n- ' + detalhe + '\n\nConfira a tabela escolas_sigee, a coluna cod_mec com índice único e as políticas RLS de INSERT/UPDATE para anon.');
                return false;
            }
        }

        let sigEEBancoCarregado = false;
        let sigEEBancoPromessa = null;
        let sigEESalvamentoEmAndamento = false;
        let sigEESalvamentoPendente = false;

        function abrirIndexedDBSIGEE() {
            if (sigEEBancoPromessa) return sigEEBancoPromessa;

            sigEEBancoPromessa = new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    reject(new Error('IndexedDB não está disponível neste navegador.'));
                    return;
                }

                const requisicao = indexedDB.open(SIGEE_DB_NOME, SIGEE_DB_VERSAO);

                requisicao.onupgradeneeded = function(evento) {
                    const db = evento.target.result;
                    if (!db.objectStoreNames.contains(SIGEE_STORE_NOME)) {
                        db.createObjectStore(SIGEE_STORE_NOME, { keyPath: 'id' });
                    }
                };

                requisicao.onsuccess = function(evento) {
                    resolve(evento.target.result);
                };

                requisicao.onerror = function(evento) {
                    reject(evento.target.error || new Error('Falha ao abrir IndexedDB.'));
                };
            });

            return sigEEBancoPromessa;
        }

        function lerEstadoIndexedDBSIGEE() {
            return abrirIndexedDBSIGEE().then(db => new Promise((resolve, reject) => {
                const transacao = db.transaction(SIGEE_STORE_NOME, 'readonly');
                const store = transacao.objectStore(SIGEE_STORE_NOME);
                const requisicaoLegada = store.get(SIGEE_REGISTRO_UNICO);

                requisicaoLegada.onsuccess = function() {
                    if (requisicaoLegada.result && requisicaoLegada.result.estado) {
                        resolve(requisicaoLegada.result.estado);
                        return;
                    }

                    const requisicaoTodos = store.getAll();
                    requisicaoTodos.onsuccess = function() {
                        const registros = requisicaoTodos.result || [];
                        if (!registros.length) {
                            resolve(null);
                            return;
                        }

                        const porId = {};
                        registros.forEach(item => { porId[item.id] = item; });

                        const meta = porId['meta'];
                        if (!meta || meta.formato !== 'chunked-v2') {
                            resolve(null);
                            return;
                        }

                        const escolas = [];
                        const totalChunks = Number(meta.escolasChunks || 0);
                        for (let i = 0; i < totalChunks; i++) {
                            const chunk = porId['escolas_' + i];
                            if (chunk && Array.isArray(chunk.dados)) escolas.push(...chunk.dados);
                        }

                        resolve({
                            usuarios: porId['usuarios'] && Array.isArray(porId['usuarios'].dados) ? porId['usuarios'].dados : usuariosDB,
                            escolas: escolas.length ? escolas : [],
                            processos: porId['processos'] && Array.isArray(porId['processos'].dados) ? porId['processos'].dados : processosDB,
                            solicitacoes: porId['solicitacoes'] && Array.isArray(porId['solicitacoes'].dados) ? porId['solicitacoes'].dados : solicitacoesDB,
                            logs: porId['logs'] && Array.isArray(porId['logs'].dados) ? porId['logs'].dados : []
                        });
                    };
                    requisicaoTodos.onerror = function() {
                        reject(requisicaoTodos.error || new Error('Falha ao ler registros do banco local.'));
                    };
                };

                requisicaoLegada.onerror = function() {
                    reject(requisicaoLegada.error || new Error('Falha ao ler banco local.'));
                };
            }));
        }

        function gravarEstadoIndexedDBSIGEE(estado) {
            return abrirIndexedDBSIGEE().then(db => new Promise((resolve, reject) => {
                const transacao = db.transaction(SIGEE_STORE_NOME, 'readwrite');
                const store = transacao.objectStore(SIGEE_STORE_NOME);
                const escolas = Array.isArray(estado.escolas) ? estado.escolas : [];
                const tamanhoChunk = 1000;
                const totalChunks = Math.ceil(escolas.length / tamanhoChunk);

                store.clear();
                store.put({ id: 'meta', formato: 'chunked-v2', escolasTotal: escolas.length, escolasChunks: totalChunks, atualizadoEm: new Date().toISOString() });
                store.put({ id: 'usuarios', dados: Array.isArray(estado.usuarios) ? estado.usuarios : [] });
                store.put({ id: 'processos', dados: Array.isArray(estado.processos) ? estado.processos : [] });
                store.put({ id: 'solicitacoes', dados: Array.isArray(estado.solicitacoes) ? estado.solicitacoes : [] });
                store.put({ id: 'logs', dados: Array.isArray(estado.logs) ? estado.logs : [] });

                for (let i = 0; i < totalChunks; i++) {
                    const inicio = i * tamanhoChunk;
                    const fim = inicio + tamanhoChunk;
                    store.put({ id: 'escolas_' + i, dados: escolas.slice(inicio, fim) });
                }

                transacao.oncomplete = function() { resolve(true); };
                transacao.onerror = function() { reject(transacao.error || new Error('Falha ao gravar banco local.')); };
                transacao.onabort = function() { reject(transacao.error || new Error('Gravação do banco local cancelada.')); };
            }));
        }

        function carregarBancoLocalStorageLegadoSIGEE() {
            try {
                const usuariosSalvos = localStorage.getItem(SIGEE_STORAGE_KEYS.usuarios);
                const escolasSalvas = localStorage.getItem(SIGEE_STORAGE_KEYS.escolas);
                const processosSalvos = localStorage.getItem(SIGEE_STORAGE_KEYS.processos);
                const logsSalvos = localStorage.getItem(SIGEE_STORAGE_KEYS.logs);

                if (!usuariosSalvos && !escolasSalvas && !processosSalvos && !logsSalvos) return null;

                return {
                    usuarios: usuariosSalvos ? JSON.parse(usuariosSalvos) : usuariosDB,
                    escolas: escolasSalvas ? JSON.parse(escolasSalvas) : escolasDB,
                    processos: processosSalvos ? JSON.parse(processosSalvos) : processosDB,
                    solicitacoes: solicitacoesDB,
                    logs: logsSalvos ? JSON.parse(logsSalvos) : logsDB
                };
            } catch (erro) {
                console.warn('Não foi possível migrar dados antigos do localStorage:', erro);
                return null;
            }
        }

        function aplicarEstadoBancoSIGEE(estado) {
            if (!estado) return;
            if (Array.isArray(estado.usuarios)) usuariosDB = estado.usuarios;
            if (Array.isArray(estado.escolas)) escolasDB = estado.escolas;
            if (Array.isArray(estado.processos)) processosDB = estado.processos;
            if (Array.isArray(estado.solicitacoes)) solicitacoesDB = estado.solicitacoes;
            if (Array.isArray(estado.logs)) logsDB = estado.logs;
        }

        async function carregarBancoLocalSIGEE() {
            // V7: modo Supabase direto, sem IndexedDB.
            // Evita bloqueios de armazenamento do navegador em arquivo local, modo anônimo ou políticas corporativas.
            try {
                const ok = await carregarTodasTabelasSupabaseSIGEE(false);
                sigEEBancoCarregado = true;
                return ok;
            } catch (erro) {
                console.error('Erro ao carregar banco do Supabase:', erro);
                sigEEBancoCarregado = true;
                alert('Não foi possível carregar o banco do Supabase. O sistema iniciou com os dados padrão. Verifique internet, tabelas e políticas RLS.');
                return false;
            }
        }

        async function carregarUsuariosRapidoSupabaseSIGEE() {
            try {
                const client = obterSupabaseSIGEE();
                if (!client) return false;
                const { data, error } = await client.from(SIGEE_SUPABASE_TABELAS.usuarios).select('*').limit(500);
                if (error) throw error;
                const convertidos = (data || []).map(usuarioDoSupabaseParaLocalSIGEE).filter(u => u.email && u.nome);
                if (convertidos.length) usuariosDB = convertidos;
                return true;
            } catch (erro) {
                registrarErroSupabaseTabelaSIGEE('SELECT rápido', SIGEE_SUPABASE_TABELAS.usuarios, erro);
                return false;
            }
        }

        async function sincronizarSupabaseSegundoPlanoSIGEE() {
            try {
                await carregarTodasTabelasSupabaseSIGEE(true);
                if (usuarioLogado) {
                    inicializarSelectsNteEcosystem();
                    if (!document.getElementById('aba-painel').classList.contains('hidden')) carregarDadosDashboardReal();
                    if (!document.getElementById('aba-escolas').classList.contains('hidden')) renderizarListaEscolasBufferMemoria();
                    if (!document.getElementById('aba-processos').classList.contains('hidden')) carregarEContarProcessosHorizontais();
                    if (!document.getElementById('aba-usuarios').classList.contains('hidden')) carregarListaUsuarios();
                    if (!document.getElementById('aba-logs').classList.contains('hidden')) carregarLogs();
                }
            } catch (erro) {
                console.warn('Sincronização em segundo plano falhou:', erro);
            } finally {
                sigEEBancoCarregado = true;
            }
        }

        async function salvarNovaSolicitacaoSupabaseSIGEE(registro) {
            // Salva apenas a nova solicitação nas tabelas operacionais.
            // Isso evita que o botão "Nova Solicitação" trave por erro em tabelas auxiliares.
            const erros = [];
            try {
                await upsertTabelaSupabaseSIGEE(SIGEE_SUPABASE_TABELAS.processos, [processoParaSupabaseSIGEE(registro)], SIGEE_SUPABASE_CONFLITOS.processos);
            } catch (erro) {
                erros.push(registrarErroSupabaseTabelaSIGEE('UPSERT', SIGEE_SUPABASE_TABELAS.processos, erro));
            }
            try {
                await upsertTabelaSupabaseSIGEE(SIGEE_SUPABASE_TABELAS.solicitacoes, [solicitacaoParaSupabaseSIGEE(registro)], SIGEE_SUPABASE_CONFLITOS.solicitacoes);
            } catch (erro) {
                erros.push(registrarErroSupabaseTabelaSIGEE('UPSERT', SIGEE_SUPABASE_TABELAS.solicitacoes, erro));
            }
            if (erros.length) {
                alert('A solicitação foi criada na tela, mas não foi confirmada no Supabase.\n\nDetalhes:\n- ' + erros.join('\n- '));
                return false;
            }
            return true;
        }

        function salvarBancoLocalSIGEE() {
            const estadoAtual = {
                usuarios: usuariosDB,
                escolas: escolasDB,
                processos: processosDB,
                solicitacoes: solicitacoesDB,
                logs: logsDB
            };

            const executarSalvamento = async () => {
                try {
                    sigEESalvamentoEmAndamento = true;
                    const ok = await salvarTodasTabelasSupabaseSIGEE(estadoAtual, true);
                    sigEESalvamentoEmAndamento = false;
                    if (sigEESalvamentoPendente) {
                        sigEESalvamentoPendente = false;
                        return salvarBancoLocalSIGEE();
                    }
                    return ok;
                } catch (erro) {
                    sigEESalvamentoEmAndamento = false;
                    console.error('Erro ao salvar banco no Supabase:', erro);
                    console.warn('Não foi possível salvar os dados no Supabase em segundo plano. Verifique o console/SIGEE_SUPABASE_ERROS.');
                    return false;
                }
            };

            if (sigEESalvamentoEmAndamento) {
                sigEESalvamentoPendente = true;
                return Promise.resolve(true);
            }

            return executarSalvamento();
        }

        async function salvarBancoEAguardarSIGEE() {
            await salvarBancoLocalSIGEE();
            while (sigEESalvamentoEmAndamento || sigEESalvamentoPendente) {
                await new Promise(resolve => setTimeout(resolve, 80));
            }
            return true;
        }

        function inicializarSelectsNteEcosystem() {
            const selects = ['user-form-nte'];
            selects.forEach(id => {
                const el = document.getElementById(id);
                if(el) {
                    el.innerHTML = "";
                    LISTA_OFICIAL_27_NTES.forEach(nte => {
                        el.innerHTML += `<option value="${nte}">${nte}</option>`;
                    });
                }
            });
        }

        window.onload = function() {
            inicializarSelectsNteEcosystem();
            const btnLogin = document.querySelector('#form-login button[type="submit"]');
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.dataset.textoOriginal = btnLogin.innerText || 'Entrar no Sistema';
                btnLogin.innerText = 'Entrar no Sistema';
                btnLogin.classList.remove('opacity-60');
            }

            // V17: login ultrarrápido. Carrega apenas usuários no início e adia o banco pesado.
            // As demais tabelas sincronizam em segundo plano após a entrada no sistema ou quando a aba for aberta.
            sigEEBancoCarregado = true;
            sigEEBancoPromessa = carregarUsuariosRapidoSupabaseSIGEE();
        };

        async function handleLogin(event) {
            event.preventDefault();
            // V12: permite login imediato com usuário local emergencial, enquanto o Supabase sincroniza em segundo plano.
            if (sigEEBancoPromessa) {
                try { await Promise.race([sigEEBancoPromessa, new Promise(resolve => setTimeout(resolve, 1200))]); } catch(e) {}
            }

            const email = document.getElementById('login-email').value.trim();
            const senha = document.getElementById('login-senha').value;
            const u = usuariosDB.find(user => user.email.toLowerCase() === email.toLowerCase() && user.senha === senha && user.ativo);
            if (u && u.email && u.email.toLowerCase() === 'elmo.lobao@enova.educacao.ba.gov.br') {
                u.perfil = 'Master';
                u.nte = u.nte || 'NTE-26 Salvador';
            }
            
            if (u) {
                usuarioLogado = u;
                document.getElementById('tela-login').classList.add('hidden');
                document.getElementById('sistema-dashboard').classList.remove('hidden');
                document.getElementById('user-nome').innerText = u.nome;
                document.getElementById('user-perfil').innerText = `${u.perfil} | ${u.nte}`;
                
                const btnImportar = document.getElementById('btn-importar-dados-master');
                if (u.perfil === "Master") {
                    if(btnImportar) btnImportar.classList.remove('hidden');
                    document.getElementById('menu-usuarios').classList.remove('hidden');
                    document.getElementById('menu-logs').classList.remove('hidden');
                } else {
                    if(btnImportar) btnImportar.classList.add('hidden');
                    document.getElementById('menu-usuarios').classList.add('hidden');
                    document.getElementById('menu-logs').classList.add('hidden');
                }
                
                registrarLog("Acesso realizado ao painel operacional.");
                navegar('painel');
                // V17: sincronização pesada somente depois que a tela já abriu.
                setTimeout(() => sincronizarSupabaseSegundoPlanoSIGEE(), 1200);
            } else {
                alert("Credenciais inválidas, ou operador desativado no escopo regional.");
            }
        }

        function registrarLog(acao) {
            if(!usuarioLogado) return;
            logsDB.unshift({ data: new Date().toLocaleString('pt-BR'), nome: usuarioLogado.nome, email: usuarioLogado.email, acao: acao });
            // V17: logs não disparam salvamento completo automático, para não travar login/menu.
        }

        function navegar(aba) {
            document.getElementById('aba-painel').classList.add('hidden');
            document.getElementById('aba-escolas').classList.add('hidden');
            document.getElementById('aba-processos').classList.add('hidden');
            document.getElementById('aba-usuarios').classList.add('hidden');
            document.getElementById('aba-logs').classList.add('hidden');
            
            if (aba === 'painel') { document.getElementById('aba-painel').classList.remove('hidden'); carregarDadosDashboardReal(); } 
            if (aba === 'escolas') { document.getElementById('aba-escolas').classList.remove('hidden'); renderizarListaEscolasBufferMemoria(); if (!sigEESupabaseOnline) setTimeout(() => sincronizarSupabaseSegundoPlanoSIGEE(), 50); } 
            if (aba === 'processos') { document.getElementById('aba-processos').classList.remove('hidden'); carregarEContarProcessosHorizontais(); if (!sigEESupabaseOnline) setTimeout(() => sincronizarSupabaseSegundoPlanoSIGEE(), 50); }
            if (aba === 'usuarios') { document.getElementById('aba-usuarios').classList.remove('hidden'); carregarListaUsuarios(); }
            if (aba === 'logs') { document.getElementById('aba-logs').classList.remove('hidden'); carregarLogs(); }
        }

        function carregarDadosDashboardReal() {
            let escolasVisiveis = (usuarioLogado.perfil === "Master") ? escolasDB : escolasDB.filter(e => e.nte.toUpperCase().replace(/\s/g,'') === usuarioLogado.nte.toUpperCase().replace(/\s/g,''));
            let procVisiveis = (usuarioLogado.perfil === "Master") ? processosDB : processosDB.filter(p => p.nte.toUpperCase().replace(/\s/g,'') === usuarioLogado.nte.toUpperCase().replace(/\s/g,''));

            document.getElementById('dash-escolas').innerText = escolasVisiveis.length;
            document.getElementById('dash-acervos').innerText = escolasVisiveis.filter(e => e.acervo === "Recolhido").length;
            document.getElementById('dash-estaduais').innerText = escolasVisiveis.filter(e => e.dependencia === "Estadual").length;
            document.getElementById('dash-municipios').innerText = [...new Set(escolasVisiveis.map(e => e.municipio))].length;
            document.getElementById('dash-usuarios').innerText = usuariosDB.length;

            document.getElementById('dash-proc-desarquivamento').innerText = procVisiveis.filter(p => p.etapa === "Desarquivamento").length;
            document.getElementById('dash-proc-analise').innerText = procVisiveis.filter(p => p.etapa === "Análise").length;
            document.getElementById('dash-proc-pendencia').innerText = procVisiveis.filter(p => p.etapa === "Pendência").length;
            document.getElementById('dash-proc-digitacao').innerText = procVisiveis.filter(p => p.etapa === "Digitação").length;
            document.getElementById('dash-proc-conferencia').innerText = procVisiveis.filter(p => p.etapa === "Conferência").length;
            document.getElementById('dash-proc-assinatura').innerText = procVisiveis.filter(p => p.etapa === "Assinatura").length;
            document.getElementById('dash-proc-aguardando').innerText = procVisiveis.filter(p => p.etapa === "Aguardando Retirada").length;
            document.getElementById('dash-proc-retirado').innerText = procVisiveis.filter(p => p.etapa === "Retirado").length;
        }

        function toggleBotaoHabilitar(chkId, btnId) {
            const chk = document.getElementById(chkId); const btn = document.getElementById(btnId);
            if(chk && btn) btn.disabled = !chk.checked;
        }

        function preencherSelectTecnicosPorNte(selectId, nteFiltro) {
            const select = document.getElementById(selectId); if(!select) return;
            select.innerHTML = '<option value="">-- Selecione o Servidor --</option>';
            usuariosDB.filter(u => u.nte.toUpperCase().replace(/\s/g,'') === nteFiltro.toUpperCase().replace(/\s/g,'')).forEach(u => {
                select.innerHTML += `<option value="${u.nome}">${u.nome}</option>`;
            });
        }

        function obterDataAtualFormatada() {
            const hoje = new Date();
            return String(hoje.getDate()).padStart(2, '0') + '/' + String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
        }

        // ✅ V28 - Cálculo robusto do TEMPO NA ETAPA
        // Aceita datas no formato brasileiro (dd/mm/aaaa), ISO do Supabase
        // (2026-07-08T...), timestamp e Date. Retorna sempre numeral inteiro.
        function calcularDiasApartirDeDataString(dataString) {
            if(!dataString) return 0;
            try {
                let dataInicio = null;

                if (dataString instanceof Date) {
                    dataInicio = dataString;
                } else if (typeof dataString === 'number') {
                    dataInicio = new Date(dataString);
                } else {
                    const valor = String(dataString).trim();

                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
                        const partes = valor.split('/');
                        dataInicio = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
                    } else if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
                        dataInicio = new Date(valor);
                    } else {
                        const tentativa = new Date(valor);
                        if (!Number.isNaN(tentativa.getTime())) dataInicio = tentativa;
                    }
                }

                if (!dataInicio || Number.isNaN(dataInicio.getTime())) return 0;

                const dataHoje = new Date();
                const inicioDia = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate());
                const hojeDia = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), dataHoje.getDate());
                const diferencaTempo = hojeDia.getTime() - inicioDia.getTime();
                return Math.max(0, Math.floor(diferencaTempo / (1000 * 3600 * 24)));
            } catch(e) { return 0; }
        }

        function obterClasseTempoEtapaSIGEE(etapa, dias) {
            const prazos = {
                'Desarquivamento': 30,
                'Análise': 7,
                'Digitação': 15,
                'Conferência': 10,
                'Assinatura': 7
            };
            if (etapa === 'Pendência' || etapa === 'Aguardando Retirada') return 'bg-blue-50 text-blue-900 border-blue-200';
            if (etapa === 'Retirado') return 'bg-emerald-50 text-emerald-900 border-emerald-200';
            const prazo = prazos[etapa];
            if (!prazo) return 'bg-gray-100 text-gray-700 border-gray-200';
            if (etapa === 'Desarquivamento' && dias >= 31 && dias <= 37) return 'bg-amber-100 text-amber-950 border-amber-300';
            if (dias > prazo) return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
            return 'bg-emerald-50 text-emerald-900 border-emerald-200';
        }

        // =========================================================================
        // 📁 CONTROLADOR DE FLUXOS REGIONAIS E TRAVAMENTO DE DATAS
        // =========================================================================
        function carregarEContarProcessosHorizontais() {
            let visiveis = (usuarioLogado.perfil === "Master") ? processosDB : processosDB.filter(p => p.nte.toUpperCase().replace(/\s/g,'') === usuarioLogado.nte.toUpperCase().replace(/\s/g,''));
            
            document.getElementById('count-horiz-todos').innerText = visiveis.length;
            document.getElementById('count-horiz-desarquivamento').innerText = visiveis.filter(p => p.etapa === "Desarquivamento").length;
            document.getElementById('count-horiz-analise').innerText = visiveis.filter(p => p.etapa === "Análise").length;
            document.getElementById('count-horiz-pendencia').innerText = visiveis.filter(p => p.etapa === "Pendência").length;
            document.getElementById('count-horiz-digitacao').innerText = visiveis.filter(p => p.etapa === "Digitação").length;
            document.getElementById('count-horiz-conferencia').innerText = visiveis.filter(p => p.etapa === "Conferência").length;
            document.getElementById('count-horiz-assinatura').innerText = visiveis.filter(p => p.etapa === "Assinatura").length;
            document.getElementById('count-horiz-aguardando').innerText = visiveis.filter(p => p.etapa === "Aguardando Retirada").length;
            document.getElementById('count-horiz-retirado').innerText = visiveis.filter(p => p.etapa === "Retirado").length;
            
            renderizarProcessosFlutuantes();
        }

        function filtrarProcessosPorEtapa(etapa) { etapaFiltroAtual = etapa; renderizarProcessosFlutuantes(); }



        // ✅ V26 - Ciclo de alertas do Desarquivamento sem alterar a estrutura do fluxo
        const SIGEE_ALERTAS_DESARQUIVAMENTO = {
            1: { titulo: 'REITERAÇÃO', classe: 'bg-amber-500 text-gray-900', box: 'bg-amber-50 border-amber-200 text-amber-950', email: 'ENVIAR E-MAIL: 43- Reiterar (Aluno NORMAL)', proximo: 2 },
            2: { titulo: 'REITERAÇÃO COM URGÊNCIA', classe: 'bg-orange-500 text-white', box: 'bg-orange-50 border-orange-200 text-orange-950', email: 'ENVIAR E-MAIL 44- Reiterar (Aluno URGENTE)', proximo: 3 },
            3: { titulo: 'CONFIRMAR DADOS DA BUSCA', classe: 'bg-red-600 text-white', box: 'bg-red-50 border-red-200 text-red-900', email: 'ENVIAR E-MAIL: 12- Dados (Confirmar dados 1)', proximo: 4 },
            4: { titulo: 'SOLICITAR ATAS SEM PASTA', classe: 'bg-purple-700 text-white', box: 'bg-purple-50 border-purple-200 text-purple-950', email: 'ENVIAR E-MAIL: 26- Processo(Ata - pasta não localizada)', proximo: 4 }
        };

        function obterDataBaseAlertaDesarquivamentoSIGEE(proc) {
            return proc?.data_alerta_desarq || proc?.data_ultimo_alerta_desarq || proc?.data_etapa_atual || obterDataAtualFormatada();
        }



        function salvarEstadoAlertasDesarquivamentoLocalSIGEE() {
            try {
                const estados = {};
                processosDB.forEach(p => {
                    if (p && p.id) estados[p.id] = {
                        alerta_desarq_nivel: p.alerta_desarq_nivel || 0,
                        data_alerta_desarq: p.data_alerta_desarq || null,
                        historico_desarquivamento: p.historico_desarquivamento || []
                    };
                });
                localStorage.setItem('SIGEE_ALERTAS_DESARQUIVAMENTO', JSON.stringify(estados));
            } catch(e) { console.warn('Não foi possível salvar alertas locais do desarquivamento.', e); }
        }

        function restaurarEstadoAlertaDesarquivamentoLocalSIGEE(proc) {
            try {
                if (!proc || !proc.id) return proc;
                const estados = JSON.parse(localStorage.getItem('SIGEE_ALERTAS_DESARQUIVAMENTO') || '{}');
                if (estados[proc.id]) Object.assign(proc, estados[proc.id]);
            } catch(e) {}
            return proc;
        }


        function obterAlertaDesarquivamentoSIGEE(proc) {
            proc = restaurarEstadoAlertaDesarquivamentoLocalSIGEE(proc);
            if (!proc || proc.etapa !== 'Desarquivamento') return null;
            const nivelAtual = Number(proc.alerta_desarq_nivel || 0);
            if (nivelAtual <= 0) {
                const diasNaEtapa = calcularDiasApartirDeDataString(proc.data_etapa_atual);
                return diasNaEtapa >= 31 ? { nivel: 1, dias: diasNaEtapa, desde: proc.data_etapa_atual, ...SIGEE_ALERTAS_DESARQUIVAMENTO[1] } : null;
            }
            const base = obterDataBaseAlertaDesarquivamentoSIGEE(proc);
            const diasDepoisAlerta = calcularDiasApartirDeDataString(base);
            if (diasDepoisAlerta >= 7) {
                const prox = SIGEE_ALERTAS_DESARQUIVAMENTO[Math.min(nivelAtual + 1, 4)] || SIGEE_ALERTAS_DESARQUIVAMENTO[4];
                return { nivel: Math.min(nivelAtual + 1, 4), dias: diasDepoisAlerta, desde: base, ...prox };
            }
            return null;
        }

        function alternarRetificacaoDesarquivamentoSIGEE() {
            const chk = document.getElementById('f00-retificar-dados');
            const box = document.getElementById('f00-box-retificacao');
            if (box) box.classList.toggle('hidden', !(chk && chk.checked));
        }

        function aplicarEstadoCamposDesarquivamentoSIGEE(comAlerta) {
            ['f00-tipo', 'f00-local', 'f00-prioridade', 'f00-analista'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.required = !comAlerta;
            });
            const chkEmail = document.getElementById('f00-chk-email');
            const submit = document.getElementById('f00-submit');
            if (chkEmail) chkEmail.required = !comAlerta;
            if (comAlerta) {
                if (submit) { submit.disabled = false; submit.innerText = 'Registrar Alerta / Reiniciar Ciclo'; }
            } else {
                if (submit) { submit.disabled = true; submit.innerText = 'Enviar para Análise'; }
            }
        }

        function registrarHistoricoAlertaDesarquivamentoSIGEE(proc, texto) {
            if (!proc) return;
            const data = new Date().toLocaleString('pt-BR');
            proc.historico_desarquivamento = proc.historico_desarquivamento || [];
            proc.historico_desarquivamento.push({ data, texto });
        }

        function renderizarProcessosFlutuantes() {
            const corpo = document.getElementById('tabela-processos-corpo'); if(!corpo) return; corpo.innerHTML = "";
            
            let filtrados = (usuarioLogado.perfil === "Master") ? processosDB : processosDB.filter(p => p.nte.toUpperCase().replace(/\s/g,'') === usuarioLogado.nte.toUpperCase().replace(/\s/g,''));
            if (etapaFiltroAtual !== 'TODOS') filtrados = filtrados.filter(p => p.etapa === etapaFiltroAtual);

            const busca = document.getElementById('busca-proc-nome').value.toLowerCase();
            if (busca) filtrados = filtrados.filter(p => p.aluno.toLowerCase().includes(busca));

            filtrados.forEach(p => {
                let diasContados = calcularDiasApartirDeDataString(p.data_etapa_atual || p.created_at || p.criado_em);
                const classeTempoEtapa = obterClasseTempoEtapaSIGEE(p.etapa, diasContados);
                let botaoFluxoContextual = "";
                let badgeAlertaPrazo = "";

                // Regras e Alertas de Prazos Condicionais da Etapa de Desarquivamento
                if (p.etapa === "Desarquivamento") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoDesarquivamento(${p.id})" class="bg-gray-800 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">📥 Documento Recebido</button>`;
                    
                    const alertaDesarq = obterAlertaDesarquivamentoSIGEE(p);
                    if (alertaDesarq) {
                        badgeAlertaPrazo = `<span class="block ${alertaDesarq.classe} text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5 animate-pulse">⚠️ ${alertaDesarq.titulo}</span>`;
                    }
                } else if (p.etapa === "Análise") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoAnalise(${p.id})" class="bg-blue-800 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">✅ ANÁLISE REALIZADA</button>`;
                } else if (p.etapa === "Pendência") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoPendencia(${p.id})" class="bg-red-600 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">⚠️ Tratar Pendência</button>`;
                } else if (p.etapa === "Digitação") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoDigitacao(${p.id})" class="bg-indigo-600 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">⌨️ DOCUMENTO DIGITADO</button>`;
                } else if (p.etapa === "Conferência") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoConferencia(${p.id})" class="bg-orange-600 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">🧐 DOCUMENTO CONFERIDO</button>`;
                } else if (p.etapa === "Assinatura") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoAssinatura(${p.id})" class="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">📜 Deferido</button>`;
                } else if (p.etapa === "Aguardando Retirada") {
                    botaoFluxoContextual = `<button onclick="abrirModalFluxoAguardando(${p.id})" class="bg-gray-700 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer">🎁 RETIRADO</button>`;
                } else {
                    botaoFluxoContextual = `<span class="text-gray-400 italic font-bold">Retirado</span>`;
                }

                let areaControlesMasterOuComum = "";
                if (usuarioLogado.perfil === "Master") {
                    let opcoesEtapasSelect = ETAPAS_FLUXO_OFICIAL.map(etp => 
                        `<option value="${etp}" ${p.etapa === etp ? 'selected' : ''}>Forçar: ${etp}</option>`
                    ).join("");

                    areaControlesMasterOuComum = `
                        <div class="flex flex-col gap-1 border-l pl-2 border-gray-200">
                            <select onchange="alterarEtapaDiretoMaster(${p.id}, this.value)" class="p-1 bg-purple-50 text-purple-950 font-bold border border-purple-200 rounded text-[9px] focus:outline-none">
                                ${opcoesEtapasSelect}
                            </select>
                        </div>
                    `;
                }

                corpo.innerHTML += `
                    <tr class="hover:bg-gray-50">
                        <td class="p-2.5 font-bold text-gray-900 truncate">
                            <span class="block uppercase tracking-wide truncate">${p.aluno}</span>
                            <span class="text-[10px] text-blue-800 font-extrabold bg-blue-50 px-1 py-0.2 rounded">${p.documento}</span>
                        </td>
                        <td class="p-2.5 text-gray-600 truncate">
                            <span class="block font-bold truncate text-[10px]">${p.escola}</span>
                            <span class="text-[9px] text-gray-400 block font-semibold uppercase truncate">${p.nte}</span>
                        </td>
                        <td class="p-2.5 text-center">
                            <span class="px-1.5 py-0.5 bg-amber-100 text-amber-950 font-black rounded text-[9px] uppercase tracking-tight block">${p.etapa}</span>
                            ${badgeAlertaPrazo}
                        </td>
                        <td class="p-2.5 text-center font-black text-gray-700">
                            <span class="inline-block min-w-[58px] text-xs px-2 py-1 rounded border ${classeTempoEtapa}">${diasContados} dias</span>
                        </td>
                        <td class="p-2.5">
                            <div class="flex items-center justify-center gap-1.5">
                                ${botaoFluxoContextual}
                                ${areaControlesMasterOuComum}
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        function fecharModalFluxo(fase) { document.getElementById(`modal-fluxo-${fase}`).classList.add('hidden'); }

        function abrirModalFluxoDesarquivamento(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f00-id').value = p.id;
                document.getElementById('f00-tipo').value = "";
                document.getElementById('f00-local').value = "";
                document.getElementById('f00-prioridade').value = "";
                document.getElementById('f00-chk-email').checked = false;
                preencherSelectTecnicosPorNte('f00-analista', p.nte);

                let containerAlertas = document.getElementById('f00-container-alertas');
                const alerta = obterAlertaDesarquivamentoSIGEE(p);
                containerAlertas.innerHTML = "";
                containerAlertas.classList.add('hidden');
                aplicarEstadoCamposDesarquivamentoSIGEE(false);

                if(alerta) {
                    containerAlertas.classList.remove('hidden');
                    aplicarEstadoCamposDesarquivamentoSIGEE(true);
                    containerAlertas.innerHTML = `
                        <div class="${alerta.box} p-3 border rounded-lg text-xs font-bold space-y-3">
                            <div class="text-[11px] font-black uppercase tracking-wide">⚠️ ${alerta.titulo}</div>
                            <label class="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" id="f00-alerta-email" required class="mt-0.5">
                                <span>${alerta.email}</span>
                            </label>
                            <label class="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" id="f00-retificar-dados" class="mt-0.5" onchange="alternarRetificacaoDesarquivamentoSIGEE()">
                                <span>RETIFICAR DADOS</span>
                            </label>
                            <div id="f00-box-retificacao" class="hidden space-y-1">
                                <label class="block text-[10px] font-black uppercase">Informe o que foi alterado/retificado</label>
                                <textarea id="f00-detalhe-retificacao" class="w-full p-2 border rounded text-xs bg-white focus:outline-none" rows="3" placeholder="Ex.: correção de nome, escola, ano, série, modalidade, turno ou outros dados da busca."></textarea>
                            </div>
                        </div>`;
                }

                document.getElementById('modal-fluxo-desarquivamento').classList.remove('hidden');
            }
        }

        function executarTransicaoDesarquivamento(event) {
            event.preventDefault();
            let id = document.getElementById('f00-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(!p) return;

            const alerta = obterAlertaDesarquivamentoSIGEE(p);
            const chkAlerta = document.getElementById('f00-alerta-email');
            const emModoAlerta = !!(alerta && chkAlerta);

            if (emModoAlerta) {
                if (!chkAlerta.checked) {
                    alert('Marque a confirmação do e-mail obrigatório para registrar o alerta.');
                    return;
                }

                const retificar = document.getElementById('f00-retificar-dados')?.checked;
                const detalhe = (document.getElementById('f00-detalhe-retificacao')?.value || '').trim();

                if (retificar && !detalhe) {
                    alert('Informe o que foi alterado/retificado antes de reiniciar o ciclo.');
                    return;
                }

                if (retificar) {
                    p.data_etapa_atual = obterDataAtualFormatada();
                    p.alerta_desarq_nivel = 0;
                    p.data_alerta_desarq = null;
                    p.retificacao_dados = detalhe;
                    registrarHistoricoAlertaDesarquivamentoSIGEE(p, `${alerta.titulo}: ${alerta.email}. Dados retificados: ${detalhe}. Ciclo reiniciado em 30 dias.`);
                    registrarLog(`Processo [${p.aluno}]: ${alerta.titulo} registrado com retificação de dados. Ciclo de Desarquivamento reiniciado.`);
                } else {
                    p.alerta_desarq_nivel = alerta.nivel;
                    p.data_alerta_desarq = obterDataAtualFormatada();
                    registrarHistoricoAlertaDesarquivamentoSIGEE(p, `${alerta.titulo}: ${alerta.email}. Sem retificação de dados.`);
                    registrarLog(`Processo [${p.aluno}]: ${alerta.titulo} registrado sem retificação.`);
                }

                salvarEstadoAlertasDesarquivamentoLocalSIGEE();
                salvarBancoLocalSIGEE();
                fecharModalFluxo('desarquivamento');
                carregarEContarProcessosHorizontais();
                return;
            }

            p.etapa = "Análise";
            p.data_etapa_atual = obterDataAtualFormatada();
            p.alerta_desarq_nivel = 0;
            p.data_alerta_desarq = null;
            registrarLog(`Processo [${p.aluno}]: Triado para Análise. Data resetada.`);
            salvarEstadoAlertasDesarquivamentoLocalSIGEE();
            salvarBancoLocalSIGEE();
            fecharModalFluxo('desarquivamento');
            carregarEContarProcessosHorizontais();
        }

        function abrirModalFluxoAnalise(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f01-id').value = p.id;
                document.getElementById('f01-pendencia').value = "não";
                document.getElementById('f01-p-aluno').checked = false;
                document.getElementById('f01-p-inst').checked = false;
                document.getElementById('f01-txt-detalhe').value = "";
                document.getElementById('f01-chk-email').checked = false;
                preencherSelectTecnicosPorNte('f01-digitador', p.nte);
                onChangePendenciaAnalise();
                document.getElementById('modal-fluxo-analise').classList.remove('hidden');
            }
        }

        function onChangePendenciaAnalise() {
            const ehPendencia = document.getElementById('f01-pendencia').value === "sim";
            if (ehPendencia) {
                document.getElementById('box-pendencia-analise').classList.remove('hidden');
                document.getElementById('box-fluxo-normal-analise').classList.add('hidden');
                onChangeTipoPendenciaAnalise();
            } else {
                document.getElementById('box-pendencia-analise').classList.add('hidden');
                document.getElementById('box-fluxo-normal-analise').classList.remove('hidden');
                document.getElementById('f01-submit').innerText = "Enviar para Análise";
                document.getElementById('f01-submit').disabled = true;
            }
        }

        function onChangeTipoPendenciaAnalise() {
            const pAluno = document.getElementById('f01-p-aluno').checked;
            const pInst = document.getElementById('f01-p-inst').checked;
            const msgBox = document.getElementById('msg-email-pendencia');
            const btn = document.getElementById('f01-submit');
            btn.innerText = "Enviar para Pendência"; btn.disabled = false;

            if (pAluno && pInst) msgBox.innerText = "📧 ENVIAR E-MAIL 09 - Aluno Pendência (INSTITUIÇÃO e REQUERENTE)";
            else if (pInst) msgBox.innerText = "📧 ENVIAR E-MAIL: 08 - Aluno Pendência (INSTITUIÇÃO)";
            else if (pAluno) msgBox.innerText = "📧 ENVIAR E-MAIL: 07-Aluno Pendência (Aluno)";
            else { msgBox.innerText = "⚠️ Selecione pelo menos uma variação."; btn.disabled = true; }
        }

        function atualizarBotaoSubmissaoAnalise() {
            const chk = document.getElementById('f01-chk-email').checked;
            const dig = document.getElementById('f01-digitador').value;
            document.getElementById('f01-submit').disabled = !(chk && dig !== "");
        }

        function executarTransicaoAnalise(event) {
            event.preventDefault();
            let id = document.getElementById('f01-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                const ehPendencia = document.getElementById('f01-pendencia').value === "sim";
                p.etapa = ehPendencia ? "Pendência" : "Digitação";
                p.data_etapa_atual = obterDataAtualFormatada();
                registrarLog(`Processo [${p.aluno}]: Direcionado para ${p.etapa}.`);
                salvarBancoLocalSIGEE();
                fecharModalFluxo('analise'); carregarEContarProcessosHorizontais();
            }
        }

        function abrirModalFluxoPendencia(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f02-id').value = p.id;
                document.getElementById('f02-recebimento').value = "total";
                document.getElementById('f02-txt-pendente').value = "";
                document.getElementById('f02-chk-email').checked = false;
                document.getElementById('f02-submit').disabled = true;
                preencherSelectTecnicosPorNte('f02-digitador', p.nte);
                onChangeRecebimentoPendencia();
                document.getElementById('modal-fluxo-pendencia').classList.remove('hidden');
            }
        }

        function onChangeRecebimentoPendencia() {
            const tipo = document.getElementById('f02-recebimento').value;
            if(tipo === "total") {
                document.getElementById('box-total-pendencia').classList.remove('hidden');
                document.getElementById('box-parcial-pendencia').classList.add('hidden');
            } else {
                document.getElementById('box-total-pendencia').classList.add('hidden');
                document.getElementById('box-parcial-pendencia').classList.remove('hidden');
            }
            document.getElementById('f02-chk-email').checked = false; document.getElementById('f02-submit').disabled = true;
        }

        function executarTransicaoPendencia(event) {
            event.preventDefault();
            let id = document.getElementById('f02-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                p.etapa = "Digitação";
                p.data_etapa_atual = obterDataAtualFormatada();
                salvarBancoLocalSIGEE();
                fecharModalFluxo('pendencia'); carregarEContarProcessosHorizontais();
            }
        }

        function abrirModalFluxoDigitacao(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f05-id').value = p.id;
                document.getElementById('f05-chk-email').checked = false;
                document.getElementById('f05-submit').disabled = true;
                preencherSelectTecnicosPorNte('f05-conferente', p.nte);
                document.getElementById('modal-fluxo-digitacao').classList.remove('hidden');
            }
        }

        function executarTransicaoDigitacao(event) {
            event.preventDefault();
            let id = document.getElementById('f05-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(p) { p.etapa = "Conferência"; p.data_etapa_atual = obterDataAtualFormatada(); salvarBancoLocalSIGEE(); fecharModalFluxo('digitacao'); carregarEContarProcessosHorizontais(); }
        }

        function abrirModalFluxoConferencia(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f06-id').value = p.id;
                document.getElementById('f06-chk-email').checked = false;
                document.getElementById('f06-submit').disabled = true;
                document.getElementById('modal-fluxo-conferencia').classList.remove('hidden');
            }
        }

        function executarTransicaoConferencia(event) {
            event.preventDefault();
            let id = document.getElementById('f06-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(p) { p.etapa = "Assinatura"; p.data_etapa_atual = obterDataAtualFormatada(); salvarBancoLocalSIGEE(); fecharModalFluxo('conferencia'); carregarEContarProcessosHorizontais(); }
        }

        function abrirModalFluxoAssinatura(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f07-id').value = p.id;
                document.getElementById('f07-chk-email').checked = false;
                document.getElementById('f07-submit').disabled = true;
                document.getElementById('modal-fluxo-assinatura').classList.remove('hidden');
            }
        }

        function executarTransicaoAssinatura(event) {
            event.preventDefault();
            let id = document.getElementById('f07-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(p) { p.etapa = "Aguardando Retirada"; p.data_etapa_atual = obterDataAtualFormatada(); salvarBancoLocalSIGEE(); fecharModalFluxo('assinatura'); carregarEContarProcessosHorizontais(); }
        }

        function abrirModalFluxoAguardando(id) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                document.getElementById('f08-id').value = p.id;
                document.getElementById('f08-retirada').value = "solicitante";
                onChangeFormaRetirada();
                document.getElementById('modal-fluxo-aguardando').classList.remove('hidden');
            }
        }

        function onChangeFormaRetirada() {
            const forma = document.getElementById('f08-retirada').value;
            document.getElementById('box-terceiros-retirada').classList.toggle('hidden', forma !== "terceiros");
        }

        function executarTransicaoAguardando(event) {
            event.preventDefault();
            let id = document.getElementById('f08-id').value;
            let p = processosDB.find(proc => proc.id == id);
            if(p) { p.etapa = "Retirado"; p.data_etapa_atual = obterDataAtualFormatada(); salvarBancoLocalSIGEE(); fecharModalFluxo('aguardando'); carregarEContarProcessosHorizontais(); }
        }

        function abrirFormularioNovaSolicitacao() {
            const btnAbrir = document.querySelector('button[onclick="abrirFormularioNovaSolicitacao()"]');
            if (btnAbrir) { btnAbrir.disabled = true; btnAbrir.dataset.textoOriginal = btnAbrir.innerText; btnAbrir.innerText = 'Carregando...'; }

            // V18: abre a nova solicitação sem travar; não bloqueia a tela com alertas de sincronização em segundo plano.
            requestAnimationFrame(() => {
                try {
                    const selectEscola = document.getElementById('novo-proc-escola');
                    if(!selectEscola) return;

                    const nteUsuario = normalizarTextoSIGEE(usuarioLogado && usuarioLogado.nte).toUpperCase().replace(/\s/g,'');
                    let filtradas = (usuarioLogado && usuarioLogado.perfil === "Master")
                        ? escolasDB
                        : escolasDB.filter(e => normalizarTextoSIGEE(e.nte).toUpperCase().replace(/\s/g,'') === nteUsuario);

                    filtradas = filtradas.filter(e => normalizarTextoSIGEE(e.nome || e.nome_escola || e.instituicao));
                    if(filtradas.length === 0) {
                        alert("Nenhuma escola catalogada para o seu NTE de origem. Aguarde a sincronização do Supabase ou verifique a tabela escolas_sigee.");
                        return;
                    }

                    // Montagem rápida: limita a lista inicial para não travar o navegador.
                    // A busca no catálogo continua disponível para localizar qualquer escola.
                    const limiteLista = 500;
                    const listaSelect = filtradas.slice(0, limiteLista);
                    selectEscola.innerHTML = listaSelect.map(e => {
                        const nomeEscola = normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao);
                        return `<option value="${nomeEscola.replace(/"/g, '&quot;')}">${nomeEscola}</option>`;
                    }).join('');
                    if (filtradas.length > limiteLista) {
                        console.info(`SIGEE: lista de escolas da nova solicitação limitada a ${limiteLista} registros para evitar travamento. Total disponível: ${filtradas.length}.`);
                    }

                    document.getElementById('novo-proc-aluno').value = "";
                    document.getElementById('f01-chk-acolhido').checked = false;
                    document.getElementById('btn-submeter-nova-solicitacao').disabled = true;
                    handleSelecaoInstituicaoFluxoAutomatico();
                    document.getElementById('modal-nova-solicitacao').classList.remove('hidden');
                } finally {
                    if (btnAbrir) { btnAbrir.disabled = false; btnAbrir.innerText = btnAbrir.dataset.textoOriginal || '➕ 📥 Nova Solicitação'; }
                }
            });
        }

        function handleSelecaoInstituicaoFluxoAutomatico() {
            const seletor = document.getElementById('novo-proc-escola');
            const instNome = normalizarMaiusculoSIGEE(seletor.value);
            const esc = escolasDB.find(e => normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao) === instNome || String(e.cod_mec || '') === String(instNome || ''));
            if(esc) {
                document.getElementById('novo-autofill-mec').value = esc.cod_mec || "";
                document.getElementById('novo-autofill-nte').value = esc.nte || "";
                document.getElementById('novo-autofill-municipio').value = esc.municipio || "";
                document.getElementById('novo-autofill-dep').value = esc.dependencia || "";
                document.getElementById('novo-autofill-situacao').value = esc.situacao || "";
                document.getElementById('novo-autofill-acervo').value = esc.acervo || "";
                document.getElementById('novo-autofill-local-acervo').value = esc.local_acervo || "";
            }
        }

        function fecharModalNovaSolicitacao() { document.getElementById('modal-nova-solicitacao').classList.add('hidden'); }

        async function salvarNovaSolicitacao(event) {
            event.preventDefault();
            const botao = document.getElementById('btn-submeter-nova-solicitacao');
            const textoOriginal = botao ? botao.innerText : '';
            if (botao) { botao.disabled = true; botao.innerText = 'Registrando...'; }

            try {
                const nomeAluno = normalizarMaiusculoSIGEE(document.getElementById('novo-proc-aluno').value).trim();
                const escolaNome = normalizarMaiusculoSIGEE(document.getElementById('novo-proc-escola').value);
                const docTipo = document.getElementById('novo-proc-documento').value;
                const mun = document.getElementById('novo-autofill-municipio').value;
                const nteVinculo = document.getElementById('novo-autofill-nte').value;
                const dataHoje = obterDataAtualFormatada();

                if (!nomeAluno || !escolaNome) {
                    alert('Informe o nome do aluno e selecione a escola.');
                    return;
                }

                const novoId = gerarProximoIdSIGEE(processosDB, 101);
                const novaSolicitacaoSIGEE = {
                    id: novoId, aluno: nomeAluno, escola: escolaNome, documento: docTipo,
                    etapa: "Desarquivamento", data_etapa_atual: dataHoje, nte: nteVinculo, municipio: mun
                };
                processosDB.push(novaSolicitacaoSIGEE);
                solicitacoesDB.push({...novaSolicitacaoSIGEE});

                registrarLog(`Nova solicitação cadastrada para ${nomeAluno}. Data de Início: ${dataHoje}`);
                fecharModalNovaSolicitacao();
                carregarEContarProcessosHorizontais();

                // V17: não trava a tela aguardando resposta do Supabase.
                // O envio é feito em segundo plano; se falhar, aparece aviso sem congelar o botão.
                setTimeout(async () => {
                    const ok = await salvarNovaSolicitacaoSupabaseSIGEE(novaSolicitacaoSIGEE);
                    if (!ok) console.warn('Solicitação criada localmente na tela, mas ainda não confirmada no Supabase.');
                }, 20);
            } finally {
                if (botao) { botao.innerText = textoOriginal || 'Enviar para Desarquivamento'; botao.disabled = false; }
            }
        }

        function alterarEtapaDiretoMaster(id, novaEtapa) {
            let p = processosDB.find(proc => proc.id == id);
            if(p) {
                p.etapa = novaEtapa;
                p.data_etapa_atual = obterDataAtualFormatada(); // Trava a data ao forçar etapa
                registrarLog(`[MASTER] Alterou a etapa do processo ID ${p.id} para ${novaEtapa}.`);
                salvarBancoLocalSIGEE();
                carregarEContarProcessosHorizontais();
            }
        }

        // =========================================================================
        // 📥 MOTOR DE IMPORTAÇÃO EXCEL OTIMIZADO
        // =========================================================================
        function processarImportacaoOtimizada(event) {
            const arquivo = event.target.files[0]; if(!arquivo) return;
            const leitor = new FileReader();
            leitor.onload = function(e) {
                const dadosBinarios = e.target.result;
                const livroExcel = XLSX.read(dadosBinarios, { type: 'binary' });
                const nomeAba = livroExcel.SheetNames[0];
                const linhasJson = XLSX.utils.sheet_to_json(livroExcel.Sheets[nomeAba]);

                document.getElementById('card-progresso-importacao').classList.remove('hidden');
                document.getElementById('label-status-importacao').innerText = "Processando e gravando registros...";
                let totalInseridos = 0, totalAtualizados = 0, indexCorrente = 0;
                let escolasAlteradasSupabase = [];
                const loteTamanho = 200;

                function processarLote() {
                    const limiteFim = Math.min(indexCorrente + loteTamanho, linhasJson.length);
                    for(let i = indexCorrente; i < limiteFim; i++) {
                        let linha = linhasJson[i];
                        let chaves = Object.keys(linha);
                        let obterValor = (variacoes) => {
                            let f = chaves.find(k => variacoes.includes(String(k).trim().toUpperCase()));
                            return f ? String(linha[f]).trim() : "";
                        };

                        let mec = normalizarTextoSIGEE(obterValor(["CÓDIGO MEC", "CODIGO MEC", "COD MEC", "MEC", "CÓD MEC"]));
                        let nome = normalizarMaiusculoSIGEE(obterValor(["NOME DA ESCOLA", "NOME", "INSTITUIÇÃO", "INSTITUICAO", "ESCOLA"]));
                        let mun = normalizarMaiusculoSIGEE(obterValor(["MUNICÍPIO", "MUNICIPIO", "CIDADE"]));
                        let nte = normalizarTextoSIGEE(obterValor(["NTE", "NTE VINCULADO", "NÚCLEO", "NUCLEO"]));
                        let dep = normalizarTextoSIGEE(obterValor(["DEPENDÊNCIA ADMINISTRATIVA", "DEPENDENCIA ADMINISTRATIVA", "DEPENDENCIA", "DEP. ADMINISTRATIVO", "DEP ADMINISTRATIVO"]));
                        let sit = normalizarTextoSIGEE(obterValor(["SITUAÇÃO", "SITUACAO", "STATUS"]));
                        let acv = normalizarTextoSIGEE(obterValor(["ACERVO", "STATUS DO ACERVO"]));
                        let locAcv = normalizarTextoSIGEE(obterValor(["LOCAL DO ACERVO", "LOCAL", "LOCAL ACERVO"]));

                        if(!nte) nte = "NTE-26 Salvador";
                        if(!dep) dep = "Estadual";
                        if(!sit) sit = "Extinta";
                        if(!acv) acv = "Recolhido";
                        if(!locAcv) locAcv = "Acervo do NTE";

                        if(!mec || !nome || !mun) continue;

                        const escolaExistente = escolasDB.find(esc => String(esc.cod_mec).trim() === mec);
                        if(escolaExistente) {
                            escolaExistente.nome = nome;
                            escolaExistente.municipio = mun;
                            escolaExistente.nte = nte;
                            escolaExistente.dependencia = dep;
                            escolaExistente.situacao = sit;
                            escolaExistente.acervo = acv;
                            escolaExistente.local_acervo = locAcv;
                            escolasAlteradasSupabase.push(escolaExistente);
                            totalAtualizados++;
                        } else {
                            const novaEscolaImportada = {
                                id: gerarProximoIdSIGEE(escolasDB, 1), cod_mec: mec, nome: nome, municipio: mun,
                                nte: nte, dependencia: dep, situacao: sit, acervo: acv, local_acervo: locAcv
                            };
                            escolasDB.push(novaEscolaImportada);
                            escolasAlteradasSupabase.push(novaEscolaImportada);
                            totalInseridos++;
                        }
                    }
                    indexCorrente = limiteFim;
                    let pct = linhasJson.length ? Math.round((indexCorrente / linhasJson.length) * 100) : 100;
                    document.getElementById('barra-progresso-importacao').style.width = pct + "%";
                    document.getElementById('percentual-importacao-texto').innerText = pct + "%";

                    if(indexCorrente < linhasJson.length) setTimeout(processarLote, 5);
                    else {
                        document.getElementById('label-status-importacao').innerText = "Gravando escolas no Supabase...";
                        registrarLog(`Importação de escolas concluída. Inseridos: ${totalInseridos}. Atualizados: ${totalAtualizados}.`);
                        salvarEscolasNoSupabaseSIGEE(escolasAlteradasSupabase).then(async () => {
                            document.getElementById('label-status-importacao').innerText = "Salvando no Supabase...";
                            await carregarEscolasSupabaseSIGEE();
                            await salvarBancoEAguardarSIGEE();
                            document.getElementById('card-progresso-importacao').classList.add('hidden');
                            event.target.value = "";
                            alert(`Carga realizada! Supabase: ${sigEESupabaseOnline ? 'sincronizado' : 'não sincronizado'} | Inseridos: ${totalInseridos} | Atualizados: ${totalAtualizados}`);
                            paginaEscolaAtual = 1;
                            renderizarListaEscolasBufferMemoria();
                            if (document.getElementById('aba-painel') && !document.getElementById('aba-painel').classList.contains('hidden')) carregarDadosDashboardReal();
                        });
                    }
                }
                processarLote();
            };
            leitor.readAsBinaryString(arquivo);
        }

        // =========================================================================
        // 🏢 GERENCIAMENTO DE ESCOLAS
        // =========================================================================
        function abrirModalNovaEscola() {
            document.getElementById('escola-form-id').value = "";
            document.getElementById('modal-cadastro-escola').classList.remove('hidden');
        }

        function fecharModalEscola() { document.getElementById('modal-cadastro-escola').classList.add('hidden'); }

        function renderizarListaEscolasBufferMemoria() {
            const corpo = document.getElementById('tabela-escolas-corpo'); if(!corpo) return; corpo.innerHTML = "";
            let filtradas = (usuarioLogado.perfil === "Master") ? escolasDB : escolasDB.filter(e => e.nte.toUpperCase().replace(/\s/g,'') === usuarioLogado.nte.toUpperCase().replace(/\s/g,''));
            const termoBusca = (document.getElementById('busca-escola')?.value || '').toLowerCase().trim();
            if (termoBusca) {
                filtradas = filtradas.filter(e =>
                    String(e.cod_mec || '').toLowerCase().includes(termoBusca) ||
                    String(e.nome || '').toLowerCase().includes(termoBusca) ||
                    String(e.municipio || '').toLowerCase().includes(termoBusca) ||
                    String(e.nte || '').toLowerCase().includes(termoBusca)
                );
            }

            document.getElementById('info-quantidade-escolas-carregadas').innerText = `Exibindo: ${filtradas.length} registros | Banco: ${sigEESupabaseOnline ? 'Supabase' : 'pendente Supabase'}`;
            let inicio = (paginaEscolaAtual - 1) * totalPorPaginaEscola;
            let paginasTotais = Math.max(1, Math.ceil(filtradas.length / totalPorPaginaEscola));
            if (paginaEscolaAtual > paginasTotais) paginaEscolaAtual = paginasTotais;
            if (paginaEscolaAtual < 1) paginaEscolaAtual = 1;
            inicio = (paginaEscolaAtual - 1) * totalPorPaginaEscola;
            let paginadas = filtradas.slice(inicio, inicio + totalPorPaginaEscola);

            paginadas.forEach(e => {
                corpo.innerHTML += `
                    <tr class="hover:bg-gray-50 text-[11px]">
                        <td class="p-3 font-mono font-bold">${e.cod_mec}</td>
                        <td class="p-3 font-bold text-blue-950 uppercase">${e.nome}</td>
                        <td class="p-3 uppercase font-medium">${e.municipio}</td>
                        <td class="p-3 font-semibold text-gray-500">${e.nte}<br><span class="text-[9px] bg-gray-100 font-bold px-1 rounded">${e.dependencia}</span></td>
                        <td class="p-3"><span class="px-1.5 py-0.5 font-bold rounded text-[10px] bg-red-100 text-red-800">${e.situacao}</span></td>
                        <td class="p-3 font-bold text-gray-700">${e.acervo}</td>
                        <td class="p-3 text-center"><button class="text-blue-900 font-bold">Alterar</button></td>
                    </tr>
                `;
            });

            const txtPaginacao = document.getElementById('txt-escola-paginacao');
            const btnAnterior = document.getElementById('btn-escola-anterior');
            const btnProxima = document.getElementById('btn-escola-proxima');
            if (txtPaginacao) txtPaginacao.innerText = `Página ${paginaEscolaAtual} de ${paginasTotais}`;
            if (btnAnterior) btnAnterior.disabled = paginaEscolaAtual <= 1;
            if (btnProxima) btnProxima.disabled = paginaEscolaAtual >= paginasTotais;
        }

        function filtrarPorBusca() {
            paginaEscolaAtual = 1;
            renderizarListaEscolasBufferMemoria();
        }

        function mudarPaginaEscola(dir) {
            paginaEscolaAtual += dir;
            renderizarListaEscolasBufferMemoria();
        }

        // =========================================================================
        // 👥 CONTROLE EXPANDIDO DE USUÁRIOS E SENHAS (EXCLUSIVO MASTER)
        // =========================================================================
        function carregarListaUsuarios() {
            const corpo = document.getElementById('tabela-usuarios-corpo'); if(!corpo) return; corpo.innerHTML = "";
            usuariosDB.forEach(u => {
                let botoesMaster = `<span class="text-xs text-gray-400 italic">Sem permissão</span>`;
                if (usuarioLogado && usuarioLogado.perfil === 'Master') {
                    botoesMaster = `
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button>
                            <button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo ? 'bg-red-600' : 'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">
                                ${u.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                            <button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>
                        </div>
                    `;
                }
                corpo.innerHTML += `
                    <tr class="text-xs">
                        <td class="p-3 font-bold">${u.nome}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td>
                        <td class="p-3 font-medium">${u.perfil}</td>
                        <td class="p-3 font-semibold text-gray-600">${u.nte}</td>
                        <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${u.ativo ? 'ATIVO' : 'INATIVO'}</span></td>
                        <td class="p-3 text-center">${botoesMaster}</td>
                    </tr>
                `;
            });
        }

        function abrirModalCriarUsuarioMaster() {
            document.getElementById('titulo-modal-usuario').innerText = "👥 Cadastrar Técnico";
            document.getElementById('user-form-id').value = "";
            document.getElementById('user-form-nome').value = "";
            document.getElementById('user-form-email').value = "";
            document.getElementById('user-form-senha').value = "SECBA2026";
            inicializarSelectsNteEcosystem();
            document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
        }

        function abrirModalEditarUsuarioMaster(id) {
            let u = usuariosDB.find(user => user.id == id);
            if(u) {
                document.getElementById('titulo-modal-usuario').innerText = "📝 Editar Informações do Técnico";
                document.getElementById('user-form-id').value = u.id;
                document.getElementById('user-form-nome').value = u.nome;
                document.getElementById('user-form-email').value = u.email;
                document.getElementById('user-form-senha').value = u.senha;
                inicializarSelectsNteEcosystem();
                document.getElementById('user-form-nte').value = u.nte;
                document.getElementById('user-form-perfil').value = u.perfil;
                document.getElementById('modal-cadastro-usuario').classList.remove('hidden');
            }
        }

        function fecharModalUsuario() { document.getElementById('modal-cadastro-usuario').classList.add('hidden'); }

        async function salvarNovoUsuarioFormularioMaster(event) {
            event.preventDefault();
            const id = document.getElementById('user-form-id').value;
            const nome = document.getElementById('user-form-nome').value.toUpperCase().trim();
            const email = document.getElementById('user-form-email').value.trim();
            const senha = document.getElementById('user-form-senha').value;
            const nte = document.getElementById('user-form-nte').value;
            const perfil = perfilCanonicoSIGEE(document.getElementById('user-form-perfil').value);

            let usuarioAtualizado = null;
            let modo = 'editar';

            if(!id) {
                if(usuariosDB.some(u => u.email.toLowerCase() === email.toLowerCase())) return alert("E-mail já cadastrado.");
                usuarioAtualizado = { id: null, nome: nome, email: email, senha: senha, perfil: perfil, nte: nte, ativo: true };
                modo = 'criar';
            } else {
                usuarioAtualizado = usuariosDB.find(user => user.id == id);
                if(!usuarioAtualizado) return alert('Usuário não localizado para edição.');
                usuarioAtualizado.nome = nome;
                usuarioAtualizado.email = email;
                usuarioAtualizado.senha = senha;
                usuarioAtualizado.nte = nte;
                usuarioAtualizado.perfil = perfil;
                modo = 'editar';
            }

            const okSupabase = await salvarUsuarioIndividualSupabaseSIGEE(usuarioAtualizado, id, modo === 'criar' ? 'criar' : 'editar');
            if (!okSupabase) return;

            if (modo === 'criar') {
                if (!usuarioAtualizado.id) usuarioAtualizado.id = gerarProximoIdSIGEE(usuariosDB, 1);
                usuariosDB.push(usuarioAtualizado);
                registrarLog(`Cadastrou novo operador: ${email}`);
            } else {
                registrarLog(`Atualizou cadastro do operador: ${email}`);
            }

            fecharModalUsuario();
            carregarListaUsuarios();
            alert('Cadastro de usuário salvo no Supabase com sucesso.');
        }

        function toggleStatusUsuarioMaster(id) {
            let u = usuariosDB.find(user => user.id == id);
            if (u) {
                u.ativo = !u.ativo;
                registrarLog(`Alterou status do operador: ${u.email}`);
                carregarListaUsuarios();
                alert('Status alterado apenas nesta sessão. Para salvar ATIVO/INATIVO no Supabase, a tabela usuarios_sigee precisa ter a coluna ativo.');
            }
        }

        async function resetarSenhaUsuarioMaster(id) {
            let u = usuariosDB.find(user => user.id == id);
            if (u) {
                const senhaAnterior = u.senha;
                u.senha = "SECBA2026";
                const ok = await salvarUsuarioIndividualSupabaseSIGEE(u, id, 'editar');
                if (!ok) { u.senha = senhaAnterior; return; }
                alert(`Senha do usuário ${u.nome} foi resetada para o padrão: SECBA2026`);
                registrarLog(`Senha resetada para padrão do operador: ${u.email}`);
                carregarListaUsuarios();
            }
        }

        function carregarLogs() {
            const corpo = document.getElementById('tabela-logs-corpo'); if(!corpo) return; corpo.innerHTML = "";
            logsDB.forEach(l => {
                corpo.innerHTML += `<tr><td class="p-4 text-xs font-semibold text-gray-500">${l.data}</td><td class="p-4 font-bold text-gray-800">${l.nome}</td><td class="p-4 text-xs font-mono">${l.email}</td><td class="p-4 font-bold text-blue-900">${l.acao}</td></tr>`;
            });
        }

        function logout() { usuarioLogado = null; document.getElementById('sistema-dashboard').classList.add('hidden'); document.getElementById('tela-login').classList.remove('hidden'); }

        // =========================================================================
        // ✅ AJUSTES V19 - NOVA SOLICITAÇÃO, DASHBOARD, PERFIS, LOGS E PERFORMANCE
        // Mantém: login rápido, Supabase em segundo plano, sem IndexedDB e sem alterar menus base.
        // =========================================================================
        let filtroDashboardNteAtualSIGEE = 'GLOBAL';
        const SIGEE_USUARIOS_ONLINE = window.SIGEE_USUARIOS_ONLINE || {};
        window.SIGEE_USUARIOS_ONLINE = SIGEE_USUARIOS_ONLINE;

        function semAcentoSIGEE(valor) {
            return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
        }

        function perfilCanonicoSIGEE(perfil) {
            const p = semAcentoSIGEE(perfil);
            if (p.includes('MASTER')) return 'Master';
            if (p.includes('ADMIN')) return 'Administrador';
            if (p.includes('CONSULT')) return 'Consulta';
            return 'Tecnico';
        }

        function isMasterSIGEE() { return usuarioLogado && perfilCanonicoSIGEE(usuarioLogado.perfil) === 'Master'; }
        function isTecnicoRestritoSIGEE() { return usuarioLogado && !isMasterSIGEE(); }

        function nteIgualSIGEE(a, b) {
            return semAcentoSIGEE(a).replace(/\s/g, '') === semAcentoSIGEE(b).replace(/\s/g, '');
        }

        function obterNumeroNteSIGEE_V19(texto) {
            const t = String(texto || '');
            const m = t.match(/NTE[-\s]*(\d{1,2})/i);
            if (m) return Number(m[1]);
            const n = Number(t);
            return Number.isFinite(n) && n > 0 ? n : 26;
        }

        function obterNomeNtePorIdSIGEE_V19(id) {
            const num = Number(id);
            const achado = LISTA_OFICIAL_27_NTES.find(n => obterNumeroNteSIGEE_V19(n) === num);
            return achado || `NTE-${String(num || 26).padStart(2, '0')}`;
        }

        function aplicarClasseStatusAcervoSIGEE() {
            const el = document.getElementById('novo-autofill-acervo');
            if (!el) return;
            const status = semAcentoSIGEE(el.value);
            el.value = String(el.value || '').toUpperCase();
            el.classList.remove('text-blue-800', 'text-red-800', 'bg-blue-50', 'bg-red-50');
            el.classList.add('font-black');
            if (status === 'RECOLHIDO') el.classList.add('text-blue-800', 'bg-blue-50');
            if (status === 'NAO ACOLHIDO' || status === 'NÃO ACOLHIDO') el.classList.add('text-red-800', 'bg-red-50');
        }

        function inicializarFiltroDashboardMasterSIGEE() {
            const box = document.getElementById('box-filtro-dashboard-master');
            const select = document.getElementById('filtro-dashboard-nte');
            if (!box || !select || !usuarioLogado) return;
            if (isMasterSIGEE()) {
                box.classList.remove('hidden');
                const valorAnterior = select.value || filtroDashboardNteAtualSIGEE || 'GLOBAL';
                select.innerHTML = '<option value="GLOBAL">GLOBAL - TODOS OS NTES</option>';
                LISTA_OFICIAL_27_NTES.forEach(nte => {
                    const opt = document.createElement('option');
                    opt.value = nte;
                    opt.textContent = nte;
                    select.appendChild(opt);
                });
                select.value = Array.from(select.options).some(o => o.value === valorAnterior) ? valorAnterior : 'GLOBAL';
                filtroDashboardNteAtualSIGEE = select.value;
            } else {
                box.classList.add('hidden');
                filtroDashboardNteAtualSIGEE = usuarioLogado.nte || 'NTE-26 Salvador';
            }
        }

        function filtrarPorAbrangenciaSIGEE(lista, campo = 'nte') {
            if (!usuarioLogado) return [];
            const filtro = isMasterSIGEE() ? (document.getElementById('filtro-dashboard-nte')?.value || 'GLOBAL') : usuarioLogado.nte;
            filtroDashboardNteAtualSIGEE = filtro;
            if (isMasterSIGEE() && filtro === 'GLOBAL') return lista || [];
            return (lista || []).filter(item => nteIgualSIGEE(item[campo] || item.nte || '', filtro));
        }

        function mediaPorDiaSIGEE(lista, dataCampo = 'data_etapa_atual') {
            if (!lista || !lista.length) return '0';
            const datas = lista.map(x => String(x[dataCampo] || x.created_at || '').slice(0, 10)).filter(Boolean);
            const unicas = new Set(datas);
            const dias = Math.max(1, unicas.size || 1);
            return (lista.length / dias).toFixed(1).replace('.', ',');
        }

        function atualizarDashboardTecnicoSIGEE(procVisiveis, escolasVisiveis) {
            const topBox = document.getElementById('dash-tec-top-escolas');
            if (topBox) {
                const mapa = {};
                (procVisiveis || []).forEach(p => {
                    const nome = p.escola || 'NÃO INFORMADA';
                    if (!mapa[nome]) mapa[nome] = { nome, nte: p.nte || '', qtd: 0 };
                    mapa[nome].qtd++;
                });
                const top = Object.values(mapa).sort((a,b) => b.qtd - a.qtd).slice(0, 5);
                topBox.innerHTML = top.length ? top.map((x, i) => `<div class="flex justify-between gap-2 border-b border-gray-100 pb-1"><span>${i+1}. ${x.nome}<br><small class="text-gray-400">${x.nte}</small></span><strong>${x.qtd}</strong></div>`).join('') : 'Sem dados';
            }
            const retirados = (procVisiveis || []).filter(p => semAcentoSIGEE(p.etapa) === 'RETIRADO' || semAcentoSIGEE(p.etapa) === 'DEFERIDO');
            const diasEntrega = retirados.map(p => calcularDiasApartirDeDataString(p.data_inicio || p.data_etapa_atual || obterDataAtualFormatada())).filter(n => Number.isFinite(n));
            const mediaEntrega = diasEntrega.length ? Math.round(diasEntrega.reduce((a,b)=>a+b,0) / diasEntrega.length) : 0;
            const elEntrega = document.getElementById('dash-tec-media-entrega');
            const elPedidos = document.getElementById('dash-tec-media-pedidos-dia');
            const elPastas = document.getElementById('dash-tec-media-pasta-dia');
            if (elEntrega) elEntrega.innerText = mediaEntrega + (mediaEntrega === 1 ? ' dia' : ' dias');
            if (elPedidos) elPedidos.innerText = mediaPorDiaSIGEE(procVisiveis, 'data_etapa_atual');
            const pastas = (procVisiveis || []).filter(p => semAcentoSIGEE(p.tipo_arquivo || p.tipo_arquivo_recebido || '').includes('PASTA') || semAcentoSIGEE(p.etapa).includes('ANALISE'));
            if (elPastas) elPastas.innerText = mediaPorDiaSIGEE(pastas, 'data_etapa_atual');
        }

        carregarDadosDashboardReal = function() {
            inicializarFiltroDashboardMasterSIGEE();
            let escolasVisiveis = filtrarPorAbrangenciaSIGEE(escolasDB, 'nte');
            let procVisiveis = filtrarPorAbrangenciaSIGEE(processosDB, 'nte');
            const ehRecolhido = e => semAcentoSIGEE(e.status_acervo || e.acervo) === 'RECOLHIDO';
            const ehEstadual = e => semAcentoSIGEE(e.dependencia || e.dependencia_adm).includes('ESTADUAL');
            document.getElementById('dash-escolas').innerText = escolasVisiveis.length;
            document.getElementById('dash-acervos').innerText = escolasVisiveis.filter(ehRecolhido).length;
            document.getElementById('dash-estaduais').innerText = escolasVisiveis.filter(ehEstadual).length;
            document.getElementById('dash-municipios').innerText = [...new Set(escolasVisiveis.map(e => semAcentoSIGEE(e.municipio)).filter(Boolean))].length;
            document.getElementById('dash-usuarios').innerText = usuariosDB.length;
            const cont = etapa => procVisiveis.filter(p => semAcentoSIGEE(p.etapa) === semAcentoSIGEE(etapa)).length;
            document.getElementById('dash-proc-desarquivamento').innerText = cont('Desarquivamento');
            document.getElementById('dash-proc-analise').innerText = cont('Análise');
            document.getElementById('dash-proc-pendencia').innerText = cont('Pendência');
            document.getElementById('dash-proc-digitacao').innerText = cont('Digitação');
            document.getElementById('dash-proc-conferencia').innerText = cont('Conferência');
            document.getElementById('dash-proc-assinatura').innerText = cont('Assinatura');
            document.getElementById('dash-proc-aguardando').innerText = cont('Aguardando Retirada');
            document.getElementById('dash-proc-retirado').innerText = cont('Retirado');
            atualizarDashboardTecnicoSIGEE(procVisiveis, escolasVisiveis);
        };

        const registrarLogOriginalSIGEE = registrarLog;
        registrarLog = function(acao) {
            if (!usuarioLogado) return;
            const agora = new Date();
            logsDB.unshift({
                data: agora.toLocaleDateString('pt-BR'),
                hora: agora.toLocaleTimeString('pt-BR'),
                dataHora: agora.toLocaleString('pt-BR'),
                nome: usuarioLogado.nome,
                nte: usuarioLogado.nte,
                email: usuarioLogado.email,
                perfil: usuarioLogado.perfil,
                acao: acao
            });
            SIGEE_USUARIOS_ONLINE[usuarioLogado.email] = { nome: usuarioLogado.nome, nte: usuarioLogado.nte, perfil: usuarioLogado.perfil, ultimo: agora.toLocaleString('pt-BR') };
            try { localStorage.setItem('SIGEE_USUARIOS_ONLINE', JSON.stringify(SIGEE_USUARIOS_ONLINE)); } catch(e) {}
        };

        function atualizarDashboardUsuariosConectadosSIGEE() {
            let online = Object.values(SIGEE_USUARIOS_ONLINE || {});
            try { online = Object.values(JSON.parse(localStorage.getItem('SIGEE_USUARIOS_ONLINE') || '{}')); } catch(e) {}
            const master = online.filter(u => perfilCanonicoSIGEE(u.perfil) === 'Master').length;
            const operacao = online.filter(u => ['Administrador','Tecnico'].includes(perfilCanonicoSIGEE(u.perfil))).length;
            const ultimo = online.length ? online[online.length - 1].ultimo : '-';
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
            set('log-usuarios-conectados', online.length);
            set('log-conectados-master', master);
            set('log-conectados-operacao', operacao);
            set('log-ultimo-acesso', ultimo);
        }

        carregarLogs = function() {
            atualizarDashboardUsuariosConectadosSIGEE();
            const corpo = document.getElementById('tabela-logs-corpo'); if(!corpo) return; corpo.innerHTML = "";
            logsDB.forEach(l => {
                const dataHora = l.dataHora || l.data || '';
                corpo.innerHTML += `<tr><td class="p-4 text-xs font-semibold text-gray-500">${dataHora}${l.hora && !String(dataHora).includes(l.hora) ? ' ' + l.hora : ''}</td><td class="p-4 font-bold text-gray-800">${l.nome || ''}</td><td class="p-4 text-xs font-bold text-gray-600">${l.nte || ''}</td><td class="p-4 text-xs font-mono">${l.email || ''}</td><td class="p-4 font-bold text-blue-900">${l.acao || ''}</td></tr>`;
            });
        };

        usuarioDoSupabaseParaLocalSIGEE = function(u, indice) {
            const emailNormalizado = normalizarTextoSIGEE(u.email).toLowerCase();
            const perfilOrigem = perfilCanonicoSIGEE(u.perfil || u.tipo || u.role || 'Tecnico');
            let perfilFinal = perfilOrigem;
            if (emailNormalizado === 'elmo.lobao@enova.educacao.ba.gov.br') perfilFinal = 'Master';
            return {
                id: Number(u.id) || (indice + 1),
                nome: normalizarMaiusculoSIGEE(u.nome || u.name || 'OPERADOR SIGEE'),
                email: emailNormalizado,
                senha: normalizarTextoSIGEE(u.senha || u.password || '123'),
                perfil: perfilFinal,
                nte: normalizarTextoSIGEE(u.nte || u.nte_vinculado || obterNomeNtePorIdSIGEE_V19(u.nte_id) || 'NTE-26 Salvador'),
                ativo: (u.ativo === undefined || u.ativo === null) ? true : !!u.ativo
            };
        };

        escolaParaSupabaseSIGEE = function(e) {
            const status = normalizarTextoSIGEE(e.status_acervo || e.acervo || 'Recolhido');
            const nteId = Number(e.nte_id) || obterNumeroNteSIGEE_V19(e.nte || e.nte_nome || e.nte_vinculado || 'NTE-26 Salvador') || 26;
            return {
                cod_mec: normalizarTextoSIGEE(e.cod_mec),
                nome_escola: normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao),
                municipio: normalizarMaiusculoSIGEE(e.municipio),
                nte_id: nteId,
                dependencia_adm: normalizarTextoSIGEE(e.dependencia_adm || e.dependencia || 'Estadual'),
                situacao_funcional: normalizarTextoSIGEE(e.situacao_funcional || e.situacao || 'Extinta'),
                acervo: normalizarTextoSIGEE(e.acervo || status || 'Recolhido'),
                status_acervo: status,
                local_acervo: normalizarTextoSIGEE(e.local_acervo || e.local_do_acervo || e.local || 'Acervo do NTE')
            };
        };

        escolaDoSupabaseParaLocalSIGEE = function(e, indice) {
            return {
                id: Number(e.id) || (indice + 1),
                cod_mec: normalizarTextoSIGEE(e.cod_mec || e.codigo_mec || e.mec),
                nome: normalizarMaiusculoSIGEE(e.nome_escola || e.nome || e.instituicao),
                municipio: normalizarMaiusculoSIGEE(e.municipio || e.cidade),
                nte_id: Number(e.nte_id) || obterNumeroNteSIGEE_V19(e.nte),
                nte: normalizarTextoSIGEE(e.nte || obterNomeNtePorIdSIGEE_V19(e.nte_id) || 'NTE-26 Salvador'),
                dependencia: normalizarTextoSIGEE(e.dependencia_adm || e.dependencia || 'Estadual'),
                situacao: normalizarTextoSIGEE(e.situacao_funcional || e.situacao || 'Extinta'),
                acervo: normalizarTextoSIGEE(e.status_acervo || e.acervo || 'Recolhido'),
                status_acervo: normalizarTextoSIGEE(e.status_acervo || e.acervo || 'Recolhido'),
                local_acervo: normalizarTextoSIGEE(e.local_acervo || e.local_do_acervo || e.local || 'Acervo do NTE')
            };
        };

        solicitacaoParaSupabaseSIGEE = function(s) {
            return {
                nome_solicitante: normalizarMaiusculoSIGEE(s.aluno || s.nome_solicitante || s.aluno_nome),
                cod_mec: normalizarTextoSIGEE(s.cod_mec || s.mec || null) || null,
                documento_solicitado: normalizarDocumentoSolicitacaoSIGEE(s.documento || s.documento_solicitado || 'Histórico'),
                oferta_nivel: normalizarNivelOfertaSIGEE(s.ensino || s.oferta_nivel || 'Médio'),
                oferta_modalidade: normalizarModalidadeSIGEE(s.modalidade || s.oferta_modalidade || 'Não informado'),
                fase_atual: normalizarTextoSIGEE(s.etapa || s.fase_atual || 'Desarquivamento'),
                tecnico_responsavel: normalizarTextoSIGEE(usuarioLogado?.nome || s.tecnico_responsavel || ''),
                prioridade: normalizarTextoSIGEE(s.prioridade || null) || null
            };
        };

        async function salvarNovaSolicitacaoSupabaseSIGEE_V19(proc, solicitacao) {
            const client = obterSupabaseSIGEE();
            if (!client) return false;
            try {
                const processoPayload = processoParaSupabaseSIGEE(proc);
                delete processoPayload.id;
                await client.from(SIGEE_SUPABASE_TABELAS.processos).insert([processoPayload]);
            } catch (e) { console.warn('Processo ainda não confirmado no Supabase:', e); }
            try {
                const solPayload = solicitacaoParaSupabaseSIGEE(solicitacao || proc);
                await client.from(SIGEE_SUPABASE_TABELAS.solicitacoes).insert([solPayload]);
            } catch (e) { console.warn('Solicitação ainda não confirmada no Supabase:', e); }
            return true;
        }

        abrirFormularioNovaSolicitacao = function() {
            const modal = document.getElementById('modal-nova-solicitacao');
            const selectEscola = document.getElementById('novo-proc-escola');
            if(!modal || !selectEscola) return;
            document.getElementById('novo-proc-aluno').value = "";
            ['novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            document.getElementById('f01-chk-acolhido').checked = false;
            document.getElementById('btn-submeter-nova-solicitacao').disabled = true;
            modal.classList.remove('hidden');
            selectEscola.innerHTML = '<option value="">CARREGANDO ESCOLAS...</option>';
            setTimeout(() => {
                let filtradas = isMasterSIGEE() ? escolasDB : escolasDB.filter(e => nteIgualSIGEE(e.nte, usuarioLogado.nte));
                filtradas = filtradas.slice().sort((a,b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
                selectEscola.innerHTML = '<option value="" selected disabled>SELECIONE A INSTITUIÇÃO</option>';
                const frag = document.createDocumentFragment();
                filtradas.forEach(e => {
                    const opt = document.createElement('option');
                    const nomeEscola = normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao);
                    opt.value = nomeEscola;
                    opt.textContent = `${nomeEscola} - ${e.municipio || ''}`;
                    opt.style.backgroundColor = '#ffffff';
                    opt.style.color = '#111827';
                    frag.appendChild(opt);
                });
                selectEscola.appendChild(frag);
                if(!filtradas.length) {
                    selectEscola.innerHTML = '<option value="">NENHUMA ESCOLA DISPONÍVEL PARA ESTE PERFIL</option>';
                }
                ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                aplicarClasseStatusAcervoSIGEE();
            }, 10);
        };

        handleSelecaoInstituicaoFluxoAutomatico = function() {
            const seletor = document.getElementById('novo-proc-escola');
            const instNome = normalizarMaiusculoSIGEE(seletor.value);
            const esc = escolasDB.find(e => normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao) === instNome || String(e.cod_mec || '') === String(instNome || ''));
            if(esc) {
                document.getElementById('novo-autofill-mec').value = esc.cod_mec || "";
                document.getElementById('novo-autofill-nte').value = esc.nte || "";
                document.getElementById('novo-autofill-municipio').value = esc.municipio || "";
                document.getElementById('novo-autofill-dep').value = esc.dependencia || "";
                document.getElementById('novo-autofill-situacao').value = esc.situacao || "";
                document.getElementById('novo-autofill-acervo').value = (esc.status_acervo || esc.acervo || "").toUpperCase();
                document.getElementById('novo-autofill-local-acervo').value = esc.local_acervo || "";
                aplicarClasseStatusAcervoSIGEE();
            }
        };

        salvarNovaSolicitacao = function(event) {
            event.preventDefault();
            const botao = document.getElementById('btn-submeter-nova-solicitacao');
            const textoOriginal = botao ? botao.innerText : 'Enviar para Desarquivamento';
            if (botao) { botao.disabled = true; botao.innerText = 'Registrando...'; }
            try {
                const nomeAluno = normalizarMaiusculoSIGEE(document.getElementById('novo-proc-aluno').value).trim();
                const escolaNome = normalizarMaiusculoSIGEE(document.getElementById('novo-proc-escola').value);
                const docTipo = document.getElementById('novo-proc-documento').value;
                const modalidade = document.getElementById('novo-proc-modalidade').value;
                const ensino = document.getElementById('novo-proc-ensino').value;
                const mec = document.getElementById('novo-autofill-mec').value;
                const mun = document.getElementById('novo-autofill-municipio').value;
                const nteVinculo = document.getElementById('novo-autofill-nte').value;
                const dataHoje = obterDataAtualFormatada();
                if (!nomeAluno || !escolaNome || !docTipo || !modalidade || !ensino) {
                    alert('Preencha todos os campos obrigatórios da nova solicitação.');
                    return;
                }
                const novoId = gerarProximoIdSIGEE(processosDB, 101);
                const novoProcesso = { id: novoId, aluno: nomeAluno, escola: escolaNome, documento: docTipo, modalidade: modalidade, ensino: ensino, etapa: "Desarquivamento", data_etapa_atual: dataHoje, nte: nteVinculo, municipio: mun, cod_mec: mec };
                processosDB.push(novoProcesso);
                solicitacoesDB.push({ ...novoProcesso, nome_solicitante: nomeAluno, documento_solicitado: docTipo, oferta_nivel: ensino, oferta_modalidade: modalidade, fase_atual: 'Desarquivamento' });
                registrarLog(`Nova solicitação cadastrada para ${nomeAluno} e enviada para Desarquivamento.`);
                fecharModalNovaSolicitacao();
                carregarEContarProcessosHorizontais();
                if (!document.getElementById('aba-painel').classList.contains('hidden')) carregarDadosDashboardReal();
                setTimeout(() => salvarNovaSolicitacaoSupabaseSIGEE_V19(novoProcesso, solicitacoesDB[0]), 20);
            } finally {
                if (botao) { botao.innerText = textoOriginal; botao.disabled = false; }
            }
        };

        const handleLoginOriginalV19SIGEE = handleLogin;
        handleLogin = function(event) {
            handleLoginOriginalV19SIGEE(event);
            if (usuarioLogado) {
                usuarioLogado.perfil = perfilCanonicoSIGEE(usuarioLogado.perfil);
                inicializarFiltroDashboardMasterSIGEE();
                registrarLog('Acesso realizado ao painel operacional.');
            }
        };

        inicializarSelectsNteEcosystem = function() {
            const selects = ['user-form-nte', 'filtro-dashboard-nte'];
            selects.forEach(id => {
                const el = document.getElementById(id);
                if(el) {
                    const atual = el.value;
                    el.innerHTML = id === 'filtro-dashboard-nte' ? '<option value="GLOBAL">GLOBAL - TODOS OS NTES</option>' : '';
                    LISTA_OFICIAL_27_NTES.forEach(nte => {
                        const opt = document.createElement('option');
                        opt.value = nte;
                        opt.textContent = nte;
                        el.appendChild(opt);
                    });
                    if (atual && Array.from(el.options).some(o => o.value === atual)) el.value = atual;
                }
            });
        };

        carregarListaUsuarios = function() {
            const corpo = document.getElementById('tabela-usuarios-corpo'); if(!corpo) return; corpo.innerHTML = "";
            usuariosDB.forEach(u => {
                u.perfil = perfilCanonicoSIGEE(u.perfil);
                let botoesMaster = `<span class="text-xs text-gray-400 italic">Sem permissão</span>`;
                if (usuarioLogado && isMasterSIGEE()) {
                    botoesMaster = `<div class="flex items-center justify-center gap-1.5"><button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button><button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo ? 'bg-red-600' : 'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo ? 'Desativar' : 'Ativar'}</button><button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button></div>`;
                }
                corpo.innerHTML += `<tr class="text-xs"><td class="p-3 font-bold">${u.nome}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td><td class="p-3 font-medium">${u.perfil}</td><td class="p-3 font-semibold text-gray-600">${u.nte}</td><td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${u.ativo ? 'ATIVO' : 'INATIVO'}</span></td><td class="p-3 text-center">${botoesMaster}</td></tr>`;
            });
        };

        // Evita alertas de salvamento geral durante sincronização em segundo plano.
        salvarTodasTabelasSupabaseSIGEE = async function(estado, silencioso = true) {
            const client = obterSupabaseSIGEE();
            if (!client || sigEESincronizandoSupabase) return false;
            sigEESincronizandoSupabase = true;
            try {
                const processosPayload = (estado.processos || []).map(processoParaSupabaseSIGEE).filter(p => p.aluno_nome).map(p => { const x = {...p}; if (!x.id) delete x.id; return x; });
                const solicitacoesPayload = (estado.solicitacoes || []).map(solicitacaoParaSupabaseSIGEE).filter(s => s.nome_solicitante);
                if (processosPayload.length) await upsertTabelaSupabaseSIGEE(SIGEE_SUPABASE_TABELAS.processos, processosPayload, SIGEE_SUPABASE_CONFLITOS.processos);
                if (solicitacoesPayload.length) await upsertTabelaSupabaseSIGEE(SIGEE_SUPABASE_TABELAS.solicitacoes, solicitacoesPayload, SIGEE_SUPABASE_CONFLITOS.solicitacoes);
                sigEESupabaseOnline = true;
                return true;
            } catch (erro) {
                sigEESupabaseOnline = false;
                console.warn('Sincronização geral em segundo plano não confirmada:', erro);
                return false;
            } finally {
                sigEESincronizandoSupabase = false;
            }
        };

    

        /* =============================================================
           V23 - Otimização do carregamento e seleção de instituição
           Mantém todas as otimizações anteriores: login rápido, Supabase
           em segundo plano, sem IndexedDB e sem bloquear a interface.
        ============================================================= */
        function mostrarCarregamentoSIGEE_V23(mensagem) {
            let box = document.getElementById('sigee-loading-v23');
            if (!box) {
                box = document.createElement('div');
                box.id = 'sigee-loading-v23';
                box.className = 'fixed inset-0 bg-blue-950/40 backdrop-blur-xs z-[9999] hidden items-center justify-center p-4';
                box.innerHTML = `<div class="bg-white rounded-xl shadow-2xl border border-blue-100 px-6 py-5 max-w-sm w-full text-center">
                    <div class="text-blue-900 font-black text-lg mb-2">SIGEE</div>
                    <div id="sigee-loading-v23-msg" class="text-sm font-bold text-gray-700">Carregando as informações, aguarde!</div>
                    <div class="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden"><div class="h-2 bg-amber-500 rounded-full animate-pulse" style="width:70%"></div></div>
                </div>`;
                document.body.appendChild(box);
            }
            const msg = document.getElementById('sigee-loading-v23-msg');
            if (msg) msg.textContent = mensagem || 'Carregando as informações, aguarde!';
            box.classList.remove('hidden');
            box.classList.add('flex');
        }

        function ocultarCarregamentoSIGEE_V23() {
            const box = document.getElementById('sigee-loading-v23');
            if (box) { box.classList.add('hidden'); box.classList.remove('flex'); }
        }

        function garantirCampoBuscaInstituicaoSIGEE_V23() {
            const select = document.getElementById('novo-proc-escola');
            if (!select) return null;
            let input = document.getElementById('novo-proc-escola-busca-v23');
            if (!input) {
                input = document.createElement('input');
                input.type = 'text';
                input.id = 'novo-proc-escola-busca-v23';
                input.placeholder = 'DIGITE PARA PESQUISAR A INSTITUIÇÃO...';
                input.autocomplete = 'off';
                input.className = 'w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold mb-1';

                const lista = document.createElement('div');
                lista.id = 'novo-proc-escola-lista-v23';
                lista.className = 'hidden max-h-52 overflow-y-auto border rounded-lg bg-white shadow-lg text-xs z-[10000]';

                select.parentNode.insertBefore(input, select);
                select.parentNode.insertBefore(lista, select.nextSibling);
                select.classList.add('hidden');
                select.required = false;

                input.addEventListener('input', () => renderizarSugestoesEscolaSIGEE_V23(input.value));
                input.addEventListener('focus', () => renderizarSugestoesEscolaSIGEE_V23(input.value));
                document.addEventListener('click', (ev) => {
                    if (!lista.contains(ev.target) && ev.target !== input) lista.classList.add('hidden');
                });
            }
            return input;
        }

        let cacheEscolasModalSIGEE_V23 = [];
        function prepararCacheEscolasModalSIGEE_V23() {
            const visiveis = isMasterSIGEE() ? escolasDB : escolasDB.filter(e => nteIgualSIGEE(e.nte, usuarioLogado?.nte));
            cacheEscolasModalSIGEE_V23 = visiveis.map(e => ({
                escola: e,
                nome: normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao || ''),
                municipio: normalizarMaiusculoSIGEE(e.municipio || ''),
                mec: String(e.cod_mec || '')
            })).filter(x => x.nome || x.mec);
        }

        function renderizarSugestoesEscolaSIGEE_V23(termo) {
            const lista = document.getElementById('novo-proc-escola-lista-v23');
            if (!lista) return;
            const q = normalizarMaiusculoSIGEE(termo || '');
            let resultados = cacheEscolasModalSIGEE_V23;
            if (q) resultados = resultados.filter(x => x.nome.includes(q) || x.municipio.includes(q) || x.mec.includes(q));
            resultados = resultados.slice(0, 40);
            lista.innerHTML = '';
            if (!resultados.length) {
                lista.innerHTML = '<div class="p-2 text-gray-500 font-semibold">Nenhuma instituição localizada.</div>';
                lista.classList.remove('hidden');
                return;
            }
            const frag = document.createDocumentFragment();
            resultados.forEach(item => {
                const div = document.createElement('button');
                div.type = 'button';
                div.className = 'block w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 text-gray-800';
                div.innerHTML = `<span class="font-bold">${item.nome}</span><br><span class="text-[10px] text-gray-500">MEC: ${item.mec || '-'} | ${item.municipio || '-'}</span>`;
                div.onclick = () => selecionarInstituicaoSIGEE_V23(item);
                frag.appendChild(div);
            });
            lista.appendChild(frag);
            lista.classList.remove('hidden');
        }

        function selecionarInstituicaoSIGEE_V23(item) {
            const input = document.getElementById('novo-proc-escola-busca-v23');
            const select = document.getElementById('novo-proc-escola');
            const lista = document.getElementById('novo-proc-escola-lista-v23');
            if (input) input.value = item.nome;
            if (select) {
                select.innerHTML = '';
                const opt = document.createElement('option');
                opt.value = item.nome;
                opt.textContent = item.nome;
                opt.selected = true;
                select.appendChild(opt);
            }
            if (lista) lista.classList.add('hidden');
            handleSelecaoInstituicaoFluxoAutomatico();
        }

        const abrirFormularioNovaSolicitacaoAnteriorSIGEE_V23 = abrirFormularioNovaSolicitacao;
        abrirFormularioNovaSolicitacao = function() {
            const modal = document.getElementById('modal-nova-solicitacao');
            const selectEscola = document.getElementById('novo-proc-escola');
            if(!modal || !selectEscola) return;

            modal.classList.remove('hidden');
            mostrarCarregamentoSIGEE_V23('Carregando as informações, aguarde!');

            setTimeout(() => {
                try {
                    garantirCampoBuscaInstituicaoSIGEE_V23();
                    prepararCacheEscolasModalSIGEE_V23();

                    const input = document.getElementById('novo-proc-escola-busca-v23');
                    if (input) input.value = '';
                    selectEscola.innerHTML = '<option value="" selected>SELECIONE A INSTITUIÇÃO</option>';

                    const aluno = document.getElementById('novo-proc-aluno'); if (aluno) aluno.value = '';
                    ['novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                    const chk = document.getElementById('f01-chk-acolhido'); if (chk) chk.checked = false;
                    const btn = document.getElementById('btn-submeter-nova-solicitacao'); if (btn) btn.disabled = true;
                    ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                    aplicarClasseStatusAcervoSIGEE && aplicarClasseStatusAcervoSIGEE();
                    renderizarSugestoesEscolaSIGEE_V23('');
                } catch (e) {
                    console.error('Erro ao abrir nova solicitação:', e);
                    alert('Não foi possível carregar a janela de nova solicitação. Atualize a página e tente novamente.');
                } finally {
                    ocultarCarregamentoSIGEE_V23();
                }
            }, 30);
        };

        handleSelecaoInstituicaoFluxoAutomatico = function() {
            const seletor = document.getElementById('novo-proc-escola');
            const input = document.getElementById('novo-proc-escola-busca-v23');
            const instNome = normalizarMaiusculoSIGEE((seletor && seletor.value) || (input && input.value) || '');
            const esc = escolasDB.find(e =>
                normalizarMaiusculoSIGEE(e.nome || e.nome_escola || e.instituicao) === instNome ||
                String(e.cod_mec || '') === String(instNome || '')
            );
            if(esc) {
                document.getElementById('novo-autofill-mec').value = esc.cod_mec || "";
                document.getElementById('novo-autofill-nte').value = esc.nte || obterNomeNtePorIdSIGEE_V19?.(esc.nte_id) || "";
                document.getElementById('novo-autofill-municipio').value = esc.municipio || "";
                document.getElementById('novo-autofill-dep').value = esc.dependencia || esc.dependencia_adm || "";
                document.getElementById('novo-autofill-situacao').value = esc.situacao || esc.situacao_funcional || "";
                document.getElementById('novo-autofill-acervo').value = (esc.status_acervo || esc.acervo || "").toUpperCase();
                document.getElementById('novo-autofill-local-acervo').value = esc.local_acervo || "";
                aplicarClasseStatusAcervoSIGEE && aplicarClasseStatusAcervoSIGEE();
            }
        };

        salvarNovaSolicitacao = function(event) {
            event.preventDefault();
            const botao = document.getElementById('btn-submeter-nova-solicitacao');
            const textoOriginal = botao ? botao.innerText : 'Enviar para Desarquivamento';
            if (botao) { botao.disabled = true; botao.innerText = 'Registrando...'; }
            mostrarCarregamentoSIGEE_V23('Registrando solicitação, aguarde!');
            try {
                const nomeAluno = normalizarMaiusculoSIGEE(document.getElementById('novo-proc-aluno').value).trim();
                const escolaNome = normalizarMaiusculoSIGEE(document.getElementById('novo-proc-escola').value || document.getElementById('novo-proc-escola-busca-v23')?.value);
                const docTipo = document.getElementById('novo-proc-documento').value;
                const modalidade = document.getElementById('novo-proc-modalidade').value;
                const ensino = document.getElementById('novo-proc-ensino').value;
                const mec = document.getElementById('novo-autofill-mec').value;
                const mun = document.getElementById('novo-autofill-municipio').value;
                const nteVinculo = document.getElementById('novo-autofill-nte').value;
                if (!nomeAluno || !escolaNome || !mec || !docTipo || !modalidade || !ensino) {
                    alert('Preencha todos os campos obrigatórios e selecione uma instituição válida.');
                    return;
                }
                const dataHoje = obterDataAtualFormatada();
                const novoId = gerarProximoIdSIGEE(processosDB, 101);
                const novoProcesso = { id: novoId, aluno: nomeAluno, escola: escolaNome, documento: docTipo, modalidade: modalidade, ensino: ensino, etapa: "Desarquivamento", data_etapa_atual: dataHoje, nte: nteVinculo, municipio: mun, cod_mec: mec };
                processosDB.push(novoProcesso);
                const novaSol = { ...novoProcesso, nome_solicitante: nomeAluno, documento_solicitado: docTipo, oferta_nivel: ensino, oferta_modalidade: modalidade, fase_atual: 'Desarquivamento' };
                solicitacoesDB.push(novaSol);
                registrarLog(`Nova solicitação cadastrada para ${nomeAluno} e enviada para Desarquivamento.`);
                fecharModalNovaSolicitacao();
                carregarEContarProcessosHorizontais();
                if (!document.getElementById('aba-painel').classList.contains('hidden')) carregarDadosDashboardReal();
                setTimeout(() => salvarNovaSolicitacaoSupabaseSIGEE_V19(novoProcesso, novaSol), 20);
            } finally {
                ocultarCarregamentoSIGEE_V23();
                if (botao) { botao.innerText = textoOriginal; botao.disabled = false; }
            }
        };

        const sincronizarSupabaseRapidoOriginalSIGEE_V23 = window.sincronizarSupabaseRapidoSIGEE || null;
        if (sincronizarSupabaseRapidoOriginalSIGEE_V23) {
            window.sincronizarSupabaseRapidoSIGEE = async function() {
                mostrarCarregamentoSIGEE_V23('Carregando as informações, aguarde!');
                try { return await sincronizarSupabaseRapidoOriginalSIGEE_V23.apply(this, arguments); }
                finally { ocultarCarregamentoSIGEE_V23(); }
            };
        }


        // =========================================================================
        // ✅ V25 - Correção definitiva do botão "Enviar para Desarquivamento"
        // Mantém: login rápido, Supabase em segundo plano, sem IndexedDB, layout original.
        // =========================================================================
        (function(){
            let escolaSelecionadaSIGEE_V25 = null;

            function obterTextoV25(id){
                const el = document.getElementById(id);
                return el ? String(el.value || '').trim() : '';
            }
            function upperV25(v){
                return String(v || '').trim().toUpperCase();
            }
            function aplicarStatusBotaoNovaSolicitacaoV25(){
                const btn = document.getElementById('btn-submeter-nova-solicitacao');
                if(!btn) return;
                const aluno = obterTextoV25('novo-proc-aluno');
                const mec = obterTextoV25('novo-autofill-mec');
                const doc = obterTextoV25('novo-proc-documento');
                const mod = obterTextoV25('novo-proc-modalidade');
                const ens = obterTextoV25('novo-proc-ensino');
                const chk = document.getElementById('f01-chk-acolhido');
                btn.disabled = !(aluno && mec && doc && mod && ens && (!chk || chk.checked));
            }
            window.aplicarStatusBotaoNovaSolicitacaoV25 = aplicarStatusBotaoNovaSolicitacaoV25;

            const antigoToggleV25 = window.toggleBotaoHabilitar;
            window.toggleBotaoHabilitar = function(chkId, btnId){
                if(btnId === 'btn-submeter-nova-solicitacao') {
                    aplicarStatusBotaoNovaSolicitacaoV25();
                    return;
                }
                if(typeof antigoToggleV25 === 'function') return antigoToggleV25(chkId, btnId);
            };

            const antigoSelecionarV25 = window.selecionarInstituicaoSIGEE_V23;
            window.selecionarInstituicaoSIGEE_V23 = function(item){
                escolaSelecionadaSIGEE_V25 = item && item.escola ? item.escola : null;
                if(typeof antigoSelecionarV25 === 'function') antigoSelecionarV25(item);
                // Garante que o select técnico tenha value válido, mesmo usando busca rápida.
                const select = document.getElementById('novo-proc-escola');
                const nome = item?.nome || item?.escola?.nome || item?.escola?.nome_escola || '';
                if(select && nome){
                    select.innerHTML = '';
                    const opt = document.createElement('option');
                    opt.value = nome;
                    opt.textContent = nome;
                    opt.selected = true;
                    select.appendChild(opt);
                    select.value = nome;
                }
                setTimeout(aplicarStatusBotaoNovaSolicitacaoV25, 0);
            };

            const antigoHandleV25 = window.handleSelecaoInstituicaoFluxoAutomatico;
            window.handleSelecaoInstituicaoFluxoAutomatico = function(){
                if(typeof antigoHandleV25 === 'function') antigoHandleV25();
                const mec = obterTextoV25('novo-autofill-mec');
                if(mec){
                    escolaSelecionadaSIGEE_V25 = escolasDB.find(e => String(e.cod_mec || '') === String(mec)) || escolaSelecionadaSIGEE_V25;
                }
                aplicarStatusBotaoNovaSolicitacaoV25();
            };

            const antigoAbrirV25 = window.abrirFormularioNovaSolicitacao;
            window.abrirFormularioNovaSolicitacao = function(){
                escolaSelecionadaSIGEE_V25 = null;
                if(typeof antigoAbrirV25 === 'function') antigoAbrirV25();
                setTimeout(() => {
                    const form = document.querySelector('#modal-nova-solicitacao form');
                    if(form) form.setAttribute('novalidate','novalidate');
                    ['novo-proc-aluno','novo-proc-documento','novo-proc-modalidade','novo-proc-ensino','novo-proc-escola-busca-v23'].forEach(id => {
                        const el = document.getElementById(id);
                        if(el && !el.dataset.sigeeV25Bind){
                            el.dataset.sigeeV25Bind = '1';
                            el.addEventListener('input', aplicarStatusBotaoNovaSolicitacaoV25);
                            el.addEventListener('change', aplicarStatusBotaoNovaSolicitacaoV25);
                        }
                    });
                    const btn = document.getElementById('btn-submeter-nova-solicitacao');
                    if(btn){
                        btn.type = 'button';
                        btn.onclick = function(ev){ window.salvarNovaSolicitacao(ev); };
                    }
                    aplicarStatusBotaoNovaSolicitacaoV25();
                }, 80);
            };

            window.salvarNovaSolicitacao = function(event){
                if(event && event.preventDefault) event.preventDefault();
                if(event && event.stopPropagation) event.stopPropagation();

                const botao = document.getElementById('btn-submeter-nova-solicitacao');
                const textoOriginal = botao ? botao.innerText : 'Enviar para Desarquivamento';
                if(botao){ botao.disabled = true; botao.innerText = 'Registrando...'; }

                try {
                    const aluno = upperV25(obterTextoV25('novo-proc-aluno'));
                    const docTipo = obterTextoV25('novo-proc-documento');
                    const modalidade = obterTextoV25('novo-proc-modalidade');
                    const ensino = obterTextoV25('novo-proc-ensino');
                    const mecCampo = obterTextoV25('novo-autofill-mec');
                    const buscaNome = upperV25(obterTextoV25('novo-proc-escola') || obterTextoV25('novo-proc-escola-busca-v23'));
                    const escola = escolaSelecionadaSIGEE_V25 || escolasDB.find(e =>
                        String(e.cod_mec || '') === String(mecCampo || '') ||
                        upperV25(e.nome || e.nome_escola || e.instituicao || '') === buscaNome
                    );
                    const chk = document.getElementById('f01-chk-acolhido');

                    if(!aluno){ alert('Informe o nome completo do aluno.'); return; }
                    if(!escola){ alert('Selecione uma instituição válida na lista.'); return; }
                    if(!docTipo || !modalidade || !ensino){ alert('Selecione tipo de documento, modalidade e ensino.'); return; }
                    if(chk && !chk.checked){ alert('Confirme o envio do e-mail 01 - Aluno acolhido.'); return; }

                    const nomeEscola = upperV25(escola.nome || escola.nome_escola || escola.instituicao || buscaNome);
                    const mec = String(escola.cod_mec || mecCampo || '').trim();
                    const municipio = upperV25(escola.municipio || obterTextoV25('novo-autofill-municipio'));
                    const nteVinculo = escola.nte || (typeof obterNomeNtePorIdSIGEE_V19 === 'function' ? obterNomeNtePorIdSIGEE_V19(escola.nte_id) : '') || obterTextoV25('novo-autofill-nte') || usuarioLogado?.nte || '';
                    const dataHoje = obterDataAtualFormatada();
                    const novoId = typeof gerarProximoIdSIGEE === 'function' ? gerarProximoIdSIGEE(processosDB, 101) : ((processosDB.length ? Math.max(...processosDB.map(p => Number(p.id)||0)) : 100) + 1);

                    const novoProcesso = {
                        id: novoId,
                        aluno: aluno,
                        escola: nomeEscola,
                        documento: docTipo,
                        modalidade: modalidade,
                        ensino: ensino,
                        etapa: 'Desarquivamento',
                        data_etapa_atual: dataHoje,
                        nte: nteVinculo,
                        municipio: municipio,
                        cod_mec: mec
                    };
                    processosDB.unshift(novoProcesso);

                    const novaSol = {
                        id: novoId,
                        ...novoProcesso,
                        nome_solicitante: aluno,
                        documento_solicitado: docTipo,
                        oferta_nivel: ensino,
                        oferta_modalidade: modalidade,
                        fase_atual: 'Desarquivamento',
                        cod_mec: mec,
                        tecnico_responsavel: usuarioLogado?.nome || '',
                        prioridade: 'Normal'
                    };
                    if(typeof solicitacoesDB !== 'undefined') solicitacoesDB.unshift(novaSol);

                    registrarLog(`Nova solicitação cadastrada para ${aluno} e enviada para Desarquivamento.`);
                    fecharModalNovaSolicitacao();
                    if(typeof carregarEContarProcessosHorizontais === 'function') carregarEContarProcessosHorizontais();
                    if(typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal();

                    // Salva no Supabase em segundo plano para não travar a tela.
                    setTimeout(async () => {
                        try {
                            if(typeof salvarNovaSolicitacaoSupabaseSIGEE_V19 === 'function') {
                                await salvarNovaSolicitacaoSupabaseSIGEE_V19(novoProcesso, novaSol);
                            }
                        } catch(e) {
                            console.warn('Solicitação salva localmente; falha ao confirmar no Supabase:', e);
                            try { localStorage.setItem('SIGEE_ULTIMO_ERRO_SOLICITACAO', String(e?.message || e)); } catch(_) {}
                        }
                    }, 10);
                } catch(e) {
                    console.error('Erro ao enviar para Desarquivamento:', e);
                    alert('Não foi possível enviar para Desarquivamento. Detalhe: ' + (e?.message || e));
                } finally {
                    if(botao){ botao.innerText = textoOriginal; }
                    setTimeout(aplicarStatusBotaoNovaSolicitacaoV25, 50);
                    if(typeof ocultarCarregamentoSIGEE_V23 === 'function') ocultarCarregamentoSIGEE_V23();
                }
                return false;
            };
        })();


// ===== SIGEE Enterprise 1.0 - módulo legado preservado 2 =====
/* ============================================================
   V27 - Adequação do fluxo operacional sem alterar estrutura-base
   Mantém otimizações anteriores: login rápido, Supabase em segundo plano,
   sem IndexedDB obrigatório e sem travar telas.
============================================================ */
(function(){
    const PRAZOS_SIGEE = { 'Análise': 7, 'Digitação': 15, 'Conferência': 10, 'Assinatura': 7 };

    function obterProcessoSIGEE(id){ return processosDB.find(proc => String(proc.id) === String(id)); }
    function valor(id){ const el=document.getElementById(id); return el ? String(el.value||'').trim() : ''; }
    function chk(id){ const el=document.getElementById(id); return !!(el && el.checked); }
    function setDisabled(id, disabled){ const el=document.getElementById(id); if(el) el.disabled = disabled; }
    function setTexto(id, texto){ const el=document.getElementById(id); if(el) el.innerText = texto; }
    function show(id, mostrar){ const el=document.getElementById(id); if(el) el.classList.toggle('hidden', !mostrar); }

    window.prazoEtapaSIGEE = function(etapa){ return PRAZOS_SIGEE[etapa] || null; };
    window.badgeVencidoEtapaSIGEE = function(proc){
        if(!proc) return '';
        if(proc.etapa === 'Desarquivamento') return '';
        const prazo = window.prazoEtapaSIGEE(proc.etapa);
        if(!prazo) return '';
        const dias = calcularDiasApartirDeDataString(proc.data_etapa_atual);
        return dias > prazo ? `<span class="block bg-red-600 text-white text-[8px] font-extrabold px-1 py-0.5 rounded uppercase mt-0.5 animate-pulse">⚠️ VENCIDO</span>` : '';
    };

    // Troca segura dos rótulos dos botões após renderização, sem reescrever a tabela inteira.
    const renderBase = window.renderizarProcessosFlutuantes;
    if(typeof renderBase === 'function'){
        window.renderizarProcessosFlutuantes = function(){
            renderBase.apply(this, arguments);
            try{
                document.querySelectorAll('button').forEach(btn=>{
                    const t=(btn.innerText||'').trim();
                    if(t.includes('Avançar Etapa')) btn.innerText='📥 Documento Recebido';
                    if(t.includes('Mudar Etapa') && btn.getAttribute('onclick')?.includes('abrirModalFluxoAnalise')) btn.innerText='✅ ANÁLISE REALIZADA';
                    if(t.includes('Tratar Pend')) btn.innerText='⚠️ Tratar Pendência';
                    if(t.includes('Mudar Etapa') && btn.getAttribute('onclick')?.includes('abrirModalFluxoDigitacao')) btn.innerText='⌨️ DOCUMENTO DIGITADO';
                    if(t.includes('Mudar Etapa') && btn.getAttribute('onclick')?.includes('abrirModalFluxoConferencia')) btn.innerText='🧐 DOCUMENTO CONFERIDO';
                    if(t.includes('Entregue')) btn.innerText='🎁 RETIRADO';
                });
                // adiciona VENCIDO visual nos cartões sem quebrar a estrutura
                document.querySelectorAll('#tabela-processos-corpo tr').forEach(tr=>{
                    const aluno = tr.querySelector('td:first-child span')?.innerText;
                    const etapa = tr.querySelector('td:nth-child(3) span')?.innerText;
                    const p = processosDB.find(x => String(x.aluno||'').toUpperCase() === String(aluno||'').toUpperCase() && String(x.etapa||'').toUpperCase() === String(etapa||'').toUpperCase());
                    if(p && window.badgeVencidoEtapaSIGEE(p) && !tr.innerHTML.includes('⚠️ VENCIDO')){
                        const tdEtapa=tr.querySelector('td:nth-child(3)');
                        if(tdEtapa) tdEtapa.insertAdjacentHTML('beforeend', window.badgeVencidoEtapaSIGEE(p));
                    }
                });
            }catch(e){ console.warn('V27 pós-render:', e); }
        };
    }

    // 00 - Desarquivamento: Documento Recebido -> Análise
    window.abrirModalFluxoDesarquivamento = function(id){
        const p = obterProcessoSIGEE(id); if(!p) return;
        document.getElementById('f00-id').value = p.id;
        ['f00-tipo','f00-local','f00-prioridade'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
        const chkEmail=document.getElementById('f00-chk-email'); if(chkEmail) chkEmail.checked=false;
        preencherSelectTecnicosPorNte('f00-analista', p.nte || usuarioLogado?.nte || '');
        setDisabled('f00-submit', true); setTexto('f00-submit','Enviar para Análise');
        const alerta = (typeof obterAlertaDesarquivamentoSIGEE === 'function') ? obterAlertaDesarquivamentoSIGEE(p) : null;
        if(typeof aplicarEstadoCamposDesarquivamentoSIGEE === 'function') aplicarEstadoCamposDesarquivamentoSIGEE(false);
        const cont=document.getElementById('f00-container-alertas'); if(cont) cont.innerHTML='';
        if(alerta && cont){
            if(typeof aplicarEstadoCamposDesarquivamentoSIGEE === 'function') aplicarEstadoCamposDesarquivamentoSIGEE(true);
            cont.className='space-y-2 bg-amber-50 border border-amber-200 rounded-lg p-3';
            cont.innerHTML = `<div class="text-xs font-black uppercase ${alerta.classe} px-2 py-1 rounded">⚠️ ${alerta.titulo}</div>
                <label class="flex items-start gap-2 cursor-pointer text-xs font-bold text-blue-950"><input type="checkbox" id="f00-chk-alerta-email" required class="mt-0.5"><span>${alerta.email}</span></label>
                <label class="flex items-start gap-2 cursor-pointer text-xs font-semibold text-gray-700"><input type="checkbox" id="f00-retificar-dados" class="mt-0.5" onchange="alternarRetificacaoDesarquivamentoSIGEE && alternarRetificacaoDesarquivamentoSIGEE()"><span>RETIFICAR DADOS</span></label>
                <textarea id="f00-detalhe-retificacao" class="hidden w-full p-2 border rounded text-xs focus:outline-none" placeholder="Informe o que foi alterado/retificado nos dados da busca..."></textarea>`;
        } else if(cont){ cont.classList.add('hidden'); }
        document.getElementById('modal-fluxo-desarquivamento').classList.remove('hidden');
    };
    window.validarDesarquivamentoV27 = function(){
        const ok = valor('f00-tipo') && valor('f00-local') && valor('f00-prioridade') && valor('f00-analista') && chk('f00-chk-email');
        setDisabled('f00-submit', !ok);
    };
    ['f00-tipo','f00-local','f00-prioridade','f00-analista'].forEach(id=>setTimeout(()=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', window.validarDesarquivamentoV27); },0));
    setTimeout(()=>{ const el=document.getElementById('f00-chk-email'); if(el) el.addEventListener('change', window.validarDesarquivamentoV27); },0);
    window.executarTransicaoDesarquivamento = function(event){
        event.preventDefault();
        const p = obterProcessoSIGEE(valor('f00-id')); if(!p) return;
        if(!valor('f00-tipo') || !valor('f00-local') || !valor('f00-prioridade') || !valor('f00-analista') || !chk('f00-chk-email')){ alert('Preencha todos os campos obrigatórios e confirme o envio do e-mail.'); return; }
        const alerta = (typeof obterAlertaDesarquivamentoSIGEE === 'function') ? obterAlertaDesarquivamentoSIGEE(p) : null;
        if(alerta && chk('f00-retificar-dados')){
            const detalhe = valor('f00-detalhe-retificacao');
            if(!detalhe){ alert('Informe o que foi alterado para reiniciar o ciclo de 30 dias.'); return; }
            p.data_etapa_atual = obterDataAtualFormatada(); p.alerta_desarq_nivel=0; p.data_alerta_desarq=null;
            registrarLog(`Processo [${p.aluno}]: ${alerta.titulo} com retificação. Ciclo de Desarquivamento reiniciado.`);
            salvarBancoLocalSIGEE(); fecharModalFluxo('desarquivamento'); carregarEContarProcessosHorizontais(); return;
        }
        p.tipo_arquivo = valor('f00-tipo'); p.local_arquivo = valor('f00-local'); p.prioridade = valor('f00-prioridade'); p.analista = valor('f00-analista');
        p.etapa='Análise'; p.data_etapa_atual=obterDataAtualFormatada(); p.prazo_etapa=7;
        registrarLog(`Processo [${p.aluno}]: Documento recebido e enviado para Análise. Analista: ${p.analista}.`);
        salvarBancoLocalSIGEE(); fecharModalFluxo('desarquivamento'); carregarEContarProcessosHorizontais();
    };

    // 01 - Análise
    window.abrirModalFluxoAnalise = function(id){
        const p = obterProcessoSIGEE(id); if(!p) return;
        document.getElementById('f01-id').value = p.id;
        document.getElementById('f01-pendencia').value = 'não';
        ['f01-p-aluno','f01-p-inst','f01-chk-email'].forEach(i=>{ const el=document.getElementById(i); if(el) el.checked=false; });
        const txt=document.getElementById('f01-txt-detalhe'); if(txt){ txt.value=''; txt.required=false; }
        preencherSelectTecnicosPorNte('f01-digitador', p.nte || usuarioLogado?.nte || '');
        window.onChangePendenciaAnalise();
        document.getElementById('modal-fluxo-analise').classList.remove('hidden');
    };
    window.onChangePendenciaAnalise = function(){
        const eh = valor('f01-pendencia') === 'sim';
        show('box-pendencia-analise', eh); show('box-fluxo-normal-analise', !eh);
        const txt=document.getElementById('f01-txt-detalhe'); if(txt) txt.required=eh;
        const btn=document.getElementById('f01-submit'); if(btn){ btn.innerText = eh ? 'Enviar para Pendência' : 'Enviar para Digitação'; btn.disabled=true; }
        if(eh) window.onChangeTipoPendenciaAnalise(); else window.atualizarBotaoSubmissaoAnalise();
    };
    window.onChangeTipoPendenciaAnalise = function(){
        const pAluno=chk('f01-p-aluno'), pInst=chk('f01-p-inst');
        const msg=document.getElementById('msg-email-pendencia'); const btn=document.getElementById('f01-submit');
        if(pAluno && pInst) msg.innerHTML='<label class="flex items-start gap-2"><input type="checkbox" id="f01-chk-pend-email" required class="mt-0.5" onchange="onChangeTipoPendenciaAnalise()"><span>ENVIAR E-MAIL 09 - Aluno Pendência (INSTITUIÇÃO e REQUERENTE)</span></label>';
        else if(pInst) msg.innerHTML='<label class="flex items-start gap-2"><input type="checkbox" id="f01-chk-pend-email" required class="mt-0.5" onchange="onChangeTipoPendenciaAnalise()"><span>ENVIAR E-MAIL: 08 - Aluno Pendência (INSTITUIÇÃO)</span></label>';
        else if(pAluno) msg.innerHTML='<label class="flex items-start gap-2"><input type="checkbox" id="f01-chk-pend-email" required class="mt-0.5" onchange="onChangeTipoPendenciaAnalise()"><span>ENVIAR E-MAIL: 07-Aluno Pendência (Aluno)</span></label>';
        else msg.innerText='⚠️ Selecione Pendência Aluno e/ou Pendência Instituição.';
        if(btn) btn.disabled = !(pAluno || pInst) || !valor('f01-txt-detalhe') || !chk('f01-chk-pend-email');
    };
    setTimeout(()=>{ const txt=document.getElementById('f01-txt-detalhe'); if(txt) txt.addEventListener('input', window.onChangeTipoPendenciaAnalise); const dig=document.getElementById('f01-digitador'); if(dig) dig.addEventListener('change', window.atualizarBotaoSubmissaoAnalise); },0);
    window.atualizarBotaoSubmissaoAnalise = function(){ setDisabled('f01-submit', !(valor('f01-digitador') && chk('f01-chk-email'))); };
    window.executarTransicaoAnalise = function(event){
        event.preventDefault(); const p=obterProcessoSIGEE(valor('f01-id')); if(!p) return;
        if(valor('f01-pendencia')==='sim'){
            if(!(chk('f01-p-aluno')||chk('f01-p-inst')) || !valor('f01-txt-detalhe') || !chk('f01-chk-pend-email')){ alert('Informe a pendência, o detalhe e confirme o envio do e-mail.'); return; }
            p.etapa='Pendência'; p.data_etapa_atual=obterDataAtualFormatada(); p.pendencia_detalhe=valor('f01-txt-detalhe'); p.pendencia_aluno=chk('f01-p-aluno'); p.pendencia_instituicao=chk('f01-p-inst');
            registrarLog(`Processo [${p.aluno}]: Análise realizada com pendência.`);
        } else {
            if(!valor('f01-digitador') || !chk('f01-chk-email')){ alert('Selecione o digitador e confirme o envio do e-mail.'); return; }
            p.etapa='Digitação'; p.data_etapa_atual=obterDataAtualFormatada(); p.digitador=valor('f01-digitador'); p.prazo_etapa=15;
            registrarLog(`Processo [${p.aluno}]: Análise realizada e enviado para Digitação. Digitador: ${p.digitador}.`);
        }
        salvarBancoLocalSIGEE(); fecharModalFluxo('analise'); carregarEContarProcessosHorizontais();
    };

    // 02 - Pendência
    window.abrirModalFluxoPendencia = function(id){
        const p=obterProcessoSIGEE(id); if(!p) return;
        document.getElementById('f02-id').value=p.id;
        const rec=document.getElementById('f02-recebimento'); if(rec){ rec.innerHTML='<option value="">-- Selecione --</option><option value="total">Documento Recebido Total</option><option value="parcial">Documento Recebido Parcial</option>'; rec.value=''; }
        const txt=document.getElementById('f02-txt-pendente'); if(txt) txt.value='';
        const chkE=document.getElementById('f02-chk-email'); if(chkE) chkE.checked=false;
        preencherSelectTecnicosPorNte('f02-digitador', p.nte || usuarioLogado?.nte || '');
        setDisabled('f02-submit', true); setTexto('f02-submit','Enviar para Digitação');
        window.onChangeRecebimentoPendencia(); document.getElementById('modal-fluxo-pendencia').classList.remove('hidden');
    };
    window.onChangeRecebimentoPendencia = function(){
        const tipo=valor('f02-recebimento'); show('box-parcial-pendencia', tipo==='parcial'); show('box-total-pendencia', tipo==='total'||tipo==='parcial');
        const txt=document.getElementById('f02-txt-pendente'); if(txt) txt.required=(tipo==='parcial');
        const chkE=document.getElementById('f02-chk-email'); if(chkE) chkE.checked=false; setDisabled('f02-submit', true);
    };
    window.validarPendenciaV27 = function(){
        const tipo=valor('f02-recebimento'); const ok = tipo && valor('f02-digitador') && chk('f02-chk-email') && (tipo!=='parcial' || valor('f02-txt-pendente'));
        setDisabled('f02-submit', !ok);
    };
    setTimeout(()=>['f02-recebimento','f02-digitador','f02-txt-pendente'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.addEventListener('change', window.validarPendenciaV27); el.addEventListener('input', window.validarPendenciaV27); } }),0);
    setTimeout(()=>{ const el=document.getElementById('f02-chk-email'); if(el) el.addEventListener('change', window.validarPendenciaV27); },0);
    window.executarTransicaoPendencia = function(event){
        event.preventDefault(); const p=obterProcessoSIGEE(valor('f02-id')); if(!p) return;
        if(!valor('f02-recebimento') || !valor('f02-digitador') || !chk('f02-chk-email') || (valor('f02-recebimento')==='parcial' && !valor('f02-txt-pendente'))){ alert('Preencha todos os campos obrigatórios.'); return; }
        p.etapa='Digitação'; p.data_etapa_atual=obterDataAtualFormatada(); p.digitador=valor('f02-digitador'); p.pendencia_restante=valor('f02-txt-pendente'); p.prazo_etapa=15;
        registrarLog(`Processo [${p.aluno}]: Pendência ${valor('f02-recebimento')} recebida e enviada para Digitação.`);
        salvarBancoLocalSIGEE(); fecharModalFluxo('pendencia'); carregarEContarProcessosHorizontais();
    };

    // 04 - Digitação
    window.abrirModalFluxoDigitacao = function(id){ const p=obterProcessoSIGEE(id); if(!p) return; document.getElementById('f05-id').value=p.id; document.getElementById('f05-chk-email').checked=false; preencherSelectTecnicosPorNte('f05-conferente', p.nte||usuarioLogado?.nte||''); setDisabled('f05-submit', true); setTexto('f05-submit','Enviar para Conferência'); document.getElementById('modal-fluxo-digitacao').classList.remove('hidden'); };
    window.executarTransicaoDigitacao = function(event){ event.preventDefault(); const p=obterProcessoSIGEE(valor('f05-id')); if(!p) return; if(!valor('f05-conferente') || !chk('f05-chk-email')){ alert('Selecione o conferente e confirme o envio do e-mail.'); return; } p.etapa='Conferência'; p.data_etapa_atual=obterDataAtualFormatada(); p.conferente=valor('f05-conferente'); p.prazo_etapa=10; registrarLog(`Processo [${p.aluno}]: Documento digitado e enviado para Conferência.`); salvarBancoLocalSIGEE(); fecharModalFluxo('digitacao'); carregarEContarProcessosHorizontais(); };

    // 06 - Conferência
    window.executarTransicaoConferencia = function(event){ event.preventDefault(); const p=obterProcessoSIGEE(valor('f06-id')); if(!p) return; if(!chk('f06-chk-email')){ alert('Confirme o envio do e-mail 05-Aluno (Assinatura).'); return; } p.etapa='Assinatura'; p.data_etapa_atual=obterDataAtualFormatada(); p.prazo_etapa=7; registrarLog(`Processo [${p.aluno}]: Documento conferido e enviado para Assinatura.`); salvarBancoLocalSIGEE(); fecharModalFluxo('conferencia'); carregarEContarProcessosHorizontais(); };

    // 07 - Assinatura
    window.executarTransicaoAssinatura = function(event){ event.preventDefault(); const p=obterProcessoSIGEE(valor('f07-id')); if(!p) return; if(!chk('f07-chk-email')){ alert('Confirme o envio do e-mail 06-Aluno (Deferido).'); return; } p.etapa='Aguardando Retirada'; p.data_etapa_atual=obterDataAtualFormatada(); registrarLog(`Processo [${p.aluno}]: Deferido e aguardando retirada.`); salvarBancoLocalSIGEE(); fecharModalFluxo('assinatura'); carregarEContarProcessosHorizontais(); };

    // 08 - Retirada
    window.abrirModalFluxoAguardando = function(id){ const p=obterProcessoSIGEE(id); if(!p) return; document.getElementById('f08-id').value=p.id; document.getElementById('f08-retirada').value='solicitante'; const n=document.getElementById('f08-nome-terceiro'); if(n) n.value=''; const rg=document.getElementById('f08-rg-terceiro'); if(rg) rg.value=''; window.onChangeFormaRetirada(); document.getElementById('modal-fluxo-aguardando').classList.remove('hidden'); };
    window.onChangeFormaRetirada = function(){ const forma=valor('f08-retirada'); show('box-terceiros-retirada', forma==='terceiros'); const n=document.getElementById('f08-nome-terceiro'); if(n) n.required=(forma==='terceiros'); const rg=document.getElementById('f08-rg-terceiro'); if(rg) rg.required=(forma==='terceiros'); };
    window.executarTransicaoAguardando = function(event){ event.preventDefault(); const p=obterProcessoSIGEE(valor('f08-id')); if(!p) return; const forma=valor('f08-retirada'); if(forma==='terceiros' && (!valor('f08-nome-terceiro') || !valor('f08-rg-terceiro'))){ alert('Informe o nome completo e o RG do terceiro.'); return; } p.etapa='Retirado'; p.data_etapa_atual=obterDataAtualFormatada(); p.retirada_forma=forma; p.retirada_nome_terceiro=valor('f08-nome-terceiro'); p.retirada_rg_terceiro=valor('f08-rg-terceiro'); registrarLog(`Processo [${p.aluno}]: Retirado por ${forma==='terceiros'?'terceiros':'solicitante'}.`); salvarBancoLocalSIGEE(); fecharModalFluxo('aguardando'); carregarEContarProcessosHorizontais(); };

    // Ajustes iniciais dos campos obrigatórios/labels no DOM
    window.addEventListener('load', function(){
        try{
            const pend=document.getElementById('f01-pendencia'); if(pend && !pend.querySelector('option[value=""]')) pend.insertAdjacentHTML('afterbegin','<option value="">-- Selecione --</option>');
            const f00=document.getElementById('f00-submit'); if(f00) f00.innerText='Enviar para Análise';
            const f01=document.getElementById('f01-submit'); if(f01) f01.innerText='Enviar para Digitação';
            const f02=document.getElementById('f02-submit'); if(f02) f02.innerText='Enviar para Digitação';
            const f05=document.getElementById('f05-submit'); if(f05) f05.innerText='Enviar para Conferência';
            const f06=document.getElementById('f06-submit'); if(f06) f06.innerText='Enviar para Assinatura';
            const f07=document.getElementById('f07-submit'); if(f07) f07.innerText='Aguardando Retirada';
        }catch(e){ console.warn('V27 load:', e); }
    });

// =========================================================================
// ✅ V29 - EXPORTAÇÃO DE DADOS (MASTER / ADMINISTRADOR)
// Exporta Catálogo de Escolas, Processos, Logs e Relatório Geral do Dashboard.
// Mantém as otimizações anteriores: Supabase direto, login rápido e sincronização em segundo plano.
// =========================================================================
(function(){
    function perfilExportadorSIGEE(){
        try {
            const p = (typeof perfilCanonicoSIGEE === 'function') ? perfilCanonicoSIGEE(usuarioLogado?.perfil) : String(usuarioLogado?.perfil || '');
            return p === 'Master' || p === 'Administrador';
        } catch(e){ return false; }
    }

    window.aplicarVisibilidadeExportacaoSIGEE = function(){
        const pode = perfilExportadorSIGEE();
        document.querySelectorAll('.export-only').forEach(el => el.classList.toggle('hidden', !pode));
        // Administrador também pode consultar/exportar Logs, mas Usuários continua restrito ao Master.
        const menuLogs = document.getElementById('menu-logs');
        if (menuLogs) menuLogs.classList.toggle('hidden', !pode);
    };

    function valorTextoSIGEE(v){ return (v === null || v === undefined) ? '' : String(v); }
    function nomeArquivoSIGEE(prefixo, ext){
        const agora = new Date();
        const stamp = agora.toISOString().slice(0,19).replace(/[-:T]/g,'');
        return `${prefixo}_${stamp}.${ext}`;
    }
    function baixarBlobSIGEE(conteudo, nome, tipo){
        const blob = new Blob([conteudo], { type: tipo });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = nome; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    function obterNteAbrangenciaExportacaoSIGEE(){
        try {
            if (typeof isMasterSIGEE === 'function' && isMasterSIGEE()) return document.getElementById('filtro-dashboard-nte')?.value || 'GLOBAL';
        } catch(e){}
        return usuarioLogado?.nte || 'GLOBAL';
    }
    function filtrarNteExportacaoSIGEE(lista, campo='nte'){
        const filtro = obterNteAbrangenciaExportacaoSIGEE();
        if (!filtro || filtro === 'GLOBAL') return lista || [];
        const igual = (typeof nteIgualSIGEE === 'function') ? nteIgualSIGEE : ((a,b)=>String(a||'')===String(b||''));
        return (lista || []).filter(item => igual(item?.[campo] || item?.nte || '', filtro));
    }
    function aplicarFiltroBuscaEscolasSIGEE(lista){
        const busca = (document.getElementById('busca-escola')?.value || '').toLowerCase().trim();
        if (!busca) return lista;
        return lista.filter(e => [e.cod_mec, e.nome, e.nome_escola, e.municipio, e.nte].some(v => valorTextoSIGEE(v).toLowerCase().includes(busca)));
    }
    function processosVisiveisExportacaoSIGEE(){
        let lista = filtrarNteExportacaoSIGEE(processosDB || [], 'nte');
        if (typeof etapaFiltroAtual !== 'undefined' && etapaFiltroAtual && etapaFiltroAtual !== 'TODOS') lista = lista.filter(p => p.etapa === etapaFiltroAtual || p.etapa_atual === etapaFiltroAtual);
        const busca = (document.getElementById('busca-proc-nome')?.value || '').toLowerCase().trim();
        if (busca) lista = lista.filter(p => valorTextoSIGEE(p.aluno || p.aluno_nome).toLowerCase().includes(busca));
        return lista;
    }
    function escolasVisiveisExportacaoSIGEE(){ return aplicarFiltroBuscaEscolasSIGEE(filtrarNteExportacaoSIGEE(escolasDB || [], 'nte')); }
    function logsVisiveisExportacaoSIGEE(){ return filtrarNteExportacaoSIGEE(logsDB || [], 'nte'); }

    function exportarXLSXSIGEE(nomeBase, abas){
        if (typeof XLSX === 'undefined') { alert('Biblioteca XLSX não carregada. Verifique a internet e tente novamente.'); return; }
        const wb = XLSX.utils.book_new();
        abas.forEach(aba => {
            const ws = XLSX.utils.json_to_sheet(aba.dados || []);
            XLSX.utils.book_append_sheet(wb, ws, (aba.nome || 'Dados').slice(0,31));
        });
        XLSX.writeFile(wb, nomeArquivoSIGEE(nomeBase, 'xlsx'));
    }
    function exportarPDFSIGEE(titulo, colunas, linhas, nomeBase){
        const jsPDF = window.jspdf?.jsPDF;
        if (!jsPDF || typeof window.jspdf === 'undefined') { alert('Biblioteca PDF não carregada. Use a exportação Excel ou verifique a conexão.'); return; }
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        doc.setFontSize(12); doc.text('SECRETARIA DA EDUCAÇÃO - SIGEE', 40, 30);
        doc.setFontSize(10); doc.text(titulo, 40, 48);
        doc.setFontSize(8); doc.text(`Emitido por: ${usuarioLogado?.nome || ''} | ${usuarioLogado?.nte || ''} | ${new Date().toLocaleString('pt-BR')}`, 40, 64);
        doc.autoTable({ head: [colunas], body: linhas, startY: 82, styles: { fontSize: 7, cellPadding: 3 }, headStyles: { fillColor: [30, 64, 175] } });
        doc.save(nomeArquivoSIGEE(nomeBase, 'pdf'));
    }
    function exigirPerfilExportadorSIGEE(){
        if (!perfilExportadorSIGEE()) { alert('Exportação permitida apenas para os perfis Master e Administrador.'); return false; }
        return true;
    }

    window.exportarEscolasSIGEE = function(formato='xlsx'){
        if (!exigirPerfilExportadorSIGEE()) return;
        const dados = escolasVisiveisExportacaoSIGEE().map(e => ({
            'Código MEC': e.cod_mec || '', 'Escola': e.nome || e.nome_escola || '', 'Município': e.municipio || '',
            'NTE': e.nte || '', 'Dependência': e.dependencia || e.dependencia_adm || '', 'Situação': e.situacao || e.situacao_funcional || '',
            'Acervo': e.status_acervo || e.acervo || '', 'Local do Acervo': e.local_acervo || ''
        }));
        registrarLog(`Exportou Catálogo de Escolas (${formato.toUpperCase()}) - ${dados.length} registros.`);
        if (formato === 'pdf') return exportarPDFSIGEE('Catálogo de Escolas', Object.keys(dados[0] || {'Sem dados':''}), dados.map(Object.values), 'SIGEE_Catalogo_Escolas');
        exportarXLSXSIGEE('SIGEE_Catalogo_Escolas', [{ nome:'Escolas', dados }]);
    };

    window.exportarProcessosSIGEE = function(formato='xlsx'){
        if (!exigirPerfilExportadorSIGEE()) return;
        const dados = processosVisiveisExportacaoSIGEE().map(p => ({
            'Aluno': p.aluno || p.aluno_nome || '', 'Escola': p.escola || p.escola_nome || '', 'Documento': p.documento || p.documento_tipo || '',
            'Etapa': p.etapa || p.etapa_atual || '', 'Dias na Etapa': (typeof calcularDiasApartirDeDataString === 'function') ? calcularDiasApartirDeDataString(p.data_etapa_atual || p.created_at) : '',
            'Técnico': p.tecnico || p.analista || p.digitador || '', 'Prioridade': p.prioridade || '', 'Município': p.municipio || '',
            'NTE': p.nte || '', 'Data de Abertura': p.data_inicio || p.created_at || '', 'Última Movimentação': p.data_etapa_atual || ''
        }));
        registrarLog(`Exportou Processos (${formato.toUpperCase()}) - ${dados.length} registros.`);
        if (formato === 'pdf') return exportarPDFSIGEE('Processos / Fluxo', Object.keys(dados[0] || {'Sem dados':''}), dados.map(Object.values), 'SIGEE_Processos');
        exportarXLSXSIGEE('SIGEE_Processos', [{ nome:'Processos', dados }]);
    };

    window.exportarLogsSIGEE = function(formato='xlsx'){
        if (!exigirPerfilExportadorSIGEE()) return;
        const dados = logsVisiveisExportacaoSIGEE().map(l => ({
            'Data': l.data || l.dataHora || '', 'Hora': l.hora || '', 'Usuário': l.nome || '', 'Perfil': l.perfil || '', 'NTE': l.nte || '', 'E-mail': l.email || '', 'Ação': l.acao || ''
        }));
        registrarLog(`Exportou Logs (${formato.toUpperCase()}) - ${dados.length} registros.`);
        if (formato === 'pdf') return exportarPDFSIGEE('Histórico de Atividades / Logs', Object.keys(dados[0] || {'Sem dados':''}), dados.map(Object.values), 'SIGEE_Logs');
        exportarXLSXSIGEE('SIGEE_Logs', [{ nome:'Logs', dados }]);
    };

    function dadosDashboardExecutivoSIGEE(){
        const escolas = filtrarNteExportacaoSIGEE(escolasDB || [], 'nte');
        const proc = filtrarNteExportacaoSIGEE(processosDB || [], 'nte');
        const recolhidas = escolas.filter(e => (typeof semAcentoSIGEE === 'function' ? semAcentoSIGEE(e.status_acervo || e.acervo) : String(e.status_acervo || e.acervo || '').toUpperCase()) === 'RECOLHIDO').length;
        return [
            { Indicador:'Abrangência', Valor: obterNteAbrangenciaExportacaoSIGEE() },
            { Indicador:'Escolas Catalogadas', Valor: escolas.length },
            { Indicador:'Acervos Recolhidos', Valor: recolhidas },
            { Indicador:'Municípios', Valor: new Set(escolas.map(e => e.municipio).filter(Boolean)).size },
            { Indicador:'Usuários Cadastrados', Valor: usuariosDB.length },
            { Indicador:'Processos', Valor: proc.length }
        ];
    }
    function dadosProcessosPorEtapaSIGEE(){
        const proc = filtrarNteExportacaoSIGEE(processosDB || [], 'nte');
        return ETAPAS_FLUXO_OFICIAL.map(etapa => ({ Etapa: etapa, Quantidade: proc.filter(p => (p.etapa || p.etapa_atual) === etapa).length }));
    }
    function dadosInformacoesTecnicasSIGEE(){
        const proc = filtrarNteExportacaoSIGEE(processosDB || [], 'nte');
        const mapa = {};
        proc.forEach(p => { const k=p.escola || p.escola_nome || 'NÃO INFORMADA'; mapa[k] = mapa[k] || { Escola:k, NTE:p.nte||'', Quantidade:0 }; mapa[k].Quantidade++; });
        return Object.values(mapa).sort((a,b)=>b.Quantidade-a.Quantidade).slice(0,10);
    }
    function dadosIndicadoresNteSIGEE(){
        return LISTA_OFICIAL_27_NTES.map(nte => {
            const escolas = (escolasDB || []).filter(e => (typeof nteIgualSIGEE === 'function' ? nteIgualSIGEE(e.nte, nte) : e.nte === nte));
            const proc = (processosDB || []).filter(p => (typeof nteIgualSIGEE === 'function' ? nteIgualSIGEE(p.nte, nte) : p.nte === nte));
            const pend = proc.filter(p => (p.etapa || p.etapa_atual) === 'Pendência').length;
            const dias = proc.map(p => (typeof calcularDiasApartirDeDataString === 'function') ? calcularDiasApartirDeDataString(p.data_etapa_atual || p.created_at) : 0).filter(n => Number.isFinite(n));
            const media = dias.length ? Math.round(dias.reduce((a,b)=>a+b,0)/dias.length) : 0;
            return { NTE: nte, Escolas: escolas.length, Solicitações: proc.length, Pendências: pend, 'Tempo Médio na Etapa': media };
        });
    }

    window.exportarDashboardSIGEE = function(formato='xlsx'){
        if (!exigirPerfilExportadorSIGEE()) return;
        const executivo = dadosDashboardExecutivoSIGEE();
        const etapas = dadosProcessosPorEtapaSIGEE();
        const tecnicas = dadosInformacoesTecnicasSIGEE();
        const ntes = dadosIndicadoresNteSIGEE();
        registrarLog(`Exportou Relatório Geral do Dashboard (${formato.toUpperCase()}).`);
        if (formato === 'pdf') {
            const linhas = executivo.map(x => [x.Indicador, x.Valor]);
            return exportarPDFSIGEE('Relatório Geral do Dashboard', ['Indicador','Valor'], linhas, 'SIGEE_Dashboard_Geral');
        }
        exportarXLSXSIGEE('SIGEE_Relatorio_Geral_Dashboard', [
            { nome:'Dashboard Executivo', dados: executivo },
            { nome:'Processos por Etapa', dados: etapas },
            { nome:'Informações Técnicas', dados: tecnicas.length ? tecnicas : [{ Escola:'Sem dados', NTE:'', Quantidade:0 }] },
            { nome:'Indicadores por NTE', dados: ntes }
        ]);
    };

    const navegarAnteriorExportSIGEE = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
    if (navegarAnteriorExportSIGEE) {
        window.navegar = function(aba){ const r = navegarAnteriorExportSIGEE.apply(this, arguments); setTimeout(aplicarVisibilidadeExportacaoSIGEE, 50); return r; };
    }
    const handleLoginAnteriorExportSIGEE = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
    if (handleLoginAnteriorExportSIGEE) {
        window.handleLogin = function(event){ const r = handleLoginAnteriorExportSIGEE.apply(this, arguments); setTimeout(aplicarVisibilidadeExportacaoSIGEE, 300); return r; };
    }
    window.addEventListener('load', () => setTimeout(aplicarVisibilidadeExportacaoSIGEE, 500));
})();

})();
