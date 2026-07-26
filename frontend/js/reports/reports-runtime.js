/* SIGEE Enterprise RC7.0.1 — Relatórios registrados no Menu Manager */
(function(){
'use strict';
if(window.__SIGEE_REPORTS_RC701__) return; window.__SIGEE_REPORTS_RC701__=true;
const txt=v=>v==null?'':String(v).trim(), norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R=()=>window.SIGEE_REGRAS_OPERACIONAIS;
const tipos=[
 ['operacional','📊','Relatório Operacional'],['sla','⏱️','Relatório de SLA'],['territorial','🗺️','Relatório Territorial'],['pendencias','⏸️','Relatório de Pendências'],['produtividade','👥','Relatório de Produtividade'],['executivo','📈','Relatório Executivo']
];
let state={payload:null,tipo:null,menuIntegrado:false};
function finalizado(p){const e=norm(R().etapa(p));return e.includes('RETIR')||e.includes('INDEFER')||e.includes('DEFERIDO');}
function data(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
function dias(v){const d=data(v);return d?Math.max(0,Math.floor((Date.now()-d)/86400000)):0;}
function limite(e){const n=norm(e);if(n.includes('DESARQ'))return 30;if(n.includes('ANAL'))return 7;if(n.includes('DIGIT'))return 15;if(n.includes('CONFER'))return 10;if(n.includes('ASSIN'))return 7;if(n.includes('PENDEN'))return null;return null;}
function atraso(p){if(finalizado(p)||R().pendenciaAluno(p))return false;const l=limite(R().etapa(p));return l!=null&&dias(p.data_etapa_atual||p.data_etapa||p.created_at)>l;}
function responsavel(p){return txt(p.tecnico_atribuido||p.tecnico_responsavel||p.responsavel_etapa||p.analista||p.digitador||p.conferente||p.responsavel||p.usuario_lancamento||p.criado_por_nome);}
function dados(){const ps=state.payload.processos,ativos=ps.filter(p=>!finalizado(p)),externas=ativos.filter(R().pendenciaAluno),operacionais=ativos.filter(p=>!R().pendenciaAluno(p)),atrasados=operacionais.filter(atraso);return {ps,ativos,externas,operacionais,atrasados};}
function main(){return document.querySelector('#sistema-dashboard main');}
function abasOficiais(){const m=main();return m?[...m.children].filter(el=>el.tagName==='SECTION'):[];}
function ocultarModulo(el){if(!el)return;el.classList.add('hidden');el.setAttribute('aria-hidden','true');el.style.display='none';}
function mostrarModulo(el){if(!el)return;el.classList.remove('hidden');el.removeAttribute('aria-hidden');el.style.display='block';}
function esconderTudo(){
  abasOficiais().forEach(ocultarModulo);
  document.querySelectorAll('.sigee-cio-page,[data-cio-root],#centro-inteligencia-container,#sigee-centro-inteligencia').forEach(ocultarModulo);
}
function host(tipo){return document.getElementById('aba-relatorio-'+tipo);}
function abrir(tipo,forcar=false){
  if(!tipos.some(x=>x[0]===tipo)) return;
  state.tipo=tipo;
  esconderTudo();
  const h=host(tipo);
  if(!h){console.error('[SIGEE RC6.6.0] Aba oficial não localizada:',tipo);return;}
  mostrarModulo(h);
  h.innerHTML='<div class="sig-rel-loading">Consolidando dados do relatório...</div>';
  window.SIGEE_REPORTS_DATA.carregar(forcar).then(p=>{
    state.payload=p;
    if(state.tipo!==tipo)return;
    esconderTudo();mostrarModulo(h);render(h,tipo);
  }).catch(e=>{
    esconderTudo();mostrarModulo(h);
    h.innerHTML='<div class="sig-rel-error"><h2>Não foi possível carregar o relatório</h2><p>'+esc(e.message)+'</p><button data-retry>Tentar novamente</button></div>';
    h.querySelector('[data-retry]')?.addEventListener('click',()=>abrir(tipo,true));
  });
  marcarMenu(tipo);
  window.scrollTo({top:0,behavior:'auto'});
}
function marcarMenu(tipo){document.querySelectorAll('[data-report-menu]').forEach(b=>b.classList.toggle('active',b.dataset.reportMenu===tipo));}
function card(t,v,s){return '<article><span>'+esc(t)+'</span><strong>'+esc(v)+'</strong><small>'+esc(s)+'</small></article>';}
function tabela(arr){return '<div class="sig-rel-table"><table><thead><tr><th>Processo</th><th>Aluno / Escola</th><th>NTE</th><th>Etapa</th><th>Responsável</th></tr></thead><tbody>'+arr.map(p=>'<tr><td>'+esc(p.codigo_sigee||p.id)+'</td><td><b>'+esc(p.aluno_nome||'')+'</b><small>'+esc(p.escola_nome||'')+'</small></td><td>'+esc(window.SIGEE_REPORTS_DATA.nte(p.nte||p.nte_id))+'</td><td>'+esc(R().etapa(p))+'</td><td>'+esc(responsavel(p)||'Aguardando atribuição')+'</td></tr>').join('')+'</tbody></table></div>';}
function header(tipo,titulo,desc){return '<header class="sig-rel-hero"><div><small>CENTRAL DE RELATÓRIOS</small><h1>'+esc(titulo)+'</h1><p>'+esc(desc)+'</p></div><div><span>'+esc(state.payload.contexto.global?'Estado da Bahia':state.payload.contexto.nte)+'</span><button data-refresh>↻ Atualizar</button></div></header>';}
function render(h,tipo){const d=dados();let body='';
 if(tipo==='operacional'){const etapas={};d.operacionais.forEach(p=>{const e=R().etapa(p);etapas[e]=(etapas[e]||0)+1;});body='<section class="sig-rel-cards">'+card('Ativos operacionais',d.operacionais.length,'Exclui espera externa')+card('Em atraso',d.atrasados.length,'Com prazo controlado')+card('Pendências externas',d.externas.length,'Sem prazo estimado')+card('Sem responsável',d.operacionais.filter(p=>!responsavel(p)).length,'Aguardando atribuição')+'</section><section class="sig-rel-panel"><h2>Distribuição operacional por etapa</h2><div class="sig-rel-bars">'+Object.entries(etapas).sort((a,b)=>b[1]-a[1]).map(([e,n])=>'<div><span>'+esc(e)+'</span><b>'+n+'</b></div>').join('')+'</div></section>'+tabela(d.atrasados.slice(0,300));}
 if(tipo==='sla'){const sla=d.operacionais.length?Math.round((d.operacionais.length-d.atrasados.length)*100/d.operacionais.length):0;body='<section class="sig-rel-cards">'+card('SLA operacional',sla+'%','Somente etapas com prazo')+card('Base com SLA',d.operacionais.filter(p=>limite(R().etapa(p))!=null).length,'Processos elegíveis')+card('Vencidos',d.atrasados.length,'Fora do prazo')+card('Espera externa',d.externas.length,'Fora do SLA')+'</section><section class="sig-rel-note"><b>Regra aplicada:</b> Pendência do Aluno não possui prazo estimado e não entra no cálculo do SLA.</section>'+tabela(d.atrasados);}
 if(tipo==='territorial'){const map=new Map();d.operacionais.forEach(p=>{const n=window.SIGEE_REPORTS_DATA.nte(p.nte||p.nte_id);if(!map.has(n))map.set(n,[]);map.get(n).push(p);});body='<section class="sig-rel-territory">'+[...map].map(([n,arr])=>'<article><h3>'+esc(n)+'</h3><strong>'+arr.length+'</strong><span>ativos operacionais</span><small>'+arr.filter(atraso).length+' atrasados · '+arr.filter(p=>!responsavel(p)).length+' sem responsável</small></article>').join('')+'</section>';}
 if(tipo==='pendencias'){const inst=d.ativos.filter(R().pendenciaInstitucional);body='<section class="sig-rel-cards">'+card('Pendências externas',d.externas.length,'Aluno/interessado')+card('Pendências institucionais',inst.length,'Responsabilidade interna')+card('Externas no SLA',0,'Não contabilizadas')+card('Institucionais monitoradas',inst.length,'Acompanhamento operacional')+'</section><section class="sig-rel-tabs"><h2>Pendência do Aluno — espera externa</h2><p>Sem prazo estimado, sem alerta de atraso e fora do ranking de criticidade.</p></section>'+tabela(d.externas);}
 if(tipo==='produtividade'){const map=new Map();d.operacionais.forEach(p=>{const r=responsavel(p)||'Aguardando atribuição';if(!map.has(r))map.set(r,[]);map.get(r).push(p);});body='<section class="sig-rel-team">'+[...map].sort((a,b)=>b[1].length-a[1].length).map(([r,arr])=>'<article><h3>'+esc(r)+'</h3><strong>'+arr.length+'</strong><span>processos ativos</span><small>'+arr.filter(atraso).length+' em atraso</small></article>').join('')+'</section><section class="sig-rel-note">Indicadores destinados ao equilíbrio de carga, apoio e treinamento, sem finalidade punitiva.</section>';}
 if(tipo==='executivo'){body='<section class="sig-rel-cards">'+card('Processos ativos',d.ativos.length,'Total em tramitação')+card('Operação controlável',d.operacionais.length,'Depende da equipe')+card('Espera externa',d.externas.length,'Depende do interessado')+card('Em atraso',d.atrasados.length,'Somente operação controlável')+'</section><section class="sig-rel-exec"><h2>Leitura executiva</h2><p>Existem <b>'+d.operacionais.length+'</b> processos sob gestão direta da operação e <b>'+d.externas.length+'</b> aguardando resposta externa. O total em atraso é <b>'+d.atrasados.length+'</b>, sem contabilizar Pendência do Aluno.</p></section>';}
 const meta=tipos.find(x=>x[0]===tipo);h.innerHTML=header(tipo,meta[2],descricao(tipo))+body;h.querySelector('[data-refresh]').onclick=()=>abrir(tipo,true);h.querySelector('[data-retry]')?.addEventListener('click',()=>abrir(tipo,true));}
function descricao(t){return {operacional:'Visão do fluxo, atrasos e capacidade operacional.',sla:'Acompanhamento de prazos das etapas controladas pela equipe.',territorial:'Distribuição da operação e dos atrasos por NTE.',pendencias:'Separação entre pendência externa e institucional.',produtividade:'Carga e acompanhamento das equipes sem finalidade punitiva.',executivo:'Síntese estratégica para apoio à decisão.'}[t];}
function localizarMenuRelatorios(){
  const nav=document.getElementById('sigee-menu-dinamico');
  if(!nav)return null;
  return [...nav.querySelectorAll('button,a')].find(el=>norm(el.textContent).replace(/[^A-Z]/g,'').includes('RELATORIOS'))||null;
}
function criarMenuRelatorios(){
  const wrap=document.createElement('div');
  wrap.id='menu-relatorios-rc701';
  wrap.className='sig-rel-menu';
  wrap.innerHTML=`
    <button class="sig-rel-menu-title" type="button" aria-expanded="false" aria-controls="submenu-relatorios-rc701">
      <span>📑 Relatórios</span><span class="sig-rel-chevron" aria-hidden="true">▾</span>
    </button>
    <div id="submenu-relatorios-rc701" class="sig-rel-submenu" role="group" aria-label="Subabas de Relatórios">
      ${tipos.map(x=>`<button type="button" class="sig-rel-subaba" data-report-menu="${x[0]}" data-view="aba-relatorio-${x[0]}"><span>${x[1]}</span><span>${x[2].replace('Relatório de ','').replace('Relatório ','')}</span></button>`).join('')}
    </div>`;
  return wrap;
}
function alternarSubmenuRelatorios(wrap,title){
  if(!wrap||!title)return false;
  const aberta=wrap.classList.toggle('open');
  title.setAttribute('aria-expanded',String(aberta));
  return aberta;
}
function instalarBloqueioMenuPrincipal(){
  if(window.__SIGEE_REPORTS_TITLE_CAPTURE_662__)return;
  window.__SIGEE_REPORTS_TITLE_CAPTURE_662__=true;
  window.addEventListener('click',event=>{
    const title=event.target?.closest?.('#menu-relatorios-rc701 .sig-rel-menu-title');
    if(!title)return;
    const wrap=title.closest('#menu-relatorios-rc701');
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    alternarSubmenuRelatorios(wrap,title);
  },true);
}
function instalarMenu(){
  const nav=document.getElementById('sigee-menu-dinamico');
  if(!nav)return;
  document.getElementById('menu-relatorios-rc650')?.remove();
  document.getElementById('menu-relatorios-rc6501')?.remove();
  document.getElementById('menu-relatorios-rc700')?.remove();
  let wrap=document.getElementById('menu-relatorios-rc701');
  if(!wrap){
    const original=localizarMenuRelatorios();
    wrap=criarMenuRelatorios();
    const raiz=original ? (()=>{let e=original;while(e.parentElement&&e.parentElement!==nav)e=e.parentElement;return e.parentElement===nav?e:original;})() : null;
    if(raiz) raiz.replaceWith(wrap); else nav.appendChild(wrap);
  }
  const title=wrap.querySelector('.sig-rel-menu-title');
  if(title){
    title.removeAttribute('onclick');
    title.dataset.bound='capture-rc662';
  }
  wrap.querySelectorAll('[data-report-menu]').forEach(b=>{
    if(b.dataset.bound)return;
    b.dataset.bound='1';
    b.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      wrap.classList.add('open');
      title?.setAttribute('aria-expanded','true');
      abrir(b.dataset.reportMenu);
    });
  });
  state.menuIntegrado=true;
}
function instalarPonteNavegacao(){
  const atual=window.navegar;
  if(typeof atual!=='function' || atual.__SIGEE_REPORTS_BRIDGE__) return;
  function navegarComRelatorios(aba){
    document.querySelectorAll('.sig-rel-page').forEach(ocultarModulo);
    marcarMenu(null);
    return atual.apply(this,arguments);
  }
  navegarComRelatorios.__SIGEE_REPORTS_BRIDGE__=true;
  navegarComRelatorios.__SIGEE_ORIGINAL__=atual;
  window.navegar=navegarComRelatorios;
}

function init(){
  instalarBloqueioMenuPrincipal();
  document.querySelectorAll('[data-relatorio-legado="true"]').forEach(ocultarModulo);
  tipos.forEach(x=>{if(!host(x[0]))console.error('[SIGEE RC7.0.1] Aba ausente:',x[0]);});
  instalarMenu();
  instalarPonteNavegacao();
  setTimeout(()=>{instalarMenu();instalarPonteNavegacao();window.SIGEE_MENU?.organizar?.();},300);
  setTimeout(()=>{instalarMenu();instalarPonteNavegacao();window.SIGEE_MENU?.organizar?.();},1200);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
window.SIGEE_RELATORIOS={abrir,instalarMenu,atualizar:()=>state.tipo&&abrir(state.tipo,true),versao:'RC7.0.1'};
console.info('[SIGEE RC7.0.1] Relatórios integrados ao Menu Manager sem observadores concorrentes.');
})();
