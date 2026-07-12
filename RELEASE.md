# SIGEE Enterprise 0.9.3.3

## Sprint
S1-E2.2 — Workflow State Manager

## Objetivo
Centralizar o catálogo oficial de estados do Workflow e fazer o Workflow Engine consumir esse componente, sem alterar telas, banco de dados ou integrações existentes.

## Arquivos criados
- `frontend/js/core/workflow.state.manager.js`
- `tests/workflow-state-manager.test.js`

## Arquivos alterados
- `frontend/js/core/workflow-engine.js`
- `frontend/index.html`
- `tests/workflow-engine.poc.test.js`
- `CHANGELOG.md`

## Implementado
- Catálogo central com 12 estados oficiais.
- API pública: `get`, `getState`, `getStateConfig`, `exists`, `list`, `listStates`, `getAllowedEvents` e `getDeadline`.
- Catálogo protegido contra alteração externa por clonagem dos retornos.
- Integração do Workflow Engine ao State Manager.
- Preservação integral da API legada da versão 0.9.3.1.

## Testes executados
- Teste unitário do State Manager.
- Teste da PoC do Workflow Engine.
- Verificação de sintaxe de todos os arquivos JavaScript do frontend.

## Não alterado
- Telas e estilos.
- Banco de dados e Supabase.
- Regras operacionais já homologadas.
- Fluxo visual de Pasta Localizada.
