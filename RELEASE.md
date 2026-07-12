# SIGEE Enterprise 0.9.4.1 — Correção PE-01

## Objetivo
Conectar o Modo Homologação aos processos já cadastrados.

## Correções
- Os cálculos de dias dos processos passam a usar `WorkflowClock.now()`.
- A lista moderna e o fluxo legado foram corrigidos.
- A alteração da data simulada força a atualização das listas e do Dashboard.
- As datas originais armazenadas no Supabase permanecem inalteradas.

## Homologação
1. Entre como Master.
2. Abra Processos e anote o tempo de um processo em Desarquivamento.
3. Clique em `Testar prazos` e avance `+30 dias`.
4. Confirme a atualização imediata do tempo e o gatilho de Reiteração.
5. Avance `+7 dias` e confirme Reiteração com Urgência.
6. Avance mais `+7 dias` e confirme Confirmação dos Dados.
7. Retorne à data oficial.
