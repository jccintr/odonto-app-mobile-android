// Valores da API vêm em centavos (inteiros). Sem Intl (o Hermes do Android não garante o formato pt-BR).

/** 123456 → "R$ 1.234,56" */
export function formatMoney(cents) {
  const value = Math.round(cents ?? 0);
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const reais = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${reais},${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Texto digitado → centavos. Aceita "1.234,56", "1234,5", "1234.56", "R$ 20" e "20".
 * Devolve null se não for um valor válido (vazio, letras, negativo, milhares fora de lugar).
 */
export function parseMoney(text) {
  if (text === null || text === undefined) return null;
  const s = String(text).replace(/R\$|\s/g, '');
  if (s === '' || /[^0-9.,]/.test(s)) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let integer = s;
  let decimals = '';
  let thousands = null;
  if (lastComma > -1 && lastDot > -1) {
    const decimalAt = Math.max(lastComma, lastDot);
    thousands = decimalAt === lastComma ? '.' : ',';
    integer = s.slice(0, decimalAt);
    decimals = s.slice(decimalAt + 1);
  } else if (lastComma > -1) {
    integer = s.slice(0, lastComma);
    decimals = s.slice(lastComma + 1);
  } else if (lastDot > -1) {
    const after = s.length - lastDot - 1;
    if (s.indexOf('.') === lastDot && after !== 3) { integer = s.slice(0, lastDot); decimals = s.slice(lastDot + 1); } else thousands = '.';
  }
  if (thousands) {
    if (!new RegExp(`^\\d{1,3}(\\${thousands}\\d{3})+$`).test(integer)) return null;
    integer = integer.split(thousands).join('');
  }
  if (!/^\d+$/.test(integer) || !/^\d{1,2}$|^$/.test(decimals) || (decimals === '' && /[.,]$/.test(s))) return null;
  return Number(integer) * 100 + Number(decimals.padEnd(2, '0'));
}

/** centavos → texto editável ("1234,50") */
export const centsToInput = (cents) => (cents === null || cents === undefined ? '' : (cents / 100).toFixed(2).replace('.', ','));
