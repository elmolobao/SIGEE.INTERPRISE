/**
 * WorkflowActionModal
 * SIGEE Enterprise — I-002
 *
 * Componente reutilizável para ações do workflow.
 * Não altera etapas nem acessa o banco diretamente.
 */
(function (global) {
  'use strict';

  const ROOT_ID = 'sigee-workflow-action-modal';
  const STYLE_ID = 'sigee-workflow-action-modal-style';

  const defaults = {
    processId: null,
    event: '',
    title: 'Executar ação',
    currentState: 'Não informado',
    nextState: 'Não informado',
    deadlineDays: null,
    messageCode: '',
    messageText: '',
    consequence: '',
    requireConfirmation: true,
    confirmationText: 'Confirmo que a mensagem institucional foi enviada ao requerente.',
    confirmations: null,
    allowObservation: true,
    observationRequired: false,
    observationLabel: 'Observações',
    observationPlaceholder: 'Registre informações complementares, se necessário.',
    executeLabel: 'Executar',
    cancelLabel: 'Cancelar',
    closeOnBackdrop: true,
    closeOnEscape: true,
    onConfirm: null,
    onCancel: null
  };

  let options = null;
  let previousActiveElement = null;
  let keydownHandler = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.sigee-modal-open{overflow:hidden}
      .sigee-wam-backdrop{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(3,12,24,.78);backdrop-filter:blur(6px)}
      .sigee-wam-dialog{width:min(720px,100%);max-height:calc(100vh - 48px);overflow:auto;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:linear-gradient(180deg,rgba(21,38,59,.98),rgba(8,22,38,.98));box-shadow:0 24px 80px rgba(0,0,0,.45);color:#f7fbff;font-family:inherit}
      .sigee-wam-header,.sigee-wam-footer{display:flex;align-items:center;gap:12px;padding:20px 24px}
      .sigee-wam-header{justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.10)}
      .sigee-wam-header h2{margin:0;font-size:1.25rem}
      .sigee-wam-body{display:grid;gap:18px;padding:22px 24px}
      .sigee-wam-flow{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center}
      .sigee-wam-card{padding:14px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045)}
      .sigee-wam-label{display:block;margin-bottom:6px;color:rgba(255,255,255,.66);font-size:.78rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
      .sigee-wam-value{font-size:1rem;font-weight:700}
      .sigee-wam-arrow{font-size:1.5rem;opacity:.75}
      .sigee-wam-message{padding:16px;border-left:4px solid currentColor;border-radius:10px;background:rgba(255,255,255,.055)}
      .sigee-wam-message-code{display:inline-block;margin-bottom:8px;font-weight:800}
      .sigee-wam-message-text{margin:0;white-space:pre-wrap;line-height:1.55}
      .sigee-wam-consequence{padding:14px;border-radius:10px;background:rgba(255,193,7,.10)}
      .sigee-wam-field label{display:block;margin-bottom:8px;font-weight:700}
      .sigee-wam-field textarea{width:100%;min-height:96px;resize:vertical;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(255,255,255,.06);color:#fff;font:inherit;outline:none}
      .sigee-wam-confirm{display:flex;align-items:flex-start;gap:10px;padding:14px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.035)}
      .sigee-wam-confirm input{margin-top:3px;width:18px;height:18px}
      .sigee-wam-error{display:none;padding:12px 14px;border-radius:10px;background:rgba(220,53,69,.16);color:#ffd7dc}
      .sigee-wam-error.is-visible{display:block}
      .sigee-wam-footer{justify-content:flex-end;border-top:1px solid rgba(255,255,255,.10)}
      .sigee-wam-btn{min-width:118px;padding:11px 18px;border:0;border-radius:10px;font:inherit;font-weight:800;cursor:pointer}
      .sigee-wam-btn-secondary{background:rgba(255,255,255,.10);color:#fff}
      .sigee-wam-btn-primary{background:#fff;color:#102033}
      .sigee-wam-btn:disabled{cursor:not-allowed;opacity:.45}
      @media (max-width:640px){.sigee-wam-backdrop{padding:10px}.sigee-wam-dialog{max-height:calc(100vh - 20px)}.sigee-wam-flow{grid-template-columns:1fr}.sigee-wam-arrow{transform:rotate(90deg);text-align:center}.sigee-wam-footer{flex-direction:column-reverse}.sigee-wam-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function createModal() {
    const existing = byId(ROOT_ID);
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'sigee-wam-backdrop';
    root.innerHTML = `
      <section class="sigee-wam-dialog" role="dialog" aria-modal="true" aria-labelledby="sigee-wam-title">
        <header class="sigee-wam-header">
          <h2 id="sigee-wam-title"></h2>
        </header>
        <div class="sigee-wam-body">
          <div class="sigee-wam-flow">
            <div class="sigee-wam-card">
              <span class="sigee-wam-label">Etapa atual</span>
              <span class="sigee-wam-value" id="sigee-wam-current"></span>
            </div>
            <div class="sigee-wam-arrow" aria-hidden="true">→</div>
            <div class="sigee-wam-card">
              <span class="sigee-wam-label">Próxima etapa</span>
              <span class="sigee-wam-value" id="sigee-wam-next"></span>
            </div>
          </div>
          <div class="sigee-wam-card">
            <span class="sigee-wam-label">Prazo iniciado</span>
            <span class="sigee-wam-value" id="sigee-wam-deadline"></span>
          </div>
          <div class="sigee-wam-message">
            <span class="sigee-wam-message-code" id="sigee-wam-message-code"></span>
            <p class="sigee-wam-message-text" id="sigee-wam-message-text"></p>
          </div>
          <div class="sigee-wam-consequence" id="sigee-wam-consequence"></div>
          <div class="sigee-wam-field" id="sigee-wam-observation-wrap">
            <label for="sigee-wam-observation"></label>
            <textarea id="sigee-wam-observation"></textarea>
          </div>
          <div id="sigee-wam-confirm-wrap"></div>
          <div class="sigee-wam-error" id="sigee-wam-error" role="alert"></div>
        </div>
        <footer class="sigee-wam-footer">
          <button type="button" class="sigee-wam-btn sigee-wam-btn-secondary" id="sigee-wam-cancel"></button>
          <button type="button" class="sigee-wam-btn sigee-wam-btn-primary" id="sigee-wam-execute" disabled></button>
        </footer>
      </section>
    `;
    document.body.appendChild(root);
    return root;
  }

  function setError(message = '') {
    const el = byId('sigee-wam-error');
    el.textContent = message;
    el.classList.toggle('is-visible', Boolean(message));
  }

  function isValid() {
    const observation = byId('sigee-wam-observation')?.value.trim() || '';
    const confirmations = [...document.querySelectorAll('#sigee-wam-confirm-wrap .sigee-wam-confirm-input')];
    const confirmed = confirmations.length === 0 || confirmations.every(input => input.checked);
    if (options.requireConfirmation && !confirmed) return false;
    if (options.observationRequired && !observation) return false;
    return true;
  }

  function updateExecuteState() {
    const button = byId('sigee-wam-execute');
    if (button) button.disabled = !isValid();
  }

  function render() {
    byId('sigee-wam-title').textContent = options.title;
    byId('sigee-wam-current').textContent = options.currentState;
    byId('sigee-wam-next').textContent = options.nextState;
    byId('sigee-wam-deadline').textContent =
      Number.isFinite(options.deadlineDays)
        ? `${options.deadlineDays} dia${options.deadlineDays === 1 ? '' : 's'}`
        : 'Sem novo prazo';

    byId('sigee-wam-message-code').textContent =
      options.messageCode ? `Mensagem ${options.messageCode}` : 'Mensagem institucional';
    byId('sigee-wam-message-text').textContent =
      options.messageText || 'Nenhuma mensagem institucional informada.';

    const consequence = byId('sigee-wam-consequence');
    consequence.textContent = options.consequence || '';
    consequence.hidden = !options.consequence;

    const obsWrap = byId('sigee-wam-observation-wrap');
    obsWrap.hidden = !options.allowObservation;
    obsWrap.querySelector('label').textContent =
      `${options.observationLabel}${options.observationRequired ? ' *' : ''}`;
    byId('sigee-wam-observation').placeholder = options.observationPlaceholder;

    const confirmWrap = byId('sigee-wam-confirm-wrap');
    confirmWrap.hidden = !options.requireConfirmation;
    const confirmationItems = Array.isArray(options.confirmations) && options.confirmations.length
      ? options.confirmations
      : [{ code: options.messageCode || '', text: options.confirmationText }];
    confirmWrap.innerHTML = options.requireConfirmation
      ? confirmationItems.map((item, index) => `
          <label class="sigee-wam-confirm">
            <input class="sigee-wam-confirm-input" type="checkbox" value="${String(item.code || index)}">
            <span>${String(item.text || options.confirmationText)}</span>
          </label>`).join('')
      : '';

    byId('sigee-wam-cancel').textContent = options.cancelLabel;
    byId('sigee-wam-execute').textContent = options.executeLabel;

    setError('');
    updateExecuteState();
  }

  function close(reason = 'cancel') {
    const root = byId(ROOT_ID);
    if (!root) return;

    document.removeEventListener('keydown', keydownHandler);
    document.body.classList.remove('sigee-modal-open');
    root.remove();

    const oldOptions = options;
    options = null;

    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }

    if (reason === 'cancel' && typeof oldOptions?.onCancel === 'function') {
      oldOptions.onCancel();
    }
  }

  async function execute() {
    if (!isValid()) {
      setError('Confirme os dados obrigatórios antes de executar a ação.');
      return;
    }

    const payload = {
      processId: options.processId,
      event: options.event,
      observation: byId('sigee-wam-observation')?.value.trim() || '',
      confirmed: [...document.querySelectorAll('#sigee-wam-confirm-wrap .sigee-wam-confirm-input')].every(input => input.checked),
      confirmations: [...document.querySelectorAll('#sigee-wam-confirm-wrap .sigee-wam-confirm-input')].map(input => ({ code: input.value, confirmed: input.checked }))
    };

    const executeButton = byId('sigee-wam-execute');
    const cancelButton = byId('sigee-wam-cancel');

    try {
      setError('');
      executeButton.disabled = true;
      executeButton.textContent = 'Executando...';
      cancelButton.disabled = true;

      if (typeof options.onConfirm === 'function') {
        await options.onConfirm(payload);
      }

      close('confirm');
    } catch (error) {
      console.error('[WorkflowActionModal] Falha:', error);
      setError(error?.message || 'Não foi possível executar a ação.');
      executeButton.textContent = options.executeLabel;
      cancelButton.disabled = false;
      updateExecuteState();
    }
  }

  const WorkflowActionModal = {
    open(customOptions = {}) {
      if (!document?.body) {
        throw new Error('WorkflowActionModal exige um ambiente de navegador.');
      }

      ensureStyles();
      previousActiveElement = document.activeElement;
      options = { ...defaults, ...customOptions };

      const root = createModal();
      render();

      byId('sigee-wam-cancel').addEventListener('click', () => close('cancel'));
      byId('sigee-wam-execute').addEventListener('click', execute);
      byId('sigee-wam-confirm-wrap').addEventListener('change', updateExecuteState);
      byId('sigee-wam-observation').addEventListener('input', updateExecuteState);

      root.addEventListener('click', (event) => {
        if (options.closeOnBackdrop && event.target === root) {
          close('cancel');
        }
      });

      keydownHandler = (event) => {
        if (event.key === 'Escape' && options?.closeOnEscape) {
          close('cancel');
        }
      };
      document.addEventListener('keydown', keydownHandler);

      document.body.classList.add('sigee-modal-open');

      setTimeout(() => {
        const focusTarget = options.allowObservation
          ? byId('sigee-wam-observation')
          : document.querySelector('#sigee-wam-confirm-wrap .sigee-wam-confirm-input');
        focusTarget?.focus();
      }, 0);

      return { close: () => close('cancel') };
    },

    close,

    isOpen() {
      return Boolean(byId(ROOT_ID));
    }
  };

  global.WorkflowActionModal = WorkflowActionModal;
})(window);
