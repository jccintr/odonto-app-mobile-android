import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Auth } from '../api';
import { errorMessage } from '../api/client';
import ToothIcon from '../components/ToothIcon';
import { Alert, Body, Button, Input, Muted, Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const { c } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError(null); setInfo(null); setUnverified(false);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') setUnverified(true);
      setError(err.status === 429 ? `Muitas tentativas. Tente de novo em ${Math.ceil((err.retryAfterSeconds ?? 60) / 60)} min.` : errorMessage(err));
    } finally { setBusy(false); }
  };

  const ask = async (call, message) => {
    setBusy(true); setError(null);
    try { await call(form.email.trim()); setInfo(message); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, gap: 16 }}>
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}><ToothIcon size={34} color={c.primaryFg} /></View>
              <Title>OdontoApp</Title>
              <Muted>Acesso do dentista</Muted>
            </View>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            {info ? <Alert tone="success">{info}</Alert> : null}
            <Input label="E-mail" keyboardType="email-address" autoComplete="email" textContentType="username" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
            <Input label="Senha" secure autoComplete="password" textContentType="password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} onSubmitEditing={submit} />
            <Button title="Entrar" loading={busy} disabled={!form.email.trim() || !form.password} onPress={submit} />
            {unverified ? <Button title="Reenviar e-mail de confirmação" variant="secondary" disabled={busy} onPress={() => ask(Auth.resendVerification, 'Se o e-mail estiver cadastrado, enviamos um novo link de confirmação.')} /> : null}
            <Button title="Esqueci minha senha" variant="ghost" disabled={busy || !form.email.trim()} onPress={() => ask(Auth.forgotPassword, 'Se o e-mail estiver cadastrado, você receberá as instruções em instantes.')} />
            <Body style={{ textAlign: 'center', color: c.muted, fontSize: 13 }}>Digite seu e-mail e toque em “Esqueci minha senha” para receber o link.</Body>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
