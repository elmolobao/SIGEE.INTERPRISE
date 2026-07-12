/*
 SIGEE Enterprise
 WFE-001-R4

 Regra:
 Macroetapa: DESARQUIVAMENTO
 Subetapas:
 - DESARQUIVAMENTO
 - REITERAÇÃO
 - REITERAÇÃO URGENTE
 - CONFIRMAÇÃO DOS DADOS DA BUSCA
 - PEDIDO DE ATAS SEM PASTA

 Ações executadas uma única vez por subetapa.
*/
(function(window){
'use strict';

const CICLO_DESARQUIVAMENTO = [
    {dias:52, etapa:"PEDIDO DE ATAS SEM PASTA", acao:"SOLICITAR_ATAS"},
    {dias:45, etapa:"CONFIRMAÇÃO DOS DADOS DA BUSCA", acao:"CONFIRMAR_DADOS"},
    {dias:38, etapa:"REITERAÇÃO URGENTE", acao:"EXECUTAR_REITERACAO_URGENTE"},
    {dias:31, etapa:"REITERAÇÃO", acao:"EXECUTAR_REITERACAO"},
    {dias:0, etapa:"DESARQUIVAMENTO", acao:"AGUARDAR"}
];

function diasDecorridos(processo){
    const inicio = new Date(
        processo.data_inicio_desarquivamento ||
        processo.data_etapa_atual ||
        processo.created_at
    );

    if (isNaN(inicio.getTime())) return 0;

    return Math.floor((new Date()-inicio)/86400000);
}

function eventoJaExecutado(processo, acao){
    const eventos = processo.workflow_eventos || processo.eventos || [];
    return eventos.some(e => e.acao === acao && e.executado === true);
}

function resolver(processo){
    const dias = diasDecorridos(processo);
    const regra = CICLO_DESARQUIVAMENTO.find(r => dias >= r.dias);

    return {
        macroetapa:"DESARQUIVAMENTO",
        subetapa: regra.etapa,
        alerta: regra.etapa,
        acao: eventoJaExecutado(processo, regra.acao) ? "AGUARDANDO_PROXIMA_ACAO" : regra.acao,
        diasDecorridos:dias,
        executada:eventoJaExecutado(processo, regra.acao)
    };
}

window.WorkflowExternoResolver = {resolver, diasDecorridos};

})(window);
