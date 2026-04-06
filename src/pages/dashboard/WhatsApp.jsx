import { useEffect, useState, useCallback } from 'react'
import { onSnapshot, doc, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { Smartphone, Wifi, WifiOff, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { getQrCode } from '../../services/whatsappService'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const POLL_INTERVAL = 4000 // ms — poll QR while not connected

export default function WhatsApp() {
  const { user, establishment } = useAuth()

  // Platform connection status (from Firestore)
  const [waStatus, setWaStatus] = useState(null)
  // QR code from backend
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  // Queue state for this establishment
  const [queueState, setQueueState] = useState(null)
  // Recent activity
  const [activity, setActivity] = useState([])

  // ── Listen to platform WhatsApp status ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'whatsappStatus', 'global'), snap => {
      setWaStatus(snap.exists() ? snap.data() : null)
    })
    return unsub
  }, [])

  // ── Listen to this establishment's queue ─────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'whatsappQueue', user.uid), snap => {
      setQueueState(snap.exists() ? snap.data() : null)
    })
    return unsub
  }, [user])

  // ── Listen to recent activity ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'whatsappActivity'),
      where('establishmentUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, snap => {
      setActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  // ── Poll QR while not connected ───────────────────────────────────────────────
  const fetchQr = useCallback(async () => {
    if (waStatus?.connected) return
    setQrLoading(true)
    const data = await getQrCode()
    setQrData(data)
    setQrLoading(false)
  }, [waStatus?.connected])

  useEffect(() => {
    if (waStatus?.connected) { setQrData(null); return }
    fetchQr()
    const id = setInterval(fetchQr, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchQr, waStatus?.connected])

  const isConnected = waStatus?.connected === true
  const pendingId = queueState?.pendingAppointmentId
  const queueLen = queueState?.queue?.length ?? 0

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Confirmações automáticas de agendamento via WhatsApp
        </p>
      </div>

      {/* Connection status */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone size={18} className="text-green-600" />
            Status da conexão
          </h2>
          {!isConnected && (
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchQr} loading={qrLoading}>
              Atualizar QR
            </Button>
          )}
        </div>

        {isConnected ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Wifi size={22} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">Conectado</p>
              {waStatus?.phone && (
                <p className="text-sm text-green-600 dark:text-green-400">+{waStatus.phone}</p>
              )}
              <p className="text-xs text-green-500 mt-0.5">Notificações ativas — clientes receberão confirmações automáticas</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <WifiOff size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  {qrData?.status === 'connecting' ? 'Conectando...' : 'Aguardando conexão'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Escaneie o QR code abaixo com o WhatsApp do estabelecimento
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center py-6">
              {qrLoading && !qrData?.qr ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500">Gerando QR code...</p>
                </div>
              ) : qrData?.qr ? (
                <div className="space-y-4 text-center">
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border-2 border-green-100">
                    <img src={qrData.qr} alt="QR Code WhatsApp" className="w-56 h-56" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto space-y-1">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Como escanear:</p>
                    <p>1. Abra o WhatsApp no celular</p>
                    <p>2. Toque em <strong>Dispositivos conectados</strong></p>
                    <p>3. Toque em <strong>Conectar dispositivo</strong></p>
                    <p>4. Aponte a câmera para este QR code</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    Serviço WhatsApp não disponível.<br />
                    Configure a variável <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">VITE_WHATSAPP_SERVICE_URL</code> no Vercel.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Queue status */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Clock size={18} className="text-amber-500" />
          Fila de confirmações
        </h2>

        {!queueState || (!pendingId && queueLen === 0) ? (
          <div className="text-center py-8">
            <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma confirmação pendente.</p>
            <p className="text-xs text-gray-400 mt-1">Quando um cliente agendar, a mensagem será disparada automaticamente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending */}
            {pendingId && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Aguardando resposta</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">#{pendingId}</p>
                  {queueState.pendingExpiresAt && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Expira: {formatExpiry(queueState.pendingExpiresAt)}
                    </p>
                  )}
                </div>
                <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full flex-shrink-0">
                  Pendente
                </span>
              </div>
            )}

            {/* Queue items */}
            {queueLen > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{queueLen}</span> agendamento{queueLen > 1 ? 's' : ''} na fila — aguardando resposta do atual
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Activity log */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <MessageSquare size={18} className="text-green-600" />
          Atividade recente
        </h2>

        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6 italic">Nenhuma atividade ainda.</p>
        ) : (
          <div className="space-y-3">
            {activity.map(item => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 flex-shrink-0">
                  {item.type === 'sent_to_establishment' && <MessageSquare size={15} className="text-amber-500" />}
                  {item.type === 'confirmed' && <CheckCircle size={15} className="text-green-500" />}
                  {item.type === 'refused' && <XCircle size={15} className="text-red-500" />}
                  {item.type === 'expired' && <Clock size={15} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-300">
                    {activityLabel(item.type)}
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">#{item.appointmentId}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {item.createdAt ? formatTime(item.createdAt) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info box */}
      <div className="rounded-2xl border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-5">
        <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
          <AlertCircle size={16} />
          Como funciona
        </h3>
        <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
          <li>📲 Quando um cliente agenda, o WhatsApp do estabelecimento recebe uma mensagem com os detalhes.</li>
          <li>✅ Responda <strong>1</strong> para confirmar — o cliente recebe confirmação automática.</li>
          <li>❌ Responda <strong>2</strong> para recusar — o horário é liberado e o cliente é notificado.</li>
          <li>⏱ Sem resposta em 2 horas, o agendamento é cancelado e o próximo da fila é enviado.</li>
          <li>🔄 Fila individual por estabelecimento — uma confirmação por vez.</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function activityLabel(type) {
  switch (type) {
    case 'sent_to_establishment': return 'Mensagem de confirmação enviada'
    case 'confirmed': return 'Agendamento confirmado pelo estabelecimento'
    case 'refused': return 'Agendamento recusado pelo estabelecimento'
    case 'expired': return 'Agendamento cancelado por falta de resposta'
    default: return type
  }
}

function formatExpiry(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatTime(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diff = now - date
  if (diff < 60_000) return 'agora'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}min`
  if (diff < 86400_000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
