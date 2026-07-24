# SIGEE RC5.5.1 — Estabilidade Analítica

Correção emergencial aplicada sobre a RC5.5.0.

- remove disparo circular de `sigee:processos-atualizados` pelo controlador analítico;
- remove varredura periódica do motor analítico a cada 5 segundos;
- impede carga completa automática no login;
- evita atualização executiva simultânea durante a inicialização;
- mantém cache, paginação e inclusão dos processos migrados;
- preserva controle de comunicação com o Supabase.
