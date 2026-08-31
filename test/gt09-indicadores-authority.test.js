const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('frontend/js/territorial/territorial-indicadores-authority.js','utf8'),ctx);
const A=ctx.window.SIGEE_TERRITORIAL_INDICADORES_AUTHORITY;
assert.strictEqual(A.scoreSatisfacao(5),100,'5/5 deve normalizar para 100%');
assert.strictEqual(A.scoreSatisfacao(4),80,'4/5 deve normalizar para 80%');
assert.strictEqual(A.consolidado(80,100),84,'80% técnica + 100% satisfação deve resultar 84%');
const uma=A.notaTecnica([{item_monitoria:'COMUNICACAO_EMAIL',avaliacao:'POSITIVA'}]);
assert.strictEqual(uma.nota,100);
assert.strictEqual(uma.criteriosAvaliados,1);
assert.strictEqual(uma.classificavel,false,'1/4 critério não pode ser classificação consolidada');
assert.strictEqual(A.ocorrenciaAberta({resultado:'REGULARIZADO'}),false);
assert.strictEqual(A.ocorrenciaAberta({resultado:'CONCLUIDO'}),false);
assert.strictEqual(A.ocorrenciaAberta({resultado:'EM_AJUSTE'}),true);
const marco={fim:'2026-05-10T18:00:00Z'};
assert.strictEqual(A.faseHistorica('2026-05-09T12:00:00Z',marco),'PRE_FORMACAO');
assert.strictEqual(A.faseHistorica('2026-05-11T12:00:00Z',marco),'POS_FORMACAO');
const evo=A.evolucaoPrePos([
 {data_registro:'2026-05-01',item_monitoria:'COMUNICACAO_EMAIL',avaliacao:'NEGATIVA'},
 {data_registro:'2026-05-01',item_monitoria:'REGISTRO_SISTEMA',avaliacao:'NEGATIVA'},
 {data_registro:'2026-05-01',item_monitoria:'CUMPRIMENTO_PRAZOS',avaliacao:'NEGATIVA'},
 {data_registro:'2026-05-01',item_monitoria:'EXECUCAO_PROCEDIMENTO',avaliacao:'NEGATIVA'},
 {data_registro:'2026-05-20',item_monitoria:'COMUNICACAO_EMAIL',avaliacao:'POSITIVA'},
 {data_registro:'2026-05-20',item_monitoria:'REGISTRO_SISTEMA',avaliacao:'POSITIVA'},
 {data_registro:'2026-05-20',item_monitoria:'CUMPRIMENTO_PRAZOS',avaliacao:'POSITIVA'},
 {data_registro:'2026-05-20',item_monitoria:'EXECUCAO_PROCEDIMENTO',avaliacao:'POSITIVA'}
],marco);
assert.strictEqual(evo.pre.nota,0);
assert.strictEqual(evo.pos.nota,100);
assert.strictEqual(evo.evolucao,100);
console.log('GT-09 indicadores authority: OK');
