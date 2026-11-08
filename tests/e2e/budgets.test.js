import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { asDentist, asSecretary, loginAs, pressUntil, renderApp, setWidth, until } from './helpers';

beforeEach(() => setWidth(390));

describe('orçamentos', () => {
  it('cria pela ficha e aprova; o procedimento fica “A realizar” até um atendimento', async () => {
    await loginAs('dentist');
    renderApp();
    fireEvent.press(await screen.findByRole('button', { name: /Pacientes/ }));
    fireEvent.changeText(await screen.findByLabelText('Buscar paciente'), 'marta'); // a lista é longa: busca em vez de rolar
    fireEvent.press(await screen.findByText('Marta Ferreira'));
    fireEvent.press(await screen.findByRole('tab', { name: 'Orçamentos' }));
    expect(await screen.findByText('Nenhum orçamento para este paciente')).toBeTruthy();
    fireEvent.press(screen.getByText('Novo orçamento'));

    // novo orçamento: procedimento com dente e face (o valor é o da tabela da clínica)
    expect(await screen.findByText('Nenhum procedimento ainda. Toque em “Adicionar procedimento”.')).toBeTruthy();
    fireEvent.press(screen.getByText('Adicionar procedimento'));
    fireEvent.changeText(await screen.findByLabelText('Buscar procedimento'), 'resina');
    fireEvent.press(await screen.findByText('Restauração em resina'));
    fireEvent.changeText(await screen.findByLabelText('Dente (opcional)'), '99');
    fireEvent.press(screen.getByText('Adicionar'));
    expect(await screen.findByText(/Dente inválido/)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Dente (opcional)'), '16');
    fireEvent.press(screen.getByText('Oclusal/Incisal'));
    expect(screen.getByText(/Valor da tabela da clínica: R\$ 200,00/)).toBeTruthy();
    fireEvent.press(screen.getByText('Adicionar'));

    expect(await screen.findByText('Restauração em resina — dente 16 (O)')).toBeTruthy();
    expect(screen.getAllByText('R$ 200,00').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Salvar orçamento'));

    // orçamento criado: em aberto → aprovar. A execução acontece no atendimento (não há "Realizar" direto)
    expect(await screen.findByText('Em aberto')).toBeTruthy();
    fireEvent.press(screen.getByText('Aprovar orçamento'));
    expect(await screen.findByText(/Orçamento aprovado/)).toBeTruthy();
    expect(await screen.findByText('A realizar')).toBeTruthy();
    expect(screen.queryByText('Realizar')).toBeNull();
    expect(screen.queryByText('Realizar procedimento')).toBeNull();
  });

  it('a aba Orçamentos lista os de todos os pacientes, com filtro por situação', async () => {
    await loginAs('dentist');
    renderApp();
    fireEvent.press(await screen.findByRole('button', { name: /Orçamentos/ }));
    expect(await screen.findByText('Marta Ferreira')).toBeTruthy();
    expect(screen.getAllByText('Aprovado').length).toBeGreaterThan(0); // o do teste anterior
    fireEvent.press(screen.getByText('Recusados'));
    expect(await screen.findByText('Nenhum orçamento')).toBeTruthy();
    fireEvent.press(screen.getByText('Aprovados'));
    expect(await screen.findByText('Marta Ferreira')).toBeTruthy();
  });

  it('adiciona e remove procedimentos de um orçamento em aberto, e recusa', async () => {
    const patients = await asSecretary('/api/patients?q=Carlos');
    const procedures = await asSecretary('/api/procedures?perPage=100');
    const limpeza = procedures.data.find((p) => p.name === 'Limpeza (profilaxia)');
    const budget = await asDentist('/api/budgets', { method: 'POST', body: { patientId: patients.data[0].id, items: [{ procedureId: limpeza.id }] } });

    await loginAs('dentist');
    renderApp();
    fireEvent.press(await screen.findByRole('button', { name: /Orçamentos/ }));
    fireEvent.press(await screen.findByTestId(`budget-${budget.id}`));
    expect(await screen.findByText('Limpeza (profilaxia)')).toBeTruthy();

    fireEvent.press(screen.getByText('Adicionar procedimento'));
    fireEvent.press(await screen.findByText('Extração simples'));
    expect(await screen.findByText(/Valor da tabela da clínica/)).toBeTruthy(); // o preço não se edita no orçamento
    expect(screen.queryByLabelText('Valor (R$)')).toBeNull();
    fireEvent.press(screen.getByText('Adicionar'));
    expect(await screen.findByText('Extração simples')).toBeTruthy();

    fireEvent.press(screen.getAllByText('Remover do orçamento')[0]);
    // o item removido sai da tela e os botões voltam a ficar ativos (enquanto uma ação roda, as outras ficam desligadas)
    await until(() => screen.queryByText('Limpeza (profilaxia)') === null && screen.getByRole('button', { name: 'Recusar orçamento' }).props.accessibilityState?.disabled !== true);
    expect(screen.getByText('Extração simples')).toBeTruthy();
    await pressUntil(() => screen.getByText('Recusar orçamento'), () => screen.queryByText('Orçamento recusado.') !== null);
    expect(await screen.findByText('Recusado')).toBeTruthy();
    expect(screen.queryByText('Aprovar orçamento')).toBeNull();
  });
});
