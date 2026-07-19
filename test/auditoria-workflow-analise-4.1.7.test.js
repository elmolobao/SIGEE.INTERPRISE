const fs = require('fs');
const assert = require('assert');
const src = fs.readFileSync(__dirname + '/../frontend/js/processos.js', 'utf8');

assert(src.includes('window.abrirRegistrarPendenciaSIGEE=abrirFormularioPendencia'), 'Registro de Pendência deve ter entrada pública direta');
assert(src.includes('window.abrirIndeferimentoSIGEE=abrirFormularioIndeferimento'), 'Indeferimento deve ter entrada pública direta');
assert(!src.includes("setTimeout(()=>document.querySelector('[data-pendencia33]')?.click()"), 'Não pode simular clique para abrir Pendência');
assert(!src.includes("setTimeout(()=>document.querySelector('[data-indeferir33]')?.click()"), 'Não pode simular clique para abrir Indeferimento');
assert(!src.includes("const atuais=await carregarPendencias(id); const pendentes=atuais.filter"), 'Registro de Pendência não deve aguardar consulta desnecessária');
assert(src.includes("btn.disabled=!(sel.value&&chk.checked)"), 'Digitação deve exigir responsável e confirmação da mensagem');
assert(src.includes("p.etapa='Indeferido';") && src.includes("p.etapa_atual='Indeferido';"), 'Indeferimento deve sincronizar os dois campos de etapa');
console.log('Auditoria workflow Análise 4.1.7: OK');
