<template>
  <div class="event-detail">

    <div v-if="loading" class="loading-wrap">
      <div class="skeleton" style="height:320px; border-radius:16px; margin-bottom:2rem;"></div>
      <div class="skeleton" style="height:2.5rem; width:55%; margin-bottom:1rem;"></div>
      <div class="skeleton" style="height:1rem; width:35%;"></div>
    </div>

    <div v-else-if="!event" class="not-found">
      <div style="font-size:4rem">🔍</div>
      <h2>Event not found</h2>
      <router-link to="/explore" class="btn btn-primary">← Back to Events</router-link>
    </div>

    <div v-else>
      <!-- Hero -->
      <div class="hero">
        <img
          :src="event.imageURL || 'https://via.placeholder.com/1200x400?text=UPM+Event'"
          :alt="event.title"
          class="hero-img"
          @error="$event.target.src = 'https://via.placeholder.com/1200x400?text=Event'"
        />
        <span class="hero-badge" :class="event.type">
          {{ event.type === 'free' ? 'GRATUIT' : finalPrice !== null ? '€' + finalPrice.toFixed(2) : event.price + '€' }}
        </span>
      </div>

      <!-- Content grid -->
      <div class="content">
        <!-- Left: info -->
        <div class="main-info">
          <h1>{{ event.title }}</h1>
          <p class="description">{{ event.description }}</p>

          <div class="meta-grid">
            <div class="meta-item">
              <i class="fas fa-calendar-alt"></i>
              <div><strong>Date & Heure</strong><span>{{ formatDate(event.startTime) }}</span></div>
            </div>
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <div><strong>Lieu</strong><span>{{ event.location || 'Non précisé' }}</span></div>
            </div>
            <div class="meta-item">
              <i class="fas fa-tag"></i>
              <div>
                <strong>Prix</strong>
                <span>
                  <span v-if="finalPrice !== null && finalPrice < (event.price || 0)" class="price-original">€{{ event.price }}</span>
                  {{ finalPrice !== null ? (finalPrice === 0 ? 'Gratuit 🎉' : '€' + finalPrice.toFixed(2)) : (event.price ? '€' + event.price : 'Gratuit') }}
                </span>
              </div>
            </div>
            <div class="meta-item" v-if="clubName">
              <i class="fas fa-users"></i>
              <div><strong>Club organisateur</strong><span>{{ clubName }}</span></div>
            </div>
          </div>
        </div>

        <!-- Right: register card -->
        <div class="sidebar">
          <div class="register-card">
            <h3>Participer</h3>

            <!-- Price display -->
            <div class="price-display">
              <span v-if="finalPrice !== null && finalPrice < (event.price || 0)" class="price-was">
                Était: €{{ event.price }}
              </span>
              <p class="price-big" :class="{ free: finalPrice === 0 || !event.price || event.price === 0 }">
                {{ finalPrice === 0 || !event.price || event.price === 0 ? 'Gratuit' : '€' + (finalPrice ?? event.price).toFixed(2) }}
              </p>
            </div>

            <!-- Coupon input (only for paid events) -->
            <div v-if="event.type === 'paid' && event.price > 0 && !isRegistered" class="coupon-section">
              <label class="coupon-label"><i class="fas fa-ticket-alt"></i> Have a coupon?</label>
              <CouponInput
                :event-id="route.params.id"
                :base-price="event.price || 0"
                @applied="handleCouponApplied"
                @cleared="handleCouponCleared"
              />
            </div>

            <!-- Register button -->
            <button
              class="btn-register"
              @click="registerForEvent"
              :disabled="isRegistered || registering"
            >
              <i class="fas" :class="isRegistered ? 'fa-check-circle' : 'fa-ticket-alt'"></i>
              {{ isRegistered ? 'Déjà inscrit ✓' : registering ? 'Inscription…' : "S'inscrire" }}
            </button>

            <p v-if="registerSuccess" class="success-msg">🎉 Inscription confirmée !</p>
            <p v-if="registerError"   class="error-msg">{{ registerError }}</p>

            <hr class="divider" />

            <!-- Share -->
            <div class="share-section">
              <p class="share-label">Partager</p>
              <div class="share-btns">
                <a :href="`https://wa.me/?text=${encodeURIComponent(event.title + ' - ' + currentUrl)}`"
                   target="_blank" class="share-btn whatsapp"><i class="fab fa-whatsapp"></i></a>
                <a :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`"
                   target="_blank" class="share-btn linkedin"><i class="fab fa-linkedin"></i></a>
                <button class="share-btn copy" @click="copyLink">
                  <i :class="copied ? 'fas fa-check' : 'fas fa-link'"></i>
                </button>
              </div>
              <p v-if="copied" class="copy-confirm">Link copied! ✓</p>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <router-link to="/explore" class="btn btn-secondary">← Retour aux événements</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCouponStore } from '@/stores/coupons'
import CouponInput from '@/components/CouponInput.vue'

const route       = useRoute()
const authStore   = useAuthStore()
const couponStore = useCouponStore()

const event           = ref(null)
const loading         = ref(true)
const clubName        = ref('')
const isRegistered    = ref(false)
const registering     = ref(false)
const registerSuccess = ref(false)
const registerError   = ref('')
const copied          = ref(false)
const currentUrl      = window.location.href

// Coupon state
const appliedCoupon = ref(null)
const finalPrice    = ref(null)   // null = no coupon applied

onMounted(async () => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', route.params.id))
    if (eventDoc.exists()) {
      event.value = { id: eventDoc.id, ...eventDoc.data() }
      if (event.value.clubId) {
        const clubDoc = await getDoc(doc(db, 'clubs', event.value.clubId))
        if (clubDoc.exists()) clubName.value = clubDoc.data().name
      }
      if (authStore.user) {
        const regSnap = await getDocs(query(
          collection(db, 'registrations'),
          where('userid', '==', authStore.user.uid),
          where('eventsid', '==', route.params.id)
        ))
        isRegistered.value = !regSnap.empty
      }
    }
  } catch (err) { console.error(err) }
  finally { loading.value = false }
})

const handleCouponApplied = (result) => {
  appliedCoupon.value = result.coupon
  finalPrice.value    = result.finalPrice
}

const handleCouponCleared = () => {
  appliedCoupon.value = null
  finalPrice.value    = null
}

const registerForEvent = async () => {
  if (!authStore.user || isRegistered.value) return
  registering.value = true; registerError.value = ''
  try {
    // Create registration
    await addDoc(collection(db, 'registrations'), {
      userid:      authStore.user.uid,
      eventsid:    route.params.id,
      pricePaid:   finalPrice.value ?? (event.value.price || 0),
      couponUsed:  appliedCoupon.value?.code || null,
      registeredAt: new Date().toISOString()
    })

    // Redeem coupon if applied
    if (appliedCoupon.value) {
      await couponStore.redeemCoupon(appliedCoupon.value.id, authStore.user.uid, route.params.id)
    }

    isRegistered.value  = true
    registerSuccess.value = true
  } catch (err) {
    registerError.value = "Erreur lors de l'inscription"
  } finally {
    registering.value = false
  }
}

const copyLink = async () => {
  try { await navigator.clipboard.writeText(currentUrl); copied.value = true; setTimeout(() => { copied.value = false }, 2000) }
  catch {}
}

const formatDate = (ts) => {
  if (!ts) return 'Date non précisée'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
</script>

<style scoped>
.event-detail { max-width: 1100px; margin: 0 auto; padding: 2rem; }

.hero { position:relative; border-radius:16px; overflow:hidden; margin-bottom:2rem; background:var(--bg-muted, #f1f5f9); }
.hero-img { width:100%; height:380px; object-fit:cover; display:block; }
.hero-badge { position:absolute; top:1rem; right:1rem; padding:0.4rem 1rem; border-radius:20px; font-weight:700; font-size:0.85rem; color:white; text-transform:uppercase; }
.hero-badge.free { background:#10b981; }
.hero-badge.paid { background:#f59e0b; color:#1f2937; }

.content { display:grid; grid-template-columns:1fr 320px; gap:2rem; align-items:start; }
.main-info h1 { font-size:2rem; margin:0 0 1rem; color:var(--text-base,#1e293b); line-height:1.3; }
.description { color:var(--text-muted,#475569); line-height:1.8; margin-bottom:2rem; font-size:1.05rem; }
.meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.meta-item { display:flex; align-items:flex-start; gap:0.75rem; background:var(--bg-subtle,#f8fafc); padding:1rem; border-radius:10px; border:1px solid var(--border,#e2e8f0); }
.meta-item i { color:#2563eb; font-size:1.2rem; margin-top:0.15rem; min-width:20px; }
.meta-item div { display:flex; flex-direction:column; gap:0.2rem; }
.meta-item strong { font-size:0.75rem; text-transform:uppercase; color:var(--text-faint,#94a3b8); letter-spacing:0.05em; }
.meta-item span { font-size:0.95rem; color:var(--text-base,#1e293b); font-weight:500; }
.price-original { text-decoration:line-through; color:var(--text-faint,#94a3b8); margin-right:0.35rem; }

.register-card { background:var(--bg-surface,#fff); border-radius:12px; box-shadow:var(--shadow-md, 0 4px 16px rgba(0,0,0,0.1)); padding:1.5rem; position:sticky; top:5rem; border:1px solid var(--border,#e2e8f0); }
.register-card h3 { margin:0 0 1rem; font-size:1.1rem; color:var(--text-base,#1e293b); }
.price-display { margin-bottom:1rem; }
.price-was { font-size:0.78rem; color:var(--text-faint,#94a3b8); text-decoration:line-through; display:block; }
.price-big { font-size:2rem; font-weight:800; color:#2563eb; margin:0; }
.price-big.free { color:#10b981; }

.coupon-section { margin-bottom:1rem; }
.coupon-label { display:block; font-size:0.78rem; font-weight:600; color:var(--text-muted,#64748b); margin-bottom:0.4rem; display:flex; align-items:center; gap:0.3rem; }
.coupon-label i { color:#2563eb; }

.btn-register { width:100%; padding:0.8rem; background:#2563eb; color:white; border:none; border-radius:10px; font-size:0.95rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.45rem; transition:all 0.18s; margin-bottom:0.75rem; }
.btn-register:hover:not(:disabled) { background:#1d4ed8; }
.btn-register:disabled { opacity:0.6; cursor:not-allowed; }

.success-msg { text-align:center; color:#10b981; font-size:0.88rem; font-weight:600; margin:0 0 0.5rem; }
.error-msg   { text-align:center; color:#dc2626; font-size:0.82rem; margin:0 0 0.5rem; }
.divider { margin:1rem 0; border:none; border-top:1px solid var(--border,#e2e8f0); }

.share-label { font-size:0.78rem; color:var(--text-muted,#64748b); margin:0 0 0.5rem; }
.share-btns { display:flex; gap:0.5rem; }
.share-btn { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; border:1px solid var(--border,#e2e8f0); font-size:1rem; cursor:pointer; text-decoration:none; background:var(--bg-subtle,#f8fafc); color:var(--text-muted,#374151); transition:all 0.18s; }
.share-btn:hover { border-color:#2563eb; }
.share-btn.whatsapp:hover { background:#dcfce7; color:#16a34a; border-color:#16a34a; }
.share-btn.linkedin:hover { background:#dbeafe; color:#1d4ed8; border-color:#1d4ed8; }
.copy-confirm { font-size:0.75rem; color:#10b981; margin:0.4rem 0 0; }

.not-found { text-align:center; padding:5rem 2rem; color:var(--text-muted,#475569); }
.not-found h2 { font-size:1.8rem; margin:1rem 0 0.5rem; }
.loading-wrap { padding:1rem; }

@media (max-width:768px) {
  .content { grid-template-columns:1fr; }
  .hero-img { height:220px; }
  .meta-grid { grid-template-columns:1fr; }
  .register-card { position:static; }
}
</style>