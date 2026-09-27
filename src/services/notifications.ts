import { LocalNotifications } from '@capacitor/local-notifications'
import { Reminder, TattooAppointment, TattooReminderOption } from '../types/finance'
import { formatCurrency } from '../lib/utils'

// Calcular fecha y hora de la alerta según la opción elegida por la tatuadora
export function calculateTattooAlertDate(
  appointmentDate: string, // YYYY-MM-DD
  appointmentTime: string, // HH:mm
  option: TattooReminderOption
): Date | null {
  if (option === 'none') return null

  const appDate = new Date(`${appointmentDate}T${appointmentTime}:00`)
  if (isNaN(appDate.getTime())) return null

  if (option === 'exact_time') {
    return appDate
  }

  if (option === '2_hours_before') {
    return new Date(appDate.getTime() - 2 * 60 * 60 * 1000)
  }

  if (option === 'same_day_morning') {
    const d = new Date(`${appointmentDate}T09:00:00`)
    return d
  }

  if (option === '1_day_before') {
    const d = new Date(`${appointmentDate}T18:00:00`)
    d.setDate(d.getDate() - 1)
    return d
  }

  if (option === '2_days_before') {
    const d = new Date(`${appointmentDate}T12:00:00`)
    d.setDate(d.getDate() - 2)
    return d
  }

  return null
}


// Sintetizador de sonido chime / campana agradable con Web Audio API (funciona offline, web y móvil)
export function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const now = ctx.currentTime

    // Nota 1: F5 (698.46 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(698.46, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.04)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.6)

    // Nota 2: C6 armónico (1046.50 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.5, now + 0.1)
    gain2.gain.setValueAtTime(0, now + 0.1)
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.1)
    osc2.stop(now + 1.2)
  } catch (err) {
    console.warn('Error al reproducir audio de notificación', err)
  }
}

export const notificationService = {
  // Inicializar canal de notificación de alta prioridad en Android
  async initChannels(): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: 'gastos_reminders_channel',
        name: 'Recordatorios de Gastos y Pagos',
        description: 'Alertas sonoras para vencimientos y avisos de cobro/pago',
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // VISIBILITY_PUBLIC
        sound: 'beep.wav',
        vibration: true,
        lights: true,
        lightColor: '#dd0081',
      })
    } catch {
      // Ignorar si no está en entorno nativo
    }
  },

  // Solicitar permisos de notificación (Android 13+ y iOS requieren permiso explícito)
  async requestPermission(): Promise<boolean> {
    try {
      const status = await LocalNotifications.requestPermissions()
      return status.display === 'granted'
    } catch {
      // Fallback para navegador web estándar si no está corriendo en Android/iOS nativo
      if ('Notification' in window) {
        const perm = await Notification.requestPermission()
        return perm === 'granted'
      }
      return false
    }
  },

  // Programar un recordatorio con fecha y hora personalizada
  async scheduleReminderNotification(reminder: Reminder, currency: string = 'ARS'): Promise<number> {
    const targetDate = new Date(reminder.dueDateTime)
    const now = new Date()
    const id = reminder.notificationId || Math.floor(Math.random() * 100000)

    const amountText = reminder.amount ? ` - Monto: ${formatCurrency(reminder.amount, currency)}` : ''
    const body = `${reminder.notes || 'Recordatorio de pago pendiente'}${amountText}`

    // Si la fecha ya pasó, no programar en el pasado
    if (targetDate.getTime() <= now.getTime()) {
      return id
    }

    await this.initChannels()

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `🔔 ${reminder.title}`,
            body: body,
            id: id,
            channelId: 'gastos_reminders_channel',
            schedule: {
              at: targetDate,
              allowWhileIdle: true, // Despierta el celular incluso en modo ahorro (Doze)
            },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: {
              reminderId: reminder.id,
            },
          },
        ],
      })
    } catch (error) {
      console.warn('Capacitor LocalNotifications no disponible en este entorno, usando fallback web', error)
      
      // Fallback web: si la pestaña sigue abierta
      const delayMs = targetDate.getTime() - now.getTime()
      if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          playChimeSound()
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🔔 ${reminder.title}`, {
              body: body,
              icon: '/favicon.ico',
            })
          }
        }, delayMs)
      }
    }

    return id
  },

  // Cancelar una notificación programada
  async cancelNotification(notificationId: number): Promise<void> {
    if (!notificationId) return
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }],
      })
    } catch (e) {
      console.warn('No se pudo cancelar la notificación nativa', e)
    }
  },

  // Disparar una notificación de prueba inmediata con sonido audible y vibración
  async triggerTestNotification(): Promise<void> {
    // 1. Sonido acústico y vibración inmediata asegurada
    playChimeSound()
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150])
      } catch {}
    }

    // 2. Notificación en el sistema móvil o navegador
    try {
      await this.initChannels()
      const hasPermission = await this.requestPermission()
      if (hasPermission) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '🔔 ¡Prueba de Alerta Exitosa!',
              body: 'Tus recordatorios y avisos de pago sonarán en tu celular en la fecha y hora que elijas.',
              id: 9999,
              channelId: 'gastos_reminders_channel',
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'beep.wav',
            },
          ],
        })
      }
    } catch {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 ¡Prueba de Alerta Exitosa!', {
          body: 'Tus recordatorios y avisos de pago sonarán en tu celular en la fecha y hora que elijas.',
          icon: '/favicon.ico',
        })
      }
    }
  },

  // Programar múltiples notificaciones para turno de Tattoo
  async scheduleTattooNotifications(appointment: TattooAppointment): Promise<number[]> {
    const options = appointment.reminderOptions || (appointment.reminderOption ? [appointment.reminderOption] : [])
    const activeOptions = options.filter((o) => o !== 'none')

    if (activeOptions.length === 0) return []

    const scheduledIds: number[] = []
    const now = new Date()

    await this.initChannels()
    await this.requestPermission()

    for (const opt of activeOptions) {
      const alertDate = calculateTattooAlertDate(appointment.date, appointment.time, opt)
      if (!alertDate || alertDate.getTime() <= now.getTime()) continue

      const id = Math.floor(Math.random() * 900000) + 100000
      let label = ''
      if (opt === '2_days_before') label = 'En 2 días tienes turno'
      else if (opt === '1_day_before') label = 'Mañana tienes turno'
      else if (opt === 'same_day_morning') label = 'Hoy tienes turno'
      else if (opt === '2_hours_before') label = 'En 2 horas comienza el turno'
      else label = 'Turno ahora'

      const body = `${label} con ${appointment.clientName} a las ${appointment.time} hs`

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: `🖋️ Agenda Tattoo: ${appointment.clientName}`,
              body: body,
              id: id,
              channelId: 'gastos_reminders_channel',
              schedule: {
                at: alertDate,
                allowWhileIdle: true,
              },
              sound: 'beep.wav',
              extra: {
                tattooId: appointment.id,
              },
            },
          ],
        })
        scheduledIds.push(id)
      } catch (error) {
        console.warn('Capacitor LocalNotifications fallback web para tattoo', error)
        const delayMs = alertDate.getTime() - now.getTime()
        if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            playChimeSound()
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`🖋️ Agenda Tattoo: ${appointment.clientName}`, {
                body: body,
                icon: '/favicon.svg',
              })
            }
          }, delayMs)
        }
      }
    }

    return scheduledIds
  },

  // Alias para retrocompatibilidad
  async scheduleTattooNotification(appointment: TattooAppointment): Promise<number | undefined> {
    const ids = await this.scheduleTattooNotifications(appointment)
    return ids[0]
  },
}
