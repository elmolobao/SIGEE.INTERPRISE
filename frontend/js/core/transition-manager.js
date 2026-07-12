/* =====================================================================
 * SIGEE — Transition Manager
 * Implementação I-003.1 — versão 0.9.5.0
 *
 * Responsabilidade:
 * - validar processo, estado, evento, perfil, prazo e confirmação;
 * - delegar a decisão de transição ao SIGEE_WORKFLOW;
 * - atualizar os dados do processo por meio de um adaptador;
 * - registrar histórico e auditoria quando os adaptadores forem fornecidos.
 *
 * Este arquivo não acessa diretamente Supabase, IndexedDB ou telas.
 * A integração concreta será feita em processos.js.
 * ===================================================================== */
(function (window) {
  'use strict';

  const VERSION = '0.9.5.0';

  const ERROR_MESSAGES = Object.freeze({
    WF001: 'Estado atual inválido.',
    WF002: 'Evento não permitido para o estado atual.',
    WF003: 'O perfil do usuário não possui permissão para esta ação.',
    WF004: 'O prazo mínimo da etapa ainda não foi alcançado.',
    WF005: 'A ação viola uma regra de negócio.',
    WF006: 'Processo não localizado.',
    WF007: 'Workflow Engine indisponível.',
    WF008: 'A confirmação obrigatória não foi realizada.',
    WF009: 'Falha ao persistir a transição.',
    WF010: 'Evento inválido.',
    WF011: 'Esta ação já foi executada neste ciclo.'
  });

  const STATE_NAME_TO_CODE = Object.freeze({
    'DESARQUIVAMENTO': 'DES',
    'REITERACAO': 'RET',
    'REITERACAO URGENTE': 'REU',
    'CONFIRMACAO DOS DADOS': 'CFD',
    'PASTA LOCALIZADA': 'PLA',
    'ANALISE': 'ANA',
    'PENDENCIA': 'PEN',
    'DIGITACAO': 'DIG',
    'CONFERENCIA': 'CON',
    'ASSINATURA': 'ASS',
    'DEFERIDO': 'DEF',
    'AGUARDANDO RETIRADA': 'DEF',
    'RETIRADO': 'RTR'
  });

  const DEFAULT_EVENT_PERMISSIONS = Object.freeze({
    SEND_REITERACAO: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    SEND_REITERACAO_URGENTE: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    CONFIRMAR_DADOS: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    RETIFICAR_DADOS: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    DADOS_CONFIRMADOS: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    LOCALIZAR_PASTA: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    INICIAR_ANALISE: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    PEDIDO_ATAS_DESARQUIVAMENTO: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    PEDIDO_ATAS_ANALISE: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    ABRIR_PENDENCIA: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO']),
    DOCUMENTO_RECEBIDO: Object.freeze(['MASTER', 'SEC', 'ADMINISTRADOR', 'TECNICO'])
  });

  const EVENT_DEADLINE_REQUIREMENTS = Object.freeze({
    SEND_REITERACAO: 30,
    SEND_REITERACAO_URGENTE: 7,
    CONFIRMAR_DADOS: 7,
    PEDIDO_ATAS_DESARQUIVAMENTO: 7
  });

  const EVENT_MESSAGE_CODES = Object.freeze({
    SEND_REITERACAO: '43/45',
    SEND_REITERACAO_URGENTE: '44/46',
    CONFIRMAR_DADOS: '12',
    RETIFICAR_DADOS: '14/37',
    PEDIDO_ATAS_DESARQUIVAMENTO: '36'
  });

  const adapter = {
    async getProcess() { return null; },
    async saveProcess(process) { return process; },
    async addHistory() { return null; },
    async addAudit() { return null; },
    async hasActionExecuted() { return false; },
    getCurrentUser() { return null; },
    now() { return new Date(); }
  };

  let permissions = clone(DEFAULT_EVENT_PERMISSIONS);

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  function normalizeEvent(value) {
    return normalizeText(value).replace(/\s+/g, '_');
  }

  function stateCodeFrom(value) {
    const normalized = normalizeText(value);
    if (!normalized) return '';
    if (window.SIGEE_STATE_MANAGER && window.SIGEE_STATE_MANAGER.exists(normalized)) {
      return normalized;
    }
    return STATE_NAME_TO_CODE[normalized] || '';
  }

  function stateNameFrom(code) {
    const state = window.SIGEE_STATE_MANAGER && window.SIGEE_STATE_MANAGER.get(code);
    return state ? state.name : code;
  }

  function processStateCode(process) {
    if (!process) return '';
    return stateCodeFrom(
      process.etapa_codigo ||
      process.estado_codigo ||
      process.etapa_atual ||
      process.etapa ||
      process.fase_atual
    );
  }

  function dateFrom(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    if (typeof value === 'string') {
      const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (br) {
        const parsedBR = new Date(
          Number(br[3]),
          Number(br[2]) - 1,
          Number(br[1]),
          0, 0, 0, 0
        );
        return Number.isNaN(parsedBR.getTime()) ? null : parsedBR;
      }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function elapsedDays(startValue, endValue) {
    const start = dateFrom(startValue);
    const end = dateFrom(endValue);
    if (!start || !end) return null;
    return Math.floor((startOfDay(end) - startOfDay(start)) / 86400000);
  }

  function addDays(dateValue, days) {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + Number(days || 0));
    return date;
  }

  function toISO(date) {
    return new Date(date).toISOString();
  }

  function toBR(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  }

  function error(code, details) {
    const err = new Error(ERROR_MESSAGES[code] || 'Falha no workflow.');
    err.name = 'SIGEEWorkflowError';
    err.code = code;
    err.details = details || null;
    return err;
  }

  function userProfile(user) {
    return normalizeText(user && (user.perfil || user.profile || user.tipo || user.role));
  }

  function isProfileAllowed(eventCode, user) {
    const allowed = permissions[eventCode];
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(userProfile(user));
  }

  function stageEntryDate(process) {
    return (
      process.data_etapa_atual ||
      process.data_etapa ||
      process.etapa_iniciada_em ||
      process.updated_at ||
      process.created_at ||
      process.criado_em ||
      null
    );
  }

  function validateDeadline(process, eventCode, now) {
    const requiredDays = EVENT_DEADLINE_REQUIREMENTS[eventCode];
    if (!Number.isFinite(requiredDays)) {
      return { valid: true, requiredDays: null, elapsedDays: null };
    }

    const elapsed = elapsedDays(stageEntryDate(process), now);
    if (elapsed == null) {
      throw error('WF005', {
        reason: 'DATA_ETAPA_AUSENTE',
        event: eventCode
      });
    }

    if (elapsed < requiredDays) {
      throw error('WF004', {
        event: eventCode,
        requiredDays,
        elapsedDays: elapsed,
        remainingDays: requiredDays - elapsed
      });
    }

    return { valid: true, requiredDays, elapsedDays: elapsed };
  }

  function nextDeadlineDays(nextStateCode, eventCode, preview) {
    if (eventCode === 'RETIFICAR_DADOS') return 30;
    if (preview && Number.isFinite(preview.resetDeadlineDays)) {
      return preview.resetDeadlineDays;
    }

    const state = window.SIGEE_STATE_MANAGER &&
      window.SIGEE_STATE_MANAGER.get(nextStateCode);

    return state && Number.isFinite(state.deadline) ? state.deadline : null;
  }

  function buildUpdatedProcess(process, preview, eventCode, now, context) {
    const nextCode = preview.nextState;
    const nextName = stateNameFrom(nextCode);
    const deadlineDays = nextDeadlineDays(nextCode, eventCode, preview);
    const updated = clone(process);

    updated.etapa_codigo = nextCode;
    updated.etapa = nextName;
    updated.etapa_atual = nextName;
    updated.fase_atual = nextName;
    updated.data_etapa_atual = toISO(now);
    updated.updated_at = toISO(now);
    updated.prazo_etapa = deadlineDays;

    if (deadlineDays != null) {
      updated.prazo_inicio = toISO(now);
      updated.prazo_fim = toISO(addDays(now, deadlineDays));
    } else {
      updated.prazo_inicio = null;
      updated.prazo_fim = null;
    }

    if (eventCode === 'RETIFICAR_DADOS') {
      const currentCycle = Number(updated.ciclo || updated.workflow_ciclo || 1);
      updated.ciclo = currentCycle + 1;
      updated.workflow_ciclo = currentCycle + 1;
    }

    if (preview.analysisContext) {
      updated.contexto_analise = preview.analysisContext;
    }

    updated.ultimo_evento_workflow = eventCode;
    updated.ultima_mensagem_workflow =
      (context && context.messageCode) ||
      EVENT_MESSAGE_CODES[eventCode] ||
      preview.messageCode ||
      null;

    return updated;
  }

  function configure(customAdapter) {
    if (!customAdapter || typeof customAdapter !== 'object') {
      throw new TypeError('TransitionManager.configure exige um objeto adaptador.');
    }

    Object.keys(adapter).forEach(function (key) {
      if (typeof customAdapter[key] === 'function') {
        adapter[key] = customAdapter[key];
      }
    });

    return api;
  }

  function setPermissions(customPermissions) {
    if (!customPermissions || typeof customPermissions !== 'object') {
      throw new TypeError('As permissões devem ser informadas em um objeto.');
    }

    const merged = clone(DEFAULT_EVENT_PERMISSIONS);
    Object.keys(customPermissions).forEach(function (eventCode) {
      merged[normalizeEvent(eventCode)] = (customPermissions[eventCode] || [])
        .map(normalizeText);
    });

    permissions = merged;
    return api;
  }

  async function resolveProcess(input) {
    if (input.process && typeof input.process === 'object') {
      return clone(input.process);
    }

    if (input.processId == null || input.processId === '') {
      throw error('WF006', { reason: 'PROCESS_ID_AUSENTE' });
    }

    const process = await adapter.getProcess(input.processId);
    if (!process) {
      throw error('WF006', { processId: input.processId });
    }

    return clone(process);
  }

  async function execute(input) {
    const command = input || {};
    const workflow = window.SIGEE_WORKFLOW;

    if (!workflow || typeof workflow.preview !== 'function') {
      throw error('WF007');
    }

    const eventCode = normalizeEvent(command.event);
    if (!workflow.eventExists(eventCode)) {
      throw error('WF010', { event: eventCode || command.event });
    }

    const process = await resolveProcess(command);
    const currentStateCode = processStateCode(process);

    if (!workflow.stateExists(currentStateCode)) {
      throw error('WF001', {
        processId: process.id,
        state: process.etapa_atual || process.etapa || process.fase_atual
      });
    }

    const currentCycle = Number(process.workflow_ciclo || process.ciclo || 1);
    const alreadyExecuted = await adapter.hasActionExecuted({
      processId: process.id,
      event: eventCode,
      cycle: currentCycle
    });
    if (alreadyExecuted) {
      throw error('WF011', { processId: process.id, event: eventCode, cycle: currentCycle });
    }

    const user = command.user || adapter.getCurrentUser();
    if (!isProfileAllowed(eventCode, user)) {
      throw error('WF003', {
        event: eventCode,
        profile: userProfile(user)
      });
    }

    if (command.requireConfirmation !== false && command.confirmed !== true) {
      throw error('WF008', { event: eventCode });
    }

    const preview = workflow.preview(currentStateCode, eventCode);
    if (!preview.ok) {
      throw error(
        preview.error === 'INVALID_STATE' ? 'WF001' :
        preview.error === 'INVALID_EVENT' ? 'WF010' :
        'WF002',
        preview
      );
    }

    const now = adapter.now();
    const deadline = validateDeadline(process, eventCode, now);
    const context = {
      observation: String(command.observation || '').trim(),
      messageCode: command.messageCode || EVENT_MESSAGE_CODES[eventCode] || preview.messageCode || null,
      confirmed: command.confirmed === true,
      user: clone(user || null),
      deadline
    };

    const engineResult = workflow.execute(currentStateCode, eventCode, context);
    if (!engineResult.ok) {
      throw error('WF002', engineResult);
    }

    const updatedProcess = buildUpdatedProcess(
      process,
      engineResult,
      eventCode,
      now,
      context
    );

    let savedProcess;
    try {
      savedProcess = await adapter.saveProcess(updatedProcess, {
        original: clone(process),
        event: eventCode,
        user: clone(user || null),
        context: clone(context)
      });
    } catch (cause) {
      throw error('WF009', {
        processId: process.id,
        event: eventCode,
        cause: cause && cause.message ? cause.message : String(cause)
      });
    }

    const historyRecord = {
      processId: process.id,
      processo_id: process.id,
      event: eventCode,
      evento: eventCode,
      previousState: currentStateCode,
      etapa_origem: stateNameFrom(currentStateCode),
      nextState: engineResult.nextState,
      etapa_destino: stateNameFrom(engineResult.nextState),
      messageCode: context.messageCode,
      mensagem: context.messageCode,
      observation: context.observation || null,
      observacao: context.observation || null,
      cycle: currentCycle,
      ciclo: currentCycle,
      user: clone(user || null),
      usuario: user && (user.nome || user.name || user.email) || null,
      perfil: userProfile(user) || null,
      createdAt: toISO(now),
      data_hora: toISO(now)
    };

    const auditRecord = {
      processId: process.id,
      processo_id: process.id,
      module: 'WORKFLOW',
      modulo: 'WORKFLOW',
      action: eventCode,
      acao: eventCode,
      previousState: currentStateCode,
      nextState: engineResult.nextState,
      user: clone(user || null),
      usuario: user && (user.nome || user.name || user.email) || null,
      perfil: userProfile(user) || null,
      details: {
        messageCode: context.messageCode,
        observation: context.observation || null,
        deadline,
        analysisContext: engineResult.analysisContext || null
      },
      createdAt: toISO(now),
      data_hora: toISO(now)
    };

    let historyId = null;
    let auditId = null;

    try {
      const historyResult = await adapter.addHistory(historyRecord);
      historyId = historyResult && (historyResult.id || historyResult.historyId) || null;
    } catch (historyError) {
      console.error('[TransitionManager] Falha ao registrar histórico:', historyError);
    }

    try {
      const auditResult = await adapter.addAudit(auditRecord);
      auditId = auditResult && (auditResult.id || auditResult.auditId) || null;
    } catch (auditError) {
      console.error('[TransitionManager] Falha ao registrar auditoria:', auditError);
    }

    return Object.freeze({
      success: true,
      processId: process.id,
      event: eventCode,
      previousState: currentStateCode,
      previousStateName: stateNameFrom(currentStateCode),
      nextState: engineResult.nextState,
      nextStateName: stateNameFrom(engineResult.nextState),
      changed: engineResult.changed,
      cycle: Number(updatedProcess.ciclo || updatedProcess.workflow_ciclo || 1),
      deadlineDays: updatedProcess.prazo_etapa,
      deadlineStart: updatedProcess.prazo_inicio,
      deadlineEnd: updatedProcess.prazo_fim,
      messageCode: context.messageCode,
      analysisContext: engineResult.analysisContext || null,
      historyId,
      auditId,
      process: clone(savedProcess || updatedProcess),
      executedAt: toISO(now),
      executedAtBR: toBR(now),
      message: 'Transição executada com sucesso.'
    });
  }

  function preview(input) {
    const command = input || {};
    const workflow = window.SIGEE_WORKFLOW;

    if (!workflow || typeof workflow.preview !== 'function') {
      return { success: false, code: 'WF007', message: ERROR_MESSAGES.WF007 };
    }

    const eventCode = normalizeEvent(command.event);
    const process = command.process || null;
    const currentStateCode = processStateCode(process);
    const result = workflow.preview(currentStateCode, eventCode);

    return Object.assign({}, result, {
      success: result.ok,
      currentStateName: stateNameFrom(currentStateCode),
      nextStateName: result.ok ? stateNameFrom(result.nextState) : null,
      messageCode: EVENT_MESSAGE_CODES[eventCode] || result.messageCode || null,
      requiredDeadlineDays: EVENT_DEADLINE_REQUIREMENTS[eventCode] ?? null
    });
  }

  const api = Object.freeze({
    version: VERSION,
    errors: ERROR_MESSAGES,
    configure,
    setPermissions,
    execute,
    preview,
    normalizeEvent,
    stateCodeFrom,
    stateNameFrom,
    elapsedDays
  });

  window.TransitionManager = api;
  window.SIGEE_TRANSITION_MANAGER = api;
})(window);
