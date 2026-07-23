/**
 * SIGEE Enterprise RC5.4.2 — Catálogo oficial de perfis.
 * Autoridade única para nomenclatura, apresentação, natureza e rota inicial.
 */
(function (window) {
  'use strict';
  if (window.__SIGEE_PERFIS_RC542__) return;
  window.__SIGEE_PERFIS_RC542__ = true;

  const PERFIS = Object.freeze([
    Object.freeze({ key:'MASTER', value:'Master', label:'Master', titulo:'MASTER', subtitulo:'SEC - TODOS OS NTEs', escopo:'GLOBAL', natureza:'ADMINISTRACAO_GLOBAL', rotaInicial:'processos' }),
    Object.freeze({ key:'SEC', value:'SEC', label:'SEC', titulo:'VISÃO ESTADUAL', subtitulo:'SEC / BA', escopo:'GLOBAL', natureza:'ACOMPANHAMENTO_ESTADUAL', rotaInicial:'processos' }),
    Object.freeze({ key:'GESTOR', value:'Gestor', label:'Gestor Territorial', titulo:'GESTOR TERRITORIAL', subtitulo:'NTE vinculado', escopo:'NTE', natureza:'GESTAO_TERRITORIAL', rotaInicial:'painel' }),
    Object.freeze({ key:'ADMINISTRADOR', value:'Administrador', label:'Administrador Territorial', titulo:'ADMINISTRADOR TERRITORIAL', subtitulo:'NTE vinculado', escopo:'NTE', natureza:'ADMINISTRACAO_TERRITORIAL', rotaInicial:'processos' }),
    Object.freeze({ key:'TECNICO', value:'Técnico', label:'Técnico', titulo:'TÉCNICO DO NTE', subtitulo:'NTE vinculado', escopo:'NTE', natureza:'OPERACAO_TECNICA', rotaInicial:'processos' }),
    Object.freeze({ key:'ATENDIMENTO', value:'Atendimento', label:'Atendimento', titulo:'ATENDIMENTO TERRITORIAL', subtitulo:'NTE vinculado', escopo:'NTE', natureza:'ATENDIMENTO_PROTOCOLO', rotaInicial:'processos' }),
    Object.freeze({ key:'ESTAGIARIO', value:'Estagiário', label:'Estagiário', titulo:'APOIO OPERACIONAL', subtitulo:'NTE vinculado', escopo:'NTE', natureza:'APOIO_PROTOCOLO', rotaInicial:'processos' }),
    Object.freeze({ key:'CONSULTA', value:'Consulta', label:'Consulta', titulo:'CONSULTA TERRITORIAL', subtitulo:'NTE vinculado', escopo:'NTE', natureza:'LEITURA_TERRITORIAL', rotaInicial:'processos' })
  ]);

  const POR_CHAVE=Object.freeze(PERFIS.reduce((a,p)=>(a[p.key]=p,a),{}));
  const POR_VALOR=Object.freeze(PERFIS.reduce((a,p)=>(a[p.value]=p,a),{}));

  function token(value){return String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_');}
  function normalizar(value){
    const t=token(value); if(!t)return '';
    if(t==='SEC'||t.includes('SECRETARIA'))return 'SEC';
    if(t.includes('MASTER'))return 'Master';
    if(t.includes('GESTOR')||t.includes('DIRIGENTE'))return 'Gestor';
    if(t.includes('ADMIN'))return 'Administrador';
    if(t.includes('ATEND'))return 'Atendimento';
    if(t.includes('ESTAG'))return 'Estagiário';
    if(t.includes('CONSULT'))return 'Consulta';
    if(t.includes('TECNIC'))return 'Técnico';
    return '';
  }
  function chave(value){return POR_VALOR[normalizar(value)]?.key||'';}
  function obter(value){return POR_VALOR[normalizar(value)]||null;}
  function escopo(value){return obter(value)?.escopo||'';}
  function ehTerritorial(value){return escopo(value)==='NTE';}
  function ehGlobal(value){return escopo(value)==='GLOBAL';}
  function listar(){return PERFIS.slice();}
  function preencherSelect(select,valorAtual,incluirPlaceholder){
    if(!select)return false;
    const atual=normalizar(valorAtual??select.value);
    select.innerHTML=(incluirPlaceholder?'<option value="">Selecione o Perfil</option>':'')+PERFIS.map(p=>`<option value="${p.value}">${p.label}</option>`).join('');
    if(atual)select.value=atual;
    return true;
  }
  function garantirSelects(root){
    const base=root?.querySelectorAll?root:document, vistos=new Set();
    ['#user-form-perfil','#usuario-perfil','#perfil-usuario','select[name="perfil"]','select[data-sigee-perfis]'].forEach(sel=>base.querySelectorAll(sel).forEach(select=>{
      if(vistos.has(select))return; vistos.add(select); const atual=select.value;
      preencherSelect(select,atual,Array.from(select.options||[]).some(o=>!o.value));
    }));
    return vistos.size;
  }

  window.SIGEE_PERFIS=Object.freeze({LISTA:PERFIS,POR_CHAVE,POR_VALOR,normalizar,chave,obter,escopo,ehTerritorial,ehGlobal,listar,preencherSelect,garantirSelects});
})(window);
