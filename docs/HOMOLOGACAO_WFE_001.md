# Homologação WFE-001 — Workflow Externo

## Pré-requisitos

- `window.TransitionManager` deve retornar um objeto no Console.
- `window.WorkflowActionModal` deve estar disponível.
- `window.SIGEE_WORKFLOW_EXTERNO` deve retornar a versão `0.9.5.0`.

## Cenários

1. **Desarquivamento com menos de 30 dias**
   - Abrir o botão do processo.
   - Reiteração deve aparecer bloqueada, com os dias restantes.

2. **Desarquivamento com 30 dias ou mais**
   - Reiteração deve estar disponível.
   - Exigir confirmação individual das mensagens 43 e 45.
   - Após executar: etapa `Reiteração`, prazo de 7 dias.

3. **Reiteração com menos de 7 dias**
   - Reiteração Urgente deve estar bloqueada.
   - Retificação deve permanecer disponível.

4. **Reiteração com 7 dias ou mais**
   - Reiteração Urgente disponível.
   - Exigir mensagens 44 e 46.
   - Após executar: etapa `Reiteração Urgente`, prazo de 7 dias.

5. **Reiteração Urgente com 7 dias ou mais**
   - Confirmação dos Dados disponível.
   - Exigir mensagem 12.
   - Após executar: etapa `Confirmação dos Dados`, prazo de 7 dias.

6. **Retificação em Reiteração, Reiteração Urgente ou Confirmação**
   - Exigir mensagens 14 e 37.
   - Exigir observação com os dados alterados.
   - Retornar para `Desarquivamento`.
   - Reiniciar prazo de 30 dias.
   - Incrementar o ciclo local do processo.

7. **Confirmação dos Dados com 7 dias ou mais**
   - Pedido de Atas sem Pasta disponível.
   - Exigir mensagem 36.
   - Encaminhar para `Análise` com contexto `ATAS_SEM_PASTA`.

8. **Pasta localizada / Documento recebido**
   - Deve abrir o procedimento legado já homologado.
   - Não deve usar o Pedido de Atas sem Pasta.
