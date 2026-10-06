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

// RC58: ausência de vigência não pode bloquear oferta reconhecida.
const efeito=body('aplicarEfeitoRegulatorioAtoConfirmado','aplicarAlteracaoCadastralPublicada');
if(efeito.includes("if(!ini&&!fim)return{situacao,ofertasAtualizadas:0}")) fail('Ausência de vigência voltou a bloquear ofertas');
if(!efeito.includes("ano_inicio_vigencia:ini||null") || !efeito.includes("ano_fim_vigencia:fim||null")) fail('Oferta sem vigência não é materializada em aberto');
if(!efeito.includes("jaExiste")) fail('Proteção contra duplicidade de oferta ausente');
const reconc=body('reconciliarEfeitosAtosConfirmados','salvarOfertaInstituicao');
if(!reconc.includes("from('legalizacao_atos_legais')") || !reconc.includes(".eq('instituicao_id',inst.id)")) fail('Reconciliação deixou de usar o ato legal como âncora institucional');
if(!reconc.includes("map(a=>Number(a.importacao_id)") || !reconc.includes("from('legalizacao_atos_importacao')") || !reconc.includes(".in('id',importacaoIds)")) fail('Reconciliação deixou de recuperar a ocorrência DOE por importacao_id');
if(reconc.includes('importarAtosLote(')||reconc.includes('vincularAtoImportado(')) fail('Reconciliação não pode reimportar/revincular');
if(!reconc.includes("vínculo institucional divergente")) fail('Reconciliação perdeu bloqueio de vínculo DOE explicitamente divergente');
if(!reconc.includes("upper(imp.ato||legal.tipo_documento)==='PARECER'")) fail('Parecer voltou a produzir efeito autônomo');
const efeito61=body('aplicarEfeitoRegulatorioAtoConfirmado','aplicarAlteracaoCadastralPublicada');
if(!efeito61.includes('evidenciaRegulatoriaAto(r,legal)')) fail('Aplicação deixou de combinar evidência da importação e do ato legal');
if(!efeito61.includes('extrairAlvosOfertaDaEvidencia(r,legal)')) fail('Ofertas deixaram de usar a evidência documental consolidada');
if(!efeito61.includes("diagnostico_oferta:'SEM_ETAPA_NA_EVIDENCIA'")) fail('Ausência real de etapa/modalidade deixou de ser diagnosticada');
const reconc61=body('reconciliarEfeitosAtosConfirmados','salvarOfertaInstituicao');
if(!reconc61.includes(',legal);')) fail('Reconciliação não repassa a cópia documental do ato legal à regra de ofertas');
const salvar62=body('salvarOfertaInstituicao','confirmarAtoImportado');
if(!salvar62.includes("listarCatalogoCursosTecnicos()")||!salvar62.includes("eixo=sel.eixo_tecnologico")) fail('Curso técnico manual deixou de ser selecionado do catálogo com eixo automático');
const aplicar62=body('aplicarEfeitoRegulatorioAtoConfirmado','aplicarAlteracaoCadastralPublicada');
if(!aplicar62.includes("identificarCursosTecnicosNaEvidencia(r,legal)")) fail('Importação DOE deixou de identificar automaticamente cursos técnicos');
if(!aplicar62.includes("CURSO_TECNICO_NAO_IDENTIFICADO_NO_CATALOGO")) fail('Importação técnica sem correspondência deixou de ser diagnosticada');

console.log('Legalização DOE regression baseline RC62: OK');
