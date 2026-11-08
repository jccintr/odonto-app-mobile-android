import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { paletteFor } from '../lib/theme';

const KEY = 'odonto.theme';
const Ctx = createContext(null);
export const useTheme = () => useContext(Ctx);

/** Tema do app: segue o aparelho (padrão) ou fica fixo em claro/escuro, e a escolha é lembrada. */
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState('system');

  useEffect(() => {
    let alive = true;
    SecureStore.getItemAsync(KEY).then((saved) => { if (alive && ['light', 'dark', 'system'].includes(saved)) setPreferenceState(saved); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    SecureStore.setItemAsync(KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const c = paletteFor(preference, system);
    return { c, isDark: c.bg === '#0c1519', preference, setPreference };
  }, [preference, system, setPreference]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
