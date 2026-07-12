/* =====================================================================
 * SIGEE — Catálogo central de mensagens/assinaturas.
 * Sprint 0.9.3.1 — recorte homologado do Cadastro e Desarquivamento.
 * ===================================================================== */
(function (window) {
  'use strict';

  const MENSAGENS = {
    '00': {
      numero: '00',
      codigo: 'MSG-CAD-000',
      nome: 'Cadastro',
      etapa: 'CADASTRO',
      destinatario: 'REQUERENTE',
      finalidade: 'Solicitar o preenchimento dos dados obrigatórios para análise do acolhimento.',
      ativa: true
    },
    '01': {
      numero: '01',
      codigo: 'MSG-CAD-001',
      nome: 'Aluno (Acolhido)',
      etapa: 'CADASTRO',
      destinatario: 'REQUERENTE',
      finalidade: 'Informar o acolhimento e o encaminhamento do pedido para desarquivamento.',
      ativa: true
    },
    '02': {
      numero: '02',
      codigo: 'MSG-ANA-002',
      nome: 'Aluno (Análise)',
      etapa: 'TRANSICAO_ANALISE',
      destinatario: 'REQUERENTE',
      finalidade: 'Informar que a documentação recebida será analisada.',
      ativa: true
    },
    '11': {
      numero: '11',
      codigo: 'MSG-CAD-011',
      nome: 'Aluno (Falta de Dados — Não Acolhido)',
      etapa: 'CADASTRO',
      destinatario: 'REQUERENTE',
      finalidade: 'Informar que a solicitação não foi acolhida por ausência de dados obrigatórios.',
      ativa: true
    },
    '12': {
      numero: '12',
      codigo: 'MSG-DES-012',
      nome: 'Dados (Confirmar dados 1)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'REQUERENTE',
      finalidade: 'Confirmar os dados utilizados na busca após as reiterações.',
      ativa: true
    },
    '13': {
      numero: '13',
      codigo: 'MSG-DES-013',
      nome: 'Dados (Confirmar dados 2)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'REQUERENTE',
      finalidade: 'Versão desconsiderada para o fluxo consolidado do SIGEE.',
      ativa: false,
      motivoInativacao: 'Desconsiderada por decisão funcional.'
    },
    '14': {
      numero: '14',
      codigo: 'MSG-DES-014',
      nome: 'Dados (Retificando Dados)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'REQUERENTE',
      finalidade: 'Comunicar ao requerente a retificação das informações da busca.',
      ativa: true
    },
    '34': {
      numero: '34',
      codigo: 'MSG-DES-034',
      nome: 'Desarquivamento (Protocolo)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      finalidade: 'Assinatura desconsiderada para o fluxo consolidado do SIGEE.',
      ativa: false,
      motivoInativacao: 'Desconsiderada por decisão funcional.'
    },
    '35': {
      numero: '35',
      codigo: 'MSG-PEN-035',
      nome: 'Desarquivamento (Pedido de Atas)',
      etapa: 'PENDENCIA_POS_ANALISE',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      finalidade: 'Solicitar atas quando a pasta localizada é insuficiente, incompleta ou divergente.',
      ativa: true,
      foraDoFluxoDesarquivamento: true
    },
    '36': {
      numero: '36',
      codigo: 'MSG-DES-036',
      nome: 'Desarquivamento (Pedido de Atas sem Pasta)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      finalidade: 'Solicitar atas após esgotamento do ciclo de busca sem localização da pasta.',
      ativa: true
    },
    '37': {
      numero: '37',
      codigo: 'MSG-DES-037',
      nome: 'Desarquivamento (Retificando dados)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      finalidade: 'Retificar os dados do pedido em aberto e reiniciar o prazo de 30 dias.',
      ativa: true
    },
    '43': {
      numero: '43',
      codigo: 'MSG-DES-043',
      nome: 'Reiterar (Aluno NORMAL)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'REQUERENTE',
      finalidade: 'Informar ao requerente a reiteração do pedido em aberto.',
      ativa: true
    },
    '44': {
      numero: '44',
      codigo: 'MSG-DES-044',
      nome: 'Reiterar (Aluno URGENTE)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'REQUERENTE',
      finalidade: 'Informar ao requerente a reiteração com urgência do pedido em aberto.',
      ativa: true
    },
    '45': {
      numero: '45',
      codigo: 'MSG-DES-045',
      nome: 'Reiterar (Desarquivamento NORMAL)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      finalidade: 'Intensificar o pedido de desarquivamento que permanece sem atendimento.',
      ativa: true
    },
    '46': {
      numero: '46',
      codigo: 'MSG-DES-046',
      nome: 'Reiterar (Desarquivamento URGENTE)',
      etapa: 'DESARQUIVAMENTO',
      destinatario: 'SETOR_DESARQUIVAMENTO',
      finalidade: 'Intensificar com urgência o pedido de desarquivamento ainda sem atendimento.',
      ativa: true
    }
  };

  function obter(numero) {
    return MENSAGENS[String(numero).padStart(2, '0')] || null;
  }

  function listarAtivas() {
    return Object.values(MENSAGENS).filter(function (item) { return item.ativa; });
  }

  window.SIGEE_MENSAGENS = Object.freeze({
    catalogo: Object.freeze(MENSAGENS),
    obter: obter,
    listarAtivas: listarAtivas
  });
})(window);
