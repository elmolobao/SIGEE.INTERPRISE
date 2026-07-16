/* SIGEE Enterprise — M5.1.0 | Motor de Persistência Segura
   Executa preflight transacional no banco por RPC, sem inserir processos.
   A importação definitiva permanece reservada para a M5.2. */
(function () {
  'use strict';

  const VERSION = 'M5.1.0';
  const RPC_PREFLIGHT = 'sigee_migracao_preflight';

  const texto = v => v == null ? '' : String(v).trim();
  const normalizar = v => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const clienteSupabase = () => [window.supabaseClient, window.supaClient, window.sb, window.SUPABASE_CLIENT]
    .find(c => c && typeof c.rpc === 'function');

  function perfilMaster() {
    return normalizar(window.usuarioLogado?.perfil).includes('MASTER');
  }

  function validarPayload(payload) {
    if (!perfilMaster()) throw new Error('A operação é exclusiva do perfil Master.');
    if (!payload || typeof payload !== 'object') throw new Error('Payload da migração não informado.');
    if (!/^NTE-\d{2}$/.test(texto(payload.nte))) throw new Error('NTE inválido no payload.');
    if (!/^[a-f0-9]{64}$/i.test(texto(payload.hash_sha256))) throw new Error('Hash SHA-256 inválido.');
    if (!Array.isArray(payload.processos) || !payload.processos.length) throw new Error('Nenhum processo homologado foi informado.');

    const chaves = new Set();
    payload.processos.forEach((p, index) => {
      const key = texto(p.migration_key);
      if (!key) throw new Error(`Processo ${index + 1} sem migration_key.`);
      if (chaves.has(key)) throw new Error(`migration_key duplicada dentro do lote: ${key}`);
      chaves.add(key);
      if (!p.escola_id) throw new Error(`Processo ${index + 1} sem escola_id homologada.`);
      if (!texto(p.workflow_instance_id)) throw new Error(`Processo ${index + 1} sem workflow_instance_id preparado.`);
    });
    return true;
  }

  async function preflight(payload) {
    validarPayload(payload);
    const client = clienteSupabase();
    if (!client) throw new Error('Cliente Supabase não localizado.');

    const { data, error } = await client.rpc(RPC_PREFLIGHT, { p_payload: payload });
    if (error) {
      const msg = error.message || String(error);
      if (/could not find|does not exist|404/i.test(msg)) {
        throw new Error('A infraestrutura SQL M5.1 ainda não foi instalada no Supabase. Execute o arquivo SQL incluído no pacote.');
      }
      throw error;
    }
    if (!data || typeof data !== 'object') throw new Error('Resposta inválida do preflight M5.1.');
    return data;
  }

  window.SIGEE_MOTOR_PERSISTENCIA = {
    versao: VERSION,
    rpcPreflight: RPC_PREFLIGHT,
    validarPayload,
    preflight
  };
})();
