/* SIGEE Enterprise 3.2.1 — Sala de Situação oficial e autossuficiente */
(function () {
  'use strict';

  var VERSION = '3.2.2';
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
    if (!document.getElementById('sala-v2-inteligencia')) {
      sec.insertAdjacentHTML('beforeend', '<section id="sala-v2-inteligencia" class="sala-v2-inteligencia"><article class="sala-v2-panel sala-v2-mapa"><header><div><span>ÍNDICE TERRITORIAL</span><h2>Saúde dos 27 NTEs</h2></div><small>IGD de 0 a 100</small></header><div id="sala-v2-ntes" class="sala-v2-ntes"></div></article><article class="sala-v2-panel"><header><div><span>RANKING ESTADUAL</span><h2>Desempenho territorial</h2></div></header><div id="sala-v2-ranking" class="sala-v2-ranking"></div></article><article class="sala-v2-panel"><header><div><span>INTELIGÊNCIA OPERACIONAL</span><h2>Alertas e recomendações</h2></div></header><div id="sala-v2-alertas" class="sala-v2-alertas"></div></article></section>');
    }
    var sel = document.getElementById('sala-v2-filtro-nte');
    if (sel && sel.options.length === 1) {
      for (var i=1;i<=27;i++) { var o=document.createElement('option'); o.value='NTE-'+String(i).padStart(2,'0'); o.textContent=o.value; sel.appendChild(o); }
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

  function render() {
    var sec=garantirEstrutura(); if(!sec) return;
    var todos=lista().slice();
    var base=filtroNte==='GLOBAL'?todos:todos.filter(function(p){return procNte(p)===filtroNte;});
    var ativos=base.filter(function(p){return !finalizado(p);}), venc=ativos.filter(vencido);
    var conclHoje=base.filter(function(p){return finalizado(p)&&hoje(p.finalizado_em||p.updated_at);});
    var recHoje=base.filter(function(p){return hoje(p.created_at||p.data_solicitacao);});
    var sla=pct(ativos.length-venc.length,ativos.length);
    setText('sala-kpi-ativos',ativos.length); setText('sala-kpi-recebidos',recHoje.length); setText('sala-kpi-concluidos',conclHoje.length); setText('sala-kpi-sla',sla+'%'); setText('sala-kpi-vencidos',venc.length); setText('sala-total-processos',base.length+' processos'); setText('sala-saude-atualizacao',new Date().toLocaleTimeString('pt-BR')); setText('sala-saude-banco',todos.length?'Conectado':'Aguardando dados'); setText('sala-saude-sync','Sincronizado');
    var sync=document.getElementById('sala-sync-texto'); if(sync) sync.textContent=(todos.length?'Dados sincronizados':'Aguardando carregamento dos dados')+' • '+new Date().toLocaleTimeString('pt-BR');
    renderFluxo(base); renderAlertasBase(base); renderFeed(base);

    var metricas=metricasNte(todos), cards=document.getElementById('sala-v2-ntes');
    if(cards) cards.innerHTML=metricas.map(function(m){return '<button class="sala-v2-nte '+classe(m.igd)+(filtroNte===m.codigo?' ativo':'')+'" data-nte="'+m.codigo+'"><span>'+m.codigo+'</span><strong>'+m.igd+'</strong><small>'+label(m.igd)+' · '+m.ativos+' ativos</small></button>';}).join('');
    if(cards) Array.prototype.forEach.call(cards.querySelectorAll('[data-nte]'),function(b){b.addEventListener('click',function(){filtroNte=b.dataset.nte;document.getElementById('sala-v2-filtro-nte').value=filtroNte;render();});});
    var ranking=document.getElementById('sala-v2-ranking');
    if(ranking) ranking.innerHTML=metricas.slice(0,10).map(function(m,i){return '<div><b>'+(i+1)+'</b><span><strong>'+m.codigo+'</strong><small>SLA '+m.sla+'% · '+m.concluidos+' concluídos</small></span><em class="'+classe(m.igd)+'">'+m.igd+'</em></div>';}).join('');
    var alvo=filtroNte==='GLOBAL'?metricas:metricas.filter(function(m){return m.codigo===filtroNte;}), alerts=[];
    alvo.filter(function(m){return m.vencidos>0;}).sort(function(a,b){return b.vencidos-a.vencidos;}).slice(0,8).forEach(function(m){alerts.push({c:'critico',t:m.codigo+' possui '+m.vencidos+' processo(s) vencido(s).',a:'Priorizar regularização da fila.'});});
    alvo.filter(function(m){return m.sla<75;}).slice(0,6).forEach(function(m){alerts.push({c:'atencao',t:m.codigo+' está com SLA de '+m.sla+'%.',a:'Revisar gargalos por etapa.'});});
    if(!alerts.length) alerts.push({c:'positivo',t:'Nenhum alerta crítico identificado.',a:'Operação dentro dos parâmetros atuais.'});
    var alertBox=document.getElementById('sala-v2-alertas'); if(alertBox) alertBox.innerHTML=alerts.slice(0,12).map(function(x){return '<div class="'+x.c+'"><i></i><span><strong>'+esc(x.t)+'</strong><small>'+esc(x.a)+'</small></span></div>';}).join('');
  }


  function mostrarSala() {
    var alvo = document.getElementById('aba-sala-situacao');
    if (!alvo) return false;
    document.body.classList.add('sigee-sala-aberta');
    document.querySelectorAll('main > section[id^="aba-"]').forEach(function(sec){
      if (sec !== alvo) sec.classList.add('hidden');
    });
    alvo.classList.remove('hidden');
    alvo.classList.add('sigee-sala-ativa');
    alvo.style.display = 'block';
    alvo.style.visibility = 'visible';
    alvo.style.opacity = '1';
    render();
    setTimeout(render, 100);
    setTimeout(render, 600);
    return true;
  }

  window.abrirSalaSituacaoSIGEE = function(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    try {
      if (typeof window.navegar === 'function') window.navegar('sala-situacao');
    } catch (e) { console.warn('[SIGEE Sala] Navegação geral não confirmou a abertura.', e); }
    mostrarSala();
    setTimeout(mostrarSala, 80);
    setTimeout(mostrarSala, 350);
    return false;
  };

  function ligarNavegacao() {
    var antiga=window.navegar;
    if(typeof antiga==='function'&&!antiga.__sala321){
      var nova=function(destino){if(destino!=='sala-situacao') document.body.classList.remove('sigee-sala-aberta'); var r=antiga.apply(this,arguments);if(destino==='sala-situacao'){setTimeout(mostrarSala,20);setTimeout(mostrarSala,250);}return r;};
      nova.__sala321=true; window.navegar=nova;
      try { navegar=nova; } catch(e) {}
    }
  }
  function init() {
    ligarNavegacao();
    if(!garantirEstrutura()) { if(retries++<20) setTimeout(init,250); return; }
    var menu = document.getElementById('menu-sala-situacao');
    if (menu && !menu.dataset.sala322) {
      menu.dataset.sala322 = '1';
      menu.addEventListener('click', function(ev){ window.abrirSalaSituacaoSIGEE(ev); }, true);
    }
    var sec = document.getElementById('aba-sala-situacao');
    if (sec && !sec.__salaObserver) {
      sec.__salaObserver = new MutationObserver(function(){
        if (document.body.classList.contains('sigee-sala-aberta') && sec.classList.contains('hidden')) mostrarSala();
      });
      sec.__salaObserver.observe(sec, {attributes:true, attributeFilter:['class','style']});
    }
    render();
    clearInterval(timer); timer=setInterval(function(){var s=document.getElementById('aba-sala-situacao');if(s&&!s.classList.contains('hidden'))render();},REFRESH_MS);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.SIGEE_SALA_SITUACAO={render:render,version:VERSION};
})();
