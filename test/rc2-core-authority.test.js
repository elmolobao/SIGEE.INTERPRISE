const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('frontend/js/sigee-core-authority-rc2.js','utf8');
const listeners = {};
const window = {
  usuarioLogado: { perfil: 'Administrator' },
  SIGEE_Processos: { salvar: async p => ({ etapa_atual:p.etapa_atual }) },
  SIGEE_WORKFLOW_093: { abrirAnalise(){}, abrirEncaminharDigitacao(){}, abrirDigitacao(){}, abrirConferencia(){}, abrirAssinatura(){}, abrirRetirada(){} },
  addEventListener: (n,fn)=>{listeners[n]=fn;}
};
const document = { readyState:'complete', addEventListener(){} };
vm.runInNewContext(code,{window,document,console,Error,String,Boolean,Object,Array});
const core=window.SIGEE_CORE_RC2;
if(core.normalizarPerfil('Administrator')!=='Administrador') throw new Error('Administrador não normalizado');
if(core.normalizarPerfil('Estagiario')!=='Estagiário') throw new Error('Estagiário não normalizado');
if(core.normalizarPerfil('Tecnico')!=='Técnico') throw new Error('Técnico não normalizado');
if(core.modalidadeExibicao({modalidade:'Regular',nivel_oferta:'Ensino Médio'})!=='Regular / Ensino Médio') throw new Error('Modalidade inválida');
if(core.responsavelExibicao({processo_migrado:true})!=='Migrado') throw new Error('Migrado inválido');
let falhou=false; try{core.validarDestino({etapa_atual:'Digitação'});}catch(e){falhou=true;} if(!falhou) throw new Error('Digitação sem responsável deveria falhar');
core.validarDestino({etapa_atual:'Digitação',digitador:'Técnico A'});
console.log('RC2 authority tests: OK');
