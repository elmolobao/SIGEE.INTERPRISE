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
  function sec(){return String(perfil()).toUpperCase()==='SEC';}
  function global(){return master()||sec();}
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
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const nteRestrito=!global()?nteUsuario():null;
    if(!global()&&!nteRestrito)return [];
    // A API PostgREST limita o tamanho de cada resposta. Buscar apenas a primeira
    // página fazia compromissos posteriores desaparecerem do calendário, embora
    // continuassem visíveis no dossiê (que consulta o NTE individualmente).
    const pagina=500, todos=[];
    for(let inicio=0; ;inicio+=pagina){
      let q=c.from(TABELA).select('*').order('inicio',{ascending:true}).order('id',{ascending:true}).range(inicio,inicio+pagina-1);
      if(nteRestrito)q=q.contains('ntes',[Number(nteRestrito)]);
      if(filtros.situacao)q=q.eq('situacao',filtros.situacao);
      if(filtros.tipo)q=q.eq('tipo',filtros.tipo);
      if(filtros.nte)q=q.contains('ntes',[Number(filtros.nte)]);
      const {data,error}=await q;
      if(error)erroBanco(error);
      todos.push(...(data||[]));
      if(!data||data.length<pagina)break;
    }
    return todos;
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

  // Confirmação posterior à execução; mantém o histórico no próprio registro,
  // sem depender de colunas novas ou duplicar atividades no dossiê.
  async function confirmarExecucao(id,decisao,detalhes={}){
    if(!master())throw new Error('Confirmação restrita ao perfil Master.');
    if(!['REALIZADO','REMARCADO','CANCELADO'].includes(decisao))throw new Error('Decisão inválida.');
    const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');
    const {data:atual,error:erro}=await c.from(TABELA).select('*').eq('id',id).single();
    if(erro)erroBanco(erro);
    if(!['AGENDADO','PLANEJADO','EM_ANDAMENTO','REMARCADO'].includes(atual.situacao))throw new Error('Esta atividade já foi encerrada.');
    const hoje=new Date().toLocaleDateString('en-CA',{timeZone:'America/Bahia'});
    const dataFim=new Date(atual.fim||atual.inicio).toLocaleDateString('en-CA',{timeZone:'America/Bahia'});
    if(hoje<=dataFim)throw new Error('A confirmação estará disponível no dia seguinte ao término da atividade.');
    const justificativa=String(detalhes.justificativa||'').trim();
    if(decisao!=='REALIZADO'&&!justificativa)throw new Error('Informe a justificativa.');
    const alteracoes={situacao:decisao,updated_at:new Date().toISOString()};
    if(decisao==='REMARCADO'){
      const inicio=new Date(detalhes.inicio),fim=new Date(detalhes.fim);
      if(!Number.isFinite(inicio.getTime())||!Number.isFinite(fim.getTime())||fim<inicio||inicio<=new Date())throw new Error('Informe um novo período futuro válido.');
      alteracoes.inicio=inicio.toISOString();alteracoes.fim=fim.toISOString();
    }
    const u=usuario()||{};
    const registro=`[CONFIRMAÇÃO ${new Date().toISOString()}] ${decisao} por ${u.nome||u.email||'Master'}; período anterior: ${atual.inicio} a ${atual.fim}; ${decisao==='REMARCADO'?`novo período: ${alteracoes.inicio} a ${alteracoes.fim}; `:''}justificativa/resultado: ${justificativa||'Execução confirmada'}`;
    alteracoes.observacoes=[atual.observacoes,registro].filter(Boolean).join('\n');
    const {data,error}=await c.from(TABELA).update(alteracoes).eq('id',id).eq('updated_at',atual.updated_at).select('*');
    if(error)erroBanco(error);
    if(!data?.length)throw new Error('A atividade foi alterada por outro usuário. Atualize a agenda.');
    try{window.registrarLog?.(`Confirmação de execução #${id}: ${decisao}`,'',{modulo:'gestao_territorial'});}catch(_){}
    document.dispatchEvent(new CustomEvent('sigee:gt-agenda-atualizada',{detail:{registro:data[0]}}));
    return data[0];
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

  async function listarCiencias(agendaIds=[]){
    if(!master()) throw new Error('Acesso restrito ao perfil Master.');
    const ids=[...new Set((Array.isArray(agendaIds)?agendaIds:[agendaIds]).filter(Boolean).map(String))];
    if(!ids.length) return [];
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const {data,error}=await c.from(TABELA_CIENCIA).select('*').in('agenda_id',ids).order('ciencia_at',{ascending:true,nullsFirst:false});
    if(error) erroBanco(error);
    return data||[];
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

  window.SIGEE_TERRITORIAL_AGENDA_SERVICE=Object.freeze({listar,salvar,confirmarExecucao,excluir,notificacoesUsuario,listarCiencias,marcarVisualizado,confirmarCiencia,nteUsuario,master,sec,global,versao:'GT-05.0'});
})(window);
