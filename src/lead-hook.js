// Punto de integración con el software de gestión.
//
// Hoy la web no tiene servidor: los contactos NO quedan guardados, solo
// viajan por WhatsApp. Cuando el software tenga un endpoint, se completa
// LEAD_ENDPOINT y cada armado terminado se va a mandar acá antes de abrir
// WhatsApp. Si el envío falla, WhatsApp se abre igual.

export const LEAD_ENDPOINT = '';

export async function enviarContacto(lead, { fetchImpl = globalThis.fetch } = {}) {
  if (!LEAD_ENDPOINT || !fetchImpl) return { enviado: false, motivo: 'sin-endpoint' };
  try {
    const res = await fetchImpl(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      keepalive: true
    });
    return { enviado: res.ok };
  } catch {
    return { enviado: false, motivo: 'error-de-red' };
  }
}
