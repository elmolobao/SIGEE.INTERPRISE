(function(window){
'use strict';
if(window.__SIGEE_LEGALIZACAO_DOE_SERVICE__)return;
window.__SIGEE_LEGALIZACAO_DOE_SERVICE__=true;
const OPERACOES=['listarProcedimentosAguardandoPublicacao','listarBaseIdentificacaoDoe','importarAtosLote','listarAtosImportados','obterAtoImportado','resumoImportacaoAtos','consolidarPassivoHistoricoDoe','localizarInstituicoesParaVinculoAto','vincularAtoImportado','rejeitarAtoImportado','confirmarAtoImportado','integrarAtosIdentificados','listarAtosInstituicao'];
function backend(){const s=window.SIGEE_LEGALIZACAO_SERVICE;if(!s)throw new Error('Serviço-base da Legalização não inicializado.');return s;}
const api={};
for(const nome of OPERACOES)api[nome]=(...args)=>{const fn=backend()[nome];if(typeof fn!=='function')throw new Error(`Operação DOE indisponível: ${nome}`);return fn(...args);};
api.contrato=Object.freeze({dominio:'LEGALIZACAO.DIARIO_OFICIAL',tabelasPrimarias:['legalizacao_atos_importacao','legalizacao_atos_legais'],integracoes:['legalizacao_processos','legalizacao_instituicoes','legalizacao_mantenedoras'],baseline:'25/09/2026'});
window.SIGEE_LEGALIZACAO_DOE=Object.freeze(api);
})(window);
