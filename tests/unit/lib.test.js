import { ageOf, addDays, dayOf, formatDateTime, formatDay, formatDayLong, formatMonth, monthGrid, monthOf, shiftMonth, timeOf, toIso, weekdayShort } from '../../src/lib/dates';
import { SWIPE_MIN_DISTANCE, swipeDirection } from '../../src/lib/gestures';
import * as agenda from '../../src/lib/agenda';
import { monthShort, weekdayIndex } from '../../src/lib/dates';
import { centsToInput, formatMoney, parseMoney } from '../../src/lib/money';
import { maskCpf, onlyDigits } from '../../src/lib/masks';
import { ANAMNESIS_CONDITIONS, conditionLabels, emptyAnamnesis, readAnamnesis } from '../../src/lib/patient';
import { buildEvolution, evolutionProblem, toggleEntry, toggleToothOf, toggleWholeMouthOf, whereLabel } from '../../src/lib/evolution';
import { itemLabel, subtotalOf } from '../../src/lib/budget';
import { DARK, LIGHT, isTabletWidth, paletteFor, toneColors } from '../../src/lib/theme';
import { ALL_TEETH, FACES, isDeciduous, isTooth, normalizeFaces, toothLabel } from '../../src/lib/tooth';
import { APPOINTMENT_STATUS, BUDGET_STATUS, CONDITION, IMAGE_KIND, ITEM_STATUS } from '../../src/lib/labels';

describe('datas (Brasília, sem Intl)', () => {
  it('dayOf e timeOf usam UTC-3: 02:00 UTC ainda é o dia anterior', () => {
    expect(dayOf(new Date('2026-11-03T02:00:00Z'))).toBe('2026-11-02');
    expect(dayOf(new Date('2026-11-03T03:00:00Z'))).toBe('2026-11-03');
    expect(timeOf('2026-11-03T13:05:00.000Z')).toBe('10:05');
    expect(timeOf('2026-11-03T02:30:00.000Z')).toBe('23:30');
    expect(dayOf()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('soma dias atravessando mês, ano e fevereiro bissexto', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2026-11-15', 0)).toBe('2026-11-15');
  });

  it('formatações', () => {
    expect(formatDay('2026-11-06')).toBe('06/11/2026');
    expect(formatDay(null)).toBe('');
    expect(formatDayLong('2026-11-06')).toBe('sexta-feira, 6 de novembro');
    expect(formatDayLong('2026-12-27')).toBe('domingo, 27 de dezembro');
    expect(weekdayShort('2026-11-06')).toBe('sex');
    expect(formatDateTime('2026-11-06T17:30:00Z')).toBe('06/11/2026 às 14:30');
    expect(formatDateTime(null)).toBe('');
    expect(toIso('2026-11-06', '09:00')).toBe('2026-11-06T09:00:00-03:00');
  });

  it('idade em anos completos', () => {
    expect(ageOf(null)).toBeNull();
    expect(ageOf('1990-05-17', '2026-05-16')).toBe(35);
    expect(ageOf('1990-05-17', '2026-05-17')).toBe(36);
    expect(ageOf('1990-05-17', '2026-04-30')).toBe(35);
    expect(ageOf('1990-05-17', '2026-06-01')).toBe(36);
    expect(ageOf('1990-05-17')).toBeGreaterThanOrEqual(36);
  });
});

describe('dinheiro', () => {
  it('formata em reais, com milhares e sinal', () => {
    expect(formatMoney(123456)).toBe('R$ 1.234,56');
    expect(formatMoney(5)).toBe('R$ 0,05');
    expect(formatMoney(0)).toBe('R$ 0,00');
    expect(formatMoney(100000000)).toBe('R$ 1.000.000,00');
    expect(formatMoney(-2550)).toBe('-R$ 25,50');
    expect(formatMoney(null)).toBe('R$ 0,00');
    expect(formatMoney(150.4)).toBe('R$ 1,50');
  });

  it.each([
    ['20', 2000], ['R$ 20', 2000], ['20,5', 2050], ['20,50', 2050], ['1.234,56', 123456], ['1,234.56', 123456], ['1234.56', 123456], ['1234,5', 123450],
    ['1.234', 123400], ['1.000.000', 100000000], ['0,05', 5], [' R$ 1.500,00 ', 150000], ['12.5', 1250],
  ])('parseMoney(%s) = %i', (text, cents) => expect(parseMoney(text)).toBe(cents));

  it.each([null, undefined, '', 'abc', '-5', '1.2.3', '1,234,5', '12,345', '1.23.456', '20,', '20.', '1,2,3', '12,3,4'])('parseMoney(%s) é inválido', (text) => expect(parseMoney(text)).toBeNull());

  it('centsToInput', () => {
    expect(centsToInput(123450)).toBe('1234,50');
    expect(centsToInput(null)).toBe('');
    expect(centsToInput(undefined)).toBe('');
  });
});

describe('máscaras', () => {
  it('só dígitos e CPF', () => {
    expect(onlyDigits('(35) 9999-1234')).toBe('3599991234');
    expect(onlyDigits(null)).toBe('');
    expect(maskCpf('52998224725')).toBe('529.982.247-25');
    expect(maskCpf('529')).toBe('529');
    expect(maskCpf('5299822')).toBe('529.982.2');
  });
});

describe('anamnese e orçamento', () => {
  it('lê a anamnese com padrões e traduz as condições', () => {
    expect(readAnamnesis(null)).toEqual(emptyAnamnesis());
    expect(readAnamnesis('texto')).toEqual(emptyAnamnesis());
    expect(readAnamnesis({ allergies: 'dipirona', conditions: ['diabetes'] })).toMatchObject({ allergies: 'dipirona', medications: '', conditions: ['diabetes'] });
    expect(conditionLabels(['diabetes', 'outra'])).toEqual(['Diabetes', 'outra']);
    expect(conditionLabels()).toEqual([]);
    expect(ANAMNESIS_CONDITIONS.length).toBe(10);
  });

  it('rótulo dos itens, subtotal e pendentes', () => {
    expect(itemLabel({ procedure: { name: 'Restauração' }, tooth: 16, faces: 'OD' })).toBe('Restauração — dente 16 (OD)');
    expect(itemLabel({ procedure: { name: 'Limpeza' }, tooth: null, faces: null })).toBe('Limpeza');
    expect(itemLabel({ procedure: { name: 'Canal' }, tooth: 46, faces: null })).toBe('Canal — dente 46');
    expect(subtotalOf([{ priceCents: 100 }, { priceCents: 250 }, {}])).toBe(350);
  });
});

describe('tema', () => {
  it('paleta pela preferência e pelo aparelho', () => {
    expect(paletteFor('light', 'dark')).toBe(LIGHT);
    expect(paletteFor('dark', 'light')).toBe(DARK);
    expect(paletteFor('system', 'dark')).toBe(DARK);
    expect(paletteFor('system', 'light')).toBe(LIGHT);
    expect(paletteFor('system', null)).toBe(LIGHT);
  });

  it('cores dos tons e tablet', () => {
    expect(toneColors(LIGHT, 'success')).toEqual({ bg: LIGHT.successSoft, fg: LIGHT.success });
    expect(toneColors(LIGHT, 'inexistente')).toEqual({ bg: LIGHT.surface2, fg: LIGHT.muted });
    expect(isTabletWidth(719)).toBe(false);
    expect(isTabletWidth(720)).toBe(true);
  });
});

describe('dentes e rótulos', () => {
  it('numeração FDI', () => {
    expect(ALL_TEETH).toHaveLength(52);
    expect(isTooth(16)).toBe(true);
    expect(isTooth('55')).toBe(true);
    expect(isTooth(19)).toBe(false);
    expect(isDeciduous(55)).toBe(true);
    expect(isDeciduous(16)).toBe(false);
    expect(FACES).toHaveLength(5);
    expect(normalizeFaces('od')).toBe('DO');
    expect(normalizeFaces(null)).toBe('');
    expect(toothLabel(16)).toBe('Dente 16 — superior direito');
    expect(toothLabel(99)).toBe('Dente 99 —');
  });

  it('tabelas de rótulos cobrem todos os valores da API', () => {
    expect(Object.keys(APPOINTMENT_STATUS)).toEqual(['scheduled', 'confirmed', 'in_progress', 'attended', 'no_show', 'canceled']);
    expect(Object.keys(BUDGET_STATUS)).toEqual(['open', 'approved', 'rejected', 'completed']);
    expect(Object.keys(ITEM_STATUS)).toEqual(['proposed', 'pending', 'done', 'canceled']);
    expect(Object.keys(CONDITION)).toHaveLength(11);
    expect(IMAGE_KIND.xray).toBe('Radiografia');
  });
});

describe('calendário', () => {
  it('mês de um dia, soma de meses e nome do mês', () => {
    expect(monthOf('2026-11-06')).toBe('2026-11');
    expect(shiftMonth('2026-11', 1)).toBe('2026-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-05', 0)).toBe('2026-05');
    expect(formatMonth('2026-11')).toBe('novembro de 2026');
    expect(formatMonth('2027-03')).toBe('março de 2027');
  });

  it('grade do mês: semanas de domingo a sábado, com vazios fora do mês', () => {
    const nov = monthGrid('2026-11'); // 1º de novembro de 2026 é domingo; 30 dias
    expect(nov).toHaveLength(5);
    expect(nov[0]).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
    expect(nov[4]).toEqual(['2026-11-29', '2026-11-30', null, null, null, null, null]);

    const fev = monthGrid('2026-02'); // 1º de fevereiro de 2026 é domingo; 28 dias: 4 semanas certas
    expect(fev).toHaveLength(4);
    expect(fev.flat().every(Boolean)).toBe(true);

    const out = monthGrid('2026-10'); // 1º de outubro de 2026 é quinta; 31 dias
    expect(out[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(out[0][4]).toBe('2026-10-01');
    expect(out.flat().filter(Boolean)).toHaveLength(31);
    expect(out.every((w) => w.length === 7)).toBe(true);

    expect(monthGrid('2028-02').flat().filter(Boolean)).toHaveLength(29); // bissexto
  });
});

describe('gesto de arrastar', () => {
  it('só conta arrasto horizontal longo e mais horizontal que vertical', () => {
    expect(swipeDirection(-SWIPE_MIN_DISTANCE, 0)).toBe('next');
    expect(swipeDirection(-120, 30)).toBe('next');
    expect(swipeDirection(SWIPE_MIN_DISTANCE, 5)).toBe('prev');
    expect(swipeDirection(-(SWIPE_MIN_DISTANCE - 1), 0)).toBeNull(); // curto demais
    expect(swipeDirection(-100, 100)).toBeNull(); // diagonal: é rolagem
    expect(swipeDirection(0, 200)).toBeNull(); // rolar a lista
    expect(swipeDirection(-90, 60)).toBe('next'); // 90 >= 1.5 * 60
  });
});

describe('visões da agenda', () => {
  const ap = (start, end, status = 'scheduled', id = start) => ({ id, startsAt: start, endsAt: end, status });
  // 2026-11-03 13:00Z = 10:00 em Brasília (terça-feira)
  const A = ap('2026-11-03T13:00:00Z', '2026-11-03T14:00:00Z');
  const B = ap('2026-11-03T17:00:00Z', '2026-11-03T17:15:00Z', 'confirmed');
  const C = ap('2026-11-04T12:00:00Z', '2026-11-04T13:00:00Z', 'canceled');

  it('dia da semana e mês abreviado', () => {
    expect(weekdayIndex('2026-11-01')).toBe(0);
    expect(weekdayIndex('2026-11-07')).toBe(6);
    expect(monthShort('2026-10')).toBe('out');
  });

  it('semana de domingo a sábado', () => {
    expect(agenda.weekStart('2026-11-04')).toBe('2026-11-01');
    expect(agenda.weekStart('2026-11-01')).toBe('2026-11-01');
    expect(agenda.weekStart('2026-11-07')).toBe('2026-11-01');
    expect(agenda.weekDays('2026-11-04')).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
  });

  it('intervalo de cada visão', () => {
    expect(agenda.rangeFor('day', '2026-11-03')).toEqual({ from: '2026-11-03', to: '2026-11-04' });
    expect(agenda.rangeFor('week', '2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-08' });
    expect(agenda.rangeFor('month', '2026-11-17')).toEqual({ from: '2026-11-01', to: '2026-12-01' });
    expect(agenda.rangeFor('month', '2026-12-31')).toEqual({ from: '2026-12-01', to: '2027-01-01' });
  });

  it('avançar e voltar um período', () => {
    expect(agenda.shiftPeriod('day', '2026-11-30', 1)).toBe('2026-12-01');
    expect(agenda.shiftPeriod('day', '2026-11-01', -1)).toBe('2026-10-31');
    expect(agenda.shiftPeriod('week', '2026-11-03', 1)).toBe('2026-11-10');
    expect(agenda.shiftPeriod('week', '2026-11-03', -1)).toBe('2026-10-27');
    expect(agenda.shiftPeriod('month', '2026-11-17', 1)).toBe('2026-12-01');
    expect(agenda.shiftPeriod('month', '2026-01-17', -1)).toBe('2025-12-01');
  });

  it('a visão inclui hoje?', () => {
    expect(agenda.includesToday('day', '2026-11-03', '2026-11-03')).toBe(true);
    expect(agenda.includesToday('day', '2026-11-04', '2026-11-03')).toBe(false);
    expect(agenda.includesToday('week', '2026-11-07', '2026-11-01')).toBe(true);
    expect(agenda.includesToday('week', '2026-11-08', '2026-11-07')).toBe(false);
    expect(agenda.includesToday('month', '2026-11-30', '2026-11-01')).toBe(true);
    expect(agenda.includesToday('month', '2026-11-30', '2026-12-01')).toBe(false);
    expect(agenda.includesToday('day', dayOf())).toBe(true);
  });

  it('títulos dos períodos', () => {
    expect(agenda.periodTitle('day', '2026-11-06')).toBe('sexta-feira, 6 de novembro');
    expect(agenda.periodTitle('week', '2026-11-04')).toBe('1 a 7 de novembro');
    expect(agenda.periodTitle('week', '2026-10-29')).toBe('25 a 31 de outubro');
    expect(agenda.periodTitle('week', '2026-11-30')).toBe('29 de nov a 5 de dez');
    expect(agenda.periodTitle('week', '2026-11-01')).toBe('1 a 7 de novembro');
    expect(agenda.periodTitle('week', '2026-12-30')).toBe('27 de dez a 2 de jan');
    expect(agenda.periodTitle('month', '2026-11-17')).toBe('novembro de 2026');
    expect(agenda.CURRENT_LABEL.week).toBe('Esta semana');
    expect(agenda.VIEWS.map((v) => v.id)).toEqual(['day', 'week', 'month']);
    expect(agenda.dayLabel('2026-11-02')).toBe('seg 2');
  });

  it('agrupa por dia em ordem de horário e conta só os não cancelados', () => {
    const groups = agenda.groupByDay([B, C, A]);
    expect(Object.keys(groups)).toEqual(['2026-11-03', '2026-11-04']);
    expect(groups['2026-11-03'].map((x) => x.id)).toEqual([A.id, B.id]);
    expect(agenda.countsByDay([A, B, C])).toEqual({ '2026-11-03': 2 });
    expect(agenda.countsByDay([])).toEqual({});
    expect(agenda.sortByStart([B, A]).map((x) => x.id)).toEqual([A.id, B.id]);
  });

  it('faixa de horas da grade e posição dos blocos', () => {
    expect(agenda.gridHours([])).toEqual([7, 19]);
    expect(agenda.gridHours([A, B])).toEqual([7, 19]);
    expect(agenda.gridHours([ap('2026-11-03T09:30:00Z', '2026-11-03T10:30:00Z'), ap('2026-11-03T22:30:00Z', '2026-11-03T23:15:00Z')])).toEqual([6, 21]);
    expect(agenda.gridHours([ap('2026-11-03T20:00:00Z', '2026-11-04T05:00:00Z')])).toEqual([7, 24]); // passa da meia-noite

    expect(agenda.blockPosition(A, 7, 48)).toEqual({ top: 144, height: 48 }); // 10:00 às 11:00
    expect(agenda.blockPosition(B, 7, 48)).toEqual({ top: 336, height: 26 }); // 14:00 por 15 min: altura mínima
    expect(agenda.blockPosition(ap('2026-11-03T20:00:00Z', '2026-11-04T05:00:00Z'), 7, 48)).toEqual({ top: 480, height: 336 }); // 17:00 até 24:00
    expect(agenda.blockPosition(A, 7, 48, 60).height).toBe(60);
  });
});

describe('evolução do atendimento', () => {
  const crown = { id: 'p1', label: 'Restauração' };
  const fixed = { id: 'i1', label: 'Canal — dente 36', fixed: true, teeth: [36] };

  it('marca os dentes afetados e a boca toda de cada procedimento', () => {
    let list = toggleEntry([], crown);
    expect(list).toEqual([{ id: 'p1', label: 'Restauração', teeth: [], wholeMouth: false, fixed: false }]);
    list = toggleToothOf(list, 'p1', 26);
    list = toggleToothOf(list, 'p1', 16);
    expect(list[0].teeth).toEqual([16, 26]); // ordenados
    expect(whereLabel(list[0])).toBe('Dentes: 16, 26');
    list = toggleToothOf(list, 'p1', 16);
    expect(whereLabel(list[0])).toBe('Dente: 26');
    list = toggleWholeMouthOf(list, 'p1'); // boca toda limpa os dentes
    expect(list[0]).toMatchObject({ wholeMouth: true, teeth: [] });
    expect(whereLabel(list[0])).toBe('Boca toda');
    list = toggleToothOf(list, 'p1', 11); // escolher um dente tira a boca toda
    expect(list[0]).toMatchObject({ wholeMouth: false, teeth: [11] });
    list = toggleWholeMouthOf(toggleWholeMouthOf(list, 'p1'), 'p1');
    expect(list[0].wholeMouth).toBe(false);
    expect(whereLabel(list[0])).toBe('Toque nos dentes afetados');
    expect(toggleToothOf(toggleEntry([], fixed), 'outro', 1)).toEqual(toggleEntry([], fixed)); // outro id não muda nada
    expect(toggleEntry(list, crown)).toEqual([]); // tocar de novo remove
  });

  it('diz o que falta para concluir: procedimento, dentes, texto curto demais', () => {
    expect(evolutionProblem({})).toBe('Informe o procedimento realizado e os dentes afetados.');
    expect(evolutionProblem({ description: 'Revisão geral' })).toBe('Informe o procedimento realizado e os dentes afetados.');
    expect(evolutionProblem({ description: 'ab', procedures: [{ ...crown, teeth: [16] }] })).toBe('Descreva com pelo menos 3 letras.');
    expect(evolutionProblem({ procedures: [toggleEntry([], crown)[0]] })).toBe('Informe os dentes afetados em "Restauração" ou marque boca toda.');
    expect(evolutionProblem({ budgetItems: [{ id: 'i2', label: 'Limpeza', teeth: [], wholeMouth: false, fixed: false }] })).toBe('Informe os dentes afetados em "Limpeza" ou marque boca toda.');
    expect(evolutionProblem({ procedures: [{ ...crown, teeth: [16], wholeMouth: false }] })).toBeNull();
    expect(evolutionProblem({ procedures: [{ ...crown, teeth: [], wholeMouth: true }] })).toBeNull();
    expect(evolutionProblem({ budgetItems: [fixed] })).toBeNull(); // o dente vem do orçamento
  });

  it('monta o corpo da API: dentes ou boca toda; item de orçamento com dente vai só pelo id', () => {
    expect(buildEvolution({
      description: '  Limpeza  ',
      procedures: [{ ...crown, teeth: [16, 26], wholeMouth: false }, { id: 'p2', label: 'Limpeza', teeth: [], wholeMouth: true }],
      budgetItems: [fixed, { id: 'i2', label: 'Canal', teeth: [11], wholeMouth: false, fixed: false }, { id: 'i3', label: 'Higiene', teeth: [], wholeMouth: true, fixed: false }],
    })).toEqual({
      description: 'Limpeza',
      procedures: [{ procedureId: 'p1', teeth: [16, 26] }, { procedureId: 'p2', wholeMouth: true }],
      budgetItems: [{ itemId: 'i1' }, { itemId: 'i2', teeth: [11] }, { itemId: 'i3', wholeMouth: true }],
    });
    expect(buildEvolution({ description: ' ', procedures: [{ ...crown, teeth: [16] }] })).toEqual({ procedures: [{ procedureId: 'p1', teeth: [16] }], budgetItems: [] });
    expect(buildEvolution({})).toEqual({ procedures: [], budgetItems: [] });
  });
});
