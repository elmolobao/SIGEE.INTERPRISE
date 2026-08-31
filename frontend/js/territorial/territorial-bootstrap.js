/**
 * SIGEE Enterprise — Pacote GT-02
 * Fundação da Central de Gestão Territorial (somente Master).
 * Sem persistência própria nesta entrega: cria a rota, a tela, as áreas e lê apenas dados existentes.
 */
(function(window,document){
  'use strict';
  if(window.SIGEE_GESTAO_TERRITORIAL) return;

  const ICONES = Object.freeze({
    'visao-geral':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle></svg>',
    mapa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5 8.5 4 15 6.5 21 4v13.5L15 20l-6.5-2.5L3 20V6.5Z"></path><path d="M8.5 4v13.5M15 6.5V20"></path></svg>',
    agenda:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"></rect><path d="M7 3v4M17 3v4M3.5 9h17M7 13h3M14 13h3M7 16h3"></path></svg>',
    monitoramento:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5M7.5 11l2 2 4-5"></path></svg>',
    pesquisa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4Z"></path><path d="M8 8h8M8 12h5"></path></svg>',
    formacoes:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9 12 4l9 5-9 5-9-5Z"></path><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M21 9v6"></path></svg>',
    sei:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h7l2 2h9v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z"></path><path d="M3 9h18"></path></svg>',
    relatorios:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Z"></path><path d="M14 3v5h5M9 12h6M9 16h6"></path></svg>'
  });
  const ABAS = Object.freeze([
    ['visao-geral','Visão Geral'],
    ['mapa','Mapa'],
    ['agenda','Agenda'],
    ['monitoramento','Monitoramento'],
    ['pesquisa','Pesquisa de Satisfação'],
    ['formacoes','Formações'],
    ['sei','Controle SEI'],
    ['relatorios','Relatórios']
  ]);
  let abaAtual='visao-geral';

  function perfil(){
    return window.SIGEE_AUTORIZACAO?.perfil?.() || window.SIGEE_PERFIS?.normalizar?.(window.usuarioLogado?.perfil) || '';
  }
  function autorizado(){ return perfil()==='Master'; }
  function main(){ return document.querySelector('#sistema-dashboard main'); }

  function criarTela(){
    let sec=document.getElementById('aba-gestao-territorial');
    if(sec) return sec;
    const alvo=main(); if(!alvo) return null;
    sec=document.createElement('section');
    sec.id='aba-gestao-territorial';
    sec.className='hidden sigee-territorial';
    sec.setAttribute('aria-labelledby','gt-titulo');
    sec.innerHTML=`
      <header class="gt-head">
        <div>
          <span class="gt-kicker">GESTÃO MASTER</span>
          <h1 id="gt-titulo">Central de Gestão Territorial</h1>
          <p>Planejamento, monitoramento, formação, controle institucional e leitura territorial dos 27 NTEs.</p>
        </div>
        <span class="gt-master-badge">Acesso exclusivo Master</span>
      </header>
      <nav class="gt-tabs" aria-label="Áreas da Gestão Territorial" id="gt-tabs"></nav>
      <div id="gt-conteudo" class="gt-conteudo" aria-live="polite"></div>`;
    alvo.appendChild(sec);
    const nav=sec.querySelector('#gt-tabs');
    ABAS.forEach(([id,rotulo])=>{
      const b=document.createElement('button'); b.type='button'; b.dataset.gtAba=id;
      b.innerHTML=`<span class="gt-tab-icon">${ICONES[id]||''}</span><span>${rotulo}</span>`;
      b.addEventListener('click',()=>abrirAba(id)); nav.appendChild(b);
    });
    return sec;
  }

  function formatarNumero(n){ return new Intl.NumberFormat('pt-BR').format(Number(n)||0); }

  function topProducao(){
    const dados=window.SIGEE_TERRITORIAL_DATA?.producaoPorNte?.() || [];
    const lista=dados.filter(x=>x.processos>0).sort((a,b)=>b.processos-a.processos).slice(0,8);
    if(!lista.length) return '<p class="gt-empty">A produção territorial aparecerá quando os processos estiverem carregados no SIGEE.</p>';
    const max=Math.max(...lista.map(x=>x.processos),1);
    return `<div class="gt-ranking">${lista.map((x,i)=>`<div class="gt-ranking-row"><span class="gt-pos">${i+1}</span><div><strong>${x.codigo} — ${x.sede}</strong><small>${formatarNumero(x.processos)} processo(s) carregado(s)</small><div class="gt-bar"><i style="width:${Math.max(4,(x.processos/max)*100)}%"></i></div></div></div>`).join('')}</div>`;
  }

  function visaoGeral(){
    const r=window.SIGEE_TERRITORIAL_DATA?.resumo?.() || {ntes:27,municipios:0,processos:0,ntesComProducao:0};
    return `<div id="gt-visao-executiva">
      <div class="gt-kpis">
        <article><span>NTEs monitorados</span><strong>${r.ntes}</strong><small>cobertura estadual</small></article>
        <article><span>Municípios abrangidos</span><strong>${formatarNumero(r.municipios)}</strong><small>base territorial</small></article>
        <article><span>Processos carregados</span><strong>${formatarNumero(r.processos)}</strong><small>núcleo operacional</small></article>
        <article><span>NTEs com produção</span><strong>${r.ntesComProducao}</strong><small>nesta sessão</small></article>
      </div>
      <div class="gt-exec-loading">Consolidando Monitoramento, Formações, Pesquisa e Controle SEI...</div>
      <div class="gt-grid">
        <article class="gt-panel gt-panel-wide"><header><div><span>PRODUÇÃO TERRITORIAL</span><h2>Produção por NTE</h2></div><small>Dados operacionais</small></header>${topProducao()}</article>
        <article class="gt-panel"><header><div><span>MODELO DE GESTÃO</span><h2>Ciclo territorial</h2></div></header>
          <ol class="gt-cycle"><li><b>Pré-formação</b><span>Monitoramento e diagnóstico.</span></li><li><b>Formação territorial</b><span>Teoria, prática e avaliações.</span></li><li><b>Pós-formação</b><span>Conformidade e evolução.</span></li><li><b>Relatório institucional</b><span>Consolidação das medidas.</span></li></ol>
        </article>
      </div></div>`;
  }

  function classeNte(c){return String(c||'SEM_AMOSTRA').toLowerCase().replaceAll('_','-');}
  async function carregarVisaoExecutiva(){
    const box=document.getElementById('gt-visao-executiva'); if(!box)return;
    const svc=window.SIGEE_TERRITORIAL_VISAO_GERAL_SERVICE; if(!svc?.carregar)return;
    const load=box.querySelector('.gt-exec-loading');
    try{
      const d=await svc.carregar(); if(!document.body.contains(box))return;
      const top=d.indices.filter(x=>x.indiceConsolidado!=null&&x.confiabilidadeTecnica==='ADEQUADA').sort((a,b)=>b.indiceConsolidado-a.indiceConsolidado).slice(0,6);
      const radar=d.indices.filter(x=>['CRITICO','ALERTA','ATENCAO'].includes(x.classeDesempenho)).sort((a,b)=>(a.indiceConsolidado??999)-(b.indiceConsolidado??999)).slice(0,6);
      load.outerHTML=`<section class="gt-exec-section">${d.falhas?.length?`<div class="gt-agenda-alert"><strong>Consolidação parcial</strong><span>${d.falhas.map(f=>`${f.fonte}: ${f.mensagem}`).join(' • ')}</span></div>`:''}<header class="gt-exec-title"><div><span>PAINEL EXECUTIVO</span><h2>Situação da Gestão Territorial</h2></div><small>Consolidação dos módulos em tempo real</small></header>
        <div class="gt-exec-kpis">
          <article><span>Ocorrências ativas</span><strong>${d.ocorrAtivas}</strong><small>${d.ocorrConcluidas} concluída(s)</small></article>
          <article><span>NTEs com formação realizada</span><strong>${d.ntesFormados}/27</strong><small>${d.formacoesRealizadas} formação(ões)</small></article>
          <article class="${d.seiVencidos?'gt-kpi-alert':''}"><span>SEI ativos</span><strong>${d.seiAtivos}</strong><small>${d.seiVencidos} vencido(s) • ${d.seiConcluidos} concluído(s)</small></article>
          <article class="${d.pesquisa.triagem?'gt-kpi-alert':''}"><span>Pesquisa de satisfação</span><strong>${d.pesquisa.media==null?'—':`${d.pesquisa.media5!=null?d.pesquisa.media5+'/5 • ':''}${d.pesquisa.media}%`}</strong><small>${d.pesquisa.triagem||0} aguardando triagem • ${d.pesquisa.naoLidas||0} não lida(s)</small></article>
        </div>
        <div class="gt-exec-kpis gt-exec-kpis-secondary">
          <article><span>Constatações positivas</span><strong>${d.positivas}</strong><small>monitoramento territorial</small></article>
          <article><span>Constatações negativas</span><strong>${d.negativas}</strong><small>monitoramento territorial</small></article>
          <article class="${d.criticos?'gt-kpi-danger':''}"><span>NTEs em alerta/crítico</span><strong>${d.criticos}</strong><small>${d.atencao} em atenção</small></article>
          <article><span>SEI concluídos</span><strong>${d.seiConcluidos}</strong><small>controle institucional</small></article>
        </div>
        <div class="gt-exec-grid">
          <article class="gt-panel"><header><div><span>DESEMPENHO</span><h2>Melhores índices consolidados</h2></div></header>${top.length?`<div class="gt-exec-nte-list">${top.map(x=>`<div><span><b>${x.codigo}</b> ${x.sede}</span><strong>${x.indiceConsolidado}</strong></div>`).join('')}</div>`:'<p class="gt-empty">Ainda não há amostra suficiente para índice consolidado.</p>'}</article>
          <article class="gt-panel"><header><div><span>ATENÇÃO GERENCIAL</span><h2>Territórios que exigem acompanhamento</h2></div></header>${radar.length?`<div class="gt-exec-nte-list">${radar.map(x=>`<div><span><b>${x.codigo}</b> ${x.sede}</span><em class="gt-classe ${classeNte(x.classeDesempenho)}">${String(x.classeDesempenho).replace('_',' ')}</em></div>`).join('')}</div>`:'<p class="gt-empty">Nenhum território classificado em atenção, alerta ou crítico.</p>'}</article>
        </div>
      </section>`;
    }catch(e){console.error('[GT-09]',e);load.innerHTML=`Não foi possível consolidar o painel executivo: ${String(e?.message||e)}`;}
  }

  function estruturaArea(titulo,descricao,itens){
    return `<article class="gt-panel gt-panel-full"><header><div><span>FUNDAÇÃO GT-01</span><h2>${titulo}</h2><p>${descricao}</p></div><span class="gt-status">Estrutura preparada</span></header><div class="gt-feature-grid">${itens.map(x=>`<div><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}</div><div class="gt-note">A persistência e os formulários operacionais serão ativados nos próximos pacotes, sobre esta mesma estrutura.</div></article>`;
  }

  function mapa(){ return '<div id="gt-mapa-corpo"><div class="gt-empty">Carregando Mapa Territorial...</div></div>'; }

  function conteudo(id){
    if(id==='visao-geral') return visaoGeral();
    if(id==='mapa') return mapa();
    if(id==='agenda') return '<div id="gt-agenda-corpo"><div class="gt-empty">Carregando Agenda Institucional...</div></div>';
    if(id==='monitoramento') return '<div id="gt-monitoramento-corpo"><div class="gt-empty">Carregando Monitoramento Territorial...</div></div>';
    if(id==='pesquisa') return '<div id="gt-pesquisa-corpo"><div class="gt-empty">Carregando Pesquisa de Satisfação...</div></div>';
    if(id==='formacoes') return '<div id="gt-formacoes-corpo"><div class="gt-empty">Carregando cobertura das formações...</div></div>';
    if(id==='sei') return '<div id="gt-sei-corpo"><div class="gt-empty">Carregando Controle SEI...</div></div>';
    return '<div id="gt-relatorios-corpo"><div class="gt-empty">Carregando Relatórios Territoriais...</div></div>';
  }

  function abrirAba(id){
    abaAtual=ABAS.some(x=>x[0]===id)?id:'visao-geral';
    const sec=criarTela(); if(!sec) return false;
    sec.querySelectorAll('[data-gt-aba]').forEach(b=>{const ativo=b.dataset.gtAba===abaAtual;b.classList.toggle('ativo',ativo);b.setAttribute('aria-current',ativo?'page':'false');});
    const box=sec.querySelector('#gt-conteudo'); if(box){ box.innerHTML=conteudo(abaAtual); if(abaAtual==='visao-geral') setTimeout(()=>carregarVisaoExecutiva(),0); if(abaAtual==='mapa') setTimeout(()=>window.SIGEE_TERRITORIAL_MAPA?.carregar?.(box),0); if(abaAtual==='agenda') setTimeout(()=>window.SIGEE_TERRITORIAL_AGENDA?.carregar?.(box),0); if(abaAtual==='monitoramento') setTimeout(()=>window.SIGEE_TERRITORIAL_MONITORAMENTO?.carregar?.(box),0); if(abaAtual==='pesquisa') setTimeout(()=>window.SIGEE_TERRITORIAL_PESQUISA?.painel?.(box),0); if(abaAtual==='formacoes') setTimeout(()=>window.SIGEE_TERRITORIAL_FORMACOES?.carregar?.(box),0); if(abaAtual==='sei') setTimeout(()=>window.SIGEE_TERRITORIAL_SEI?.carregar?.(box),0); if(abaAtual==='relatorios') setTimeout(()=>window.SIGEE_TERRITORIAL_RELATORIOS?.carregar?.(box),0); }
    return true;
  }

  function abrir(){
    if(!autorizado()) { alert('A Central de Gestão Territorial é exclusiva do perfil Master.'); return false; }
    const sec=criarTela(); if(!sec) return false;
    document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]').forEach(x=>{x.classList.add('hidden');x.hidden=true;});
    sec.classList.remove('hidden'); sec.hidden=false; sec.style.removeProperty('display');
    abrirAba(abaAtual);
    document.dispatchEvent(new CustomEvent('sigee:gestao-territorial-aberta',{detail:{aba:abaAtual}}));
    return true;
  }

  function atualizar(){ if(document.getElementById('aba-gestao-territorial') && autorizado()) abrirAba(abaAtual); }
  document.addEventListener('DOMContentLoaded',criarTela,{once:true});
  document.addEventListener('sigee:processos-atualizados',atualizar);
  window.addEventListener('sigee:session-ready',()=>{if(autorizado())criarTela();});

  window.SIGEE_GESTAO_TERRITORIAL=Object.freeze({abrir,abrirAba,atualizar,autorizado,versao:'GT-09.0'});
})(window,document);
