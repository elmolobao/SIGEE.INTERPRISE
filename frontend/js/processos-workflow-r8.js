
/*
 SIGEE WFE-001-R8
 Correção de integração do Workflow Externo

 Objetivos:
 - manter Reiteração como etapa real do ciclo;
 - manter todas as subetapas na aba Desarquivamento;
 - ação derivada do alerta atual;
 - evitar botão repetido após execução.
*/

(function(window){
'use strict';

const CICLO_DESARQUIVAMENTO = [
    "DESARQUIVAMENTO",
    "REITERAÇÃO",
    "REITERAÇÃO URGENTE",
    "CONFIRMAÇÃO DOS DADOS",
    "CONFIRMAÇÃO DOS DADOS DA BUSCA",
    "PEDIDO DE ATAS SEM PASTA"
];

function ehFluxoDesarquivamento(processo){
    const etapa = String(
        processo.etapa_atual ||
        processo.etapa ||
        processo.fase_atual ||
        ''
    ).toUpperCase();

    return CICLO_DESARQUIVAMENTO.includes(etapa);
}

function acaoPorAlerta(alerta){
    const mapa = {
        "REITERAÇÃO": "SEND_REITERACAO",
        "REITERAÇÃO URGENTE": "SEND_REITERACAO_URGENTE",
        "CONFIRMAÇÃO DOS DADOS DA BUSCA": "CONFIRMAR_DADOS",
        "CONFIRMAÇÃO DOS DADOS": "CONFIRMAR_DADOS",
        "PEDIDO DE ATAS SEM PASTA": "PEDIDO_ATAS_DESARQUIVAMENTO"
    };

    return mapa[String(alerta || '').toUpperCase()] || null;
}

function eventoExecutado(processo, acao){
    const eventos = processo.workflow_eventos || processo.eventos || [];
    return eventos.some(e =>
        String(e.evento || e.event || e.acao || '').toUpperCase() ===
        String(acao || '').toUpperCase()
    );
}

window.SIGEE_WFE_R8 = {
    CICLO_DESARQUIVAMENTO,
    ehFluxoDesarquivamento,
    acaoPorAlerta,
    eventoExecutado
};

})(window);
