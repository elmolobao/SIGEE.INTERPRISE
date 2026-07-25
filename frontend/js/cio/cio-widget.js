(function(global, document){
  'use strict';
  if (global.SIGEE_CIO_WIDGET?.version === 'RC6.2.0.1') return;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function usuario(){
    try { return global.SIGEE_SESSION?.getUser?.() || global.usuarioLogado || null; }
    catch (_) { return global.usuarioLogado || null; }
  }
  function perfil(){
    const v=String(usuario()?.perfil||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    if(v.includes('MASTER')) return 'MASTER';
    if(v.includes('GESTOR')) return 'GESTOR';
    if(v.includes('ADMINISTRADOR')||v==='ADMIN') return 'ADMINISTRADOR';
    return v;
  }
  function permitido(){ return ['MASTER','GESTOR','ADMINISTRADOR'].includes(perfil()); }

  function instalar(){
    if(!permitido()) return false;
    const painel=document.getElementById('aba-painel');
    if(!painel) return false;
    if(document.getElementById('sigee-cio-resumo-widget')) return true;
    const sec=document.createElement('section');
    sec.id='sigee-cio-resumo-widget';
    sec.className='sigee-cio-widget';
    sec.innerHTML=`
      <header class="sigee-cio-widget-head">
        <div><span>CENTRO DE INTELIGÊNCIA OPERACIONAL</span><h2>Resumo Executivo</h2><p>Leitura objetiva dos riscos, gargalos e prioridades da operação.</p></div>
        <button type="button" data-cio-widget-refresh>Atualizar análise</button>
      </header>
      <div class="sigee-cio-widget-body" data-cio-widget-body>
        <p class="sigee-cio-widget-placeholder">O diagnóstico será carregado somente quando solicitado.</p>
      </div>`;
    const welcome=painel.querySelector('.sigee-welcome-strip');
    if(welcome?.nextSibling) painel.insertBefore(sec,welcome.nextSibling); else painel.prepend(sec);
    sec.querySelector('[data-cio-widget-refresh]')?.addEventListener('click',()=>carregar(true));
    return true;
  }

  function card(titulo,valor,detalhe=''){
    return `<article><span>${esc(titulo)}</span><strong>${esc(valor)}</strong>${detalhe?`<small>${esc(detalhe)}</small>`:''}</article>`;
  }

  function render(resultado){
    const m=resultado.metricas||{};
    const alertas=(resultado.alertas||[]).slice(0,3);
    const recs=(resultado.recomendacoes||[]).slice(0,3);
    return `
      <div class="sigee-cio-widget-brief"><strong>${esc(resultado.resumo?.saudacao||'Resumo operacional')}</strong><p>${esc(resultado.resumo?.texto||'Análise concluída.')}</p></div>
      <div class="sigee-cio-widget-grid">
        ${card('Processos ativos',m.totalAtivos??0)}
        ${card('Em risco',m.emRisco??0,`${m.criticos??0} críticos`)}
        ${card('Vencem em 3 dias',m.vencem3??0)}
        ${card('Maior gargalo',m.gargalo?.etapa||'Não identificado',m.gargalo?`${m.gargalo.total} processos`:'')}
      </div>
      <div class="sigee-cio-widget-columns">
        <div><h3>Alertas</h3>${alertas.length?alertas.map(a=>`<p><b>${esc(a.titulo)}</b> — ${esc(a.mensagem)}</p>`).join(''):'<p>Nenhum alerta relevante.</p>'}</div>
        <div><h3>Recomendações</h3>${recs.length?`<ol>${recs.map(r=>`<li>${esc(r)}</li>`).join('')}</ol>`:'<p>Nenhuma recomendação prioritária.</p>'}</div>
      </div>`;
  }

  async function carregar(force=false){
    instalar();
    const body=document.querySelector('[data-cio-widget-body]');
    const btn=document.querySelector('[data-cio-widget-refresh]');
    if(!body||!permitido()) return false;
    try{
      if(btn) btn.disabled=true;
      body.innerHTML='<p class="sigee-cio-widget-placeholder">Analisando dados operacionais...</p>';
      await global.__SIGEE_CIO_BOOTSTRAP__?.load?.();
      if(typeof global.SIGEE_CIO?.engine?.analisar!=='function') throw new Error('Motor analítico indisponível.');
      const resultado=await global.SIGEE_CIO.engine.analisar({force});
      body.innerHTML=render(resultado);
      return true;
    }catch(e){
      console.error('[SIGEE CIO Widget]',e);
      body.innerHTML=`<p class="sigee-cio-widget-error">Não foi possível gerar o resumo: ${esc(e.message)}</p>`;
      return false;
    }finally{ if(btn) btn.disabled=false; }
  }

  function abrir(){
    const painel=document.getElementById('aba-painel');
    if(painel){ painel.classList.remove('hidden'); painel.hidden=false; painel.style.removeProperty('display'); }
    instalar();
    document.getElementById('sigee-cio-resumo-widget')?.scrollIntoView({behavior:'smooth',block:'start'});
    return carregar(false);
  }

  global.SIGEE_CIO_WIDGET=Object.freeze({version:'RC6.2.0.1',instalar,carregar,abrir});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,300),{once:true});
  else setTimeout(instalar,300);
})(window,document);
