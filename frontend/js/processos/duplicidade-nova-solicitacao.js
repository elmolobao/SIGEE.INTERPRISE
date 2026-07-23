/**
 * SIGEE RC4.5.29 — Serviço único de validação de duplicidade da Nova Solicitação.
 * Regra: Nome completo normalizado + escola selecionada.
 * Não altera cadastro, workflow, autenticação ou edição de processo.
 */
(function (window, document) {
  'use strict';

  const IDS = Object.freeze({
    modal: 'modal-nova-solicitacao',
    aluno: 'novo-proc-aluno',
    escola: 'novo-proc-escola',
    botao: 'btn-submeter-nova-solicitacao',
    buscaProcessos: 'busca-proc-nome'
  });

  const ETAPAS_FINALIZADAS = new Set(['RETIRADO', 'INDEFERIDO']);

  function el(id) { return document.getElementById(id); }
  function texto(valor) { return valor == null ? '' : String(valor).trim(); }
  function normalizar(valor) {
    return texto(valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
  function escapar(valor) {
    return texto(valor).replace(/[&<>"']/g, caractere => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caractere]);
  }
  function cliente() {
    try {
      if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') {
        return window.SIGEE_SUPABASE.criarCliente();
      }
      if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
      if (window.sigeeSupabase && typeof window.sigeeSupabase.from === 'function') return window.sigeeSupabase;
      if (typeof window.obterSupabaseSIGEE === 'function') return window.obterSupabaseSIGEE();
    } catch (erro) {
      console.warn('[SIGEE Duplicidade] Cliente Supabase indisponível.', erro);
    }
    return null;
  }
  function tabelaProcessos() {
    return window.SIGEE_CONFIG?.supabase?.tabelas?.processos ||
      window.SIGEE_SUPABASE_TABELAS?.processos || 'processos';
  }

  function escolaSelecionada() {
    const campo = el(IDS.escola);
    if (!campo) return { id: '', nome: '' };
    const opcao = campo.options?.[campo.selectedIndex] || null;
    return {
      id: texto(
        campo.dataset?.escolaId || campo.dataset?.id || opcao?.dataset?.escolaId ||
        opcao?.dataset?.id || campo.value
      ),
      nome: texto(
        campo.dataset?.escolaNome || opcao?.dataset?.escolaNome ||
        opcao?.textContent || campo.value
      )
    };
  }

  function nomeDoProcesso(processo) {
    return texto(processo?.aluno_nome || processo?.aluno || processo?.nome_solicitante || processo?.requerente_nome);
  }
  function escolaIdDoProcesso(processo) {
    return texto(processo?.escola_id || processo?.id_escola || processo?.escola_codigo || processo?.cod_mec);
  }
  function escolaNomeDoProcesso(processo) {
    return texto(processo?.escola_nome || processo?.escola || processo?.nome_escola);
  }
  function etapaDoProcesso(processo) {
    return texto(processo?.etapa_atual || processo?.etapa || processo?.fase_atual || processo?.status || 'Não informada');
  }
  function codigoDoProcesso(processo) {
    return texto(processo?.codigo_sigee || processo?.codigo || processo?.numero_sigee || processo?.protocolo || processo?.id || 'Registro SIGEE');
  }
  function dataDoProcesso(processo) {
    const valor = processo?.created_at || processo?.criado_em || processo?.data_abertura || processo?.data_solicitacao;
    if (!valor) return 'Não informada';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? texto(valor) : data.toLocaleDateString('pt-BR');
  }
  function responsavelDoProcesso(processo) {
    return texto(
      processo?.tecnico_responsavel || processo?.responsavel || processo?.responsavel_etapa ||
      processo?.analista || processo?.digitador || 'Não informado'
    );
  }
  function finalizado(processo) {
    return ETAPAS_FINALIZADAS.has(normalizar(etapaDoProcesso(processo)));
  }

  function corresponde(processo, nomeNormalizado, escola) {
    if (normalizar(nomeDoProcesso(processo)) !== nomeNormalizado) return false;
    const idRegistro = escolaIdDoProcesso(processo);
    if (escola.id && idRegistro) return texto(idRegistro) === texto(escola.id);
    return normalizar(escolaNomeDoProcesso(processo)) === normalizar(escola.nome);
  }

  async function localizarDuplicidades(nome, escola) {
    const nomeNormalizado = normalizar(nome);
    if (nomeNormalizado.length < 3 || (!escola.id && normalizar(escola.nome).length < 2)) return [];

    let registros = [];
    const supabase = cliente();
    if (supabase) {
      try {
        const termo = texto(nome).replace(/[,%_]/g, ' ').replace(/\s+/g, ' ').trim();
        const resposta = await supabase
          .from(tabelaProcessos())
          .select('*')
          .ilike('aluno_nome', `%${termo}%`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (resposta.error) throw resposta.error;
        if (Array.isArray(resposta.data)) registros = resposta.data;
      } catch (erro) {
        console.warn('[SIGEE Duplicidade] Consulta remota falhou; usando base local.', erro);
      }
    }

    const baseLocal = Array.isArray(window.processosDB) ? window.processosDB : [];
    if (!registros.length && baseLocal.length) registros = baseLocal;

    return registros.filter(processo => corresponde(processo, nomeNormalizado, escola)).slice(0, 10);
  }

  function abrirModal(registros) {
    return new Promise(resolve => {
      const principal = registros[0];
      const fundo = document.createElement('div');
      fundo.id = 'modal-duplicidade-nova-solicitacao';
      fundo.className = 'fixed inset-0 z-[100000] bg-black/65 flex items-center justify-center p-4';
      fundo.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-amber-200">
          <div class="p-5 border-b bg-amber-50">
            <h3 class="text-lg font-black text-amber-800">⚠ Solicitação existente localizada</h3>
          </div>
          <div class="p-5 text-sm text-gray-700 leading-relaxed">
            <p class="font-semibold mb-4">Já existe processo cadastrado para este aluno nesta escola.</p>
            <div class="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p><strong>Código SIGEE:</strong> ${escapar(codigoDoProcesso(principal))}</p>
              <p><strong>Aluno:</strong> ${escapar(nomeDoProcesso(principal))}</p>
              <p><strong>Escola:</strong> ${escapar(escolaNomeDoProcesso(principal))}</p>
              <p><strong>Etapa atual:</strong> ${escapar(etapaDoProcesso(principal))}</p>
              <p><strong>Responsável:</strong> ${escapar(responsavelDoProcesso(principal))}</p>
              <p><strong>Data de abertura:</strong> ${escapar(dataDoProcesso(principal))}</p>
            </div>
            ${registros.length > 1 ? `<p class="mt-3 text-xs font-bold text-amber-700">Foram encontrados ${registros.length} registros coincidentes.</p>` : ''}
            <p class="mt-4 font-semibold text-amber-800">A criação de uma nova solicitação somente continuará após confirmação expressa.</p>
          </div>
          <div class="p-4 bg-gray-50 border-t flex flex-wrap justify-end gap-2" data-acoes></div>
        </div>`;

      const concluir = decisao => { fundo.remove(); resolve(decisao); };
      const acoes = fundo.querySelector('[data-acoes]');
      const botoes = [
        ['Cancelar', 'cancelar', 'bg-gray-200 text-gray-800'],
        ['Visualizar processo', 'visualizar', 'bg-blue-700 text-white']
      ];
      botoes.push(['Continuar e abrir novo chamado', 'continuar', 'bg-amber-600 text-white']);
      botoes.forEach(([rotulo, valor, classe]) => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = `px-4 py-2 rounded-lg font-bold text-sm ${classe}`;
        botao.textContent = rotulo;
        botao.addEventListener('click', () => concluir(valor));
        acoes.appendChild(botao);
      });
      fundo.addEventListener('click', evento => { if (evento.target === fundo) concluir('cancelar'); });
      document.body.appendChild(fundo);
    });
  }

  function visualizar(processo) {
    const codigo = codigoDoProcesso(processo);
    try { if (typeof window.navegar === 'function') window.navegar('processos'); } catch (_) {}
    const busca = el(IDS.buscaProcessos);
    if (busca) {
      busca.value = codigo;
      busca.dispatchEvent(new Event('input', { bubbles: true }));
      busca.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  async function validar() {
    const nome = texto(el(IDS.aluno)?.value);
    const escola = escolaSelecionada();
    const encontrados = await localizarDuplicidades(nome, escola);
    if (!encontrados.length) return true;
    const decisao = await abrirModal(encontrados);
    if (decisao === 'visualizar') visualizar(encontrados[0]);
    return decisao === 'continuar';
  }


  window.SIGEE_DUPLICIDADE_NOVA_SOLICITACAO = Object.freeze({
    validar,
    localizarDuplicidades
  });
  console.info('[SIGEE RC4.5.29] Serviço de duplicidade da Nova Solicitação disponível.');
})(window, document);
