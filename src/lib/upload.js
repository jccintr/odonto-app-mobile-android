// Envio de imagens em dois passos: (1) a API assina e o arquivo vai DIRETO ao Cloudinary; (2) a API registra a imagem na ficha.
import { Images } from '../api';

export const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
export const extensionOf = (name) => String(name).split('.').pop().toLowerCase();

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };

/** Resultado do seletor de imagens do Expo → arquivo para envio (`{ uri, name, type, size }`). */
export function fileFromPicker(asset) {
  const name = asset.fileName || String(asset.uri).split('/').pop() || 'imagem.jpg';
  return { uri: asset.uri, name, type: asset.mimeType || MIME[extensionOf(name)] || 'image/jpeg', size: asset.fileSize ?? null };
}

/** Valida o arquivo antes de enviar. Devolve a mensagem de erro ou null. */
export function validateImageFile(file, maxBytes) {
  if (!file) return 'Escolha uma imagem.';
  if (!ACCEPTED_EXTENSIONS.includes(extensionOf(file.name))) return 'Formato não aceito. Envie JPG, PNG, WEBP ou HEIC (PDF não é aceito).';
  if (file.size === 0) return 'O arquivo está vazio.';
  if (maxBytes && file.size && file.size > maxBytes) return `A imagem passa de ${Math.round(maxBytes / 1024 / 1024)} MB. Reduza o tamanho e tente de novo.`;
  return null;
}

/** `fetchImpl` existe para os testes. */
export async function uploadPatientImage(patientId, file, meta, fetchImpl = fetch) {
  const signed = await Images.sign(patientId);
  const problem = validateImageFile(file, signed.maxBytes);
  if (problem) throw new Error(problem);

  const form = new FormData();
  for (const [key, value] of Object.entries(signed.fields)) form.append(key, value);
  form.append('file', { uri: file.uri, name: file.name, type: file.type });
  let res;
  try { res = await fetchImpl(signed.uploadUrl, { method: 'POST', body: form }); } catch { throw new Error('Não foi possível enviar o arquivo. Verifique a conexão e tente de novo.'); }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ? `O armazenamento recusou o arquivo: ${body.error.message}` : 'O armazenamento recusou o arquivo.');
  }
  return Images.register(patientId, { publicId: signed.publicId, ...meta });
}
