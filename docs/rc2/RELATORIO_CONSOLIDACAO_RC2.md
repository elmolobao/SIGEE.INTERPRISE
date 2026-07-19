# SIGEE Enterprise 1.0 RC2 — Consolidação do motor

Base: SIGEE Enterprise 4.1.8.

## Intervenções executadas

- Perfil oficial normalizado para Master, SEC, Gestor, Administrador, Técnico, Estagiário e Consulta.
- Autoridade final reinstala o workflow consolidado 0.9.3 após os módulos legados.
- Salvamento de processos passa por validação final de destino.
- Bloqueios mínimos por etapa:
  - Pendência: ao menos um item e pendência aberta;
  - Digitação: digitador obrigatório;
  - Conferência: conferente obrigatório;
  - Assinatura: responsável pelo envio obrigatório;
  - Aguardando Retirada: deferimento confirmado;
  - Retirado: finalização confirmada;
  - Indeferido: motivo ou justificativa obrigatória.
- A coluna inexistente `etapa` é removida do payload convertido antes do Supabase.
- `etapa_atual` permanece como coluna oficial.
- Responsável vazio passa a ser exibido como `Migrado` ou `Atribuição pendente`, sem gravar esses rótulos no banco.
- Modalidade vazia passa a ser exibida como `Não informado`; quando existem os dois valores, usa `modalidade / nivel_oferta`.

## Arquivos alterados

- `frontend/index.html`
- `frontend/js/processos.js`
- `frontend/js/sigee-core-authority-rc2.js` (novo)

## Observação

A RC2 não preenche automaticamente responsáveis ou modalidades ausentes. Isso preserva a integridade dos registros históricos e migrados.
