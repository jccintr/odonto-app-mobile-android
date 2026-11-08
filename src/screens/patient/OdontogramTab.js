import React, { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { Patients } from '../../api';
import { errorMessage } from '../../api/client';
import Odontogram, { OdontogramLegend } from '../../components/Odontogram';
import { Alert, Body, Button, Card, Chip, ErrorState, Field, Input, Label, Loading, Muted, Row, Sheet } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useResource } from '../../hooks';
import { dayOf, formatDay } from '../../lib/dates';
import { CONDITION } from '../../lib/labels';
import { FACES, normalizeFaces, toothLabel } from '../../lib/tooth';

export default function OdontogramTab({ patient }) {
  const { c } = useTheme();
  const data = useResource(() => Patients.odontogram(patient.id), [patient.id]);
  const [selected, setSelected] = useState(null);
  const [deciduous, setDeciduous] = useState(false);
  const [form, setForm] = useState({ condition: 'caries', faces: '', notes: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  if (data.loading && !data.data) return <Loading />;
  if (data.error && !data.data) return <ErrorState error={data.error} onRetry={data.reload} />;
  const { teeth, planned = {} } = data.data;
  const records = selected ? teeth[selected] ?? [] : [];
  const showDeciduous = deciduous || Object.keys(teeth).some((t) => Number(t) >= 51);

  const close = () => { setSelected(null); setError(null); setForm({ condition: 'caries', faces: '', notes: '' }); };
  const toggleFace = (face) => setForm((f) => ({ ...f, faces: normalizeFaces(f.faces.includes(face) ? f.faces.replace(face, '') : f.faces + face) }));

  const mark = async () => {
    setBusy(true); setError(null);
    try {
      await Patients.mark(patient.id, { tooth: selected, condition: form.condition, faces: form.faces || undefined, notes: form.notes.trim() || undefined, recordedOn: dayOf() });
      setMessage(`Dente ${selected} marcado.`);
      setForm({ condition: 'caries', faces: '', notes: '' });
      await data.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const unmark = async (record) => {
    setError(null);
    try { await Patients.unmark(patient.id, record.id); setMessage('Marcação removida.'); await data.reload(); } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {message ? <Alert tone="success">{message}</Alert> : null}
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Toque em um dente</Label>
          <Row><Muted>Dentes de leite</Muted><Switch accessibilityLabel="Dentes de leite" value={showDeciduous} onValueChange={setDeciduous} trackColor={{ true: c.primary }} /></Row>
        </Row>
        <Odontogram teeth={teeth} planned={planned} selected={selected} deciduous={showDeciduous} onSelect={(t) => { setMessage(null); setSelected(t); }} />
        <OdontogramLegend />
      </Card>

      <Sheet open={selected !== null} onClose={close} title={selected ? toothLabel(selected) : ''} footer={<Button title="Fechar" variant="secondary" onPress={close} />}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {(planned[selected] ?? []).length > 0 ? (
          <>
            <Label>Planejado para este dente</Label>
            {planned[selected].map((p) => (
              <Card key={p.itemId} style={{ gap: 2 }}>
                <Body style={{ fontWeight: '700' }}>{p.procedure.name}{p.faces ? ` (${p.faces})` : ''}</Body>
                <Muted>{p.approved ? 'Aprovado pelo paciente: a realizar' : 'Proposto no orçamento, ainda sem aprovação'}</Muted>
              </Card>
            ))}
          </>
        ) : null}
        <Label>Histórico do dente</Label>
        {records.length === 0 ? <Muted>Nenhuma marcação neste dente.</Muted> : records.map((r) => (
          <Card key={r.id} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row><View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: CONDITION[r.condition]?.color }} /><Body style={{ fontWeight: '700' }}>{CONDITION[r.condition]?.label ?? r.condition}{r.faces ? ` (${r.faces})` : ''}</Body></Row>
              <Button title="Remover" variant="ghost" onPress={() => unmark(r)} />
            </Row>
            <Muted>{formatDay(r.recordedOn)}{r.sourceItemId ? ' · automática (procedimento realizado)' : ''}{r.recordedByName ? ` · ${r.recordedByName}` : ''}</Muted>
            {r.notes ? <Body>{r.notes}</Body> : null}
          </Card>
        ))}
        <Label style={{ marginTop: 6 }}>Nova marcação</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(CONDITION).map(([key, cond]) => <Chip key={key} label={cond.label} color={cond.color} selected={form.condition === key} onPress={() => setForm({ ...form, condition: key })} />)}
        </View>
        <Field label="Faces (opcional)">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FACES.map((f) => <Chip key={f.id} label={f.label} selected={form.faces.includes(f.id)} onPress={() => toggleFace(f.id)} />)}
          </View>
        </Field>
        <Input label="Observações" autoCapitalize="sentences" maxLength={500} value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} />
        <Button title={`Marcar dente ${selected ?? ''}`} loading={busy} onPress={mark} />
      </Sheet>
    </ScrollView>
  );
}
