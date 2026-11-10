'use strict';

const fs = require('fs');
const path = require('path');
const { hashSenha, sha256, hashCanonico, protocolo, novoId } = require('./seguranca');
const { TrilhaAuditoria } = require('./auditoria');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function criarDadosIniciais() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const compAtual = `${ano}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const compAnterior = agora.getMonth() === 0
    ? `${ano - 1}-12`
    : `${ano}-${String(agora.getMonth()).padStart(2, '0')}`;

  return {
    config: {
      versao: '2.0.0',
      criadoEm: agora.toISOString(),
      orgao: 'Tribunal de Justiça do Estado de São Paulo',
      comarcaPadrao: 'São Paulo - Capital',
    },
    servidores: [
      {
        id: 'srv_01',
        login: 'servidor',
        nome: 'Rogério Almeida Santos',
        cargo: 'Escrevente Técnico Judiciário',
        matricula: 'TJ-384.912-SP',
        vara: '2ª Vara Criminal • Central de Medidas Cautelares',
        senhaHash: hashSenha('cnj2026'),
        perfil: 'SERVENTIA',
      },
    ],
    reus: [
      {
        id: 'reu_carlos',
        nome: 'Carlos Eduardo da Silva',
        cpf: '52998224725',
        cpfMascarado: '•••.982.247-••',
        nascimento: '1994-03-15',
        processo: '0014298-55.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        sistemaOrigem: 'e-SAJ',
        medida: 'Art. 319, I, do CPP (Liberdade Provisória com Cautelar)',
        comarca: {
          nome: 'São Paulo - Capital',
          centro: { lat: -23.55052, lng: -46.633308 },
          raioKm: 35,
        },
        endereco: {
          logradouro: 'Rua Vergueiro, 1200 - Liberdade, São Paulo - SP',
          lat: -23.5714,
          lng: -46.6389,
          raioM: 1000,
        },
        periodicidade: { tipo: 'MENSAL', diaInicio: 1, diaFim: 31 },
        biometria: null, // Deixado propositalmente null para o apresentador cadastrar na Audiência de Custódia!
        status: 'ATIVO',
      },
      {
        id: 'reu_mariana',
        nome: 'Mariana Ferreira Gomes',
        cpf: '74125896300',
        cpfMascarado: '•••.258.963-••',
        nascimento: '1989-07-22',
        processo: '0008412-19.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        sistemaOrigem: 'PJe',
        medida: 'Art. 319, I, do CPP (Acordo de Não Persecução Penal - ANPP)',
        comarca: {
          nome: 'São Paulo - Capital',
          centro: { lat: -23.55052, lng: -46.633308 },
          raioKm: 35,
        },
        endereco: {
          logradouro: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
          lat: -23.5614,
          lng: -46.6559,
          raioM: 1000,
        },
        periodicidade: { tipo: 'MENSAL', diaInicio: 1, diaFim: 31 },
        biometria: {
          cadastradoEm: '2026-02-10T14:30:00.000Z',
          origem: 'Audiência de Custódia',
          fotoReferencia: null,
          descritor: Array(128).fill(0.05),
        },
        status: 'ATIVO',
      },
      {
        id: 'reu_lucas',
        nome: 'Lucas Mendes de Oliveira',
        cpf: '36985214700',
        cpfMascarado: '•••.852.147-••',
        nascimento: '1998-11-04',
        processo: '0021950-84.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        sistemaOrigem: 'e-SAJ',
        medida: 'Art. 319, I e IV, do CPP (Liberdade Provisória com Proibição de Ausentar-se da Comarca)',
        comarca: {
          nome: 'São Paulo - Capital',
          centro: { lat: -23.55052, lng: -46.633308 },
          raioKm: 35,
        },
        endereco: {
          logradouro: 'Rua Domingos de Morais, 2187 - Vila Mariana, São Paulo - SP',
          lat: -23.5985,
          lng: -46.6371,
          raioM: 1000,
        },
        periodicidade: { tipo: 'MENSAL', diaInicio: 1, diaFim: 31 },
        biometria: {
          cadastradoEm: '2026-03-01T10:15:00.000Z',
          origem: 'Audiência de Custódia',
          fotoReferencia: null,
          descritor: Array(128).fill(0.1),
        },
        status: 'ATIVO',
      },
      {
        id: 'reu_bruno',
        nome: 'Bruno Carvalho Ramos',
        cpf: '85296374100',
        cpfMascarado: '•••.963.741-••',
        nascimento: '1991-05-18',
        processo: '0019440-12.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        sistemaOrigem: 'PJe',
        medida: 'Art. 319, I, do CPP',
        comarca: {
          nome: 'São Paulo - Capital',
          centro: { lat: -23.55052, lng: -46.633308 },
          raioKm: 35,
        },
        endereco: {
          logradouro: 'Rua Voluntários da Pátria, 1500 - Santana, São Paulo - SP',
          lat: -23.5015,
          lng: -46.6272,
          raioM: 1000,
        },
        periodicidade: { tipo: 'MENSAL', diaInicio: 1, diaFim: 31 },
        biometria: {
          cadastradoEm: '2026-01-15T09:00:00.000Z',
          origem: 'Audiência de Custódia',
          fotoReferencia: null,
          descritor: Array(128).fill(0.08),
        },
        status: 'ATIVO',
      },
      {
        id: 'reu_descumpridor_1',
        nome: 'Renato Siqueira Dias',
        cpf: '15975348600',
        cpfMascarado: '•••.753.486-••',
        nascimento: '1987-09-30',
        processo: '0010992-44.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        sistemaOrigem: 'e-SAJ',
        medida: 'Art. 319, I, do CPP',
        comarca: {
          nome: 'São Paulo - Capital',
          centro: { lat: -23.55052, lng: -46.633308 },
          raioKm: 35,
        },
        endereco: {
          logradouro: 'Av. Ibirapuera, 2000 - Moema, São Paulo - SP',
          lat: -23.602,
          lng: -46.661,
          raioM: 1000,
        },
        periodicidade: { tipo: 'MENSAL', diaInicio: 1, diaFim: 31 },
        biometria: {
          cadastradoEm: '2026-01-10T11:00:00.000Z',
          origem: 'Audiência de Custódia',
          fotoReferencia: null,
          descritor: Array(128).fill(0.02),
        },
        status: 'ATIVO',
      },
    ],
    apresentacoes: [
      // 1. CASO VERDE (Regular - pronto para homologação em lote ou individual)
      {
        id: 'apres_demo_verde',
        protocolo: protocolo('CJ', ano, 101),
        reuId: 'reu_mariana',
        reuNome: 'Mariana Ferreira Gomes',
        processo: '0008412-19.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        competencia: compAtual,
        recebidoEm: new Date(Date.now() - 3600000 * 3).toISOString(),
        status: 'AGUARDANDO_HOMOLOGACAO',
        geo: {
          lat: -23.5615,
          lng: -46.656,
          precisaoM: 12,
          capturadoEm: new Date(Date.now() - 3600000 * 3).toISOString(),
          enderecoAproximado: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        },
        biometria: {
          rostosDetectados: 1,
          descritor: Array(128).fill(0.051), // similaridade altíssima
        },
        liveness: { concluido: true, desafiosCumpridos: ['PISCAR_OLHOS', 'VIRAR_ESQUERDA'] },
        dispositivo: {
          id: 'dev_mock_mariana_01',
          plataforma: 'Android 14 (Samsung Galaxy A54)',
          navegador: 'Chrome Mobile 130',
          automacao: false,
        },
        fotoHash: sha256('mariana_foto_ok'),
        reciboHash: sha256('recibo_mariana_101'),
        preAnaliseIa: {
          versaoMotor: 'regras-1.0.0',
          analisadoEm: new Date(Date.now() - 3600000 * 3).toISOString(),
          classificacao: 'VERDE',
          indiceRisco: 0,
          recomendacao: 'HOMOLOGAR',
          parecer: 'Apresentação regular. Prova de vida concluída, rosto compatível com a foto de referência da custódia e localização dentro da comarca, próxima ao endereço declarado. Sugere-se a homologação (pode ser feita em lote).',
          metricas: {
            distanciaBiometrica: 0.012,
            similaridadePct: 99.4,
            dentroDaComarca: true,
            distanciaComarcaM: 2500,
            noEndereco: true,
            distanciaEnderecoM: 18,
            precisaoGpsM: 12,
          },
          sinais: [
            { nivel: 'INFO', codigo: 'INTEGRIDADE_DISPOSITIVO', titulo: 'Integridade do aparelho (informativo)', detalhe: 'Na versão nativa: checagem de Play Integrity/App Attest.', peso: 0 },
          ],
        },
      },
      // 2. CASO AMARELO (Longe do endereço declarado, mas dentro da comarca - sugestão de conferência)
      {
        id: 'apres_demo_amarelo',
        protocolo: protocolo('CJ', ano, 102),
        reuId: 'reu_bruno',
        reuNome: 'Bruno Carvalho Ramos',
        processo: '0019440-12.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        competencia: compAtual,
        recebidoEm: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'AGUARDANDO_HOMOLOGACAO',
        geo: {
          lat: -23.595,
          lng: -46.685, // Berrini (trabalho) vs Santana (residência)
          precisaoM: 25,
          capturadoEm: new Date(Date.now() - 3600000 * 5).toISOString(),
          enderecoAproximado: 'Av. Eng. Luís Carlos Berrini, 1050 - Itaim Bibi, São Paulo - SP',
        },
        biometria: {
          rostosDetectados: 1,
          descritor: Array(128).fill(0.082),
        },
        liveness: { concluido: true, desafiosCumpridos: ['PISCAR_OLHOS', 'VIRAR_DIREITA'] },
        dispositivo: {
          id: 'dev_mock_bruno_01',
          plataforma: 'iOS 18 (iPhone 13)',
          navegador: 'Safari Mobile 18',
          automacao: false,
        },
        fotoHash: sha256('bruno_foto_ok'),
        reciboHash: sha256('recibo_bruno_102'),
        preAnaliseIa: {
          versaoMotor: 'regras-1.0.0',
          analisadoEm: new Date(Date.now() - 3600000 * 5).toISOString(),
          classificacao: 'AMARELO',
          indiceRisco: 15,
          recomendacao: 'CONFERIR',
          parecer: 'Apresentação com ponto de atenção: longe do endereço declarado. Réu está dentro da Comarca da Capital (a 12,4 km de sua residência, em região comercial). Sugere-se homologação com ressalva ou confirmação do local de trabalho.',
          metricas: {
            distanciaBiometrica: 0.024,
            similaridadePct: 98.7,
            dentroDaComarca: true,
            distanciaComarcaM: 8500,
            noEndereco: false,
            distanciaEnderecoM: 12400,
            precisaoGpsM: 25,
          },
          sinais: [
            { nivel: 'MEDIO', codigo: 'LONGE_DO_ENDERECO', titulo: 'Longe do endereço declarado', detalhe: 'Localização a 12,4 km da residência informada nos autos. Dentro da comarca permitida.', peso: 15 },
          ],
        },
      },
      // 3. CASO VERMELHO (Alerta Territorial Grave: FORA DA COMARCA - Art. 319, IV, CPP)
      {
        id: 'apres_demo_vermelho',
        protocolo: protocolo('CJ', ano, 103),
        reuId: 'reu_lucas',
        reuNome: 'Lucas Mendes de Oliveira',
        processo: '0021950-84.2026.8.26.0100',
        vara: '2ª Vara Criminal • Comarca da Capital',
        competencia: compAtual,
        recebidoEm: new Date(Date.now() - 3600000 * 8).toISOString(),
        status: 'AGUARDANDO_HOMOLOGACAO',
        geo: {
          lat: -22.9056,
          lng: -47.0608, // Campinas - SP (~85km da Capital)
          precisaoM: 15,
          capturadoEm: new Date(Date.now() - 3600000 * 8).toISOString(),
          enderecoAproximado: 'Av. Francisco Glicério, 1200 - Centro, Campinas - SP',
        },
        biometria: {
          rostosDetectados: 1,
          descritor: Array(128).fill(0.103),
        },
        liveness: { concluido: true, desafiosCumpridos: ['PISCAR_OLHOS'] },
        dispositivo: {
          id: 'dev_mock_lucas_01',
          plataforma: 'Android 13 (Motorola Edge 40)',
          navegador: 'Chrome Mobile 129',
          automacao: false,
        },
        fotoHash: sha256('lucas_foto_campinas'),
        reciboHash: sha256('recibo_lucas_103'),
        preAnaliseIa: {
          versaoMotor: 'regras-1.0.0',
          analisadoEm: new Date(Date.now() - 3600000 * 8).toISOString(),
          classificacao: 'VERMELHO',
          indiceRisco: 55,
          recomendacao: 'ANALISAR',
          parecer: 'ALERTA DE DESCUMPRIMENTO CAUTELAR (Art. 319, IV, CPP): Réu realizou apresentação a 86,2 km de distância da Comarca autorizada da Capital (detectado em Campinas/SP). Não homologar de plano. Recomendada conclusão imediata ao Juiz de Direito competente.',
          metricas: {
            distanciaBiometrica: 0.031,
            similaridadePct: 98.2,
            dentroDaComarca: false,
            distanciaComarcaM: 86200,
            noEndereco: false,
            distanciaEnderecoM: 89400,
            precisaoGpsM: 15,
          },
          sinais: [
            { nivel: 'ALTO', codigo: 'FORA_DA_COMARCA', titulo: 'Fora da comarca autorizada', detalhe: 'Localização a 86,2 km do centro da Comarca da Capital (limite legal fixado: 35 km).', peso: 40 },
            { nivel: 'MEDIO', codigo: 'LONGE_DO_ENDERECO', titulo: 'Longe do endereço declarado', detalhe: 'Distância superior a 89 km do endereço cadastrado.', peso: 15 },
          ],
        },
      },
    ],
    justificativas: [
      {
        id: 'just_demo_01',
        protocolo: protocolo('JUST', ano, 401),
        reuId: 'reu_bruno',
        reuNome: 'Bruno Carvalho Ramos',
        processo: '0019440-12.2026.8.26.0100',
        competencia: compAtual,
        motivo: 'Consulta Médica de Urgência com Internação',
        descricao: 'Estive em observação no Pronto Socorro Municipal devido a crise aguda de apendicite conforme relatório médico anexo.',
        nomeArquivo: 'atestado_medico_hospital_sp.pdf',
        protocoladoEm: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'PENDENTE_ANALISE',
      },
    ],
    descumprimentos: [
      {
        id: 'desc_01',
        reuId: 'reu_descumpridor_1',
        reuNome: 'Renato Siqueira Dias',
        processo: '0010992-44.2026.8.26.0100',
        competenciaEncerrada: compAnterior,
        motivo: 'Ausência total de apresentação e justificativa no ciclo regular.',
        situacao: 'AGUARDANDO_CERTIDAO_CARTORIO',
      },
    ],
    auditoria: [],
  };
}

class BancoDados {
  constructor() {
    this.dados = null;
    this.trilha = new TrilhaAuditoria(
      () => this.obter().auditoria,
      (novaAuditoria) => {
        this.obter().auditoria = novaAuditoria;
        this.salvar();
      }
    );
    this.inicializar();
  }

  inicializar() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const conteudo = fs.readFileSync(DB_FILE, 'utf-8');
        this.dados = JSON.parse(conteudo);
      } else {
        this.resetar();
      }
    } catch (err) {
      console.warn('Erro ao ler DB persistido, restaurando padrão:', err.message);
      this.resetar();
    }
  }

  obter() {
    if (!this.dados) this.inicializar();
    return this.dados;
  }

  salvar() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.dados, null, 2), 'utf-8');
    } catch (err) {
      console.error('Falha ao gravar db.json:', err.message);
    }
  }

  resetar() {
    this.dados = criarDadosIniciais();
    this.salvar();
    this.trilha.registrar({
      tipo: 'SISTEMA_REINICIALIZADO',
      ator: { tipo: 'SISTEMA', nome: 'Reset de Demonstração' },
      dados: { mensagem: 'Banco de demonstração resetado com sucesso.' },
    });
    return this.dados;
  }
}

const db = new BancoDados();

module.exports = db;
