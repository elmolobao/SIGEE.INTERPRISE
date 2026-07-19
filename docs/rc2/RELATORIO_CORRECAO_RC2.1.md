# SIGEE Enterprise 1.0 RC2.1

## Falha corrigida
O encaminhamento **Análise → Digitação** compartilhava a mesma função e as mesmas mensagens do fluxo **Pendência sanada → Digitação**.

## Intervenções
- rotas separadas para Análise e Pendência;
- validação da etapa de origem antes da abertura e antes do salvamento;
- checkbox da mensagem 03 inicia desmarcado e exige evento manual de confirmação;
- Análise não limpa campos de pendência nem registra evento de pendência sanada;
- Pendência sanada só pode avançar quando `pendencia_aberta = false`;
- payload usa somente `etapa_atual`;
- mensagens e histórico distintos por origem.

## Testes de homologação
1. Análise: selecionar digitador sem marcar mensagem 03 — botão deve permanecer bloqueado.
2. Análise: marcar mensagem sem selecionar digitador — botão deve permanecer bloqueado.
3. Análise: cumprir ambos — mensagem de sucesso deve ser “Análise concluída...”.
4. Pendência ainda aberta — encaminhamento deve ser bloqueado.
5. Pendência totalmente sanada — cumprir ambos e avançar com mensagem “Pendência sanada...”.
