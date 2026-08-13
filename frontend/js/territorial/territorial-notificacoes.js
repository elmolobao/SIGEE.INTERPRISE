/** SIGEE Enterprise — GT-02 Comunicações de agenda direcionadas aos NTEs. */
(function(window,document){
'use strict';
if(window.SIGEE_GT_NOTIFICACOES) return;
let executando=false;
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(v){try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch(_){return v||'—';}}
async function verificar(){
 if(executando)return;executando=true;
 try{
  const svc=window.SIGEE_TERRITORIAL_AGENDA_SERVICE;if(!svc||svc.master())return;
  const itens=await svc.notificacoesUsuario();const pendentes=itens.filter(x=>!x.ciencia?.ciencia_at&&!['CANCELADO','REALIZADO'].includes(x.situacao));if(!pendentes.length)return;
  mostrar(pendentes.slice(0,5));await svc.marcarVisualizado(pendentes[0].id);
 }catch(e){console.warn('[GT-02] Comunicação territorial:',e.message||e);}finally{executando=false;}
}
function mostrar(itens){
 document.getElementById('gt-notificacao-modal')?.remove();
 const m=document.createElement('div');m.id='gt-notificacao-modal';m.className='gt-modal-backdrop gt-notificacao-backdrop';
 m.innerHTML=`<div class="gt-modal gt-notificacao" role="dialog" aria-modal="true" aria-labelledby="gtn-titulo"><header><div><span>COMUNICAÇÃO INSTITUCIONAL</span><h2 id="gtn-titulo">Agenda do seu território</h2><p>Há ${itens.length} atividade(s) comunicada(s) pela Gestão Master.</p></div><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="gt-modal-body"><div class="gt-notificacao-lista">${itens.map((e,i)=>`<article data-agenda="${e.id}" class="${i===0?'ativo':''}"><strong>${esc(e.titulo)}</strong><span>📅 ${esc(fmt(e.inicio))}</span>${e.local?`<span>📍 ${esc(e.local)}</span>`:''}${e.objetivo?`<p>${esc(e.objetivo)}</p>`:''}<button type="button" data-ciencia="${e.id}">Confirmar ciência</button></article>`).join('')}</div></div><footer><small>A confirmação registra somente a ciência da comunicação.</small><button type="button" data-fechar>Fechar</button></footer></div>`;
 document.body.appendChild(m);m.querySelectorAll('[data-fechar]').forEach(b=>b.addEventListener('click',()=>m.remove()));m.querySelectorAll('[data-ciencia]').forEach(b=>b.addEventListener('click',async()=>{try{b.disabled=true;b.textContent='Registrando...';await window.SIGEE_TERRITORIAL_AGENDA_SERVICE.confirmarCiencia(b.dataset.ciencia);b.textContent='✓ Ciência confirmada';b.closest('article')?.classList.add('confirmado');setTimeout(()=>{if([...m.querySelectorAll('[data-ciencia]')].every(x=>x.disabled))m.remove();},700);}catch(e){b.disabled=false;b.textContent='Confirmar ciência';alert(e.message||e);}}));
}
window.SIGEE_GT_NOTIFICACOES=Object.freeze({verificar,versao:'GT-02.0'});
window.addEventListener('sigee:session-ready',()=>setTimeout(verificar,1200));document.addEventListener('sigee:usuario-logado',()=>setTimeout(verificar,1500));
})(window,document);
