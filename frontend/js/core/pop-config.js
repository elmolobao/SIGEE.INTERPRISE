/* =====================================================================
 * SIGEE — Catálogo de Procedimentos Operacionais (POP).
 * Sprint 0.9.3.1 — Desarquivamento consolidado sem alterar a UI homologada.
 * ===================================================================== */
(function (window) {
  'use strict';

  const POPS = {
    'POP-DES-001': {
      codigo: 'POP-DES-001',
      nome: 'Acompanhamento inicial do desarquivamento',
      etapa: 'DESARQUIVAMENTO',
      unidadeResponsavel: 'SETOR_ESCOLAS_EXTINTAS',
      executor: 'TECNICO_LOGADO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      prazoDias: 30,
      comunicacoesObrigatorias: [],
      proximoPopSemRetorno: 'POP-DES-002',
      eventoPrioritario: 'DOCUMENTO_RECEBIDO'
    },
    'POP-DES-002': {
      codigo: 'POP-DES-002',
      nome: 'Reiteração',
      etapa: 'DESARQUIVAMENTO',
      objetivo: 'Intensificar o pedido de desarquivamento em aberto diante da ausência de retorno.',
      unidadeResponsavel: 'SETOR_ESCOLAS_EXTINTAS',
      executor: 'TECNICO_LOGADO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      prazoDias: 7,
      comunicacoesObrigatorias: ['43', '45'],
      exigeConfirmacaoIndividual: true,
      proximoPopSemRetorno: 'POP-DES-003',
      eventoPrioritario: 'DOCUMENTO_RECEBIDO'
    },
    'POP-DES-003': {
      codigo: 'POP-DES-003',
      nome: 'Reiteração com Urgência',
      etapa: 'DESARQUIVAMENTO',
      objetivo: 'Intensificar com urgência o pedido em aberto após a reiteração sem retorno.',
      unidadeResponsavel: 'SETOR_ESCOLAS_EXTINTAS',
      executor: 'TECNICO_LOGADO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      prazoDias: 7,
      comunicacoesObrigatorias: ['44', '46'],
      exigeConfirmacaoIndividual: true,
      proximoPopSemRetorno: 'POP-DES-004',
      eventoPrioritario: 'DOCUMENTO_RECEBIDO'
    },
    'POP-DES-004': {
      codigo: 'POP-DES-004',
      nome: 'Confirmação dos dados da busca',
      etapa: 'DESARQUIVAMENTO',
      objetivo: 'Confirmar com o requerente os dados utilizados na busca antes do estágio crítico.',
      unidadeResponsavel: 'SETOR_ESCOLAS_EXTINTAS',
      executor: 'TECNICO_LOGADO',
      destinatario: 'REQUERENTE',
      prazoDias: 7,
      comunicacoesObrigatorias: ['12'],
      exigeConfirmacaoIndividual: true,
      resultados: {
        DADOS_CONFIRMADOS: { proximoPop: 'POP-DES-006' },
        NOVA_INFORMACAO: { proximoPop: 'POP-DES-005' }
      },
      eventoPrioritario: 'DOCUMENTO_RECEBIDO'
    },
    'POP-DES-005': {
      codigo: 'POP-DES-005',
      nome: 'Retificação dos dados',
      etapa: 'DESARQUIVAMENTO',
      objetivo: 'Retificar as informações do pedido em aberto com base nos novos dados fornecidos.',
      unidadeResponsavel: 'SETOR_ESCOLAS_EXTINTAS',
      executor: 'TECNICO_LOGADO',
      destinatario: 'REQUERENTE_E_SETOR_DESARQUIVAMENTO',
      comunicacoesObrigatorias: ['14', '37'],
      exigeConfirmacaoIndividual: true,
      conclusao: {
        reiniciarCicloDesarquivamento: true,
        reiniciarPrazoDias: 30,
        proximoPop: 'POP-DES-001'
      },
      eventoPrioritario: 'DOCUMENTO_RECEBIDO'
    },
    'POP-DES-006': {
      codigo: 'POP-DES-006',
      nome: 'Solicitação de atas sem pasta',
      etapa: 'DESARQUIVAMENTO',
      objetivo: 'Solicitar atas de resultados finais após o esgotamento do ciclo sem localização da pasta.',
      unidadeResponsavel: 'SETOR_ESCOLAS_EXTINTAS',
      executor: 'TECNICO_LOGADO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      comunicacoesObrigatorias: ['36'],
      exigeConfirmacaoIndividual: true,
      conclusao: {
        proximaEtapa: 'PENDENCIA',
        motivoPendencia: 'AGUARDANDO_ATAS_SEM_PASTA'
      },
      eventoPrioritario: 'DOCUMENTO_RECEBIDO'
    },
    'POP-TRI-001': {
      codigo: 'POP-TRI-001',
      nome: 'Pasta localizada — documento recebido',
      etapaOrigem: 'DESARQUIVAMENTO',
      eventoDisparador: 'DOCUMENTO_RECEBIDO',
      homologado: true,
      preservarInterfaceAtual: true,
      obrigacoes: [
        'TIPO_ARQUIVO',
        'LOCAL_ARQUIVO',
        'PRIORIDADE',
        'SELECIONAR_ANALISTA',
        'CONFIRMAR_MENSAGEM_02'
      ],
      comunicacoesObrigatorias: ['02'],
      conclusao: { proximaEtapa: 'ANALISE' }
    }
  };

  const EVENTOS = {
    DOCUMENTO_RECEBIDO: {
      codigo: 'DOCUMENTO_RECEBIDO',
      nome: 'Documento recebido / pasta localizada',
      prioridade: 'ALTA',
      disponivelEm: [
        'POP-DES-001', 'POP-DES-002', 'POP-DES-003',
        'POP-DES-004', 'POP-DES-005', 'POP-DES-006'
      ],
      destino: 'POP-TRI-001'
    }
  };

  function obter(codigo) { return POPS[codigo] || null; }
  function obterEvento(codigo) { return EVENTOS[codigo] || null; }
  function listarPorEtapa(etapa) {
    return Object.values(POPS).filter(function (pop) { return pop.etapa === etapa; });
  }

  window.SIGEE_POP_CONFIG = Object.freeze({
    pops: Object.freeze(POPS),
    eventos: Object.freeze(EVENTOS),
    obter: obter,
    obterEvento: obterEvento,
    listarPorEtapa: listarPorEtapa
  });
})(window);
