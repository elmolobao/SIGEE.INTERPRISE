/* ================================================================
   SIGEE Enterprise 1.0.2 — PATCH 001F1 Dashboard — Colunas Reais da Tabela Processos
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
  let valoresEstruturaisEsperados={};
  let restaurandoDashboard=false;
  let observadorDashboard=null;

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
      const anterior=sel.value||window.filtroDashboardNteAtualSIGEE||'TODOS';
      sel.innerHTML='<option value="TODOS">Todos os NTEs</option>';
      for(let i=1;i<=27;i++)sel.insertAdjacentHTML('beforeend',`<option value="${i}">${nteLabel(i)}</option>`);
      sel.value=[...sel.options].some(o=>o.value===String(anterior))?String(anterior):'TODOS';
      window.filtroDashboardNteAtualSIGEE=sel.value;

      /*
       * O app.js possui handlers antigos ligados ao mesmo select.
       * O listener em captura impede que eles regravem os cartões com
       * o recorte local de 500 escolas.
       */
      if(!sel.dataset.dashboardAutoritativo){
        sel.addEventListener('change',event=>{
          event.stopImmediatePropagation();
          window.filtroDashboardNteAtualSIGEE=sel.value;
          metricasEscolasCache.clear();
          agendar();
        },true);
        sel.dataset.dashboardAutoritativo='1';
      }
      sel.onchange=null;
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
    return window.SIGEE_CONFIG?.supabase?.tabelas?.escolas
      || window.SIGEE_SUPABASE_TABELAS?.escolas
      || 'escolas_sigee';
  }

  async function contarExatoEscolas(alvo,tipo='TOTAL'){
    const chave=`${alvo||'GLOBAL'}:${tipo}`;
    const salvo=metricasEscolasCache.get(chave);
    if(salvo&&Date.now()-salvo.em<30000)return salvo.valor;

    const c=supabaseClient();
    if(!c)throw new Error('Cliente Supabase indisponível.');

    let q=c.from(tabelaEscolas()).select('id',{count:'exact',head:true});
    if(alvo)q=q.eq('nte_id',Number(alvo));

    if(tipo==='ACERVO_RECOLHIDO'){
      /*
       * A base possui registros em status_acervo e/ou acervo.
       * "recolhido%" evita contar "Não Recolhido".
       */
      q=q.or([
        'status_acervo.ilike.recolhido%',
        'acervo.ilike.recolhido%'
      ].join(','));
    }

    if(tipo==='ESTADUAL'){
      q=q.ilike('dependencia_adm','%estadual%');
    }

    const {count,error}=await q;
    if(error)throw error;

    const valor=Number(count||0);
    metricasEscolasCache.set(chave,{valor,em:Date.now()});
    return valor;
  }

  async function obterMetricasEscolas(alvo){
    const [total,recolhidos,estaduais]=await Promise.all([
      contarExatoEscolas(alvo,'TOTAL'),
      contarExatoEscolas(alvo,'ACERVO_RECOLHIDO'),
      contarExatoEscolas(alvo,'ESTADUAL')
    ]);
    return {total,recolhidos,estaduais};
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

  async function buscarPaginado(tabela,colunas,configurar){
    const c=supabaseClient();
    if(!c)return [];
    const pagina=1000;
    let inicio=0,resultado=[];
    while(true){
      let q=c.from(tabela).select(colunas).range(inicio,inicio+pagina-1);
      if(typeof configurar==='function')q=configurar(q);
      const {data,error}=await q;
      if(error)throw error;
      const lote=data||[];
      resultado.push(...lote);
      if(lote.length<pagina)break;
      inicio+=pagina;
      if(inicio>=50000)break;
    }
    return resultado;
  }

  async function obterHistoricoPendencias(){
    if(historicoPendenciasCache&&Date.now()-historicoCacheEm<60000)return historicoPendenciasCache;
    try{
      const dados=await buscarPaginado(
        'historico_processos',
        'processo_id,nte,etapa,acao,created_at',
        q=>q.or('etapa.ilike.%Pend%,acao.ilike.%Pend%').order('created_at',{ascending:false})
      );
      historicoPendenciasCache=dados;
      historicoCacheEm=Date.now();
      return dados;
    }catch(e){
      console.warn('[SIGEE Dashboard] Histórico de pendências indisponível:',e);
      return [];
    }
  }

  async function carregarProcessosParaPendencias(ids){
    const unicos=[...new Set((ids||[]).filter(v=>v!==null&&v!==undefined).map(String))];
    if(!unicos.length)return [];
    const c=supabaseClient();
    if(!c)return [];
    const resultado=[];
    for(let i=0;i<unicos.length;i+=200){
      const lote=unicos.slice(i,i+200);
      try{
        const {data,error}=await c.from('processos')
          .select('id,escola_nome,escola_id,nte')
          .in('id',lote);
        if(error)throw error;
        resultado.push(...(data||[]));
      }catch(e){
        console.warn('[SIGEE Dashboard] Falha ao localizar escolas dos processos pendentes:',e);
      }
    }
    return resultado;
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
    const idsHistorico=hist.map(h=>h.processo_id);
    const processosHistoricos=await carregarProcessosParaPendencias(idsHistorico);
    const processoMap=new Map([
      ...processosTodos.map(p=>[String(p.id),p]),
      ...processosHistoricos.map(p=>[String(p.id),p])
    ]);

    let eventos=hist.filter(h=>{
      const p=processoMap.get(String(h.processo_id));
      if(!p)return false;
      if(alvo&&nteId(p)!==Number(alvo))return false;
      return noPeriodo(dataValida(h.created_at),periodo);
    });

    if(!eventos.length){
      eventos=processos
        .filter(p=>etapa(p)==='PENDENCIA'||p.pendencia_aberta)
        .map(p=>({processo_id:p.id,created_at:p.data_etapa_atual||p.updated_at||p.created_at}));
    }

    const recorrencias=topPor(
      eventos,
      h=>nomeEscola(processoMap.get(String(h.processo_id))||{})
    );
    renderizarTop10('dash-ger-pendencias-escolas',recorrencias);
  }

  async function carregar(){
    if(!usuario())return;
    configurarFiltroNte();
    const alvo=filtroNte();
    const escolas=porNte(window.escolasDB||[],alvo);
    const processos=porNte(window.processosDB||[],alvo);
    let metricasEscolas;
    try{
      metricasEscolas=await obterMetricasEscolas(alvo);
    }catch(e){
      console.error('[SIGEE Dashboard] Falha nas contagens exatas:',e);
      metricasEscolas={
        total:Number((document.getElementById('dash-escolas')?.textContent||'').replace(/\D/g,''))||0,
        recolhidos:Number((document.getElementById('dash-acervos')?.textContent||'').replace(/\D/g,''))||0,
        estaduais:Number((document.getElementById('dash-estaduais')?.textContent||'').replace(/\D/g,''))||0
      };
    }

    valoresEstruturaisEsperados={
      'dash-escolas':metricasEscolas.total.toLocaleString('pt-BR'),
      'dash-acervos':metricasEscolas.recolhidos.toLocaleString('pt-BR'),
      'dash-estaduais':metricasEscolas.estaduais.toLocaleString('pt-BR')
    };
    Object.entries(valoresEstruturaisEsperados).forEach(([id,valor])=>setText(id,valor));
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
    instalarProtecaoContraSobrescrita();
  }

  function instalarProtecaoContraSobrescrita(){
    if(observadorDashboard)return;
    const ids=['dash-escolas','dash-acervos','dash-estaduais'];
    const elementos=ids.map(id=>document.getElementById(id)).filter(Boolean);
    if(!elementos.length)return;

    observadorDashboard=new MutationObserver(()=>{
      if(restaurandoDashboard||!Object.keys(valoresEstruturaisEsperados).length)return;
      const divergente=Object.entries(valoresEstruturaisEsperados).some(([id,esperado])=>{
        const atual=document.getElementById(id)?.textContent?.trim();
        return atual!==String(esperado);
      });
      if(divergente){
        restaurandoDashboard=true;
        setTimeout(()=>{
          Object.entries(valoresEstruturaisEsperados).forEach(([id,valor])=>setText(id,valor));
          restaurandoDashboard=false;
        },0);
      }
    });
    elementos.forEach(el=>observadorDashboard.observe(el,{childList:true,characterData:true,subtree:true}));
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

  function publicarFuncoesAutoritativas(){
    window.carregarDadosDashboardReal=agendar;
    window.carregarDadosDashboardRealImediato=carregar;
    window.inicializarFiltroDashboardMasterSIGEE=configurarFiltroNte;
    try{
      carregarDadosDashboardReal=agendar;
      carregarDadosDashboardRealImediato=carregar;
    }catch(e){}
  }
  publicarFuncoesAutoritativas();

  const navAnterior=window.navegar;
  window.navegar=function(aba){const r=typeof navAnterior==='function'?navAnterior.apply(this,arguments):undefined;if(aba==='painel')agendar();return r;};
  try{navegar=window.navegar}catch(e){}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    publicarFuncoesAutoritativas();
    configurarPeriodo();
    agendar();
  });
  else {
    publicarFuncoesAutoritativas();
    configurarPeriodo();
    agendar();
  }
  setInterval(publicarFuncoesAutoritativas,2000);
})();


/* =====================================================================
   SIGEE Sprint 2.4.3B — Renderizador Unificado do Dashboard e CIG
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_ANALYTICS_RENDERER_243B__)return;
  window.__SIGEE_ANALYTICS_RENDERER_243B__=true;

  const txt=v=>v==null?'':String(v).trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  let timer=null,ultimoResultado=null;

  function dataIndicador(v){
    if(!v)return null;
    if(v instanceof Date)return Number.isNaN(v.getTime())?null:v;
    const s=txt(v),br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const d=br?new Date(Number(br[3]),Number(br[2])-1,Number(br[1])):new Date(s);
    return Number.isNaN(d.getTime())?null:d;
  }
  function nteIndicador(p){
    const bruto=txt(p?.nte_id??p?.nte??p?.nte_nome??p?.grupo??p?.territorio);
    const m=bruto.match(/\d{1,2}/); return m?Number(m[0]):null;
  }
  function periodoIndicadores(){
    const tipo=document.getElementById('filtro-dashboard-periodo')?.value||'ACUMULADO';
    const fim=new Date();fim.setHours(23,59,59,999);let inicio=null;
    if(tipo==='HOJE'){inicio=new Date();inicio.setHours(0,0,0,0)}
    else if(tipo==='ONTEM'){inicio=new Date(Date.now()-86400000);inicio.setHours(0,0,0,0);fim.setTime(inicio.getTime());fim.setHours(23,59,59,999)}
    else if(tipo==='7_DIAS'){inicio=new Date(Date.now()-6*86400000);inicio.setHours(0,0,0,0)}
    else if(tipo==='30_DIAS'){inicio=new Date(Date.now()-29*86400000);inicio.setHours(0,0,0,0)}
    else if(tipo==='MES_ATUAL')inicio=new Date(fim.getFullYear(),fim.getMonth(),1);
    else if(tipo==='MES_ANTERIOR'){inicio=new Date(fim.getFullYear(),fim.getMonth()-1,1);fim.setTime(new Date(fim.getFullYear(),fim.getMonth(),0,23,59,59,999).getTime())}
    else if(tipo==='ANO_ATUAL')inicio=new Date(fim.getFullYear(),0,1);
    else if(tipo==='PERSONALIZADO'){
      const i=document.getElementById('dashboard-data-inicial')?.value,f=document.getElementById('dashboard-data-final')?.value;
      if(i)inicio=new Date(i+'T00:00:00');if(f)fim.setTime(new Date(f+'T23:59:59.999').getTime());
    }
    return {tipo,inicio,fim};
  }
  function dentroIndicador(d,p){return !!d&&(p.tipo==='ACUMULADO'||(!p.inicio||d>=p.inicio)&&(!p.fim||d<=p.fim))}
  function dataArquivoRecebido(p){
    const direta=dataIndicador(p?.arquivo_recebido_em||p?.data_arquivo_recebido||p?.pasta_localizada_em);
    if(direta)return direta;
    const msg=txt(p?.ultima_mensagem_workflow);
    let m=msg.match(/^ARQUIVO_RECEBIDO\|[^|]+\|(.+)$/i);if(m)return dataIndicador(m[1]);
    m=msg.match(/^PASTA_LOCALIZADA\|(.+)$/i);if(m)return dataIndicador(m[1]);
    return null;
  }
  function diasBaseIndicador(datas,periodo){
    if(periodo.inicio&&periodo.fim)return Math.max(1,Math.floor((periodo.fim-periodo.inicio)/86400000)+1);
    if(!datas.length)return 1;
    const primeira=new Date(Math.min(...datas.map(d=>d.getTime())));primeira.setHours(0,0,0,0);
    const fim=periodo.fim||new Date();fim.setHours(23,59,59,999);
    return Math.max(1,Math.floor((fim-primeira)/86400000)+1);
  }
  function calcularIndicadoresDiarios(){
    let processos=Array.isArray(window.processosDB)?window.processosDB.slice():[];
    const filtro=txt(document.getElementById('filtro-dashboard-nte')?.value||'TODOS');
    const alvo=/^(TODOS|GLOBAL)?$/i.test(filtro)?null:Number((filtro.match(/\d{1,2}/)||[])[0]||0)||null;
    if(alvo)processos=processos.filter(p=>nteIndicador(p)===alvo);
    const periodo=periodoIndicadores();
    const aberturas=processos.map(p=>dataIndicador(p.data_solicitacao||p.data_abertura||p.created_at||p.criado_em)).filter(d=>dentroIndicador(d,periodo));
    const recebimentos=processos.map(dataArquivoRecebido).filter(d=>dentroIndicador(d,periodo));
    return {
      pedidosDia:aberturas.length/diasBaseIndicador(aberturas,periodo),
      arquivosDia:recebimentos.length/diasBaseIndicador(recebimentos,periodo)
    };
  }

  function garantirCIG(){
    const aba=document.getElementById('aba-painel');
    if(!aba||document.getElementById('sigee-cig'))return;
    const sec=document.createElement('section');
    sec.id='sigee-cig';
    sec.className='sigee-cig';
    sec.innerHTML=`
      <div class="sigee-cig-head">
        <div><span>CENTRO DE INTELIGÊNCIA GERENCIAL</span><h2>Visão Executiva do SIGEE</h2><p>Indicadores consolidados para acompanhamento operacional e tomada de decisão.</p></div>
        <div class="sigee-cig-status"><i></i><div><strong>Dados sincronizados</strong><span id="cig-atualizado">Aguardando...</span></div></div>
      </div>
      <div class="sigee-cig-alertas" id="cig-alertas"></div>
      <div class="sigee-cig-kpis">
        ${['ativos','media','sla','vencidos','concluidos','produtividade'].map(id=>`<article class="sigee-cig-kpi" data-kpi="${id}"><div class="sigee-cig-kpi-top"><span data-label></span><b data-icon></b></div><strong data-valor>—</strong><small data-sub>Calculando...</small></article>`).join('')}
      </div>
      <div class="sigee-cig-grid">
        <article class="sigee-cig-card"><header><div><span>FLUXO OPERACIONAL</span><h3>Gargalos por etapa</h3></div><b id="cig-total-ativos">0 ativos</b></header><div id="cig-gargalos"></div></article>
        <article class="sigee-cig-card"><header><div><span>DESEMPENHO</span><h3>Produtividade técnica</h3></div></header><div id="cig-tecnicos" class="sigee-cig-ranking"></div></article>
        <article class="sigee-cig-card"><header><div><span>VISÃO TERRITORIAL</span><h3>Demanda por NTE</h3></div></header><div id="cig-ntes" class="sigee-cig-ranking"></div></article>
        <article class="sigee-cig-card"><header><div><span>DEMANDA INSTITUCIONAL</span><h3>Escolas mais solicitadas</h3></div></header><div id="cig-escolas" class="sigee-cig-ranking"></div></article>
      </div>`;
    const welcome=aba.querySelector('.sigee-welcome-strip');
    welcome?.insertAdjacentElement('afterend',sec);
  }

  function topHtml(dados){
    return (dados||[]).slice(0,10).map(([nome,q],i)=>`<div class="flex justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0"><span class="min-w-0 truncate" title="${esc(nome)}">${i+1}. ${esc(nome)}</span><strong class="shrink-0">${q.toLocaleString('pt-BR')}</strong></div>`).join('')||'Sem dados';
  }
  function ranking(id,dados){
    const box=document.getElementById(id);if(!box)return;
    const top=(dados||[]).slice(0,8),max=Math.max(1,...top.map(x=>x[1]));
    box.innerHTML=top.map(([nome,q],i)=>`<div class="sigee-cig-rank"><span class="pos">${i+1}</span><div class="dados"><div><strong title="${esc(nome)}">${esc(nome)}</strong><b>${q}</b></div><i><em style="width:${Math.max(5,q/max*100)}%"></em></i></div></div>`).join('')||'<p class="sigee-cig-vazio">Sem dados no período</p>';
  }
  function barras(id,dados,total){
    const box=document.getElementById(id);if(!box)return;
    box.innerHTML=(dados||[]).slice(0,8).map(([nome,q])=>{const pct=total?q/total*100:0;return `<div class="sigee-cig-barra"><div><strong>${esc(nome)}</strong><span>${q} • ${pct.toFixed(1)}%</span></div><i><em style="width:${pct}%"></em></i></div>`}).join('')||'<p class="sigee-cig-vazio">Não há processos ativos.</p>';
  }
  function kpi(id,label,icon,valor,sub,estado='normal'){
    const card=document.querySelector(`[data-kpi="${id}"]`);if(!card)return;
    card.querySelector('[data-label]').textContent=label;
    card.querySelector('[data-icon]').textContent=icon;
    card.querySelector('[data-valor]').textContent=valor;
    card.querySelector('[data-sub]').textContent=sub;
    card.dataset.estado=estado;
  }

  function iniciarTransicao(){
    const aviso=document.getElementById('sigee-dashboard-atualizando');
    if(aviso){aviso.textContent='Atualizando dados do filtro selecionado...';aviso.classList.add('visivel')}
    document.querySelectorAll('#aba-painel [id^="dash-"], #sigee-cig').forEach(x=>x.classList.add('sigee-dados-atualizando'));
  }
  function finalizarTransicao(){
    document.querySelectorAll('.sigee-dados-atualizando').forEach(x=>x.classList.remove('sigee-dados-atualizando'));
    document.getElementById('sigee-dashboard-atualizando')?.classList.remove('visivel');
  }

  function render(r){
    garantirCIG();
    ultimoResultado=r;
    requestAnimationFrame(()=>{
      const escolas=topHtml(r.porEscola);
      const boxTec=document.getElementById('dash-tec-top-escolas');if(boxTec)boxTec.innerHTML=escolas;
      const boxGer=document.getElementById('dash-ger-escola-demanda');if(boxGer)boxGer.innerHTML=escolas;
      set('dash-tec-media-entrega',`${r.mediaAtendimento.toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);
      const diarios=calcularIndicadoresDiarios();
      set('dash-tec-media-pedidos-dia',diarios.pedidosDia.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}));
      set('dash-tec-media-pasta-dia',diarios.arquivosDia.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}));

      kpi('ativos','Processos ativos','◉',r.ativos.toLocaleString('pt-BR'),'Em tramitação');
      kpi('media','Tempo médio','◷',`${r.mediaAtendimento.toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`,'Processos concluídos');
      kpi('sla','SLA operacional','◎',`${r.sla.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`,'Dentro do prazo',r.sla<80?'alerta':'normal');
      kpi('vencidos','Processos vencidos','⚠',r.vencidos.toLocaleString('pt-BR'),'Exigem atenção',r.vencidos?'critico':'normal');
      kpi('concluidos','Concluídos no período','✓',r.concluidosPeriodo.toLocaleString('pt-BR'),'Entregas registradas');
      kpi('produtividade','Produtividade','↗',`${r.concluidosPeriodo.toLocaleString('pt-BR')} entregas`,'Período selecionado');

      const alertas=document.getElementById('cig-alertas');
      if(alertas)alertas.innerHTML=[
        r.vencidos?`<div class="critico"><b>⚠</b><span>${r.vencidos} processo(s) fora do prazo</span></div>`:'',
        r.proximosVencimento?`<div class="alerta"><b>◷</b><span>${r.proximosVencimento} vencem em até 2 dias</span></div>`:'',
        r.sla<80?`<div class="critico"><b>↓</b><span>SLA abaixo de 80% (${r.sla.toFixed(1)}%)</span></div>`:'',
        !r.vencidos&&!r.proximosVencimento&&r.sla>=80?`<div class="ok"><b>✓</b><span>Operação dentro dos parâmetros gerenciais</span></div>`:''
      ].join('');

      set('cig-total-ativos',`${r.ativos.toLocaleString('pt-BR')} ativos`);
      set('cig-atualizado',`Atualizado em ${new Date(r.atualizadosEm).toLocaleString('pt-BR')}`);
      barras('cig-gargalos',r.porEtapa,r.ativos);
      ranking('cig-tecnicos',r.porTecnico);
      ranking('cig-ntes',r.porNte);
      ranking('cig-escolas',r.porEscola);
      finalizarTransicao();
    });
  }

  function atualizar(){
    if(!window.SIGEE_Analytics)return;
    render(window.SIGEE_Analytics.calcularDashboard());
  }
  function agendar(){
    clearTimeout(timer);
    timer=setTimeout(atualizar,120);
  }

  document.addEventListener('change',e=>{
    if(['filtro-dashboard-nte','filtro-dashboard-periodo','dashboard-data-inicial','dashboard-data-final'].includes(e.target?.id)){
      iniciarTransicao();
      agendar();
    }
  },true);
  window.addEventListener('sigee:analytics-dados-alterados',agendar);
  window.addEventListener('load',()=>setTimeout(agendar,500));
  window.atualizarDashboardPeloMotorSIGEE=agendar;
  console.info('[SIGEE] Dashboard e CIG integrados ao Motor 2.4.3B.');
})();

