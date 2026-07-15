(function(){
  'use strict';
  if(window.__SIGEE_DIAGNOSTICO_244A__) return;
  window.__SIGEE_DIAGNOSTICO_244A__=true;

  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};

  function card(nome,ativo,detalhe){
    return `<article class="sigee-diag-card ${ativo?'ok':'erro'}">
      <div><i></i><span>${ativo?'OPERACIONAL':'INDISPONÍVEL'}</span></div>
      <strong>${nome}</strong><small>${detalhe}</small>
    </article>`;
  }

  window.atualizarDiagnosticoSIGEE=function(manual=false){
    const inicio=performance.now();
    let resultado=null;
    try{resultado=window.SIGEE_Analytics?.calcularDashboard?.()||null}catch(_){}
    const tempo=performance.now()-inicio;

    const componentes=[
      ['Motor Analítico',!!window.SIGEE_Analytics,resultado?`${resultado.total} processos no recorte`:'Módulo não detectado'],
      ['Dashboard',typeof window.carregarDadosDashboardReal==='function','Integração executiva'],
      ['Sala de Situação',typeof window.atualizarSalaSituacaoSIGEE==='function','Monitoramento operacional'],
      ['Prontuário',typeof window.abrirProntuarioProcessoSIGEE==='function'||!!window.__SIGEE_PRONTUARIO_231A__,'Linha do tempo'],
      ['Workflow',!!window.SIGEE_WorkflowEngine||typeof window.abrirWorkflowExterno==='function','Transições'],
      ['Conectividade',navigator.onLine,navigator.onLine?'Navegador online':'Navegador offline']
    ];

    const box=document.getElementById('diag-componentes');
    if(box)box.innerHTML=componentes.map(x=>card(...x)).join('');

    const ok=componentes.every(x=>x[1]);
    set('diag-status-geral',ok?'Sistema operacional':'Atenção necessária');
    set('diag-atualizado',`Atualizado em ${new Date().toLocaleString('pt-BR')}`);
    set('diag-processos',(window.processosDB?.length||0).toLocaleString('pt-BR'));
    set('diag-escolas',(window.escolasDB?.length||0).toLocaleString('pt-BR'));
    set('diag-usuarios',(window.usuariosDB?.length||0).toLocaleString('pt-BR'));
    set('diag-tempo-calculo',resultado?`${tempo.toLocaleString('pt-BR',{maximumFractionDigits:2})} ms`:'—');
    set('diag-ultima-sync',resultado?new Date(resultado.atualizadosEm).toLocaleTimeString('pt-BR'):'—');
    set('diag-conectividade',navigator.onLine?'Online':'Offline');
    document.getElementById('diagnostico-resumo')?.classList.toggle('atencao',!ok);
    if(manual)window.mostrarToast?.('Diagnóstico atualizado.');
  };
})();
