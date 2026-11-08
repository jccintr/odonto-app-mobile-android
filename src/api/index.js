// Uma função por rota usada pelo app (ver /docs na API).
import { request } from './client';

const get = (path, query) => request(path, { query });
const send = (method) => (path, body) => request(path, { method, body: body ?? {} });
const post = send('POST');
const patch = send('PATCH');
const del = (path) => request(path, { method: 'DELETE' });

export const Auth = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: (refreshToken) => request('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),
  me: () => get('/api/auth/me'),
  resendVerification: (email) => request('/api/auth/resend-verification', { method: 'POST', body: { email }, auth: false }),
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  changePassword: (currentPassword, newPassword) => post('/api/auth/change-password', { currentPassword, newPassword }),
};

export const Appointments = {
  list: (query) => get('/api/appointments', query),
  setStatus: (id, status, reason) => post(`/api/appointments/${id}/status`, reason ? { status, reason } : { status }),
  // marcar como atendido exige registrar o que foi feito (vai para o prontuário do paciente)
  finish: (id, evolution) => post(`/api/appointments/${id}/status`, { status: 'attended', evolution }),
};

export const Evolutions = {
  list: (patientId, query) => get(`/api/patients/${patientId}/evolutions`, query),
  addendum: (patientId, id, description) => post(`/api/patients/${patientId}/evolutions/${id}/addendum`, { description }),
};

/** Todos os atendimentos de um intervalo (a API entrega até 100 por página; limite de 10 páginas). */
Appointments.listAll = async (query) => {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const result = await Appointments.list({ ...query, perPage: 100, page });
    all.push(...result.data);
    if (page >= result.totalPages) break;
  }
  return all;
};

export const Patients = {
  list: (query) => get('/api/patients', query),
  get: (id) => get(`/api/patients/${id}`),
  odontogram: (id) => get(`/api/patients/${id}/odontogram`),
  treatmentItems: (id) => get(`/api/patients/${id}/treatment-items`),
  mark: (id, body) => post(`/api/patients/${id}/odontogram`, body),
  unmark: (id, recordId) => del(`/api/patients/${id}/odontogram/${recordId}`),
};

export const Procedures = { list: (query) => get('/api/procedures', query) };

export const Budgets = {
  list: (query) => get('/api/budgets', query),
  get: (id) => get(`/api/budgets/${id}`),
  create: (body) => post('/api/budgets', body),
  setStatus: (id, status) => post(`/api/budgets/${id}/status`, { status }),
  addItem: (id, body) => post(`/api/budgets/${id}/items`, body),
  removeItem: (id, itemId) => del(`/api/budgets/${id}/items/${itemId}`),
  cancelItem: (id, itemId) => post(`/api/budgets/${id}/items/${itemId}/cancel`),
};

export const Images = {
  list: (patientId, query) => get(`/api/patients/${patientId}/images`, query),
  get: (patientId, id) => get(`/api/patients/${patientId}/images/${id}`),
  sign: (patientId) => post(`/api/patients/${patientId}/images/upload-signature`),
  register: (patientId, body) => post(`/api/patients/${patientId}/images`, body),
  remove: (patientId, id) => del(`/api/patients/${patientId}/images/${id}`),
};

/** Carrega todos os procedimentos ativos (a API entrega até 100 por página). */
export async function loadActiveProcedures() {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const result = await Procedures.list({ active: true, perPage: 100, page });
    all.push(...result.data);
    if (page >= result.totalPages) break;
  }
  return all;
}
