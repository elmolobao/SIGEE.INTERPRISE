(function(){
  'use strict';
  if(window.__SIGEE_ANALYTICS_ENGINE_243__) return;
  window.__SIGEE_ANALYTICS_ENGINE_243__=true;

  const LIMITES={ANALISE:7,DIGITACAO:15,CONFERENCIA:10,ASSINATURA:7,DESARQUIVAMENTO:30,REITERACAO:38,'REITERACAO COM URGENCIA':45,'REITERACAO URGENTE':45,'CONFIRMACAO DOS DADOS DA BUSCA':52,'CONFIRMAR DADOS DA BUSCA':52,'PEDIDO DE ATAS SEM PASTA':59};
  const NTE_NOMES={1:'Irecê',2:'Bom Jesus da Lapa',3:'Seabra',4:'Serrinha',5:'Itabuna',6:'Valença',7:'Teixeira de Freitas',8:'Itapetinga',9:'Amargosa',10:'Juazeiro',11:'Barreiras',12:'Macaúbas',13:'Caetité',14:'Itaberaba',15:'Ipirá',16:'Jacobina',17:'Ribeira do Pombal',18:'Alagoinhas',19:'Feira de Santana',20:'Vitória da Conquista',21:'Santo Antônio de Jesus',22:'Jequié',23:'Santa Maria da Vitória',24:'Paulo Afonso',25:'Senhor do Bonfim',26:'Salvador',27:'Eunápolis'};

  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const parseData=v=>{if(!v)return null;const s=txt(v),m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);const d=m?new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`):new Date(s);return Number.isNaN(d.getTime())?null:d};
  const dias=(a,b=new Date())=>{const x=parseData(a),y=parseData(b)||new Date();return x?Math.max(0,(y-x)/86400000):0};
  const etapa=p=>norm(p?.etapa_atual||p?.etapa||p?.fase_atual||'DESARQUIVAMENTO');
  const inicio=p=>p?.data_solicitacao||p?.data_abertura||p?.created_at||p?.criado_em;
  const entrada=p=>p?.data_etapa_atual||p?.prazo_inicio||inicio(p);
  const conclusao=p=>p?.finalizado_em||p?.data_conclusao||p?.deferido_em||p?.updated_at;
  const finalizado=p=>['RETIRADO','INDEFERIDO'].includes(etapa(p));
  const ativo=p=>!finalizado(p);
  const limite=p=>LIMITES[etapa(p)]??null;
  const vencido=p=>ativo(p)&&limite(p)!=null&&dias(entrada(p))>limite(p);
  const proximo=p=>ativo(p)&&limite(p)!=null&&!vencido(p)&&dias(entrada(p))>=Math.max(0,limite(p)-2);
  const nteNumero=p=>Number(txt(p?.nte||p?.nte_nome||p?.grupo||'').match(/\d{1,2}/)?.[0]||0);
  const nteLabel=n=>n?`NTE-${String(n).padStart(2,'0')} (${NTE_NOMES[n]||'Território'})`:'NTE não informado';
  const escolaNome=p=>txt(p?.escola_nome||p?.escola||p?.nome_escola||p?.instituicao||'Não informada');
  const escolaLabel=p=>nteNumero(p)?`${escolaNome(p)} - ${nteLabel(nteNumero(p))}`:escolaNome(p);
  const tecnicoNome=p=>txt(p?.tecnico_responsavel_nome||p?.tecnico_responsavel||p?.responsavel_nome||p?.responsavel||p?.analista_nome||p?.analista||p?.digitador_nome||p?.digitador||p?.conferente_nome||p?.conferente||'Não atribuído');
  const tecnicoLabel=p=>nteNumero(p)?`${tecnicoNome(p)} - ${nteLabel(nteNumero(p))}`:tecnicoNome(p);

  let ultimaAssinatura='',ultimaLista=[];
  const cache=new Map();

  function assinatura(arr){let soma=0,recente='';for(const p of arr){soma+=Number(p?.id||0);const u=txt(p?.updated_at||p?.data_etapa_atual||p?.created_at||'');if(u>recente)recente=u}return `${arr.length}|${soma}|${recente}`}
  function base(){const arr=Array.isArray(window.processosDB)?window.processosDB:[];const sig=assinatura(arr);if(sig!==ultimaAssinatura){ultimaAssinatura=sig;ultimaLista=arr.slice();cache.clear();window.dispatchEvent(new CustomEvent('sigee:analytics-dados-alterados',{detail:{assinatura:sig,total:arr.length}}))}return ultimaLista}
  function agrupar(arr,chave){const m=new Map();arr.forEach(x=>{const k=chave(x);if(k)m.set(k,(m.get(k)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1])}
  function periodo(tipo='ACUMULADO',iniRaw=null,fimRaw=null){let ini=iniRaw?new Date(iniRaw):null,fim=fimRaw?new Date(fimRaw):new Date();fim.setHours(23,59,59,999);if(!ini){if(tipo==='HOJE'){ini=new Date();ini.setHours(0,0,0,0)}else if(tipo==='ONTEM'){ini=new Date(Date.now()-86400000);ini.setHours(0,0,0,0)}else if(tipo==='7_DIAS'){ini=new Date(Date.now()-6*86400000);ini.setHours(0,0,0,0)}else if(tipo==='30_DIAS'){ini=new Date(Date.now()-29*86400000);ini.setHours(0,0,0,0)}else if(tipo==='MES_ATUAL')ini=new Date(fim.getFullYear(),fim.getMonth(),1);else if(tipo==='MES_ANTERIOR'){ini=new Date(fim.getFullYear(),fim.getMonth()-1,1);fim=new Date(fim.getFullYear(),fim.getMonth(),0,23,59,59,999)}else if(tipo==='ANO_ATUAL')ini=new Date(fim.getFullYear(),0,1)}return {tipo,ini,fim}}
  function noPeriodo(v,p){if(!p.ini)return true;const d=parseData(v);return !!d&&d>=p.ini&&d<=p.fim}

  function calcular(filtro={}){
    const arr=base(),nte=filtro.nte&&filtro.nte!=='TODOS'&&filtro.nte!=='GLOBAL'?Number(filtro.nte):null,p=periodo(filtro.tipo||'ACUMULADO',filtro.ini||null,filtro.fim||null);
    const chave=`${ultimaAssinatura}|${nte||'GLOBAL'}|${p.tipo}|${p.ini?.toISOString()||''}|${p.fim?.toISOString()||''}`;
    if(cache.has(chave))return cache.get(chave);
    const lista=nte?arr.filter(x=>nteNumero(x)===nte):arr.slice(),ativos=lista.filter(ativo),vencidos=ativos.filter(vencido),concluidos=lista.filter(x=>finalizado(x)&&noPeriodo(conclusao(x),p)),abertos=lista.filter(x=>noPeriodo(inicio(x),p));
    const tempos=concluidos.map(x=>dias(inicio(x),conclusao(x))).filter(Number.isFinite),mediaAtendimento=tempos.length?tempos.reduce((a,b)=>a+b,0)/tempos.length:0,sla=ativos.length?(ativos.length-vencidos.length)/ativos.length*100:100;
    const r=Object.freeze({filtro:Object.freeze({nte,periodo:p}),total:lista.length,ativos:ativos.length,vencidos:vencidos.length,proximosVencimento:ativos.filter(proximo).length,abertosPeriodo:abertos.length,concluidosPeriodo:concluidos.length,mediaAtendimento,sla,prioridadesCriticas:ativos.filter(x=>['MP','CEE','EXTERIOR','URGENTE'].some(y=>norm(x?.prioridade).includes(y))).length,porEtapa:agrupar(ativos,etapa),porNte:agrupar(abertos,x=>nteLabel(nteNumero(x))),porEscola:agrupar(abertos,escolaLabel),porTecnico:agrupar(concluidos,tecnicoLabel),processos:lista,atualizadosEm:new Date().toISOString()});
    cache.set(chave,r);return r
  }

  function filtroDashboard(){const raw=txt(document.getElementById('filtro-dashboard-nte')?.value||window.filtroDashboardNteAtualSIGEE||'TODOS'),m=raw.match(/\d{1,2}/);return {nte:m?Number(m[0]):'TODOS',tipo:document.getElementById('filtro-dashboard-periodo')?.value||'ACUMULADO',ini:document.getElementById('dashboard-data-inicial')?.value||null,fim:document.getElementById('dashboard-data-final')?.value||null}}

  window.SIGEE_Analytics=Object.freeze({calcular,calcularDashboard:()=>calcular(filtroDashboard()),filtroDashboard,invalidar:()=>{ultimaAssinatura='';cache.clear();base()},helpers:Object.freeze({txt,norm,parseData,dias,etapa,inicio,entrada,conclusao,finalizado,ativo,vencido,proximo,nteNumero,nteLabel,escolaLabel,tecnicoLabel})});
  setInterval(base,2000);
  window.addEventListener('sigee:processos-atualizados',()=>window.SIGEE_Analytics.invalidar());
  console.info('[SIGEE] Motor Analítico Unificado 2.4.3 carregado.');
})();
