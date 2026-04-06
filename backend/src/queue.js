/**
 * Gerenciador de fila de confirmações WhatsApp.
 *
 * Regras:
 * - Cada estabelecimento tem apenas UM agendamento pendente de resposta por vez.
 * - Novos agendamentos entram na fila enquanto há um pendente.
 * - A mensagem seguinte só é disparada após o estabelecimento responder (1 ou 2).
 * - Se o pendente expirar (EXPIRY_HOURS sem resposta), é cancelado automaticamente
 *   e o próximo da fila é disparado.
 */

const { db, admin } = require('./firestore')
const { sendMessage, normalizePhone, setReplyHandler } = require('./whatsapp')
const { buildEstablishmentMessage, buildClientConfirmMessage, buildClientRefusalMessage } = require('./messages')

const EXPIRY_HOURS = 2   // horas sem resposta → cancela e passa pro próximo
const EXPIRY_CHECK_INTERVAL = 5 * 60 * 1000  // verifica a cada 5 min

// ─── Ponto de entrada ─────────────────────────────────────────────────────────

function startQueueProcessor() {
  setReplyHandler(handleReply)
  setInterval(checkExpired, EXPIRY_CHECK_INTERVAL)
  console.log('[Queue] Processador iniciado')
}

// ─── Enfileirar novo agendamento ──────────────────────────────────────────────

async function enqueueAppointment(establishmentUid, appointmentId, appointmentData) {
  const qRef = db.collection('whatsappQueue').doc(establishmentUid)

  await db.runTransaction(async (t) => {
    const snap = await t.get(qRef)
    const state = snap.exists
      ? snap.data()
      : { hasPending: false, pendingAppointmentId: null, pendingSentAt: null, pendingExpiresAt: null, queue: [] }

    if (!state.hasPending) {
      // Sem pendente — dispara imediatamente
      const sent = await dispatchToEstablishment(establishmentUid, appointmentId, appointmentData)
      if (sent) {
        const now = new Date()
        t.set(qRef, {
          hasPending: true,
          pendingAppointmentId: appointmentId,
          pendingSentAt: admin.firestore.Timestamp.fromDate(now),
          pendingExpiresAt: admin.firestore.Timestamp.fromDate(
            new Date(now.getTime() + EXPIRY_HOURS * 3600_000)
          ),
          queue: state.queue || [],
          updatedAt: admin.firestore.Timestamp.fromDate(now),
        })
        // Marca no Firestore como aguardando
        await db.collection('establishments').doc(establishmentUid)
          .collection('appointments').doc(appointmentId)
          .update({ status: 'awaiting_confirmation', updatedAt: admin.firestore.FieldValue.serverTimestamp() })
      }
    } else {
      // Já há pendente — enfileira
      const item = { appointmentId, appointmentData, createdAt: new Date().toISOString() }
      t.set(qRef, {
        ...state,
        queue: [...(state.queue || []), item],
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
      })
    }
  })
}

// ─── Processar resposta do estabelecimento ────────────────────────────────────

async function handleReply(fromPhone, reply) {
  // Achar qual estabelecimento tem este número
  const estSnap = await db.collection('establishments').get()
  let establishment = null

  const normalFrom = normalizePhone(fromPhone)
  for (const doc of estSnap.docs) {
    const data = doc.data()
    if (!data.whatsapp) continue
    const normalEst = normalizePhone(data.whatsapp)
    // Compara os últimos 9 dígitos (ignora variações de prefixo)
    if (normalFrom.slice(-9) === normalEst.slice(-9)) {
      establishment = { uid: doc.id, ...data }
      break
    }
  }

  if (!establishment) {
    console.log('[Queue] Resposta recebida de número desconhecido:', fromPhone)
    return
  }

  const qRef = db.collection('whatsappQueue').doc(establishment.uid)
  const qSnap = await qRef.get()
  if (!qSnap.exists || !qSnap.data().hasPending) return

  const { pendingAppointmentId, queue } = qSnap.data()

  // Buscar dados do agendamento
  const apptRef = db.collection('establishments').doc(establishment.uid)
    .collection('appointments').doc(pendingAppointmentId)
  const apptSnap = await apptRef.get()
  if (!apptSnap.exists) return
  const appt = apptSnap.data()

  if (reply === '1') {
    await apptRef.update({ status: 'confirmed', updatedAt: admin.firestore.FieldValue.serverTimestamp() })
    if (appt.customerPhone) {
      await sendMessage(appt.customerPhone, buildClientConfirmMessage(establishment.businessName, appt))
    }
    console.log(`[Queue] Agendamento ${pendingAppointmentId} CONFIRMADO pelo estabelecimento ${establishment.uid}`)
  } else {
    await apptRef.update({ status: 'cancelled', cancelReason: 'refused_by_establishment', updatedAt: admin.firestore.FieldValue.serverTimestamp() })
    if (appt.customerPhone) {
      await sendMessage(appt.customerPhone, buildClientRefusalMessage(establishment.businessName, appt))
    }
    console.log(`[Queue] Agendamento ${pendingAppointmentId} RECUSADO pelo estabelecimento ${establishment.uid}`)
  }

  await advanceQueue(establishment.uid, qRef, queue || [], establishment)
}

// ─── Verificar pendentes expirados ───────────────────────────────────────────

async function checkExpired() {
  const now = admin.firestore.Timestamp.fromDate(new Date())
  const snap = await db.collection('whatsappQueue')
    .where('hasPending', '==', true)
    .where('pendingExpiresAt', '<', now)
    .get()

  for (const doc of snap.docs) {
    const data = doc.data()
    const uid = doc.id
    console.log(`[Queue] Pendente expirado para estabelecimento ${uid}`)

    // Cancelar por timeout
    if (data.pendingAppointmentId) {
      await db.collection('establishments').doc(uid)
        .collection('appointments').doc(data.pendingAppointmentId)
        .update({ status: 'cancelled', cancelReason: 'no_response', updatedAt: admin.firestore.FieldValue.serverTimestamp() })
    }

    const estSnap = await db.collection('establishments').doc(uid).get()
    const est = estSnap.exists ? estSnap.data() : null
    await advanceQueue(uid, doc.ref, data.queue || [], est)
  }
}

// ─── Avançar fila ─────────────────────────────────────────────────────────────

async function advanceQueue(establishmentUid, qRef, queue, establishment) {
  if (!queue || queue.length === 0) {
    await qRef.set({
      hasPending: false,
      pendingAppointmentId: null,
      pendingSentAt: null,
      pendingExpiresAt: null,
      queue: [],
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
    })
    return
  }

  const [next, ...remaining] = queue
  const sent = await dispatchToEstablishment(
    establishmentUid,
    next.appointmentId,
    next.appointmentData
  )

  if (sent) {
    const now = new Date()
    await qRef.set({
      hasPending: true,
      pendingAppointmentId: next.appointmentId,
      pendingSentAt: admin.firestore.Timestamp.fromDate(now),
      pendingExpiresAt: admin.firestore.Timestamp.fromDate(
        new Date(now.getTime() + EXPIRY_HOURS * 3600_000)
      ),
      queue: remaining,
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    })
    await db.collection('establishments').doc(establishmentUid)
      .collection('appointments').doc(next.appointmentId)
      .update({ status: 'awaiting_confirmation', updatedAt: admin.firestore.FieldValue.serverTimestamp() })
  }
}

// ─── Enviar mensagem ao estabelecimento ──────────────────────────────────────

async function dispatchToEstablishment(establishmentUid, appointmentId, appointmentData) {
  const estSnap = await db.collection('establishments').doc(establishmentUid).get()
  if (!estSnap.exists) return false
  const est = estSnap.data()
  if (!est.whatsapp) return false

  const message = buildEstablishmentMessage(est.businessName, appointmentData)
  const sent = await sendMessage(est.whatsapp, message)
  if (sent) {
    // Log de atividade
    await db.collection('whatsappActivity').add({
      establishmentUid,
      appointmentId,
      type: 'sent_to_establishment',
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }
  return sent
}

module.exports = { startQueueProcessor, enqueueAppointment }
