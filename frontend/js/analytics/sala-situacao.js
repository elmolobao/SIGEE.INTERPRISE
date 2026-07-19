/* SIGEE Enterprise 3.2.1 — Sala de Situação oficial e autossuficiente */
(function () {
  'use strict';

  var VERSION = '3.2.9';
  var REFRESH_MS = 60000;
  var filtroNte = 'GLOBAL';
  var timer = null;
  var retries = 0;

  function txt(v) { return v == null ? '' : String(v).trim(); }
  function norm(v) { return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' '); }
  function lista() {
    if (Array.isArray(window.processosDB)) return window.processosDB;
    if (Array.isArray(window.processos)) return window.processos;
    try { if (typeof processosDB !== 'undefined' && Array.isArray(processosDB)) return processosDB; } catch (e) {}
    return [];
  }
  function dataValida(v) {
    if (!v) return null;
    var s = txt(v), d;
    var br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    else d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function dias(v) {
    var d = dataValida(v); if (!d) return 0;
    var h = new Date(); h.setHours(0,0,0,0); d.setHours(0,0,0,0);
    return Math.max(0, Math.floor((h.getTime() - d.getTime()) / 86400000));
  }
  function nte(v) {
    var s = txt(v), m = s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    if (m) return 'NTE-' + String(Number(m[1])).padStart(2, '0');
    if (/^\d{1,2}$/.test(s)) return 'NTE-' + String(Number(s)).padStart(2, '0');
    return s ? norm(s).replace(/[^A-Z0-9-]/g, '') : 'SEM NTE';
  }
  function etapa(p) { return txt(p && (p.etapa_atual || p.etapa || p.fase_atual)) || 'Desarquivamento'; }
  function procNte(p) { return nte(p && (p.nte || p.nte_nome || p.grupo || p.territorio || p.nte_id)); }
  function podeGlobal(){ return Boolean(window.SIGEE_PERMISSOES?.ehGlobal?.()); }
  function nteUsuario(){ return nte(window.SIGEE_PERMISSOES?.nteAtual?.() || (window.usuarioLogado && (window.usuarioLogado.nte || window.usuarioLogado.nte_nome || window.usuarioLogado.grupo))); }
  function escopo(lista){ return window.SIGEE_PERMISSOES?.filtrarTerritorio ? window.SIGEE_PERMISSOES.filtrarTerritorio(lista) : (podeGlobal() ? lista.slice() : lista.filter(function(p){ return procNte(p)===nteUsuario(); })); }
  function inicio(p) { return p && (p.data_etapa_atual || p.prazo_inicio || p.created_at || p.criado_em || p.data_solicitacao); }
  function finalizado(p) { var e = norm(etapa(p)); return e.indexOf('RETIR') >= 0 || e.indexOf('INDEFER') >= 0; }
  function limite(e) {
    var n = norm(e);
    if (n.indexOf('DESARQ') >= 0) return 30;
    if (n.indexOf('ANAL') >= 0) return 7;
    if (n.indexOf('DIGIT') >= 0) return 15;
    if (n.indexOf('CONFER') >= 0) return 10;
    if (n.indexOf('ASSIN') >= 0) return 7;
    return null;
  }
  function vencido(p) { var l = limite(etapa(p)); return !finalizado(p) && l != null && dias(inicio(p)) > l; }
  function hoje(v) { var d = dataValida(v), h = new Date(); return !!d && d.toDateString() === h.toDateString(); }
  function pct(a,b) { return b ? Math.round((a * 100) / b) : 100; }
  function esc(v) { return txt(v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }

  function garantirEstrutura() {
    var sec = document.getElementById('aba-sala-situacao');
    if (!sec) return null;
    sec.classList.add('sigee-sala-v2');

    if (!document.getElementById('sala-v2-toolbar')) {
      sec.insertAdjacentHTML('afterbegin', '<div id="sala-v2-toolbar" class="sala-v2-toolbar"><div><span>SIGEE ENTERPRISE '+VERSION+'</span><strong>Centro Estadual de Operações</strong></div><div class="sala-v2-actions"><select id="sala-v2-filtro-nte"><option value="GLOBAL">Todos os NTEs</option></select><button id="sala-v2-atualizar" type="button">↻ Atualizar</button></div></div>');
    }
    if (!document.getElementById('sala-v2-graficos')) {
      sec.insertAdjacentHTML('beforeend', '<section id="sala-v2-graficos" class="sala-v2-graficos"><article class="sala-v2-panel sala-grafico-fluxo"><header><div><span>FLUXO OPERACIONAL</span><h2>Distribuição por etapa</h2></div><small>Volume atual</small></header><div id="sala-grafico-fluxo" class="sala-chart-bars"></div></article><article class="sala-v2-panel sala-grafico-status"><header><div><span>STATUS DA CARTEIRA</span><h2>Composição dos processos</h2></div><small>Percentual</small></header><div id="sala-grafico-status" class="sala-chart-donut-wrap"></div></article><article class="sala-v2-panel sala-grafico-evolucao"><header><div><span>EVOLUÇÃO MENSAL</span><h2>Solicitações recebidas</h2></div><small>Últimos 12 meses</small></header><div id="sala-grafico-evolucao" class="sala-chart-line"></div></article><article class="sala-v2-panel sala-grafico-territorial"><header><div><span>DESEMPENHO TERRITORIAL</span><h2>SLA por NTE</h2></div><small>Top 10 por volume</small></header><div id="sala-grafico-territorial" class="sala-chart-territorial"></div></article></section>');
    }
    if (!document.getElementById('sala-v2-inteligencia')) {
      sec.insertAdjacentHTML('beforeend', '<section id="sala-v2-inteligencia" class="sala-v2-inteligencia"><article class="sala-v2-panel sala-v2-mapa"><header><div><span>ÍNDICE TERRITORIAL</span><h2>Saúde dos 27 NTEs</h2></div><small>IGD de 0 a 100</small></header><div id="sala-v2-ntes" class="sala-v2-ntes"></div></article><article class="sala-v2-panel"><header><div><span>RANKING ESTADUAL</span><h2>Desempenho territorial</h2></div></header><div id="sala-v2-ranking" class="sala-v2-ranking"></div></article><article class="sala-v2-panel"><header><div><span>INTELIGÊNCIA OPERACIONAL</span><h2>Alertas e recomendações</h2></div></header><div id="sala-v2-alertas" class="sala-v2-alertas"></div></article></section>');
    }
    var sel = document.getElementById('sala-v2-filtro-nte');
    if (sel && sel.options.length === 1) {
      for (var i=1;i<=27;i++) { var o=document.createElement('option'); o.value='NTE-'+String(i).padStart(2,'0'); o.textContent=o.value; sel.appendChild(o); }
      if (!podeGlobal()) { var meuNte=nteUsuario(); sel.value=meuNte; sel.disabled=true; filtroNte=meuNte; }
    }
    if (sel && !sel.dataset.bound) { sel.dataset.bound='1'; sel.addEventListener('change', function(){ filtroNte=sel.value; render(); }); }
    var btn=document.getElementById('sala-v2-atualizar');
    if (btn && !btn.dataset.bound) { btn.dataset.bound='1'; btn.addEventListener('click', render); }
    return sec;
  }

  function metricasNte(base) {
    var mapa = new Map();
    for (var i=1;i<=27;i++) mapa.set('NTE-'+String(i).padStart(2,'0'), []);
    base.forEach(function(p){ var k=procNte(p); if(!mapa.has(k)) mapa.set(k,[]); mapa.get(k).push(p); });
    return Array.from(mapa.entries()).map(function(entry){
      var codigo=entry[0], ps=entry[1], ativos=ps.filter(function(p){return !finalizado(p);});
      var venc=ativos.filter(vencido), concl=ps.filter(finalizado), prazo=ativos.length-venc.length;
      var media=ps.length ? Math.round(ps.reduce(function(s,p){return s+dias(inicio(p));},0)/ps.length) : 0;
      var sla=pct(prazo,ativos.length), taxa=pct(concl.length,ps.length);
      var igd=Math.max(0,Math.min(100,Math.round(sla*.55+taxa*.25+Math.max(0,100-Math.min(media,100))*.20)));
      return {codigo:codigo,total:ps.length,ativos:ativos.length,vencidos:venc.length,concluidos:concl.length,sla:sla,media:media,igd:igd};
    }).sort(function(a,b){return b.igd-a.igd;});
  }
  function classe(v){ return v>=90?'excelente':v>=75?'bom':v>=60?'atencao':v>=40?'critico':'intervencao'; }
  function label(v){ return v>=90?'Excelente':v>=75?'Muito bom':v>=60?'Atenção':v>=40?'Crítico':'Intervenção'; }

  function statusOperacional(m) {
    if (!m.total) return 'Sem demanda';
    if (m.vencidos > 0 && m.sla < 60) return 'Intervenção prioritária';
    if (m.vencidos > 0 || m.sla < 75) return 'Atenção operacional';
    return 'Operação regular';
  }

  function renderVisaoTerritorial(metricas) {
    var box = document.getElementById('sala-ntes');
    if (!box) return;
    box.innerHTML = metricas.map(function (m) {
      return '<button type="button" class="sala-territorio-card '+classe(m.igd)+(filtroNte===m.codigo?' ativo':'')+'" data-territorio="'+m.codigo+'">'
        + '<div class="sala-territorio-topo"><strong>'+m.codigo+'</strong><em>'+m.igd+'</em></div>'
        + '<span class="sala-territorio-status">'+esc(statusOperacional(m))+'</span>'
        + '<dl>'
        + '<div><dt>SLA</dt><dd>'+m.sla+'%</dd></div>'
        + '<div><dt>Ativos</dt><dd>'+m.ativos+'</dd></div>'
        + '<div><dt>Vencidos</dt><dd>'+m.vencidos+'</dd></div>'
        + '<div><dt>Tempo médio</dt><dd>'+m.media+'d</dd></div>'
        + '</dl></button>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-territorio]'), function (btn) {
      btn.addEventListener('click', function () {
        filtroNte = btn.dataset.territorio;
        var sel = document.getElementById('sala-v2-filtro-nte');
        if (sel) sel.value = filtroNte;
        render();
      });
    });
  }

  function renderRankingsTerritoriais(metricas) {
    var ranking=document.getElementById('sala-v2-ranking');
    if (!ranking) return;
    var desempenho=metricas.slice().sort(function(a,b){return b.igd-a.igd;}).slice(0,10);
    var demanda=metricas.slice().sort(function(a,b){return b.total-a.total;}).slice(0,10);
    var tempo=metricas.filter(function(m){return m.total>0;}).sort(function(a,b){return b.media-a.media;}).slice(0,10);
    function linhas(lista, tipo) {
      return lista.map(function(m,i){
        var detalhe = tipo==='demanda' ? m.total+' processos' : tipo==='tempo' ? m.media+' dias médios' : 'SLA '+m.sla+'% · '+m.concluidos+' concluídos';
        var valor = tipo==='demanda' ? m.total : tipo==='tempo' ? m.media+'d' : m.igd;
        return '<div><b>'+(i+1)+'</b><span><strong>'+m.codigo+'</strong><small>'+detalhe+'</small></span><em class="'+classe(m.igd)+'">'+valor+'</em></div>';
      }).join('');
    }
    ranking.innerHTML='<div class="sala-ranking-tabs" role="tablist">'
      +'<button type="button" class="ativo" data-ranking="desempenho">Melhor IGD</button>'
      +'<button type="button" data-ranking="demanda">Maior demanda</button>'
      +'<button type="button" data-ranking="tempo">Maior tempo</button></div>'
      +'<div class="sala-ranking-lista" data-ranking-lista="desempenho">'+linhas(desempenho,'desempenho')+'</div>'
      +'<div class="sala-ranking-lista hidden" data-ranking-lista="demanda">'+linhas(demanda,'demanda')+'</div>'
      +'<div class="sala-ranking-lista hidden" data-ranking-lista="tempo">'+(tempo.length?linhas(tempo,'tempo'):'<div class="sala-vazio">Sem dados suficientes.</div>')+'</div>';
    Array.prototype.forEach.call(ranking.querySelectorAll('[data-ranking]'),function(btn){btn.addEventListener('click',function(){
      Array.prototype.forEach.call(ranking.querySelectorAll('[data-ranking]'),function(x){x.classList.toggle('ativo',x===btn);});
      Array.prototype.forEach.call(ranking.querySelectorAll('[data-ranking-lista]'),function(x){x.classList.toggle('hidden',x.dataset.rankingLista!==btn.dataset.ranking);});
    });});
  }

  function renderFluxo(base) {
    var ordem=['Desarquivamento','Análise','Pendência','Digitação','Conferência','Assinatura','Aguardando Retirada','Retirado','Indeferido'];
    var box=document.getElementById('sala-fluxo-etapas'); if(!box) return;
    box.innerHTML=ordem.map(function(e){
      var q=base.filter(function(p){return norm(etapa(p))===norm(e);}).length;
      return '<div class="sala-etapa"><span>'+esc(e)+'</span><strong>'+q+'</strong></div>';
    }).join('');
  }
  function renderAlertasBase(base) {
    var box=document.getElementById('sala-alertas-lista'); if(!box) return;
    var venc=base.filter(vencido).sort(function(a,b){return dias(inicio(b))-dias(inicio(a));}).slice(0,8);
    box.innerHTML=venc.length ? venc.map(function(p){return '<div class="sala-alerta-item"><strong>'+esc(procNte(p))+' · '+esc(etapa(p))+'</strong><span>'+dias(inicio(p))+' dias na etapa</span></div>';}).join('') : '<div class="sala-vazio">Nenhum processo crítico identificado.</div>';
  }
  function renderFeed(base) {
    var box=document.getElementById('sala-feed'); if(!box) return;
    var itens=base.slice().sort(function(a,b){return (dataValida(b.updated_at||b.created_at)||0)-(dataValida(a.updated_at||a.created_at)||0);}).slice(0,8);
    box.innerHTML=itens.length ? itens.map(function(p){return '<div class="sala-feed-item"><strong>'+esc(p.aluno_nome||p.aluno||'Processo')+'</strong><span>'+esc(etapa(p))+' · '+esc(procNte(p))+'</span></div>';}).join('') : '<div class="sala-vazio">Nenhuma movimentação disponível.</div>';
  }


  function paletaEtapa(e) {
    var n=norm(e);
    if(n.indexOf('DESARQ')>=0)return '#94a3b8';
    if(n.indexOf('ANAL')>=0)return '#8b5cf6';
    if(n.indexOf('PEND')>=0)return '#ef4444';
    if(n.indexOf('DIGIT')>=0)return '#3b82f6';
    if(n.indexOf('CONFER')>=0)return '#f97316';
    if(n.indexOf('ASSIN')>=0)return '#eab308';
    if(n.indexOf('AGUARD')>=0)return '#10b981';
    if(n.indexOf('RETIR')>=0)return '#64748b';
    return '#dc2626';
  }
  function renderGraficoFluxo(base) {
    var ordem=['Desarquivamento','Análise','Pendência','Digitação','Conferência','Assinatura','Aguardando Retirada','Retirado','Indeferido'];
    var dados=ordem.map(function(e){return {nome:e,valor:base.filter(function(p){return norm(etapa(p))===norm(e);}).length};});
    var max=Math.max.apply(null,dados.map(function(x){return x.valor;}))||1;
    var box=document.getElementById('sala-grafico-fluxo'); if(!box)return;
    box.innerHTML=dados.map(function(x){var w=Math.max(2,Math.round(x.valor*100/max));return '<div class="sala-bar-row"><span>'+esc(x.nome)+'</span><div><i style="width:'+w+'%;background:'+paletaEtapa(x.nome)+'"></i></div><strong>'+x.valor+'</strong></div>';}).join('');
  }
  function renderGraficoStatus(base) {
    var ativos=base.filter(function(p){return !finalizado(p);});
    var ven=ativos.filter(vencido).length;
    var pend=base.filter(function(p){return norm(etapa(p)).indexOf('PEND')>=0;}).length;
    var concl=base.filter(finalizado).length;
    var prazo=Math.max(0,ativos.length-ven);
    var total=Math.max(1,prazo+ven+pend+concl);
    var vals=[prazo,ven,pend,concl], cores=['#10b981','#ef4444','#f59e0b','#3b82f6'];
    var acc=0, stops=[];
    vals.forEach(function(v,i){var start=acc/total*100;acc+=v;var end=acc/total*100;stops.push(cores[i]+' '+start+'% '+end+'%');});
    var box=document.getElementById('sala-grafico-status');if(!box)return;
    box.innerHTML='<div class="sala-donut" style="background:conic-gradient('+stops.join(',')+')"><div><strong>'+base.length+'</strong><span>processos</span></div></div><div class="sala-donut-legend"><p><i style="background:#10b981"></i>No prazo <b>'+prazo+'</b></p><p><i style="background:#ef4444"></i>Vencidos <b>'+ven+'</b></p><p><i style="background:#f59e0b"></i>Pendências <b>'+pend+'</b></p><p><i style="background:#3b82f6"></i>Concluídos <b>'+concl+'</b></p></div>';
  }
  function renderGraficoEvolucao(base) {
    var agora=new Date(), meses=[];
    for(var i=11;i>=0;i--){var d=new Date(agora.getFullYear(),agora.getMonth()-i,1);meses.push({ano:d.getFullYear(),mes:d.getMonth(),rot:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),valor:0});}
    base.forEach(function(p){var d=dataValida(p.created_at||p.data_solicitacao||p.criado_em);if(!d)return;meses.forEach(function(m){if(d.getFullYear()===m.ano&&d.getMonth()===m.mes)m.valor++;});});
    var max=Math.max.apply(null,meses.map(function(m){return m.valor;}))||1,w=720,h=230,pad=28;
    var pts=meses.map(function(m,i){var x=pad+i*((w-pad*2)/(meses.length-1));var y=h-pad-(m.valor/max)*(h-pad*2);return {x:x,y:y,m:m};});
    var path=pts.map(function(p,i){return (i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1);}).join(' ');
    var area=path+' L '+pts[pts.length-1].x+' '+(h-pad)+' L '+pts[0].x+' '+(h-pad)+' Z';
    var svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Evolução mensal"><defs><linearGradient id="salaArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".38"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs><path d="'+area+'" fill="url(#salaArea)"/><path d="'+path+'" fill="none" stroke="#67e8f9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map(function(p){return '<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#071426" stroke="#67e8f9" stroke-width="3"><title>'+p.m.rot+': '+p.m.valor+'</title></circle>';}).join('')+pts.map(function(p){return '<text x="'+p.x+'" y="'+(h-5)+'" text-anchor="middle">'+p.m.rot+'</text>';}).join('')+'</svg>';
    var box=document.getElementById('sala-grafico-evolucao');if(box)box.innerHTML=svg;
  }
  function renderGraficoTerritorial(metricas) {
    var dados=metricas.filter(function(m){return m.total>0;}).sort(function(a,b){return b.total-a.total;}).slice(0,10);
    var box=document.getElementById('sala-grafico-territorial');if(!box)return;
    box.innerHTML=dados.length?dados.map(function(m){return '<button data-grafico-nte="'+m.codigo+'"><span>'+m.codigo+'</span><div><i class="'+classe(m.sla)+'" style="width:'+m.sla+'%"></i></div><strong>'+m.sla+'%</strong><small>'+m.total+' proc.</small></button>';}).join(''):'<div class="sala-vazio">Sem dados territoriais disponíveis.</div>';
    Array.prototype.forEach.call(box.querySelectorAll('[data-grafico-nte]'),function(b){b.addEventListener('click',function(){filtroNte=b.dataset.graficoNte;var sel=document.getElementById('sala-v2-filtro-nte');if(sel)sel.value=filtroNte;render();});});
  }

  function render() {
    var sec=garantirEstrutura(); if(!sec) return;
    var todos=lista().slice();
    todos=escopo(todos);
    if (!podeGlobal()) filtroNte=nteUsuario();
    var base=filtroNte==='GLOBAL'?todos:todos.filter(function(p){return procNte(p)===filtroNte;});
    var ativos=base.filter(function(p){return !finalizado(p);}), venc=ativos.filter(vencido);
    var conclHoje=base.filter(function(p){return finalizado(p)&&hoje(p.finalizado_em||p.updated_at);});
    var recHoje=base.filter(function(p){return hoje(p.created_at||p.data_solicitacao);});
    var sla=pct(ativos.length-venc.length,ativos.length);
    setText('sala-kpi-ativos',ativos.length); setText('sala-kpi-recebidos',recHoje.length); setText('sala-kpi-concluidos',conclHoje.length); setText('sala-kpi-sla',sla+'%'); setText('sala-kpi-vencidos',venc.length); setText('sala-total-processos',base.length+' processos'); setText('sala-saude-atualizacao',new Date().toLocaleTimeString('pt-BR')); setText('sala-saude-banco',todos.length?'Conectado':'Aguardando dados'); setText('sala-saude-sync','Sincronizado');
    var sync=document.getElementById('sala-sync-texto'); if(sync) sync.textContent=(todos.length?'Dados sincronizados':'Aguardando carregamento dos dados')+' • '+new Date().toLocaleTimeString('pt-BR');
    renderFluxo(base); renderAlertasBase(base); renderFeed(base);

    var metricas=metricasNte(todos);
    renderGraficoFluxo(base); renderGraficoStatus(base); renderGraficoEvolucao(base); renderGraficoTerritorial(metricas);
    renderVisaoTerritorial(metricas);
    var cards=document.getElementById('sala-v2-ntes');
    if(cards) cards.innerHTML=metricas.map(function(m){return '<button class="sala-v2-nte '+classe(m.igd)+(filtroNte===m.codigo?' ativo':'')+'" data-nte="'+m.codigo+'"><span>'+m.codigo+'</span><strong>'+m.igd+'</strong><small>'+label(m.igd)+' · SLA '+m.sla+'% · '+m.ativos+' ativos</small><em>'+esc(statusOperacional(m))+'</em></button>';}).join('');
    if(cards) Array.prototype.forEach.call(cards.querySelectorAll('[data-nte]'),function(b){b.addEventListener('click',function(){filtroNte=b.dataset.nte;var sel=document.getElementById('sala-v2-filtro-nte');if(sel)sel.value=filtroNte;render();});});
    renderRankingsTerritoriais(metricas);
    var alvo=filtroNte==='GLOBAL'?metricas:metricas.filter(function(m){return m.codigo===filtroNte;}), alerts=[];
    alvo.filter(function(m){return m.vencidos>0;}).sort(function(a,b){return b.vencidos-a.vencidos;}).slice(0,8).forEach(function(m){alerts.push({c:'critico',t:m.codigo+' possui '+m.vencidos+' processo(s) vencido(s).',a:'Priorizar regularização da fila.'});});
    alvo.filter(function(m){return m.sla<75;}).slice(0,6).forEach(function(m){alerts.push({c:'atencao',t:m.codigo+' está com SLA de '+m.sla+'%.',a:'Revisar gargalos por etapa.'});});
    if(!alerts.length) alerts.push({c:'positivo',t:'Nenhum alerta crítico identificado.',a:'Operação dentro dos parâmetros atuais.'});
    var alertBox=document.getElementById('sala-v2-alertas'); if(alertBox) alertBox.innerHTML=alerts.slice(0,12).map(function(x){return '<div class="'+x.c+'"><i></i><span><strong>'+esc(x.t)+'</strong><small>'+esc(x.a)+'</small></span></div>';}).join('');
  }



  function init() {
    if (!garantirEstrutura()) {
      if (retries++ < 20) setTimeout(init, 250);
      return;
    }

    var menu = document.getElementById('menu-sala-situacao');
    if (menu && !menu.dataset.sala327) {
      menu.dataset.sala327 = '1';
      menu.addEventListener('click', function () {
        setTimeout(render, 100);
      });
    }

    var telaCheia = document.getElementById('sala-btn-tela-cheia');
    if (telaCheia && !telaCheia.dataset.bound) {
      telaCheia.dataset.bound = '1';
      telaCheia.addEventListener('click', function () {
        var sala = document.getElementById('aba-sala-situacao');
        if (!sala) return;
        if (!document.fullscreenElement && sala.requestFullscreen) sala.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
      });
    }

    render();
    clearInterval(timer);
    timer = setInterval(function () {
      var sala = document.getElementById('aba-sala-situacao');
      if (sala && !sala.classList.contains('hidden')) render();
    }, REFRESH_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SIGEE_SALA_SITUACAO = {
    render: render,
    version: '3.2.9'
  };
})();
