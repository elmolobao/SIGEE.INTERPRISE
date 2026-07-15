/* SIGEE Enterprise 3.1 — Centro de Inteligência e Diagnóstico
 * Camada somente leitura. Não altera registros, workflow ou Supabase.
 */
(function () {
  'use strict';

  const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const key = v => norm(v).replace(/[^A-Z0-9]/g, '');
  const text = v => String(v ?? '').trim();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const val = (o, ...keys) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && text(o[k])) return o[k]; return ''; };
  const arr = (...names) => { for (const n of names) { try { if (Array.isArray(window[n])) return window[n]; } catch (_) {} } return []; };
  const profile = () => norm(val(window.usuarioLogado || {}, 'perfil', 'role') || 'TECNICO');
  const userNte = () => text(val(window.usuarioLogado || {}, 'nte', 'nte_nome', 'grupo'));
  const nteOf = o => text(val(o, 'nte', 'nte_nome', 'grupo', 'NTE', 'nte_id', 'id_nte', 'territorio_id'));
  const stableId = o => text(val(o,'id','uuid','codigo_sigee'));
  const uniqueById = list => {
    const seen = new Set();
    return list.filter((item, index) => {
      const id = stableId(item);
      if (!id) return true;
      const k = `${typeof item}:${id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const sameNte = (a,b) => {
    const na = String(a).match(/\d{1,2}/)?.[0], nb = String(b).match(/\d{1,2}/)?.[0];
    return na && nb ? Number(na) === Number(nb) : norm(a) === norm(b);
  };
  const globalAccess = () => profile().includes('MASTER') || profile().includes('SEC');
  const canAccess = () => globalAccess() || profile().includes('ADMIN');
  const scoped = list => globalAccess() ? list.slice() : list.filter(x => sameNte(nteOf(x), userNte()));
  const idOf = o => text(val(o,'id','codigo_sigee','cod_mec','codigo_mec','email')) || '—';
  const schoolName = o => text(val(o,'nome_escola','escola_nome','nome','escola','instituicao'));
  const processSchool = o => text(val(o,'escola_nome','escola','nome_escola','instituicao'));
  const processStage = o => text(val(o,'etapa_atual','etapa','fase_atual'));
  const processOwner = o => text(val(o,'tecnico_responsavel','tecnico_responsavel_nome','responsavel','responsavel_nome','analista','analista_nome','digitador','digitador_nome','conferente','conferente_nome'));
  const codeMec = o => text(val(o,'cod_mec','codigo_mec','codigoMec','inep','codigo_inep'));
  const validMecKey = o => {
    const raw = codeMec(o);
    const normalized = norm(raw);
    if (!raw || ['SEM CODIGO','NAO INFORMADO','NAO POSSUI','N/A','NA'].includes(normalized)) return '';
    const digits = raw.replace(/\D/g,'');
    if (digits.length < 7 || digits.length > 9 || /^0+$/.test(digits)) return '';
    return digits;
  };
  const municipality = o => text(val(o,'municipio','cidade'));
  const schoolStatus = o => text(val(o,'situacao_funcional','situacao','status_escola'));
  const archiveStatus = o => text(val(o,'status_acervo','acervo','situacao_acervo'));
  const email = o => norm(val(o,'email','usuario_email'));

  function groupDup(list, keyFn) {
    const map = new Map();
    list.forEach(x => { const k = norm(keyFn(x)); if (!k) return; if (!map.has(k)) map.set(k,[]); map.get(k).push(x); });
    return [...map.entries()].filter(([,items]) => items.length > 1);
  }

  function diagnostics() {
    const schools = uniqueById(scoped(arr('escolasDB','escolas','catalogoEscolas')));
    const processes = uniqueById(scoped(arr('processosDB','processos')));
    const users = uniqueById(scoped(arr('usuariosDB','usuarios')));
    const schoolNames = new Set(schools.map(s => key(schoolName(s))).filter(Boolean));
    const schoolIds = new Set(schools.map(s => text(val(s,'id','escola_id'))).filter(Boolean));
    const schoolMecCodes = new Set(schools.map(validMecKey).filter(Boolean));

    const rules = [
      {cat:'Escolas', key:'mec-duplicado', level:'critical', title:'Código MEC duplicado', hint:'O mesmo código MEC válido identifica mais de uma escola.', items:groupDup(schools,validMecKey).flatMap(([,x])=>x)},
      {cat:'Escolas', key:'nome-duplicado', level:'critical', title:'Nome de escola duplicado', hint:'Nomes idênticos devem ser conferidos antes de qualquer fusão.', items:groupDup(schools,s=>`${schoolName(s)}|${municipality(s)}`).flatMap(([,x])=>x)},
      {cat:'Escolas', key:'sem-nte', level:'warning', title:'Escolas sem NTE', hint:'Registros sem território prejudicam filtros e permissões.', items:schools.filter(s=>!nteOf(s))},
      {cat:'Escolas', key:'sem-municipio', level:'warning', title:'Escolas sem município', hint:'O município é obrigatório para diagnóstico territorial.', items:schools.filter(s=>!municipality(s))},
      {cat:'Escolas', key:'sem-situacao', level:'warning', title:'Escolas sem situação funcional', hint:'Informe se a unidade está ativa, extinta ou em outra condição.', items:schools.filter(s=>!schoolStatus(s))},
      {cat:'Escolas', key:'sem-acervo', level:'warning', title:'Escolas sem informação de acervo', hint:'Registros sem situação/localização do acervo.', items:schools.filter(s=>!archiveStatus(s) && !text(val(s,'local_acervo')))},
      {cat:'Escolas', key:'ativas', level:'info', title:'Escolas marcadas como ativas', hint:'Conferir se devem permanecer no catálogo de escolas extintas.', items:schools.filter(s=>norm(schoolStatus(s)).includes('ATIVA') && !norm(schoolStatus(s)).includes('INATIVA'))},
      {cat:'Processos', key:'sem-escola', level:'critical', title:'Processos sem escola', hint:'Solicitações sem vínculo escolar exigem correção.', items:processes.filter(p=>!processSchool(p) && !text(val(p,'escola_id')))},
      {cat:'Processos', key:'escola-nao-localizada', level:'critical', title:'Processos com escola não localizada', hint:'Nenhuma correspondência foi encontrada por ID, Código MEC ou nome normalizado.', items:processes.filter(p=>{
        const sid=text(val(p,'escola_id'));
        const sn=key(processSchool(p));
        const rawMec=text(val(p,'cod_mec','codigo_mec','escola_cod_mec','escola_codigo_mec','codigo_inep'));
        const mecDigits=rawMec.replace(/\D/g,'');
        const smec=(mecDigits.length>=7 && mecDigits.length<=9 && !/^0+$/.test(mecDigits)) ? mecDigits : '';
        const localizadoPorId=Boolean(sid && schoolIds.has(sid));
        const localizadoPorMec=Boolean(smec && schoolMecCodes.has(smec));
        const localizadoPorNome=Boolean(sn && schoolNames.has(sn));
        const possuiReferencia=Boolean(sid || smec || sn);
        return possuiReferencia && !localizadoPorId && !localizadoPorMec && !localizadoPorNome;
      })},
      {cat:'Processos', key:'sem-responsavel', level:'warning', title:'Processos sem responsável', hint:'Somente etapas operacionais com atribuição obrigatória são verificadas.', items:processes.filter(p=>{
        const stage=norm(processStage(p));
        const requiresOwner=['ANALISE','PENDENCIA','DIGITACAO','CONFERENCIA','ASSINATURA'].some(x=>stage.includes(x));
        return requiresOwner && !processOwner(p);
      })},
      {cat:'Processos', key:'sem-etapa', level:'critical', title:'Processos sem etapa', hint:'A ausência de etapa impede o workflow.', items:processes.filter(p=>!processStage(p))},
      {cat:'Processos', key:'sem-prioridade', level:'warning', title:'Processos sem prioridade', hint:'Defina a prioridade para ordenar corretamente a fila.', items:processes.filter(p=>!text(val(p,'prioridade')))},
      {cat:'Processos', key:'sem-workflow-id', level:'critical', title:'Processos sem workflow_instance_id', hint:'A instância é necessária para rastrear ações e ciclos.', items:processes.filter(p=>!text(val(p,'workflow_instance_id')))},
      {cat:'Usuários', key:'email-duplicado', level:'critical', title:'E-mails de usuários duplicados', hint:'Cada conta deve possuir e-mail único.', items:groupDup(users,email).flatMap(([,x])=>x)},
      {cat:'Usuários', key:'tecnico-sem-nte', level:'critical', title:'Técnicos sem NTE', hint:'Sem território, as permissões podem ficar inconsistentes.', items:users.filter(u=>norm(val(u,'perfil')).includes('TECN') && !nteOf(u))},
      {cat:'Usuários', key:'perfil-vazio', level:'warning', title:'Usuários sem perfil', hint:'Defina um perfil de acesso válido.', items:users.filter(u=>!text(val(u,'perfil','role')))},
      {cat:'Usuários', key:'inativos', level:'info', title:'Usuários inativos', hint:'Revisar contas inativas e acessos ainda necessários.', items:users.filter(u=>{ const a=val(u,'ativo','status'); return a === false || ['INATIVO','BLOQUEADO','DESATIVADO'].includes(norm(a)); })}
    ];
    return {rules, schools, processes, users};
  }

  function ensureUI() {
    if (document.getElementById('aba-inteligencia')) return;
    const nav = document.querySelector('.sigee-sidebar-nav');
    const main = document.querySelector('main');
    if (!nav || !main) return;
    const button = document.createElement('button');
    button.id='menu-inteligencia'; button.type='button';
    button.className='sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
    button.innerHTML='🧠 Centro de Inteligência';
    button.addEventListener('click', open);
    const logs=document.getElementById('menu-logs'); nav.insertBefore(button, logs || null);
    if (!canAccess()) button.classList.add('hidden');

    const section=document.createElement('section');
    section.id='aba-inteligencia'; section.className='hidden sigee-intel';
    section.innerHTML=`
      <header class="sigee-intel-head"><div><span>GOVERNANÇA E QUALIDADE DOS DADOS</span><h1>Centro de Inteligência SIGEE</h1><p>Diagnóstico automático, integridade cadastral e apoio à decisão.</p></div><div><button id="intel-refresh" type="button">↻ Atualizar diagnóstico</button></div></header>
      <div id="intel-summary" class="sigee-intel-summary"></div>
      <div class="sigee-intel-toolbar"><select id="intel-category"><option value="TODOS">Todas as áreas</option><option>Escolas</option><option>Processos</option><option>Usuários</option></select><select id="intel-level"><option value="TODOS">Todas as gravidades</option><option value="critical">Crítico</option><option value="warning">Atenção</option><option value="info">Informativo</option></select><input id="intel-search" placeholder="Pesquisar diagnóstico ou registro..."></div>
      <div id="intel-rules" class="sigee-intel-rules"></div>
      <aside id="intel-detail" class="sigee-intel-detail hidden" aria-live="polite"></aside>`;
    main.appendChild(section);
    section.querySelector('#intel-refresh').addEventListener('click', render);
    section.querySelector('#intel-category').addEventListener('change', render);
    section.querySelector('#intel-level').addEventListener('change', render);
    section.querySelector('#intel-search').addEventListener('input', render);
  }

  function open() {
    ensureUI();
    document.querySelectorAll('main > section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));
    document.getElementById('aba-inteligencia')?.classList.remove('hidden');
    document.querySelectorAll('.sigee-menu-item').forEach(b=>b.classList.remove('sigee-menu-ativo'));
    document.getElementById('menu-inteligencia')?.classList.add('sigee-menu-ativo');
    render();
  }

  function itemLabel(item, cat) {
    if (cat === 'Escolas') return `${schoolName(item) || 'Escola sem nome'} · ${municipality(item) || 'sem município'} · ${nteOf(item) || 'sem NTE'}`;
    if (cat === 'Processos') return `${text(val(item,'codigo_sigee','id')) || 'Processo'} · ${text(val(item,'aluno_nome','aluno','nome_solicitante')) || 'sem requerente'} · ${processStage(item) || 'sem etapa'}`;
    return `${text(val(item,'nome','nome_completo')) || 'Usuário sem nome'} · ${text(val(item,'email')) || 'sem e-mail'} · ${text(val(item,'perfil')) || 'sem perfil'}`;
  }

  function showDetail(rule) {
    const box=document.getElementById('intel-detail'); if(!box) return;
    box.classList.remove('hidden');
    box.innerHTML=`<button type="button" class="intel-close" aria-label="Fechar">×</button><span>${esc(rule.cat)} · ${rule.items.length} registro(s)</span><h2>${esc(rule.title)}</h2><p>${esc(rule.hint)}</p><div class="intel-detail-list">${rule.items.length ? rule.items.slice(0,250).map(i=>`<article><b>${esc(itemLabel(i,rule.cat))}</b><small>ID: ${esc(idOf(i))}</small></article>`).join('') : '<p>Nenhuma inconsistência encontrada.</p>'}</div>${rule.items.length>250?'<small>Exibindo os primeiros 250 registros.</small>':''}`;
    box.querySelector('.intel-close').addEventListener('click',()=>box.classList.add('hidden'));
  }

  function render() {
    ensureUI();
    const data=diagnostics();
    const category=document.getElementById('intel-category')?.value || 'TODOS';
    const level=document.getElementById('intel-level')?.value || 'TODOS';
    const search=norm(document.getElementById('intel-search')?.value || '');
    const critical=data.rules.filter(r=>r.level==='critical').reduce((n,r)=>n+r.items.length,0);
    const warning=data.rules.filter(r=>r.level==='warning').reduce((n,r)=>n+r.items.length,0);
    const healthy=data.rules.filter(r=>r.items.length===0).length;
    const baseSize=Math.max(1,data.schools.length+data.processes.length+data.users.length);
    const weightedIssues=(critical*3)+(warning*1);
    const score=Math.max(0,Math.round(100-(weightedIssues/baseSize)*100));
    const summary=document.getElementById('intel-summary');
    if(summary) summary.innerHTML=`<article><span>Índice de integridade</span><strong>${score}</strong><small>de 100 pontos</small></article><article class="critical"><span>Ocorrências críticas</span><strong>${critical}</strong><small>Exigem correção</small></article><article class="warning"><span>Pontos de atenção</span><strong>${warning}</strong><small>Revisão recomendada</small></article><article><span>Regras sem ocorrência</span><strong>${healthy}</strong><small>de ${data.rules.length} verificações</small></article><article><span>Base analisada</span><strong>${data.schools.length+data.processes.length+data.users.length}</strong><small>${data.schools.length} escolas · ${data.processes.length} processos · ${data.users.length} usuários</small></article>`;
    const rules=data.rules.filter(r => (category === 'TODOS' || r.cat === category) && (level === 'TODOS' || r.level === level) && (!search || norm(`${r.title} ${r.hint} ${r.cat} ${r.items.map(i => itemLabel(i, r.cat)).join(' ')}`).includes(search)));
    const list=document.getElementById('intel-rules'); if(!list) return;
    list.innerHTML=rules.map((r,i)=>`<button type="button" class="sigee-intel-rule ${r.level}" data-rule="${i}"><span class="intel-status">${r.items.length?'!':'✓'}</span><div><small>${esc(r.cat)}</small><h3>${esc(r.title)}</h3><p>${esc(r.hint)}</p></div><strong>${r.items.length}</strong><em>${r.items.length?'Ver registros':'Conforme'}</em></button>`).join('') || '<p class="sigee-intel-empty">Nenhum diagnóstico corresponde aos filtros.</p>';
    list.querySelectorAll('[data-rule]').forEach((b,i)=>b.addEventListener('click',()=>showDetail(rules[i])));
  }

  function closeIntelligence() {
    const section = document.getElementById('aba-inteligencia');
    if (section) {
      section.classList.add('hidden');
      section.style.removeProperty('display');
      section.style.removeProperty('visibility');
      section.style.removeProperty('opacity');
    }
    document.getElementById('intel-detail')?.classList.add('hidden');
    document.getElementById('menu-inteligencia')?.classList.remove('sigee-menu-ativo');
  }

  function installSafeExit() {
    const nav = document.querySelector('.sigee-sidebar-nav');
    if (!nav || nav.dataset.intelSafeExit === '1') return;
    nav.dataset.intelSafeExit = '1';
    nav.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.id === 'menu-inteligencia') return;
      closeIntelligence();
    }, true);
  }

  function boot(){
    ensureUI();
    installSafeExit();
    setTimeout(()=>{ if(canAccess()) render(); },1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.SIGEE_CENTRO_INTELIGENCIA={open,close:closeIntelligence,render,diagnostics};
})();
