/** SIGEE Enterprise — GT-03 Monitoramento Territorial — interface Master. */
(function(window,document){
'use strict';
if(window.SIGEE_TERRITORIAL_MONITORAMENTO) return;

const FASES={PRE_FORMACAO:'Pré-formação',POS_FORMACAO:'Pós-formação'};
const NATUREZAS={OCORRENCIA:'Ocorrência identificada',ORIENTACAO:'Orientação',DIAGNOSTICO:'Diagnóstico',ALINHAMENTO_TECNICO:'Alinhamento técnico',INTERVENCAO:'Intervenção',ACOMPANHAMENTO:'Acompanhamento',RESULTADO:'Resultado / reavaliação'};
const CATEGORIAS={PROCEDIMENTO:'Procedimento',DOCUMENTACAO:'Documentação',FLUXO:'Fluxo',PRAZO:'Prazo',CADASTRO:'Cadastro',COMUNICACAO:'Comunicação',GESTAO:'Gestão',OUTRA:'Outra'};
const RELEVANCIAS={INFORMATIVA:'Informativa',BAIXA:'Baixa',MODERADA:'Moderada',ALTA:'Alta',CRITICA:'Crítica'};
const RESULTADOS={EM_ACOMPANHAMENTO:'Em acompanhamento',ORIENTADO:'Orientado',EM_AJUSTE:'Em ajuste',REGULARIZADO:'Regularizado',SEM_EVOLUCAO:'Sem evolução',CONCLUIDO:'Concluído'};
const CONTEUDO={NAO_SE_APLICA:'Não se aplica',SIM:'Sim — conteúdo abordado',PARCIALMENTE:'Parcialmente',NAO:'Não — não abordado'};
let registros=[];

function svc(){const s=window.SIGEE_TERRITORIAL_MONITORAMENTO_SERVICE;if(!s)throw new Error('Serviço de Monitoramento Territorial indisponível.');return s;}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(v){if(!v)return '—';try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));}catch(_){return v;}}
function fmtData(v){if(!v)return '';try{const d=new Date(v);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}catch(_){return '';}}
function nteLabel(n){const x=(window.SIGEE_TERRITORIAL_DATA?.NTES||[]).find(v=>v.numero===Number(n));return x?`${x.codigo} — ${x.sede}`:`NTE ${String(n).padStart(2,'0')}`;}
function opt(obj,valor=''){return Object.entries(obj).map(([v,l])=>`<option value="${v}" ${String(valor)===v?'selected':''}>${l}</option>`).join('');}

function filtrados(root){
 const nte=root.querySelector('#gtm-filtro-nte')?.value||'';
 const fase=root.querySelector('#gtm-filtro-fase')?.value||'';
 const nat=root.querySelector('#gtm-filtro-natureza')?.value||'';
 const res=root.querySelector('#gtm-filtro-resultado')?.value||'';
 return registros.filter(r=>(!nte||String(r.nte_numero)===nte)&&(!fase||r.fase===fase)&&(!nat||r.natureza===nat)&&(!res||r.resultado===res));
}
function resumo(){
 const pre=registros.filter(x=>x.fase==='PRE_FORMACAO').length;
 const pos=registros.filter(x=>x.fase==='POS_FORMACAO').length;
 const ntes=new Set(registros.map(x=>x.nte_numero)).size;
 const abertos=registros.filter(x=>!['REGULARIZADO','CONCLUIDO'].includes(x.resultado)).length;
 return `<div class="gt-kpis gt-monitor-kpis"><article><span>Registros</span><strong>${registros.length}</strong><small>memória técnica acumulada</small></article><article><span>Pré-formação</span><strong>${pre}</strong><small>diagnóstico e priorização</small></article><article><span>Pós-formação</span><strong>${pos}</strong><small>monitoramento qualificado</small></article><article><span>NTEs acompanhados</span><strong>${ntes}</strong><small>${abertos} registro(s) em acompanhamento</small></article></div>`;
}
function filtros(){
 const ntes=window.SIGEE_TERRITORIAL_DATA?.NTES||[];
 return `<div class="gt-agenda-toolbar gt-monitor-toolbar"><div class="gt-agenda-filtros"><label>NTE<select id="gtm-filtro-nte"><option value="">Todos</option>${ntes.map(n=>`<option value="${n.numero}">${n.codigo} — ${esc(n.sede)}</option>`).join('')}</select></label><label>Fase<select id="gtm-filtro-fase"><option value="">Todas</option>${opt(FASES)}</select></label><label>Registro<select id="gtm-filtro-natureza"><option value="">Todos</option>${opt(NATUREZAS)}</select></label><label>Resultado<select id="gtm-filtro-resultado"><option value="">Todos</option>${opt(RESULTADOS)}</select></label></div><button type="button" class="gt-primary" id="gtm-novo">+ Novo registro</button></div>`;
}
function timeline(itens){
 if(!itens.length)return '<div class="gt-empty">Nenhum registro encontrado para os filtros selecionados.</div>';
 const grupos=new Map();
 itens.forEach(r=>{const k=r.nte_numero;if(!grupos.has(k))grupos.set(k,[]);grupos.get(k).push(r);});
 return `<div class="gt-monitor-grupos">${[...grupos.entries()].map(([nte,rows])=>`<section class="gt-monitor-grupo"><header><div><span>${nteLabel(nte)}</span><strong>${rows.length} registro(s)</strong></div><small>Histórico técnico do território</small></header><div class="gt-monitor-timeline">${rows.map(r=>`<article class="gt-monitor-item" data-id="${r.id}"><div class="gt-monitor-marker" aria-hidden="true"></div><div class="gt-monitor-card"><div class="gt-monitor-card-head"><div><span class="gt-monitor-fase ${r.fase==='POS_FORMACAO'?'pos':'pre'}">${FASES[r.fase]||r.fase}</span><span class="gt-monitor-natureza">${NATUREZAS[r.natureza]||r.natureza}</span></div><time>${fmt(r.data_registro)}</time></div><h3>${esc(r.titulo)}</h3><p>${esc(r.descricao)}</p><div class="gt-monitor-meta"><span>Categoria: <b>${CATEGORIAS[r.categoria]||r.categoria}</b></span><span>Relevância: <b>${RELEVANCIAS[r.relevancia]||r.relevancia}</b></span><span>Resultado: <b>${RESULTADOS[r.resultado]||r.resultado}</b></span>${r.codigo_sigee?`<span>Processo: <b>${esc(r.codigo_sigee)}</b></span>`:''}${r.fase==='POS_FORMACAO'?`<span>Conteúdo da formação: <b>${CONTEUDO[r.conteudo_formacao]||r.conteudo_formacao}</b></span>`:''}</div>${r.evidencia_referencia?`<div class="gt-monitor-evidencia">Evidência / referência: ${esc(r.evidencia_referencia)}</div>`:''}<footer><button type="button" data-editar="${r.id}">Editar</button><button type="button" class="danger" data-excluir="${r.id}">Excluir</button></footer></div></article>`).join('')}</div></section>`).join('')}</div>`;
}
function aplicar(root){root.querySelector('#gtm-lista').innerHTML=timeline(filtrados(root));bindAcoes(root);}
function bind(root){
 ['#gtm-filtro-nte','#gtm-filtro-fase','#gtm-filtro-natureza','#gtm-filtro-resultado'].forEach(s=>root.querySelector(s)?.addEventListener('change',()=>aplicar(root)));
 root.querySelector('#gtm-novo')?.addEventListener('click',()=>modal());bindAcoes(root);
}
function bindAcoes(root){
 root.querySelectorAll('[data-editar]').forEach(b=>b.addEventListener('click',()=>modal(registros.find(x=>String(x.id)===String(b.dataset.editar)))));
 root.querySelectorAll('[data-excluir]').forEach(b=>b.addEventListener('click',async()=>{const r=registros.find(x=>String(x.id)===String(b.dataset.excluir));if(!confirm(`Excluir o registro “${r?.titulo||''}”?`))return;try{await svc().excluir(b.dataset.excluir);await carregar(root);}catch(e){alert(e.message||e);}}));
}
async function carregar(root){
 root=root||document.querySelector('#gt-conteudo');if(!root)return;
 root.innerHTML='<div class="gt-empty">Carregando Monitoramento Territorial...</div>';
 try{registros=await svc().listar();render(root);}catch(e){registros=[];render(root,e);}
}
function render(root,erro){
 root=root||document.querySelector('#gt-conteudo');if(!root)return;
 root.innerHTML=`<article class="gt-panel gt-panel-full gt-monitoramento"><header><div><span>MONITORAMENTO TERRITORIAL • GT-03</span><h2>Registro técnico das medidas adotadas</h2><p>Memória institucional do acompanhamento, diferenciando o diagnóstico pré-formação do monitoramento qualificado pós-formação.</p></div><span class="gt-status">Base para relatórios e prioridade</span></header>${erro?`<div class="gt-agenda-alert"><strong>Configuração necessária</strong><span>${esc(erro.message||erro)}</span><small>Execute o SQL GT-03 no Supabase antes de utilizar o Monitoramento.</small></div>`:''}<div class="gt-monitor-regra"><div><b>Pré-formação</b><span>Registros têm caráter diagnóstico: ocorrências, orientações superficiais, diagnóstico e alinhamento técnico sustentam a prioridade de formação.</span></div><div><b>Pós-formação</b><span>Após os 7 dias de formação, os registros passam a admitir critérios ampliados de conformidade, reincidência e resposta às intervenções.</span></div></div>${resumo()}${filtros()}<div id="gtm-lista">${timeline(registros)}</div></article>`;
 bind(root);
}
function modal(r={}){
 document.getElementById('gt-monitor-modal')?.remove();
 const ntes=window.SIGEE_TERRITORIAL_DATA?.NTES||[];
 const m=document.createElement('div');m.id='gt-monitor-modal';m.className='gt-modal-backdrop';
 m.innerHTML=`<div class="gt-modal" role="dialog" aria-modal="true" aria-labelledby="gtm-modal-titulo"><header><div><span>MONITORAMENTO TERRITORIAL</span><h2 id="gtm-modal-titulo">${r.id?'Editar registro':'Novo registro técnico'}</h2><p>O registro integrará a linha histórica e os relatórios do NTE.</p></div><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="gt-modal-body"><div class="gt-form-grid">
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Território e fase de análise</b><small>A fase define o nível de exigência aplicado ao registro.</small></div><div class="gt-form-grid gt-form-grid-inner"><label>NTE<select id="gtm-nte"><option value="">Selecione</option>${ntes.map(n=>`<option value="${n.numero}" ${Number(r.nte_numero)===n.numero?'selected':''}>${n.codigo} — ${esc(n.sede)}</option>`).join('')}</select></label><label>Fase<select id="gtm-fase">${opt(FASES,r.fase||'PRE_FORMACAO')}</select></label><label>Tipo de registro<select id="gtm-natureza">${opt(NATUREZAS,r.natureza||'OCORRENCIA')}</select></label><label>Data do registro<input id="gtm-data" type="datetime-local" value="${r.data_registro?new Date(new Date(r.data_registro).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></label></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Descrição técnica</b><small>Registre o fato, a orientação ou a medida de forma objetiva.</small></div><div class="gt-form-grid gt-form-grid-inner"><label class="span2">Título<input id="gtm-titulo" maxlength="180" value="${esc(r.titulo||'')}" placeholder="Ex.: Orientação sobre sequência de reiterações"></label><label>Categoria<select id="gtm-categoria">${opt(CATEGORIAS,r.categoria||'PROCEDIMENTO')}</select></label><label>Relevância<select id="gtm-relevancia">${opt(RELEVANCIAS,r.relevancia||'INFORMATIVA')}</select></label><label class="span2">Descrição<textarea id="gtm-descricao" rows="4" placeholder="Descreva a situação observada e a medida adotada.">${esc(r.descricao||'')}</textarea></label></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Vínculo com o processo</b><small>Opcional. Permite compor o relatório com a evidência do processo analisado.</small></div><div class="gt-form-grid gt-form-grid-inner"><label>ID do processo<input id="gtm-processo-id" type="number" min="1" value="${r.processo_id||''}" placeholder="ID interno"></label><label>Código SIGEE<input id="gtm-codigo" value="${esc(r.codigo_sigee||'')}" placeholder="Ex.: SIGEE-2026-000123"></label><label class="span2">Evidência / referência<input id="gtm-evidencia" value="${esc(r.evidencia_referencia||'')}" placeholder="Documento, despacho, e-mail, anexo, ocorrência ou outra referência"></label></div></section>
 <section class="span2 gt-form-section"><div class="gt-form-section-title"><b>Acompanhamento e resultado</b><small>No pós-formação, informe se o tema foi trabalhado durante os 7 dias.</small></div><div class="gt-form-grid gt-form-grid-inner"><label>Resultado / situação<select id="gtm-resultado">${opt(RESULTADOS,r.resultado||'EM_ACOMPANHAMENTO')}</select></label><label id="gtm-conteudo-wrap">Conteúdo abordado na formação<select id="gtm-conteudo">${opt(CONTEUDO,r.conteudo_formacao||'NAO_SE_APLICA')}</select></label><label>Prazo para acompanhamento<input id="gtm-prazo" type="date" value="${fmtData(r.prazo)}"></label><label>Data de conclusão<input id="gtm-conclusao" type="date" value="${fmtData(r.concluido_at)}"></label><label class="span2">Observações<textarea id="gtm-observacoes" rows="2">${esc(r.observacoes||'')}</textarea></label></div></section>
 </div></div><footer><button type="button" data-fechar>Cancelar</button><button type="button" class="gt-primary" id="gtm-salvar">Salvar registro</button></footer></div>`;
 document.body.appendChild(m);m.querySelectorAll('[data-fechar]').forEach(b=>b.addEventListener('click',()=>m.remove()));m.addEventListener('click',e=>{if(e.target===m)m.remove();});
 const ajustarFase=()=>{const pos=m.querySelector('#gtm-fase').value==='POS_FORMACAO';const w=m.querySelector('#gtm-conteudo-wrap');w.hidden=!pos;if(!pos)m.querySelector('#gtm-conteudo').value='NAO_SE_APLICA';};m.querySelector('#gtm-fase').addEventListener('change',ajustarFase);ajustarFase();
 m.querySelector('#gtm-salvar').addEventListener('click',async()=>{const b=m.querySelector('#gtm-salvar');try{b.disabled=true;b.textContent='Salvando...';const payload={id:r.id||null,nte_numero:m.querySelector('#gtm-nte').value,fase:m.querySelector('#gtm-fase').value,natureza:m.querySelector('#gtm-natureza').value,data_registro:new Date(m.querySelector('#gtm-data').value).toISOString(),titulo:m.querySelector('#gtm-titulo').value,categoria:m.querySelector('#gtm-categoria').value,relevancia:m.querySelector('#gtm-relevancia').value,descricao:m.querySelector('#gtm-descricao').value,processo_id:m.querySelector('#gtm-processo-id').value,codigo_sigee:m.querySelector('#gtm-codigo').value,evidencia_referencia:m.querySelector('#gtm-evidencia').value,resultado:m.querySelector('#gtm-resultado').value,conteudo_formacao:m.querySelector('#gtm-conteudo').value,prazo:m.querySelector('#gtm-prazo').value||null,concluido_at:m.querySelector('#gtm-conclusao').value?new Date(`${m.querySelector('#gtm-conclusao').value}T12:00:00`).toISOString():null,observacoes:m.querySelector('#gtm-observacoes').value};await svc().salvar(payload);m.remove();await carregar(document.querySelector('#gt-conteudo'));}catch(e){alert(e.message||e);b.disabled=false;b.textContent='Salvar registro';}});
}
window.SIGEE_TERRITORIAL_MONITORAMENTO=Object.freeze({render,carregar,modal,versao:'GT-03.0'});
document.addEventListener('sigee:gt-monitoramento-atualizado',()=>{if(document.querySelector('.gt-monitoramento'))carregar(document.querySelector('#gt-conteudo'));});
})(window,document);
