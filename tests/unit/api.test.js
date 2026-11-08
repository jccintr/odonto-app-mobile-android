import * as SecureStore from 'expo-secure-store';
import {
  ApiError, errorMessage, getAccessToken, getRefreshToken, loadSession, request, setSession, setSuspendedHandler, setUnauthorizedHandler,
} from '../../src/api/client';

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
let fetchMock;

beforeEach(async () => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  SecureStore.__store.clear();
  await setSession(null);
  setUnauthorizedHandler(null);
  setSuspendedHandler(null);
});

describe('sessão guardada', () => {
  it('guarda no cofre, lê de volta e limpa', async () => {
    expect(await loadSession()).toBe(false);
    await setSession({ accessToken: 'a', refreshToken: 'r' });
    expect(SecureStore.__store.get('odonto.access')).toBe('a');
    expect(getAccessToken()).toBe('a');
    expect(getRefreshToken()).toBe('r');

    await setSession(null);
    expect(getAccessToken()).toBeNull();
    expect(SecureStore.__store.size).toBe(0);

    SecureStore.__store.set('odonto.refresh', 'so-refresh');
    expect(await loadSession()).toBe(true);
    expect(getRefreshToken()).toBe('so-refresh');
  });

  it('cofre com defeito não derruba o app', async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('cofre')).mockRejectedValueOnce(new Error('cofre'));
    expect(await loadSession()).toBe(false);
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('cofre'));
    await expect(setSession({ accessToken: 'a', refreshToken: 'r' })).resolves.toBeUndefined();
    SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('cofre'));
    await expect(setSession(null)).resolves.toBeUndefined();
  });
});

describe('request', () => {
  it('envia o token e o corpo, monta a query sem vazios e codifica os valores', async () => {
    await setSession({ accessToken: 'tok', refreshToken: 'ref' });
    fetchMock.mockResolvedValue(json(200, { ok: true }));
    expect(await request('/api/x', { method: 'POST', body: { a: 1 }, query: { q: 'ana lima', vazio: '', nulo: null, n: 0 } })).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://10.0.2.2:3000/api/x?q=ana%20lima&n=0');
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}', headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' } });
  });

  it('sem token nem corpo; sem autenticação (login) nunca manda o token; 204 vem sem corpo', async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await request('/api/y');
    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
    await setSession({ accessToken: 'tok', refreshToken: 'ref' });
    await request('/api/auth/login', { auth: false, method: 'POST', body: {} });
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
    fetchMock.mockResolvedValue({ ok: true, status: 204 });
    expect(await request('/api/z')).toBeNull();
  });

  it('erro da API vira ApiError com código e detalhes; sem mensagem usa a padrão; sem rede é status 0', async () => {
    fetchMock.mockResolvedValue(json(409, { error: 'Já existe.', code: 'X', details: [{ field: 'a', message: 'ruim' }], retryAfterSeconds: 5 }));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 409, message: 'Já existe.', code: 'X', retryAfterSeconds: 5 });
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('html'); } });
    await expect(request('/api/x')).rejects.toThrow('Não foi possível concluir a operação.');
    fetchMock.mockRejectedValue(new TypeError('falhou'));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 0 });
  });

  it('402 de assinatura avisa quem ouve; outro 402, sem corpo, ou sem ouvinte não', async () => {
    const handler = jest.fn();
    setSuspendedHandler(handler);
    fetchMock.mockResolvedValue(json(402, { error: 'Suspensa.', code: 'SUBSCRIPTION_SUSPENDED' }));
    await expect(request('/api/x', { auth: false })).rejects.toMatchObject({ status: 402 });
    expect(handler).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue(json(402, { error: 'Outro.' }));
    await expect(request('/api/x', { auth: false })).rejects.toMatchObject({ status: 402 });
    fetchMock.mockResolvedValue(json(402, null));
    await expect(request('/api/x', { auth: false })).rejects.toMatchObject({ status: 402 });
    expect(handler).toHaveBeenCalledTimes(1);
    setSuspendedHandler(null);
    fetchMock.mockResolvedValue(json(402, { error: 'Suspensa.', code: 'SUBSCRIPTION_SUSPENDED' }));
    await expect(request('/api/x', { auth: false })).rejects.toMatchObject({ code: 'SUBSCRIPTION_SUSPENDED' });
  });
});

describe('renovação da sessão', () => {
  it('401 renova com o refresh token e repete a chamada com o token novo', async () => {
    await setSession({ accessToken: 'velho', refreshToken: 'ref1' });
    fetchMock
      .mockResolvedValueOnce(json(401, { error: 'expirou' }))
      .mockResolvedValueOnce(json(200, { accessToken: 'novo', refreshToken: 'ref2' }))
      .mockResolvedValueOnce(json(200, { ok: 1 }));
    expect(await request('/api/x')).toEqual({ ok: 1 });
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/refresh');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refreshToken: 'ref1' });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer novo');
    expect(getRefreshToken()).toBe('ref2');
  });

  it('várias chamadas com 401 ao mesmo tempo compartilham UMA renovação', async () => {
    await setSession({ accessToken: 'velho', refreshToken: 'ref1' });
    fetchMock.mockImplementation(async (url, init) => {
      if (url.includes('/auth/refresh')) return json(200, { accessToken: 'novo', refreshToken: 'ref2' });
      return init.headers.Authorization === 'Bearer novo' ? json(200, { ok: true }) : json(401, { error: 'x' });
    });
    await Promise.all([request('/api/a'), request('/api/b'), request('/api/c')]);
    expect(fetchMock.mock.calls.filter(([url]) => url.includes('/auth/refresh'))).toHaveLength(1);
  });

  it('refresh recusado (401): encerra a sessão e avisa; sem refresh token também', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    await setSession({ accessToken: 'velho', refreshToken: 'ref1' });
    fetchMock.mockResolvedValue(json(401, { error: 'x' }));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();

    await setSession({ accessToken: 'so-acesso' });
    await expect(request('/api/x')).rejects.toMatchObject({ status: 401, message: 'Sessão expirada.' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('falha de rede na renovação não derruba a sessão; sem ouvinte o 401 sai normalmente', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    await setSession({ accessToken: 'velho', refreshToken: 'ref1' });
    fetchMock.mockResolvedValueOnce(json(401, {})).mockRejectedValueOnce(new TypeError('sem rede'));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 0 });
    expect(handler).not.toHaveBeenCalled();
    expect(getRefreshToken()).toBe('ref1');

    setUnauthorizedHandler(null);
    fetchMock.mockResolvedValue(json(401, {}));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 401 });
  });

  it('erros que não são 401 passam direto; erros que não são da API também', async () => {
    await setSession({ accessToken: 'tok', refreshToken: 'r' });
    fetchMock.mockResolvedValue(json(500, { error: 'boom' }));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('mensagens de erro', () => {
  it('validação vira uma frase; erro comum usa a mensagem; vazio usa a padrão', () => {
    expect(errorMessage(new ApiError(400, 'x', { details: [{ message: 'a' }, { message: 'b' }] }))).toBe('a · b');
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage(null)).toBe('Algo deu errado.');
  });
});
