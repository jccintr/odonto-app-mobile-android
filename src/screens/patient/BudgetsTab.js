import React from 'react';
import { ScrollView, View } from 'react-native';
import { ClipboardList, Plus } from 'lucide-react-native';
import { Budgets } from '../../api';
import BudgetCard from '../../components/BudgetCard';
import { Button, EmptyState, ErrorState, Loading } from '../../components/ui';
import { useResource } from '../../hooks';

export default function BudgetsTab({ patient, navigation }) {
  const res = useResource(() => Budgets.list({ patientId: patient.id, perPage: 50 }), [patient.id]);
  // ao voltar de um orçamento criado ou alterado, a lista se atualiza
  React.useEffect(() => navigation.addListener('focus', () => { res.reload(); }), [navigation, res.reload]);
  if (res.loading && !res.data) return <Loading />;
  if (res.error && !res.data) return <ErrorState error={res.error} onRetry={res.reload} />;
  const list = res.data.data;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}>
      <Button title="Novo orçamento" icon={Plus} onPress={() => navigation.navigate('NewBudget', { patient })} />
      {list.length === 0 ? <View style={{ height: 240 }}><EmptyState icon={ClipboardList} title="Nenhum orçamento para este paciente" /></View> : list.map((b) => (
        <BudgetCard key={b.id} budget={b} onPress={() => navigation.navigate('Budget', { id: b.id })} />
      ))}
    </ScrollView>
  );
}
