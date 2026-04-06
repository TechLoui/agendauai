import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  getDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAY_LABELS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export function formatDate(dateStr, pattern = 'dd/MM/yyyy') {
  return format(parseISO(dateStr), pattern, { locale: ptBR })
}

export function formatDateLong(dateStr) {
  return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateLabel(dateStr) {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  return format(date, "EEE, dd/MM", { locale: ptBR })
}

export function toDateString(date) {
  return format(date, 'yyyy-MM-dd')
}

export function todayString() {
  return toDateString(new Date())
}

export function weekRange() {
  const now = new Date()
  return {
    start: toDateString(startOfWeek(now, { locale: ptBR })),
    end: toDateString(endOfWeek(now, { locale: ptBR })),
  }
}

export function monthRange() {
  const now = new Date()
  return {
    start: toDateString(startOfMonth(now)),
    end: toDateString(endOfMonth(now)),
  }
}

export function getDayName(dateStr) {
  const date = parseISO(dateStr)
  return DAY_NAMES[getDay(date)]
}

export function addDaysToDate(dateStr, days) {
  return toDateString(addDays(parseISO(dateStr), days))
}

export { isBefore, isAfter, isSameDay, parseISO, isToday }
