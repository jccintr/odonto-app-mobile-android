import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Budgets } from '../api';
import { errorMessage } from '../api/client';
import ItemSheet from '../components/ItemSheet';
import { Alert, Body, Button, Card, Label, Muted, Row, Screen, Title } from '../components/ui';
import { itemLabel, subtotalOf } from '../lib/budget';
import { formatMoney } from '../lib/money';

export default function NewBudgetScreen({ route, navigation }) {
  const { patient } = route.params;
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const created = await Budgets.create({ patientId: patient.id, items: items.map(({ procedureId, tooth, faces, priceCents }) => ({ procedureId, tooth, faces, priceCents })) });
      navigation.replace('Budget', { id: created.id });
    } catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ gap: 2 }}><Title>Novo orçamento</Title><Muted>{patient.name}</Muted></View>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Label>Procedimentos</Label>
        {items.length === 0 ? <Muted>Nenhum procedimento ainda. Toque em “Adicionar procedimento”.</Muted> : items.map((item, i) => (
          <Card key={`${item.procedureId}-${i}`}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>{itemLabel(item)}</Body><Muted>{formatMoney(item.priceCents)}</Muted></View>
              <Button title="Remover" variant="ghost" icon={Trash2} onPress={() => setItems(items.filter((_, j) => j !== i))} />
            </Row>
          </Card>
        ))}
        <Button title="Adicionar procedimento" variant="secondary" icon={Plus} onPress={() => setAdding(true)} />
        <Card><Row style={{ justifyContent: 'space-between' }}><Body>Total</Body><Body style={{ fontWeight: '700', fontSize: 18 }}>{formatMoney(subtotalOf(items))}</Body></Row></Card>
        <Button title="Salvar orçamento" loading={busy} disabled={items.length === 0} onPress={save} />
      </ScrollView>
      <ItemSheet open={adding} onClose={() => setAdding(false)} onSave={async (item) => { setItems([...items, item]); setAdding(false); }} />
    </Screen>
  );
}
