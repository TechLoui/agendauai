const { enqueueAppointment } = require('../queue')

module.exports = async (req, res) => {
  if (req.headers['x-api-key'] !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { establishmentUid, appointmentId, appointmentData } = req.body
  if (!establishmentUid || !appointmentId || !appointmentData) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
  }

  try {
    await enqueueAppointment(establishmentUid, appointmentId, appointmentData)
    res.json({ success: true })
  } catch (err) {
    console.error('[Enqueue] Erro:', err)
    res.status(500).json({ error: err.message })
  }
}
