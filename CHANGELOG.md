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
