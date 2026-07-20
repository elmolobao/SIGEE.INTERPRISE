# SIGEE Enterprise RC4.4.2 — Auditoria e correção da edição de processo

## Causa do travamento

A função de edição aguardava `carregarCatalogoEdicaoSIGEE()` antes de abrir o modal. Essa rotina baixava escolas e usuários em lotes de 1.000, com teto de 50.000 registros por tabela. Durante esse período, o usuário percebia o sistema como travado e o navegador acumulava memória e renderizações.

O campo Escola também era um `<select>` preenchido com todo o catálogo, contrariando o comportamento homologado no cadastro de nova solicitação, que usa pesquisa/autocomplete.

## Correção estrutural

- o modal abre imediatamente;
- o catálogo completo deixa de ser baixado;
- escola atual é preservada inicialmente;
- pesquisa de escola ocorre sob demanda no Supabase;
- busca por nome, município ou código MEC;
- resultados limitados a 30 por consulta;
- debounce de 280 ms;
- filtro pelo NTE do processo/usuário;
- mudança de NTE obriga nova seleção de escola;
- responsáveis são carregados somente para o NTE e com limite de segurança;
- Documento solicitado permanece editável somente para Master;
- Administrador mantém NTE somente leitura;
- salvamento exige uma escola validamente selecionada.

## Arquivos alterados

- `frontend/index.html`
- `frontend/js/processos/processos.js`

## Homologação

1. Abrir Central de Processos.
2. Clicar em Editar/Corrigir Cadastro.
3. Confirmar abertura imediata do modal.
4. Confirmar que a escola registrada aparece inicialmente.
5. Digitar ao menos 2 letras no campo Escola.
6. Selecionar resultado do mesmo NTE.
7. Salvar e recarregar o processo.
8. Confirmar persistência de nome, escola, documento (Master) e responsável.
