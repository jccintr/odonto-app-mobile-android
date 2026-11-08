import * as client from '../../src/api/client';
import { Appointments, Auth, Budgets, Evolutions, Images, Patients, Procedures, loadActiveProcedures } from '../../src/api';
import { ACCEPTED_EXTENSIONS, extensionOf, fileFromPicker, uploadPatientImage, validateImageFile } from '../../src/lib/upload';

jest.mock('../../src/api/client', () => ({ request: jest.fn() }));
const request = client.request;
beforeEach(() => { request.mockReset().mockResolvedValue({ ok: true }); });

describe('rotas da API usadas pelo app', () => {
  it.each([
    ['Auth.login', () => Auth.login('a@b.c', 'x'), '/api/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' }, auth: false }],
    ['Auth.logout', () => Auth.logout('r'), '/api/auth/logout', { method: 'POST', body: { refreshToken: 'r' }, auth: false }],
    ['Auth.me', () => Auth.me(), '/api/auth/me', { query: undefined }],
    ['Auth.resendVerification', () => Auth.resendVerification('a@b.c'), '/api/auth/resend-verification', { method: 'POST', body: { email: 'a@b.c' }, auth: false }],
    ['Auth.forgotPassword', () => Auth.forgotPassword('a@b.c'), '/api/auth/forgot-password', { method: 'POST', body: { email: 'a@b.c' }, auth: false }],
    ['Auth.changePassword', () => Auth.changePassword('a', 'b'), '/api/auth/change-password', { method: 'POST', body: { currentPassword: 'a', newPassword: 'b' } }],
    ['Appointments.list', () => Appointments.list({ perPage: 5 }), '/api/appointments', { query: { perPage: 5 } }],
    ['Appointments.setStatus', () => Appointments.setStatus('1', 'attended'), '/api/appointments/1/status', { method: 'POST', body: { status: 'attended' } }],
    ['Appointments.setStatus com motivo', () => Appointments.setStatus('1', 'canceled', 'doente'), '/api/appointments/1/status', { method: 'POST', body: { status: 'canceled', reason: 'doente' } }],
    ['Appointments.finish', () => Appointments.finish('1', { description: 'Revisão' }), '/api/appointments/1/status', { method: 'POST', body: { status: 'attended', evolution: { description: 'Revisão' } } }],
    ['Evolutions.list', () => Evolutions.list('1', { perPage: 50 }), '/api/patients/1/evolutions', { query: { perPage: 50 } }],
    ['Evolutions.addendum', () => Evolutions.addendum('1', '2', 'Correção'), '/api/patients/1/evolutions/2/addendum', { method: 'POST', body: { description: 'Correção' } }],
    ['Patients.list', () => Patients.list({ q: 'a' }), '/api/patients', { query: { q: 'a' } }],
    ['Patients.get', () => Patients.get('1'), '/api/patients/1', { query: undefined }],
    ['Patients.odontogram', () => Patients.odontogram('1'), '/api/patients/1/odontogram', { query: undefined }],
    ['Patients.mark', () => Patients.mark('1', { tooth: 16 }), '/api/patients/1/odontogram', { method: 'POST', body: { tooth: 16 } }],
    ['Patients.unmark', () => Patients.unmark('1', '2'), '/api/patients/1/odontogram/2', { method: 'DELETE' }],
    ['Procedures.list', () => Procedures.list({ active: true }), '/api/procedures', { query: { active: true } }],
    ['Patients.treatmentItems', () => Patients.treatmentItems('1'), '/api/patients/1/treatment-items', { query: undefined }],
    ['Budgets.list', () => Budgets.list({ status: 'open' }), '/api/budgets', { query: { status: 'open' } }],
    ['Budgets.get', () => Budgets.get('1'), '/api/budgets/1', { query: undefined }],
    ['Budgets.create', () => Budgets.create({ patientId: 'p' }), '/api/budgets', { method: 'POST', body: { patientId: 'p' } }],
    ['Budgets.addItem', () => Budgets.addItem('1', { procedureId: 'x' }), '/api/budgets/1/items', { method: 'POST', body: { procedureId: 'x' } }],
    ['Budgets.removeItem', () => Budgets.removeItem('1', '2'), '/api/budgets/1/items/2', { method: 'DELETE' }],
    ['Budgets.cancelItem', () => Budgets.cancelItem('1', '2'), '/api/budgets/1/items/2/cancel', { method: 'POST', body: {} }],
    ['Images.list', () => Images.list('1', { perPage: 5 }), '/api/patients/1/images', { query: { perPage: 5 } }],
    ['Images.get', () => Images.get('1', '2'), '/api/patients/1/images/2', { query: undefined }],
    ['Images.sign', () => Images.sign('1'), '/api/patients/1/images/upload-signature', { method: 'POST', body: {} }],
    ['Images.register', () => Images.register('1', { publicId: 'z' }), '/api/patients/1/images', { method: 'POST', body: { publicId: 'z' } }],
    ['Images.remove', () => Images.remove('1', '2'), '/api/patients/1/images/2', { method: 'DELETE' }],
  ])('%s', async (_name, call, path, options) => {
    await call();
    expect(request).toHaveBeenCalledWith(path, options);
  });

  it('busca todos os atendimentos de um intervalo, página a página, e respeita o limite de páginas', async () => {
    request
      .mockResolvedValueOnce({ data: [{ id: 'a' }], totalPages: 2 })
      .mockResolvedValueOnce({ data: [{ id: 'b' }], totalPages: 2 });
    expect((await Appointments.listAll({ from: 'x', to: 'y' })).map((a) => a.id)).toEqual(['a', 'b']);
    expect(request).toHaveBeenNthCalledWith(1, '/api/appointments', { query: { from: 'x', to: 'y', perPage: 100, page: 1 } });
    expect(request).toHaveBeenNthCalledWith(2, '/api/appointments', { query: { from: 'x', to: 'y', perPage: 100, page: 2 } });

    request.mockReset().mockResolvedValue({ data: [{ id: 'z' }], totalPages: 99 });
    expect(await Appointments.listAll({})).toHaveLength(10);
  });

  it('carrega todos os procedimentos ativos, página a página', async () => {
    request
      .mockResolvedValueOnce({ data: [{ id: 'a' }], totalPages: 2 })
      .mockResolvedValueOnce({ data: [{ id: 'b' }], totalPages: 2 });
    expect((await loadActiveProcedures()).map((p) => p.id)).toEqual(['a', 'b']);
    expect(request).toHaveBeenLastCalledWith('/api/procedures', { query: { active: true, perPage: 100, page: 2 } });
  });

  it('para no limite de páginas mesmo que a API prometa mais', async () => {
    request.mockResolvedValue({ data: [{ id: 'x' }], totalPages: 99 });
    expect(await loadActiveProcedures()).toHaveLength(10);
  });
});

describe('envio de imagens', () => {
  const signed = { uploadUrl: 'https://api.cloudinary.com/v1_1/x/image/upload', fields: { api_key: 'k', signature: 's' }, publicId: 'pub1', maxBytes: 10 * 1024 * 1024 };
  const file = { uri: 'file:///tmp/radiografia.jpg', name: 'radiografia.jpg', type: 'image/jpeg', size: 1000 };

  it('converte o resultado do seletor em arquivo para envio', () => {
    expect(fileFromPicker({ uri: 'file:///a/b/foto.PNG', fileName: 'foto.PNG', mimeType: 'image/png', fileSize: 5 })).toEqual({ uri: 'file:///a/b/foto.PNG', name: 'foto.PNG', type: 'image/png', size: 5 });
    expect(fileFromPicker({ uri: 'file:///a/b/c.webp' })).toEqual({ uri: 'file:///a/b/c.webp', name: 'c.webp', type: 'image/webp', size: null });
    expect(fileFromPicker({ uri: '' })).toMatchObject({ name: 'imagem.jpg', type: 'image/jpeg' });
    expect(fileFromPicker({ uri: 'file:///a/arquivo.xyz' }).type).toBe('image/jpeg');
    expect(extensionOf('A.JPG')).toBe('jpg');
    expect(ACCEPTED_EXTENSIONS).toContain('heic');
  });

  it('valida formato, tamanho e arquivo vazio', () => {
    expect(validateImageFile(null)).toBe('Escolha uma imagem.');
    expect(validateImageFile({ name: 'laudo.pdf', size: 10 })).toMatch(/Formato não aceito/);
    expect(validateImageFile({ name: 'a.jpg', size: 0 })).toBe('O arquivo está vazio.');
    expect(validateImageFile({ name: 'a.jpg', size: 11 * 1024 * 1024 }, 10 * 1024 * 1024)).toMatch(/passa de 10 MB/);
    expect(validateImageFile({ name: 'a.jpg', size: 100 }, 10 * 1024 * 1024)).toBeNull();
    expect(validateImageFile({ name: 'a.jpg', size: null }, 10 * 1024 * 1024)).toBeNull(); // o seletor nem sempre informa o tamanho
    expect(validateImageFile({ name: 'a.jpg', size: 100 })).toBeNull();
  });

  it('assina, envia direto ao armazenamento e registra na ficha', async () => {
    request.mockResolvedValueOnce(signed).mockResolvedValueOnce({ id: 'img1' });
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true });
    expect(await uploadPatientImage('p1', file, { kind: 'xray' }, fetchImpl)).toEqual({ id: 'img1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(signed.uploadUrl);
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(request).toHaveBeenLastCalledWith('/api/patients/p1/images', { method: 'POST', body: { publicId: 'pub1', kind: 'xray' } });
  });

  it('usa o fetch global quando não recebe outro', async () => {
    request.mockResolvedValueOnce(signed).mockResolvedValueOnce({ id: 'img2' });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await uploadPatientImage('p1', file, {});
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('arquivo inválido: erro antes de enviar', async () => {
    request.mockResolvedValue(signed);
    const fetchImpl = jest.fn();
    await expect(uploadPatientImage('p1', { ...file, name: 'laudo.pdf' }, {}, fetchImpl)).rejects.toThrow(/Formato não aceito/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('armazenamento fora do ar ou recusando: mensagens claras', async () => {
    request.mockResolvedValue(signed);
    await expect(uploadPatientImage('p1', file, {}, jest.fn().mockRejectedValue(new Error('rede')))).rejects.toThrow(/Não foi possível enviar/);
    await expect(uploadPatientImage('p1', file, {}, jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'arquivo grande' } }) }))).rejects.toThrow('O armazenamento recusou o arquivo: arquivo grande');
    await expect(uploadPatientImage('p1', file, {}, jest.fn().mockResolvedValue({ ok: false, json: async () => { throw new Error('html'); } }))).rejects.toThrow('O armazenamento recusou o arquivo.');
  });
});
