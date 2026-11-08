// Gesto de arrastar na horizontal para trocar de página (dia da agenda).
export const SWIPE_MIN_DISTANCE = 60; // dp percorridos na horizontal
export const SWIPE_DOMINANCE = 1.5; // quanto o movimento horizontal precisa superar o vertical (rolar a lista não conta)

/** Deslocamento do dedo → 'next' (arrastou para a esquerda), 'prev' (para a direita) ou null. */
export function swipeDirection(dx, dy) {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_DOMINANCE) return null;
  return dx < 0 ? 'next' : 'prev';
}
