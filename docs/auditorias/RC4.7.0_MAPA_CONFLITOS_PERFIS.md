# SIGEE RC4.7.0 — Mapa de conflitos de perfis e escopo

## Objetivo
Identificar módulos que repetem ou contradizem a autoridade central. Nenhum arquivo foi removido nesta etapa; a retirada será feita por ondas, após teste de dependências.

## Critérios
- Normalizador local de perfil
- Verificação direta de Master ou SEC
- Função territorial local
- Sobrescrita de `SIGEE_PERFIS`, `SIGEE_PERMISSOES` ou `SIGEE_ESCOPO`

## Resultado
- Arquivos sinalizados: **56**
- Carregados atualmente pelo `index.html`: **22**

| Estado | Arquivo | Conflitos | Linhas |
|---|---|---|---:|
| ATIVO | `js/admin/controle-acesso-ntes.js` | verificacao_master_direta | 215 |
| ATIVO | `js/analytics/dashboard.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 801 |
| ATIVO | `js/analytics/sala-situacao.js` | escopo_nte_local | 298 |
| ATIVO | `js/app/app.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 10921 |
| ATIVO | `js/core/config.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 209 |
| ATIVO | `js/core/credenciais.js` | verificacao_master_direta | 289 |
| ATIVO | `js/core/escopo.js` | sobrescreve_autoridade | 23 |
| ATIVO | `js/core/perfis.js` | verificacao_master_direta, verificacao_sec_direta, sobrescreve_autoridade | 53 |
| ATIVO | `js/core/permissoes.js` | sobrescreve_autoridade | 58 |
| ATIVO | `js/core/session.js` | verificacao_master_direta, verificacao_sec_direta | 88 |
| ATIVO | `js/core/workflow.clock.js` | verificacao_master_direta | 163 |
| ATIVO | `js/escolas/escolas.js` | verificacao_master_direta, verificacao_sec_direta | 1426 |
| ATIVO | `js/migracao/importacao-oficial.js` | verificacao_master_direta | 357 |
| ATIVO | `js/migracao/migracao-historica.js` | verificacao_master_direta, escopo_nte_local | 1488 |
| ATIVO | `js/migracao/migracao-importacao-oficial.js` | verificacao_master_direta | 173 |
| ATIVO | `js/migracao/motor-persistencia.js` | verificacao_master_direta | 29 |
| ATIVO | `js/processos/fluxo-operacional.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 406 |
| ATIVO | `js/processos/processos.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 2354 |
| ATIVO | `js/processos/workflow-externo.js` | verificacao_master_direta | 792 |
| ATIVO | `js/ui/sigee_footer_institucional.js` | perfil_normalizador_local, verificacao_master_direta | 126 |
| ATIVO | `js/usuarios/logs.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 352 |
| ATIVO | `js/usuarios/usuarios.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 1574 |
| NÃO CARREGADO | `js/administracao-segura.js` | verificacao_master_direta | 113 |
| NÃO CARREGADO | `js/app.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 9124 |
| NÃO CARREGADO | `js/app/escolas.js` | verificacao_master_direta, verificacao_sec_direta | 1345 |
| NÃO CARREGADO | `js/auth.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 122 |
| NÃO CARREGADO | `js/centro-inteligencia.js` | verificacao_master_direta, verificacao_sec_direta | 205 |
| NÃO CARREGADO | `js/config.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 165 |
| NÃO CARREGADO | `js/controle-acessos.js` | verificacao_master_direta | 60 |
| NÃO CARREGADO | `js/core/auth.js` | verificacao_master_direta, verificacao_sec_direta | 160 |
| NÃO CARREGADO | `js/dashboard.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 800 |
| NÃO CARREGADO | `js/escolas.js` | verificacao_master_direta, verificacao_sec_direta | 1309 |
| NÃO CARREGADO | `js/fluxo-operacional.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 407 |
| NÃO CARREGADO | `js/legacy/credenciais/auth.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 122 |
| NÃO CARREGADO | `js/legacy/credenciais/core-auth.js` | verificacao_master_direta, verificacao_sec_direta | 153 |
| NÃO CARREGADO | `js/logs.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 352 |
| NÃO CARREGADO | `js/perfis-usuarios-oficial.js` | verificacao_master_direta, verificacao_sec_direta | 80 |
| NÃO CARREGADO | `js/permissoes.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, sobrescreve_autoridade | 168 |
| NÃO CARREGADO | `js/processo.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 1583 |
| NÃO CARREGADO | `js/processos.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 2060 |
| NÃO CARREGADO | `js/sigee-core-authority-rc2.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 135 |
| NÃO CARREGADO | `js/sigee_autocomplete_escola_nte_v1.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 308 |
| NÃO CARREGADO | `js/sigee_autocomplete_escola_nte_v2.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 153 |
| NÃO CARREGADO | `js/sigee_core_dados_nte_autocomplete_v1.js` | verificacao_master_direta, verificacao_sec_direta | 264 |
| NÃO CARREGADO | `js/sigee_core_dados_nte_autocomplete_v2.js` | verificacao_master_direta, verificacao_sec_direta | 286 |
| NÃO CARREGADO | `js/sigee_core_filtros_nte_v1.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 199 |
| NÃO CARREGADO | `js/sigee_footer_institucional.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 131 |
| NÃO CARREGADO | `js/sigee_perfil_estagiario_v1.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 387 |
| NÃO CARREGADO | `js/sigee_sprint_2_5_perfil_senha_nova_solicitacao.js` | perfil_normalizador_local, verificacao_master_direta | 872 |
| NÃO CARREGADO | `js/sigee_usuarios_crud_supabase_final.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta | 306 |
| NÃO CARREGADO | `js/sigee_v31_2_usuarios_master_final.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 311 |
| NÃO CARREGADO | `js/sigee_v31_5_correcoes_reais.js` | verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 294 |
| NÃO CARREGADO | `js/sigee_v31_global_dashboard_hotfix.js` | verificacao_sec_direta | 77 |
| NÃO CARREGADO | `js/ui-estabilidade.js` | verificacao_master_direta, verificacao_sec_direta | 90 |
| NÃO CARREGADO | `js/usuarios.js` | perfil_normalizador_local, verificacao_master_direta, verificacao_sec_direta, escopo_nte_local | 1040 |
| NÃO CARREGADO | `js/workflow/workflow-externo.js` | verificacao_master_direta | 741 |

## Política de eliminação
1. **Não carregados:** mover para `frontend/js/legacy/` ou excluir após confirmar que não são referenciados por documentação/deploy.
2. **Carregados e apenas visuais:** substituir chamadas locais por `SIGEE_PERMISSOES.pode(...)`.
3. **Carregados com consultas:** substituir filtros locais por `SIGEE_ESCOPO.aplicarQuery(...)` ou `SIGEE_ESCOPO.filtrar(...)`.
4. **Workflow:** não remover nem alterar nesta onda; somente trocar verificações de autorização depois dos testes de regressão.
5. **Autoridade central:** nenhum módulo poderá redefinir `SIGEE_PERFIS`, `SIGEE_PERMISSOES` ou `SIGEE_ESCOPO`.