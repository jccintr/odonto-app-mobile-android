import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setSession } from '../../src/api/client';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import Navigation from '../../src/navigation';
import { addDays, dayOf, toIso } from '../../src/lib/dates';

export const demo = () => JSON.parse(process.env.E2E_DEMO);
export const BASE = () => process.env.EXPO_PUBLIC_API_URL;
export const setWidth = (width) => { global.__WIDTH__ = width; };

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

export function renderApp() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider><AuthProvider><Navigation /></AuthProvider></ThemeProvider>
    </SafeAreaProvider>,
  );
}

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE()}${path}`, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) }, body: body ? JSON.stringify(body) : undefined });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data;
};

export async function login(who) {
  const account = who === 'secretary' ? demo().secretary : who === 'admin' ? demo().admin : demo().dentists[0];
  return call('/api/auth/login', { method: 'POST', body: { email: account.email, password: account.password } });
}

/** Entra pela API (sem passar pela tela) e guarda a sessão no cofre, como se o usuário já tivesse feito login. */
export async function loginAs(who = 'dentist') {
  const session = await login(who);
  await setSession(session);
  return session;
}

/** Chamadas como secretária (monta cenário: pacientes, atendimentos…). */
export async function asSecretary(path, options) {
  const session = await login('secretary');
  return call(path, { ...options, token: session.accessToken });
}

export const tomorrow = () => addDays(dayOf(), 1);

/** Marca um atendimento amanhã (HH:MM) do dentista 1 com o paciente pelo nome. */
export async function bookTomorrow(patientName, time, { dentistIndex = 0, notes } = {}) {
  const patients = await asSecretary(`/api/patients?q=${encodeURIComponent(patientName)}`);
  const dentists = await asSecretary('/api/dentists');
  const start = toIso(tomorrow(), time);
  const end = new Date(new Date(start).getTime() + 3_600_000).toISOString();
  return asSecretary('/api/appointments', { method: 'POST', body: { patientId: (patients.data.find((p) => p.name.startsWith(patientName)) ?? patients.data[0]).id, dentistId: dentists.find((d) => d.email === (dentistIndex === 0 ? demo().dentists[0] : demo().dentists[1]).email).id, startsAt: start, endsAt: end, notes } });
}

/** Espera uma condição ficar verdadeira (consulta periódica com timers reais). Útil para "sumiu da tela". */
export async function until(check, ms = 6000) {
  const start = Date.now();
  for (;;) {
    if (check()) return;
    if (Date.now() - start > ms) throw new Error('A condição não ficou verdadeira a tempo.');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** Chamadas como o dentista (o orçamento só pode ser criado por dentista ou administrador). */
export async function asDentist(path, options) {
  const session = await login('dentist');
  return call(path, { ...options, token: session.accessToken });
}

/**
 * Toca em um botão e confere o resultado; se o toque se perder (logo depois de uma troca de tela o React Navigation
 * ainda pode estar encerrando a animação e ignora toques), tenta de novo. Só para botões cuja ação não repete efeito.
 */
export async function pressUntil(find, done, { tries = 5 } = {}) {
  const { fireEvent } = require('@testing-library/react-native');
  for (let i = 0; i < tries; i += 1) {
    fireEvent.press(find());
    const start = Date.now();
    while (Date.now() - start < 800) {
      if (done()) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error('O toque não teve efeito.');
}
