/* ================================================================
   SIGEE Enterprise 1.0.2 — PATCH 001 Dashboard
   Fonte autoritativa do Dashboard. Este arquivo deve carregar depois
   de app.js e logs.js para impedir sobrescritas por rotinas legadas.
   ================================================================ */
(function(){
  'use strict';

  const texto=v=>v===null||v===undefined?'':String(v).trim();
  const normalizar=v=>texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const digitos=v=>texto(v).match(/\d{1,2}/)?.[0]||'';
  const dataValida=v=>{ if(!v)return null; const d=new Date(v); return Number.isNaN(d.getTime())?null:d; };
  const nteLabel=id=>`NTE-${String(id).padStart(2,'0')}`;
  let timer=null, historicoPendenciasCache=null, historicoCacheEm=0;
  let metricasEscolasCache=new Map();

  function usuario(){ return window.usuarioLogado||null; }
  function perfil(){
    const p=normalizar(usuario()?.perfil);
    if(p.includes('MASTER'))return 'Master';
    if(p==='SEC'||p.includes('SECRETARIA'))return 'SEC';
    if(p.includes('ADMIN'))return 'Administrador';
    if(p.includes('CONSULT'))return 'Consulta';
    if(p.includes('ESTAG'))return 'Estagiario';
    return 'Tecnico';
  }
  function global(){ return ['Master','SEC'].includes(perfil()); }
  function nteId(obj){
    if(!obj)return null;
    const direto=obj.nte_id??obj.nteId;
    if(direto!==null&&direto!==undefined&&texto(direto)!=='')return Number(direto)||null;
    return Number(digitos(obj.nte??obj.nte_nome??obj.grupo??obj.territorio))||null;
  }
  function nteUsuario(){ return nteId(usuario()); }
  function filtroNte(){
    if(!global())return nteUsuario();
    const v=texto(document.getElementById('filtro-dashboard-nte')?.value||'TODOS');
    if(!v||['TODOS','GLOBAL'].includes(normalizar(v)))return null;
    return Number(digitos(v))||null;
  }
  function porNte(lista,alvo=filtroNte()){
    const arr=Array.isArray(lista)?lista:[];
    if(!alvo)return arr;
    return arr.filter(x=>nteId(x)===Number(alvo));
  }
  function setText(id,v){ const el=document.getElementById(id); if(el)el.textContent=v; }
  function setHtml(id,v){ const el=document.getElementById(id); if(el)el.innerHTML=v; }

  function configurarFiltroNte(){
    const box=document.getElementById('box-filtro-dashboard-master');
    const sel=document.getElementById('filtro-dashboard-nte');
    const contexto=document.getElementById('dashboard-contexto-nte');
    if(!sel||!usuario())return;
    if(global()){
      box?.classList.remove('hidden');
      const anterior=sel.value||'TODOS';
      sel.innerHTML='<option value="TODOS">Todos os NTEs</option>';
      for(let i=1;i<=27;i++)sel.insertAdjacentHTML('beforeend',`<option value="${i}">${nteLabel(i)}</option>`);
      sel.value=[...sel.options].some(o=>o.value===anterior)?anterior:'TODOS';
      sel.onchange=()=>agendar();
      if(contexto)contexto.textContent=sel.value==='TODOS'?'Todos os NTEs':nteLabel(Number(sel.value));
    }else{
      box?.classList.add('hidden');
      if(contexto)contexto.textContent=nteUsuario()?`${nteLabel(nteUsuario())} (acesso vinculado)`:'NTE de cadastro';
    }
  }

  function periodoSelecionado(){
    const tipo=document.getElementById('filtro-dashboard-periodo')?.value||'ACUMULADO';
    const agora=new Date(); agora.setHours(23,59,59,999);
    let inicio=null,fim=null;
    const inicioDia=d=>{d.setHours(0,0,0,0);return d};
    if(tipo==='HOJE'){ inicio=inicioDia(new Date()); fim=agora; }
    else if(tipo==='ONTEM'){ inicio=inicioDia(new Date(Date.now()-86400000)); fim=new Date(inicio);fim.setHours(23,59,59,999); }
    else if(tipo==='7_DIAS'){ inicio=inicioDia(new Date(Date.now()-6*86400000)); fim=agora; }
    else if(tipo==='30_DIAS'){ inicio=inicioDia(new Date(Date.now()-29*86400000)); fim=agora; }
    else if(tipo==='MES_ATUAL'){ inicio=new Date(agora.getFullYear(),agora.getMonth(),1); fim=agora; }
    else if(tipo==='MES_ANTERIOR'){ inicio=new Date(agora.getFullYear(),agora.getMonth()-1,1); fim=new Date(agora.getFullYear(),agora.getMonth(),0,23,59,59,999); }
    else if(tipo==='ANO_ATUAL'){ inicio=new Date(agora.getFullYear(),0,1); fim=agora; }
    else if(tipo==='PERSONALIZADO'){
      const i=document.getElementById('dashboard-data-inicial')?.value;
      const f=document.getElementById('dashboard-data-final')?.value;
      if(i)inicio=new Date(i+'T00:00:00');
      if(f)fim=new Date(f+'T23:59:59.999');
    }
    return {tipo,inicio,fim};
  }
  function dataAbertura(p){ return dataValida(p.data_solicitacao||p.data_abertura||p.created_at||p.criado_em); }
  function dataConclusao(p){ return dataValida(p.finalizado_em||p.data_conclusao||p.deferido_em||p.updated_at); }
  function noPeriodo(data,periodo){
    if(periodo.tipo==='ACUMULADO')return true;
    if(!data)return false;
    if(periodo.inicio&&data<periodo.inicio)return false;
    if(periodo.fim&&data>periodo.fim)return false;
    return true;
  }
  function processosGerenciais(processos,periodo){ return processos.filter(p=>noPeriodo(dataAbertura(p),periodo)); }

  function acervoRecolhido(e){
    const v=normalizar(e.status_acervo||e.acervo||'');
    return v==='RECOLHIDO'||v.startsWith('RECOLHIDO -')||v.startsWith('RECOLHIDO/');
  }
  function dependenciaEstadual(e){ return normalizar(e.dependencia_adm||e.dependencia||'').includes('ESTADUAL'); }
  function etapa(p){ return normalizar(p.etapa_atual||p.etapa||p.fase_atual||''); }
  function ehDesarquivamento(p){
    const cod=normalizar(p.etapa_codigo||'');
    if(['DES','RET','REU','CFD','PAS'].includes(cod))return true;
    const e=etapa(p);
    return ['DESARQUIVAMENTO','REITERACAO','REITERACAO COM URGENCIA','REITERACAO URGENTE','CONFIRMACAO DOS DADOS DA BUSCA','CONFIRMAR DADOS DA BUSCA','PEDIDO DE ATAS SEM PASTA'].includes(e);
  }
  function nomeEscola(p){ return texto(p.escola_nome||p.escola||p.nome_escola||p.instituicao||'Não informada'); }

  function municipiosQuantidade(alvo){
    if(!alvo)return Number(window.SIGEE_TOTAL_MUNICIPIOS_BAHIA||417);
    return Number(window.SIGEE_MUNICIPIOS_POR_NTE?.[alvo]||window.obterQuantidadeMunicipiosNTE?.(alvo)||0);
  }

  function usuariosTecnicosAtivos(alvo){
    return porNte(window.usuariosDB||[],alvo).filter(u=>u.ativo!==false&&['TECNICO','ESTAGIARIO'].includes(normalizar(u.perfil))).length;
  }

  function supabaseClient(){
    try { if(typeof window.obterSupabaseSIGEE==='function') return window.obterSupabaseSIGEE(); } catch(e){}
    try { if(window.SIGEE_SUPABASE&&typeof window.SIGEE_SUPABASE.criarCliente==='function') return window.SIGEE_SUPABASE.criarCliente(); } catch(e){}
    return window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||window.__SIGEE_V38_CLIENT||null;
  }
  function tabelaEscolas(){
    return window.SIGEE_CONFIG?.supabase?.tabelas?.escolas||window.SIGEE_SUPABASE_TABELAS?.escolas||'escolas_sigee';
  }
  function aplicarNteQuery(query,alvo){
    return alvo?query.eq('nte_id',Number(alvo)):query;
  }
  async function contarEscolasSupabase(alvo,tipo='TOTAL'){
    const chave=`${alvo||'GLOBAL'}:${tipo}`;
    const salvo=metricasEscolasCache.get(chave);
    if(salvo&&Date.now()-salvo.em<60000)return salvo.valor;
    const c=supabaseClient();
    if(!c)return null;
    try{
      let q=c.from(tabelaEscolas()).select('id',{count:'exact',head:true});
      q=aplicarNteQuery(q,alvo);
      if(tipo==='ACERVO_RECOLHIDO') q=q.or('status_acervo.eq.RECOLHIDO,acervo.eq.RECOLHIDO');
      if(tipo==='ESTADUAL') q=q.or('dependencia_adm.ilike.%ESTADUAL%,dependencia.ilike.%ESTADUAL%');
      const {count,error}=await q;
      if(error)throw error;
      const valor=Number(count||0);
      metricasEscolasCache.set(chave,{valor,em:Date.now()});
      return valor;
    }catch(e){
      console.warn(`[SIGEE Dashboard] Contagem ${tipo} indisponível no Supabase:`,e);
      return null;
    }
  }
  async function obterMetricasEscolas(alvo,escolasLocais){
    const [total,recolhidos,estaduais]=await Promise.all([
      contarEscolasSupabase(alvo,'TOTAL'),
      contarEscolasSupabase(alvo,'ACERVO_RECOLHIDO'),
      contarEscolasSupabase(alvo,'ESTADUAL')
    ]);
    return {
      total:total===null?escolasLocais.length:total,
      recolhidos:recolhidos===null?escolasLocais.filter(acervoRecolhido).length:recolhidos,
      estaduais:estaduais===null?escolasLocais.filter(dependenciaEstadual).length:estaduais
    };
  }

  function formatarDias(v){ return `${Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} ${Number(v||0)===1?'dia':'dias'}`; }
  function escaparHtml(v){ return texto(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
  function renderizarTop10(id,registros,vazio='Sem dados'){
    const box=document.getElementById(id);
    if(!box)return;
    const lista=(registros||[]).slice(0,10);
    box.innerHTML=lista.length?lista.map(([nome,quantidade],indice)=>`<div class="flex justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0"><span class="min-w-0 truncate" title="${escaparHtml(nome)}">${indice+1}. ${escaparHtml(nome)}</span><strong class="shrink-0">${Number(quantidade||0).toLocaleString('pt-BR')}</strong></div>`).join(''):vazio;
  }
  function topPor(lista,chave){
    const mapa=new Map();
    lista.forEach(x=>{const k=chave(x);if(!k)return;mapa.set(k,(mapa.get(k)||0)+1)});
    return [...mapa.entries()].sort((a,b)=>b[1]-a[1]);
  }

  async function obterHistoricoPendencias(){
    if(historicoPendenciasCache&&Date.now()-historicoCacheEm<60000)return historicoPendenciasCache;
    const c=window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||window.__SIGEE_V38_CLIENT||null;
    if(!c)return [];
    try{
      const {data,error}=await c.from('historico_processos').select('processo_id,nte,etapa,acao,created_at').or('etapa.ilike.%Pend%,acao.ilike.%Pend%').limit(10000);
      if(error)throw error;
      historicoPendenciasCache=data||[];historicoCacheEm=Date.now();return historicoPendenciasCache;
    }catch(e){console.warn('[SIGEE Dashboard] Histórico de pendências indisponível:',e);return [];}
  }

  async function atualizarGerenciais(processosTodos,alvo){
    const periodo=periodoSelecionado();
    const processos=processosGerenciais(processosTodos,periodo);
    const periodoTexto=document.getElementById('filtro-dashboard-periodo')?.selectedOptions?.[0]?.textContent||'Acumulado';
    setText('dashboard-contexto-periodo',periodoTexto);

    const concluidos=processosTodos.filter(p=>['RETIRADO','INDEFERIDO'].includes(etapa(p))&&noPeriodo(dataConclusao(p),periodo));
    const tempos=concluidos.map(p=>{const a=dataAbertura(p),c=dataConclusao(p);return a&&c?Math.max(0,(c-a)/86400000):null}).filter(v=>v!==null);
    const media=tempos.length?tempos.reduce((a,b)=>a+b,0)/tempos.length:0;
    setText('dash-ger-media-atendimento',formatarDias(media));
    setText('dash-ger-processos-concluidos',concluidos.length);

    const escolas=topPor(processos,nomeEscola);
    renderizarTop10('dash-ger-escola-demanda',escolas);

    const territorios=topPor(processos,p=>{const id=nteId(p);return id?nteLabel(id):''});
    const cardTerr=document.getElementById('card-territorio-demanda');
    if(global()&&!alvo){
      cardTerr?.classList.remove('hidden');
      renderizarTop10('dash-ger-territorio-demanda',territorios);
    } else {
      cardTerr?.classList.add('hidden');
    }

    const hist=await obterHistoricoPendencias();
    const processoMap=new Map(processosTodos.map(p=>[String(p.id),p]));
    let eventos=hist.filter(h=>{
      const p=processoMap.get(String(h.processo_id));
      if(!p)return false;
      if(alvo&&nteId(p)!==Number(alvo))return false;
      return noPeriodo(dataValida(h.created_at),periodo);
    });
    if(!eventos.length){
      eventos=processos.filter(p=>etapa(p)==='PENDENCIA'||p.pendencia_aberta).map(p=>({processo_id:p.id}));
    }
    const recorrencias=topPor(eventos,h=>nomeEscola(processoMap.get(String(h.processo_id))||{}));
    renderizarTop10('dash-ger-pendencias-escolas',recorrencias);
  }

  async function carregar(){
    if(!usuario())return;
    configurarFiltroNte();
    const alvo=filtroNte();
    const escolas=porNte(window.escolasDB||[],alvo);
    const processos=porNte(window.processosDB||[],alvo);
    const metricasEscolas=await obterMetricasEscolas(alvo,escolas);

    setText('dash-escolas',metricasEscolas.total.toLocaleString('pt-BR'));
    setText('dash-acervos',metricasEscolas.recolhidos.toLocaleString('pt-BR'));
    setText('dash-estaduais',metricasEscolas.estaduais.toLocaleString('pt-BR'));
    setText('dash-municipios',municipiosQuantidade(alvo));
    setText('dash-usuarios',usuariosTecnicosAtivos(alvo));

    const contagens={
      'dash-proc-desarquivamento':processos.filter(ehDesarquivamento).length,
      'dash-proc-analise':processos.filter(p=>etapa(p)==='ANALISE').length,
      'dash-proc-pendencia':processos.filter(p=>etapa(p)==='PENDENCIA').length,
      'dash-proc-digitacao':processos.filter(p=>etapa(p)==='DIGITACAO').length,
      'dash-proc-conferencia':processos.filter(p=>etapa(p)==='CONFERENCIA').length,
      'dash-proc-assinatura':processos.filter(p=>etapa(p)==='ASSINATURA').length,
      'dash-proc-aguardando':processos.filter(p=>['AGUARDANDO RETIRADA','DEFERIDO'].includes(etapa(p))).length,
      'dash-proc-retirado':processos.filter(p=>etapa(p)==='RETIRADO').length
    };
    Object.entries(contagens).forEach(([id,v])=>setText(id,v));
    await atualizarGerenciais(processos,alvo);
    setText('dashboard-ultima-atualizacao',new Date().toLocaleString('pt-BR'));
  }

  function configurarPeriodo(){
    const sel=document.getElementById('filtro-dashboard-periodo');
    const box=document.getElementById('dashboard-periodo-personalizado');
    if(!sel)return;
    sel.onchange=()=>{box?.classList.toggle('hidden',sel.value!=='PERSONALIZADO');agendar();};
    document.getElementById('dashboard-data-inicial')?.addEventListener('change',agendar);
    document.getElementById('dashboard-data-final')?.addEventListener('change',agendar);
  }
  function agendar(){ clearTimeout(timer);timer=setTimeout(()=>carregar().catch(console.error),40); }

  window.inicializarFiltroDashboardMasterSIGEE=configurarFiltroNte;
  window.carregarDadosDashboardReal=agendar;
  window.carregarDadosDashboardRealImediato=carregar;

  const navAnterior=window.navegar;
  window.navegar=function(aba){const r=typeof navAnterior==='function'?navAnterior.apply(this,arguments):undefined;if(aba==='painel')agendar();return r;};
  try{navegar=window.navegar}catch(e){}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{configurarPeriodo();agendar();});
  else {configurarPeriodo();agendar();}
})();
