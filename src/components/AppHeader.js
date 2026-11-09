import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

/** Barra de título das telas internas: seta de voltar e título na mesma linha, centralizados na vertical. */
export default function AppHeader({ navigation, options, back }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: c.surface, paddingTop: insets.top, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={navigation.goBack} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft color={c.text} size={24} />
          </Pressable>
        ) : null}
        <Text numberOfLines={1} accessibilityRole="header" style={{ flex: 1, color: c.text, fontSize: 18, fontWeight: '700', marginLeft: back ? 0 : 12, includeFontPadding: false, textAlignVertical: 'center' }}>{options.title}</Text>
      </View>
    </View>
  );
}
