// Cliente da API: renova a sessão sozinho (refresh token de uso único, uma renovação por vez) e avisa quando a sessão acaba ou a assinatura da clínica está suspensa.
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const ACCESS_KEY = 'odonto.access';
const REFRESH_KEY = 'odonto.refresh';

export class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = extra.code;
    this.details = extra.details;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

let access = null;
let refresh = null;

const safe = async (fn) => { try { return await fn(); } catch { return null; } };

/** Lê a sessão guardada no aparelho (cofre do Android). */
export async function loadSession() {
  access = await safe(() => SecureStore.getItemAsync(ACCESS_KEY));
  refresh = await safe(() => SecureStore.getItemAsync(REFRESH_KEY));
  return Boolean(access || refresh);
}

export async function setSession(session) {
  access = session?.accessToken ?? null;
  refresh = session?.refreshToken ?? null;
  await safe(() => (access ? SecureStore.setItemAsync(ACCESS_KEY, access) : SecureStore.deleteItemAsync(ACCESS_KEY)));
  await safe(() => (refresh ? SecureStore.setItemAsync(REFRESH_KEY, refresh) : SecureStore.deleteItemAsync(REFRESH_KEY)));
}

export const getAccessToken = () => access;
export const getRefreshToken = () => refresh;

let onUnauthorized;
let onSuspended;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export const setSuspendedHandler = (fn) => { onSuspended = fn; };

const queryString = (query) => {
  const entries = Object.entries(query ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}` : '';
};

async function send(path, { method = 'GET', body, query, token }) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_URL}${path}${queryString(query)}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique a internet e tente novamente.');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 402 && data?.code === 'SUBSCRIPTION_SUSPENDED') onSuspended?.();
    throw new ApiError(res.status, data?.error ?? 'Não foi possível concluir a operação.', data ?? {});
  }
  return data;
}

// várias chamadas que recebem 401 ao mesmo tempo compartilham UMA renovação (o refresh token é de uso único)
let refreshing = null;
function refreshSession() {
  refreshing ??= (async () => {
    if (!refresh) throw new ApiError(401, 'Sessão expirada.');
    const session = await send('/api/auth/refresh', { method: 'POST', body: { refreshToken: refresh } });
    await setSession(session);
    return session;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

/** Chamada à API. Com `auth` (padrão) envia o token e, se ele expirou (401), renova a sessão e repete a chamada uma vez. */
export async function request(path, { auth = true, ...options } = {}) {
  if (!auth) return send(path, options);
  try {
    return await send(path, { ...options, token: access });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    try {
      const session = await refreshSession();
      return await send(path, { ...options, token: session.accessToken });
    } catch (second) {
      if (second instanceof ApiError && second.status === 401) { await setSession(null); onUnauthorized?.(); }
      throw second;
    }
  }
}

/** mensagem amigável: erros de validação (400 com details) viram uma frase só */
export function errorMessage(err) {
  if (err?.details?.length) return err.details.map((d) => d.message).join(' · ');
  return err?.message ?? 'Algo deu errado.';
}
