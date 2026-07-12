/* SIGEE WFE-001-R2
 * Resolver do Workflow Externo
 * Regra: eventos temporais não alteram a etapa do processo.
 */
(function(window){
    'use strict';

    function calcularAcao(processo){
        const inicio = new Date(
            processo.data_inicio_desarquivamento ||
            processo.data_etapa_atual ||
            processo.created_at
        );

        if (isNaN(inicio.getTime())) {
            return {
                etapa: 'DESARQUIVAMENTO',
                acao: 'AGUARDANDO_DATA'
            };
        }

        const hoje = new Date();
        const dias = Math.floor((hoje - inicio) / 86400000);

        let acao = 'AGUARDANDO_PRAZO';

        if (dias >= 52) acao = 'PEDIDO_ATAS';
        else if (dias >= 45) acao = 'CONFIRMACAO_DADOS';
        else if (dias >= 38) acao = 'REITERACAO_URGENTE';
        else if (dias >= 31) acao = 'REITERACAO';

        return {
            etapa: 'DESARQUIVAMENTO',
            acao,
            diasDecorridos: dias
        };
    }

    window.WorkflowExternoResolver = {
        calcularAcao
    };

})(window);
