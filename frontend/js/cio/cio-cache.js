(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{}; const store=new Map();
  function get(k){const x=store.get(k);if(!x)return null;if(x.expira<Date.now()){store.delete(k);return null;}return x.valor;}
  function set(k,v,ttl=120000){store.set(k,{valor:v,expira:Date.now()+ttl});return v;}
  function clear(prefix=''){for(const k of store.keys())if(!prefix||String(k).startsWith(prefix))store.delete(k);}
  NS.cache=Object.freeze({get,set,clear,size:()=>store.size});
})(window);