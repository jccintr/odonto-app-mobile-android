import { toothDescription } from '../../src/components/Odontogram';

describe('toothDescription', () => {
  it('descreve o dente com marcações e planejamento', () => {
    expect(toothDescription(16)).toBe('Dente 16');
    const planned = [
      { procedure: { name: 'Restauração' }, faces: 'O', approved: true },
      { procedure: { name: 'Limpeza' }, faces: null, approved: false },
    ];
    expect(toothDescription(16, [], planned)).toBe('Dente 16. Planejado: Restauração (O) — aprovado, Limpeza — proposto');
    expect(toothDescription(16, [{ condition: 'fracture', faces: 'O' }], [])).toContain('(O)');
  });
});
