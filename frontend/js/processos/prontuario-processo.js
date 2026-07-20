/* =====================================================================
   SIGEE Enterprise — Sprint 3.5.0
   Prontuário Eletrônico do Processo
   Camada aditiva: não altera regras, transições ou persistência do workflow.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__SIGEE_PRONTUARIO_350__) return;
  window.__SIGEE_PRONTUARIO_350__ = true;

  const ETAPAS = [
    'Solicitação', 'Documento Recebido', 'Desarquivamento', 'Análise',
    'Pendência', 'Digitação', 'Conferência', 'Assinatura',
    'Aguardando Retirada', 'Retirado'
  ];

  const texto = v => v == null ? '' : String(v).trim();
  const normalizar = v => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const escapar = v => texto(v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));

  function processos() {
    if (Array.isArray(window.processosDB)) return window.processosDB;
    try { if (Array.isArray(processosDB)) return processosDB; } catch (_) {}
    return [];
  }

  function processo(id) {
    return processos().find(p => String(p.id) === String(id));
  }

  function supabase() {
    try {
      return window.obterSupabaseSIGEE?.()
        || window.criarClienteSupabaseSIGEE?.()
        || window.SIGEE_SUPABASE?.criarCliente?.()
        || null;
    } catch (_) { return null; }
  }

  function valor(p, ...campos) {
    for (const c of campos) if (p && p[c] != null && texto(p[c])) return texto(p[c]);
    return '';
  }

  function etapaAtual(p) {
    return valor(p, 'etapa_atual', 'etapa', 'fase_atual') || 'Desarquivamento';
  }

  function codigo(p) {
    return valor(p, 'codigo_sigee', 'codigo', 'protocolo') || `PROCESSO ${p?.id || ''}`;
  }

  function dataValida(v) {
    if (!v) return null;
    const br = texto(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const d = br ? new Date(`${br[3]}-${br[2]}-${br[1]}T00:00:00`) : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatarData(v, hora = true) {
    const d = dataValida(v);
    if (!d) return 'Data não informada';
    return d.toLocaleString('pt-BR', hora
      ? { dateStyle:'short', timeStyle:'short' }
      : { dateStyle:'short' });
  }

  function diasEntre(inicio, fim = new Date()) {
    const a = dataValida(inicio);
    const b = dataValida(fim) || new Date();
    if (!a) return 0;
    return Math.max(0, Math.floor((b - a) / 86400000));
  }

  function fechar() {
    document.getElementById('sigee-prontuario-overlay')?.remove();
    document.body.classList.remove('sigee-prontuario-aberto');
  }

  function iconeEvento(ev) {
    const n = normalizar(`${ev.acao || ''} ${ev.etapa || ''}`);
    if (n.includes('DOCUMENT')) return '📁';
    if (n.includes('MENSAGEM') || n.includes('COMUNIC')) return '✉️';
    if (n.includes('RETIFIC')) return '🔁';
    if (n.includes('REITER')) return '⏱️';
    if (n.includes('PEND')) return '⚠️';
    if (n.includes('DIGIT')) return '⌨️';
    if (n.includes('CONFER')) return '🔎';
    if (n.includes('ASSIN')) return '✍️';
    if (n.includes('DEFER') || n.includes('RETIR')) return '✅';
    if (n.includes('INDEFER')) return '⛔';
    if (n.includes('ANAL')) return '🔍';
    return '●';
  }

  function classeEvento(ev) {
    const n = normalizar(`${ev.acao || ''} ${ev.etapa || ''}`);
    if (n.includes('INDEFER') || n.includes('VENCID')) return 'critico';
    if (n.includes('PEND') || n.includes('URG')) return 'alerta';
    if (n.includes('DEFER') || n.includes('RETIR') || n.includes('RECEBID')) return 'sucesso';
    if (n.includes('RETIFIC') || n.includes('REITER')) return 'ciclo';
    return 'padrao';
  }

  function dadosEvento(ev) {
    const bruto = ev?.dados || ev?.metadata || ev?.detalhes;
    if (!bruto) return {};
    if (typeof bruto === 'object') return bruto;
    try { return JSON.parse(bruto); } catch (_) { return {}; }
  }

  function tituloEvento(ev) {
    const codigo = normalizar(ev?.acao || ev?.evento || '');
    const titulos = {
      DOCUMENTO_RECEBIDO: 'Documento Recebido',
      RETIFICAR_DADOS: 'Retificação de Dados',
      SEND_REITERACAO: 'Reiteração',
      SEND_REITERACAO_URGENTE: 'Reiteração com Urgência',
      CONFIRMAR_DADOS: 'Confirmação dos Dados da Busca',
      PEDIDO_ATAS_DESARQUIVAMENTO: 'Pedido de Atas sem Pasta'
    };
    return titulos[codigo] || ev.acao || ev.titulo || ev.etapa || 'Movimentação processual';
  }

  function descricaoEvento(ev) {
    const codigo = normalizar(ev?.acao || ev?.evento || '');
    const d = dadosEvento(ev);
    if (codigo === 'DOCUMENTO_RECEBIDO') {
      return ev.observacao || `Documento recebido${d.tipo_arquivo ? ` (${d.tipo_arquivo})` : ''}. Processo encaminhado para Análise sem reinício do ciclo.`;
    }
    if (codigo === 'RETIFICAR_DADOS') {
      const novo = d.novo_ciclo || ev.novo_ciclo;
      return ev.observacao || `Dados retificados. O Desarquivamento foi reiniciado por 30 dias${novo ? ` no Ciclo ${novo}` : ''}.`;
    }
    if (codigo === 'SEND_REITERACAO') return ev.observacao || 'Reiteração registrada, mantendo a contagem contínua do ciclo.';
    if (codigo === 'SEND_REITERACAO_URGENTE') return ev.observacao || 'Reiteração com urgência registrada, mantendo a contagem contínua do ciclo.';
    if (codigo === 'CONFIRMAR_DADOS') return ev.observacao || 'Confirmação dos dados da busca solicitada ao requerente.';
    if (codigo === 'PEDIDO_ATAS_DESARQUIVAMENTO') return ev.observacao || 'Pedido de Atas sem Pasta registrado. Processo encaminhado para Análise no contexto do Desarquivamento.';
    return ev.observacao || ev.descricao || ev.resumo || 'Movimentação registrada no processo.';
  }

  function detalhesEvento(ev) {
    const campos = [
      ['Responsável', ev.usuario_nome || ev.responsavel || ev.executado_por],
      ['Perfil', ev.usuario_perfil || ev.perfil],
      ['Etapa', ev.etapa],
      ['Mensagem', ev.mensagem_codigo || ev.mensagem],
      ['Arquivo', ev.tipo_arquivo || ev.arquivo],
      ['Local', ev.local_arquivo || ev.origem],
      ['Ciclo', ev.ciclo || ev.cycle || dadosEvento(ev).ciclo],
      ['Novo ciclo', ev.novo_ciclo || dadosEvento(ev).novo_ciclo],
      ['Prazo iniciado', ev.prazo_dias || dadosEvento(ev).prazo_dias ? `${ev.prazo_dias || dadosEvento(ev).prazo_dias} dias` : ''],
      ['Observação', ev.observacao || ev.descricao]
    ].filter(([,v]) => texto(v));

    let extras = '';
    const dados = dadosEvento(ev);
    if (dados && typeof dados === 'object') {
      extras = Object.entries(dados)
        .filter(([,v]) => v != null && typeof v !== 'object')
        .map(([k,v]) => `<div><span>${escapar(k.replaceAll('_',' '))}</span><strong>${escapar(v)}</strong></div>`)
        .join('');
    }
    return campos.map(([k,v]) => `<div><span>${k}</span><strong>${escapar(v)}</strong></div>`).join('') + extras;
  }

  async function carregarEventos(p) {
    const eventos = [];
    const cliente = supabase();

    if (cliente && p?.id != null) {
      try {
        const { data, error } = await cliente
          .from('historico_processos')
          .select('*')
          .eq('processo_id', p.id)
          .order('created_at', { ascending: true });
        if (!error && Array.isArray(data)) eventos.push(...data);
      } catch (e) {
        console.warn('[SIGEE Prontuário] histórico_processos indisponível:', e);
      }
    }

    if (!eventos.length) {
      const criada = valor(p, 'created_at', 'criado_em', 'data_solicitacao', 'data_abertura');
      eventos.push({
        created_at: criada || new Date().toISOString(),
        acao: 'Solicitação criada',
        etapa: 'Solicitação',
        usuario_nome: valor(p, 'criado_por', 'responsavel') || 'Sistema SIGEE',
        observacao: 'Registro inicial do processo.'
      });

      const atual = etapaAtual(p);
      if (normalizar(atual) !== 'SOLICITACAO') {
        eventos.push({
          created_at: valor(p, 'data_etapa_atual', 'updated_at') || new Date().toISOString(),
          acao: `Processo em ${atual}`,
          etapa: atual,
          usuario_nome: valor(p, 'tecnico_responsavel', 'responsavel', 'analista') || 'Responsável não informado',
          observacao: 'Evento reconstruído a partir do estado atual.'
        });
      }
    }
    return eventos;
  }

  function workflowHTML(p) {
    const atual = normalizar(etapaAtual(p));
    const indiceAtual = Math.max(0, ETAPAS.findIndex(e => atual.includes(normalizar(e))));
    return ETAPAS.map((e, i) => {
      const classe = i < indiceAtual ? 'concluida' : i === indiceAtual ? 'atual' : 'futura';
      return `<div class="sigee-pep-etapa ${classe}">
        <span>${i < indiceAtual ? '✓' : i + 1}</span><small>${escapar(e)}</small>
      </div>`;
    }).join('');
  }

  function timelineHTML(eventos) {
    return eventos.map((ev, i) => `
      <article class="sigee-pep-evento ${classeEvento(ev)}">
        <div class="sigee-pep-marcador">${iconeEvento(ev)}</div>
        <div class="sigee-pep-evento-card">
          <header>
            <div>
              <time>${formatarData(ev.created_at || ev.data || ev.data_hora)}</time>
              <h3>${escapar(tituloEvento(ev))}</h3>
            </div>
            <button type="button" aria-expanded="false" data-pep-expandir="${i}">Ver detalhes</button>
          </header>
          <p>${escapar(descricaoEvento(ev))}</p>
          <div class="sigee-pep-detalhes" data-pep-detalhes="${i}">
            ${detalhesEvento(ev) || '<div><span>Registro</span><strong>Sem informações complementares.</strong></div>'}
          </div>
        </div>
      </article>`).join('');
  }

  function resumoComunicacoes(eventos) {
    return eventos.filter(e => /MENSAGEM|COMUNIC|EMAIL|E-MAIL/i.test(`${e.acao || ''} ${e.observacao || ''}`));
  }

  function resumoDocumentos(eventos) {
    return eventos.filter(e => /DOCUMENT|PASTA|ATA|CADERNETA|PARECER|BOLETIM/i.test(`${e.acao || ''} ${e.observacao || ''} ${e.tipo_arquivo || ''}`));
  }

  function modalHTML(p, eventos) {
    const inicio = valor(p, 'created_at', 'criado_em', 'data_solicitacao', 'data_abertura', 'data_inicio_desarquivamento');
    const tempoTotal = diasEntre(inicio);
    const etapa = etapaAtual(p);
    const comunicacoes = resumoComunicacoes(eventos);
    const documentos = resumoDocumentos(eventos);

    return `
    <div id="sigee-prontuario-overlay" class="sigee-pep-overlay" role="dialog" aria-modal="true" aria-label="Prontuário Eletrônico do Processo">
      <div class="sigee-pep-shell">
        <header class="sigee-pep-topo">
          <div class="sigee-pep-marca"><b>SIGEE</b><span>Prontuário Eletrônico do Processo</span></div>
          <div class="sigee-pep-topo-acoes">
            <button type="button" onclick="window.print()">🖨️ Imprimir</button>
            <button type="button" data-pep-fechar>✕ Fechar</button>
          </div>
        </header>

        <section class="sigee-pep-cabecalho">
          <div class="sigee-pep-titulo">
            <span>PROCESSO</span>
            <h1>${escapar(codigo(p))}</h1>
            <div class="sigee-pep-status"><i></i>${escapar(etapa)}</div>
          </div>
          <div class="sigee-pep-grade">
            <div><span>Aluno</span><strong>${escapar(valor(p,'aluno_nome','aluno','nome_solicitante') || 'Não informado')}</strong></div>
            <div><span>Escola</span><strong>${escapar(valor(p,'escola_nome','escola','nome_escola','instituicao') || 'Não informada')}</strong></div>
            <div><span>NTE</span><strong>${escapar(valor(p,'nte','nte_nome','grupo') || 'Não informado')}</strong></div>
            <div><span>Responsável</span><strong>${escapar(valor(p,'tecnico_responsavel','responsavel','usuario_responsavel') || 'Não atribuído')}</strong></div>
            <div><span>Prioridade</span><strong>${escapar(valor(p,'prioridade') || 'Normal')}</strong></div>
            <div><span>Documento</span><strong>${escapar(valor(p,'documento_tipo','documento','documento_solicitado') || 'Não informado')}</strong></div>
          </div>
        </section>

        <section class="sigee-pep-workflow">${workflowHTML(p)}</section>

        <div class="sigee-pep-conteudo">
          <main class="sigee-pep-timeline">
            <div class="sigee-pep-secao-titulo"><div><span>LINHA DO TEMPO</span><h2>Trajetória completa do processo</h2></div><b>${eventos.length} registros</b></div>
            ${timelineHTML(eventos)}
          </main>

          <aside class="sigee-pep-lateral">
            <section><h3>Visão executiva</h3>
              <div class="sigee-pep-kpis">
                <div><strong>${tempoTotal}</strong><span>dias totais</span></div>
                <div><strong>${eventos.length}</strong><span>eventos</span></div>
                <div><strong>${comunicacoes.length}</strong><span>comunicações</span></div>
                <div><strong>${documentos.length}</strong><span>documentos</span></div>
              </div>
            </section>
            <section><h3>Prazos</h3>
              <dl>
                <div><dt>Etapa atual</dt><dd>${escapar(etapa)}</dd></div>
                <div><dt>Início</dt><dd>${formatarData(inicio, false)}</dd></div>
                <div><dt>Tempo na etapa</dt><dd>${diasEntre(valor(p,'data_etapa_atual','prazo_inicio'))} dias</dd></div>
                <div><dt>Prazo final</dt><dd>${formatarData(valor(p,'prazo_fim'), false)}</dd></div>
              </dl>
            </section>
            <section><h3>Responsáveis</h3>
              <dl>
                <div><dt>Analista</dt><dd>${escapar(valor(p,'analista','analista_nome') || 'Não atribuído')}</dd></div>
                <div><dt>Digitador</dt><dd>${escapar(valor(p,'digitador','digitador_nome') || 'Não atribuído')}</dd></div>
                <div><dt>Conferente</dt><dd>${escapar(valor(p,'conferente','conferente_nome') || 'Não atribuído')}</dd></div>
              </dl>
            </section>
            <section class="sigee-pep-selo"><b>Registro Institucional</b><span>Eventos auditáveis do SIGEE Enterprise</span><small>Sprint 2.3.1</small></section>
          </aside>
        </div>
      </div>
    </div>`;
  }

  async function abrir(id) {
    const p = processo(id);
    if (!p) {
      alert('Processo não localizado para abertura do prontuário.');
      return;
    }
    fechar();
    const carregando = document.createElement('div');
    carregando.id = 'sigee-prontuario-overlay';
    carregando.className = 'sigee-pep-overlay sigee-pep-carregando';
    carregando.innerHTML = '<div><span></span><strong>Preparando Prontuário Eletrônico...</strong></div>';
    document.body.appendChild(carregando);
    document.body.classList.add('sigee-prontuario-aberto');

    const eventos = await carregarEventos(p);
    carregando.outerHTML = modalHTML(p, eventos);

    const overlay = document.getElementById('sigee-prontuario-overlay');
    overlay?.querySelector('[data-pep-fechar]')?.addEventListener('click', fechar);
    overlay?.addEventListener('click', e => { if (e.target === overlay) fechar(); });
    overlay?.querySelectorAll('[data-pep-expandir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pepExpandir;
        const box = overlay.querySelector(`[data-pep-detalhes="${id}"]`);
        const aberto = box.classList.toggle('aberto');
        btn.textContent = aberto ? 'Ocultar detalhes' : 'Ver detalhes';
        btn.setAttribute('aria-expanded', String(aberto));
      });
    });
  }

  function renomearBotoes() {
    document.querySelectorAll('button').forEach(btn => {
      const onclick = btn.getAttribute('onclick') || '';
      const textoBotao = normalizar(btn.textContent);
      const ehHistorico = /abrirHistorico(SIGEE|ProcessoSIGEE)?\s*\(/i.test(onclick)
        || textoBotao === 'HISTORICO';

      if (!ehHistorico || btn.classList.contains('sigee-btn-prontuario')) return;

      btn.textContent = '📑 Prontuário';
      btn.classList.add('sigee-btn-prontuario');
    });
  }

  window.abrirProntuarioSIGEE = abrir;
  window.abrirHistoricoSIGEE = abrir;
  window.abrirHistoricoProcessoSIGEE = abrir;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('sigee-prontuario-overlay')) fechar();
  });

  let timerRenomeacao = null;
  const observadorProntuario = new MutationObserver(mudancas => {
    if (document.hidden) return;
    const relevante = mudancas.some(m => [...m.addedNodes].some(no =>
      no.nodeType === 1 && (no.matches?.('button,[id*="prontuario"],[class*="prontuario"]') || no.querySelector?.('button,[id*="prontuario"],[class*="prontuario"]'))
    ));
    if (!relevante) return;
    clearTimeout(timerRenomeacao);
    timerRenomeacao = setTimeout(() => { timerRenomeacao = null; renomearBotoes(); }, 100);
  });
  observadorProntuario.observe(document.body || document.documentElement, { childList:true, subtree:true });
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', renomearBotoes)
    : renomearBotoes();

  console.info('[SIGEE] Prontuário Eletrônico 2.3.1 carregado.');
})();
