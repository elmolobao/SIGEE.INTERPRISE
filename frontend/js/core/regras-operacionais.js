/* SIGEE Enterprise RC6.5.0 — Regras operacionais compartilhadas */
(function(){
'use strict';
if(window.SIGEE_REGRAS_OPERACIONAIS) return;
const txt=v=>v==null?'':String(v).trim();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const arr=v=>Array.isArray(v)?v:(v==null||v===''?[]:[v]);
function etapa(p){return txt(p?.etapa_atual||p?.etapa||p?.fase_atual);}
function pendenciaAluno(p){
  const e=norm(etapa(p));
  if(!e.includes('PENDEN')) return false;
  const tipo=norm(p?.tipo_pendencia||p?.pendencia_tipo||p?.origem_pendencia||p?.contexto_pendencia||'');
  if(tipo.includes('ALUNO')||tipo.includes('INTERESSADO')||tipo.includes('SOLICITANTE')||tipo.includes('EXTERNA')) return true;
  if(tipo.includes('INSTITUC')||tipo.includes('INTERNA')) return false;
  const aluno=arr(p?.pendencia_aluno_itens).length>0||txt(p?.pendencia_aluno_complemento);
  const inst=arr(p?.pendencia_instituicao_itens).length>0||txt(p?.pendencia_instituicao_complemento);
  return Boolean(aluno&&!inst);
}
function pendenciaInstitucional(p){
  const e=norm(etapa(p));
  if(!e.includes('PENDEN')) return false;
  if(pendenciaAluno(p)) return false;
  const tipo=norm(p?.tipo_pendencia||p?.pendencia_tipo||p?.origem_pendencia||p?.contexto_pendencia||'');
  const inst=arr(p?.pendencia_instituicao_itens).length>0||txt(p?.pendencia_instituicao_complemento);
  return Boolean(inst||tipo.includes('INSTITUC')||tipo.includes('INTERNA'));
}
window.SIGEE_REGRAS_OPERACIONAIS=Object.freeze({
  versao:'RC6.5.0',etapa,pendenciaAluno,pendenciaInstitucional,
  esperaExterna:pendenciaAluno,
  contaNoSLA:p=>!pendenciaAluno(p),
  contaComoRisco:p=>!pendenciaAluno(p),
  contaComoAtraso:p=>!pendenciaAluno(p),
  contaComoGargalo:p=>!pendenciaAluno(p)
});
console.info('[SIGEE RC6.5.0] Regras operacionais compartilhadas prontas.');
})();
