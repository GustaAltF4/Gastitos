import { TattooAppointment } from '../types/finance'

// Formateador a dos dígitos
const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Genera el contenido de un archivo .ics (iCalendar RFC 5545) compatible con Apple Calendar (iOS / macOS), Google Calendar y Outlook.
 */
export function generateIcsCalendarEvent(appointment: TattooAppointment): string {
  const [year, month, day] = appointment.date.split('-').map(Number)
  const [hours, minutes] = appointment.time.split(':').map(Number)
  const startDate = new Date(year, month - 1, day, hours, minutes, 0)
  // Duración estimada de 2 horas para la sesión
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

  const toIcsFormat = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

  const dtStamp = toIcsFormat(new Date())
  const dtStart = toIcsFormat(startDate)
  const dtEnd = toIcsFormat(endDate)

  // Crear alarmas nativas de iOS según las opciones de alerta configuradas
  const alarms: string[] = []
  const options = appointment.reminderOptions || (appointment.reminderOption ? [appointment.reminderOption] : [])

  for (const opt of options) {
    if (opt === 'exact_time') {
      alarms.push([
        'BEGIN:VALARM',
        'TRIGGER:PT0M',
        'ACTION:DISPLAY',
        `DESCRIPTION:¡Hora del turno de tattoo con ${appointment.clientName}!`,
        'END:VALARM',
      ].join('\r\n'))
    } else if (opt === '10_min_before') {
      alarms.push([
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        `DESCRIPTION:En 10 minutos turno con ${appointment.clientName} (preparar mesa)`,
        'END:VALARM',
      ].join('\r\n'))
    } else if (opt === '2_hours_before') {
      alarms.push([
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        `DESCRIPTION:En 2 horas comienza el turno con ${appointment.clientName}`,
        'END:VALARM',
      ].join('\r\n'))
    } else if (opt === 'same_day_morning') {
      // 09:00 AM del mismo día (diferencia de horas entre 9:00 y la hora del turno)
      const diffHours = hours - 9
      if (diffHours > 0) {
        alarms.push([
          'BEGIN:VALARM',
          `TRIGGER:-PT${diffHours}H`,
          'ACTION:DISPLAY',
          `DESCRIPTION:Hoy tienes turno de tattoo con ${appointment.clientName} a las ${appointment.time} hs`,
          'END:VALARM',
        ].join('\r\n'))
      }
    } else if (opt === '1_day_before') {
      alarms.push([
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:Mañana tienes turno con ${appointment.clientName} a las ${appointment.time} hs`,
        'END:VALARM',
      ].join('\r\n'))
    } else if (opt === '2_days_before') {
      alarms.push([
        'BEGIN:VALARM',
        'TRIGGER:-P2D',
        'ACTION:DISPLAY',
        `DESCRIPTION:En 2 días tienes turno con ${appointment.clientName} a las ${appointment.time} hs`,
        'END:VALARM',
      ].join('\r\n'))
    }
  }

  const notesText = appointment.deposit
    ? `Turno de Tattoo con ${appointment.clientName}\\nSeña abonada: $${appointment.deposit}`
    : `Turno de Tattoo con ${appointment.clientName}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gastitos//Agenda Tattoo//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tattoo-${appointment.id || Date.now()}@gastitos`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:🖋️ Turno Tattoo: ${appointment.clientName}`,
    `DESCRIPTION:${notesText}`,
    alarms.join('\r\n'),
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

/**
 * Abre el diálogo nativo de Apple Calendar en iOS (o descarga el evento .ics en Android / PC)
 */
export function exportToIosCalendar(appointment: TattooAppointment) {
  try {
    const icsContent = generateIcsCalendarEvent(appointment)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `turno_${appointment.clientName.replace(/\s+/g, '_')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 3000)
    return true
  } catch (err) {
    console.error('Error al exportar evento a calendario', err)
    return false
  }
}
