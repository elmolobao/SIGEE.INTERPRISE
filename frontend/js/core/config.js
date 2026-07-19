/* =====================================================================
 * SIGEE ENTERPRISE — config.js
 * Sprint 0.9.3.1 — configuração central e compatibilidade legada.
 * ===================================================================== */
(function (window) {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.getOwnPropertyNames(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  const PERFIS = {
    SEC: 'SEC',
    MASTER: 'MASTER',
    GESTOR: 'GESTOR',
    ADMINISTRADOR: 'ADMINISTRADOR',
    TECNICO: 'TECNICO',
    CONSULTA: 'CONSULTA',
    ESTAGIARIO: 'ESTAGIARIO'
  };

  const PERFIS_LABELS = {
    SEC: 'SEC',
    MASTER: 'Master',
    GESTOR: 'Gestor',
    ADMINISTRADOR: 'Administrador',
    TECNICO: 'Técnico',
    CONSULTA: 'Consulta',
    ESTAGIARIO: 'Estagiário'
  };

  const ETAPAS = {
    DESARQUIVAMENTO: 'DESARQUIVAMENTO',
    ANALISE: 'ANALISE',
    PENDENCIA: 'PENDENCIA',
    DIGITACAO: 'DIGITACAO',
    CONFERENCIA: 'CONFERENCIA',
    ASSINATURA: 'ASSINATURA',
    AGUARDANDO_RETIRADA: 'AGUARDANDO_RETIRADA',
    RETIRADO: 'RETIRADO',
    INDEFERIDO: 'INDEFERIDO'
  };

  const ETAPAS_LABELS = {
    DESARQUIVAMENTO: 'Desarquivamento',
    ANALISE: 'Análise',
    PENDENCIA: 'Pendência',
    DIGITACAO: 'Digitação',
    CONFERENCIA: 'Conferência',
    ASSINATURA: 'Assinatura',
    AGUARDANDO_RETIRADA: 'Aguardando Retirada',
    RETIRADO: 'Retirado',
    INDEFERIDO: 'Indeferido'
  };

  function semAcento(value) {
    return String(value == null ? '' : value)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizarToken(value) {
    return semAcento(value).toUpperCase().replace(/\s+/g, '_');
  }

  function normalizarPerfil(value) {
    const token = normalizarToken(value);
    if (token === 'SEC' || token.includes('SECRETARIA')) return PERFIS.SEC;
    if (token.includes('MASTER')) return PERFIS.MASTER;
    if (token.includes('GESTOR') || token.includes('DIRIGENTE')) return PERFIS.GESTOR;
    if (token.includes('ADMIN')) return PERFIS.ADMINISTRADOR;
    if (token.includes('ESTAG')) return PERFIS.ESTAGIARIO;
    if (token.includes('CONSULT')) return PERFIS.CONSULTA;
    if (token.includes('TECNIC')) return PERFIS.TECNICO;
    return null;
  }


  const PERFIS_ORDEM = Object.freeze([
    PERFIS.MASTER,
    PERFIS.SEC,
    PERFIS.GESTOR,
    PERFIS.ADMINISTRADOR,
    PERFIS.TECNICO,
    PERFIS.ESTAGIARIO,
    PERFIS.CONSULTA
  ]);

  function listarPerfis() {
    return PERFIS_ORDEM.map(function (key) {
      return Object.freeze({ key: key, value: PERFIS_LABELS[key], label: PERFIS_LABELS[key] });
    });
  }

  function preencherSelectPerfis(select, valorAtual, incluirPlaceholder) {
    if (!select) return false;
    const atual = normalizarPerfil(valorAtual == null ? select.value : valorAtual);
    const options = listarPerfis();
    const prefixo = incluirPlaceholder ? '<option value="">Selecione o Perfil</option>' : '';
    select.innerHTML = prefixo + options.map(function (item) {
      return '<option value="' + item.value + '">' + item.label + '</option>';
    }).join('');
    const labelAtual = atual ? PERFIS_LABELS[atual] : '';
    if (labelAtual) select.value = labelAtual;
    return true;
  }

  function normalizarEtapa(value) {
    const token = normalizarToken(value);
    if (token.includes('DESARQ')) return ETAPAS.DESARQUIVAMENTO;
    if (token.includes('ANAL')) return ETAPAS.ANALISE;
    if (token.includes('PEND')) return ETAPAS.PENDENCIA;
    if (token.includes('DIGIT')) return ETAPAS.DIGITACAO;
    if (token.includes('CONFER')) return ETAPAS.CONFERENCIA;
    if (token.includes('ASSIN')) return ETAPAS.ASSINATURA;
    if (token.includes('AGUARD')) return ETAPAS.AGUARDANDO_RETIRADA;
    if (token.includes('INDEFER')) return ETAPAS.INDEFERIDO;
    if (token.includes('RETIR')) return ETAPAS.RETIRADO;
    return null;
  }

  const CONFIG = {
    app: {
      nome: 'SIGEE',
      nomeCompleto: 'Sistema Integrado de Gestão de Escolas Extintas',
      versao: '0.9.3.1',
      ambiente: 'production'
    },

    supabase: {
      url: 'https://ckxbvsfjsknbgpfpxcyy.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreGJ2c2Zqc2tuYmdwZnB4Y3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc4MjUsImV4cCI6MjA5ODc3MzgyNX0.ecJr_MYR9GPnaYMZ3V6kgeed7uGtg-vQ4THpdwAtTxk',
      tabelas: {
        escolas: 'escolas_sigee',
        processos: 'processos',
        solicitacoes: 'solicitacoes_sigee',
        usuarios: 'usuarios_sigee',
        ntes: 'ntes_sigee'
      },
      conflitos: {
        escolas: 'cod_mec',
        processos: 'id',
        solicitacoes: 'id',
        usuarios: 'email',
        ntes: 'id'
      }
    },

    perfis: PERFIS,
    perfisLabels: PERFIS_LABELS,
    etapas: ETAPAS,
    etapasLabels: ETAPAS_LABELS,
    nteGlobal: 'SEC - TODOS OS NTEs',

    prazosEtapas: {
      'Desarquivamento': 30,
      'Análise': 7,
      'Pendência': null,
      'Digitação': 15,
      'Conferência': 10,
      'Assinatura': 7,
      'Aguardando Retirada': null,
      'Retirado': null,
      'Indeferido': null
    },

    // Compatibilidade com módulos que ainda usam as propriedades antigas.
    nome: 'SIGEE',
    nomeCompleto: 'Sistema Integrado de Gestão de Escolas Extintas',
    versao: '0.9.3.1',
    ambiente: 'production'
  };

  window.SIGEE_CONFIG = deepFreeze(CONFIG);
  window.SIGEE_CONSTANTS = deepFreeze({ PERFIS: PERFIS, ETAPAS: ETAPAS });
  window.SIGEE_CONFIG_UTILS = Object.freeze({
    normalizarPerfil: normalizarPerfil,
    normalizarEtapa: normalizarEtapa,
    listarPerfis: listarPerfis,
    preencherSelectPerfis: preencherSelectPerfis,
    labelPerfil: function (value) {
      const key = normalizarPerfil(value);
      return key ? PERFIS_LABELS[key] : String(value == null ? '' : value);
    },
    labelEtapa: function (value) {
      const key = normalizarEtapa(value);
      return key ? ETAPAS_LABELS[key] : String(value == null ? '' : value);
    }
  });

  window.SIGEE_SUPABASE_URL_CONFIG = CONFIG.supabase.url;
  window.SIGEE_SUPABASE_ANON_KEY_CONFIG = CONFIG.supabase.anonKey;
  window.SIGEE_SUPABASE_TABELAS_CONFIG = CONFIG.supabase.tabelas;
  window.SIGEE_SUPABASE_CONFLITOS_CONFIG = CONFIG.supabase.conflitos;
  window.SIGEE_PERFIS_CONFIG = CONFIG.perfis;
  window.SIGEE_ETAPAS_CONFIG = CONFIG.etapas;
})(window);
