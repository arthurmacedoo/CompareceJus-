'use strict';

const crypto = require('crypto');

const sha256 = (dado) =>
  crypto.createHash('sha256').update(typeof dado === 'string' ? dado : JSON.stringify(dado)).digest('hex');

/** JSON canônico (chaves ordenadas) para que o hash seja reprodutível. */
function canonico(obj) {
  if (Array.isArray(obj)) return `[${obj.map(canonico).join(',')}]`;
  if (obj && typeof obj === 'object') {
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonico(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(obj);
}

const hashCanonico = (obj) => sha256(canonico(obj));

function hashSenha(senha, sal = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(senha, sal, 32).toString('hex');
  return `${sal}:${h}`;
}

function conferirSenha(senha, armazenado) {
  const [sal, h] = String(armazenado).split(':');
  if (!sal || !h) return false;
  const calc = crypto.scryptSync(senha, sal, 32);
  const ref = Buffer.from(h, 'hex');
  return ref.length === calc.length && crypto.timingSafeEqual(ref, calc);
}

const novoToken = () => crypto.randomBytes(24).toString('base64url');
const novoId = (prefixo) => `${prefixo}_${crypto.randomBytes(6).toString('hex')}`;

/** Protocolo legível: CJ-2026-000123-7 (dígito verificador módulo 11). */
function protocolo(prefixo, ano, sequencial) {
  const num = String(sequencial).padStart(6, '0');
  let soma = 0;
  num.split('').forEach((d, i) => (soma += Number(d) * (i + 2)));
  const dv = (soma * 10) % 11 % 10;
  return `${prefixo}-${ano}-${num}-${dv}`;
}

function cpfValido(cpf) {
  const c = String(cpf || '').replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const dv = (base) => {
    let s = 0;
    for (let i = 0; i < base.length; i++) s += Number(base[i]) * (base.length + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(c.slice(0, 9)) === Number(c[9]) && dv(c.slice(0, 10)) === Number(c[10]);
}

const somenteDigitos = (s) => String(s || '').replace(/\D/g, '');

function mascararCpf(cpf) {
  const c = somenteDigitos(cpf);
  if (c.length !== 11) return '***';
  return `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**`;
}

function iniciais(nome) {
  return String(nome || '')
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(p))
    .map((p) => p[0].toUpperCase() + '.')
    .join(' ');
}

module.exports = {
  sha256,
  canonico,
  hashCanonico,
  hashSenha,
  conferirSenha,
  novoToken,
  novoId,
  protocolo,
  cpfValido,
  somenteDigitos,
  mascararCpf,
  iniciais,
};
