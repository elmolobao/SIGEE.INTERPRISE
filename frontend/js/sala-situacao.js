/* SIGEE Enterprise 3.2 — Sala de Situação 2.0 */
(function () {
  'use strict';

  const CFG = { refreshMs: 60000, version: '3.2.0' };
  let timer = null;
  let filtroNte = 'GLOBAL';

  const txt = v => (v == null ? '' : String(v).trim());
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
  const arr = (...names) => {
    for (const n of names) if (Array.isArray(window[n])) return window[n];
    return [];
  };
  const processos = () => arr('processosDB','processos');
  const escolas = () => arr('escolasDB','escolasSIGEE','escolas');
  const usuarios = () => arr('usuariosDB','usuariosSIGEE','usuarios');

  function nte(v){
    const s=txt(v); const m=s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    if(m) return 'NTE-'+String(+m[1]).padStart(2,'0');
    if(/^\d{1,2}$/.test(s)) return 'NTE-'+String(+s).padStart(2,'0');
    return s ? norm(s).replace(/[^A-Z0-9-]/g,'') : 'SEM NTE';
  }
  const procNte=p=>nte(p.nte||p.nte_nome||p.grupo||p.territorio||p.nte_id);
  const etapa=p=>txt(p.etapa_atual||p.etapa||p.fase_atual)||'Desarquivamento';
  const dataInicio=p=>p.data_etapa_atual||p.prazo_inicio||p.created_at||p.criado_em||p.data_solicitacao;
  function dias(v){ if(!v)return 0; const d=new Date(v); if(Number.isNaN(d.getTime()))return 0; return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)); }
  function limite(e){ const n=norm(e); if(n.includes('ANAL'))return 7; if(n.includes('DIGIT'))return 15; if(n.includes('CONFER'))return 10; if(n.includes('ASSIN'))return 7; if(n.includes('DESARQ'))return 30; return null; }
  function finalizado(p){ const e=norm(etapa(p)); return e.includes('RETIR')||e.includes('INDEFER'); }
  function vencido(p){ const l=limite(etapa(p)); return !finalizado(p)&&l!=null&&dias(dataInicio(p))>l; }
  function hoje(v){ if(!v)return false; const d=new Date(v), h=new Date(); return d.toDateString()===h.toDateString(); }
  function nomeResp(p){ return txt(p.tecnico_responsavel_nome||p.tecnico_responsavel||p.responsavel_nome||p.responsavel||p.analista_nome||p.digitador_nome||p.conferente_nome)||'Não atribuído'; }

  function esc(v){return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function pct(a,b){return b?Math.round(a*100/b):100;}

  function metricasPorNte(lista){
    const mapa=new Map();
    for(let i=1;i<=27;i++) mapa.set('NTE-'+String(i).padStart(2,'0'),[]);
    lista.forEach(p=>{ const k=procNte(p); if(!mapa.has(k))mapa.set(k,[]); mapa.get(k).push(p); });
    return [...mapa.entries()].map(([codigo,ps])=>{
      const ativos=ps.filter(p=>!finalizado(p));
      const venc=ativos.filter(vencido);
      const concl=ps.filter(finalizado);
      const prazo=ativos.length-venc.length;
      const media=ps.length?Math.round(ps.reduce((s,p)=>s+dias(dataInicio(p)),0)/ps.length):0;
      const sla=pct(prazo,ativos.length);
      const taxa=pct(concl.length,ps.length);
      const semResp=ativos.filter(p=>['ANALISE','PENDENCIA','DIGITACAO','CONFERENCIA','ASSINATURA'].some(x=>norm(etapa(p)).includes(x))&&nomeResp(p)==='Não atribuído').length;
      let igd=Math.round(sla*.45+taxa*.25+Math.max(0,100-Math.min(media,100))*.20+Math.max(0,100-semResp*5)*.10);
      igd=Math.max(0,Math.min(100,igd));
      return {codigo,total:ps.length,ativos:ativos.length,vencidos:venc.length,concluidos:concl.length,sla,media,igd};
    }).sort((a,b)=>b.igd-a.igd);
  }
  function classeIgd(v){return v>=90?'excelente':v>=75?'bom':v>=60?'atencao':v>=40?'critico':'intervencao';}
  function labelIgd(v){return v>=90?'Excelente':v>=75?'Muito bom':v>=60?'Atenção':v>=40?'Crítico':'Intervenção';}

  function garantirEstrutura(){
    const sec=document.getElementById('aba-sala-situacao'); if(!sec)return null;
    sec.classList.add('sigee-sala-v2');
    if(!document.getElementById('sala-v2-toolbar')){
      sec.insertAdjacentHTML('afterbegin',`<div id="sala-v2-toolbar" class="sala-v2-toolbar">
        <div><span>SIGEE ENTERPRISE ${CFG.version}</span><strong>Centro Estadual de Operações</strong></div>
        <div class="sala-v2-actions"><select id="sala-v2-filtro-nte"><option value="GLOBAL">Todos os NTEs</option></select><button id="sala-v2-atualizar" type="button">↻ Atualizar</button></div>
      </div>`);
    }
    if(!document.getElementById('sala-v2-inteligencia')){
      sec.insertAdjacentHTML('beforeend',`<section id="sala-v2-inteligencia" class="sala-v2-inteligencia">
        <article class="sala-v2-panel sala-v2-mapa"><header><div><span>ÍNDICE TERRITORIAL</span><h2>Saúde dos 27 NTEs</h2></div><small>IGD de 0 a 100</small></header><div id="sala-v2-ntes" class="sala-v2-ntes"></div></article>
        <article class="sala-v2-panel"><header><div><span>RANKING ESTADUAL</span><h2>Desempenho territorial</h2></div></header><div id="sala-v2-ranking" class="sala-v2-ranking"></div></article>
        <article class="sala-v2-panel"><header><div><span>INTELIGÊNCIA OPERACIONAL</span><h2>Alertas e recomendações</h2></div></header><div id="sala-v2-alertas" class="sala-v2-alertas"></div></article>
      </section>`);
    }
    const sel=document.getElementById('sala-v2-filtro-nte');
    if(sel&&sel.options.length===1){ for(let i=1;i<=27;i++){const o=document.createElement('option');o.value='NTE-'+String(i).padStart(2,'0');o.textContent=o.value;sel.appendChild(o);} }
    if(sel&&!sel.dataset.bound){sel.dataset.bound='1';sel.addEventListener('change',()=>{filtroNte=sel.value;render();});}
    const b=document.getElementById('sala-v2-atualizar'); if(b&&!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',render);}
    return sec;
  }

  function renderKpis(lista){
    const ativos=lista.filter(p=>!finalizado(p)), venc=ativos.filter(vencido), conclHoje=lista.filter(p=>finalizado(p)&&hoje(p.finalizado_em||p.updated_at)), recHoje=lista.filter(p=>hoje(p.created_at||p.data_solicitacao));
    const sla=pct(ativos.length-venc.length,ativos.length);
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('sala-kpi-ativos',ativos.length); set('sala-kpi-recebidos',recHoje.length); set('sala-kpi-concluidos',conclHoje.length); set('sala-kpi-sla',sla+'%'); set('sala-kpi-vencidos',venc.length);
    set('sala-total-processos',lista.length+' processos'); set('sala-saude-atualizacao',new Date().toLocaleTimeString('pt-BR'));
    const sync=document.getElementById('sala-sync-texto'); if(sync)sync.textContent='Dados sincronizados • '+new Date().toLocaleTimeString('pt-BR');
  }

  function render(){
    if(!garantirEstrutura())return;
    let lista=processos().slice(); if(filtroNte!=='GLOBAL')lista=lista.filter(p=>procNte(p)===filtroNte);
    renderKpis(lista);
    const metricas=metricasPorNte(processos());
    const cards=document.getElementById('sala-v2-ntes');
    if(cards) cards.innerHTML=metricas.map(m=>`<button class="sala-v2-nte ${classeIgd(m.igd)} ${filtroNte===m.codigo?'ativo':''}" data-nte="${m.codigo}"><span>${m.codigo}</span><strong>${m.igd}</strong><small>${labelIgd(m.igd)} · ${m.ativos} ativos</small></button>`).join('');
    cards?.querySelectorAll('[data-nte]').forEach(b=>b.addEventListener('click',()=>{filtroNte=b.dataset.nte;document.getElementById('sala-v2-filtro-nte').value=filtroNte;render();}));
    const ranking=document.getElementById('sala-v2-ranking');
    if(ranking) ranking.innerHTML=metricas.slice(0,10).map((m,i)=>`<div><b>${i+1}</b><span><strong>${m.codigo}</strong><small>SLA ${m.sla}% · ${m.concluidos} concluídos</small></span><em class="${classeIgd(m.igd)}">${m.igd}</em></div>`).join('');
    const alvo=filtroNte==='GLOBAL'?metricas:metricas.filter(m=>m.codigo===filtroNte);
    const alerts=[];
    alvo.filter(m=>m.vencidos>0).sort((a,b)=>b.vencidos-a.vencidos).slice(0,8).forEach(m=>alerts.push({c:'critico',t:`${m.codigo} possui ${m.vencidos} processo(s) vencido(s).`,a:'Priorizar redistribuição e regularização da fila.'}));
    alvo.filter(m=>m.sla<75).slice(0,6).forEach(m=>alerts.push({c:'atencao',t:`${m.codigo} está com SLA de ${m.sla}%.`,a:'Revisar gargalos e responsáveis por etapa.'}));
    alvo.filter(m=>m.igd>=90&&m.total>0).slice(0,4).forEach(m=>alerts.push({c:'positivo',t:`${m.codigo} apresenta desempenho excelente (IGD ${m.igd}).`,a:'Manter acompanhamento e compartilhar boas práticas.'}));
    if(!alerts.length) alerts.push({c:'positivo',t:'Nenhum alerta crítico identificado na abrangência selecionada.',a:'Operação dentro dos parâmetros atuais.'});
    const alertBox=document.getElementById('sala-v2-alertas'); if(alertBox)alertBox.innerHTML=alerts.slice(0,12).map(x=>`<div class="${x.c}"><i></i><span><strong>${esc(x.t)}</strong><small>${esc(x.a)}</small></span></div>`).join('');
    const version=document.querySelector('.sigee-sala-saude dd:last-child'); if(version)version.textContent=CFG.version;
  }

  function ligarNavegacao(){
    const antiga=window.navegar;
    if(typeof antiga==='function'&&!antiga.__salaV2){
      const nova=function(destino){const r=antiga.apply(this,arguments); if(destino==='sala-situacao')setTimeout(render,80); return r;}; nova.__salaV2=true; window.navegar=nova;
    }
  }
  function init(){garantirEstrutura();ligarNavegacao();render();clearInterval(timer);timer=setInterval(()=>{if(!document.getElementById('aba-sala-situacao')?.classList.contains('hidden'))render();},CFG.refreshMs);}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
  window.SIGEE_SALA_SITUACAO_V2={render,version:CFG.version};
})();
