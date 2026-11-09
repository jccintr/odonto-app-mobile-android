import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { asSecretary, loginAs, renderApp, setWidth, until } from './helpers';

beforeEach(() => setWidth(390));


async function goToPatients() {
  fireEvent.press(await screen.findByRole('button', { name: /Pacientes/ }));
  return screen.findByLabelText('Buscar paciente');
}

describe('pacientes', () => {
  it('lista, busca e abre a ficha com dados e anamnese', async () => {
    const patients = await asSecretary('/api/patients?q=Ana');
    await asSecretary(`/api/patients/${patients.data[0].id}`, {
      method: 'PATCH', body: { anamnesis: { allergies: 'Dipirona', conditions: ['diabetes'], medications: 'Metformina' }, notes: 'Prefere horários pela manhã' },
    });
    await loginAs('dentist');
    renderApp();

    const search = await goToPatients();
    expect(await screen.findByText('Ana Lima')).toBeTruthy();
    expect(screen.getByText('Carlos Souza')).toBeTruthy();

    fireEvent.changeText(search, 'carl');
    await until(() => screen.queryByText('Ana Lima') === null);
    fireEvent.changeText(search, 'zzzz');
    expect(await screen.findByText('Nenhum paciente encontrado')).toBeTruthy();
    fireEvent.changeText(search, 'ana');
    fireEvent.press(await screen.findByText('Ana Lima'));

    // a barra de título diz "Ficha do paciente" (o nome aparece uma vez só, no corpo da ficha) e tem a seta de voltar
    expect(await screen.findByRole('header', { name: 'Ficha do paciente' })).toBeTruthy();
    expect(await screen.findByText('Ana Lima')).toBeTruthy(); // visível só uma vez (a lista por baixo fica oculta)
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();

    // ficha: resumo com o alerta da anamnese
    expect(await screen.findByText(/Atenção na anamnese: Diabetes · Alergias: Dipirona/)).toBeTruthy();
    expect(screen.queryByText('(35) 99999-0001')).toBeNull(); // o dentista não vê o telefone do paciente
    expect(screen.getByText('529.982.247-25')).toBeTruthy();
    expect(screen.getByText('Metformina')).toBeTruthy();
    expect(screen.getByText('Prefere horários pela manhã')).toBeTruthy();
    expect(screen.getByText('Últimos atendimentos')).toBeTruthy();
  });

  it('odontograma: marca um dente com a face, vê o histórico e remove', async () => {
    await loginAs('dentist');
    renderApp();
    await goToPatients();
    fireEvent.press(await screen.findByText('Carlos Souza'));
    fireEvent.press(await screen.findByRole('tab', { name: 'Odontograma' }));

    fireEvent.press(await screen.findByLabelText('Dente 16'));
    expect(await screen.findByText('Dente 16 — superior direito')).toBeTruthy();
    expect(screen.getByText('Nenhuma marcação neste dente.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Fratura' })); // chip da condição (a legenda do odontograma também tem o nome, mas não é botão)
    fireEvent.press(screen.getByText('Oclusal/Incisal'));
    fireEvent.changeText(screen.getByLabelText('Observações'), 'Fratura após mastigar');
    fireEvent.press(screen.getByText('Marcar dente 16'));

    expect(await screen.findByText('Dente 16 marcado.')).toBeTruthy();
    expect(await screen.findByText('Fratura (O)')).toBeTruthy(); // aparece no histórico do dente
    expect(screen.getByText('Fratura após mastigar')).toBeTruthy();
    expect(await screen.findByLabelText('Dente 16: Fratura (O)')).toBeTruthy(); // e no desenho

    fireEvent.press(screen.getByText('Remover'));
    expect(await screen.findByText('Marcação removida.')).toBeTruthy();
    expect(await screen.findByLabelText('Dente 16')).toBeTruthy();
  });

  it('dentes de leite aparecem quando o paciente tem marcação neles ou o dentista pede', async () => {
    await loginAs('dentist');
    renderApp();
    fireEvent.changeText(await goToPatients(), 'marta'); // a lista é longa: busca em vez de rolar
    fireEvent.press(await screen.findByText('Marta Ferreira'));
    fireEvent.press(await screen.findByRole('tab', { name: 'Odontograma' }));
    await screen.findByLabelText(/^Dente 16/); // pode ter marcações de outros testes
    expect(screen.queryByLabelText('Dente 55')).toBeNull();
    fireEvent(screen.getByLabelText('Dentes de leite'), 'valueChange', true);
    expect(await screen.findByLabelText('Dente 55')).toBeTruthy();
  });
});
