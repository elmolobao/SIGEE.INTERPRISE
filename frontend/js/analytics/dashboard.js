/* SIGEE RC4.6.2 — Dashboard de baixo consumo por RPC */
(function(){
  'use strict';
  if(window.__SIGEE_DASHBOARD_RPC_462__) return;
  window.__SIGEE_DASHBOARD_RPC_462__=true;

  const CACHE_MS=180000;
  const cache=new Map();
  let timer=0, carregando=false;
  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  const html=(id,v)=>{const e=document.getElementById(id);if(e)e.innerHTML=v};
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cliente=()=>{try{return window.obterSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||null}catch(_){return null}};
  const usuario=()=>window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;
  const global=()=>window.SIGEE_ESCOPO?.ehGlobal?.(usuario())===true;
  const nteNumero=v=>txt(v).match(/\d{1,2}/)?.[0]||'';
  function alvoNte(){
    if(!global()) return nteNumero(usuario()?.nte||usuario()?.nte_nome||usuario()?.grupo);
    const v=txt(document.getElementById('filtro-dashboard-nte')?.value||'TODOS');
    return ['TODOS','GLOBAL',''].includes(norm(v))?'':nteNumero(v);
  }
  function configurarFiltro(){
    const box=document.getElementById('box-filtro-dashboard-master');
    const sel=document.getElementById('filtro-dashboard-nte');
    if(!sel)return;
    if(global()){
      box?.classList.remove('hidden');
      const atual=sel.value||'TODOS';
      sel.innerHTML='<option value="TODOS">Todos os NTEs</option>'+Array.from({length:27},(_,i)=>`<option value="${i+1}">NTE-${String(i+1).padStart(2,'0')}</option>`).join('');
      sel.value=[...sel.options].some(o=>o.value===atual)?atual:'TODOS';
    }else box?.classList.add('hidden');
  }
  function periodo(){
    const tipo=document.getElementById('filtro-dashboard-periodo')?.value||'ACUMULADO';
    const fim=new Date(); fim.setHours(23,59,59,999); let inicio=null;
    const dia=d=>{d.setHours(0,0,0,0);return d};
    if(tipo==='HOJE')inicio=dia(new Date());
    else if(tipo==='ONTEM'){inicio=dia(new Date(Date.now()-86400000));fim.setTime(inicio.getTime());fim.setHours(23,59,59,999)}
    else if(tipo==='7_DIAS')inicio=dia(new Date(Date.now()-6*86400000));
    else if(tipo==='30_DIAS')inicio=dia(new Date(Date.now()-29*86400000));
    else if(tipo==='MES_ATUAL')inicio=new Date(fim.getFullYear(),fim.getMonth(),1);
    else if(tipo==='MES_ANTERIOR'){inicio=new Date(fim.getFullYear(),fim.getMonth()-1,1);fim.setTime(new Date(fim.getFullYear(),fim.getMonth(),0,23,59,59,999).getTime())}
    else if(tipo==='ANO_ATUAL')inicio=new Date(fim.getFullYear(),0,1);
    else if(tipo==='PERSONALIZADO'){
      const i=document.getElementById('dashboard-data-inicial')?.value;
      const f=document.getElementById('dashboard-data-final')?.value;
      inicio=i?new Date(i+'T00:00:00'):null;
      if(f)fim.setTime(new Date(f+'T23:59:59.999').getTime());
    }
    return {tipo,inicio,inicioIso:inicio?.toISOString()||null,fimIso:tipo==='ACUMULADO'?null:fim.toISOString()};
  }
  function top(id,dados){
    html(id,(dados||[]).slice(0,10).map((x,i)=>`<div class="flex justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0"><span class="min-w-0 truncate" title="${esc(x[0])}">${i+1}. ${esc(x[0])}</span><strong>${Number(x[1]||0).toLocaleString('pt-BR')}</strong></div>`).join('')||'Sem dados');
  }
  function garantirCig(){
    if(document.getElementById('sigee-cig'))return;
    const aba=document.getElementById('aba-painel'); if(!aba)return;
    const s=document.createElement('section');s.id='sigee-cig';s.className='sigee-cig';
    s.innerHTML='<div class="sigee-cig-head"><div><span>CENTRO DE INTELIGÊNCIA GERENCIAL</span><h2>Visão Executiva do SIGEE</h2><p>Indicadores consolidados por consulta agregada.</p></div><div class="sigee-cig-status"><i></i><div><strong>Dados sincronizados</strong><span id="cig-atualizado">Aguardando...</span></div></div></div><div class="sigee-cig-alertas" id="cig-alertas"></div><div class="sigee-cig-grid"><article class="sigee-cig-card"><header><h3>Gargalos por etapa</h3><b id="cig-total-ativos">0 ativos</b></header><div id="cig-gargalos"></div></article><article class="sigee-cig-card"><header><h3>Produtividade técnica</h3></header><div id="cig-tecnicos" class="sigee-cig-ranking"></div></article><article class="sigee-cig-card"><header><h3>Demanda por NTE</h3></header><div id="cig-ntes" class="sigee-cig-ranking"></div></article><article class="sigee-cig-card"><header><h3>Escolas mais solicitadas</h3></header><div id="cig-escolas" class="sigee-cig-ranking"></div></article></div>';
    aba.querySelector('.sigee-welcome-strip')?.insertAdjacentElement('afterend',s);
  }
  function render(r){
    set('dash-escolas',Number(r.escolas_total||0).toLocaleString('pt-BR'));set('dash-acervos',Number(r.acervos_recolhidos||0).toLocaleString('pt-BR'));set('dash-estaduais',Number(r.escolas_estaduais||0).toLocaleString('pt-BR'));
    set('dash-proc-desarquivamento',r.desarquivamento||0);set('dash-proc-analise',r.analise||0);set('dash-proc-pendencia',r.pendencia||0);set('dash-proc-digitacao',r.digitacao||0);set('dash-proc-conferencia',r.conferencia||0);set('dash-proc-assinatura',r.assinatura||0);set('dash-proc-aguardando',r.aguardando_retirada||0);set('dash-proc-retirado',r.retirado||0);
    set('dash-tec-media-entrega',`${Number(r.media_atendimento||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);set('dash-ger-media-atendimento',`${Number(r.media_atendimento||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);set('dash-ger-processos-concluidos',r.concluidos||0);
    top('dash-tec-top-escolas',r.por_escola);top('dash-ger-escola-demanda',r.por_escola);top('dash-ger-territorio-demanda',r.por_nte);top('dash-ger-pendencias-escolas',[]);
    set('dashboard-ultima-atualizacao',new Date(r.atualizado_em||Date.now()).toLocaleString('pt-BR'));
    garantirCig();set('cig-total-ativos',`${Number(r.ativos||0).toLocaleString('pt-BR')} ativos`);set('cig-atualizado',`Atualizado em ${new Date(r.atualizado_em||Date.now()).toLocaleString('pt-BR')}`);
    top('cig-gargalos',r.por_etapa);top('cig-tecnicos',r.por_tecnico);top('cig-ntes',r.por_nte);top('cig-escolas',r.por_escola);
    html('cig-alertas',r.vencidos?`<div class="critico"><b>⚠</b><span>${r.vencidos} processo(s) fora do prazo</span></div>`:'<div class="ok"><b>✓</b><span>Operação dentro dos parâmetros atuais</span></div>');
    window.dispatchEvent(new CustomEvent('sigee:dashboard-rpc-atualizado',{detail:r}));
  }
  async function carregar(forcar=false){
    if(carregando||!usuario())return; const aba=document.getElementById('aba-painel');if(aba?.classList.contains('hidden'))return;
    configurarFiltro();const p=periodo(),nte=alvoNte(),chave=`${nte}|${p.inicioIso}|${p.fimIso}`;const salvo=cache.get(chave);
    if(!forcar&&salvo&&Date.now()-salvo.em<CACHE_MS){render(salvo.dados);return}
    const c=cliente();if(!c){console.warn('[SIGEE Dashboard] Supabase indisponível.');return}
    carregando=true;
    try{
      const {data,error}=await c.rpc('sigee_dashboard_resumo',{p_nte:nte||null,p_data_inicio:p.inicioIso,p_data_fim:p.fimIso});
      if(error)throw error;const r=typeof data==='string'?JSON.parse(data):data;cache.set(chave,{dados:r,em:Date.now()});render(r||{});
    }catch(e){console.error('[SIGEE Dashboard RPC]',e);set('dashboard-ultima-atualizacao','Falha ao carregar indicadores');}
    finally{carregando=false}
  }
  function agendar(forcar=false){clearTimeout(timer);timer=setTimeout(()=>carregar(forcar),80)}
  document.addEventListener('change',e=>{if(['filtro-dashboard-nte','filtro-dashboard-periodo','dashboard-data-inicial','dashboard-data-final'].includes(e.target?.id))agendar(true)},true);
  document.addEventListener('sigee:navegacao-concluida',e=>{if((e.detail?.rota||e.detail?.aba)==='painel')agendar(false)});
  document.addEventListener('sigee:usuario-logado',()=>agendar(true));
  window.carregarDadosDashboardReal=()=>agendar(true);window.carregarDadosDashboardRealImediato=()=>carregar(true);window.SIGEE_DASHBOARD_RPC={carregar,limparCache:()=>cache.clear(),versao:'RC4.6.2'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>agendar(false));else agendar(false);
})();
