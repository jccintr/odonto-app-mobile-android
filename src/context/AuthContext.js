import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, setSession, setSuspendedHandler, setUnauthorizedHandler, getRefreshToken } from '../api/client';
import { Auth } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

/**
 * Sessão do dentista. O app é de quem atende pacientes: o dentista e o administrador que também atende (clínica pequena).
 * A secretária e o administrador que não atende usam o painel web. Uma pessoa pode trabalhar em mais de uma clínica.
 */
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
    // quem atende nesta clínica: perfil dentista, ou administrador com o atendimento ligado
    isDentist: Boolean(profile?.user?.attendsPatients || profile?.user?.role === 'dentist'),
    /** perfil clínico desta pessoa nesta clínica: o app mostra a agenda e os orçamentos dele (o administrador veria os de todos) */
    dentistId: profile?.user?.dentistId ?? null,
    booting,
    suspended,
    /** Entra. Quem trabalha em mais de uma clínica recebe a lista para escolher: devolve { clinics } e não abre sessão. */
    async login(email, password, clinicId) {
      const result = await Auth.login(email, password, clinicId);
      if (result.clinicSelectionRequired) return { clinics: result.clinics };
      await setSession(result);
      setSuspended(false);
      setProfile({ user: result.user, clinic: result.clinic });
      return {};
    },
    /** Troca a sessão para outra clínica da mesma pessoa (sem pedir a senha). */
    async switchClinic(clinicId) {
      const session = await Auth.switchClinic(clinicId);
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
    updateUser: (user) => setProfile((p) => (p ? { ...p, user } : p)),
    /** depois de trocar a senha a API devolve uma sessão nova */
    async adopt(session) {
      await setSession(session);
      setProfile({ user: session.user, clinic: session.clinic });
    },
  }), [profile, booting, suspended]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
