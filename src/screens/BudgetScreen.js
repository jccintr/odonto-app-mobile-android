import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Budgets } from '../api';
import { errorMessage } from '../api/client';
import ItemSheet from '../components/ItemSheet';
import { Alert, Body, Button, Card, ErrorState, Label, Loading, Muted, Row, Screen, StatusBadge, Title } from '../components/ui';
import { useResource } from '../hooks';
import { itemLabel } from '../lib/budget';
import { dayOf, formatDay } from '../lib/dates';
import { BUDGET_STATUS, ITEM_STATUS } from '../lib/labels';
import { formatMoney } from '../lib/money';

export default function BudgetScreen({ route }) {
  const { id } = route.params;
  const res = useResource(() => Budgets.get(id), [id]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(null);
  const [adding, setAdding] = useState(false);

  if (res.loading && !res.data) return <Screen edges={[]}><Loading /></Screen>;
  if (res.error && !res.data) return <Screen edges={[]}><ErrorState error={res.error} onRetry={res.reload} /></Screen>;
  const budget = res.data;

  const run = async (key, call, done) => {
    setBusy(key); setError(null); setMessage(null);
    try { await call(); if (done) setMessage(done); await res.reload(); return true; } catch (err) { setError(errorMessage(err)); return false; } finally { setBusy(null); }
  };

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Title>{budget.patient.name}</Title>
          <Row><StatusBadge map={BUDGET_STATUS} value={budget.status} /><Muted>Criado em {formatDay(dayOf(budget.createdAt))}</Muted></Row>
        </View>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}

        <Label>Procedimentos</Label>
        {budget.items.map((item) => (
          <Card key={item.id} testID={`item-${item.id}`} style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>{itemLabel(item)}</Body><Muted>{formatMoney(item.priceCents)}</Muted></View>
              <StatusBadge map={ITEM_STATUS} value={item.status === 'pending' && !item.approvalId ? 'proposed' : item.status} />
            </Row>
            {item.status === 'pending' && budget.status === 'approved' ? (
              <Row>
                <Button title="Cancelar item" variant="secondary" style={{ flex: 1 }} loading={busy === `cancel-${item.id}`} disabled={busy !== null} onPress={() => run(`cancel-${item.id}`, () => Budgets.cancelItem(id, item.id), 'Procedimento cancelado.')} />
              </Row>
            ) : null}
            {budget.status === 'open' ? <Button title="Remover do orçamento" variant="ghost" loading={busy === `remove-${item.id}`} disabled={busy !== null} onPress={() => run(`remove-${item.id}`, () => Budgets.removeItem(id, item.id))} /> : null}
          </Card>
        ))}

        <Card>
          <Row style={{ justifyContent: 'space-between' }}><Body>Subtotal</Body><Body>{formatMoney(budget.subtotalCents)}</Body></Row>
          {budget.discountCents > 0 ? <Row style={{ justifyContent: 'space-between' }}><Body>Desconto</Body><Body>- {formatMoney(budget.discountCents)}</Body></Row> : null}
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}><Body style={{ fontWeight: '700' }}>Total</Body><Body style={{ fontWeight: '700', fontSize: 18 }}>{formatMoney(budget.totalCents)}</Body></Row>
        </Card>

        {budget.status === 'open' ? (
          <>
            <Button title="Adicionar procedimento" variant="secondary" icon={Plus} onPress={() => setAdding(true)} />
            <Button title="Aprovar orçamento" loading={busy === 'approve'} disabled={busy !== null || budget.itemsCount === 0} onPress={() => run('approve', () => Budgets.setStatus(id, 'approved'), 'Orçamento aprovado. Os procedimentos aprovados serão realizados nos atendimentos.')} />
            <Button title="Recusar orçamento" variant="danger" loading={busy === 'reject'} disabled={busy !== null} onPress={() => run('reject', () => Budgets.setStatus(id, 'rejected'), 'Orçamento recusado.')} />
          </>
        ) : null}
      </ScrollView>

      <ItemSheet open={adding} onClose={() => setAdding(false)} onSave={async (item) => {
        await Budgets.addItem(id, { procedureId: item.procedureId, tooth: item.tooth, faces: item.faces });
        setAdding(false);
        await res.reload();
      }} />
    </Screen>
  );
}
