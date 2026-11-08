import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { Patients } from '../api';
import { Body, Card, EmptyState, ErrorState, Input, Loading, Muted, Screen, Title } from '../components/ui';
import { useDebounced, useResource } from '../hooks';
import { ageOf } from '../lib/dates';

export default function PatientsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const res = useResource(() => Patients.list({ q, active: true, perPage: 50 }), [q]);
  const list = res.data?.data ?? [];

  return (
    <Screen>
      <View style={{ padding: 16, gap: 12 }}>
        <Title>Pacientes</Title>
        <Input accessibilityLabel="Buscar paciente" placeholder="Buscar por nome ou CPF" autoCapitalize="none" value={search} onChangeText={setSearch} />
      </View>
      {res.loading && !res.data ? <Loading /> : res.error && !res.data ? <ErrorState error={res.error} onRetry={res.reload} /> : (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon={Users} title="Nenhum paciente encontrado" />}
          ListFooterComponent={res.data && res.data.total > list.length ? <Muted style={{ textAlign: 'center' }}>Mostrando {list.length} de {res.data.total}. Refine a busca para achar outros.</Muted> : null}
          renderItem={({ item: p }) => (
            <Card testID={`patient-${p.id}`} onPress={() => navigation.navigate('Patient', { id: p.id, name: p.name })}>
              <Body style={{ fontWeight: '700' }}>{p.name}</Body>
              <Muted>{p.birthDate ? `${ageOf(p.birthDate)} anos` : 'Sem data de nascimento'}</Muted>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
