/* =====================================================================
 * SIGEE ENTERPRISE 2.0 - config.js
 * Módulo de configuração central do sistema.
 * Esta etapa NÃO altera regras de negócio. Apenas centraliza constantes.
 * ===================================================================== */
(function (window) {
  'use strict';

  const CONFIG = {
    nome: 'SIGEE',
    nomeCompleto: 'Sistema Integrado de Gestão de Escolas Extintas',
    versao: '2.0.0-parte-2',
    ambiente: 'production',

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

    perfis: {
      SEC: 'SEC',
      MASTER: 'Master',
      ADMINISTRADOR: 'Administrador',
      TECNICO: 'Tecnico',
      TECNICO_ACENTO: 'Técnico',
      CONSULTA: 'Consulta'
    },

    nteGlobal: 'SEC - TODOS OS NTEs',

    prazosEtapas: {
      'Desarquivamento': 30,
      'Análise': 7,
      'Pendência': null,
      'Digitação': 15,
      'Conferência': 10,
      'Assinatura': 7,
      'Aguardando Retirada': null,
      'Retirado': null
    }
  };

  window.SIGEE_CONFIG = Object.freeze(CONFIG);

  // Ponte de compatibilidade para o app.js atual.
  window.SIGEE_SUPABASE_URL_CONFIG = CONFIG.supabase.url;
  window.SIGEE_SUPABASE_ANON_KEY_CONFIG = CONFIG.supabase.anonKey;
  window.SIGEE_SUPABASE_TABELAS_CONFIG = CONFIG.supabase.tabelas;
  window.SIGEE_SUPABASE_CONFLITOS_CONFIG = CONFIG.supabase.conflitos;
})(window);
