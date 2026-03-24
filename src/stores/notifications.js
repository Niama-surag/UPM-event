// src/stores/notifications.js
// ─────────────────────────────────────────────────────────────
// Real-time notifications store for user + admin alerts.
// Listens via Firestore onSnapshot — updates everywhere live.
//
// Notification types:
//   club_approved | club_rejected | join_approved | join_rejected
//   event_approved | event_rejected | coupon_used | new_event | new_club
// ─────────────────────────────────────────────────────────────
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/firebase'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc, getDocs,
  writeBatch, serverTimestamp
} from 'firebase/firestore'

export const useNotificationsStore = defineStore('notifications', () => {
  const items       = ref([])   // all notifications for current user
  const loading     = ref(false)
  const error       = ref('')
  let   unsubscribe = null

  // ── Computed ────────────────────────────────────────────────
  const unreadCount  = computed(() => items.value.filter(n => !n.read).length)
  const unreadItems  = computed(() => items.value.filter(n => !n.read))
  const recentItems  = computed(() => items.value.slice(0, 20))

  // ── Start real-time listener for a user ─────────────────────
  const startListening = (userId) => {
    stopListening()
    if (!userId) return

    loading.value = true
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    unsubscribe = onSnapshot(q, (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, (err) => {
      error.value = err.message
      loading.value = false
    })
  }

  const stopListening = () => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    items.value = []
  }

  // ── Mark one notification as read ───────────────────────────
  const markRead = async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
    const item = items.value.find(n => n.id === notifId)
    if (item) item.read = true
  }

  // ── Mark ALL as read ─────────────────────────────────────────
  const markAllRead = async (userId) => {
    const batch = writeBatch(db)
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    )
    const snap = await getDocs(q)
    snap.docs.forEach(d => batch.update(d.ref, { read: true }))
    await batch.commit()
    items.value.forEach(n => { n.read = true })
  }

  // ── Send a notification to a user ───────────────────────────
  // Call this from admin actions or server-side triggers.
  const send = async ({ userId, type, message, meta = {} }) => {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      message,
      meta,
      read:      false,
      createdAt: serverTimestamp()
    })
  }

  // ── Convenience senders ──────────────────────────────────────
  const notifyClubApproved = (userId, clubName) =>
    send({ userId, type: 'club_approved', message: `✅ Your club "${clubName}" was approved!` })

  const notifyClubRejected = (userId, clubName, reason = '') =>
    send({ userId, type: 'club_rejected', message: `❌ Your club "${clubName}" was rejected.${reason ? ' Reason: ' + reason : ''}` })

  const notifyJoinApproved = (userId, clubName) =>
    send({ userId, type: 'join_approved', message: `🎉 Your request to join "${clubName}" was approved!` })

  const notifyJoinRejected = (userId, clubName) =>
    send({ userId, type: 'join_rejected', message: `Your request to join "${clubName}" was not approved.` })

  const notifyEventApproved = (userId, eventTitle) =>
    send({ userId, type: 'event_approved', message: `✅ Your event "${eventTitle}" was approved and is now live!` })

  const notifyEventRejected = (userId, eventTitle, reason = '') =>
    send({ userId, type: 'event_rejected', message: `❌ Your event "${eventTitle}" was rejected.${reason ? ' Reason: ' + reason : ''}` })

  const notifyCouponUsed = (adminUserId, code, eventTitle) =>
    send({ adminUserId, type: 'coupon_used', message: `🎟 Coupon "${code}" was used on event "${eventTitle}".` })

  return {
    items, loading, error,
    unreadCount, unreadItems, recentItems,
    startListening, stopListening,
    markRead, markAllRead, send,
    notifyClubApproved, notifyClubRejected,
    notifyJoinApproved, notifyJoinRejected,
    notifyEventApproved, notifyEventRejected,
    notifyCouponUsed
  }
})
