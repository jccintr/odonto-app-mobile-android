import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { toneColors } from '../lib/theme';

export const SIZES = { radius: 12, gap: 12 };

/** Tela com o fundo do tema e as áreas seguras (barra de status e de navegação). */
export function Screen({ children, edges = ['top'], style }) {
  const { c } = useTheme();
  return <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: c.bg }, style]}>{children}</SafeAreaView>;
}

export function Card({ children, style, onPress, testID }) {
  const { c } = useTheme();
  const base = [styles.card, { backgroundColor: c.surface, borderColor: c.border }, style];
  if (onPress) return <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>{children}</Pressable>;
  return <View testID={testID} style={base}>{children}</View>;
}

export function Title({ children, style }) {
  const { c } = useTheme();
  return <Text accessibilityRole="header" style={[{ color: c.text, fontSize: 22, fontWeight: '700' }, style]}>{children}</Text>;
}
export function Body({ children, style, numberOfLines }) {
  const { c } = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ color: c.text, fontSize: 15 }, style]}>{children}</Text>;
}
export function Muted({ children, style, numberOfLines }) {
  const { c } = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ color: c.muted, fontSize: 13 }, style]}>{children}</Text>;
}
export function Label({ children, style }) {
  const { c } = useTheme();
  return <Text style={[{ color: c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }, style]}>{children}</Text>;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon: Icon, style, testID }) {
  const { c } = useTheme();
  const palette = {
    primary: { bg: c.primary, fg: c.primaryFg, border: c.primary },
    secondary: { bg: c.surface, fg: c.text, border: c.border },
    danger: { bg: c.danger, fg: '#ffffff', border: c.danger },
    ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
  }[variant];
  const off = loading || disabled;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled: !!off, busy: !!loading }} disabled={off} onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={palette.fg} /> : Icon ? <Icon size={18} color={palette.fg} /> : null}
      <Text style={{ color: palette.fg, fontSize: 15, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, error, hint, children }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text> : null}
      {children}
      {error ? <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 13 }}>{error}</Text> : hint ? <Text style={{ color: c.muted, fontSize: 13 }}>{hint}</Text> : null}
    </View>
  );
}

/** Campo de texto. `secure` mostra o botão de olho para ver a senha digitada. */
export function Input({ label, error, hint, secure, style, ...rest }) {
  const { c } = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      <View>
        <TextInput accessibilityLabel={label} placeholderTextColor={c.muted} secureTextEntry={secure && !visible} autoCapitalize="none"
          style={[styles.input, { backgroundColor: c.surface, borderColor: error ? c.danger : c.border, color: c.text, paddingRight: secure ? 48 : 12 }, style]} {...rest} />
        {secure && (
          <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVisible((v) => !v)} hitSlop={8}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 46, alignItems: 'center', justifyContent: 'center' }}>
            {visible ? <EyeOff size={20} color={c.muted} /> : <Eye size={20} color={c.muted} />}
          </Pressable>
        )}
      </View>
    </Field>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const { c } = useTheme();
  const { bg, fg } = toneColors(c, tone);
  return <View style={{ alignSelf: 'flex-start', backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{children}</Text></View>;
}
export const StatusBadge = ({ map, value }) => <Badge tone={(map[value] ?? {}).tone}>{(map[value] ?? { label: value }).label}</Badge>;

export function Alert({ tone = 'info', children, style }) {
  const { c } = useTheme();
  const { bg, fg } = toneColors(c, tone);
  return <View accessibilityRole={tone === 'danger' ? 'alert' : undefined} style={[{ backgroundColor: bg, borderRadius: 10, padding: 12 }, style]}><Text style={{ color: fg, fontSize: 14 }}>{children}</Text></View>;
}

export function Loading({ label = 'Carregando…' }) {
  const { c } = useTheme();
  return <View style={styles.center}><ActivityIndicator color={c.primary} size="large" /><Text style={{ color: c.muted, marginTop: 8 }}>{label}</Text></View>;
}

export function ErrorState({ error, onRetry }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="alert" style={[styles.center, { gap: 10 }]}>
      <AlertTriangle size={28} color={c.danger} />
      <Text style={{ color: c.danger, textAlign: 'center' }}>{error?.message ?? 'Não foi possível carregar.'}</Text>
      {onRetry ? <Button title="Tentar de novo" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, children, icon: Icon }) {
  const { c } = useTheme();
  return (
    <View style={[styles.center, { gap: 6 }]}>
      {Icon ? <Icon size={32} color={c.muted} /> : null}
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>{title}</Text>
      {children ? <Text style={{ color: c.muted, textAlign: 'center' }}>{children}</Text> : null}
    </View>
  );
}

/** Abas simples (segmentadas) */
export function Segmented({ options, value, onChange }) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ flexGrow: 0 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable key={o.id} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(o.id)}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? c.primary : c.surface2 }}>
            <Text style={{ color: active ? c.primaryFg : c.text, fontWeight: '600' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Opção marcável (condição do odontograma, forma, etc.) */
export function Chip({ label, selected, onPress, color }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primarySoft : c.surface }}>
      {color ? <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} /> : null}
      <Text style={{ color: selected ? c.primary : c.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Folha que sobe da base da tela (formulários e detalhes). */
export function Sheet({ open, onClose, title, children, footer }) {
  const { c } = useTheme();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable accessibilityLabel="Fechar" style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%', width: '100%', maxWidth: 640, alignSelf: 'center' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: c.border }}><Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{title}</Text></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>{children}</ScrollView>
          {footer ? <View style={{ padding: 16, flexDirection: 'row', gap: 10, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: c.border }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Row({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: SIZES.radius, padding: 14 },
  button: { minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
