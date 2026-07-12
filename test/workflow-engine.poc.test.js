'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const context = { window: {}, console, Date };
vm.createContext(context);

['mensagens-config.js', 'pop-config.js', 'workflow.state.manager.js', 'workflow-engine.js'].forEach((file) => {
  const source = fs.readFileSync(path.join(root, 'frontend/js/core', file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const workflow = context.window.SIGEE_WORKFLOW;
assert(workflow, 'SIGEE_WORKFLOW não foi carregado.');
assert.strictEqual(workflow.versao, '0.9.3.3');

const expectedFlow = [
  ['DES', 'SEND_REITERACAO', 'RET'],
  ['RET', 'SEND_REITERACAO_URGENTE', 'REU'],
  ['REU', 'CONFIRMAR_DADOS', 'CFD'],
  ['CFD', 'RETIFICAR_DADOS', 'DES']
];

expectedFlow.forEach(([state, event, nextState]) => {
  const result = workflow.preview(state, event);
  assert.strictEqual(result.ok, true, `${state} + ${event} deveria ser permitido.`);
  assert.strictEqual(result.nextState, nextState, `${state} + ${event} deveria resultar em ${nextState}.`);
});

const reset = workflow.preview('CFD', 'RETIFICAR_DADOS');
assert.strictEqual(reset.resetDeadlineDays, 30, 'Retificação deve reiniciar o prazo de 30 dias.');

const globalEvent = workflow.preview('RET', 'DOCUMENTO_RECEBIDO');
assert.strictEqual(globalEvent.ok, true);
assert.strictEqual(globalEvent.nextState, 'RET');
assert.strictEqual(globalEvent.changed, false);
assert.strictEqual(globalEvent.global, true);

const invalidTransition = workflow.preview('DES', 'INICIAR_ANALISE');
assert.strictEqual(invalidTransition.ok, false);
assert.strictEqual(invalidTransition.error, 'TRANSITION_NOT_ALLOWED');

assert.strictEqual(workflow.validarConfirmacoes('POP-DES-002', { 43: true, 45: true }).valido, true);
assert.strictEqual(workflow.eventoDisponivel('POP-DES-003', 'DOCUMENTO_RECEBIDO'), true);

console.log('Workflow Engine PoC 0.9.3.3: todos os testes passaram.');
