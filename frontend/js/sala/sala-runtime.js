/* SIGEE Enterprise RC7.4.0 — Runtime único e autossuficiente da Sala de Situação 2.0 */
(function(){
'use strict';
if(window.__SIGEE_SALA_RUNTIME_6402__) return;
window.__SIGEE_SALA_RUNTIME_6402__=true;
const VERSION='RC7.4.0';
const txt=v=>v==null?'':String(v).trim();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function nte(v){const s=txt(v);const m=s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);if(m)return 'NTE-'+String(Number(m[1])).padStart(2,'0');if(/^\d{1,2}$/.test(s))return 'NTE-'+String(Number(s)).padStart(2,'0');return s||'SEM NTE';}
function usuario(){return window.SIGEE_AUTORIZACAO?.usuario?.()||window.usuarioLogado||window.usuarioAtual||{};}
function perfil(){return norm(usuario().perfil||usuario().role||usuario().tipo);}
function nteUsuario(){const u=usuario();return nte(window.SIGEE_ESCOPO?.nteUsuario?.(u)||window.SIGEE_ESCOPO?.nteIdUsuario?.(u)||u.nte||u.nte_nome||u.nte_id);}
function contexto(){const p=perfil(),u=usuario(),oficial=window.SIGEE_ESCOPO?.contexto?.(u),global=oficial?oficial.global:['MASTER','SEC'].includes(p);return {permitido:['MASTER','SEC','GESTOR','ADMINISTRADOR'].includes(p),perfil:p,global,nte:global?null:nte(oficial?.nte||nteUsuario()),escopo:global?'ESTADUAL':'NTE',usuario:u};}
function supabase(){try{return window.obterSupabaseSIGEE?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.supabaseClient||null;}catch(_){return null;}}
async function buscarTodos(){const u=usuario(),cli=supabase();if(!cli){const local=Array.isArray(window.processosDB)?window.processosDB:[];return {dados:window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(local,u):local.slice(),fonte:'MEMORIA_LOCAL'};}const lote=1000;let de=0,todos=[];while(true){let q=cli.from('processos').select('*');q=window.SIGEE_ESCOPO?.aplicarQueryProcessos?window.SIGEE_ESCOPO.aplicarQueryProcessos(q,u):q;const {data,error}=await q.range(de,de+lote-1);if(error)throw error;const arr=Array.isArray(data)?data:[];todos=todos.concat(arr);if(arr.length<lote)break;de+=lote;}return {dados:window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(todos,u):todos,fonte:'SUPABASE_PAGINADO_TERRITORIAL'};}
function aplicarEscopo(dados,ctx){return window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(dados,ctx.usuario):(ctx.global?dados.slice():dados.filter(p=>nte(p.nte||p.nte_nome||p.territorio||p.nte_id)===ctx.nte));}
async function carregarDados(){const ctx=contexto();if(!ctx.permitido)throw new Error('Perfil sem acesso à Sala de Situação 2.0.');const r=await buscarTodos();return {contexto:ctx,processos:aplicarEscopo(r.dados,ctx),totalCarregado:r.dados.length,fonte:r.fonte};}
const etapa=p=>txt(p.etapa_atual||p.etapa||p.fase_atual)||'Desarquivamento';
const responsavel=p=>txt(p.tecnico_atribuido||p.tecnico_responsavel||p.responsavel_etapa||p.analista||p.digitador||p.conferente||p.responsavel||p.usuario_lancamento||p.criado_por_nome);
function data(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
function dias(v){const d=data(v);return d?Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)):0;}
function finalizado(p){const e=norm(etapa(p));return e.includes('RETIR')||e.includes('INDEFER')||e.includes('DEFERIDO');}
function limite(e){const n=norm(e);if(n.includes('DESARQ'))return 30;if(n.includes('ANAL'))return 7;if(n.includes('DIGIT'))return 15;if(n.includes('CONFER'))return 10;if(n.includes('ASSIN'))return 7;return null;}
function pendenciaAluno(p){return Boolean(window.SIGEE_REGRAS_OPERACIONAIS?.pendenciaAluno?.(p));}
function atraso(p){if(pendenciaAluno(p))return false;const l=limite(etapa(p));return !finalizado(p)&&l!=null&&dias(p.data_etapa_atual||p.data_etapa||p.prazo_inicio||p.created_at)>l;}
function risco(p){if(finalizado(p)||pendenciaAluno(p))return 'NORMAL';const d=dias(p.data_etapa_atual||p.data_etapa||p.prazo_inicio||p.created_at),l=limite(etapa(p)),pr=norm(p.prioridade);if(atraso(p)&&d>(l||0)+15)return 'CRITICO';if(atraso(p)||pr.includes('URG')||pr.includes('CRIT'))return 'ALTO';if((l!=null&&d>=Math.max(0,l-3))||!responsavel(p))return 'MEDIO';return 'NORMAL';}
function score(m){if(!m.ativos)return 0;return Math.min(100,Math.round((m.criticos/m.ativos*100)*.5+(m.atrasados/m.ativos*100)*.3+(m.semResponsavel/m.ativos*100)*.2));}
function classe(s){return s>=76?'CRITICO':s>=51?'ALTO':s>=26?'ATENCAO':'NORMAL';}
function analisar(processos){const ativos=processos.filter(p=>!finalizado(p)),pendenciasExternas=ativos.filter(pendenciaAluno),ativosOperacionais=ativos.filter(p=>!pendenciaAluno(p)),finalizados=processos.filter(finalizado),hoje=new Date().toDateString();const recebidosHoje=processos.filter(p=>data(p.created_at||p.data_solicitacao)?.toDateString()===hoje).length;const concluidosHoje=finalizados.filter(p=>data(p.finalizado_em||p.retirado_em||p.updated_at)?.toDateString()===hoje).length;const atrasados=ativosOperacionais.filter(atraso),criticos=ativosOperacionais.filter(p=>risco(p)==='CRITICO'),altos=ativosOperacionais.filter(p=>risco(p)==='ALTO'),medios=ativosOperacionais.filter(p=>risco(p)==='MEDIO'),normais=ativosOperacionais.filter(p=>risco(p)==='NORMAL'),sem=ativosOperacionais.filter(p=>!responsavel(p));const etapas={};ativosOperacionais.forEach(p=>{const e=etapa(p);etapas[e]=(etapas[e]||0)+1;});const mapa=new Map();const ctx=state.payload?.contexto||contexto();if(ctx.global){for(let i=1;i<=27;i++)mapa.set('NTE-'+String(i).padStart(2,'0'),[]);}else if(ctx.nte){mapa.set(ctx.nte,[]);}processos.forEach(p=>{const k=nte(p.nte||p.nte_nome||p.territorio||p.nte_id);if(!mapa.has(k))mapa.set(k,[]);mapa.get(k).push(p);});const territorios=[...mapa].map(([codigo,ps])=>{const a=ps.filter(p=>!finalizado(p));const m={codigo,ativos:a.length,total:ps.length,criticos:a.filter(p=>risco(p)==='CRITICO').length,altos:a.filter(p=>risco(p)==='ALTO').length,atrasados:a.filter(atraso).length,semResponsavel:a.filter(p=>!responsavel(p)).length,processos:a};m.indice=score(m);m.classe=classe(m.indice);return m;}).sort((a,b)=>b.indice-a.indice||b.criticos-a.criticos||b.ativos-a.ativos);const peso={CRITICO:4,ALTO:3,MEDIO:2,NORMAL:1};const fila=ativos.slice().sort((a,b)=>peso[risco(b)]-peso[risco(a)]||Number(atraso(b))-Number(atraso(a))||dias(b.data_etapa_atual||b.created_at)-dias(a.data_etapa_atual||a.created_at));const etapasOrdenadas=Object.entries(etapas).sort((x,y)=>y[1]-x[1]);const gargalo=etapasOrdenadas[0]||['Sem demanda',0];return {processos,ativos,ativosOperacionais,pendenciasExternas,finalizados,recebidosHoje,concluidosHoje,atrasados,criticos,altos,medios,normais,semResponsavel:sem,etapas,etapasOrdenadas,gargalo,territorios,fila,risco,etapa,responsavel,atraso};}
let state={payload:null,analise:null,active:false,rendering:false,initialized:false};
function section(){
  // Usa exclusivamente a aba oficial controlada pela navegação principal do SIGEE.
  return document.getElementById('aba-sala-situacao');
}
function shell(){const s=section();if(!s)throw new Error('Área da Sala de Situação não localizada.');state.rendering=true;s.classList.remove('hidden');s.innerHTML=`<div class="sala2-root"><header class="sala2-hero"><div><small>CENTRO DE OPERAÇÕES</small><h1>Sala de Situação 2.0</h1><p>Monitoramento territorial, alertas e resposta rápida da operação.</p></div><div class="sala2-actions"><span id="sala2-sync">Carregando...</span><button id="sala2-refresh">↻ Atualizar</button><button id="sala2-full">⛶ Tela cheia</button></div></header><div id="sala2-content" class="sala2-content"><div class="sala2-loading">Consolidando a base completa...</div></div></div>`;state.rendering=false;s.querySelector('#sala2-refresh').onclick=abrir;s.querySelector('#sala2-full').onclick=()=>!document.fullscreenElement?s.requestFullscreen?.():document.exitFullscreen?.();return s;}
function kpi(t,v,s,cls=''){return `<button class="sala2-kpi ${cls}" data-kpi="${esc(t)}"><span>${esc(t)}</span><strong>${esc(v)}</strong><small>${esc(s)}</small></button>`;}
function prepararProntuario(p){if(!p)return;window.SIGEE_ESCOPO?.exigirRegistro?.(p,usuario());window.SIGEE_PROCESSOS_STORE?.upsert?.(p,'SALA_PRONTUARIO');window.abrirProntuarioSIGEE?.(p.id);}
function modal(titulo,arr){document.getElementById('sala2-modal')?.remove();const o=document.createElement('div');o.id='sala2-modal';o.className='sala2-modal';o.innerHTML=`<div class="sala2-modal-box"><header><div><small>DETALHAMENTO OPERACIONAL</small><h2>${esc(titulo)}</h2><p>${arr.length} registro(s)</p></div><button data-close>×</button></header><div class="sala2-table"><table><thead><tr><th>Processo</th><th>Aluno / Escola</th><th>NTE</th><th>Etapa</th><th>Responsável</th><th>Risco</th></tr></thead><tbody>${arr.map(p=>`<tr><td><button class="sala2-proc" data-id="${esc(p.id)}">${esc(p.codigo_sigee||p.codigo||p.id)}</button></td><td><b>${esc(p.aluno_nome||p.aluno||'')}</b><small>${esc(p.escola_nome||p.escola||'')}</small></td><td>${esc(nte(p.nte||p.nte_nome||p.nte_id))}</td><td>${esc(state.analise.etapa(p))}</td><td>${esc(state.analise.responsavel(p)||'Aguardando atribuição')}</td><td>${esc(state.analise.risco(p))}</td></tr>`).join('')}</tbody></table></div></div>`;document.body.appendChild(o);o.querySelector('[data-close]').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove();};o.querySelectorAll('.sala2-proc').forEach(b=>b.onclick=()=>prepararProntuario(state.analise.processos.find(x=>String(x.id)===b.dataset.id)));}
function render(){
state.rendering=true;
const a=state.analise,p=state.payload,c=document.getElementById('sala2-content');
if(!c)return;
const sla=a.ativos.length?Math.round((a.ativos.length-a.atrasados.length)*100/a.ativos.length):null;
const terrAtivos=a.territorios.filter(x=>x.ativos);
const terr=terrAtivos.slice(0,12);
const semDemanda=a.territorios.filter(x=>!x.ativos).length;
const etapas=a.etapasOrdenadas||Object.entries(a.etapas).sort((x,y)=>y[1]-x[1]);
const nteCritico=terrAtivos[0]||null;
const slaTexto=sla==null?'—':sla+'%';
c.innerHTML=`
<section class="sala2-context"><span>Escopo: <b>${p.contexto.global?'Estado da Bahia':esc(p.contexto.nte)}</b></span><span>Fonte: <b>${esc(p.fonte)}</b></span><span>Base analisada: <b>${a.processos.length}</b></span><span>NTEs com demanda: <b>${terrAtivos.length}</b></span></section>
<section class="sala2-kpis sala2-kpis-7">${kpi('Processos ativos',a.ativos.length,'Em tramitação')}${kpi('Em atraso',a.atrasados.length,'Exigem atenção','danger')}${kpi('Críticos',a.criticos.length,'Prioridade imediata','danger')}${kpi('Aguardando atribuição',a.semResponsavel.length,'Sem responsável','warn')}${kpi('Espera externa',a.pendenciasExternas.length,'Pendência do aluno')}${kpi('SLA operacional',slaTexto,sla==null?'Sem demanda':'Dentro do prazo')}${kpi('Recebidos hoje',a.recebidosHoje,'Novas solicitações')}</section>
<section class="sala2-risk-strip"><button data-risk="CRITICO"><b>${a.criticos.length}</b><span>Críticos</span></button><button data-risk="ALTO"><b>${a.altos.length}</b><span>Altos</span></button><button data-risk="MEDIO"><b>${a.medios.length}</b><span>Médios</span></button><button data-risk="NORMAL"><b>${a.normais.length}</b><span>Normais</span></button></section>
<section class="sala2-grid"><article class="sala2-panel sala2-flow"><header><div><small>FLUXO OPERACIONAL</small><h2>Distribuição por etapa</h2></div><span>${a.ativos.length} ativos</span></header><div class="sala2-stage-grid">${etapas.map(([e,n])=>`<button data-etapa="${esc(e)}"><span>${esc(e)}</span><strong>${n}</strong></button>`).join('')}</div></article><article class="sala2-panel sala2-alerts"><header><div><small>ALERTAS PRIORITÁRIOS</small><h2>Atenção imediata</h2></div></header><div>${a.criticos.length?`<button data-alert="criticos"><b>${a.criticos.length} processos críticos</b><span>Abrir fila prioritária</span></button>`:''}${a.atrasados.length?`<button data-alert="atrasados"><b>${a.atrasados.length} processos em atraso</b><span>Revisar prazos vencidos</span></button>`:''}${a.semResponsavel.length?`<button data-alert="sem"><b>${a.semResponsavel.length} aguardando atribuição</b><span>Equilibrar distribuição</span></button>`:''}${a.gargalo?.[1]?`<button data-alert="gargalo"><b>Maior gargalo: ${esc(a.gargalo[0])}</b><span>${a.gargalo[1]} processos na etapa</span></button>`:''}${nteCritico?`<button data-alert="nte"><b>NTE prioritário: ${esc(nteCritico.codigo)}</b><span>${nteCritico.criticos} críticos · índice ${nteCritico.indice}</span></button>`:''}</div></article></section>
<section class="sala2-grid sala2-bottom"><article class="sala2-panel sala2-territory"><header><div><small>VISÃO TERRITORIAL</small><h2>Situação dos NTEs</h2></div><span>${terrAtivos.length} com demanda · ${semDemanda} sem demanda</span></header><div class="sala2-legend"><i class="normal"></i>Normal <i class="atencao"></i>Atenção <i class="alto"></i>Alto <i class="critico"></i>Crítico</div><div class="sala2-territory-grid">${terr.map(t=>`<button class="${t.classe.toLowerCase()}" data-nte="${t.codigo}"><span>${t.codigo}</span><strong title="Índice territorial de risco">${t.indice}</strong><small>${t.criticos} críticos · ${t.atrasados} atrasados · ${t.semResponsavel} sem responsável · ${t.ativos} ativos</small></button>`).join('')||'<p class="sala2-empty">Nenhum NTE possui processos ativos no escopo.</p>'}</div></article><article class="sala2-panel sala2-queue"><header><div><small>FILA PRIORITÁRIA</small><h2>Próximas ações</h2></div><button data-fila>Ver fila completa</button></header><div>${a.fila.slice(0,8).map((x,i)=>`<button data-id="${esc(x.id)}"><b>${i+1}</b><span><strong>${esc(x.codigo_sigee||x.id)}</strong><small>${esc(x.aluno_nome||'')} · ${esc(nte(x.nte||x.nte_id))} · ${esc(a.etapa(x))} · ${esc(a.responsavel(x)||'Aguardando atribuição')}</small></span><em>${esc(a.risco(x))}</em></button>`).join('')}</div></article></section>`;
document.getElementById('sala2-sync').textContent='● Dados sincronizados • '+new Date().toLocaleTimeString('pt-BR');
c.querySelectorAll('[data-etapa]').forEach(b=>b.onclick=()=>modal(b.dataset.etapa,a.ativos.filter(p=>a.etapa(p)===b.dataset.etapa)));
c.querySelector('[data-alert="criticos"]')?.addEventListener('click',()=>modal('Processos críticos',a.criticos));
c.querySelector('[data-alert="atrasados"]')?.addEventListener('click',()=>modal('Processos em atraso',a.atrasados));
c.querySelector('[data-alert="sem"]')?.addEventListener('click',()=>modal('Aguardando atribuição',a.semResponsavel));
c.querySelector('[data-alert="gargalo"]')?.addEventListener('click',()=>modal('Maior gargalo — '+a.gargalo[0],a.ativos.filter(x=>a.etapa(x)===a.gargalo[0])));
c.querySelector('[data-alert="nte"]')?.addEventListener('click',()=>modal('NTE prioritário — '+nteCritico.codigo,nteCritico.processos));
c.querySelectorAll('[data-risk]').forEach(b=>b.onclick=()=>modal('Risco '+b.dataset.risk,a.ativos.filter(x=>a.risco(x)===b.dataset.risk)));
c.querySelectorAll('[data-nte]').forEach(b=>b.onclick=()=>modal('Situação '+b.dataset.nte,a.territorios.find(x=>x.codigo===b.dataset.nte)?.processos||[]));
c.querySelector('[data-fila]')?.addEventListener('click',()=>modal('Fila prioritária',a.fila));
c.querySelectorAll('.sala2-queue [data-id]').forEach(b=>b.onclick=()=>prepararProntuario(a.fila.find(x=>String(x.id)===b.dataset.id)));
state.rendering=false;
const map={'Processos ativos':a.ativos,'Em atraso':a.atrasados,'Críticos':a.criticos,'Aguardando atribuição':a.semResponsavel};
c.querySelectorAll('[data-kpi]').forEach(b=>{const arr=map[b.dataset.kpi];if(arr)b.onclick=()=>modal(b.dataset.kpi,arr);});
}
async function abrir(){
  state.active=true;
  document.body.classList.add('sigee-sala2-ativa');
  const sec=section();
  if(!sec) throw new Error('A aba oficial da Sala de Situação não foi localizada.');
  sec.classList.remove('hidden');
  // Reaproveita a análise já carregada ao retornar à aba.
  if(state.initialized && state.analise && state.payload){
    shell();
    render();
    return;
  }
  shell();
  try{
    const payload=await carregarDados();
    state.payload=payload;
    state.analise=analisar(payload.processos);
    state.initialized=true;
    render();
    console.info('[SIGEE Sala 2.0 RC6.4.1]',{totalCarregado:payload.totalCarregado,totalNoEscopo:payload.processos.length,fonte:payload.fonte});
  }catch(e){
    console.error('[SIGEE Sala 2.0]',e);
    const c=document.getElementById('sala2-content');
    if(c)c.innerHTML='<div class="sala2-error"><strong>Falha ao carregar a Sala de Situação 2.0.</strong><br><small>'+esc(e.message)+'</small><br><button id="sala2-retry">Tentar novamente</button></div>';
    document.getElementById('sala2-retry')?.addEventListener('click',()=>{state.initialized=false;abrir();});
  }
}
window.SIGEE_SALA_DATA={version:VERSION,carregar:carregarDados,nte,contexto};
window.SIGEE_SALA_ENGINE={version:VERSION,analisar};
function garantirVisivel(){
  const sec=section();
  if(!sec) return;
  sec.classList.remove('hidden');
  if(!sec.querySelector('.sala2-root')){
    if(state.analise&&state.payload){shell();render();}
    else abrir();
  }
}
function desativar(){
  state.active=false;
  document.body.classList.remove('sigee-sala2-ativa');
}
window.SIGEE_SALA_2={version:VERSION,abrir,atualizar:async()=>{state.initialized=false;return abrir();},garantirVisivel,desativar};
console.info('[SIGEE RC6.4.1] Sala de Situação consolidada e vinculada à aba oficial.');
})();
