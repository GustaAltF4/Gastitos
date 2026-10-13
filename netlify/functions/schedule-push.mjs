import webpush from 'web-push'

const DEFAULT_VAPID_PUBLIC =
  'BK1IvkCefscA36nPs2gy5Dw2q8UmCouJbBzSPjsuwz0n6Be-EPmg98PNlO-hoo4w02pCeF_5_FKt5Crqlx_SPnY'
const DEFAULT_VAPID_PRIVATE = 'SXHeMAjh2AMb6Uthq-Fa__gUwz2PqsjmnmdMJd71kZc'

// Límite seguro por tramo en QStash gratuito (6 días en segundos; si falta más, send-push re-encola automáticamente)
const MAX_CHUNK_DELAY_SECONDS = 6 * 24 * 60 * 60

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const qstashToken = process.env.QSTASH_TOKEN
  const qstashBaseUrl = (process.env.QSTASH_URL || 'https://qstash-eu-central-1.upstash.io').replace(/\/+$/, '')

  try {
    // Cancelar un mensaje programado en QStash cuando se elimina o completa un recordatorio/turno
    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}')
      const messageIds = Array.isArray(body.messageIds)
        ? body.messageIds
        : body.messageId
        ? [body.messageId]
        : []

      if (!qstashToken || messageIds.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true, cancelled: 0 }),
        }
      }

      await Promise.allSettled(
        messageIds.map((msgId) =>
          fetch(`${qstashBaseUrl}/v2/messages/${encodeURIComponent(msgId)}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${qstashToken}`,
            },
          })
        )
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, cancelled: messageIds.length }),
      }
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' }),
      }
    }

    const payload = JSON.parse(event.body || '{}')
    const { subscription, title, body, fireAt, delaySeconds, tag, url } = payload

    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Falta PushSubscription válida del dispositivo (endpoint).' }),
      }
    }

    const vapidPublic =
      process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:notificaciones@gastitos.app'

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

    const now = Date.now()
    const targetTimestamp =
      typeof fireAt === 'number'
        ? fireAt
        : typeof delaySeconds === 'number'
        ? now + delaySeconds * 1000
        : now

    const totalRemainingSeconds = Math.max(0, Math.floor((targetTimestamp - now) / 1000))

    // Si es un envío inmediato (o no hay QSTASH_TOKEN y el delay es <= 10s), enviamos directo con web-push
    if (totalRemainingSeconds <= 1 || (!qstashToken && totalRemainingSeconds <= 10)) {
      if (totalRemainingSeconds > 0) {
        await new Promise((r) => setTimeout(r, totalRemainingSeconds * 1000))
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: title || '🔔 Gastitos',
          body: body || 'Tienes un recordatorio pendiente',
          tag: tag || `gastitos-${Date.now()}`,
          url: url || '/',
        }),
        { TTL: 86400, urgency: 'high' }
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, mode: 'direct' }),
      }
    }

    // Para alertas programadas en el futuro se requiere QSTASH_TOKEN
    if (!qstashToken) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          code: 'ERR-NO-QSTASH-TOKEN',
          error:
            'Falta configurar la variable de entorno QSTASH_TOKEN en Netlify para programar alertas con la app cerrada.',
        }),
      }
    }

    const host = event.headers['x-forwarded-host'] || event.headers.host
    const protocol = event.headers['x-forwarded-proto'] || 'https'
    const siteOrigin = (process.env.URL || `${protocol}://${host}`).replace(/\/+$/, '')
    const destinationUrl = `${siteOrigin}/.netlify/functions/send-push`

    const currentDelaySeconds = Math.min(totalRemainingSeconds, MAX_CHUNK_DELAY_SECONDS)

    const qstashRes = await fetch(`${qstashBaseUrl}/v2/publish/${destinationUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': `${currentDelaySeconds}s`,
        'Upstash-Retries': '3',
      },
      body: JSON.stringify({
        subscription,
        title: title || '🔔 Gastitos',
        body: body || '',
        tag: tag || `gastitos-${Date.now()}`,
        url: url || '/',
        fireAt: targetTimestamp,
        destinationUrl,
      }),
    })

    if (!qstashRes.ok) {
      const errText = await qstashRes.text()
      return {
        statusCode: qstashRes.status,
        headers,
        body: JSON.stringify({
          code: 'ERR-QSTASH-PUBLISH',
          error: `Error de QStash (${qstashRes.status}): ${errText}`,
        }),
      }
    }

    const qstashData = await qstashRes.json()
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        mode: 'qstash',
        messageId: qstashData.messageId,
        scheduledInSeconds: currentDelaySeconds,
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        code: 'ERR-SCHEDULE-FUNC',
        error: err instanceof Error ? err.message : String(err),
      }),
    }
  }
}
