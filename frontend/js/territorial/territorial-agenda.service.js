/**
 * SIGEE Enterprise — GT-02 Agenda Institucional
 * Persistência isolada da Central de Gestão Territorial.
 * Tabelas: gt_agenda e gt_agenda_ciencias.
 */
(function(window){
  'use strict';
  if(window.SIGEE_TERRITORIAL_AGENDA_SERVICE) return;

  const TABELA='gt_agenda';
  const TABELA_CIENCIA='gt_agenda_ciencias';

  function cliente(){
    try{return window.SIGEE_SUPABASE?.criarCliente?.() || window.SIGEE_SUPABASE_CLIENT || null;}catch(_){return null;}
  }
  function usuario(){return window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null;}
  function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil) || window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil) || String(usuario()?.perfil||'');}
  function master(){return perfil()==='Master';}
  function nteNumero(valor){return window.SIGEE_TERRITORIAL_DATA?.numeroNte?.(valor) || null;}
  function nteUsuario(){const u=usuario()||{}; return nteNumero(u.nte_id ?? u.nte ?? u.nte_nome);}
  function erroBanco(error){
    const msg=String(error?.message||error||'Erro desconhecido');
    const code=String(error?.code||'');
    // Somente erros reais de tabela/relação ausente devem ser traduzidos como schema ausente.
    // Antes, qualquer mensagem contendo "gt_agenda" era mascarada, inclusive erros de coluna, tipo ou constraint.
    if(code==='42P01' || code==='PGRST205' || /relation [\"']?(public\.)?gt_agenda[\"']? does not exist/i.test(msg)) {
      const e=new Error('A Agenda Institucional não foi localizada pela API do Supabase. As tabelas gt_agenda/gt_agenda_ciencias devem existir e estar expostas no schema public.');
      e.code='GT02_SCHEMA_AUSENTE';
      e.cause=error;
      throw e;
    }
    const detalhe=[error?.details,error?.hint].filter(Boolean).join(' | ');
    const e=new Error(`Falha ao gravar/consultar a Agenda no Supabase: ${msg}${detalhe?` — ${detalhe}`:''}`);
    e.code=code||'GT_AGENDA_DB_ERROR';
    e.cause=error;
    throw e;
  }
  function sanitizarNtes(ntes){
    return [...new Set((Array.isArray(ntes)?ntes:[]).map(Number).filter(n=>n>=1&&n<=27))].sort((a,b)=>a-b);
  }
  function autor(){
    const u=usuario()||{};
    return {criado_por_id:u.id||null,criado_por_nome:u.nome||u.name||'',criado_por_email:String(u.email||'').toLowerCase()||null};
  }

  async function listar(filtros={}){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    let q=c.from(TABELA).select('*').order('inicio',{ascending:true});
    if(filtros.situacao) q=q.eq('situacao',filtros.situacao);
    if(filtros.tipo) q=q.eq('tipo',filtros.tipo);
    if(filtros.nte) q=q.contains('ntes',[Number(filtros.nte)]);
    const {data,error}=await q; if(error) erroBanco(error); return data||[];
  }

  async function salvar(payload){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const registro={
      tipo:String(payload.tipo||'OUTRA').toUpperCase(),
      titulo:String(payload.titulo||'').trim(),
      inicio:payload.inicio,
      fim:payload.fim||payload.inicio,
      modalidade:String(payload.modalidade||'PRESENCIAL').toUpperCase(),
      local:String(payload.local||'').trim()||null,
      motivo:String(payload.motivo||'').trim()||null,
      objetivo:String(payload.objetivo||'').trim()||null,
      pauta:String(payload.pauta||'').trim()||null,
      situacao:String(payload.situacao||'AGENDADO').toUpperCase(),
      prioridade:String(payload.prioridade||'NORMAL').toUpperCase(),
      observacoes:String(payload.observacoes||'').trim()||null,
      comunicar_ntes:payload.comunicar_ntes===true,
      ntes:sanitizarNtes(payload.ntes),
      updated_at:new Date().toISOString()
    };
    if(!registro.titulo) throw new Error('Informe o título da atividade.');
    if(!registro.inicio) throw new Error('Informe a data e hora de início.');
    if(!registro.ntes.length) throw new Error('Selecione ao menos um NTE relacionado.');
    let r;
    if(payload.id){
      r=await c.from(TABELA).update(registro).eq('id',payload.id).select('*').single();
    }else{
      Object.assign(registro,autor());
      r=await c.from(TABELA).insert(registro).select('*').single();
    }
    if(r.error) erroBanco(r.error);
    try{window.registrarLog?.(`${payload.id?'Atualizou':'Cadastrou'} agenda institucional: ${registro.titulo}`,'',{modulo:'gestao_territorial'});}catch(_){ }
    document.dispatchEvent(new CustomEvent('sigee:gt-agenda-atualizada',{detail:{registro:r.data}}));
    return r.data;
  }

  async function excluir(id){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const {error}=await c.from(TABELA).delete().eq('id',id); if(error) erroBanco(error);
    try{window.registrarLog?.(`Excluiu atividade da Agenda Institucional #${id}`,'',{modulo:'gestao_territorial'});}catch(_){ }
    document.dispatchEvent(new CustomEvent('sigee:gt-agenda-atualizada',{detail:{id,excluido:true}}));
    return true;
  }

  async function notificacoesUsuario(){
    const u=usuario(); const nte=nteUsuario();
    if(!u?.email || !nte || master()) return [];
    const c=cliente(); if(!c) return [];
    const limite=new Date(Date.now()-14*86400000).toISOString();
    let q=c.from(TABELA).select('*').eq('comunicar_ntes',true).contains('ntes',[nte]).gte('fim',limite).order('inicio',{ascending:true});
    const {data,error}=await q; if(error){try{erroBanco(error);}catch(e){console.warn('[GT-02]',e.message);} return [];}
    const eventos=data||[]; if(!eventos.length) return [];
    const ids=eventos.map(x=>x.id);
    const ciencias=await c.from(TABELA_CIENCIA).select('*').in('agenda_id',ids).eq('usuario_email',String(u.email).toLowerCase());
    if(ciencias.error){console.warn('[GT-02] Falha ao carregar ciências:',ciencias.error.message);return eventos.map(e=>({...e,ciencia:null}));}
    const mapa=new Map((ciencias.data||[]).map(x=>[String(x.agenda_id),x]));
    return eventos.map(e=>({...e,ciencia:mapa.get(String(e.id))||null}));
  }

  async function marcarVisualizado(agendaId){
    const u=usuario(); const nte=nteUsuario(); const c=cliente(); if(!u?.email||!nte||!c) return false;
    const payload={agenda_id:agendaId,nte_numero:nte,usuario_id:u.id||null,usuario_nome:u.nome||'',usuario_email:String(u.email).toLowerCase(),visualizado_at:new Date().toISOString()};
    const {error}=await c.from(TABELA_CIENCIA).upsert(payload,{onConflict:'agenda_id,usuario_email'}); if(error) console.warn('[GT-02] Visualização não registrada:',error.message);
    return !error;
  }

  async function confirmarCiencia(agendaId){
    const u=usuario(); const nte=nteUsuario(); const c=cliente(); if(!u?.email||!nte||!c) return false;
    const agora=new Date().toISOString();
    const payload={agenda_id:agendaId,nte_numero:nte,usuario_id:u.id||null,usuario_nome:u.nome||'',usuario_email:String(u.email).toLowerCase(),visualizado_at:agora,ciencia_at:agora};
    const {error}=await c.from(TABELA_CIENCIA).upsert(payload,{onConflict:'agenda_id,usuario_email'}); if(error) erroBanco(error);
    return true;
  }

  window.SIGEE_TERRITORIAL_AGENDA_SERVICE=Object.freeze({listar,salvar,excluir,notificacoesUsuario,marcarVisualizado,confirmarCiencia,nteUsuario,master,versao:'GT-04.0'});
})(window);
