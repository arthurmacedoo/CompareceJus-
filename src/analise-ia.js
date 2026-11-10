'use strict';

/**
 * MOTOR DE PRÉ-ANÁLISE ("IA do Tribunal") — Etapa 1.
 *
 * Princípios:
 *  - Explicável: cada ponto de atenção tem código, nível, título e detalhe legível.
 *  - Conservador: a IA NUNCA homologa nem rejeita. Ela só classifica e recomenda.
 *    A decisão é sempre do servidor (Etapa 2) — supervisão humana obrigatória
 *    para reconhecimento facial (uso de alto risco).
 *  - Determinístico e auditável: mesma entrada → mesma saída; versão registrada.
 *
 * No protótipo a comparação facial (descritor de 128 dimensões) é calculada no
 * navegador com face-api.js; em produção seria um serviço biométrico certificado.
 */

const { distanciaMetros, formatarDistancia, coordenadaValida } = require('./geo');
const tempo = require('./tempo');

const VERSAO_MOTOR = 'regras-1.0.0';

const LIMIARES = {
  biometriaConfere: 0.45, // distância ≤ → confere
  biometriaDiverge: 0.55, // distância > → diverge (entre os dois: inconclusivo)
  gpsImprecisoM: 300,
  gpsPrecisaoIrrealM: 1,
  gpsIdadeMaxMs: 2 * 60 * 1000,
  velocidadeMaxKmh: 900,
  relogioToleranciaMs: 10 * 60 * 1000,
  tentativasMax: 3,
  raioEnderecoPadraoM: 1000,
};

const PESO = { ALTO: 40, MEDIO: 15, BAIXO: 5, INFO: 0 };

function distanciaEuclidiana(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return null;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Converte distância do descritor em uma "similaridade estimada" (curva logística). */
function similaridade(d) {
  if (d == null) return null;
  return Math.round(1000 / (1 + Math.exp((d - 0.5) * 12))) / 10;
}

function analisar({ apresentacao, reu, outrasApresentacoes = [], agora = new Date() }) {
  const sinais = [];
  const add = (nivel, codigo, titulo, detalhe) =>
    sinais.push({ nivel, codigo, titulo, detalhe, peso: PESO[nivel] });

  const a = apresentacao;
  const metricas = {};

  // ---------- 1.1 PROVA DE VIDA E INDÍCIOS DE FRAUDE ----------
  const live = a.liveness || {};
  if (!live.concluido) {
    add('ALTO', 'LIVENESS_FALHOU', 'Prova de vida não concluída',
      'Os desafios aleatórios (piscar / virar o rosto) não foram cumpridos. Pode indicar foto impressa, tela ou vídeo.');
  }

  if (a.biometria && a.biometria.rostosDetectados === 0) {
    add('ALTO', 'ROSTO_AUSENTE', 'Nenhum rosto na foto', 'A imagem enviada não contém um rosto detectável.');
  } else if (a.biometria && a.biometria.rostosDetectados > 1) {
    add('ALTO', 'MULTIPLOS_ROSTOS', 'Mais de um rosto na foto',
      `Foram detectados ${a.biometria.rostosDetectados} rostos. Pode indicar presença de terceiro conduzindo o ato.`);
  }

  if (a.dispositivo && a.dispositivo.automacao) {
    add('ALTO', 'AUTOMACAO_DETECTADA', 'Navegador automatizado',
      'O navegador informou controle por automação (webdriver). Típico de robôs ou emuladores.');
  }

  // Checagem de integridade de User-Agent / WebView / Emulador e Câmera Virtual
  if (a.dispositivo) {
    const ua = String(a.dispositivo.plataforma || a.dispositivo.userAgent || '');
    const padraoEmulador = /HeadlessChrome|PhantomJS|Electron|sdk_gphone|generic_x86|Genymotion|BlueStacks|LDPlayer|NoxPlayer|Android SDK built for x86/i;
    const padraoWebViewSuspeita = /\bwv\b|WebView|(Android.*Version\/\d+\.\d+.*Chrome)/i;

    if (a.dispositivo.emulador || padraoEmulador.test(ua)) {
      add('ALTO', 'EMULADOR_OU_AMBIENTE_VIRTUAL', 'Assinatura de emulador ou ambiente virtual',
        `User-Agent/Plataforma compatível com emulador (${ua.substring(0, 80)}). Risco elevado de injeção de sensores.`);
    } else if (a.dispositivo.webviewSuspeita || (padraoWebViewSuspeita.test(ua) && !a.dispositivo.attestationToken)) {
      add('MEDIO', 'WEBVIEW_NAO_HOMOLOGADA', 'Execução em WebView encapsulada ou navegador modificado',
        'Acesso via WebView embutida sem token de atestação criptográfica nativa (Play Integrity / App Attest).');
    }

    const camLabel = String(a.dispositivo.cameraLabel || '');
    if (a.dispositivo.cameraVirtual || /OBS|ManyCam|SplitCam|Snap Camera|DroidCam|Iriun|YouCam|Virtual|v4l2loopback/i.test(camLabel)) {
      add('ALTO', 'CAMERA_VIRTUAL_DETECTADA', 'Dispositivo de câmera virtual interceptado',
        `A fonte de vídeo reportada ("${camLabel || 'Virtual Camera'}") indica software de injeção de vídeo.`);
    }
  }

  if (a.fotoHash) {
    const repetida = outrasApresentacoes.find((o) => o.fotoHash === a.fotoHash);
    if (repetida) {
      add('ALTO', 'FOTO_REUTILIZADA', 'Foto idêntica a um envio anterior',
        `A imagem é byte a byte igual à do protocolo ${repetida.protocolo}. Indício de reenvio de foto antiga.`);
    }
  }

  if (a.dispositivo && a.dispositivo.id) {
    const outroReu = outrasApresentacoes.find(
      (o) => o.dispositivo && o.dispositivo.id === a.dispositivo.id && o.reuId !== a.reuId
    );
    if (outroReu) {
      add('ALTO', 'DISPOSITIVO_COMPARTILHADO', 'Aparelho já usado por outra pessoa monitorada',
        `O mesmo aparelho foi usado na apresentação ${outroReu.protocolo}, de outro réu. Pode indicar que um terceiro está fazendo as apresentações.`);
    }
  }

  if (typeof a.tentativas === 'number' && a.tentativas > LIMIARES.tentativasMax) {
    add('BAIXO', 'MUITAS_TENTATIVAS', 'Várias tentativas antes do envio',
      `${a.tentativas} tentativas de captura. Normalmente é iluminação ruim, mas fica registrado.`);
  }

  if (a.clienteEm) {
    const dif = Math.abs(new Date(a.clienteEm).getTime() - agora.getTime());
    if (dif > LIMIARES.relogioToleranciaMs) {
      add('BAIXO', 'RELOGIO_DIVERGENTE', 'Relógio do celular diferente do servidor',
        `Diferença de ${Math.round(dif / 60000)} min. O horário oficial é sempre o do servidor do Tribunal.`);
    }
  }

  // ---------- 1.2 FOTO CONFERE? ----------
  const bio = a.biometria || {};
  const d = distanciaEuclidiana(bio.descritor, reu.biometria && reu.biometria.descritor);
  metricas.distanciaBiometrica = d == null ? null : Math.round(d * 1000) / 1000;
  metricas.similaridadePct = similaridade(d);

  if (d == null) {
    if (bio.rostosDetectados !== 0) {
      add('MEDIO', 'BIOMETRIA_NAO_PROCESSADA', 'Comparação facial automática indisponível',
        'O modelo facial não pôde ser executado neste aparelho. O servidor deve comparar visualmente a foto de referência com a selfie.');
    }
  } else if (d > LIMIARES.biometriaDiverge) {
    add('ALTO', 'BIOMETRIA_DIVERGENTE', 'Rosto diferente da foto de referência',
      `Similaridade estimada de ${metricas.similaridadePct}% (distância ${metricas.distanciaBiometrica}). Conferir visualmente.`);
  } else if (d > LIMIARES.biometriaConfere) {
    add('MEDIO', 'BIOMETRIA_INCONCLUSIVA', 'Comparação facial inconclusiva',
      `Similaridade estimada de ${metricas.similaridadePct}%. Pode ser iluminação, óculos ou ângulo. Conferir visualmente.`);
  }

  // ---------- 1.2 ENDEREÇO / COMARCA CONFERE? ----------
  const g = a.geo;
  if (!coordenadaValida(g)) {
    add('ALTO', 'GPS_AUSENTE', 'Localização não informada',
      'O aparelho não forneceu a localização. Não é possível verificar se a pessoa está na comarca.');
  } else {
    if (reu.comarca && coordenadaValida(reu.comarca.centro)) {
      const dc = distanciaMetros(g, reu.comarca.centro);
      metricas.distanciaComarcaM = Math.round(dc);
      metricas.dentroDaComarca = dc <= reu.comarca.raioKm * 1000;
      if (!metricas.dentroDaComarca) {
        add('ALTO', 'FORA_DA_COMARCA', 'Fora da comarca autorizada',
          `Localização a ${formatarDistancia(dc)} do centro de ${reu.comarca.nome} (limite de ${reu.comarca.raioKm} km). Possível descumprimento do art. 319, IV, do CPP.`);
      }
    }
    if (reu.endereco && coordenadaValida(reu.endereco)) {
      const de = distanciaMetros(g, reu.endereco);
      const raio = reu.endereco.raioM || LIMIARES.raioEnderecoPadraoM;
      metricas.distanciaEnderecoM = Math.round(de);
      metricas.noEndereco = de <= raio;
      if (!metricas.noEndereco && metricas.dentroDaComarca !== false) {
        add('MEDIO', 'LONGE_DO_ENDERECO', 'Longe do endereço declarado',
          `A ${formatarDistancia(de)} do endereço informado nos autos (tolerância de ${formatarDistancia(raio)}). Pode estar no trabalho; vale conferir se o endereço mudou.`);
      }
    }
    if (g.mocked === true || g.isMock === true || g.isFromMockProvider === true || a.dispositivo?.mockLocationFlag === true) {
      add('ALTO', 'MOCK_LOCATION_ATIVO', 'Flag de GPS Simulado (Mock Location) ativa',
        'A API de telemetria reportou flag de provedor de localização simulado (Mock Location / Fake GPS).');
    }

    // Heurística de telemetria sintética: coordenadas com casas decimais exatas (zeros finais) ou altitude fixa artificial
    const latStr = String(g.lat);
    const lngStr = String(g.lng);
    if ((latStr.includes('.') && latStr.split('.')[1].length <= 2 && lngStr.includes('.') && lngStr.split('.')[1].length <= 2) ||
        (g.altitude === 0 && g.altitudeAccuracy === 0 && g.speed === 0)) {
      add('MEDIO', 'TELEMETRIA_GPS_SINTETICA', 'Padrão de coordenada GPS com baixa entropia (possível injeção)',
        'Coordenadas com truncamento decimal atípico ou sensores secundários (altitude/velocidade) zerados.');
    }

    if (typeof g.precisaoM === 'number') {
      metricas.precisaoGpsM = Math.round(g.precisaoM);
      if (g.precisaoM > LIMIARES.gpsImprecisoM) {
        add('MEDIO', 'GPS_IMPRECISO', 'Localização imprecisa',
          `Margem de erro de ${formatarDistancia(g.precisaoM)}. O resultado territorial é menos confiável.`);
      } else if (g.precisaoM < LIMIARES.gpsPrecisaoIrrealM) {
        add('MEDIO', 'GPS_PRECISAO_IRREAL', 'Precisão de GPS irreal',
          `Margem de erro de ${g.precisaoM} m — celulares reais raramente informam menos de 1 m. Comum em aplicativos de GPS falso.`);
      }
    }
    if (g.capturadoEm) {
      const idade = agora.getTime() - new Date(g.capturadoEm).getTime();
      if (idade > LIMIARES.gpsIdadeMaxMs) {
        add('MEDIO', 'GPS_DESATUALIZADO', 'Localização antiga',
          `A leitura de GPS tinha ${Math.round(idade / 60000)} min no momento do envio (posição em cache).`);
      }
    }
    const anteriores = outrasApresentacoes
      .filter((o) => o.reuId === a.reuId && coordenadaValida(o.geo))
      .sort((x, y) => new Date(y.recebidoEm) - new Date(x.recebidoEm));
    const ultima = anteriores[0];
    if (ultima) {
      const horas = (agora - new Date(ultima.recebidoEm)) / 3600000;
      const km = distanciaMetros(g, ultima.geo) / 1000;
      if (horas > 0 && km > 50 && km / horas > LIMIARES.velocidadeMaxKmh) {
        add('ALTO', 'DESLOCAMENTO_IMPOSSIVEL', 'Deslocamento fisicamente impossível',
          `${Math.round(km)} km em ${horas < 1 ? Math.round(horas * 60) + ' min' : horas.toFixed(1) + ' h'} desde a última apresentação (${ultima.protocolo}).`);
      }
    }
  }

  // ---------- PRAZO ----------
  if (a.competencia && !tempo.dentroDaJanela(agora, a.competencia, reu.periodicidade?.diaInicio, reu.periodicidade?.diaFim)) {
    add('BAIXO', 'FORA_DO_PRAZO', 'Enviado fora da janela da competência',
      `A janela de ${tempo.nomeCompetencia(a.competencia)} não estava aberta neste dia.`);
  }

  // ---------- INFORMATIVO ----------
  add('INFO', 'INTEGRIDADE_DISPOSITIVO', 'Integridade do aparelho não verificável no navegador',
    'Na versão nativa: Play Integrity (Android) / App Attest (iOS), detecção de root/jailbreak e de GPS falso (mock location).');

  // ---------- CLASSIFICAÇÃO ----------
  const tem = (n) => sinais.some((s) => s.nivel === n);
  const classificacao = tem('ALTO') ? 'VERMELHO' : tem('MEDIO') ? 'AMARELO' : 'VERDE';
  const indiceRisco = Math.min(100, sinais.reduce((t, s) => t + s.peso, 0));

  const relevantes = sinais.filter((s) => s.nivel !== 'INFO');
  let parecer;
  let recomendacao;
  if (classificacao === 'VERDE') {
    recomendacao = 'HOMOLOGAR';
    parecer =
      'Apresentação regular. Prova de vida concluída, rosto compatível com a foto de referência e localização dentro da comarca' +
      (metricas.noEndereco ? ', próxima ao endereço declarado' : '') +
      '. Sugere-se a homologação (pode ser feita em lote).';
  } else if (classificacao === 'AMARELO') {
    recomendacao = 'CONFERIR';
    parecer =
      'Apresentação com pontos de atenção que não indicam fraude por si sós: ' +
      relevantes.map((s) => s.titulo.toLowerCase()).join('; ') +
      '. Sugere-se conferência visual pelo servidor antes de homologar (homologação com ressalva, se for o caso).';
  } else {
    recomendacao = 'ANALISAR';
    parecer =
      'Foram encontrados indícios relevantes: ' +
      relevantes.filter((s) => s.nivel === 'ALTO').map((s) => s.titulo.toLowerCase()).join('; ') +
      '. Não se recomenda homologar sem análise. Avaliar solicitar nova apresentação ou remeter ao juiz.';
  }

  return {
    versaoMotor: VERSAO_MOTOR,
    analisadoEm: agora.toISOString(),
    classificacao,
    indiceRisco,
    recomendacao,
    parecer,
    metricas,
    sinais,
    aviso: 'Análise automatizada de apoio. A decisão é do servidor responsável.',
  };
}

module.exports = { analisar, distanciaEuclidiana, similaridade, LIMIARES, VERSAO_MOTOR };
