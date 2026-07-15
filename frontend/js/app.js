/*
SIGEE Enterprise 2.0 - app.js
Arquivo gerado a partir do index.html estável. Nesta fase inicial, o código foi separado sem alterar regras de negócio.
*/

// ===== conteúdo inline preservado de script externo: https://unpkg.com/@tailwindcss/browser@4 =====
// =========================================================================
        // V24 - Correção definitiva da seleção de instituição
        // Mantém as otimizações: login rápido, Supabase em segundo plano e busca rápida.
        // A lista agora não abre automaticamente, não some indevidamente e reabre ao clicar/digitar.
        // =========================================================================
        function abrirListaInstituicoesSIGEE_V24() {
            const input = document.getElementById('novo-proc-escola-busca-v23');
            const lista = document.getElementById('novo-proc-escola-lista-v23');
            if (!input || !lista) return;
            renderizarSugestoesEscolaSIGEE_V24(input.value || '');
        }

        function fecharListaInstituicoesSIGEE_V24() {
            const lista = document.getElementById('novo-proc-escola-lista-v23');
            if (lista) {
                lista.classList.add('hidden');
                lista.style.display = 'none';
            }
        }

        function garantirCampoBuscaInstituicaoSIGEE_V23() {
            const select = document.getElementById('novo-proc-escola');
            if (!select) return null;

            let input = document.getElementById('novo-proc-escola-busca-v23');
            let lista = document.getElementById('novo-proc-escola-lista-v23');

            if (!input) {
                input = document.createElement('input');
                input.type = 'text';
                input.id = 'novo-proc-escola-busca-v23';
                input.placeholder = 'DIGITE PARA PESQUISAR A INSTITUIÇÃO...';
                input.autocomplete = 'off';
                input.className = 'w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold mb-1';
                select.parentNode.insertBefore(input, select);
            }

            if (!lista) {
                lista = document.createElement('div');
                lista.id = 'novo-proc-escola-lista-v23';
                lista.className = 'hidden max-h-52 overflow-y-auto border rounded-lg bg-white shadow-lg text-xs z-[10000]';
                lista.style.display = 'none';
                select.parentNode.insertBefore(lista, select.nextSibling);
            }

            select.classList.add('hidden');
            select.required = false;

            input.oninput = function() {
                this.dataset.escolaSelecionada = '';
                const selectAtual = document.getElementById('novo-proc-escola');
                if (selectAtual) selectAtual.value = '';
                renderizarSugestoesEscolaSIGEE_V24(this.value || '');
            };
            input.onfocus = function() { abrirListaInstituicoesSIGEE_V24(); };
            input.onclick = function(ev) { ev.stopPropagation(); abrirListaInstituicoesSIGEE_V24(); };
            lista.onclick = function(ev) { ev.stopPropagation(); };

            if (!window.__SIGEE_V24_CLICK_FORA_INST__) {
                window.__SIGEE_V24_CLICK_FORA_INST__ = true;
                document.addEventListener('click', function(ev) {
                    const campo = document.getElementById('novo-proc-escola-busca-v23');
                    const painel = document.getElementById('novo-proc-escola-lista-v23');
                    if (!campo || !painel) return;
                    if (ev.target !== campo && !painel.contains(ev.target)) fecharListaInstituicoesSIGEE_V24();
                });
            }
            return input;
        }

        function renderizarSugestoesEscolaSIGEE_V24(termo) {
            const lista = document.getElementById('novo-proc-escola-lista-v23');
            if (!lista) return;

            const q = normalizarMaiusculoSIGEE(termo || '');
            let resultados = cacheEscolasModalSIGEE_V23 || [];

            if (q) {
                resultados = resultados.filter(x =>
                    String(x.nome || '').includes(q) ||
                    String(x.municipio || '').includes(q) ||
                    String(x.mec || '').includes(q)
                );
            }

            resultados = resultados.slice(0, 60);
            lista.innerHTML = '';

            if (!resultados.length) {
                lista.innerHTML = '<div class="p-2 text-gray-500 font-semibold">Nenhuma instituição localizada.</div>';
                lista.classList.remove('hidden');
                lista.style.display = 'block';
                return;
            }

            const frag = document.createDocumentFragment();
            resultados.forEach(item => {
                const div = document.createElement('button');
                div.type = 'button';
                div.className = 'block w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 text-gray-800 bg-white';
                div.innerHTML = `<span class="font-bold">${item.nome}</span><br><span class="text-[10px] text-gray-500">MEC: ${item.mec || '-'} | ${item.municipio || '-'}</span>`;
                div.onmousedown = function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    selecionarInstituicaoSIGEE_V24(item);
                };
                frag.appendChild(div);
            });

            lista.appendChild(frag);
            lista.classList.remove('hidden');
            lista.style.display = 'block';
        }

        function renderizarSugestoesEscolaSIGEE_V23(termo) {
            renderizarSugestoesEscolaSIGEE_V24(termo);
        }

        function selecionarInstituicaoSIGEE_V24(item) {
            const input = document.getElementById('novo-proc-escola-busca-v23');
            const select = document.getElementById('novo-proc-escola');
            const nome = item?.nome || '';
            if (input) {
                input.value = nome;
                input.dataset.escolaSelecionada = '1';
            }
            if (select) {
                select.innerHTML = '';
                const opt = document.createElement('option');
                opt.value = nome;
                opt.textContent = nome;
                opt.selected = true;
                select.appendChild(opt);
                select.value = nome;
            }
            fecharListaInstituicoesSIGEE_V24();
            handleSelecaoInstituicaoFluxoAutomatico();
        }

        function selecionarInstituicaoSIGEE_V23(item) {
            selecionarInstituicaoSIGEE_V24(item);
        }

        const abrirFormularioNovaSolicitacaoSIGEE_V24_BASE = abrirFormularioNovaSolicitacao;
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
                    if (input) {
                        input.value = '';
                        input.dataset.escolaSelecionada = '';
                    }
                    selectEscola.innerHTML = '<option value="" selected>SELECIONE A INSTITUIÇÃO</option>';
                    fecharListaInstituicoesSIGEE_V24();

                    const aluno = document.getElementById('novo-proc-aluno'); if (aluno) aluno.value = '';
                    ['novo-proc-documento','novo-proc-modalidade','novo-proc-ensino'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                    const chk = document.getElementById('f01-chk-acolhido'); if (chk) chk.checked = false;
                    const btn = document.getElementById('btn-submeter-nova-solicitacao'); if (btn) btn.disabled = true;
                    ['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                    if (typeof aplicarClasseStatusAcervoSIGEE === 'function') aplicarClasseStatusAcervoSIGEE();
                } catch (e) {
                    console.error('Erro ao abrir nova solicitação:', e);
                    alert('Não foi possível carregar a janela de nova solicitação. Atualize a página e tente novamente.');
                } finally {
                    ocultarCarregamentoSIGEE_V23();
                }
            }, 20);
        };



        // ✅ V28 - Atualiza a contagem do tempo na etapa sem recarregar a página.
        setInterval(function(){
            try {
                const abaProc = document.getElementById('aba-processos');
                if (abaProc && !abaProc.classList.contains('hidden')) renderizarProcessosFlutuantes();
            } catch(e) {}
        }, 60000);


// ===== bloco JS extraído do index.html =====
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
            const existente = window.SIGEE_SUPABASE_CLIENT || window.sigEESupabaseClient || window.supabaseClient || window.__SIGEE_V38_CLIENT || sigEESupabaseClient;
            if (existente) {
                sigEESupabaseClient = existente;
                window.SIGEE_SUPABASE_CLIENT = existente;
                window.sigEESupabaseClient = existente;
                window.supabaseClient = existente;
                window.__SIGEE_V38_CLIENT = existente;
                return existente;
            }
            if (!window.supabase || !window.supabase.createClient) {
                console.warn('Biblioteca Supabase não carregada. Usando cache local.');
                return null;
            }
            sigEESupabaseClient = window.supabase.createClient(SIGEE_SUPABASE_URL, SIGEE_SUPABASE_ANON_KEY);
            window.SIGEE_SUPABASE_CLIENT = sigEESupabaseClient;
            window.sigEESupabaseClient = sigEESupabaseClient;
            window.supabaseClient = sigEESupabaseClient;
            window.__SIGEE_V38_CLIENT = sigEESupabaseClient;
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


        function normalizarDataSupabaseSIGEE(valor) {
            if (!valor || typeof valor !== 'string') return valor || null;
            const m = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (m) return `${m[3]}-${m[2]}-${m[1]}`;
            return valor;
        }

        function limparDatasPayloadSupabaseSIGEE(payload) {
            if (!payload || typeof payload !== 'object') return payload;
            Object.keys(payload).forEach(chave => {
                const nome = String(chave).toLowerCase();
                if (nome.includes('data') || nome.includes('prazo') || nome.includes('inicio') || nome.includes('fim') || nome.includes('created') || nome.includes('updated') || nome.includes('finalizado')) {
                    payload[chave] = normalizarDataSupabaseSIGEE(payload[chave]);
                }
            });
            return payload;
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
                nte: normalizarTextoSIGEE(p.nte || 'NTE-26 Salvador'),
                workflow_instance_id: p.workflow_instance_id || null,
                workflow_ciclo: Number(p.workflow_ciclo || p.ciclo || 1),
                ciclo: Number(p.ciclo || p.workflow_ciclo || 1),
                etapa_codigo: p.etapa_codigo || null,
                data_etapa_atual: p.data_etapa_atual || null,
                prazo_etapa: p.prazo_etapa == null ? null : Number(p.prazo_etapa),
                prazo_inicio: p.prazo_inicio || null,
                prazo_fim: p.prazo_fim || null,
                ultimo_evento_workflow: p.ultimo_evento_workflow || null,
                ultima_mensagem_workflow: p.ultima_mensagem_workflow || null,
                contexto_analise: p.contexto_analise || null,
                updated_at: p.updated_at || new Date().toISOString()
            };
        }

        // Protege a sincronização geral contra datas no formato brasileiro antes do upsert.
        const processoParaSupabaseSIGEEOriginal = processoParaSupabaseSIGEE;
        processoParaSupabaseSIGEE = function(p) {
            const payload = processoParaSupabaseSIGEEOriginal(p);
            return limparDatasPayloadSupabaseSIGEE(payload);
        };

        function processoDoSupabaseParaLocalSIGEE(p, indice) {
            return {
                id: Number(p.id) || (101 + indice),
                aluno: normalizarMaiusculoSIGEE(p.aluno_nome || p.aluno || p.nome_aluno || p.requerente),
                escola: normalizarMaiusculoSIGEE(p.escola_nome || p.escola || p.instituicao || p.nome_escola),
                documento: normalizarTextoSIGEE(p.documento_tipo || p.documento || p.tipo_documento || 'HISTÓRICO'),
                etapa: normalizarTextoSIGEE(p.etapa_atual || p.etapa || p.status || 'Desarquivamento'),
                data_etapa_atual: normalizarTextoSIGEE(p.data_etapa_atual || p.created_at || obterDataAtualFormatada()),
                nte: normalizarTextoSIGEE(p.nte || p.nte_vinculado || 'NTE-26 Salvador'),
                municipio: normalizarMaiusculoSIGEE(p.municipio || p.cidade || ''),
                workflow_instance_id: p.workflow_instance_id || null,
                workflow_ciclo: Number(p.workflow_ciclo || p.ciclo || 1),
                ciclo: Number(p.ciclo || p.workflow_ciclo || 1),
                etapa_codigo: p.etapa_codigo || null,
                prazo_etapa: p.prazo_etapa == null ? null : Number(p.prazo_etapa),
                prazo_inicio: p.prazo_inicio || null,
                prazo_fim: p.prazo_fim || null,
                ultimo_evento_workflow: p.ultimo_evento_workflow || null,
                ultima_mensagem_workflow: p.ultima_mensagem_workflow || null,
                contexto_analise: p.contexto_analise || null
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
                await salvarSeguro(SIGEE_SUPABASE_TABELAS.processos, (estado.processos || []).map(processoParaSupabaseSIGEE).map(limparDatasPayloadSupabaseSIGEE).filter(p => p.id && p.aluno_nome), SIGEE_SUPABASE_CONFLITOS.processos);
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
                
                registrarLog("Acesso realizado à Central de Processos.");
                navegar('processos');
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

        function obterAgoraWorkflowSIGEE() {
            const clock = window.SIGEE_WORKFLOW_CLOCK;
            return clock && typeof clock.now === 'function' ? clock.now() : new Date();
        }

        function obterDataAtualFormatada() {
            const hoje = obterAgoraWorkflowSIGEE();
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

                const dataHoje = obterAgoraWorkflowSIGEE();
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

        function gerarCodigoSIGEEAposIdV1002006(proc, idGerado) {
            const documento = normalizarTextoSIGEE(
                proc.documento || proc.documento_tipo || proc.documento_solicitado || 'Histórico'
            ).toUpperCase();

            let sigla = 'HIST';
            if (documento.includes('DECLAR')) sigla = 'DECL';
            else if (documento.includes('VERAC')) sigla = 'VERA';
            else if (documento.includes('ATEST')) sigla = 'ATES';
            else if (documento.includes('CERT')) sigla = 'CERT';

            const agora = new Date();
            const ano = String(agora.getFullYear()).slice(-2);
            const nteTexto = normalizarTextoSIGEE(proc.nte || '');
            const matchNte = nteTexto.match(/NTE\s*[- ]?\s*(\d{1,2})/i);
            const nte = String(matchNte ? Number(matchNte[1]) : 0).padStart(2, '0');
            const sequencial = String(Number(idGerado)).padStart(4, '0');

            return `SEEX.${sigla}.${ano}${nte}.${sequencial}`;
        }

        async function registrarLogCriacaoProcessoV1002006B(processo, aluno) {
            const client = obterSupabaseSIGEE();
            const u = window.usuarioLogado || {};
            if (!client || !processo || !processo.id) return false;

            const sessaoId =
                sessionStorage.getItem('SIGEE_SESSION_ID') ||
                ((window.crypto && typeof window.crypto.randomUUID === 'function')
                    ? window.crypto.randomUUID()
                    : `sigee-${Date.now()}-${Math.random().toString(16).slice(2)}`);

            try {
                sessionStorage.setItem('SIGEE_SESSION_ID', sessaoId);
            } catch (_) {}

            const payload = {
                usuario_id: u.id || null,
                nome: u.nome || u.name || 'Usuário',
                email: String(u.email || '').trim().toLowerCase(),
                perfil: u.perfil || null,
                nte: u.nte || u.nte_nome || u.nte_vinculado || u.grupo || processo.nte || null,
                acao: `Nova solicitação cadastrada para ${aluno}.`,
                detalhes: `Processo ${processo.codigo_sigee} | ID ${processo.id}`,
                modulo: 'processos',
                processo_id: processo.id,
                codigo_sigee: processo.codigo_sigee,
                etapa: processo.etapa_atual || processo.etapa || 'Desarquivamento',
                sessao_id: sessaoId,
                created_at: new Date().toISOString()
            };

            const resposta = await client
                .from((window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.logs) || 'logs_sigee')
                .insert([payload]);

            if (resposta.error) {
                console.warn(
                    '[SIGEE 1.0.2.006B] Processo criado, mas o log contextual não foi confirmado:',
                    resposta.error
                );

                /*
                 * Fallback para tabelas antigas: mantém os dados críticos
                 * também no texto, mesmo sem colunas adicionais.
                 */
                const basico = {
                    nome: payload.nome,
                    email: payload.email,
                    perfil: payload.perfil,
                    nte: payload.nte,
                    acao: payload.acao,
                    detalhes: payload.detalhes
                };
                const fallback = await client.from('logs_sigee').insert([basico]);
                if (fallback.error) {
                    console.error(
                        '[SIGEE 1.0.2.006B] Falha também no log básico:',
                        fallback.error
                    );
                    return false;
                }
            }

            /*
             * Atualiza a cópia local do painel sem duplicar no Supabase.
             */
            try {
                const registroLocal = {
                    data: new Date().toLocaleString('pt-BR'),
                    ...payload
                };
                const locais = JSON.parse(localStorage.getItem('SIGEE_LOGS_DB') || '[]');
                locais.unshift(registroLocal);
                if (locais.length > 2000) locais.length = 2000;
                localStorage.setItem('SIGEE_LOGS_DB', JSON.stringify(locais));
                window.logsDB = locais;
            } catch (_) {}

            return true;
        }

        async function salvarNovaSolicitacaoSupabaseSIGEE_V19(proc, solicitacao) {
            const client = obterSupabaseSIGEE();
            if (!client) throw new Error('Cliente Supabase indisponível.');

            /*
             * REGRA DE INTEGRIDADE 1.0.2.006:
             * processos novos nunca enviam ID criado no navegador.
             * O PostgreSQL gera o ID identity e o frontend recebe o valor real.
             */
            const processoPayload = processoParaSupabaseSIGEE(proc);
            delete processoPayload.id;
            delete processoPayload.codigo_sigee;

            if (!processoPayload.workflow_instance_id) {
                processoPayload.workflow_instance_id =
                    proc.workflow_instance_id ||
                    ((window.crypto && typeof window.crypto.randomUUID === 'function')
                        ? window.crypto.randomUUID()
                        : null);
            }

            const respostaProcesso = await client
                .from(SIGEE_SUPABASE_TABELAS.processos)
                .insert([processoPayload])
                .select('id,codigo_sigee,workflow_instance_id,workflow_ciclo,ciclo')
                .single();

            if (respostaProcesso.error) throw respostaProcesso.error;
            if (!respostaProcesso.data || !respostaProcesso.data.id) {
                throw new Error('O Supabase não devolveu o ID do novo processo.');
            }

            const salvo = respostaProcesso.data;
            proc.id = Number(salvo.id);
            proc.workflow_instance_id = salvo.workflow_instance_id || processoPayload.workflow_instance_id;
            proc.workflow_ciclo = Number(salvo.workflow_ciclo || proc.workflow_ciclo || 1);
            proc.ciclo = Number(salvo.ciclo || proc.ciclo || proc.workflow_ciclo || 1);
            proc.codigo_sigee =
                salvo.codigo_sigee ||
                gerarCodigoSIGEEAposIdV1002006(proc, proc.id);

            /*
             * O trigger do banco deve devolver o código no próprio INSERT.
             * Este UPDATE fica apenas como contingência para ambientes em
             * que o SQL ainda não tenha sido aplicado.
             */
            if (!salvo.codigo_sigee) {
                const respostaCodigo = await client
                    .from(SIGEE_SUPABASE_TABELAS.processos)
                    .update({
                        codigo_sigee: proc.codigo_sigee,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', proc.id);

                if (respostaCodigo.error) {
                    throw new Error(
                        'Processo criado com ID ' + proc.id +
                        ', mas o código SIGEE não pôde ser gravado: ' +
                        respostaCodigo.error.message
                    );
                }
            }

            const solPayload = solicitacaoParaSupabaseSIGEE(solicitacao || proc);
            delete solPayload.id;

            const respostaSolicitacao = await client
                .from(SIGEE_SUPABASE_TABELAS.solicitacoes)
                .insert([solPayload]);

            if (respostaSolicitacao.error) {
                console.warn(
                    'Processo salvo, mas a cópia em solicitações não foi confirmada:',
                    respostaSolicitacao.error
                );
            }

            return proc;
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

        function gerarWorkflowInstanceSIGEE(){
            try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); } catch(e) {}
            return 'WF-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        }

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
                const novoProcesso = { id: novoId, aluno: nomeAluno, aluno_nome: nomeAluno, escola: escolaNome, escola_nome: escolaNome, documento: docTipo, documento_tipo: docTipo, modalidade: modalidade, ensino: ensino, nivel_oferta: ensino, etapa: "Desarquivamento", etapa_atual: "Desarquivamento", etapa_codigo: "DES", workflow_instance_id: gerarWorkflowInstanceSIGEE(), workflow_ciclo: 1, ciclo: 1, data_etapa_atual: dataHoje, created_at: new Date().toISOString(), nte: nteVinculo, municipio: mun, cod_mec: mec };
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

        function gerarWorkflowInstanceSIGEE(){
            try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); } catch(e) {}
            return 'WF-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        }

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
                const novoProcesso = { id: novoId, aluno: nomeAluno, aluno_nome: nomeAluno, escola: escolaNome, escola_nome: escolaNome, documento: docTipo, documento_tipo: docTipo, modalidade: modalidade, ensino: ensino, nivel_oferta: ensino, etapa: "Desarquivamento", etapa_atual: "Desarquivamento", etapa_codigo: "DES", workflow_instance_id: gerarWorkflowInstanceSIGEE(), workflow_ciclo: 1, ciclo: 1, data_etapa_atual: dataHoje, created_at: new Date().toISOString(), nte: nteVinculo, municipio: mun, cod_mec: mec };
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

            window.salvarNovaSolicitacao = async function(event){
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

                    /*
                     * Não cria ID local. O processo só entra nas listas após
                     * o Supabase devolver o ID identity definitivo.
                     */
                    const novoProcesso = {
                        aluno: aluno,
                        escola: nomeEscola,
                        documento: docTipo,
                        modalidade: modalidade,
                        ensino: ensino,
                        etapa: 'Desarquivamento',
                        data_etapa_atual: dataHoje,
                        nte: nteVinculo,
                        municipio: municipio,
                        cod_mec: mec,
                        workflow_instance_id: (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : null,
                        workflow_ciclo: 1,
                        ciclo: 1,
                        acoes_executadas: []
                    };

                    const novaSol = {
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

                    // A criação só é concluída depois que o Supabase devolver o ID real.
                    // Isso impede processos temporários de sumirem após fechar ou atualizar a página.
                    const processoSalvo = await salvarNovaSolicitacaoSupabaseSIGEE_V19(
                        novoProcesso,
                        novaSol
                    );

                    if (!processoSalvo || !processoSalvo.id) {
                        throw new Error('A criação não foi confirmada pelo Supabase.');
                    }

                    /*
                     * Somente agora o registro entra na memória local.
                     * Isso impede sincronização geral de enviar IDs provisórios.
                     */
                    processosDB.unshift(processoSalvo);

                    novaSol.id = processoSalvo.id;
                    novaSol.codigo_sigee = processoSalvo.codigo_sigee;
                    novaSol.workflow_instance_id = processoSalvo.workflow_instance_id;
                    novaSol.workflow_ciclo = processoSalvo.workflow_ciclo;
                    novaSol.ciclo = processoSalvo.ciclo;

                    if (typeof solicitacoesDB !== 'undefined') {
                        solicitacoesDB.unshift(novaSol);
                    }

                    try {
                        if (typeof salvarBancoLocalSIGEE === 'function') {
                            salvarBancoLocalSIGEE();
                        }
                    } catch (_) {}

                    await registrarLogCriacaoProcessoV1002006B(
                        processoSalvo,
                        aluno
                    );
                    fecharModalNovaSolicitacao();
                    if(typeof carregarEContarProcessosHorizontais === 'function') carregarEContarProcessosHorizontais();
                    if(typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal();
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


// ===== bloco JS extraído do index.html =====
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
        const recebidoEmSIGEE = new Date().toISOString();
        p.tipo_arquivo = valor('f00-tipo'); p.local_arquivo = valor('f00-local'); p.prioridade = valor('f00-prioridade'); p.analista = valor('f00-analista');
        p.data_arquivo_recebido = recebidoEmSIGEE;
        p.ultimo_evento_workflow = 'DOCUMENTO_RECEBIDO';
        p.etapa='Análise'; p.data_etapa_atual=obterDataAtualFormatada(); p.prazo_etapa=7; p.updated_at=recebidoEmSIGEE;
        registrarLog(`Processo [${p.aluno}]: Documento recebido e enviado para Análise. Analista: ${p.analista}.`);
        try {
            const clienteHistoricoSIGEE = obterSupabaseSIGEE();
            if (clienteHistoricoSIGEE) {
                clienteHistoricoSIGEE.from('historico_processos').insert({
                    processo_id: p.id,
                    nte: p.nte || usuarioLogado?.nte || null,
                    etapa: 'Análise',
                    acao: 'Documento Recebido',
                    created_at: recebidoEmSIGEE
                }).then(({ error }) => {
                    if (error) console.warn('[SIGEE] Evento Documento Recebido não gravado no histórico:', error);
                    else window.dispatchEvent(new CustomEvent('sigee:arquivo-recebido', { detail: { processoId: p.id } }));
                });
            }
        } catch (erroHistoricoSIGEE) {
            console.warn('[SIGEE] Falha ao registrar Documento Recebido para indicadores:', erroHistoricoSIGEE);
        }
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


// ===== bloco JS extraído do index.html =====
(function(){
    const SIGEE_USUARIO_SEC_PADRAO = {
        id: 900001,
        nome: 'GRUPO SEC',
        email: 'sec@enova.educacao.ba.gov.br',
        senha: '123',
        perfil: 'Administrador',
        grupo: 'SEC',
        nte: 'SEC - TODOS OS NTES',
        ativo: true
    };

    function textoV31(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
    function semAcentoV31(v){ return textoV31(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
    function normalizaEmailV31(v){ return textoV31(v).toLowerCase(); }
    function nteNormalizadoV31(v){ return semAcentoV31(v).replace(/\s+/g,''); }
    function perfilCanonicoV31(perfil){
        const p = semAcentoV31(perfil);
        if (p.includes('MASTER')) return 'Master';
        if (p.includes('ADMIN')) return 'Administrador';
        if (p.includes('CONSULT')) return 'Consulta';
        if (p.includes('SEC')) return 'SEC';
        return 'Tecnico';
    }
    function isGrupoSecV31(user){
        const u = user || window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
        if (!u) return false;
        const perfil = semAcentoV31(u.perfil);
        const grupo = semAcentoV31(u.grupo);
        const nte = semAcentoV31(u.nte);
        const email = normalizaEmailV31(u.email);
        return email === 'sec@enova.educacao.ba.gov.br' || perfil === 'SEC' || grupo === 'SEC' || nte.startsWith('SEC') || nte === 'GLOBAL';
    }
    function isAcessoGlobalV31(user){
        const u = user || window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
        if (!u) return false;
        const perfil = perfilCanonicoV31(u.perfil);
        return perfil === 'Master' || isGrupoSecV31(u);
    }
    function nteIgualV31(a,b){
        if (isGrupoSecV31({nte:a}) || isGrupoSecV31({nte:b})) return true;
        return nteNormalizadoV31(a) === nteNormalizadoV31(b);
    }
    function obterNtePadraoUsuarioV31(user){
        const u = user || {};
        if (isGrupoSecV31(u)) return 'SEC - TODOS OS NTES';
        return textoV31(u.nte || u.nte_vinculado || u.nte_nome || 'NTE-26 Salvador');
    }

    window.SIGEE_USUARIO_SEC_PADRAO = SIGEE_USUARIO_SEC_PADRAO;
    window.isGrupoSecSIGEE = isGrupoSecV31;
    window.isAcessoGlobalSIGEE = isAcessoGlobalV31;

    window.garantirUsuarioSecSIGEE = function(){
        try{
            if (typeof usuariosDB === 'undefined' || !Array.isArray(usuariosDB)) return;
            const existente = usuariosDB.find(u => normalizaEmailV31(u.email) === SIGEE_USUARIO_SEC_PADRAO.email);
            if (existente) {
                existente.nome = existente.nome || SIGEE_USUARIO_SEC_PADRAO.nome;
                existente.senha = existente.senha || SIGEE_USUARIO_SEC_PADRAO.senha;
                existente.perfil = perfilCanonicoV31(existente.perfil || 'Administrador');
                existente.grupo = 'SEC';
                existente.nte = 'SEC - TODOS OS NTES';
                existente.ativo = existente.ativo !== false;
            } else {
                usuariosDB.push({...SIGEE_USUARIO_SEC_PADRAO});
            }
        }catch(e){ console.warn('SIGEE V31 garantirUsuarioSec:', e); }
    };

    // Ajusta conversão de usuários do Supabase sem exigir colunas que a tabela não possui.
    if (typeof window.usuarioDoSupabaseParaLocalSIGEE === 'function' || typeof usuarioDoSupabaseParaLocalSIGEE === 'function') {
        const originalUsuarioMapper = window.usuarioDoSupabaseParaLocalSIGEE || usuarioDoSupabaseParaLocalSIGEE;
        window.usuarioDoSupabaseParaLocalSIGEE = function(u, indice){
            const obj = originalUsuarioMapper(u, indice);
            const email = normalizaEmailV31(obj.email || u.email);
            obj.perfil = perfilCanonicoV31(u.perfil || obj.perfil || 'Tecnico');
            obj.senha = textoV31(u.senha || u.password || obj.senha || '123');
            if (email === SIGEE_USUARIO_SEC_PADRAO.email || semAcentoV31(u.grupo) === 'SEC') {
                obj.perfil = 'Administrador';
                obj.grupo = 'SEC';
                obj.nte = 'SEC - TODOS OS NTES';
            } else {
                obj.nte = textoV31(u.nte || u.nte_vinculado || u.nte_nome || obj.nte || 'NTE-26 Salvador');
            }
            obj.ativo = obj.ativo !== false;
            return obj;
        };
        try { usuarioDoSupabaseParaLocalSIGEE = window.usuarioDoSupabaseParaLocalSIGEE; } catch(e){}
    }

    // Perfis e abrangência: Master e Grupo SEC enxergam todos os NTEs; Administrador/Técnico/Consulta ficam restritos ao NTE cadastrado.
    window.perfilCanonicoSIGEE = function(perfil){ return perfilCanonicoV31(perfil); };
    try { perfilCanonicoSIGEE = window.perfilCanonicoSIGEE; } catch(e){}
    window.isMasterSIGEE = function(){ return isAcessoGlobalV31(); };
    try { isMasterSIGEE = window.isMasterSIGEE; } catch(e){}
    window.isTecnicoRestritoSIGEE = function(){ return !isAcessoGlobalV31(); };
    try { isTecnicoRestritoSIGEE = window.isTecnicoRestritoSIGEE; } catch(e){}
    window.nteIgualSIGEE = function(a,b){ return nteIgualV31(a,b); };
    try { nteIgualSIGEE = window.nteIgualSIGEE; } catch(e){}

    // Selects: Master enxerga todos os grupos/NTEs e pode selecionar SEC; demais ficam no NTE do cadastro.
    window.inicializarSelectsNteEcosystem = function(){
        const selects = ['user-form-nte', 'filtro-dashboard-nte'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if(!el) return;
            const atual = el.value;
            el.innerHTML = '';
            if (id === 'filtro-dashboard-nte') {
                el.insertAdjacentHTML('beforeend','<option value="GLOBAL">GLOBAL - TODOS OS NTES</option>');
                el.insertAdjacentHTML('beforeend','<option value="SEC - TODOS OS NTES">SEC - TODOS OS NTES</option>');
            } else {
                el.insertAdjacentHTML('beforeend','<option value="SEC - TODOS OS NTES">SEC - TODOS OS NTES</option>');
            }
            (typeof LISTA_OFICIAL_27_NTES !== 'undefined' ? LISTA_OFICIAL_27_NTES : []).forEach(nte => {
                const opt = document.createElement('option');
                opt.value = nte;
                opt.textContent = nte;
                el.appendChild(opt);
            });
            if (atual && Array.from(el.options).some(o => o.value === atual)) el.value = atual;
        });
    };

    window.inicializarFiltroDashboardMasterSIGEE = function(){
        const box = document.getElementById('box-filtro-dashboard-master');
        const select = document.getElementById('filtro-dashboard-nte');
        if (!box || !select || typeof usuarioLogado === 'undefined' || !usuarioLogado) return;
        if (isAcessoGlobalV31(usuarioLogado)) {
            box.classList.remove('hidden');
            const anterior = select.value || 'GLOBAL';
            window.inicializarSelectsNteEcosystem();
            select.value = Array.from(select.options).some(o => o.value === anterior) ? anterior : 'GLOBAL';
            try { filtroDashboardNteAtualSIGEE = select.value; } catch(e){}
        } else {
            box.classList.add('hidden');
            try { filtroDashboardNteAtualSIGEE = obterNtePadraoUsuarioV31(usuarioLogado); } catch(e){}
        }
    };

    window.filtrarPorAbrangenciaSIGEE = function(lista, campo = 'nte'){
        if (typeof usuarioLogado === 'undefined' || !usuarioLogado) return [];
        const filtro = isAcessoGlobalV31(usuarioLogado) ? (document.getElementById('filtro-dashboard-nte')?.value || 'GLOBAL') : obterNtePadraoUsuarioV31(usuarioLogado);
        try { filtroDashboardNteAtualSIGEE = filtro; } catch(e){}
        if (isAcessoGlobalV31(usuarioLogado) && (filtro === 'GLOBAL' || isGrupoSecV31({nte:filtro}))) return lista || [];
        return (lista || []).filter(item => nteIgualV31(item?.[campo] || item?.nte || '', filtro));
    };

    // Reforça carregamento do banco para Técnico/Administrador/Consulta após login e após sincronização em segundo plano.
    async function sincronizarAposLoginV31(){
        try{
            if (typeof carregarDadosSupabaseSIGEE === 'function') {
                await carregarDadosSupabaseSIGEE({ silencioso: true, mostrarAlertas: false });
            } else if (typeof sincronizarSupabaseSegundoPlanoSIGEE === 'function') {
                await sincronizarSupabaseSegundoPlanoSIGEE();
            }
        } catch(e){ console.warn('SIGEE V31 sync pós-login:', e); }
        try { garantirUsuarioSecSIGEE(); } catch(e){}
        try { if (usuarioLogado && !isGrupoSecV31(usuarioLogado)) usuarioLogado.nte = obterNtePadraoUsuarioV31(usuarioLogado); } catch(e){}
        try { carregarDadosDashboardReal(); } catch(e){}
        try { carregarEContarProcessosHorizontais(); } catch(e){}
        try { renderizarListaEscolasBufferMemoria(); } catch(e){}
        try { carregarListaUsuarios(); } catch(e){}
        try { aplicarVisibilidadeExportacaoSIGEE(); } catch(e){}
    }

    const loginAnteriorV31 = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
    if (loginAnteriorV31) {
        window.handleLogin = function(event){
            if (event) event.preventDefault();
            garantirUsuarioSecSIGEE();
            const email = normalizaEmailV31(document.getElementById('login-email')?.value || '');
            const senha = textoV31(document.getElementById('login-senha')?.value || '');
            const u = usuariosDB.find(user => normalizaEmailV31(user.email) === email && textoV31(user.senha || '123') === senha && user.ativo !== false);
            if (u) {
                u.perfil = perfilCanonicoV31(u.perfil || 'Tecnico');
                if (isGrupoSecV31(u)) { u.grupo = 'SEC'; u.nte = 'SEC - TODOS OS NTES'; }
                else u.nte = obterNtePadraoUsuarioV31(u);
                try { usuarioLogado = u; window.usuarioLogado = u; } catch(e){}
                document.getElementById('tela-login')?.classList.add('hidden');
                document.getElementById('sistema-dashboard')?.classList.remove('hidden');
                const nomeEl = document.getElementById('user-nome'); if(nomeEl) nomeEl.innerText = u.nome;
                const perfEl = document.getElementById('user-perfil'); if(perfEl) perfEl.innerText = `${u.perfil}${u.grupo ? ' / ' + u.grupo : ''} | ${u.nte}`;
                const podeAdminSistema = isAcessoGlobalV31(u) || perfilCanonicoV31(u.perfil) === 'Administrador';
                const menuUsuarios = document.getElementById('menu-usuarios'); if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !isAcessoGlobalV31(u));
                const menuLogs = document.getElementById('menu-logs'); if(menuLogs) menuLogs.classList.toggle('hidden', !podeAdminSistema);
                const btnImportar = document.getElementById('btn-importar-dados-master'); if(btnImportar) btnImportar.classList.toggle('hidden', !isAcessoGlobalV31(u));
                try { registrarLog('Acesso realizado ao painel operacional.'); } catch(e){}
                try { inicializarFiltroDashboardMasterSIGEE(); } catch(e){}
                try { navegar('painel'); } catch(e){}
                setTimeout(sincronizarAposLoginV31, 80);
            } else {
                alert('Credenciais inválidas, ou operador desativado no escopo regional.');
            }
        };
        try { handleLogin = window.handleLogin; } catch(e){}
    }

    // Técnicos por NTE: evita select vazio e corrige o fluxo para Digitação.
    window.preencherSelectTecnicosPorNte = function(selectId, nteFiltro){
        const select = document.getElementById(selectId);
        if(!select) return;
        const atual = select.value;
        select.innerHTML = '<option value="">-- Selecione o Servidor --</option>';
        let lista = (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB)) ? usuariosDB.filter(u => u.ativo !== false) : [];
        lista = lista.filter(u => ['Master','Administrador','Tecnico','SEC'].includes(perfilCanonicoV31(u.perfil)) || isGrupoSecV31(u));
        if (!isGrupoSecV31({nte:nteFiltro}) && textoV31(nteFiltro)) {
            const filtrados = lista.filter(u => isGrupoSecV31(u) || nteIgualV31(u.nte, nteFiltro));
            if (filtrados.length) lista = filtrados;
        }
        if (!lista.length && typeof usuarioLogado !== 'undefined' && usuarioLogado) lista = [usuarioLogado];
        lista.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.nome;
            opt.textContent = `${u.nome} (${perfilCanonicoV31(u.perfil)} | ${u.nte || 'NTE'})`;
            select.appendChild(opt);
        });
        if (atual && Array.from(select.options).some(o => o.value === atual)) select.value = atual;
        select.onchange = function(){
            try { if (selectId === 'f01-digitador') atualizarBotaoSubmissaoAnalise(); } catch(e){}
            try { if (selectId === 'f02-digitador') atualizarBotaoSubmissaoPendenciaV31(); } catch(e){}
        };
    };

    function setDisabledV31(id, valor){ const el=document.getElementById(id); if(el) el.disabled=!!valor; }
    function checkedV31(id){ return !!document.getElementById(id)?.checked; }
    function valorV31(id){ return textoV31(document.getElementById(id)?.value || ''); }

    window.atualizarBotaoSubmissaoAnalise = function(){
        const pendencia = valorV31('f01-pendencia') === 'sim';
        const btn = document.getElementById('f01-submit');
        if (!btn) return;
        if (pendencia) {
            const okTipo = checkedV31('f01-p-aluno') || checkedV31('f01-p-inst');
            btn.innerText = 'Enviar para Pendência';
            btn.disabled = !okTipo;
            return;
        }
        btn.innerText = 'Enviar para Digitação';
        const temDigitador = !!valorV31('f01-digitador');
        const okEmail = checkedV31('f01-chk-email');
        btn.disabled = !(temDigitador && okEmail);
    };

    window.onChangePendenciaAnalise = function(){
        const ehPendencia = valorV31('f01-pendencia') === 'sim';
        const boxPend = document.getElementById('box-pendencia-analise');
        const boxNormal = document.getElementById('box-fluxo-normal-analise');
        if (boxPend) boxPend.classList.toggle('hidden', !ehPendencia);
        if (boxNormal) boxNormal.classList.toggle('hidden', ehPendencia);
        atualizarBotaoSubmissaoAnalise();
    };

    window.onChangeTipoPendenciaAnalise = function(){
        const pAluno = checkedV31('f01-p-aluno');
        const pInst = checkedV31('f01-p-inst');
        const msgBox = document.getElementById('msg-email-pendencia');
        if (msgBox) {
            if (pAluno && pInst) msgBox.innerText = '📧 ENVIAR E-MAIL 09 - Aluno Pendência (INSTITUIÇÃO e REQUERENTE)';
            else if (pInst) msgBox.innerText = '📧 ENVIAR E-MAIL: 08 - Aluno Pendência (INSTITUIÇÃO)';
            else if (pAluno) msgBox.innerText = '📧 ENVIAR E-MAIL: 07-Aluno Pendência (Aluno)';
            else msgBox.innerText = '⚠️ Selecione pelo menos uma variação.';
        }
        atualizarBotaoSubmissaoAnalise();
    };

    window.abrirModalFluxoAnalise = function(id){
        const p = (typeof processosDB !== 'undefined') ? processosDB.find(proc => String(proc.id) === String(id)) : null;
        if(!p) return;
        document.getElementById('f01-id').value = p.id;
        document.getElementById('f01-pendencia').value = 'não';
        document.getElementById('f01-p-aluno').checked = false;
        document.getElementById('f01-p-inst').checked = false;
        document.getElementById('f01-txt-detalhe').value = '';
        document.getElementById('f01-chk-email').checked = false;
        preencherSelectTecnicosPorNte('f01-digitador', p.nte || (typeof usuarioLogado !== 'undefined' ? usuarioLogado?.nte : ''));
        const sel = document.getElementById('f01-digitador'); if(sel) sel.onchange = atualizarBotaoSubmissaoAnalise;
        onChangePendenciaAnalise();
        setDisabledV31('f01-submit', true);
        document.getElementById('modal-fluxo-analise').classList.remove('hidden');
    };

    window.executarTransicaoAnalise = function(event){
        event.preventDefault();
        const p = processosDB.find(proc => String(proc.id) === String(valorV31('f01-id')));
        if(!p) return;
        const ehPendencia = valorV31('f01-pendencia') === 'sim';
        if (ehPendencia) {
            if (!checkedV31('f01-p-aluno') && !checkedV31('f01-p-inst')) { alert('Selecione se a pendência é do aluno e/ou da instituição.'); return; }
            p.etapa = 'Pendência';
            p.pendencia_tipo = checkedV31('f01-p-aluno') && checkedV31('f01-p-inst') ? 'Aluno e Instituição' : (checkedV31('f01-p-aluno') ? 'Aluno' : 'Instituição');
            p.pendencia_detalhe = valorV31('f01-txt-detalhe');
            p.data_etapa_atual = obterDataAtualFormatada();
            p.prazo_etapa = null;
            registrarLog(`Processo [${p.aluno}]: Análise realizada com pendência (${p.pendencia_tipo}).`);
        } else {
            if (!valorV31('f01-digitador') || !checkedV31('f01-chk-email')) { alert('Selecione o digitador e confirme o envio do e-mail 03-Aluno (Digitação).'); return; }
            p.etapa = 'Digitação';
            p.digitador = valorV31('f01-digitador');
            p.data_etapa_atual = obterDataAtualFormatada();
            p.prazo_etapa = 15;
            registrarLog(`Processo [${p.aluno}]: Análise realizada e enviada para Digitação.`);
        }
        try { salvarBancoLocalSIGEE(); } catch(e){}
        fecharModalFluxo('analise');
        carregarEContarProcessosHorizontais();
    };

    window.atualizarBotaoSubmissaoPendenciaV31 = function(){
        const btn = document.getElementById('f02-submit');
        if(!btn) return;
        btn.disabled = !(valorV31('f02-digitador') && checkedV31('f02-chk-email'));
    };
    window.onChangeRecebimentoPendencia = function(){
        const tipo = valorV31('f02-recebimento');
        const parcial = tipo === 'parcial';
        document.getElementById('box-total-pendencia')?.classList.toggle('hidden', false);
        document.getElementById('box-parcial-pendencia')?.classList.toggle('hidden', !parcial);
        document.getElementById('f02-chk-email').checked = false;
        atualizarBotaoSubmissaoPendenciaV31();
    };
    window.abrirModalFluxoPendencia = function(id){
        const p = processosDB.find(proc => String(proc.id) === String(id));
        if(!p) return;
        document.getElementById('f02-id').value = p.id;
        document.getElementById('f02-recebimento').value = 'total';
        document.getElementById('f02-txt-pendente').value = '';
        document.getElementById('f02-chk-email').checked = false;
        preencherSelectTecnicosPorNte('f02-digitador', p.nte || usuarioLogado?.nte || '');
        const sel = document.getElementById('f02-digitador'); if(sel) sel.onchange = atualizarBotaoSubmissaoPendenciaV31;
        onChangeRecebimentoPendencia();
        document.getElementById('modal-fluxo-pendencia').classList.remove('hidden');
    };
    window.executarTransicaoPendencia = function(event){
        event.preventDefault();
        const p = processosDB.find(proc => String(proc.id) === String(valorV31('f02-id')));
        if(!p) return;
        if (!valorV31('f02-digitador') || !checkedV31('f02-chk-email')) { alert('Selecione o digitador e confirme o envio do e-mail.'); return; }
        if (valorV31('f02-recebimento') === 'parcial' && !valorV31('f02-txt-pendente')) { alert('Informe qual documento ainda está pendente.'); return; }
        p.etapa = 'Digitação';
        p.digitador = valorV31('f02-digitador');
        p.pendencia_recebimento = valorV31('f02-recebimento');
        p.pendencia_restante = valorV31('f02-txt-pendente');
        p.data_etapa_atual = obterDataAtualFormatada();
        p.prazo_etapa = 15;
        registrarLog(`Processo [${p.aluno}]: Pendência tratada e enviada para Digitação.`);
        try { salvarBancoLocalSIGEE(); } catch(e){}
        fecharModalFluxo('pendencia');
        carregarEContarProcessosHorizontais();
    };

    // Salvar usuário: mantém campos locais nte/grupo/senha mesmo quando a tabela usuarios_sigee não possui essas colunas.
    window.salvarNovoUsuarioFormularioMaster = async function(event){
        event.preventDefault();
        const id = valorV31('user-form-id');
        const nome = semAcentoV31(document.getElementById('user-form-nome')?.value || '').trim();
        const email = normalizaEmailV31(document.getElementById('user-form-email')?.value || '');
        const senha = valorV31('user-form-senha') || '123';
        const nte = valorV31('user-form-nte') || 'NTE-26 Salvador';
        const perfil = perfilCanonicoV31(valorV31('user-form-perfil'));
        if (!nome || !email) { alert('Informe nome e e-mail do usuário.'); return; }
        let usuarioAtualizado;
        const modoCriar = !id;
        if (modoCriar) {
            if (usuariosDB.some(u => normalizaEmailV31(u.email) === email)) return alert('E-mail já cadastrado.');
            usuarioAtualizado = { id: null, nome, email, senha, perfil, nte, grupo: isGrupoSecV31({nte}) ? 'SEC' : '', ativo: true };
        } else {
            usuarioAtualizado = usuariosDB.find(user => String(user.id) === String(id));
            if(!usuarioAtualizado) return alert('Usuário não localizado para edição.');
            Object.assign(usuarioAtualizado, { nome, email, senha, perfil, nte, grupo: isGrupoSecV31({nte}) ? 'SEC' : (usuarioAtualizado.grupo || ''), ativo: usuarioAtualizado.ativo !== false });
        }
        let ok = true;
        try {
            if (typeof salvarUsuarioIndividualSupabaseSIGEE === 'function') {
                ok = await salvarUsuarioIndividualSupabaseSIGEE(usuarioAtualizado, id, modoCriar ? 'criar' : 'editar');
            }
        } catch(e) { ok = false; console.warn('SIGEE V31 salvar usuário Supabase:', e); }
        // Mesmo se o Supabase não possuir nte/senha/grupo, mantém a sessão local funcionando para não bloquear a administração.
        if (modoCriar && !usuariosDB.includes(usuarioAtualizado)) {
            if (!usuarioAtualizado.id) usuarioAtualizado.id = (typeof gerarProximoIdSIGEE === 'function') ? gerarProximoIdSIGEE(usuariosDB, 1) : Date.now();
            usuariosDB.push(usuarioAtualizado);
        }
        if (!ok) alert('Usuário salvo no SIGEE local. Confira a estrutura da tabela usuarios_sigee para gravar também no Supabase.');
        registrarLog(`${modoCriar ? 'Cadastrou' : 'Atualizou'} operador: ${email}`);
        fecharModalUsuario();
        carregarListaUsuarios();
    };
    try { salvarNovoUsuarioFormularioMaster = window.salvarNovoUsuarioFormularioMaster; } catch(e){}

    window.carregarListaUsuarios = function(){
        const corpo = document.getElementById('tabela-usuarios-corpo'); if(!corpo) return; corpo.innerHTML = '';
        garantirUsuarioSecSIGEE();
        usuariosDB.forEach(u => {
            u.perfil = perfilCanonicoV31(u.perfil);
            if (!u.nte) u.nte = obterNtePadraoUsuarioV31(u);
            const podeEditar = isAcessoGlobalV31(usuarioLogado);
            const botoes = podeEditar
                ? `<div class="flex items-center justify-center gap-1.5"><button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button><button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo ? 'bg-red-600' : 'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo ? 'Desativar' : 'Ativar'}</button><button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button></div>`
                : '<span class="text-xs text-gray-400 italic">Sem permissão</span>';
            const grupo = isGrupoSecV31(u) ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px]">SEC</span>' : '';
            corpo.innerHTML += `<tr class="text-xs"><td class="p-3 font-bold">${u.nome}${grupo}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td><td class="p-3 font-medium">${u.perfil}</td><td class="p-3 font-semibold text-gray-600">${u.nte || ''}</td><td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${u.ativo !== false ? 'ATIVO' : 'INATIVO'}</span></td><td class="p-3 text-center">${botoes}</td></tr>`;
        });
    };

    // Garante os eventos dos campos que habilitam botões.
    window.addEventListener('load', function(){
        garantirUsuarioSecSIGEE();
        try { inicializarSelectsNteEcosystem(); } catch(e){}
        ['f01-digitador','f02-digitador'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('change', () => id === 'f01-digitador' ? atualizarBotaoSubmissaoAnalise() : atualizarBotaoSubmissaoPendenciaV31());
        });
        const f01chk = document.getElementById('f01-chk-email'); if(f01chk) f01chk.addEventListener('change', atualizarBotaoSubmissaoAnalise);
        const f02chk = document.getElementById('f02-chk-email'); if(f02chk) f02chk.addEventListener('change', atualizarBotaoSubmissaoPendenciaV31);
        const pAluno = document.getElementById('f01-p-aluno'); if(pAluno) pAluno.addEventListener('change', onChangeTipoPendenciaAnalise);
        const pInst = document.getElementById('f01-p-inst'); if(pInst) pInst.addEventListener('change', onChangeTipoPendenciaAnalise);
    });
})();


// ===== bloco JS extraído do index.html =====
/* ==========================================================================
   SIGEE V32 - Correção de perfis, grupo SEC, carregamento técnico e importação
   Mantém a base/visual atual e apenas sobrescreve funções de permissão/carregamento.
   ========================================================================== */
(function(){
  'use strict';
  const GRUPO_SEC_V32 = 'SEC - TODOS OS NTES';
  const EMAIL_SEC_V32 = 'sec@enova.educacao.ba.gov.br';
  const EMAIL_ADMIN_V32 = 'administrativo@enova.educacao.ba.gov.br';
  const EMAIL_CONSULTA_V32 = 'consulta@enova.educacao.ba.gov.br';

  function txt(v){ return (v===undefined||v===null) ? '' : String(v).trim(); }
  function upper(v){ return txt(v).toUpperCase(); }
  function email(v){ return txt(v).toLowerCase(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function perfil(v){
    const p = semAcento(v||'Tecnico').toUpperCase();
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('SEC')) return 'Administrador';
    return 'Tecnico';
  }
  function numeroNte(v){
    const m = txt(v).match(/NTE[-\s]*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }
  function nomeNtePorId(id){
    const n = Number(id);
    if(!n) return '';
    const lista = (window.LISTA_OFICIAL_27_NTES || LISTA_OFICIAL_27_NTES || []);
    return lista.find(x => numeroNte(x) === n) || `NTE-${String(n).padStart(2,'0')}`;
  }
  function isSEC(u){
    const n = upper(u && (u.nte || u.grupo || u.nte_nome || ''));
    const e = email(u && u.email);
    return e === EMAIL_SEC_V32 || n === 'SEC' || n.includes('TODOS OS NTES') || n.includes('SEC -');
  }
  function isGlobal(u){
    if(!u) return false;
    return perfil(u.perfil) === 'Master' || isSEC(u);
  }
  function podeImportarPlanilha(u){
    const p = perfil(u && u.perfil);
    return p === 'Master' || p === 'Administrador' || isSEC(u);
  }
  function nteUsuario(u){
    if(!u) return 'NTE-26 Salvador';
    if(isSEC(u)) return GRUPO_SEC_V32;
    if(txt(u.nte)) return txt(u.nte);
    if(txt(u.nte_nome)) return txt(u.nte_nome);
    if(txt(u.nte_id)) return nomeNtePorId(u.nte_id) || 'NTE-26 Salvador';
    return 'NTE-26 Salvador';
  }
  function nteIgual(a,b){
    if(!a || !b) return false;
    if(isSEC({nte:a}) || isSEC({nte:b})) return true;
    const na = numeroNte(a), nb = numeroNte(b);
    if(na && nb) return na === nb;
    return semAcento(a).toUpperCase().replace(/\s+/g,'') === semAcento(b).toUpperCase().replace(/\s+/g,'');
  }
  function normalizarUsuario(u, i){
    const nu = Object.assign({}, u || {});
    nu.id = nu.id || (i ? i+1 : Date.now());
    nu.nome = upper(nu.nome || nu.name || nu.usuario || 'USUÁRIO SIGEE');
    nu.email = email(nu.email || nu.login || '');
    nu.senha = txt(nu.senha || nu.password || '123') || '123';
    nu.perfil = perfil(nu.perfil || nu.tipo || nu.role || (isSEC(nu) ? 'Administrador' : 'Tecnico'));
    nu.nte = nteUsuario(nu);
    nu.grupo = isSEC(nu) ? 'SEC' : txt(nu.grupo || '');
    nu.ativo = nu.ativo !== false;
    return nu;
  }
  function garantirListaNtes(){
    try{
      if(Array.isArray(LISTA_OFICIAL_27_NTES) && !LISTA_OFICIAL_27_NTES.some(n => upper(n).includes('SEC - TODOS'))) {
        LISTA_OFICIAL_27_NTES.unshift(GRUPO_SEC_V32);
      }
    }catch(e){}
  }
  function garantirUsuariosBase(){
    if(!Array.isArray(window.usuariosDB || usuariosDB)) return;
    const base = (window.usuariosDB || usuariosDB);
    const add = (u) => { if(!base.some(x => email(x.email) === email(u.email))) base.push(u); };
    add({id:900001,nome:'USUÁRIO SEC',email:EMAIL_SEC_V32,senha:'123',perfil:'Administrador',nte:GRUPO_SEC_V32,grupo:'SEC',ativo:true});
    add({id:900002,nome:'ADMINISTRADOR SIGEE',email:EMAIL_ADMIN_V32,senha:'123',perfil:'Administrador',nte:'NTE-26 Salvador',ativo:true});
    add({id:900003,nome:'CONSULTA SIGEE',email:EMAIL_CONSULTA_V32,senha:'123',perfil:'Consulta',nte:'NTE-26 Salvador',ativo:true});
    base.forEach((u,i)=>Object.assign(u, normalizarUsuario(u,i)));
  }

  window.SIGEE_V32 = { isSEC, isGlobal, podeImportarPlanilha, nteIgual, nteUsuario, perfil, garantirUsuariosBase };

  // Normalização dos dados vindos do Supabase para corrigir Técnico/Administrador/Consulta.
  window.usuarioDoSupabaseParaLocalSIGEE = function(u, indice){ return normalizarUsuario(u, indice); };

  // Selects com grupo SEC + 27 NTEs e todos os perfis.
  window.inicializarSelectsNteEcosystem = function(){
    garantirListaNtes();
    ['user-form-nte','filtro-dashboard-nte','dashboard-filtro-nte'].forEach(id=>{
      const el=document.getElementById(id); if(!el) return;
      const atual=el.value; el.innerHTML='';
      (LISTA_OFICIAL_27_NTES||[]).forEach(n=>{ const opt=document.createElement('option'); opt.value=n; opt.textContent=n; el.appendChild(opt); });
      if(atual && Array.from(el.options).some(o=>o.value===atual)) el.value=atual;
    });
    const pf=document.getElementById('user-form-perfil');
    if(pf){
      const atual=perfil(pf.value);
      pf.innerHTML='<option value="Master">Master</option><option value="Administrador">Administrador</option><option value="Tecnico">Tecnico</option><option value="Consulta">Consulta</option>';
      pf.value=atual;
    }
  };

  async function carregarTabela(tabela){
    try{
      const client = (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : null;
      if(!client) return [];
      const {data, error} = await client.from(tabela).select('*').limit(10000);
      if(error) throw error;
      return Array.isArray(data) ? data : [];
    }catch(e){ console.warn('SIGEE V32 SELECT', tabela, e); return []; }
  }
  async function carregarDadosOperacionais(){
    const T = window.SIGEE_SUPABASE_TABELAS || SIGEE_SUPABASE_TABELAS;
    const [us, es, pr, so, nt] = await Promise.all([
      carregarTabela(T.usuarios), carregarTabela(T.escolas), carregarTabela(T.processos), carregarTabela(T.solicitacoes), carregarTabela(T.ntes)
    ]);
    if(us.length) usuariosDB = us.map(normalizarUsuario).filter(u=>u.email);
    garantirUsuariosBase();
    if(es.length && typeof escolaDoSupabaseParaLocalSIGEE === 'function') escolasDB = es.map(escolaDoSupabaseParaLocalSIGEE).filter(e=>e && (e.cod_mec||e.nome));
    if(pr.length && typeof processoDoSupabaseParaLocalSIGEE === 'function') processosDB = pr.map(processoDoSupabaseParaLocalSIGEE).filter(p=>p && (p.aluno||p.escola));
    if(so.length && typeof solicitacaoDoSupabaseParaLocalSIGEE === 'function') solicitacoesDB = so.map(solicitacaoDoSupabaseParaLocalSIGEE).filter(s=>s && (s.aluno||s.escola));
    if(nt.length && typeof nteDoSupabaseParaLocalSIGEE === 'function') {
      const ntes = nt.map(nteDoSupabaseParaLocalSIGEE).filter(Boolean);
      if(ntes.length){ LISTA_OFICIAL_27_NTES.splice(0, LISTA_OFICIAL_27_NTES.length, ...ntes); garantirListaNtes(); }
    }
    try{ inicializarSelectsNteEcosystem(); }catch(e){}
    return true;
  }
  window.carregarDadosOperacionaisV32 = carregarDadosOperacionais;

  function aplicarPermissoes(){
    const u = window.usuarioLogado || usuarioLogado;
    const menuUsuarios = document.getElementById('menu-usuarios');
    const menuLogs = document.getElementById('menu-logs');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !isGlobal(u));
    if(menuLogs) menuLogs.classList.toggle('hidden', !(isGlobal(u) || perfil(u&&u.perfil)==='Administrador'));
    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !podeImportarPlanilha(u));
    document.querySelectorAll('[data-master-only-import-processos], .btn-importar-processos-master').forEach(el=>el.classList.toggle('hidden', !isGlobal(u)));
  }
  window.aplicarPermissoesV32 = aplicarPermissoes;

  function filtrarPorUsuario(lista){
    const u = window.usuarioLogado || usuarioLogado;
    if(!Array.isArray(lista)) return [];
    if(isGlobal(u)) return lista;
    const nte = nteUsuario(u);
    return lista.filter(x => nteIgual(x.nte || x.nte_nome || x.nte_vinculado || x.nucleo || x.nte_id, nte));
  }
  window.filtrarPorUsuarioV32 = filtrarPorUsuario;

  // Login: carrega bancos também para Técnico/Administrador/Consulta e aplica permissões corretamente.
  window.handleLogin = async function(event){
    if(event) event.preventDefault();
    garantirListaNtes(); garantirUsuariosBase();
    // Tenta carregar usuários sem travar por muito tempo.
    try{ await Promise.race([carregarDadosOperacionais(), new Promise(r=>setTimeout(r,1800))]); }catch(e){}
    garantirUsuariosBase();
    const em = email(document.getElementById('login-email')?.value || '');
    const sn = txt(document.getElementById('login-senha')?.value || '');
    let u = usuariosDB.find(x => email(x.email)===em && txt(x.senha||'123')===sn && x.ativo!==false);
    if(!u && em===EMAIL_SEC_V32 && sn==='123') u = normalizarUsuario({nome:'USUÁRIO SEC',email:EMAIL_SEC_V32,senha:'123',perfil:'Administrador',nte:GRUPO_SEC_V32,grupo:'SEC',ativo:true});
    if(!u){ alert('Credenciais inválidas, ou operador desativado no escopo regional.'); return; }
    Object.assign(u, normalizarUsuario(u));
    window.usuarioLogado = usuarioLogado = u;
    document.getElementById('tela-login')?.classList.add('hidden');
    document.getElementById('sistema-dashboard')?.classList.remove('hidden');
    const nomeEl=document.getElementById('user-nome'); if(nomeEl) nomeEl.innerText=u.nome;
    const perfEl=document.getElementById('user-perfil'); if(perfEl) perfEl.innerText=`${u.perfil}${isSEC(u)?' / SEC':''} | ${u.nte}`;
    aplicarPermissoes();
    try{ registrarLog('Acesso realizado ao painel operacional.'); }catch(e){}
    try{ navegar('painel'); }catch(e){}
    // Sincronização final em segundo plano para preencher processos/escolas do Técnico sem travar login.
    setTimeout(async()=>{ await carregarDadosOperacionais(); aplicarPermissoes(); try{ navegar('painel'); }catch(e){} }, 250);
  };
  try{ handleLogin = window.handleLogin; }catch(e){}

  const navegarOriginal = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  if(navegarOriginal){
    window.navegar = function(aba){
      const r = navegarOriginal(aba);
      aplicarPermissoes();
      if(aba==='processos' || aba==='escolas' || aba==='painel') setTimeout(()=>{ try{ aplicarPermissoes(); }catch(e){} }, 50);
      return r;
    };
    try{ navegar = window.navegar; }catch(e){}
  }

  // Dashboard por perfil: global para Master/SEC, travado no NTE para demais.
  window.carregarDadosDashboardReal = function(){
    const escolasVisiveis = filtrarPorUsuario(escolasDB);
    const procVisiveis = filtrarPorUsuario(processosDB);
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.innerText=v; };
    set('dash-escolas', escolasVisiveis.length);
    set('dash-acervos', escolasVisiveis.filter(e => upper(e.acervo||e.status_acervo).includes('RECOLH')).length);
    set('dash-estaduais', escolasVisiveis.filter(e => upper(e.dependencia||e.dependencia_adm).includes('ESTAD')).length);
    set('dash-municipios', [...new Set(escolasVisiveis.map(e => upper(e.municipio)).filter(Boolean))].length);
    set('dash-usuarios', isGlobal(usuarioLogado) ? usuariosDB.length : filtrarPorUsuario(usuariosDB).length);
    [['dash-proc-desarquivamento','Desarquivamento'],['dash-proc-analise','Análise'],['dash-proc-pendencia','Pendência'],['dash-proc-digitacao','Digitação'],['dash-proc-conferencia','Conferência'],['dash-proc-assinatura','Assinatura'],['dash-proc-aguardando','Aguardando Retirada'],['dash-proc-retirado','Retirado']]
      .forEach(([id,et])=>set(id, procVisiveis.filter(p=>txt(p.etapa)===et).length));
  };

  // Contadores dos fluxos respeitando Técnico/Administrador/Consulta.
  const carregarContOriginal = window.carregarEContarProcessosHorizontais || (typeof carregarEContarProcessosHorizontais !== 'undefined' ? carregarEContarProcessosHorizontais : null);
  window.carregarEContarProcessosHorizontais = function(){
    const visiveis = filtrarPorUsuario(processosDB);
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.innerText=v; };
    set('count-horiz-todos', visiveis.length);
    set('count-horiz-desarquivamento', visiveis.filter(p=>p.etapa==='Desarquivamento').length);
    set('count-horiz-analise', visiveis.filter(p=>p.etapa==='Análise').length);
    set('count-horiz-pendencia', visiveis.filter(p=>p.etapa==='Pendência').length);
    set('count-horiz-digitacao', visiveis.filter(p=>p.etapa==='Digitação').length);
    set('count-horiz-conferencia', visiveis.filter(p=>p.etapa==='Conferência').length);
    set('count-horiz-assinatura', visiveis.filter(p=>p.etapa==='Assinatura').length);
    set('count-horiz-aguardando', visiveis.filter(p=>p.etapa==='Aguardando Retirada').length);
    set('count-horiz-retirado', visiveis.filter(p=>p.etapa==='Retirado').length);
    if(typeof renderizarProcessosFlutuantes === 'function') renderizarProcessosFlutuantes();
  };
  try{ carregarEContarProcessosHorizontais = window.carregarEContarProcessosHorizontais; }catch(e){}

  // Usuários: Master/SEC enxergam todos os grupos cadastrados.
  window.carregarListaUsuarios = function(){
    const corpo=document.getElementById('tabela-usuarios-corpo'); if(!corpo) return; corpo.innerHTML='';
    garantirUsuariosBase();
    const lista = isGlobal(usuarioLogado) ? usuariosDB : filtrarPorUsuario(usuariosDB);
    lista.forEach(u=>{
      Object.assign(u, normalizarUsuario(u));
      const podeEditar = isGlobal(usuarioLogado);
      const grupo = isSEC(u) ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px]">SEC</span>' : '';
      const botoes = podeEditar ? `<div class="flex items-center justify-center gap-1.5"><button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button><button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo!==false?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo!==false?'Desativar':'Ativar'}</button><button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button></div>` : '<span class="text-xs text-gray-400 italic">Sem permissão</span>';
      corpo.innerHTML += `<tr class="text-xs"><td class="p-3 font-bold">${u.nome}${grupo}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td><td class="p-3 font-medium">${u.perfil}</td><td class="p-3 font-semibold text-gray-600">${u.nte}</td><td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo!==false?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo!==false?'ATIVO':'INATIVO'}</span></td><td class="p-3 text-center">${botoes}</td></tr>`;
    });
  };

  // Salvar usuário localmente com perfil e grupo SEC; tenta Supabase apenas com colunas seguras.
  window.salvarNovoUsuarioFormularioMaster = async function(event){
    event.preventDefault();
    const id = txt(document.getElementById('user-form-id')?.value);
    const u = {
      id: id || Date.now(),
      nome: upper(document.getElementById('user-form-nome')?.value),
      email: email(document.getElementById('user-form-email')?.value),
      senha: txt(document.getElementById('user-form-senha')?.value) || '123',
      nte: txt(document.getElementById('user-form-nte')?.value) || 'NTE-26 Salvador',
      perfil: perfil(document.getElementById('user-form-perfil')?.value),
      ativo: true
    };
    u.grupo = isSEC(u) ? 'SEC' : '';
    if(!u.nome || !u.email){ alert('Informe nome e e-mail do usuário.'); return; }
    const idx = usuariosDB.findIndex(x => String(x.id)===String(id) || email(x.email)===u.email);
    if(idx >= 0) usuariosDB[idx] = Object.assign({}, usuariosDB[idx], u); else usuariosDB.push(u);
    try{
      const client = (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : null;
      if(client){
        await client.from(SIGEE_SUPABASE_TABELAS.usuarios).upsert({nome:u.nome,email:u.email,perfil:u.perfil,ativo:u.ativo},{onConflict:'email'});
      }
    }catch(e){ console.warn('Usuário mantido localmente; Supabase recusou colunas opcionais:', e); }
    try{ registrarLog(`${id?'Atualizou':'Cadastrou'} operador: ${u.email}`); }catch(e){}
    try{ fecharModalUsuario(); }catch(e){}
    carregarListaUsuarios();
  };

  window.addEventListener('load', function(){
    garantirListaNtes(); garantirUsuariosBase(); inicializarSelectsNteEcosystem(); aplicarPermissoes();
    setTimeout(()=>{ carregarDadosOperacionais().then(()=>{ aplicarPermissoes(); try{ if(!document.getElementById('aba-processos')?.classList.contains('hidden')) carregarEContarProcessosHorizontais(); }catch(e){}; }); }, 300);
  });
})();


/* ==========================================================================
   SIGEE V33 - Permissões de importação e seleção global de responsáveis
   Ajustes solicitados:
   - Importação de planilhas somente para Master, Administrador e grupo SEC.
   - Técnico e Consulta não importam planilhas.
   - Master/SEC podem selecionar técnicos/responsáveis de todos os NTEs nos fluxos.
   - Administrador/Técnico ficam restritos ao NTE do cadastro.
   ========================================================================== */
(function(){
  'use strict';
  const GRUPO_SEC_V33 = 'SEC - TODOS OS NTES';
  const EMAIL_SEC_V33 = 'sec@enova.educacao.ba.gov.br';

  function txt(v){ return (v===undefined||v===null) ? '' : String(v).trim(); }
  function normal(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function email(v){ return txt(v).toLowerCase(); }
  function perfil(v){
    const p = normal(v || 'Tecnico');
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('SEC')) return 'Administrador';
    return 'Tecnico';
  }
  function isSEC(u){
    const n = normal(u && (u.nte || u.grupo || u.nte_nome || ''));
    const e = email(u && u.email);
    return e === EMAIL_SEC_V33 || n === 'SEC' || n.includes('SEC -') || n.includes('TODOS OS NTES');
  }
  function isGlobal(u){ return !!u && (perfil(u.perfil) === 'Master' || isSEC(u)); }
  function podeImportar(u){
    const p = perfil(u && u.perfil);
    return p === 'Master' || p === 'Administrador' || isSEC(u);
  }
  function nteIgual(a,b){
    const na = normal(a).replace(/\s/g,'');
    const nb = normal(b).replace(/\s/g,'');
    if(!na || !nb) return false;
    if(na === nb) return true;
    const ma = na.match(/NTE[-]*(\d{1,2})/); const mb = nb.match(/NTE[-]*(\d{1,2})/);
    return !!(ma && mb && Number(ma[1]) === Number(mb[1]));
  }
  function nteUsuario(u){
    if(!u) return 'NTE-26 Salvador';
    if(isSEC(u)) return GRUPO_SEC_V33;
    return txt(u.nte || u.nte_nome || u.nte_vinculado || 'NTE-26 Salvador');
  }
  function garantirGrupoSEC(){
    try{
      if(Array.isArray(LISTA_OFICIAL_27_NTES) && !LISTA_OFICIAL_27_NTES.some(n => normal(n).includes('SEC - TODOS'))) {
        LISTA_OFICIAL_27_NTES.unshift(GRUPO_SEC_V33);
      }
    }catch(e){}
    try{
      if(Array.isArray(usuariosDB) && !usuariosDB.some(u => email(u.email) === EMAIL_SEC_V33)) {
        usuariosDB.push({id:990001,nome:'USUÁRIO SEC',email:EMAIL_SEC_V33,senha:'123',perfil:'Administrador',nte:GRUPO_SEC_V33,grupo:'SEC',ativo:true});
      }
    }catch(e){}
  }

  // Expõe regra correta para outras rotinas.
  window.SIGEE_V33 = { podeImportar, isGlobal, isSEC, perfil, nteUsuario, nteIgual };

  // Importação: somente Master, Administrador e SEC.
  window.aplicarPermissoesV33 = function(){
    garantirGrupoSEC();
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !podeImportar(u));
    document.querySelectorAll('[data-master-only-import-processos], .btn-importar-processos-master, .btn-importar-processos-admin')
      .forEach(el => el.classList.toggle('hidden', !podeImportar(u)));

    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !isGlobal(u));
    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !(isGlobal(u) || perfil(u && u.perfil) === 'Administrador'));
  };

  // Master/SEC podem selecionar responsáveis de todos os NTEs nos processos.
  // Administrador/Técnico continuam restritos ao próprio NTE.
  window.preencherSelectTecnicosPorNte = function(selectId, nteFiltro){
    const select = document.getElementById(selectId);
    if(!select) return;
    garantirGrupoSEC();
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    const global = isGlobal(u);
    const nteBase = txt(nteFiltro || nteUsuario(u));
    let lista = Array.isArray(usuariosDB) ? usuariosDB.slice() : [];

    lista = lista.filter(op => op && op.ativo !== false && perfil(op.perfil) !== 'Consulta');
    if(!global) lista = lista.filter(op => nteIgual(nteUsuario(op), nteBase));

    lista.sort((a,b) => (nteUsuario(a) + ' ' + txt(a.nome)).localeCompare(nteUsuario(b) + ' ' + txt(b.nome), 'pt-BR'));
    select.innerHTML = '<option value="">-- Selecione o Servidor Responsável --</option>';

    if(global){
      const grupos = {};
      lista.forEach(op => {
        const nte = nteUsuario(op);
        if(isSEC(op)) return;
        grupos[nte] = grupos[nte] || [];
        grupos[nte].push(op);
      });
      Object.keys(grupos).forEach(nte => {
        const og = document.createElement('optgroup');
        og.label = nte;
        grupos[nte].forEach(op => {
          const opt = document.createElement('option');
          opt.value = txt(op.nome || op.email);
          opt.textContent = `${txt(op.nome || op.email)} — ${perfil(op.perfil)} — ${nte}`;
          opt.dataset.nte = nte;
          og.appendChild(opt);
        });
        select.appendChild(og);
      });
    } else {
      lista.forEach(op => {
        const opt = document.createElement('option');
        opt.value = txt(op.nome || op.email);
        opt.textContent = `${txt(op.nome || op.email)} — ${perfil(op.perfil)}`;
        opt.dataset.nte = nteUsuario(op);
        select.appendChild(opt);
      });
    }
  };
  try{ preencherSelectTecnicosPorNte = window.preencherSelectTecnicosPorNte; }catch(e){}

  // Reforça permissões após login/navegação/sincronização.
  const loginAnteriorV33 = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(loginAnteriorV33){
    window.handleLogin = async function(event){
      const r = await loginAnteriorV33.apply(this, arguments);
      garantirGrupoSEC();
      window.aplicarPermissoesV33();
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  const navegarAnteriorV33 = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  if(navegarAnteriorV33){
    window.navegar = function(aba){
      const r = navegarAnteriorV33.apply(this, arguments);
      setTimeout(window.aplicarPermissoesV33, 60);
      return r;
    };
    try{ navegar = window.navegar; }catch(e){}
  }

  // Se houver sincronização em segundo plano, aplica novamente ao terminar.
  const carregarDadosAnteriorV33 = window.carregarDadosOperacionaisV32;
  if(carregarDadosAnteriorV33){
    window.carregarDadosOperacionaisV32 = async function(){
      const r = await carregarDadosAnteriorV33.apply(this, arguments);
      garantirGrupoSEC();
      window.aplicarPermissoesV33();
      return r;
    };
  }

  window.addEventListener('load', function(){
    garantirGrupoSEC();
    setTimeout(window.aplicarPermissoesV33, 200);
    setTimeout(window.aplicarPermissoesV33, 1200);
  });
})();


// ===== bloco JS extraído do index.html =====
/* ==========================================================================
   SIGEE V34 - Carregamento de banco por perfil + permissões de importação
   - Importação permanece SOMENTE para Master, Administrador e Grupo SEC.
   - Técnico e Consulta NÃO importam planilhas.
   - Corrige carregamento de escolas/processos para Técnico, Administrador e Consulta.
   - Reforça renderização após sincronização Supabase para evitar "0 registros / banco pendente".
   ========================================================================== */
(function(){
  'use strict';

  const GRUPO_SEC = 'SEC - TODOS OS NTES';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';

  function txt(v){ return (v===undefined||v===null) ? '' : String(v).trim(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function email(v){ return txt(v).toLowerCase(); }
  function perfil(v){
    const p = sem(v || 'Tecnico');
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('SEC')) return 'Administrador';
    return 'Tecnico';
  }
  function numeroNte(v){
    const m = txt(v).match(/NTE[-\s]*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }
  function ntePorId(id){
    const n = Number(id);
    if(!n) return '';
    const lista = (typeof LISTA_OFICIAL_27_NTES !== 'undefined' && Array.isArray(LISTA_OFICIAL_27_NTES)) ? LISTA_OFICIAL_27_NTES : [];
    return lista.find(x => numeroNte(x) === n) || `NTE-${String(n).padStart(2,'0')}`;
  }
  function isSEC(u){
    const e = email(u && u.email);
    const n = sem(u && (u.nte || u.grupo || u.nte_nome || u.nte_vinculado || ''));
    return e === EMAIL_SEC || n === 'SEC' || n.includes('SEC -') || n.includes('TODOS OS NTES') || n === 'GLOBAL';
  }
  function isGlobal(u){ return !!u && (perfil(u.perfil) === 'Master' || isSEC(u)); }
  function podeImportar(u){
    const p = perfil(u && u.perfil);
    return p === 'Master' || p === 'Administrador' || isSEC(u);
  }
  function nteUsuario(u){
    if(!u) return 'NTE-26 Salvador';
    if(isSEC(u)) return GRUPO_SEC;
    return txt(u.nte || u.nte_nome || u.nte_vinculado || ntePorId(u.nte_id) || 'NTE-26 Salvador');
  }
  function nteItem(item){
    if(!item) return '';
    return txt(item.nte || item.nte_nome || item.nte_vinculado || item.nucleo || item.nte_descricao || ntePorId(item.nte_id) || '');
  }
  function nteIgual(a,b){
    if(!a || !b) return false;
    if(isSEC({nte:a}) || isSEC({nte:b})) return true;
    const na = numeroNte(a), nb = numeroNte(b);
    if(na && nb) return na === nb;
    return sem(a).replace(/\s+/g,'') === sem(b).replace(/\s+/g,'');
  }
  function filtrarPorPerfil(lista){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    if(!Array.isArray(lista)) return [];
    if(isGlobal(u)) return lista;
    const nte = nteUsuario(u);
    return lista.filter(item => nteIgual(nteItem(item), nte));
  }
  function garantirSec(){
    try{
      if(Array.isArray(LISTA_OFICIAL_27_NTES) && !LISTA_OFICIAL_27_NTES.some(n=>sem(n).includes('SEC - TODOS'))) LISTA_OFICIAL_27_NTES.unshift(GRUPO_SEC);
      if(Array.isArray(usuariosDB) && !usuariosDB.some(u=>email(u.email)===EMAIL_SEC)) usuariosDB.push({id:990001,nome:'USUÁRIO SEC',email:EMAIL_SEC,senha:'123',perfil:'Administrador',nte:GRUPO_SEC,grupo:'SEC',ativo:true});
    }catch(e){}
  }

  window.SIGEE_V34 = { perfil, isSEC, isGlobal, podeImportar, nteUsuario, nteItem, nteIgual, filtrarPorPerfil };

  function aplicarPermissoes(){
    garantirSec();
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !podeImportar(u));
    const input = document.getElementById('input-importar-excel');
    if(input) input.disabled = !podeImportar(u);
    document.querySelectorAll('[data-master-only-import-processos], .btn-importar-processos-master, .btn-importar-processos-admin')
      .forEach(el => el.classList.toggle('hidden', !podeImportar(u)));
    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !isGlobal(u));
    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !(isGlobal(u) || perfil(u && u.perfil)==='Administrador'));
  }
  window.aplicarPermissoesV34 = aplicarPermissoes;

  async function carregarOperacionalSilencioso(){
    try{
      if(typeof carregarDadosOperacionaisV32 === 'function') await carregarDadosOperacionaisV32();
      else if(typeof carregarTodasTabelasSupabaseSIGEE === 'function') await carregarTodasTabelasSupabaseSIGEE(true);
      else if(typeof sincronizarSupabaseSegundoPlanoSIGEE === 'function') await sincronizarSupabaseSegundoPlanoSIGEE();
      try{ sigEESupabaseOnline = true; }catch(e){}
      return true;
    }catch(e){
      console.warn('SIGEE V34: falha ao carregar dados operacionais:', e);
      return false;
    }
  }
  window.carregarOperacionalSilenciosoV34 = carregarOperacionalSilencioso;

  function atualizarInfoEscolas(qtd){
    const el = document.getElementById('info-quantidade-escolas-carregadas');
    if(!el) return;
    const status = (typeof sigEESupabaseOnline !== 'undefined' && sigEESupabaseOnline) ? 'Supabase online' : 'sincronizando Supabase';
    el.innerText = `Exibindo: ${qtd} registros | Banco: ${status}`;
  }

  // Corrige catálogo para Técnico/Administrador/Consulta após sincronização.
  window.renderizarListaEscolasBufferMemoria = function(){
    const corpo = document.getElementById('tabela-escolas-corpo');
    if(!corpo) return;
    corpo.innerHTML = '';
    let filtradas = filtrarPorPerfil(escolasDB || []);
    const busca = (document.getElementById('busca-escola')?.value || '').toLowerCase().trim();
    if(busca){
      filtradas = filtradas.filter(e => [e.cod_mec,e.nome,e.nome_escola,e.municipio,e.nte,e.dependencia,e.dependencia_adm,e.situacao,e.situacao_funcional,e.acervo,e.status_acervo].some(v=>String(v||'').toLowerCase().includes(busca)));
    }
    atualizarInfoEscolas(filtradas.length);
    const totalPorPagina = (typeof totalPorPaginaEscola !== 'undefined') ? totalPorPaginaEscola : 8;
    let pagina = (typeof paginaEscolaAtual !== 'undefined') ? paginaEscolaAtual : 1;
    const paginasTotais = Math.max(1, Math.ceil(filtradas.length / totalPorPagina));
    if(pagina > paginasTotais) pagina = paginasTotais;
    try{ paginaEscolaAtual = pagina; }catch(e){}
    const inicio = (pagina - 1) * totalPorPagina;
    filtradas.slice(inicio, inicio + totalPorPagina).forEach(e => {
      const situacao = txt(e.situacao || e.situacao_funcional || '').toUpperCase();
      const acervo = txt(e.acervo || e.status_acervo || '').toUpperCase();
      const sitClasse = situacao.includes('ATIV') ? 'text-green-300' : 'text-red-300';
      const acervoClasse = acervo.includes('RECOLH') && !acervo.includes('NÃO') && !acervo.includes('NAO') ? 'text-green-300' : 'text-red-300';
      corpo.innerHTML += `
        <tr class="hover:bg-white/10 text-[11px] text-white border-b border-white/10">
          <td class="p-3 font-mono font-bold">${txt(e.cod_mec)}</td>
          <td class="p-3 font-bold uppercase">${txt(e.nome || e.nome_escola)}</td>
          <td class="p-3 uppercase font-medium">${txt(e.municipio)}</td>
          <td class="p-3 font-semibold">${txt(e.nte)}<br><span class="text-[9px] bg-white/10 font-bold px-1 rounded">${txt(e.dependencia || e.dependencia_adm)}</span></td>
          <td class="p-3"><span class="px-1.5 py-0.5 font-black rounded text-[10px] bg-black/20 ${sitClasse}">${situacao || '-'}</span></td>
          <td class="p-3"><span class="px-1.5 py-0.5 font-black rounded text-[10px] bg-black/20 ${acervoClasse}">${acervo || '-'}</span></td>
          <td class="p-3 text-center"><button class="px-2 py-1 rounded bg-cyan-600/30 text-cyan-100 font-black">Alterar</button></td>
        </tr>`;
    });
    const pag = document.getElementById('txt-escola-paginacao'); if(pag) pag.innerText = `Página ${pagina} de ${paginasTotais}`;
    const ant = document.getElementById('btn-escola-anterior'); if(ant) ant.disabled = pagina <= 1;
    const prox = document.getElementById('btn-escola-proxima'); if(prox) prox.disabled = pagina >= paginasTotais;

    // Se não carregou nada para o usuário, tenta buscar em segundo plano uma vez, sem travar a tela.
    if(!filtradas.length && !window.__SIGEE_V34_RECARREGANDO_ESCOLAS){
      window.__SIGEE_V34_RECARREGANDO_ESCOLAS = true;
      atualizarInfoEscolas(0);
      setTimeout(async()=>{
        await carregarOperacionalSilencioso();
        window.__SIGEE_V34_RECARREGANDO_ESCOLAS = false;
        renderizarListaEscolasBufferMemoria();
      }, 100);
    }
  };
  try{ renderizarListaEscolasBufferMemoria = window.renderizarListaEscolasBufferMemoria; }catch(e){}

  // Reforça processos para Técnico/Administrador/Consulta.
  const renderProcAnterior = window.renderizarProcessosFlutuantes || (typeof renderizarProcessosFlutuantes !== 'undefined' ? renderizarProcessosFlutuantes : null);
  window.renderizarProcessosFlutuantes = function(){
    try{
      const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
      if(isGlobal(u) && renderProcAnterior) return renderProcAnterior.apply(this, arguments);
      const todos = Array.isArray(processosDB) ? processosDB.slice() : [];
      const original = processosDB;
      processosDB = filtrarPorPerfil(todos);
      const r = renderProcAnterior ? renderProcAnterior.apply(this, arguments) : undefined;
      processosDB = original;
      return r;
    }catch(e){
      console.warn('SIGEE V34 render processos:', e);
      if(renderProcAnterior) return renderProcAnterior.apply(this, arguments);
    }
  };
  try{ renderizarProcessosFlutuantes = window.renderizarProcessosFlutuantes; }catch(e){}

  // Garante que técnico NÃO importe, conforme regra anterior. Se quiser liberar Técnico, altere aqui.
  const importarOriginal = window.processarImportacaoOtimizada || (typeof processarImportacaoOtimizada !== 'undefined' ? processarImportacaoOtimizada : null);
  if(importarOriginal){
    window.processarImportacaoOtimizada = function(event){
      const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
      if(!podeImportar(u)){
        alert('Importação permitida apenas para Master, Administrador ou Grupo SEC. O perfil Técnico pode consultar e movimentar processos do NTE, mas não importar planilhas.');
        if(event && event.target) event.target.value = '';
        return;
      }
      return importarOriginal.apply(this, arguments);
    };
    try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
  }

  // Ao entrar/navegar, sincroniza novamente e atualiza tela atual.
  const navegarAnterior = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  if(navegarAnterior){
    window.navegar = function(aba){
      const r = navegarAnterior.apply(this, arguments);
      aplicarPermissoes();
      if(aba === 'escolas'){
        setTimeout(()=>{ try{ renderizarListaEscolasBufferMemoria(); }catch(e){} }, 50);
        setTimeout(async()=>{ await carregarOperacionalSilencioso(); aplicarPermissoes(); try{ renderizarListaEscolasBufferMemoria(); }catch(e){} }, 300);
      }
      if(aba === 'processos'){
        setTimeout(async()=>{ await carregarOperacionalSilencioso(); aplicarPermissoes(); try{ carregarEContarProcessosHorizontais(); }catch(e){} }, 300);
      }
      if(aba === 'painel'){
        setTimeout(async()=>{ await carregarOperacionalSilencioso(); aplicarPermissoes(); try{ carregarDadosDashboardReal(); }catch(e){} }, 300);
      }
      return r;
    };
    try{ navegar = window.navegar; }catch(e){}
  }

  const loginAnterior = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(loginAnterior){
    window.handleLogin = async function(event){
      const r = await loginAnterior.apply(this, arguments);
      aplicarPermissoes();
      setTimeout(async()=>{
        await carregarOperacionalSilencioso();
        aplicarPermissoes();
        try{ carregarDadosDashboardReal(); }catch(e){}
        try{ carregarEContarProcessosHorizontais(); }catch(e){}
        try{ if(!document.getElementById('aba-escolas')?.classList.contains('hidden')) renderizarListaEscolasBufferMemoria(); }catch(e){}
      }, 250);
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  window.addEventListener('load', function(){
    garantirSec();
    setTimeout(aplicarPermissoes, 100);
    setTimeout(async()=>{ await carregarOperacionalSilencioso(); aplicarPermissoes(); }, 600);
  });
})();


// ===== bloco JS extraído do index.html =====
/* =====================================================================
   SIGEE V35 - Correção da importação de planilhas para ESCOLAS e PROCESSOS
   Mantém: layout V30+, Grupo SEC, perfis, Supabase, exportações e fluxos.
   Regra: importação somente Master, Administrador e Grupo SEC.
   ===================================================================== */
(function(){
  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function up(v){ try{ return txt(v).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){ return txt(v).toUpperCase(); } }
  function titulo(v){ return txt(v).replace(/\s+/g,' ').trim(); }
  function normal(v){ return up(v).replace(/[^A-Z0-9]/g,''); }
  function getPerfil(u){ return txt(u && u.perfil).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function isSECUser(u){ return !!u && (up(u.grupo).includes('SEC') || up(u.nte).includes('SEC') || txt(u.email).toLowerCase()==='sec@enova.educacao.ba.gov.br'); }
  function podeImportarV35(u){ const p=getPerfil(u); return p==='master' || p==='administrador' || isSECUser(u); }
  function getCell(row, nomes){
    const keys = Object.keys(row||{});
    const alvo = nomes.map(normal);
    let key = keys.find(k => alvo.includes(normal(k)));
    if(!key){
      key = keys.find(k => alvo.some(a => normal(k).includes(a) || a.includes(normal(k))));
    }
    return key ? txt(row[key]) : '';
  }
  function obterNumeroNteV35(v){
    const t=txt(v); const m=t.match(/NTE\s*[- ]?\s*(\d{1,2})/i) || t.match(/^(\d{1,2})$/);
    if(m) return Number(m[1]);
    const n=Number(v); return (!Number.isNaN(n) && n>0 && n<100) ? n : null;
  }
  function nteNomeV35(v){
    if(typeof obterNomeNtePorIdSIGEE === 'function'){
      const n=obterNumeroNteV35(v); if(n) return obterNomeNtePorIdSIGEE(n) || txt(v);
    }
    return txt(v) || 'NTE-26 Salvador';
  }
  function nextId(lista, base){
    try{ return (Array.isArray(lista)&&lista.length) ? Math.max(...lista.map(x=>Number(x.id)||0)) + 1 : base; }catch(e){ return base; }
  }
  function linhaEhEscola(row){
    const mec = getCell(row,['cod_mec','codigo_mec','código mec','cod mec','mec','cód mec']);
    const nome = getCell(row,['nome_escola','nome da escola','nome escola','nome','instituicao','instituição','escola']);
    const aluno = getCell(row,['aluno','aluno_nome','nome do aluno','nome completo do aluno','requerente','nome_solicitante']);
    return !!(mec && nome && !aluno);
  }
  function linhaEhProcesso(row){
    const aluno = getCell(row,['aluno','aluno_nome','nome do aluno','nome completo do aluno','requerente','nome_solicitante','solicitante']);
    const etapa = getCell(row,['etapa','etapa_atual','fase','fase_atual','status']);
    const doc = getCell(row,['documento','documento_tipo','tipo de documento','documento_solicitado']);
    return !!(aluno && (etapa || doc || getCell(row,['escola','escola_nome','instituicao','instituição','nome_escola'])));
  }
  function converterEscolaV35(row){
    const mec = getCell(row,['cod_mec','codigo_mec','código mec','cod mec','mec','cód mec']);
    const nome = getCell(row,['nome_escola','nome da escola','nome escola','nome','instituicao','instituição','escola']);
    const municipio = getCell(row,['municipio','município','cidade']);
    const nte = getCell(row,['nte','nte vinculado','nte correspondente','núcleo','nucleo','territorio','território']);
    const nteId = getCell(row,['nte_id','id nte','codigo nte','código nte']);
    const dep = getCell(row,['dependencia_adm','dependência administrativa','dependencia administrativa','dependencia','dep. administrativo','dep administrativo','dep adm']);
    const sit = getCell(row,['situacao_funcional','situação funcional','situacao funcional','situação','situacao','status escola','status']);
    const acervo = getCell(row,['status_acervo','status do acervo','acervo','situação do acervo','situacao do acervo']);
    const local = getCell(row,['local_acervo','local do acervo','local físico do acervo','local fisico do acervo','local']);
    const nteNum = obterNumeroNteV35(nteId || nte) || 26;
    return {
      id: null,
      cod_mec: txt(mec),
      nome: titulo(nome).toUpperCase(),
      nome_escola: titulo(nome).toUpperCase(),
      municipio: titulo(municipio).toUpperCase(),
      nte: nteNomeV35(nte || nteNum),
      nte_id: nteNum,
      dependencia: dep || 'Estadual',
      dependencia_adm: dep || 'Estadual',
      situacao: sit || 'Extinta',
      situacao_funcional: sit || 'Extinta',
      acervo: acervo || 'Recolhido',
      status_acervo: acervo || 'Recolhido',
      local_acervo: local || 'Acervo do NTE',
      ativo: true
    };
  }
  function converterProcessoV35(row){
    const aluno = getCell(row,['aluno','aluno_nome','nome do aluno','nome completo do aluno','requerente','nome_solicitante','solicitante']);
    const escola = getCell(row,['escola','escola_nome','nome_escola','nome da escola','instituicao','instituição']);
    const cod = getCell(row,['cod_mec','codigo_mec','código mec','mec']);
    let escolaLocal = null;
    try{ escolaLocal = (escolasDB||[]).find(e => txt(e.cod_mec)===txt(cod) || up(e.nome||e.nome_escola)===up(escola)); }catch(e){}
    const nte = getCell(row,['nte','nte vinculado','nte correspondente']) || (escolaLocal && escolaLocal.nte) || 'NTE-26 Salvador';
    return {
      id: Number(getCell(row,['id','processo','codigo','código'])) || null,
      aluno: titulo(aluno).toUpperCase(),
      aluno_nome: titulo(aluno).toUpperCase(),
      escola: titulo(escola || (escolaLocal && (escolaLocal.nome||escolaLocal.nome_escola))).toUpperCase(),
      escola_nome: titulo(escola || (escolaLocal && (escolaLocal.nome||escolaLocal.nome_escola))).toUpperCase(),
      documento: getCell(row,['documento','documento_tipo','tipo de documento','documento_solicitado']) || 'HISTÓRICO',
      documento_tipo: getCell(row,['documento','documento_tipo','tipo de documento','documento_solicitado']) || 'HISTÓRICO',
      etapa: getCell(row,['etapa','etapa_atual','fase','fase_atual','status']) || 'Desarquivamento',
      etapa_atual: getCell(row,['etapa','etapa_atual','fase','fase_atual','status']) || 'Desarquivamento',
      data_etapa_atual: getCell(row,['data_etapa_atual','data etapa','data','created_at','criado_em']) || (typeof obterDataAtualFormatada==='function' ? obterDataAtualFormatada() : new Date().toLocaleDateString('pt-BR')),
      nte: nteNomeV35(nte),
      municipio: getCell(row,['municipio','município','cidade']) || (escolaLocal && escolaLocal.municipio) || '',
      modalidade: getCell(row,['modalidade','oferta_modalidade']) || null,
      ensino: getCell(row,['ensino','nivel_oferta','oferta_nivel']) || null,
      prioridade: getCell(row,['prioridade']) || null,
      tecnico_responsavel: getCell(row,['tecnico','técnico','tecnico_responsavel','responsavel','responsável']) || null
    };
  }
  async function upsertV35(tabela, payload, conflito){
    const client = (typeof obterSupabaseSIGEE==='function') ? obterSupabaseSIGEE() : null;
    if(!client || !payload.length) return true;
    const loteTam=100;
    for(let i=0;i<payload.length;i+=loteTam){
      const lote=payload.slice(i,i+loteTam);
      const {error}=await client.from(tabela).upsert(lote,{onConflict:conflito,ignoreDuplicates:false});
      if(error) throw error;
    }
    return true;
  }
  async function salvarImportacaoV35(escolasAlteradas, processosAlterados){
    const erros=[];
    try{
      if(escolasAlteradas.length){
        const payload = escolasAlteradas.map(e => (typeof escolaParaSupabaseSIGEE==='function' ? escolaParaSupabaseSIGEE(e) : e))
          .filter(e => e.cod_mec && e.nome_escola && e.municipio && e.nte_id && e.dependencia_adm && e.situacao_funcional && e.acervo && e.status_acervo);
        await upsertV35('escolas_sigee', payload, 'cod_mec');
      }
    }catch(e){ console.error('SIGEE V35 erro importando escolas:', e); erros.push('escolas_sigee: '+(e.message||JSON.stringify(e))); }
    try{
      if(processosAlterados.length){
        let proximo = nextId(processosDB,101);
        const payload = processosAlterados.map(p => {
          if(!p.id) p.id = proximo++;
          return (typeof processoParaSupabaseSIGEE==='function' ? processoParaSupabaseSIGEE(p) : p);
        }).filter(p => p.id && p.aluno_nome);
        await upsertV35('processos', payload, 'id');
      }
    }catch(e){ console.error('SIGEE V35 erro importando processos:', e); erros.push('processos: '+(e.message||JSON.stringify(e))); }
    return erros;
  }
  window.processarImportacaoOtimizada = async function(event){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    if(!podeImportarV35(u)){
      alert('Importação permitida apenas para Master, Administrador ou Grupo SEC.');
      if(event && event.target) event.target.value='';
      return;
    }
    const arquivo = event && event.target && event.target.files ? event.target.files[0] : null;
    if(!arquivo) return;
    const card=document.getElementById('card-progresso-importacao');
    const label=document.getElementById('label-status-importacao');
    const barra=document.getElementById('barra-progresso-importacao');
    const pctTxt=document.getElementById('percentual-importacao-texto');
    if(card) card.classList.remove('hidden');
    if(label) label.innerText='Carregando planilha e identificando escolas/processos...';
    if(barra) barra.style.width='5%';
    if(pctTxt) pctTxt.innerText='5%';
    try{
      const data = await arquivo.arrayBuffer();
      const livro = XLSX.read(data, {type:'array'});
      let escolasLidas=[], processosLidos=[];
      livro.SheetNames.forEach(nomeAba=>{
        const linhas = XLSX.utils.sheet_to_json(livro.Sheets[nomeAba], {defval:''});
        linhas.forEach(row=>{
          if(linhaEhEscola(row)) escolasLidas.push(converterEscolaV35(row));
          else if(linhaEhProcesso(row)) processosLidos.push(converterProcessoV35(row));
          else {
            // tentativa extra para planilhas de processos sem etapa/documento, mas com aluno
            if(getCell(row,['aluno','aluno_nome','nome do aluno','nome completo do aluno','nome_solicitante'])) processosLidos.push(converterProcessoV35(row));
          }
        });
      });
      if(label) label.innerText=`Processando ${escolasLidas.length} escolas e ${processosLidos.length} processos...`;
      if(barra) barra.style.width='35%';
      if(pctTxt) pctTxt.innerText='35%';

      let insEsc=0, atuEsc=0, insProc=0, atuProc=0;
      const alterEsc=[]; const alterProc=[];
      escolasLidas.forEach(e=>{
        if(!e.cod_mec || !e.nome || !e.municipio) return;
        const idx=(escolasDB||[]).findIndex(x=>txt(x.cod_mec)===txt(e.cod_mec));
        if(idx>=0){ escolasDB[idx] = {...escolasDB[idx], ...e, id: escolasDB[idx].id}; atuEsc++; alterEsc.push(escolasDB[idx]); }
        else { e.id=nextId(escolasDB,1); escolasDB.push(e); insEsc++; alterEsc.push(e); }
      });
      processosLidos.forEach(p=>{
        if(!p.aluno) return;
        const id=Number(p.id);
        const idx=id ? (processosDB||[]).findIndex(x=>Number(x.id)===id) : -1;
        if(idx>=0){ processosDB[idx] = {...processosDB[idx], ...p, id: processosDB[idx].id}; atuProc++; alterProc.push(processosDB[idx]); }
        else { p.id=nextId(processosDB,101); processosDB.push(p); insProc++; alterProc.push(p); }
      });
      if(barra) barra.style.width='65%';
      if(pctTxt) pctTxt.innerText='65%';
      if(label) label.innerText='Gravando escolas e processos no Supabase...';
      const erros = await salvarImportacaoV35(alterEsc, alterProc);
      if(barra) barra.style.width='100%';
      if(pctTxt) pctTxt.innerText='100%';
      try{ if(typeof registrarLog==='function') registrarLog(`Importação concluída. Escolas: +${insEsc}/atualizadas ${atuEsc}. Processos: +${insProc}/atualizados ${atuProc}.`); }catch(e){}
      try{ if(typeof renderizarListaEscolasBufferMemoria==='function') renderizarListaEscolasBufferMemoria(); }catch(e){}
      try{ if(typeof carregarEContarProcessosHorizontais==='function') carregarEContarProcessosHorizontais(); }catch(e){}
      try{ if(typeof carregarDadosDashboardReal==='function') carregarDadosDashboardReal(); }catch(e){}
      if(erros.length){
        alert(`Importação processada na tela, mas houve falha ao gravar no Supabase:\n\n${erros.join('\n')}\n\nVerifique colunas obrigatórias, RLS e permissões INSERT/UPDATE.`);
      }else{
        alert(`Importação concluída e gravada no Supabase.\n\nEscolas: ${insEsc} inseridas, ${atuEsc} atualizadas.\nProcessos: ${insProc} inseridos, ${atuProc} atualizados.`);
      }
    }catch(e){
      console.error('SIGEE V35 erro geral na importação:', e);
      alert('Erro na importação da planilha. Detalhe: '+(e.message||e));
    }finally{
      setTimeout(()=>{ if(card) card.classList.add('hidden'); if(event && event.target) event.target.value=''; }, 800);
    }
  };
  try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
})();


// ===== bloco JS extraído do index.html =====
/* =====================================================================
   SIGEE V36 - Importação robusta de Escolas, Processos e atualização Dashboard
   Correções:
   - Reconhece planilhas com cabeçalhos diferentes.
   - Importa escolas mesmo quando o município/NTE vêm em colunas combinadas.
   - Importa processos/fluxo com colunas simples ou combinadas: "Aluno / Doc", "Instituição / NTE".
   - Atualiza dashboard, catálogo e fluxo imediatamente após a importação.
   - Mantém regra: somente Master, Administrador e Grupo SEC importam.
   ===================================================================== */
(function(){
  'use strict';

  const EMAIL_SEC_V36 = 'sec@enova.educacao.ba.gov.br';

  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function upper(v){ return sem(v).toUpperCase(); }
  function clean(v){ return upper(v).replace(/[^A-Z0-9]/g,''); }
  function email(v){ return txt(v).toLowerCase(); }
  function titleUpper(v){ return txt(v).replace(/\s+/g,' ').trim().toUpperCase(); }
  function isBlankRow(row){ return !Object.values(row||{}).some(v => txt(v)); }

  function perfilImportadorV36(u){
    const p = upper(u && u.perfil);
    if(p.includes('MASTER')) return 'MASTER';
    if(p.includes('ADMIN')) return 'ADMINISTRADOR';
    if(p.includes('CONSULT')) return 'CONSULTA';
    if(p.includes('SEC')) return 'ADMINISTRADOR';
    return 'TECNICO';
  }
  function isSecV36(u){
    return !!u && (email(u.email) === EMAIL_SEC_V36 || upper(u.grupo).includes('SEC') || upper(u.nte).includes('SEC') || upper(u.nte).includes('TODOS OS NTES'));
  }
  function podeImportarV36(u){
    const p = perfilImportadorV36(u);
    return p === 'MASTER' || p === 'ADMINISTRADOR' || isSecV36(u);
  }

  function keys(row){ return Object.keys(row||{}); }
  function getCell(row, aliases){
    const ks = keys(row);
    const targets = aliases.map(clean).filter(Boolean);
    let k = ks.find(x => targets.includes(clean(x)));
    if(!k) k = ks.find(x => targets.some(a => clean(x).includes(a) || a.includes(clean(x))));
    if(!k) return '';
    return txt(row[k]);
  }
  function getAny(row, groups){
    for(const g of groups){ const v=getCell(row,g); if(v) return v; }
    return '';
  }
  function firstLine(v){ return txt(v).split(/\r?\n|\|/).map(s=>txt(s)).filter(Boolean)[0] || txt(v); }
  function secondLine(v){ const a=txt(v).split(/\r?\n|\|/).map(s=>txt(s)).filter(Boolean); return a[1] || ''; }

  function nteNumero(v){
    const t = txt(v);
    const m = t.match(/NTE\s*[- ]?\s*(\d{1,2})/i) || t.match(/\b(\d{1,2})\b/);
    const n = m ? Number(m[1]) : Number(t);
    return (!Number.isNaN(n) && n >= 1 && n <= 27) ? n : null;
  }
  function nteNome(v){
    const n = nteNumero(v);
    if(n && typeof obterNomeNtePorIdSIGEE === 'function') return obterNomeNtePorIdSIGEE(n) || `NTE-${String(n).padStart(2,'0')}`;
    if(n) return `NTE-${String(n).padStart(2,'0')}`;
    return txt(v) || 'NTE-26 Salvador';
  }
  function nextId(lista, base){
    const nums = Array.isArray(lista) ? lista.map(x=>Number(x.id)||0) : [];
    return nums.length ? Math.max(...nums, base-1)+1 : base;
  }

  const ALIAS = {
    mec: ['cod_mec','codigo_mec','código mec','cod mec','cód mec','mec','codigo sec','código sec','codigo','código'],
    escola: ['nome_escola','nome da escola','nome escola','nome da instituição','nome da instituicao','instituição','instituicao','escola','unidade escolar','nome'],
    municipio: ['municipio','município','cidade','localidade'],
    nte: ['nte','nte vinculado','nte correspondente','nte / dep. adm','nte dep adm','núcleo','nucleo','territorio','território'],
    nteId: ['nte_id','id nte','codigo nte','código nte','cod nte'],
    dependencia: ['dependencia_adm','dependência administrativa','dependencia administrativa','dependencia','dep. administrativo','dep administrativo','dep adm','nte / dep. adm'],
    situacao: ['situacao_funcional','situação funcional','situacao funcional','situação da escola','situacao da escola','situação','situacao','status escola','status'],
    acervo: ['status_acervo','status do acervo','situação do acervo','situacao do acervo','acervo'],
    localAcervo: ['local_acervo','local do acervo','local físico do acervo','local fisico do acervo','local'],
    aluno: ['aluno','aluno_nome','nome aluno','nome do aluno','nome completo do aluno','nome completo','requerente','nome_solicitante','solicitante','aluno / doc','aluno/doc'],
    documento: ['documento','documento_tipo','tipo de documento','documento solicitado','documento_solicitado','doc','aluno / doc','aluno/doc'],
    etapa: ['etapa','etapa_atual','etapa atual','fase','fase_atual','fase atual','status processo','status'],
    data: ['data_etapa_atual','data etapa','data','created_at','criado_em','data abertura','abertura','última movimentação','ultima movimentacao'],
    modalidade: ['modalidade','oferta_modalidade'],
    ensino: ['ensino','nivel_oferta','nível oferta','oferta_nivel','nível','nivel'],
    prioridade: ['prioridade'],
    tecnico: ['tecnico','técnico','tecnico_responsavel','técnico responsável','responsavel','responsável','digitador','analista']
  };

  function normalizarEtapaV36(v){
    const e = upper(v);
    if(e.includes('ANAL')) return 'Análise';
    if(e.includes('PEND')) return 'Pendência';
    if(e.includes('DIGIT')) return 'Digitação';
    if(e.includes('CONFER')) return 'Conferência';
    if(e.includes('ASSIN')) return 'Assinatura';
    if(e.includes('DEFER')) return 'Deferido';
    if(e.includes('AGUARD')) return 'Aguardando Retirada';
    if(e.includes('RETIR')) return 'Retirado';
    return 'Desarquivamento';
  }

  function converterEscolaV36(row){
    const campoNteDep = getCell(row, ['nte / dep. adm','nte dep adm','nte/dependencia','nte dependencia']);
    const mec = getCell(row, ALIAS.mec);
    const nome = getCell(row, ALIAS.escola);
    let municipio = getCell(row, ALIAS.municipio);
    let nte = getCell(row, ALIAS.nte) || firstLine(campoNteDep);
    const dep = getCell(row, ALIAS.dependencia) || secondLine(campoNteDep) || 'Estadual';
    const nteIdRaw = getCell(row, ALIAS.nteId) || nte;
    const nteId = nteNumero(nteIdRaw) || 26;
    if(!nte) nte = nteNome(nteId);
    if(!municipio) municipio = 'NÃO INFORMADO';
    return {
      id: null,
      cod_mec: txt(mec),
      nome: titleUpper(nome),
      nome_escola: titleUpper(nome),
      municipio: titleUpper(municipio),
      nte: nteNome(nte),
      nte_id: nteId,
      dependencia: txt(dep || 'Estadual'),
      dependencia_adm: txt(dep || 'Estadual'),
      situacao: txt(getCell(row, ALIAS.situacao) || 'Extinta'),
      situacao_funcional: txt(getCell(row, ALIAS.situacao) || 'Extinta'),
      acervo: txt(getCell(row, ALIAS.acervo) || 'Recolhido'),
      status_acervo: txt(getCell(row, ALIAS.acervo) || 'Recolhido'),
      local_acervo: txt(getCell(row, ALIAS.localAcervo) || 'Acervo do NTE'),
      ativo: true
    };
  }

  function converterProcessoV36(row){
    const alunoDoc = getCell(row, ['aluno / doc','aluno/doc','aluno - doc']);
    const instNte = getCell(row, ['instituição / nte','instituicao / nte','instituição/nte','instituicao/nte','instituição - nte','instituicao - nte']);
    const aluno = getCell(row, ALIAS.aluno) || firstLine(alunoDoc);
    const escolaNome = getCell(row, ['escola_nome','nome_escola','nome da escola','instituição','instituicao','escola']) || firstLine(instNte);
    const cod = getCell(row, ALIAS.mec);
    let escolaLocal = null;
    try { escolaLocal = (escolasDB||[]).find(e => txt(e.cod_mec) === txt(cod) || upper(e.nome || e.nome_escola) === upper(escolaNome)); } catch(e){}
    let nte = getCell(row, ALIAS.nte) || secondLine(instNte) || (escolaLocal && escolaLocal.nte) || '';
    if(!nte) nte = 'NTE-26 Salvador';
    return {
      id: Number(getCell(row, ['id','processo','codigo processo','código processo','nº processo','n processo'])) || null,
      aluno: titleUpper(aluno),
      aluno_nome: titleUpper(aluno),
      escola: titleUpper(escolaNome || (escolaLocal && (escolaLocal.nome || escolaLocal.nome_escola)) || 'NÃO INFORMADA'),
      escola_nome: titleUpper(escolaNome || (escolaLocal && (escolaLocal.nome || escolaLocal.nome_escola)) || 'NÃO INFORMADA'),
      documento: txt(getCell(row, ALIAS.documento) || secondLine(alunoDoc) || 'HISTÓRICO'),
      documento_tipo: txt(getCell(row, ALIAS.documento) || secondLine(alunoDoc) || 'HISTÓRICO'),
      etapa: normalizarEtapaV36(getCell(row, ALIAS.etapa)),
      etapa_atual: normalizarEtapaV36(getCell(row, ALIAS.etapa)),
      data_etapa_atual: txt(getCell(row, ALIAS.data) || (typeof obterDataAtualFormatada === 'function' ? obterDataAtualFormatada() : new Date().toLocaleDateString('pt-BR'))),
      nte: nteNome(nte),
      municipio: titleUpper(getCell(row, ALIAS.municipio) || (escolaLocal && escolaLocal.municipio) || ''),
      modalidade: txt(getCell(row, ALIAS.modalidade) || ''),
      ensino: txt(getCell(row, ALIAS.ensino) || ''),
      prioridade: txt(getCell(row, ALIAS.prioridade) || ''),
      tecnico_responsavel: txt(getCell(row, ALIAS.tecnico) || '')
    };
  }

  function deveSerEscola(row, nomeAba){
    if(isBlankRow(row)) return false;
    const aba = upper(nomeAba);
    const temMec = !!getCell(row, ALIAS.mec);
    const temEscola = !!getCell(row, ALIAS.escola);
    const temAluno = !!getCell(row, ALIAS.aluno);
    if(aba.includes('ESCOLA') || aba.includes('ACERVO') || aba.includes('CATALOGO') || aba.includes('CATÁLOGO')) return temMec && temEscola;
    return temMec && temEscola && !temAluno;
  }

  function deveSerProcesso(row, nomeAba){
    if(isBlankRow(row)) return false;
    const aba = upper(nomeAba);
    const aluno = getCell(row, ALIAS.aluno) || getCell(row, ['aluno / doc','aluno/doc']);
    const inst = getCell(row, ['instituição / nte','instituicao / nte','instituição/nte','instituicao/nte']) || getCell(row, ALIAS.escola);
    if(aba.includes('PROCESS') || aba.includes('FLUXO') || aba.includes('SOLICIT')) return !!(aluno || inst || getCell(row, ALIAS.etapa));
    return !!aluno && !!(inst || getCell(row, ALIAS.documento) || getCell(row, ALIAS.etapa));
  }

  async function upsertLotesV36(tabela, payload, conflito){
    const client = (typeof obterSupabaseSIGEE === 'function') ? obterSupabaseSIGEE() : null;
    if(!client || !payload.length) return;
    for(let i=0; i<payload.length; i+=100){
      const lote = payload.slice(i, i+100);
      const { error } = await client.from(tabela).upsert(lote, { onConflict: conflito, ignoreDuplicates: false });
      if(error) throw error;
    }
  }

  async function gravarImportacaoV36(escolasAlteradas, processosAlterados){
    const erros = [];
    try{
      if(escolasAlteradas.length){
        const payload = escolasAlteradas.map(e => {
          const base = (typeof escolaParaSupabaseSIGEE === 'function') ? escolaParaSupabaseSIGEE(e) : e;
          return {
            cod_mec: txt(base.cod_mec),
            nome_escola: titleUpper(base.nome_escola || e.nome),
            municipio: titleUpper(base.municipio || 'NÃO INFORMADO'),
            nte_id: Number(base.nte_id || e.nte_id || nteNumero(e.nte) || 26),
            dependencia_adm: txt(base.dependencia_adm || e.dependencia || 'Estadual'),
            situacao_funcional: txt(base.situacao_funcional || e.situacao || 'Extinta'),
            acervo: txt(base.acervo || e.acervo || 'Recolhido'),
            status_acervo: txt(base.status_acervo || e.status_acervo || e.acervo || 'Recolhido'),
            local_acervo: txt(base.local_acervo || e.local_acervo || 'Acervo do NTE'),
            ativo: true
          };
        }).filter(e => e.cod_mec && e.nome_escola);
        await upsertLotesV36('escolas_sigee', payload, 'cod_mec');
      }
    }catch(e){ erros.push('escolas_sigee: ' + (e.message || JSON.stringify(e))); }

    try{
      if(processosAlterados.length){
        let proximo = nextId(processosDB, 101);
        const payload = processosAlterados.map(p => {
          if(!p.id) p.id = proximo++;
          return {
            id: Number(p.id),
            aluno_nome: titleUpper(p.aluno || p.aluno_nome),
            escola_nome: titleUpper(p.escola || p.escola_nome || 'NÃO INFORMADA'),
            documento_tipo: txt(p.documento || p.documento_tipo || 'HISTÓRICO'),
            nivel_oferta: txt(p.nivel_oferta || p.ensino || '') || null,
            modalidade: txt(p.modalidade || '') || null,
            etapa_atual: normalizarEtapaV36(p.etapa || p.etapa_atual),
            nte: nteNome(p.nte || 'NTE-26 Salvador')
          };
        }).filter(p => p.id && p.aluno_nome);
        await upsertLotesV36('processos', payload, 'id');
      }
    }catch(e){ erros.push('processos: ' + (e.message || JSON.stringify(e))); }
    return erros;
  }

  window.processarImportacaoOtimizada = async function(event){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    if(!podeImportarV36(u)){
      alert('Importação permitida apenas para Master, Administrador ou Grupo SEC.');
      if(event && event.target) event.target.value = '';
      return;
    }
    const arquivo = event?.target?.files?.[0];
    if(!arquivo) return;
    const card = document.getElementById('card-progresso-importacao');
    const label = document.getElementById('label-status-importacao');
    const barra = document.getElementById('barra-progresso-importacao');
    const pct = document.getElementById('percentual-importacao-texto');
    const setProg = (n,msg) => { if(card) card.classList.remove('hidden'); if(barra) barra.style.width=n+'%'; if(pct) pct.innerText=n+'%'; if(label) label.innerText=msg; };

    try{
      setProg(5, 'Lendo planilha...');
      const data = await arquivo.arrayBuffer();
      const wb = XLSX.read(data, { type:'array', cellDates:true });
      const escolasLidas = [];
      const processosLidos = [];
      let linhasTotais = 0;

      wb.SheetNames.forEach(nomeAba => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[nomeAba], { defval:'', raw:false });
        linhasTotais += rows.length;
        rows.forEach(row => {
          if(deveSerEscola(row, nomeAba)) escolasLidas.push(converterEscolaV36(row));
          if(deveSerProcesso(row, nomeAba)) processosLidos.push(converterProcessoV36(row));
        });
      });

      setProg(30, `Identificado: ${escolasLidas.length} escolas e ${processosLidos.length} processos em ${linhasTotais} linhas.`);

      let insEsc=0, atuEsc=0, insProc=0, atuProc=0;
      const escolasAlteradas = [];
      const processosAlterados = [];

      escolasLidas.forEach(e => {
        if(!e.cod_mec || !e.nome) return;
        const idx = (escolasDB||[]).findIndex(x => txt(x.cod_mec) === txt(e.cod_mec));
        if(idx >= 0){ escolasDB[idx] = { ...escolasDB[idx], ...e, id: escolasDB[idx].id }; escolasAlteradas.push(escolasDB[idx]); atuEsc++; }
        else { e.id = nextId(escolasDB, 1); escolasDB.push(e); escolasAlteradas.push(e); insEsc++; }
      });
      processosLidos.forEach(p => {
        if(!p.aluno) return;
        const id = Number(p.id);
        const idx = id ? (processosDB||[]).findIndex(x => Number(x.id) === id) : -1;
        if(idx >= 0){ processosDB[idx] = { ...processosDB[idx], ...p, id: processosDB[idx].id }; processosAlterados.push(processosDB[idx]); atuProc++; }
        else { p.id = nextId(processosDB, 101); processosDB.push(p); processosAlterados.push(p); insProc++; }
      });

      setProg(65, 'Gravando escolas e processos no Supabase...');
      const erros = await gravarImportacaoV36(escolasAlteradas, processosAlterados);

      setProg(90, 'Atualizando telas e dashboard...');
      try{ if(typeof carregarEscolasSupabaseSIGEE === 'function') await carregarEscolasSupabaseSIGEE(); }catch(e){}
      try{ if(typeof carregarDadosOperacionaisV32 === 'function') await carregarDadosOperacionaisV32(); }catch(e){}
      try{ if(typeof renderizarListaEscolasBufferMemoria === 'function') renderizarListaEscolasBufferMemoria(); }catch(e){}
      try{ if(typeof carregarEContarProcessosHorizontais === 'function') carregarEContarProcessosHorizontais(); }catch(e){}
      try{ if(typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal(); }catch(e){}
      try{ if(typeof registrarLog === 'function') registrarLog(`Importação V36: escolas inseridas ${insEsc}, atualizadas ${atuEsc}; processos inseridos ${insProc}, atualizados ${atuProc}.`); }catch(e){}

      setProg(100, 'Importação concluída.');
      if(erros.length){
        alert(`Importação concluída na tela, mas o Supabase recusou parte dos dados:\n\n${erros.join('\n')}\n\nEscolas localizadas: ${escolasLidas.length}. Processos localizados: ${processosLidos.length}.`);
      } else {
        alert(`Importação concluída e gravada no Supabase.\n\nEscolas: ${insEsc} inseridas, ${atuEsc} atualizadas.\nProcessos: ${insProc} inseridos, ${atuProc} atualizados.`);
      }
    }catch(e){
      console.error('SIGEE V36 erro na importação:', e);
      alert('Erro na importação da planilha. Detalhe: ' + (e.message || e));
    }finally{
      setTimeout(() => { if(card) card.classList.add('hidden'); if(event?.target) event.target.value=''; }, 900);
    }
  };

  try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';

  const SIGEE_V37 = 'V37 - Perfis/SEC/Escolas/Importação';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';

  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function upper(v){ return sem(v).toUpperCase(); }
  function clean(v){ return upper(v).replace(/[^A-Z0-9]/g,''); }
  function lower(v){ return txt(v).toLowerCase(); }
  function title(v){ return txt(v).replace(/\s+/g,' ').trim().toUpperCase(); }
  function perfil(u){ return upper(u && u.perfil); }
  function isMaster(u){ return perfil(u).includes('MASTER'); }
  function isAdmin(u){ return perfil(u).includes('ADMIN'); }
  function isTecnico(u){ return perfil(u).includes('TECNIC') || perfil(u).includes('TECNICO'); }
  function isConsulta(u){ return perfil(u).includes('CONSULT'); }
  function isSEC(u){ return !!u && (lower(u.email)===EMAIL_SEC || perfil(u).includes('SEC') || upper(u.grupo).includes('SEC') || upper(u.nte).includes('SEC') || upper(u.nte).includes('TODOS OS NTES')); }
  function isGlobal(u){ return isMaster(u) || isSEC(u); }
  function podeImportar(u){ return isMaster(u) || isAdmin(u) || isSEC(u); }
  function podeEditarEscola(u){ return isMaster(u) || isAdmin(u) || isTecnico(u) || isSEC(u); }
  function nteTexto(v){ return txt(v || '').replace(/\s+/g,' ').trim(); }
  function normNte(v){ return clean(v).replace(/^NTE0?/, 'NTE'); }
  function nteIgual(a,b){ return normNte(a) === normNte(b); }
  function nteUsuario(u){ return nteTexto((u && (u.nte || u.nte_nome || u.grupo)) || ''); }
  function nteNumero(v){
    const t = txt(v);
    const m = t.match(/NTE\s*[- ]?\s*(\d{1,2})/i) || t.match(/\b(\d{1,2})\b/);
    const n = m ? Number(m[1]) : Number(t);
    return (!Number.isNaN(n) && n>=1 && n<=27) ? n : null;
  }
  function nomeNtePorId(id){
    const n = Number(id);
    try{
      if(typeof obterNomeNtePorIdSIGEE === 'function'){
        const r = obterNomeNtePorIdSIGEE(n);
        if(r) return r;
      }
    }catch(e){}
    const lista = (typeof LISTA_OFICIAL_27_NTES !== 'undefined' && Array.isArray(LISTA_OFICIAL_27_NTES)) ? LISTA_OFICIAL_27_NTES : [];
    const ach = lista.find(x => nteNumero(x)===n);
    return ach || (n ? `NTE-${String(n).padStart(2,'0')}` : 'NTE-26 Salvador');
  }
  function nteNome(v){
    const n = nteNumero(v);
    return n ? nomeNtePorId(n) : (txt(v) || 'NTE-26 Salvador');
  }
  function nextId(lista, base){
    const nums = Array.isArray(lista) ? lista.map(x=>Number(x.id)||0) : [];
    return nums.length ? Math.max(...nums, base-1)+1 : base;
  }
  function getClient(){ try{ return typeof obterSupabaseSIGEE==='function' ? obterSupabaseSIGEE() : null; }catch(e){ return null; } }
  async function upsertTabela(tabela, payload, conflito){
    const client = getClient();
    if(!client || !payload || !payload.length) return {error:null};
    for(let i=0;i<payload.length;i+=100){
      const lote = payload.slice(i,i+100);
      const { error } = await client.from(tabela).upsert(lote, { onConflict: conflito, ignoreDuplicates:false });
      if(error) return {error};
    }
    return {error:null};
  }

  function garantirPerfilSEC(){
    try{
      window.usuariosDB = (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB)) ? usuariosDB : (window.usuariosDB || []);
      if(!usuariosDB.some(u => lower(u.email) === EMAIL_SEC)){
        usuariosDB.push({
          id: nextId(usuariosDB, 9000),
          nome: 'USUÁRIO SEC',
          email: EMAIL_SEC,
          senha: '123',
          perfil: 'SEC',
          grupo: 'SEC',
          nte: 'SEC - TODOS OS NTEs',
          ativo: true
        });
      }
      if(!usuariosDB.some(u => lower(u.email)==='administrativo@enova.educacao.ba.gov.br')){
        usuariosDB.push({id:nextId(usuariosDB,9100), nome:'USUÁRIO ADMINISTRADOR', email:'administrativo@enova.educacao.ba.gov.br', senha:'123', perfil:'Administrador', nte:'NTE-26 Salvador', ativo:true});
      }
      if(!usuariosDB.some(u => lower(u.email)==='consulta@enova.educacao.ba.gov.br')){
        usuariosDB.push({id:nextId(usuariosDB,9200), nome:'USUÁRIO CONSULTA', email:'consulta@enova.educacao.ba.gov.br', senha:'123', perfil:'Consulta', nte:'NTE-26 Salvador', ativo:true});
      }
    }catch(e){ console.warn('SIGEE V37: não foi possível garantir usuários base.', e); }
  }

  function aplicarPermissoesV37(){
    garantirPerfilSEC();
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    const importar = podeImportar(u);
    const editarEscola = podeEditarEscola(u);
    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !importar);
    const input = document.getElementById('input-importar-excel');
    if(input) input.disabled = !importar;
    document.querySelectorAll('.export-only').forEach(el => el.classList.toggle('hidden', !(isMaster(u)||isAdmin(u)||isSEC(u))));
    document.querySelectorAll('[data-sigee-permissao="editar-escola"]').forEach(el => el.classList.toggle('hidden', !editarEscola));
    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !(isMaster(u)||isSEC(u)));
    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !(isMaster(u)||isAdmin(u)||isSEC(u)));
  }
  window.aplicarPermissoesV37 = aplicarPermissoesV37;

  /* Técnicos por NTE: Master/SEC veem todos em todas as etapas; Admin/Técnico ficam no NTE. */
  window.preencherSelectTecnicosPorNte = function(selectId, nteFiltro){
    garantirPerfilSEC();
    const select = document.getElementById(selectId);
    if(!select) return;
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    const global = isGlobal(u);
    const base = nteTexto(nteFiltro || nteUsuario(u));
    let lista = (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB)) ? usuariosDB.slice() : [];
    lista = lista.filter(op => op && op.ativo !== false && !isConsulta(op) && !isSEC(op));
    if(!global){ lista = lista.filter(op => nteIgual(nteUsuario(op), base)); }
    lista.sort((a,b) => (nteUsuario(a)+' '+txt(a.nome||a.email)).localeCompare(nteUsuario(b)+' '+txt(b.nome||b.email),'pt-BR'));
    select.innerHTML = '<option value="">-- Selecione o Servidor Responsável --</option>';
    if(global){
      const grupos = {};
      lista.forEach(op => { const nte = nteUsuario(op)||'SEM NTE'; (grupos[nte]=grupos[nte]||[]).push(op); });
      Object.keys(grupos).forEach(nte => {
        const og = document.createElement('optgroup'); og.label = nte;
        grupos[nte].forEach(op => { const opt=document.createElement('option'); opt.value=txt(op.nome||op.email); opt.textContent=`${txt(op.nome||op.email)} — ${txt(op.perfil||'Técnico')} — ${nte}`; opt.dataset.nte=nte; og.appendChild(opt); });
        select.appendChild(og);
      });
    } else {
      lista.forEach(op => { const opt=document.createElement('option'); opt.value=txt(op.nome||op.email); opt.textContent=`${txt(op.nome||op.email)} — ${txt(op.perfil||'Técnico')}`; opt.dataset.nte=nteUsuario(op); select.appendChild(opt); });
    }
  };
  try{ preencherSelectTecnicosPorNte = window.preencherSelectTecnicosPorNte; }catch(e){}

  function obterEscolasVisiveis(){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    let lista = (typeof escolasDB !== 'undefined' && Array.isArray(escolasDB)) ? escolasDB.slice() : [];
    if(!isGlobal(u)) lista = lista.filter(e => nteIgual(e.nte || e.nte_nome || nomeNtePorId(e.nte_id), nteUsuario(u)));
    return lista;
  }
  function obterProcessosVisiveis(){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    let lista = (typeof processosDB !== 'undefined' && Array.isArray(processosDB)) ? processosDB.slice() : [];
    if(!isGlobal(u)) lista = lista.filter(p => nteIgual(p.nte || p.nte_nome, nteUsuario(u)));
    return lista;
  }

  /* Modal de escola criado sem alterar a estrutura original */
  function garantirModalEscolaV37(){
    if(document.getElementById('modal-cadastro-escola')) return;
    const html = `
      <div id="modal-cadastro-escola" class="hidden fixed inset-0 bg-blue-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
        <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-blue-200">
          <div class="bg-blue-900 text-white px-5 py-4 flex justify-between items-center">
            <h3 id="titulo-modal-escola" class="font-bold text-sm">🏫 Cadastrar/Alterar Escola</h3>
            <button type="button" onclick="fecharModalEscola()" class="text-white font-bold cursor-pointer">✕</button>
          </div>
          <form onsubmit="salvarEscolaFormularioV37(event)" class="p-5 space-y-4">
            <input type="hidden" id="escola-form-id">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código MEC</label><input id="escola-form-mec" required class="w-full p-2 border rounded-lg text-xs font-medium"></div>
              <div class="md:col-span-2"><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Escola</label><input id="escola-form-nome" required class="w-full p-2 border rounded-lg text-xs font-medium uppercase"></div>
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Município</label><input id="escola-form-municipio" required class="w-full p-2 border rounded-lg text-xs font-medium uppercase"></div>
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">NTE</label><select id="escola-form-nte" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white"></select></div>
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Dependência Adm.</label><select id="escola-form-dependencia" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white"><option value="">SELECIONE</option><option>Estadual</option><option>Municipal</option><option>Particular</option><option>Federal</option></select></div>
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação</label><select id="escola-form-situacao" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white"><option value="">SELECIONE</option><option>Ativa</option><option>Extinta</option></select></div>
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status do Acervo</label><select id="escola-form-acervo" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white"><option value="">SELECIONE</option><option>Recolhido</option><option>Não recolhido</option><option>Não acolhido</option></select></div>
              <div><label class="block text-xs font-bold text-gray-700 uppercase mb-1">Local do Acervo</label><input id="escola-form-local-acervo" class="w-full p-2 border rounded-lg text-xs font-medium"></div>
            </div>
            <div class="flex justify-end gap-2 border-t pt-3">
              <button type="button" onclick="fecharModalEscola()" class="px-4 py-2 border rounded-lg text-xs font-semibold bg-gray-100 cursor-pointer">Cancelar</button>
              <button type="submit" class="bg-blue-900 hover:bg-blue-950 text-white font-bold px-5 py-2 rounded-lg text-xs shadow cursor-pointer">Salvar Escola</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
  function preencherNteEscolaSelect(valor){
    const sel = document.getElementById('escola-form-nte');
    if(!sel) return;
    let lista = (typeof LISTA_OFICIAL_27_NTES !== 'undefined' && Array.isArray(LISTA_OFICIAL_27_NTES)) ? LISTA_OFICIAL_27_NTES.slice() : [];
    if(!lista.length && typeof ntesDB !== 'undefined' && Array.isArray(ntesDB)) lista = ntesDB.map(n => n.nome || n.nte || n.nome_nte).filter(Boolean);
    sel.innerHTML = '<option value="">SELECIONE</option>' + lista.map(n => `<option value="${n}">${n}</option>`).join('');
    if(valor) sel.value = nteNome(valor);
  }
  window.abrirModalNovaEscola = function(){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    if(!podeEditarEscola(u)){ alert('Cadastro de escola permitido apenas para Master, Administrador, Técnico ou SEC.'); return; }
    garantirModalEscolaV37();
    document.getElementById('titulo-modal-escola').innerText = '🏫 Cadastrar Nova Escola';
    ['escola-form-id','escola-form-mec','escola-form-nome','escola-form-municipio','escola-form-local-acervo'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    preencherNteEscolaSelect(isGlobal(u) ? '' : nteUsuario(u));
    const dep=document.getElementById('escola-form-dependencia'); if(dep) dep.value='Estadual';
    const sit=document.getElementById('escola-form-situacao'); if(sit) sit.value='Extinta';
    const ac=document.getElementById('escola-form-acervo'); if(ac) ac.value='Recolhido';
    document.getElementById('modal-cadastro-escola').classList.remove('hidden');
  };
  window.abrirModalEditarEscolaV37 = function(id){
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    if(!podeEditarEscola(u)){ alert('Alteração de escola permitida apenas para Master, Administrador, Técnico ou SEC.'); return; }
    garantirModalEscolaV37();
    const e = (escolasDB||[]).find(x => Number(x.id)===Number(id) || txt(x.cod_mec)===txt(id));
    if(!e){ alert('Escola não localizada.'); return; }
    document.getElementById('titulo-modal-escola').innerText = '✏️ Alterar Escola';
    document.getElementById('escola-form-id').value = e.id || '';
    document.getElementById('escola-form-mec').value = e.cod_mec || '';
    document.getElementById('escola-form-nome').value = e.nome || e.nome_escola || '';
    document.getElementById('escola-form-municipio').value = e.municipio || '';
    preencherNteEscolaSelect(e.nte || e.nte_id);
    document.getElementById('escola-form-dependencia').value = e.dependencia || e.dependencia_adm || 'Estadual';
    document.getElementById('escola-form-situacao').value = e.situacao || e.situacao_funcional || 'Extinta';
    document.getElementById('escola-form-acervo').value = e.status_acervo || e.acervo || 'Recolhido';
    document.getElementById('escola-form-local-acervo').value = e.local_acervo || '';
    document.getElementById('modal-cadastro-escola').classList.remove('hidden');
  };
  window.fecharModalEscola = function(){ const m=document.getElementById('modal-cadastro-escola'); if(m) m.classList.add('hidden'); };
  window.salvarEscolaFormularioV37 = async function(event){
    event.preventDefault();
    const u = window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null);
    if(!podeEditarEscola(u)){ alert('Sem permissão para salvar escola.'); return; }
    const id = txt(document.getElementById('escola-form-id')?.value);
    const nte = txt(document.getElementById('escola-form-nte')?.value);
    const escola = {
      id: id ? Number(id) : nextId(escolasDB, 1),
      cod_mec: txt(document.getElementById('escola-form-mec')?.value),
      nome: title(document.getElementById('escola-form-nome')?.value),
      nome_escola: title(document.getElementById('escola-form-nome')?.value),
      municipio: title(document.getElementById('escola-form-municipio')?.value),
      nte: nteNome(nte),
      nte_id: nteNumero(nte) || 26,
      dependencia: txt(document.getElementById('escola-form-dependencia')?.value || 'Estadual'),
      dependencia_adm: txt(document.getElementById('escola-form-dependencia')?.value || 'Estadual'),
      situacao: txt(document.getElementById('escola-form-situacao')?.value || 'Extinta'),
      situacao_funcional: txt(document.getElementById('escola-form-situacao')?.value || 'Extinta'),
      acervo: txt(document.getElementById('escola-form-acervo')?.value || 'Recolhido'),
      status_acervo: txt(document.getElementById('escola-form-acervo')?.value || 'Recolhido'),
      local_acervo: txt(document.getElementById('escola-form-local-acervo')?.value || 'Acervo do NTE'),
      ativo: true
    };
    if(!escola.cod_mec || !escola.nome || !escola.municipio){ alert('Preencha Código MEC, Nome da Escola e Município.'); return; }
    const idx = (escolasDB||[]).findIndex(x => txt(x.cod_mec)===txt(escola.cod_mec) || Number(x.id)===Number(escola.id));
    if(idx >= 0) escolasDB[idx] = { ...escolasDB[idx], ...escola, id: escolasDB[idx].id || escola.id };
    else escolasDB.push(escola);
    const payload = [{
      cod_mec: escola.cod_mec,
      nome_escola: escola.nome,
      municipio: escola.municipio,
      nte_id: escola.nte_id,
      dependencia_adm: escola.dependencia,
      situacao_funcional: escola.situacao,
      acervo: escola.acervo,
      status_acervo: escola.status_acervo,
      local_acervo: escola.local_acervo,
      ativo: true
    }];
    const { error } = await upsertTabela('escolas_sigee', payload, 'cod_mec');
    if(error){ alert('Escola salva na tela, mas não foi gravada no Supabase. Detalhe: '+(error.message||JSON.stringify(error))); }
    else { alert('Escola salva com sucesso.'); }
    try{ if(typeof registrarLog==='function') registrarLog(`${idx>=0?'Alterou':'Cadastrou'} escola ${escola.nome} (${escola.cod_mec}).`); }catch(e){}
    fecharModalEscola();
    try{ renderizarListaEscolasBufferMemoria(); carregarDadosDashboardReal(); }catch(e){}
  };

  function badgeSit(valor, tipo){
    const v = txt(valor || '').toUpperCase();
    const ok = tipo==='situacao' ? v.includes('ATIVA') : (v.includes('RECOLHIDO') && !v.includes('NAO') && !v.includes('NÃO'));
    const cls = ok ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-500/40' : 'bg-red-900/50 text-red-200 border border-red-500/40';
    return `<span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${cls}">${txt(valor||'')}</span>`;
  }
  window.renderizarListaEscolasBufferMemoria = function(){
    const corpo = document.getElementById('tabela-escolas-corpo'); if(!corpo) return; corpo.innerHTML='';
    let filtradas = obterEscolasVisiveis();
    const busca = lower(document.getElementById('busca-escola')?.value || '');
    if(busca){ filtradas = filtradas.filter(e => [e.cod_mec,e.nome,e.nome_escola,e.municipio,e.nte,e.dependencia,e.dependencia_adm,e.situacao,e.situacao_funcional,e.acervo,e.status_acervo].some(v => lower(v).includes(busca))); }
    const info = document.getElementById('info-quantidade-escolas-carregadas');
    if(info) info.innerText = `Exibindo: ${filtradas.length} registros | Banco: ${window.sigEESupabaseOnline ? 'Supabase' : 'verificando Supabase'}`;
    const porPagina = (typeof totalPorPaginaEscola !== 'undefined' ? totalPorPaginaEscola : 8);
    if(typeof paginaEscolaAtual === 'undefined') window.paginaEscolaAtual = 1;
    const paginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
    if(paginaEscolaAtual > paginas) paginaEscolaAtual = paginas;
    if(paginaEscolaAtual < 1) paginaEscolaAtual = 1;
    const paginadas = filtradas.slice((paginaEscolaAtual-1)*porPagina, (paginaEscolaAtual-1)*porPagina + porPagina);
    const canEdit = podeEditarEscola(window.usuarioLogado || (typeof usuarioLogado!=='undefined'?usuarioLogado:null));
    paginadas.forEach(e => {
      corpo.innerHTML += `
        <tr class="hover:bg-cyan-500/10 text-[11px] text-white border-b border-cyan-400/10">
          <td class="p-3 font-mono font-bold">${txt(e.cod_mec)}</td>
          <td class="p-3 font-bold uppercase text-white">${txt(e.nome || e.nome_escola)}</td>
          <td class="p-3 uppercase font-medium text-white/90">${txt(e.municipio)}</td>
          <td class="p-3 font-semibold text-white/80">${txt(e.nte || nomeNtePorId(e.nte_id))}<br><span class="text-[9px] bg-white/10 font-bold px-1 rounded">${txt(e.dependencia || e.dependencia_adm)}</span></td>
          <td class="p-3">${badgeSit(e.situacao || e.situacao_funcional, 'situacao')}</td>
          <td class="p-3 font-bold">${badgeSit(e.status_acervo || e.acervo, 'acervo')}</td>
          <td class="p-3 text-center"><button ${canEdit ? '' : 'disabled'} onclick="abrirModalEditarEscolaV37('${e.id || e.cod_mec}')" class="${canEdit?'':'opacity-40'} bg-cyan-700/60 hover:bg-cyan-600 text-white px-2 py-1 rounded-lg font-bold text-[10px]">✏️ Alterar</button></td>
        </tr>`;
    });
    const txtPag=document.getElementById('txt-escola-paginacao'); if(txtPag) txtPag.innerText=`Página ${paginaEscolaAtual} de ${paginas}`;
    const ant=document.getElementById('btn-escola-anterior'); if(ant) ant.disabled = paginaEscolaAtual <= 1;
    const prox=document.getElementById('btn-escola-proxima'); if(prox) prox.disabled = paginaEscolaAtual >= paginas;
  };
  try{ renderizarListaEscolasBufferMemoria = window.renderizarListaEscolasBufferMemoria; }catch(e){}

  /* Importação V37: Escolas, Processos e atualização automática do Dashboard. */
  const ALIAS = {
    mec: ['cod_mec','codigo_mec','código mec','cod mec','cód mec','mec','codigo sec','código sec','codigo','código'],
    escola: ['nome_escola','nome da escola','nome escola','nome da instituição','nome da instituicao','instituição','instituicao','escola','unidade escolar','nome'],
    municipio: ['municipio','município','cidade','localidade'],
    nte: ['nte','nte vinculado','nte correspondente','nte / dep. adm','nte dep adm','núcleo','nucleo','territorio','território'],
    nteId: ['nte_id','id nte','codigo nte','código nte','cod nte'],
    dependencia: ['dependencia_adm','dependência administrativa','dependencia administrativa','dependencia','dep. administrativo','dep administrativo','dep adm','nte / dep. adm'],
    situacao: ['situacao_funcional','situação funcional','situacao funcional','situação da escola','situacao da escola','situação','situacao','status escola','status'],
    acervo: ['status_acervo','status do acervo','situação do acervo','situacao do acervo','acervo'],
    localAcervo: ['local_acervo','local do acervo','local físico do acervo','local fisico do acervo','local'],
    aluno: ['aluno','aluno_nome','nome aluno','nome do aluno','nome completo do aluno','nome completo','requerente','nome_solicitante','solicitante','aluno / doc','aluno/doc'],
    documento: ['documento','documento_tipo','tipo de documento','documento solicitado','documento_solicitado','doc','aluno / doc','aluno/doc'],
    etapa: ['etapa','etapa_atual','etapa atual','fase','fase_atual','fase atual','status processo','status'],
    data: ['data_etapa_atual','data etapa','data','created_at','criado_em','data abertura','abertura','última movimentação','ultima movimentacao'],
    modalidade: ['modalidade','oferta_modalidade'],
    ensino: ['ensino','nivel_oferta','nível oferta','oferta_nivel','nível','nivel'],
    prioridade: ['prioridade'],
    tecnico: ['tecnico','técnico','tecnico_responsavel','técnico responsável','responsavel','responsável','digitador','analista']
  };
  function keys(row){ return Object.keys(row||{}); }
  function getCell(row, aliases){
    const ks = keys(row); const targets = aliases.map(clean).filter(Boolean);
    let k = ks.find(x => targets.includes(clean(x)));
    if(!k) k = ks.find(x => targets.some(a => clean(x).includes(a) || a.includes(clean(x))));
    return k ? txt(row[k]) : '';
  }
  function firstLine(v){ return txt(v).split(/\r?\n|\|/).map(s=>txt(s)).filter(Boolean)[0] || txt(v); }
  function secondLine(v){ const a=txt(v).split(/\r?\n|\|/).map(s=>txt(s)).filter(Boolean); return a[1] || ''; }
  function blank(row){ return !Object.values(row||{}).some(v => txt(v)); }
  function normalizarEtapa(v){
    const e=upper(v); if(e.includes('ANAL')) return 'Análise'; if(e.includes('PEND')) return 'Pendência'; if(e.includes('DIGIT')) return 'Digitação'; if(e.includes('CONFER')) return 'Conferência'; if(e.includes('ASSIN')) return 'Assinatura'; if(e.includes('DEFER')) return 'Deferido'; if(e.includes('AGUARD')) return 'Aguardando Retirada'; if(e.includes('RETIR')) return 'Retirado'; return 'Desarquivamento';
  }
  function linhaEscola(row, aba){
    if(blank(row)) return false; const a=upper(aba); const mec=!!getCell(row,ALIAS.mec); const esc=!!getCell(row,ALIAS.escola); const aluno=!!getCell(row,ALIAS.aluno);
    if(a.includes('ESCOLA')||a.includes('ACERVO')||a.includes('CATALOGO')||a.includes('CATÁLOGO')) return esc || mec;
    return (mec && esc && !aluno);
  }
  function linhaProcesso(row, aba){
    if(blank(row)) return false; const a=upper(aba); const aluno=getCell(row,ALIAS.aluno); const etapa=getCell(row,ALIAS.etapa); const inst=getCell(row,ALIAS.escola) || getCell(row,['instituição / nte','instituicao / nte']);
    if(a.includes('PROCESS')||a.includes('FLUXO')||a.includes('SOLICIT')||a.includes('DASH')) return !!(aluno || etapa || inst);
    return !!aluno && !!(inst || etapa || getCell(row,ALIAS.documento));
  }
  function converterEscola(row){
    const campoNteDep=getCell(row,['nte / dep. adm','nte dep adm','nte/dependencia','nte dependencia']);
    const nteRaw = getCell(row,ALIAS.nte) || firstLine(campoNteDep) || getCell(row,ALIAS.nteId) || 'NTE-26 Salvador';
    const nteId = nteNumero(getCell(row,ALIAS.nteId) || nteRaw) || 26;
    const dep = getCell(row,ALIAS.dependencia) || secondLine(campoNteDep) || 'Estadual';
    const nome = getCell(row,ALIAS.escola);
    return { id:null, cod_mec:txt(getCell(row,ALIAS.mec)), nome:title(nome), nome_escola:title(nome), municipio:title(getCell(row,ALIAS.municipio)||'NÃO INFORMADO'), nte:nteNome(nteRaw||nteId), nte_id:nteId, dependencia:txt(dep), dependencia_adm:txt(dep), situacao:txt(getCell(row,ALIAS.situacao)||'Extinta'), situacao_funcional:txt(getCell(row,ALIAS.situacao)||'Extinta'), acervo:txt(getCell(row,ALIAS.acervo)||'Recolhido'), status_acervo:txt(getCell(row,ALIAS.acervo)||'Recolhido'), local_acervo:txt(getCell(row,ALIAS.localAcervo)||'Acervo do NTE'), ativo:true };
  }
  function converterProcesso(row){
    const alunoDoc=getCell(row,['aluno / doc','aluno/doc','aluno - doc']); const instNte=getCell(row,['instituição / nte','instituicao / nte','instituição/nte','instituicao/nte']);
    const aluno=getCell(row,ALIAS.aluno)||firstLine(alunoDoc); const escolaNome=getCell(row,['escola_nome','nome_escola','nome da escola','instituição','instituicao','escola'])||firstLine(instNte)||'NÃO INFORMADA';
    const cod=getCell(row,ALIAS.mec); let esc=null; try{ esc=(escolasDB||[]).find(e=>txt(e.cod_mec)===txt(cod)||upper(e.nome||e.nome_escola)===upper(escolaNome)); }catch(e){}
    let nte=getCell(row,ALIAS.nte)||secondLine(instNte)||(esc&&esc.nte)||nteUsuario(window.usuarioLogado)||'NTE-26 Salvador';
    return { id:Number(getCell(row,['id','processo','codigo processo','código processo','nº processo','n processo']))||null, aluno:title(aluno), aluno_nome:title(aluno), escola:title(escolaNome), escola_nome:title(escolaNome), documento:txt(getCell(row,ALIAS.documento)||secondLine(alunoDoc)||'HISTÓRICO'), documento_tipo:txt(getCell(row,ALIAS.documento)||secondLine(alunoDoc)||'HISTÓRICO'), etapa:normalizarEtapa(getCell(row,ALIAS.etapa)), etapa_atual:normalizarEtapa(getCell(row,ALIAS.etapa)), data_etapa_atual:txt(getCell(row,ALIAS.data)|| (typeof obterDataAtualFormatada==='function'?obterDataAtualFormatada():new Date().toLocaleDateString('pt-BR'))), nte:nteNome(nte), municipio:title(getCell(row,ALIAS.municipio)||(esc&&esc.municipio)||''), modalidade:txt(getCell(row,ALIAS.modalidade)||''), ensino:txt(getCell(row,ALIAS.ensino)||''), prioridade:txt(getCell(row,ALIAS.prioridade)||''), tecnico_responsavel:txt(getCell(row,ALIAS.tecnico)||'') };
  }
  async function gravarImportacao(escolasAlteradas, processosAlterados){
    const erros=[];
    if(escolasAlteradas.length){
      const payload=escolasAlteradas.map(e=>({ cod_mec:txt(e.cod_mec), nome_escola:title(e.nome||e.nome_escola), municipio:title(e.municipio||'NÃO INFORMADO'), nte_id:Number(e.nte_id||nteNumero(e.nte)||26), dependencia_adm:txt(e.dependencia||e.dependencia_adm||'Estadual'), situacao_funcional:txt(e.situacao||e.situacao_funcional||'Extinta'), acervo:txt(e.acervo||'Recolhido'), status_acervo:txt(e.status_acervo||e.acervo||'Recolhido'), local_acervo:txt(e.local_acervo||'Acervo do NTE'), ativo:true })).filter(e=>e.cod_mec && e.nome_escola);
      const r=await upsertTabela('escolas_sigee', payload, 'cod_mec'); if(r.error) erros.push('escolas_sigee: '+(r.error.message||JSON.stringify(r.error)));
    }
    if(processosAlterados.length){
      let prox=nextId(processosDB,101);
      const payload=processosAlterados.map(p=>{ if(!p.id) p.id=prox++; return { id:Number(p.id), aluno_nome:title(p.aluno||p.aluno_nome), escola_nome:title(p.escola||p.escola_nome||'NÃO INFORMADA'), documento_tipo:txt(p.documento||p.documento_tipo||'HISTÓRICO'), nivel_oferta:txt(p.nivel_oferta||p.ensino||'')||null, modalidade:txt(p.modalidade||'')||null, etapa_atual:normalizarEtapa(p.etapa||p.etapa_atual), nte:nteNome(p.nte||'NTE-26 Salvador') }; }).filter(p=>p.id&&p.aluno_nome);
      const r=await upsertTabela('processos', payload, 'id'); if(r.error) erros.push('processos: '+(r.error.message||JSON.stringify(r.error)));
    }
    return erros;
  }
  window.processarImportacaoOtimizada = async function(event){
    const u=window.usuarioLogado || (typeof usuarioLogado!=='undefined'?usuarioLogado:null);
    if(!podeImportar(u)){ alert('Importação permitida apenas para Master, Administrador ou Grupo SEC.'); if(event?.target) event.target.value=''; return; }
    const arq=event?.target?.files?.[0]; if(!arq) return;
    const card=document.getElementById('card-progresso-importacao'), label=document.getElementById('label-status-importacao'), barra=document.getElementById('barra-progresso-importacao'), pct=document.getElementById('percentual-importacao-texto');
    const prog=(n,m)=>{ if(card) card.classList.remove('hidden'); if(label) label.innerText=m; if(barra) barra.style.width=n+'%'; if(pct) pct.innerText=n+'%'; };
    try{
      prog(5,'Lendo planilha...');
      const wb=XLSX.read(await arq.arrayBuffer(), {type:'array', cellDates:true});
      const escL=[], procL=[]; let linhas=0;
      wb.SheetNames.forEach(aba=>{ const rows=XLSX.utils.sheet_to_json(wb.Sheets[aba], {defval:'', raw:false}); linhas+=rows.length; rows.forEach(row=>{ if(linhaEscola(row,aba)) escL.push(converterEscola(row)); if(linhaProcesso(row,aba)) procL.push(converterProcesso(row)); }); });
      prog(30,`Identificado: ${escL.length} escolas e ${procL.length} processos em ${linhas} linhas.`);
      const escAlt=[], procAlt=[]; let insE=0,atuE=0,insP=0,atuP=0;
      escL.forEach(e=>{ if(!e.nome) return; if(!e.cod_mec) e.cod_mec = 'SEM-MEC-' + clean(e.nome).slice(0,30); const idx=(escolasDB||[]).findIndex(x=>txt(x.cod_mec)===txt(e.cod_mec)); if(idx>=0){ escolasDB[idx]={...escolasDB[idx],...e,id:escolasDB[idx].id}; escAlt.push(escolasDB[idx]); atuE++; } else { e.id=nextId(escolasDB,1); escolasDB.push(e); escAlt.push(e); insE++; } });
      procL.forEach(p=>{ if(!p.aluno) return; const idx=p.id ? (processosDB||[]).findIndex(x=>Number(x.id)===Number(p.id)) : -1; if(idx>=0){ processosDB[idx]={...processosDB[idx],...p,id:processosDB[idx].id}; procAlt.push(processosDB[idx]); atuP++; } else { p.id=nextId(processosDB,101); processosDB.push(p); procAlt.push(p); insP++; } });
      prog(65,'Gravando no Supabase...'); const erros=await gravarImportacao(escAlt,procAlt);
      prog(90,'Atualizando Dashboard, Escolas e Processos...');
      try{ renderizarListaEscolasBufferMemoria(); }catch(e){} try{ carregarEContarProcessosHorizontais(); }catch(e){} try{ carregarDadosDashboardReal(); }catch(e){} try{ registrarLog(`Importação V37: escolas +${insE}/atualizadas ${atuE}; processos +${insP}/atualizados ${atuP}.`); }catch(e){}
      prog(100,'Importação concluída.');
      if(erros.length) alert(`Importação concluída na tela, mas o Supabase recusou parte dos dados:\n\n${erros.join('\n')}\n\nEscolas lidas: ${escL.length}. Processos lidos: ${procL.length}.`);
      else alert(`Importação concluída e gravada no Supabase.\n\nEscolas: ${insE} inseridas, ${atuE} atualizadas.\nProcessos: ${insP} inseridos, ${atuP} atualizados.\nDashboard atualizado automaticamente.`);
    }catch(e){ console.error(e); alert('Erro na importação: '+(e.message||e)); }
    finally{ setTimeout(()=>{ if(card) card.classList.add('hidden'); if(event?.target) event.target.value=''; },900); }
  };
  try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}

  const oldLogin = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(oldLogin){
    window.handleLogin = function(event){
      garantirPerfilSEC();
      const r = oldLogin.call(this,event);
      setTimeout(()=>{ aplicarPermissoesV37(); try{ if(typeof carregarDadosDashboardReal==='function') carregarDadosDashboardReal(); }catch(e){} },250);
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){ garantirPerfilSEC(); garantirModalEscolaV37(); setTimeout(aplicarPermissoesV37,500); });
  setTimeout(function(){ garantirPerfilSEC(); garantirModalEscolaV37(); aplicarPermissoesV37(); },1200);
  window.SIGEE_V37 = { versao: SIGEE_V37, isSEC, isGlobal, podeImportar, podeEditarEscola, preencherSelectTecnicosPorNte: window.preencherSelectTecnicosPorNte };
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';
  const V='V38 - Carregamento Escolas/Processos/Dashboard';
  const URL='https://ckxbvsfjsknbgpfpxcyy.supabase.co';
  const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreGJ2c2Zqc2tuYmdwZnB4Y3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc4MjUsImV4cCI6MjA5ODc3MzgyNX0.ecJr_MYR9GPnaYMZ3V6kgeed7uGtg-vQ4THpdwAtTxk';
  const T={escolas:'escolas_sigee', processos:'processos', solicitacoes:'solicitacoes_sigee', usuarios:'usuarios_sigee', ntes:'ntes_sigee'};
  let carregando=false;

  function txt(v){ return (v===undefined||v===null)?'':String(v).trim(); }
  function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function title(v){ return txt(v).replace(/\s+/g,' ').trim().toUpperCase(); }
  function perfil(u){ return up(u&&u.perfil); }
  function isMaster(u){ return perfil(u).includes('MASTER'); }
  function isAdmin(u){ return perfil(u).includes('ADMIN'); }
  function isSEC(u){ return !!u && (up(u.perfil).includes('SEC') || up(u.grupo).includes('SEC') || up(u.nte).includes('SEC') || up(u.nte).includes('TODOS OS NTES') || txt(u.email).toLowerCase()==='sec@enova.educacao.ba.gov.br'); }
  function isGlobal(u){ return isMaster(u)||isSEC(u); }
  function podeImportar(u){ return isMaster(u)||isAdmin(u)||isSEC(u); }
  function numeroNte(v){ const m=txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i); if(m) return Number(m[1]); const n=Number(v); return Number.isFinite(n)&&n>=1&&n<=27?n:null; }
  function nomeNtePorId(id){
    const n=Number(id);
    try{ if(typeof obterNomeNtePorIdSIGEE==='function'){ const r=obterNomeNtePorIdSIGEE(n); if(r) return r; } }catch(e){}
    try{ const lista=(Array.isArray(LISTA_OFICIAL_27_NTES)?LISTA_OFICIAL_27_NTES:[]); const ach=lista.find(x=>numeroNte(x)===n); if(ach) return ach; }catch(e){}
    return n?`NTE-${String(n).padStart(2,'0')}`:'NTE-26 Salvador';
  }
  function nteNome(v){ const n=numeroNte(v); return n?nomeNtePorId(n):(txt(v)||'NTE-26 Salvador'); }
  function normNte(v){ const n=numeroNte(v); return n?'NTE'+n:up(v).replace(/[^A-Z0-9]/g,''); }
  function nteUsuario(u){ return nteNome(u&&(u.nte||u.nte_nome||u.nte_vinculado||u.grupo||u.nte_id)) || 'NTE-26 Salvador'; }
  function nteIgual(a,b){ if(!a||!b) return false; if(up(a).includes('SEC')||up(b).includes('SEC')) return true; return normNte(a)===normNte(b); }
  function atualUsuario(){ return window.usuarioLogado || (typeof usuarioLogado!=='undefined'?usuarioLogado:null); }
  function setText(id,v){ const el=document.getElementById(id); if(el) el.innerText=String(v); }
  function setInfo(msg){ const el=document.getElementById('info-quantidade-escolas-carregadas'); if(el) el.innerText=msg; }
  function dataBR(){ try{ return new Date().toLocaleDateString('pt-BR'); }catch(e){ return ''; } }
  function diasDesde(valor){
    if(!valor) return 0;
    let d=null; const s=txt(valor);
    if(/^\d{2}\/\d{2}\/\d{4}/.test(s)){ const [dd,mm,yy]=s.slice(0,10).split('/').map(Number); d=new Date(yy,mm-1,dd); }
    else d=new Date(s);
    if(!d || Number.isNaN(d.getTime())) return 0;
    const hoje=new Date(); hoje.setHours(0,0,0,0); d.setHours(0,0,0,0);
    return Math.max(0, Math.floor((hoje-d)/(86400000)));
  }
  function client(){
    try{ if(typeof obterSupabaseSIGEE==='function'){ const c=obterSupabaseSIGEE(); if(c) return c; } }catch(e){}
    const existente = window.SIGEE_SUPABASE_CLIENT || window.sigEESupabaseClient || window.supabaseClient || window.__SIGEE_V38_CLIENT;
    if(existente) return existente;
    if(window.supabase&&window.supabase.createClient){
      const novo = window.supabase.createClient(URL,KEY);
      window.SIGEE_SUPABASE_CLIENT = novo; window.sigEESupabaseClient = novo; window.supabaseClient = novo; window.__SIGEE_V38_CLIENT = novo;
      return novo;
    }
    return null;
  }
  async function readAll(table){
    const c=client(); if(!c) throw new Error('Cliente Supabase não disponível');
    let out=[], from=0, size=1000;
    while(true){
      const {data,error}=await c.from(table).select('*').range(from, from+size-1);
      if(error) throw error;
      out=out.concat(data||[]);
      if(!data || data.length<size) break;
      from += size;
    }
    return out;
  }
  async function upsert(table,payload,conflict){
    const c=client(); if(!c || !payload || !payload.length) return {error:null};
    for(let i=0;i<payload.length;i+=100){
      const {error}=await c.from(table).upsert(payload.slice(i,i+100),{onConflict:conflict,ignoreDuplicates:false});
      if(error) return {error};
    }
    return {error:null};
  }
  function mapUsuario(u,i){
    const email=txt(u.email).toLowerCase();
    let pf=txt(u.perfil||u.tipo||u.role||'Tecnico');
    if(email==='elmo.lobao@enova.educacao.ba.gov.br') pf='Master';
    if(email==='sec@enova.educacao.ba.gov.br') pf='SEC';
    return {id:Number(u.id)||i+1,nome:title(u.nome||u.name||'USUÁRIO SIGEE'),email,senha:txt(u.senha||u.password||'123')||'123',perfil:pf,nte:nteNome(u.nte||u.nte_id||u.grupo||'NTE-26 Salvador'),grupo:txt(u.grupo||''),ativo:u.ativo!==false};
  }
  function mapEscola(e,i){
    return {id:Number(e.id)||i+1,cod_mec:txt(e.cod_mec||e.codigo_mec||e.mec),nome:title(e.nome_escola||e.nome||e.instituicao||e.escola),nome_escola:title(e.nome_escola||e.nome||e.instituicao||e.escola),municipio:title(e.municipio||e.cidade||''),nte:nteNome(e.nte||e.nte_id||e.nte_nome||e.nte_vinculado),nte_id:numeroNte(e.nte_id||e.nte)||26,dependencia:txt(e.dependencia_adm||e.dependencia||'Estadual'),dependencia_adm:txt(e.dependencia_adm||e.dependencia||'Estadual'),situacao:txt(e.situacao_funcional||e.situacao||'Extinta'),situacao_funcional:txt(e.situacao_funcional||e.situacao||'Extinta'),acervo:txt(e.status_acervo||e.acervo||'Recolhido'),status_acervo:txt(e.status_acervo||e.acervo||'Recolhido'),local_acervo:txt(e.local_acervo||e.local||'')};
  }
  function mapProcesso(p,i){
    const escNome=title(p.escola_nome||p.escola||p.instituicao||p.nome_escola||'');
    let esc=null; try{ esc=(escolasDB||[]).find(e=>up(e.nome)===up(escNome)||txt(e.cod_mec)===txt(p.cod_mec)); }catch(e){}
    return {id:Number(p.id)||101+i,aluno:title(p.aluno_nome||p.aluno||p.nome_solicitante||p.nome_aluno||p.requerente),aluno_nome:title(p.aluno_nome||p.aluno||p.nome_solicitante||p.nome_aluno||p.requerente),escola:escNome || title(esc&&esc.nome) || 'NÃO INFORMADA',escola_nome:escNome || title(esc&&esc.nome) || 'NÃO INFORMADA',documento:txt(p.documento_tipo||p.documento||p.documento_solicitado||'HISTÓRICO'),documento_tipo:txt(p.documento_tipo||p.documento||p.documento_solicitado||'HISTÓRICO'),etapa:txt(p.etapa_atual||p.etapa||p.fase_atual||'Desarquivamento'),etapa_atual:txt(p.etapa_atual||p.etapa||p.fase_atual||'Desarquivamento'),data_etapa_atual:txt(p.data_etapa_atual||p.created_at||p.criado_em||dataBR()),nte:nteNome(p.nte||p.nte_id||(esc&&esc.nte)||'NTE-26 Salvador'),municipio:title(p.municipio||(esc&&esc.municipio)||''),modalidade:txt(p.modalidade||p.oferta_modalidade||''),ensino:txt(p.nivel_oferta||p.oferta_nivel||p.ensino||''),prioridade:txt(p.prioridade||''),tecnico_responsavel:txt(p.tecnico_responsavel||p.tecnico||'')};
  }
  function dadosVisiveis(lista){
    const u=atualUsuario(); if(!Array.isArray(lista)) return [];
    if(isGlobal(u)) return lista.slice();
    const n=nteUsuario(u);
    return lista.filter(x=>nteIgual(x.nte||x.nte_nome||x.nte_vinculado||x.nte_id,n));
  }
  function contarEtapa(lista,etapa){ return (lista||[]).filter(p=>up(p.etapa||p.etapa_atual)===up(etapa)).length; }
  function classeEtapa(etapa){
    const e=up(etapa); if(e.includes('ANAL')) return 'bg-purple-600 text-white'; if(e.includes('PEND')) return 'bg-red-600 text-white'; if(e.includes('DIGIT')) return 'bg-orange-500 text-white'; if(e.includes('CONFER')) return 'bg-green-600 text-white'; if(e.includes('ASSIN')) return 'bg-blue-700 text-white'; if(e.includes('DEFER')) return 'bg-emerald-600 text-white'; if(e.includes('RETIR')) return 'bg-gray-700 text-white'; return 'bg-sky-600 text-white';
  }
  function acaoProcesso(p){
    const e=up(p.etapa); if(e.includes('ANAL')) return `<button onclick="abrirModalFluxoAnalise(${p.id})" class="bg-purple-700 text-white font-bold px-2 py-1 rounded text-[10px]">Análise Realizada</button>`;
    if(e.includes('PEND')) return `<button onclick="abrirModalFluxoPendencia(${p.id})" class="bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px]">Tratar Pendência</button>`;
    if(e.includes('DIGIT')) return `<button onclick="abrirModalFluxoDigitacao(${p.id})" class="bg-orange-600 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Digitado</button>`;
    if(e.includes('CONFER')) return `<button onclick="abrirModalFluxoConferencia(${p.id})" class="bg-green-700 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Conferido</button>`;
    if(e.includes('ASSIN')) return `<button onclick="abrirModalFluxoAssinatura(${p.id})" class="bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px]">Deferido</button>`;
    if(e.includes('AGUARD')) return `<button onclick="abrirModalFluxoAguardando(${p.id})" class="bg-gray-700 text-white font-bold px-2 py-1 rounded text-[10px]">Retirado</button>`;
    if(e.includes('RETIR')) return `<span class="text-gray-300 font-bold">Finalizado</span>`;
    return `<button onclick="abrirModalFluxoDesarquivamento(${p.id})" class="bg-sky-700 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Recebido</button>`;
  }
  window.carregarDadosDashboardReal = function(){
    const escolas=dadosVisiveis(window.escolasDB||escolasDB||[]); const procs=dadosVisiveis(window.processosDB||processosDB||[]);
    setText('dash-escolas',escolas.length); setText('dash-acervos',escolas.filter(e=>up(e.status_acervo||e.acervo).includes('RECOLHIDO')).length); setText('dash-estaduais',escolas.filter(e=>up(e.dependencia||e.dependencia_adm).includes('ESTAD')).length); setText('dash-municipios',new Set(escolas.map(e=>up(e.municipio)).filter(Boolean)).size); setText('dash-usuarios',(window.usuariosDB||usuariosDB||[]).length);
    setText('dash-proc-desarquivamento',contarEtapa(procs,'Desarquivamento')); setText('dash-proc-analise',contarEtapa(procs,'Análise')); setText('dash-proc-pendencia',contarEtapa(procs,'Pendência')); setText('dash-proc-digitacao',contarEtapa(procs,'Digitação')); setText('dash-proc-conferencia',contarEtapa(procs,'Conferência')); setText('dash-proc-assinatura',contarEtapa(procs,'Assinatura')); setText('dash-proc-aguardando',contarEtapa(procs,'Aguardando Retirada')); setText('dash-proc-retirado',contarEtapa(procs,'Retirado'));
  };
  try{ carregarDadosDashboardReal=window.carregarDadosDashboardReal; }catch(e){}
  window.renderizarListaEscolasBufferMemoria = function(){
    const corpo=document.getElementById('tabela-escolas-corpo'); if(!corpo) return; corpo.innerHTML='';
    const lista=dadosVisiveis(window.escolasDB||escolasDB||[]); const busca=up(document.getElementById('busca-escola')?.value||'');
    let filtradas=busca?lista.filter(e=>up((e.cod_mec||'')+' '+(e.nome||'')+' '+(e.municipio||'')).includes(busca)):lista;
    const porPagina=(typeof totalPorPaginaEscola!=='undefined'?totalPorPaginaEscola:8); let pagina=(typeof paginaEscolaAtual!=='undefined'?paginaEscolaAtual:1); const totalPag=Math.max(1,Math.ceil(filtradas.length/porPagina)); if(pagina>totalPag) pagina=1; try{ paginaEscolaAtual=pagina; }catch(e){}
    const pag=filtradas.slice((pagina-1)*porPagina,(pagina-1)*porPagina+porPagina);
    setInfo(`Exibindo: ${filtradas.length} registros | Banco: Supabase carregado`);
    pag.forEach(e=>{
      const situ=up(e.situacao||e.situacao_funcional).includes('ATIVA')?'<span class="font-black text-green-400">ATIVA</span>':'<span class="font-black text-red-400">EXTINTA</span>';
      const acv=up(e.status_acervo||e.acervo).includes('RECOLHIDO')?'<span class="font-black text-green-400">RECOLHIDO</span>':'<span class="font-black text-red-400">NÃO RECOLHIDO</span>';
      corpo.insertAdjacentHTML('beforeend',`<tr class="hover:bg-white/10 text-[11px] text-white"><td class="p-3 font-mono font-bold">${txt(e.cod_mec)}</td><td class="p-3 font-bold uppercase">${txt(e.nome)}</td><td class="p-3 uppercase font-medium">${txt(e.municipio)}</td><td class="p-3 font-semibold">${txt(e.nte)}<br><span class="text-[9px] bg-white/10 px-1 rounded">${txt(e.dependencia||e.dependencia_adm)}</span></td><td class="p-3">${situ}</td><td class="p-3">${acv}</td><td class="p-3 text-center"><button onclick="abrirModalEditarEscolaV37 ? abrirModalEditarEscolaV37('${e.id}') : abrirModalEscola && abrirModalEscola('${e.id}')" class="bg-cyan-600/70 text-white font-bold px-2 py-1 rounded text-[10px]">Alterar</button></td></tr>`);
    });
    setText('txt-escola-paginacao',`Página ${pagina} de ${totalPag}`); const a=document.getElementById('btn-escola-anterior'); if(a) a.disabled=pagina<=1; const p=document.getElementById('btn-escola-proxima'); if(p) p.disabled=pagina>=totalPag;
  };
  try{ renderizarListaEscolasBufferMemoria=window.renderizarListaEscolasBufferMemoria; }catch(e){}
  window.carregarEContarProcessosHorizontais = function(){
    const procs=dadosVisiveis(window.processosDB||processosDB||[]); setText('count-horiz-todos',procs.length); setText('count-horiz-desarquivamento',contarEtapa(procs,'Desarquivamento')); setText('count-horiz-analise',contarEtapa(procs,'Análise')); setText('count-horiz-pendencia',contarEtapa(procs,'Pendência')); setText('count-horiz-digitacao',contarEtapa(procs,'Digitação')); setText('count-horiz-conferencia',contarEtapa(procs,'Conferência')); setText('count-horiz-assinatura',contarEtapa(procs,'Assinatura')); setText('count-horiz-aguardando',contarEtapa(procs,'Aguardando Retirada')); setText('count-horiz-retirado',contarEtapa(procs,'Retirado')); window.renderizarProcessosFlutuantes(); };
  try{ carregarEContarProcessosHorizontais=window.carregarEContarProcessosHorizontais; }catch(e){}
  window.renderizarProcessosFlutuantes = function(){
    const corpo=document.getElementById('tabela-processos-corpo'); if(!corpo) return; corpo.innerHTML='';
    let lista=dadosVisiveis(window.processosDB||processosDB||[]); const etapa=(typeof etapaFiltroAtual!=='undefined'?etapaFiltroAtual:'TODOS'); if(etapa&&etapa!=='TODOS') lista=lista.filter(p=>up(p.etapa)===up(etapa)); const busca=up(document.getElementById('busca-proc-nome')?.value||''); if(busca) lista=lista.filter(p=>up(p.aluno+' '+p.escola).includes(busca));
    lista.forEach(p=>{ corpo.insertAdjacentHTML('beforeend',`<tr class="hover:bg-white/10 text-white"><td class="p-2.5 font-bold truncate"><span class="block uppercase truncate">${txt(p.aluno)}</span><span class="text-[10px] text-cyan-200 font-extrabold">${txt(p.documento)}</span></td><td class="p-2.5 truncate"><span class="block font-bold text-white truncate text-[10px]">${txt(p.escola)}</span><span class="text-[9px] text-cyan-200 block font-semibold uppercase truncate">${txt(p.nte)}</span></td><td class="p-2.5 text-center"><span class="px-2 py-1 ${classeEtapa(p.etapa)} font-black rounded text-[9px] uppercase block">${txt(p.etapa)}</span></td><td class="p-2.5 text-center font-bold">${diasDesde(p.data_etapa_atual)} dias</td><td class="p-2.5 text-center">${acaoProcesso(p)}</td></tr>`); });
  };
  try{ renderizarProcessosFlutuantes=window.renderizarProcessosFlutuantes; }catch(e){}
  async function carregarTudoV38(silencioso=true){
    if(carregando) return false; carregando=true; setInfo('Carregando informações do Supabase, aguarde...');
    try{
      const [us, es, pr, so, nt]=await Promise.allSettled([readAll(T.usuarios),readAll(T.escolas),readAll(T.processos),readAll(T.solicitacoes),readAll(T.ntes)]);
      if(us.status==='fulfilled' && us.value.length){ usuariosDB=us.value.map(mapUsuario).filter(u=>u.email); window.usuariosDB=usuariosDB; }
      if(!usuariosDB.some(u=>txt(u.email).toLowerCase()==='sec@enova.educacao.ba.gov.br')) usuariosDB.push({id:900001,nome:'USUÁRIO SEC',email:'sec@enova.educacao.ba.gov.br',senha:'123',perfil:'SEC',nte:'SEC - TODOS OS NTEs',grupo:'SEC',ativo:true});
      if(es.status==='fulfilled'){ escolasDB=es.value.map(mapEscola).filter(e=>e.cod_mec||e.nome); window.escolasDB=escolasDB; }
      if(pr.status==='fulfilled'){ processosDB=pr.value.map(mapProcesso).filter(p=>p.aluno||p.escola); window.processosDB=processosDB; }
      if(so.status==='fulfilled'){ solicitacoesDB=so.value.map(mapProcesso).filter(p=>p.aluno||p.escola); window.solicitacoesDB=solicitacoesDB; if(!processosDB.length && solicitacoesDB.length){ processosDB=solicitacoesDB.slice(); window.processosDB=processosDB; } }
      if(nt.status==='fulfilled' && nt.value.length && typeof LISTA_OFICIAL_27_NTES!=='undefined'){
        const ntes=nt.value.map(n=>txt(n.nome||n.nte||n.codigo||n.descricao)).filter(Boolean); if(ntes.length){ LISTA_OFICIAL_27_NTES.splice(0,LISTA_OFICIAL_27_NTES.length,...ntes); }
      }
      try{ inicializarSelectsNteEcosystem(); }catch(e){}
      try{ window.aplicarPermissoesV37&&window.aplicarPermissoesV37(); }catch(e){}
      window.sigEESupabaseOnline=true; try{ sigEESupabaseOnline=true; }catch(e){}
      window.carregarDadosDashboardReal(); window.renderizarListaEscolasBufferMemoria(); window.carregarEContarProcessosHorizontais();
      setInfo(`Exibindo: ${dadosVisiveis(escolasDB).length} registros | Banco: Supabase carregado`);
      return true;
    }catch(err){ console.error('SIGEE V38 erro geral:',err); if(!silencioso) alert('Erro ao carregar dados do Supabase: '+(err.message||err)); return false; }
    finally{ carregando=false; }
  }
  // Carregamento leve para a abertura do sistema.
  // Não baixa o catálogo completo de escolas (mais de 40 mil registros).
  // As escolas continuam sendo consultadas sob demanda pelo módulo escolas.js.
  async function carregarEssencialV38(silencioso=true){
    if(carregando) return false;
    carregando=true;
    try{
      const [pr, so, nt] = await Promise.allSettled([
        readAll(T.processos),
        readAll(T.solicitacoes),
        readAll(T.ntes)
      ]);

      if(pr.status==='fulfilled'){
        processosDB=pr.value.map(mapProcesso).filter(p=>p.aluno||p.escola);
        window.processosDB=processosDB;
      }
      if(so.status==='fulfilled'){
        solicitacoesDB=so.value.map(mapProcesso).filter(p=>p.aluno||p.escola);
        window.solicitacoesDB=solicitacoesDB;
        if(!processosDB.length && solicitacoesDB.length){
          processosDB=solicitacoesDB.slice();
          window.processosDB=processosDB;
        }
      }
      if(nt.status==='fulfilled' && nt.value.length && typeof LISTA_OFICIAL_27_NTES!=='undefined'){
        const ntes=nt.value.map(n=>txt(n.nome||n.nte||n.codigo||n.descricao)).filter(Boolean);
        if(ntes.length) LISTA_OFICIAL_27_NTES.splice(0,LISTA_OFICIAL_27_NTES.length,...ntes);
      }

      try{ inicializarSelectsNteEcosystem(); }catch(e){}
      try{ window.aplicarPermissoesV37&&window.aplicarPermissoesV37(); }catch(e){}
      window.sigEESupabaseOnline=true;
      try{ sigEESupabaseOnline=true; }catch(e){}
      try{ window.carregarEContarProcessosHorizontais(); }catch(e){}
      return true;
    }catch(err){
      console.error('[SIGEE] Erro no carregamento essencial:',err);
      if(!silencioso) alert('Erro ao carregar os processos: '+(err.message||err));
      return false;
    }finally{
      carregando=false;
    }
  }

  window.SIGEE_V38_CARREGAR_BANCOS = carregarTudoV38;
  window.SIGEE_CARREGAR_ESSENCIAL = carregarEssencialV38;
  const oldLogin=window.handleLogin;
  window.handleLogin = async function(event){
    if(event) event.preventDefault();
    try{ await Promise.race([readAll(T.usuarios).then(rows=>{ if(rows&&rows.length){ usuariosDB=rows.map(mapUsuario).filter(u=>u.email); window.usuariosDB=usuariosDB; }}), new Promise(r=>setTimeout(r,1200))]); }catch(e){}
    if(!usuariosDB.some(u=>txt(u.email).toLowerCase()==='sec@enova.educacao.ba.gov.br')) usuariosDB.push({id:900001,nome:'USUÁRIO SEC',email:'sec@enova.educacao.ba.gov.br',senha:'123',perfil:'SEC',nte:'SEC - TODOS OS NTEs',grupo:'SEC',ativo:true});
    const em=txt(document.getElementById('login-email')?.value).toLowerCase(); const sn=txt(document.getElementById('login-senha')?.value);
    let u=(usuariosDB||[]).map(mapUsuario).find(x=>x.email===em && txt(x.senha||'123')===sn && x.ativo!==false);
    if(!u && em==='elmo.lobao@enova.educacao.ba.gov.br' && sn==='123') u={id:1,nome:'ELMO LOBÃO',email:em,senha:'123',perfil:'Master',nte:'NTE-26 Salvador',ativo:true};
    if(!u){ alert('Credenciais inválidas, ou operador desativado no escopo regional.'); return; }
    window.usuarioLogado=u; try{ usuarioLogado=u; }catch(e){}
    document.getElementById('tela-login')?.classList.add('hidden'); document.getElementById('sistema-dashboard')?.classList.remove('hidden');
    setText('user-nome',u.nome); setText('user-perfil',`${u.perfil} | ${u.nte}`);
    try{ registrarLog('Acesso realizado ao painel operacional.'); }catch(e){}
    try{ window.aplicarPermissoesV37&&window.aplicarPermissoesV37(); }catch(e){}
    try{ navegar('painel'); }catch(e){}
    setTimeout(()=>carregarEssencialV38(true),50);
  };
  try{ handleLogin=window.handleLogin; }catch(e){}
  const oldNav=window.navegar;
  if(oldNav){ window.navegar=function(aba){ const r=oldNav.apply(this,arguments); setTimeout(()=>{ if(aba==='painel') window.carregarDadosDashboardReal(); if(aba==='escolas') window.renderizarListaEscolasBufferMemoria(); if(aba==='processos') window.carregarEContarProcessosHorizontais(); },30); return r; }; try{ navegar=window.navegar; }catch(e){} }

  // Importação final: identifica escolas e processos em qualquer aba da planilha.
  function getCell(row,names){ const ks=Object.keys(row||{}); for(const n of names){ const nn=up(n); const k=ks.find(x=>up(x)===nn || up(x).includes(nn)); if(k && txt(row[k])) return row[k]; } return ''; }
  function linhaVazia(row){ return !Object.values(row||{}).some(v=>txt(v)); }
  function etapa(v){ const e=up(v); if(e.includes('ANAL')) return 'Análise'; if(e.includes('PEND')) return 'Pendência'; if(e.includes('DIGIT')) return 'Digitação'; if(e.includes('CONFER')) return 'Conferência'; if(e.includes('ASSIN')) return 'Assinatura'; if(e.includes('DEFER')) return 'Deferido'; if(e.includes('AGUARD')) return 'Aguardando Retirada'; if(e.includes('RETIR')) return 'Retirado'; return 'Desarquivamento'; }
  window.processarImportacaoOtimizada = async function(event){
    const u=atualUsuario(); if(!podeImportar(u)){ alert('Importação permitida apenas para Master, Administrador ou Grupo SEC.'); if(event?.target) event.target.value=''; return; }
    const arq=event?.target?.files?.[0]; if(!arq) return; const card=document.getElementById('card-progresso-importacao'); const label=document.getElementById('label-status-importacao'); const bar=document.getElementById('barra-progresso-importacao'); const pct=document.getElementById('percentual-importacao-texto');
    const prog=(n,m)=>{ if(card) card.classList.remove('hidden'); if(label) label.innerText=m; if(bar) bar.style.width=n+'%'; if(pct) pct.innerText=n+'%'; };
    try{
      prog(5,'Lendo planilha...'); const wb=XLSX.read(await arq.arrayBuffer(),{type:'array',cellDates:true}); let escolas=[],procs=[];
      wb.SheetNames.forEach(aba=>{ const rows=XLSX.utils.sheet_to_json(wb.Sheets[aba],{defval:'',raw:false}); rows.forEach(row=>{ if(linhaVazia(row)) return; const mec=getCell(row,['cod_mec','código mec','codigo mec','mec']); const escola=getCell(row,['nome_escola','nome da escola','instituição','instituicao','escola','instituição / nte']); const aluno=getCell(row,['aluno_nome','nome completo do aluno','nome do aluno','aluno','requerente','nome_solicitante','aluno / doc']); const mun=getCell(row,['municipio','município','cidade']); if((mec||escola) && !aluno){ escolas.push(mapEscola({cod_mec:mec,nome_escola:escola,municipio:mun||'NÃO INFORMADO',nte:getCell(row,['nte','nte_id','nte / dep. adm'])||nteUsuario(u),dependencia_adm:getCell(row,['dependencia_adm','dependência administrativa','dep. adm','dependência','dependencia'])||'Estadual',situacao_funcional:getCell(row,['situacao_funcional','situação funcional','situação','situacao'])||'Extinta',status_acervo:getCell(row,['status_acervo','status do acervo','acervo'])||'Recolhido',local_acervo:getCell(row,['local_acervo','local do acervo'])||'Acervo do NTE'},0)); } if(aluno){ procs.push(mapProcesso({aluno_nome:aluno,escola_nome:escola,documento_tipo:getCell(row,['documento_tipo','tipo de documento','documento','documento_solicitado'])||'HISTÓRICO',etapa_atual:etapa(getCell(row,['etapa_atual','etapa','fase_atual','status'])),created_at:getCell(row,['created_at','data','criado_em','data abertura'])||dataBR(),nte:getCell(row,['nte','nte_id'])||nteUsuario(u),municipio:mun,modalidade:getCell(row,['modalidade','oferta_modalidade']),nivel_oferta:getCell(row,['ensino','nivel_oferta','oferta_nivel'])},0)); } }); });
      prog(35,`Identificadas ${escolas.length} escolas e ${procs.length} processos.`);
      // merge local
      escolas.forEach(e=>{ if(!e.cod_mec) e.cod_mec='SEM-MEC-'+up(e.nome).slice(0,30); const i=(escolasDB||[]).findIndex(x=>txt(x.cod_mec)===txt(e.cod_mec)); if(i>=0) escolasDB[i]={...escolasDB[i],...e}; else {e.id=Math.max(0,...(escolasDB||[]).map(x=>Number(x.id)||0))+1; escolasDB.push(e);} });
      procs.forEach(p=>{ p.id=Math.max(100,...(processosDB||[]).map(x=>Number(x.id)||0))+1; processosDB.push(p); }); window.escolasDB=escolasDB; window.processosDB=processosDB;
      prog(65,'Gravando no Supabase...');
      const payE=escolas.map(e=>({cod_mec:txt(e.cod_mec),nome_escola:title(e.nome),municipio:title(e.municipio||'NÃO INFORMADO'),nte_id:numeroNte(e.nte_id||e.nte)||26,dependencia_adm:txt(e.dependencia_adm||e.dependencia||'Estadual'),situacao_funcional:txt(e.situacao_funcional||e.situacao||'Extinta'),acervo:txt(e.acervo||'Recolhido'),status_acervo:txt(e.status_acervo||e.acervo||'Recolhido'),local_acervo:txt(e.local_acervo||'Acervo do NTE'),ativo:true})).filter(e=>e.cod_mec&&e.nome_escola);
      const payP=procs.map(p=>({id:Number(p.id),aluno_nome:title(p.aluno),escola_nome:title(p.escola),documento_tipo:txt(p.documento||'HISTÓRICO'),nivel_oferta:txt(p.ensino||'')||null,modalidade:txt(p.modalidade||'')||null,etapa_atual:txt(p.etapa||'Desarquivamento'),nte:nteNome(p.nte)})).filter(p=>p.id&&p.aluno_nome);
      const er=[]; const r1=await upsert(T.escolas,payE,'cod_mec'); if(r1.error) er.push('escolas_sigee: '+r1.error.message); const r2=await upsert(T.processos,payP,'id'); if(r2.error) er.push('processos: '+r2.error.message);
      prog(90,'Atualizando telas...'); window.carregarDadosDashboardReal(); window.renderizarListaEscolasBufferMemoria(); window.carregarEContarProcessosHorizontais(); prog(100,'Concluído.');
      alert(er.length?`Importação concluída na tela, mas houve erro no Supabase:\n${er.join('\n')}`:`Importação concluída.\nEscolas: ${payE.length}\nProcessos: ${payP.length}\nDashboard atualizado.`);
    }catch(e){ console.error(e); alert('Erro na importação: '+(e.message||e)); }
    finally{ setTimeout(()=>{ if(card) card.classList.add('hidden'); if(event?.target) event.target.value=''; },800); }
  };
  try{ processarImportacaoOtimizada=window.processarImportacaoOtimizada; }catch(e){}
  // O carregamento completo foi removido da abertura da página.
  // Isso evita baixar todo o catálogo de escolas antes mesmo do login.
  window.SIGEE_V38={versao:V,carregar:carregarTudoV38};
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';
  const EMAIL_SEC_V39 = 'sec@enova.educacao.ba.gov.br';

  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return sem(v).toUpperCase(); }
  function low(v){ return txt(v).toLowerCase(); }

  function perfilCanonicoV39(valor){
    const p = up(valor);
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMINISTR')) return 'Administrador';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('TECNIC') || p.includes('TÉCNIC')) return 'Tecnico';
    return txt(valor) || 'Tecnico';
  }

  function perfilUsuarioV39(u){ return perfilCanonicoV39(u && (u.perfil || u.tipo || u.role)); }
  function isSECV39(u){ return !!u && (low(u.email)===EMAIL_SEC_V39 || perfilUsuarioV39(u)==='SEC' || up(u.grupo).includes('SEC') || up(u.nte).includes('SEC') || up(u.nte).includes('TODOS OS NTES')); }
  function isMasterV39(u){ return perfilUsuarioV39(u)==='Master'; }
  function isAdminV39(u){ return perfilUsuarioV39(u)==='Administrador'; }
  function isTecnicoV39(u){ return perfilUsuarioV39(u)==='Tecnico'; }
  function isConsultaV39(u){ return perfilUsuarioV39(u)==='Consulta'; }
  function isGlobalV39(u){ return isSECV39(u) || isMasterV39(u); }
  function podeImportarV39(u){ return isGlobalV39(u) || isAdminV39(u); }
  function podeEditarEscolaV39(u){ return isGlobalV39(u) || isAdminV39(u) || isTecnicoV39(u); }
  function podeExportarV39(u){ return isGlobalV39(u) || isAdminV39(u); }
  function podeMovimentarV39(u){ return isGlobalV39(u) || isAdminV39(u) || isTecnicoV39(u); }
  function podeGerirUsuariosV39(u){ return isGlobalV39(u); }
  function podeVerLogsV39(u){ return isGlobalV39(u) || isAdminV39(u); }

  function usuarioAtualV39(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }

  function normalizarUsuarioV39(u){
    if(!u) return u;
    if(low(u.email) === EMAIL_SEC_V39){
      u.nome = u.nome || 'USUÁRIO SEC';
      u.perfil = 'SEC';
      u.grupo = 'SEC';
      u.nte = 'SEC - TODOS OS NTEs';
      u.ativo = u.ativo !== false;
      u.senha = u.senha || '123';
      return u;
    }
    if(low(u.email) === 'elmo.lobao@enova.educacao.ba.gov.br') u.perfil = 'Master';
    else u.perfil = perfilCanonicoV39(u.perfil || 'Tecnico');
    u.nte = u.nte || u.nte_vinculado || u.grupo || 'NTE-26 Salvador';
    u.senha = u.senha || '123';
    u.ativo = u.ativo !== false;
    return u;
  }

  function garantirUsuariosBaseV39(){
    try{
      window.usuariosDB = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);
      try{ usuariosDB = window.usuariosDB; }catch(e){}
      const existe = email => window.usuariosDB.some(u => low(u.email)===low(email));
      const nextId = base => Math.max(base, 0, ...window.usuariosDB.map(u=>Number(u.id)||0)) + 1;
      if(!existe(EMAIL_SEC_V39)) window.usuariosDB.push({id:nextId(900000), nome:'USUÁRIO SEC', email:EMAIL_SEC_V39, senha:'123', perfil:'SEC', grupo:'SEC', nte:'SEC - TODOS OS NTEs', ativo:true});
      if(!existe('administrativo@enova.educacao.ba.gov.br')) window.usuariosDB.push({id:nextId(910000), nome:'USUÁRIO ADMINISTRADOR', email:'administrativo@enova.educacao.ba.gov.br', senha:'123', perfil:'Administrador', nte:'NTE-26 Salvador', ativo:true});
      if(!existe('consulta@enova.educacao.ba.gov.br')) window.usuariosDB.push({id:nextId(920000), nome:'USUÁRIO CONSULTA', email:'consulta@enova.educacao.ba.gov.br', senha:'123', perfil:'Consulta', nte:'NTE-26 Salvador', ativo:true});
      window.usuariosDB.forEach(normalizarUsuarioV39);
    }catch(e){ console.warn('SIGEE V39: não foi possível garantir usuários base.', e); }
  }

  function atualizarSelectPerfilV39(){
    const select = document.getElementById('user-form-perfil');
    if(!select) return;
    const valorAtual = perfilCanonicoV39(select.value || 'Tecnico');
    const opcoes = ['SEC','Master','Administrador','Tecnico','Consulta'];
    select.innerHTML = opcoes.map(p => `<option value="${p}">${p}</option>`).join('');
    select.value = opcoes.includes(valorAtual) ? valorAtual : 'Tecnico';
  }

  function aplicarPermissoesV39(){
    garantirUsuariosBaseV39();
    const u = normalizarUsuarioV39(usuarioAtualV39());
    if(u){ window.usuarioLogado = u; try{ usuarioLogado = u; }catch(e){} }
    atualizarSelectPerfilV39();

    const importar = podeImportarV39(u);
    const editarEscola = podeEditarEscolaV39(u);
    const exportar = podeExportarV39(u);
    const gerirUsuarios = podeGerirUsuariosV39(u);
    const logs = podeVerLogsV39(u);

    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !importar);
    const input = document.getElementById('input-importar-excel');
    if(input) input.disabled = !importar;
    document.querySelectorAll('.import-only,.export-only').forEach(el => el.classList.toggle('hidden', !exportar));
    document.querySelectorAll('[data-sigee-permissao="editar-escola"]').forEach(el => el.classList.toggle('hidden', !editarEscola));

    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !gerirUsuarios);
    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !logs);

    const nome = document.getElementById('user-nome');
    const pf = document.getElementById('user-perfil');
    if(u && nome) nome.innerText = u.nome || '';
    if(u && pf) pf.innerText = `${perfilUsuarioV39(u)} | ${u.nte || ''}`;
  }

  // Substitui apenas a leitura do perfil, preservando a rotina de carregamento V38.
  window.perfilCanonicoSIGEE = function(perfil){ return perfilCanonicoV39(perfil); };
  try{ perfilCanonicoSIGEE = window.perfilCanonicoSIGEE; }catch(e){}
  window.isMasterSIGEE = function(){ return isGlobalV39(usuarioAtualV39()); };
  try{ isMasterSIGEE = window.isMasterSIGEE; }catch(e){}
  window.isTecnicoRestritoSIGEE = function(){ return !isGlobalV39(usuarioAtualV39()); };
  try{ isTecnicoRestritoSIGEE = window.isTecnicoRestritoSIGEE; }catch(e){}

  // Mantém nomes usados em versões anteriores.
  window.SIGEE_PERFIS_V39 = {
    perfil: perfilUsuarioV39,
    isSEC: isSECV39,
    isMaster: isMasterV39,
    isAdmin: isAdminV39,
    isTecnico: isTecnicoV39,
    isConsulta: isConsultaV39,
    isGlobal: isGlobalV39,
    podeImportar: podeImportarV39,
    podeEditarEscola: podeEditarEscolaV39,
    podeExportar: podeExportarV39,
    podeMovimentar: podeMovimentarV39,
    podeGerirUsuarios: podeGerirUsuariosV39,
    aplicarPermissoes: aplicarPermissoesV39
  };

  // Garante que o perfil vindo do Supabase não seja convertido indevidamente para Master/Técnico.
  if(typeof window.usuarioDoSupabaseParaLocalSIGEE === 'function'){
    const antigoMapUsuario = window.usuarioDoSupabaseParaLocalSIGEE;
    window.usuarioDoSupabaseParaLocalSIGEE = function(u, indice){
      const base = antigoMapUsuario(u, indice) || {};
      base.perfil = perfilCanonicoV39(u?.perfil || u?.tipo || u?.role || base.perfil || 'Tecnico');
      if(low(base.email) === 'elmo.lobao@enova.educacao.ba.gov.br') base.perfil = 'Master';
      if(low(base.email) === EMAIL_SEC_V39) base.perfil = 'SEC';
      base.nte = base.nte || u?.nte || u?.nte_vinculado || u?.grupo || 'NTE-26 Salvador';
      return normalizarUsuarioV39(base);
    };
    try{ usuarioDoSupabaseParaLocalSIGEE = window.usuarioDoSupabaseParaLocalSIGEE; }catch(e){}
  }

  // Master/SEC veem técnicos de todos os NTEs; Admin/Técnico veem apenas o NTE vinculado.
  window.preencherSelectTecnicosPorNte = function(selectId, nteFiltro){
    garantirUsuariosBaseV39();
    const select = document.getElementById(selectId);
    if(!select) return;
    const u = usuarioAtualV39();
    const global = isGlobalV39(u);
    const nteBase = txt(nteFiltro || u?.nte || '');
    function norm(v){
      const m = txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i);
      return m ? 'NTE'+Number(m[1]) : up(v).replace(/[^A-Z0-9]/g,'');
    }
    let lista = (window.usuariosDB || []).map(normalizarUsuarioV39).filter(op => op && op.ativo !== false && !isConsultaV39(op) && !isSECV39(op));
    if(!global) lista = lista.filter(op => norm(op.nte) === norm(nteBase || u?.nte));
    select.innerHTML = '<option value="">-- Selecione o Servidor --</option>';
    lista.sort((a,b)=>txt(a.nome).localeCompare(txt(b.nome),'pt-BR')).forEach(op => {
      const nte = op.nte ? ` - ${op.nte}` : '';
      select.innerHTML += `<option value="${op.nome}">${op.nome}${global ? nte : ''}</option>`;
    });
  };
  try{ preencherSelectTecnicosPorNte = window.preencherSelectTecnicosPorNte; }catch(e){}

  // Reaplica permissões após login/navegação/carregamento, sem tocar na carga dos dados.
  const oldHandle = window.handleLogin;
  if(typeof oldHandle === 'function'){
    window.handleLogin = async function(event){
      const r = await oldHandle.apply(this, arguments);
      garantirUsuariosBaseV39();
      if(window.usuarioLogado){ normalizarUsuarioV39(window.usuarioLogado); try{ usuarioLogado = window.usuarioLogado; }catch(e){} }
      aplicarPermissoesV39();
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  const oldNavegar = window.navegar;
  if(typeof oldNavegar === 'function'){
    window.navegar = function(){ const r = oldNavegar.apply(this, arguments); setTimeout(aplicarPermissoesV39, 60); return r; };
    try{ navegar = window.navegar; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    garantirUsuariosBaseV39();
    atualizarSelectPerfilV39();
    setTimeout(aplicarPermissoesV39, 600);
    setTimeout(aplicarPermissoesV39, 1800);
  });

  setTimeout(function(){ garantirUsuariosBaseV39(); aplicarPermissoesV39(); }, 2500);
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';
  const EMAIL_SEC_V40 = 'sec@enova.educacao.ba.gov.br';
  const GRUPO_SEC_V40 = 'SEC - TODOS OS NTEs';

  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return sem(v).toUpperCase(); }
  function low(v){ return txt(v).toLowerCase(); }

  function perfilV40(v){
    const p = up(v || 'Tecnico');
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('TECNIC') || p.includes('TÉCNIC')) return 'Tecnico';
    return 'Tecnico';
  }
  function isSECV40(u){ return !!u && (low(u.email)===EMAIL_SEC_V40 || perfilV40(u.perfil)==='SEC' || up(u.grupo).includes('SEC') || up(u.nte).includes('SEC') || up(u.nte).includes('TODOS OS NTES')); }
  function isMasterV40(u){ return perfilV40(u && u.perfil)==='Master'; }
  function isAdminV40(u){ return perfilV40(u && u.perfil)==='Administrador'; }
  function isTecnicoV40(u){ return perfilV40(u && u.perfil)==='Tecnico'; }
  function isConsultaV40(u){ return perfilV40(u && u.perfil)==='Consulta'; }
  function isGlobalV40(u){ return isMasterV40(u) || isSECV40(u); }
  function podeImportarV40(u){ return isGlobalV40(u) || isAdminV40(u); }
  function podeEditarEscolaV40(u){ return isGlobalV40(u) || isAdminV40(u) || isTecnicoV40(u); }
  function podeMovimentarV40(u){ return isGlobalV40(u) || isAdminV40(u) || isTecnicoV40(u); }
  function podeVerUsuariosV40(u){ return isGlobalV40(u); }
  function podeVerLogsV40(u){ return isGlobalV40(u) || isAdminV40(u); }
  function usuarioAtual(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }

  function normalizarUsuarioV40(u){
    if(!u) return u;
    if(low(u.email) === EMAIL_SEC_V40){
      u.nome = u.nome || 'USUÁRIO SEC';
      u.perfil = 'SEC';
      u.grupo = 'SEC';
      u.nte = GRUPO_SEC_V40;
      u.senha = u.senha || '123';
      u.ativo = u.ativo !== false;
      return u;
    }
    u.perfil = perfilV40(u.perfil || u.tipo || u.role || 'Tecnico');
    u.nte = txt(u.nte || u.nte_vinculado || u.grupo || 'NTE-26 Salvador');
    u.senha = u.senha || '123';
    u.ativo = u.ativo !== false;
    return u;
  }

  function garantirUsuariosBaseV40(){
    try{
      window.usuariosDB = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);
      try{ usuariosDB = window.usuariosDB; }catch(e){}
      const existe = e => window.usuariosDB.some(u => low(u.email) === low(e));
      const prox = base => Math.max(base, 0, ...window.usuariosDB.map(u => Number(u.id)||0)) + 1;
      if(!existe(EMAIL_SEC_V40)) window.usuariosDB.push({id: prox(900000), nome:'USUÁRIO SEC', email:EMAIL_SEC_V40, senha:'123', perfil:'SEC', grupo:'SEC', nte:GRUPO_SEC_V40, ativo:true});
      window.usuariosDB.forEach(normalizarUsuarioV40);
      if(Array.isArray(window.LISTA_OFICIAL_27_NTES) && !window.LISTA_OFICIAL_27_NTES.some(n => up(n).includes('SEC - TODOS'))) window.LISTA_OFICIAL_27_NTES.unshift(GRUPO_SEC_V40);
    }catch(e){ console.warn('SIGEE V40: não foi possível garantir usuários base.', e); }
  }

  function sincronizarIdentidadeUsuarioV40(){
    garantirUsuariosBaseV40();
    const u = usuarioAtual();
    if(!u) return null;
    // Mantém o perfil salvo/cadastrado para o usuário. Não promove Técnico para Master por e-mail.
    const cadastrado = (window.usuariosDB || []).find(x => low(x.email) === low(u.email));
    if(cadastrado){
      u.perfil = perfilV40(cadastrado.perfil || u.perfil);
      u.nte = cadastrado.nte || u.nte;
      u.grupo = cadastrado.grupo || u.grupo || '';
      u.nome = cadastrado.nome || u.nome;
      u.ativo = cadastrado.ativo !== false;
    } else {
      normalizarUsuarioV40(u);
    }
    window.usuarioLogado = u;
    try{ usuarioLogado = u; }catch(e){}
    return u;
  }

  function aplicarPermissoesV40(){
    const u = sincronizarIdentidadeUsuarioV40();

    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !podeImportarV40(u));
    const inputImportar = document.getElementById('input-importar-excel');
    if(inputImportar) inputImportar.disabled = !podeImportarV40(u);
    document.querySelectorAll('[data-master-only-import-processos], .btn-importar-processos-master, .btn-importar-processos-admin, .import-only')
      .forEach(el => el.classList.toggle('hidden', !podeImportarV40(u)));

    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !podeVerUsuariosV40(u));
    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !podeVerLogsV40(u));

    document.querySelectorAll('[data-sigee-permissao="editar-escola"], .btn-editar-escola')
      .forEach(el => el.classList.toggle('hidden', !podeEditarEscolaV40(u)));

    const nome = document.getElementById('user-nome');
    const pf = document.getElementById('user-perfil');
    if(u && nome) nome.innerText = u.nome || '';
    if(u && pf) pf.innerText = `${perfilV40(u.perfil)} | ${u.nte || ''}`;

    // Se um Técnico/Consulta estiver numa aba administrativa por cache/navegação direta, volta ao Dashboard.
    const abaUsuarios = document.getElementById('aba-usuarios');
    if(abaUsuarios && !abaUsuarios.classList.contains('hidden') && !podeVerUsuariosV40(u)){
      if(typeof navegar === 'function') navegar('processos');
    }
    const abaLogs = document.getElementById('aba-logs');
    if(abaLogs && !abaLogs.classList.contains('hidden') && !podeVerLogsV40(u)){
      if(typeof navegar === 'function') navegar('processos');
    }
  }

  window.SIGEE_PERFIS_V40 = {
    perfil: u => perfilV40(u && u.perfil ? u.perfil : u),
    isSEC: isSECV40,
    isMaster: isMasterV40,
    isAdmin: isAdminV40,
    isTecnico: isTecnicoV40,
    isConsulta: isConsultaV40,
    isGlobal: isGlobalV40,
    podeImportar: podeImportarV40,
    podeEditarEscola: podeEditarEscolaV40,
    podeMovimentar: podeMovimentarV40,
    podeVerUsuarios: podeVerUsuariosV40,
    podeVerLogs: podeVerLogsV40,
    aplicarPermissoes: aplicarPermissoesV40
  };
  window.perfilCanonicoSIGEE = function(perfil){ return perfilV40(perfil); };
  try{ perfilCanonicoSIGEE = window.perfilCanonicoSIGEE; }catch(e){}

  // Protege navegação administrativa para Técnico e Consulta.
  const navegarAnteriorV40 = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  if(typeof navegarAnteriorV40 === 'function'){
    window.navegar = function(aba){
      const u = sincronizarIdentidadeUsuarioV40();
      if(aba === 'usuarios' && !podeVerUsuariosV40(u)){ alert('Acesso ao Controle de Usuários permitido apenas para SEC e Master.'); aba = 'painel'; }
      if(aba === 'logs' && !podeVerLogsV40(u)){ alert('Acesso aos Logs permitido apenas para SEC, Master e Administrador.'); aba = 'painel'; }
      const r = navegarAnteriorV40.call(this, aba);
      setTimeout(aplicarPermissoesV40, 80);
      return r;
    };
    try{ navegar = window.navegar; }catch(e){}
  }

  // Reforça login sem alterar a rotina de carregamento do banco.
  const loginAnteriorV40 = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(typeof loginAnteriorV40 === 'function'){
    window.handleLogin = async function(event){
      const r = await loginAnteriorV40.apply(this, arguments);
      sincronizarIdentidadeUsuarioV40();
      registrarUsuarioConectadoV40('Login realizado no sistema.');
      aplicarPermissoesV40();
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  // Impede importação para Técnico/Consulta mesmo se o botão for acionado por console ou cache.
  const importAnteriorV40 = window.processarImportacaoOtimizada || (typeof processarImportacaoOtimizada !== 'undefined' ? processarImportacaoOtimizada : null);
  if(typeof importAnteriorV40 === 'function'){
    window.processarImportacaoOtimizada = function(event){
      const u = sincronizarIdentidadeUsuarioV40();
      if(!podeImportarV40(u)){
        if(event && event.target) event.target.value = '';
        alert('Importação permitida apenas para os perfis SEC, Master e Administrador.');
        return false;
      }
      return importAnteriorV40.apply(this, arguments);
    };
    try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
  }

  /* PATCH 1.0.2.002
   * O painel V40 de usuários conectados foi desativado porque utilizava
   * localStorage e mantinha sessões por até 8 horas. A presença oficial
   * passa a ser exclusivamente a tabela usuarios_online_sigee, controlada
   * por logs.js.
   */
  function registrarUsuarioConectadoV40(acao){
    if(!acao)return;
    try{ if(typeof registrarLog==='function') registrarLog(acao); }catch(e){}
  }

  function removerPainelUsuariosConectadosV40(){
    document.getElementById('painel-usuarios-conectados-v40')?.remove();
  }

  function atualizarUsuariosConectadosV40(){
    removerPainelUsuariosConectadosV40();
    try{ window.atualizarDashboardUsuariosConectadosSIGEE?.(); }catch(e){}
  }

  const logsAnteriorV40 = window.carregarLogs || (typeof carregarLogs !== 'undefined' ? carregarLogs : null);
  window.carregarLogs = function(){
    removerPainelUsuariosConectadosV40();
    if(typeof logsAnteriorV40 === 'function') return logsAnteriorV40.apply(this, arguments);
  };
  try{ carregarLogs = window.carregarLogs; }catch(e){}

  const logoutAnteriorV40 = window.logout || (typeof logout !== 'undefined' ? logout : null);
  window.logout = function(){
    const u = usuarioAtual();
    if(u && u.email){
      try{
        const mapa = JSON.parse(localStorage.getItem('SIGEE_USUARIOS_ONLINE') || '{}');
        delete mapa[low(u.email)];
        salvarOnlineV40(mapa);
      }catch(e){}
      try{ if(typeof registrarLog === 'function') registrarLog('Logout realizado no sistema.'); }catch(e){}
    }
    if(typeof logoutAnteriorV40 === 'function') return logoutAnteriorV40.apply(this, arguments);
    window.usuarioLogado = null; try{ usuarioLogado = null; }catch(e){}
    document.getElementById('sistema-dashboard')?.classList.add('hidden');
    document.getElementById('tela-login')?.classList.remove('hidden');
  };
  try{ logout = window.logout; }catch(e){}

  document.addEventListener('DOMContentLoaded', function(){
    garantirUsuariosBaseV40();
    setTimeout(aplicarPermissoesV40, 400);
    setTimeout(aplicarPermissoesV40, 1500);
    setTimeout(removerPainelUsuariosConectadosV40, 1600);
  });
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';
  const KEY_COMPLETO = 'SIGEE_USUARIOS_COMPLETO_V41';
  const KEY_ONLINE = 'SIGEE_USUARIOS_ONLINE';

  function txt(v){ return (v===undefined||v===null)?'':String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function perfil(v){
    const p = up(v);
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }
  function isSEC(u){ return !!u && (perfil(u.perfil)==='SEC' || up(u.grupo).includes('SEC') || up(u.nte).includes('SEC') || up(u.nte).includes('TODOS OS NTES') || low(u.email)==='sec@enova.educacao.ba.gov.br'); }
  function isGlobal(u){ const p=perfil(u&&u.perfil); return p==='SEC' || p==='Master' || isSEC(u); }
  function usuarioAtual(){ return window.usuarioLogado || (typeof usuarioLogado!=='undefined'?usuarioLogado:null); }
  function normalizarUsuarioV41(u){
    u = u || {};
    const email = low(u.email);
    let pf = perfil(u.perfil || u.tipo || u.role || 'Tecnico');
    if(email==='elmo.lobao@enova.educacao.ba.gov.br') pf = 'Master';
    if(email==='sec@enova.educacao.ba.gov.br') pf = 'SEC';
    let nte = txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo || u.nte_id || 'NTE-26 Salvador');
    if(pf==='SEC' || up(nte).includes('SEC')) nte = 'SEC - TODOS OS NTEs';
    return Object.assign({}, u, {
      id: u.id || Date.now(),
      nome: txt(u.nome || u.name || 'USUÁRIO').toUpperCase(),
      email,
      senha: txt(u.senha || u.password || '123'),
      perfil: pf,
      nte,
      grupo: pf==='SEC' ? 'SEC' : (u.grupo || ''),
      ativo: u.ativo !== false
    });
  }
  function salvarUsuariosLocalV41(){
    try{
      const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB!=='undefined'?usuariosDB:[]);
      const salvos = base.map(normalizarUsuarioV41);
      localStorage.setItem(KEY_COMPLETO, JSON.stringify(salvos));
      return true;
    }catch(e){ console.warn('SIGEE V41: não salvou usuários no cache local', e); return false; }
  }
  function carregarUsuariosLocalV41(){
    try{
      const salvos = JSON.parse(localStorage.getItem(KEY_COMPLETO) || '[]').map(normalizarUsuarioV41);
      if(!salvos.length) return false;
      const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB!=='undefined'?usuariosDB:[]);
      salvos.forEach(s=>{
        const idx = base.findIndex(u => low(u.email)===s.email || String(u.id)===String(s.id));
        if(idx>=0) base[idx] = Object.assign({}, base[idx], s); else base.push(s);
      });
      window.usuariosDB = base;
      try{ usuariosDB = base; }catch(e){}
      return true;
    }catch(e){ console.warn('SIGEE V41: não carregou usuários do cache local', e); return false; }
  }
  async function salvarUsuarioSupabaseBasicoV41(u){
    try{
      const client = (typeof obterSupabaseSIGEE==='function') ? obterSupabaseSIGEE() : (window.supabaseClient || null);
      const tabela = (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
      if(!client || !client.from) return false;
      // Grava apenas colunas seguras já usadas pelo SIGEE. NTE/senha ficam preservados localmente quando não existirem no banco.
      const payload = { nome:u.nome, email:u.email, perfil:u.perfil, ativo:u.ativo!==false };
      const { error } = await client.from(tabela).upsert(payload, { onConflict:'email' });
      if(error) throw error;
      return true;
    }catch(e){ console.warn('SIGEE V41: Supabase recusou salvamento básico do usuário; cache local preservado.', e); return false; }
  }

  // Aplica cache local assim que a página abre e também depois de qualquer sincronização do Supabase.
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){ carregarUsuariosLocalV41(); if(typeof carregarListaUsuarios==='function') carregarListaUsuarios(); }, 100);
    setTimeout(function(){ carregarUsuariosLocalV41(); if(typeof carregarListaUsuarios==='function') carregarListaUsuarios(); }, 1500);
  });

  const carregarV32 = window.carregarDadosOperacionaisV32;
  if(typeof carregarV32 === 'function'){
    window.carregarDadosOperacionaisV32 = async function(){
      const r = await carregarV32.apply(this, arguments);
      carregarUsuariosLocalV41();
      try{ if(typeof carregarListaUsuarios==='function') carregarListaUsuarios(); }catch(e){}
      return r;
    };
    try{ carregarDadosOperacionaisV32 = window.carregarDadosOperacionaisV32; }catch(e){}
  }

  // Substitui salvamento do formulário para não perder perfil/NTE/senha ao sair do sistema.
  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if(event) event.preventDefault();
    const id = txt(document.getElementById('user-form-id')?.value);
    const novo = normalizarUsuarioV41({
      id: id || Date.now(),
      nome: document.getElementById('user-form-nome')?.value,
      email: document.getElementById('user-form-email')?.value,
      senha: document.getElementById('user-form-senha')?.value || '123',
      nte: document.getElementById('user-form-nte')?.value || 'NTE-26 Salvador',
      perfil: document.getElementById('user-form-perfil')?.value || 'Tecnico',
      ativo: true
    });
    if(!novo.nome || !novo.email){ alert('Informe nome e e-mail do usuário.'); return; }
    const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB!=='undefined'?usuariosDB:[]);
    const idx = base.findIndex(u => low(u.email)===novo.email || String(u.id)===String(id));
    if(idx>=0) base[idx] = Object.assign({}, base[idx], novo); else base.push(novo);
    window.usuariosDB = base; try{ usuariosDB = base; }catch(e){}
    salvarUsuariosLocalV41();
    await salvarUsuarioSupabaseBasicoV41(novo);
    try{ if(typeof registrarLog==='function') registrarLog((id?'Atualizou':'Cadastrou')+' usuário: '+novo.email+' | Perfil: '+novo.perfil+' | NTE: '+novo.nte); }catch(e){}
    try{ if(typeof fecharModalUsuario==='function') fecharModalUsuario(); }catch(e){ const m=document.getElementById('modal-cadastro-usuario'); if(m) m.classList.add('hidden'); }
    try{ if(typeof carregarListaUsuarios==='function') carregarListaUsuarios(); }catch(e){}
    alert('Usuário salvo. As informações complementares de perfil/NTE/senha foram preservadas no SIGEE.');
  };
  try{ salvarNovoUsuarioFormularioMaster = window.salvarNovoUsuarioFormularioMaster; }catch(e){}

  // Desativar/ativar também persiste.
  const oldToggle = window.toggleStatusUsuarioMaster || (typeof toggleStatusUsuarioMaster!=='undefined'?toggleStatusUsuarioMaster:null);
  window.toggleStatusUsuarioMaster = async function(id){
    const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB!=='undefined'?usuariosDB:[]);
    const u = base.find(x => String(x.id)===String(id));
    if(!u){ if(typeof oldToggle==='function') return oldToggle.apply(this, arguments); return; }
    u.ativo = !(u.ativo!==false);
    salvarUsuariosLocalV41();
    await salvarUsuarioSupabaseBasicoV41(normalizarUsuarioV41(u));
    try{ if(typeof registrarLog==='function') registrarLog((u.ativo?'Ativou':'Desativou')+' usuário: '+u.email); }catch(e){}
    try{ carregarListaUsuarios(); }catch(e){}
  };
  try{ toggleStatusUsuarioMaster = window.toggleStatusUsuarioMaster; }catch(e){}

  // Resetar senha também persiste no cache local.
  const oldReset = window.resetarSenhaUsuarioMaster || (typeof resetarSenhaUsuarioMaster!=='undefined'?resetarSenhaUsuarioMaster:null);
  window.resetarSenhaUsuarioMaster = async function(id){
    const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB!=='undefined'?usuariosDB:[]);
    const u = base.find(x => String(x.id)===String(id));
    if(!u){ if(typeof oldReset==='function') return oldReset.apply(this, arguments); return; }
    const nova = prompt('Informe a nova senha provisória:', u.senha || '123');
    if(!nova) return;
    u.senha = txt(nova);
    salvarUsuariosLocalV41();
    await salvarUsuarioSupabaseBasicoV41(normalizarUsuarioV41(u));
    try{ if(typeof registrarLog==='function') registrarLog('Resetou senha do usuário: '+u.email); }catch(e){}
    try{ carregarListaUsuarios(); }catch(e){}
    alert('Senha atualizada no SIGEE. Observação: a tabela usuarios_sigee não possui coluna senha; por isso a senha fica preservada na camada complementar local deste navegador.');
  };
  try{ resetarSenhaUsuarioMaster = window.resetarSenhaUsuarioMaster; }catch(e){}

  // Garante que o login considere os dados complementares salvos.
  const oldLogin = window.handleLogin || (typeof handleLogin!=='undefined'?handleLogin:null);
  if(typeof oldLogin === 'function'){
    window.handleLogin = function(event){
      carregarUsuariosLocalV41();
      return oldLogin.apply(this, arguments);
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  window.SIGEE_V41 = {salvarUsuariosLocalV41, carregarUsuariosLocalV41};
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';
  const GRUPO_SEC = 'SEC - TODOS OS NTEs';
  const KEY_COMPLETO = 'SIGEE_USUARIOS_COMPLETO_V41';

  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return sem(v).toUpperCase(); }
  function numeroNte(v){ const m = txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i); return m ? Number(m[1]) : null; }
  function normNte(v){ const n = numeroNte(v); return n ? 'NTE'+String(n).padStart(2,'0') : up(v).replace(/[^A-Z0-9]/g,''); }

  function perfilCanonico(v){
    const p = up(v || 'Tecnico');
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMINISTR') || p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('TECNIC')) return 'Tecnico';
    return 'Tecnico';
  }

  function usuarioAtual(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
  function isSEC(u){ return !!u && (low(u.email) === EMAIL_SEC || perfilCanonico(u.perfil) === 'SEC' || (perfilCanonico(u.perfil)==='SEC' && up(u.grupo).includes('SEC'))); }
  function isMaster(u){ return perfilCanonico(u && u.perfil) === 'Master'; }
  function isAdmin(u){ return perfilCanonico(u && u.perfil) === 'Administrador'; }
  function isTecnico(u){ return perfilCanonico(u && u.perfil) === 'Tecnico'; }
  function isConsulta(u){ return perfilCanonico(u && u.perfil) === 'Consulta'; }
  function isGlobal(u){ return isSEC(u) || isMaster(u); }
  function nteUsuario(u){
    if(!u) return '';
    if(isSEC(u)) return GRUPO_SEC;
    return txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo || 'NTE-26 Salvador');
  }
  function nteItem(x){ return txt(x && (x.nte || x.nte_nome || x.nte_vinculado || x.nucleo || x.nte_descricao || x.nte_id || '')); }
  function mesmoNte(a,b){
    if(!a || !b) return false;
    const na = numeroNte(a), nb = numeroNte(b);
    if(na && nb) return na === nb;
    return normNte(a) === normNte(b);
  }

  const Perm = {
    visualizarTodos: u => isGlobal(u),
    dashboardGlobal: u => isGlobal(u),
    cadastrarEscola: u => isGlobal(u) || isAdmin(u) || isTecnico(u),
    alterarEscola: u => isGlobal(u) || isAdmin(u) || isTecnico(u),
    excluirEscola: u => isGlobal(u),
    importarEscolas: u => isGlobal(u) || isAdmin(u),
    importarProcessos: u => isGlobal(u) || isAdmin(u),
    importarUsuarios: u => isGlobal(u),
    exportarDados: u => isGlobal(u) || isAdmin(u),
    abrirSolicitacao: u => isGlobal(u) || isAdmin(u) || isTecnico(u),
    alterarFluxo: u => isGlobal(u) || isAdmin(u) || isTecnico(u),
    tecnicosQualquerNte: u => isGlobal(u),
    cadastrarUsuarios: u => isGlobal(u),
    alterarUsuarios: u => isGlobal(u) || isAdmin(u),
    alterarPerfilUsuario: u => isGlobal(u),
    acessarLogs: u => isGlobal(u) || isAdmin(u),
    usuariosConectados: u => isGlobal(u) || isAdmin(u),
    configuracoes: u => isGlobal(u)
  };

  function normalizarUsuario(u){
    if(!u) return u;
    const email = low(u.email);
    let p = perfilCanonico(u.perfil || u.tipo || u.role || 'Tecnico');
    if(email === EMAIL_SEC) p = 'SEC';
    let nte = txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo || 'NTE-26 Salvador');
    if(p === 'SEC') nte = GRUPO_SEC;
    // IMPORTANTE: nte SEC sozinho não transforma Técnico/Admin em global.
    u.perfil = p;
    u.nte = nte;
    u.grupo = p === 'SEC' ? 'SEC' : txt(u.grupo || '');
    u.senha = txt(u.senha || u.password || '123') || '123';
    u.ativo = u.ativo !== false;
    return u;
  }

  function usuariosBase(){
    const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);
    window.usuariosDB = base; try{ usuariosDB = base; }catch(e){}
    return base;
  }
  function salvarLocal(){
    try{ localStorage.setItem(KEY_COMPLETO, JSON.stringify(usuariosBase().map(u => Object.assign({}, normalizarUsuario(u))))); }catch(e){}
  }
  function carregarLocal(){
    try{
      const salvos = JSON.parse(localStorage.getItem(KEY_COMPLETO) || '[]').map(normalizarUsuario);
      const base = usuariosBase();
      salvos.forEach(s => {
        const idx = base.findIndex(u => low(u.email) === low(s.email) || String(u.id) === String(s.id));
        if(idx >= 0) base[idx] = Object.assign({}, base[idx], s); else base.push(s);
      });
      base.forEach(normalizarUsuario);
      return salvos.length > 0;
    }catch(e){ return false; }
  }
  function garantirBase(){
    carregarLocal();
    const base = usuariosBase();
    if(!base.some(u => low(u.email) === EMAIL_SEC)) base.push({id:990001,nome:'USUÁRIO SEC',email:EMAIL_SEC,senha:'123',perfil:'SEC',grupo:'SEC',nte:GRUPO_SEC,ativo:true});
    base.forEach(normalizarUsuario);
    try{
      if(Array.isArray(window.LISTA_OFICIAL_27_NTES) && !window.LISTA_OFICIAL_27_NTES.some(n => up(n).includes('SEC - TODOS'))) window.LISTA_OFICIAL_27_NTES.unshift(GRUPO_SEC);
    }catch(e){}
  }

  function filtrarListaPorUsuario(lista){
    const u = usuarioAtual();
    if(!Array.isArray(lista)) return [];
    if(isGlobal(u)) return lista;
    const nte = nteUsuario(u);
    return lista.filter(item => mesmoNte(nteItem(item), nte));
  }

  function aplicarPermissoes(){
    garantirBase();
    const u = normalizarUsuario(usuarioAtual());
    if(u){ window.usuarioLogado = u; try{ usuarioLogado = u; }catch(e){} }

    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !(Perm.alterarUsuarios(u) || Perm.cadastrarUsuarios(u)));
    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !Perm.acessarLogs(u));

    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !(Perm.importarEscolas(u) || Perm.importarProcessos(u)));
    const inputImportar = document.getElementById('input-importar-excel');
    if(inputImportar) inputImportar.disabled = !(Perm.importarEscolas(u) || Perm.importarProcessos(u));
    document.querySelectorAll('.import-only').forEach(el => el.classList.toggle('hidden', !(Perm.importarEscolas(u) || Perm.importarProcessos(u))));
    document.querySelectorAll('.export-only').forEach(el => el.classList.toggle('hidden', !Perm.exportarDados(u)));

    document.querySelectorAll('button[onclick="abrirModalNovaEscola()"], .btn-nova-escola').forEach(el => el.classList.toggle('hidden', !Perm.cadastrarEscola(u)));
    document.querySelectorAll('[data-sigee-permissao="editar-escola"], .btn-editar-escola').forEach(el => el.classList.toggle('hidden', !Perm.alterarEscola(u)));
    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"], .btn-nova-solicitacao').forEach(el => el.classList.toggle('hidden', !Perm.abrirSolicitacao(u)));

    const tituloUser = document.querySelector('#aba-usuarios h1, #aba-usuarios .text-3xl');
    const btnCadastrarTecnico = document.querySelector('button[onclick="abrirModalCriarUsuarioMaster()"]');
    if(btnCadastrarTecnico) btnCadastrarTecnico.classList.toggle('hidden', !Perm.cadastrarUsuarios(u));

    const nome = document.getElementById('user-nome'); if(nome && u) nome.innerText = u.nome || '';
    const pf = document.getElementById('user-perfil'); if(pf && u) pf.innerText = `${perfilCanonico(u.perfil)} | ${nteUsuario(u)}`;

    const abaUsuarios = document.getElementById('aba-usuarios');
    if(abaUsuarios && !abaUsuarios.classList.contains('hidden') && !(Perm.alterarUsuarios(u) || Perm.cadastrarUsuarios(u))){ try{ navegar('painel'); }catch(e){} }
    const abaLogs = document.getElementById('aba-logs');
    if(abaLogs && !abaLogs.classList.contains('hidden') && !Perm.acessarLogs(u)){ try{ navegar('painel'); }catch(e){} }
  }

  window.SIGEE_PERFIS_V42 = { perfil: perfilCanonico, isSEC, isMaster, isAdmin, isTecnico, isConsulta, isGlobal, Perm, aplicarPermissoes, filtrarListaPorUsuario, normalizarUsuario };
  window.perfilCanonicoSIGEE = perfilCanonico;
  try{ perfilCanonicoSIGEE = perfilCanonico; }catch(e){}

  // Carregamento de lista de usuários conforme perfil oficial.
  window.carregarListaUsuarios = function(){
    garantirBase();
    const corpo = document.getElementById('tabela-usuarios-corpo'); if(!corpo) return;
    corpo.innerHTML = '';
    const uLog = usuarioAtual();
    let lista = usuariosBase().map(normalizarUsuario);
    if(!isGlobal(uLog)) lista = lista.filter(u => mesmoNte(nteUsuario(u), nteUsuario(uLog)));
    lista.forEach(u => {
      const mesmo = mesmoNte(nteUsuario(u), nteUsuario(uLog));
      const podeEditar = isGlobal(uLog) || (isAdmin(uLog) && mesmo && !isGlobal(u));
      const podeAlterarPerfil = isGlobal(uLog);
      const grupo = isSEC(u) ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px]">SEC</span>' : '';
      const botoes = podeEditar ? `<div class="flex items-center justify-center gap-1.5"><button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button><button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo!==false?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo!==false?'Desativar':'Ativar'}</button>${podeAlterarPerfil?`<button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button>`:''}</div>` : '<span class="text-xs text-gray-400 italic">Sem permissão</span>';
      corpo.innerHTML += `<tr class="text-xs"><td class="p-3 font-bold">${u.nome}${grupo}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email}</span></td><td class="p-3 font-medium">${perfilCanonico(u.perfil)}</td><td class="p-3 font-semibold text-gray-600">${nteUsuario(u)}</td><td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo!==false?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo!==false?'ATIVO':'INATIVO'}</span></td><td class="p-3 text-center">${botoes}</td></tr>`;
    });
  };
  try{ carregarListaUsuarios = window.carregarListaUsuarios; }catch(e){}

  // Cadastro/edição de usuário: Admin edita apenas NTE, mas não muda perfil; SEC/Master mudam tudo.
  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if(event) event.preventDefault();
    garantirBase();
    const uLog = usuarioAtual();
    if(!(Perm.cadastrarUsuarios(uLog) || Perm.alterarUsuarios(uLog))){ alert('Seu perfil não possui permissão para alterar usuários.'); return; }
    const id = txt(document.getElementById('user-form-id')?.value);
    const base = usuariosBase();
    const atual = base.find(x => String(x.id)===String(id));
    const nome = txt(document.getElementById('user-form-nome')?.value).toUpperCase();
    const email = low(document.getElementById('user-form-email')?.value);
    const senha = txt(document.getElementById('user-form-senha')?.value || '123');
    let nte = txt(document.getElementById('user-form-nte')?.value || nteUsuario(uLog));
    let perfil = perfilCanonico(document.getElementById('user-form-perfil')?.value || 'Tecnico');
    if(!isGlobal(uLog)){
      if(!atual || !mesmoNte(nteUsuario(atual), nteUsuario(uLog))){ alert('Administrador só pode alterar usuários do próprio NTE.'); return; }
      perfil = perfilCanonico(atual.perfil); // Admin não altera perfil.
      nte = nteUsuario(uLog);
    }
    const novo = normalizarUsuario({ id: id || Date.now(), nome, email, senha, nte, perfil, ativo: atual ? atual.ativo !== false : true });
    if(!novo.nome || !novo.email){ alert('Informe nome e e-mail do usuário.'); return; }
    const idx = base.findIndex(x => low(x.email) === novo.email || String(x.id) === String(id));
    if(idx >= 0) base[idx] = Object.assign({}, base[idx], novo); else base.push(novo);
    salvarLocal();
    try{
      const client = (typeof obterSupabaseSIGEE==='function') ? obterSupabaseSIGEE() : null;
      const tabela = (window.SIGEE_SUPABASE_TABELAS && window.SIGEE_SUPABASE_TABELAS.usuarios) || 'usuarios_sigee';
      if(client) await client.from(tabela).upsert({nome:novo.nome,email:novo.email,perfil:novo.perfil,ativo:novo.ativo!==false},{onConflict:'email'});
    }catch(e){ console.warn('SIGEE V42: usuário salvo localmente; Supabase não possui todas as colunas.', e); }
    try{ if(typeof registrarLog==='function') registrarLog((id?'Atualizou':'Cadastrou')+` usuário: ${novo.email} | Perfil: ${novo.perfil} | NTE: ${novo.nte}`); }catch(e){}
    try{ fecharModalUsuario(); }catch(e){ document.getElementById('modal-cadastro-usuario')?.classList.add('hidden'); }
    window.carregarListaUsuarios(); aplicarPermissoes();
  };
  try{ salvarNovoUsuarioFormularioMaster = window.salvarNovoUsuarioFormularioMaster; }catch(e){}

  const oldAbrirEditar = window.abrirModalEditarUsuarioMaster || (typeof abrirModalEditarUsuarioMaster !== 'undefined' ? abrirModalEditarUsuarioMaster : null);
  window.abrirModalEditarUsuarioMaster = function(id){
    const uLog = usuarioAtual();
    const alvo = usuariosBase().find(u => String(u.id)===String(id));
    if(!alvo) return;
    if(!(isGlobal(uLog) || (isAdmin(uLog) && mesmoNte(nteUsuario(alvo), nteUsuario(uLog))))){ alert('Sem permissão para editar este usuário.'); return; }
    if(typeof oldAbrirEditar === 'function') oldAbrirEditar.apply(this, arguments);
    setTimeout(()=>{
      const pf = document.getElementById('user-form-perfil'); if(pf) pf.disabled = !isGlobal(uLog);
      const nte = document.getElementById('user-form-nte'); if(nte) nte.disabled = !isGlobal(uLog);
    },60);
  };
  try{ abrirModalEditarUsuarioMaster = window.abrirModalEditarUsuarioMaster; }catch(e){}

  window.preencherSelectTecnicosPorNte = function(selectId, nteFiltro){
    garantirBase();
    const select = document.getElementById(selectId); if(!select) return;
    const uLog = usuarioAtual();
    const global = isGlobal(uLog);
    const nteBase = txt(nteFiltro || nteUsuario(uLog));
    let lista = usuariosBase().map(normalizarUsuario).filter(u => u.ativo!==false && !isConsulta(u) && !isSEC(u));
    if(!global) lista = lista.filter(u => mesmoNte(nteUsuario(u), nteBase));
    select.innerHTML = '<option value="">-- Selecione o Servidor --</option>';
    lista.sort((a,b)=> (nteUsuario(a)+' '+a.nome).localeCompare(nteUsuario(b)+' '+b.nome,'pt-BR')).forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.nome;
      opt.textContent = global ? `${u.nome} — ${perfilCanonico(u.perfil)} — ${nteUsuario(u)}` : `${u.nome} — ${perfilCanonico(u.perfil)}`;
      opt.dataset.nte = nteUsuario(u);
      select.appendChild(opt);
    });
  };
  try{ preencherSelectTecnicosPorNte = window.preencherSelectTecnicosPorNte; }catch(e){}

  // Reforça importação/exportação pelos perfis oficiais.
  const oldImportar = window.processarImportacaoOtimizada || (typeof processarImportacaoOtimizada !== 'undefined' ? processarImportacaoOtimizada : null);
  if(typeof oldImportar === 'function'){
    window.processarImportacaoOtimizada = function(event){
      const u = usuarioAtual();
      if(!(Perm.importarEscolas(u) || Perm.importarProcessos(u))){ alert('Importação permitida apenas para SEC, Master e Administrador.'); if(event?.target) event.target.value=''; return; }
      return oldImportar.apply(this, arguments);
    };
    try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
  }

  const oldExportPerfil = window.perfilExportadorSIGEE;
  window.perfilExportadorSIGEE = function(){ return Perm.exportarDados(usuarioAtual()); };

  const oldLogin = window.handleLogin;
  if(typeof oldLogin === 'function'){
    window.handleLogin = async function(event){
      carregarLocal();
      const r = await oldLogin.apply(this, arguments);
      garantirBase();
      const u = usuarioAtual(); if(u) normalizarUsuario(u);
      aplicarPermissoes(); salvarLocal();
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  const oldNavegar = window.navegar;
  if(typeof oldNavegar === 'function'){
    window.navegar = function(){ const r = oldNavegar.apply(this, arguments); setTimeout(aplicarPermissoes, 50); return r; };
    try{ navegar = window.navegar; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){ garantirBase(); aplicarPermissoes(); setTimeout(aplicarPermissoes, 700); setTimeout(aplicarPermissoes, 2000); });
  setInterval(function(){ if(usuarioAtual()) aplicarPermissoes(); }, 30000);
})();


// ===== bloco JS extraído do index.html =====
/* ==========================================================
   SIGEE V43 - Correção definitiva de permissões por PERFIL
   Mantém o carregamento V38/V42 e impede que NTE/Grupo SEC
   conceda permissões administrativas a usuário Técnico.
   ========================================================== */
(function(){
  'use strict';
  const EMAIL_SEC = 'sec@enova.educacao.ba.gov.br';
  const GRUPO_SEC = 'SEC - TODOS OS NTEs';
  const KEY_COMPLETO = 'SIGEE_USUARIOS_COMPLETO_V41';

  function texto(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function semAcento(v){ return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return semAcento(v).toUpperCase(); }
  function low(v){ return texto(v).toLowerCase(); }
  function perfilOficial(v){
    const p = up(v || 'Tecnico');
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('TECNIC')) return 'Tecnico';
    return 'Tecnico';
  }
  function usuario(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
  function perfilAtual(){ return perfilOficial(usuario() && usuario().perfil); }
  function isSEC(){ const u=usuario(); return !!u && (low(u.email)===EMAIL_SEC || perfilAtual()==='SEC'); }
  function isMaster(){ return perfilAtual()==='Master'; }
  function isAdmin(){ return perfilAtual()==='Administrador'; }
  function isTecnico(){ return perfilAtual()==='Tecnico'; }
  function isConsulta(){ return perfilAtual()==='Consulta'; }
  function isGlobal(){ return isSEC() || isMaster(); }
  function podeUsuarios(){ return isSEC() || isMaster(); }
  function podeLogs(){ return isSEC() || isMaster() || isAdmin(); }
  function podeImportar(){ return isSEC() || isMaster() || isAdmin(); }
  function podeExportar(){ return isSEC() || isMaster() || isAdmin(); }
  function podeCadastrarEditarEscola(){ return isSEC() || isMaster() || isAdmin() || isTecnico(); }
  function podeMovimentar(){ return isSEC() || isMaster() || isAdmin() || isTecnico(); }
  function podeNovaSolicitacao(){ return isSEC() || isMaster() || isAdmin() || isTecnico(); }

  function aplicarPermissoesV43(){
    const u = usuario();
    if(!u) return;
    u.perfil = perfilOficial(u.perfil);
    if(u.perfil === 'SEC') u.nte = GRUPO_SEC;

    const nome = document.getElementById('user-nome');
    if(nome) nome.innerText = u.nome || '';
    const perf = document.getElementById('user-perfil');
    if(perf) perf.innerText = `${u.perfil} | ${u.nte || ''}`;

    const menuUsuarios = document.getElementById('menu-usuarios');
    if(menuUsuarios) menuUsuarios.classList.toggle('hidden', !podeUsuarios());

    const menuLogs = document.getElementById('menu-logs');
    if(menuLogs) menuLogs.classList.toggle('hidden', !podeLogs());

    const btnImportar = document.getElementById('btn-importar-dados-master');
    if(btnImportar) btnImportar.classList.toggle('hidden', !podeImportar());
    const inputImportar = document.getElementById('input-importar-excel');
    if(inputImportar) inputImportar.disabled = !podeImportar();

    document.querySelectorAll('.export-only, [data-sigee-exportar]').forEach(el=>el.classList.toggle('hidden', !podeExportar()));
    document.querySelectorAll('.import-only, [data-sigee-importar]').forEach(el=>el.classList.toggle('hidden', !podeImportar()));
    document.querySelectorAll('button[onclick="abrirModalNovaEscola()"], .btn-nova-escola').forEach(el=>el.classList.toggle('hidden', !podeCadastrarEditarEscola()));
    document.querySelectorAll('[data-sigee-permissao="editar-escola"], .btn-editar-escola').forEach(el=>el.classList.toggle('hidden', !podeCadastrarEditarEscola()));
    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"], .btn-nova-solicitacao').forEach(el=>el.classList.toggle('hidden', !podeNovaSolicitacao()));

    const abaUsuarios = document.getElementById('aba-usuarios');
    if(abaUsuarios && !abaUsuarios.classList.contains('hidden') && !podeUsuarios()){
      try{ navegar('painel'); }catch(e){ abaUsuarios.classList.add('hidden'); document.getElementById('aba-painel')?.classList.remove('hidden'); }
    }
    const abaLogs = document.getElementById('aba-logs');
    if(abaLogs && !abaLogs.classList.contains('hidden') && !podeLogs()){
      try{ navegar('painel'); }catch(e){ abaLogs.classList.add('hidden'); document.getElementById('aba-painel')?.classList.remove('hidden'); }
    }
  }

  // Bloqueia navegação indevida, mesmo se algum botão antigo ficar visível por cache.
  const navegarOriginalV43 = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  window.navegar = function(aba){
    if(aba === 'usuarios' && !podeUsuarios()) { alert('Seu perfil não possui permissão para acessar Controle de Usuários.'); aba = 'painel'; }
    if(aba === 'logs' && !podeLogs()) { alert('Seu perfil não possui permissão para acessar Aba de Registros (Logs).'); aba = 'painel'; }
    const r = (typeof navegarOriginalV43 === 'function') ? navegarOriginalV43.call(this, aba) : undefined;
    setTimeout(aplicarPermissoesV43, 20);
    setTimeout(aplicarPermissoesV43, 250);
    return r;
  };
  try{ navegar = window.navegar; }catch(e){}

  // Bloqueia importação para Técnico/Consulta, independentemente do NTE ser SEC.
  const importarOriginalV43 = window.processarImportacaoOtimizada || (typeof processarImportacaoOtimizada !== 'undefined' ? processarImportacaoOtimizada : null);
  if(typeof importarOriginalV43 === 'function'){
    window.processarImportacaoOtimizada = function(event){
      if(!podeImportar()){
        alert('Importação permitida apenas para SEC, Master e Administrador.');
        if(event && event.target) event.target.value = '';
        return false;
      }
      return importarOriginalV43.apply(this, arguments);
    };
    try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
  }

  // Bloqueia exportação para Técnico/Consulta.
  window.perfilExportadorSIGEE = function(){ return podeExportar(); };

  // Bloqueia renderização da lista de usuários para quem não pode acessar.
  const carregarUsuariosOriginalV43 = window.carregarListaUsuarios || (typeof carregarListaUsuarios !== 'undefined' ? carregarListaUsuarios : null);
  window.carregarListaUsuarios = function(){
    if(!podeUsuarios()){
      const corpo = document.getElementById('tabela-usuarios-corpo');
      if(corpo) corpo.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-red-300 font-bold">Acesso restrito aos perfis SEC e Master.</td></tr>';
      return;
    }
    return (typeof carregarUsuariosOriginalV43 === 'function') ? carregarUsuariosOriginalV43.apply(this, arguments) : undefined;
  };
  try{ carregarListaUsuarios = window.carregarListaUsuarios; }catch(e){}

  // Compatibilidade: substitui helpers globais usados por camadas antigas.
  window.SIGEE_PERMISSOES_V43 = {perfilOficial, aplicarPermissoesV43, podeUsuarios, podeLogs, podeImportar, podeExportar, isGlobal};
  window.perfilCanonicoSIGEE = perfilOficial;
  try{ perfilCanonicoSIGEE = perfilOficial; }catch(e){}

  const loginOriginalV43 = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(typeof loginOriginalV43 === 'function'){
    window.handleLogin = async function(event){
      const r = await loginOriginalV43.apply(this, arguments);
      setTimeout(aplicarPermissoesV43, 30);
      setTimeout(aplicarPermissoesV43, 400);
      setTimeout(aplicarPermissoesV43, 1200);
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    aplicarPermissoesV43();
    setTimeout(aplicarPermissoesV43, 500);
    setTimeout(aplicarPermissoesV43, 1500);
  });
  // Removido polling: permissões são aplicadas no login e na navegação.
})();


// ===== bloco JS extraído do index.html =====
/* =========================================================
   SIGEE V44 - MENU ESTAVEL E PERMISSOES DEFINITIVAS
   Mantem carregamento V38+ e corrige reexibicao indevida
   de menus/botoes quando o usuario Tecnico possui NTE SEC.
   ========================================================= */
(function(){
  const GRUPO_SEC_V44 = 'SEC - TODOS OS NTEs';
  const EMAIL_SEC_V44 = 'sec@enova.educacao.ba.gov.br';
  function txt(v){ return (v==null?'':String(v)); }
  function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
  function user(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
  function perfil(v){
    const p = up(v || (user() && user().perfil));
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    if(p.includes('TECNIC')) return 'Tecnico';
    return 'Tecnico';
  }
  function isSEC(u=user()){ return !!u && (perfil(u.perfil)==='SEC' || txt(u.email).toLowerCase()===EMAIL_SEC_V44); }
  function isMaster(u=user()){ return perfil(u && u.perfil)==='Master'; }
  function isAdmin(u=user()){ return perfil(u && u.perfil)==='Administrador'; }
  function isTecnico(u=user()){ return perfil(u && u.perfil)==='Tecnico'; }
  function isConsulta(u=user()){ return perfil(u && u.perfil)==='Consulta'; }
  function global(u=user()){ return isSEC(u) || isMaster(u); }
  function canUsers(u=user()){ return isSEC(u) || isMaster(u); }
  function canLogs(u=user()){ return isSEC(u) || isMaster(u) || isAdmin(u); }
  function canImport(u=user()){ return isSEC(u) || isMaster(u) || isAdmin(u); }
  function canExport(u=user()){ return isSEC(u) || isMaster(u) || isAdmin(u); }
  function canEditSchool(u=user()){ return isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u); }
  function canFlow(u=user()){ return isSEC(u) || isMaster(u) || isAdmin(u) || isTecnico(u); }
  function canNewRequest(u=user()){ return canFlow(u); }

  // IMPORTANTE: NTE SEC sozinho nao transforma Tecnico em global.
  window.isAcessoGlobalSIGEE = function(u){ return global(u || user()); };
  window.isMasterSIGEE = function(){ return isMaster(user()) || isSEC(user()); };
  window.isTecnicoRestritoSIGEE = function(){ return !global(user()); };
  window.perfilCanonicoSIGEE = perfil;
  try { isAcessoGlobalSIGEE = window.isAcessoGlobalSIGEE; } catch(e) {}
  try { isMasterSIGEE = window.isMasterSIGEE; } catch(e) {}
  try { isTecnicoRestritoSIGEE = window.isTecnicoRestritoSIGEE; } catch(e) {}
  try { perfilCanonicoSIGEE = perfil; } catch(e) {}

  function setHidden(el, hide){ if(el) el.classList.toggle('hidden', !!hide); }
  function lockButton(el, blocked){
    if(!el) return;
    el.classList.toggle('hidden', !!blocked);
    if('disabled' in el) el.disabled = !!blocked;
    if(blocked) el.setAttribute('aria-hidden','true'); else el.removeAttribute('aria-hidden');
  }

  function aplicarPermissoesV44(){
    const u = user();
    if(!u) return;
    u.perfil = perfil(u.perfil);
    if(isSEC(u)) u.nte = GRUPO_SEC_V44;

    document.body.dataset.sigeePerfil = u.perfil;
    document.body.classList.toggle('sigee-perfil-global', global(u));
    document.body.classList.toggle('sigee-perfil-tecnico', isTecnico(u));
    document.body.classList.toggle('sigee-perfil-consulta', isConsulta(u));
    document.body.classList.toggle('sigee-perfil-admin', isAdmin(u));

    const nome = document.getElementById('user-nome');
    if(nome) nome.innerText = u.nome || '';
    const perf = document.getElementById('user-perfil');
    if(perf) perf.innerText = `${u.perfil} | ${u.nte || ''}`;

    setHidden(document.getElementById('menu-usuarios'), !canUsers(u));
    setHidden(document.getElementById('menu-logs'), !canLogs(u));

    lockButton(document.getElementById('btn-importar-dados-master'), !canImport(u));
    const input = document.getElementById('input-importar-excel');
    if(input) input.disabled = !canImport(u);

    // Exportacao deve sumir imediatamente para Tecnico/Consulta.
    document.querySelectorAll('.export-only, [data-sigee-exportar], button[onclick*="exportar"], button[onclick*="Exportar"], button[id*="export"], button[id*="Export"]').forEach(el=>{
      const texto = up(el.innerText || el.textContent || el.id || '');
      if(texto.includes('EXPORT')) lockButton(el, !canExport(u));
    });

    document.querySelectorAll('.import-only, [data-sigee-importar]').forEach(el=>lockButton(el, !canImport(u)));
    document.querySelectorAll('button[onclick="abrirModalNovaEscola()"], .btn-nova-escola').forEach(el=>lockButton(el, !canEditSchool(u)));
    document.querySelectorAll('[data-sigee-permissao="editar-escola"], .btn-editar-escola').forEach(el=>lockButton(el, !canEditSchool(u)));
    document.querySelectorAll('button[onclick="abrirFormularioNovaSolicitacao()"], .btn-nova-solicitacao').forEach(el=>lockButton(el, !canNewRequest(u)));

    const abaUsuarios = document.getElementById('aba-usuarios');
    if(abaUsuarios && !abaUsuarios.classList.contains('hidden') && !canUsers(u)){
      try{ window.navegar('painel'); }catch(e){ abaUsuarios.classList.add('hidden'); document.getElementById('aba-painel')?.classList.remove('hidden'); }
    }
    const abaLogs = document.getElementById('aba-logs');
    if(abaLogs && !abaLogs.classList.contains('hidden') && !canLogs(u)){
      try{ window.navegar('painel'); }catch(e){ abaLogs.classList.add('hidden'); document.getElementById('aba-painel')?.classList.remove('hidden'); }
    }
  }

  // Substitui navegacao antiga e reaplica permissoes imediatamente depois de renderizacoes.
  const navPrev = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  window.navegar = function(aba){
    const u = user();
    if(aba === 'usuarios' && !canUsers(u)){ alert('Acesso ao Controle de Usuários permitido apenas para SEC e Master.'); aba = 'painel'; }
    if(aba === 'logs' && !canLogs(u)){ alert('Acesso aos Logs permitido apenas para SEC, Master e Administrador.'); aba = 'painel'; }
    const r = (typeof navPrev === 'function') ? navPrev.call(this, aba) : undefined;
    aplicarPermissoesV44();
    setTimeout(aplicarPermissoesV44, 0);
    setTimeout(aplicarPermissoesV44, 80);
    setTimeout(aplicarPermissoesV44, 300);
    return r;
  };
  try{ navegar = window.navegar; }catch(e){}

  // Reforca login e importacao.
  const loginPrev = window.handleLogin || (typeof handleLogin !== 'undefined' ? handleLogin : null);
  if(typeof loginPrev === 'function'){
    window.handleLogin = async function(){
      const r = await loginPrev.apply(this, arguments);
      aplicarPermissoesV44();
      setTimeout(aplicarPermissoesV44, 50);
      setTimeout(aplicarPermissoesV44, 500);
      return r;
    };
    try{ handleLogin = window.handleLogin; }catch(e){}
  }
  const impPrev = window.processarImportacaoOtimizada || (typeof processarImportacaoOtimizada !== 'undefined' ? processarImportacaoOtimizada : null);
  if(typeof impPrev === 'function'){
    window.processarImportacaoOtimizada = function(event){
      if(!canImport(user())){
        alert('Importação permitida apenas para SEC, Master e Administrador.');
        if(event && event.target) event.target.value = '';
        return false;
      }
      return impPrev.apply(this, arguments);
    };
    try{ processarImportacaoOtimizada = window.processarImportacaoOtimizada; }catch(e){}
  }

  // Observador impede que scripts antigos voltem a exibir menus/botoes proibidos.
  let t=null;
  const obs = new MutationObserver(()=>{
    clearTimeout(t); t=setTimeout(aplicarPermissoesV44, 15);
  });
  document.addEventListener('DOMContentLoaded', ()=>{
    obs.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    aplicarPermissoesV44();
    setTimeout(aplicarPermissoesV44, 300);
    setTimeout(aplicarPermissoesV44, 1200);
  });
  window.addEventListener('load', ()=>setTimeout(aplicarPermissoesV44, 100));
  // Removido polling: evitava repintura contínua da interface.

  window.SIGEE_PERMISSOES_V44 = {perfil, isSEC, isMaster, isAdmin, isTecnico, isConsulta, global, canUsers, canLogs, canImport, canExport, aplicarPermissoesV44};
})();


// ===== bloco JS extraído do index.html =====
(function(){
  'use strict';
  const ETAPAS_V45 = ['Desarquivamento','Análise','Pendência','Digitação','Conferência','Assinatura','Aguardando Retirada','Retirado'];
  const GRUPO_SEC_V45 = 'SEC - TODOS OS NTEs';

  function txt(v){ return (v===undefined || v===null) ? '' : String(v).trim(); }
  function sem(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function up(v){ return sem(v).toUpperCase(); }
  function low(v){ return txt(v).toLowerCase(); }
  function hojeBR(){ return new Date().toLocaleDateString('pt-BR'); }
  function user(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
  function perfil(u){
    const p = up(u && u.perfil || 'Tecnico');
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'Master';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('CONSULT')) return 'Consulta';
    return 'Tecnico';
  }
  function isSEC(u){ return perfil(u)==='SEC' || low(u && u.email)==='sec@enova.educacao.ba.gov.br'; }
  function isMaster(u){ return perfil(u)==='Master'; }
  function isAdmin(u){ return perfil(u)==='Administrador'; }
  function isTecnico(u){ return perfil(u)==='Tecnico'; }
  function isConsulta(u){ return perfil(u)==='Consulta'; }
  function isGlobal(u){ return isSEC(u) || isMaster(u); }
  function numNte(v){ const m = txt(v).match(/NTE\s*[- ]?\s*(\d{1,2})/i); return m ? Number(m[1]) : null; }
  function normNte(v){ const n=numNte(v); return n ? 'NTE'+String(n).padStart(2,'0') : up(v).replace(/[^A-Z0-9]/g,''); }
  function nteUsuario(u){ return isSEC(u) ? GRUPO_SEC_V45 : txt(u && (u.nte || u.nte_nome || u.nte_vinculado || u.grupo) || 'NTE-26 Salvador'); }
  function mesmoNte(a,b){ if(isGlobal(user())) return true; if(!a || !b) return false; const na=numNte(a), nb=numNte(b); return na&&nb ? na===nb : normNte(a)===normNte(b); }
  function podeGerirUsuarios(u){ return isSEC(u) || isMaster(u); }
  function podeExcluirUsuario(u){ return isSEC(u) || isMaster(u); }
  function podeGerirProcessosMaster(u){ return isSEC(u) || isMaster(u); }
  function podeMovimentarProcesso(u,p){ return isSEC(u) || isMaster(u) || isAdmin(u) || (isTecnico(u) && mesmoNte(nteUsuario(u), p && p.nte)); }
  function podeEditarEscolaCompleta(u){ return isSEC(u) || isMaster(u) || isAdmin(u); }
  function podeEditarEscolaLimitada(u){ return isTecnico(u); }
  function listaUsuarios(){
    const base = Array.isArray(window.usuariosDB) ? window.usuariosDB : (typeof usuariosDB !== 'undefined' && Array.isArray(usuariosDB) ? usuariosDB : []);
    window.usuariosDB = base; try{ usuariosDB = base; }catch(e){}
    return base;
  }
  function listaProcessos(){
    const base = Array.isArray(window.processosDB) ? window.processosDB : (typeof processosDB !== 'undefined' && Array.isArray(processosDB) ? processosDB : []);
    window.processosDB = base; try{ processosDB = base; }catch(e){}
    return base;
  }
  function listaEscolas(){
    const base = Array.isArray(window.escolasDB) ? window.escolasDB : (typeof escolasDB !== 'undefined' && Array.isArray(escolasDB) ? escolasDB : []);
    window.escolasDB = base; try{ escolasDB = base; }catch(e){}
    return base;
  }
  function registrar(acao){ try{ if(typeof registrarLog==='function') registrarLog(acao); }catch(e){} }
  function supa(){ try{ return (typeof obterSupabaseSIGEE==='function') ? obterSupabaseSIGEE() : null; }catch(e){ return null; } }
  async function salvarUsuarioV45(u){
    try{ localStorage.setItem('SIGEE_USUARIOS_COMPLETO_V41', JSON.stringify(listaUsuarios())); }catch(e){}
    try{
      const c=supa(); if(!c || !u) return;
      await c.from((window.SIGEE_SUPABASE_TABELAS&&window.SIGEE_SUPABASE_TABELAS.usuarios)||'usuarios_sigee')
        .upsert({ nome:u.nome, email:u.email, perfil:u.perfil, ativo:u.ativo!==false }, { onConflict:'email' });
    }catch(e){ console.warn('SIGEE V45: usuário preservado localmente; Supabase sem todas as colunas.', e); }
  }
  async function excluirUsuarioSupabaseV45(u){
    try{
      const c=supa(); if(!c || !u) return;
      const tabela=(window.SIGEE_SUPABASE_TABELAS&&window.SIGEE_SUPABASE_TABELAS.usuarios)||'usuarios_sigee';
      if(u.id) await c.from(tabela).delete().eq('id', u.id);
      else if(u.email) await c.from(tabela).delete().eq('email', u.email);
    }catch(e){ console.warn('SIGEE V45: exclusão de usuário não confirmada no Supabase.', e); }
  }
  function processoPayloadV45(p){
    try{ if(typeof processoParaSupabaseSIGEE==='function') return processoParaSupabaseSIGEE(p); }catch(e){}
    return { id:p.id, aluno_nome:p.aluno||p.aluno_nome, escola_nome:p.escola||p.escola_nome, documento_tipo:p.documento||p.documento_tipo, etapa_atual:p.etapa||p.etapa_atual, nte:p.nte, modalidade:p.modalidade||null, nivel_oferta:p.ensino||p.nivel_oferta||null };
  }
  async function salvarProcessoV45(p){
    try{ if(typeof salvarBancoLocalSIGEE==='function') salvarBancoLocalSIGEE(); }catch(e){}
    try{
      const c=supa(); if(!c || !p) return;
      await c.from((window.SIGEE_SUPABASE_TABELAS&&window.SIGEE_SUPABASE_TABELAS.processos)||'processos')
        .upsert(processoPayloadV45(p), { onConflict:'id' });
    }catch(e){ console.warn('SIGEE V45: processo alterado localmente; Supabase não confirmou.', e); }
  }
  async function excluirProcessoSupabaseV45(id){
    try{
      const c=supa(); if(!c) return;
      await c.from((window.SIGEE_SUPABASE_TABELAS&&window.SIGEE_SUPABASE_TABELAS.processos)||'processos').delete().eq('id', id);
      try{ await c.from((window.SIGEE_SUPABASE_TABELAS&&window.SIGEE_SUPABASE_TABELAS.solicitacoes)||'solicitacoes_sigee').delete().eq('id', id); }catch(e){}
    }catch(e){ console.warn('SIGEE V45: exclusão de processo não confirmada no Supabase.', e); }
  }
  function escolaPayloadV45(e){
    try{ if(typeof escolaParaSupabaseSIGEE==='function') return escolaParaSupabaseSIGEE(e); }catch(err){}
    const n = numNte(e.nte || e.nte_id) || e.nte_id || 26;
    return { cod_mec:e.cod_mec, nome_escola:e.nome_escola||e.nome, municipio:e.municipio||'', nte_id:n, dependencia_adm:e.dependencia_adm||e.dependencia||'Estadual', situacao_funcional:e.situacao_funcional||e.situacao||'Extinta', acervo:e.acervo||'Recolhido', status_acervo:e.status_acervo||e.acervo||'Recolhido', local_acervo:e.local_acervo||null, nome:e.nome||e.nome_escola, nte:e.nte, dependencia:e.dependencia||e.dependencia_adm, situacao:e.situacao||e.situacao_funcional, ativo:e.ativo!==false };
  }
  async function salvarEscolaV45(e){
    try{ if(typeof salvarBancoLocalSIGEE==='function') salvarBancoLocalSIGEE(); }catch(err){}
    try{
      const c=supa(); if(!c || !e) return;
      await c.from((window.SIGEE_SUPABASE_TABELAS&&window.SIGEE_SUPABASE_TABELAS.escolas)||'escolas_sigee')
        .upsert(escolaPayloadV45(e), { onConflict:'cod_mec' });
    }catch(err){ console.warn('SIGEE V45: escola alterada localmente; Supabase não confirmou.', err); }
  }
  function refresh(){
    try{ if(typeof carregarListaUsuarios==='function' && !document.getElementById('aba-usuarios')?.classList.contains('hidden')) carregarListaUsuarios(); }catch(e){}
    try{ if(typeof renderizarListaEscolasBufferMemoria==='function') renderizarListaEscolasBufferMemoria(); }catch(e){}
    try{ if(typeof carregarEContarProcessosHorizontais==='function') carregarEContarProcessosHorizontais(); }catch(e){}
    try{ if(typeof carregarDadosDashboardReal==='function') carregarDadosDashboardReal(); }catch(e){}
    try{ window.SIGEE_PERMISSOES_V44 && window.SIGEE_PERMISSOES_V44.aplicarPermissoesV44(); }catch(e){}
  }

  window.excluirUsuarioSistemaMasterV45 = async function(id){
    const uLog=user(); if(!podeExcluirUsuario(uLog)){ alert('Apenas SEC e Master podem excluir usuários.'); return; }
    const base=listaUsuarios(); const idx=base.findIndex(u=>String(u.id)===String(id));
    if(idx<0){ alert('Usuário não localizado.'); return; }
    const alvo=base[idx];
    if(low(alvo.email)===low(uLog.email)){ alert('Não é permitido excluir o próprio usuário logado.'); return; }
    if(!confirm(`Confirma excluir o usuário ${alvo.nome || alvo.email}?`)) return;
    base.splice(idx,1);
    try{ localStorage.setItem('SIGEE_USUARIOS_COMPLETO_V41', JSON.stringify(base)); }catch(e){}
    await excluirUsuarioSupabaseV45(alvo);
    registrar(`[MASTER] Excluiu usuário: ${alvo.nome || alvo.email}`);
    refresh();
  };

  const oldToggle = window.toggleStatusUsuarioMaster || (typeof toggleStatusUsuarioMaster !== 'undefined' ? toggleStatusUsuarioMaster : null);
  window.toggleStatusUsuarioMaster = async function(id){
    if(!podeGerirUsuarios(user())){ alert('Apenas SEC e Master podem ativar/desativar usuários.'); return; }
    const u=listaUsuarios().find(x=>String(x.id)===String(id)); if(!u) return;
    u.ativo = !(u.ativo!==false);
    await salvarUsuarioV45(u);
    registrar(`[MASTER] ${u.ativo?'Ativou':'Desativou'} usuário: ${u.nome || u.email}`);
    refresh();
  };
  try{ toggleStatusUsuarioMaster=window.toggleStatusUsuarioMaster; }catch(e){}

  const oldReset = window.resetarSenhaUsuarioMaster || (typeof resetarSenhaUsuarioMaster !== 'undefined' ? resetarSenhaUsuarioMaster : null);
  window.resetarSenhaUsuarioMaster = async function(id){
    if(!podeGerirUsuarios(user())){ alert('Apenas SEC e Master podem resetar senha.'); return; }
    const u=listaUsuarios().find(x=>String(x.id)===String(id)); if(!u) return;
    const nova=prompt('Informe a nova senha provisória:', '123'); if(nova===null) return;
    u.senha = txt(nova) || '123';
    await salvarUsuarioV45(u);
    registrar(`[MASTER] Resetou senha do usuário: ${u.nome || u.email}`);
    alert('Senha atualizada.');
    refresh();
  };
  try{ resetarSenhaUsuarioMaster=window.resetarSenhaUsuarioMaster; }catch(e){}

  const oldCarregarUsuarios = window.carregarListaUsuarios || (typeof carregarListaUsuarios !== 'undefined' ? carregarListaUsuarios : null);
  window.carregarListaUsuarios = function(){
    const corpo=document.getElementById('tabela-usuarios-corpo'); if(!corpo){ if(oldCarregarUsuarios) return oldCarregarUsuarios.apply(this,arguments); return; }
    corpo.innerHTML='';
    const uLog=user();
    let lista=listaUsuarios().slice();
    if(!isGlobal(uLog)) lista=lista.filter(u=>mesmoNte(nteUsuario(u), nteUsuario(uLog)));
    lista.forEach(u=>{
      const p=perfil(u); const nte=nteUsuario(u);
      const pode=podeGerirUsuarios(uLog);
      const botoes=pode?`<div class="flex items-center justify-center gap-1.5"><button onclick="abrirModalEditarUsuarioMaster(${u.id})" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Editar</button><button onclick="toggleStatusUsuarioMaster(${u.id})" class="${u.ativo!==false?'bg-red-600':'bg-emerald-600'} text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">${u.ativo!==false?'Desativar':'Ativar'}</button><button onclick="resetarSenhaUsuarioMaster(${u.id})" class="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Resetar Senha</button><button onclick="excluirUsuarioSistemaMasterV45(${u.id})" class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer">Excluir</button></div>`:'<span class="text-xs text-gray-400 italic">Sem permissão</span>';
      corpo.insertAdjacentHTML('beforeend',`<tr class="text-xs"><td class="p-3 font-bold">${u.nome||''}${p==='SEC'?'<span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px]">SEC</span>':''}<br><span class="text-xs text-gray-400 font-normal font-mono">${u.email||''}</span></td><td class="p-3 font-medium">${p}</td><td class="p-3 font-semibold text-gray-400">${nte}</td><td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo!==false?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${u.ativo!==false?'ATIVO':'INATIVO'}</span></td><td class="p-3 text-center">${botoes}</td></tr>`);
    });
  };
  try{ carregarListaUsuarios=window.carregarListaUsuarios; }catch(e){}

  window.editarProcessoMasterV45 = async function(id){
    const u=user(); if(!podeGerirProcessosMaster(u)){ alert('Apenas SEC e Master podem editar processos diretamente.'); return; }
    const p=listaProcessos().find(x=>String(x.id)===String(id)); if(!p) return;
    const aluno=prompt('Aluno:', p.aluno || p.aluno_nome || ''); if(aluno===null) return;
    const escola=prompt('Instituição:', p.escola || p.escola_nome || ''); if(escola===null) return;
    const doc=prompt('Documento:', p.documento || p.documento_tipo || 'HISTÓRICO'); if(doc===null) return;
    const nte=prompt('NTE:', p.nte || ''); if(nte===null) return;
    p.aluno=p.aluno_nome=txt(aluno).toUpperCase(); p.escola=p.escola_nome=txt(escola).toUpperCase(); p.documento=p.documento_tipo=txt(doc).toUpperCase(); p.nte=txt(nte) || p.nte;
    registrar(`[MASTER] Editou processo ID ${p.id}.`); await salvarProcessoV45(p); refresh();
  };
  window.avancarProcessoMasterV45 = async function(id){
    const u=user(); if(!podeGerirProcessosMaster(u)){ alert('Apenas SEC e Master podem avançar processos diretamente.'); return; }
    const p=listaProcessos().find(x=>String(x.id)===String(id)); if(!p) return;
    const atual=ETAPAS_V45.findIndex(e=>up(e)===up(p.etapa||p.etapa_atual)); const prox=ETAPAS_V45[Math.min(ETAPAS_V45.length-1, Math.max(0,atual)+1)];
    p.etapa=p.etapa_atual=prox; p.data_etapa_atual=hojeBR();
    registrar(`[MASTER] Avançou processo ID ${p.id} para ${prox}.`); await salvarProcessoV45(p); refresh();
  };
  window.regredirProcessoMasterV45 = async function(id){
    const u=user(); if(!podeGerirProcessosMaster(u)){ alert('Apenas SEC e Master podem regredir processos diretamente.'); return; }
    const p=listaProcessos().find(x=>String(x.id)===String(id)); if(!p) return;
    const atual=ETAPAS_V45.findIndex(e=>up(e)===up(p.etapa||p.etapa_atual)); const ant=ETAPAS_V45[Math.max(0, (atual<0?0:atual)-1)];
    p.etapa=p.etapa_atual=ant; p.data_etapa_atual=hojeBR();
    registrar(`[MASTER] Regrediu processo ID ${p.id} para ${ant}.`); await salvarProcessoV45(p); refresh();
  };
  window.excluirProcessoMasterV45 = async function(id){
    const u=user(); if(!podeGerirProcessosMaster(u)){ alert('Apenas SEC e Master podem excluir processos.'); return; }
    const base=listaProcessos(); const idx=base.findIndex(x=>String(x.id)===String(id)); if(idx<0) return;
    const p=base[idx]; if(!confirm(`Confirma excluir o processo de ${p.aluno || p.aluno_nome || 'aluno'}?`)) return;
    base.splice(idx,1); await excluirProcessoSupabaseV45(id); registrar(`[MASTER] Excluiu processo ID ${id}.`); refresh();
  };

  function diasDesde(valor){
    if(!valor) return 0; let d=null, s=txt(valor);
    if(/^\d{2}\/\d{2}\/\d{4}/.test(s)){ const a=s.slice(0,10).split('/').map(Number); d=new Date(a[2],a[1]-1,a[0]); } else d=new Date(s);
    if(!d || Number.isNaN(d.getTime())) return 0; const h=new Date(); h.setHours(0,0,0,0); d.setHours(0,0,0,0); return Math.max(0,Math.floor((h-d)/86400000));
  }
  function clsEtapa(etapa){ const e=up(etapa); if(e.includes('ANAL')) return 'bg-purple-600'; if(e.includes('PEND')) return 'bg-red-600'; if(e.includes('DIGIT')) return 'bg-orange-500'; if(e.includes('CONFER')) return 'bg-green-600'; if(e.includes('ASSIN')) return 'bg-blue-700'; if(e.includes('AGUARD')) return 'bg-teal-600'; if(e.includes('RETIR')) return 'bg-gray-700'; return 'bg-sky-600'; }
  function acaoFluxo(p){
    if(!podeMovimentarProcesso(user(),p)) return '<span class="text-gray-400 font-bold">Sem ação</span>';
    const e=up(p.etapa||p.etapa_atual);
    if(e.includes('ANAL')) return `<button onclick="abrirModalFluxoAnalise(${p.id})" class="bg-purple-700 text-white font-bold px-2 py-1 rounded text-[10px]">Análise Realizada</button>`;
    if(e.includes('PEND')) return `<button onclick="abrirModalFluxoPendencia(${p.id})" class="bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px]">Tratar Pendência</button>`;
    if(e.includes('DIGIT')) return `<button onclick="abrirModalFluxoDigitacao(${p.id})" class="bg-orange-600 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Digitado</button>`;
    if(e.includes('CONFER')) return `<button onclick="abrirModalFluxoConferencia(${p.id})" class="bg-green-700 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Conferido</button>`;
    if(e.includes('ASSIN')) return `<button onclick="abrirModalFluxoAssinatura(${p.id})" class="bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px]">Deferido</button>`;
    if(e.includes('AGUARD')) return `<button onclick="abrirModalFluxoAguardando(${p.id})" class="bg-gray-700 text-white font-bold px-2 py-1 rounded text-[10px]">Retirado</button>`;
    if(e.includes('RETIR')) return '<span class="text-gray-300 font-bold">Finalizado</span>';
    return `<button onclick="abrirModalFluxoDesarquivamento(${p.id})" class="bg-sky-700 text-white font-bold px-2 py-1 rounded text-[10px]">Documento Recebido</button>`;
  }
  window.renderizarProcessosFlutuantes = function(){
    const corpo=document.getElementById('tabela-processos-corpo'); if(!corpo) return; corpo.innerHTML='';
    let lista=listaProcessos().slice(); const u=user();
    if(!isGlobal(u)) lista=lista.filter(p=>mesmoNte(nteUsuario(u), p.nte));
    const etapa=(typeof etapaFiltroAtual!=='undefined'?etapaFiltroAtual:'TODOS'); if(etapa && etapa!=='TODOS') lista=lista.filter(p=>up(p.etapa||p.etapa_atual)===up(etapa));
    const busca=up(document.getElementById('busca-proc-nome')?.value||''); if(busca) lista=lista.filter(p=>up((p.aluno||p.aluno_nome||'')+' '+(p.escola||p.escola_nome||'')).includes(busca));
    lista.forEach(p=>{
      const etapaTxt=txt(p.etapa||p.etapa_atual||'Desarquivamento');
      const master=podeGerirProcessosMaster(u)?`<div class="mt-1 flex flex-wrap justify-center gap-1"><button onclick="editarProcessoMasterV45(${p.id})" class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">Editar</button><button onclick="regredirProcessoMasterV45(${p.id})" class="bg-amber-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Regredir</button><button onclick="avancarProcessoMasterV45(${p.id})" class="bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Avançar</button><button onclick="excluirProcessoMasterV45(${p.id})" class="bg-red-700 text-white text-[9px] px-2 py-0.5 rounded font-bold">Excluir</button></div>`:'';
      corpo.insertAdjacentHTML('beforeend',`<tr class="hover:bg-white/10 text-white"><td class="p-2.5 font-bold truncate"><span class="block uppercase truncate">${txt(p.aluno||p.aluno_nome)}</span><span class="text-[10px] text-cyan-200 font-extrabold">${txt(p.documento||p.documento_tipo)}</span></td><td class="p-2.5 truncate"><span class="block font-bold text-white truncate text-[10px]">${txt(p.escola||p.escola_nome)}</span><span class="text-[9px] text-cyan-200 block font-semibold uppercase truncate">${txt(p.nte)}</span></td><td class="p-2.5 text-center"><span class="px-2 py-1 ${clsEtapa(etapaTxt)} text-white font-black rounded text-[9px] uppercase block">${etapaTxt}</span></td><td class="p-2.5 text-center font-bold">${diasDesde(p.data_etapa_atual||p.created_at)} dias</td><td class="p-2.5 text-center">${acaoFluxo(p)}${master}</td></tr>`);
    });
  };
  try{ renderizarProcessosFlutuantes=window.renderizarProcessosFlutuantes; }catch(e){}

  window.editarEscolaSIGEEV45 = async function(id){
    const u=user(); const e=listaEscolas().find(x=>String(x.id)===String(id) || String(x.cod_mec)===String(id)); if(!e) return;
    if(!podeEditarEscolaCompleta(u) && !podeEditarEscolaLimitada(u)){ alert('Sem permissão para alterar escola.'); return; }
    if(podeEditarEscolaLimitada(u) && !isGlobal(u) && !isAdmin(u) && !mesmoNte(nteUsuario(u), e.nte)){ alert('Técnico só altera escolas do próprio NTE.'); return; }
    if(podeEditarEscolaCompleta(u)){
      const nome=prompt('Nome da escola:', e.nome||e.nome_escola||''); if(nome===null) return;
      const municipio=prompt('Município:', e.municipio||''); if(municipio===null) return;
      const nte=prompt('NTE:', e.nte||''); if(nte===null) return;
      const dependencia=prompt('Dependência administrativa:', e.dependencia||e.dependencia_adm||''); if(dependencia===null) return;
      e.nome=e.nome_escola=txt(nome).toUpperCase(); e.municipio=txt(municipio).toUpperCase(); e.nte=txt(nte); e.dependencia=e.dependencia_adm=txt(dependencia);
    }
    const sit=prompt('Situação da escola:', e.situacao||e.situacao_funcional||'Extinta'); if(sit===null) return;
    const acv=prompt('Status do Acervo:', e.status_acervo||e.acervo||'Recolhido'); if(acv===null) return;
    const loc=prompt('Local do acervo:', e.local_acervo||''); if(loc===null) return;
    e.situacao=e.situacao_funcional=txt(sit); e.acervo=e.status_acervo=txt(acv); e.local_acervo=txt(loc);
    await salvarEscolaV45(e);
    registrar(`${perfil(u)} alterou escola ${e.cod_mec || e.nome}: situação=${e.situacao}; acervo=${e.status_acervo}; local=${e.local_acervo}`);
    refresh();
  };

  const oldRenderEscolas = window.renderizarListaEscolasBufferMemoria || (typeof renderizarListaEscolasBufferMemoria !== 'undefined' ? renderizarListaEscolasBufferMemoria : null);
  window.renderizarListaEscolasBufferMemoria = function(){
    const corpo=document.getElementById('tabela-escolas-corpo');
    if(!corpo){ if(oldRenderEscolas) return oldRenderEscolas.apply(this,arguments); return; }
    corpo.innerHTML='';
    let lista=listaEscolas().slice(); const u=user(); if(!isGlobal(u)) lista=lista.filter(e=>mesmoNte(nteUsuario(u), e.nte));
    const busca=up(document.getElementById('busca-escola')?.value||''); if(busca) lista=lista.filter(e=>up((e.cod_mec||'')+' '+(e.nome||e.nome_escola||'')+' '+(e.municipio||'')).includes(busca));
    const porPagina=(typeof totalPorPaginaEscola!=='undefined'?totalPorPaginaEscola:8); let pagAtual=(typeof paginaEscolaAtual!=='undefined'?paginaEscolaAtual:1); const totalPag=Math.max(1,Math.ceil(lista.length/porPagina)); if(pagAtual>totalPag) pagAtual=1; try{ paginaEscolaAtual=pagAtual; }catch(e){}
    lista.slice((pagAtual-1)*porPagina,(pagAtual-1)*porPagina+porPagina).forEach(e=>{
      const situ=up(e.situacao||e.situacao_funcional).includes('ATIVA')?'<span class="font-black text-green-400">ATIVA</span>':'<span class="font-black text-red-400">EXTINTA</span>';
      const acv=up(e.status_acervo||e.acervo).includes('RECOLHIDO')?'<span class="font-black text-green-400">RECOLHIDO</span>':'<span class="font-black text-red-400">NÃO RECOLHIDO</span>';
      const pode = podeEditarEscolaCompleta(u) || podeEditarEscolaLimitada(u);
      corpo.insertAdjacentHTML('beforeend',`<tr class="hover:bg-white/10 text-[11px] text-white"><td class="p-3 font-mono font-bold">${txt(e.cod_mec)}</td><td class="p-3 font-bold uppercase">${txt(e.nome||e.nome_escola)}</td><td class="p-3 uppercase font-medium">${txt(e.municipio)}</td><td class="p-3 font-semibold">${txt(e.nte)}<br><span class="text-[9px] bg-white/10 px-1 rounded">${txt(e.dependencia||e.dependencia_adm)}</span></td><td class="p-3">${situ}</td><td class="p-3">${acv}</td><td class="p-3 text-center">${pode?`<button onclick="editarEscolaSIGEEV45('${e.id||e.cod_mec}')" class="bg-cyan-600/80 text-white font-bold px-2 py-1 rounded text-[10px]">Alterar</button>`:'<span class="text-gray-400">Sem ação</span>'}</td></tr>`);
    });
    const info=document.getElementById('info-quantidade-escolas-carregadas'); if(info) info.innerText=`Exibindo: ${lista.length} registros | Banco: Supabase carregado`;
    const ptxt=document.getElementById('txt-escola-paginacao'); if(ptxt) ptxt.innerText=`Página ${pagAtual} de ${totalPag}`;
  };
  try{ renderizarListaEscolasBufferMemoria=window.renderizarListaEscolasBufferMemoria; }catch(e){}

  function aplicarV45(){
    try{ window.SIGEE_PERMISSOES_V44 && window.SIGEE_PERMISSOES_V44.aplicarPermissoesV44(); }catch(e){}
    const u=user(); if(!u) return;
    document.querySelectorAll('#menu-usuarios').forEach(el=>el.classList.toggle('hidden', !podeGerirUsuarios(u)));
    if(document.getElementById('aba-processos') && !document.getElementById('aba-processos').classList.contains('hidden')) window.renderizarProcessosFlutuantes();
    if(document.getElementById('aba-escolas') && !document.getElementById('aba-escolas').classList.contains('hidden')) window.renderizarListaEscolasBufferMemoria();
  }
  const navPrev=window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  window.navegar=function(){ const r=typeof navPrev==='function'?navPrev.apply(this,arguments):undefined; setTimeout(aplicarV45,30); return r; };
  try{ navegar=window.navegar; }catch(e){}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicarV45,500));
  // Removido polling: catálogo é atualizado somente ao abrir/pesquisar.
  window.SIGEE_V45 = { aplicarV45, editarEscolaSIGEEV45, excluirUsuarioSistemaMasterV45, editarProcessoMasterV45, avancarProcessoMasterV45, regredirProcessoMasterV45, excluirProcessoMasterV45 };
})();

/* =====================================================================
 * SIGEE CORE PRODUCAO V2 - autenticação, filtros por NTE, escolas e usuários
 * Aplicado sobre a base estável enviada pelo usuário.
 * Objetivo: corrigir filtro do Técnico, evitar carga global de escolas,
 * habilitar autocomplete de escola e persistir usuários no Supabase.
 * ===================================================================== */
(function(){
  'use strict';

  const CFG = window.SIGEE_CONFIG || {};
  const URL = CFG?.supabase?.url || window.SIGEE_SUPABASE_URL_CONFIG || 'https://ckxbvsfjsknbgpfpxcyy.supabase.co';
  const KEY = CFG?.supabase?.anonKey || window.SIGEE_SUPABASE_ANON_KEY_CONFIG;
  const T = Object.assign({
    escolas: 'escolas_sigee',
    processos: 'processos',
    usuarios: 'usuarios_sigee',
    logs: 'logs_sigee'
  }, CFG?.supabase?.tabelas || {});

  function client(){
    if(window.SIGEE_SUPABASE_CLIENT) return window.SIGEE_SUPABASE_CLIENT;
    if(window.sigEESupabaseClient) return window.sigEESupabaseClient;
    if(window.supabase && KEY){
      window.SIGEE_SUPABASE_CLIENT = window.supabase.createClient(URL, KEY);
      return window.SIGEE_SUPABASE_CLIENT;
    }
    return null;
  }
  function txt(v){ return String(v ?? '').trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function up(v){ return txt(v).toUpperCase(); }
  function noAccent(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function perfil(v){
    const p = noAccent(v).toLowerCase();
    if(p === 'sec') return 'SEC';
    if(p.includes('master')) return 'Master';
    if(p.includes('administr')) return 'Administrador';
    if(p.includes('tecnico')) return 'Tecnico';
    if(p.includes('consulta')) return 'Consulta';
    return txt(v) || 'Tecnico';
  }
  function nteIdFrom(v){
    if(v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if(Number.isFinite(n) && n > 0) return n;
    const m = txt(v).match(/(\d{1,2})/);
    return m ? Number(m[1]) : null;
  }
  function nteTexto(id){
    const n = nteIdFrom(id);
    return n ? `NTE ${String(n).padStart(2,'0')}` : 'SEC - TODOS OS NTEs';
  }
  function usuario(){ return window.usuarioLogado || null; }
  function isGlobal(u = usuario()){
    const p = perfil(u?.perfil);
    return p === 'Master' || p === 'SEC';
  }
  function nteIdUsuario(u = usuario()){
    const direto = nteIdFrom(u?.nte_id);
    if(direto) return direto;
    return nteIdFrom(u?.nte);
  }
  function normalizarUsuario(row){
    const idNte = nteIdFrom(row?.nte_id) || nteIdFrom(row?.nte);
    return {
      id: row?.id,
      nome: up(row?.nome || row?.name || ''),
      email: low(row?.email),
      senha: txt(row?.senha || row?.senha_hash || row?.password || ''),
      senha_hash: txt(row?.senha_hash || row?.senha || ''),
      perfil: perfil(row?.perfil),
      nte_id: idNte,
      nte: idNte ? nteTexto(idNte) : txt(row?.nte || 'SEC - TODOS OS NTEs'),
      ativo: row?.ativo !== false && row?.Ativo !== false
    };
  }
  function normalizarEscola(row){
    return {
      id: row?.id,
      cod_mec: txt(row?.cod_mec || row?.codigo_mec || row?.mec),
      nome: up(row?.nome_escola || row?.nome || row?.instituicao),
      nome_escola: up(row?.nome_escola || row?.nome || row?.instituicao),
      municipio: up(row?.municipio || row?.cidade),
      nte_id: nteIdFrom(row?.nte_id) || nteIdFrom(row?.nte),
      nte: txt(row?.nte || nteTexto(row?.nte_id)),
      dependencia: txt(row?.dependencia || row?.dependencia_adm),
      dependencia_adm: txt(row?.dependencia_adm || row?.dependencia),
      situacao: txt(row?.situacao || row?.situacao_funcional),
      situacao_funcional: txt(row?.situacao_funcional || row?.situacao),
      acervo: txt(row?.acervo || row?.status_acervo),
      status_acervo: txt(row?.status_acervo || row?.acervo),
      local_acervo: txt(row?.local_acervo),
      ativo: row?.ativo !== false
    };
  }
  function normalizarProcesso(row){
    return {
      id: row?.id,
      aluno: up(row?.aluno_nome || row?.aluno || row?.nome_solicitante),
      aluno_nome: up(row?.aluno_nome || row?.aluno || row?.nome_solicitante),
      escola: up(row?.escola_nome || row?.escola || row?.nome_escola),
      escola_nome: up(row?.escola_nome || row?.escola || row?.nome_escola),
      documento: txt(row?.documento_tipo || row?.documento || row?.documento_solicitado || 'Histórico'),
      documento_tipo: txt(row?.documento_tipo || row?.documento || row?.documento_solicitado || 'Histórico'),
      etapa: txt(row?.etapa_atual || row?.fase_atual || row?.etapa || 'Desarquivamento'),
      etapa_atual: txt(row?.etapa_atual || row?.fase_atual || row?.etapa || 'Desarquivamento'),
      nte: txt(row?.nte || nteTexto(row?.nte_id)),
      nte_id: nteIdFrom(row?.nte_id) || nteIdFrom(row?.nte),
      created_at: row?.created_at || row?.criado_em || null,
      data_etapa_atual: row?.data_etapa || row?.created_at || row?.criado_em || null
    };
  }

  async function registrarLogCore(acao, detalhes=''){
    try{
      const c = client(); const u = usuario(); if(!c || !u) return;
      await c.from(T.logs).insert({
        usuario_id: u.id || null,
        nome: u.nome || 'Usuário',
        email: u.email || '',
        nte: u.nte || nteTexto(u.nte_id),
        perfil: u.perfil || '',
        acao: txt(acao),
        detalhes: txt(detalhes)
      });
    }catch(e){ console.warn('[SIGEE] log não gravado', e); }
  }

  window.handleLogin = async function(event){
    if(event) event.preventDefault();
    const email = low(document.getElementById('login-email')?.value);
    const senha = txt(document.getElementById('login-senha')?.value);
    if(!email || !senha){ alert('Informe e-mail e senha.'); return; }
    const c = client();
    if(!c){ alert('Supabase indisponível. Verifique a conexão.'); return; }
    try{
      let { data, error } = await c.from(T.usuarios).select('*').eq('email', email).maybeSingle();
      if(error) throw error;
      if(!data){ alert('Usuário não encontrado.'); return; }
      const u = normalizarUsuario(data);
      if(u.ativo === false){ alert('Usuário inativo.'); return; }
      const senhaOk = senha === txt(data.senha) || senha === txt(data.senha_hash) || senha === txt(u.senha) || senha === txt(u.senha_hash);
      if(!senhaOk){ alert('Senha inválida.'); return; }
      if(!isGlobal(u) && !nteIdUsuario(u)){
        alert('Usuário sem NTE vinculado. Ajuste o cadastro no Supabase.'); return;
      }
      window.usuarioLogado = u;
      try{ usuarioLogado = u; }catch(e){}
      try{ localStorage.setItem('SIGEE_USUARIO_LOGADO', JSON.stringify(u)); }catch(e){}
      document.getElementById('user-nome') && (document.getElementById('user-nome').innerText = u.nome);
      document.getElementById('user-perfil') && (document.getElementById('user-perfil').innerText = `${u.perfil} | ${u.nte}`);
      document.getElementById('tela-login')?.classList.add('hidden');
      document.getElementById('sistema-dashboard')?.classList.remove('hidden');
      await carregarBaseUsuarioCore();
      aplicarPermissoesCore();
      await registrarLogCore('LOGIN', `Perfil ${u.perfil} / ${u.nte}`);
      if(typeof navegar === 'function') navegar('processos'); else await carregarDashboardCore();
    }catch(e){
      console.error('[SIGEE] Erro login', e);
      alert('Erro no login: ' + (e.message || e));
    }
  };
  try{ handleLogin = window.handleLogin; }catch(e){}

  async function queryEscolasBase({termo='', limit=500, offset=0}={}){
    const c = client(); if(!c) return [];
    const u = usuario();
    let q = c.from(T.escolas)
      .select('id,cod_mec,nome_escola,nome,municipio,nte_id,nte,dependencia_adm,dependencia,situacao_funcional,situacao,acervo,status_acervo,local_acervo,ativo')
      .order('nome_escola', { ascending: true })
      .range(offset, offset + limit - 1);
    if(!isGlobal(u)){
      const id = nteIdUsuario(u);
      if(id) q = q.eq('nte_id', id);
    }
    if(txt(termo).length >= 2){
      const t = txt(termo).replace(/[%_]/g, '');
      q = q.or(`nome_escola.ilike.%${t}%,nome.ilike.%${t}%,municipio.ilike.%${t}%,cod_mec.ilike.%${t}%`);
    }
    const { data, error } = await q;
    if(error){ console.error('[SIGEE] escolas', error); return []; }
    return (data || []).map(normalizarEscola);
  }

  async function carregarBaseUsuarioCore(){
    const c = client(); if(!c) return;
    const u = usuario();
    try{
      const [escolas, processos, usuarios] = await Promise.all([
        queryEscolasBase({limit: isGlobal(u) ? 500 : 1000}),
        (async()=>{
          let q = c.from(T.processos).select('*').order('created_at', { ascending: false }).limit(1000);
          if(!isGlobal(u)) q = q.eq('nte', nteTexto(nteIdUsuario(u)));
          const {data,error} = await q; if(error) throw error; return (data||[]).map(normalizarProcesso);
        })(),
        (async()=>{
          let q = c.from(T.usuarios).select('*').order('nome', { ascending: true });
          if(!isGlobal(u)){ const id = nteIdUsuario(u); if(id) q = q.eq('nte_id', id); }
          const {data,error} = await q; if(error) throw error; return (data||[]).map(normalizarUsuario);
        })()
      ]);
      window.escolasDB = escolas;
      window.processosDB = processos;
      window.usuariosDB = usuarios;
      try{ escolasDB = escolas; processosDB = processos; usuariosDB = usuarios; }catch(e){}
    }catch(e){ console.error('[SIGEE] carregar base', e); }
  }

  async function countTabela(tabela, filtroFn){
    const c = client(); if(!c) return 0;
    let q = c.from(tabela).select('*', { count: 'exact', head: true });
    if(typeof filtroFn === 'function') q = filtroFn(q);
    const { count, error } = await q;
    if(error){ console.warn('[SIGEE] count', tabela, error); return 0; }
    return count || 0;
  }
  function filtroNteQuery(q){
    const u = usuario();
    if(!isGlobal(u)){
      const id = nteIdUsuario(u);
      if(id) q = q.eq('nte_id', id);
    }
    return q;
  }
  function filtroNteProcessoQuery(q){
    const u = usuario();
    if(!isGlobal(u)){
      const id = nteIdUsuario(u);
      if(id) q = q.eq('nte', nteTexto(id));
    }
    return q;
  }

  window.carregarDadosDashboardReal = async function(){
    const u = usuario(); if(!u) return;
    try{
      configurarFiltroDashboardCore();
      const filtroSelecionado = document.getElementById('filtro-dashboard-nte')?.value || 'TODOS';
      const globalComFiltro = isGlobal(u) && filtroSelecionado !== 'TODOS';
      const nteFiltroId = globalComFiltro ? nteIdFrom(filtroSelecionado) : nteIdUsuario(u);
      const filtroEscola = q => {
        if(isGlobal(u) && filtroSelecionado === 'TODOS') return q;
        return nteFiltroId ? q.eq('nte_id', nteFiltroId) : q;
      };
      const filtroProc = q => {
        if(isGlobal(u) && filtroSelecionado === 'TODOS') return q;
        return nteFiltroId ? q.eq('nte', nteTexto(nteFiltroId)) : q;
      };
      const [totalEscolas, acervos, estaduais, procTotal] = await Promise.all([
        countTabela(T.escolas, filtroEscola),
        countTabela(T.escolas, q => filtroEscola(q).ilike('status_acervo','%recolhido%')),
        countTabela(T.escolas, q => filtroEscola(q).ilike('dependencia_adm','%estad%')),
        countTabela(T.processos, filtroProc)
      ]);
      const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.innerText = v; };
      set('dash-escolas', totalEscolas);
      set('dash-acervos', acervos);
      set('dash-estaduais', estaduais);
      set('dash-usuarios', isGlobal(u) ? (window.usuariosDB||[]).length : (window.usuariosDB||[]).filter(x=>nteIdUsuario(x)===nteIdUsuario(u)).length);
      // Município precisa de amostra local para não pesar no banco.
      const amostra = await queryEscolasBase({limit: isGlobal(u) && filtroSelecionado==='TODOS' ? 1000 : 2000});
      set('dash-municipios', new Set(amostra.map(e=>up(e.municipio)).filter(Boolean)).size);
      const etapas = ['Desarquivamento','Análise','Pendência','Digitação','Conferência','Assinatura','Aguardando Retirada','Retirado'];
      await Promise.all(etapas.map(async etapa=>{
        const id = etapa.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
        let dom = id === 'analise' ? 'dash-proc-analise' : id === 'pendencia' ? 'dash-proc-pendencia' : id === 'digitacao' ? 'dash-proc-digitacao' : id === 'conferencia' ? 'dash-proc-conferencia' : id === 'assinatura' ? 'dash-proc-assinatura' : id === 'aguardando-retirada' ? 'dash-proc-aguardando' : id === 'retirado' ? 'dash-proc-retirado' : 'dash-proc-desarquivamento';
        set(dom, await countTabela(T.processos, q => filtroProc(q).eq('etapa_atual', etapa)));
      }));
      set('count-horiz-todos', procTotal);
      renderizarProcessosFlutuantes && renderizarProcessosFlutuantes();
    }catch(e){ console.error('[SIGEE] dashboard', e); }
  };
  try{ carregarDadosDashboardReal = window.carregarDadosDashboardReal; }catch(e){}

  function configurarFiltroDashboardCore(){
    const box = document.getElementById('box-filtro-dashboard-master');
    const sel = document.getElementById('filtro-dashboard-nte');
    if(!box || !sel) return;
    const u = usuario();
    if(!isGlobal(u)){ box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    if(!sel.dataset.corev2){
      sel.innerHTML = '<option value="TODOS">TODOS</option>' + Array.from({length:27},(_,i)=>`<option value="NTE ${String(i+1).padStart(2,'0')}">NTE ${String(i+1).padStart(2,'0')}</option>`).join('');
      sel.dataset.corev2 = '1';
      sel.onchange = () => window.carregarDadosDashboardReal();
    }
  }

  window.renderizarListaEscolasBufferMemoria = async function(){
    const corpo = document.getElementById('tabela-escolas-corpo'); if(!corpo) return;
    const busca = txt(document.getElementById('busca-escola')?.value || '');
    const lista = await queryEscolasBase({termo: busca, limit: 250});
    window.escolasDB = lista; try{ escolasDB = lista; }catch(e){}
    corpo.innerHTML = '';
    const u = usuario();
    for(const e of lista){
      const situ = up(e.situacao || e.situacao_funcional).includes('ATIVA') ? '<span class="font-black text-green-500">ATIVA</span>' : '<span class="font-black text-red-500">EXTINTA</span>';
      const acvTxt = up(e.status_acervo || e.acervo);
      const acv = acvTxt.includes('RECOLHIDO') && !acvTxt.includes('NAO') && !acvTxt.includes('NÃO') ? '<span class="font-black text-green-500">RECOLHIDO</span>' : '<span class="font-black text-red-500">NÃO RECOLHIDO</span>';
      const can = perfil(u?.perfil) !== 'Consulta';
      corpo.insertAdjacentHTML('beforeend', `<tr class="hover:bg-gray-50 text-[12px]"><td class="p-3 font-mono font-bold">${e.cod_mec}</td><td class="p-3 font-bold uppercase">${e.nome}</td><td class="p-3 uppercase">${e.municipio}</td><td class="p-3 font-semibold">${e.nte}<br><span class="text-[10px] bg-gray-100 px-1 rounded">${e.dependencia || e.dependencia_adm}</span></td><td class="p-3">${situ}</td><td class="p-3">${acv}</td><td class="p-3 text-center">${can ? `<button onclick="editarEscolaSIGEEV45('${e.id || e.cod_mec}')" class="bg-cyan-700 text-white font-bold px-2 py-1 rounded text-[10px]">Alterar</button>` : '<span class="text-gray-400">Consulta</span>'}</td></tr>`);
    }
    const info = document.getElementById('info-quantidade-escolas-carregadas');
    if(info) info.innerText = `Exibindo: ${lista.length} registros | ${isGlobal() ? 'filtro atual' : nteTexto(nteIdUsuario())}`;
  };
  try{ renderizarListaEscolasBufferMemoria = window.renderizarListaEscolasBufferMemoria; }catch(e){}

  window.abrirFormularioNovaSolicitacao = function(){
    ['novo-proc-aluno','novo-proc-documento','novo-proc-modalidade','novo-proc-ensino','novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id=>{
      const el=document.getElementById(id); if(!el) return; if(el.tagName==='SELECT') el.selectedIndex=0; else el.value='';
    });
    const chk=document.getElementById('f01-chk-acolhido'); if(chk) chk.checked=false;
    const btn=document.getElementById('btn-submeter-nova-solicitacao'); if(btn) btn.disabled=true;
    document.getElementById('modal-nova-solicitacao')?.classList.remove('hidden');
    instalarAutocompleteEscolaCore();
  };
  try{ abrirFormularioNovaSolicitacao = window.abrirFormularioNovaSolicitacao; }catch(e){}

  function instalarAutocompleteEscolaCore(){
    const original = document.getElementById('novo-proc-escola'); if(!original) return;
    if(original.dataset.autocompleteCore === '1') return;
    const parent = original.parentElement;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'novo-proc-escola';
    input.required = true;
    input.autocomplete = 'off';
    input.placeholder = 'Digite pelo menos 2 letras da escola...';
    input.className = original.className || 'w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold';
    input.dataset.autocompleteCore = '1';
    const hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.id = 'novo-proc-escola-cod-mec';
    const box = document.createElement('div');
    box.id = 'novo-proc-escola-resultados';
    box.className = 'hidden absolute z-[9999] bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto w-full text-xs';
    parent.style.position = 'relative';
    original.replaceWith(input);
    parent.appendChild(hidden);
    parent.appendChild(box);
    let timer=null;
    input.addEventListener('input', ()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>buscarSugestoesEscolaCore(input.value, box, input, hidden), 250);
    });
    input.addEventListener('focus', ()=>{ if(txt(input.value).length>=2) buscarSugestoesEscolaCore(input.value, box, input, hidden); });
    document.addEventListener('click', (ev)=>{ if(!parent.contains(ev.target)) box.classList.add('hidden'); });
  }
  async function buscarSugestoesEscolaCore(termo, box, input, hidden){
    termo = txt(termo);
    if(termo.length < 2){ box.innerHTML='<div class="p-3 text-gray-500">Digite pelo menos 2 letras.</div>'; box.classList.remove('hidden'); return; }
    box.innerHTML='<div class="p-3 text-gray-500">Pesquisando...</div>'; box.classList.remove('hidden');
    const lista = await queryEscolasBase({termo, limit: 30});
    if(!lista.length){ box.innerHTML='<div class="p-3 text-red-600 font-bold">Nenhuma escola encontrada para este NTE.</div>'; return; }
    box.innerHTML='';
    lista.forEach(e=>{
      const item=document.createElement('button');
      item.type='button'; item.className='block w-full text-left p-2 hover:bg-blue-50 border-b';
      item.innerHTML=`<div class="font-black text-blue-900">${e.nome}</div><div class="text-[10px] text-gray-600">${e.municipio} | MEC ${e.cod_mec} | ${e.nte}</div>`;
      item.onclick=()=>{
        input.value=e.nome; hidden.value=e.cod_mec; box.classList.add('hidden'); preencherAutofillEscolaCore(e);
      };
      box.appendChild(item);
    });
  }
  function preencherAutofillEscolaCore(e){
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.value = v || ''; };
    set('novo-autofill-mec', e.cod_mec);
    set('novo-autofill-nte', e.nte || nteTexto(e.nte_id));
    set('novo-autofill-municipio', e.municipio);
    set('novo-autofill-dep', e.dependencia || e.dependencia_adm);
    set('novo-autofill-situacao', e.situacao || e.situacao_funcional);
    set('novo-autofill-acervo', e.status_acervo || e.acervo);
    set('novo-autofill-local-acervo', e.local_acervo);
  }

  window.salvarNovoUsuarioFormularioMaster = async function(event){
    if(event) event.preventDefault();
    const u = usuario(); if(!isGlobal(u)){ alert('Apenas Master/SEC podem gerenciar usuários.'); return; }
    const id = txt(document.getElementById('user-form-id')?.value);
    const nome = up(document.getElementById('user-form-nome')?.value);
    const email = low(document.getElementById('user-form-email')?.value);
    const senha = txt(document.getElementById('user-form-senha')?.value || '123');
    const perfilSel = perfil(document.getElementById('user-form-perfil')?.value || 'Tecnico');
    const nteRaw = txt(document.getElementById('user-form-nte')?.value);
    const nte_id = perfilSel === 'SEC' || perfilSel === 'Master' ? null : nteIdFrom(nteRaw);
    if(!nome || !email){ alert('Informe nome e e-mail.'); return; }
    if(perfilSel !== 'SEC' && perfilSel !== 'Master' && !nte_id){ alert('Informe o NTE do usuário.'); return; }
    const payload = { nome, email, senha, senha_hash: senha, perfil: perfilSel, nte_id, nte: nte_id ? nteTexto(nte_id) : 'SEC - TODOS OS NTEs', ativo: true, Ativo: true, forcar_troca_senha: false };
    try{
      const c = client(); if(!c) throw new Error('Supabase indisponível');
      let resp;
      if(id){ resp = await c.from(T.usuarios).update(payload).eq('id', Number(id)).select('*').maybeSingle(); }
      else { resp = await c.from(T.usuarios).insert(payload).select('*').maybeSingle(); }
      if(resp.error) throw resp.error;
      await carregarBaseUsuarioCore();
      if(typeof carregarListaUsuarios === 'function') carregarListaUsuarios();
      if(typeof fecharModalUsuario === 'function') fecharModalUsuario();
      await registrarLogCore(id ? 'EDITOU USUÁRIO' : 'CADASTROU USUÁRIO', email);
      alert('Usuário salvo no Supabase.');
    }catch(e){ console.error('[SIGEE] salvar usuário', e); alert('Erro ao salvar usuário: ' + (e.message || e)); }
  };
  try{ salvarNovoUsuarioFormularioMaster = window.salvarNovoUsuarioFormularioMaster; }catch(e){}

  function aplicarPermissoesCore(){
    const u = usuario(); if(!u) return;
    const p = perfil(u.perfil);
    const podeUsuarios = p === 'Master' || p === 'SEC';
    const podeLogs = p === 'Master' || p === 'SEC' || p === 'Administrador';
    document.getElementById('menu-usuarios')?.classList.toggle('hidden', !podeUsuarios);
    document.getElementById('menu-logs')?.classList.toggle('hidden', !podeLogs);
    document.querySelectorAll('[onclick*="importar"], .btn-importar, #btn-importar-dados-master').forEach(el=>el.classList.toggle('hidden', !(p === 'Master' || p === 'SEC' || p === 'Administrador')));
    document.querySelectorAll('[onclick*="exportar"], .btn-exportar, .export-only').forEach(el=>el.classList.toggle('hidden', !(p === 'Master' || p === 'SEC' || p === 'Administrador')));
  }

  const navAnt = window.navegar;
  window.navegar = function(aba){
    const ret = typeof navAnt === 'function' ? navAnt.apply(this, arguments) : undefined;
    setTimeout(()=>{
      aplicarPermissoesCore();
      if(aba === 'painel') window.carregarDadosDashboardReal();
      if(aba === 'escolas') window.renderizarListaEscolasBufferMemoria();
      if(aba === 'processos' && typeof window.renderizarProcessosFlutuantes === 'function') window.renderizarProcessosFlutuantes();
    }, 80);
    return ret;
  };
  try{ navegar = window.navegar; }catch(e){}

  window.SIGEE_CORE_V2 = { carregarBaseUsuarioCore, queryEscolasBase, aplicarPermissoesCore, normalizarUsuario, normalizarEscola, normalizarProcesso };
})();

/* ================================================================
   SIGEE Enterprise - Sprint 2.1 Núcleo/Dashboard Estável
   Objetivo: consolidar a função global de Dashboard e evitar
   sobrescritas/hotfixes paralelos. Deve ser a ÚLTIMA definição.
   ================================================================ */
(function(){
  'use strict';
  if (window.__SIGEE_DASHBOARD_ESTAVEL_INSTALADO__) return;
  window.__SIGEE_DASHBOARD_ESTAVEL_INSTALADO__ = true;

  const texto = (v) => (v === null || v === undefined) ? '' : String(v);
  const normalizar = (v) => texto(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
  const soDigitos = (v) => texto(v).match(/\d+/)?.[0] || '';
  const nteLabel = (id) => id ? `NTE ${String(id).padStart(2,'0')}` : '';

  function perfilAtual(){
    const p = normalizar(window.usuarioLogado?.perfil);
    if (p === 'MASTER') return 'Master';
    if (p === 'SEC') return 'SEC';
    if (p === 'ADMINISTRADOR') return 'Administrador';
    if (p === 'TECNICO') return 'Tecnico';
    if (p === 'CONSULTA') return 'Consulta';
    return texto(window.usuarioLogado?.perfil || '');
  }

  function isGlobal(){
    const p = perfilAtual();
    return p === 'Master' || p === 'SEC';
  }

  function nteIdUsuario(){
    const u = window.usuarioLogado || {};
    if (u.nte_id !== null && u.nte_id !== undefined && texto(u.nte_id) !== '') return Number(u.nte_id);
    return Number(soDigitos(u.nte || u.grupo || u.nte_nome || '')) || null;
  }

  function nteTextoUsuario(){
    const id = nteIdUsuario();
    return id ? nteLabel(id) : texto(window.usuarioLogado?.nte || window.usuarioLogado?.grupo || '');
  }

  function itemNteId(item){
    if (!item) return null;
    if (item.nte_id !== null && item.nte_id !== undefined && texto(item.nte_id) !== '') return Number(item.nte_id);
    return Number(soDigitos(item.nte || item.nte_nome || item.grupo || '')) || null;
  }

  function mesmoNteItem(item, alvo){
    const alvoId = Number(alvo) || Number(soDigitos(alvo));
    const itemId = itemNteId(item);
    if (alvoId && itemId) return itemId === alvoId;
    return normalizar(item?.nte).replace(/\s/g,'') === normalizar(alvo).replace(/\s/g,'');
  }

  function valorFiltro(){
    const select = document.getElementById('filtro-dashboard-nte');
    return texto(select?.value || window.filtroDashboardNteAtualSIGEE || 'TODOS');
  }

  function filtrarAbrangencia(lista){
    const arr = Array.isArray(lista) ? lista : [];
    if (isGlobal()) {
      const filtro = valorFiltro();
      if (!filtro || ['GLOBAL','TODOS','SEC - TODOS OS NTES','SEC - TODOS OS NTEs'].includes(filtro)) return arr;
      return arr.filter(item => mesmoNteItem(item, filtro));
    }
    const id = nteIdUsuario();
    if (id) return arr.filter(item => itemNteId(item) === id);
    const nte = nteTextoUsuario();
    return arr.filter(item => mesmoNteItem(item, nte));
  }

  function setText(id, valor){
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function acervoRecolhido(e){
    const v = normalizar(e?.status_acervo || e?.acervo || '');
    return v.includes('RECOLHIDO');
  }

  function dependenciaEstadual(e){
    return normalizar(e?.dependencia_adm || e?.dependencia || '').includes('ESTADUAL');
  }

  function etapa(p){
    return normalizar(p?.etapa || p?.etapa_atual || p?.fase_atual || '');
  }

  function carregarFiltroMaster(){
    const box = document.getElementById('box-filtro-dashboard-master');
    const select = document.getElementById('filtro-dashboard-nte');
    if (!box || !select || !window.usuarioLogado) return;

    if (!isGlobal()) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    const anterior = valorFiltro();
    const ntesSet = new Set();
    [...(window.escolasDB || []), ...(window.processosDB || [])].forEach(item => {
      const id = itemNteId(item);
      if (id) ntesSet.add(id);
    });

    select.innerHTML = '<option value="TODOS">TODOS</option>';
    [...ntesSet].sort((a,b)=>a-b).forEach(id => {
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = nteLabel(id);
      select.appendChild(opt);
    });
    select.value = [...select.options].some(o => o.value === anterior) ? anterior : 'TODOS';
    window.filtroDashboardNteAtualSIGEE = select.value;
    select.onchange = function(){
      window.filtroDashboardNteAtualSIGEE = this.value;
      window.carregarDadosDashboardReal();
    };
  }

  function atualizarIndicadoresTecnicos(processos){
    const topBox = document.getElementById('dash-tec-top-escolas');
    if (topBox) {
      const mapa = {};
      processos.forEach(p => {
        const nome = texto(p.escola || p.escola_nome || p.nome_escola || 'NÃO INFORMADA').toUpperCase();
        if (!mapa[nome]) mapa[nome] = { nome, nte: p.nte || '', qtd: 0 };
        mapa[nome].qtd++;
      });
      const top = Object.values(mapa).sort((a,b)=>b.qtd-a.qtd).slice(0,5);
      topBox.innerHTML = top.length ? top.map((x,i)=>`<div class="flex justify-between gap-2 border-b border-gray-100 py-1"><span>${i+1}. ${x.nome}<br><small class="text-gray-400">${x.nte || '-'}</small></span><strong>${x.qtd}</strong></div>`).join('') : 'Sem dados';
    }
    setText('dash-tec-media-entrega', '0 dias');
    setText('dash-tec-media-pedidos-dia', processos.length ? String(processos.length).replace('.', ',') : '0');
    setText('dash-tec-media-pasta-dia', '0');
  }

  function carregarDadosDashboardReal(){
    if (!window.usuarioLogado) return;
    carregarFiltroMaster();

    const escolas = filtrarAbrangencia(window.escolasDB || []);
    const processos = filtrarAbrangencia(window.processosDB || []);

    setText('dash-escolas', escolas.length);
    setText('dash-acervos', escolas.filter(acervoRecolhido).length);
    setText('dash-estaduais', escolas.filter(dependenciaEstadual).length);
    setText('dash-municipios', new Set(escolas.map(e => normalizar(e.municipio)).filter(Boolean)).size);
    setText('dash-usuarios', Array.isArray(window.usuariosDB) ? window.usuariosDB.length : 0);

    const mapaEtapas = {
      'dash-proc-desarquivamento': ['DESARQUIVAMENTO'],
      'dash-proc-analise': ['ANALISE'],
      'dash-proc-pendencia': ['PENDENCIA'],
      'dash-proc-digitacao': ['DIGITACAO'],
      'dash-proc-conferencia': ['CONFERENCIA'],
      'dash-proc-assinatura': ['ASSINATURA'],
      'dash-proc-aguardando': ['AGUARDANDO RETIRADA','DEFERIDO'],
      'dash-proc-retirado': ['RETIRADO']
    };
    Object.entries(mapaEtapas).forEach(([id, nomes]) => setText(id, processos.filter(p => nomes.includes(etapa(p))).length));
    atualizarIndicadoresTecnicos(processos);
  }

  let timer = null;
  function carregarDashboardDebounced(){
    clearTimeout(timer);
    timer = setTimeout(carregarDadosDashboardReal, 30);
  }

  window.inicializarFiltroDashboardMasterSIGEE = carregarFiltroMaster;
  window.carregarDadosDashboardReal = carregarDashboardDebounced;
  window.carregarDadosDashboardRealImediato = carregarDadosDashboardReal;
  window.atualizarDashboardTecnicoSIGEE = function(proc){ atualizarIndicadoresTecnicos(Array.isArray(proc) ? proc : []); };

  const navAnterior = window.navegar;
  if (!window.__SIGEE_NAV_DASHBOARD_ESTAVEL__) {
    window.__SIGEE_NAV_DASHBOARD_ESTAVEL__ = true;
    window.navegar = function(aba){
      const ret = typeof navAnterior === 'function' ? navAnterior.apply(this, arguments) : undefined;
      if (aba === 'painel') carregarDashboardDebounced();
      return ret;
    };
    try { navegar = window.navegar; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', function(){
    if (window.usuarioLogado) carregarDashboardDebounced();
  });
})();

/* =====================================================================
   SIGEE ENTERPRISE - HOTFIX EMERGENCIAL DASHBOARD OFICIAL
   Corrige escopo por perfil/NTE, etapas, usuários e indicadores técnicos.
   Não altera workflow, processos ou persistência.
   ===================================================================== */
(function(window){
  'use strict';
  if (window.__SIGEE_DASHBOARD_EMERGENCIAL_20260713__) return;
  window.__SIGEE_DASHBOARD_EMERGENCIAL_20260713__ = true;

  const txt = v => (v === null || v === undefined) ? '' : String(v).trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
  const digits = v => (txt(v).match(/\d{1,2}/)||[])[0] || '';
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=String(v); };
  const usuario = () => window.usuarioLogado || null;
  const perfil = () => {
    const p=norm(usuario()?.perfil);
    if(p.includes('SEC')) return 'SEC';
    if(p.includes('MASTER')) return 'MASTER';
    if(p.includes('ADMIN')) return 'ADMINISTRADOR';
    if(p.includes('CONSULT')) return 'CONSULTA';
    if(p.includes('ESTAG')) return 'ESTAGIARIO';
    return 'TECNICO';
  };
  const global = () => ['SEC','MASTER'].includes(perfil());
  const nteId = obj => {
    if(!obj) return null;
    const direto = obj.nte_id ?? obj.nteId;
    if(direto !== null && direto !== undefined && txt(direto)!=='') return Number(direto)||null;
    return Number(digits(obj.nte || obj.nte_nome || obj.nte_vinculado || obj.grupo || obj.territorio)) || null;
  };
  const mesmoNte = (obj, alvo) => {
    const a = Number(alvo) || Number(digits(alvo));
    const b = nteId(obj);
    if(a && b) return a===b;
    return norm(obj?.nte || obj?.nte_nome || obj?.grupo) === norm(alvo);
  };
  const filtroAtual = () => txt(document.getElementById('filtro-dashboard-nte')?.value || window.filtroDashboardNteAtualSIGEE || 'TODOS');
  const filtrar = lista => {
    const base=Array.isArray(lista)?lista:[];
    if(global()){
      const f=filtroAtual();
      if(!f || ['TODOS','GLOBAL','SEC - TODOS OS NTES'].includes(norm(f))) return base;
      return base.filter(x=>mesmoNte(x,f));
    }
    const u=usuario();
    const id=nteId(u);
    return id ? base.filter(x=>nteId(x)===id) : base.filter(x=>mesmoNte(x,u?.nte||u?.grupo||''));
  };
  const dataValida = v => {
    if(!v) return null;
    if(v instanceof Date && !isNaN(v)) return v;
    const s=txt(v);
    let d;
    const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if(br) d=new Date(Number(br[3]),Number(br[2])-1,Number(br[1])); else d=new Date(s);
    return isNaN(d)?null:d;
  };
  const abertura = p => dataValida(p.data_abertura||p.data_solicitacao||p.created_at||p.criado_em||p.data_inicio);
  const conclusao = p => dataValida(p.data_conclusao||p.finalizado_em||p.retirado_em||p.updated_at);
  const diffDias = (a,b) => Math.max(0,Math.ceil((b-a)/86400000));
  const etapa = p => norm(p?.etapa || p?.etapa_atual || p?.fase_atual || 'DESARQUIVAMENTO');
  const ehDesarquivamento = p => {
    const e=etapa(p), c=norm(p?.etapa_codigo);
    return ['DES','RET','REU','CFD'].includes(c) || ['DESARQUIVAMENTO','REITERACAO','REITERACAO COM URGENCIA','REITERACAO URGENTE','CONFIRMACAO DOS DADOS DA BUSCA','CONFIRMAR DADOS DA BUSCA','PEDIDO DE ATAS SEM PASTA'].includes(e);
  };

  function preencherFiltro(){
    const box=document.getElementById('box-filtro-dashboard-master');
    const sel=document.getElementById('filtro-dashboard-nte');
    if(!box||!sel||!usuario()) return;
    if(!global()){ box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    const anterior=filtroAtual();
    const ids=new Set(Array.from({length:27},(_,i)=>i+1));
    sel.innerHTML='<option value="TODOS">GLOBAL - TODOS OS NTEs</option>';
    [...ids].sort((a,b)=>a-b).forEach(id=>{
      const o=document.createElement('option'); o.value=String(id); o.textContent='NTE-'+String(id).padStart(2,'0'); sel.appendChild(o);
    });
    sel.value=[...sel.options].some(o=>o.value===anterior)?anterior:'TODOS';
    window.filtroDashboardNteAtualSIGEE=sel.value;
    sel.onchange=function(){window.filtroDashboardNteAtualSIGEE=this.value;window.carregarDadosDashboardRealImediato();};
  }

  function atualizarTecnicos(processos){
    const top=document.getElementById('dash-tec-top-escolas');
    if(top){
      const mapa=new Map();
      processos.forEach(p=>{
        const nome=txt(p.escola_nome||p.escola||p.nome_escola||p.instituicao||'Não informada');
        const chave=norm(nome)+'|'+(nteId(p)||norm(p.nte));
        const atual=mapa.get(chave)||{nome,nte:txt(p.nte||p.nte_nome||''),qtd:0}; atual.qtd++; mapa.set(chave,atual);
      });
      const lista=[...mapa.values()].sort((a,b)=>b.qtd-a.qtd||a.nome.localeCompare(b.nome,'pt-BR')).slice(0,5);
      top.innerHTML=lista.length?lista.map((x,i)=>`<div class="flex justify-between gap-2 border-b border-gray-100 py-1"><span>${i+1}. ${x.nome}<br><small class="text-gray-400">${x.nte||'-'}</small></span><strong>${x.qtd}</strong></div>`).join(''):'Sem dados';
    }
    const concluidos=processos.map(p=>({a:abertura(p),b:conclusao(p),e:etapa(p)})).filter(x=>x.a&&x.b&&['RETIRADO','AGUARDANDO RETIRADA','DEFERIDO','INDEFERIDO'].includes(x.e));
    const media=concluidos.length?Math.round(concluidos.reduce((s,x)=>s+diffDias(x.a,x.b),0)/concluidos.length):0;
    set('dash-tec-media-entrega',`${media} ${media===1?'dia':'dias'}`);
    const datasAbertura=processos.map(abertura).filter(Boolean);
    let diasPeriodo=1;
    if(datasAbertura.length){const min=new Date(Math.min(...datasAbertura));const max=new Date(Math.max(...datasAbertura));diasPeriodo=Math.max(1,diffDias(min,max)+1);}
    set('dash-tec-media-pedidos-dia',(processos.length/diasPeriodo).toFixed(1).replace('.',','));
    const pastas=processos.filter(p=>norm(p.tipo_arquivo||p.tipo_arquivo_recebido||p.arquivo_tipo).includes('PASTA'));
    set('dash-tec-media-pasta-dia',(pastas.length/diasPeriodo).toFixed(1).replace('.',','));
  }

  function carregar(){
    if(!usuario()) return;
    preencherFiltro();
    const escolas=filtrar(window.escolasDB||[]);
    const processos=filtrar(window.processosDB||[]);
    const usuarios=filtrar((window.usuariosDB||[]).filter(u=>u.ativo!==false && norm(u.status)!=='INATIVO'));
    set('dash-escolas',escolas.length);
    set('dash-acervos',escolas.filter(e=>norm(e.status_acervo||e.acervo).includes('RECOLHIDO')).length);
    set('dash-estaduais',escolas.filter(e=>norm(e.dependencia_adm||e.dependencia).includes('ESTADUAL')).length);
    const filtroMunicipios = filtroAtual();
    const visaoGlobalMunicipios = global() && (!filtroMunicipios || ['TODOS','GLOBAL','SEC - TODOS OS NTES'].includes(norm(filtroMunicipios)));
    const nteMunicipios = visaoGlobalMunicipios ? null : (global() ? Number(digits(filtroMunicipios)) : nteId(usuario()));
    const totalMunicipios = visaoGlobalMunicipios
      ? Number(window.SIGEE_TOTAL_MUNICIPIOS_BAHIA || 417)
      : Number(window.SIGEE_MUNICIPIOS_POR_NTE?.[nteMunicipios] || 0);
    set('dash-municipios', totalMunicipios);
    set('dash-usuarios',usuarios.length);
    set('dash-proc-desarquivamento',processos.filter(ehDesarquivamento).length);
    const contar=n=>processos.filter(p=>etapa(p)===n).length;
    set('dash-proc-analise',contar('ANALISE'));
    set('dash-proc-pendencia',contar('PENDENCIA'));
    set('dash-proc-digitacao',contar('DIGITACAO'));
    set('dash-proc-conferencia',contar('CONFERENCIA'));
    set('dash-proc-assinatura',contar('ASSINATURA'));
    set('dash-proc-aguardando',processos.filter(p=>['AGUARDANDO RETIRADA','DEFERIDO'].includes(etapa(p))).length);
    set('dash-proc-retirado',contar('RETIRADO'));
    atualizarTecnicos(processos);
  }

  let timer;
  function agendar(){clearTimeout(timer);timer=setTimeout(carregar,40);}
  window.carregarDadosDashboardReal=agendar;
  window.carregarDadosDashboardRealImediato=carregar;
  window.inicializarFiltroDashboardMasterSIGEE=preencherFiltro;

  const nav=window.navegar;
  window.navegar=function(aba){const r=typeof nav==='function'?nav.apply(this,arguments):undefined;if(aba==='painel')agendar();return r;};
  try{navegar=window.navegar;}catch(e){}
  window.addEventListener('load',()=>setTimeout(carregar,900));
  setInterval(()=>{const aba=document.getElementById('aba-painel');if(aba&&!aba.classList.contains('hidden'))carregar();},60000);
})(window);

/* =====================================================================
   SIGEE 1.0.2.006 — Guarda de integridade para novos processos
   ===================================================================== */
(function(window){
    'use strict';

    window.SIGEE_INTEGRIDADE_IDS_VERSION = '1.0.2.006';

    window.SIGEE_VALIDAR_PROCESSO_NOVO = function(processo){
        if (!processo) throw new Error('Processo novo não informado.');
        if (processo.id !== undefined && processo.id !== null && processo.id !== '') {
            throw new Error(
                'Processo novo não pode possuir ID definido no frontend. ' +
                'O ID deve ser gerado pelo Supabase.'
            );
        }
        return true;
    };
})(window);

/* SIGEE 1.0.2.006A — Código SIGEE no INSERT e log contextual */
window.SIGEE_INTEGRIDADE_IDS_VERSION = '1.0.2.006A';

window.SIGEE_INTEGRIDADE_IDS_VERSION = '1.0.2.006B';


/* =====================================================================
   SIGEE Sprint 2.3.3 — Formulário Inteligente do Processo
   Reutiliza a janela de Nova Solicitação em modo Novo ou Editar.
   Não permite edição de workflow, etapas, ciclos, prazos ou mensagens.
   ===================================================================== */
(function(){
  'use strict';
  if (window.__SIGEE_FORMULARIO_PROCESSO_233__) return;
  window.__SIGEE_FORMULARIO_PROCESSO_233__ = true;

  const estado = {
    modo: 'novo',
    processoId: null,
    original: null,
    salvarNovoOriginal: window.salvarNovaSolicitacao
  };

  const txt = v => v == null ? '' : String(v).trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const usuario = () => window.usuarioLogado || {};
  const perfil = () => {
    const p = norm(usuario().perfil);
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('ESTAG')) return 'Estagiario';
    return 'Tecnico';
  };
  const lista = () => Array.isArray(window.processosDB) ? window.processosDB : [];
  const processo = id => lista().find(p => String(p.id) === String(id));
  const el = id => document.getElementById(id);

  function valor(p, ...campos){
    for (const c of campos) if (p && p[c] != null && txt(p[c])) return txt(p[c]);
    return '';
  }

  function setValor(id, valor){
    const campo = el(id);
    if (!campo) return false;
    const desejado = valor == null ? '' : String(valor);

    if (campo.tagName === 'SELECT' && desejado) {
      const alvo = norm(desejado);
      const opcao = Array.from(campo.options || []).find(opt =>
        norm(opt.value) === alvo ||
        norm(opt.textContent) === alvo ||
        norm(opt.textContent).includes(alvo) ||
        alvo.includes(norm(opt.textContent))
      );
      campo.value = opcao ? opcao.value : desejado;
    } else {
      campo.value = desejado;
    }

    campo.dispatchEvent(new Event('input', {bubbles:true}));
    campo.dispatchEvent(new Event('change', {bubbles:true}));
    return true;
  }

  function definirTitulo(modo, p){
    const modal = el('modal-nova-solicitacao');
    if (!modal) return;
    const titulo = modal.querySelector('h1,h2,h3,.modal-title,[data-modal-title]');
    if (titulo) {
      if (!titulo.dataset.sigeeTituloOriginal) titulo.dataset.sigeeTituloOriginal = titulo.textContent || 'Nova Solicitação';
      titulo.textContent = modo === 'editar'
        ? `Editar Processo — ${valor(p,'codigo_sigee','codigo') || p.id}`
        : titulo.dataset.sigeeTituloOriginal;
    }
    modal.dataset.sigeeModo = modo;
  }

  function configurarBotao(modo){
    const btn = el('btn-submeter-nova-solicitacao');
    if (!btn) return;
    if (!btn.dataset.sigeeTextoNovo) btn.dataset.sigeeTextoNovo = btn.textContent || 'Enviar para Desarquivamento';
    btn.textContent = modo === 'editar' ? 'Salvar Alterações' : btn.dataset.sigeeTextoNovo;
    btn.disabled = modo === 'editar' ? false : btn.disabled;
  }

  function bloquearCampo(campo, bloqueado){
    if (!campo) return;
    campo.disabled = !!bloqueado;
    campo.readOnly = !!bloqueado && campo.tagName !== 'SELECT';
    campo.classList.toggle('sigee-campo-bloqueado', !!bloqueado);
    campo.setAttribute('aria-disabled', String(!!bloqueado));
  }

  function aplicarPermissoes(modo){
    const idsEditaveisMaster = [
      'novo-proc-aluno','novo-proc-escola','novo-proc-documento',
      'novo-proc-modalidade','novo-proc-ensino'
    ];
    const idsEditaveisAdmin = ['novo-proc-aluno','novo-proc-escola'];
    const todos = [
      ...idsEditaveisMaster,
      'novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio',
      'novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo',
      'novo-autofill-local-acervo'
    ];

    if (modo === 'novo') {
      todos.forEach(id => {
        const campo = el(id);
        const autofill = id.startsWith('novo-autofill-');
        bloquearCampo(campo, autofill);
      });
      return;
    }

    const permitidos = perfil() === 'Master' ? idsEditaveisMaster
      : perfil() === 'Administrador' ? idsEditaveisAdmin : [];

    todos.forEach(id => bloquearCampo(el(id), !permitidos.includes(id)));
    const chk = el('f01-chk-acolhido');
    bloquearCampo(chk, true);
  }

  function preencher(p){
    const escolaNome = valor(p,'escola_nome','escola','nome_escola','instituicao');
    const codMec = valor(p,'cod_mec','codigo_mec','escola_cod_mec','codigo_mec_escola');

    setValor('novo-proc-aluno', valor(p,'aluno_nome','aluno','nome_solicitante','requerente_nome'));
    setValor('novo-proc-escola', escolaNome);
    setValor('novo-proc-escola-busca-v23', escolaNome);
    setValor('novo-proc-escola-cod-mec', codMec);
    setValor('novo-proc-documento', valor(p,'documento_tipo','documento','documento_solicitado','tipo_documento'));
    setValor('novo-proc-modalidade', valor(p,'modalidade','oferta_modalidade'));
    setValor('novo-proc-ensino', valor(p,'nivel_oferta','ensino','oferta_nivel','nivel'));
    setValor('novo-autofill-mec', codMec);
    setValor('novo-autofill-nte', valor(p,'nte','nte_nome','grupo'));
    setValor('novo-autofill-municipio', valor(p,'municipio','escola_municipio'));
    setValor('novo-autofill-dep', valor(p,'dependencia','dependencia_adm','escola_dependencia'));
    setValor('novo-autofill-situacao', valor(p,'situacao','situacao_funcional','escola_situacao'));
    setValor('novo-autofill-acervo', valor(p,'acervo','status_acervo','escola_status_acervo'));
    setValor('novo-autofill-local-acervo', valor(p,'local_acervo','escola_local_acervo'));

    const chk = el('f01-chk-acolhido');
    if (chk) {
      chk.checked = true;
      chk.dispatchEvent(new Event('change', {bubbles:true}));
    }
  }

  function preencherQuandoPronto(p, tentativa=0){
    const modal = el('modal-nova-solicitacao');
    const aluno = el('novo-proc-aluno');
    const escola = el('novo-proc-escola');

    if (!modal || !aluno || !escola) {
      if (tentativa < 12) setTimeout(() => preencherQuandoPronto(p, tentativa + 1), 50);
      return;
    }

    preencher(p);
    definirTitulo('editar', p);
    configurarBotao('editar');
    aplicarPermissoes('editar');
    modal.classList.remove('hidden');

    // Reforço após a montagem do autocomplete e dos selects legados.
    if (tentativa === 0) {
      setTimeout(() => preencherQuandoPronto(p, 1), 80);
      setTimeout(() => preencherQuandoPronto(p, 2), 220);
    }
  }

  function snapshot(p){
    return {
      aluno: valor(p,'aluno_nome','aluno'),
      escola: valor(p,'escola_nome','escola'),
      documento: valor(p,'documento_tipo','documento'),
      modalidade: valor(p,'modalidade','oferta_modalidade'),
      ensino: valor(p,'nivel_oferta','ensino','oferta_nivel'),
      nte: valor(p,'nte','nte_nome','grupo'),
      municipio: valor(p,'municipio')
    };
  }

  async function registrarHistorico(p, alteracoes){
    try {
      const c = window.obterSupabaseSIGEE?.()
        || window.criarClienteSupabaseSIGEE?.()
        || window.SIGEE_SUPABASE?.criarCliente?.();
      if (!c) return;
      const u = usuario();
      await c.from('historico_processos').insert({
        processo_id: p.id,
        codigo_sigee: p.codigo_sigee || '',
        etapa: p.etapa_atual || p.etapa || '',
        acao: 'Cadastro do processo atualizado',
        observacao: `${alteracoes.length} campo(s) cadastral(is) alterado(s).`,
        usuario_nome: u.nome || u.email || 'Usuário SIGEE',
        usuario_email: u.email || null,
        usuario_perfil: u.perfil || null,
        nte: u.nte || u.nte_nome || p.nte || null,
        dados: { alteracoes },
        created_at: new Date().toISOString()
      });
    } catch(e) {
      console.warn('[SIGEE Formulário] Alteração salva; histórico não confirmado.', e);
    }
  }

  function alteracoesEntre(antes, depois){
    const nomes = {
      aluno:'Nome do aluno', escola:'Escola', documento:'Documento',
      modalidade:'Modalidade', ensino:'Nível de oferta', nte:'NTE', municipio:'Município'
    };
    return Object.keys(antes).filter(k => txt(antes[k]) !== txt(depois[k])).map(k => ({
      campo: nomes[k] || k,
      anterior: antes[k] || '',
      novo: depois[k] || ''
    }));
  }

  async function salvarEdicao(event){
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();

    const p = processo(estado.processoId);
    if (!p) return alert('Processo não localizado.');

    const pf = perfil();
    if (!['Master','Administrador'].includes(pf)) {
      return alert('Seu perfil não possui permissão para editar processos.');
    }

    const aluno = norm(el('novo-proc-aluno')?.value);
    const escola = norm(el('novo-proc-escola')?.value);
    if (!aluno || !escola) return alert('Informe o nome do aluno e a escola.');

    const antes = estado.original || snapshot(p);

    p.aluno = p.aluno_nome = aluno;
    p.escola = p.escola_nome = escola;

    if (pf === 'Master') {
      const documento = txt(el('novo-proc-documento')?.value);
      const modalidade = txt(el('novo-proc-modalidade')?.value);
      const ensino = txt(el('novo-proc-ensino')?.value);
      if (documento) p.documento = p.documento_tipo = documento;
      p.modalidade = modalidade;
      p.ensino = p.nivel_oferta = ensino;
    }

    p.updated_at = new Date().toISOString();
    const depois = snapshot(p);
    const alteracoes = alteracoesEntre(antes, depois);
    if (!alteracoes.length) {
      alert('Nenhuma alteração foi identificada.');
      return;
    }

    const btn = el('btn-submeter-nova-solicitacao');
    const rotulo = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando alterações...'; }

    try {
      if (window.SIGEE_Processos?.salvar) await window.SIGEE_Processos.salvar(p);
      await registrarHistorico(p, alteracoes);
      try { window.registrarLog?.(`[${pf.toUpperCase()}] Atualizou cadastro do processo ID ${p.id}.`); } catch(_){}
      el('modal-nova-solicitacao')?.classList.add('hidden');
      window.SIGEE_Processos?.contar?.();
      if (window.recarregarCentralProcessosSIGEE) await window.recarregarCentralProcessosSIGEE(true);
      if (typeof window.mostrarToast === 'function') window.mostrarToast('Alterações salvas com sucesso.');
      else alert('Alterações salvas com sucesso.');
    } catch(e) {
      console.error('[SIGEE Formulário] Falha ao salvar edição.', e);
      alert('Não foi possível salvar as alterações. Verifique a conexão e tente novamente.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = rotulo || 'Salvar Alterações'; }
    }
  }

  async function abrirFormularioProcesso(opcoes={}){
    const modo = opcoes.modo || 'novo';
    if (modo === 'novo') {
      estado.modo = 'novo';
      estado.processoId = null;
      estado.original = null;
      definirTitulo('novo');
      configurarBotao('novo');
      aplicarPermissoes('novo');
      return window.abrirFormularioNovaSolicitacao?.();
    }

    const p = processo(opcoes.processoId);
    if (!p) return alert('Processo não localizado.');

    const pf = perfil();
    if (!['Master','Administrador'].includes(pf)) {
      return alert('Seu perfil não possui permissão para editar processos.');
    }

    estado.modo = 'editar';
    estado.processoId = p.id;
    estado.original = snapshot(p);

    // Abre a mesma janela e, depois que o autocomplete estiver instalado,
    // preenche os dados atuais do processo.
    window.abrirFormularioNovaSolicitacao?.();
    requestAnimationFrame(() => preencherQuandoPronto(p, 0));
  }

  // Intercepta o envio apenas quando a janela estiver em modo edição.
  document.addEventListener('submit', function(ev){
    const form = ev.target;
    if (estado.modo !== 'editar' || !form?.closest?.('#modal-nova-solicitacao')) return;
    salvarEdicao(ev);
  }, true);

  document.addEventListener('click', function(ev){
    const btn = ev.target.closest?.('#btn-submeter-nova-solicitacao');
    if (!btn || estado.modo !== 'editar') return;
    const form = btn.closest('form');
    if (!form) salvarEdicao(ev);
  }, true);

  // Ao fechar, restaura o modo normal para a próxima Nova Solicitação.
  document.addEventListener('click', function(ev){
    if (!ev.target.closest?.('[onclick*="fecharModalNovaSolicitacao"], [data-fechar-nova-solicitacao]')) return;
    estado.modo = 'novo';
    estado.processoId = null;
    estado.original = null;
  });

  window.abrirFormularioProcessoSIGEE = abrirFormularioProcesso;
  window.salvarEdicaoProcessoSIGEE = salvarEdicao;

  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-nova-solicitacao[data-sigee-modo="editar"] .sigee-campo-bloqueado{
      background:#eef2f7!important;color:#64748b!important;cursor:not-allowed!important;
      border-color:#cbd5e1!important;opacity:.9
    }
    #modal-nova-solicitacao[data-sigee-modo="editar"] h1,
    #modal-nova-solicitacao[data-sigee-modo="editar"] h2{
      color:#075985!important
    }
    #modal-nova-solicitacao[data-sigee-modo="editar"] #btn-submeter-nova-solicitacao{
      background:linear-gradient(135deg,#075985,#0284c7)!important;
      color:#fff!important;font-weight:900!important
    }`;
  document.head.appendChild(estilo);

  console.info('[SIGEE] Formulário Inteligente do Processo 2.3.3A carregado.');
})();
/* =====================================================================
   SIGEE Sprint 2.4.7J — Autoridade final do Módulo de Escolas
   Este bloco deve permanecer no FINAL de app.js.
   ===================================================================== */
(function(){
  'use strict';

  function perfilAtualEscolas246E(){
    const u=window.usuarioLogado||{};
    return String(u.perfil||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toUpperCase().trim();
  }

  function podeCadastrarEscola246E(){
    const p=perfilAtualEscolas246E();
    return p==='MASTER'||p==='ADMINISTRADOR';
  }

  function aplicarAutoridadeEscolas246E(){
    const modulo=window.SIGEE_Escolas;
    if(!modulo)return false;

    window.abrirModalNovaEscola=function(){
      return modulo.abrirNova();
    };
    window.abrirModalEditarEscolaSIGEE=function(id){
      return modulo.abrirEditar(id);
    };
    window.editarEscolaSIGEE=function(id){
      return modulo.abrirEditar(id);
    };
    window.editarEscolaSIGEEV45=function(id){
      return modulo.abrirEditar(id);
    };
    window.salvarEscolaFormularioSIGEE=function(event){
      return modulo.salvar(event);
    };
    window.renderizarListaEscolasBufferMemoria=function(){
      return modulo.renderizar();
    };

    try{
      abrirModalNovaEscola=window.abrirModalNovaEscola;
      abrirModalEditarEscolaSIGEE=window.abrirModalEditarEscolaSIGEE;
      editarEscolaSIGEEV45=window.editarEscolaSIGEEV45;
      salvarEscolaFormularioSIGEE=window.salvarEscolaFormularioSIGEE;
      renderizarListaEscolasBufferMemoria=window.renderizarListaEscolasBufferMemoria;
    }catch(_){}

    document.querySelectorAll(
      'button[onclick*="abrirModalNovaEscola"], .btn-nova-escola'
    ).forEach(btn=>{
      btn.classList.toggle('hidden',!podeCadastrarEscola246E());
    });

    return true;
  }

  document.addEventListener('click',function(event){
    const novo=event.target.closest(
      'button[onclick*="abrirModalNovaEscola"], .btn-nova-escola'
    );
    if(novo&&window.SIGEE_Escolas){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.SIGEE_Escolas.abrirNova();
      return;
    }

    const alterar=event.target.closest(
      '.btn-alterar-escola-sigee[data-escola-id], button[onclick*="editarEscolaSIGEEV45"], button[onclick*="abrirModalEditarEscolaSIGEE"]'
    );
    if(alterar&&window.SIGEE_Escolas){
      const id=alterar.dataset.escolaId||
        (alterar.getAttribute('onclick')||'').match(/\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1];
      if(!id)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const registro = window.SIGEE_Escolas.localizarNaPagina?.(id);
      if (registro) window.SIGEE_Escolas.abrirEditarRegistro(registro);
      else window.SIGEE_Escolas.abrirEditar(id);
    }
  },true);

  function iniciar(){
    if(!aplicarAutoridadeEscolas246E()){
      setTimeout(iniciar,100);
      return;
    }
    setTimeout(aplicarAutoridadeEscolas246E,500);
    setTimeout(aplicarAutoridadeEscolas246E,1500);
  }

  document.addEventListener('DOMContentLoaded',iniciar);
  window.addEventListener('load',()=>setTimeout(iniciar,50));

  const navegarAnterior246E=window.navegar;
  window.navegar=function(){
    const retorno=typeof navegarAnterior246E==='function'
      ?navegarAnterior246E.apply(this,arguments)
      :undefined;
    setTimeout(aplicarAutoridadeEscolas246E,60);
    return retorno;
  };

  console.info('[SIGEE] Autoridade final do módulo de Escolas 2.4.7J instalada.');
})();


/* =====================================================================
   SIGEE Enterprise 3.2.7 — Autoridade central de navegação
   Todas as abas usam uma única rotina. Não aplica estilos inline e não
   interfere no login. Deve ser reinstalada ao final do index.html porque
   módulos legados podem encapsular window.navegar durante o carregamento.
   ===================================================================== */
(function () {
  'use strict';

  var MAPA_ABAS = {
    painel: 'aba-painel',
    processos: 'aba-processos',
    escolas: 'aba-escolas',
    usuarios: 'aba-usuarios',
    logs: 'aba-logs',
    'sala-situacao': 'aba-sala-situacao',
    inteligencia: 'aba-inteligencia',
    'centro-inteligencia': 'aba-inteligencia'
  };

  function todasAsAbas() {
    return Array.prototype.slice.call(document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]'));
  }

  function limparVisibilidade(secao) {
    if (!secao) return;
    secao.classList.remove('sigee-sala-ativa', 'sigee-inteligencia-ativa');
    secao.style.removeProperty('display');
    secao.style.removeProperty('visibility');
    secao.style.removeProperty('opacity');
    secao.style.removeProperty('height');
    secao.style.removeProperty('min-height');
    secao.style.removeProperty('overflow');
    secao.style.removeProperty('pointer-events');
    secao.style.removeProperty('margin');
    secao.style.removeProperty('padding');
    secao.style.removeProperty('border');
  }

  function ocultarTodas() {
    todasAsAbas().forEach(function (secao) {
      limparVisibilidade(secao);
      secao.classList.add('hidden');
      secao.setAttribute('aria-hidden', 'true');
    });
  }

  function executarPosNavegacao(aba) {
    try {
      if (aba === 'painel' && typeof window.carregarDadosDashboardReal === 'function') window.carregarDadosDashboardReal();
      if (aba === 'processos' && typeof window.carregarEContarProcessosHorizontais === 'function') window.carregarEContarProcessosHorizontais();
      if (aba === 'escolas' && typeof window.renderizarListaEscolasBufferMemoria === 'function') window.renderizarListaEscolasBufferMemoria();
      if (aba === 'usuarios' && typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios();
      if (aba === 'logs' && typeof window.carregarLogs === 'function') window.carregarLogs();
      if (aba === 'sala-situacao' && window.SIGEE_SALA_SITUACAO && typeof window.SIGEE_SALA_SITUACAO.render === 'function') window.SIGEE_SALA_SITUACAO.render();
      if ((aba === 'inteligencia' || aba === 'centro-inteligencia') && window.SIGEE_CENTRO_INTELIGENCIA && typeof window.SIGEE_CENTRO_INTELIGENCIA.render === 'function') window.SIGEE_CENTRO_INTELIGENCIA.render();
    } catch (erro) {
      console.warn('[SIGEE Navegação] Falha na atualização da aba:', aba, erro);
    }
  }

  function navegarCentral(aba) {
    var chave = String(aba || '').trim().toLowerCase();
    var id = MAPA_ABAS[chave] || ('aba-' + chave);
    var alvo = document.getElementById(id);

    ocultarTodas();
    if (!alvo) {
      console.warn('[SIGEE Navegação] Aba não localizada:', id);
      return false;
    }

    limparVisibilidade(alvo);
    alvo.classList.remove('hidden');
    alvo.setAttribute('aria-hidden', 'false');

    document.querySelectorAll('.sigee-sidebar-nav button').forEach(function (botao) {
      botao.classList.remove('sigee-menu-ativo');
      botao.removeAttribute('aria-current');
    });
    var menu = document.querySelector('.sigee-sidebar-nav button[onclick*="' + chave + '"]');
    if (menu) {
      menu.classList.add('sigee-menu-ativo');
      menu.setAttribute('aria-current', 'page');
    }

    executarPosNavegacao(chave);
    setTimeout(function () { executarPosNavegacao(chave); }, 80);
    return true;
  }

  function instalar() {
    window.navegar = navegarCentral;
    try { navegar = navegarCentral; } catch (e) {}
    document.documentElement.dataset.sigeeNavegacao = '3.2.7';
    return navegarCentral;
  }

  window.SIGEE_NAVIGATION = {
    install: instalar,
    navegar: navegarCentral,
    ocultarTodas: ocultarTodas,
    version: '3.2.7'
  };
  instalar();
})();
