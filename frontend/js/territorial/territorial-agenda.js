/** SIGEE Enterprise — GT-02 Interface da Agenda Institucional (Master). */
(function(window,document){
'use strict';
if(window.SIGEE_TERRITORIAL_AGENDA) return;
let eventos=[];
let ciencias=[];

const TIPOS={REUNIAO:'Reunião',ALINHAMENTO_TECNICO:'Alinhamento técnico',FORMACAO_TERRITORIAL:'Formação territorial',VISITA_TECNICA:'Visita técnica',ACOMPANHAMENTO:'Acompanhamento',OUTRA:'Outra atividade'};
const STATUS={PLANEJADO:'Planejado',AGENDADO:'Agendado',EM_ANDAMENTO:'Em andamento',REALIZADO:'Realizado',REMARCADO:'Remarcado',CANCELADO:'Cancelado'};
const MODALIDADES={PRESENCIAL:'Presencial',ONLINE:'Online',HIBRIDA:'Híbrida'};
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function service(){return window.SIGEE_TERRITORIAL_AGENDA_SERVICE;}
function fmtData(v){if(!v)return '—';try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));}catch(_){return v;}}
function localInput(v){if(!v)return '';const d=new Date(v);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}
function nteLabel(n){const x=(window.SIGEE_TERRITORIAL_DATA?.NTES||[]).find(y=>y.numero===Number(n));return x?`${x.codigo} — ${x.sede}`:`NTE ${String(n).padStart(2,'0')}`;}
function badge(status){return `<span class="gt-agenda-badge gt-agenda-${String(status||'').toLowerCase()}">${esc(STATUS[status]||status||'—')}</span>`;}
function ntesResumo(ntes){const arr=Array.isArray(ntes)?ntes:[];if(arr.length<=3)return arr.map(n=>nteLabel(n)).join(', ');return `${arr.slice(0,3).map(n=>nteLabel(n)).join(', ')} +${arr.length-3}`;}

function cienciasEvento(id){return ciencias.filter(c=>String(c.agenda_id)===String(id));}
function resumoCiencias(e){
 const alvo=[...new Set((e.ntes||[]).map(Number))];
 const regs=cienciasEvento(e.id);const cientes=new Set(regs.filter(x=>x.ciencia_at).map(x=>Number(x.nte_numero)));
 return {total:alvo.length,cientes:cientes.size,pendentes:alvo.filter(n=>!cientes.has(n)),regs};
}
function cienciaMeta(e){if(!e.comunicar_ntes)return '<span>🔒 Registro interno Master</span>';const r=resumoCiencias(e);return `<span>📨 Comunicação aos NTEs</span><button type="button" class="gt-ciencia-inline" data-ciencias="${e.id}">Ciência: ${r.cientes}/${r.total}</button>`;}

function kpis(){
 const agora=Date.now();const fimSemana=agora+7*86400000;
 const proximas=eventos.filter(e=>new Date(e.inicio).getTime()>=agora&&new Date(e.inicio).getTime()<=fimSemana&&!['CANCELADO','REALIZADO'].includes(e.situacao)).length;
 const agendadas=eventos.filter(e=>['PLANEJADO','AGENDADO','REMARCADO','EM_ANDAMENTO'].includes(e.situacao)).length;
 const formacoes=eventos.filter(e=>e.tipo==='FORMACAO_TERRITORIAL'&&!['CANCELADO','REALIZADO'].includes(e.situacao)).length;
 const comunicadas=eventos.filter(e=>e.comunicar_ntes).length;
 return `<div class="gt-kpis gt-agenda-kpis"><article><span>Próximos 7 dias</span><strong>${proximas}</strong><small>compromissos ativos</small></article><article><span>Agenda ativa</span><strong>${agendadas}</strong><small>planejados e agendados</small></article><article><span>Formações programadas</span><strong>${formacoes}</strong><small>formações territoriais</small></article><article><span>Com comunicação</span><strong>${comunicadas}</strong><small>atividades informadas aos NTEs</small></article></div>`;
}

function filtros(){
 const ntes=window.SIGEE_TERRITORIAL_DATA?.NTES||[];
 return `<div class="gt-agenda-toolbar"><div class="gt-agenda-filtros"><label>Tipo<select id="gt-agenda-filtro-tipo"><option value="">Todos</option>${Object.entries(TIPOS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><label>Situação<select id="gt-agenda-filtro-status"><option value="">Todas</option>${Object.entries(STATUS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><label>NTE<select id="gt-agenda-filtro-nte"><option value="">Todos</option>${ntes.map(n=>`<option value="${n.numero}">${n.codigo} — ${esc(n.sede)}</option>`).join('')}</select></label></div><button type="button" class="gt-primary" id="gt-agenda-nova">+ Nova atividade</button></div>`;
}

function lista(f={}){
 let dados=eventos.slice(); if(f.tipo)dados=dados.filter(x=>x.tipo===f.tipo);if(f.status)dados=dados.filter(x=>x.situacao===f.status);if(f.nte)dados=dados.filter(x=>(x.ntes||[]).map(Number).includes(Number(f.nte)));
 if(!dados.length)return '<div class="gt-empty">Nenhuma atividade encontrada para os filtros selecionados.</div>';
 return `<div class="gt-agenda-lista">${dados.map(e=>`<article class="gt-agenda-item" data-id="${e.id}"><div class="gt-agenda-data"><b>${new Date(e.inicio).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','')}</b><span>${new Date(e.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div><div class="gt-agenda-info"><div class="gt-agenda-title"><strong>${esc(e.titulo)}</strong>${badge(e.situacao)}</div><span>${esc(TIPOS[e.tipo]||e.tipo)} • ${esc(MODALIDADES[e.modalidade]||e.modalidade)}${e.local?' • '+esc(e.local):''}</span><small>${esc(ntesResumo(e.ntes))}</small>${e.motivo?`<p><b>Motivo:</b> ${esc(e.motivo)}</p>`:''}${e.objetivo?`<p>${esc(e.objetivo)}</p>`:''}<div class="gt-agenda-meta">${cienciaMeta(e)}<span>Fim: ${esc(fmtData(e.fim))}</span></div></div><div class="gt-agenda-actions"><button type="button" data-editar="${e.id}">Editar</button><button type="button" class="danger" data-excluir="${e.id}">Excluir</button></div></article>`).join('')}</div>`;
}

function bindLista(root){
 const aplicar=()=>{const box=root.querySelector('#gt-agenda-lista');if(box)box.innerHTML=lista({tipo:root.querySelector('#gt-agenda-filtro-tipo')?.value,status:root.querySelector('#gt-agenda-filtro-status')?.value,nte:root.querySelector('#gt-agenda-filtro-nte')?.value});bindAcoes(root);};
 ['#gt-agenda-filtro-tipo','#gt-agenda-filtro-status','#gt-agenda-filtro-nte'].forEach(s=>root.querySelector(s)?.addEventListener('change',aplicar));
 root.querySelector('#gt-agenda-nova')?.addEventListener('click',()=>modal()); bindAcoes(root);
}
function bindAcoes(root){
 root.querySelectorAll('[data-editar]').forEach(b=>b.addEventListener('click',()=>modal(eventos.find(x=>String(x.id)===String(b.dataset.editar)))));
 root.querySelectorAll('[data-excluir]').forEach(b=>b.addEventListener('click',async()=>{const ev=eventos.find(x=>String(x.id)===String(b.dataset.excluir));if(!confirm(`Excluir a atividade “${ev?.titulo||''}”?`))return;try{await service().excluir(b.dataset.excluir);await carregar(root);}catch(e){alert(e.message||e);}}));
 root.querySelectorAll('[data-ciencias]').forEach(b=>b.addEventListener('click',()=>modalCiencias(eventos.find(x=>String(x.id)===String(b.dataset.ciencias)))));
}

async function carregar(root){
 root=root||document.querySelector('#gt-conteudo');if(!root)return;
 const area=root.querySelector('#gt-agenda-corpo');if(area)area.innerHTML='<div class="gt-empty">Carregando agenda institucional...</div>';
 try{eventos=await service().listar();ciencias=await service().listarCiencias(eventos.map(e=>e.id));render(root);}catch(e){eventos=[];ciencias=[];render(root,e);}
}
function render(root,erro){
 root=root||document.querySelector('#gt-conteudo');if(!root)return;
 root.innerHTML=`<article class="gt-panel gt-panel-full gt-agenda"><header><div><span>AGENDA INSTITUCIONAL • GT-02</span><h2>Planejamento das ações territoriais</h2><p>Reuniões, alinhamentos, formações, visitas e demais compromissos vinculados aos NTEs.</p></div><span class="gt-status">Persistência Supabase</span></header>${erro?`<div class="gt-agenda-alert"><strong>Configuração necessária</strong><span>${esc(erro.message||erro)}</span><small>Execute o arquivo supabase/migrations/GT02_AGENDA_INSTITUCIONAL.sql no SQL Editor do Supabase.</small></div>`:''}${kpis()}${filtros()}<div id="gt-agenda-lista">${lista()}</div></article>`;
 bindLista(root);
}

function modalCiencias(ev){
 if(!ev)return;
 document.getElementById('gt-ciencias-modal')?.remove();
 const r=resumoCiencias(ev);const regs=r.regs||[];const porNte=new Map();
 regs.forEach(x=>{const n=Number(x.nte_numero);const atual=porNte.get(n);if(!atual || (x.ciencia_at && (!atual.ciencia_at || new Date(x.ciencia_at)<new Date(atual.ciencia_at))))porNte.set(n,x);});
 const linhas=(ev.ntes||[]).map(Number).sort((a,b)=>a-b).map(n=>{const x=porNte.get(n);const ciente=!!x?.ciencia_at;return `<div class="gt-ciencia-row ${ciente?'ciente':'pendente'}"><div><b>${esc(nteLabel(n))}</b><small>${ciente?`Ciência confirmada por ${esc(x.usuario_nome||x.usuario_email||'usuário do território')}`:x?.visualizado_at?'Visualizada, aguardando ciência':'Aguardando visualização/ciência'}</small></div><div><strong>${ciente?'Ciente':'Pendente'}</strong><small>${ciente?esc(fmtData(x.ciencia_at)):x?.visualizado_at?esc(fmtData(x.visualizado_at)):'—'}</small></div></div>`;}).join('');
 const m=document.createElement('div');m.id='gt-ciencias-modal';m.className='gt-modal-backdrop';
 m.innerHTML=`<div class="gt-modal gt-ciencias-modal" role="dialog" aria-modal="true" aria-labelledby="gt-ciencias-titulo"><header><div><span>CONTROLE DE CIÊNCIA</span><h2 id="gt-ciencias-titulo">${esc(ev.titulo)}</h2><p>${r.cientes} de ${r.total} território(s) com ciência confirmada.</p></div><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="gt-modal-body"><div class="gt-ciencia-resumo"><span><b>${r.cientes}</b> Cientes</span><span><b>${r.total-r.cientes}</b> Pendentes</span></div><div class="gt-ciencia-lista">${linhas||'<div class="gt-empty">Nenhum NTE vinculado.</div>'}</div></div><footer><small>A ciência é consolidada por território; qualquer usuário territorial habilitado pode confirmá-la.</small><button type="button" data-fechar>Fechar</button></footer></div>`;
 document.body.appendChild(m);m.querySelectorAll('[data-fechar]').forEach(b=>b.addEventListener('click',()=>m.remove()));m.addEventListener('click',e=>{if(e.target===m)m.remove();});
}

function modal(ev={}){
 document.getElementById('gt-agenda-modal')?.remove();
 const ntes=window.SIGEE_TERRITORIAL_DATA?.NTES||[];const selecionados=new Set((ev.ntes||[]).map(Number));
 const m=document.createElement('div');m.id='gt-agenda-modal';m.className='gt-modal-backdrop';
 const nteCards=ntes.map(n=>`<label class="gt-nte-option" data-nte-text="${esc((n.codigo+' '+n.sede).toLowerCase())}"><input type="checkbox" value="${n.numero}" ${selecionados.has(n.numero)?'checked':''}><span><b>${n.codigo}</b><small>${esc(n.sede)}</small></span></label>`).join('');
 m.innerHTML=`<div class="gt-modal" role="dialog" aria-modal="true" aria-labelledby="gt-agenda-modal-titulo"><header><div><span>AGENDA INSTITUCIONAL</span><h2 id="gt-agenda-modal-titulo">${ev.id?'Editar atividade':'Nova atividade'}</h2></div><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="gt-modal-body"><div class="gt-form-grid">
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Dados da atividade</b><small>Identificação e classificação do compromisso.</small></div><div class="gt-form-grid gt-form-grid-inner"><label class="span2">Título<input id="gta-titulo" value="${esc(ev.titulo||'')}" maxlength="180" placeholder="Ex.: Reunião de acompanhamento territorial"></label><label>Tipo<select id="gta-tipo">${Object.entries(TIPOS).map(([v,l])=>`<option value="${v}" ${ev.tipo===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Situação<select id="gta-status">${Object.entries(STATUS).map(([v,l])=>`<option value="${v}" ${(ev.situacao||'AGENDADO')===v?'selected':''}>${l}</option>`).join('')}</select></label></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Data e local</b><small>Período, modalidade e referência do encontro.</small></div><div class="gt-form-grid gt-form-grid-inner"><label>Início<input id="gta-inicio" type="datetime-local" value="${localInput(ev.inicio)}"></label><label>Fim<input id="gta-fim" type="datetime-local" value="${localInput(ev.fim)}"></label><label>Modalidade<select id="gta-modalidade">${Object.entries(MODALIDADES).map(([v,l])=>`<option value="${v}" ${(ev.modalidade||'PRESENCIAL')===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Prioridade<select id="gta-prioridade"><option value="NORMAL" ${(ev.prioridade||'NORMAL')==='NORMAL'?'selected':''}>Normal</option><option value="ALTA" ${ev.prioridade==='ALTA'?'selected':''}>Alta</option><option value="URGENTE" ${ev.prioridade==='URGENTE'?'selected':''}>Urgente</option></select></label><label class="span2">Local / link<input id="gta-local" value="${esc(ev.local||'')}" placeholder="Local físico ou referência da reunião online"></label><label class="span2" id="gta-motivo-wrap">Motivo / finalidade<input id="gta-motivo" value="${esc(ev.motivo||'')}" placeholder="Ex.: acompanhamento de fluxo, diagnóstico, alinhamento de procedimentos"></label></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>NTEs envolvidos</b><small>Selecione um ou vários territórios relacionados à atividade.</small></div><div class="gt-nte-picker"><div class="gt-nte-toolbar"><label>Pesquisar NTE<input id="gta-nte-busca" type="search" placeholder="Número ou sede"></label><div><button type="button" id="gta-nte-todos">Todos os 27 NTEs</button><button type="button" id="gta-nte-limpar">Limpar</button></div></div><div class="gt-nte-all-hint" id="gta-nte-all-hint">Para reunião estadual, use <b>Todos os 27 NTEs</b>.</div><div id="gta-nte-chips" class="gt-nte-chips"></div><details class="gt-nte-selector" ${selecionados.size?'':'open'}><summary><span>Escolher territórios</span><strong id="gta-nte-contagem">${selecionados.size} selecionado(s)</strong></summary><div class="gt-nte-options">${nteCards}</div></details></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Objetivo e conteúdo</b><small>Registre o propósito e os pontos que serão trabalhados.</small></div><div class="gt-form-grid gt-form-grid-inner"><label class="span2">Objetivo<textarea id="gta-objetivo" rows="2" placeholder="Objetivo da atividade">${esc(ev.objetivo||'')}</textarea></label><label class="span2">Pauta / conteúdo<textarea id="gta-pauta" rows="3" placeholder="Pauta, conteúdo ou pontos a serem trabalhados">${esc(ev.pauta||'')}</textarea></label></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Comunicação e registro</b><small>Defina se os territórios receberão aviso e registre observações adicionais.</small></div><label class="gt-check"><input id="gta-comunicar" type="checkbox" ${ev.comunicar_ntes?'checked':''}><span><strong>Comunicar os NTEs selecionados</strong><small>Usuários territoriais receberão a agenda e poderão confirmar ciência.</small></span></label><label class="gt-observacoes">Observações<textarea id="gta-observacoes" rows="2">${esc(ev.observacoes||'')}</textarea></label></section>
 </div></div><footer><button type="button" data-fechar>Cancelar</button><button type="button" class="gt-primary" id="gta-salvar">Salvar atividade</button></footer></div>`;
 document.body.appendChild(m);m.querySelectorAll('[data-fechar]').forEach(b=>b.addEventListener('click',()=>m.remove()));m.addEventListener('click',e=>{if(e.target===m)m.remove();});
 const checks=()=>[...m.querySelectorAll('.gt-nte-option input')];
 const atualizarNtes=()=>{const ativos=checks().filter(x=>x.checked);const chips=m.querySelector('#gta-nte-chips');m.querySelector('#gta-nte-contagem').textContent=`${ativos.length} selecionado(s)`;chips.innerHTML=ativos.length?ativos.map(x=>`<span>${esc(nteLabel(Number(x.value)))}</span>`).join(''):'<small>Nenhum NTE selecionado.</small>';};
 checks().forEach(x=>x.addEventListener('change',atualizarNtes));
 m.querySelector('#gta-nte-busca').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();m.querySelectorAll('.gt-nte-option').forEach(el=>el.hidden=!!q&&!el.dataset.nteText.includes(q));});
 m.querySelector('#gta-nte-todos').addEventListener('click',()=>{m.querySelector('#gta-nte-busca').value='';m.querySelectorAll('.gt-nte-option').forEach(el=>el.hidden=false);checks().forEach(x=>x.checked=true);atualizarNtes();});
 m.querySelector('#gta-nte-limpar').addEventListener('click',()=>{checks().forEach(x=>x.checked=false);atualizarNtes();});
 atualizarNtes();
 const ajustarTipo=()=>{const t=m.querySelector('#gta-tipo').value;const hint=m.querySelector('#gta-nte-all-hint');if(hint)hint.hidden=t!=='REUNIAO';const mw=m.querySelector('#gta-motivo-wrap');if(mw)mw.querySelector('input').placeholder=t==='VISITA_TECNICA'?'Ex.: acompanhamento, diagnóstico, pós-formação, contingência':t==='REUNIAO'?'Ex.: alinhamento, acompanhamento, planejamento, orientação geral':'Motivo ou finalidade da atividade';};
 ajustarTipo();m.querySelector('#gta-tipo').addEventListener('change',ajustarTipo);
 const autoFormacao=()=>{if(m.querySelector('#gta-tipo').value!=='FORMACAO_TERRITORIAL')return;const ini=m.querySelector('#gta-inicio').value;if(!ini)return;const fim=m.querySelector('#gta-fim');if(!fim.value){const d=new Date(ini);d.setDate(d.getDate()+6);const p=n=>String(n).padStart(2,'0');fim.value=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}};
 m.querySelector('#gta-tipo').addEventListener('change',autoFormacao);m.querySelector('#gta-inicio').addEventListener('change',autoFormacao);
 m.querySelector('#gta-salvar').addEventListener('click',async()=>{const btn=m.querySelector('#gta-salvar');try{btn.disabled=true;btn.textContent='Salvando...';const ini=m.querySelector('#gta-inicio').value,fim=m.querySelector('#gta-fim').value;if(!ini)throw new Error('Informe o início da atividade.');if(fim&&new Date(fim)<new Date(ini))throw new Error('A data final não pode ser anterior ao início.');const payload={id:ev.id||null,titulo:m.querySelector('#gta-titulo').value,tipo:m.querySelector('#gta-tipo').value,situacao:m.querySelector('#gta-status').value,inicio:new Date(ini).toISOString(),fim:new Date(fim||ini).toISOString(),modalidade:m.querySelector('#gta-modalidade').value,prioridade:m.querySelector('#gta-prioridade').value,local:m.querySelector('#gta-local').value,motivo:m.querySelector('#gta-motivo').value,objetivo:m.querySelector('#gta-objetivo').value,pauta:m.querySelector('#gta-pauta').value,observacoes:m.querySelector('#gta-observacoes').value,comunicar_ntes:m.querySelector('#gta-comunicar').checked,ntes:checks().filter(x=>x.checked).map(x=>Number(x.value))};await service().salvar(payload);m.remove();await carregar(document.querySelector('#gt-conteudo'));}catch(e){alert(e.message||e);btn.disabled=false;btn.textContent='Salvar atividade';}});
}

window.SIGEE_TERRITORIAL_AGENDA=Object.freeze({render,carregar,modal,versao:'GT-04.3'});
document.addEventListener('sigee:gt-agenda-atualizada',()=>{const box=document.querySelector('#gt-agenda-lista');if(box)carregar(document.querySelector('#gt-conteudo'));});
})(window,document);
