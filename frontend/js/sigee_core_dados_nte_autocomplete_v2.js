/* =====================================================================
 * SIGEE - Core Dados NTE + Autocomplete Escola v2
 * Correção: impede o dashboard de zerar após o app.js reexecutar rotinas antigas.
 * Carregar este arquivo APÓS app.js.
 * ===================================================================== */
(function(){
  'use strict';

  const TB = (window.SIGEE_CONFIG && window.SIGEE_CONFIG.supabase && window.SIGEE_CONFIG.supabase.tabelas) || {
    escolas: 'escolas_sigee', processos: 'processos', usuarios: 'usuarios_sigee'
  };

  let ultimoDashboard = null;
  let atualizandoDashboard = false;
  let timerBusca = null;

  function txt(v){ return v === undefined || v === null ? '' : String(v).trim(); }
  function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function nteNum(v){
    if(v === undefined || v === null) return null;
    if(typeof v === 'number' && Number.isFinite(v)) return v;
    const m = txt(v).match(/(\d{1,2})/);
    if(!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n >= 1 && n <= 27 ? n : null;
  }
  function usuario(){ return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
  function perfil(u){ return up(u && u.perfil); }
  function isGlobal(u){
    const p = perfil(u);
    const email = txt(u && u.email).toLowerCase();
    const nte = up(u && u.nte);
    return p.includes('MASTER') || p.includes('SEC') || email === 'sec@enova.educacao.ba.gov.br' || nte.includes('TODOS OS NTES') || nte === 'SEC';
  }
  function usuarioNteId(){
    const u = usuario();
    return nteNum(u && (u.nte_id || u.nte || u.grupo || u.nte_nome));
  }
  function client(){
    try{ if(window.SIGEE_SUPABASE && window.SIGEE_SUPABASE.criarCliente) return window.SIGEE_SUPABASE.criarCliente(); }catch(e){}
    if(window.SIGEE_SUPABASE_CLIENT) return window.SIGEE_SUPABASE_CLIENT;
    try{ if(typeof criarClienteSupabaseSIGEE === 'function') return criarClienteSupabaseSIGEE(); }catch(e){}
    return null;
  }
  function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = String(val); }
  function getText(id){ const el = document.getElementById(id); return el ? txt(el.textContent) : ''; }
  function etapaNorm(v){
    const e = up(v);
    if(e.includes('ANAL')) return 'analise';
    if(e.includes('PEND')) return 'pendencia';
    if(e.includes('DIGIT')) return 'digitacao';
    if(e.includes('CONFER')) return 'conferencia';
    if(e.includes('ASSIN')) return 'assinatura';
    if(e.includes('AGUARD')) return 'aguardando';
    if(e.includes('RETIR')) return 'retirado';
    return 'desarquivamento';
  }
  async function countRows(table, filtro){
    const c = client(); if(!c) return 0;
    let q = c.from(table).select('*', { count:'exact', head:true });
    if(filtro) q = filtro(q);
    const { count, error } = await q;
    if(error){ console.warn('[SIGEE v2] countRows', table, error.message); return 0; }
    return count || 0;
  }
  async function selectRows(table, cols, filtro, limit){
    const c = client(); if(!c) return [];
    let q = c.from(table).select(cols).limit(limit || 10000);
    if(filtro) q = filtro(q);
    const { data, error } = await q;
    if(error){ console.warn('[SIGEE v2] selectRows', table, error.message); return []; }
    return data || [];
  }
  function filtroEscolas(q){
    const u = usuario();
    if(isGlobal(u)) return q;
    const id = usuarioNteId();
    return id ? q.eq('nte_id', id) : q.eq('nte_id', -1);
  }
  function filtroProcessos(q){
    const u = usuario();
    if(isGlobal(u)) return q;
    const id = usuarioNteId();
    return id ? q.eq('nte', 'NTE ' + String(id).padStart(2,'0')) : q.eq('nte', 'NTE 00');
  }

  function aplicarDashboard(d){
    if(!d) return;
    setText('dash-escolas', d.escolas);
    setText('dash-acervos', d.acervos);
    setText('dash-estaduais', d.estaduais);
    setText('dash-municipios', d.municipios);
    setText('dash-usuarios', d.usuarios);
    setText('dash-proc-desarquivamento', d.proc.desarquivamento || 0);
    setText('dash-proc-analise', d.proc.analise || 0);
    setText('dash-proc-pendencia', d.proc.pendencia || 0);
    setText('dash-proc-digitacao', d.proc.digitacao || 0);
    setText('dash-proc-conferencia', d.proc.conferencia || 0);
    setText('dash-proc-assinatura', d.proc.assinatura || 0);
    setText('dash-proc-aguardando', d.proc.aguardando || 0);
    setText('dash-proc-retirado', d.proc.retirado || 0);
    setText('dash-tec-media-entrega', '0 dias');
    setText('dash-tec-media-pedidos-dia', d.processosTotal ? (d.processosTotal / 30).toFixed(1) : '0,0');
    setText('dash-tec-media-pasta-dia', '0,0');
    const top = document.getElementById('dash-tec-top-escolas');
    if(top && d.topHtml !== undefined) top.innerHTML = d.topHtml || 'Sem dados';
  }

  async function carregarDashboardSIGEE(){
    if(atualizandoDashboard) return;
    atualizandoDashboard = true;
    try{
      const u = usuario();
      const id = usuarioNteId();
      const filtro = document.getElementById('filtro-dashboard-nte');
      if(filtro){
        filtro.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = isGlobal(u) ? 'TODOS' : ('NTE ' + String(id || '').padStart(2,'0'));
        opt.textContent = isGlobal(u) ? 'TODOS' : ('NTE ' + String(id || '').padStart(2,'0'));
        filtro.appendChild(opt);
        filtro.disabled = !isGlobal(u);
      }

      const [totalEscolas, acervos, estaduais, usuariosTotal, municipios, processos] = await Promise.all([
        countRows(TB.escolas, filtroEscolas),
        countRows(TB.escolas, q => filtroEscolas(q).or('status_acervo.ilike.%RECOLHIDO%,acervo.ilike.%RECOLHIDO%')),
        countRows(TB.escolas, q => filtroEscolas(q).or('dependencia_adm.ilike.%ESTADUAL%,dependencia.ilike.%ESTADUAL%')),
        countRows(TB.usuarios, q => q.eq('ativo', true)),
        selectRows(TB.escolas, 'municipio', filtroEscolas, 10000),
        selectRows(TB.processos, 'etapa_atual,nte,escola_nome', filtroProcessos, 10000)
      ]);

      const proc = {};
      processos.forEach(p => { const k = etapaNorm(p.etapa_atual); proc[k] = (proc[k] || 0) + 1; });
      const mapa = {};
      processos.forEach(p => { const n = txt(p.escola_nome || 'NÃO INFORMADA'); if(n) mapa[n] = (mapa[n] || 0) + 1; });
      const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1]).slice(0,5);

      ultimoDashboard = {
        escolas: totalEscolas,
        acervos,
        estaduais,
        municipios: new Set(municipios.map(x => up(x.municipio)).filter(Boolean)).size,
        usuarios: usuariosTotal,
        proc,
        processosTotal: processos.length,
        topHtml: top.length ? top.map(([n,c])=>`<div>${n}: <b>${c}</b></div>`).join('') : 'Sem dados'
      };
      aplicarDashboard(ultimoDashboard);
    }finally{
      atualizandoDashboard = false;
    }
  }

  // Se o app antigo zerar os cards após esta rotina, repõe o último dashboard correto.
  function protegerDashboardContraReset(){
    if(!ultimoDashboard) return;
    const atual = Number(getText('dash-escolas').replace(/\D/g,'') || '0');
    if(ultimoDashboard.escolas > 0 && atual === 0) aplicarDashboard(ultimoDashboard);
  }

  window.carregarDadosDashboardReal = carregarDashboardSIGEE;
  try{ carregarDadosDashboardReal = window.carregarDadosDashboardReal; }catch(e){}

  function esconderSelectEscola(){
    const select = document.getElementById('novo-proc-escola');
    if(!select) return null;
    select.required = false;
    select.style.display = 'none';
    let box = document.getElementById('sigee-escola-autocomplete-box');
    if(!box){
      box = document.createElement('div');
      box.id = 'sigee-escola-autocomplete-box';
      box.innerHTML = `
        <input id="sigee-escola-busca" type="text" autocomplete="off" placeholder="Digite ao menos 2 letras do nome da escola..." class="w-full p-2 border rounded-lg text-xs focus:outline-none bg-white font-semibold uppercase">
        <div id="sigee-escola-resultados" class="hidden bg-white border rounded-lg mt-1 max-h-56 overflow-auto shadow-lg text-xs z-50"></div>
      `;
      select.parentNode.insertBefore(box, select.nextSibling);
    }
    return box;
  }
  function preencherEscola(e){
    const nome = txt(e.nome_escola || e.nome).toUpperCase();
    const select = document.getElementById('novo-proc-escola');
    const input = document.getElementById('sigee-escola-busca');
    const lista = document.getElementById('sigee-escola-resultados');
    if(input) input.value = nome;
    if(select){
      select.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = nome; opt.textContent = nome; opt.selected = true;
      select.appendChild(opt);
      select.value = nome;
      select.dataset.codMec = txt(e.cod_mec);
      select.dataset.escolaId = txt(e.id);
      select.dataset.nteId = txt(e.nte_id);
    }
    const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.value = txt(v); };
    set('novo-autofill-mec', e.cod_mec);
    set('novo-autofill-nte', e.nte || ('NTE ' + String(e.nte_id || '').padStart(2,'0')));
    set('novo-autofill-municipio', e.municipio);
    set('novo-autofill-dep', e.dependencia_adm || e.dependencia);
    set('novo-autofill-situacao', e.situacao_funcional || e.situacao);
    set('novo-autofill-acervo', e.status_acervo || e.acervo);
    set('novo-autofill-local-acervo', e.local_acervo);
    if(lista) lista.classList.add('hidden');
    window.__SIGEE_ESCOLA_SELECIONADA = e;
  }
  async function buscarEscolas(termo){
    termo = txt(termo);
    const lista = document.getElementById('sigee-escola-resultados');
    if(!lista) return;
    if(termo.length < 2){ lista.classList.add('hidden'); lista.innerHTML = ''; return; }
    lista.classList.remove('hidden');
    lista.innerHTML = '<div class="p-2 text-gray-500 font-bold">Pesquisando...</div>';
    const c = client(); if(!c){ lista.innerHTML = '<div class="p-2 text-red-600 font-bold">Supabase indisponível.</div>'; return; }
    let q = c.from(TB.escolas)
      .select('id,cod_mec,nome_escola,nome,municipio,nte,nte_id,dependencia_adm,dependencia,situacao_funcional,situacao,status_acervo,acervo,local_acervo')
      .ilike('nome_escola', `%${termo}%`)
      .order('nome_escola', { ascending:true })
      .limit(30);
    if(!isGlobal(usuario())){
      const id = usuarioNteId();
      q = id ? q.eq('nte_id', id) : q.eq('nte_id', -1);
    }
    const { data, error } = await q;
    if(error){ lista.innerHTML = `<div class="p-2 text-red-600 font-bold">${error.message}</div>`; return; }
    const rows = data || [];
    if(!rows.length){ lista.innerHTML = '<div class="p-2 text-gray-500 font-bold">Nenhuma escola localizada.</div>'; return; }
    lista.innerHTML = rows.map((e,i)=>`
      <div class="sigee-item-escola p-2 hover:bg-blue-50 cursor-pointer border-b" data-idx="${i}">
        <div class="font-bold text-gray-900">${txt(e.nome_escola || e.nome).toUpperCase()}</div>
        <div class="text-[11px] text-gray-600">MEC ${txt(e.cod_mec) || '-'} | ${txt(e.municipio).toUpperCase()} | ${txt(e.nte || ('NTE '+String(e.nte_id).padStart(2,'0')))}</div>
      </div>`).join('');
    lista.querySelectorAll('.sigee-item-escola').forEach(el=>{
      el.addEventListener('click', ()=> preencherEscola(rows[Number(el.dataset.idx)]));
    });
  }
  function ativarAutocomplete(){
    esconderSelectEscola();
    window.__SIGEE_ESCOLA_SELECIONADA = null;
    const input = document.getElementById('sigee-escola-busca');
    if(!input) return;
    input.value = '';
    input.oninput = function(){
      const select = document.getElementById('novo-proc-escola');
      if(select){ select.innerHTML=''; select.value=''; }
      clearTimeout(timerBusca);
      timerBusca = setTimeout(()=>buscarEscolas(input.value), 250);
    };
  }
  const oldAbrir = window.abrirFormularioNovaSolicitacao || (typeof abrirFormularioNovaSolicitacao !== 'undefined' ? abrirFormularioNovaSolicitacao : null);
  window.abrirFormularioNovaSolicitacao = function(){
    if(oldAbrir){ try{ oldAbrir.apply(this, arguments); }catch(e){ console.warn('[SIGEE v2] abrir antigo falhou', e); } }
    const modal = document.getElementById('modal-nova-solicitacao'); if(modal) modal.classList.remove('hidden');
    setTimeout(ativarAutocomplete, 250);
    setTimeout(ativarAutocomplete, 700);
  };
  try{ abrirFormularioNovaSolicitacao = window.abrirFormularioNovaSolicitacao; }catch(e){}

  window.handleSelecaoInstituicaoFluxoAutomatico = function(){ return true; };
  try{ handleSelecaoInstituicaoFluxoAutomatico = window.handleSelecaoInstituicaoFluxoAutomatico; }catch(e){}

  const oldNav = window.navegar || (typeof navegar !== 'undefined' ? navegar : null);
  if(oldNav){
    window.navegar = function(aba){
      const r = oldNav.apply(this, arguments);
      if(aba === 'painel'){
        setTimeout(carregarDashboardSIGEE, 100);
        setTimeout(carregarDashboardSIGEE, 700);
        setTimeout(protegerDashboardContraReset, 1400);
      }
      return r;
    };
    try{ navegar = window.navegar; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(carregarDashboardSIGEE, 1200);
    setTimeout(protegerDashboardContraReset, 2200);
    setInterval(protegerDashboardContraReset, 1500);
  });

  console.info('[SIGEE] Core Dados NTE + Autocomplete Escola v2 ativo');
})();
