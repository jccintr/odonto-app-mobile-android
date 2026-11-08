// Endereço da API: EXPO_PUBLIC_API_URL (arquivo .env). Sem barra no final.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000').replace(/\/+$/, '');
