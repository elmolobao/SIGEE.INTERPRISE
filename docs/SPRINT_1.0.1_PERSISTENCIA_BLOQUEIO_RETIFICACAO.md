# Sprint 1.0.1 — Persistência, bloqueio e Retificação

## Alterações implementadas

- Bloqueio consultado no `historico_processos` por `processo_id + ciclo + ação`.
- Botão permanece desabilitado após atualização da página ou novo login.
- Validação duplicada também ocorre imediatamente antes da transição.
- Retificação disponível apenas em Reiteração, Reiteração Urgente e Confirmação dos Dados.
- Retificação exige as mensagens 14 e 37, encerra o ciclo atual, cria novo ciclo, retorna a Desarquivamento e inicia novo prazo de 30 dias.
- O registro da Retificação pertence ao ciclo encerrado; as ações são liberadas no ciclo novo.
- Persistência dos campos de etapa, prazo, ciclo, último evento e última mensagem no processo.

## Banco de dados

Execute no Supabase SQL Editor:

`supabase/migrations/20260712_sprint_1_0_1_workflow_externo.sql`

A restrição única do histórico é a proteção definitiva contra duplo clique, múltiplas abas e concorrência entre sessões.

## Arquivos alterados

- `frontend/js/core/transition-manager.js`
- `frontend/js/workflow/workflow-externo.js`
- `frontend/js/processos.js`
- `supabase/migrations/20260712_sprint_1_0_1_workflow_externo.sql`
