(function(){
  'use strict';
  if(window.__SIGEE_ANALYTICS_BRIDGE_243__)return;
  window.__SIGEE_ANALYTICS_BRIDGE_243__=true;
  const txt=v=>v==null?'':String(v).trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  let timer=null;

  function renderTop(id,dados){
    const box=document.getElementById(id);if(!box)return;
    box.innerHTML=(dados||[]).slice(0,10).map(([nome,q],i)=>`<div class="flex justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0"><span class="min-w-0 truncate" title="${esc(nome)}">${i+1}. ${esc(nome)}</span><strong class="shrink-0">${Number(q||0).toLocaleString('pt-BR')}</strong></div>`).join('')||'Sem dados';
  }
  function atualizar(){
    if(!window.SIGEE_Analytics)return;
    const r=window.SIGEE_Analytics.calcularDashboard(),p=r.filtro.periodo,diasBase=p.ini&&p.fim?Math.max(1,Math.floor((p.fim-p.ini)/86400000)+1):Math.max(1,r.abertosPeriodo||1);
    requestAnimationFrame(()=>{
      renderTop('dash-tec-top-escolas',r.porEscola);
      renderTop('dash-ger-escola-demanda',r.porEscola);
      set('dash-tec-media-entrega',`${r.mediaAtendimento.toLocaleString('pt-BR',{maximumFractionDigits:1})} dias`);
      set('dash-tec-media-pedidos-dia',(r.abertosPeriodo/diasBase).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}));
      set('cig-total-ativos',`${r.ativos.toLocaleString('pt-BR')} ativos`);
      set('cig-atualizado',`Atualizado em ${new Date(r.atualizadosEm).toLocaleString('pt-BR')}`);
      document.querySelectorAll('.sigee-dados-atualizando').forEach(x=>x.classList.remove('sigee-dados-atualizando'));
      document.getElementById('sigee-dashboard-atualizando')?.classList.remove('visivel');
    });
  }
  function agendar(){clearTimeout(timer);timer=setTimeout(atualizar,120)}
  window.addEventListener('sigee:analytics-dados-alterados',agendar);
  document.addEventListener('change',e=>{if(['filtro-dashboard-nte','filtro-dashboard-periodo','dashboard-data-inicial','dashboard-data-final'].includes(e.target?.id))agendar()},true);
  window.addEventListener('load',()=>setTimeout(agendar,700));
  window.atualizarDashboardPeloMotorSIGEE=agendar;
  console.info('[SIGEE] Ponte Analítica 2.4.3 carregada.');
})();
