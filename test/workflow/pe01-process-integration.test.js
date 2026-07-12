const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const storage = new Map();
const context = {
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  localStorage: {
    getItem: (k) => storage.has(k) ? storage.get(k) : null,
    setItem: (k,v) => storage.set(k,String(v)),
    removeItem: (k) => storage.delete(k)
  },
  usuarioLogado: { perfil: 'Master' },
  CustomEvent: function(name, init){ this.type=name; this.detail=init && init.detail; },
  dispatchEvent: () => {},
  addEventListener: () => {}
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('frontend/js/core/workflow.clock.js','utf8'), context);
const clock = context.SIGEE_WORKFLOW_CLOCK;
clock.set(new Date('2026-08-11T12:00:00'));
const start = new Date('2026-07-12T00:00:00');
const now = clock.now();
start.setHours(0,0,0,0); now.setHours(0,0,0,0);
assert.strictEqual(Math.floor((now-start)/86400000), 30);
clock.advanceDays(7);
assert.strictEqual(clock.now().toISOString().slice(0,10), '2026-08-18');
console.log('PE-01 process integration: OK');
