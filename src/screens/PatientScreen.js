import React, { useState } from 'react';
import { View } from 'react-native';
import { Patients } from '../api';
import { Body, ErrorState, Loading, Muted, Screen, Segmented, Title } from '../components/ui';
import { useResource } from '../hooks';
import { ageOf } from '../lib/dates';
import BudgetsTab from './patient/BudgetsTab';
import ImagesTab from './patient/ImagesTab';
import RecordsTab from './patient/RecordsTab';
import OdontogramTab from './patient/OdontogramTab';
import SummaryTab from './patient/SummaryTab';

const TABS = [{ id: 'summary', label: 'Resumo' }, { id: 'records', label: 'Prontuário' }, { id: 'odontogram', label: 'Odontograma' }, { id: 'budgets', label: 'Orçamentos' }, { id: 'images', label: 'Imagens' }];

export default function PatientScreen({ route, navigation }) {
  const { id } = route.params;
  const [tab, setTab] = useState('summary');
  const res = useResource(() => Patients.get(id), [id]);

  if (res.loading && !res.data) return <Screen edges={[]}><Loading /></Screen>;
  if (res.error && !res.data) return <Screen edges={[]}><ErrorState error={res.error} onRetry={res.reload} /></Screen>;
  const patient = res.data;

  return (
    <Screen edges={[]}>
      <View style={{ padding: 16, gap: 2 }}>
        <Title>{patient.name}</Title>
        <Muted>{patient.birthDate ? `${ageOf(patient.birthDate)} anos` : ''}</Muted>
        {!patient.active ? <Body>Paciente arquivado</Body> : null}
      </View>
      <Segmented options={TABS} value={tab} onChange={setTab} />
      <View style={{ flex: 1, marginTop: 12 }}>
        {tab === 'summary' && <SummaryTab patient={patient} />}
        {tab === 'records' && <RecordsTab patient={patient} />}
        {tab === 'odontogram' && <OdontogramTab patient={patient} />}
        {tab === 'budgets' && <BudgetsTab patient={patient} navigation={navigation} />}
        {tab === 'images' && <ImagesTab patient={patient} />}
      </View>
    </Screen>
  );
}
