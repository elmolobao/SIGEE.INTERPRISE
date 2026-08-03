/* SIGEE Enterprise RC6.4.0 — Motor territorial compartilhável */
(function(){
 'use strict';
 const txt=v=>v==null?'':String(v).trim();const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const nte=v=>window.SIGEE_SALA_DATA.nte(v);
 const etapa=p=>txt(p.etapa_atual||p.etapa||p.fase_atual)||'Desarquivamento';
 const resp=p=>txt(p.tecnico_atribuido||p.tecnico_responsavel||p.responsavel_etapa||p.analista||p.digitador||p.conferente||p.responsavel||p.usuario_lancamento||p.criado_por_nome);
 function data(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
 function dias(v){const d=data(v);return d?Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)):0;}
 function fim(p){const e=norm(etapa(p));return e.includes('RETIR')||e.includes('INDEFER')||e.includes('DEFERIDO');}
 function limite(e){const n=norm(e);if(n.includes('DESARQ'))return 30;if(n.includes('ANAL'))return 7;if(n.includes('DIGIT'))return 15;if(n.includes('CONFER'))return 10;if(n.includes('ASSIN'))return 7;return null;}
 function atraso(p){const l=limite(etapa(p));return !fim(p)&&l!=null&&dias(p.data_etapa_atual||p.data_etapa||p.prazo_inicio||p.created_at)>l;}
 function risco(p){if(fim(p))return 'NORMAL';const d=dias(p.data_etapa_atual||p.data_etapa||p.prazo_inicio||p.created_at);const l=limite(etapa(p));const pr=norm(p.prioridade);if(atraso(p)&&d>(l||0)+15)return 'CRITICO';if(atraso(p)||pr.includes('URG')||pr.includes('CRIT'))return 'ALTO';if((l!=null&&d>=Math.max(0,l-3))||!resp(p))return 'MEDIO';return 'NORMAL';}
 function scoreTerritorial(m){if(!m.ativos)return 0;const pctCrit=m.criticos/m.ativos*100;const pctAtraso=m.atrasados/m.ativos*100;const pctSem=m.semResponsavel/m.ativos*100;return Math.min(100,Math.round(pctCrit*.5+pctAtraso*.3+pctSem*.2));}
 function classe(s){return s>=76?'CRITICO':s>=51?'ALTO':s>=26?'ATENCAO':'NORMAL';}
 function analisar(processos){
   const ativos=processos.filter(p=>!fim(p));const finalizados=processos.filter(fim);const hoje=new Date().toDateString();
   const recebidosHoje=processos.filter(p=>data(p.created_at||p.data_solicitacao)?.toDateString()===hoje).length;
   const concluidosHoje=finalizados.filter(p=>data(p.finalizado_em||p.retirado_em||p.updated_at)?.toDateString()===hoje).length;
   const atrasados=ativos.filter(atraso);const criticos=ativos.filter(p=>risco(p)==='CRITICO');const sem=ativos.filter(p=>!resp(p));
   const etapas={};ativos.forEach(p=>{const e=etapa(p);etapas[e]=(etapas[e]||0)+1;});
   const mapa=new Map();for(let i=1;i<=27;i++)mapa.set('NTE-'+String(i).padStart(2,'0'),[]);processos.forEach(p=>{const k=nte(p.nte||p.nte_nome||p.territorio||p.nte_id);if(!mapa.has(k))mapa.set(k,[]);mapa.get(k).push(p);});
   const territorios=[...mapa].map(([codigo,ps])=>{const a=ps.filter(p=>!fim(p));const m={codigo,ativos:a.length,total:ps.length,criticos:a.filter(p=>risco(p)==='CRITICO').length,altos:a.filter(p=>risco(p)==='ALTO').length,atrasados:a.filter(atraso).length,semResponsavel:a.filter(p=>!resp(p)).length,processos:a};m.indice=scoreTerritorial(m);m.classe=classe(m.indice);return m;}).sort((a,b)=>b.indice-a.indice||b.criticos-a.criticos);
   const fila=ativos.slice().sort((a,b)=>(({CRITICO:4,ALTO:3,MEDIO:2,NORMAL:1}[risco(b)]||0)-({CRITICO:4,ALTO:3,MEDIO:2,NORMAL:1}[risco(a)]||0)) || (dias(b.data_etapa_atual||b.created_at)-dias(a.data_etapa_atual||a.created_at)));
   return {processos,ativos,finalizados,recebidosHoje,concluidosHoje,atrasados,criticos,semResponsavel:sem,etapas,territorios,fila,risco,etapa,responsavel:resp,atraso};
 }
 window.SIGEE_SALA_ENGINE={analisar};
})();
