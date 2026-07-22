/* SIGEE RC4.6.2 — Controle territorial de acesso dos NTEs */
(function(window, document){
  'use strict';
  if(window.__SIGEE_CONTROLE_ACESSO_NTES_RC462__) return;
  window.__SIGEE_CONTROLE_ACESSO_NTES_RC462__=true;

  const TABELA='controle_acesso_ntes';
  const TABELA_NTES='ntes_sigee';
  const INTERVALO_VALIDACAO=60000;
  let controleCache=[];
  let timerSessao=null;

  const texto=v=>v==null?'':String(v).trim();
  const token=v=>texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const perfilMaster=u=>token(u?.perfil).includes('MASTER');
  const nteCanonico=v=>{
    const t=token(v);
    const m=t.match(/(?:NTE\s*[-–—]?\s*)?(\d{1,2})/);
    return m?`NTE ${String(Number(m[1])).padStart(2,'0')}`:t;
  };
  function cliente(){return window.SIGEE_SUPABASE?.criarCliente?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}
  function usuarioAtual(){
    const direto=window.usuarioLogado||window.usuarioAtual||window.currentUser||window.SIGEE_USUARIO_ATUAL||window.SIGEE_SESSION?.getUser?.();
    if(direto) return direto;
    for(const chave of ['sigee_usuario','usuarioLogado','usuario_sigee','sigee_user']){
      try{const valor=localStorage.getItem(chave)||sessionStorage.getItem(chave); if(valor){const obj=JSON.parse(valor); if(obj) return obj;}}catch(_){ }
    }
    return null;
  }
  function esconderAbas(){document.querySelectorAll('#sistema-dashboard main > section[id^="aba-"]').forEach(s=>s.classList.add('hidden'));}
  function mensagemRegistro(r){return texto(r?.mensagem)||`O acesso ao SIGEE encontra-se temporariamente suspenso para ${nteCanonico(r?.nte)}. Procure a Coordenação de Legalização Escolar — CLO.`;}

  async function buscarControle(nte){
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const chave=nteCanonico(nte); if(!chave) return null;
    const {data,error}=await c.from(TABELA).select('*').eq('nte',chave).maybeSingle();
    if(error){
      if(String(error.code||'')==='42P01'||/does not exist|não existe/i.test(error.message||'')) throw new Error('A infraestrutura do Controle de Acesso ainda não foi instalada no Supabase.');
      throw error;
    }
    return data||null;
  }

  async function consultarUsuarioPorEmail(email){
    const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');
    const tabela=window.SIGEE_CONFIG?.tabelas?.usuarios||window.SIGEE_SUPABASE_TABELAS?.usuarios||'usuarios_sigee';
    const {data,error}=await c.from(tabela).select('*').ilike('email',texto(email).toLowerCase()).limit(1).maybeSingle();
    if(error) throw error; return data||null;
  }

  async function validarAntesDoLogin(event, original){
    event?.preventDefault?.();
    const email=texto(document.getElementById('login-email')?.value).toLowerCase();
    if(!email) return original?.apply(window,arguments);
    try{
      const usuario=await consultarUsuarioPorEmail(email);
      if(!usuario||perfilMaster(usuario)) return original?.call(window,event);
      const registro=await buscarControle(usuario.nte||usuario.nte_nome||usuario.nte_id);
      if(registro&&registro.acesso_ativo===false){
        alert(`ACESSO TEMPORARIAMENTE SUSPENSO\n\n${mensagemRegistro(registro)}${registro.motivo?`\n\nMotivo: ${registro.motivo}`:''}`);
        window.SIGEE_SESSION?.clear?.({persist:true,emit:true});
        return false;
      }
      return original?.call(window,event);
    }catch(erro){
      console.error('[SIGEE RC4.6.2] Validação territorial falhou.',erro);
      alert(erro.message||'Não foi possível validar a autorização territorial.');
      return false;
    }
  }

  async function validarSessaoAtual(){
    const u=usuarioAtual(); if(!u||perfilMaster(u)) return true;
    try{
      const r=await buscarControle(u.nte||u.nte_nome||u.nte_id);
      if(r&&r.acesso_ativo===false){
        window.SIGEE_SESSION?.clear?.({persist:true,emit:true});
        document.getElementById('sistema-dashboard')?.classList.add('hidden');
        document.getElementById('tela-login')?.classList.remove('hidden');
        alert(`Sua sessão foi encerrada.\n\n${mensagemRegistro(r)}`);
        return false;
      }
    }catch(e){console.warn('[SIGEE RC4.6.2] Verificação periódica não concluída.',e);}
    return true;
  }

  function instalarProtecaoLogin(){
    const original=window.handleLogin;
    if(typeof original!=='function'||original.__controleNte) return;
    const protegido=function(event){return validarAntesDoLogin(event,original);};
    protegido.__controleNte=true;
    window.handleLogin=protegido;
    try{globalThis.handleLogin=protegido;}catch(_){ }
  }

  function criarTela(){
    if(document.getElementById('aba-controle-acesso-ntes')) return;
    const main=document.querySelector('#sistema-dashboard main'); if(!main) return;
    const sec=document.createElement('section');
    sec.id='aba-controle-acesso-ntes'; sec.className='hidden space-y-5';
    sec.innerHTML=`<header class="sigee-admin-page-head"><div><span>ADMINISTRAÇÃO</span><h1>Controle de Acesso dos NTEs</h1><p>Suspenda ou reative o acesso territorial ao SIGEE. Usuários Master permanecem autorizados.</p></div><button type="button" id="btn-atualizar-acesso-ntes">↻ Atualizar</button></header>
    <div class="bg-white rounded-xl border shadow-sm overflow-hidden"><div class="p-4 border-b flex flex-wrap gap-3 justify-between items-center"><input id="busca-controle-nte" class="p-3 border rounded-lg text-xs min-w-[280px]" placeholder="Pesquisar NTE ou motivo..."><span class="text-xs text-gray-500">Motivo obrigatório para suspensão</span></div><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-gray-100"><tr><th class="p-3">NTE</th><th class="p-3">Situação</th><th class="p-3">Motivo / mensagem</th><th class="p-3">Última alteração</th><th class="p-3 text-center">Ação</th></tr></thead><tbody id="controle-acesso-ntes-corpo"></tbody></table></div></div>`;
    main.appendChild(sec);
    document.getElementById('btn-atualizar-acesso-ntes')?.addEventListener('click',carregarPainel);
    document.getElementById('busca-controle-nte')?.addEventListener('input',renderizarTabela);
  }

  function garantirItemMenu(){
    const u=usuarioAtual();
    if(!perfilMaster(u)) return false;
    if(document.getElementById('menu-controle-acesso-ntes')) return true;

    const referencia=document.getElementById('menu-usuarios')||document.getElementById('menu-logs');
    const container=document.getElementById('submenu-administracao')||referencia?.parentElement;
    if(!container) return false;

    const b=document.createElement('button');
    b.id='menu-controle-acesso-ntes';
    b.type='button';
    b.dataset.admin='controle-ntes';
    b.className=referencia?.className||'sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
    b.classList.remove('hidden');
    b.innerHTML='⛔ Controle de Acesso dos NTEs';
    b.addEventListener('click',function(ev){ev.preventDefault(); abrirPainel();});

    if(document.getElementById('submenu-administracao')) container.appendChild(b);
    else if(document.getElementById('menu-usuarios')) document.getElementById('menu-usuarios').insertAdjacentElement('afterend',b);
    else container.appendChild(b);
    return true;
  }

  function abrirPainel(){
    criarTela(); esconderAbas(); document.getElementById('aba-controle-acesso-ntes')?.classList.remove('hidden'); carregarPainel();
  }

  async function carregarPainel(){
    const corpo=document.getElementById('controle-acesso-ntes-corpo'); if(corpo) corpo.innerHTML='<tr><td colspan="5" class="p-6 text-center">Carregando...</td></tr>';
    try{
      const c=cliente(); if(!c) throw new Error('Cliente Supabase indisponível.');

      const [resNtes,resControle]=await Promise.all([
        c.from(TABELA_NTES).select('id,numero,nome,email_institucional,ativo').order('numero'),
        c.from(TABELA).select('*')
      ]);

      if(resNtes.error) throw resNtes.error;
      if(resControle.error){
        if(String(resControle.error.code||'')==='42P01'||/does not exist|não existe/i.test(resControle.error.message||'')){
          throw new Error('A infraestrutura do Controle de Acesso ainda não foi instalada no Supabase.');
        }
        throw resControle.error;
      }

      const mapaControle=new Map((resControle.data||[]).map(r=>[nteCanonico(r.nte),r]));
      controleCache=(resNtes.data||[]).map(n=>{
        const chave=nteCanonico(n.numero);
        const controle=mapaControle.get(chave)||{};
        return {
          ...controle,
          nte:chave,
          nte_id:n.id,
          numero:n.numero,
          nome_nte:n.nome,
          email_institucional:n.email_institucional,
          cadastro_ativo:n.ativo,
          acesso_ativo:controle.acesso_ativo!==false
        };
      });
      renderizarTabela();
    }catch(e){
      console.error('[SIGEE RC4.6.2] Falha ao carregar controle dos NTEs.',e);
      if(corpo) corpo.innerHTML=`<tr><td colspan="5" class="p-6 text-center text-red-700">${texto(e.message)||'Erro ao carregar.'}</td></tr>`;
    }
  }

  function renderizarTabela(){
    const corpo=document.getElementById('controle-acesso-ntes-corpo'); if(!corpo) return;
    const q=token(document.getElementById('busca-controle-nte')?.value);
    const lista=controleCache.filter(r=>!q||token(`${r.nte} ${r.nome_nte} ${r.email_institucional} ${r.motivo} ${r.mensagem}`).includes(q));
    corpo.innerHTML=lista.map(r=>{
      const ativo=r.acesso_ativo!==false;
      const alteracao=r.alterado_em?new Date(r.alterado_em).toLocaleString('pt-BR'):'—';
      return `<tr class="border-t"><td class="p-3 font-bold">${r.nte}<br><small class="font-normal text-gray-500">${texto(r.nome_nte)}</small></td><td class="p-3"><span class="px-2 py-1 rounded-full text-xs font-bold ${ativo?'bg-emerald-100 text-emerald-800':'bg-red-100 text-red-800'}">${ativo?'ATIVO':'SUSPENSO'}</span></td><td class="p-3"><strong>${texto(r.motivo)||'—'}</strong><br><small>${texto(r.mensagem)||'Mensagem institucional padrão'}</small></td><td class="p-3 text-xs">${alteracao}<br>${texto(r.alterado_por)||''}</td><td class="p-3 text-center"><button class="px-3 py-2 rounded-lg text-white text-xs font-bold ${ativo?'bg-red-600':'bg-emerald-600'}" data-nte="${r.nte}" data-ativo="${ativo}">${ativo?'Suspender acesso':'Reativar acesso'}</button></td></tr>`;
    }).join('')||'<tr><td colspan="5" class="p-6 text-center">Nenhum NTE encontrado.</td></tr>';
    corpo.querySelectorAll('button[data-nte]').forEach(b=>b.addEventListener('click',()=>alterarStatus(b.dataset.nte,b.dataset.ativo==='true')));
  }

  async function alterarStatus(nte,estaAtivo){
    const u=usuarioAtual(); if(!perfilMaster(u)) return alert('Ação exclusiva do perfil Master.');
    let motivo='',mensagem='';
    if(estaAtivo){
      motivo=texto(prompt(`Informe o motivo da suspensão de ${nte}:`)); if(!motivo) return alert('O motivo da suspensão é obrigatório.');
      mensagem=texto(prompt('Mensagem apresentada aos usuários:',`O acesso ao SIGEE encontra-se temporariamente suspenso para ${nte}. Procure a Coordenação de Legalização Escolar — CLO.`));
      if(!mensagem) return alert('A mensagem institucional é obrigatória.');
      if(!confirm(`Confirma a suspensão total de acesso para ${nte}?`)) return;
    }else if(!confirm(`Confirma a reativação do acesso para ${nte}?`)) return;
    const c=cliente(); if(!c) return alert('Cliente Supabase indisponível.');
    const payload={acesso_ativo:!estaAtivo,motivo:estaAtivo?motivo:null,mensagem:estaAtivo?mensagem:null,alterado_em:new Date().toISOString(),alterado_por:texto(u?.email||u?.nome)};
    const {error}=await c.from(TABELA).upsert({nte,...payload},{onConflict:'nte'});
    if(error) return alert(`Não foi possível concluir: ${error.message}`);
    try{window.registrarLog?.(`${estaAtivo?'Suspendeu':'Reativou'} o acesso territorial do ${nte}. ${motivo?`Motivo: ${motivo}`:''}`);}catch(_){ }
    alert(`Acesso do ${nte} ${estaAtivo?'suspenso':'reativado'} com sucesso.`); carregarPainel();
  }

  function iniciar(){
    instalarProtecaoLogin(); criarTela(); garantirItemMenu();
    clearInterval(timerSessao); timerSessao=setInterval(validarSessaoAtual,INTERVALO_VALIDACAO);
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,200));
  let tentativasMenu=0; const retryMenu=setInterval(()=>{tentativasMenu++; if(garantirItemMenu()||tentativasMenu>=30) clearInterval(retryMenu);},500);
  window.addEventListener('load',()=>setTimeout(iniciar,600));
  document.addEventListener('sigee:usuario-logado',()=>setTimeout(()=>{garantirItemMenu();validarSessaoAtual();},200));
  window.addEventListener('sigee:login-concluido',()=>setTimeout(()=>{garantirItemMenu();validarSessaoAtual();},200));
  window.SIGEE_CONTROLE_ACESSO_NTES={abrir:abrirPainel,recarregar:carregarPainel,validarSessao:validarSessaoAtual};
})(window,document);
