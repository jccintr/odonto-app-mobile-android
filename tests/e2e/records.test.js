import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { asDentist, asSecretary, bookTomorrow, loginAs, pressUntil, renderApp, setWidth } from './helpers';

beforeEach(() => setWidth(390));

describe('concluir atendimento e prontuário', () => {
  it('o dentista não vê o telefone; ao concluir registra procedimentos e dá baixa no orçamento; lê o prontuário e retifica', async () => {
    const patients = await asSecretary('/api/patients?q=Carlos');
    const procedures = await asSecretary('/api/procedures?perPage=100');
    const limpeza = procedures.data.find((p) => p.name === 'Limpeza (profilaxia)');
    const budget = await asDentist('/api/budgets', { method: 'POST', body: { patientId: patients.data[0].id, items: [{ procedureId: limpeza.id, tooth: 16 }] } });
    await asSecretary(`/api/budgets/${budget.id}/status`, { method: 'POST', body: { status: 'approved' } });
    const appointment = await bookTomorrow('Carlos', '20:00');

    await loginAs('dentist');
    renderApp();
    await screen.findByText('Hoje');
    fireEvent.press(screen.getByLabelText('Próximo dia'));
    fireEvent.press(await screen.findByTestId(`appointment-${appointment.id}`));

    // telefone é da secretária: nenhum botão de ligar nem número
    expect(await screen.findByText('Ficha do paciente')).toBeTruthy();
    expect(screen.queryByText(/Ligar para/)).toBeNull();
    expect(screen.queryByText(/99999-0002/)).toBeNull();

    // concluir: item do orçamento, procedimento do catálogo (busca) e texto
    fireEvent.press(screen.getByText('Iniciar atendimento'));
    fireEvent.press(await screen.findByText('Marcar como atendido'));
    fireEvent.press(await screen.findByText('Limpeza (profilaxia) — dente 16')); // o dente vem do orçamento
    fireEvent.changeText(screen.getByLabelText('Buscar procedimento'), 'resina');
    fireEvent.press(await screen.findByText('Restauração em resina'));
    fireEvent.changeText(screen.getByLabelText('Buscar procedimento'), 'zzzz');
    expect(await screen.findByText('Nenhum procedimento encontrado.')).toBeTruthy(); // o já escolhido continua na lista
    fireEvent.changeText(screen.getByLabelText('Observações (opcional)'), 'Profilaxia completa e orientação de higiene.');
    // sem dentes afetados o app não deixa concluir
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(await screen.findByText('Informe os dentes afetados em "Restauração em resina" ou marque boca toda.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /^Dente 26/ }));
    fireEvent.press(screen.getByRole('button', { name: /^Dente 27/ }));
    expect(await screen.findByText('Dentes: 26, 27')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Concluir atendimento' }));
    expect(await screen.findByText('Este atendimento já foi finalizado.')).toBeTruthy();

    // prontuário na ficha do paciente
    fireEvent.press(screen.getByText('Ficha do paciente'));
    await screen.findByRole('tab', { name: 'Prontuário' });
    await pressUntil(() => screen.getByRole('tab', { name: 'Prontuário' }), () => screen.queryByText('Profilaxia completa e orientação de higiene.') !== null);
    expect(screen.getByText('Limpeza (profilaxia) · dente 16')).toBeTruthy();
    expect(screen.getByText('Restauração em resina · dente 26')).toBeTruthy();
    expect(screen.getByText('Restauração em resina · dente 27')).toBeTruthy();

    // retificação: o original continua, a correção aparece junto
    fireEvent.press(screen.getAllByText('Retificar')[0]);
    fireEvent.press(screen.getByRole('button', { name: 'Salvar retificação' }));
    expect(await screen.findByText('Descreva a retificação com pelo menos 3 letras.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Retificação'), 'Faltou citar o uso de anestesia local.');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar retificação' }));
    expect(await screen.findByText(/Faltou citar o uso de anestesia local\./)).toBeTruthy();
    expect(screen.getByText('Profilaxia completa e orientação de higiene.')).toBeTruthy();
    const after = await asDentist(`/api/budgets/${budget.id}`);
    expect(after.status).toBe('completed'); // a baixa no orçamento aconteceu junto
  });

  it('paciente sem atendimentos registrados mostra o prontuário vazio', async () => {
    const patients = await asSecretary('/api/patients', { method: 'POST', body: { name: 'Paciente Novo Prontuário' } });
    await loginAs('dentist');
    renderApp();
    fireEvent.press(await screen.findByRole('button', { name: /Pacientes/ }));
    fireEvent.changeText(await screen.findByLabelText('Buscar paciente'), 'Novo Prontuário');
    fireEvent.press(await screen.findByTestId(`patient-${patients.id}`));
    await screen.findByRole('tab', { name: 'Prontuário' });
    await pressUntil(() => screen.getByRole('tab', { name: 'Prontuário' }), () => screen.queryByText('Nenhum registro no prontuário') !== null);
  });
});
