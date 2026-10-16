const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('frontend/js/legalizacao/legalizacao.js','utf8');
assert(s.includes('const cnpjDocumento=somenteDigitosDoe(extrairCnpjDoe(bloco.texto))'));
assert(s.includes('const elegiveis=candidatos.filter(x=>x.forte&&('));
assert(s.includes('cnpjDocumento.length!==14'));
console.log('RC67: guarda de CNPJ na vinculação automática presente');
