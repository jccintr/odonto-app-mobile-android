import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';
import { Auth } from '../api';
import { errorMessage } from '../api/client';
import { API_URL } from '../config';
import { Alert, Body, Button, Card, Chip, Input, Label, Muted, Row, Screen, Sheet, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const THEMES = [['system', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']];

export default function AccountScreen() {
  const { user, clinic, logout, adopt } = useAuth();
  const { preference, setPreference } = useTheme();
  const [changing, setChanging] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const mismatch = form.confirm && form.next !== form.confirm;

  const close = () => { setChanging(false); setForm({ current: '', next: '', confirm: '' }); setError(null); };
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await adopt(await Auth.changePassword(form.current, form.next));
      close();
      setMessage('Senha alterada. As outras sessões foram encerradas.');
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Title>Minha conta</Title>
        {message ? <Alert tone="success">{message}</Alert> : null}
        <Card style={{ gap: 10 }}>
          <View><Label>Nome</Label><Body>{user.name}</Body></View>
          <View><Label>E-mail</Label><Body>{user.email}</Body></View>
          <View><Label>Clínica</Label><Body>{clinic.name}</Body></View>
        </Card>
        <Card style={{ gap: 10 }}>
          <Label>Aparência</Label>
          <Row style={{ flexWrap: 'wrap' }}>{THEMES.map(([id, label]) => <Chip key={id} label={label} selected={preference === id} onPress={() => setPreference(id)} />)}</Row>
        </Card>
        <Button title="Trocar a senha" variant="secondary" onPress={() => setChanging(true)} />
        <Button title="Sair" variant="danger" icon={LogOut} onPress={logout} />
        <Muted style={{ textAlign: 'center' }}>OdontoApp {Constants.expoConfig?.version ?? ''} · {API_URL}</Muted>
      </ScrollView>

      <Sheet open={changing} onClose={close} title="Trocar a senha" footer={<><Button title="Cancelar" variant="secondary" onPress={close} /><Button title="Alterar senha" loading={busy} disabled={!form.current || form.next.length < 8 || form.next !== form.confirm} onPress={submit} /></>}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input label="Senha atual" secure value={form.current} onChangeText={(current) => setForm({ ...form, current })} />
        <Input label="Nova senha" secure hint="No mínimo 8 caracteres." value={form.next} onChangeText={(next) => setForm({ ...form, next })} />
        <Input label="Repita a nova senha" secure error={mismatch ? 'As senhas não conferem.' : null} value={form.confirm} onChangeText={(confirm) => setForm({ ...form, confirm })} />
      </Sheet>
    </Screen>
  );
}
