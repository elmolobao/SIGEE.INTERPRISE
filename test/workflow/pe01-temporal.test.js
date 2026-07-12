const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const storage = new Map();
const context = {
  console,
  Date,
  setTimeout,
  clearTimeout,
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  CustomEvent: function(name, init){ this.type=name; this.detail=init && init.detail; },
  dispatchEvent: () => {},
  addEventListener: () => {},
  usuarioLogado: { nome: 'Teste Master', perfil: 'Master' }
};
context.window = context;
vm.createContext(context);

function load(file) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

load('frontend/js/core/workflow.state.manager.js');
load('frontend/js/core/workflow.clock.js');
load('frontend/js/core/workflow.timer.manager.js');

const clock = context.SIGEE_WORKFLOW_CLOCK;
const timer = context.SIGEE_TIMER_MANAGER;
const base = '2026-01-01T12:00:00-03:00';

clock.enable(base);
let result = timer.calculate('DES', base);
assert.strictEqual(result.due, false);
assert.strictEqual(result.remainingDays, 30);
assert.strictEqual(result.availableEvent, null);

clock.advanceDays(30);
result = timer.calculate('DES', base);
assert.strictEqual(result.due, true);
assert.strictEqual(result.availableEvent, 'SEND_REITERACAO');

const retStart = clock.now().toISOString();
clock.advanceDays(7);
result = timer.calculate('RET', retStart);
assert.strictEqual(result.availableEvent, 'SEND_REITERACAO_URGENTE');

const reuStart = clock.now().toISOString();
clock.advanceDays(7);
result = timer.calculate('REU', reuStart);
assert.strictEqual(result.availableEvent, 'CONFIRMAR_DADOS');

const cfdStart = clock.now().toISOString();
clock.advanceDays(7);
result = timer.calculate('CFD', cfdStart);
assert.strictEqual(result.availableEvent, 'PEDIR_ATAS');

clock.disable();
assert.strictEqual(clock.status().enabled, false);
console.log('PE-01 temporal: todos os testes passaram.');
