import { apiFetch } from './useApi';

/**
 * Upload an image via the one-time presign token flow:
 * 1. POST /api/upload/presign  → get a single-use upload URL
 * 2. PUT  /api/upload/:token   → stream the file to that URL
 * Returns the permanent /uploads/... path on success.
 */
export async function uploadImage(file) {
  // Step 1: get one-time token
  const presignRes = await apiFetch('/upload/presign', { method: 'POST' });
  const presignBody = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) throw new Error(presignBody.error || 'Presign fehlgeschlagen');

  const { uploadUrl } = presignBody;

  // Step 2: upload file using the one-time token (no JWT needed — token IS the auth)
  const fd = new FormData();
  fd.append('file', file);

  const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: fd });
  const uploadBody = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) throw new Error(uploadBody.error || 'Upload fehlgeschlagen');

  return uploadBody.url; // e.g. /uploads/abc123def456.jpg
}
