import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { demo, renderApp, setWidth } from './helpers';

beforeEach(() => setWidth(390));

describe('entrada no app', () => {
  it('senha errada mostra o erro; o dentista entra pela senha certa, vê a agenda e sai pela conta', async () => {
    renderApp();
    fireEvent.changeText(await screen.findByLabelText('E-mail'), demo().dentists[0].email);
    fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-errada-123');
    fireEvent.press(screen.getByText('Entrar'));
    expect(await screen.findByText(/inválid/i)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Senha'), demo().dentists[0].password);
    fireEvent.press(screen.getByText('Entrar'));
    expect(await screen.findByText('Hoje')).toBeTruthy(); // a agenda abre no dia de hoje

    fireEvent.press(screen.getByText('Conta'));
    expect(await screen.findByText('Minha conta')).toBeTruthy();
    expect(screen.getByText(demo().dentists[0].email)).toBeTruthy();
    expect(screen.getByText('Clínica Sorriso')).toBeTruthy();
    fireEvent.press(screen.getByText('Sair'));
    expect(await screen.findByLabelText('E-mail')).toBeTruthy();
  });

  it('o botão de olho mostra e oculta a senha', async () => {
    renderApp();
    const field = await screen.findByLabelText('Senha');
    expect(field.props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByLabelText('Mostrar senha'));
    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
    fireEvent.press(screen.getByLabelText('Ocultar senha'));
    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
  });

  it('administração e secretária são avisadas de que o app é do dentista', async () => {
    renderApp();
    fireEvent.changeText(await screen.findByLabelText('E-mail'), demo().secretary.email);
    fireEvent.changeText(screen.getByLabelText('Senha'), demo().secretary.password);
    fireEvent.press(screen.getByText('Entrar'));
    expect(await screen.findByText('App do dentista')).toBeTruthy();
    fireEvent.press(screen.getByText('Sair'));
    expect(await screen.findByLabelText('E-mail')).toBeTruthy();
  });

  it('esqueci minha senha pede o e-mail antes e depois avisa que enviou', async () => {
    renderApp();
    await screen.findByLabelText('E-mail');
    
    fireEvent.changeText(screen.getByLabelText('E-mail'), demo().dentists[0].email);
    fireEvent.press(screen.getByText('Esqueci minha senha'));
    expect(await screen.findByText(/você receberá as instruções/)).toBeTruthy();
  });
});
