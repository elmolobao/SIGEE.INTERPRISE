/** SIGEE Enterprise — GT-04.3 Comunicações de agenda direcionadas aos NTEs. */
(function(window,document){
'use strict';
if(window.SIGEE_GT_NOTIFICACOES) return;
let executando=false;
const TIPOS={REUNIAO:'Reunião',ALINHAMENTO_TECNICO:'Alinhamento técnico',FORMACAO_TERRITORIAL:'Formação territorial',VISITA_TECNICA:'Visita técnica',ACOMPANHAMENTO:'Acompanhamento',OUTRA:'Outra atividade'};
const MODALIDADES={PRESENCIAL:'Presencial',ONLINE:'Online',HIBRIDA:'Híbrida'};
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(v){try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch(_){return v||'—';}}
function periodo(e){if(!e?.inicio)return '—';const ini=fmt(e.inicio),fim=e.fim?fmt(e.fim):'';return fim&&fim!==ini?`${ini} até ${fim}`:ini;}
function linha(rotulo,valor){return valor?`<div class="gt-notificacao-dado"><b>${esc(rotulo)}</b><span>${esc(valor)}</span></div>`:'';}
async function verificar(){
 if(executando)return;executando=true;
 try{
  const svc=window.SIGEE_TERRITORIAL_AGENDA_SERVICE;if(!svc||svc.master())return;
  const itens=await svc.notificacoesUsuario();const pendentes=itens.filter(x=>!x.ciencia?.ciencia_at&&!['CANCELADO'].includes(x.situacao));if(!pendentes.length)return;
  mostrar(pendentes.slice(0,5));await svc.marcarVisualizado(pendentes[0].id);
 }catch(e){console.warn('[GT-04.3] Comunicação territorial:',e.message||e);}finally{executando=false;}
}
function mostrar(itens){
 document.getElementById('gt-notificacao-modal')?.remove();
 const m=document.createElement('div');m.id='gt-notificacao-modal';m.className='gt-modal-backdrop gt-notificacao-backdrop';
 m.innerHTML=`<div class="gt-modal gt-notificacao" role="dialog" aria-modal="true" aria-labelledby="gtn-titulo"><header><div><span>COMUNICAÇÃO INSTITUCIONAL</span><h2 id="gtn-titulo">Agenda do seu território</h2><p>Há ${itens.length} atividade(s) comunicada(s) pela Gestão Master.</p></div><button type="button" data-fechar aria-label="Fechar">×</button></header><div class="gt-modal-body"><div class="gt-notificacao-lista">${itens.map((e,i)=>`<article data-agenda="${e.id}" class="${i===0?'ativo':''}"><div class="gt-notificacao-topo"><strong>${esc(e.titulo)}</strong><span class="gt-notificacao-tipo">${esc(TIPOS[e.tipo]||e.tipo||'Atividade')}</span></div><div class="gt-notificacao-dados">${linha('Período',periodo(e))}${linha('Modalidade',MODALIDADES[e.modalidade]||e.modalidade)}${linha('Local / link',e.local)}${linha('Motivo / finalidade',e.motivo)}${linha('Objetivo',e.objetivo)}${linha('Pauta / conteúdo',e.pauta)}${linha('Observações',e.observacoes)}</div><button type="button" data-ciencia="${e.id}">Confirmar ciência</button></article>`).join('')}</div></div><footer><small>A confirmação registra o usuário, o território e a data/hora da ciência.</small><button type="button" data-fechar>Fechar</button></footer></div>`;
 document.body.appendChild(m);m.querySelectorAll('[data-fechar]').forEach(b=>b.addEventListener('click',()=>m.remove()));m.querySelectorAll('[data-ciencia]').forEach(b=>b.addEventListener('click',async()=>{try{b.disabled=true;b.textContent='Registrando...';await window.SIGEE_TERRITORIAL_AGENDA_SERVICE.confirmarCiencia(b.dataset.ciencia);b.textContent='✓ Ciência confirmada';b.closest('article')?.classList.add('confirmado');setTimeout(()=>{if([...m.querySelectorAll('[data-ciencia]')].every(x=>x.disabled))m.remove();},900);}catch(e){b.disabled=false;b.textContent='Confirmar ciência';alert(e.message||e);}}));
}
window.SIGEE_GT_NOTIFICACOES=Object.freeze({verificar,versao:'GT-04.3'});
window.addEventListener('sigee:session-ready',()=>setTimeout(verificar,1200));document.addEventListener('sigee:usuario-logado',()=>setTimeout(verificar,1500));
})(window,document);
