import React, { useState } from 'react';
import { View } from 'react-native';
import { Appointments, loadActiveProcedures, Patients } from '../api';
import { errorMessage } from '../api/client';
import Odontogram from './Odontogram';
import { Alert, Body, Button, Card, Chip, Input, Label, Loading, Muted, Row, Sheet } from './ui';
import { useResource } from '../hooks';
import { itemLabel } from '../lib/budget';
import { buildEvolution, evolutionProblem, toggleEntry, toggleToothOf, toggleWholeMouthOf, whereLabel } from '../lib/evolution';

const VISIBLE_PROCEDURES = 12;

// procedimentos aprovados pelo paciente e ainda a realizar, de todos os orçamentos (inclusive de outros dentistas)
async function loadPendingItems(patientId) {
  const { data } = await Patients.treatmentItems(patientId);
  return data.map((row) => ({ id: row.itemId, procedure: row.procedure, tooth: row.tooth, faces: row.faces }));
}

/** Onde o procedimento foi feito: dentes afetados (toque no odontograma) ou boca toda. */
function WhereEditor({ entry, deciduous, onTooth, onWholeMouth }) {
  return (
    <Card testID={`where-${entry.id}`} style={{ gap: 8 }}>
      <Body style={{ fontWeight: '700' }}>{entry.label}</Body>
      <Row style={{ flexWrap: 'wrap' }}>
        <Chip label="Boca toda" selected={entry.wholeMouth} onPress={() => onWholeMouth(entry.id)} />
        <Muted>{whereLabel(entry)}</Muted>
      </Row>
      <Odontogram selected={entry.teeth} deciduous={deciduous} onSelect={(tooth) => onTooth(entry.id, tooth)} />
    </Card>
  );
}

/**
 * Concluir o atendimento: o dentista informa o(s) procedimento(s) realizado(s) e, em cada um, os dentes afetados
 * (ou boca toda), com um texto opcional; também pode dar baixa em itens do orçamento aprovado.
 * Fica no prontuário do paciente.
 */
export default function EvolutionSheet({ appointment, onClose, onSaved }) {
  const [description, setDescription] = useState('');
  const [procedures, setProcedures] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [deciduous, setDeciduous] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const catalog = useResource(loadActiveProcedures, []);
  const items = useResource(() => loadPendingItems(appointment.patient.id), [appointment.patient.id]);

  const state = { description, procedures, budgetItems };
  const term = search.trim().toLowerCase();
  const matches = (catalog.data ?? []).filter((p) => !procedures.some((e) => e.id === p.id) && (!term || p.name.toLowerCase().includes(term))).slice(0, VISIBLE_PROCEDURES);
  const editable = [...procedures, ...budgetItems].filter((e) => !e.fixed);

  const onTooth = (id, tooth) => { setProcedures((list) => toggleToothOf(list, id, tooth)); setBudgetItems((list) => toggleToothOf(list, id, tooth)); };
  const onWholeMouth = (id) => { setProcedures((list) => toggleWholeMouthOf(list, id)); setBudgetItems((list) => toggleWholeMouthOf(list, id)); };

  const save = async () => {
    const problem = evolutionProblem(state);
    if (problem) { setError(problem); return; }
    setBusy(true); setError(null);
    try {
      onSaved(await Appointments.finish(appointment.id, buildEvolution(state)));
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={busy ? () => {} : onClose} title="Concluir atendimento"
      footer={<><Button title="Voltar" variant="secondary" disabled={busy} onPress={onClose} /><Button title="Concluir atendimento" loading={busy} onPress={save} /></>}>
      <Body>{appointment.patient.name}</Body>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {items.loading && !items.data ? <Loading label="Buscando o orçamento…" /> : (items.data ?? []).length > 0 ? (
        <View style={{ gap: 8 }}>
          <Label>Do orçamento aprovado (dá baixa no item)</Label>
          <Row style={{ flexWrap: 'wrap' }}>
            {items.data.map((item) => (
              <Chip key={item.id} label={itemLabel(item)} selected={budgetItems.some((e) => e.id === item.id)}
                onPress={() => setBudgetItems(toggleEntry(budgetItems, { id: item.id, label: itemLabel(item), fixed: Boolean(item.tooth), teeth: item.tooth ? [item.tooth] : [] }))} />
            ))}
          </Row>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Label>Outros procedimentos realizados</Label>
        {catalog.loading && !catalog.data ? <Loading label="Carregando procedimentos…" /> : (
          <>
            <Input accessibilityLabel="Buscar procedimento" placeholder="Buscar procedimento" autoCapitalize="none" value={search} onChangeText={setSearch} />
            <Row style={{ flexWrap: 'wrap' }}>
              {procedures.map((e) => <Chip key={e.id} label={e.label} selected onPress={() => setProcedures(toggleEntry(procedures, e))} />)}
              {matches.map((p) => <Chip key={p.id} label={p.name} onPress={() => setProcedures(toggleEntry(procedures, { id: p.id, label: p.name }))} />)}
            </Row>
            {matches.length === 0 && term ? <Muted>Nenhum procedimento encontrado.</Muted> : null}
          </>
        )}
      </View>

      {editable.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Label>Dentes afetados</Label>
          <Row><Chip label="Dentes de leite" selected={deciduous} onPress={() => setDeciduous(!deciduous)} /></Row>
          {editable.map((e) => <WhereEditor key={e.id} entry={e} deciduous={deciduous} onTooth={onTooth} onWholeMouth={onWholeMouth} />)}
        </View>
      ) : null}

      <Input label="Observações (opcional)" placeholder="Detalhes do atendimento" multiline numberOfLines={4} textAlignVertical="top" autoCapitalize="sentences" value={description} onChangeText={setDescription} style={{ minHeight: 96 }} />
      <Muted>O registro vai para o prontuário do paciente e não pode ser apagado; se houver erro, é possível acrescentar uma retificação.</Muted>
    </Sheet>
  );
}
