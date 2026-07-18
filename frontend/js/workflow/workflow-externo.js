/* SIGEE WORKFLOW EXTERNO PATCH 1.1.1 — preservação do responsável */
/* =====================================================================
 * SIGEE — Workflow Externo do Desarquivamento
 * Sprint 1.1 — WFE-001 / versão 0.9.5.0
 *
 * Fluxo:
 * Desarquivamento (30d) -> Reiteração (7d) -> Reiteração Urgente (7d)
 * -> Confirmação dos Dados (7d) -> Pedido de Atas sem Pasta -> Análise.
 *
 * A Retificação pode ocorrer durante Reiteração, Reiteração Urgente ou
 * Confirmação dos Dados e reinicia integralmente o ciclo em 30 dias.
 * ===================================================================== */
(function (window) {
  'use strict';

  if (window.__SIGEE_WORKFLOW_EXTERNO_095__) return;
  window.__SIGEE_WORKFLOW_EXTERNO_095__ = true;

  const VERSION = '1.1.3';
  const EXTERNAL_STATES = Object.freeze(['DES', 'RET', 'REU', 'CFD']);

  const ACTIONS = Object.freeze({
    SEND_REITERACAO: Object.freeze({
      event: 'SEND_REITERACAO',
      title: 'Executar Reiteração',
      messageCodes: Object.freeze(['43', '45']),
      deadlineDays: 7,
      consequence: 'O processo avançará para Reiteração. O prazo da ação será de 7 dias, mantendo a contagem total contínua do ciclo.'
    }),
    SEND_REITERACAO_URGENTE: Object.freeze({
      event: 'SEND_REITERACAO_URGENTE',
      title: 'Executar Reiteração Urgente',
      messageCodes: Object.freeze(['44', '46']),
      deadlineDays: 7,
      consequence: 'O processo avançará para Reiteração Urgente. O prazo da ação será de 7 dias, mantendo a contagem total contínua do ciclo.'
    }),
    CONFIRMAR_DADOS: Object.freeze({
      event: 'CONFIRMAR_DADOS',
      title: 'Executar Confirmação dos Dados',
      messageCodes: Object.freeze(['12']),
      deadlineDays: 7,
      consequence: 'O processo avançará para Confirmação dos Dados. O prazo da ação será de 7 dias, mantendo a contagem total contínua do ciclo.'
    }),
    RETIFICAR_DADOS: Object.freeze({
      event: 'RETIFICAR_DADOS',
      title: 'Executar Retificação dos Dados',
      messageCodes: Object.freeze(['14', '37']),
      deadlineDays: 30,
      consequence: 'O ciclo será reiniciado integralmente em Desarquivamento, com novo prazo de 30 dias.',
      observationRequired: true
    }),
    PEDIDO_ATAS_DESARQUIVAMENTO: Object.freeze({
      event: 'PEDIDO_ATAS_DESARQUIVAMENTO',
      title: 'Executar Pedido de Atas sem Pasta',
      messageCodes: Object.freeze(['36']),
      deadlineDays: 7,
      consequence: 'O processo seguirá para Análise no contexto “Atas sem Pasta”.'
    })
  });

  let originalOpenDesarquivamento = null;
  let configured = false;
  const actionHistoryCache = new Map();

  function text(value) {
    return value == null ? '' : String(value).trim();
  }

  function normalize(value) {
    return text(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  function currentUser() {
    return window.usuarioLogado || null;
  }

  function profile(user) {
    const raw = normalize(user && (user.perfil || user.role || user.tipo));
    if (raw.includes('MASTER')) return 'MASTER';
    if (raw === 'SEC' || raw.includes('TODOS OS NTES')) return 'SEC';
    if (raw.includes('ADMIN')) return 'ADMINISTRADOR';
    if (raw.includes('TECN')) return 'TECNICO';
    if (raw.includes('ESTAG')) return 'ESTAGIARIO';
    if (raw.includes('CONSULT')) return 'CONSULTA';
    return raw;
  }

  function canOperate() {
    return ['MASTER', 'ADMINISTRADOR', 'TECNICO'].includes(profile(currentUser()));
  }

  function processList() {
    if (window.SIGEE_Processos && typeof window.SIGEE_Processos.listar === 'function') {
      return window.SIGEE_Processos.listar();
    }
    return Array.isArray(window.processosDB) ? window.processosDB : [];
  }

  function findProcess(id) {
    return processList().find(function (item) {
      return String(item.id) === String(id);
    }) || null;
  }

  function processState(process) {
    if (!process || !window.TransitionManager) return '';
    return window.TransitionManager.stateCodeFrom(
      process.etapa_codigo || process.etapa_atual || process.etapa || process.fase_atual
    );
  }

  function stageDate(process) {
    return process && (
      process.data_inicio_desarquivamento ||
      process.data_inicio_ciclo ||
      process.inicio_ciclo ||
      process.data_desarquivamento ||
      process.data_etapa_inicial ||
      process.prazo_inicio_ciclo ||
      process.created_at ||
      process.criado_em ||
      process.prazo_inicio ||
      process.data_etapa_atual ||
      process.data_etapa ||
      process.etapa_iniciada_em ||
      process.updated_at
    );
  }

  function elapsedDays(process) {
    const now = window.SIGEE_WORKFLOW_CLOCK && typeof window.SIGEE_WORKFLOW_CLOCK.now === 'function'
      ? window.SIGEE_WORKFLOW_CLOCK.now()
      : new Date();
    const days = window.TransitionManager &&
      window.TransitionManager.elapsedDays(stageDate(process), now);
    return Number.isFinite(days) ? days : 0;
  }

  function deadlineForState(stateCode) {
    const state = window.SIGEE_STATE_MANAGER && window.SIGEE_STATE_MANAGER.get(stateCode);
    return state && Number.isFinite(state.deadline) ? state.deadline : null;
  }

  function messageItem(code) {
    const item = window.SIGEE_MENSAGENS && window.SIGEE_MENSAGENS.obter(code);
    return item || {
      numero: String(code),
      nome: 'Mensagem institucional',
      finalidade: 'Executar a comunicação institucional correspondente.'
    };
  }

  function actionMessage(action) {
    const items = action.messageCodes.map(messageItem);
    return {
      code: action.messageCodes.join('/'),
      text: items.map(function (item) {
        return 'Mensagem ' + item.numero + ' — ' + item.nome + '\n' + item.finalidade;
      }).join('\n\n'),
      confirmations: items.map(function (item) {
        return {
          code: item.numero,
          text: 'Confirmo que executei a Mensagem ' + item.numero + ' — ' + item.nome + '.'
        };
      })
    };
  }

  function primaryAction(stateCode) {
    if (stateCode === 'DES') return ACTIONS.SEND_REITERACAO;
    if (stateCode === 'RET') return ACTIONS.SEND_REITERACAO_URGENTE;
    if (stateCode === 'REU') return ACTIONS.CONFIRMAR_DADOS;
    if (stateCode === 'CFD') return ACTIONS.PEDIDO_ATAS_DESARQUIVAMENTO;
    return null;
  }

  function currentCycle(process) {
    return Math.max(1, Number(process && (process.workflow_ciclo || process.ciclo) || 1));
  }

  function workflowInstanceId(process) {
    return text(process && process.workflow_instance_id);
  }

  function actionKey(instanceId, cycle, eventCode) {
    return String(instanceId || '') + '::' + String(cycle) + '::' + String(eventCode);
  }

  function clearProcessActionCache(process) {
    const instanceId = workflowInstanceId(process);
    if (!instanceId) return;
    const prefix = instanceId + '::';
    Array.from(actionHistoryCache.keys()).forEach(function (key) {
      if (key.startsWith(prefix)) actionHistoryCache.delete(key);
    });
  }

  async function loadExecutedActions(process, force) {
    const instanceId = workflowInstanceId(process);
    if (!instanceId) {
      console.warn('[WorkflowExterno] Processo sem workflow_instance_id; nenhum bloqueio legado será aplicado.', process && process.id);
      return actionHistoryCache;
    }
    const cycle = currentCycle(process);
    const prefix = instanceId + '::' + String(cycle) + '::';
    if (!force && Array.from(actionHistoryCache.keys()).some(function (key) { return key.startsWith(prefix); })) {
      return actionHistoryCache;
    }
    if (force) clearProcessActionCache(process);
    try {
      const client = typeof window.obterSupabaseSIGEE === 'function' ? window.obterSupabaseSIGEE() : null;
      if (!client) return actionHistoryCache;
      // A leitura direta da tabela podia retornar vazio por causa das políticas RLS,
      // mesmo quando o histórico havia sido gravado. A função RPC é SECURITY DEFINER
      // e devolve exclusivamente as ações válidas da instância/ciclo informados.
      const response = await client.rpc('sigee_workflow_acoes_executadas', {
        p_workflow_instance_id: instanceId,
        p_ciclo: cycle
      });
      if (response.error) throw response.error;
      (response.data || []).forEach(function (item) {
        const itemCycle = Number(item && item.ciclo || cycle);
        const eventCode = text(item && item.acao);
        if (eventCode) actionHistoryCache.set(actionKey(instanceId, itemCycle, eventCode), true);
      });
    } catch (error) {
      console.warn('[WorkflowExterno] Não foi possível consultar bloqueios persistidos:', error);
    }
    return actionHistoryCache;
  }

  function wasExecuted(process, eventCode) {
    return actionHistoryCache.has(actionKey(workflowInstanceId(process), currentCycle(process), eventCode));
  }

  function availableActions(process) {
    const stateCode = processState(process);
    const elapsed = elapsedDays(process);
    const deadline = deadlineForState(stateCode);
    const result = [];
    const primary = primaryAction(stateCode);

    if (primary) {
      result.push({
        action: primary,
        enabled: (deadline == null || elapsed >= deadline) && !wasExecuted(process, primary.event),
        executed: wasExecuted(process, primary.event),
        remainingDays: deadline == null ? 0 : Math.max(0, deadline - elapsed),
        primary: true
      });
    }

    if (['DES', 'RET', 'REU', 'CFD'].includes(stateCode)) {
      result.push({
        action: ACTIONS.RETIFICAR_DADOS,
        enabled: !wasExecuted(process, ACTIONS.RETIFICAR_DADOS.event),
        executed: wasExecuted(process, ACTIONS.RETIFICAR_DADOS.event),
        remainingDays: 0,
        primary: false
      });
    }

    return result;
  }

  function toast(message, type) {
    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast(message);
      return;
    }
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:100001;padding:12px 16px;border-radius:10px;color:#fff;font-weight:700;background:' + (type === 'error' ? '#b42318' : '#157347');
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  function actionVisual(eventCode) {
    const map = {
      SEND_REITERACAO: { className: 'sigee-wfe-action-reiteracao', icon: '✉️' },
      SEND_REITERACAO_URGENTE: { className: 'sigee-wfe-action-reiteracao-urgente', icon: '🚨' },
      CONFIRMAR_DADOS: { className: 'sigee-wfe-action-confirmacao', icon: '☑️' },
      RETIFICAR_DADOS: { className: 'sigee-wfe-action-retificacao', icon: '🔄' },
      PEDIDO_ATAS_DESARQUIVAMENTO: { className: 'sigee-wfe-action-atas', icon: '📕' }
    };
    return map[eventCode] || { className: '', icon: '•' };
  }

  function ensureMenuStyle() {
    if (document.getElementById('sigee-wfe-style')) return;
    const style = document.createElement('style');
    style.id = 'sigee-wfe-style';
    style.textContent = `
      .sigee-wfe-backdrop{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(3,12,24,.78);backdrop-filter:blur(6px)}
      .sigee-wfe-panel{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:linear-gradient(180deg,rgba(21,38,59,.98),rgba(8,22,38,.98));color:#fff;box-shadow:0 24px 80px rgba(0,0,0,.45)}
      .sigee-wfe-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.1)}
      .sigee-wfe-head h2{margin:0;font-size:1.25rem}.sigee-wfe-close{border:0;background:transparent;color:#fff;font-size:1.8rem;cursor:pointer}
      .sigee-wfe-body{display:grid;gap:16px;padding:20px 22px}.sigee-wfe-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .sigee-wfe-card,.sigee-wfe-action{padding:14px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045)}
      .sigee-wfe-card span{display:block;color:rgba(255,255,255,.65);font-size:.75rem;font-weight:800;text-transform:uppercase}.sigee-wfe-card strong{display:block;margin-top:5px}
      .sigee-wfe-actions{display:grid;gap:10px}.sigee-wfe-action{display:flex;align-items:center;justify-content:space-between;gap:16px}.sigee-wfe-action-copy{display:flex;align-items:flex-start;gap:12px}.sigee-wfe-action-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 36px;border-radius:10px;font-size:1.15rem}.sigee-wfe-action p{margin:4px 0 0;color:rgba(255,255,255,.7);font-size:.86rem}
      .sigee-wfe-btn{padding:10px 14px;border:0;border-radius:9px;font-weight:800;cursor:pointer;background:#fff;color:#102033}.sigee-wfe-btn:disabled{opacity:.45;cursor:not-allowed}
      .sigee-wfe-secondary{background:#16835d;color:#fff}.sigee-wfe-documento{border-color:rgba(16,185,129,.38);background:rgba(16,185,129,.09)}.sigee-wfe-note{padding:13px;border-radius:10px;background:rgba(255,193,7,.1)}
      @media(max-width:650px){.sigee-wfe-summary{grid-template-columns:1fr}.sigee-wfe-action{align-items:stretch;flex-direction:column}.sigee-wfe-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function closeMenu() {
    document.getElementById('sigee-wfe-menu')?.remove();
  }

  function openLegacyDocumentReceived(id) {
    closeMenu();
    if (typeof originalOpenDesarquivamento === 'function') {
      return originalOpenDesarquivamento(id);
    }
    toast('O procedimento Documento Recebido não está disponível.', 'error');
  }

  async function refreshScreens() {
    try {
      if (typeof window.recarregarCentralProcessosSIGEE === 'function') {
        await window.recarregarCentralProcessosSIGEE(true);
      }
      if (window.SIGEE_Processos && typeof window.SIGEE_Processos.contar === 'function') {
        window.SIGEE_Processos.contar();
      }
    } catch (error) {
      console.warn('[WorkflowExterno] Falha ao atualizar telas:', error);
    }
  }

  function configureTransitionManager() {
    if (configured || !window.TransitionManager) return;

    window.TransitionManager.configure({
      getCurrentUser: currentUser,
      getProcess: async function (id) {
        return findProcess(id);
      },
      saveProcess: async function (updated) {
        if (!updated.workflow_instance_id) {
          updated.workflow_instance_id = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : ('WF-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        }

        const list = processList();
        const index = list.findIndex(function (item) {
          return String(item.id) === String(updated.id);
        });

        /*
         * PATCH 1.1.1:
         * O TransitionManager devolve apenas os campos alterados pela
         * transição. Salvar diretamente "updated" descartava dados que já
         * existiam no objeto local, inclusive tecnico_responsavel.
         */
        const existente = index >= 0 ? list[index] : {};
        const consolidado = Object.assign({}, existente, updated);

        const responsavel =
          consolidado.tecnico_responsavel ||
          consolidado.tecnico_responsavel_nome ||
          consolidado.responsavel ||
          consolidado.responsavel_nome ||
          consolidado.analista ||
          consolidado.analista_nome ||
          consolidado.digitador ||
          consolidado.digitador_nome ||
          consolidado.conferente ||
          consolidado.conferente_nome ||
          '';

        if (responsavel) {
          consolidado.tecnico_responsavel = responsavel;
          consolidado.tecnico_responsavel_nome =
            consolidado.tecnico_responsavel_nome || responsavel;
          consolidado.responsavel =
            consolidado.responsavel || responsavel;
          consolidado.responsavel_nome =
            consolidado.responsavel_nome || responsavel;
        }

        if (index >= 0) list[index] = consolidado;
        else list.push(consolidado);

        if (window.SIGEE_Processos && typeof window.SIGEE_Processos.salvar === 'function') {
          await window.SIGEE_Processos.salvar(consolidado);
        }

        return consolidado;
      },
      addHistory: async function (record) {
        try {
          const client = typeof window.obterSupabaseSIGEE === 'function'
            ? window.obterSupabaseSIGEE()
            : null;
          if (!client) return null;
          const payload = {
            processo_id: record.processId,
            workflow_instance_id: findProcess(record.processId)?.workflow_instance_id || null,
            workflow_model_version: '1.0.1c',
            execution_status: 'EXECUTADA',
            workflow_bloqueio_ativo: true,
            codigo_sigee: findProcess(record.processId)?.codigo_sigee || '',
            etapa: record.etapa_destino,
            acao: record.event,
            observacao: record.observation || null,
            usuario_nome: record.usuario || null,
            usuario_email: currentUser()?.email || null,
            usuario_perfil: record.perfil || null,
            nte: findProcess(record.processId)?.nte || null,
            dados: {
              etapa_origem: record.etapa_origem,
              etapa_destino: record.etapa_destino,
              mensagem: record.messageCode,
              ciclo: record.cycle,
              novo_ciclo: record.novo_ciclo || null,
              prazo_dias: record.prazo_dias || null,
              contexto_analise: record.contexto_analise || null,
              executor_nome: record.usuario || currentUser()?.nome || currentUser()?.email || null,
              executor_email: currentUser()?.email || null,
              executor_perfil: record.perfil || currentUser()?.perfil || null,
              executor_nte: currentUser()?.nte || currentUser()?.nte_nome || currentUser()?.grupo || null
            },
            created_at: record.createdAt
          };
          // Registro atômico por RPC: não depende das políticas RLS da tabela e
          // preserva a restrição de uma única execução por instância/ciclo/ação.
          const response = await client.rpc('sigee_registrar_acao_workflow', {
            p_processo_id: payload.processo_id,
            p_workflow_instance_id: payload.workflow_instance_id,
            p_ciclo: Number(record.cycle || 1),
            p_acao: payload.acao,
            p_etapa: payload.etapa,
            p_codigo_sigee: payload.codigo_sigee,
            p_observacao: payload.observacao,
            p_usuario_nome: payload.usuario_nome,
            p_usuario_email: payload.usuario_email,
            p_usuario_perfil: payload.usuario_perfil,
            p_nte: payload.nte,
            p_dados: payload.dados
          });
          if (response.error) throw response.error;
          const result = Array.isArray(response.data) ? response.data[0] : response.data;
          if (!result || result.sucesso !== true) {
            throw new Error((result && result.mensagem) || 'O Supabase não confirmou o registro da ação.');
          }
          actionHistoryCache.set(actionKey(payload.workflow_instance_id, record.cycle, record.event), true);
          return { id: result.historico_id || null };
        } catch (error) {
          console.error('[WorkflowExterno] Histórico não registrado:', error);
          // Não sinaliza sucesso silencioso quando o bloqueio persistente falhar.
          throw error;
        }
      },
      addAudit: async function (record) {
        try {
          if (typeof window.registrarLog === 'function') {
            window.registrarLog('[WORKFLOW EXTERNO] ' + record.action + ' — Processo ' + record.processId);
          }
        } catch (error) {
          console.warn('[WorkflowExterno] Auditoria não registrada:', error);
        }
        return null;
      },
      hasActionExecuted: async function (query) {
        const process = findProcess(query.processId);
        if (process) await loadExecutedActions(process, true);
        return actionHistoryCache.has(actionKey(workflowInstanceId(process), query.cycle, query.event));
      },
      now: function () {
        return window.SIGEE_WORKFLOW_CLOCK && typeof window.SIGEE_WORKFLOW_CLOCK.now === 'function'
          ? window.SIGEE_WORKFLOW_CLOCK.now()
          : new Date();
      }
    });

    configured = true;
  }

  function openAction(process, action) {
    if (!window.WorkflowActionModal) {
      toast('WorkflowActionModal não foi carregado.', 'error');
      return;
    }

    configureTransitionManager();
    const preview = window.TransitionManager.preview({ process: process, event: action.event });
    if (!preview.success) {
      toast('A ação não é permitida para a etapa atual.', 'error');
      return;
    }

    const message = actionMessage(action);
    closeMenu();

    window.WorkflowActionModal.open({
      processId: process.id,
      event: action.event,
      title: action.title,
      currentState: preview.currentStateName,
      nextState: preview.nextStateName,
      deadlineDays: action.deadlineDays,
      messageCode: message.code,
      messageText: message.text,
      consequence: action.consequence,
      requireConfirmation: true,
      confirmations: message.confirmations,
      allowObservation: true,
      observationRequired: Boolean(action.observationRequired),
      observationLabel: action.observationRequired ? 'Motivo e dados retificados' : 'Observações',
      executeLabel: 'Executar ação',
      onConfirm: async function (payload) {
        const inicioAnterior =
          process.data_inicio_desarquivamento ||
          process.data_inicio_ciclo ||
          process.inicio_ciclo ||
          process.created_at ||
          process.criado_em ||
          process.prazo_inicio ||
          process.data_etapa_atual ||
          new Date().toISOString();

        const result = await window.TransitionManager.execute({
          processId: process.id,
          event: action.event,
          user: currentUser(),
          observation: payload.observation,
          confirmed: payload.confirmed,
          messageCode: message.code
        });

        const atualizado = findProcess(process.id) || process;
        const agora = window.SIGEE_WORKFLOW_CLOCK && typeof window.SIGEE_WORKFLOW_CLOCK.now === 'function'
          ? window.SIGEE_WORKFLOW_CLOCK.now().toISOString()
          : new Date().toISOString();

        if (action.event === 'RETIFICAR_DADOS') {
          /*
           * Única ação que inicia novo ciclo e reinicia a contagem.
           */
          atualizado.data_inicio_desarquivamento = agora;
          atualizado.data_inicio_ciclo = agora;
          atualizado.prazo_inicio = agora;
          atualizado.dias_decorridos = 0;
        } else {
          /*
           * As demais ações mudam etapa e prazo operacional, mas preservam
           * a data original e a contagem total do ciclo.
           */
          atualizado.data_inicio_desarquivamento = inicioAnterior;
          atualizado.data_inicio_ciclo = inicioAnterior;
        }

        /*
         * A mensagem registrada é sempre derivada da ação efetivamente
         * executada, evitando reaproveitamento da mensagem anterior.
         */
        atualizado.ultima_mensagem_workflow = message.code;
        atualizado.ultimo_evento_workflow = action.event;

        if (window.SIGEE_Processos && typeof window.SIGEE_Processos.salvar === 'function') {
          await window.SIGEE_Processos.salvar(atualizado);
        }

        actionHistoryCache.set(
          actionKey(
            workflowInstanceId(atualizado),
            result.event === 'RETIFICAR_DADOS' ? result.cycle - 1 : result.cycle,
            result.event
          ),
          true
        );

        await refreshScreens();
        toast(result.message + ' Nova etapa: ' + result.nextStateName + '.');
      }
    });
  }

  async function open(id) {
    configureTransitionManager();
    ensureMenuStyle();

    const process = findProcess(id);
    if (!process) {
      toast('Processo não localizado.', 'error');
      return;
    }

    await loadExecutedActions(process, true);
    const stateCode = processState(process);
    if (!EXTERNAL_STATES.includes(stateCode)) {
      return openLegacyDocumentReceived(id);
    }

    const elapsed = elapsedDays(process);
    const state = window.SIGEE_STATE_MANAGER.get(stateCode);
    const actions = availableActions(process);

    closeMenu();
    const root = document.createElement('div');
    root.id = 'sigee-wfe-menu';
    root.className = 'sigee-wfe-backdrop';

    const actionsHtml = actions.map(function (entry, index) {
      const statusText = entry.executed
        ? 'Ação já executada neste ciclo'
        : entry.enabled
          ? 'Ação disponível'
          : 'Disponível em ' + entry.remainingDays + ' dia' + (entry.remainingDays === 1 ? '' : 's');
      const visual = actionVisual(entry.action.event);
      return `
        <div class="sigee-wfe-action ${visual.className}">
          <div class="sigee-wfe-action-copy">
            <span class="sigee-wfe-action-icon" aria-hidden="true">${visual.icon}</span>
            <div>
              <strong>${entry.action.title}</strong>
              <p>${statusText}</p>
            </div>
          </div>
          <button type="button" class="sigee-wfe-btn" data-wfe-action="${index}" ${entry.enabled ? '' : 'disabled'}>
            ${entry.executed ? 'Executada' : (entry.enabled ? 'Abrir' : 'Aguardando')}
          </button>
        </div>`;
    }).join('');

    root.innerHTML = `
      <section class="sigee-wfe-panel" role="dialog" aria-modal="true" aria-labelledby="sigee-wfe-title">
        <header class="sigee-wfe-head">
          <h2 id="sigee-wfe-title">Workflow Externo — ${text(process.codigo_sigee || process.id)}</h2>
          <button type="button" class="sigee-wfe-close" data-wfe-close>×</button>
        </header>
        <div class="sigee-wfe-body">
          <div class="sigee-wfe-summary">
            <div class="sigee-wfe-card"><span>Etapa atual</span><strong>${state.name}</strong></div>
            <div class="sigee-wfe-card"><span>Dias na etapa</span><strong>${elapsed}</strong></div>
            <div class="sigee-wfe-card"><span>Prazo da etapa</span><strong>${state.deadline == null ? 'Sem prazo' : state.deadline + ' dias'}</strong></div>
          </div>
          <div class="sigee-wfe-note">Cada comunicação somente será registrada após a confirmação obrigatória de todas as mensagens institucionais vinculadas à ação.</div>
          <div class="sigee-wfe-actions">${actionsHtml || '<div class="sigee-wfe-card">Nenhuma ação externa disponível.</div>'}</div>
          <div class="sigee-wfe-action sigee-wfe-documento">
            <div class="sigee-wfe-action-copy"><span class="sigee-wfe-action-icon" aria-hidden="true">📁</span><div><strong>Documento Recebido</strong><p>Registre o tipo e o local do arquivo, defina a prioridade e o analista e confirme o envio do E-mail 02. O Desarquivamento será encerrado e o processo seguirá para Análise, sem reiniciar o ciclo.</p></div></div>
            <button type="button" class="sigee-wfe-btn sigee-wfe-secondary" data-wfe-documento>Receber documento</button>
          </div>
        </div>
      </section>`;

    document.body.appendChild(root);
    root.addEventListener('click', function (event) {
      if (event.target === root || event.target.closest('[data-wfe-close]')) {
        closeMenu();
        return;
      }
      const button = event.target.closest('[data-wfe-action]');
      if (button) {
        const entry = actions[Number(button.dataset.wfeAction)];
        if (entry && entry.enabled) openAction(process, entry.action);
        return;
      }
      if (event.target.closest('[data-wfe-documento]')) {
        window.abrirDocumentoRecebidoSIGEE(id);
      }
    });
  }

  function install() {
    if (!originalOpenDesarquivamento && typeof window.abrirModalFluxoDesarquivamento === 'function') {
      originalOpenDesarquivamento = window.abrirModalFluxoDesarquivamento;
    }
    configureTransitionManager();
    window.abrirModalFluxoDesarquivamento = open;
  }

  window.SIGEE_WORKFLOW_EXTERNO = Object.freeze({
    version: VERSION,
    open: open,
    openDocumentReceived: openLegacyDocumentReceived,
    install: install,
    availableActions: availableActions,
    elapsedDays: elapsedDays
  });

  /*
   * Entrada pública exclusiva para Pasta localizada / Documento recebido.
   * Ela ignora o menu do Workflow Externo e abre diretamente o procedimento
   * homologado com Tipo de Arquivo, Local do Arquivo, Prioridade e Analista.
   */
  window.abrirDocumentoRecebidoSIGEE = openLegacyDocumentReceived;

  if (document.readyState === 'complete') install();
  else window.addEventListener('load', install, { once: true });
})(window);
