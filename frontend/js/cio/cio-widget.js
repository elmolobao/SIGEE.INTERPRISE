(function(global, document){
  'use strict';
  if(global.SIGEE_CIO_WIDGET?.version==='RC6.3.1')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let ultimoResultado=null;
  function usuario(){try{return global.SIGEE_SESSION?.getUser?.()||global.usuarioLogado||null;}catch(_){return global.usuarioLogado||null;}}
  function perfil(){const v=String(usuario()?.perfil||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();if(v.includes('MASTER'))return'MASTER';if(v.includes('GESTOR'))return'GESTOR';if(v.includes('ADMINISTRADOR')||v==='ADMIN')return'ADMINISTRADOR';return v;}
  function permitido(){return['MASTER','GESTOR','ADMINISTRADOR'].includes(perfil());}
  function nteValor(x){const bruto=String(x?.nte||x?.nte_nome||x?.territorio||x?.territorio_nome||'').trim();if(!bruto)return 'NTE não informado';const m=bruto.match(/(?:NTE\s*[-:]?\s*)?(\d{1,2})/i);return m?`NTE-${String(Number(m[1])).padStart(2,'0')}`:bruto.toUpperCase();}

  function responsavelExibicao(x){
    const p=x?.processo||x||{};
    const candidatos=[x?.responsavel,p?.tecnico_atribuido_nome,p?.tecnico_atribuido,p?.tecnico_responsavel_nome,p?.tecnico_responsavel,p?.responsavel_etapa_nome,p?.responsavel_etapa,p?.responsavel_nome,p?.responsavel,p?.analista_nome,p?.analista,p?.digitador_nome,p?.digitador,p?.conferente_nome,p?.conferente,p?.usuario_lancamento_nome,p?.usuario_lancamento,p?.usuario_criacao_nome,p?.usuario_criacao,p?.criado_por_nome,p?.criado_por];
    for(const candidato of candidatos){const valor=String(candidato??'').trim();if(valor&&!/^(NAO ATRIBUIDO|NÃO ATRIBUÍDO|SEM RESPONSAVEL|SEM RESPONSÁVEL)$/i.test(valor))return valor;}
    return 'Aguardando atribuição';
  }
  async function abrirProntuario(registro){
    const fn=global.abrirProntuarioSIGEE||global.abrirHistoricoProcessoSIGEE||global.abrirHistoricoSIGEE;
    if(typeof fn!=='function'){alert('O Prontuário Eletrônico ainda não está disponível nesta sessão.');return false;}
    const origem=registro?.processo||registro||{};
    const id=origem?.id??registro?.id;
    if(id==null||String(id).trim()===''){alert('O processo não possui identificador interno válido.');return false;}
    try{
      let completo=origem;
      const locais=Array.isArray(global.processosDB)?global.processosDB:[];
      const existente=locais.find(p=>String(p?.id)===String(id));
      if(existente){completo={...origem,...existente};}
      else{
        const sb=global.obterSupabaseSIGEE?.()||global.criarClienteSupabaseSIGEE?.()||global.SIGEE_SUPABASE?.criarCliente?.()||null;
        if(sb){
          let q=sb.from('processos').select('*').eq('id',id);q=global.SIGEE_ESCOPO?.aplicarQueryProcessos?global.SIGEE_ESCOPO.aplicarQueryProcessos(q,usuario()):q;const consulta=await q.maybeSingle();
          if(consulta?.error)throw consulta.error;
          if(consulta?.data)completo={...origem,...consulta.data};
        }
        global.SIGEE_ESCOPO?.exigirRegistro?.(completo,usuario());
        if(!Array.isArray(global.processosDB))global.processosDB=[];
        global.processosDB.push(completo);
      }
      await Promise.resolve(fn(id));
      return true;
    }catch(e){
      console.error('[SIGEE CIO] Falha ao preparar/abrir prontuário.',e);
      alert('Não foi possível abrir o Prontuário deste processo.');
      return false;
    }
  }

  function instalar(){
    if(!permitido())return false;const painel=document.getElementById('aba-painel');if(!painel)return false;if(document.getElementById('sigee-cio-resumo-widget'))return true;
    const sec=document.createElement('section');sec.id='sigee-cio-resumo-widget';sec.className='sigee-cio-widget';sec.innerHTML=`<header class="sigee-cio-widget-head"><div><span>CENTRO DE INTELIGÊNCIA OPERACIONAL</span><h2>Resumo Executivo</h2><p>Riscos, capacidade, tendências e prioridades da operação.</p></div><button type="button" data-cio-widget-refresh>Atualizar análise</button></header><div class="sigee-cio-widget-body" data-cio-widget-body><p class="sigee-cio-widget-placeholder">O diagnóstico será carregado somente quando solicitado.</p></div>`;
    const welcome=painel.querySelector('.sigee-welcome-strip');if(welcome?.nextSibling)painel.insertBefore(sec,welcome.nextSibling);else painel.prepend(sec);
    sec.querySelector('[data-cio-widget-refresh]')?.addEventListener('click',()=>carregar(true));
    sec.addEventListener('click',async e=>{const rapido=e.target.closest('[data-cio-prontuario-rapido]');if(rapido&&ultimoResultado){const registro=(ultimoResultado.metricas?.riscos||[]).find(x=>String(x.id)===String(rapido.dataset.cioProntuarioRapido));if(registro)await abrirProntuario(registro);return;}const alvo=e.target.closest('[data-cio-lista]');if(alvo&&ultimoResultado)abrirLista(alvo.dataset.cioLista,ultimoResultado);});
    return true;
  }
  function card(titulo,valor,detalhe='',filtro=''){return `<button type="button" class="sigee-cio-kpi" data-cio-lista="${esc(filtro)}"><span>${esc(titulo)}</span><strong>${esc(valor)}</strong>${detalhe?`<small>${esc(detalhe)}</small>`:''}</button>`;}
  function riscoCards(m){return `<div class="sigee-cio-riscos"><button data-cio-lista="CRITICO" class="critico"><b>${m.niveisRisco?.CRITICO||0}</b><span>Crítico</span></button><button data-cio-lista="ALTO" class="alto"><b>${m.niveisRisco?.ALTO||0}</b><span>Alto</span></button><button data-cio-lista="MEDIO" class="medio"><b>${m.niveisRisco?.MEDIO||0}</b><span>Médio</span></button><button data-cio-lista="NORMAL" class="normal"><b>${m.niveisRisco?.NORMAL||0}</b><span>Normal</span></button></div>`;}
  function render(resultado){
    const m=resultado.metricas||{},alertas=(resultado.alertas||[]).slice(0,4),recs=(resultado.recomendacoes||[]).slice(0,4);
    const backlog=(m.backlogOrdenado||[]).slice(0,6).map(x=>`<button data-cio-lista="ETAPA:${esc(x.etapa)}"><span>${esc(x.etapa)}</span><b>${x.total}</b><small>${x.percentual}%</small></button>`).join('');
    const capacidade=(m.capacidade||[]).slice(0,6).map(x=>`<button data-cio-lista="RESP:${esc(x.nome)}"><span>${esc(x.nome)}</span><b>${x.total}</b><small>${x.percentualMedia}% da média</small></button>`).join('');
    const t7=m.tendencias?.d7||{},t30=m.tendencias?.d30||{};
    const fila=(m.filaPrioritaria||[]).slice(0,8).map((x,i)=>{const resp=responsavelExibicao(x);const respLinha=resp==='Aguardando atribuição'?'Aguardando atribuição':`Resp.: ${resp}`;return `<button data-cio-prontuario-rapido="${esc(x.id)}" class="nivel-${esc((x.nivel||'normal').toLowerCase())}"><span>${i+1}</span><div><b>${esc(x.codigo||x.id||'Processo')}</b><em>${esc(x.aluno||x.aluno_nome||'Aluno não informado')}</em><small>${esc(x.escola||x.escola_nome||'Escola não informada')}</small><small>${esc(nteValor(x))} · ${esc(x.etapa)} · ${esc(respLinha)}</small></div><strong class="risco-${esc((x.nivel||'normal').toLowerCase())}">${esc(x.nivel)}</strong></button>`;}).join('');
    const territorial=(m.territorial||[]).slice(0,10).map(x=>{const faixa=x.indiceRisco>=76?'critico':x.indiceRisco>=51?'alto':x.indiceRisco>=26?'medio':'normal';return `<button data-cio-lista="NTE:${esc(x.nte)}" class="territorio-${faixa}"><span class="sigee-cio-nte-badge">${esc(x.nte)}</span><b>${x.criticos} críticos</b><small>${x.total} ativos · ${x.semResponsavel} aguardando atribuição</small><i title="Índice territorial de risco: ${x.indiceRisco} de 100">${x.indiceRisco}</i></button>`;}).join('');
    return `<div class="sigee-cio-widget-brief"><strong>${esc(resultado.resumo?.saudacao||'Resumo operacional')}</strong><p>${esc(resultado.resumo?.texto||'Análise concluída.')}</p></div>
      <div class="sigee-cio-widget-grid">${card('Processos ativos',m.totalAtivos??0,'Abrir lista','ATIVOS')}${card('Em risco',m.emRisco??0,`${m.criticos??0} críticos`,'RISCO')}${card('Vencem em 3 dias',m.vencem3??0,'Abrir lista','VENCE_3')}${card('Maior gargalo',m.gargalo?.etapa||'Não identificado',m.gargalo?`${m.gargalo.total} processos`:'','GARGALO')}</div>
      <section class="sigee-cio-section"><h3>Classificação de risco</h3>${riscoCards(m)}</section>
      <div class="sigee-cio-analytics"><section><h3>Backlog por etapa</h3><div class="sigee-cio-listas">${backlog||'<p>Sem dados.</p>'}</div></section><section><h3>Capacidade da equipe</h3><div class="sigee-cio-cap-resumo"><b>${m.tecnicosTotal||0}</b> técnicos · <b>${m.sobrecarregados?.length||0}</b> acima · <b>${m.equilibrados||0}</b> equilibrados</div><div class="sigee-cio-listas">${capacidade||'<p>Sem responsáveis atribuídos.</p>'}</div></section></div>
      <section class="sigee-cio-section sigee-cio-fila-section"><div class="sigee-cio-section-title"><h3>Fila de trabalho inteligente</h3><button type="button" data-cio-lista="FILA">Ver fila completa</button></div><div class="sigee-cio-fila">${fila||'<p>Não há processos prioritários.</p>'}</div></section>
      <section class="sigee-cio-section sigee-cio-territorial-section"><div class="sigee-cio-section-title"><div><h3>Monitoramento territorial</h3><p class="sigee-cio-legenda-titulo">Ordenado pelo maior volume de processos críticos.</p></div><button type="button" class="sigee-cio-sem-resp-badge" data-cio-lista="SEM_RESP"><b>${m.semResponsavel?.length||0}</b><span>aguardando atribuição</span></button></div><div class="sigee-cio-indice-label">Índice territorial de risco</div><div class="sigee-cio-risco-legenda"><span class="normal">0–25 Normal</span><span class="medio">26–50 Atenção</span><span class="alto">51–75 Alto</span><span class="critico">76–100 Crítico</span></div><div class="sigee-cio-territorial">${territorial||'<p>Sem dados territoriais.</p>'}</div></section>
      <section class="sigee-cio-section"><h3>Tendência operacional</h3><div class="sigee-cio-tendencias"><article><span>Últimos 7 dias</span><b>${t7.saldo>0?'+':''}${t7.saldo||0}</b><small>${t7.entradas||0} entradas · ${t7.saidas||0} saídas</small></article><article><span>Últimos 30 dias</span><b>${t30.saldo>0?'+':''}${t30.saldo||0}</b><small>${t30.entradas||0} entradas · ${t30.saidas||0} saídas</small></article><article><span>SLA no prazo</span><b>${m.dentroSla==null?'—':m.dentroSla+'%'}</b><small>${m.avaliados||0} processos avaliados</small></article></div></section>
      <div class="sigee-cio-widget-columns"><div><h3>Alertas</h3>${alertas.length?alertas.map(a=>`<button class="sigee-cio-alerta ${esc(a.tipo.toLowerCase())}" data-cio-lista="${esc(a.filtro||'')}" ><b>${esc(a.titulo)}</b><span>${esc(a.mensagem)}</span></button>`).join(''):'<p>Nenhum alerta relevante.</p>'}</div><div><h3>Recomendações</h3>${recs.length?recs.map(r=>`<article class="sigee-cio-rec"><span>${esc(r.prioridade)}</span><b>${esc(r.titulo)}</b><p>${esc(r.justificativa)}</p><small>${esc(r.acao)}</small></article>`).join(''):'<p>Nenhuma recomendação prioritária.</p>'}</div></div>`;
  }
  function filtrar(tipo,r){const m=r.metricas||{};if(tipo==='ATIVOS')return m.ativos||[];if(tipo==='RISCO')return(m.riscos||[]).filter(x=>['CRITICO','ALTO'].includes(x.nivel));if(tipo==='CRITICO'||tipo==='ALTO'||tipo==='MEDIO'||tipo==='NORMAL')return(m.riscos||[]).filter(x=>x.nivel===tipo);if(tipo==='VENCE_3')return(m.riscos||[]).filter(x=>x.diasRestantes!=null&&x.diasRestantes>=0&&x.diasRestantes<=3);if(tipo==='GARGALO')return(m.riscos||[]).filter(x=>x.etapa===m.gargalo?.etapa);if(tipo.startsWith('ETAPA:'))return(m.riscos||[]).filter(x=>x.etapa===tipo.slice(6));if(tipo.startsWith('RESP:'))return(m.riscos||[]).filter(x=>x.responsavel===tipo.slice(5));if(tipo.startsWith('NTE:'))return(m.riscos||[]).filter(x=>nteValor(x)===tipo.slice(4));if(tipo==='FILA')return m.filaPrioritaria||[];if(tipo==='SEM_RESP')return m.semResponsavel||[];if(tipo==='SOBRECARGA'){const nomes=new Set((m.sobrecarregados||[]).map(x=>x.nome));return(m.riscos||[]).filter(x=>nomes.has(x.responsavel));}return[];}
  function abrirLista(tipo,r){
    const lista=filtrar(tipo,r);
    const master=perfil()==='MASTER';
    const ntes=[...new Set(lista.map(nteValor))].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
    document.getElementById('sigee-cio-lista-modal')?.remove();
    const modal=document.createElement('div');
    modal.id='sigee-cio-lista-modal';modal.className='sigee-cio-modal';
    const titulo=tipo.replace(/^ETAPA:|^RESP:/,'');
    const filtros=master&&ntes.length>1?`<div class="sigee-cio-modal-filtros"><label for="sigee-cio-filtro-nte">Filtrar por NTE</label><select id="sigee-cio-filtro-nte"><option value="TODOS">Todos os NTEs</option>${ntes.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></div>`:'';
    modal.innerHTML=`<section><header><div><span>DETALHAMENTO OPERACIONAL</span><h2>${esc(titulo)}</h2><p><strong data-cio-contagem>${lista.length}</strong> registro(s) no escopo analisado.</p></div><button type="button" data-fechar>×</button></header>${filtros}<div class="sigee-cio-modal-body"><table><thead><tr><th>Processo</th><th>Aluno / Escola</th><th>NTE</th><th>Etapa</th><th>Responsável</th><th>Risco</th></tr></thead><tbody data-cio-tbody></tbody></table><p class="sigee-cio-sem-registros" data-cio-vazio hidden>Nenhum registro localizado para o filtro selecionado.</p></div></section>`;
    document.body.appendChild(modal);
    const tbody=modal.querySelector('[data-cio-tbody]'),vazio=modal.querySelector('[data-cio-vazio]'),contagem=modal.querySelector('[data-cio-contagem]');
    const renderLinhas=(nte='TODOS')=>{
      const filtrada=nte==='TODOS'?lista:lista.filter(x=>nteValor(x)===nte);
      if(contagem)contagem.textContent=String(filtrada.length);
      if(vazio)vazio.hidden=filtrada.length>0;
      if(tbody){tbody.innerHTML=filtrada.slice(0,500).map(x=>`<tr><td><button type="button" class="sigee-cio-processo-link" data-cio-prontuario="${esc(x.id)}" title="Abrir Prontuário Eletrônico">${esc(x.codigo||x.id||'—')}</button></td><td>${esc(x.aluno||x.aluno_nome||'—')}<small>${esc(x.escola||x.escola_nome||'')}</small></td><td><span class="sigee-cio-nte-badge">${esc(nteValor(x))}</span></td><td>${esc(x.etapa||x.etapa_atual||'—')}</td><td>${esc(responsavelExibicao(x))}</td><td><b class="risco-${esc((x.nivel||'normal').toLowerCase())}">${esc(x.nivel||'NORMAL')}</b></td></tr>`).join('');}
    };
    renderLinhas();
    modal.querySelector('#sigee-cio-filtro-nte')?.addEventListener('change',e=>renderLinhas(e.target.value));
    modal.addEventListener('click',async e=>{const botao=e.target.closest('[data-cio-prontuario]');if(botao){e.preventDefault();const registro=lista.find(x=>String(x?.id)===String(botao.dataset.cioProntuario));await abrirProntuario(registro||{id:botao.dataset.cioProntuario});}});
    modal.querySelector('[data-fechar]').onclick=()=>modal.remove();modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  }
  async function carregar(force=false){instalar();const body=document.querySelector('[data-cio-widget-body]'),btn=document.querySelector('[data-cio-widget-refresh]');if(!body||!permitido())return false;try{if(btn)btn.disabled=true;body.innerHTML='<p class="sigee-cio-widget-placeholder">Analisando dados operacionais...</p>';await global.__SIGEE_CIO_BOOTSTRAP__?.load?.();if(typeof global.SIGEE_CIO?.engine?.analisar!=='function')throw new Error('Motor analítico indisponível.');ultimoResultado=await global.SIGEE_CIO.engine.analisar({force});body.innerHTML=render(ultimoResultado);return true;}catch(e){console.error('[SIGEE CIO Widget]',e);body.innerHTML=`<p class="sigee-cio-widget-error">Não foi possível gerar o resumo: ${esc(e.message)}</p>`;return false;}finally{if(btn)btn.disabled=false;}}
  function abrir(){const painel=document.getElementById('aba-painel');if(painel){painel.classList.remove('hidden');painel.hidden=false;painel.style.removeProperty('display');}instalar();document.getElementById('sigee-cio-resumo-widget')?.scrollIntoView({behavior:'smooth',block:'start'});return carregar(false);}
  global.SIGEE_CIO_WIDGET=Object.freeze({version:'RC6.3.1',instalar,carregar,abrir,abrirProntuario,responsavelExibicao});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,300),{once:true});else setTimeout(instalar,300);
})(window,document);
