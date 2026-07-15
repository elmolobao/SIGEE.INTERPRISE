/* =====================================================================
   SIGEE Sprint 2.4.2 — Sala de Situação
   Prioridade: resposta rápida e ausência de consultas duplicadas.
   Fonte única: window.processosDB e histórico já disponível em memória.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_SALA_SITUACAO_242__) return;
  window.__SIGEE_SALA_SITUACAO_242__=true;

  const LIMITES={
    ANALISE:7,DIGITACAO:15,CONFERENCIA:10,ASSINATURA:7,
    DESARQUIVAMENTO:30,REITERACAO:38,'REITERACAO COM URGENCIA':45,
    'REITERACAO URGENTE':45,'CONFIRMACAO DOS DADOS DA BUSCA':52,
    'CONFIRMAR DADOS DA BUSCA':52,'PEDIDO DE ATAS SEM PASTA':59
  };
  const NTE_NOMES={
    1:'Irecê',2:'Bom Jesus da Lapa',3:'Seabra',4:'Serrinha',5:'Itabuna',
    6:'Valença',7:'Teixeira de Freitas',8:'Itapetinga',9:'Amargosa',10:'Juazeiro',
    11:'Barreiras',12:'Macaúbas',13:'Caetité',14:'Itaberaba',15:'Ipirá',
    16:'Jacobina',17:'Ribeira do Pombal',18:'Alagoinhas',19:'Feira de Santana',
    20:'Vitória da Conquista',21:'Santo Antônio de Jesus',22:'Jequié',
    23:'Santa Maria da Vitória',24:'Paulo Afonso',25:'Senhor do Bonfim',
    26:'Salvador',27:'Eunápolis'
  };
  const ETAPAS=['Desarquivamento','Análise','Pendência','Digitação','Conferência','Assinatura','Aguardando Retirada','Retirado'];

  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const data=v=>{
    if(!v)return null;
    const s=txt(v),br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const d=br?new Date(`${br[3]}-${br[2]}-${br[1]}T00:00:00`):new Date(s);
    return Number.isNaN(d.getTime())?null:d;
  };
  const dias=(a,b=new Date())=>{
    const x=data(a),y=data(b)||new Date();
    return x?Math.max(0,(y-x)/86400000):0;
  };
  const etapa=p=>norm(p?.etapa_atual||p?.etapa||p?.fase_atual||'DESARQUIVAMENTO');
  const inicio=p=>p?.data_solicitacao||p?.data_abertura||p?.created_at||p?.criado_em;
  const entrada=p=>p?.data_etapa_atual||p?.prazo_inicio||inicio(p);
  const fim=p=>p?.finalizado_em||p?.data_conclusao||p?.deferido_em||p?.updated_at;
  const finalizado=p=>['RETIRADO','INDEFERIDO'].includes(etapa(p));
  const ativo=p=>!finalizado(p);
  const limite=p=>LIMITES[etapa(p)]??null;
  const vencido=p=>ativo(p)&&limite(p)!=null&&dias(entrada(p))>limite(p);
  const hoje=d=>{
    const x=data(d);if(!x)return false;
    const a=new Date(),b=new Date(x);
    return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  };
  const nteNumero=p=>Number(txt(p?.nte||p?.nte_nome||p?.grupo||'').match(/\d{1,2}/)?.[0]||0);
  const nteRotulo=n=>`NTE-${String(n).padStart(2,'0')} (${NTE_NOMES[n]||'Território'})`;

  let ultimaAssinatura='';
  let ultimoResultado=null;
  let atualizacaoAgendada=false;
  let abaAtiva=false;

  function lista(){return Array.isArray(window.processosDB)?window.processosDB:[]}

  function assinatura(arr){
    let soma=0,maisRecente='';
    for(const p of arr){
      soma+=Number(p?.id||0);
      const u=txt(p?.updated_at||p?.data_etapa_atual||'');
      if(u>maisRecente)maisRecente=u;
    }
    return `${arr.length}|${soma}|${maisRecente}`;
  }

  function agrupar(arr,chave){
    const m=new Map();
    arr.forEach(x=>{const k=chave(x);if(k)m.set(k,(m.get(k)||0)+1)});
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  }

  function calcular(arr){
    const ativos=arr.filter(ativo);
    const recebidosHoje=arr.filter(p=>hoje(inicio(p)));
    const concluidosHoje=arr.filter(p=>finalizado(p)&&hoje(fim(p)));
    const vencidos=ativos.filter(vencido);
    const prioridades=ativos.filter(p=>['MP','CEE','EXTERIOR','URGENTE'].some(x=>norm(p?.prioridade).includes(x)));
    const dentro=ativos.length-vencidos.length;
    const sla=ativos.length?dentro/ativos.length*100:100;

    const porEtapa=ETAPAS.map(nome=>[nome,arr.filter(p=>{
      const e=etapa(p);
      if(nome==='Desarquivamento')return ['DESARQUIVAMENTO','REITERACAO','REITERACAO COM URGENCIA','REITERACAO URGENTE','CONFIRMACAO DOS DADOS DA BUSCA','CONFIRMAR DADOS DA BUSCA','PEDIDO DE ATAS SEM PASTA'].includes(e);
      return e===norm(nome);
    }).length]);

    const porNte=[];
    for(let n=1;n<=27;n++){
      const l=arr.filter(p=>nteNumero(p)===n);
      if(!l.length)continue;
      const a=l.filter(ativo),v=a.filter(vencido);
      const s=a.length?(a.length-v.length)/a.length*100:100;
      porNte.push({n,total:a.length,vencidos:v.length,sla:s});
    }
    porNte.sort((a,b)=>b.vencidos-a.vencidos||a.sla-b.sla||b.total-a.total);

    const recentes=arr.slice().sort((a,b)=>{
      const da=data(a?.updated_at||a?.data_etapa_atual||a?.created_at)?.getTime()||0;
      const db=data(b?.updated_at||b?.data_etapa_atual||b?.created_at)?.getTime()||0;
      return db-da;
    }).slice(0,10);

    return {ativos,recebidosHoje,concluidosHoje,vencidos,prioridades,sla,porEtapa,porNte,recentes};
  }

  function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}

  function render(res){
    ultimoResultado=res;
    set('sala-kpi-ativos',res.ativos.length.toLocaleString('pt-BR'));
    set('sala-kpi-recebidos',res.recebidosHoje.length.toLocaleString('pt-BR'));
    set('sala-kpi-concluidos',res.concluidosHoje.length.toLocaleString('pt-BR'));
    set('sala-kpi-sla',`${res.sla.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`);
    set('sala-kpi-vencidos',res.vencidos.length.toLocaleString('pt-BR'));
    set('sala-kpi-prioridades',res.prioridades.length.toLocaleString('pt-BR'));
    set('sala-total-processos',`${lista().length.toLocaleString('pt-BR')} processos`);

    const fluxo=document.getElementById('sala-fluxo-etapas');
    if(fluxo)fluxo.innerHTML=res.porEtapa.map(([nome,q],i)=>`
      <div class="sigee-sala-etapa">
        <span>${i+1}</span><strong>${esc(nome)}</strong><b>${q.toLocaleString('pt-BR')}</b>
      </div>`).join('');

    const alertas=document.getElementById('sala-alertas-lista');
    if(alertas){
      const itens=[
        ['critico','⚠',`${res.vencidos.length} processo(s) vencido(s)`],
        ['alerta','◷',`${res.ativos.filter(p=>limite(p)!=null&&!vencido(p)&&dias(entrada(p))>=limite(p)-2).length} vencem em até 2 dias`],
        ['prioridade','!',`${res.prioridades.length} prioridade(s) crítica(s)`],
        [res.sla>=80?'ok':'critico',res.sla>=80?'✓':'↓',`SLA operacional em ${res.sla.toFixed(1)}%`]
      ];
      alertas.innerHTML=itens.map(x=>`<div class="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span></div>`).join('');
    }

    const ntes=document.getElementById('sala-ntes');
    if(ntes)ntes.innerHTML=res.porNte.slice(0,12).map(x=>{
      const classe=x.sla>=90&&!x.vencidos?'ok':x.sla>=75?'alerta':'critico';
      return `<div class="sigee-sala-nte ${classe}">
        <div><strong>${nteRotulo(x.n)}</strong><span>${x.total} ativos • ${x.vencidos} vencidos</span></div>
        <b>${x.sla.toFixed(1)}%</b>
      </div>`;
    }).join('')||'<p class="sigee-sala-vazio">Sem dados territoriais.</p>';

    const feed=document.getElementById('sala-feed');
    if(feed)feed.innerHTML=res.recentes.map(p=>{
      const d=data(p?.updated_at||p?.data_etapa_atual||p?.created_at);
      const hora=d?d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'--:--';
      const nome=txt(p?.aluno_nome||p?.aluno||'Processo');
      return `<div><time>${hora}</time><i></i><p><strong>${esc(etapa(p))}</strong><span>${esc(nome)} • ${esc(nteRotulo(nteNumero(p)||0))}</span></p></div>`;
    }).join('')||'<p class="sigee-sala-vazio">Nenhuma movimentação disponível.</p>';

    const agora=new Date();
    set('sala-saude-atualizacao',agora.toLocaleTimeString('pt-BR'));
    set('sala-saude-sync','Atualizada');
    set('sala-sync-texto',`Dados atualizados às ${agora.toLocaleTimeString('pt-BR')}`);
    document.getElementById('sala-sync')?.classList.remove('atualizando');
  }

  function atualizar(){
    atualizacaoAgendada=false;
    const arr=lista();
    if(!arr.length){
      set('sala-sync-texto','Aguardando carregamento dos processos...');
      return;
    }
    const sig=assinatura(arr);
    if(sig===ultimaAssinatura&&ultimoResultado)return;
    ultimaAssinatura=sig;
    render(calcular(arr));
  }

  function agendar(){
    if(atualizacaoAgendada)return;
    atualizacaoAgendada=true;
    requestAnimationFrame(atualizar);
  }

  function atualizarRelogio(){
    const d=new Date();
    set('sala-hora',d.toLocaleTimeString('pt-BR'));
    set('sala-data',d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}));
  }

  function abrirSala(){
    abaAtiva=true;
    agendar();
  }

  const navegarAnterior=window.navegar;
  window.navegar=function(aba){
    document.querySelectorAll('main > section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));
    if(aba==='sala-situacao'){
      document.getElementById('aba-sala-situacao')?.classList.remove('hidden');
      abrirSala();
      return;
    }
    abaAtiva=false;
    return typeof navegarAnterior==='function'?navegarAnterior.apply(this,arguments):undefined;
  };

  document.getElementById('sala-btn-tela-cheia')?.addEventListener('click',async()=>{
    const alvo=document.getElementById('aba-sala-situacao');
    try{
      if(!document.fullscreenElement)await alvo?.requestFullscreen?.();
      else await document.exitFullscreen?.();
    }catch(e){console.warn('[SIGEE Sala] Tela cheia indisponível.',e)}
  });

  // Experiência do filtro do Dashboard: preserva valores e informa processamento.
  function instalarUXFiltro(){
    const sel=document.getElementById('filtro-dashboard-nte');
    if(!sel||sel.dataset.salaUxFiltro==='1')return;
    sel.dataset.salaUxFiltro='1';
    sel.addEventListener('change',()=>{
      const cards=document.querySelectorAll('#aba-painel [id^="dash-"], #sigee-cig');
      cards.forEach(x=>x.classList.add('sigee-dados-atualizando'));
      let aviso=document.getElementById('sigee-dashboard-atualizando');
      if(!aviso){
        aviso=document.createElement('div');
        aviso.id='sigee-dashboard-atualizando';
        aviso.className='sigee-dashboard-atualizando';
        sel.closest('div')?.appendChild(aviso);
      }
      const rotulo=sel.selectedOptions?.[0]?.textContent||'NTE selecionado';
      aviso.textContent=`Atualizando dados de ${rotulo}...`;
      aviso.classList.add('visivel');
      setTimeout(()=>{
        cards.forEach(x=>x.classList.remove('sigee-dados-atualizando'));
        aviso.classList.remove('visivel');
      },2200);
    },true);
  }

  let assinaturaAnterior='';
  setInterval(()=>{
    atualizarRelogio();
    instalarUXFiltro();
    const arr=lista(),sig=assinatura(arr);
    if(sig!==assinaturaAnterior){
      assinaturaAnterior=sig;
      if(abaAtiva)agendar();
    }
  },1000);

  document.addEventListener('DOMContentLoaded',()=>{
    atualizarRelogio();instalarUXFiltro();agendar();
  });
  window.addEventListener('load',()=>setTimeout(()=>{instalarUXFiltro();agendar()},400));
  window.addEventListener('online',()=>{set('sala-saude-banco','Conectado');agendar()});
  window.addEventListener('offline',()=>{set('sala-saude-banco','Offline');set('sala-saude-sync','Interrompida')});

  window.atualizarSalaSituacaoSIGEE=agendar;
  console.info('[SIGEE] Sala de Situação 2.4.2 carregada.');
})();
