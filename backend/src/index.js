require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initFirestore } = require('./firestore')
const { initWhatsApp } = require('./whatsapp')
const { startQueueProcessor } = require('./queue')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}))
app.use(express.json())

// Routes
app.get('/api/status',  require('./routes/status'))
app.get('/api/qr',      require('./routes/qr'))
app.post('/api/enqueue', require('./routes/enqueue'))

app.get('/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001

async function main() {
  console.log('[Boot] Iniciando serviço WhatsApp...')

  await initFirestore()
  await initWhatsApp()
  startQueueProcessor()

  app.listen(PORT, () => {
    console.log(`[Boot] Serviço rodando na porta ${PORT}`)
  })
}

main().catch(err => {
  console.error('[Boot] Erro fatal:', err)
  process.exit(1)
})
