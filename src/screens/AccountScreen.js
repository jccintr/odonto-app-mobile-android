import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';
import { Auth } from '../api';
import { errorMessage } from '../api/client';
import { API_URL } from '../config';
import ClinicList from '../components/ClinicList';
import { Alert, Body, Button, Card, Chip, Input, Label, Muted, Row, Screen, Sheet, Title } from '../components/ui';
import { useResource } from '../hooks';
import { isValidPhone, maskPhone, onlyDigits } from '../lib/masks';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const THEMES = [['system', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']];

export default function AccountScreen() {
  const { user, clinic, logout, adopt, switchClinic, updateUser } = useAuth();
  // nome e telefone são da pessoa: valem em todas as clínicas dela
  const [editing, setEditing] = useState(false);
  const [person, setPerson] = useState({ name: '', phone: '' });
  const openPerson = () => { setPerson({ name: user.name, phone: maskPhone(user.phone ?? '') }); setError(null); setEditing(true); };
  const personChanges = {
    ...(person.name.trim() !== user.name && { name: person.name.trim() }),
    ...(onlyDigits(person.phone) !== (user.phone ?? '') && { phone: onlyDigits(person.phone) || null }),
  };
  const savePerson = async () => {
    setBusy(true); setError(null);
    try {
      updateUser((await Auth.updateMe(personChanges)).user);
      setEditing(false);
      setMessage('Dados alterados.');
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  const clinics = useResource(() => Auth.clinics(), []);
  const [switching, setSwitching] = useState(false);
  const change = async (target) => {
    setBusy(true); setError(null);
    try { await switchClinic(target.id); setSwitching(false); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
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
          <View><Label>Telefone</Label><Body>{user.phone ? maskPhone(user.phone) : '—'}</Body></View>
          <View><Label>Clínica</Label><Body>{clinic.name}</Body></View>
        </Card>
        <Card style={{ gap: 10 }}>
          <Label>Aparência</Label>
          <Row style={{ flexWrap: 'wrap' }}>{THEMES.map(([id, label]) => <Chip key={id} label={label} selected={preference === id} onPress={() => setPreference(id)} />)}</Row>
        </Card>
        <Button title="Editar meus dados" variant="secondary" onPress={openPerson} />
        {(clinics.data?.length ?? 0) > 1 ? <Button title="Trocar de clínica" variant="secondary" onPress={() => setSwitching(true)} /> : null}
        <Button title="Trocar a senha" variant="secondary" onPress={() => setChanging(true)} />
        <Button title="Sair" variant="danger" icon={LogOut} onPress={logout} />
        <Muted style={{ textAlign: 'center' }}>OdontoApp {Constants.expoConfig?.version ?? ''} · {API_URL}</Muted>
      </ScrollView>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Meus dados" footer={<><Button title="Cancelar" variant="secondary" onPress={() => setEditing(false)} /><Button title="Salvar" loading={busy} disabled={person.name.trim().length < 2 || !isValidPhone(person.phone) || Object.keys(personChanges).length === 0} onPress={savePerson} /></>}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Muted>Nome e telefone valem em todas as clínicas em que você trabalha.</Muted>
        <Input label="Nome" value={person.name} onChangeText={(name) => setPerson({ ...person, name })} />
        <Input label="Telefone / WhatsApp" keyboardType="phone-pad" placeholder="(00) 00000-0000" error={isValidPhone(person.phone) ? null : 'Telefone inválido (informe DDD + número).'} value={person.phone} onChangeText={(phone) => setPerson({ ...person, phone: maskPhone(phone) })} />
      </Sheet>

      <Sheet open={switching} onClose={() => { setSwitching(false); setError(null); }} title="Trocar de clínica" footer={<Button title="Cancelar" variant="secondary" onPress={() => setSwitching(false)} />}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <ClinicList clinics={clinics.data ?? []} currentId={clinic.id} disabled={busy} onChoose={change} />
      </Sheet>

      <Sheet open={changing} onClose={close} title="Trocar a senha" footer={<><Button title="Cancelar" variant="secondary" onPress={close} /><Button title="Alterar senha" loading={busy} disabled={!form.current || form.next.length < 8 || form.next !== form.confirm} onPress={submit} /></>}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Muted>A senha é da sua conta: vale em todas as clínicas.</Muted>
        <Input label="Senha atual" secure value={form.current} onChangeText={(current) => setForm({ ...form, current })} />
        <Input label="Nova senha" secure hint="No mínimo 8 caracteres." value={form.next} onChangeText={(next) => setForm({ ...form, next })} />
        <Input label="Repita a nova senha" secure error={mismatch ? 'As senhas não conferem.' : null} value={form.confirm} onChangeText={(confirm) => setForm({ ...form, confirm })} />
      </Sheet>
    </Screen>
  );
}
