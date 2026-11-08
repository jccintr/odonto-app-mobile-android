import React from 'react';
import { View } from 'react-native';
import { Body, Card, Muted, Row, StatusBadge } from './ui';
import { dayOf, formatDay } from '../lib/dates';
import { BUDGET_STATUS } from '../lib/labels';
import { formatMoney } from '../lib/money';

export default function BudgetCard({ budget, onPress, showPatient }) {
  return (
    <Card testID={`budget-${budget.id}`} onPress={onPress}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          {showPatient ? <Body style={{ fontWeight: '700' }} numberOfLines={1}>{budget.patient.name}</Body> : null}
          <Body style={showPatient ? undefined : { fontWeight: '700' }}>{formatMoney(budget.totalCents)}</Body>
          <Muted>{budget.itemsCount} {budget.itemsCount === 1 ? 'procedimento' : 'procedimentos'} · {formatDay(dayOf(budget.createdAt))}</Muted>
        </View>
        <StatusBadge map={BUDGET_STATUS} value={budget.status} />
      </Row>
    </Card>
  );
}
