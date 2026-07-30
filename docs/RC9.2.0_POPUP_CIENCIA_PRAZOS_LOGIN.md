# SIGEE RC9.2.0 — Popup de ciência de prazos no login

## Regra implementada
- Exibição somente depois do login manual concluído.
- Aplicação exclusiva ao perfil Técnico.
- Filtragem obrigatória pelo NTE do usuário.
- Não reaparece durante a navegação nem em atualizações internas.
- Lista somente ações não executadas cujo último dia da janela é a data atual.
- Exige marcação da caixa de ciência para liberar o acesso.
- A ciência é registrada no log oficial do SIGEE com processos, ações, ciclo e horário.

## Janelas consideradas
- Reiteração: 31º ao 38º dia; alerta no 38º.
- Reiteração Urgente: 39º ao 45º dia; alerta no 45º.
- Confirmação dos Dados: 46º ao 52º dia; alerta no 52º.
- Pedido de Atas: 53º ao 59º dia; alerta no 59º.

A data-base continua sendo a abertura do ciclo. Somente a Retificação reinicia a data-base.
