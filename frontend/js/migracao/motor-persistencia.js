/* SIGEE Enterprise — M5.2.0 | Motor de Persistência Segura */
(function(){
  'use strict';
  const VERSION='M5.2.0';
  const RPC_PREFLIGHT='sigee_migracao_preflight';
  const RPC_IMPORTAR='sigee_migracao_importar';
  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const cliente=()=>[window.supabaseClient,window.supaClient,window.sb,window.SUPABASE_CLIENT].find(c=>c&&typeof c.rpc==='function')||
    (typeof window.obterSupabaseSIGEE==='function'?window.obterSupabaseSIGEE():null);
  function validar(payload){
    if(!norm(window.usuarioLogado?.perfil).includes('MASTER')) throw new Error('Operação exclusiva do perfil Master.');
    if(!payload||typeof payload!=='object') throw new Error('Payload não informado.');
    if(!/^NTE-\d{2}$/.test(txt(payload.nte))) throw new Error('NTE inválido.');
    if(!/^[a-f0-9]{64}$/i.test(txt(payload.hash_sha256))) throw new Error('Hash inválido.');
    if(payload.qualidade_m4!==100) throw new Error('Homologação M4 diferente de 100%.');
    if(!Array.isArray(payload.processos)||!payload.processos.length) throw new Error('Lote sem processos.');
    const keys=new Set();
    payload.processos.forEach((p,i)=>{if(!txt(p.migration_key))throw new Error(`Processo ${i+1} sem migration_key.`);if(keys.has(p.migration_key))throw new Error(`migration_key duplicada: ${p.migration_key}`);keys.add(p.migration_key);if(!p.escola_id)throw new Error(`Processo ${i+1} sem escola_id.`);if(!txt(p.workflow_instance_id))throw new Error(`Processo ${i+1} sem workflow_instance_id.`);if(!Array.isArray(p.eventos))throw new Error(`Processo ${i+1} sem lista de eventos.`);});
    return true;
  }
  async function rpc(nome,payload){
    validar(payload);const c=cliente();if(!c)throw new Error('Cliente Supabase não localizado.');
    const {data,error}=await c.rpc(nome,{p_payload:payload});
    if(error){const m=error.message||String(error);if(/does not exist|could not find|404/i.test(m))throw new Error(`A função ${nome} não está instalada no Supabase.`);throw error;}
    if(!data||typeof data!=='object')throw new Error('Resposta inválida do Supabase.');return data;
  }
  window.SIGEE_MOTOR_PERSISTENCIA={versao:VERSION,rpcPreflight:RPC_PREFLIGHT,rpcImportar:RPC_IMPORTAR,validarPayload:validar,preflight:p=>rpc(RPC_PREFLIGHT,p),importar:p=>rpc(RPC_IMPORTAR,p)};
})();
