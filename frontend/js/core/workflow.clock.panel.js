/* SIGEE — Painel de Homologação Temporal (somente Master). */
(function (window, document) {
  'use strict';

  const clock = window.SIGEE_WORKFLOW_CLOCK;
  if (!clock) return;

  function fmt(dateValue) {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
  }

  function ensureStyles() {
    if (document.getElementById('sigee-clock-style')) return;
    const style = document.createElement('style');
    style.id = 'sigee-clock-style';
    style.textContent = `
      #sigee-clock-toggle{position:fixed;right:18px;bottom:18px;z-index:99990;border:0;border-radius:999px;padding:10px 14px;background:#b45309;color:#fff;font-weight:700;box-shadow:0 8px 25px rgba(0,0,0,.28);cursor:pointer}
      #sigee-clock-panel{position:fixed;right:18px;bottom:68px;z-index:99991;width:320px;background:#111827;color:#f9fafb;border:1px solid #f59e0b;border-radius:14px;padding:16px;box-shadow:0 18px 40px rgba(0,0,0,.42);font-family:system-ui,sans-serif}
      #sigee-clock-panel.hidden{display:none}.sigee-clock-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sigee-clock-badge{font-size:12px;background:#92400e;padding:4px 8px;border-radius:999px}.sigee-clock-row{font-size:13px;margin:6px 0}.sigee-clock-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.sigee-clock-actions button,.sigee-clock-off{border:0;border-radius:8px;padding:8px;background:#374151;color:#fff;cursor:pointer}.sigee-clock-off{width:100%;background:#7f1d1d}.sigee-clock-input{display:flex;gap:6px;margin-top:10px}.sigee-clock-input input{min-width:0;flex:1;background:#1f2937;color:#fff;border:1px solid #4b5563;border-radius:8px;padding:7px}.sigee-clock-input button{border:0;border-radius:8px;background:#065f46;color:#fff;padding:7px 10px;cursor:pointer}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const isMaster = clock.isMaster();
    let toggle = document.getElementById('sigee-clock-toggle');
    let panel = document.getElementById('sigee-clock-panel');

    if (!isMaster) {
      if (toggle) toggle.remove();
      if (panel) panel.remove();
      return;
    }

    ensureStyles();
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'sigee-clock-toggle';
      toggle.type = 'button';
      toggle.addEventListener('click', function () {
        document.getElementById('sigee-clock-panel').classList.toggle('hidden');
      });
      document.body.appendChild(toggle);
    }

    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'sigee-clock-panel';
      panel.className = 'hidden';
      document.body.appendChild(panel);
    }

    const status = clock.status();
    toggle.textContent = status.enabled ? '🟠 Homologação temporal' : '🕒 Testar prazos';
    const localValue = new Date(status.now);
    localValue.setMinutes(localValue.getMinutes() - localValue.getTimezoneOffset());

    panel.innerHTML = `
      <div class="sigee-clock-head"><strong>Modo Homologação</strong><span class="sigee-clock-badge">MASTER</span></div>
      <div class="sigee-clock-row">Referência do Workflow: <strong>${fmt(status.now)}</strong></div>
      <div class="sigee-clock-row">Tempo oficial: ${fmt(status.officialNow)}</div>
      <div class="sigee-clock-actions">
        <button data-days="1">+1 dia</button><button data-days="7">+7 dias</button><button data-days="30">+30 dias</button><button data-days="90">+90 dias</button>
      </div>
      <div class="sigee-clock-input"><input id="sigee-clock-date" type="datetime-local" value="${localValue.toISOString().slice(0,16)}"><button id="sigee-clock-set">Definir</button></div>
      <button class="sigee-clock-off" id="sigee-clock-off">Usar data oficial</button>
    `;

    panel.querySelectorAll('[data-days]').forEach(function (button) {
      button.addEventListener('click', function () { clock.advanceDays(Number(button.dataset.days)); });
    });
    panel.querySelector('#sigee-clock-set').addEventListener('click', function () {
      const value = panel.querySelector('#sigee-clock-date').value;
      if (value) clock.set(new Date(value));
    });
    panel.querySelector('#sigee-clock-off').addEventListener('click', function () { clock.disable(); });
  }

  clock.subscribe(render);
  window.addEventListener('load', render);
  window.setInterval(render, 1500);
})(window, document);
