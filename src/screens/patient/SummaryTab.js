import React from 'react';
import { ScrollView, View } from 'react-native';
import { Appointments } from '../../api';
import { Alert, Body, Card, Label, Muted, StatusBadge } from '../../components/ui';
import { useResource } from '../../hooks';
import { dayOf, formatDay, timeOf } from '../../lib/dates';
import { APPOINTMENT_STATUS } from '../../lib/labels';
import { maskCpf } from '../../lib/masks';
import { conditionLabels, readAnamnesis } from '../../lib/patient';

const Line = ({ label, value }) => (value ? <View style={{ gap: 2 }}><Label>{label}</Label><Body>{value}</Body></View> : null);

export default function SummaryTab({ patient }) {
  const anamnesis = readAnamnesis(patient.anamnesis);
  const conditions = conditionLabels(anamnesis.conditions);
  const appts = useResource(() => Appointments.list({ patientId: patient.id, perPage: 5 }), [patient.id]);
  const a = patient.address;
  const address = [a.street && `${a.street}${a.number ? `, ${a.number}` : ''}`, a.district, a.city && `${a.city}${a.state ? `/${a.state}` : ''}`].filter(Boolean).join(' · ');
  const alerts = [...conditions, anamnesis.allergies && `Alergias: ${anamnesis.allergies}`].filter(Boolean);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {alerts.length > 0 ? <Alert tone="warning">Atenção na anamnese: {alerts.join(' · ')}</Alert> : null}
      <Card style={{ gap: 12 }}>
        <Line label="E-mail" value={patient.email} />
        <Line label="CPF" value={patient.cpf ? maskCpf(patient.cpf) : null} />
        <Line label="Nascimento" value={patient.birthDate ? formatDay(patient.birthDate) : null} />
        <Line label="Endereço" value={address} />
        <Line label="Responsável" value={patient.guardianName} />
        <Line label="Observações" value={patient.notes} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Label>Anamnese</Label>
        <Line label="Condições" value={conditions.join(', ')} />
        <Line label="Alergias" value={anamnesis.allergies} />
        <Line label="Medicamentos" value={anamnesis.medications} />
        <Line label="Fumante" value={anamnesis.smoker ? 'Sim' : null} />
        <Line label="Gestante" value={anamnesis.pregnant ? 'Sim' : null} />
        <Line label="Observações" value={anamnesis.notes} />
        {alerts.length === 0 && !anamnesis.medications && !anamnesis.notes && !anamnesis.smoker && !anamnesis.pregnant ? <Muted>Nenhuma informação de anamnese registrada.</Muted> : null}
      </Card>
      <Card style={{ gap: 8 }}>
        <Label>Últimos atendimentos</Label>
        {(appts.data?.data ?? []).length === 0 ? <Muted>Nenhum atendimento.</Muted> : appts.data.data.map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Body>{formatDay(dayOf(x.startsAt))} · {timeOf(x.startsAt)}</Body>
            <StatusBadge map={APPOINTMENT_STATUS} value={x.status} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
