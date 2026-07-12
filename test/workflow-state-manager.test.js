'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const context = { window: {}, console };
vm.createContext(context);

const source = fs.readFileSync(path.join(root, 'frontend/js/core/workflow.state.manager.js'), 'utf8');
vm.runInContext(source, context, { filename: 'workflow.state.manager.js' });

const manager = context.window.SIGEE_STATE_MANAGER;
assert(manager, 'SIGEE_STATE_MANAGER não foi carregado.');
assert.strictEqual(manager.version, '0.9.3.3');
assert.strictEqual(manager.exists('DES'), true);
assert.strictEqual(manager.exists('des'), true);
assert.strictEqual(manager.exists('ABC'), false);
assert.strictEqual(manager.get('DES').name, 'Desarquivamento');
assert.strictEqual(manager.getDeadline('DES'), 30);
assert.strictEqual(manager.getDeadline('RET'), 7);
assert.strictEqual(manager.get('ABC'), null);
assert.strictEqual(manager.list().length, 12);
assert.deepStrictEqual(
  Array.from(manager.getAllowedEvents('DES')),
  ['SEND_REITERACAO', 'LOCALIZAR_PASTA', 'DOCUMENTO_RECEBIDO']
);

const state = manager.get('DES');
state.name = 'ALTERADO';
assert.strictEqual(manager.get('DES').name, 'Desarquivamento', 'O catálogo interno deve permanecer imutável.');

console.log('State Manager 0.9.3.3: todos os testes passaram.');
