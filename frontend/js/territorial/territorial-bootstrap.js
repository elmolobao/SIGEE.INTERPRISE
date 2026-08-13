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
    formacoes:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9 12 4l9 5-9 5-9-5Z"></path><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M21 9v6"></path></svg>',
    sei:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h7l2 2h9v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z"></path><path d="M3 9h18"></path></svg>',
    relatorios:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Z"></path><path d="M14 3v5h5M9 12h6M9 16h6"></path></svg>'
  });
  const ABAS = Object.freeze([
    ['visao-geral','Visão Geral'],
    ['mapa','Mapa'],
    ['agenda','Agenda'],
    ['monitoramento','Monitoramento'],
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
    return `
      <div class="gt-kpis">
        <article><span>NTEs monitorados</span><strong>${r.ntes}</strong><small>cobertura estadual</small></article>
        <article><span>Municípios abrangidos</span><strong>${formatarNumero(r.municipios)}</strong><small>base territorial de referência</small></article>
        <article><span>Processos carregados</span><strong>${formatarNumero(r.processos)}</strong><small>leitura do núcleo operacional</small></article>
        <article><span>NTEs com produção carregada</span><strong>${r.ntesComProducao}</strong><small>nesta sessão</small></article>
      </div>
      <div class="gt-grid">
        <article class="gt-panel gt-panel-wide"><header><div><span>PRODUÇÃO TERRITORIAL</span><h2>Leitura inicial por NTE</h2></div><small>Dados existentes • sem duplicação</small></header>${topProducao()}</article>
        <article class="gt-panel"><header><div><span>MODELO DE GESTÃO</span><h2>Ciclo territorial</h2></div></header>
          <ol class="gt-cycle"><li><b>Pré-formação</b><span>Monitoramento, orientação, diagnóstico e alinhamento técnico.</span></li><li><b>Formação territorial</b><span>7 dias no território, com teoria, prática e avaliações.</span></li><li><b>Pós-formação</b><span>Monitoramento qualificado, conformidade e evolução.</span></li><li><b>Relatório institucional</b><span>Consolidação das medidas e fundamentação quando cabível.</span></li></ol>
        </article>
      </div>`;
  }

  function estruturaArea(titulo,descricao,itens){
    return `<article class="gt-panel gt-panel-full"><header><div><span>FUNDAÇÃO GT-01</span><h2>${titulo}</h2><p>${descricao}</p></div><span class="gt-status">Estrutura preparada</span></header><div class="gt-feature-grid">${itens.map(x=>`<div><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}</div><div class="gt-note">A persistência e os formulários operacionais serão ativados nos próximos pacotes, sobre esta mesma estrutura.</div></article>`;
  }

  function mapa(){
    const dados=window.SIGEE_TERRITORIAL_DATA?.NTES || [];
    return `<article class="gt-panel gt-panel-full"><header><div><span>27 NÚCLEOS TERRITORIAIS</span><h2>Base para o Mapa da Bahia</h2><p>Camada territorial preparada para receber os estados de Formação, Prioridade, Produção e Situação Territorial.</p></div><span class="gt-status">Mapa vetorial: próximo pacote</span></header><div class="gt-nte-grid">${dados.map(n=>`<div><b>${n.codigo}</b><span>${n.sede}</span><small>${n.municipios} município(s)</small></div>`).join('')}</div></article>`;
  }

  function conteudo(id){
    if(id==='visao-geral') return visaoGeral();
    if(id==='mapa') return mapa();
    if(id==='agenda') return '<div id="gt-agenda-corpo"><div class="gt-empty">Carregando Agenda Institucional...</div></div>';
    if(id==='monitoramento') return '<div id="gt-monitoramento-corpo"><div class="gt-empty">Carregando Monitoramento Territorial...</div></div>';
    if(id==='formacoes') return '<div id="gt-formacoes-corpo"><div class="gt-empty">Carregando cobertura das formações...</div></div>';
    if(id==='sei') return estruturaArea('Controle SEI','Acompanhamento dos expedientes administrativos relacionados ao setor.',[['Conselho','Encaminhamentos e retornos do Conselho.'],['Comunicações Internas','Regulamentação e padronização dos processos internos.'],['Prazos','Controle de datas, retornos e pendências.'],['Referências','Vínculo com NTE, processo SIGEE e atos internos.']]);
    return '<div id="gt-relatorios-corpo"><div class="gt-empty">Carregando Relatórios Territoriais...</div></div>';
  }

  function abrirAba(id){
    abaAtual=ABAS.some(x=>x[0]===id)?id:'visao-geral';
    const sec=criarTela(); if(!sec) return false;
    sec.querySelectorAll('[data-gt-aba]').forEach(b=>{const ativo=b.dataset.gtAba===abaAtual;b.classList.toggle('ativo',ativo);b.setAttribute('aria-current',ativo?'page':'false');});
    const box=sec.querySelector('#gt-conteudo'); if(box){ box.innerHTML=conteudo(abaAtual); if(abaAtual==='agenda') setTimeout(()=>window.SIGEE_TERRITORIAL_AGENDA?.carregar?.(box),0); if(abaAtual==='monitoramento') setTimeout(()=>window.SIGEE_TERRITORIAL_MONITORAMENTO?.carregar?.(box),0); if(abaAtual==='formacoes') setTimeout(()=>window.SIGEE_TERRITORIAL_FORMACOES?.carregar?.(box),0); if(abaAtual==='relatorios') setTimeout(()=>window.SIGEE_TERRITORIAL_RELATORIOS?.carregar?.(box),0); }
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

  window.SIGEE_GESTAO_TERRITORIAL=Object.freeze({abrir,abrirAba,atualizar,autorizado,versao:'GT-05.0'});
})(window,document);
