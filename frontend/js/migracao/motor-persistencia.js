/* SIGEE Enterprise — M5.3.0 | Motor de Persistência Segura */
(function(){
  'use strict';
  const VERSION='M5.3.1';
  const RPC_PREFLIGHT='sigee_migracao_preflight';
  const RPC_IMPORTAR='sigee_migracao_importar';
  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const cliente=()=>[window.supabaseClient,window.supaClient,window.sb,window.SUPABASE_CLIENT].find(c=>c&&typeof c.rpc==='function')||
    (typeof window.obterSupabaseSIGEE==='function'?window.obterSupabaseSIGEE():null);
  function normalizarPayload(payload){
    const copia={...payload,processos:(payload?.processos||[]).map(p=>{
      const abertura=txt(p.data_abertura||p.data_solicitacao||p.created_at||p.eventos?.[0]?.data);
      const origem=Array.isArray(p.eventos)?p.eventos:[];
      const eventos=origem.map((e,indice)=>({
        ...e,migration_key:p.migration_key,data:txt(e.data||abertura),linha_origem:e.linha_origem||p.linha_origem||null,
        sequencia:e.sequencia||indice+1,historico_reconstruido:true,processo_migrado:true,valido_cronologia:e.valido_cronologia!==false
      }));
      if(!eventos.length&&abertura) eventos.push({migration_key:p.migration_key,etapa:'Desarquivamento',evento:'Nova Solicitação',data:abertura,tipo_data:'REAL',responsavel:'',status:'',aba:'00 - DESARQUIVAR',linha_origem:p.linha_origem||null,sequencia:1,historico_reconstruido:true,processo_migrado:true,valido_cronologia:true,evento_sintetizado:true});
      return {...p,data_abertura:abertura,data_solicitacao:abertura,created_at:abertura,data_etapa_atual:txt(p.data_etapa_atual||abertura),eventos};
    })};
    return copia;
  }
  function validar(payload){
    if(!norm(window.usuarioLogado?.perfil).includes('MASTER')) throw new Error('Operação exclusiva do perfil Master.');
    if(!payload||typeof payload!=='object') throw new Error('Payload não informado.');
    if(!/^NTE-\d{2}$/.test(txt(payload.nte))) throw new Error('NTE inválido.');
    if(!/^[a-f0-9]{64}$/i.test(txt(payload.hash_sha256))) throw new Error('Hash inválido.');
    if(payload.qualidade_m4!==100) throw new Error('Homologação M4 diferente de 100%.');
    if(!Array.isArray(payload.processos)||!payload.processos.length) throw new Error('Lote sem processos.');
    const keys=new Set();
    payload.processos.forEach((p,i)=>{
      if(!txt(p.migration_key))throw new Error(`Processo ${i+1} sem migration_key.`);
      if(keys.has(p.migration_key))throw new Error(`migration_key duplicada: ${p.migration_key}`);keys.add(p.migration_key);
      if(!p.escola_id)throw new Error(`Processo ${i+1} sem escola_id.`);
      if(!txt(p.data_abertura||p.data_solicitacao))throw new Error(`Processo ${i+1} sem data de abertura.`);
      if(!txt(p.workflow_instance_id))throw new Error(`Processo ${i+1} sem workflow_instance_id.`);
      if(!Array.isArray(p.eventos)||!p.eventos.length)throw new Error(`Processo ${i+1} sem histórico de eventos.`);
    });
    return true;
  }
  async function rpc(nome,payload){
    const normalizado=normalizarPayload(payload);validar(normalizado);const c=cliente();if(!c)throw new Error('Cliente Supabase não localizado.');
    const {data,error}=await c.rpc(nome,{p_payload:normalizado});
    if(error){const m=error.message||String(error);if(/does not exist|could not find|404/i.test(m))throw new Error(`A função ${nome} não está instalada no Supabase.`);throw error;}
    if(!data||typeof data!=='object')throw new Error('Resposta inválida do Supabase.');return data;
  }
  window.SIGEE_MOTOR_PERSISTENCIA={versao:VERSION,rpcPreflight:RPC_PREFLIGHT,rpcImportar:RPC_IMPORTAR,normalizarPayload,validarPayload:p=>validar(normalizarPayload(p)),preflight:p=>rpc(RPC_PREFLIGHT,p),importar:p=>rpc(RPC_IMPORTAR,p)};
})();
