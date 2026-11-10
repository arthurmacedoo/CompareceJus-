'use strict';

/**
 * Cliente de Interoperabilidade MNI v2.2.2 (Modelo Nacional de Interoperabilidade - CNJ)
 * e Assinador Digital Qualificado ICP-Brasil (simulação PJeOffice / Assinador PDPJ-Br).
 *
 * Referências normativas:
 *  - Resolução CNJ nº 185/2013 e Especificação Técnica MNI v2.2.2
 *  - Resolução CNJ nº 335/2020 (Plataforma Digital do Poder Judiciário - PDPJ-Br)
 *  - Lei nº 11.419/2006, art. 1º, § 2º, III, "a" (Assinatura digital ICP-Brasil)
 *  - Tabelas Processuais Unificadas (TPU/CNJ)
 */

const { sha256, hashCanonico, novoId } = require('./seguranca');

// Códigos oficiais de referência nas Tabelas Processuais Unificadas (TPU/CNJ)
const TPU_CNJ = {
  MOVIMENTO_JUNTADA: {
    codigo: 85,
    nome: 'Juntada de Petição / Certidão',
    complemento: 'Certidão de Comparecimento Periódico em Juízo (Art. 319, I, CPP)',
  },
  MOVIMENTO_DESCUMPRIMENTO: {
    codigo: 12266,
    nome: 'Juntada de Certidão de Descumprimento de Medida Cautelar',
    complemento: 'Ausência de apresentação periódica mensal obrigatória',
  },
  DOCUMENTO_CERTIDAO: {
    codigo: 58,
    nome: 'Certidão Judicial de Comparecimento (CompareceJus / PDPJ-Br)',
    mimetype: 'application/pdf',
  },
};

// Endpoints por sistema processual de destino (barramento MNI / conectores PDPJ-Br)
const ENDPOINTS_SISTEMAS = {
  PJe: {
    sistema: 'PJe - Processo Judicial Eletrônico (CNJ)',
    protocolo: 'MNI v2.2.2 (SOAP/MTOM) + PDPJ-Br REST Bridge',
    wsdl: 'https://pje.tribunal.jus.br/pje/intercomunicacao?wsdl',
    filaMensageria: 'pdpj.mni.pje.manifestacao.v2',
  },
  'e-SAJ': {
    sistema: 'e-SAJ - Sistema de Automação da Justiça (TJSP/TJSC)',
    protocolo: 'MNI v2.2.2 Adapter (SOAP 1.1)',
    wsdl: 'https://esaj.tjsp.jus.br/mni/servicos/intercomunicacao222?wsdl',
    filaMensageria: 'pdpj.mni.esaj.manifestacao.v2',
  },
  eproc: {
    sistema: 'eproc - Processo Judicial Eletrônico (TRF4/TJRS/TJSC)',
    protocolo: 'MNI v2.2.2 WebService',
    wsdl: 'https://eproc.tribunal.jus.br/eproc/ws/controlador_ws.php?srv=intercomunicacao2.2',
    filaMensageria: 'pdpj.mni.eproc.manifestacao.v2',
  },
};

/**
 * Simula a assinatura digital qualificada via PJeOffice Pro / Assinador PDPJ-Br
 * nos termos da Lei nº 11.419/2006 e MP nº 2.200-2/2001 (ICP-Brasil).
 */
function assinarComIcpBrasil({ servidor, documentoHash, dadosDocumento, modalidade = 'PJeOffice Pro (Token A3 ICP-Brasil)' }) {
  const agora = new Date();
  const serialNumber = sha256(`${servidor.matricula}:${servidor.nome}:ICP-BRASIL`).substring(0, 32).toUpperCase();
  const thumbprint = sha256(`X509:${serialNumber}:${servidor.matricula}`).toUpperCase();

  const certificadoX509 = {
    versao: 'v3 (X.509)',
    titularCN: `${servidor.nome.toUpperCase()}:${servidor.matricula}`,
    cargo: servidor.cargo || 'Escrevente Técnico Judiciário',
    lotacao: servidor.vara || '2ª Vara Criminal',
    emissorDN: 'CN=AC-JUS v5, OU=Autoridade Certificadora da Justica, O=ICP-Brasil, C=BR',
    cadeia: ['ICP-Brasil Raiz v10', 'AC-JUS v5', 'AC-JUS Institucional Tribunal'],
    numeroSerie: serialNumber,
    thumbprintSha256: thumbprint,
    algoritmoChave: 'RSA-4096 / SHA256withRSA',
    tipoCertificado: 'A3 (Token Criptográfico FIPS 140-2 Level 3)',
    validoDe: '2025-01-01T00:00:00Z',
    validoAte: '2028-01-01T23:59:59Z',
    politicaAssinatura: 'AD-RT (Assinatura Digital com Referência do Tempo - PAdES/CAdES)',
    statusRevogacao: 'NAO_REVOGADO (Verificado via OCSP/LCR AC-JUS)',
  };

  const carimboTempo = {
    autoridadeACT: 'ACT Observatório Nacional (MCTI / ICP-Brasil)',
    protocoloRfc3161: `ACT-ON-${agora.getFullYear()}-${Math.floor(10000000 + Math.random() * 90000000)}`,
    emitidoEm: agora.toISOString(),
    fusoOficial: 'America/Sao_Paulo (Hora Legal Brasileira)',
    precisaoSincronismo: '± 2 ms (Stratum 1 NTP/PTP)',
    hashTimeStampToken: sha256(`TST:${documentoHash}:${agora.toISOString()}`),
  };

  const hashDocumentoAssinado = hashCanonico({
    documentoHash,
    dadosDocumento,
    certificadoThumbprint: thumbprint,
    carimboTempoHash: carimboTempo.hashTimeStampToken,
  });

  const pkcs7Base64 = Buffer.from(
    `-----BEGIN PKCS7-----\nMIIG${sha256(hashDocumentoAssinado + serialNumber)}${sha256(agora.toISOString())}==\n-----END PKCS7-----`
  ).toString('base64');

  return {
    padrao: 'ICP-Brasil (Lei nº 11.419/2006, art. 1º, § 2º, III)',
    modalidadeAssinador: modalidade,
    assinadoEm: agora.toISOString(),
    signatario: {
      nome: servidor.nome,
      matricula: servidor.matricula,
      cargo: servidor.cargo || 'Escrevente Técnico Judiciário',
      vara: servidor.vara || '2ª Vara Criminal • Comarca da Capital',
    },
    certificadoX509,
    carimboTempo,
    hashDocumentoOriginal: documentoHash,
    hashDocumentoAssinado,
    envelopePkcs7Base64: pkcs7Base64,
    textoFePublica: `Documento assinado digitalmente por ${servidor.nome} (${servidor.matricula}) com certificado ICP-Brasil (${certificadoX509.emissorDN}) e Carimbo do Tempo Oficial (${carimboTempo.protocoloRfc3161}).`,
  };
}

/**
 * Monta o envelope SOAP MNI v2.2.2 (`requisicaoEntregarManifestacaoProcessual`)
 * para auditoria técnica e demonstração de interoperabilidade.
 */
function gerarEnvelopeSoapMni({ numeroProcesso, codigoMovimento, documentoId, hashAssinado, signatario, dataHoraEnvio }) {
  const numLimpo = String(numeroProcesso || '').replace(/\D/g, '');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:ser="http://www.cnj.jus.br/servico-intercomunicacao-2.2.2/" ` +
    `xmlns:tip="http://www.cnj.jus.br/tipos-servico-intercomunicacao-2.2.2">\n` +
    `  <soapenv:Header/>\n` +
    `  <soapenv:Body>\n` +
    `    <ser:requisicaoEntregarManifestacaoProcessual>\n` +
    `      <tip:idManifestante>PDPJ-COMPARECEJUS-SERVENTIA</tip:idManifestante>\n` +
    `      <tip:numeroProcesso>${numLimpo}</tip:numeroProcesso>\n` +
    `      <tip:dataEnvio>${dataHoraEnvio}</tip:dataEnvio>\n` +
    `      <tip:documento idDocumento="${documentoId}" tipoDocumento="${TPU_CNJ.DOCUMENTO_CERTIDAO.codigo}" ` +
    `mimetype="application/pdf" descricao="${TPU_CNJ.DOCUMENTO_CERTIDAO.nome}" hash="${hashAssinado}">\n` +
    `        <tip:assinatura algoritmoHash="SHA-256" dataAssinatura="${dataHoraEnvio}" ` +
    `cadeiaCertificado="ICP-Brasil / AC-JUS v5" signatario="${signatario}"/>\n` +
    `      </tip:documento>\n` +
    `      <tip:parametros nome="codigoMovimentoTPU" valor="${codigoMovimento}"/>\n` +
    `    </ser:requisicaoEntregarManifestacaoProcessual>\n` +
    `  </soapenv:Body>\n` +
    `</soapenv:Envelope>`
  );
}

/**
 * Executa (em modo simulado estruturado) o método `entregarManifestacaoProcessual`
 * do MNI v2.2.2 via fila assíncrona da PDPJ-Br, anexando a certidão aos autos.
 */
function entregarManifestacaoProcessual({
  apresentacao,
  assinaturaIcp,
  sistemaDestino = 'PJe',
  tipoMovimento = 'COMPARECEU',
}) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const configSistema = ENDPOINTS_SISTEMAS[sistemaDestino] || ENDPOINTS_SISTEMAS.PJe;
  const movTpu =
    tipoMovimento === 'DESCUMPRIMENTO' ? TPU_CNJ.MOVIMENTO_DESCUMPRIMENTO : TPU_CNJ.MOVIMENTO_JUNTADA;

  const numeroProtocoloMni = `MNI-${ano}-${String(Math.floor(10000000 + Math.random() * 90000000))}`;
  const idDocumentoGerado = novoId('doc_mni');
  const hashAssinado =
    (assinaturaIcp && assinaturaIcp.hashDocumentoAssinado) ||
    apresentacao.certidao?.hashCertidao ||
    apresentacao.reciboHash;

  const signatarioStr = assinaturaIcp
    ? `${assinaturaIcp.signatario.nome} (${assinaturaIcp.signatario.matricula})`
    : 'Servidor Judiciário (ICP-Brasil)';

  const envelopeSoap = gerarEnvelopeSoapMni({
    numeroProcesso: apresentacao.processo,
    codigoMovimento: movTpu.codigo,
    documentoId: idDocumentoGerado,
    hashAssinado,
    signatario: signatarioStr,
    dataHoraEnvio: agora.toISOString(),
  });

  const reciboMni = hashCanonico({
    numeroProtocoloMni,
    processo: apresentacao.processo,
    protocoloCompareceJus: apresentacao.protocolo,
    hashAssinado,
    timestamp: agora.toISOString(),
  });

  return {
    sucesso: true,
    operacaoMni: 'entregarManifestacaoProcessual',
    versaoMni: '2.2.2',
    protocoloMni: numeroProtocoloMni,
    protocoloJudicial: numeroProtocoloMni,
    idDocumentoPje: idDocumentoGerado,
    juntadoEm: agora.toISOString(),
    sistemaDestino: configSistema.sistema,
    sistemaSigla: sistemaDestino,
    endpointWsdl: configSistema.wsdl,
    mensageriaPdpj: {
      broker: 'RabbitMQ / Apache Kafka (PDPJ-Br Event Bus)',
      topico: configSistema.filaMensageria,
      messageId: novoId('msg_pdpj'),
      statusEntrega: 'ACK_CONFIRMED (Juntado automaticamente nos autos)',
      tentativas: 1,
      latenciaMs: 142,
    },
    movimentoProcessualTpu: {
      codigoNacional: movTpu.codigo,
      descricao: movTpu.nome,
      complemento: `${movTpu.complemento} — Competência ${apresentacao.competencia} — Protocolo ${apresentacao.protocolo}`,
      tipoDocumentoTpu: TPU_CNJ.DOCUMENTO_CERTIDAO,
    },
    hashReciboMni: reciboMni,
    envelopeSoapResumido: envelopeSoap,
    mensagemRetornoMni: 'Manifestação processual recebida e juntada automaticamente aos autos com sucesso (Código MNI 0 - Sucesso).',
  };
}

module.exports = {
  TPU_CNJ,
  ENDPOINTS_SISTEMAS,
  assinarComIcpBrasil,
  entregarManifestacaoProcessual,
  gerarEnvelopeSoapMni,
};
