/*
 SIGEE Enterprise
 WFE-001-R6

 Mantém o comportamento validado:
 - etapas do ciclo continuam existindo;
 - Reiteração é uma etapa do Desarquivamento;
 - controle de execução única por ação.
*/

(function(window){
'use strict';

const ETAPAS_DESARQUIVAMENTO = [
    "DESARQUIVAMENTO",
    "REITERAÇÃO",
    "REITERAÇÃO URGENTE",
    "CONFIRMAÇÃO DOS DADOS DA BUSCA",
    "PEDIDO DE ATAS SEM PASTA"
];

function pertenceAoDesarquivamento(etapa){
    return ETAPAS_DESARQUIVAMENTO.includes(
        String(etapa || "").toUpperCase()
    );
}

function acaoJaExecutada(processo, acao){
    const eventos = processo.workflow_eventos || processo.eventos || [];

    return eventos.some(evento =>
        String(evento.acao || "").toUpperCase() === String(acao).toUpperCase()
        && evento.executado === true
    );
}

function podeExecutar(processo, acao){
    return !acaoJaExecutada(processo, acao);
}

window.WorkflowExternoR6 = {
    ETAPAS_DESARQUIVAMENTO,
    pertenceAoDesarquivamento,
    acaoJaExecutada,
    podeExecutar
};

})(window);
