# Sprint 1.0.1c — Bloqueio persistente via RPC

## Correção

A consulta direta ao `historico_processos` podia retornar uma lista vazia em ambientes com RLS, ainda que a ação tivesse sido registrada. Por isso o Workflow permitia nova execução.

Esta revisão cria duas funções no Supabase:

- `sigee_workflow_acoes_executadas`: consulta os bloqueios válidos da instância e do ciclo;
- `sigee_registrar_acao_workflow`: registra a ação de forma atômica e rejeita repetição.

O frontend não apresenta mais sucesso silencioso quando o Supabase não confirmar o registro do bloqueio.

## Implantação

1. Executar `supabase/migrations/20260712_sprint_1_0_1c_rpc_bloqueio_workflow.sql`.
2. Publicar todos os arquivos.
3. Atualizar o navegador com `Ctrl + F5`.
