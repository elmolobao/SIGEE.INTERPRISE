# Release 0.9.5.0 RC1 — I-001

## Entrega

Separação dos dois Pedidos de Atas no núcleo do workflow.

## Arquivos alterados

- `frontend/js/core/workflow.event.manager.js`
- `frontend/js/core/workflow.state.manager.js`
- `frontend/js/core/workflow.timer.manager.js`
- `frontend/js/core/workflow-engine.js`
- `test/workflow-engine.poc.test.js`
- `test/workflow-state-manager.test.js`
- `test/workflow/pe01-temporal.test.js`

## Arquivos criados

- `test/workflow/i001-dois-pedidos-atas.test.js`
- `docs/IMPLEMENTACAO_I-001_DOIS_PEDIDOS_DE_ATAS.md`
- `docs/RELEASE_0.9.5.0_RC1_I001.md`

## Resultado

- Pedido externo: `CFD → ANA`, Mensagem 36, contexto `ATAS_SEM_PASTA`.
- Pedido interno: `ANA → PEN` e reiteração `PEN → PEN`, contexto `PENDENCIA_ATAS`.
- Eventos antigos genéricos removidos do núcleo.

## Testes

Todos os testes do núcleo foram aprovados.
