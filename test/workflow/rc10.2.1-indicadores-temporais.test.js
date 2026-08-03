const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { console, Date };
context.window = context;
context.SIGEE_WORKFLOW_CLOCK = { now: () => new Date('2026-08-03T18:34:00-03:00') };
vm.createContext(context);
vm.runInContext(fs.readFileSync('frontend/js/core/workflow-temporal-resolver.js', 'utf8'), context);

const temporal = context.SIGEE_WORKFLOW_TEMPORAL;

let p = {
  data_abertura: '2026-08-03T09:00:00-03:00',
  created_at: '2026-08-03T12:00:00Z',
  data_etapa_atual: '2026-08-03T18:34:00-03:00',
  etapa_atual: 'Desarquivamento',
  workflow_ciclo: 1
};
let m = temporal.processMetrics(p);
assert.strictEqual(m.totalDays, 0, 'abertura no mesmo dia deve exibir 0 dias');
assert.strictEqual(m.stageDays, 0, 'entrada na etapa no mesmo dia deve exibir 0 dias');
assert.strictEqual(temporal.resolve(p).days, 0, 'ciclo externo deve permanecer no dia zero');

p = {
  data_abertura: '2026-08-01T09:00:00-03:00',
  created_at: '2026-08-01T12:00:00Z',
  deferido_em: '2026-08-03T10:00:00-03:00',
  etapa_atual: 'Aguardando Retirada',
  data_etapa_atual: '2026-08-03T10:00:00-03:00'
};
m = temporal.processMetrics(p, new Date('2026-08-10T12:00:00-03:00'));
assert.strictEqual(m.totalDays, 2, 'contador global deve congelar no deferimento');
assert.strictEqual(m.postDeferredDays, 7, 'contador pós-deferimento deve continuar até retirada');
assert.strictEqual(m.totalFrozen, true);
assert.strictEqual(m.postDeferredFrozen, false);

p.retirado_em = '2026-08-08T11:00:00-03:00';
p.etapa_atual = 'Retirado';
m = temporal.processMetrics(p, new Date('2026-08-10T12:00:00-03:00'));
assert.strictEqual(m.totalDays, 2, 'contador global continua congelado no deferimento');
assert.strictEqual(m.postDeferredDays, 5, 'contador pós-deferimento congela na retirada');
assert.strictEqual(m.postDeferredFrozen, true);

// Marcos homologados do ciclo externo permanecem inalterados.
const ciclo = { created_at: '2026-01-01T12:00:00-03:00', workflow_ciclo: 1 };
assert.strictEqual(temporal.resolve(ciclo, new Date('2026-01-31T12:00:00-03:00')).days, 30);
assert.strictEqual(temporal.resolve(ciclo, new Date('2026-02-01T12:00:00-03:00')).code, 'RET');
assert.strictEqual(temporal.resolve(ciclo, new Date('2026-02-08T12:00:00-03:00')).code, 'REU');
assert.strictEqual(temporal.resolve(ciclo, new Date('2026-02-15T12:00:00-03:00')).code, 'CFD');
assert.strictEqual(temporal.resolve(ciclo, new Date('2026-02-22T12:00:00-03:00')).code, 'PAS');

console.log('RC10.2.1 indicadores temporais: todos os testes passaram.');
