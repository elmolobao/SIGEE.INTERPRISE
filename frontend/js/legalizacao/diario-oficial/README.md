# Diário Oficial — módulo de estabilização

Baseline funcional auditado: 25/09/2026. Base evolutiva: 29/09/2026.

Este diretório passa a ser o contrato público do domínio Diário Oficial. Nesta consolidação, as operações de banco continuam delegadas ao `legalizacao.service.js` para preservar exatamente as consultas e RPCs já existentes enquanto isolamos o domínio sem reescrever a persistência no mesmo passo.

Tabelas primárias: `legalizacao_atos_importacao`, `legalizacao_atos_legais`.
Integrações controladas: `legalizacao_processos`, `legalizacao_instituicoes`, `legalizacao_mantenedoras`.
