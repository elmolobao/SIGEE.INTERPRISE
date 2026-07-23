/* SIGEE RC4.6.8 — Dashboard Executivo com percentuais e NTE da escola
 * Atualização manual real, com baixo consumo e sem depender da página local de processos.
 */
(function () {
  'use strict';

  const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const arr = (...names) => {
    for (const name of names) {
      try {
        const value = window[name];
        if (Array.isArray(value)) return value;
      } catch (_) {}
    }
    return [];
  };
  const val = (o, ...keys) => {
    for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && String(o[k]).trim() !== '') return o[k];
    return '';
  };
  const dateOf = p => {
    const raw = val(p, 'finalizado_em','data_retirada','updated_at','data_etapa_atual','created_at','criado_em','data_solicitacao');
    if (!raw) return null;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(String(raw))) {
      const [d,m,y] = String(raw).slice(0,10).split('/').map(Number);
      return new Date(y,m-1,d);
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const daysBetween = (a,b) => Math.max(0, Math.floor((b-a)/86400000));
  const etapa = p => String(val(p,'etapa_atual','etapa','fase_atual') || 'Desarquivamento');
  const nte = p => String(val(p,'nte','nte_nome','grupo','NTE') || 'Sem NTE');
  const tecnico = p => String(val(p,'tecnico_responsavel_nome','tecnico_responsavel','responsavel_nome','responsavel','analista_nome','analista','digitador_nome','digitador','conferente_nome','conferente') || 'Não atribuído');
  const escola = p => String(val(p,'escola_nome','escola','nome_escola','instituicao') || 'Sem escola');
  const municipio = p => String(val(p,'municipio','escola_municipio','municipio_escola') || 'Não informado');
  const documento = p => String(val(p,'documento_tipo','documento','documento_solicitado') || 'Não informado');
  const dias = p => {
    const explicit = Number(val(p,'dias_decorridos'));
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    const d = dateOf(p); return d ? daysBetween(d,new Date()) : 0;
  };
  const limite = p => {
    const e = norm(etapa(p));
    if (e.includes('DESARQ')) return 30;
    if (e.includes('ANAL')) return 7;
    if (e.includes('DIGIT')) return 15;
    if (e.includes('CONFER')) return 10;
    if (e.includes('ASSIN')) return 7;
    return null;
  };
  const concluido = p => ['RETIRADO','INDEFERIDO'].includes(norm(etapa(p)));
  const atrasado = p => { const l=limite(p); return !concluido(p) && l !== null && dias(p) > l; };
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const countBy = (list, getter) => {
    const m = new Map(); list.forEach(x => { const k=String(getter(x)||'Não informado'); m.set(k,(m.get(k)||0)+1); });
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  };
  const pct = (n,d) => d ? Math.round((n/d)*100) : 0;
  let ultimoResumoRPC = null;
  let atualizandoRPC = false;
  const cliente = () => {
    try {
      return window.obterSupabaseSIGEE?.() || window.SIGEE_SUPABASE?.criarCliente?.() || window.SIGEE_SUPABASE_CLIENT || null;
    } catch (_) { return null; }
  };
  const usuarioAtual = () => window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null;
  const ehGlobal = () => window.SIGEE_ESCOPO?.ehGlobal?.(usuarioAtual()) === true;
  const numeroNte = v => String(v ?? '').match(/\d{1,2}/)?.[0] || '';
  function nteRpc() {
    if (ehGlobal()) return null;
    const u = usuarioAtual() || {};
    return numeroNte(u.nte || u.nte_nome || u.grupo) || null;
  }
  function periodoRpc() {
    const valor = Number(document.getElementById('sigee-exec-periodo')?.value || 0);
    if (!valor) return { inicio: null, fim: null };
    const fim = new Date();
    fim.setHours(23,59,59,999);
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - valor);
    inicio.setHours(0,0,0,0);
    return { inicio: inicio.toISOString(), fim: fim.toISOString() };
  }

  function ensureUI() {
    const anchor = document.querySelector('#aba-painel .space-y-2.pt-2:last-of-type') || document.getElementById('aba-painel');
    if (!anchor || document.getElementById('sigee-dashboard-executivo')) return;
    const section = document.createElement('section');
    section.id = 'sigee-dashboard-executivo';
    section.className = 'sigee-exec';
    section.innerHTML = `
      <header class="sigee-exec-head">
        <div><span id="sigee-exec-contexto">VISÃO GERENCIAL</span><h2>Dashboard Executivo CLO / SEC</h2><p>Indicadores operacionais, produtividade territorial e pontos críticos do atendimento.</p></div>
        <div class="sigee-exec-actions">
          <select id="sigee-exec-periodo"><option value="todos">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Últimos 12 meses</option></select>
          <button type="button" id="sigee-exec-atualizar">↻ Atualizar</button>
        </div>
      </header>
      <div class="sigee-exec-kpis" id="sigee-exec-kpis"></div>
      <div class="sigee-exec-grid">
        <article class="sigee-exec-card sigee-exec-wide"><header><span>PRODUTIVIDADE TERRITORIAL</span><h3>Desempenho por NTE</h3></header><div id="sigee-exec-ntes"></div></article>
        <article class="sigee-exec-card"><header><span>GARGALOS</span><h3>Pendências por etapa</h3></header><div id="sigee-exec-etapas"></div></article>
        <article class="sigee-exec-card"><header><span>DEMANDA</span><h3>Escolas mais solicitadas</h3></header><div id="sigee-exec-escolas"></div></article>
        <article class="sigee-exec-card"><header><span>PERFIL DO PEDIDO</span><h3>Tipos de documento</h3></header><div id="sigee-exec-documentos"></div></article>
        <article class="sigee-exec-card"><header><span>PRODUTIVIDADE</span><h3>Técnicos com mais conclusões</h3></header><div id="sigee-exec-tecnicos"></div></article>
      </div>`;
    anchor.insertAdjacentElement('afterend', section);
    document.getElementById('sigee-exec-atualizar').addEventListener('click', () => atualizarExecutivo(true));
    document.getElementById('sigee-exec-periodo').addEventListener('change', () => atualizarExecutivo(true));
  }

  function filteredProcesses() {
    const origem = window.SIGEE_DADOS?.processos?.()||arr('processosDB','processos');
    const u=window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||window.currentUser||null;
    const all = window.SIGEE_DADOS?.escopar?.(origem,u)||window.SIGEE_ESCOPO?.filtrar?.(origem,u)||[];
    const days = Number(document.getElementById('sigee-exec-periodo')?.value || 0);
    if (!days) return all.slice();
    const min = new Date(); min.setDate(min.getDate()-days);
    return all.filter(p => { const d=dateOf(p); return d && d>=min; });
  }

  function normalizarRanking(lista) {
    return Array.isArray(lista) ? lista.map(item => Array.isArray(item)
      ? [item[0] || 'Não informado', Number(item[1] || 0), item[2] || '']
      : [item?.nome || item?.label || item?.etapa || item?.tecnico || item?.escola || item?.nte || 'Não informado', Number(item?.total || item?.quantidade || item?.valor || 0), item?.nte_escola || item?.territorio || (item?.escola ? item?.nte : '') || '']) : [];
  }

  function bars(items,total,limit=8,{mostrarNte=false,classeExtra=''}={}) {
    const lista=normalizarRanking(items);
    if (!lista.length) return '<p class="sigee-exec-empty">Sem dados disponíveis.</p>';
    const base=Number(total)||lista.reduce((a,x)=>a+Number(x[1]||0),0)||1;
    return `<div class="sigee-exec-bars ${classeExtra}">${lista.slice(0,limit).map(([name,value,nteEscola],i)=>{
      const percentual=Math.max(0,Math.min(100,(Number(value||0)/base)*100));
      const nteMeta=mostrarNte&&nteEscola?`<small class="sigee-exec-nte-escola">${esc(window.normalizarNteSIGEE?.(nteEscola)||nteEscola)}</small>`:'';
      return `<div class="sigee-exec-row sigee-exec-gargalo"><div><span class="sigee-exec-rank-label"><b>${i+1}. ${esc(name)}</b>${nteMeta}</span><span class="sigee-exec-gargalo-valores"><strong>${Number(value||0).toLocaleString('pt-BR')}</strong><small>${percentual.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</small></span></div><i role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentual.toFixed(1)}"><em style="width:${Math.max(2,percentual).toFixed(1)}%"></em></i></div>`;
    }).join('')}</div>`;
  }

  function renderRpc(r) {
    ensureUI();
    ultimoResumoRPC = r || {};
    const total = Number(r.total_processos ?? r.total ?? normalizarRanking(r.por_etapa).reduce((a,x)=>a+Number(x[1]||0),0));
    const ativos = Number(r.ativos || 0);
    const concl = Number(r.concluidos || 0);
    const venc = Number(r.vencidos || 0);
    const prazo = Math.max(0, ativos - venc);
    const media = Number(r.media_atendimento || 0);
    const sla = pct(prazo, ativos);
    const contexto=document.getElementById('sigee-exec-contexto');
    if(contexto) contexto.textContent=ehGlobal()?'VISÃO ESTADUAL CONSOLIDADA':`VISÃO TERRITORIAL — NTE ${String(nteRpc()||'').padStart(2,'0')}`;
    const titulo=document.querySelector('#sigee-dashboard-executivo h2');
    if(titulo) titulo.textContent=ehGlobal()?'Dashboard Executivo CLO / SEC':'Dashboard Gerencial do NTE';
    const kpis = [
      ['Solicitações',total.toLocaleString('pt-BR'),'Base consolidada'],
      ['Em andamento',ativos.toLocaleString('pt-BR'),'Processos ativos'],
      ['Em atraso',venc.toLocaleString('pt-BR'),'Exigem atenção'],
      ['No prazo',prazo.toLocaleString('pt-BR'),`${sla}% do ativo`],
      ['Concluídos',concl.toLocaleString('pt-BR'),'Retirados/indeferidos'],
      ['Tempo médio',`${media.toLocaleString('pt-BR',{maximumFractionDigits:1})} d`,'Até conclusão']
    ];
    const box=document.getElementById('sigee-exec-kpis');
    if(box) box.innerHTML=kpis.map((k,i)=>`<article class="k${i}"><span>${k[0]}</span><strong>${k[1]}</strong><small>${k[2]}</small></article>`).join('');

    const ntes=normalizarRanking(r.por_nte);
    const nteBox=document.getElementById('sigee-exec-ntes');
    if(nteBox) nteBox.innerHTML=ntes.length?`<div class="sigee-exec-table"><div class="head"><b>NTE</b><b>Total</b><b>Concluídos</b><b>Em atraso</b><b>Eficiência</b></div>${ntes.slice(0,27).map(x=>`<div><span>${esc(x[0])}</span><span>${Number(x[1]||0).toLocaleString('pt-BR')}</span><span>—</span><span>—</span><span>—</span></div>`).join('')}</div>`:'<p class="sigee-exec-empty">Sem dados por NTE.</p>';
    const etapas=normalizarRanking(r.por_etapa);
    const escolas=normalizarRanking(r.por_escola);
    const tecnicos=normalizarRanking(r.por_tecnico);
    document.getElementById('sigee-exec-etapas').innerHTML=bars(etapas,Math.max(ativos,1),8,{classeExtra:'sigee-exec-gargalos'});
    document.getElementById('sigee-exec-escolas').innerHTML=bars(escolas,Math.max(total,1),10,{mostrarNte:true});
    document.getElementById('sigee-exec-tecnicos').innerHTML=bars(tecnicos,Math.max(total,1),10);
    document.getElementById('sigee-exec-documentos').innerHTML='<p class="sigee-exec-empty">Indicador não disponível na consulta consolidada atual.</p>';
  }

  async function atualizarExecutivo(forcar=false) {
    if (atualizandoRPC) return;
    ensureUI();
    const botao=document.getElementById('sigee-exec-atualizar');
    const textoOriginal=botao?.textContent || '↻ Atualizar';
    atualizandoRPC=true;
    if(botao){botao.disabled=true;botao.textContent='↻ Atualizando...';}
    try {
      const c=cliente();
      if(!c) throw new Error('Conexão com o Supabase indisponível.');
      const p=periodoRpc();
      const {data,error}=await c.rpc('sigee_dashboard_resumo',{p_nte:nteRpc(),p_data_inicio:p.inicio,p_data_fim:p.fim});
      if(error) throw error;
      const resumo=typeof data==='string'?JSON.parse(data):data;
      renderRpc(resumo||{});
      try {
        window.SIGEE_DASHBOARD_RPC?.limparCache?.();
        window.dispatchEvent(new CustomEvent('sigee:dashboard-executivo-atualizado',{detail:resumo||{}}));
      } catch(_) {}
    } catch(erro) {
      console.error('[SIGEE Dashboard Executivo] Falha ao atualizar:',erro);
      if(botao) botao.textContent='Falha — tentar novamente';
      setTimeout(()=>{if(botao)botao.textContent=textoOriginal;},2200);
      return;
    } finally {
      atualizandoRPC=false;
      if(botao){botao.disabled=false;if(botao.textContent==='↻ Atualizando...')botao.textContent=textoOriginal;}
    }
  }

  function render() {
    ensureUI();
    const ps = filteredProcesses();
    const u=window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||window.currentUser||null;
    const global=window.SIGEE_ESCOPO?.ehGlobal?.(u)===true;
    const contexto=document.getElementById('sigee-exec-contexto');
    if(contexto) contexto.textContent=global?'VISÃO ESTADUAL CONSOLIDADA':`VISÃO TERRITORIAL — NTE ${String(window.SIGEE_ESCOPO?.nteIdUsuario?.(u)??'').padStart(2,'0')}`;
    const titulo=document.querySelector('#sigee-dashboard-executivo h2');
    if(titulo) titulo.textContent=global?'Dashboard Executivo CLO / SEC':'Dashboard Gerencial do NTE';
    const ativos = ps.filter(p=>!concluido(p));
    const concl = ps.filter(concluido);
    const venc = ps.filter(atrasado);
    const prazo = ativos.filter(p=>!atrasado(p));
    const tempos = concl.map(p=>Number(val(p,'tempo_total_dias','dias_decorridos'))).filter(Number.isFinite);
    const media = tempos.length ? (tempos.reduce((a,b)=>a+b,0)/tempos.length).toFixed(1) : '0';
    const sla = pct(prazo.length,ativos.length);
    const kpis = [
      ['Solicitações',ps.length,'Base selecionada'],['Em andamento',ativos.length,'Processos ativos'],['Em atraso',venc.length,'Exigem atenção'],['No prazo',prazo.length,`${sla}% do ativo`],['Concluídos',concl.length,'Retirados/indeferidos'],['Tempo médio',`${media} d`,'Até conclusão']
    ];
    const box=document.getElementById('sigee-exec-kpis'); if(box) box.innerHTML=kpis.map((k,i)=>`<article class="k${i}"><span>${k[0]}</span><strong>${k[1]}</strong><small>${k[2]}</small></article>`).join('');

    const ntes = countBy(ps,nte).map(([name,total])=>{
      const sub=ps.filter(p=>nte(p)===name), done=sub.filter(concluido).length, late=sub.filter(atrasado).length;
      return [name,total,done,late];
    });
    const nteBox=document.getElementById('sigee-exec-ntes');
    if(nteBox) nteBox.innerHTML = ntes.length ? `<div class="sigee-exec-table"><div class="head"><b>NTE</b><b>Total</b><b>Concluídos</b><b>Em atraso</b><b>Eficiência</b></div>${ntes.slice(0,27).map(r=>`<div><span>${esc(r[0])}</span><span>${r[1]}</span><span>${r[2]}</span><span class="${r[3]?'bad':'ok'}">${r[3]}</span><span>${pct(r[2],r[1])}%</span></div>`).join('')}</div>` : '<p class="sigee-exec-empty">Sem dados por NTE.</p>';

    const etapas=countBy(ativos,etapa); document.getElementById('sigee-exec-etapas').innerHTML=bars(etapas,ativos.length);
    const escolas=countBy(ps,p=>`${escola(p)}|||${nte(p)}`).map(([chave,total])=>{const [nome,nteEscola]=chave.split('|||');return [nome,total,nteEscola]}); document.getElementById('sigee-exec-escolas').innerHTML=bars(escolas,ps.length,10,{mostrarNte:true});
    const docs=countBy(ps,documento); document.getElementById('sigee-exec-documentos').innerHTML=bars(docs,ps.length);
    const tech=countBy(concl,tecnico); document.getElementById('sigee-exec-tecnicos').innerHTML=bars(tech,concl.length,10);
  }

  function boot(){ ensureUI(); atualizarExecutivo(false); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('sigee:dashboard-rpc-atualizado',e=>{ if(e.detail) renderRpc(e.detail); });
  window.SIGEE_DASHBOARD_EXECUTIVO={render,renderRpc,atualizar:atualizarExecutivo,versao:'RC4.6.8'};
})();
