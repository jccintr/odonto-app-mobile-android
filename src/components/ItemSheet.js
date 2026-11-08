import React, { useState } from 'react';
import { View } from 'react-native';
import { loadActiveProcedures } from '../api';
import { errorMessage } from '../api/client';
import { Alert, Body, Button, Card, Chip, Field, Input, Loading, Muted, Sheet } from './ui';
import { useResource } from '../hooks';
import { formatMoney } from '../lib/money';
import { FACES, isTooth, normalizeFaces } from '../lib/tooth';

const EMPTY = { procedure: null, tooth: '', faces: '', search: '' };

/** Escolhe um procedimento e informa dente e faces. O preço é o da tabela da clínica (não se altera no orçamento). `onSave(item)` recebe { procedure, procedureId, tooth, faces, priceCents } (o preço é só para exibir). */
export default function ItemSheet({ open, onClose, onSave, title = 'Adicionar procedimento', initialTooth }) {
  const procedures = useResource(() => (open ? loadActiveProcedures() : Promise.resolve([])), [open]);
  const [form, setForm] = useState({ ...EMPTY, tooth: initialTooth ? String(initialTooth) : '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = (procedures.data ?? []).filter((p) => p.name.toLowerCase().includes(form.search.trim().toLowerCase()));
  const pick = (procedure) => setForm({ ...form, procedure });
  const toggleFace = (face) => setForm((f) => ({ ...f, faces: normalizeFaces(f.faces.includes(face) ? f.faces.replace(face, '') : f.faces + face) }));

  const save = async () => {
    const tooth = form.tooth.trim() === '' ? null : Number(form.tooth);
    if (tooth !== null && !isTooth(tooth)) return setError('Dente inválido. Use a numeração FDI (ex.: 16, 21, 48 ou 55).');
    if (form.faces && tooth === null) return setError('Informe o dente para indicar as faces.');
    setError(null); setBusy(true);
    try {
      await onSave({ procedure: form.procedure, procedureId: form.procedure.id, tooth: tooth ?? undefined, faces: form.faces || undefined, priceCents: form.procedure.priceCents });
      setForm({ ...EMPTY });
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const close = () => { setForm({ ...EMPTY }); setError(null); onClose(); };

  return (
    <Sheet open={open} onClose={close} title={title} footer={form.procedure ? <><Button title="Voltar" variant="secondary" onPress={() => setForm({ ...form, procedure: null })} /><Button title="Adicionar" loading={busy} onPress={save} /></> : <Button title="Fechar" variant="secondary" onPress={close} />}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {!form.procedure ? (
        <>
          <Input label="Buscar procedimento" autoCapitalize="none" value={form.search} onChangeText={(search) => setForm({ ...form, search })} />
          {procedures.loading ? <Loading /> : filtered.length === 0 ? <Muted>Nenhum procedimento encontrado.</Muted> : filtered.map((p) => (
            <Card key={p.id} onPress={() => pick(p)}><Body style={{ fontWeight: '700' }}>{p.name}</Body><Muted>{[p.category, formatMoney(p.priceCents)].filter(Boolean).join(' · ')}</Muted></Card>
          ))}
        </>
      ) : (
        <>
          <Card><Body style={{ fontWeight: '700' }}>{form.procedure.name}</Body><Muted>Valor da tabela da clínica: {formatMoney(form.procedure.priceCents)}</Muted></Card>
          <Input label="Dente (opcional)" keyboardType="number-pad" maxLength={2} hint="Numeração FDI: 11 a 48; dentes de leite 51 a 85." value={form.tooth} onChangeText={(tooth) => setForm({ ...form, tooth: tooth.replace(/\D/g, '') })} />
          <Field label="Faces (opcional)">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{FACES.map((f) => <Chip key={f.id} label={f.label} selected={form.faces.includes(f.id)} onPress={() => toggleFace(f.id)} />)}</View>
          </Field>
        </>
      )}
    </Sheet>
  );
}
