/* =====================================================================
   SIGEE RC10.8.41 — Diretório Único de Responsáveis
   Fonte autoritativa: public.usuarios_sigee
   Objetivos:
   - eliminar usuários fantasmas oriundos de cache/dados legados;
   - resolver NTE por nte, nte_nome, nte_vinculado, grupo ou nte_id;
   - filtrar sempre pelo NTE do processo/etapa;
   - repetir a consulta em falhas transitórias;
   - nunca misturar cache local quando a consulta oficial responde.
   ===================================================================== */
(function(w){
  'use strict';

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const txt = v => v == null ? '' : String(v).trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const nteNumero = v => {
    const s = txt(v);
    const m = s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    if(m) return Number(m[1]);
    if(/^\d{1,2}$/.test(s)) return Number(s);
    return null;
  };
  const nteTexto = u => {
    if(!u) return '';
    const direto = txt(u.nte || u.nte_nome || u.nte_vinculado || u.grupo);
    if(direto) return direto;
    const n = Number(u.nte_id);
    return Number.isFinite(n) && n > 0 ? `NTE-${String(n).padStart(2,'0')}` : '';
  };
  const mesmoNte = (a,b) => {
    const na = nteNumero(a), nb = nteNumero(b);
    if(na && nb) return na === nb;
    return norm(a).replace(/[^A-Z0-9]/g,'') === norm(b).replace(/[^A-Z0-9]/g,'');
  };
  const perfil = u => norm(u?.perfil || u?.role || u?.tipo_perfil || u?.tipo || u?.nivel || '');
  const ativo = u => {
    if(!u || u.ativo === false || u.bloqueado === true) return false;
    const st = norm(u.status || u.situacao || 'ATIVO');
    return !st.includes('INATIV') && !st.includes('BLOQUEAD') && !st.includes('EXCLUID');
  };
  const elegivel = (u, incluirEstagiarios) => {
    if(!ativo(u)) return false;
    const p = perfil(u);
    return p.includes('TECNIC') || p.includes('ADMIN') || (incluirEstagiarios && p.includes('ESTAG'));
  };
  const normalizar = u => ({
    ...u,
    nome: txt(u?.nome || u?.nome_completo || u?.display_name || u?.email),
    email: txt(u?.email).toLowerCase(),
    perfil: txt(u?.perfil || u?.role || u?.tipo_perfil || u?.tipo),
    nte: nteTexto(u),
    ativo: ativo(u)
  });
  const cliente = () => {
    try {
      return w.SIGEE_SUPABASE_CLIENT || w.sigEESupabaseClient || w.supabaseClient || w.__SIGEE_V38_CLIENT ||
        w.obterSupabaseSIGEE?.() || w.criarClienteSupabaseSIGEE?.() || w.SIGEE_SUPABASE?.criarCliente?.() || null;
    } catch(_) { return null; }
  };

  async function consultarOficial(tentativas=3){
    let ultimoErro = null;
    for(let i=0;i<Math.max(1,tentativas);i++){
      try{
        const c = cliente();
        if(!c) throw new Error('Cliente Supabase indisponível.');
        const {data,error} = await c.from('usuarios_sigee').select('*');
        if(error) throw error;
        return {ok:true, dados:Array.isArray(data)?data:[], erro:null};
      }catch(e){
        ultimoErro = e;
        if(i < tentativas-1) await sleep(350 * (i+1));
      }
    }
    return {ok:false, dados:[], erro:ultimoErro};
  }

  async function listar({nte='', incluirEstagiarios=false, tentativas=3}={}){
    const alvo = txt(nte);
    const resp = await consultarOficial(tentativas);
    if(!resp.ok){
      console.error('[SIGEE RC10.8.41] Falha ao consultar diretório oficial de responsáveis.', resp.erro);
      return {ok:false, lista:[], erro:resp.erro, nte:alvo, fonte:'usuarios_sigee'};
    }

    const mapa = new Map();
    resp.dados.map(normalizar).forEach(u => {
      if(!u.nome || !u.email) return;
      const chave = u.email || `${norm(u.nome)}|${norm(u.nte)}`;
      mapa.set(chave,u);
    });

    let lista = [...mapa.values()].filter(u => elegivel(u, incluirEstagiarios));
    if(alvo) lista = lista.filter(u => mesmoNte(u.nte, alvo));
    lista.sort((a,b) => txt(a.nome).localeCompare(txt(b.nome),'pt-BR'));

    // Publica somente o retrato oficial retornado pelo Supabase; nunca acrescenta cache legado.
    try { w.__SIGEE_USUARIOS_OFICIAIS = resp.dados.map(normalizar); } catch(_) {}
    return {ok:true, lista, erro:null, nte:alvo, fonte:'usuarios_sigee'};
  }

  async function preencherSelect(select, {nte='', incluirEstagiarios=false, placeholder='Selecione o profissional...', vazio='Nenhum profissional ativo cadastrado para este NTE.', erro='Não foi possível carregar os profissionais. Tente novamente.'}={}){
    if(!select) return {ok:false,lista:[],erro:new Error('Select inexistente')};
    select.disabled = true;
    select.innerHTML = '<option value="">Carregando cadastro oficial...</option>';
    const r = await listar({nte,incluirEstagiarios,tentativas:3});
    select.innerHTML = `<option value="">${placeholder}</option>`;
    if(!r.ok){
      const o=document.createElement('option'); o.disabled=true; o.textContent=erro; select.appendChild(o); select.disabled=false; return r;
    }
    r.lista.forEach(u=>{
      const o=document.createElement('option');
      o.value=u.nome; o.textContent=`${u.nome}${u.nte?' — '+u.nte:''}`;
      o.dataset.email=u.email||''; o.dataset.nte=u.nte||''; o.dataset.perfil=u.perfil||'';
      select.appendChild(o);
    });
    if(!r.lista.length){ const o=document.createElement('option'); o.disabled=true; o.textContent=vazio; select.appendChild(o); }
    select.disabled=false;
    return r;
  }

  w.SIGEE_DIRETORIO_RESPONSAVEIS = Object.freeze({listar, preencherSelect, normalizar, mesmoNte, nteNumero});

  // Autoridade final para o Desarquivamento.
  w.preencherResponsaveisDesarquivamentoSIGEE = async function(selectId, nteFiltro){
    const select=document.getElementById(selectId);
    if(!select) return [];
    const nte=txt(nteFiltro || w.usuarioLogado?.nte || '');
    const r=await preencherSelect(select,{
      nte,
      incluirEstagiarios:false,
      placeholder:'-- Selecione o Servidor --',
      vazio:`Nenhum técnico/administrador ativo cadastrado para ${nte || 'este NTE'}.`,
      erro:'Falha ao carregar o cadastro oficial. Feche e abra novamente a etapa.'
    });
    try { w.validarDesarquivamentoV27?.(); } catch(_) {}
    return r.lista || [];
  };

  console.info('[SIGEE] RC10.8.41 Diretório Único de Responsáveis ativo.');
})(window);
