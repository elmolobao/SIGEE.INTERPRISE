const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'core', 'popup-prazos-login.js'), 'utf8');
assert(source.includes("const VERSION = 'RC10.8.12'"));
assert(source.includes("document.addEventListener('sigee:login-concluido', iniciarNovoLogin)"));
assert(source.includes("window.addEventListener('sigee:session-ready', garantirLoginAtivo)"));
assert(source.includes('if (popupExibidoNesteLogin || loginEmProcessamento) return;'));
assert(source.includes("const digitos = bruto.match(/\\d+/g)"));
console.log('RC10.8.12: testes estáticos aprovados.');
