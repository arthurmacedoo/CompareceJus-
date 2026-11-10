'use strict';

const TZ = 'America/Sao_Paulo';

/** Partes da data no fuso de Brasília, independentemente do fuso do servidor. */
function partes(data = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(data).map((x) => [x.type, x.value]));
  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: Number(p.hour) % 24,
    minuto: Number(p.minute),
  };
}

const pad = (n) => String(n).padStart(2, '0');

/** Competência no formato AAAA-MM (mês de referência da apresentação). */
function competencia(data = new Date()) {
  const p = partes(data);
  return `${p.ano}-${pad(p.mes)}`;
}

function competenciaAnterior(comp) {
  let [a, m] = comp.split('-').map(Number);
  m -= 1;
  if (m === 0) {
    m = 12;
    a -= 1;
  }
  return `${a}-${pad(m)}`;
}

function ultimoDia(comp) {
  const [a, m] = comp.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function nomeCompetencia(comp) {
  const [a, m] = comp.split('-').map(Number);
  return `${MESES[m - 1]} / ${a}`;
}

/** Janela da competência: dia inicial e final (padrão: mês inteiro). */
function janela(comp, diaInicio = 1, diaFim = null) {
  const fim = Math.min(diaFim || 31, ultimoDia(comp));
  return { comp, diaInicio, diaFim: fim };
}

function dentroDaJanela(data, comp, diaInicio = 1, diaFim = null) {
  const p = partes(data);
  const atual = `${p.ano}-${pad(p.mes)}`;
  const j = janela(comp, diaInicio, diaFim);
  return atual === comp && p.dia >= j.diaInicio && p.dia <= j.diaFim;
}

function diasRestantes(comp, diaFim = null, data = new Date()) {
  const p = partes(data);
  const j = janela(comp, 1, diaFim);
  return Math.max(0, j.diaFim - p.dia);
}

function formatar(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(iso));
}

module.exports = {
  TZ,
  partes,
  competencia,
  competenciaAnterior,
  nomeCompetencia,
  janela,
  dentroDaJanela,
  diasRestantes,
  ultimoDia,
  formatar,
};
