import { getDayName, todayString } from './dateHelpers'

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Returns all time slots for a given date.
 * @param {Object} params
 * @param {string} params.date - ISO date "yyyy-MM-dd"
 * @param {Object} params.establishment - establishment data with workingHours, slotDuration, blockedDates, advanceDays
 * @param {Array}  params.appointments - appointments already booked for that date
 * @param {number} params.requestedDuration - total duration of selected services in minutes
 * @returns {Array<{time: string, available: boolean}>}
 */
export function getAvailableSlots({ date, establishment, appointments, requestedDuration }) {
  const { workingHours, slotDuration = 30, blockedDates = [], advanceDays = 30 } = establishment

  const today = todayString()

  // Date in the past
  if (date < today) return []

  // Too far in the future
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + advanceDays)
  const maxStr = maxDate.toISOString().slice(0, 10)
  if (date > maxStr) return []

  // Blocked date
  if (blockedDates.includes(date)) return []

  const dayName = getDayName(date)
  const dayConfig = workingHours?.[dayName]

  if (!dayConfig?.open) return []

  const workStart = parseTime(dayConfig.start)
  const workEnd = parseTime(dayConfig.end)
  const duration = requestedDuration || slotDuration

  // Generate all possible slot start times
  const slots = []
  let current = workStart
  while (current + duration <= workEnd) {
    slots.push(minutesToTime(current))
    current += slotDuration
  }

  // Now filter slots that conflict with existing appointments
  const bookedIntervals = (appointments || [])
    .filter(a => a.status !== 'cancelled')
    .map(a => ({
      start: parseTime(a.startTime),
      end: parseTime(a.endTime),
    }))

  // Buffer: for today, don't show past slots (+ 30min buffer)
  const nowBuffer = date === today
    ? (() => {
        const now = new Date()
        return now.getHours() * 60 + now.getMinutes() + 30
      })()
    : -1

  return slots.map(time => {
    const slotStart = parseTime(time)
    const slotEnd = slotStart + duration

    if (slotStart < nowBuffer) return { time, available: false }

    const hasConflict = bookedIntervals.some(
      ({ start, end }) => slotStart < end && start < slotEnd
    )

    return { time, available: !hasConflict }
  })
}

export function calculateEndTime(startTime, durationMinutes) {
  const start = parseTime(startTime)
  return minutesToTime(start + durationMinutes)
}
