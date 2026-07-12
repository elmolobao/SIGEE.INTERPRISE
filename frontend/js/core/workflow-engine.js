/* =====================================================================
 * SIGEE — Motor central de procedimentos (camada de compatibilidade).
 * Sprint 0.9.3.1
 *
 * Nesta entrega o motor oferece leitura, validação e cálculo das regras,
 * mas NÃO substitui os modais homologados nem movimenta processos sozinho.
 * ===================================================================== */
(function (window) {
  'use strict';

  function config() { return window.SIGEE_POP_CONFIG || null; }
  function mensagens() { return window.SIGEE_MENSAGENS || null; }

  function obterPop(codigo) {
    const source = config();
    return source && typeof source.obter === 'function' ? source.obter(codigo) : null;
  }

  function comunicacoesDoPop(codigo) {
    const pop = obterPop(codigo);
    const source = mensagens();
    if (!pop || !source) return [];
    return (pop.comunicacoesObrigatorias || []).map(function (numero) {
      return source.obter(numero);
    }).filter(Boolean);
  }

  function validarConfirmacoes(codigo, confirmacoes) {
    const pop = obterPop(codigo);
    if (!pop) return { valido: false, pendencias: ['POP_NAO_ENCONTRADO'] };

    const marcadas = confirmacoes || {};
    const pendencias = (pop.comunicacoesObrigatorias || []).filter(function (numero) {
      return marcadas[numero] !== true;
    });

    return {
      valido: pendencias.length === 0,
      pendencias: pendencias,
      total: (pop.comunicacoesObrigatorias || []).length,
      confirmadas: (pop.comunicacoesObrigatorias || []).length - pendencias.length
    };
  }

  function eventoDisponivel(codigoPop, codigoEvento) {
    const source = config();
    if (!source) return false;
    const evento = source.obterEvento(codigoEvento);
    return Boolean(evento && evento.disponivelEm.indexOf(codigoPop) >= 0);
  }

  function resolverResultado(codigoPop, resultado) {
    const pop = obterPop(codigoPop);
    if (!pop || !pop.resultados) return null;
    return pop.resultados[resultado] || null;
  }

  function proximaAcaoSemRetorno(codigoPop) {
    const pop = obterPop(codigoPop);
    if (!pop) return null;
    if (pop.proximoPopSemRetorno) return { proximoPop: pop.proximoPopSemRetorno };
    return pop.conclusao || null;
  }

  function descrever(codigoPop) {
    const pop = obterPop(codigoPop);
    if (!pop) return null;
    return {
      codigo: pop.codigo,
      nome: pop.nome,
      etapa: pop.etapa || pop.etapaOrigem || null,
      prazoDias: pop.prazoDias == null ? null : pop.prazoDias,
      comunicacoes: comunicacoesDoPop(codigoPop),
      eventoDocumentoRecebido: eventoDisponivel(codigoPop, 'DOCUMENTO_RECEBIDO'),
      homologado: Boolean(pop.homologado)
    };
  }

  window.SIGEE_WORKFLOW = Object.freeze({
    obterPop: obterPop,
    descrever: descrever,
    comunicacoesDoPop: comunicacoesDoPop,
    validarConfirmacoes: validarConfirmacoes,
    eventoDisponivel: eventoDisponivel,
    resolverResultado: resolverResultado,
    proximaAcaoSemRetorno: proximaAcaoSemRetorno,
    versao: '0.9.3.1'
  });
})(window);
