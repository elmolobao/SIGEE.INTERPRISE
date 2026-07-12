# I-001 — Separação dos dois Pedidos de Atas

## Baseline

SIGEE.INTERPRISE-main(13)

## Implementação

O evento genérico de pedido de atas foi substituído por dois eventos de negócio independentes:

- `PEDIDO_ATAS_DESARQUIVAMENTO`: utilizado no workflow externo, após 7 dias em Confirmação dos Dados. Executa a transição `CFD → ANA`, utiliza a Mensagem 36 e define o contexto `ATAS_SEM_PASTA`.
- `PEDIDO_ATAS_ANALISE`: utilizado no workflow interno. Executa `ANA → PEN` e pode ser reiterado em `PEN → PEN`, com contexto `PENDENCIA_ATAS`.

## Limite desta entrega

Esta implementação altera o núcleo declarativo e os testes. A ligação com os botões e modais da interface será feita em incremento posterior.
