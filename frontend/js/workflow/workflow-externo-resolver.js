/*
 SIGEE Enterprise
 WFE-001-R3
 Workflow Externo Resolver

 Regra:
 - Etapa permanece DESARQUIVAMENTO
 - Alerta e ação são derivados pelo tempo
 - Eventos não alteram etapa
*/
(function(window){
    'use strict';

    const REGRAS = [
        {dias: 52, alerta: "PEDIDO_ATAS_SEM_PASTA", acao: "SOLICITAR_ATAS"},
        {dias: 45, alerta: "CONFIRMACAO_DOS_DADOS_DA_BUSCA", acao: "CONFIRMAR_DADOS"},
        {dias: 38, alerta: "REITERACAO_URGENTE", acao: "EXECUTAR_REITERACAO_URGENTE"},
        {dias: 31, alerta: "REITERACAO", acao: "EXECUTAR_REITERACAO"}
    ];

    function diasDecorridos(processo){
        const data = new Date(
            processo.data_inicio_desarquivamento ||
            processo.data_desarquivamento ||
            processo.data_etapa_atual ||
            processo.created_at
        );

        if (isNaN(data.getTime())) return 0;

        return Math.floor((new Date() - data) / 86400000);
    }

    function resolver(processo){
        const dias = diasDecorridos(processo);

        let regra = REGRAS.find(r => dias >= r.dias);

        return {
            etapa: "DESARQUIVAMENTO",
            alerta: regra ? regra.alerta : "AGUARDANDO_PRAZO",
            acao: regra ? regra.acao : "SEM_ACAO",
            diasDecorridos: dias
        };
    }

    window.WorkflowExternoResolver = {
        resolver,
        diasDecorridos
    };

})(window);
