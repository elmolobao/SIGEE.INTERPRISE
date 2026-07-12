# SIGEE Enterprise 0.9.3.3 — Sprint 1.0 / S1-E2.2

- Criado `frontend/js/core/workflow.state.manager.js`.
- Centralizado o catálogo dos 12 estados oficiais do Workflow.
- Adicionada API pública de consulta, validação, listagem, eventos permitidos e prazos.
- Refatorado o `workflow-engine.js` para consumir o State Manager.
- Mantida a compatibilidade integral com a versão 0.9.3.2 e com a API legada 0.9.3.1.
- Adicionado teste unitário em `tests/workflow-state-manager.test.js`.
- Atualizada a PoC do Workflow Engine para a versão 0.9.3.3.
- Nenhuma tela, tabela ou integração Supabase foi alterada.

# SIGEE Enterprise 0.9.3.2 — Sprint 1.0 / S1-E2.1

- Evoluído `frontend/js/core/workflow-engine.js` para uma PoC declarativa em memória.
- Adicionados estados, eventos, transições, validações e execução simulada.
- Implementado o fluxo `DES → RET → REU → CFD → DES`.
- Evento global `DOCUMENTO_RECEBIDO` preserva o estado atual.
- Retificação sinaliza reinício do prazo de 30 dias.
- Mantida a API de compatibilidade da versão 0.9.3.1.
- Adicionado teste técnico em `tests/workflow-engine.poc.test.js`.
- Nenhuma tela, tabela ou integração Supabase foi alterada.

# SIGEE Enterprise V31.5 - Correções reais

- Mantidos os perfis Master, Administrador, Técnico, SEC e Consulta.
- Removidos apenas os usuários demonstrativos/padrão: USUÁRIO SEC, USUÁRIO ADMINISTRADOR e USUÁRIO CONSULTA.
- Corrigido salvamento e exclusão de usuários pelo Master/SEC com tentativa de persistência no Supabase.
- Incluído autocomplete da escola filtrado pelo NTE do usuário cadastrado.
- Dashboard mantém apenas GLOBAL - TODOS OS NTEs, removendo SEC - TODOS OS NTEs como filtro.

# CHANGELOG

## 2.0.0-base-editavel

- Criação da estrutura modular inicial.
- Extração do CSS para `frontend/css/enterprise.css`.
- Extração do JavaScript para `frontend/js/app.js`.
- Criação dos módulos preparados para edição futura.
- Sem alteração intencional da base Supabase.

## 0.9.4.0 — PE-01 Infraestrutura Temporal
- Adicionado WorkflowClock com modo de homologação exclusivo para Master.
- Adicionado TimerManager com gatilhos temporais do ciclo de Desarquivamento.
- Adicionado painel visual para avanço rápido de datas simuladas.
- Workflow Engine passa a utilizar o relógio central em suas execuções.
- Event Manager passa a ser carregado pelo index principal.
- Incluído teste automatizado dos gatilhos 30/7/7/7.
