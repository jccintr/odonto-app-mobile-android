import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Body, Card, Muted, Row, StatusBadge } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { blockPosition, gridHours } from '../../lib/agenda';
import { formatDay, formatDayLong, monthGrid, monthOf, timeOf, weekdayShort } from '../../lib/dates';
import { APPOINTMENT_STATUS } from '../../lib/labels';
import { toneColors } from '../../lib/theme';

const HOUR_HEIGHT = 48;
const AXIS_WIDTH = 40;

const refresh = (c, onRefresh) => <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={c.primary} />;

/** Semana no celular: um bloco por dia, com os atendimentos em ordem de horário. */
export function WeekList({ days, groups, today, onOpen, onPickDay, onRefresh }) {
  const { c } = useTheme();
  return (
    <ScrollView refreshControl={refresh(c, onRefresh)} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {days.map((day) => {
        const list = groups[day] ?? [];
        return (
          <View key={day} testID={`week-day-${day}`} style={{ gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Abrir o dia ${formatDay(day)}`} onPress={() => onPickDay(day)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: day === today ? c.primary : c.text, fontWeight: '700', fontSize: 15, textTransform: 'capitalize' }}>{formatDayLong(day)}{day === today ? ' · hoje' : ''}</Text>
              <Muted>{list.length === 0 ? 'Sem atendimentos' : `${list.length} ${list.length === 1 ? 'atendimento' : 'atendimentos'}`}</Muted>
            </Pressable>
            {list.map((a) => (
              <Card key={a.id} testID={`appointment-${a.id}`} onPress={() => onOpen(a)}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body style={{ fontWeight: '700' }}>{timeOf(a.startsAt)} – {timeOf(a.endsAt)}</Body>
                    <Body numberOfLines={1}>{a.patient.name}</Body>
                  </View>
                  <StatusBadge map={APPOINTMENT_STATUS} value={a.status} />
                </Row>
              </Card>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Semana no tablet: sete colunas com os atendimentos como blocos na faixa de horário. */
export function WeekGrid({ days, groups, list, today, onOpen, onPickDay, onRefresh }) {
  const { c } = useTheme();
  const [first, last] = gridHours(list);
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', paddingLeft: AXIS_WIDTH, borderBottomWidth: 1, borderBottomColor: c.border }}>
        {days.map((day) => (
          <Pressable key={day} accessibilityRole="button" accessibilityLabel={`Abrir o dia ${formatDay(day)}`} onPress={() => onPickDay(day)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: day === today ? c.primarySoft : 'transparent' }}>
            <Text style={{ color: day === today ? c.primary : c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>{weekdayShort(day)}</Text>
            <Text style={{ color: day === today ? c.primary : c.text, fontSize: 16, fontWeight: '700' }}>{Number(day.slice(8))}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView refreshControl={refresh(c, onRefresh)}>
        <View style={{ flexDirection: 'row', height: hours.length * HOUR_HEIGHT }}>
          <View style={{ width: AXIS_WIDTH }}>
            {hours.map((h) => <Text key={h} style={{ height: HOUR_HEIGHT, color: c.muted, fontSize: 11, textAlign: 'right', paddingRight: 6 }}>{String(h).padStart(2, '0')}:00</Text>)}
          </View>
          {days.map((day) => (
            <View key={day} style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: c.border, backgroundColor: day === today ? c.primarySoft : 'transparent' }}>
              {hours.map((h) => <View key={h} style={{ position: 'absolute', top: (h - first) * HOUR_HEIGHT, left: 0, right: 0, borderTopWidth: 1, borderTopColor: c.border, opacity: 0.6 }} />)}
              {(groups[day] ?? []).map((a) => {
                const { top, height } = blockPosition(a, first, HOUR_HEIGHT);
                const tone = toneColors(c, (APPOINTMENT_STATUS[a.status] ?? {}).tone);
                return (
                  <Pressable key={a.id} testID={`appointment-${a.id}`} accessibilityRole="button" accessibilityLabel={`${timeOf(a.startsAt)} ${a.patient.name}`} onPress={() => onOpen(a)}
                    style={{ position: 'absolute', top, height, left: 2, right: 2, borderRadius: 6, padding: 3, backgroundColor: tone.bg, borderLeftWidth: 3, borderLeftColor: tone.fg, overflow: 'hidden', opacity: a.status === 'canceled' ? 0.55 : 1 }}>
                    <Text numberOfLines={1} style={{ color: tone.fg, fontSize: 11, fontWeight: '700' }}>{timeOf(a.startsAt)}</Text>
                    <Text numberOfLines={2} style={{ color: c.text, fontSize: 11 }}>{a.patient.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const WEEK_HEAD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Mês: grade com a quantidade de atendimentos de cada dia; tocar abre o dia. */
// 7 colunas de largura idêntica (o conteúdo da célula não a altera) e o mesmo espaçamento no cabeçalho e nas semanas
const COLUMN = { width: `${100 / 7}%`, paddingHorizontal: 3 };

export function MonthGrid({ day, counts, today, onPickDay, onRefresh }) {
  const { c } = useTheme();
  return (
    <ScrollView refreshControl={refresh(c, onRefresh)} contentContainerStyle={{ padding: 9, gap: 6 }}>
      <View style={{ flexDirection: 'row' }}>
        {WEEK_HEAD.map((d, i) => <Text key={i} style={{ ...COLUMN, textAlign: 'center', color: c.muted, fontWeight: '700' }}>{d}</Text>)}
      </View>
      {monthGrid(monthOf(day)).map((week, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {week.map((d, i) => {
            if (!d) return <View key={i} style={COLUMN} />;
            const n = counts[d] ?? 0;
            return (
              <View key={d} style={COLUMN}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Dia ${formatDay(d)}, ${n === 0 ? 'sem atendimentos' : `${n} ${n === 1 ? 'atendimento' : 'atendimentos'}`}`} onPress={() => onPickDay(d)}
                style={{ flex: 1, minHeight: 64, borderRadius: 10, padding: 6, alignItems: 'center', justifyContent: 'space-between', backgroundColor: n > 0 ? c.primarySoft : c.surface, borderWidth: d === today ? 2 : 1, borderColor: d === today ? c.primary : c.border }}>
                <Text style={{ color: c.text, fontWeight: d === today ? '800' : '600' }}>{Number(d.slice(8))}</Text>
                {n > 0 ? <View style={{ minWidth: 22, borderRadius: 11, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: c.primary }}><Text style={{ color: c.primaryFg, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>{n}</Text></View> : <View />}
              </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

