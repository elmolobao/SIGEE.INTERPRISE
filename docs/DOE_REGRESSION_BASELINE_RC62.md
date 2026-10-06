# RC62 — Cursos técnicos: seleção manual e identificação DOE

- Gerenciar oferta: curso técnico passa a ser selecionável.
- Eixo tecnológico é derivado automaticamente do curso selecionado e não é digitado livremente.
- O catálogo operacional é formado por pares curso/eixo já validados no SIGEE (`legalizacao_ofertas` e `legalizacao_processos_ofertas`).
- Importação DOE: o sistema compara automaticamente a evidência do ato com esse catálogo e cria uma oferta por curso técnico reconhecido.
- Sem correspondência confiável, não inventa curso/eixo; retorna diagnóstico `CURSO_TECNICO_NAO_IDENTIFICADO_NO_CATALOGO`.
