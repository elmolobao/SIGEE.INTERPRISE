/*
 SIGEE - Ajuste Workflow Desarquivamento V1

 Arquivo de integração para correção do fluxo externo.

 Regras:
 1) Aba Desarquivamento considera o ciclo:
    DESARQUIVAMENTO
    REITERAÇÃO
    REITERAÇÃO URGENTE
    CONFIRMAÇÃO DOS DADOS DA BUSCA
    PEDIDO DE ATAS SEM PASTA

 2) Alertas continuam baseados no ciclo temporal.

 3) Ação deve seguir:
    ALERTA -> AÇÃO -> MENSAGEM

 4) Ação executada uma única vez.
*/

const SIGEE_CICLO_DESARQUIVAMENTO = [
 "DESARQUIVAMENTO",
 "REITERAÇÃO",
 "REITERAÇÃO URGENTE",
 "CONFIRMAÇÃO DOS DADOS DA BUSCA",
 "PEDIDO DE ATAS SEM PASTA"
];

function pertenceCicloDesarquivamento(etapa){
 return SIGEE_CICLO_DESARQUIVAMENTO.includes(
   String(etapa || "").toUpperCase()
 );
}
