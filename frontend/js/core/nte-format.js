/* SIGEE RC4.5.2 — Núcleo oficial de identificação territorial */
(function(){
  'use strict';
  const NOMES={1:'Irecê',2:'Bom Jesus da Lapa',3:'Seabra',4:'Serrinha',5:'Itabuna',6:'Valença',7:'Teixeira de Freitas',8:'Itapetinga',9:'Amargosa',10:'Juazeiro',11:'Barreiras',12:'Macaúbas',13:'Caetité',14:'Itaberaba',15:'Ipirá',16:'Jacobina',17:'Ribeira do Pombal',18:'Alagoinhas',19:'Feira de Santana',20:'Vitória da Conquista',21:'Santo Antônio de Jesus',22:'Jequié',23:'Santa Maria da Vitória',24:'Paulo Afonso',25:'Senhor do Bonfim',26:'Salvador',27:'Eunápolis'};
  function texto(v){return v==null?'':String(v).trim();}
  function numero(v){
    if(v&&typeof v==='object') v=v.nte_id||v.numero||v.id||v.nte||v.nte_nome||v.grupo;
    const s=texto(v); const m=s.match(/NTE\s*[- ]?\s*(\d{1,2})/i)||s.match(/^\s*(\d{1,2})\s*$/);
    const n=m?Number(m[1]):Number(v); return Number.isInteger(n)&&n>=1&&n<=27?n:null;
  }
  function limparNome(nome,n){
    let s=texto(nome);
    if(!s) return NOMES[n]||'Território';
    s=s.replace(/^NTE\s*[- ]?\s*\d{1,2}\s*[-–—:]?\s*/i,'').replace(/^\(|\)$/g,'').trim();
    return s||NOMES[n]||'Território';
  }
  function formatar(valor,nome){
    const n=numero(valor); if(!n) return texto(valor);
    const territorio=limparNome(nome||NOMES[n],n);
    return `NTE-${String(n).padStart(2,'0')} (${territorio})`;
  }
  function equivalente(a,b){const na=numero(a),nb=numero(b); return !!na&&na===nb;}
  window.SIGEE_NTE=Object.freeze({NOMES,numero,formatar,equivalente,limparNome});
  window.LISTA_OFICIAL_27_NTES=Array.from({length:27},(_,i)=>formatar(i+1));
})();
