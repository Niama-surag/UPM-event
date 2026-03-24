// src/stores/notifications.js
// ─────────────────────────────────────────────────────────────────────────────
// Store Pinia pour les notifications temps réel.
// NOUVEAUTÉS :
//   • notifyNewEvent  → notifie TOUS les users quand un event est créé
//   • notifyNewClub   → notifie TOUS les users quand un club est créé
//   • sendToAll       → helper interne pour broadcasts
// ─────────────────────────────────────────────────────────────────────────────
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/firebase'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc, getDocs,
  writeBatch, serverTimestamp
} from 'firebase/firestore'

export const useNotificationsStore = defineStore('notifications', () => {
  const items       = ref([])
  const loading     = ref(false)
  const error       = ref('')
  let   unsubscribe = null

  // ─── Computed ──────────────────────────────────────────────────────────────
  const unreadCount = computed(() => items.value.filter(n => !n.read).length)
  const unreadItems = computed(() => items.value.filter(n => !n.read))
  const recentItems = computed(() => items.value.slice(0, 20))

  // ─── Listener temps réel ───────────────────────────────────────────────────
  const startListening = userId => {
    stopListening()
    if (!userId) return
    loading.value = true
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    unsubscribe = onSnapshot(q, snap => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, err => {
      error.value = err.message
      loading.value = false
    })
  }

  const stopListening = () => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    items.value = []
  }

  // ─── Marquer lu ────────────────────────────────────────────────────────────
  const markRead = async notifId => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
    const item = items.value.find(n => n.id === notifId)
    if (item) item.read = true
  }

  const markAllRead = async userId => {
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

  // ─── Envoyer à un utilisateur ──────────────────────────────────────────────
  const send = async ({ userId, type, message, meta = {} }) => {
    await addDoc(collection(db, 'notifications'), {
      userId, type, message, meta,
      read: false,
      createdAt: serverTimestamp()
    })
  }

  // ─── Broadcast à tous les utilisateurs ────────────────────────────────────
  // NOUVELLE FONCTION — utilisée par notifyNewEvent et notifyNewClub
  const sendToAll = async ({ type, message, meta = {}, excludeUid = null }) => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'))
      const batch = writeBatch(db)
      usersSnap.docs.forEach(userDoc => {
        if (excludeUid && userDoc.id === excludeUid) return  // ne pas notifier le créateur
        const notifRef = doc(collection(db, 'notifications'))
        batch.set(notifRef, {
          userId:    userDoc.id,
          type,
          message,
          meta,
          read:      false,
          createdAt: serverTimestamp()
        })
      })
      await batch.commit()
    } catch (e) {
      console.error('[notifications] sendToAll error:', e)
    }
  }

  // ─── Senders spécifiques ──────────────────────────────────────────────────

  // Club approuvé / refusé
  const notifyClubApproved = (userId, clubName) =>
    send({ userId, type: 'club_approved',
      message: `✅ Votre club "${clubName}" a été approuvé !` })

  const notifyClubRejected = (userId, clubName, reason = '') =>
    send({ userId, type: 'club_rejected',
      message: `❌ Votre club "${clubName}" a été refusé.${reason ? ' Raison : ' + reason : ''}` })

  // Demande d'adhésion
  const notifyJoinApproved = (userId, clubName) =>
    send({ userId, type: 'join_approved',
      message: `🎉 Votre demande pour rejoindre "${clubName}" a été acceptée !` })

  const notifyJoinRejected = (userId, clubName) =>
    send({ userId, type: 'join_rejected',
      message: `Votre demande pour rejoindre "${clubName}" n'a pas été acceptée.` })

  // Événement approuvé / refusé
  const notifyEventApproved = (userId, eventTitle) =>
    send({ userId, type: 'event_approved',
      message: `✅ Votre événement "${eventTitle}" a été approuvé et est maintenant en ligne !` })

  const notifyEventRejected = (userId, eventTitle, reason = '') =>
    send({ userId, type: 'event_rejected',
      message: `❌ Votre événement "${eventTitle}" a été refusé.${reason ? ' Raison : ' + reason : ''}` })

  // Coupon utilisé
  const notifyCouponUsed = (adminUserId, code, eventTitle) =>
    send({ userId: adminUserId, type: 'coupon_used',
      message: `🎫 Le coupon "${code}" a été utilisé sur "${eventTitle}".` })

  // ─── NOUVELLES NOTIFICATIONS GLOBALES ─────────────────────────────────────

  /**
   * Notifie TOUS les utilisateurs qu'un nouvel événement a été créé.
   * Appelé depuis ExploreView.createEvent() après approbation ou création.
   *
   * @param {string} eventTitle - Titre de l'événement
   * @param {string} clubName   - Nom du club organisateur
   * @param {string} creatorUid - UID du créateur (exclu de la notif)
   */
  const notifyNewEvent = (eventTitle, clubName, creatorUid = null) =>
    sendToAll({
      type: 'new_event',
      message: `📅 Nouvel événement disponible : "${eventTitle}" par le club "${clubName}"`,
      meta: { eventTitle, clubName },
      excludeUid: creatorUid
    })

  /**
   * Notifie TOUS les utilisateurs qu'un nouveau club a été approuvé.
   * Appelé depuis AdminDashboard.approveClub().
   *
   * @param {string} clubName   - Nom du club
   * @param {string} creatorUid - UID du créateur (exclu de la notif)
   */
  const notifyNewClub = (clubName, creatorUid = null) =>
    sendToAll({
      type: 'new_club',
      message: `🏫 Nouveau club disponible : "${clubName}" — Rejoignez-le dès maintenant !`,
      meta: { clubName },
      excludeUid: creatorUid
    })

  return {
    items, loading, error,
    unreadCount, unreadItems, recentItems,
    startListening, stopListening,
    markRead, markAllRead, send, sendToAll,
    notifyClubApproved, notifyClubRejected,
    notifyJoinApproved, notifyJoinRejected,
    notifyEventApproved, notifyEventRejected,
    notifyCouponUsed,
    // Nouvelles
    notifyNewEvent,
    notifyNewClub
  }
})
