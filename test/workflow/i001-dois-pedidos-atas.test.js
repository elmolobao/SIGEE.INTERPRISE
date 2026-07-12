'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const context = { window: {}, console, Date };
vm.createContext(context);

[
  'workflow.state.manager.js',
  'workflow.event.manager.js',
  'workflow.clock.js',
  'workflow.timer.manager.js',
  'workflow-engine.js'
].forEach((file) => {
  const source = fs.readFileSync(path.join(root, 'frontend/js/core', file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const workflow = context.window.SIGEE_WORKFLOW;
const states = context.window.SIGEE_STATE_MANAGER;
const events = context.window.SIGEE_EVENT_MANAGER;
const timer = context.window.SIGEE_TIMER_MANAGER;

assert(events.exists('PEDIDO_ATAS_DESARQUIVAMENTO'));
assert(events.exists('PEDIDO_ATAS_ANALISE'));
assert.strictEqual(events.exists('PEDIR_ATAS'), false);
assert.strictEqual(events.exists('PEDIDO_ATAS'), false);

const externo = workflow.preview('CFD', 'PEDIDO_ATAS_DESARQUIVAMENTO');
assert.strictEqual(externo.ok, true);
assert.strictEqual(externo.nextState, 'ANA');
assert.strictEqual(externo.workflow, 'EXTERNO');
assert.strictEqual(externo.messageCode, '36');
assert.strictEqual(externo.analysisContext, 'ATAS_SEM_PASTA');

assert.strictEqual(workflow.canExecute('ANA', 'PEDIDO_ATAS_DESARQUIVAMENTO'), false);
assert.strictEqual(workflow.canExecute('PEN', 'PEDIDO_ATAS_DESARQUIVAMENTO'), false);

const internoAnalise = workflow.preview('ANA', 'PEDIDO_ATAS_ANALISE');
assert.strictEqual(internoAnalise.ok, true);
assert.strictEqual(internoAnalise.nextState, 'PEN');
assert.strictEqual(internoAnalise.workflow, 'INTERNO');
assert.strictEqual(internoAnalise.analysisContext, 'PENDENCIA_ATAS');

const internoPendencia = workflow.preview('PEN', 'PEDIDO_ATAS_ANALISE');
assert.strictEqual(internoPendencia.ok, true);
assert.strictEqual(internoPendencia.nextState, 'PEN');
assert.strictEqual(internoPendencia.changed, false);

assert.strictEqual(workflow.canExecute('CFD', 'PEDIDO_ATAS_ANALISE'), false);
assert(states.getAllowedEvents('CFD').includes('PEDIDO_ATAS_DESARQUIVAMENTO'));
assert(states.getAllowedEvents('ANA').includes('PEDIDO_ATAS_ANALISE'));
assert(states.getAllowedEvents('PEN').includes('PEDIDO_ATAS_ANALISE'));

const due = timer.calculate('CFD', '2026-01-01T12:00:00-03:00', '2026-01-08T12:00:00-03:00');
assert.strictEqual(due.due, true);
assert.strictEqual(due.availableEvent, 'PEDIDO_ATAS_DESARQUIVAMENTO');

console.log('I-001 — dois pedidos de atas: todos os testes passaram.');
