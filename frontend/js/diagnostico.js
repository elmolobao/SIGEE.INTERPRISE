/* SIGEE Sprint 2.4.4 — Centro de Diagnóstico */
(function(){
  'use strict';
  if(window.__SIGEE_DIAGNOSTICO_244__)return;
  window.__SIGEE_DIAGNOSTICO_244__=true;

  const txt=v=>v==null?'':String(v).trim();
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  let ultimaSync=null;

  function componente(nome,ativo,detalhe){return {nome,ativo:!!ativo,detalhe}}
  function clienteSupabase(){
    try{return window.obterSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null}catch(_){return null}
  }
  function medirMotor(){
    if(!window.SIGEE_Analytics)return {tempo:null,resultado:null};
    const inicio=performance.now();
    let resultado=null;
    try{resultado=window.SIGEE_Analytics.calcularDashboard()}catch(_){return {tempo:null,resultado:null}}
    return {tempo:performance.now()-inicio,resultado};
  }
  function renderComponentes(lista){
    const box=document.getElementById('diag-componentes');if(!box)return;
    box.innerHTML=lista.map(c=>`<article class="sigee-diag-card ${c.ativo?'ok':'erro'}"><div><i></i><span>${c.ativo?'OPERACIONAL':'INDISPONÍVEL'}</span></div><strong>${c.nome}</strong><small>${c.detalhe}</small></article>`).join('');
  }

  window.atualizarDiagnosticoSIGEE=async function(manual=false){
    const medicao=medirMotor();
    const processos=Array.isArray(window.processosDB)?window.processosDB:[];
    const escolas=Array.isArray(window.escolasDB)?window.escolasDB:[];
    const usuarios=Array.isArray(window.usuariosDB)?window.usuariosDB:[];
    const componentes=[
      componente('Motor Analítico',window.SIGEE_Analytics,medicao.resultado?`${medicao.resultado.total} processos no recorte atual`:'Módulo não detectado'),
      componente('Dashboard',typeof window.carregarDadosDashboardReal==='function'||document.getElementById('sigee-cig'),'Integração executiva'),
      componente('Sala de Situação',typeof window.atualizarSalaSituacaoSIGEE==='function','Monitoramento operacional'),
      componente('Prontuário Eletrônico',typeof window.abrirProntuarioProcessoSIGEE==='function'||window.__SIGEE_PRONTUARIO_231A__,'Linha do tempo processual'),
      componente('Workflow',window.SIGEE_WorkflowEngine||window.SIGEEWorkflow||typeof window.abrirWorkflowExterno==='function','Motor de transições'),
      componente('Supabase',clienteSupabase(),'Cliente de dados configurado'),
      componente('Conectividade',navigator.onLine,navigator.onLine?'Navegador online':'Navegador offline'),
      componente('Armazenamento local',typeof localStorage!=='undefined','Disponível no navegador')
    ];
    renderComponentes(componentes);
    const todosOk=componentes.filter(c=>!['Prontuário Eletrônico','Workflow'].includes(c.nome)).every(c=>c.ativo);
    set('diag-status-geral',todosOk?'Sistema operacional':'Atenção necessária');
    set('diag-atualizado',`Diagnóstico atualizado em ${new Date().toLocaleString('pt-BR')}`);
    set('diag-processos',processos.length.toLocaleString('pt-BR'));
    set('diag-escolas',escolas.length.toLocaleString('pt-BR'));
    set('diag-usuarios',usuarios.length.toLocaleString('pt-BR'));
    set('diag-tempo-calculo',medicao.tempo==null?'—':`${medicao.tempo.toLocaleString('pt-BR',{maximumFractionDigits:2})} ms`);
    ultimaSync=medicao.resultado?.atualizadosEm||new Date().toISOString();
    set('diag-ultima-sync',new Date(ultimaSync).toLocaleTimeString('pt-BR'));
    set('diag-conectividade',navigator.onLine?'Online':'Offline');
    document.getElementById('diagnostico-resumo')?.classList.toggle('atencao',!todosOk);
    if(manual&&typeof window.mostrarToast==='function')window.mostrarToast('Diagnóstico atualizado.');
  };

  window.addEventListener('online',()=>window.atualizarDiagnosticoSIGEE?.());
  window.addEventListener('offline',()=>window.atualizarDiagnosticoSIGEE?.());
  window.addEventListener('sigee:analytics-dados-alterados',()=>{
    if(!document.getElementById('aba-diagnostico')?.classList.contains('hidden'))window.atualizarDiagnosticoSIGEE?.();
  });
  console.info('[SIGEE] Centro de Diagnóstico 2.4.4 carregado.');
})();
