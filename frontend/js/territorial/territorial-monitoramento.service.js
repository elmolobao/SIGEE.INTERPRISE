/**
 * SIGEE Enterprise — GT-03 Monitoramento Territorial
 * Persistência isolada da Central Master.
 * Tabela: gt_monitoramento
 */
(function(window){
  'use strict';
  if(window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE) return;

  const TABELA='gt_monitoramento';

  function cliente(){
    try{return window.SIGEE_SUPABASE?.criarCliente?.() || window.SIGEE_SUPABASE_CLIENT || null;}catch(_){return null;}
  }
  function usuario(){return window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null;}
  function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil) || window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil) || String(usuario()?.perfil||'');}
  function master(){return perfil()==='Master';}
  function numeroNte(v){return window.SIGEE_TERRITORIAL_DATA?.numeroNte?.(v)||null;}
  function erroBanco(error){
    const msg=String(error?.message||error||'Erro desconhecido');
    if(/gt_monitoramento|relation .* does not exist|schema cache/i.test(msg)){
      const e=new Error('O Monitoramento Territorial ainda não foi habilitado no Supabase. Execute o SQL GT-03 antes de usar este recurso.');
      e.code='GT03_SCHEMA_AUSENTE'; throw e;
    }
    throw error;
  }
  function autor(){
    const u=usuario()||{};
    return {criado_por_id:u.id||null,criado_por_nome:u.nome||u.name||'',criado_por_email:String(u.email||'').toLowerCase()||null};
  }
  function normalizar(payload){
    const fase=String(payload.fase||'PRE_FORMACAO').toUpperCase();
    const natureza=String(payload.natureza||'OCORRENCIA').toUpperCase();
    const nte=numeroNte(payload.nte_numero ?? payload.nte);
    const registro={
      nte_numero:nte,
      fase,
      natureza,
      data_registro:payload.data_registro||new Date().toISOString(),
      titulo:String(payload.titulo||'').trim(),
      descricao:String(payload.descricao||'').trim(),
      categoria:String(payload.categoria||'OUTRA').toUpperCase(),
      relevancia:String(payload.relevancia||'INFORMATIVA').toUpperCase(),
      processo_id:payload.processo_id?Number(payload.processo_id):null,
      codigo_sigee:String(payload.codigo_sigee||'').trim()||null,
      conteudo_formacao:String(payload.conteudo_formacao||'NAO_SE_APLICA').toUpperCase(),
      resultado:String(payload.resultado||'EM_ACOMPANHAMENTO').toUpperCase(),
      prazo:payload.prazo||null,
      concluido_at:payload.concluido_at||null,
      evidencia_referencia:String(payload.evidencia_referencia||'').trim()||null,
      observacoes:String(payload.observacoes||'').trim()||null,
      updated_at:new Date().toISOString()
    };
    if(!registro.nte_numero) throw new Error('Selecione o NTE relacionado.');
    if(!registro.titulo) throw new Error('Informe o título do registro.');
    if(!registro.descricao) throw new Error('Descreva a ocorrência, orientação ou medida adotada.');
    if(fase==='PRE_FORMACAO') registro.conteudo_formacao='NAO_SE_APLICA';
    return registro;
  }

  async function listar(filtros={}){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    let q=c.from(TABELA).select('*').order('data_registro',{ascending:false});
    if(filtros.nte) q=q.eq('nte_numero',Number(filtros.nte));
    if(filtros.fase) q=q.eq('fase',String(filtros.fase).toUpperCase());
    if(filtros.natureza) q=q.eq('natureza',String(filtros.natureza).toUpperCase());
    if(filtros.resultado) q=q.eq('resultado',String(filtros.resultado).toUpperCase());
    const {data,error}=await q; if(error) erroBanco(error); return data||[];
  }

  async function salvar(payload){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const registro=normalizar(payload);
    let r;
    if(payload.id){
      r=await c.from(TABELA).update(registro).eq('id',payload.id).select('*').single();
    }else{
      Object.assign(registro,autor());
      r=await c.from(TABELA).insert(registro).select('*').single();
    }
    if(r.error) erroBanco(r.error);
    try{window.registrarLog?.(`${payload.id?'Atualizou':'Registrou'} monitoramento territorial: ${registro.titulo}`,'',{modulo:'gestao_territorial',processo_id:registro.processo_id||null,codigo_sigee:registro.codigo_sigee||null});}catch(_){ }
    document.dispatchEvent(new CustomEvent('sigee:gt-monitoramento-atualizado',{detail:{registro:r.data}}));
    return r.data;
  }

  async function excluir(id){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const {error}=await c.from(TABELA).delete().eq('id',id); if(error) erroBanco(error);
    try{window.registrarLog?.(`Excluiu registro de Monitoramento Territorial #${id}`,'',{modulo:'gestao_territorial'});}catch(_){ }
    document.dispatchEvent(new CustomEvent('sigee:gt-monitoramento-atualizado',{detail:{id,excluido:true}}));
    return true;
  }

  window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE=Object.freeze({listar,salvar,excluir,master,versao:'GT-03.0'});
})(window);
