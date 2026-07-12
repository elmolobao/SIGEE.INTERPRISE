
/*
 SIGEE Workflow Externo - Correção processos.js

 Objetivo:
 - manter REITERAÇÃO como etapa real;
 - considerar todo o ciclo dentro da aba Desarquivamento;
 - resolver ação pela regra do alerta;
 - impedir duplicidade de execução.
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

function normalizar(valor){
 return String(valor || "")
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g,"")
   .toUpperCase()
   .trim();
}

function processoPertenceDesarquivamento(processo){
 return CICLO_DESARQUIVAMENTO.includes(
   normalizar(
    processo.etapa_atual ||
    processo.etapa ||
    processo.fase_atual
   )
 );
}

function resolverAcaoPorAlerta(alerta){
 const mapa = {
  "REITERACAO": {
    evento:"SEND_REITERACAO",
    mensagem:"43/45",
    botao:"Executar Reiteração"
  },
  "REITERACAO URGENTE":{
    evento:"SEND_REITERACAO_URGENTE",
    mensagem:"44/46",
    botao:"Executar Reiteração Urgente"
  },
  "CONFIRMACAO DOS DADOS DA BUSCA":{
    evento:"CONFIRMAR_DADOS",
    mensagem:"12",
    botao:"Confirmar Dados"
  },
  "CONFIRMACAO DOS DADOS":{
    evento:"CONFIRMAR_DADOS",
    mensagem:"12",
    botao:"Confirmar Dados"
  },
  "PEDIDO DE ATAS SEM PASTA":{
    evento:"PEDIDO_ATAS_DESARQUIVAMENTO",
    mensagem:"36",
    botao:"Solicitar Atas"
  }
 };

 return mapa[normalizar(alerta)] || null;
}

function acaoExecutada(processo, evento){
 const lista = processo.workflow_eventos || processo.historico || [];
 return lista.some(item =>
   normalizar(item.evento || item.event || item.acao) === normalizar(evento)
 );
}

window.SIGEE_PROCESSOS_WORKFLOW = {
 processoPertenceDesarquivamento,
 resolverAcaoPorAlerta,
 acaoExecutada
};

})(window);
