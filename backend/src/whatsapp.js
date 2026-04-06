const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode')

let client = null
let qrDataUrl = null
let connectionStatus = 'disconnected' // 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
let onReplyCallback = null // set by queue.js

async function initWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      headless: true,
    },
  })

  client.on('qr', async (qr) => {
    connectionStatus = 'qr_ready'
    qrDataUrl = await qrcode.toDataURL(qr)
    await updateFirestoreStatus(false, null)
    console.log('[WhatsApp] QR code pronto — aguardando scan')
  })

  client.on('loading_screen', () => {
    connectionStatus = 'connecting'
    console.log('[WhatsApp] Carregando...')
  })

  client.on('authenticated', () => {
    connectionStatus = 'connecting'
    qrDataUrl = null
    console.log('[WhatsApp] Autenticado')
  })

  client.on('ready', async () => {
    connectionStatus = 'connected'
    qrDataUrl = null
    const phone = client.info?.wid?.user || null
    await updateFirestoreStatus(true, phone)
    console.log('[WhatsApp] Pronto. Número:', phone)
  })

  client.on('disconnected', async (reason) => {
    connectionStatus = 'disconnected'
    await updateFirestoreStatus(false, null)
    console.log('[WhatsApp] Desconectado:', reason)
    // Reinitialize after 10s
    setTimeout(() => {
      console.log('[WhatsApp] Reconectando...')
      client.initialize().catch(console.error)
    }, 10000)
  })

  client.on('message', async (msg) => {
    if (msg.type !== 'chat') return
    const body = msg.body.trim()
    if (body !== '1' && body !== '2') return
    const fromPhone = msg.from.replace('@c.us', '')
    if (onReplyCallback) await onReplyCallback(fromPhone, body)
  })

  await client.initialize()
}

function setReplyHandler(fn) {
  onReplyCallback = fn
}

async function sendMessage(phone, text) {
  if (!client || connectionStatus !== 'connected') {
    console.warn('[WhatsApp] Tentativa de envio sem conexão')
    return false
  }
  const formatted = formatWAPhone(phone)
  if (!formatted) {
    console.warn('[WhatsApp] Número inválido:', phone)
    return false
  }
  try {
    await client.sendMessage(formatted, text)
    console.log('[WhatsApp] Mensagem enviada para', formatted)
    return true
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar:', err.message)
    return false
  }
}

/** Normaliza qualquer número brasileiro para 5531999999999@c.us */
function formatWAPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const withCC = digits.startsWith('55') ? digits : `55${digits}`
  return `${withCC}@c.us`
}

/** Remove country code e @c.us para comparação */
function normalizePhone(phone) {
  return phone.replace(/\D/g, '').replace(/^55/, '')
}

async function updateFirestoreStatus(connected, phone) {
  try {
    const { db } = require('./firestore')
    await db.collection('whatsappStatus').doc('global').set({
      connected,
      phone: phone || null,
      updatedAt: new Date(),
    })
  } catch (err) {
    console.error('[WhatsApp] Erro ao atualizar status Firestore:', err.message)
  }
}

module.exports = {
  initWhatsApp,
  setReplyHandler,
  sendMessage,
  formatWAPhone,
  normalizePhone,
  getStatus: () => connectionStatus,
  getQrDataUrl: () => qrDataUrl,
}
