import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { Budgets } from '../api';
import BudgetCard from '../components/BudgetCard';
import { Chip, EmptyState, ErrorState, Loading, Screen, Title } from '../components/ui';
import { useResource } from '../hooks';

const FILTERS = [['', 'Todos'], ['open', 'Em aberto'], ['approved', 'Aprovados'], ['completed', 'Concluídos'], ['rejected', 'Recusados']];

export default function BudgetsScreen({ navigation }) {
  const [status, setStatus] = useState('');
  const res = useResource(() => Budgets.list({ status, perPage: 50 }), [status]);
  useEffect(() => navigation.addListener('focus', () => { res.reload(); }), [navigation, res.reload]);

  return (
    <Screen>
      <View style={{ padding: 16, gap: 12 }}>
        <Title>Orçamentos</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FILTERS.map(([value, label]) => <Chip key={value} label={label} selected={status === value} onPress={() => setStatus(value)} />)}
        </View>
      </View>
      {res.loading && !res.data ? <Loading /> : res.error && !res.data ? <ErrorState error={res.error} onRetry={res.reload} /> : (
        <FlatList
          data={res.data.data}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={ClipboardList} title="Nenhum orçamento" />}
          renderItem={({ item: b }) => <BudgetCard budget={b} showPatient onPress={() => navigation.navigate('Budget', { id: b.id })} />}
        />
      )}
    </Screen>
  );
}
