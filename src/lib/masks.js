export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

export function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
}


/** (DD) 0000-0000 ou (DD) 00000-0000, conforme vai digitando. A API guarda só os dígitos. */
export function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** DDD + número (10 ou 11 dígitos); vazio é aceito (telefone opcional). */
export const isValidPhone = (value) => onlyDigits(value) === '' || /^\d{10,11}$/.test(onlyDigits(value));
