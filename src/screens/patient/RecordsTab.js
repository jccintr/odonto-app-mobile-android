import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { Evolutions } from '../../api';
import { errorMessage } from '../../api/client';
import { Alert, Badge, Body, Button, Card, EmptyState, ErrorState, Input, Label, Loading, Muted, Row, Sheet } from '../../components/ui';
import { useResource } from '../../hooks';
import { formatDateTime } from '../../lib/dates';
import { MIN_DESCRIPTION } from '../../lib/evolution';

/** Prontuário do paciente: o que foi feito em cada atendimento. Só acrescenta; erros se corrigem com retificação. */
export default function RecordsTab({ patient }) {
  const res = useResource(() => Evolutions.list(patient.id, { perPage: 50 }), [patient.id]);
  const [amending, setAmending] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (res.loading && !res.data) return <Loading />;
  if (res.error && !res.data) return <ErrorState error={res.error} onRetry={res.reload} />;
  const { data, total } = res.data;

  const close = () => { setAmending(null); setText(''); setError(null); };
  const save = async () => {
    if (text.trim().length < MIN_DESCRIPTION) { setError(`Descreva a retificação com pelo menos ${MIN_DESCRIPTION} letras.`); return; }
    setBusy(true); setError(null);
    try {
      await Evolutions.addendum(patient.id, amending.id, text.trim());
      close();
      res.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}>
      {data.length === 0 ? <View style={{ height: 240 }}><EmptyState icon={FileText} title="Nenhum registro no prontuário">O que for feito em cada atendimento aparece aqui.</EmptyState></View> : data.map((e) => (
        <Card key={e.id} testID={`record-${e.id}`} style={{ gap: 8 }}>
          <Label>{formatDateTime(e.appointmentStartsAt)} · {e.dentist.name}</Label>
          {e.description ? <Body>{e.description}</Body> : null}
          {e.procedures.length > 0 ? (
            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
              {e.procedures.map((p) => <Badge key={`${p.procedure.id}-${p.tooth ?? 'boca'}-${p.budgetItemId}`}>{p.procedure.name} · {p.wholeMouth ? 'boca toda' : `dente ${p.tooth}`}</Badge>)}
            </Row>
          ) : null}
          {e.addenda.map((a) => <Alert key={a.id} tone="info"><Body>Retificação em {formatDateTime(a.createdAt)}: {a.description}</Body></Alert>)}
          {e.canAmend ? <Button title="Retificar" variant="ghost" onPress={() => setAmending(e)} /> : null}
        </Card>
      ))}
      {total > data.length ? <Muted style={{ textAlign: 'center' }}>Mostrando {data.length} de {total} registros.</Muted> : null}

      <Sheet open={amending !== null} onClose={busy ? () => {} : close} title="Retificar registro"
        footer={<><Button title="Voltar" variant="secondary" disabled={busy} onPress={close} /><Button title="Salvar retificação" loading={busy} onPress={save} /></>}>
        <Muted>O registro original não muda: sua correção aparece junto dele.</Muted>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input label="Retificação" multiline numberOfLines={4} textAlignVertical="top" autoCapitalize="sentences" value={text} onChangeText={setText} style={{ minHeight: 96 }} />
      </Sheet>
    </ScrollView>
  );
}
