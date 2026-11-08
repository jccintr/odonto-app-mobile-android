export const itemLabel = (item) => [item.procedure.name, item.tooth && `dente ${item.tooth}${item.faces ? ` (${item.faces})` : ''}`].filter(Boolean).join(' — ');

/** subtotal dos itens do formulário (centavos) */
export const subtotalOf = (items) => items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);
