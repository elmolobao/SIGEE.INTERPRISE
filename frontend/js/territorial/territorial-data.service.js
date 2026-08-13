/**
 * SIGEE Enterprise — Central de Gestão Territorial
 * Fonte territorial: mapa oficial dos NTEs fornecido para o projeto (SEI/DIGEO/CARTGEO, jan/2024).
 * Fundação: metadados territoriais + leitura não destrutiva da produção já carregada no SIGEE.
 */
(function(window){
  'use strict';
  if (window.SIGEE_TERRITORIAL_DATA) return;

  const NTES = Object.freeze([
    {numero:1, sede:'Irecê', municipios:20},
    {numero:2, sede:'Bom Jesus da Lapa', municipios:16},
    {numero:3, sede:'Seabra', municipios:24},
    {numero:4, sede:'Serrinha', municipios:20},
    {numero:5, sede:'Itabuna', municipios:26},
    {numero:6, sede:'Valença', municipios:15},
    {numero:7, sede:'Teixeira de Freitas', municipios:13},
    {numero:8, sede:'Itapetinga', municipios:13},
    {numero:9, sede:'Amargosa', municipios:20},
    {numero:10, sede:'Juazeiro', municipios:10},
    {numero:11, sede:'Barreiras', municipios:14},
    {numero:12, sede:'Macaúbas', municipios:8},
    {numero:13, sede:'Caetité', municipios:20},
    {numero:14, sede:'Itaberaba', municipios:13},
    {numero:15, sede:'Ipirá', municipios:15},
    {numero:16, sede:'Jacobina', municipios:9},
    {numero:17, sede:'Ribeira do Pombal', municipios:18},
    {numero:18, sede:'Alagoinhas', municipios:20},
    {numero:19, sede:'Feira de Santana', municipios:17},
    {numero:20, sede:'Vitória da Conquista', municipios:24},
    {numero:21, sede:'Santo Antônio de Jesus', municipios:19},
    {numero:22, sede:'Jequié', municipios:16},
    {numero:23, sede:'Santa Maria da Vitória', municipios:11},
    {numero:24, sede:'Paulo Afonso', municipios:6},
    {numero:25, sede:'Senhor do Bonfim', municipios:9},
    {numero:26, sede:'Salvador', municipios:13},
    {numero:27, sede:'Eunápolis', municipios:8}
  ].map(n=>Object.freeze({...n,codigo:`NTE ${String(n.numero).padStart(2,'0')}`})));

  function texto(v){
    return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
  }

  function numeroNte(valor){
    const t=texto(valor);
    const m=t.match(/(?:NTE\s*)?(\d{1,2})/);
    if(m){
      const n=Number(m[1]);
      if(n>=1&&n<=27) return n;
    }
    const porSede=NTES.find(n=>texto(n.sede)===t || t.includes(texto(n.sede)));
    return porSede?.numero || null;
  }

  function processos(){
    return Array.isArray(window.processosDB) ? window.processosDB : [];
  }

  function producaoPorNte(){
    const mapa=new Map(NTES.map(n=>[n.numero,0]));
    processos().forEach(p=>{
      const n=numeroNte(p?.nte ?? p?.nte_nome ?? p?.nte_id);
      if(n && mapa.has(n)) mapa.set(n,(mapa.get(n)||0)+1);
    });
    return NTES.map(n=>({...n,processos:mapa.get(n.numero)||0}));
  }

  function resumo(){
    const producao=producaoPorNte();
    return {
      ntes:NTES.length,
      municipios:NTES.reduce((s,n)=>s+n.municipios,0),
      processos:producao.reduce((s,n)=>s+n.processos,0),
      ntesComProducao:producao.filter(n=>n.processos>0).length,
      producao
    };
  }

  window.SIGEE_TERRITORIAL_DATA=Object.freeze({NTES,numeroNte,producaoPorNte,resumo,versao:'GT-02.0'});
})(window);
