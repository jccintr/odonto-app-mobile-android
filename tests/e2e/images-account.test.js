import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { demo, loginAs, renderApp, setWidth, until } from './helpers';

beforeEach(() => setWidth(390));

async function openPatientTab(name, tab) {
  fireEvent.press(await screen.findByRole('button', { name: /Pacientes/ }));
  fireEvent.press(await screen.findByText(name));
  fireEvent.press(await screen.findByRole('tab', { name: tab }));
}

describe('imagens do paciente', () => {
  it('sem imagens, mostra o convite; a câmera sem permissão explica o que fazer', async () => {
    await loginAs('dentist');
    renderApp();
    await openPatientTab('Ana Lima', 'Imagens');
    expect(await screen.findByText('Nenhuma imagem')).toBeTruthy();

    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });
    fireEvent.press(screen.getByText('Câmera'));
    expect(await screen.findByText(/Sem permissão para usar a câmera/)).toBeTruthy();

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });
    fireEvent.press(screen.getByText('Galeria'));
    expect(await screen.findByText(/Sem permissão para acessar as fotos/)).toBeTruthy();
  });

  it('escolhe da galeria, preenche os dados e, sem armazenamento configurado, mostra o erro da API', async () => {
    await loginAs('dentist');
    renderApp();
    await openPatientTab('Ana Lima', 'Imagens');
    await screen.findByText('Nenhuma imagem');

    // cancelar no seletor não abre nada
    fireEvent.press(screen.getByText('Galeria'));
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByText('Enviar imagem')).toBeNull();

    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///tmp/panoramica.jpg', fileName: 'panoramica.jpg', mimeType: 'image/jpeg', fileSize: 120000 }] });
    fireEvent.press(screen.getByText('Galeria'));
    expect((await screen.findAllByText('Enviar imagem')).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Radiografia'));
    fireEvent.changeText(screen.getByLabelText('Dente (opcional)'), '99');
    fireEvent.press(screen.getByText('Enviar'));
    expect(await screen.findByText('Dente inválido (numeração FDI).')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Dente (opcional)'), '16');
    fireEvent.press(screen.getByText('Enviar'));
    // a API de demonstração não tem Cloudinary configurado: responde 503 e o app mostra a mensagem
    expect((await screen.findAllByText(/armazenamento de imagens não está configurado/)).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Cancelar'));
    await until(() => screen.queryByLabelText('Prévia da imagem') === null);
  });
});

describe('minha conta', () => {
  it('troca o tema, valida e troca a senha (a sessão nova continua valendo) e volta à senha antiga', async () => {
    await loginAs('dentist');
    renderApp();
    fireEvent.press(await screen.findByRole('button', { name: /Conta/ }));
    await screen.findByText('Minha conta');

    fireEvent.press(screen.getByText('Escuro'));
    await until(() => SecureStore.__store.get('odonto.theme') === 'dark');
    fireEvent.press(screen.getByText('Automático'));

    fireEvent.press(screen.getByText('Trocar a senha'));
    fireEvent.changeText(await screen.findByLabelText('Senha atual'), 'senha-errada-123');
    fireEvent.changeText(screen.getByLabelText('Nova senha'), 'nova-senha-do-dentista');
    fireEvent.changeText(screen.getByLabelText('Repita a nova senha'), 'diferente');
    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Repita a nova senha'), 'nova-senha-do-dentista');
    fireEvent.press(screen.getByText('Alterar senha'));
    expect(await screen.findByText(/Senha atual incorreta/)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Senha atual'), demo().dentists[0].password);
    fireEvent.press(screen.getByText('Alterar senha'));
    expect(await screen.findByText(/Senha alterada/)).toBeTruthy();

    // sai e entra com a senha nova; depois volta à antiga para não atrapalhar os outros testes
    fireEvent.press(screen.getByText('Sair'));
    fireEvent.changeText(await screen.findByLabelText('E-mail'), demo().dentists[0].email);
    fireEvent.changeText(screen.getByLabelText('Senha'), 'nova-senha-do-dentista');
    fireEvent.press(screen.getByText('Entrar'));
    fireEvent.press(await screen.findByRole('button', { name: /Conta/ }));
    fireEvent.press(await screen.findByText('Trocar a senha'));
    fireEvent.changeText(await screen.findByLabelText('Senha atual'), 'nova-senha-do-dentista');
    fireEvent.changeText(screen.getByLabelText('Nova senha'), demo().dentists[0].password);
    fireEvent.changeText(screen.getByLabelText('Repita a nova senha'), demo().dentists[0].password);
    fireEvent.press(screen.getByText('Alterar senha'));
    expect(await screen.findByText(/Senha alterada/)).toBeTruthy();
  });
});
