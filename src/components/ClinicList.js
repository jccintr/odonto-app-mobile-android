// Clínicas da pessoa para escolher (login de quem trabalha em mais de uma, troca de clínica na Conta).
import React from 'react';
import { View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ROLE_LABEL } from '../lib/labels';
import { Body, Card, Muted, Row } from './ui';

export default function ClinicList({ clinics, onChoose, currentId, disabled }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }} accessibilityLabel="Clínicas">
      {clinics.map((clinic) => (
        <Card key={clinic.id} onPress={disabled || clinic.id === currentId ? undefined : () => onChoose(clinic)} testID={`clinic-${clinic.id}`}>
          <Row style={{ alignItems: 'center' }}>
            <Building2 size={20} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Body>{clinic.name}</Body>
              <Muted>{ROLE_LABEL[clinic.role]}{clinic.id === currentId ? ' · clínica atual' : ''}</Muted>
            </View>
          </Row>
        </Card>
      ))}
    </View>
  );
}
