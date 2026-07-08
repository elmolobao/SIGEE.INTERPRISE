/* SIGEE Enterprise 2.0 - Camada Supabase */
(function () {
  let client = null;

  function inicializarSupabase() {
    if (client) return client;
    if (!window.supabase) {
      console.error('Biblioteca Supabase não carregada. Inclua o script CDN no index.html.');
      return null;
    }
    const cfg = window.SIGEE_CONFIG;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return client;
  }

  async function selecionar(tabela, opts = {}) {
    const db = inicializarSupabase();
    if (!db) return { data: [], error: new Error('Supabase não inicializado') };
    let query = db.from(tabela).select(opts.select || '*');
    if (opts.order) query = query.order(opts.order, { ascending: opts.ascending ?? true });
    if (opts.limit) query = query.limit(opts.limit);
    return await query;
  }

  async function inserir(tabela, dados) {
    const db = inicializarSupabase();
    if (!db) return { data: null, error: new Error('Supabase não inicializado') };
    return await db.from(tabela).insert(dados).select();
  }

  async function atualizar(tabela, id, dados) {
    const db = inicializarSupabase();
    if (!db) return { data: null, error: new Error('Supabase não inicializado') };
    return await db.from(tabela).update(dados).eq('id', id).select();
  }

  async function remover(tabela, id) {
    const db = inicializarSupabase();
    if (!db) return { data: null, error: new Error('Supabase não inicializado') };
    return await db.from(tabela).delete().eq('id', id);
  }

  async function upsert(tabela, dados, conflito) {
    const db = inicializarSupabase();
    if (!db) return { data: null, error: new Error('Supabase não inicializado') };
    const options = conflito ? { onConflict: conflito } : undefined;
    return await db.from(tabela).upsert(dados, options).select();
  }

  async function carregarBase() {
    const t = window.SIGEE_CONFIG.tabelas;
    const [escolas, processos, usuarios, ntes] = await Promise.all([
      selecionar(t.escolas),
      selecionar(t.processos),
      selecionar(t.usuarios),
      selecionar(t.ntes)
    ]);
    return { escolas, processos, usuarios, ntes };
  }

  window.SIGEE_DB = {
    inicializarSupabase,
    selecionar,
    inserir,
    atualizar,
    remover,
    upsert,
    carregarBase
  };
})();
