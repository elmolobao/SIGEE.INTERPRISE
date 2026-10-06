const fs = require('fs');
const src = fs.readFileSync('frontend/js/legalizacao/legalizacao.service.js','utf8');
function fail(msg){ throw new Error(msg); }
function body(name,nextName){
  const a=src.indexOf(`async function ${name}`); if(a<0) fail(`Função ${name} não encontrada`);
  const b=nextName?src.indexOf(`async function ${nextName}`,a+1):-1;
  return src.slice(a,b>0?b:src.length);
}

// RC57 baseline: consultas não podem executar reparos históricos destrutivos.
const consultar=body('consultarInstituicoes','listarInstituicoes');
for(const fn of ['repararPassivoMarista29447518','repararOfertasConfirmadas299','sanearDuplicataContaminada299Academico']){
  if(consultar.includes(`await ${fn}(`)) fail(`consultarInstituicoes ainda dispara ${fn}`);
}
const listar=body('listarAtosImportados','listarBaseIdentificacaoDoe');
if(listar.includes('await sanearDuplicataContaminada299Academico(')) fail('listarAtosImportados ainda saneia 299 ao abrir a fila');

// Reimportação só pode limpar pendências do próprio lote físico.
const reproc=body('prepararReprocessamentoDoeNaoFinalizado','importarAtosLote');
if(!reproc.includes(".eq('lote_id',lote).eq('data_publicacao',dataDoe)")) fail('Reprocessamento DOE não está isolado por lote_id');
if(!reproc.includes("!['CONFIRMADO','REJEITADO'].includes")) fail('Reprocessamento deixou de preservar decisões manuais');

// Chave física de confirmado não pode ser movida durante reimportação.
const importar=body('importarAtosLote','rejeitarOcorrenciasImportadas');
const updStart=importar.indexOf('const upd={');
const updEnd=importar.indexOf('};',updStart);
const confirmedUpd=importar.slice(updStart,updEnd+2);
if(/\blote_id\s*:|\blinha_origem\s*:/.test(confirmedUpd)) fail('Reparo de CONFIRMADO voltou a alterar chave física');
if(!importar.includes('delete upd.lote_id;') || !importar.includes('delete upd.linha_origem;')) fail('Reconciliação por linha não protege chave física');

// Fallback de sincronização do prontuário precisa restringir espécie e data quando disponíveis.
if(!importar.includes("if(row.ato)qLeg=qLeg.eq('ato',row.ato)")) fail('Fallback legado não restringe espécie do ato');
if(!importar.includes("if(row.data_publicacao)qLeg=qLeg.eq('data_publicacao',row.data_publicacao)")) fail('Fallback legado não restringe data da publicação');

// Referência normativa não pode ser confirmada como ato da instituição.
const confirmar=body('confirmarAtoImportado','integrarAtosIdentificados');
if(!confirmar.includes('ehReferenciaNormativaImportada(r)')) fail('Guarda de referência normativa ausente');
if(!confirmar.includes("onConflict:'importacao_id'")) fail('Ato legal não está ancorado no importacao_id');

console.log('Legalização DOE regression baseline RC57: OK');
