const { getStatus } = require('../whatsapp')
const { db } = require('../firestore')

module.exports = async (req, res) => {
  try {
    const status = getStatus()
    const doc = await db.collection('whatsappStatus').doc('global').get()
    const firestoreData = doc.exists ? doc.data() : null
    res.json({ status, firestoreData })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
