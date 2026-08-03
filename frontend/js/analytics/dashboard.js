/* SIGEE RC7.4.1 — Dashboard territorial com técnicos por abrangência */
(function(){
  'use strict';
  if(window.__SIGEE_DASHBOARD_RPC_510__) return;
  window.__SIGEE_DASHBOARD_RPC_510__=true;
  window.SIGEE_DASHBOARD_AUTORIDADE='SNAPSHOT_TERRITORIAL_RC7.4.3';

  const CACHE_MS=180000;
  const BOOT_GUARD_MS=15000;

  function perfilAtual(){
    const u=window.SIGEE_AUTORIZACAO?.usuario?.()||window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||null;
    return window.SIGEE_PERFIS?.normalizar?.(u?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(u?.perfil)||String(u?.perfil||'');
  }
  function dashboardAutorizado(){
    const u=window.SIGEE_AUTORIZACAO?.usuario?.()||window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||null;
    return ['Master','Gestor','Administrador','SEC'].includes(perfilAtual()) &&
      window.SIGEE_PERMISSOES?.pode?.('relatorios.visualizar',u)===true;
  }
  function protegerTelaDashboard(){
    if(dashboardAutorizado()) return true;
    const painel=document.getElementById('aba-painel');
    if(painel){painel.classList.add('hidden');painel.hidden=true;}
    const processos=document.getElementById('aba-processos');
    if(processos){processos.classList.remove('hidden');processos.hidden=false;processos.style.removeProperty('display');}
    return false;
  }

  const estadoGlobal=window.__SIGEE_DASHBOARD_SNAPSHOT_STATE__||(window.__SIGEE_DASHBOARD_SNAPSHOT_STATE__={cache:new Map(),emAndamento:new Map(),ultimo:new Map()});
  const cache=estadoGlobal.cache;
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
    if(!global()) {
      const id=window.SIGEE_ESCOPO?.nteIdUsuario?.(usuario());
      return id==null ? nteNumero(window.SIGEE_ESCOPO?.nteUsuario?.(usuario())||usuario()?.nte||usuario()?.nte_nome||usuario()?.grupo) : String(id);
    }
    const v=txt(document.getElementById('filtro-dashboard-nte')?.value||'TODOS');
    return (!norm(v) || norm(v)==='TODOS' || norm(v)==='GLOBAL' || norm(v).includes('TODOS OS NTES')) ? '' : nteNumero(v);
  }
  const cacheTecnicos=new Map();
  function nteCanonico(v){
    const n=window.SIGEE_ESCOPO?.numeroNte?.(v) ?? Number(nteNumero(v)||0);
    return n ? `NTE-${String(n).padStart(2,'0')}` : '';
  }
  function perfilTecnico(u){return norm(u?.perfil||u?.role||u?.tipo).includes('TECNIC');}
  function usuarioAtivo(u){
    if(u?.ativo===false)return false;
    const situacao=norm(u?.status||u?.situacao||'ATIVO');
    return !['INATIVO','BLOQUEADO','DESATIVADO','EXCLUIDO'].some(x=>situacao.includes(x));
  }
  async function contarTecnicosEscopo(nteAlvo,forcar=false){
    const chave=nteAlvo?nteCanonico(nteAlvo):'GLOBAL';
    const salvo=cacheTecnicos.get(chave);
    if(!forcar&&salvo&&Date.now()-salvo.em<CACHE_MS)return salvo.total;
    const c=cliente();
    if(!c)return 0;
    const {data,error}=await c.from('usuarios_sigee').select('perfil,role,tipo,ativo,status,situacao,nte,nte_nome,grupo,nte_id');
    if(error)throw error;
    let lista=Array.isArray(data)?data:[];
    if(chave!=='GLOBAL'){
      lista=lista.filter(u=>nteCanonico(window.SIGEE_ESCOPO?.nteRegistro?.(u)||u?.nte||u?.nte_nome||u?.grupo||u?.nte_id)===chave);
    }else if(!global()){
      lista=window.SIGEE_ESCOPO?.filtrar?.(lista,usuario())||[];
    }
    const total=lista.filter(u=>usuarioAtivo(u)&&perfilTecnico(u)).length;
    cacheTecnicos.set(chave,{total,em:Date.now()});
    return total;
  }
  async function complementarTecnicos(snapshot,nteAlvo,forcar=false){
    const alvo=global()?nteAlvo:(window.SIGEE_ESCOPO?.nteIdUsuario?.(usuario())||window.SIGEE_ESCOPO?.nteUsuario?.(usuario())||nteAlvo);
    const complemento={...(snapshot?.complemento||{})};
    complemento.tecnicos_total=await contarTecnicosEscopo(alvo,forcar);
    if(snapshot)snapshot.complemento=complemento;
    return complemento;
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
    const nomeBruto = txt(item?.nome || item?.label || item?.etapa || item?.tecnico || item?.escola || item?.nte) || 'Não informado';
    const ehTerritorio = /^NTE\s*[- ]?\s*\d{1,2}/i.test(nomeBruto) && !item?.escola && !item?.tecnico && !item?.etapa;
    return {
      nome: ehTerritorio ? (window.rotuloNteSIGEE?.(nomeBruto) || nomeBruto) : nomeBruto,
      total: Number(item?.total || item?.quantidade || item?.valor || 0),
      nte: txt(item?.nte_escola || item?.nte || item?.territorio)
    };
  }
  function ranking(id,dados,{limite=10,mostrarNte=false,totalBase=0,statusMap=null}={}){
    const itens=(Array.isArray(dados)?dados:[]).map(itemRanking).filter(x=>x.total>=0).slice(0,limite);
    const base=Number(totalBase)||itens.reduce((a,x)=>a+x.total,0)||1;
    html(id,itens.map((x,i)=>{
      const percentual=Math.max(0,Math.min(100,(x.total/base)*100));
      const meta=mostrarNte&&x.nte?`<small class="sigee-cig-nte">${esc(window.normalizarNteSIGEE?.(x.nte)||x.nte)}</small>`:'';
      const status=statusMap?.get(norm(x.nome))||'';
      return `<div class="sigee-cig-rank-item ${status?`semaforo-${status}`:''}"><div class="sigee-cig-rank-head"><span class="sigee-cig-rank-label" title="${esc(x.nome)}"><b>${i+1}. ${esc(x.nome)}</b>${meta}</span><strong>${x.total.toLocaleString('pt-BR')} <small>${percentual.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</small></strong></div><i role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentual.toFixed(1)}"><em style="width:${Math.max(percentual,2).toFixed(1)}%"></em></i></div>`;
    }).join('')||'<p class="sigee-cig-vazio">Sem dados</p>');
  }
  function garantirCig(){
    if(document.getElementById('sigee-cig'))return;
    const aba=document.getElementById('aba-painel'); if(!aba)return;
    const s=document.createElement('section');s.id='sigee-cig';s.className='sigee-cig';
    s.innerHTML='<div class="sigee-cig-head"><div><span>DASHBOARD OPERACIONAL</span><h2>Monitoramento da Produção</h2><p>Gargalos, produtividade técnica, demanda territorial e indicadores de entrada de pasta.</p></div><div class="sigee-cig-status"><i></i><div><strong>Dados sincronizados</strong><span id="cig-atualizado">Aguardando...</span></div></div></div><div class="sigee-cig-alertas" id="cig-alertas"></div><div class="sigee-cig-grid"><article class="sigee-cig-card"><header><h3>Gargalos por etapa</h3><b id="cig-total-ativos">0 ativos</b></header><div id="cig-gargalos"></div></article><article class="sigee-cig-card"><header><h3>Produtividade técnica</h3></header><div id="cig-tecnicos" class="sigee-cig-ranking"></div></article><article class="sigee-cig-card"><header><h3>Demanda por NTE</h3></header><div id="cig-ntes" class="sigee-cig-ranking"></div></article><article class="sigee-cig-card"><header><h3>Escolas mais solicitadas</h3></header><div id="cig-escolas" class="sigee-cig-ranking"></div></article></div>';
    aba.querySelector('.sigee-welcome-strip')?.insertAdjacentElement('afterend',s);
  }
  function renderizarAtrasosPorEtapa(comp){
    const corpo=document.getElementById('sigee-relatorio-atrasos-corpo');
    const totalEl=document.getElementById('sigee-relatorio-atrasos-total');
    if(!corpo)return;
    const lista=Array.isArray(comp?.atrasos_por_etapa)?comp.atrasos_por_etapa:[];
    const totalAtrasos=lista.reduce((a,x)=>a+Number(x.em_atraso||x.vencidos||0),0);
    if(totalEl)totalEl.textContent=`${totalAtrasos.toLocaleString('pt-BR')} em atraso`;
    corpo.innerHTML=lista.length?lista.map(x=>{
      const nome=txt(x.nome||x.etapa)||'Não informado';
      const total=Number(x.total||0);
      const atraso=Number(x.em_atraso||x.vencidos||0);
      const prazo=Math.max(0,total-atraso);
      const percentual=Number(x.percentual_atraso ?? (total?atraso/total*100:0));
      const classe=percentual>=30?'critico':percentual>=15?'atencao':'bom';
      return `<div class="sigee-rel-atraso-linha ${classe}"><span>${esc(nome)}</span><strong>${total.toLocaleString('pt-BR')}</strong><strong>${atraso.toLocaleString('pt-BR')}</strong><strong>${prazo.toLocaleString('pt-BR')}</strong><strong>${percentual.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</strong><i><em style="width:${Math.max(2,Math.min(100,percentual)).toFixed(1)}%"></em></i></div>`;
    }).join(''):'<p class="sigee-cig-vazio">Sem dados de atraso para a abrangência atual.</p>';
  }

  function render(r){
    set('dash-escolas',Number(r.escolas_total||0).toLocaleString('pt-BR'));set('dash-acervos',Number(r.acervos_recolhidos||0).toLocaleString('pt-BR'));set('dash-estaduais',Number(r.escolas_estaduais||0).toLocaleString('pt-BR'));
    set('dash-proc-desarquivamento',r.desarquivamento||0);set('dash-proc-analise',r.analise||0);set('dash-proc-pendencia',r.pendencia||0);set('dash-proc-digitacao',r.digitacao||0);set('dash-proc-conferencia',r.conferencia||0);set('dash-proc-assinatura',r.assinatura||0);set('dash-proc-aguardando',r.aguardando_retirada||0);set('dash-proc-retirado',r.retirado||0);
    set('dash-tec-media-entrega',`${Number(r.media_atendimento||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);set('dash-ger-media-atendimento',`${Number(r.media_atendimento||0).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);set('dash-ger-processos-concluidos',r.concluidos||0);
    const comp=window.__SIGEE_DASHBOARD_COMPLEMENTO__||{};
    renderizarAtrasosPorEtapa(comp);
    set('dash-municipios',Number(comp.municipios_total??0).toLocaleString('pt-BR'));
    set('dash-usuarios',Number(comp.tecnicos_total||0).toLocaleString('pt-BR'));
    set('dash-tec-media-pedidos-dia',Number(comp.pedidos_abertos_periodo||0).toLocaleString('pt-BR'));
    set('dash-tec-media-pasta-dia',Number(comp.arquivos_recebidos_periodo||0).toLocaleString('pt-BR'));
    set('dash-tec-media-arquivo-tempo',comp.tempo_medio_arquivo_recebido==null?'Sem dados':`${Number(comp.tempo_medio_arquivo_recebido).toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);
    ranking('dash-tec-top-escolas',r.por_escola,{mostrarNte:true,totalBase:r.total_processos});ranking('dash-ger-escola-demanda',r.por_escola,{mostrarNte:true,totalBase:r.total_processos});ranking('dash-ger-territorio-demanda',r.por_nte,{totalBase:r.total_processos});ranking('dash-ger-pendencias-escolas',[]);
    set('dashboard-ultima-atualizacao',new Date(r.atualizado_em||Date.now()).toLocaleString('pt-BR'));
    garantirCig();set('cig-total-ativos',`${Number(r.ativos||0).toLocaleString('pt-BR')} ativos`);set('cig-atualizado',`Atualizado em ${new Date(r.atualizado_em||Date.now()).toLocaleString('pt-BR')}`);
    const semaforos=Array.isArray(comp.semaforo_etapas)?comp.semaforo_etapas:[];
    const statusMap=new Map(semaforos.map(x=>[norm(x.nome),String(x.status||'')]));
    ranking('cig-gargalos',r.por_etapa,{totalBase:r.ativos,statusMap});ranking('cig-tecnicos',r.por_tecnico);ranking('cig-ntes',r.por_nte,{totalBase:r.total_processos});ranking('cig-escolas',r.por_escola,{mostrarNte:true,totalBase:r.total_processos});
    const criticos=semaforos.filter(x=>x.status==='critico').slice(0,4);
    const atencao=semaforos.filter(x=>x.status==='atencao').slice(0,3);
    const alertas=[];
    if(Number(r.vencidos||0)>0) alertas.push(`<div class="critico"><b>⚠</b><span>${Number(r.vencidos).toLocaleString('pt-BR')} processo(s) fora do prazo</span></div>`);
    criticos.forEach(x=>alertas.push(`<div class="critico"><b>●</b><span>${esc(x.nome)}: ${Number(x.total||0).toLocaleString('pt-BR')} processo(s), ${Number(x.percentual||0).toLocaleString('pt-BR',{maximumFractionDigits:1})}% do ativo</span></div>`));
    atencao.forEach(x=>alertas.push(`<div class="atencao"><b>●</b><span>${esc(x.nome)} exige acompanhamento</span></div>`));
    html('cig-alertas',alertas.join('')||'<div class="ok"><b>✓</b><span>Operação dentro dos parâmetros atuais</span></div>');
    window.dispatchEvent(new CustomEvent('sigee:dashboard-rpc-atualizado',{detail:r}));
  }
  async function buscarPaginado(tabela, aplicarEscopo) {
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const todos=[]; const lote=1000;
    for(let de=0;;de+=lote){
      let q=c.from(tabela).select('*');
      if(typeof aplicarEscopo==='function') q=aplicarEscopo(q)||q;
      const {data,error}=await q.range(de,de+lote-1);
      if(error) throw error;
      const itens=Array.isArray(data)?data:[]; todos.push(...itens);
      if(itens.length<lote) break;
    }
    return todos;
  }
  function dataValida(v){const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d:null;}
  function diasEntre(a,b=new Date()){return a?Math.max(0,Math.floor((b-a)/86400000)):0;}
  function etapaRegistro(p){return txt(p?.etapa_atual||p?.etapa||p?.fase_atual||'Desarquivamento');}
  function limiteEtapa(nome){const n=norm(nome);if(n.includes('DESARQ'))return 30;if(n.includes('ANAL'))return 7;if(n.includes('DIGIT'))return 15;if(n.includes('CONFER'))return 10;if(n.includes('ASSIN'))return 7;return null;}
  function diasEtapa(p){const exp=Number(p?.dias_na_etapa??p?.dias_etapa);if(Number.isFinite(exp)&&exp>=0)return exp;return diasEntre(dataValida(p?.data_etapa_atual||p?.etapa_iniciada_em||p?.updated_at||p?.created_at));}
  function agrupar(lista,getter){const m=new Map();for(const x of lista){const k=txt(getter(x))||'Não informado';m.set(k,(m.get(k)||0)+1);}return [...m].sort((a,b)=>b[1]-a[1]).map(([nome,total])=>({nome,total}));}
  async function snapshotDireto(nteAlvo,p){
    const u=usuario();
    let processos=await buscarPaginado(window.SIGEE_CONFIG?.supabase?.tabelas?.processos||'processos',q=>window.SIGEE_ESCOPO?.aplicarQueryProcessos?.(q,u));
    let escolas=await buscarPaginado(window.SIGEE_CONFIG?.supabase?.tabelas?.escolas||'escolas_sigee');
    processos=window.SIGEE_ESCOPO?.filtrar?.(processos,u)||processos;
    escolas=window.SIGEE_ESCOPO?.filtrar?.(escolas,u)||escolas;
    if(nteAlvo){const alvo=nteCanonico(nteAlvo);processos=processos.filter(x=>nteCanonico(window.SIGEE_ESCOPO?.nteRegistro?.(x)||x.nte||x.nte_id)===alvo);escolas=escolas.filter(x=>nteCanonico(window.SIGEE_ESCOPO?.nteRegistro?.(x)||x.nte||x.nte_id)===alvo);}
    const noPeriodo=x=>{if(!p.inicioIso&&!p.fimIso)return true;const d=dataValida(x.created_at||x.data_inicio||x.data_abertura||x.data_solicitacao);if(!d)return false;return(!p.inicioIso||d>=new Date(p.inicioIso))&&(!p.fimIso||d<=new Date(p.fimIso));};
    const basePeriodo=processos.filter(noPeriodo);
    const concluidos=processos.filter(x=>['RETIRADO','INDEFERIDO'].includes(norm(etapaRegistro(x))));
    const ativos=processos.filter(x=>!['RETIRADO','INDEFERIDO'].includes(norm(etapaRegistro(x))));
    const vencidos=ativos.filter(x=>{const l=limiteEtapa(etapaRegistro(x));return l!=null&&diasEtapa(x)>l;});
    const porEtapa=agrupar(processos,etapaRegistro), mapa=Object.fromEntries(porEtapa.map(x=>[norm(x.nome),x.total]));
    const tempoConcluidos=concluidos.map(x=>Number(x.tempo_total_dias)).filter(Number.isFinite);
    const resumo={
      total_processos:processos.length,ativos:ativos.length,concluidos:concluidos.length,vencidos:vencidos.length,
      escolas_total:escolas.length,acervos_recolhidos:escolas.filter(x=>norm(x.status_acervo||x.acervo)==='RECOLHIDO').length,
      escolas_estaduais:escolas.filter(x=>norm(x.dependencia||x.dependencia_adm).includes('ESTAD')).length,
      desarquivamento:mapa.DESARQUIVAMENTO||0,analise:mapa.ANALISE||0,pendencia:mapa.PENDENCIA||0,digitacao:mapa.DIGITACAO||0,
      conferencia:mapa.CONFERENCIA||0,assinatura:mapa.ASSINATURA||0,aguardando_retirada:mapa['AGUARDANDO RETIRADA']||0,retirado:mapa.RETIRADO||0,
      media_atendimento:tempoConcluidos.length?tempoConcluidos.reduce((a,b)=>a+b,0)/tempoConcluidos.length:0,
      por_etapa:porEtapa,por_nte:agrupar(processos,x=>nteCanonico(x.nte||x.nte_id)||'Sem NTE'),
      por_escola:agrupar(processos,x=>x.escola_nome||x.escola||'Sem escola'),por_tecnico:agrupar(ativos,x=>x.tecnico_responsavel_nome||x.tecnico||x.analista||x.responsavel||'Não atribuído'),
      por_documento:agrupar(processos,x=>x.documento_tipo||x.documento||'Não informado'),atualizado_em:new Date().toISOString(),fonte:'SUPABASE_DIRETO_FALLBACK'
    };
    const atrasos=porEtapa.map(x=>{const sub=ativos.filter(p=>norm(etapaRegistro(p))===norm(x.nome));const em=sub.filter(p=>{const l=limiteEtapa(etapaRegistro(p));return l!=null&&diasEtapa(p)>l;}).length;return {nome:x.nome,total:sub.length,em_atraso:em,percentual_atraso:sub.length?em*100/sub.length:0};}).filter(x=>x.total);
    const complemento={municipios_total:new Set(escolas.map(x=>txt(x.municipio)).filter(Boolean)).size,pedidos_abertos_periodo:basePeriodo.length,arquivos_recebidos_periodo:basePeriodo.filter(x=>x.arquivo_recebido_em||x.data_documento_recebido).length,tempo_medio_arquivo_recebido:null,atrasos_por_etapa:atrasos,semaforo_etapas:atrasos.map(x=>({...x,status:x.percentual_atraso>=30?'critico':x.percentual_atraso>=15?'atencao':'bom'})),por_modalidade:agrupar(processos,x=>x.modalidade||'Não informado'),por_ensino:agrupar(processos,x=>x.tipo_ensino||x.nivel_ensino||'Não informado')};
    console.warn('[SIGEE Dashboard] RPC indisponível; snapshot calculado diretamente após migração.',{processos:processos.length,escolas:escolas.length});
    return {resumo,complemento};
  }

  async function carregar(forcar=false, origem='automatica'){
    if(!usuario())return;
    const aba=document.getElementById('aba-painel');
    if(aba?.classList.contains('hidden'))return;
    configurarFiltro();
    const p=periodo(),nte=alvoNte(),chave=`${nte}|${p.inicioIso}|${p.fimIso}`;
    const agora=Date.now();
    const salvo=cache.get(chave);
    const manual=origem==='manual';

    // Eventos automáticos de login, navegação e boot podem ocorrer em sequência.
    // Mesmo quando marcados como atualização, reutilizam o snapshot recém-concluído.
    if(salvo && ((!manual && agora-salvo.em<BOOT_GUARD_MS) || (!forcar && agora-salvo.em<CACHE_MS))){
      const snapshotSalvo=salvo.snapshot||{resumo:salvo.dados||{},complemento:salvo.complemento||{}};
      const complementoSalvo=await complementarTecnicos(snapshotSalvo,nte,false);
      salvo.complemento=complementoSalvo;
      window.__SIGEE_DASHBOARD_COMPLEMENTO__=complementoSalvo;
      render(salvo.dados||{});
      return snapshotSalvo;
    }

    // Uma única Promise global por NTE/período. Qualquer consumidor simultâneo aguarda a mesma RPC.
    if(estadoGlobal.emAndamento.has(chave)){
      const snapshot=await estadoGlobal.emAndamento.get(chave);
      const r=snapshot?.resumo||{};
      const complemento=await complementarTecnicos(snapshot,nte,false);
      window.__SIGEE_DASHBOARD_COMPLEMENTO__=complemento;
      render(r);
      return snapshot;
    }

    const c=cliente();
    if(!c){console.warn('[SIGEE Dashboard] Supabase indisponível.');return}
    carregando=true;
    const requisicao=(async()=>{
      try {
        const resposta=await c.rpc('sigee_dashboard_snapshot',{p_nte:nte||null,p_data_inicio:p.inicioIso,p_data_fim:p.fimIso});
        if(resposta.error)throw resposta.error;
        return typeof resposta.data==='string'?JSON.parse(resposta.data):resposta.data||{};
      } catch (rpcError) {
        console.warn('[SIGEE Dashboard] Falha na RPC sigee_dashboard_snapshot; acionando compatibilidade pós-migração.',rpcError);
        return snapshotDireto(nte,p);
      }
    })();
    estadoGlobal.emAndamento.set(chave,requisicao);

    try{
      const snapshot=await requisicao;
      const r=snapshot.resumo||{};
      const complemento=await complementarTecnicos(snapshot,nte,manual||forcar);
      window.__SIGEE_DASHBOARD_COMPLEMENTO__=complemento;
      const registro={dados:r,complemento,snapshot,em:Date.now()};
      cache.set(chave,registro);
      estadoGlobal.ultimo.set(chave,registro);
      render(r);
      const detail={resumo:r,complemento,contexto:{nte:nte||null,inicio:p.inicioIso,fim:p.fimIso}};
      window.dispatchEvent(new CustomEvent('sigee:snapshot-pronto',{detail}));
      window.dispatchEvent(new CustomEvent('sigee:dashboard-dados-compartilhados',{detail}));
      return snapshot;
    }catch(e){
      console.error('[SIGEE Dashboard RPC]',e);
      set('dashboard-ultima-atualizacao','Falha ao carregar indicadores');
      throw e;
    }finally{
      if(estadoGlobal.emAndamento.get(chave)===requisicao)estadoGlobal.emAndamento.delete(chave);
      carregando=false;
    }
  }
  function agendar(forcar=false,origem='automatica'){clearTimeout(timer);timer=setTimeout(()=>carregar(forcar,origem).catch(()=>{}),120)}
  document.addEventListener('change',e=>{if(['filtro-dashboard-nte','filtro-dashboard-periodo','dashboard-data-inicial','dashboard-data-final'].includes(e.target?.id))agendar(true,'manual')},true);
  document.addEventListener('sigee:navegacao-concluida',e=>{if((e.detail?.rota||e.detail?.aba)==='painel')agendar(false,'navegacao')});
  document.addEventListener('sigee:usuario-logado',()=>agendar(false,'login'));
  window.carregarDadosDashboardReal=()=>agendar(true,'manual');
  window.carregarDadosDashboardRealImediato=()=>carregar(true,'manual');
  window.SIGEE_DASHBOARD_RPC={carregar:(forcar=false)=>carregar(forcar,forcar?'manual':'api'),limparCache:()=>{cache.clear();estadoGlobal.ultimo.clear();},versao:'RC7.4.2'};
  // Sem carga no DOMContentLoaded: o primeiro snapshot nasce somente após login ou navegação real ao painel.
})();
