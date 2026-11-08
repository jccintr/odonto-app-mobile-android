import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, setSession, setSuspendedHandler, setUnauthorizedHandler, getRefreshToken } from '../api/client';
import { Auth } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

/** Sessão do dentista. O app é só para dentistas: administração e secretária usam o painel web. */
export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null); // { user, clinic }
  const [booting, setBooting] = useState(true);
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => setProfile(null));
    setSuspendedHandler(() => setSuspended(true));
    let alive = true;
    (async () => {
      try {
        if (await loadSession()) {
          const me = await Auth.me();
          if (alive) setProfile(me);
        }
      } catch (err) {
        if (err?.status === 402) setSuspended(true); // a sessão vale, a assinatura da clínica é que está suspensa
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; setUnauthorizedHandler(null); setSuspendedHandler(null); };
  }, []);

  const value = useMemo(() => ({
    user: profile?.user ?? null,
    clinic: profile?.clinic ?? null,
    isDentist: profile?.user?.role === 'dentist',
    booting,
    suspended,
    async login(email, password) {
      const session = await Auth.login(email, password);
      await setSession(session);
      setSuspended(false);
      setProfile({ user: session.user, clinic: session.clinic });
    },
    async logout() {
      const refresh = getRefreshToken();
      await setSession(null);
      setProfile(null);
      setSuspended(false);
      if (refresh) await Auth.logout(refresh).catch(() => {});
    },
    /** depois de trocar a senha a API devolve uma sessão nova */
    async adopt(session) {
      await setSession(session);
      setProfile({ user: session.user, clinic: session.clinic });
    },
  }), [profile, booting, suspended]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
