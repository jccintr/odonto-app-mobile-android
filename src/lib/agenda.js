// Visões da agenda (dia, semana, mês): intervalos, títulos, agrupamento e posição dos blocos. Semana de domingo a sábado, como no calendário.
import { addDays, dayOf, formatDayLong, formatMonth, monthOf, monthShort, shiftMonth, timeOf, weekdayIndex, weekdayShort } from './dates';

export const VIEWS = [{ id: 'day', label: 'Dia' }, { id: 'week', label: 'Semana' }, { id: 'month', label: 'Mês' }];

export const weekStart = (day) => addDays(day, -weekdayIndex(day));
export const weekDays = (day) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(day), i));

/** Intervalo [from, to) em dias 'AAAA-MM-DD' que a visão mostra a partir do dia de referência. */
export function rangeFor(view, day) {
  if (view === 'day') return { from: day, to: addDays(day, 1) };
  if (view === 'week') { const start = weekStart(day); return { from: start, to: addDays(start, 7) }; }
  const month = monthOf(day);
  return { from: `${month}-01`, to: `${shiftMonth(month, 1)}-01` };
}

/** Dia de referência depois de avançar (+1) ou voltar (-1) um período. No mês vai para o dia 1. */
export function shiftPeriod(view, day, direction) {
  if (view === 'day') return addDays(day, direction);
  if (view === 'week') return addDays(day, 7 * direction);
  return `${shiftMonth(monthOf(day), direction)}-01`;
}

/** A visão atual inclui o dia de hoje? (decide entre "Ir para hoje" e o rótulo do período atual) */
export function includesToday(view, day, today = dayOf()) {
  const { from, to } = rangeFor(view, day);
  return today >= from && today < to;
}

const dayNumber = (day) => Number(day.slice(8));

/** 'sexta-feira, 6 de novembro' | '1 a 7 de novembro' | '29 de out a 4 de nov' | 'novembro de 2026' */
export function periodTitle(view, day) {
  if (view === 'day') return formatDayLong(day);
  if (view === 'month') return formatMonth(monthOf(day));
  const start = weekStart(day);
  const end = addDays(start, 6);
  if (monthOf(start) === monthOf(end)) return `${dayNumber(start)} a ${dayNumber(end)} de ${formatMonth(monthOf(end)).split(' de ')[0]}`;
  return `${dayNumber(start)} de ${monthShort(monthOf(start))} a ${dayNumber(end)} de ${monthShort(monthOf(end))}`;
}

export const CURRENT_LABEL = { day: 'Hoje', week: 'Esta semana', month: 'Este mês' };

/** 'seg 3' */
export const dayLabel = (day) => `${weekdayShort(day)} ${dayNumber(day)}`;

export const sortByStart = (list) => [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

/** { 'AAAA-MM-DD': [atendimentos em ordem de horário] } (dia em Brasília) */
export function groupByDay(list) {
  const groups = {};
  for (const appointment of sortByStart(list)) (groups[dayOf(appointment.startsAt)] ??= []).push(appointment);
  return groups;
}

/** Quantos atendimentos ativos (não cancelados) há em cada dia. */
export function countsByDay(list) {
  const counts = {};
  for (const appointment of list) if (appointment.status !== 'canceled') counts[dayOf(appointment.startsAt)] = (counts[dayOf(appointment.startsAt)] ?? 0) + 1;
  return counts;
}

const minutesOf = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const DEFAULT_HOURS = [7, 19];

/** Faixa de horas da grade semanal: cobre todos os atendimentos e, no mínimo, o expediente padrão (7h às 19h). */
export function gridHours(list) {
  let [first, last] = DEFAULT_HOURS;
  for (const appointment of list) {
    first = Math.min(first, Math.floor(minutesOf(timeOf(appointment.startsAt)) / 60));
    const end = dayOf(appointment.endsAt) === dayOf(appointment.startsAt) ? minutesOf(timeOf(appointment.endsAt)) : 24 * 60;
    last = Math.max(last, Math.ceil(end / 60));
  }
  return [first, last];
}

/** Posição vertical (dp) do bloco de um atendimento na grade semanal. */
export function blockPosition(appointment, firstHour, hourHeight, minHeight = 26) {
  const start = minutesOf(timeOf(appointment.startsAt));
  const end = dayOf(appointment.endsAt) === dayOf(appointment.startsAt) ? minutesOf(timeOf(appointment.endsAt)) : 24 * 60;
  return { top: ((start - firstHour * 60) / 60) * hourHeight, height: Math.max(((end - start) / 60) * hourHeight, minHeight) };
}
