/**
 * Templates de mensagem WhatsApp para o disparador.
 */

function buildEstablishmentMessage(businessName, appt) {
  const date = formatDate(appt.date)
  const lines = [
    `🗓 *Nova solicitação de agendamento*`,
    ``,
    `👤 Cliente: ${appt.customerName}`,
    `📞 WhatsApp: ${formatDisplayPhone(appt.customerPhone)}`,
    `✂️ Serviço: ${appt.serviceName}`,
    `📅 Data: ${date}`,
    `⏰ Horário: ${appt.startTime} – ${appt.endTime}`,
  ]

  if (appt.employeeName) lines.push(`👨‍💼 Profissional: ${appt.employeeName}`)
  if (appt.servicePrice) lines.push(`💰 Valor: ${formatPrice(appt.servicePrice)}`)

  lines.push(``, `Responda *1* para ✅ CONFIRMAR ou *2* para ❌ RECUSAR.`)

  return lines.join('\n')
}

function buildClientConfirmMessage(businessName, appt) {
  const date = formatDate(appt.date)
  const lines = [
    `✅ *Agendamento confirmado!*`,
    ``,
    `Sua reserva na *${businessName}* foi confirmada.`,
    ``,
    `✂️ Serviço: ${appt.serviceName}`,
    `📅 Data: ${date}`,
    `⏰ Horário: ${appt.startTime}`,
  ]
  if (appt.employeeName) lines.push(`👨‍💼 Profissional: ${appt.employeeName}`)
  lines.push(``, `Até lá! 😊`)
  return lines.join('\n')
}

function buildClientRefusalMessage(businessName, appt) {
  const date = formatDate(appt.date)
  const lines = [
    `❌ *Agendamento não disponível*`,
    ``,
    `Infelizmente a *${businessName}* não pôde confirmar sua reserva.`,
    ``,
    `✂️ Serviço: ${appt.serviceName}`,
    `📅 Data: ${date}`,
    `⏰ Horário: ${appt.startTime}`,
    ``,
    `Por favor, tente outro horário ou entre em contato diretamente.`,
  ]
  return lines.join('\n')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '–'
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function formatDisplayPhone(phone) {
  if (!phone) return '–'
  const d = phone.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return phone
}

module.exports = { buildEstablishmentMessage, buildClientConfirmMessage, buildClientRefusalMessage }
