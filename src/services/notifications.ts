import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Reminder, TattooAppointment, TattooReminderOption } from '../types/finance'
import { formatCurrency } from '../lib/utils'

// Almacén en memoria de temporizadores web activos
const activeWebTimers = new Map<number, ReturnType<typeof setTimeout>>()

// Helper para parsear fecha y hora local de forma 100% segura en iOS WebKit / Safari
export function parseLocalDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0)
}

// Calcular fecha y hora de la alerta según la opción elegida por la tatuadora
export function calculateTattooAlertDate(
  appointmentDate: string, // YYYY-MM-DD
  appointmentTime: string, // HH:mm
  option: TattooReminderOption
): Date | null {
  if (option === 'none') return null

  const appDate = parseLocalDateTime(appointmentDate, appointmentTime)
  if (isNaN(appDate.getTime())) return null

  if (option === 'exact_time') {
    return appDate
  }

  if (option === '10_min_before') {
    return new Date(appDate.getTime() - 10 * 60 * 1000)
  }

  if (option === '2_hours_before') {
    return new Date(appDate.getTime() - 2 * 60 * 60 * 1000)
  }

  if (option === 'same_day_morning') {
    const [y, m, d] = appointmentDate.split('-').map(Number)
    return new Date(y, m - 1, d, 9, 0, 0)
  }

  if (option === '1_day_before') {
    const [y, m, d] = appointmentDate.split('-').map(Number)
    const target = new Date(y, m - 1, d, 18, 0, 0)
    target.setDate(target.getDate() - 1)
    return target
  }

  if (option === '2_days_before') {
    const [y, m, d] = appointmentDate.split('-').map(Number)
    const target = new Date(y, m - 1, d, 12, 0, 0)
    target.setDate(target.getDate() - 2)
    return target
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

// Mostrar notificación en navegador Web / PWA usando ServiceWorker (indispensable para Android Chrome e iOS Safari)
export async function showWebNotification(title: string, body: string, id?: number): Promise<boolean> {
  // 1. Sonido acústico y vibración inmediata
  playChimeSound()
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200])
    } catch {}
  }

  // 2. Verificar soporte y permisos
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }

  const notifOptions: NotificationOptions = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: id ? String(id) : 'gastitos-alert',
  }

  // 3. Método recomendado y obligatorio para móviles: Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notifOptions)
        return true
      }
    } catch (e) {
      console.warn('ServiceWorker showNotification falló, probando constructor directo', e)
    }
  }

  // 4. Fallback directo para navegadores de escritorio
  try {
    new Notification(title, notifOptions)
    return true
  } catch (e) {
    console.warn('Constructor Notification no disponible en este dispositivo', e)
  }

  return false
}

export const notificationService = {
  // Inicializar canal de notificación de alta prioridad en Android nativo
  async initChannels(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
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

  // Solicitar permisos de notificación de forma adecuada según la plataforma
  async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.requestPermissions()
        return status.display === 'granted'
      } catch {
        return false
      }
    }

    // Navegador Web / PWA (Android Chrome, iOS Safari, etc.)
    if ('Notification' in window) {
      try {
        if (Notification.permission === 'granted') return true
        const perm = await Notification.requestPermission()
        return perm === 'granted'
      } catch {
        return false
      }
    }
    return false
  },

  // Programar un recordatorio con fecha y hora personalizada
  async scheduleReminderNotification(reminder: Reminder, currency: string = 'ARS'): Promise<number> {
    const targetDate = new Date(reminder.dueDateTime)
    const now = new Date()
    const id = reminder.notificationId || Math.floor(Math.random() * 100000)

    const amountText = reminder.amount ? ` - Monto: ${formatCurrency(reminder.amount, currency)}` : ''
    const body = `${reminder.notes || 'Recordatorio de pago pendiente'}${amountText}`
    const title = `🔔 ${reminder.title}`

    // Si la fecha ya pasó, no programar en el pasado
    if (targetDate.getTime() <= now.getTime()) {
      return id
    }

    if (Capacitor.isNativePlatform()) {
      await this.initChannels()
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id,
              channelId: 'gastos_reminders_channel',
              schedule: {
                at: targetDate,
                allowWhileIdle: true,
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
        console.warn('Error al programar recordatorio nativo', error)
      }
    } else {
      // En Web / PWA
      const delayMs = targetDate.getTime() - now.getTime()
      if (delayMs > 0 && delayMs < 7 * 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          showWebNotification(title, body, id)
          activeWebTimers.delete(id)
        }, delayMs)
        activeWebTimers.set(id, timer)
      }
    }

    return id
  },

  // Cancelar una notificación programada
  async cancelNotification(notificationId: number): Promise<void> {
    if (!notificationId) return

    // Cancelar temporizador web si existe
    const timer = activeWebTimers.get(notificationId)
    if (timer) {
      clearTimeout(timer)
      activeWebTimers.delete(notificationId)
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: notificationId }],
        })
      } catch (e) {
        console.warn('No se pudo cancelar la notificación nativa', e)
      }
    }
  },

  // Disparar una notificación de prueba inmediata con sonido audible y vibración
  async triggerTestNotification(): Promise<void> {
    // 1. Sonido acústico y vibración inmediata
    playChimeSound()
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200])
      } catch {}
    }

    const title = '🔔 ¡Prueba de Alerta Exitosa!'
    const body = 'Tus recordatorios y avisos de turnos sonarán en tu celular en la fecha y hora elegida.'

    if (Capacitor.isNativePlatform()) {
      try {
        await this.initChannels()
        const hasPermission = await this.requestPermission()
        if (hasPermission) {
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id: 9999,
                channelId: 'gastos_reminders_channel',
                schedule: { at: new Date(Date.now() + 1000) },
                sound: 'beep.wav',
              },
            ],
          })
        }
      } catch (err) {
        console.warn('Fallo test nativo', err)
      }
    } else {
      // En Web / PWA: solicitar permiso explícito y disparar vía Service Worker
      await this.requestPermission()
      await showWebNotification(title, body, 9999)
    }
  },

  // Programar múltiples notificaciones para turno de Tattoo
  async scheduleTattooNotifications(appointment: TattooAppointment): Promise<number[]> {
    const options = appointment.reminderOptions || (appointment.reminderOption ? [appointment.reminderOption] : [])
    const activeOptions = options.filter((o) => o !== 'none')

    if (activeOptions.length === 0) return []

    const scheduledIds: number[] = []
    const now = new Date()

    if (Capacitor.isNativePlatform()) {
      await this.initChannels()
      await this.requestPermission()
    } else {
      // Asegurar permisos en Web
      await this.requestPermission()
    }

    for (const opt of activeOptions) {
      const alertDate = calculateTattooAlertDate(appointment.date, appointment.time, opt)
      // Si la alerta ya pasó, no se puede programar en el pasado
      if (!alertDate || alertDate.getTime() <= now.getTime()) continue

      const id = Math.floor(Math.random() * 900000) + 100000
      let label = ''
      if (opt === '2_days_before') label = 'En 2 días tienes turno'
      else if (opt === '1_day_before') label = 'Mañana tienes turno'
      else if (opt === 'same_day_morning') label = 'Hoy tienes turno'
      else if (opt === '2_hours_before') label = 'En 2 horas comienza el turno'
      else if (opt === '10_min_before') label = 'En 10 minutos comienza el turno'
      else label = 'Turno ahora'

      const body = `${label} con ${appointment.clientName} a las ${appointment.time} hs`
      const title = `🖋️ Agenda Tattoo: ${appointment.clientName}`

      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id,
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
          console.warn('Error en schedule nativo', error)
        }
      } else {
        // En Web / PWA: usar temporizador local con showWebNotification (Service Worker)
        const delayMs = alertDate.getTime() - now.getTime()
        if (delayMs > 0 && delayMs < 7 * 24 * 60 * 60 * 1000) {
          const timer = setTimeout(() => {
            showWebNotification(title, body, id)
            activeWebTimers.delete(id)
          }, delayMs)
          activeWebTimers.set(id, timer)
          scheduledIds.push(id)
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
