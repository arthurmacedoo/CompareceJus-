'use strict';

const { hashCanonico, novoId } = require('./seguranca');

/**
 * Trilha de Auditoria Encadeada (Append-Only)
 * Cada evento contém o hash do evento anterior, garantindo integridade
 * e não-repúdio conforme exigido pelas Corregedorias Gerais de Justiça.
 */
class TrilhaAuditoria {
  constructor(obterHistorico, salvarHistorico) {
    this.obterHistorico = obterHistorico;
    this.salvarHistorico = salvarHistorico;
  }

  registrar({ tipo, ator, reuId, protocolo, dados, ip }) {
    const historico = this.obterHistorico() || [];
    const ultimo = historico[historico.length - 1];
    const hashAnterior = ultimo ? ultimo.hashAtual : '0'.repeat(64);

    const evento = {
      id: novoId('aud'),
      timestamp: new Date().toISOString(),
      tipo,
      ator: ator || { tipo: 'SISTEMA', nome: 'CompareceJus Engine' },
      reuId: reuId || null,
      protocolo: protocolo || null,
      ip: ip || '127.0.0.1',
      dados: dados || {},
      hashAnterior,
    };

    evento.hashAtual = hashCanonico(evento);
    historico.push(evento);
    this.salvarHistorico(historico);
    return evento;
  }

  verificarIntegridade() {
    const historico = this.obterHistorico() || [];
    for (let i = 0; i < historico.length; i++) {
      const item = historico[i];
      const anterior = i > 0 ? historico[i - 1] : null;
      const hashEsperadoAnterior = anterior ? anterior.hashAtual : '0'.repeat(64);

      if (item.hashAnterior !== hashEsperadoAnterior) {
        return { valida: false, erro: `Quebra de elo no evento índice ${i} (ID: ${item.id})` };
      }

      const clone = { ...item };
      delete clone.hashAtual;
      const hashCalculado = hashCanonico(clone);
      if (item.hashAtual !== hashCalculado) {
        return { valida: false, erro: `Adulteração de conteúdo detectada no evento índice ${i} (ID: ${item.id})` };
      }
    }
    return { valida: true, totalEventos: historico.length };
  }
}

module.exports = { TrilhaAuditoria };
