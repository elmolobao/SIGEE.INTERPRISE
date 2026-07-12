/*
 SIGEE Enterprise
 WFE-001-R5

 Correção:
 - Reiteração é subetapa do macrofluxo Desarquivamento.
 - Nunca alterar etapa principal para REITERAÇÃO.
*/

(function(window){
'use strict';

const ETAPA_PRINCIPAL = "DESARQUIVAMENTO";

function prepararAtualizacaoEvento(processo, evento){

    return {
        ...processo,

        // mantém o processo dentro do macrofluxo
        etapa_atual: ETAPA_PRINCIPAL,
        etapa: ETAPA_PRINCIPAL,

        // controla a evolução interna do desarquivamento
        subetapa_atual: evento.subetapa,
        alerta_workflow: evento.alerta,
        acao_workflow: evento.acao,

        ultimo_evento_workflow: evento.codigo,
        data_ultimo_evento_workflow: new Date().toISOString()
    };
}

window.WorkflowExternoR5 = {
    prepararAtualizacaoEvento
};

})(window);
