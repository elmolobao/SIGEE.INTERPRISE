/**
 * SIGEE Enterprise RC8.0.0 — Store territorial protegido de processos.
 * Único ponto autorizado para publicar, inserir, atualizar e remover processos
 * na memória compartilhada da aplicação.
 */
(function (window) {
  'use strict';
  if (window.__SIGEE_PROCESSOS_STORE_RC800__) return;
  window.__SIGEE_PROCESSOS_STORE_RC800__ = true;

  let dados = [];
  let proxy = null;
  let publicando = false;

  function usuario() {
    return window.SIGEE_AUTORIZACAO?.usuario?.() ||
      window.SIGEE_SESSION?.getUser?.() ||
      window.usuarioLogado || null;
  }

  function permitido(registro, u = usuario()) {
    if (!registro) return false;
    const escopo = window.SIGEE_ESCOPO;
    if (!escopo?.validarRegistro) return false; // fail closed
    return escopo.validarRegistro(registro, u) === true;
  }

  function sanitizar(lista, u = usuario()) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [];
    const escopo = window.SIGEE_ESCOPO;
    if (!escopo?.filtrar) return [];
    const filtrada = escopo.filtrar(arr, u);
    const vistos = new Set();
    return filtrada.filter((p) => {
      const chave = String(p?.id ?? p?.codigo_sigee ?? p?.workflow_instance_id ?? '');
      if (!chave) return true;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
  }

  function chave(p) {
    return String(p?.id ?? p?.codigo_sigee ?? p?.workflow_instance_id ?? '');
  }

  function emitir(tipo, detalhe = {}) {
    try {
      window.dispatchEvent(new CustomEvent('sigee:processos-store', {
        detail: { tipo, total: dados.length, ...detalhe }
      }));
    } catch (_) {}
  }

  function criarProxy() {
    proxy = new Proxy(dados, {
      get(target, prop, receiver) {
        if (prop === 'push' || prop === 'unshift') {
          return (...itens) => {
            const aceitos = sanitizar(itens);
            if (!aceitos.length) return target.length;
            const resultado = Array.prototype[prop].apply(target, aceitos);
            emitir('MUTACAO', { operacao: prop, aceitos: aceitos.length });
            return resultado;
          };
        }
        if (prop === 'splice') {
          return (inicio, remover, ...itens) => {
            const aceitos = sanitizar(itens);
            const resultado = Array.prototype.splice.call(target, inicio, remover, ...aceitos);
            emitir('MUTACAO', { operacao: 'splice', aceitos: aceitos.length });
            return resultado;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, valor, receiver) {
        if (/^\d+$/.test(String(prop)) && valor && !permitido(valor)) {
          console.warn('[SIGEE STORE] Registro territorial indevido descartado.', valor);
          return true;
        }
        return Reflect.set(target, prop, valor, receiver);
      }
    });
  }

  function publicar(lista, origem = 'DESCONHECIDA') {
    const limpa = sanitizar(lista);
    dados.splice(0, dados.length, ...limpa);
    emitir('PUBLICAR', { origem });
    return proxy;
  }

  function upsert(registro, origem = 'DESCONHECIDA') {
    if (!permitido(registro)) {
      console.warn('[SIGEE STORE] Upsert bloqueado por escopo territorial.', { origem, registro });
      return null;
    }
    const k = chave(registro);
    const i = k ? dados.findIndex((p) => chave(p) === k) : -1;
    if (i >= 0) dados[i] = { ...dados[i], ...registro };
    else dados.unshift(registro);
    emitir('UPSERT', { origem, id: registro?.id ?? null });
    return registro;
  }

  function remover(id, origem = 'DESCONHECIDA') {
    const k = String(id ?? '');
    const i = dados.findIndex((p) => chave(p) === k || String(p?.id ?? '') === k);
    if (i >= 0) dados.splice(i, 1);
    emitir('REMOVER', { origem, id });
    return i >= 0;
  }

  function obter() { return proxy; }
  function snapshot() { return sanitizar(dados); }
  function reconciliar(origem = 'RECONCILIACAO') { return publicar(dados, origem); }

  criarProxy();

  // Compatibilidade: toda atribuição global passa pelo store.
  try {
    const existente = Array.isArray(window.processosDB) ? window.processosDB.slice() : [];
    Object.defineProperty(window, 'processosDB', {
      configurable: true,
      enumerable: true,
      get: obter,
      set(valor) {
        if (publicando) return;
        publicando = true;
        try { publicar(valor, 'ATRIBUICAO_GLOBAL'); }
        finally { publicando = false; }
      }
    });
    publicar(existente, 'BOOTSTRAP');
  } catch (erro) {
    console.warn('[SIGEE STORE] Não foi possível proteger window.processosDB.', erro);
  }

  window.SIGEE_PROCESSOS_STORE = Object.freeze({
    usuario, permitido, sanitizar, publicar, upsert, remover,
    obter, snapshot, reconciliar, versao: 'RC8.0.0'
  });
})(window);
