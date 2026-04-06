import { formatDateLong } from './dateHelpers'

export function generateWhatsAppLink({ whatsapp, businessName, customerName, services, date, startTime, totalPrice }) {
  const phone = whatsapp.replace(/\D/g, '')
  const dateFormatted = formatDateLong(date)
  const serviceNames = Array.isArray(services) ? services.map(s => s.name).join(' + ') : services
  const priceFormatted = (totalPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const message = `Olá, ${businessName}! Gostaria de confirmar meu agendamento:\n\n` +
    `📋 Serviço: ${serviceNames}\n` +
    `📅 Data: ${dateFormatted}\n` +
    `🕐 Horário: ${startTime}\n` +
    `💰 Valor: ${priceFormatted}\n\n` +
    `Nome: ${customerName}`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function formatPrice(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
