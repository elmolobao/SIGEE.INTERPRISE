/*
 * SIGEE - Core Filtros NTE v1
 * Correção focada: usa nte_id como referência principal, preserva login e melhora filtros.
 * Carregar depois de frontend/js/app.js.
 */
(function(){
  'use strict';

  function txt(v){ return (v === undefined || v === null) ? '' : String(v).trim(); }
  function mai(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
  function nteIdDe(v){
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    if (n && !Number.isNaN(n)) return n;
    const m = txt(v).match(/\d{1,2}/);
    return m ? Number(m[0]) : null;
  }
  function nteTexto(id){ return id ? ('NTE ' + String(id).padStart(2,'0')) : 'SEC - TODOS OS NTES'; }
  function perfilUsuario(u){ return mai(u && u.perfil).replace('É','E'); }
  function perfilGlobal(u){
    const p = perfilUsuario(u);
    return p.includes('MASTER') || p === 'SEC' || p.includes('TODOS OS NTES');
  }
  function nteIdUsuario(){
    try { return nteIdDe(usuarioLogado && (usuarioLogado.nte_id || usuarioLogado.nte)); } catch(e){ return null; }
  }
  function mesmoNte(reg){
    try {
      if (perfilGlobal(usuarioLogado)) return true;
      const idUser = nteIdUsuario();
      if (!idUser) return false;
      const idReg = nteIdDe(reg && (reg.nte_id || reg.nte));
      return idReg === idUser;
    } catch(e){ return false; }
  }
  function listaFiltradaNte(lista){ return (Array.isArray(lista) ? lista : []).filter(mesmoNte); }

  // Converte usuários preservando perfil e nte_id reais do Supabase.
  window.usuarioDoSupabaseParaLocalSIGEE = function(u, indice){
    const email = txt(u.email).toLowerCase();
    const perfilRaw = txt(u.perfil || u.tipo || u.role || 'Tecnico');
    const perfilNorm = mai(perfilRaw);
    let perfil = 'Tecnico';
    if (perfilNorm.includes('MASTER')) perfil = 'Master';
    else if (perfilNorm === 'SEC') perfil = 'SEC';
    else if (perfilNorm.includes('ADMIN')) perfil = 'Administrador';
    else if (perfilNorm.includes('CONSULT')) perfil = 'Consulta';
    else if (perfilNorm.includes('TECN')) perfil = 'Tecnico';
    if (email === 'elmo.lobao@enova.educacao.ba.gov.br') perfil = 'Master';

    const idNte = nteIdDe(u.nte_id || u.nte);
    const ativo = (u.ativo !== undefined && u.ativo !== null) ? !!u.ativo : ((u.Ativo !== undefined && u.Ativo !== null) ? !!u.Ativo : true);
    return {
      id: Number(u.id) || (indice + 1),
      nome: mai(u.nome || u.name || 'OPERADOR SIGEE'),
      email,
      senha: txt(u.senha || u.senha_hash || u.password || '123'),
      perfil,
      nte_id: idNte,
      nte: perfilGlobal({perfil}) ? 'SEC - TODOS OS NTES' : nteTexto(idNte),
      ativo
    };
  };

  window.escolaDoSupabaseParaLocalSIGEE = function(e, indice){
    const idNte = nteIdDe(e.nte_id || e.nte);
    return {
      id: Number(e.id) || (indice + 1),
      cod_mec: txt(e.cod_mec || e.codigo_mec || e.mec),
      nome: mai(e.nome_escola || e.nome || e.instituicao),
      municipio: mai(e.municipio || e.cidade),
      nte_id: idNte,
      nte: nteTexto(idNte),
      dependencia: txt(e.dependencia_adm || e.dependencia || 'Estadual'),
      situacao: txt(e.situacao_funcional || e.situacao || 'Extinta'),
      acervo: txt(e.status_acervo || e.acervo || 'Recolhido'),
      local_acervo: txt(e.local_acervo || e.local_do_acervo || e.local || 'Acervo do NTE'),
      ativo: e.ativo !== false
    };
  };

  window.processoDoSupabaseParaLocalSIGEE = function(p, indice){
    const idNte = nteIdDe(p.nte_id || p.nte);
    return {
      id: Number(p.id) || (101 + indice),
      aluno: mai(p.aluno_nome || p.aluno || p.nome_aluno || p.requerente),
      escola: mai(p.escola_nome || p.escola || p.instituicao || p.nome_escola),
      documento: txt(p.documento_tipo || p.documento || p.tipo_documento || 'HISTÓRICO'),
      etapa: txt(p.etapa_atual || p.etapa || p.status || 'Desarquivamento'),
      data_etapa_atual: txt(p.data_etapa_atual || p.data_etapa || p.created_at || ''),
      nte_id: idNte,
      nte: nteTexto(idNte),
      municipio: mai(p.municipio || p.cidade || '')
    };
  };

  window.usuarioParaSupabaseSIGEE = function(u){
    const idNte = nteIdDe(u.nte_id || u.nte);
    return {
      nome: mai(u.nome),
      email: txt(u.email).toLowerCase(),
      senha: txt(u.senha || u.senha_hash || '123'),
      senha_hash: txt(u.senha || u.senha_hash || '123'),
      perfil: txt(u.perfil || 'Tecnico'),
      nte_id: idNte,
      nte: perfilGlobal(u) ? 'SEC - TODOS OS NTES' : nteTexto(idNte),
      ativo: u.ativo !== false,
      Ativo: u.ativo !== false,
      forcar_troca_senha: false
    };
  };

  window.carregarDadosDashboardReal = function(){
    const escolasVisiveis = listaFiltradaNte(escolasDB);
    const procVisiveis = listaFiltradaNte(processosDB);
    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.innerText = valor; };
    set('dash-escolas', escolasVisiveis.length);
    set('dash-acervos', escolasVisiveis.filter(e => mai(e.acervo).includes('RECOLH')).length);
    set('dash-estaduais', escolasVisiveis.filter(e => mai(e.dependencia).includes('ESTAD')).length);
    set('dash-municipios', [...new Set(escolasVisiveis.map(e => e.municipio))].filter(Boolean).length);
    set('dash-usuarios', (usuariosDB || []).length);
    set('dash-proc-desarquivamento', procVisiveis.filter(p => p.etapa === 'Desarquivamento').length);
    set('dash-proc-analise', procVisiveis.filter(p => p.etapa === 'Análise').length);
    set('dash-proc-pendencia', procVisiveis.filter(p => p.etapa === 'Pendência').length);
    set('dash-proc-digitacao', procVisiveis.filter(p => p.etapa === 'Digitação').length);
    set('dash-proc-conferencia', procVisiveis.filter(p => p.etapa === 'Conferência').length);
    set('dash-proc-assinatura', procVisiveis.filter(p => p.etapa === 'Assinatura').length);
    set('dash-proc-aguardando', procVisiveis.filter(p => p.etapa === 'Aguardando Retirada').length);
    set('dash-proc-retirado', procVisiveis.filter(p => p.etapa === 'Retirado').length);
  };

  window.renderizarListaEscolasBufferMemoria = function(){
    const corpo = document.getElementById('tabela-escolas-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    let filtradas = listaFiltradaNte(escolasDB);
    const termo = mai(document.getElementById('busca-escola')?.value || '');
    if (termo) {
      filtradas = filtradas.filter(e => mai(e.cod_mec).includes(termo) || mai(e.nome).includes(termo) || mai(e.municipio).includes(termo) || mai(e.nte).includes(termo));
    }
    const info = document.getElementById('info-quantidade-escolas-carregadas');
    if (info) info.innerText = `Exibindo: ${filtradas.length} registros | Banco: ${typeof sigEESupabaseOnline !== 'undefined' && sigEESupabaseOnline ? 'Supabase' : 'pendente Supabase'}`;
    const porPagina = (typeof totalPorPaginaEscola !== 'undefined') ? totalPorPaginaEscola : 8;
    let paginasTotais = Math.max(1, Math.ceil(filtradas.length / porPagina));
    if (typeof paginaEscolaAtual === 'undefined') window.paginaEscolaAtual = 1;
    if (paginaEscolaAtual > paginasTotais) paginaEscolaAtual = paginasTotais;
    if (paginaEscolaAtual < 1) paginaEscolaAtual = 1;
    const inicio = (paginaEscolaAtual - 1) * porPagina;
    filtradas.slice(inicio, inicio + porPagina).forEach(e => {
      const acervoClasse = mai(e.acervo).includes('NAO') ? 'text-red-300' : 'text-green-300';
      const situacaoClasse = mai(e.situacao).includes('ATIVA') ? 'text-green-300' : 'text-red-300';
      corpo.innerHTML += `
        <tr class="hover:bg-white/5 text-[12px] text-white/90 border-b border-white/10">
          <td class="p-3 font-mono font-bold">${e.cod_mec || '-'}</td>
          <td class="p-3 font-extrabold uppercase text-white">${e.nome || '-'}</td>
          <td class="p-3 uppercase font-semibold">${e.municipio || '-'}</td>
          <td class="p-3 font-semibold">${e.nte || '-'}<br><span class="text-[10px] font-bold opacity-70">${e.dependencia || '-'}</span></td>
          <td class="p-3 font-extrabold ${situacaoClasse}">${e.situacao || '-'}</td>
          <td class="p-3 font-extrabold ${acervoClasse}">${e.acervo || '-'}</td>
          <td class="p-3 text-center"><button onclick="if(typeof abrirModalEditarEscolaSIGEE==='function') abrirModalEditarEscolaSIGEE(${e.id});" class="text-cyan-200 font-bold">Alterar</button></td>
        </tr>`;
    });
    const txtPag = document.getElementById('txt-escola-paginacao');
    if (txtPag) txtPag.innerText = `Página ${paginaEscolaAtual} de ${paginasTotais}`;
    const ant = document.getElementById('btn-escola-anterior'); if (ant) ant.disabled = paginaEscolaAtual <= 1;
    const prox = document.getElementById('btn-escola-proxima'); if (prox) prox.disabled = paginaEscolaAtual >= paginasTotais;
  };

  window.carregarEContarProcessosHorizontais = function(){
    const visiveis = listaFiltradaNte(processosDB);
    const set = (id, valor) => { const el = document.getElementById(id); if(el) el.innerText = valor; };
    set('count-horiz-todos', visiveis.length);
    set('count-horiz-desarquivamento', visiveis.filter(p => p.etapa === 'Desarquivamento').length);
    set('count-horiz-analise', visiveis.filter(p => p.etapa === 'Análise').length);
    set('count-horiz-pendencia', visiveis.filter(p => p.etapa === 'Pendência').length);
    set('count-horiz-digitacao', visiveis.filter(p => p.etapa === 'Digitação').length);
    set('count-horiz-conferencia', visiveis.filter(p => p.etapa === 'Conferência').length);
    set('count-horiz-assinatura', visiveis.filter(p => p.etapa === 'Assinatura').length);
    set('count-horiz-aguardando', visiveis.filter(p => p.etapa === 'Aguardando Retirada').length);
    set('count-horiz-retirado', visiveis.filter(p => p.etapa === 'Retirado').length);
    if (typeof renderizarProcessosFlutuantes === 'function') renderizarProcessosFlutuantes();
  };

  // Re-render automático após a carga assíncrona do banco.
  const syncOriginal = window.sincronizarSupabaseSegundoPlanoSIGEE;
  if (typeof syncOriginal === 'function') {
    window.sincronizarSupabaseSegundoPlanoSIGEE = async function(){
      const r = await syncOriginal.apply(this, arguments);
      try {
        if (typeof carregarDadosDashboardReal === 'function') carregarDadosDashboardReal();
        if (!document.getElementById('aba-escolas')?.classList.contains('hidden')) renderizarListaEscolasBufferMemoria();
        if (!document.getElementById('aba-processos')?.classList.contains('hidden')) carregarEContarProcessosHorizontais();
      } catch(e){ console.warn('[SIGEE] pós-sync falhou', e); }
      return r;
    };
  }

  console.info('[SIGEE] Core Filtros NTE v1 ativo');
})();
