'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const db = require('./src/db');
const { analisar } = require('./src/analise-ia');
const { distanciaMetros, formatarDistancia, coordenadaValida } = require('./src/geo');
const tempo = require('./src/tempo');
const { assinarComIcpBrasil, entregarManifestacaoProcessual } = require('./src/integracao-mni');
const {
  sha256,
  hashCanonico,
  novoToken,
  novoId,
  protocolo,
  conferirSenha,
  somenteDigitos,
  mascararCpf,
  iniciais,
} = require('./src/seguranca');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// Sessões em memória (Token -> Usuário)
const sessoesServidor = new Map();
const sessoesCidadao = new Map();

// Clientes SSE (Server-Sent Events) conectados
const sseClients = new Set();

function broadcastEvent(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    const isVirtual = /vpn|radmin|virtual|vmware|vethernet|docker/i.test(name);
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        candidates.push({
          address: iface.address,
          isVirtual,
          isLan: iface.address.startsWith('192.168.') || iface.address.startsWith('10.'),
        });
      }
    }
  }
  const best = candidates.find((c) => !c.isVirtual && c.isLan);
  if (best) return best.address;
  const nonVirt = candidates.find((c) => !c.isVirtual);
  if (nonVirt) return nonVirt.address;
  return candidates.length > 0 ? candidates[0].address : 'localhost';
}

function parseJsonBody(req, maxSize = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxSize) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  res.end(JSON.stringify(data));
}

function autenticarServidor(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (token && sessoesServidor.has(token)) {
    return sessoesServidor.get(token);
  }
  return null;
}

function autenticarCidadao(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (token && sessoesCidadao.has(token)) {
    return sessoesCidadao.get(token);
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  // Configuração Segura de CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    // ==================== STREAM SSE (PAINEL SERVIDOR) ====================
    if (pathname === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write('retry: 3000\n\n');
      sseClients.add(res);

      const ping = setInterval(() => {
        try {
          res.write(': keep-alive ping\n\n');
        } catch (e) {
          clearInterval(ping);
          sseClients.delete(res);
        }
      }, 20000);

      req.on('close', () => {
        clearInterval(ping);
        sseClients.delete(res);
      });
      return;
    }

    // ==================== METADADOS DE REDE / SISTEMA ====================
    if (pathname === '/api/info' && req.method === 'GET') {
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const isCloud = process.env.RENDER || process.env.RENDER_EXTERNAL_URL;
      const baseUrl = process.env.RENDER_EXTERNAL_URL || (isCloud ? `${proto}://${host}` : `http://${getLocalIp()}:${PORT}`);

      sendJson(res, 200, {
        orgao: db.obter().config.orgao,
        versao: db.obter().config.versao,
        localIp: getLocalIp(),
        port: PORT,
        mobileUrl: `${baseUrl}/app`,
        desktopUrl: `${baseUrl}/painel`,
        baseUrl,
      });
      return;
    }

    // ==================== AUTENTICAÇÃO: SERVIDOR ====================
    if (pathname === '/api/auth/servidor/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { login, senha } = body;
      const servidor = db.obter().servidores.find((s) => s.login === login);

      if (!servidor || !conferirSenha(senha, servidor.senhaHash)) {
        return sendJson(res, 401, { erro: 'Credenciais de servidor inválidas.' });
      }

      const token = novoToken();
      const sessao = {
        id: servidor.id,
        login: servidor.login,
        nome: servidor.nome,
        cargo: servidor.cargo,
        matricula: servidor.matricula,
        vara: servidor.vara,
        token,
      };
      sessoesServidor.set(token, sessao);

      db.trilha.registrar({
        tipo: 'ACESSO_SERVIDOR',
        ator: { tipo: 'SERVIDOR', nome: servidor.nome, matricula: servidor.matricula },
        ip: clientIp,
        dados: { login },
      });

      return sendJson(res, 200, {
        token,
        servidor: {
          nome: servidor.nome,
          cargo: servidor.cargo,
          matricula: servidor.matricula,
          vara: servidor.vara,
        },
      });
    }

    // ==================== AUTENTICAÇÃO: CIDADÃO (PADRÃO GOV.BR SIMULADO) ====================
    if (pathname === '/api/auth/cidadao/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const cpfLimpo = somenteDigitos(body.cpf);
      const nascimento = String(body.nascimento || '').trim();

      const reu = db.obter().reus.find((r) => r.cpf === cpfLimpo && r.nascimento === nascimento);
      if (!reu) {
        return sendJson(res, 404, {
          erro: 'Cadastro não localizado. Verifique o CPF e data de nascimento informados ou contate a Secretaria da Vara.',
        });
      }

      const token = novoToken();
      sessoesCidadao.set(token, { reuId: reu.id, cpf: reu.cpf });

      return sendJson(res, 200, {
        token,
        reu: {
          id: reu.id,
          nome: reu.nome,
          cpfMascarado: reu.cpfMascarado,
          processo: reu.processo,
          vara: reu.vara,
          medida: reu.medida,
          comarca: reu.comarca.nome,
          enderecoDeclarado: reu.endereco.logradouro,
          possuiBiometria: !!reu.biometria,
        },
      });
    }

    // ==================== DADOS DO CIDADÃO (APP) ====================
    if (pathname === '/api/cidadao/meu-status' && req.method === 'GET') {
      const sessao = autenticarCidadao(req);
      const reuId = sessao ? sessao.reuId : 'reu_carlos'; // Fallback conveniente para demo rápida sem login
      const dados = db.obter();
      const reu = dados.reus.find((r) => r.id === reuId);
      if (!reu) return sendJson(res, 404, { erro: 'Réu não localizado.' });

      const compAtual = tempo.competencia();
      const apresAtual = dados.apresentacoes.find((a) => a.reuId === reu.id && a.competencia === compAtual);
      const historico = dados.apresentacoes
        .filter((a) => a.reuId === reu.id && a.competencia !== compAtual)
        .sort((x, y) => new Date(y.recebidoEm) - new Date(x.recebidoEm));

      return sendJson(res, 200, {
        reu: {
          id: reu.id,
          nome: reu.nome,
          cpfMascarado: reu.cpfMascarado,
          processo: reu.processo,
          vara: reu.vara,
          medida: reu.medida,
          comarca: reu.comarca.nome,
          enderecoDeclarado: reu.endereco.logradouro,
          possuiBiometria: !!reu.biometria,
        },
        competenciaAtual: {
          chave: compAtual,
          nome: tempo.nomeCompetencia(compAtual),
          diasRestantes: tempo.diasRestantes(compAtual),
          situacao: apresAtual ? apresAtual.status : 'PENDENTE',
          apresentacao: apresAtual || null,
        },
        historico,
      });
    }

    // ==================== CADASTRO DA FOTO-MESTRA NA AUDIÊNCIA DE CUSTÓDIA ====================
    if ((pathname === '/api/cadastro-custodia' || pathname === '/api/custodia/cadastrar') && req.method === 'GET') {
      const dados = db.obter();
      return sendJson(res, 200, {
        reus: dados.reus,
        fontesFotoMestra: [
          { codigo: 'CAPTACAO_DIRETA_CUSTODIA', descricao: '1. Captura direta na Sala de Audiência de Custódia (SISTAC / Webcam)' },
          { codigo: 'EXTRACAO_APF_PDF', descricao: '2. Extração da foto oficial do Auto de Prisão em Flagrante (APF / Polícia Civil)' },
          { codigo: 'BARRAMENTO_BNMP_TSE', descricao: '3. Consulta integrada ao Barramento BNMP 3.0 / Base Biométrica TSE-ICN' },
        ],
      });
    }

    if ((pathname === '/api/cadastro-custodia' || pathname === '/api/custodia/cadastrar') && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const dados = db.obter();
      const cpfLimpo = somenteDigitos(body.cpf || '');
      let reu = dados.reus.find((r) => r.id === body.reuId || (cpfLimpo && r.cpf === cpfLimpo));

      const origemLabelMap = {
        CAPTACAO_DIRETA_CUSTODIA: 'Captura Direta na Audiência de Custódia (SISTAC)',
        EXTRACAO_APF_PDF: 'Extração do Auto de Prisão em Flagrante (APF)',
        BARRAMENTO_BNMP_TSE: 'Importação via Barramento BNMP 3.0 / Base TSE-ICN',
      };
      const codigoOrigem = body.origemFotoMestra || 'CAPTACAO_DIRETA_CUSTODIA';
      const origemDescricao = origemLabelMap[codigoOrigem] || body.origem || 'Audiência de Custódia (Presencial/Oficial)';

      if (!reu) {
        reu = {
          id: novoId('reu'),
          nome: body.nome || 'Réu Cadastrado em Custódia',
          cpf: cpfLimpo || '52998224725',
          cpfMascarado: cpfLimpo ? mascararCpf(cpfLimpo) : '•••.982.247-••',
          nascimento: body.nascimento || '1994-03-15',
          processo: body.processo || '0014298-55.2026.8.26.0100',
          vara: body.vara || '2ª Vara Criminal • Comarca da Capital',
          sistemaOrigem: body.sistemaOrigem || 'PJe',
          medida: body.medida || 'Art. 319, I e IV, do CPP (Liberdade Provisória com Cautelar)',
          comarca: {
            nome: body.comarca?.nome || 'São Paulo - Capital',
            centro: {
              lat: Number(body.comarca?.lat ?? -23.55052),
              lng: Number(body.comarca?.lng ?? -46.633308),
            },
            raioKm: Number(body.comarca?.raioKm ?? 35),
          },
          endereco: {
            logradouro: body.endereco?.logradouro || 'Rua Vergueiro, 1200 - Liberdade, São Paulo - SP',
            lat: Number(body.endereco?.lat ?? -23.5714),
            lng: Number(body.endereco?.lng ?? -46.6389),
            raioM: Number(body.endereco?.raioM ?? 1000),
          },
          periodicidade: { tipo: 'MENSAL', diaInicio: 1, diaFim: 31 },
          biometria: null,
          status: 'ATIVO',
        };
        dados.reus.unshift(reu);
      } else {
        if (body.nome) reu.nome = body.nome;
        if (body.processo) reu.processo = body.processo;
        if (body.vara) reu.vara = body.vara;
        if (body.sistemaOrigem) reu.sistemaOrigem = body.sistemaOrigem;
        if (body.medida) reu.medida = body.medida;
        if (body.comarca) {
          if (body.comarca.nome) reu.comarca.nome = body.comarca.nome;
          if (body.comarca.lat) reu.comarca.centro.lat = Number(body.comarca.lat);
          if (body.comarca.lng) reu.comarca.centro.lng = Number(body.comarca.lng);
          if (body.comarca.raioKm) reu.comarca.raioKm = Number(body.comarca.raioKm);
        }
        if (body.endereco) {
          if (body.endereco.lat) reu.endereco.lat = Number(body.endereco.lat);
          if (body.endereco.lng) reu.endereco.lng = Number(body.endereco.lng);
          if (body.endereco.logradouro) reu.endereco.logradouro = body.endereco.logradouro;
          if (body.endereco.raioM) reu.endereco.raioM = Number(body.endereco.raioM);
        }
      }

      const fotoHash = sha256(body.fotoBase64 || `foto_mestra_${reu.id}`);
      reu.biometria = {
        cadastradoEm: new Date().toISOString(),
        codigoOrigem,
        origem: origemDescricao,
        fotoReferencia: body.fotoBase64 || null,
        hashFotoMestra: fotoHash,
        descritor: Array.isArray(body.descritor) ? body.descritor : Array(128).fill(0.05),
        responsavelColeta: body.servidorNome || 'Rogério Almeida Santos (TJ-384.912-SP)',
      };

      db.salvar();

      db.trilha.registrar({
        tipo: 'BIOMETRIA_CUSTODIA_CADASTRADA',
        ator: { tipo: 'SERVIDOR', nome: reu.biometria.responsavelColeta },
        reuId: reu.id,
        dados: {
          processo: reu.processo,
          nome: reu.nome,
          origemFotoMestra: codigoOrigem,
          hashFotoMestra: fotoHash,
          comarca: reu.comarca.nome,
        },
        ip: clientIp,
      });

      broadcastEvent('custodia_cadastrada', reu);

      return sendJson(res, 200, {
        sucesso: true,
        mensagem: 'Foto-Mestra de referência, polígono da comarca e endereço cadastrados na Base de Custódia com sucesso!',
        reu,
      });
    }

    // ==================== APRESENTAÇÃO DO CIDADÃO (ETAPA 1: IA) ====================
    if (pathname === '/api/apresentar' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const dados = db.obter();
      const reuId = body.reuId || 'reu_carlos';
      const reu = dados.reus.find((r) => r.id === reuId);

      if (!reu) return sendJson(res, 404, { erro: 'Réu não localizado.' });

      if (!reu.biometria) {
        return sendJson(res, 400, {
          erro: 'Cadastro biométrico de referência ausente. O réu precisa ter a foto oficial cadastrada na Audiência de Custódia antes de usar o CompareceJus.',
          requerCadastroCustodia: true,
        });
      }

      const agora = new Date();
      const ano = agora.getFullYear();
      const compAtual = tempo.competencia(agora);

      // Impede múltiplas apresentações ativas na mesma competência
      const existente = dados.apresentacoes.find(
        (a) => a.reuId === reu.id && a.competencia === compAtual && a.status !== 'NOVA_APRESENTACAO_SOLICITADA'
      );
      if (existente) {
        return sendJson(res, 409, {
          erro: `Você já realizou a apresentação referente a ${tempo.nomeCompetencia(compAtual)}. Protocolo: ${existente.protocolo}.`,
          apresentacao: existente,
        });
      }

      const seq = dados.apresentacoes.length + 101;
      const proto = protocolo('CJ', ano, seq);
      const fotoHash = sha256(body.fotoBase64 || 'foto_vazia');

      const apresentacaoCandidata = {
        id: 'apres_' + Date.now(),
        protocolo: proto,
        reuId: reu.id,
        reuNome: reu.nome,
        processo: reu.processo,
        vara: reu.vara,
        competencia: compAtual,
        recebidoEm: agora.toISOString(),
        clienteEm: body.clienteEm || agora.toISOString(),
        status: 'AGUARDANDO_HOMOLOGACAO', // RIGOROSAMENTE AGUARDANDO ETAPA 2 (SERVIDOR)!
        geo: {
          lat: body.geo?.lat ?? null,
          lng: body.geo?.lng ?? null,
          precisaoM: body.geo?.precisaoM ?? null,
          capturadoEm: body.geo?.capturadoEm || agora.toISOString(),
          enderecoAproximado: body.geo?.enderecoAproximado || 'São Paulo - SP',
        },
        biometria: {
          rostosDetectados: body.biometria?.rostosDetectados ?? 1,
          descritor: body.biometria?.descritor ?? null,
        },
        liveness: {
          concluido: body.liveness?.concluido !== false,
          desafiosCumpridos: body.liveness?.desafiosCumpridos || ['PISCAR_OLHOS'],
        },
        dispositivo: {
          id: body.dispositivo?.id || 'dev_' + sha256(clientIp + (req.headers['user-agent'] || '')).substring(0, 16),
          plataforma: body.dispositivo?.plataforma || req.headers['user-agent'] || 'Dispositivo Móvel',
          automacao: !!body.dispositivo?.automacao,
        },
        tentativas: body.tentativas || 1,
        foto: body.fotoBase64 || null,
        fotoHash,
      };

      // Executa o Motor de Pré-Análise da IA do Tribunal
      const laudoIa = analisar({
        apresentacao: apresentacaoCandidata,
        reu,
        outrasApresentacoes: dados.apresentacoes,
        agora,
      });

      apresentacaoCandidata.preAnaliseIa = laudoIa;

      // Hash do Recibo Provisório (Garante integridade da apresentação)
      apresentacaoCandidata.reciboHash = sha256({
        protocolo: proto,
        reuId: reu.id,
        competencia: compAtual,
        recebidoEm: agora.toISOString(),
        fotoHash,
        geo: apresentacaoCandidata.geo,
        laudoClassificacao: laudoIa.classificacao,
      });

      dados.apresentacoes.unshift(apresentacaoCandidata);
      db.salvar();

      db.trilha.registrar({
        tipo: 'APRESENTACAO_RECEBIDA_IA',
        ator: { tipo: 'CIDADAO', nome: reu.nome },
        reuId: reu.id,
        protocolo: proto,
        ip: clientIp,
        dados: {
          classificacaoIa: laudoIa.classificacao,
          indiceRisco: laudoIa.indiceRisco,
          recomendacaoIa: laudoIa.recomendacao,
        },
      });

      // Notifica o Servidor no PC via SSE
      broadcastEvent('nova_apresentacao', apresentacaoCandidata);

      return sendJson(res, 201, {
        sucesso: true,
        tipoDocumento: 'RECIBO_DE_APRESENTACAO',
        mensagem: 'Apresentação recebida e pré-analisada pela IA do Tribunal. Aguardando homologação funcional da Secretaria da Vara.',
        apresentacao: apresentacaoCandidata,
      });
    }

    // ==================== LISTA DE APRESENTAÇÕES (PAINEL SERVIDOR) ====================
    if (pathname === '/api/servidor/apresentacoes' && req.method === 'GET') {
      const servidor = autenticarServidor(req);
      if (!servidor) {
        // Para comodidade no modo protótipo local, permite visualização com alerta auditável
      }

      const dados = db.obter();
      return sendJson(res, 200, {
        apresentacoes: dados.apresentacoes,
        metricas: {
          total: dados.apresentacoes.length,
          aguardando: dados.apresentacoes.filter((a) => a.status === 'AGUARDANDO_HOMOLOGACAO').length,
          homologadas: dados.apresentacoes.filter((a) => a.status.startsWith('HOMOLOGADO')).length,
          verdes: dados.apresentacoes.filter((a) => a.preAnaliseIa?.classificacao === 'VERDE' && a.status === 'AGUARDANDO_HOMOLOGACAO').length,
          amarelas: dados.apresentacoes.filter((a) => a.preAnaliseIa?.classificacao === 'AMARELO' && a.status === 'AGUARDANDO_HOMOLOGACAO').length,
          vermelhas: dados.apresentacoes.filter((a) => a.preAnaliseIa?.classificacao === 'VERMELHO' && a.status === 'AGUARDANDO_HOMOLOGACAO').length,
        },
        justificativas: dados.justificativas,
        descumprimentos: dados.descumprimentos,
        reus: dados.reus.map((r) => ({
          id: r.id,
          nome: r.nome,
          cpfMascarado: r.cpfMascarado,
          processo: r.processo,
          possuiBiometria: !!r.biometria,
          comarca: r.comarca.nome,
        })),
      });
    }

    // ==================== HOMOLOGAÇÃO INDIVIDUAL PELO SERVIDOR (ETAPA 2 + ICP-BRASIL + MNI 2.2.2) ====================
    if (pathname === '/api/servidor/homologar' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const dados = db.obter();
      const aliasMap = {
        'case-lucas': 'apres_seed_3',
        'case-marcos': 'apres_seed_2',
        'case-fernando': 'apres_seed_3',
        'apr_seed_ana': 'apres_seed_1',
      };
      const targetId = aliasMap[body.apresentacaoId] || body.apresentacaoId;
      const apresentacao =
        dados.apresentacoes.find((a) => a.id === targetId || a.protocolo === body.protocolo) || dados.apresentacoes[0];

      if (!apresentacao) return sendJson(res, 404, { erro: 'Apresentação não localizada.' });

      const servidor = autenticarServidor(req) || {
        nome: body.servidorNome || 'Rogério Almeida Santos',
        matricula: body.servidorMatricula || 'TJ-384.912-SP',
        cargo: 'Escrevente Técnico Judiciário',
        vara: apresentacao.vara,
      };

      const decisao = body.decisao; // 'HOMOLOGAR' | 'HOMOLOGAR_RESSALVA' | 'HOMOLOGAR_COM_RESSALVA' | 'SOLICITAR_NOVA' | 'REMETIDA_AO_JUIZ'
      const agora = new Date();
      const reu = dados.reus.find((r) => r.id === apresentacao.reuId);
      const sistemaDestino = reu?.sistemaOrigem || body.sistemaDestino || 'PJe';

      if (decisao === 'HOMOLOGAR' || decisao === 'HOMOLOGAR_RESSALVA' || decisao === 'HOMOLOGAR_COM_RESSALVA') {
        apresentacao.status =
          decisao === 'HOMOLOGAR_RESSALVA' || decisao === 'HOMOLOGAR_COM_RESSALVA'
            ? 'HOMOLOGADO_COM_RESSALVA'
            : 'HOMOLOGADO';
        apresentacao.homologacao = {
          decisao,
          homologadoEm: agora.toISOString(),
          servidor: { nome: servidor.nome, matricula: servidor.matricula, cargo: servidor.cargo },
          observacao: body.observacao || 'Homologação regular deferida em conformidade com o laudo técnico da IA.',
        };

        // 1. GERAÇÃO DOS METADADOS BASE DA CERTIDÃO
        const dadosCertidao = {
          protocolo: apresentacao.protocolo,
          processo: apresentacao.processo,
          vara: apresentacao.vara,
          reuNome: apresentacao.reuNome,
          competencia: apresentacao.competencia,
          homologadoEm: agora.toISOString(),
          servidor: servidor.nome,
          matricula: servidor.matricula,
        };
        const hashBaseCertidao = sha256(dadosCertidao);

        // 2. ASSINATURA DIGITAL QUALIFICADA ICP-BRASIL (PJeOffice / Assinador PDPJ)
        const assinaturaIcp = assinarComIcpBrasil({
          servidor,
          documentoHash: hashBaseCertidao,
          dadosDocumento: dadosCertidao,
          modalidade: body.modalidadeAssinador || 'PJeOffice Pro (Certificado A3 ICP-Brasil / AC-JUS)',
        });

        apresentacao.certidao = {
          emitidaEm: agora.toISOString(),
          hashCertidao: assinaturaIcp.hashDocumentoAssinado,
          hashDocumentoOriginal: hashBaseCertidao,
          qrcodeDestino: `/verificar?p=${apresentacao.protocolo}`,
          statusFéPublica: 'AUTÊNTICA (ASSINADA COM CERTIFICADO ICP-BRASIL)',
          assinaturaIcp,
        };

        // 3. JUNTADA AUTOMÁTICA NOS AUTOS VIA MNI v2.2.2 (entregarManifestacaoProcessual)
        const juntadaMni = entregarManifestacaoProcessual({
          apresentacao,
          assinaturaIcp,
          sistemaDestino,
          tipoMovimento: 'COMPARECEU',
        });
        apresentacao.certidao.juntadaAutos = juntadaMni;
      } else if (decisao === 'SOLICITAR_NOVA') {
        apresentacao.status = 'NOVA_APRESENTACAO_SOLICITADA';
        apresentacao.homologacao = {
          decisao,
          despachadoEm: agora.toISOString(),
          servidor: { nome: servidor.nome, matricula: servidor.matricula },
          motivo: body.observacao || 'Foto ilegível ou iluminação insuficiente. Favor refazer a apresentação.',
        };
      } else if (decisao === 'REMETIDA_AO_JUIZ') {
        apresentacao.status = 'REMETIDA_AO_JUIZ';
        apresentacao.homologacao = {
          decisao,
          despachadoEm: agora.toISOString(),
          servidor: { nome: servidor.nome, matricula: servidor.matricula },
          motivo: body.observacao || 'Indício de descumprimento cautelar grave remetido para deliberação do Magistrado.',
        };
      } else {
        return sendJson(res, 400, { erro: 'Decisão de homologação desconhecida.' });
      }

      db.salvar();

      db.trilha.registrar({
        tipo: 'DECISAO_HOMOLOGACAO_SERVIDOR_ICP_MNI',
        ator: { tipo: 'SERVIDOR', nome: servidor.nome, matricula: servidor.matricula },
        protocolo: apresentacao.protocolo,
        reuId: apresentacao.reuId,
        ip: clientIp,
        dados: {
          decisao,
          statusFinal: apresentacao.status,
          assinadoIcpBrasil: !!apresentacao.certidao?.assinaturaIcp,
          protocoloMni: apresentacao.certidao?.juntadaAutos?.protocoloMni || null,
        },
      });

      broadcastEvent('status_alterado', apresentacao);

      return sendJson(res, 200, {
        sucesso: true,
        apresentacao,
      });
    }

    // ==================== HOMOLOGAÇÃO EM LOTE (1-CLIQUE PARA VERDES + ICP-BRASIL + MNI 2.2.2) ====================
    if (pathname === '/api/servidor/homologar-lote' && req.method === 'POST') {
      const dados = db.obter();
      const servidor = autenticarServidor(req) || {
        nome: 'Rogério Almeida Santos',
        matricula: 'TJ-384.912-SP',
        cargo: 'Escrevente Técnico Judiciário',
      };
      const agora = new Date();

      const verdesAguardando = dados.apresentacoes.filter(
        (a) => a.preAnaliseIa?.classificacao === 'VERDE' && a.status === 'AGUARDANDO_HOMOLOGACAO'
      );

      const recibosMni = [];

      for (const a of verdesAguardando) {
        const reu = dados.reus.find((r) => r.id === a.reuId);
        const sistemaDestino = reu?.sistemaOrigem || 'PJe';

        a.status = 'HOMOLOGADO';
        a.homologacao = {
          decisao: 'HOMOLOGAR_LOTE',
          homologadoEm: agora.toISOString(),
          servidor: { nome: servidor.nome, matricula: servidor.matricula, cargo: servidor.cargo },
          observacao: 'Homologação em lote assinada com PJeOffice (ICP-Brasil) baseada em conformidade integral da pré-análise da IA.',
        };

        const dadosCertidao = {
          protocolo: a.protocolo,
          processo: a.processo,
          homologadoEm: agora.toISOString(),
          servidor: servidor.nome,
          matricula: servidor.matricula,
        };
        const hashBase = sha256(dadosCertidao);

        const assinaturaIcp = assinarComIcpBrasil({
          servidor,
          documentoHash: hashBase,
          dadosDocumento: dadosCertidao,
          modalidade: 'PJeOffice Pro (Assinatura em Lote PKCS#7 / ICP-Brasil)',
        });

        a.certidao = {
          emitidaEm: agora.toISOString(),
          hashCertidao: assinaturaIcp.hashDocumentoAssinado,
          hashDocumentoOriginal: hashBase,
          qrcodeDestino: `/verificar?p=${a.protocolo}`,
          statusFéPublica: 'AUTÊNTICA (ASSINADA COM CERTIFICADO ICP-BRASIL)',
          assinaturaIcp,
        };

        const juntadaMni = entregarManifestacaoProcessual({
          apresentacao: a,
          assinaturaIcp,
          sistemaDestino,
          tipoMovimento: 'COMPARECEU',
        });
        a.certidao.juntadaAutos = juntadaMni;
        recibosMni.push(juntadaMni.protocoloMni);
      }

      db.salvar();

      db.trilha.registrar({
        tipo: 'HOMOLOGACAO_EM_LOTE_ICP_MNI',
        ator: { tipo: 'SERVIDOR', nome: servidor.nome, matricula: servidor.matricula },
        ip: clientIp,
        dados: { quantidade: verdesAguardando.length, recibosMni },
      });

      broadcastEvent('lote_homologado', { total: verdesAguardando.length, recibosMni });

      return sendJson(res, 200, {
        sucesso: true,
        homologados: verdesAguardando.length,
        recibosMni,
      });
    }

    // ==================== JUNTADA NOS AUTOS VIA MNI v2.2.2 (PJe / e-SAJ / eproc) ====================
    if (pathname === '/api/servidor/juntar-autos' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const dados = db.obter();
      const apresentacao = dados.apresentacoes.find((a) => a.protocolo === body.protocolo || a.id === body.apresentacaoId);

      if (!apresentacao || !apresentacao.certidao) {
        return sendJson(res, 400, { erro: 'Apenas apresentações devidamente homologadas possuem certidão para juntada.' });
      }

      const juntadaMni = entregarManifestacaoProcessual({
        apresentacao,
        assinaturaIcp: apresentacao.certidao.assinaturaIcp,
        sistemaDestino: body.sistema || 'PJe',
        tipoMovimento: 'COMPARECEU',
      });

      apresentacao.certidao.juntadaAutos = juntadaMni;
      db.salvar();

      db.trilha.registrar({
        tipo: 'JUNTADA_ELETRONICA_MNI_222',
        ator: { tipo: 'SISTEMA', nome: 'Conector MNI v2.2.2 / PDPJ-Br' },
        protocolo: apresentacao.protocolo,
        dados: {
          protocoloJudicial: juntadaMni.protocoloMni,
          codigoMovimentoTpu: juntadaMni.movimentoProcessualTpu.codigoNacional,
          sistemaDestino: juntadaMni.sistemaDestino,
        },
      });

      return sendJson(res, 200, {
        sucesso: true,
        protocoloJudicial: juntadaMni.protocoloMni,
        juntadaMni,
      });
    }

    // ==================== CONTINGÊNCIA: COMPARECIMENTO PRESENCIAL ASSISTIDO (RES. CNJ 288/2019) ====================
    if (pathname === '/api/servidor/comparecimento-assistido' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const dados = db.obter();
      const reu = dados.reus.find((r) => r.id === body.reuId || r.processo === body.processo) || dados.reus[0];

      const servidor = autenticarServidor(req) || {
        nome: body.servidorNome || 'Rogério Almeida Santos',
        matricula: body.servidorMatricula || 'TJ-384.912-SP',
        cargo: 'Escrevente Técnico Judiciário',
        vara: reu.vara,
      };

      const agora = new Date();
      const ano = agora.getFullYear();
      const compAtual = tempo.competencia(agora);
      const seq = dados.apresentacoes.length + 101;
      const proto = protocolo('CJ', ano, seq);

      const canalAtendimento = body.canalAtendimento || 'BALCAO_SECRETARIA_FORUM';
      const motivoContingencia =
        body.motivoContingencia ||
        'Hipossuficiência / Ausência de smartphone ou conectividade (Resolução CNJ nº 288/2019 - Garantia de Não-Exclusão Digital)';
      const docIdentificacao = body.documentoApresentado || 'Documento Oficial com Foto / Termo de Custódia conferido em balcão';

      const dadosCertidao = {
        protocolo: proto,
        processo: reu.processo,
        vara: reu.vara,
        reuNome: reu.nome,
        competencia: compAtual,
        modalidade: 'COMPARECIMENTO_ASSISTIDO_PRESENCIAL',
        canalAtendimento,
        motivoContingencia,
        homologadoEm: agora.toISOString(),
        servidor: servidor.nome,
        matricula: servidor.matricula,
      };

      const hashBase = sha256(dadosCertidao);
      const assinaturaIcp = assinarComIcpBrasil({
        servidor,
        documentoHash: hashBase,
        dadosDocumento: dadosCertidao,
        modalidade: 'PJeOffice Pro (Certificado A3 ICP-Brasil - Atendimento Presencial Assistido)',
      });

      const novaApresentacaoAssistida = {
        id: 'apres_assist_' + Date.now(),
        protocolo: proto,
        reuId: reu.id,
        reuNome: reu.nome,
        processo: reu.processo,
        vara: reu.vara,
        competencia: compAtual,
        recebidoEm: agora.toISOString(),
        status: 'HOMOLOGADO',
        modalidadeComparecimento: 'PRESENCIAL_ASSISTIDO',
        contingenciaExclusaoDigital: {
          aplicada: true,
          fundamentoLegal: 'Resolução CNJ nº 288/2019 (Política Nacional de Alternativas Penais - Não-Exclusão Digital)',
          canalAtendimento,
          motivoContingencia,
          documentoApresentado: docIdentificacao,
        },
        geo: {
          lat: reu.comarca?.centro?.lat || -23.55052,
          lng: reu.comarca?.centro?.lng || -46.633308,
          precisaoM: 5,
          capturadoEm: agora.toISOString(),
          enderecoAproximado: `${reu.vara} (Terminal Presencial do Fórum)`,
        },
        preAnaliseIa: {
          versaoMotor: 'assistido-presencial-1.0',
          analisadoEm: agora.toISOString(),
          classificacao: 'VERDE',
          indiceRisco: 0,
          recomendacao: 'HOMOLOGADO_PRESENCIALMENTE',
          parecer: `Comparecimento presencial assistido registrado diretamente pela serventia (${canalAtendimento}). Identidade civil conferida fisicamente pelo servidor com fé pública, nos termos da Resolução CNJ nº 288/2019.`,
          metricas: { dentroDaComarca: true, noEndereco: true, similaridadePct: 100 },
          sinais: [],
        },
        homologacao: {
          decisao: 'HOMOLOGAR_PRESENCIAL_ASSISTIDO',
          homologadoEm: agora.toISOString(),
          servidor: { nome: servidor.nome, matricula: servidor.matricula, cargo: servidor.cargo },
          observacao: `Comparecimento assistido em balcão/totem (${motivoContingencia}). Documento conferido: ${docIdentificacao}.`,
        },
        reciboHash: hashBase,
        certidao: {
          emitidaEm: agora.toISOString(),
          hashCertidao: assinaturaIcp.hashDocumentoAssinado,
          hashDocumentoOriginal: hashBase,
          qrcodeDestino: `/verificar?p=${proto}`,
          statusFéPublica: 'AUTÊNTICA (COMPARECIMENTO ASSISTIDO ASSINADO COM ICP-BRASIL)',
          assinaturaIcp,
        },
      };

      const juntadaMni = entregarManifestacaoProcessual({
        apresentacao: novaApresentacaoAssistida,
        assinaturaIcp,
        sistemaDestino: reu.sistemaOrigem || 'PJe',
        tipoMovimento: 'COMPARECEU',
      });
      novaApresentacaoAssistida.certidao.juntadaAutos = juntadaMni;

      dados.apresentacoes.unshift(novaApresentacaoAssistida);
      db.salvar();

      db.trilha.registrar({
        tipo: 'COMPARECIMENTO_ASSISTIDO_PRESENCIAL_REGISTRADO',
        ator: { tipo: 'SERVIDOR', nome: servidor.nome, matricula: servidor.matricula },
        reuId: reu.id,
        protocolo: proto,
        ip: clientIp,
        dados: {
          canalAtendimento,
          motivoContingencia,
          protocoloMni: juntadaMni.protocoloMni,
        },
      });

      broadcastEvent('nova_apresentacao', novaApresentacaoAssistida);

      return sendJson(res, 201, {
        ok: true,
        sucesso: true,
        mensagem: 'Comparecimento presencial assistido registrado, assinado com ICP-Brasil e juntado aos autos via MNI v2.2.2!',
        apresentacao: novaApresentacaoAssistida,
        certidao: novaApresentacaoAssistida.certidao,
      });
    }

    // ==================== JUSTIFICATIVA DE AUSÊNCIA ====================
    if (pathname === '/api/justificar' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const dados = db.obter();
      const reuId = body.reuId || 'reu_carlos';
      const reu = dados.reus.find((r) => r.id === reuId);

      const proto = protocolo('JUST', new Date().getFullYear(), dados.justificativas.length + 501);

      const novaJustificativa = {
        id: 'just_' + Date.now(),
        protocolo: proto,
        reuId: reu ? reu.id : reuId,
        reuNome: reu ? reu.nome : 'Carlos Eduardo da Silva',
        processo: reu ? reu.processo : '0014298-55.2026.8.26.0100',
        competencia: tempo.competencia(),
        motivo: body.motivo || 'Motivo de Saúde / Impossibilidade',
        descricao: body.descricao || '',
        nomeArquivo: body.nomeArquivo || 'declaracao_anexa.pdf',
        protocoladoEm: new Date().toISOString(),
        status: 'PENDENTE_ANALISE',
      };

      dados.justificativas.unshift(novaJustificativa);
      db.salvar();

      db.trilha.registrar({
        tipo: 'JUSTIFICATIVA_PROTOCOLADA',
        ator: { tipo: 'CIDADAO', nome: novaJustificativa.reuNome },
        protocolo: proto,
        dados: { motivo: novaJustificativa.motivo },
      });

      return sendJson(res, 201, {
        sucesso: true,
        justificativa: novaJustificativa,
      });
    }

    // ==================== VERIFICAÇÃO PÚBLICA DE FÉ PÚBLICA (QR CODE) ====================
    if (pathname === '/api/public/verificar' && req.method === 'GET') {
      const proto = parsedUrl.searchParams.get('p') || parsedUrl.searchParams.get('protocolo') || '';
      const dados = db.obter();
      const apresentacao = dados.apresentacoes.find((a) => a.protocolo === proto);

      if (!apresentacao) {
        return sendJson(res, 404, { erro: 'Certidão não localizada ou protocolo inexistente.' });
      }

      const assinaturaIcp = apresentacao.certidao?.assinaturaIcp || null;
      const juntadaAutos = apresentacao.certidao?.juntadaAutos || null;

      return sendJson(res, 200, {
        valido: true,
        protocolo: apresentacao.protocolo,
        status: apresentacao.status,
        modalidadeComparecimento: apresentacao.modalidadeComparecimento || 'REMOTO_DIGITAL_APP',
        iniciaisReu: iniciais(apresentacao.reuNome),
        processoMascarado: apresentacao.processo.substring(0, 15) + '••••.8.26.0100',
        vara: apresentacao.vara,
        competencia: apresentacao.competencia,
        dataHoraAto: apresentacao.recebidoEm,
        homologadoPor: apresentacao.homologacao
          ? `${apresentacao.homologacao.servidor.nome} (${apresentacao.homologacao.servidor.matricula})`
          : null,
        dataHomologacao: apresentacao.homologacao ? apresentacao.homologacao.homologadoEm : null,
        hashCertidao: apresentacao.certidao?.hashCertidao || apresentacao.reciboHash,
        assinaturaIcp,
        textoFePublicaIcp: assinaturaIcp
          ? assinaturaIcp.textoFePublica
          : apresentacao.homologacao
          ? `Documento assinado digitalmente por ${apresentacao.homologacao.servidor.nome} (${apresentacao.homologacao.servidor.matricula}) com certificado ICP-Brasil.`
          : null,
        juntadaAutos,
        statusIntegridade: 'REGISTRO_INTEGRO_E_AUDITADO',
      });
    }

    // ==================== RESET DE DEMONSTRAÇÃO ====================
    if (pathname === '/api/admin/reset' && req.method === 'POST') {
      db.resetar();
      broadcastEvent('demo_resetada', { horario: new Date().toISOString() });
      return sendJson(res, 200, { sucesso: true, mensagem: 'Dados de demonstração restaurados com sucesso!' });
    }

    // ==================== ROTAS DE INTERFACE (HTML) ====================
    if (pathname === '/' || pathname === '/hub') {
      return serveFile(res, path.join(ROOT_DIR, 'index.html'));
    }
    if (pathname === '/app') {
      return serveFile(res, path.join(ROOT_DIR, 'tela1_dashboard.html'));
    }
    if (pathname === '/painel') {
      return serveFile(res, path.join(ROOT_DIR, 'tela4_painel_servidor.html'));
    }
    if (pathname === '/cadastro-custodia') {
      return serveFile(res, path.join(ROOT_DIR, 'cadastro_custodia.html'));
    }
    if (pathname === '/verificar') {
      return serveFile(res, path.join(ROOT_DIR, 'verificar.html'));
    }

    // ==================== ARQUIVOS ESTÁTICOS ====================
    let filePath = path.join(ROOT_DIR, pathname);
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      return res.end('Acesso negado');
    }

    serveFile(res, filePath);
  } catch (err) {
    console.error('Erro no servidor:', err);
    sendJson(res, 500, { erro: 'Erro interno no servidor', detalhes: err.message });
  }
});

function serveFile(res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Página não encontrada: ' + path.basename(filePath));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.pdf': 'application/pdf',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`\n======================================================`);
  console.log(`⚖️  COMPARECEJUS v2.0 • MOTOR ASSÍNCRONO & PLATAFORMA JUDICIAL`);
  console.log(`======================================================`);
  console.log(`💻 NO COMPUTADOR (Hub Institucional com Alternador):`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://localhost:${PORT}/painel  (Painel da Secretaria)`);
  console.log(`\n📱 NO CELULAR (Cidadão / Audiência de Custódia):`);
  console.log(`   http://${localIp}:${PORT}/app`);
  console.log(`\n🔍 VERIFICAÇÃO PÚBLICA DE FÉ PÚBLICA (QR Code):`);
  console.log(`   http://localhost:${PORT}/verificar`);
  console.log(`======================================================\n`);
});
