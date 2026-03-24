// src/stores/coupons.js
// Coupon system for paid events
// WHY Pinia store vs direct Firestore calls?
//   → Caches validation results (no repeated reads)
//   → Centralises coupon logic (discount calc, usage check)
//   → Testable without mounting components
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/firebase'
import {
  collection, addDoc, getDocs, query, where,
  updateDoc, doc, increment, serverTimestamp, getDoc
} from 'firebase/firestore'

export const useCouponStore = defineStore('coupons', () => {
  const loading    = ref(false)
  const error      = ref('')

  // ── Create a coupon (club admin only) ──────────────────────
  // discount: 0–100 (percent) or 'free' for 100% off
  const createCoupon = async ({
    eventId,
    clubId,
    code,
    discountType,   // 'percent' | 'free'
    discountValue,  // 0–100 for percent, irrelevant for free
    usageLimit,     // number, 0 = unlimited
    expiresAt,      // Date | null
    createdBy,
  }) => {
    if (!code?.trim()) throw new Error('Coupon code is required')
    if (code.length < 3) throw new Error('Code must be at least 3 characters')

    // Check for duplicate code on same event
    const existing = await getDocs(
      query(
        collection(db, 'coupons'),
        where('eventId', '==', eventId),
        where('code', '==', code.toUpperCase().trim())
      )
    )
    if (!existing.empty) throw new Error('A coupon with this code already exists for this event')

    const data = {
      eventId,
      clubId,
      code:         code.toUpperCase().trim(),
      discountType,
      discountValue: discountType === 'free' ? 100 : Number(discountValue),
      usageLimit:   Number(usageLimit) || 0,  // 0 = unlimited
      usageCount:   0,
      expiresAt:    expiresAt ? new Date(expiresAt) : null,
      isActive:     true,
      createdBy,
      createdAt:    serverTimestamp(),
    }

    const ref = await addDoc(collection(db, 'coupons'), data)
    return { id: ref.id, ...data }
  }

  // ── Validate a coupon code before checkout ─────────────────
  // Returns: { valid: bool, coupon: object|null, finalPrice: number, error: string }
  const validateCoupon = async (code, eventId, originalPrice) => {
    if (!code?.trim()) return { valid: false, error: 'Enter a coupon code' }

    const snap = await getDocs(
      query(
        collection(db, 'coupons'),
        where('eventId', '==', eventId),
        where('code', '==', code.toUpperCase().trim()),
        where('isActive', '==', true)
      )
    )

    if (snap.empty) return { valid: false, error: 'Invalid coupon code' }

    const couponDoc = snap.docs[0]
    const coupon    = { id: couponDoc.id, ...couponDoc.data() }

    // Check expiry
    if (coupon.expiresAt) {
      const exp = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt)
      if (new Date() > exp) return { valid: false, error: 'This coupon has expired' }
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'This coupon has reached its usage limit' }
    }

    // Calculate final price
    let finalPrice = originalPrice
    if (coupon.discountType === 'free' || coupon.discountValue >= 100) {
      finalPrice = 0
    } else {
      finalPrice = Math.max(0, originalPrice * (1 - coupon.discountValue / 100))
      finalPrice = Math.round(finalPrice * 100) / 100  // round to cents
    }

    return { valid: true, coupon, finalPrice, error: '' }
  }

  // ── Redeem a coupon (call AFTER successful registration) ───
  const redeemCoupon = async (couponId, userId, eventId) => {
    // Increment usage count atomically
    await updateDoc(doc(db, 'coupons', couponId), {
      usageCount: increment(1)
    })

    // Record who used it (for audit)
    await addDoc(collection(db, 'couponUsages'), {
      couponId,
      userId,
      eventId,
      usedAt: serverTimestamp()
    })
  }

  // ── Fetch coupons for an event (admin view) ────────────────
  const fetchEventCoupons = async (eventId) => {
    const snap = await getDocs(
      query(collection(db, 'coupons'), where('eventId', '==', eventId))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // ── Deactivate a coupon ────────────────────────────────────
  const deactivateCoupon = async (couponId) => {
    await updateDoc(doc(db, 'coupons', couponId), { isActive: false })
  }

  return {
    loading, error,
    createCoupon, validateCoupon, redeemCoupon,
    fetchEventCoupons, deactivateCoupon
  }
})
