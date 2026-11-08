import React from 'react';
import { View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Body, Button, Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Notice({ title, children }) {
  const { logout } = useAuth();
  const { c } = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, maxWidth: 480, alignSelf: 'center' }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.dangerSoft, alignItems: 'center', justifyContent: 'center' }}><Lock size={28} color={c.danger} /></View>
        <Title style={{ textAlign: 'center' }}>{title}</Title>
        <Body style={{ textAlign: 'center' }}>{children}</Body>
        <Button title="Sair" variant="secondary" onPress={logout} />
      </View>
    </Screen>
  );
}

/** A assinatura da clínica está suspensa (a API responde 402): o dentista precisa avisar o administrador. */
export const SuspendedScreen = () => <Notice title="Acesso pausado">A assinatura da clínica está suspensa. Avise o administrador da clínica para regularizar o pagamento; assim que for liberado, é só entrar de novo.</Notice>;

/** Administração e secretária usam o painel web. */
export const NotDentistScreen = () => <Notice title="App do dentista">Este aplicativo é para dentistas. A administração e a secretária usam o painel web da clínica.</Notice>;

