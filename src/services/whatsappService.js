const BASE = import.meta.env.VITE_WHATSAPP_SERVICE_URL
const SECRET = import.meta.env.VITE_API_SECRET

export async function getWhatsAppStatus() {
  if (!BASE) return null
  try {
    const res = await fetch(`${BASE}/api/status`)
    return res.json()
  } catch {
    return null
  }
}

export async function getQrCode() {
  if (!BASE) return null
  try {
    const res = await fetch(`${BASE}/api/qr`)
    return res.json()
  } catch {
    return null
  }
}

export async function enqueueForWhatsApp(establishmentUid, appointmentId, appointmentData) {
  if (!BASE) return
  try {
    await fetch(`${BASE}/api/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SECRET || '',
      },
      body: JSON.stringify({ establishmentUid, appointmentId, appointmentData }),
    })
  } catch (err) {
    console.warn('[WhatsApp] Falha ao enfileirar agendamento:', err.message)
  }
}
