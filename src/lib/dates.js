// Datas "de calendário" no horário de Brasília (UTC-03:00 o ano todo, sem horário de verão desde 2019), igual à API.
// Sem Intl: o Hermes do Android não garante fuso nem nomes em português.
const OFFSET_MS = -3 * 3_600_000;
const pad = (n) => String(n).padStart(2, '0');
const brasilia = (date) => new Date(new Date(date).getTime() + OFFSET_MS); // lido com getUTC*

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** 'AAAA-MM-DD' de um instante, em Brasília */
export function dayOf(date = new Date()) {
  const d = brasilia(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 'HH:MM' de um instante, em Brasília */
export function timeOf(date) {
  const d = brasilia(date);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Soma dias a 'AAAA-MM-DD'. */
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** 'AAAA-MM-DD' → '06/11/2026' */
export const formatDay = (day) => (day ? day.split('-').reverse().join('/') : '');

const weekday = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** 'AAAA-MM-DD' → 'sexta-feira, 6 de novembro' */
export function formatDayLong(day) {
  const [, m, d] = day.split('-').map(Number);
  return `${WEEKDAYS[weekday(day)]}, ${d} de ${MONTHS[m - 1]}`;
}

/** 'AAAA-MM-DD' → 'sex' */
export const weekdayShort = (day) => WEEKDAYS[weekday(day)].slice(0, 3);

/** instante → '06/11/2026 às 14:30' */
export const formatDateTime = (date) => (date ? `${formatDay(dayOf(date))} às ${timeOf(date)}` : '');

/** 'AAAA-MM-DD' + 'HH:MM' (hora de Brasília) → ISO com fuso, para enviar à API */
export const toIso = (day, time) => `${day}T${time}:00-03:00`;

/** Idade em anos completos a partir de 'AAAA-MM-DD' */
export function ageOf(birthDay, today = dayOf()) {
  if (!birthDay) return null;
  const [by, bm, bd] = birthDay.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/** 'AAAA-MM-DD' → 'AAAA-MM' */
export const monthOf = (day) => day.slice(0, 7);

/** Soma meses a 'AAAA-MM' (pode ser negativo). */
export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** 'AAAA-MM' → 'novembro de 2026' */
export const formatMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} de ${y}`;
};

/** Calendário de um mês: semanas (domingo a sábado) com 'AAAA-MM-DD' ou null nos dias de fora do mês. */
export function monthGrid(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => `${month}-${pad(i + 1)}`)];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** 0 = domingo … 6 = sábado, de 'AAAA-MM-DD' */
export const weekdayIndex = (day) => weekday(day);

/** 'AAAA-MM' → 'nov' */
export const monthShort = (month) => MONTHS[Number(month.slice(5, 7)) - 1].slice(0, 3);
