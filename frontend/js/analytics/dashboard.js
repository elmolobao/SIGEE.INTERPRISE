/* SIGEE RC4.7.0 — Dashboard Operacional + RPCs agregadas sem duplicidade */
(function(){
  'use strict';
  if(window.__SIGEE_DASHBOARD_RPC_470__) return;
  window.__SIGEE_DASHBOARD_RPC_470__=true;
  window.SIGEE_DASHBOARD_AUTORIDADE='RPC_RC4.7.0';

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
    return (!norm(v) || norm(v)==='TODOS' || norm(v)==='GLOBAL' || norm(v).includes('TODOS OS NTES')) ? '' : nteNumero(v);
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
  function itemRanking(item) {
    if (Array.isArray(item)) return { nome: txt(item[0]) || 'Não informado', total: Number(item[1] || 0), nte: txt(item[2]) };
    return {
      nome: txt(item?.nome || item?.label || item?.etapa || item?.tecnico || item?.escola || item?.nte) || 'Não informado',
      total: Number(item?.total || item?.quantidade || item?.valor || 0),
      nte: txt(item?.nte_escola || item?.nte || item?.territorio)
    };
  }
  function ranking(id,dados,{limite=10,mostrarNte=false,totalBase=0}={}){
    const itens=(Array.isArray(dados)?dados:[]).map(itemRanking).filter(x=>x.total>=0).slice(0,limite);
    const base=Number(totalBase)||itens.reduce((a,x)=>a+x.total,0)||1;
    html(id,itens.map((x,i)=>{
      const percentual=Math.max(0,Math.min(100,(x.total/base)*100));
      const meta=mostrarNte&&x.nte?`<small class="sigee-cig-nte">${esc(window.normalizarNteSIGEE?.(x.nte)||x.nte)}</small>`:'';
      return `<div class="sigee-cig-rank-item"><div class="sigee-cig-rank-head"><span class="sigee-cig-rank-label" title="${esc(x.nome)}"><b>${i+1}. ${esc(x.nome)}</b>${meta}</span><strong>${x.total.toLocaleString('pt-BR')} <small>${percentual.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</small></strong></div><i role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentual.toFixed(1)}"><em style="width:${Math.max(percentual,2).toFixed(1)}%"></em></i></div>`;
    }).join('')||'<p class="sigee-cig-vazio">Sem dados</p>');
  }
  function garantirCig(){
    if(document.getElementById('sigee-cig'))return;
    const aba=document.getElementById('aba-painel'); if(!aba)return;
    const s=document.createElement('section');s.id='sigee-cig';s.className='sigee-cig';
    s.innerHTML='<div class="sigee-cig-head"><div><span>DASHBOARD OPERACIONAL</span><h2>Monitoramento da operação</h2><p>Gargalos, produtividade, demanda territorial e entrada de arquivos.</p></div><div class="sigee-cig-status"><i></i><div><strong>Dados sincronizados</strong><span id="cig-atualizado">Aguardando...</span></div></div></div><div class="sigee-cig-alertas" id="cig-alertas"></div><div class="sigee-cig-grid"><article class="sigee-cig-card"><header><h3>Gargalos por etapa</h3><b id="cig-total-ativos">0 ativos</b></header><div id="cig-gargalos"></div></article><article class="sigee-cig-card"><header><h3>Produtividade técnica</h3></header><div id="cig-tecnicos" class="sigee-cig-ranking"></div></article><article class="sigee-cig-card"><header><h3>Demanda por NTE</h3></header><div id="cig-ntes" class="sigee-cig-ranking"></div></article><article class="sigee-cig-card"><header><h3>Escolas mais solicitadas</h3></header><div id="cig-escolas" class="sigee-cig-ranking"></div></article></div>';
    aba.querySelector('.sigee-welcome-strip')?.insertAdjacentElement('afterend',s);
  }
  function render(r){
    set('dash-escolas',Number(r.escolas_total||0).toLocaleString('pt-BR'));set('dash-acervos',Number(r.acervos_recolhidos||0).toLocaleString('pt-BR'));set('dash-estaduais',Number(r.escolas_estaduais||0).toLocaleString('pt-BR'));
    set('dash-proc-desarquivamento',r.desarquivamento||0);set('dash-proc-analise',r.analise||0);set('dash-proc-pendencia',r.pendencia||0);set('dash-proc-digitacao',r.digitacao||0);set('dash-proc-conferencia',r.conferencia||0);set('dash-proc-assinatura',r.assinatura||0);set('dash-proc-aguardando',r.aguardando_retirada||0);set('dash-proc-retirado',r.retirado||0);
    set('dash-tec-media-entrega',`${Number(r.media_atendimento||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);set('dash-ger-media-atendimento',`${Number(r.media_atendimento||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);set('dash-ger-processos-concluidos',r.concluidos||0);
    set('dash-tec-media-pedidos-dia',Number(r.pedidos_abertos_periodo||0).toLocaleString('pt-BR'));
    set('dash-tec-media-pasta-dia',Number(r.arquivos_recebidos_periodo||0).toLocaleString('pt-BR'));
    set('dash-tec-media-arquivo-tempo',r.tempo_medio_arquivo_recebido==null?'Sem dados':`${Number(r.tempo_medio_arquivo_recebido).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);
    ranking('dash-tec-top-escolas',r.por_escola,{mostrarNte:true,totalBase:r.total_processos});ranking('dash-ger-escola-demanda',r.por_escola,{mostrarNte:true,totalBase:r.total_processos});ranking('dash-ger-territorio-demanda',r.por_nte,{totalBase:r.total_processos});ranking('dash-ger-pendencias-escolas',[]);
    set('dashboard-ultima-atualizacao',new Date(r.atualizado_em||Date.now()).toLocaleString('pt-BR'));
    garantirCig();set('cig-total-ativos',`${Number(r.ativos||0).toLocaleString('pt-BR')} ativos`);set('cig-atualizado',`Atualizado em ${new Date(r.atualizado_em||Date.now()).toLocaleString('pt-BR')}`);
    ranking('cig-gargalos',r.por_etapa,{totalBase:r.ativos});ranking('cig-tecnicos',r.por_tecnico);ranking('cig-ntes',r.por_nte,{totalBase:r.total_processos});ranking('cig-escolas',r.por_escola,{mostrarNte:true,totalBase:r.total_processos});
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
      const [resumoResp, complementoResp]=await Promise.all([
        c.rpc('sigee_dashboard_resumo',{p_nte:nte||null,p_data_inicio:p.inicioIso,p_data_fim:p.fimIso}),
        c.rpc('sigee_dashboard_complemento',{p_nte:nte||null,p_data_inicio:p.inicioIso,p_data_fim:p.fimIso})
      ]);
      if(resumoResp.error)throw resumoResp.error;
      if(complementoResp.error)console.warn('[SIGEE Dashboard Complemento]',complementoResp.error);
      const resumo=typeof resumoResp.data==='string'?JSON.parse(resumoResp.data):resumoResp.data;
      const complemento=typeof complementoResp.data==='string'?JSON.parse(complementoResp.data):complementoResp.data;
      const r=Object.assign({},resumo||{},complemento||{});
      cache.set(chave,{dados:r,em:Date.now()});render(r);
    }catch(e){console.error('[SIGEE Dashboard RPC]',e);set('dashboard-ultima-atualizacao','Falha ao carregar indicadores');}
    finally{carregando=false}
  }
  function agendar(forcar=false){clearTimeout(timer);timer=setTimeout(()=>carregar(forcar),80)}
  document.addEventListener('change',e=>{if(['filtro-dashboard-nte','filtro-dashboard-periodo','dashboard-data-inicial','dashboard-data-final'].includes(e.target?.id))agendar(true)},true);
  document.addEventListener('sigee:navegacao-concluida',e=>{if((e.detail?.rota||e.detail?.aba)==='painel')agendar(false)});
  document.addEventListener('sigee:usuario-logado',()=>agendar(true));
  window.carregarDadosDashboardReal=()=>agendar(true);window.carregarDadosDashboardRealImediato=()=>carregar(true);window.SIGEE_DASHBOARD_RPC={carregar,limparCache:()=>cache.clear(),versao:'RC4.7.0'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>agendar(false));else agendar(false);
})();
