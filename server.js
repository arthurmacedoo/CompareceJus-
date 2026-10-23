const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// Banco de dados em memória para a demonstração
let submissions = [
  {
    id: 'sub-sample-1',
    name: 'Carlos Eduardo da Silva',
    cpf: '•••.458.912-••',
    processNumber: '0014298-55.2026.8.26.0100',
    court: '2ª Vara Criminal • Comarca da Capital',
    date: '23/10/2026',
    time: '12:45:10',
    status: 'HOMOLOGADO',
    statusLabel: 'Homologado Automático',
    statusColor: 'emerald',
    matchPercent: '99.4%',
    photo: null, // usa placeholder padrão se null
    location: 'São Paulo - SP (Dentro da Comarca)',
    distanceAlert: null,
    antiMock: 'Dispositivo Autêntico (Sem Mock)',
    protocol: 'CJ-2026-94810-SP',
    hash: '7f8a9b4c2e105d8f63aa82c199e4b772d1f0e24b'
  }
];

// Clientes SSE (Server-Sent Events) conectados no PC
const sseClients = new Set();

function broadcastEvent(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

// Obter IP local da máquina na rede LAN (Wi-Fi / Ethernet residencial)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const isVirtual = /vpn|radmin|virtual|vmware|vethernet|docker/i.test(name);
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('169.254')) {
          candidates.push({
            name,
            address: iface.address,
            isVirtual,
            isTypicalLan: iface.address.startsWith('192.168.') || iface.address.startsWith('10.')
          });
        }
      }
    }
  }

  // 1. Prioriza rede LAN residencial (192.168.x.x ou 10.x.x.x) e não-virtual
  const bestLan = candidates.find(c => !c.isVirtual && c.isTypicalLan);
  if (bestLan) return bestLan.address;

  // 2. Prioriza qualquer interface física não virtual
  const nonVirtual = candidates.find(c => !c.isVirtual);
  if (nonVirtual) return nonVirtual.address;

  // 3. Fallback para primeiro candidato ou localhost
  return candidates.length > 0 ? candidates[0].address : 'localhost';
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // ==================== API ENDPOINTS ====================

  // SSE Stream para o Painel do Servidor no PC
  if (pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('retry: 5000\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // Lista de comparecimentos atuais
  if (pathname === '/api/comparecimentos' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(submissions));
    return;
  }

  // Receber novo comparecimento enviado pelo celular
  if (pathname === '/api/comparecer' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Proteção de tamanho (máx 15MB para permitir foto base64 em alta resolução)
      if (body.length > 15 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        const newSubmission = {
          id: 'sub-' + Date.now(),
          name: data.name || 'Carlos Eduardo da Silva',
          cpf: data.cpf || '•••.458.912-••',
          processNumber: data.processNumber || '0014298-55.2026.8.26.0100',
          court: '2ª Vara Criminal • Comarca da Capital',
          date: dateStr,
          time: timeStr,
          status: 'HOMOLOGADO',
          statusLabel: 'Homologado ao Vivo',
          statusColor: 'emerald',
          matchPercent: data.matchPercent || '98.7%',
          photo: data.photo || null, // Imagem Base64 capturada pelo celular
          location: data.location || 'São Paulo - SP (Dentro da Comarca)',
          distanceAlert: data.distanceAlert || null,
          antiMock: data.antiMock || 'Dispositivo Autêntico (Sem Mock)',
          protocol: 'CJ-' + now.getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000) + '-SP',
          hash: data.hash || '7f8a9b' + Math.random().toString(16).substring(2, 12) + '3c2e1'
        };

        // Adiciona no início da lista
        submissions.unshift(newSubmission);

        // Notifica o PC instantaneamente via SSE
        broadcastEvent('novo_comparecimento', newSubmission);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, submission: newSubmission }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON', details: err.message }));
      }
    });
    return;
  }

  // Obter dados de rede para exibir no celular/PC
  if (pathname === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      localIp: getLocalIp(),
      port: PORT,
      mobileUrl: `http://${getLocalIp()}:${PORT}/app`,
      desktopUrl: `http://localhost:${PORT}/painel`
    }));
    return;
  }

  // ==================== ROTAS DE ATALHO ====================
  if (pathname === '/app') {
    serveFile(res, path.join(ROOT_DIR, 'tela1_dashboard.html'));
    return;
  }

  if (pathname === '/painel') {
    serveFile(res, path.join(ROOT_DIR, 'tela4_painel_servidor.html'));
    return;
  }

  // ==================== SERVIR ARQUIVOS ESTÁTICOS ====================
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Segurança para não escapar do diretório raiz
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Acesso negado');
    return;
  }

  serveFile(res, filePath);
});

function serveFile(res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado: ' + path.basename(filePath));
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
      '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`\n======================================================`);
  console.log(`⚖️  COMPARECEJUS • SERVIDOR DE SINCRONIZAÇÃO EM TEMPO REAL`);
  console.log(`======================================================`);
  console.log(`💻 NO COMPUTADOR (Painel da Secretaria):`);
  console.log(`   http://localhost:${PORT}/painel`);
  console.log(`   http://localhost:${PORT}  (Hub com alternador)`);
  console.log(`\n📱 NO CELULAR (Mesma rede Wi-Fi):`);
  console.log(`   http://${localIp}:${PORT}/app`);
  console.log(`======================================================\n`);
});
