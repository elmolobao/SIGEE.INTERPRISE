const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('frontend/js/legalizacao/legalizacao.js','utf8');
const a=src.indexOf('function segmentarPublicacoesDoe('),b=src.indexOf('\nfunction ',a+10);
const context={
 semAcento:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(),
 upper:s=>String(s||'').toUpperCase(),
 normalizarTextoDoe:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(),
 normalizarBuscaDoe:s=>String(s).toUpperCase()
};
vm.createContext(context);vm.runInContext(src.slice(a,b),context);
const pages=[
 {pagina:26,texto:'<#E.G.B#OLD#26#X>\nPORTARIA Nº 003 /2026 - NTE 06 A DIRETORA DO NÚCLEO TERRITORIAL DE EDUCAÇÃO DE VALENÇA - NTE 06, RESOLVE: Descredenciar, voluntariamente, a partir do ano 2025, a Instituição Privada de Ensino, Colégio Shalom, código MEC nº 29444551, autorizada através da portaria nº 06/2021,\nCÓPIA - Consulte informação oficial em www.dool.egba.ba.gov.br'},
 {pagina:27,texto:'SALVADOR, SÁBADO, 10 DE OUTUBRO DE 2026\npublicada no DOE de 04/03/2021, que ministrava a Educação Infantil e o Ensino Fundamental, no município de Gandu, tendo o acervo recolhido ao NTE 06, conforme processo SEI nº 011.76242026.0087040.79. Valença, 09 de outubro de 2026. Diretora NTE-06\n<#E.G.B#1243251#27#1346795/>\n<#E.G.B#NEXT#27#Y>\nRESOLUÇÃO CEE Nº 343/2026\nO CONSELHO ESTADUAL DE EDUCAÇÃO RESOLVE:\nArt. 1º Credenciar Complexo Educacional Damasceno. '+ 'A'.repeat(450)+'\n<#E.G.B#NEXT#27#Y/>'}
];
const blocks=context.segmentarPublicacoesDoe(pages);
const shalom=blocks.find(x=>x.especie==='PORTARIA'&&x.numero==='003/2026');
assert(shalom,'Portaria 003/2026 ausente');
assert(shalom.texto.includes('29444551'),'INEP perdido');
assert(shalom.texto.includes('011.76242026.0087040.79'),'continuação na página seguinte perdida');
assert(!shalom.texto.includes('Complexo Educacional Damasceno'),'contaminação pelo ato seguinte');
assert(shalom.texto.length<1600,'portaria absorveu conteúdo estranho');
console.log('RC72: Portaria NTE 06 entre páginas isolada e íntegra OK');
