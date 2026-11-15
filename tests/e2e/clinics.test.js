// A mesma pessoa em mais de uma clínica, e o administrador que também atende (clínica de um dentista só).
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { setSession } from '../../src/api/client';
import { toIso } from '../../src/lib/dates';
import { BASE, demo, renderApp, setWidth, tomorrow } from './helpers';

const OWN = 'Consultório Dr. Rafael';
const rafael = () => demo().dentists[2];

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE()}${path}`, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) }, body: body ? JSON.stringify(body) : undefined });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data;
};
const loginIn = async (clinicName) => {
  const choose = await call('/api/auth/login', { method: 'POST', body: { email: rafael().email, password: rafael().password } });
  const clinic = choose.clinics.find((c) => c.name === clinicName);
  return call('/api/auth/login', { method: 'POST', body: { email: rafael().email, password: rafael().password, clinicId: clinic.id } });
};

async function typeLogin() {
  fireEvent.changeText(await screen.findByLabelText('E-mail'), rafael().email);
  fireEvent.changeText(screen.getByLabelText('Senha'), rafael().password);
  fireEvent.press(screen.getByText('Entrar'));
}

beforeAll(async () => {
  // o Dr. Rafael (dentista da Sorriso) abre o próprio consultório com o mesmo e-mail e senha, e atende nele
  await call('/api/signup', { method: 'POST', body: { clinicName: OWN, template: 'empty', acceptTerms: true, admin: { name: 'Rafael', email: rafael().email, password: rafael().password, attendsPatients: true } } });
});

beforeEach(async () => { setWidth(390); await setSession(null); });

describe('dentista em mais de uma clínica', () => {
  it('no login escolhe a clínica; no consultório dele (administrador que atende) o app abre a agenda', async () => {
    renderApp();
    await typeLogin();
    expect(await screen.findByText('Você trabalha em mais de uma clínica. Em qual quer entrar?')).toBeTruthy();
    expect(screen.getByText('Clínica Sorriso')).toBeTruthy();
    fireEvent.press(screen.getByText(OWN));
    expect(await screen.findByText('Hoje')).toBeTruthy();
    fireEvent.press(screen.getByText('Conta'));
    expect(await screen.findByText(OWN)).toBeTruthy();
  });

  it('troca de clínica pela Conta, sem digitar a senha de novo', async () => {
    await setSession(await loginIn(OWN));
    renderApp();
    fireEvent.press(await screen.findByText('Conta'));
    fireEvent.press(await screen.findByText('Trocar de clínica'));
    expect(await screen.findByText(/clínica atual/)).toBeTruthy();
    fireEvent.press(screen.getAllByText('Clínica Sorriso').at(-1));
    // a lista fecha e a conta passa a mostrar a Sorriso (o consultório não aparece mais em lugar nenhum)
    await waitFor(() => expect(screen.queryByText(OWN)).toBeNull());
    expect(screen.getByText('Clínica Sorriso')).toBeTruthy();
  });

  it('a agenda do administrador que atende mostra só os atendimentos dele', async () => {
    const session = await loginIn(OWN);
    const token = session.accessToken;
    const other = await call('/api/users', { method: 'POST', token, body: { name: 'Dra. Outra', email: `outra.${Date.now()}@consultorio.local`, password: 'senha-da-outra-1', role: 'dentist' } });
    const patient = await call('/api/patients', { method: 'POST', token, body: { name: 'Paciente do Consultório', contactConsent: false } });
    const book = (dentistId, time) => call('/api/appointments', { method: 'POST', token, body: { patientId: patient.id, dentistId, startsAt: toIso(tomorrow(), time), endsAt: toIso(tomorrow(), `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`) } });
    await book(session.user.dentistId, '09:00');
    await book(other.dentistId, '15:00');

    await setSession(session);
    renderApp();
    expect(await screen.findByText('Hoje')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Próximo dia'));
    expect(await screen.findByText('09:00 – 10:00')).toBeTruthy();
    expect(screen.queryByText('15:00 – 16:00')).toBeNull();
  });

  it('quem não atende numa clínica vê o aviso e pode ir para a clínica em que atende', async () => {
    const session = await loginIn(OWN);
    await call(`/api/users/${session.user.id}`, { method: 'PATCH', token: session.accessToken, body: { attendsPatients: false } });
    await setSession(await loginIn(OWN));
    renderApp();
    expect(await screen.findByText('App do dentista')).toBeTruthy();
    expect(screen.getByText('Você também trabalha nestas clínicas:')).toBeTruthy();
    fireEvent.press(screen.getByText('Clínica Sorriso'));
    expect(await screen.findByText('Hoje')).toBeTruthy();
    // volta a atender no consultório (para os demais testes)
    await call(`/api/users/${session.user.id}`, { method: 'PATCH', token: session.accessToken, body: { attendsPatients: true } });
  });
});

describe('meus dados no app', () => {
  it('o dentista informa o telefone (com máscara); inválido não salva', async () => {
    const bia = demo().dentists[1];
    const session = await call('/api/auth/login', { method: 'POST', body: { email: bia.email, password: bia.password } });
    await setSession(session);
    renderApp();
    fireEvent.press(await screen.findByText('Conta'));
    expect(await screen.findByText('—')).toBeTruthy(); // ainda sem telefone
    fireEvent.press(screen.getByText('Editar meus dados'));
    const phone = await screen.findByLabelText('Telefone / WhatsApp');
    fireEvent.changeText(phone, '3599');
    expect(await screen.findByText('Telefone inválido (informe DDD + número).')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Telefone / WhatsApp'), '35999991234');
    expect(screen.getByLabelText('Telefone / WhatsApp').props.value).toBe('(35) 99999-1234');
    fireEvent.press(screen.getByText('Salvar'));
    expect(await screen.findByText('Dados alterados.')).toBeTruthy();
    expect(screen.getByText('(35) 99999-1234')).toBeTruthy();
    const me = await call('/api/auth/me', { token: session.accessToken });
    expect(me.user.phone).toBe('35999991234');
  });
});
