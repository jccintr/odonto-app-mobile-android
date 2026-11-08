import React, { useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import CalendarSheet from '../components/CalendarSheet';
import { Appointments } from '../api';
import AppointmentPanel from './AppointmentPanel';
import { MonthGrid, WeekGrid, WeekList } from './agenda/Views';
import { Body, Button, Card, EmptyState, ErrorState, Loading, Muted, Row, Screen, Segmented, Sheet, StatusBadge, Title } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useLayout, useResource } from '../hooks';
import { CURRENT_LABEL, VIEWS, countsByDay, groupByDay, includesToday, periodTitle, rangeFor, shiftPeriod, sortByStart, weekDays } from '../lib/agenda';
import { dayOf, timeOf, toIso } from '../lib/dates';
import { swipeDirection } from '../lib/gestures';
import { APPOINTMENT_STATUS } from '../lib/labels';

const PREVIOUS = { day: 'Dia anterior', week: 'Período anterior', month: 'Período anterior' };
const NEXT = { day: 'Próximo dia', week: 'Próximo período', month: 'Próximo período' };

function PeriodBar({ view, day, onShift, onToday, onPickDate }) {
  const { c } = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
      <Pressable accessibilityLabel={PREVIOUS[view]} onPress={() => onShift(-1)} hitSlop={10}><ChevronLeft size={26} color={c.text} /></Pressable>
      <View style={{ alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Escolher data" onPress={onPickDate} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', textTransform: 'capitalize' }}>{periodTitle(view, day)}</Text>
          <CalendarDays size={18} color={c.primary} />
        </Pressable>
        {includesToday(view, day) ? <Muted>{CURRENT_LABEL[view]}</Muted> : <Pressable accessibilityRole="button" onPress={onToday}><Text style={{ color: c.primary, fontWeight: '600' }}>Ir para hoje</Text></Pressable>}
      </View>
      <Pressable accessibilityLabel={NEXT[view]} onPress={() => onShift(1)} hitSlop={10}><ChevronRight size={26} color={c.text} /></Pressable>
    </Row>
  );
}

export default function AgendaScreen({ navigation }) {
  const { c } = useTheme();
  const { isTablet } = useLayout();
  const [view, setView] = useState('day');
  const [day, setDay] = useState(dayOf());
  const [selectedId, setSelectedId] = useState(null);
  const [picking, setPicking] = useState(false);
  const touch = useRef(null);
  const range = rangeFor(view, day);
  const res = useResource(() => Appointments.listAll({ from: toIso(range.from, '00:00'), to: toIso(range.to, '00:00') }), [range.from, range.to]);

  const list = sortByStart(res.data ?? []);
  const selected = list.find((a) => a.id === selectedId) ?? null;
  const today = dayOf();
  const openPatient = (patient) => { setSelectedId(null); navigation.navigate('Patient', { id: patient.id, name: patient.name }); };
  const newBudget = (patient) => { setSelectedId(null); navigation.navigate('NewBudget', { patient }); };

  const go = (next, nextView = view) => { setDay(next); setView(nextView); setSelectedId(null); };
  // arrastar na horizontal troca o período (esquerda = próximo, direita = anterior); rolar a lista na vertical não conta
  const swipe = {
    onTouchStart: (e) => { touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; },
    onTouchEnd: (e) => {
      const start = touch.current;
      touch.current = null;
      if (!start) return;
      const direction = swipeDirection(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y);
      if (direction) go(shiftPeriod(view, day, direction === 'next' ? 1 : -1));
    },
    onTouchCancel: () => { touch.current = null; },
  };
  // celular: o detalhe abre em tela cheia; tablet: ao lado da lista (dia) ou numa folha (semana)
  const open = (a) => (isTablet ? setSelectedId(a.id) : navigation.navigate('Appointment', { appointment: a }));

  const dayList = (
    <FlatList
      data={list}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={res.reload} tintColor={c.primary} />}
      ListEmptyComponent={<EmptyState icon={CalendarDays} title="Nenhum atendimento neste dia" />}
      renderItem={({ item: a }) => (
        <Card testID={`appointment-${a.id}`} onPress={() => open(a)} style={a.id === selectedId ? { borderColor: c.primary, borderWidth: 2 } : null}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Body style={{ fontWeight: '700' }}>{timeOf(a.startsAt)} – {timeOf(a.endsAt)}</Body>
              <Body numberOfLines={1}>{a.patient.name}</Body>
              {a.notes ? <Muted numberOfLines={1}>{a.notes}</Muted> : null}
            </View>
            <StatusBadge map={APPOINTMENT_STATUS} value={a.status} />
          </Row>
        </Card>
      )}
    />
  );

  let body;
  if (res.loading && !res.data) body = <Loading />;
  else if (res.error && !res.data) body = <ErrorState error={res.error} onRetry={res.reload} />;
  else if (view === 'week') {
    const groups = groupByDay(list);
    const days = weekDays(day);
    body = isTablet
      ? <WeekGrid days={days} groups={groups} list={list} today={today} onOpen={open} onPickDay={(d) => go(d, 'day')} onRefresh={res.reload} />
      : <WeekList days={days} groups={groups} today={today} onOpen={open} onPickDay={(d) => go(d, 'day')} onRefresh={res.reload} />;
  } else if (view === 'month') body = <MonthGrid day={day} counts={countsByDay(list)} today={today} onPickDay={(d) => go(d, 'day')} onRefresh={res.reload} />;
  else body = dayList;

  const splitDay = isTablet && view === 'day';
  const panel = selected ? <AppointmentPanel key={selected.id} appointment={selected} onChanged={() => res.reload()} onOpenPatient={openPatient} onNewBudget={newBudget} /> : null;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}><Title>Agenda</Title></View>
      <Segmented options={VIEWS} value={view} onChange={(v) => go(day, v)} />
      <PeriodBar view={view} day={day} onShift={(direction) => go(shiftPeriod(view, day, direction))} onToday={() => go(today)} onPickDate={() => setPicking(true)} />
      <CalendarSheet open={picking} value={day} onClose={() => setPicking(false)} onSelect={(d) => { go(d); setPicking(false); }} />
      {splitDay ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View testID="agenda-swipe" style={{ flex: 2 }} {...swipe}>{body}</View>
          <View style={{ flex: 3, borderLeftWidth: 1, borderLeftColor: c.border }}>
            {panel ? <ScrollView contentContainerStyle={{ padding: 20 }}>{panel}</ScrollView> : <EmptyState title="Escolha um atendimento">Toque em um horário da lista para ver os detalhes e atender.</EmptyState>}
          </View>
        </View>
      ) : <View testID="agenda-swipe" style={{ flex: 1 }} {...swipe}>{body}</View>}

      {isTablet && !splitDay ? (
        <Sheet open={selected !== null} onClose={() => setSelectedId(null)} title="Atendimento" footer={<Button title="Fechar" variant="secondary" onPress={() => setSelectedId(null)} />}>{panel}</Sheet>
      ) : null}
    </Screen>
  );
}

/** Tela cheia do atendimento (celular). */
export function AppointmentScreen({ route, navigation }) {
  const [appointment, setAppointment] = useState(route.params.appointment);
  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <AppointmentPanel appointment={appointment} onChanged={setAppointment}
          onOpenPatient={(p) => navigation.navigate('Patient', { id: p.id, name: p.name })} onNewBudget={(p) => navigation.navigate('NewBudget', { patient: p })} />
        <Button title="Voltar para a agenda" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} />
      </ScrollView>
    </Screen>
  );
}
