# Baseline de regressão — Importação DOE (RC57)

Objetivo: impedir que correções futuras de um Diário Oficial reintroduzam contaminação institucional, duplicidade ou efeitos colaterais em consultas.

## Invariantes obrigatórias

1. Consultar catálogo, prontuário ou fila DOE não executa saneamentos históricos específicos.
2. Reimportação remove/reconcilia somente ocorrências não finalizadas do mesmo `lote_id`; `CONFIRMADO` e `REJEITADO` são preservados.
3. `(lote_id, linha_origem)` é identidade física imutável de ocorrência já persistida.
4. A confirmação é ancorada por `importacao_id`; vínculo confirmado não é trocado por reimportação.
5. Referência normativa citada no texto não pode ser confirmada como ato regulatório da instituição.
6. Vínculo automático depende de identificador forte inequívoco; nome/município/NTE são apenas apoio de conferência.
7. Sincronização de legado por número exige, quando disponíveis, a mesma espécie e a mesma data de publicação.
8. Correções históricas específicas devem ser executadas como migração/saneamento administrativo explícito, nunca como efeito colateral de leitura.

## Casos históricos que devem permanecer como fixtures futuras

- Resolução 303/2026 / Escola Qui-Mimo: referência normativa não assume a identidade do ato principal.
- Resolução 300/2026 / Colégio Marista Patamares: não contaminar Colégio Marista Salvador.
- 299/2026 / Educandário Mariano: ofertas extraídas permanecem vinculadas à instituição correta.
- Colégio Acadêmico: não absorver publicação de outra instituição por coincidência de número.
- Portaria 251/2026 / Escola Tia Deja: isolar 251/2026 de 252/2026 e de portarias funcionais da mesma edição.
- Reimportação idempotente: nenhuma nova confirmação, nenhuma troca de instituição e nenhuma duplicação.
