# Sprint 1.0.1a — Correção da Engine do Workflow

## Problema corrigido
Um processo novo podia herdar bloqueios de um processo antigo quando o mesmo ID numérico era reutilizado.

## Solução
- inclusão de `workflow_instance_id` UUID imutável em cada processo;
- histórico vinculado à instância UUID, ao ciclo e à ação;
- registros legados sem vínculo seguro não bloqueiam ações;
- cache isolado pela instância do processo;
- consulta considera somente execução válida do modelo `1.0.1a`.

## Ordem de implantação
1. Execute `supabase/migrations/20260712_sprint_1_0_1a_isolamento_instancia_workflow.sql`.
2. Publique os arquivos do frontend.
3. Faça login novamente ou force atualização completa do navegador.
4. Crie um processo novo e valide o Workflow Externo.
