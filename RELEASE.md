# SIGEE Enterprise 0.9.4.0 — PE-01 Infraestrutura Temporal

## Objetivo
Permitir a homologação acelerada dos prazos do Workflow sem alterar datas reais do banco de dados.

## Entregas
- `workflow.clock.js`: fonte temporal única, com modo oficial e simulado.
- `workflow.timer.manager.js`: cálculo declarativo dos gatilhos 30/7/7/7.
- `workflow.clock.panel.js`: painel visual exclusivo do perfil Master.
- Integração do Workflow Engine ao relógio e ao Timer Manager.
- Carregamento efetivo do Event Manager no `index.html`.
- Teste automatizado do ciclo temporal.

## Segurança
- Modo Homologação restrito ao perfil Master.
- Simulação armazenada somente no navegador.
- Nenhuma data persistida no Supabase é alterada.
- Aviso visual permanente enquanto a simulação estiver ativa.

## Homologação H-001
1. Entrar com perfil Master.
2. Abrir `Testar prazos`, no canto inferior direito.
3. Definir uma data-base ou usar a data atual.
4. Validar os botões +1, +7, +30 e +90 dias.
5. Retornar à data oficial.
