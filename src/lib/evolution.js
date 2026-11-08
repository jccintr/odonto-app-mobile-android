// Registro do que foi feito no atendimento (vai para o prontuário). Mesmas regras da API:
// todo procedimento diz ONDE foi feito (os dentes afetados ou boca toda) e é obrigatório ao menos um.
export const MIN_DESCRIPTION = 3;

/**
 * Cada procedimento do registro é { id, label, teeth: [FDI], wholeMouth, fixed }.
 * `fixed`: item de orçamento que já tem dente definido (vale o do orçamento; não se edita aqui).
 */
export const toggleEntry = (list, entry) => (list.some((e) => e.id === entry.id) ? list.filter((e) => e.id !== entry.id) : [...list, { teeth: [], wholeMouth: false, fixed: false, ...entry }]);

const change = (list, id, fn) => list.map((e) => (e.id === id ? fn(e) : e));

/** Marca/desmarca um dente do procedimento (escolher um dente tira a "boca toda"). */
export const toggleToothOf = (list, id, tooth) => change(list, id, (e) => ({
  ...e, wholeMouth: false, teeth: e.teeth.includes(tooth) ? e.teeth.filter((t) => t !== tooth) : [...e.teeth, tooth].sort((a, b) => a - b),
}));

/** Liga/desliga "boca toda" (ligar limpa os dentes). */
export const toggleWholeMouthOf = (list, id) => change(list, id, (e) => (e.wholeMouth ? { ...e, wholeMouth: false } : { ...e, wholeMouth: true, teeth: [] }));

/** Onde foi feito, em palavras. */
export const whereLabel = (e) => (e.wholeMouth ? 'Boca toda' : e.teeth.length > 0 ? `${e.teeth.length === 1 ? 'Dente' : 'Dentes'}: ${e.teeth.join(', ')}` : 'Toque nos dentes afetados');

/** Mensagem do que falta para concluir o atendimento, ou null quando já dá para registrar. */
export function evolutionProblem({ description = '', procedures = [], budgetItems = [] }) {
  const text = description.trim();
  if (text.length > 0 && text.length < MIN_DESCRIPTION) return `Descreva com pelo menos ${MIN_DESCRIPTION} letras.`;
  if (procedures.length === 0 && budgetItems.length === 0) return 'Informe o procedimento realizado e os dentes afetados.';
  const missing = [...procedures, ...budgetItems].find((e) => !e.fixed && !e.wholeMouth && e.teeth.length === 0);
  if (missing) return `Informe os dentes afetados em "${missing.label}" ou marque boca toda.`;
  return null;
}

const wherePart = (e) => (e.wholeMouth ? { wholeMouth: true } : { teeth: e.teeth });

/** Corpo da evolução enviado à API. */
export function buildEvolution({ description = '', procedures = [], budgetItems = [] }) {
  const text = description.trim();
  return {
    ...(text && { description: text }),
    procedures: procedures.map((e) => ({ procedureId: e.id, ...wherePart(e) })),
    budgetItems: budgetItems.map((e) => ({ itemId: e.id, ...(e.fixed ? {} : wherePart(e)) })),
  };
}
