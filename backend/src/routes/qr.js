const { getStatus, getQrDataUrl } = require('../whatsapp')

module.exports = (req, res) => {
  const status = getStatus()
  const qr = getQrDataUrl()

  if (status === 'connected') return res.json({ connected: true, status })
  if (qr) return res.json({ connected: false, status, qr })
  res.json({ connected: false, status })
}
