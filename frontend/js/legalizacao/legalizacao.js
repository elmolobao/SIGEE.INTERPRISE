/** SIGEE Enterprise RC12.0.0 — Legalização Escolar: fundação + cadastro institucional. */
(function(window,document){
'use strict';
if(window.__SIGEE_LEGALIZACAO_RC1200__)return;
window.__SIGEE_LEGALIZACAO_RC1200__=true;
const MOD='LEGALIZACAO';
const $=s=>document.querySelector(s);
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function user(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function allowed(){return window.SIGEE_MODULOS?.podeAcessar?.(MOD,user())===true;}
function master(){return window.SIGEE_MODULOS?.ehMaster?.(user())===true;}
function section(){return document.getElementById('aba-legalizacao');}
function statusLabel(v){const t=String(v||'').toUpperCase();return ({EM_CADASTRO:'Em cadastro',EM_CREDENCIAMENTO:'Em credenciamento',CREDENCIADA:'Credenciada',SUSPENSA:'Suspensa',EM_DESCREDENCIAMENTO:'Em descredenciamento',EXTINTA:'Extinta'})[t]||v||'—';}
function statusClass(v){const t=String(v||'').toUpperCase();if(t==='CREDENCIADA')return'ok';if(t==='EXTINTA'||t==='SUSPENSA')return'warn';if(t==='EM_DESCREDENCIAMENTO')return'danger';return'info';}
function renderRows(lista){
  const host=$('#legalizacao-lista');if(!host)return;
  if(!lista.length){host.innerHTML='<div class="leg-empty"><strong>Nenhuma instituição cadastrada nesta abrangência.</strong><span>Use “Nova instituição” para iniciar o ciclo regulatório.</span></div>';return;}
  host.innerHTML=lista.map(i=>`<article class="leg-inst-card" data-id="${esc(i.id)}"><div class="leg-inst-main"><div class="leg-inst-icon">🏫</div><div><h3>${esc(i.nome_instituicao)}</h3><p>${esc(i.municipio||'Município não informado')} · NTE ${esc(i.nte_id)}</p><small>${esc(i.mantenedora_nome||i.razao_social||'Mantenedora ainda não informada')}</small></div></div><div class="leg-inst-meta"><span class="leg-badge ${statusClass(i.situacao_regulatoria)}">${esc(statusLabel(i.situacao_regulatoria))}</span><button type="button" class="leg-link" disabled title="Prontuário regulatório será ativado na próxima etapa">Abrir prontuário</button></div></article>`).join('');
}
async function carregar(){
  if(!allowed())return;
  const svc=window.SIGEE_LEGALIZACAO_SERVICE;if(!svc)return;
  const busy=$('#legalizacao-status');if(busy)busy.textContent='Atualizando…';
  try{
    const [r,l]=await Promise.all([svc.resumo(),svc.listarInstituicoes({busca:$('#legalizacao-busca')?.value||''})]);
    const set=(id,v)=>{const e=$(id);if(e)e.textContent=String(v??0);};
    set('#leg-kpi-instituicoes',r.instituicoes);set('#leg-kpi-credenciadas',r.credenciadas);set('#leg-kpi-processos',r.processosAtivos);set('#leg-kpi-inspecoes',r.inspecoesPendentes);set('#leg-kpi-publicacao',r.aguardandoPublicacao);
    renderRows(l);if(busy)busy.textContent=`${l.length} instituição(ões) na visão atual`;
  }catch(err){console.error('[Legalização] Falha ao carregar.',err);if(busy)busy.textContent='Falha ao carregar dados';const host=$('#legalizacao-lista');if(host)host.innerHTML=`<div class="leg-empty danger"><strong>Não foi possível carregar Legalização.</strong><span>${esc(err.message||err)}</span></div>`;}
}
function ensureModal(){
  let m=document.getElementById('modal-legalizacao-instituicao');if(m)return m;
  m=document.createElement('div');m.id='modal-legalizacao-instituicao';m.className='leg-modal hidden';
  m.innerHTML=`<div class="leg-modal-card"><header><div><small>LEGALIZAÇÃO ESCOLAR</small><h2>Nova instituição</h2><p>Cadastro regulatório inicial. O NTE territorial será fixado ao registro.</p></div><button type="button" data-close>×</button></header><form id="form-legalizacao-instituicao"><div class="leg-form-grid"><label class="span-2">Nome da instituição<input name="nome_instituicao" required maxlength="180"></label><label>Natureza<select name="natureza"><option value="PRIVADA">Privada</option><option value="PUBLICA_ESTADUAL">Pública estadual</option><option value="PUBLICA_MUNICIPAL">Pública municipal</option><option value="OUTRA">Outra</option></select></label><label>CNPJ<input name="cnpj" inputmode="numeric" maxlength="18"></label><label class="span-2">Mantenedora<input name="mantenedora_nome" maxlength="180"></label><label>Município<input name="municipio" maxlength="120"></label><label id="leg-campo-nte">NTE<select name="nte_id" id="leg-nte-select"></select></label><label class="span-2">Endereço<input name="endereco" maxlength="240"></label></div><footer><button type="button" class="secondary" data-close>Cancelar</button><button type="submit" class="primary">Salvar cadastro</button></footer></form></div>`;
  document.body.appendChild(m);m.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>m.classList.add('hidden')));m.querySelector('form').addEventListener('submit',salvarInstituicao);return m;
}
async function abrirNova(){
  if(!allowed())return alert('Acesso à Legalização não autorizado.');
  const m=ensureModal(),sel=m.querySelector('#leg-nte-select'),campo=m.querySelector('#leg-campo-nte');
  if(master()){
    campo.classList.remove('hidden');sel.required=true;sel.innerHTML='<option value="">Carregando NTEs…</option>';
    const ntes=await window.SIGEE_LEGALIZACAO_SERVICE.listarNtes();
    sel.innerHTML='<option value="">Selecione o NTE</option>'+ntes.map(n=>`<option value="${esc(n.id)}">${esc(n.codigo||n.nte||n.nome||('NTE '+n.id))}</option>`).join('');
  }else{
    campo.classList.add('hidden');sel.required=false;sel.innerHTML='';
  }
  m.querySelector('form').reset();m.classList.remove('hidden');setTimeout(()=>m.querySelector('[name="nome_instituicao"]')?.focus(),20);
}
async function salvarInstituicao(ev){
  ev.preventDefault();const form=ev.currentTarget,btn=form.querySelector('[type="submit"]');const fd=new FormData(form);const p=Object.fromEntries(fd.entries());
  btn.disabled=true;btn.textContent='Salvando…';
  try{await window.SIGEE_LEGALIZACAO_SERVICE.criarInstituicao(p);ensureModal().classList.add('hidden');await carregar();alert('Instituição cadastrada com sucesso. O NTE foi fixado ao cadastro regulatório.');}
  catch(err){console.error(err);alert('Não foi possível salvar: '+(err.message||err));}
  finally{btn.disabled=false;btn.textContent='Salvar cadastro';}
}
function abrir(){
  if(!allowed()){alert('Seu usuário não possui vínculo com o módulo Legalização.');return false;}
  document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]').forEach(s=>{s.classList.add('hidden');s.hidden=true;});
  const s=section();if(!s)return false;s.classList.remove('hidden');s.hidden=false;s.style.removeProperty('display');carregar();return true;
}
function init(){
  $('#btn-legalizacao-nova')?.addEventListener('click',abrirNova);
  $('#btn-legalizacao-atualizar')?.addEventListener('click',carregar);
  let timer=0;$('#legalizacao-busca')?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(carregar,220);});
}
document.addEventListener('DOMContentLoaded',init,{once:true});
window.SIGEE_LEGALIZACAO=Object.freeze({abrir,carregar,abrirNova});
})(window,document);
