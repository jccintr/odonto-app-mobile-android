import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Button, Sheet } from './ui';
import { useTheme } from '../context/ThemeContext';
import { dayOf, formatDay, formatMonth, monthGrid, monthOf, shiftMonth } from '../lib/dates';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Escolha de data em calendário mensal (sem componente nativo: funciona igual em qualquer aparelho). */
export default function CalendarSheet({ open, value, onClose, onSelect }) {
  const { c } = useTheme();
  const [month, setMonth] = useState(monthOf(value));
  useEffect(() => { if (open) setMonth(monthOf(value)); }, [open, value]);
  const today = dayOf();

  return (
    <Sheet open={open} onClose={onClose} title="Escolher a data"
      footer={<><Button title="Fechar" variant="secondary" onPress={onClose} /><Button title="Hoje" onPress={() => onSelect(today)} /></>}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityLabel="Mês anterior" onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={10}><ChevronLeft size={26} color={c.text} /></Pressable>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 17, fontWeight: '700', textTransform: 'capitalize' }}>{formatMonth(month)}</Text>
        <Pressable accessibilityLabel="Próximo mês" onPress={() => setMonth(shiftMonth(month, 1))} hitSlop={10}><ChevronRight size={26} color={c.text} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: c.muted, fontWeight: '700' }}>{d}</Text>)}
      </View>
      {monthGrid(month).map((week, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {week.map((day, i) => {
            if (!day) return <View key={i} style={{ flex: 1 }} />;
            const selected = day === value;
            return (
              <Pressable key={day} accessibilityRole="button" accessibilityLabel={`Dia ${formatDay(day)}`} accessibilityState={{ selected }} onPress={() => onSelect(day)}
                style={{ flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', margin: 2, borderRadius: 999, backgroundColor: selected ? c.primary : 'transparent', borderWidth: day === today && !selected ? 1 : 0, borderColor: c.primary }}>
                <Text style={{ color: selected ? c.primaryFg : c.text, fontWeight: selected || day === today ? '700' : '400' }}>{Number(day.slice(8))}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Sheet>
  );
}
