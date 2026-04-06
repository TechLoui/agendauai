const admin = require('firebase-admin')

let db = null

async function initFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var não definida')

  const serviceAccount = JSON.parse(raw)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  db = admin.firestore()
  console.log('[Firestore] Conectado ao projeto:', serviceAccount.project_id)
}

module.exports = {
  initFirestore,
  get db() {
    if (!db) throw new Error('Firestore não inicializado')
    return db
  },
  get admin() {
    return admin
  },
}
