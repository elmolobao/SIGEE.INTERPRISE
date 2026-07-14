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
   SIGEE Sprint 2.4.1 — Centro de Inteligência Gerencial
   Motor executivo de indicadores, tendências, SLA e gargalos.
   Camada analítica: não altera processos, workflow ou banco de dados.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_CIG_241__) return;
  window.__SIGEE_CIG_241__=true;

  let ultimaAssinaturaDados='';
  let metricasCache=null;
  let aguardandoDadosDesde=Date.now();

  const NOMES_OFICIAIS_NTE = Object.freeze({
    1:'Irecê',2:'Bom Jesus da Lapa',3:'Seabra',4:'Serrinha',5:'Itabuna',
    6:'Valença',7:'Teixeira de Freitas',8:'Itapetinga',9:'Amargosa',10:'Juazeiro',
    11:'Barreiras',12:'Macaúbas',13:'Caetité',14:'Itaberaba',15:'Ipirá',
    16:'Jacobina',17:'Ribeira do Pombal',18:'Alagoinhas',19:'Feira de Santana',
    20:'Vitória da Conquista',21:'Santo Antônio de Jesus',22:'Jequié',
    23:'Santa Maria da Vitória',24:'Paulo Afonso',25:'Senhor do Bonfim',
    26:'Salvador',27:'Eunápolis'
  });

  const LIMITES = {
    'ANALISE':7,
    'DIGITACAO':15,
    'CONFERENCIA':10,
    'ASSINATURA':7,
    'DESARQUIVAMENTO':30,
    'REITERACAO':38,
    'REITERACAO COM URGENCIA':45,
    'REITERACAO URGENTE':45,
    'CONFIRMACAO DOS DADOS DA BUSCA':52,
    'CONFIRMAR DADOS DA BUSCA':52,
    'PEDIDO DE ATAS SEM PASTA':59
  };

  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const data=v=>{
    if(!v)return null;
    const s=txt(v);
    const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const d=br?new Date(`${br[3]}-${br[2]}-${br[1]}T00:00:00`):new Date(s);
    return Number.isNaN(d.getTime())?null:d;
  };
  const dias=(a,b=new Date())=>{
    const x=data(a),y=data(b)||new Date();
    if(!x)return 0;
    return Math.max(0,(y-x)/86400000);
  };
  const etapa=p=>norm(p?.etapa_atual||p?.etapa||p?.fase_atual||'DESARQUIVAMENTO');
  function nteNumero(p){
    const bruto=txt(p?.nte||p?.nte_nome||p?.grupo||p?.territorio||'');
    const m=bruto.match(/\d{1,2}/);
    return m?Number(m[0]):null;
  }
  function nteCodigo(p){
    const n=nteNumero(p);
    return n?`NTE-${String(n).padStart(2,'0')}`:'NTE não informado';
  }
  function municipioProcesso(p){
    return txt(
      p?.municipio||p?.escola_municipio||p?.municipio_escola||
      p?.cidade||p?.localidade||''
    );
  }
  function nomeTerritorioBruto(p){
    const bruto=txt(p?.nte_nome||p?.territorio_nome||p?.nome_territorio||p?.grupo||p?.nte||'');
    const limpo=bruto
      .replace(/NTE\s*[- ]?\s*\d{1,2}/ig,'')
      .replace(/^\s*[-–—:]\s*/,'')
      .trim();
    if(limpo && !/^\d+$/.test(limpo)) return limpo;
    const numero=nteNumero(p);
    return numero ? (NOMES_OFICIAIS_NTE[numero]||'') : '';
  }
  function complementoTerritorial(p){
    /*
     * Para o padrão institucional combinado, o nome exibido entre
     * parênteses é a sede/nome oficial do NTE. O município da escola
     * fica como fallback somente quando o NTE não puder ser identificado.
     */
    return nomeTerritorioBruto(p)||municipioProcesso(p);
  }
  function nte(p){
    const codigo=nteCodigo(p);
    const complemento=nomeTerritorioBruto(p)||municipioProcesso(p);
    return complemento?`${codigo} (${complemento})`:codigo;
  }
  function tecnicoNome(p){
    return txt(
      p?.tecnico_responsavel_nome||p?.tecnico_responsavel||
      p?.responsavel_nome||p?.responsavel||
      p?.analista_nome||p?.analista||
      p?.digitador_nome||p?.digitador||
      p?.conferente_nome||p?.conferente||
      'Não atribuído'
    );
  }
  function tecnico(p){
    const nome=tecnicoNome(p);
    const codigo=nteCodigo(p);
    const complemento=nomeTerritorioBruto(p);
    return codigo==='NTE não informado'
      ? nome
      : `${nome} - ${codigo}${complemento?` (${complemento})`:''}`;
  }
  function escolaNome(p){
    return txt(p?.escola_nome||p?.escola||p?.nome_escola||p?.instituicao||'Não informada');
  }
  function escola(p){
    const nome=escolaNome(p);
    const codigo=nteCodigo(p);
    const complemento=complementoTerritorial(p);
    return codigo==='NTE não informado'
      ? nome
      : `${nome} - ${codigo}${complemento?` (${complemento})`:''}`;
  }
  const inicio=p=>p?.data_solicitacao||p?.data_abertura||p?.created_at||p?.criado_em;
  const entradaEtapa=p=>p?.data_etapa_atual||p?.prazo_inicio||inicio(p);
  const conclusao=p=>p?.finalizado_em||p?.data_conclusao||p?.deferido_em||p?.updated_at;
  const finalizado=p=>['RETIRADO','INDEFERIDO'].includes(etapa(p));
  const ativos=p=>!finalizado(p);
  const limite=p=>LIMITES[etapa(p)]||null;
  const vencido=p=>ativos(p)&&limite(p)!=null&&dias(entradaEtapa(p))>limite(p);
  const pertoVencer=p=>ativos(p)&&limite(p)!=null&&dias(entradaEtapa(p))>=Math.max(0,limite(p)-2)&&!vencido(p);

  function processosBase(){
    const arr=Array.isArray(window.processosDB)?window.processosDB:[];
    const filtro=document.getElementById('filtro-dashboard-nte')?.value;
    if(!filtro||['TODOS','GLOBAL'].includes(norm(filtro)))return arr.slice();
    const alvo=Number(txt(filtro).match(/\d{1,2}/)?.[0]||0);
    return alvo?arr.filter(p=>Number(txt(p.nte||p.nte_nome||p.grupo).match(/\d{1,2}/)?.[0]||0)===alvo):arr.slice();
  }

  function periodoAtual(){
    const tipo=document.getElementById('filtro-dashboard-periodo')?.value||'ACUMULADO';
    const fim=new Date();fim.setHours(23,59,59,999);
    let ini=null;
    if(tipo==='HOJE'){ini=new Date();ini.setHours(0,0,0,0)}
    else if(tipo==='ONTEM'){ini=new Date(Date.now()-86400000);ini.setHours(0,0,0,0)}
    else if(tipo==='7_DIAS'){ini=new Date(Date.now()-6*86400000);ini.setHours(0,0,0,0)}
    else if(tipo==='30_DIAS'){ini=new Date(Date.now()-29*86400000);ini.setHours(0,0,0,0)}
    else if(tipo==='MES_ATUAL')ini=new Date(fim.getFullYear(),fim.getMonth(),1);
    else if(tipo==='MES_ANTERIOR'){ini=new Date(fim.getFullYear(),fim.getMonth()-1,1);fim.setTime(new Date(fim.getFullYear(),fim.getMonth(),0,23,59,59,999).getTime())}
    else if(tipo==='ANO_ATUAL')ini=new Date(fim.getFullYear(),0,1);
    else if(tipo==='PERSONALIZADO'){
      const a=document.getElementById('dashboard-data-inicial')?.value;
      const b=document.getElementById('dashboard-data-final')?.value;
      if(a)ini=new Date(a+'T00:00:00');
      if(b)fim.setTime(new Date(b+'T23:59:59.999').getTime());
    }
    return {tipo,ini,fim};
  }

  function periodoAnterior(p){
    if(!p.ini)return null;
    const dur=p.fim-p.ini;
    return {ini:new Date(p.ini.getTime()-dur-1),fim:new Date(p.ini.getTime()-1)};
  }

  function noPeriodo(v,p){
    if(!p?.ini)return true;
    const d=data(v);return !!d&&d>=p.ini&&d<=p.fim;
  }

  function agrupar(arr,chave){
    const m=new Map();
    arr.forEach(x=>{const k=chave(x);if(k)m.set(k,(m.get(k)||0)+1)});
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  }

  function media(arr){
    return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;
  }

  function tendencia(atual,anterior,inverter=false){
    if(!anterior)return {pct:0,classe:'neutra',seta:'→',texto:'Sem base anterior'};
    const pct=((atual-anterior)/Math.abs(anterior))*100;
    const melhor=inverter?pct<0:pct>0;
    return {
      pct:Math.abs(pct),
      classe:Math.abs(pct)<.5?'neutra':melhor?'positiva':'negativa',
      seta:Math.abs(pct)<.5?'→':pct>0?'↑':'↓',
      texto:`${Math.abs(pct).toLocaleString('pt-BR',{maximumFractionDigits:1})}% em relação ao período anterior`
    };
  }

  function metricas(lista,periodo){
    const abertos=lista.filter(p=>noPeriodo(inicio(p),periodo));
    const concluidos=lista.filter(p=>finalizado(p)&&noPeriodo(conclusao(p),periodo));
    const tempos=concluidos.map(p=>dias(inicio(p),conclusao(p))).filter(Number.isFinite);
    const dentroPrazo=lista.filter(p=>ativos(p)&&!vencido(p)).length;
    const ativosTotal=lista.filter(ativos).length;
    const sla=ativosTotal?dentroPrazo/ativosTotal*100:100;
    return {
      abertos:abertos.length,
      concluidos:concluidos.length,
      mediaAtendimento:media(tempos),
      ativos:ativosTotal,
      vencidos:lista.filter(vencido).length,
      perto:lista.filter(pertoVencer).length,
      sla,
      produtividade:concluidos.length,
      gargalos:agrupar(lista.filter(ativos),etapa),
      tecnicos:agrupar(concluidos,tecnico),
      ntes:agrupar(abertos,nte),
      escolas:agrupar(abertos,escola)
    };
  }

  function renderSkeleton(){
    garantirEstrutura();
    const root=document.getElementById('sigee-cig');
    if(!root)return;
    root.classList.add('sigee-cig-carregando');
    root.querySelectorAll('[data-kpi-valor]').forEach(el=>el.innerHTML='<i class="sigee-cig-skeleton curto"></i>');
    root.querySelectorAll('[data-kpi-tendencia]').forEach(el=>el.innerHTML='<i class="sigee-cig-skeleton medio"></i>');
    ['cig-gargalos','cig-tecnicos','cig-ntes','cig-escolas'].forEach(id=>{
      const box=document.getElementById(id);
      if(box)box.innerHTML=Array.from({length:5},()=>'<div class="sigee-cig-skeleton linha"></div>').join('');
    });
    const atualizado=document.getElementById('cig-atualizado');
    if(atualizado)atualizado.textContent='Carregando dados reais...';
  }

  function setTexto(id,valor){
    const campo=document.getElementById(id);
    if(campo)campo.textContent=valor;
  }

  function diasPeriodoGerencial(periodo,processos){
    if(periodo?.ini && periodo?.fim){
      return Math.max(1,Math.floor((periodo.fim-periodo.ini)/86400000)+1);
    }
    const datas=processos.map(p=>data(inicio(p))).filter(Boolean);
    if(!datas.length)return 1;
    const menor=new Date(Math.min(...datas));
    const maior=new Date(Math.max(...datas));
    return Math.max(1,Math.floor((maior-menor)/86400000)+1);
  }

  function processoTemPastaLocalizada(p){
    const conteudo=norm([
      p?.tipo_arquivo,p?.tipo_arquivo_recebido,p?.arquivo_tipo,p?.arquivo,
      p?.ultimo_evento_workflow,p?.ultima_acao_workflow,p?.observacao,
      p?.contexto_analise
    ].filter(Boolean).join(' '));
    return conteudo.includes('PASTA') &&
      (conteudo.includes('LOCALIZ')||conteudo.includes('RECEBID')||conteudo==='PASTA');
  }

  function atualizarIndicadoresTecnicosFiltrados(lista,periodo){
    const noRecorte=lista.filter(p=>noPeriodo(inicio(p),periodo));
    const concluidos=lista.filter(p=>finalizado(p)&&noPeriodo(conclusao(p),periodo));
    const tempos=concluidos
      .map(p=>dias(inicio(p),conclusao(p)))
      .filter(v=>Number.isFinite(v));
    const mediaEntrega=tempos.length?media(tempos):0;
    const diasBase=diasPeriodoGerencial(periodo,noRecorte);
    const pastas=noRecorte.filter(processoTemPastaLocalizada);

    setTexto(
      'dash-tec-media-entrega',
      `${mediaEntrega.toLocaleString('pt-BR',{maximumFractionDigits:1})} ${Math.abs(mediaEntrega-1)<0.001?'dia':'dias'}`
    );
    setTexto(
      'dash-tec-media-pedidos-dia',
      (noRecorte.length/diasBase).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})
    );
    setTexto(
      'dash-tec-media-pasta-dia',
      (pastas.length/diasBase).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})
    );
  }

  function garantirEstrutura(){
    const aba=document.getElementById('aba-painel');
    if(!aba||document.getElementById('sigee-cig'))return;

    const host=document.createElement('section');
    host.id='sigee-cig';
    host.className='sigee-cig';
    host.innerHTML=`
      <div class="sigee-cig-head">
        <div>
          <span>CENTRO DE INTELIGÊNCIA GERENCIAL</span>
          <h2>Visão Executiva do SIGEE</h2>
          <p>Indicadores consolidados para acompanhamento operacional e tomada de decisão.</p>
        </div>
        <div class="sigee-cig-status">
          <i></i><div><strong>Dados sincronizados</strong><span id="cig-atualizado">Atualizando...</span></div>
        </div>
      </div>

      <div class="sigee-cig-alertas" id="cig-alertas"></div>

      <div class="sigee-cig-kpis">
        ${['ativos','media','sla','vencidos','concluidos','produtividade'].map(id=>`
        <article class="sigee-cig-kpi" data-kpi="${id}">
          <div class="sigee-cig-kpi-top"><span data-kpi-label></span><b data-kpi-icone></b></div>
          <strong data-kpi-valor>—</strong>
          <small data-kpi-tendencia>Calculando...</small>
        </article>`).join('')}
      </div>

      <div class="sigee-cig-grid">
        <article class="sigee-cig-card sigee-cig-gargalos">
          <header><div><span>FLUXO OPERACIONAL</span><h3>Gargalos por etapa</h3></div><b id="cig-total-ativos">0 ativos</b></header>
          <div id="cig-gargalos"></div>
        </article>
        <article class="sigee-cig-card">
          <header><div><span>DESEMPENHO</span><h3>Produtividade técnica</h3></div></header>
          <div id="cig-tecnicos" class="sigee-cig-ranking"></div>
        </article>
        <article class="sigee-cig-card">
          <header><div><span>VISÃO TERRITORIAL</span><h3>Demanda por NTE</h3></div></header>
          <div id="cig-ntes" class="sigee-cig-ranking"></div>
        </article>
        <article class="sigee-cig-card">
          <header><div><span>DEMANDA INSTITUCIONAL</span><h3>Escolas mais solicitadas</h3></div></header>
          <div id="cig-escolas" class="sigee-cig-ranking"></div>
        </article>
      </div>`;
    const primeiro=aba.querySelector(':scope > *');
    primeiro?aba.insertBefore(host,primeiro):aba.appendChild(host);
  }

  const kpiConfig={
    ativos:['Processos ativos','◉',v=>v.toLocaleString('pt-BR'),false],
    media:['Tempo médio','◷',v=>`${v.toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`,true],
    sla:['SLA operacional','◎',v=>`${v.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`,false],
    vencidos:['Processos vencidos','⚠',v=>v.toLocaleString('pt-BR'),true],
    concluidos:['Concluídos no período','✓',v=>v.toLocaleString('pt-BR'),false],
    produtividade:['Produtividade','↗',v=>`${v.toLocaleString('pt-BR')} entregas`,false]
  };

  function renderKpi(id,valor,anterior){
    const card=document.querySelector(`[data-kpi="${id}"]`);if(!card)return;
    const [label,icone,fmt,inverter]=kpiConfig[id];
    card.querySelector('[data-kpi-label]').textContent=label;
    card.querySelector('[data-kpi-icone]').textContent=icone;
    card.querySelector('[data-kpi-valor]').textContent=fmt(valor);
    const t=tendencia(valor,anterior,inverter);
    const small=card.querySelector('[data-kpi-tendencia]');
    small.className=t.classe;
    small.textContent=`${t.seta} ${t.texto}`;
    card.dataset.estado=id==='vencidos'&&valor>0?'critico':id==='sla'&&valor<80?'alerta':'normal';
  }

  function renderRanking(id,dados,vazio='Sem dados no período'){
    const box=document.getElementById(id);if(!box)return;
    const top=(dados||[]).slice(0,8);
    const max=Math.max(1,...top.map(x=>x[1]));
    box.innerHTML=top.length?top.map(([nome,q],i)=>`
      <div class="sigee-cig-rank">
        <span class="pos">${i+1}</span>
        <div class="dados"><div><strong title="${esc(nome)}">${esc(nome)}</strong><b>${q}</b></div>
          <i><em style="width:${Math.max(5,q/max*100)}%"></em></i>
        </div>
      </div>`).join(''):`<p class="sigee-cig-vazio">${vazio}</p>`;
  }

  function renderGargalos(dados,total){
    const box=document.getElementById('cig-gargalos');if(!box)return;
    const cores=['#0284c7','#7c3aed','#f59e0b','#16a34a','#0891b2','#92400e','#64748b','#dc2626'];
    box.innerHTML=(dados||[]).slice(0,8).map(([nome,q],i)=>{
      const pct=total?q/total*100:0;
      return `<div class="sigee-cig-barra"><div><strong>${esc(nome)}</strong><span>${q} • ${pct.toFixed(1)}%</span></div>
        <i><em style="width:${pct}%;background:${cores[i%cores.length]}"></em></i></div>`;
    }).join('')||'<p class="sigee-cig-vazio">Não há processos ativos.</p>';
  }

  function renderAlertas(m){
    const box=document.getElementById('cig-alertas');if(!box)return;
    const alertas=[];
    if(m.vencidos)alertas.push({tipo:'critico',icone:'⚠',texto:`${m.vencidos} processo(s) fora do prazo`});
    if(m.perto)alertas.push({tipo:'alerta',icone:'◷',texto:`${m.perto} processo(s) vencem em até 2 dias`});
    if(m.sla<80)alertas.push({tipo:'critico',icone:'↓',texto:`SLA abaixo de 80% (${m.sla.toFixed(1)}%)`});
    if(!m.concluidos)alertas.push({tipo:'neutro',icone:'○',texto:'Nenhum processo concluído no período selecionado'});
    if(!alertas.length)alertas.push({tipo:'ok',icone:'✓',texto:'Operação dentro dos parâmetros gerenciais'});
    box.innerHTML=alertas.map(a=>`<div class="${a.tipo}"><b>${a.icone}</b><span>${a.texto}</span></div>`).join('');
  }

  function atualizar(){
    garantirEstrutura();
    const root=document.getElementById('sigee-cig');
    if(!root)return;
    const lista=processosBase();

    if(!lista.length && Date.now()-aguardandoDadosDesde<15000){
      renderSkeleton();
      return;
    }

    root.classList.remove('sigee-cig-carregando');
    const p=periodoAtual();
    const ant=periodoAnterior(p);
    const assinatura=[
      lista.length,
      lista.reduce((s,x)=>s+Number(x?.id||0),0),
      document.getElementById('filtro-dashboard-nte')?.value||'TODOS',
      document.getElementById('filtro-dashboard-periodo')?.value||'ACUMULADO',
      document.getElementById('dashboard-data-inicial')?.value||'',
      document.getElementById('dashboard-data-final')?.value||''
    ].join('|');

    let atual,anterior;
    if(metricasCache && assinatura===ultimaAssinaturaDados){
      ({atual,anterior}=metricasCache);
    }else{
      atual=metricas(lista,p);
      anterior=ant?metricas(lista,ant):{ativos:0,mediaAtendimento:0,sla:0,vencidos:0,concluidos:0,produtividade:0};
      ultimaAssinaturaDados=assinatura;
      metricasCache={atual,anterior};
    }

    renderKpi('ativos',atual.ativos,anterior.ativos);
    renderKpi('media',atual.mediaAtendimento,anterior.mediaAtendimento);
    renderKpi('sla',atual.sla,anterior.sla);
    renderKpi('vencidos',atual.vencidos,anterior.vencidos);
    renderKpi('concluidos',atual.concluidos,anterior.concluidos);
    renderKpi('produtividade',atual.produtividade,anterior.produtividade);

    renderAlertas(atual);
    renderGargalos(atual.gargalos,atual.ativos);
    renderRanking('cig-tecnicos',atual.tecnicos,'Nenhuma entrega técnica no período');
    renderRanking('cig-ntes',atual.ntes,'Nenhuma demanda territorial no período');
    renderRanking('cig-escolas',atual.escolas,'Nenhuma escola demandada no período');

    /*
     * Estes três indicadores existiam no Dashboard legado, mas eram
     * recalculados sem obedecer plenamente ao filtro de NTE/período.
     * O dashboard.js passa a ser a fonte autoritativa.
     */
    atualizarIndicadoresTecnicosFiltrados(lista,p);

    const total=document.getElementById('cig-total-ativos');
    if(total)total.textContent=`${atual.ativos.toLocaleString('pt-BR')} ativos`;
    const atualizado=document.getElementById('cig-atualizado');
    if(atualizado)atualizado.textContent=`Atualizado em ${new Date().toLocaleString('pt-BR')}`;

    window.SIGEE_CIG_METRICAS=Object.freeze({...atual,periodo:p});
  }

  let timer=null;
  function agendar(){
    clearTimeout(timer);
    timer=setTimeout(atualizar,80);
  }

  const antigo=window.carregarDadosDashboardReal;
  window.carregarDadosDashboardReal=function(){
    const r=typeof antigo==='function'?antigo.apply(this,arguments):undefined;
    Promise.resolve(r).finally(agendar);
    return r;
  };

  document.addEventListener('change',e=>{
    if(['filtro-dashboard-nte','filtro-dashboard-periodo','dashboard-data-inicial','dashboard-data-final'].includes(e.target?.id))agendar();
  });
  document.addEventListener('DOMContentLoaded',agendar);
  window.addEventListener('load',()=>setTimeout(agendar,500));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)agendar()});
  setInterval(()=>{const aba=document.getElementById('aba-painel');if(aba&&!aba.classList.contains('hidden'))agendar()},60000);

  let assinaturaObservada='';
  const observarDados=setInterval(()=>{
    const arr=Array.isArray(window.processosDB)?window.processosDB:[];
    const assinatura=`${arr.length}|${arr.reduce((s,x)=>s+Number(x?.id||0),0)}`;
    if(assinatura!==assinaturaObservada){
      assinaturaObservada=assinatura;
      ultimaAssinaturaDados='';
      metricasCache=null;
      if(arr.length)aguardandoDadosDesde=0;
      agendar();
    }
    if(Date.now()-aguardandoDadosDesde>20000 && arr.length) clearInterval(observarDados);
  },350);

  window.atualizarCentroInteligenciaSIGEE=atualizar;
  console.info('[SIGEE] Centro de Inteligência Gerencial 2.4.1B carregado.');
})();

