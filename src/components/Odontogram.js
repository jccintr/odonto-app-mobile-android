import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { CONDITION } from '../lib/labels';
import { LOWER_DECIDUOUS, LOWER_PERMANENT, UPPER_DECIDUOUS, UPPER_PERMANENT } from '../lib/tooth';

const SIZE = 38; // lado do dente no desenho (dp)
const WHOLE_TOOTH = new Set(['crown', 'implant', 'missing', 'extracted', 'root_canal', 'prosthesis', 'other', 'fracture']); // condições do dente inteiro

/** Geometria das 5 faces: V em cima, L embaixo, O no centro; M/D à esquerda/direita conforme o lado do arco. */
export function faceShapes(tooth) {
  const rightSide = [1, 4, 5, 8].includes(Math.floor(tooth / 10)); // lado direito do paciente aparece à esquerda da tela: mesial voltada para o centro
  const s = SIZE; const a = s * 0.28; const b = s * 0.72;
  return {
    V: `M0 0H${s}L${b} ${a}H${a}Z`,
    L: `M0 ${s}H${s}L${b} ${b}H${a}Z`,
    left: `M0 0L${a} ${a}V${b}L0 ${s}Z`,
    right: `M${s} 0L${b} ${a}V${b}L${s} ${s}Z`,
    O: `M${a} ${a}H${b}V${b}H${a}Z`,
    mesial: rightSide ? 'right' : 'left',
  };
}

/** Descrição falada do dente e das marcações (também serve de rótulo de acessibilidade). */
export const toothDescription = (tooth, records = [], planned = []) => {
  const done = records.map((r) => `${CONDITION[r.condition]?.label ?? r.condition}${r.faces ? ` (${r.faces})` : ''}`).join(', ');
  const toDo = planned.map((p) => `${p.procedure.name}${p.faces ? ` (${p.faces})` : ''} — ${p.approved ? 'aprovado' : 'proposto'}`).join(', ');
  return `Dente ${tooth}${done ? `: ${done}` : ''}${toDo ? `. Planejado: ${toDo}` : ''}`;
};

function Tooth({ tooth, records = [], planned = [], selected, onSelect }) {
  const { c } = useTheme();
  const shapes = faceShapes(tooth);
  const fill = {};
  let whole = null;
  for (const r of records) {
    const color = CONDITION[r.condition]?.color ?? '#64748b';
    if (r.faces) for (const f of r.faces) fill[f] = color;
    else if (WHOLE_TOOTH.has(r.condition) || r.condition === 'sealant') whole = r.condition;
  }
  const entries = [['V', shapes.V], ['L', shapes.L], [shapes.mesial === 'left' ? 'M' : 'D', shapes.left], [shapes.mesial === 'right' ? 'M' : 'D', shapes.right], ['O', shapes.O]];
  const wholeColor = whole ? CONDITION[whole].color : null;
  const approvedPlan = planned.some((p) => p.approved);
  const crossed = whole === 'missing' || whole === 'extracted';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={toothDescription(tooth, records, planned)} accessibilityState={{ selected: !!selected }} onPress={() => onSelect?.(tooth)} style={{ alignItems: 'center', margin: 1 }}>
      <Svg width={SIZE + 4} height={SIZE + 4} viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}>
        {entries.map(([face, d]) => <Path key={face} d={d} fill={fill[face] ?? c.surface} stroke={c.muted} strokeWidth={1} />)}
        {crossed ? <Path d={`M2 2L${SIZE - 2} ${SIZE - 2}M${SIZE - 2} 2L2 ${SIZE - 2}`} stroke={wholeColor} strokeWidth={3} strokeLinecap="round" />
          : whole ? <Rect x={1} y={1} width={SIZE - 2} height={SIZE - 2} rx={6} fill="none" stroke={wholeColor} strokeWidth={3} /> : null}
        {planned.length > 0 ? <Rect x={-1} y={-1} width={SIZE + 2} height={SIZE + 2} rx={5} fill="none" stroke={approvedPlan ? c.primary : c.muted} strokeWidth={2} strokeDasharray={approvedPlan ? '5 3' : '2 3'} /> : null}
        {selected ? <Rect x={-1} y={-1} width={SIZE + 2} height={SIZE + 2} rx={4} fill="none" stroke={c.primary} strokeWidth={3} /> : null}
      </Svg>
      <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>{tooth}</Text>
    </Pressable>
  );
}

// `selected` pode ser um dente ou uma lista de dentes (seleção múltipla)
const isSelected = (selected, tooth) => (Array.isArray(selected) ? selected.includes(tooth) : selected === tooth);

function Row({ list, records, planned, selected, onSelect }) {
  const { c } = useTheme();
  const half = list.length / 2;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      {list.map((n, i) => (
        <View key={n} style={i === half ? { marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: c.border } : null}>
          <Tooth tooth={n} records={records[n]} planned={planned[n]} selected={isSelected(selected, n)} onSelect={onSelect} />
        </View>
      ))}
      {[['Planejado (aprovado)', 'dashed', c.primary], ['Planejado (proposto)', 'dotted', c.muted]].map(([label, style, color]) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 11, height: 11, borderRadius: 3, borderWidth: 2, borderStyle: style, borderColor: color }} />
          <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function Arch({ upper, lower, records, planned, selected, onSelect }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 10, paddingVertical: 6 }}>
      <Row list={upper} records={records} planned={planned} selected={selected} onSelect={onSelect} />
      <View style={{ height: 1, backgroundColor: c.border }} />
      <Row list={lower} records={records} planned={planned} selected={selected} onSelect={onSelect} />
    </View>
  );
}

/** Odontograma completo. `teeth`: { "16": [marcações] } (resposta da API). No celular rola na horizontal. */
export default function Odontogram({ teeth = {}, planned = {}, selected, onSelect, deciduous = false }) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8 }}>
      <View>
        <Arch upper={UPPER_PERMANENT} lower={LOWER_PERMANENT} records={teeth} planned={planned} selected={selected} onSelect={onSelect} />
        {deciduous ? (
          <>
            <Text style={{ color: c.muted, textAlign: 'center', fontSize: 11, fontWeight: '700', marginTop: 6 }}>DENTES DE LEITE</Text>
            <Arch upper={UPPER_DECIDUOUS} lower={LOWER_DECIDUOUS} records={teeth} planned={planned} selected={selected} onSelect={onSelect} />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

export function OdontogramLegend() {
  const { c } = useTheme();
  return (
    <View accessibilityLabel="Legenda" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {Object.entries(CONDITION).map(([key, cond]) => (
        <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: cond.color }} />
          <Text style={{ color: c.muted, fontSize: 12 }}>{cond.label}</Text>
        </View>
      ))}
    </View>
  );
}
