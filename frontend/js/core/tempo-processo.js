/* SIGEE RC11.3.7 — Autoridade Temporal Única
 * Escola Ativa: SLA global de 30 dias, contado desde a abertura, incluindo
 * Desarquivamento -> Análise -> Digitação -> Conferência -> Assinatura.
 * Pendência é a única suspensão. Aguardando Retirada/Retirado não ampliam o SLA.
 * Escola Extinta/NTE: mantém ciclo externo e prazos internos homologados.
 */
(function(global){
  'use strict';
  if(global.SIGEE_TEMPO_PROCESSO?.versao === 'RC11.3.7') return;
  const DIA=86400000;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
  function dataCivil(v){
    if(!v) return null;
    if(v instanceof Date){ if(Number.isNaN(v.getTime())) return null; return new Date(v.getFullYear(),v.getMonth(),v.getDate()); }
    const s=String(v).trim(); let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m) return new Date(+m[1],+m[2]-1,+m[3]);
    m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m) return new Date(+m[3],+m[2]-1,+m[1]);
    const d=new Date(v); return Number.isNaN(d.getTime())?null:new Date(d.getFullYear(),d.getMonth(),d.getDate());
  }
  function numeroDia(v){ const d=dataCivil(v); return d?Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DIA):null; }
  function diferenca(a,b){ const x=numeroDia(a),y=numeroDia(b); return x==null||y==null?0:Math.max(0,y-x); }
  function inclusivo(a,b){ const x=numeroDia(a),y=numeroDia(b); return x==null||y==null?0:Math.max(0,y-x+1); }
  function ehEscola(p){ return norm(p?.escopo_tipo)==='ESCOLA'; }
  function etapa(p){ return norm(p?.etapa_atual||p?.etapa||p?.fase_atual); }
  function abertura(p){ return p?.sla_inicio||p?.created_at||p?.data_abertura||p?.prazo_inicio||p?.data_etapa_atual||null; }
  function fimSla(p,ref){ return p?.sla_finalizado_em||p?.deferido_em||((etapa(p)==='INDEFERIDO')?p?.finalizado_em:null)||ref||new Date(); }
  function pendenciaAcumulada(p,ref){
    let d=Math.max(0,Number(p?.sla_pendencia_dias||0));
    if(etapa(p).includes('PEND') && p?.sla_pendencia_inicio){ d += inclusivo(p.sla_pendencia_inicio, ref||new Date()); }
    return d;
  }
  function slaEscola(p,ref=new Date()){
    const ini=abertura(p), fim=fimSla(p,ref), pend=pendenciaAcumulada(p,ref);
    const calendario=inclusivo(ini,fim);
    const consumidos=Math.max(0,calendario-pend);
    const limite=30, saldo=Math.max(0,limite-consumidos), atraso=Math.max(0,consumidos-limite);
    const suspenso=etapa(p).includes('PEND');
    const encerrado=Boolean(p?.sla_finalizado_em||p?.deferido_em||['AGUARDANDO RETIRADA','RETIRADO','INDEFERIDO'].includes(etapa(p)));
    return Object.freeze({regime:'SLA_GLOBAL_30',inicio:ini,fim,limite,diasCalendario:calendario,diasPendencia:pend,diasConsumidos:consumidos,diasRestantes:saldo,diasAtraso:atraso,suspenso,encerrado,vencido:consumidos>limite,venceHoje:consumidos===limite});
  }
  function prazoInterno(etapaNome){ const e=norm(etapaNome); if(e.includes('ANAL'))return 7;if(e.includes('DIGIT'))return 15;if(e.includes('CONFER'))return 10;if(e.includes('ASSIN'))return 7;return null; }
  function marcoExterno(p,ref=new Date()){
    const ini=p?.data_inicio_desarquivamento||p?.data_inicio_ciclo||p?.prazo_inicio_ciclo||p?.prazo_inicio||p?.created_at;
    const elapsed=diferenca(ini,ref); // abertura = 0; 31º dia civil = 30 transcorridos
    if(elapsed>=51)return {elapsed,diaCivil:elapsed+1,codigo:'PAS'};
    if(elapsed>=44)return {elapsed,diaCivil:elapsed+1,codigo:'CFD'};
    if(elapsed>=37)return {elapsed,diaCivil:elapsed+1,codigo:'REU'};
    if(elapsed>=30)return {elapsed,diaCivil:elapsed+1,codigo:'RET'};
    return {elapsed,diaCivil:elapsed+1,codigo:'DES'};
  }
  global.SIGEE_TEMPO_PROCESSO=Object.freeze({versao:'RC11.3.7',dataCivil,numeroDia,diferenca,inclusivo,ehEscola,etapa,abertura,slaEscola,prazoInterno,marcoExterno});
})(window);
