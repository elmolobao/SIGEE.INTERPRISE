/* =====================================================================
 * SIGEE ENTERPRISE 2.0 - supabase.js
 * Camada inicial de acesso ao Supabase.
 * Mantém compatibilidade com o app.js atual e prepara a modularização.
 * ===================================================================== */
(function (window) {
  'use strict';

  function getConfig() {
    return window.SIGEE_CONFIG || null;
  }

  function criarClienteSupabaseSIGEE() {
    const cfg = getConfig();
    if (!cfg || !cfg.supabase) {
      console.warn('[SIGEE] Configuração Supabase não encontrada.');
      return null;
    }
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[SIGEE] Biblioteca Supabase ainda não carregada.');
      return null;
    }
    if (window.SIGEE_SUPABASE_CLIENT) return window.SIGEE_SUPABASE_CLIENT;

    window.SIGEE_SUPABASE_CLIENT = window.supabase.createClient(
      cfg.supabase.url,
      cfg.supabase.anonKey
    );
    return window.SIGEE_SUPABASE_CLIENT;
  }

  async function selecionarTabelaSIGEE(tabela, colunas = '*', limite = 5000) {
    const client = criarClienteSupabaseSIGEE();
    if (!client) throw new Error('Cliente Supabase indisponível.');
    const query = client.from(tabela).select(colunas);
    if (limite) query.limit(limite);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function upsertTabelaSIGEE(tabela, registros, onConflict) {
    const client = criarClienteSupabaseSIGEE();
    if (!client) throw new Error('Cliente Supabase indisponível.');
    const lista = Array.isArray(registros) ? registros : [registros];
    if (!lista.length) return [];
    const options = onConflict ? { onConflict } : undefined;
    const { data, error } = await client.from(tabela).upsert(lista, options).select();
    if (error) throw error;
    return data || [];
  }

  async function excluirRegistroSIGEE(tabela, campo, valor) {
    const client = criarClienteSupabaseSIGEE();
    if (!client) throw new Error('Cliente Supabase indisponível.');
    const { data, error } = await client.from(tabela).delete().eq(campo, valor).select();
    if (error) throw error;
    return data || [];
  }

  window.SIGEE_SUPABASE = {
    criarCliente: criarClienteSupabaseSIGEE,
    selecionar: selecionarTabelaSIGEE,
    upsert: upsertTabelaSIGEE,
    excluir: excluirRegistroSIGEE
  };

  // Compatibilidade com nomes usados em versões anteriores.
  window.criarClienteSupabaseSIGEE = window.criarClienteSupabaseSIGEE || criarClienteSupabaseSIGEE;
})(window);
