const fs = require('fs');
const path = require('path');
const assert = require('assert');

const arquivo = path.join(__dirname, '..', 'frontend', 'js', 'core', 'popup-prazos-login.js');
const codigo = fs.readFileSync(arquivo, 'utf8');

assert(codigo.includes("const VERSION = 'RC10.8.11'"));
assert(codigo.includes("ANALISE: 7"));
assert(codigo.includes("DIGITACAO: 15"));
assert(codigo.includes("CONFERENCIA: 10"));
assert(codigo.includes("ASSINATURA: 7"));
assert(codigo.includes('Pendência do aluno e da instituição são deliberadamente excluídas'));
assert(codigo.includes('ALERTA 01 — Ciclo de Desarquivamento'));
assert(codigo.includes('ALERTA 02 — Fluxo Operacional'));
assert(codigo.includes('Declaro ciência das informações apresentadas'));
assert(!codigo.includes('aluno_nome ||'));
assert(!codigo.includes('escola_nome ||'));

console.log('RC10.8.11: estrutura do alerta único validada.');
