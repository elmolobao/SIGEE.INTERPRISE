/**
 * SIGEE Enterprise RC8.2.0 — Store autoritativo de processos.
 * A Central paginada/Realtime é a única autoridade após o primeiro carregamento.
 * Escritas legadas continuam aceitas apenas durante o bootstrap, antes do lock.
 */
(function (window) {
  'use strict';
  if (window.__SIGEE_PROCESSOS_STORE_RC820__) return;
  window.__SIGEE_PROCESSOS_STORE_RC820__ = true;

  let dados = [];
  let proxy = null;
  let publicando = false;
  let autoridadeBloqueada = false;
  let ultimaOrigem = 'BOOTSTRAP';

  function usuario() {
    return window.SIGEE_SESSION?.getUser?.() ||
      window.SIGEE_AUTORIZACAO?.usuario?.() ||
      window.usuarioLogado || window.usuarioAtual || null;
  }

  function temUsuarioValido(u = usuario()) {
    return Boolean(u && (u.id || u.email || u.perfil));
  }

  function permitido(registro, u = usuario()) {
    if (!registro) return false;
    if (!temUsuarioValido(u)) return true; // bootstrap: consulta remota aplicará o escopo após login
    const escopo = window.SIGEE_ESCOPO;
    if (!escopo?.validarRegistro) return false;
    return escopo.validarRegistro(registro, u) === true;
  }

  function sanitizar(lista, u = usuario()) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [];
    let filtrada = arr;
    if (temUsuarioValido(u)) {
      const escopo = window.SIGEE_ESCOPO;
      if (!escopo?.filtrar) return [];
      filtrada = escopo.filtrar(arr, u);
    }
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
        detail: { tipo, total: dados.length, origem: ultimaOrigem, bloqueado: autoridadeBloqueada, ...detalhe }
      }));
    } catch (_) {}
  }

  function criarProxy() {
    proxy = new Proxy(dados, {
      get(target, prop, receiver) {
        if (prop === 'push' || prop === 'unshift') {
          return (...itens) => {
            if (autoridadeBloqueada) {
              console.warn('[SIGEE STORE] Mutação legada ignorada após lock autoritativo:', prop);
              return target.length;
            }
            const aceitos = sanitizar(itens);
            if (!aceitos.length) return target.length;
            const resultado = Array.prototype[prop].apply(target, aceitos);
            emitir('MUTACAO_LEGADA', { operacao: prop, aceitos: aceitos.length });
            return resultado;
          };
        }
        if (prop === 'splice') {
          return (inicio, remover, ...itens) => {
            if (autoridadeBloqueada && itens.length) {
              console.warn('[SIGEE STORE] Inserção legada por splice ignorada após lock autoritativo.');
              return [];
            }
            const aceitos = sanitizar(itens);
            const resultado = Array.prototype.splice.call(target, inicio, remover, ...aceitos);
            emitir('MUTACAO', { operacao: 'splice', aceitos: aceitos.length });
            return resultado;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, valor, receiver) {
        if (/^\d+$/.test(String(prop))) {
          if (autoridadeBloqueada) {
            console.warn('[SIGEE STORE] Escrita indexada legada ignorada após lock autoritativo.');
            return true;
          }
          if (valor && !permitido(valor)) return true;
        }
        return Reflect.set(target, prop, valor, receiver);
      }
    });
  }

  function publicar(lista, origem = 'DESCONHECIDA', opcoes = {}) {
    const limpa = sanitizar(lista);
    dados.splice(0, dados.length, ...limpa);
    ultimaOrigem = origem;
    if (opcoes.autoritativa === true) autoridadeBloqueada = true;
    emitir('PUBLICAR', { origem, autoritativa: opcoes.autoritativa === true });
    return proxy;
  }

  function publicarAutoritativo(lista, origem = 'CENTRAL_REMOTA') {
    return publicar(lista, origem, { autoritativa: true });
  }

  function upsert(registro, origem = 'REALTIME') {
    if (!permitido(registro)) {
      console.warn('[SIGEE STORE] Upsert bloqueado por escopo territorial.', { origem, registro });
      return null;
    }
    const k = chave(registro);
    const i = k ? dados.findIndex((p) => chave(p) === k) : -1;
    if (i >= 0) dados[i] = { ...dados[i], ...registro };
    else dados.unshift(registro);
    ultimaOrigem = origem;
    autoridadeBloqueada = true;
    emitir('UPSERT', { origem, id: registro?.id ?? null });
    return registro;
  }

  function remover(id, origem = 'REALTIME') {
    const k = String(id ?? '');
    const i = dados.findIndex((p) => chave(p) === k || String(p?.id ?? '') === k);
    if (i >= 0) dados.splice(i, 1);
    ultimaOrigem = origem;
    emitir('REMOVER', { origem, id });
    return i >= 0;
  }

  function obter() { return proxy; }
  function snapshot() { return dados.slice(); }
  function estaBloqueado() { return autoridadeBloqueada; }
  function desbloquearBootstrap() { autoridadeBloqueada = false; }

  criarProxy();

  try {
    const existente = Array.isArray(window.processosDB) ? window.processosDB.slice() : [];
    Object.defineProperty(window, 'processosDB', {
      configurable: true,
      enumerable: true,
      get: obter,
      set(valor) {
        if (publicando) return;
        if (autoridadeBloqueada) {
          console.warn('[SIGEE STORE] Substituição global legada ignorada após lock autoritativo.');
          return;
        }
        publicando = true;
        try { publicar(valor, 'ATRIBUICAO_GLOBAL_LEGADA'); }
        finally { publicando = false; }
      }
    });
    publicar(existente, 'BOOTSTRAP');
  } catch (erro) {
    console.warn('[SIGEE STORE] Não foi possível proteger window.processosDB.', erro);
  }

  window.SIGEE_PROCESSOS_STORE = Object.freeze({
    usuario, permitido, sanitizar, publicar, publicarAutoritativo, upsert, remover,
    obter, snapshot, estaBloqueado, desbloquearBootstrap, versao: 'RC8.2.0'
  });
})(window);
