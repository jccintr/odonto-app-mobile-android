import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { dayOf, formatDay, formatDayLong, monthOf, shiftMonth, weekdayIndex } from '../../src/lib/dates';
import { bookTomorrow, loginAs, renderApp, setWidth, tomorrow, until } from './helpers';

// amanhã cai na semana seguinte quando hoje é sábado (a semana começa no domingo): nesse caso avança uma semana
async function showTomorrowsWeek() {
  if (weekdayIndex(tomorrow()) === 0) fireEvent.press(await screen.findByLabelText('Próximo período'));
}

describe('agenda no celular', () => {
  beforeEach(() => setWidth(390));

  it('mostra só os atendimentos do dentista, e ele confirma, atende e cancela com motivo', async () => {
    await bookTomorrow('Ana', '10:00');
    await bookTomorrow('Carlos', '11:00', { notes: 'Retorno do canal' });
    await bookTomorrow('Marta', '10:00', { dentistIndex: 1 }); // de outro dentista: não aparece
    await loginAs('dentist');
    renderApp();

    expect(await screen.findByText('Nenhum atendimento neste dia')).toBeTruthy(); // hoje está vazio
    fireEvent.press(screen.getByLabelText('Próximo dia'));
    expect(await screen.findByText('10:00 – 11:00')).toBeTruthy();
    expect(screen.getByText('Ana Lima')).toBeTruthy();
    expect(screen.getAllByText('Carlos Souza').length).toBeGreaterThan(0); // outros testes também marcam o Carlos amanhã
    expect(screen.getByText('Retorno do canal')).toBeTruthy();
    expect(screen.queryByText('Marta Ferreira')).toBeNull();

    // detalhe da Ana: confirmar e marcar como atendido
    fireEvent.press(screen.getByText('Ana Lima'));
    expect(await screen.findByText('Ficha do paciente')).toBeTruthy();
    expect(screen.getByText('Agendado')).toBeTruthy();
    fireEvent.press(screen.getByText('Confirmar'));
    expect(await screen.findByText('Confirmado')).toBeTruthy();
    fireEvent.press(screen.getByText('Iniciar atendimento'));
    expect(await screen.findByText('Em atendimento')).toBeTruthy();
    fireEvent.press(await screen.findByText('Marcar como atendido'));
    // concluir exige registrar o procedimento e onde foi feito
    expect((await screen.findAllByText('Concluir atendimento')).length).toBe(2); // título da folha e botão
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(await screen.findByText('Informe o procedimento realizado e os dentes afetados.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Observações (opcional)'), 'ab');
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(await screen.findByText('Descreva com pelo menos 3 letras.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Observações (opcional)'), 'Revisão e limpeza');
    fireEvent.press(await screen.findByText('Restauração em resina'));
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(await screen.findByText('Informe os dentes afetados em "Restauração em resina" ou marque boca toda.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Boca toda' }));
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(await screen.findByText('Atendido')).toBeTruthy();
    expect(screen.getByText('Este atendimento já foi finalizado.')).toBeTruthy();
    fireEvent.press(screen.getByText('Voltar para a agenda'));

    fireEvent.press(await screen.findByText('Carlos Souza'));
    fireEvent.press(await screen.findByText('Cancelar'));
    expect((await screen.findAllByText('Cancelar atendimento')).length).toBe(2); // título da folha e botão
    fireEvent.changeText(screen.getByLabelText('Motivo (opcional)'), 'Paciente viajou');
    const buttons = screen.getAllByText('Cancelar atendimento');
    fireEvent.press(buttons[buttons.length - 1]);
    expect(await screen.findByText('Motivo do cancelamento: Paciente viajou')).toBeTruthy();
    expect(screen.getByText('Cancelado')).toBeTruthy();
  });

  it('navega entre os dias e volta para hoje', async () => {
    await loginAs('dentist');
    renderApp();
    expect(await screen.findByText('Hoje')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Próximo dia'));
    expect(await screen.findByText('Ir para hoje')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Dia anterior'));
    expect(await screen.findByText('Hoje')).toBeTruthy();
  });
});

const touch = (view, x, y, end) => {
  fireEvent(view, 'touchStart', { nativeEvent: { pageX: x, pageY: y } });
  fireEvent(view, 'touchEnd', { nativeEvent: { pageX: end[0], pageY: end[1] } });
};
const heading = (day) => formatDayLong(day);

describe('mudança de data', () => {
  beforeEach(() => setWidth(390));

  it('arrastar para a esquerda vai ao dia seguinte e para a direita volta; rolar na vertical ou arrastar pouco não muda o dia', async () => {
    await bookTomorrow('Ana', '16:00');
    await loginAs('dentist');
    renderApp();
    await screen.findByText('Hoje');
    const area = screen.getByTestId('agenda-swipe');

    touch(area, 300, 300, [120, 310]); // arrasto longo para a esquerda
    expect(await screen.findByText(heading(tomorrow()))).toBeTruthy();
    expect(await screen.findByText('16:00 – 17:00')).toBeTruthy();

    touch(area, 300, 300, [280, 305]); // curto demais
    touch(area, 200, 100, [210, 500]); // rolagem vertical
    expect(screen.getByText(heading(tomorrow()))).toBeTruthy();

    touch(area, 100, 300, [300, 290]); // para a direita: volta um dia
    expect(await screen.findByText('Hoje')).toBeTruthy();
    expect(screen.getByText(heading(dayOf()))).toBeTruthy();

    // cancelar o toque no meio do caminho não troca o dia
    fireEvent(area, 'touchStart', { nativeEvent: { pageX: 300, pageY: 300 } });
    fireEvent(area, 'touchCancel', { nativeEvent: {} });
    fireEvent(area, 'touchEnd', { nativeEvent: { pageX: 50, pageY: 300 } });
    expect(screen.getByText(heading(dayOf()))).toBeTruthy();
  });

  it('escolhe a data no calendário: navega entre os meses, seleciona um dia e volta para hoje', async () => {
    await loginAs('dentist');
    renderApp();
    await screen.findByText('Hoje');
    fireEvent.press(screen.getByLabelText('Escolher data'));
    expect(await screen.findByText('Escolher a data')).toBeTruthy();

    // vai ao mês seguinte (passando por um mês adiante e voltando) e escolhe o dia 15
    const target = `${shiftMonth(monthOf(dayOf()), 1)}-15`;
    fireEvent.press(screen.getByLabelText('Próximo mês'));
    fireEvent.press(screen.getByLabelText('Próximo mês'));
    fireEvent.press(screen.getByLabelText('Mês anterior'));
    fireEvent.press(screen.getByLabelText(`Dia ${formatDay(target)}`));
    expect(await screen.findByText(heading(target))).toBeTruthy();
    expect(await screen.findByText('Ir para hoje')).toBeTruthy();
    expect(screen.queryByText('Escolher a data')).toBeNull(); // o calendário fecha ao escolher

    fireEvent.press(screen.getByLabelText('Escolher data'));
    await screen.findByText('Escolher a data');
    fireEvent.press(screen.getByText('Hoje', { exact: true }));
    await until(() => screen.queryByText('Escolher a data') === null);
    expect(await screen.findByText(heading(dayOf()))).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Escolher data'));
    await screen.findByText('Escolher a data');
    fireEvent.press(screen.getByText('Fechar'));
    await until(() => screen.queryByText('Escolher a data') === null);
  });
});

describe('agenda no tablet', () => {
  beforeEach(() => setWidth(900));
  afterAll(() => setWidth(390));

  it('lista e detalhe lado a lado: atender sem sair da tela', async () => {
    await bookTomorrow('Carlos', '14:00');
    await bookTomorrow('Marta', '15:00');
    await loginAs('dentist');
    renderApp();

    await screen.findByText('Hoje');
    fireEvent.press(screen.getByLabelText('Próximo dia'));
    expect(await screen.findByText('14:00 – 15:00')).toBeTruthy();
    expect(screen.getByText('Escolha um atendimento')).toBeTruthy(); // painel da direita ainda vazio

    fireEvent.press(screen.getByText('Marta Ferreira'));
    expect(await screen.findByText('Iniciar atendimento')).toBeTruthy(); // o detalhe abre ao lado, sem trocar de tela
    expect(screen.getByText('14:00 – 15:00')).toBeTruthy(); // a lista continua na tela
    fireEvent.press(screen.getByText('Iniciar atendimento'));
    fireEvent.press(await screen.findByText('Marcar como atendido'));
    fireEvent.press(await screen.findByText('Restauração em resina')); // procedimento do catálogo
    fireEvent.press(await screen.findByRole('button', { name: /^Dente 36/ })); // e o dente afetado
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));

    expect(await screen.findByText('Este atendimento já foi finalizado.')).toBeTruthy();
    // a lista mostra a nova situação
    const atendidos = await screen.findAllByText('Atendido');
    expect(atendidos.length).toBeGreaterThanOrEqual(2); // painel + cartão da lista
  });
});

describe('agenda semanal e mensal', () => {
  const pickView = (label) => fireEvent.press(screen.getByRole('tab', { name: label }));

  it('no celular: semana agrupa por dia, mês mostra contagens e tocar no dia abre o dia', async () => {
    await bookTomorrow('Ana', '18:00');
    await bookTomorrow('Carlos', '19:00');
    await loginAs('dentist');
    setWidth(390);
    renderApp();
    await screen.findByText('Nenhum atendimento neste dia');

    pickView('Semana');
    expect(await screen.findByText('Esta semana')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Período anterior'));
    expect(await screen.findByText('Ir para hoje')).toBeTruthy();
    fireEvent.press(screen.getByText('Ir para hoje'));
    expect(await screen.findByText('Esta semana')).toBeTruthy();
    await showTomorrowsWeek();
    expect((await screen.findAllByText('Ana Lima')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Carlos Souza')).length).toBeGreaterThan(0);
    // tocar no atendimento abre o detalhe em tela cheia
    fireEvent.press((await screen.findAllByText('Ana Lima'))[0]);
    expect(await screen.findByText('Ficha do paciente')).toBeTruthy();
    fireEvent.press(screen.getByText('Voltar para a agenda'));

    pickView('Mês');
    expect(await screen.findByText('Este mês')).toBeTruthy();
    fireEvent.press(await screen.findByLabelText(new RegExp(`^Dia ${formatDay(tomorrow())},`)));
    expect(await screen.findByText('19:00 – 20:00')).toBeTruthy();
    expect(screen.getAllByText('Carlos Souza').length).toBeGreaterThan(0);
  });

  it('no tablet: a semana vira uma grade e o atendimento abre numa folha', async () => {
    await bookTomorrow('Ana', '17:00');
    await loginAs('dentist');
    setWidth(900);
    renderApp();
    await screen.findByText('Nenhum atendimento neste dia');

    pickView('Semana');
    await showTomorrowsWeek();
    const block = await screen.findByLabelText('17:00 Ana Lima');
    fireEvent.press(block);
    expect(await screen.findByText('Ficha do paciente')).toBeTruthy();
    fireEvent.press(screen.getByText('Fechar'));
  });
});
