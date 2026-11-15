import React, { useState } from 'react';
import { View } from 'react-native';
import { Auth } from '../api';
import { errorMessage } from '../api/client';
import ClinicList from '../components/ClinicList';
import { useResource } from '../hooks';
import { Lock } from 'lucide-react-native';
import { Alert, Body, Button, Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Notice({ title, children, extra }) {
  const { logout } = useAuth();
  const { c } = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, maxWidth: 480, alignSelf: 'center' }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.dangerSoft, alignItems: 'center', justifyContent: 'center' }}><Lock size={28} color={c.danger} /></View>
        <Title style={{ textAlign: 'center' }}>{title}</Title>
        <Body style={{ textAlign: 'center' }}>{children}</Body>
        {extra}
        <Button title="Sair" variant="secondary" onPress={logout} />
      </View>
    </Screen>
  );
}

/** A assinatura da clínica está suspensa (a API responde 402): o dentista precisa avisar o administrador. */
export const SuspendedScreen = () => <Notice title="Acesso pausado">A assinatura da clínica está suspensa. Avise o administrador da clínica para regularizar o pagamento; assim que for liberado, é só entrar de novo.</Notice>;

/** Administração e secretária usam o painel web. Quem atende em outra clínica pode trocar para ela aqui. */
export function NotDentistScreen() {
  const { clinic, switchClinic } = useAuth();
  const clinics = useResource(() => Auth.clinics(), []);
  const others = (clinics.data ?? []).filter((c) => c.id !== clinic.id);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async (target) => {
    setBusy(true); setError(null);
    try { await switchClinic(target.id); } catch (err) { setError(errorMessage(err)); setBusy(false); }
  };
  return (
    <Notice title="App do dentista" extra={others.length > 0 ? (
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Body style={{ textAlign: 'center' }}>Você também trabalha nestas clínicas:</Body>
        <ClinicList clinics={others} disabled={busy} onChoose={go} />
      </View>
    ) : null}>
      Este aplicativo é para quem atende pacientes. A secretária e o administrador que não atende usam o painel web da clínica.
    </Notice>
  );
}

