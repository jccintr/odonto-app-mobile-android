import React, { useState } from 'react';
import { View } from 'react-native';
import { ClipboardList, UserRound } from 'lucide-react-native';
import { Appointments } from '../api';
import { errorMessage } from '../api/client';
import EvolutionSheet from '../components/EvolutionSheet';
import { Alert, Body, Button, Card, Input, Label, Muted, Row, Sheet, StatusBadge, Title } from '../components/ui';
import { formatDay, dayOf, timeOf } from '../lib/dates';
import { APPOINTMENT_STATUS } from '../lib/labels';

// o que o dentista pode fazer em cada situação (mesmas regras da API)
export const NEXT_STATUS = {
  scheduled: [['in_progress', 'Iniciar atendimento', 'primary'], ['confirmed', 'Confirmar', 'secondary'], ['no_show', 'Paciente faltou', 'secondary'], ['canceled', 'Cancelar', 'danger']],
  confirmed: [['in_progress', 'Iniciar atendimento', 'primary'], ['no_show', 'Paciente faltou', 'secondary'], ['canceled', 'Cancelar', 'danger']],
  in_progress: [['attended', 'Marcar como atendido', 'primary']],
  attended: [], no_show: [], canceled: [],
};

/** Detalhe de um atendimento com as ações do dentista. Serve para a tela cheia (celular) e para o painel ao lado da lista (tablet). */
export default function AppointmentPanel({ appointment, onChanged, onOpenPatient, onNewBudget }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [reason, setReason] = useState('');
  const [finishing, setFinishing] = useState(false);

  const change = async (status, why) => {
    setBusy(status); setError(null);
    try {
      onChanged(await Appointments.setStatus(appointment.id, status, why));
      setCanceling(false); setReason('');
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(null); }
  };

  const { patient } = appointment;
  const actions = NEXT_STATUS[appointment.status];
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Title>{patient.name}</Title>
        <Row>
          <Body>{formatDay(dayOf(appointment.startsAt))} · {timeOf(appointment.startsAt)} às {timeOf(appointment.endsAt)}</Body>
        </Row>
        <StatusBadge map={APPOINTMENT_STATUS} value={appointment.status} />
      </View>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {appointment.notes ? <Card><Label>Observações</Label><Body style={{ marginTop: 4 }}>{appointment.notes}</Body></Card> : null}
      {appointment.canceledReason ? <Alert tone="warning">Motivo do cancelamento: {appointment.canceledReason}</Alert> : null}

      <Button title="Ficha do paciente" variant="secondary" icon={UserRound} onPress={() => onOpenPatient(patient)} />
      <Button title="Novo orçamento" variant="secondary" icon={ClipboardList} onPress={() => onNewBudget(patient)} />

      {actions.length > 0 ? <Label style={{ marginTop: 6 }}>Atendimento</Label> : <Muted>Este atendimento já foi finalizado.</Muted>}
      {actions.map(([status, title, variant]) => (
        <Button key={status} title={title} variant={variant} loading={busy === status} disabled={busy !== null} onPress={() => (status === 'canceled' ? setCanceling(true) : status === 'attended' ? setFinishing(true) : change(status))} />
      ))}

      {finishing ? <EvolutionSheet appointment={appointment} onClose={() => setFinishing(false)} onSaved={(updated) => { setFinishing(false); onChanged(updated); }} /> : null}

      <Sheet open={canceling} onClose={() => setCanceling(false)} title="Cancelar atendimento"
        footer={<><Button title="Voltar" variant="secondary" onPress={() => setCanceling(false)} /><Button title="Cancelar atendimento" variant="danger" loading={busy === 'canceled'} onPress={() => change('canceled', reason.trim() || undefined)} /></>}>
        <Body>{patient.name}, {timeOf(appointment.startsAt)}</Body>
        <Input label="Motivo (opcional)" autoCapitalize="sentences" value={reason} onChangeText={setReason} />
      </Sheet>
    </View>
  );
}
