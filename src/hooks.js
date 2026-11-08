import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { isTabletWidth } from './lib/theme';

/** Carrega dados de uma função async. reload() atualiza sem piscar; mudar `deps` recarrega com "carregando". */
export function useResource(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);
  const runId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++runId.current;
    try {
      const result = await fnRef.current();
      if (alive.current && id === runId.current) { setData(result); setError(null); }
      return result;
    } catch (e) {
      if (alive.current && id === runId.current) setError(e);
      return null;
    } finally {
      if (alive.current && id === runId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    setLoading(true);
    reload();
    return () => { alive.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload };
}

/** Valor "atrasado": só muda depois que o usuário para de digitar. */
export function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Celular ou tablet (pela largura da janela: gira junto com o aparelho). */
export function useLayout() {
  const { width } = useWindowDimensions();
  return { width, isTablet: isTabletWidth(width) };
}
