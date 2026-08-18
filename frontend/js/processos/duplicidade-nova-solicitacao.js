/**
 * SIGEE RC4.7.0 — Bloqueio definitivo de duplicidade da Nova Solicitação.
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


  async function buscarRemotoPorCampo(supabase, campo, valor) {
    const registros = [];
    const tamanhoPagina = 500;
    let inicio = 0;

    while (true) {
      const resposta = await supabase
        .from(tabelaProcessos())
        .select('id,codigo_sigee,aluno_nome,escola_id,escola_nome,cod_mec,etapa_atual,created_at,tecnico_responsavel')
        .eq(campo, valor)
        .order('created_at', { ascending: false })
        .range(inicio, inicio + tamanhoPagina - 1);

      if (resposta.error) throw resposta.error;
      const lote = Array.isArray(resposta.data) ? resposta.data : [];
      registros.push(...lote);
      if (lote.length < tamanhoPagina) break;
      inicio += tamanhoPagina;
    }
    return registros;
  }

  async function localizarDuplicidades(nome, escola) {
    const nomeNormalizado = normalizar(nome);
    if (nomeNormalizado.length < 3 || (!escola.id && normalizar(escola.nome).length < 2)) return [];

    const supabase = cliente();
    if (!supabase) {
      throw new Error('Cliente Supabase indisponível para validação de duplicidade.');
    }

    let registros = [];
    try {
      const consultas = [];
      if (escola.id) consultas.push(buscarRemotoPorCampo(supabase, 'escola_id', escola.id));
      if (escola.nome) consultas.push(buscarRemotoPorCampo(supabase, 'escola_nome', escola.nome));

      const resultados = await Promise.all(consultas);
      const mapa = new Map();
      resultados.flat().forEach(registro => {
        const chave = texto(registro?.id || registro?.codigo_sigee || `${registro?.aluno_nome}|${registro?.escola_nome}|${registro?.created_at}`);
        if (!mapa.has(chave)) mapa.set(chave, registro);
      });
      registros = Array.from(mapa.values());
    } catch (erro) {
      console.error('[SIGEE Duplicidade RC4.7.0] Falha na consulta oficial ao Supabase.', erro);
      throw new Error('Não foi possível confirmar a inexistência de duplicidade no banco oficial.');
    }

    return registros
      .filter(processo => corresponde(processo, nomeNormalizado, escola))
      .slice(0, 20);
  }

  function garantirEstiloModal() {
    if (document.getElementById('sigee-duplicidade-modal-style')) return;
    const style = document.createElement('style');
    style.id = 'sigee-duplicidade-modal-style';
    style.textContent = `
      #modal-duplicidade-nova-solicitacao {
        position: fixed; inset: 0; z-index: 100000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px; background: rgba(7, 31, 56, .72);
        backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-card {
        width: min(610px, calc(100vw - 28px)); max-height: calc(100vh - 32px);
        overflow: auto; background: #fff; border-radius: 18px;
        border: 1px solid rgba(255,255,255,.72);
        box-shadow: 0 28px 90px rgba(0, 23, 47, .38);
        color: #22344b; font-family: inherit;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-header {
        display: flex; gap: 13px; align-items: center; padding: 20px 22px;
        background: linear-gradient(135deg, #075b9c 0%, #0b75bd 100%);
        color: #fff; border-bottom: 4px solid #f3b229;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-icon {
        width: 38px; height: 38px; flex: 0 0 38px; border-radius: 50%;
        display: grid; place-items: center; background: #fff3cd; color: #9a6100;
        font-size: 20px; box-shadow: inset 0 0 0 1px rgba(154,97,0,.16);
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-header h3 {
        margin: 0; color: #fff; font-size: 18px; line-height: 1.25; font-weight: 900;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-header small {
        display: block; margin-top: 3px; color: #dbeeff; font-size: 11px; font-weight: 700;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-body { padding: 22px; }
      #modal-duplicidade-nova-solicitacao .sigee-dup-intro {
        margin: 0 0 16px; color: #44566d; font-size: 13px; line-height: 1.55; font-weight: 700;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-dados {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px;
        padding: 17px 18px; border-radius: 13px; background: #f5f8fc;
        border: 1px solid #d9e3ef;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-item { min-width: 0; }
      #modal-duplicidade-nova-solicitacao .sigee-dup-item.sigee-largo { grid-column: 1 / -1; }
      #modal-duplicidade-nova-solicitacao .sigee-dup-label {
        display: block; margin-bottom: 3px; color: #60748d; font-size: 10px;
        font-weight: 900; text-transform: uppercase; letter-spacing: .045em;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-valor {
        display: block; color: #172b45; font-size: 12px; line-height: 1.45;
        font-weight: 800; overflow-wrap: anywhere;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-codigo { color: #075b9c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      #modal-duplicidade-nova-solicitacao .sigee-dup-contagem {
        display: flex; align-items: center; gap: 8px; margin-top: 15px; padding: 10px 12px;
        border-radius: 10px; background: #fff7e3; border: 1px solid #f4d48c;
        color: #8c5700; font-size: 12px; font-weight: 900;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-alerta {
        margin: 12px 0 0; padding: 11px 12px; border-left: 4px solid #d89a18;
        background: #fffaf0; color: #7b5208; font-size: 12px; line-height: 1.5; font-weight: 800;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-footer {
        display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 9px;
        padding: 15px 18px; background: #f7f9fc; border-top: 1px solid #dfe6ef;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-btn {
        min-height: 40px; border: 0; border-radius: 10px; padding: 10px 15px;
        font-size: 12px; font-weight: 900; cursor: pointer; transition: .16s ease;
      }
      #modal-duplicidade-nova-solicitacao .sigee-dup-btn:hover { transform: translateY(-1px); filter: brightness(.97); }
      #modal-duplicidade-nova-solicitacao .sigee-dup-btn:focus-visible { outline: 3px solid rgba(11,117,189,.28); outline-offset: 2px; }
      #modal-duplicidade-nova-solicitacao .sigee-dup-cancelar { background: #e7ebf0; color: #42546b; }
      #modal-duplicidade-nova-solicitacao .sigee-dup-visualizar { background: #075b9c; color: #fff; box-shadow: 0 5px 14px rgba(7,91,156,.22); }
      @media (max-width: 620px) {
        #modal-duplicidade-nova-solicitacao { padding: 12px; align-items: flex-end; }
        #modal-duplicidade-nova-solicitacao .sigee-dup-card { width: 100%; max-height: calc(100vh - 20px); border-radius: 16px 16px 10px 10px; }
        #modal-duplicidade-nova-solicitacao .sigee-dup-header, #modal-duplicidade-nova-solicitacao .sigee-dup-body { padding: 17px; }
        #modal-duplicidade-nova-solicitacao .sigee-dup-dados { grid-template-columns: 1fr; }
        #modal-duplicidade-nova-solicitacao .sigee-dup-item.sigee-largo { grid-column: auto; }
        #modal-duplicidade-nova-solicitacao .sigee-dup-footer { display: grid; grid-template-columns: 1fr; }
        #modal-duplicidade-nova-solicitacao .sigee-dup-btn { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function abrirModal(registros) {
    return new Promise(resolve => {
      garantirEstiloModal();
      const principal = registros[0];
      const fundo = document.createElement('div');
      fundo.id = 'modal-duplicidade-nova-solicitacao';
      fundo.setAttribute('role', 'dialog');
      fundo.setAttribute('aria-modal', 'true');
      fundo.setAttribute('aria-labelledby', 'sigee-dup-titulo');
      fundo.innerHTML = `
        <section class="sigee-dup-card">
          <header class="sigee-dup-header">
            <span class="sigee-dup-icon" aria-hidden="true">⚠</span>
            <div>
              <h3 id="sigee-dup-titulo">Solicitação existente localizada</h3>
              <small>Validação preventiva de duplicidade do SIGEE</small>
            </div>
          </header>
          <div class="sigee-dup-body">
            <p class="sigee-dup-intro">Já existe processo cadastrado para este aluno nesta escola. Por segurança e integridade da base, uma nova solicitação não pode ser criada.</p>
            <div class="sigee-dup-dados">
              <div class="sigee-dup-item sigee-largo"><span class="sigee-dup-label">Código SIGEE</span><span class="sigee-dup-valor sigee-dup-codigo">${escapar(codigoDoProcesso(principal))}</span></div>
              <div class="sigee-dup-item sigee-largo"><span class="sigee-dup-label">Aluno</span><span class="sigee-dup-valor">${escapar(nomeDoProcesso(principal))}</span></div>
              <div class="sigee-dup-item sigee-largo"><span class="sigee-dup-label">Escola</span><span class="sigee-dup-valor">${escapar(escolaNomeDoProcesso(principal))}</span></div>
              <div class="sigee-dup-item"><span class="sigee-dup-label">Etapa atual</span><span class="sigee-dup-valor">${escapar(etapaDoProcesso(principal))}</span></div>
              <div class="sigee-dup-item"><span class="sigee-dup-label">Responsável</span><span class="sigee-dup-valor">${escapar(responsavelDoProcesso(principal))}</span></div>
              <div class="sigee-dup-item"><span class="sigee-dup-label">Data de abertura</span><span class="sigee-dup-valor">${escapar(dataDoProcesso(principal))}</span></div>
            </div>
            ${registros.length > 1 ? `<div class="sigee-dup-contagem"><span aria-hidden="true">ⓘ</span><span>Foram encontrados ${registros.length} registros coincidentes.</span></div>` : ''}
            <p class="sigee-dup-alerta"><strong>Cadastro bloqueado.</strong> Utilize o processo já existente ou revise os dados informados.</p>
          </div>
          <footer class="sigee-dup-footer" data-acoes></footer>
        </section>`;

      const concluir = decisao => { fundo.remove(); resolve(decisao); };
      const acoes = fundo.querySelector('[data-acoes]');
      const botoes = [
        ['Fechar', 'cancelar', 'sigee-dup-cancelar'],
        ['Visualizar processo existente', 'visualizar', 'sigee-dup-visualizar']
      ];
      botoes.forEach(([rotulo, valor, classe]) => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = `sigee-dup-btn ${classe}`;
        botao.textContent = rotulo;
        botao.addEventListener('click', () => concluir(valor));
        acoes.appendChild(botao);
      });
      fundo.addEventListener('click', evento => { if (evento.target === fundo) concluir('cancelar'); });
      fundo.addEventListener('keydown', evento => { if (evento.key === 'Escape') concluir('cancelar'); });
      document.body.appendChild(fundo);
      setTimeout(() => acoes.querySelector('.sigee-dup-visualizar')?.focus(), 0);
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
    return false;
  }


  window.SIGEE_DUPLICIDADE_NOVA_SOLICITACAO = Object.freeze({
    validar,
    localizarDuplicidades
  });
  console.info('[SIGEE RC4.7.0] Bloqueio definitivo de duplicidade da Nova Solicitação disponível.');
})(window, document);
