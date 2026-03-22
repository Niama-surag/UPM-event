<template>
  <div class="event-detail">

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading">
      <div class="skeleton" style="height:320px; border-radius:16px; margin-bottom:2rem;"></div>
      <div class="skeleton" style="height:2.5rem; width:55%; margin-bottom:1rem;"></div>
      <div class="skeleton" style="height:1rem; width:35%; margin-bottom:2rem;"></div>
      <div style="display:grid; grid-template-columns:1fr 320px; gap:2rem;">
        <div>
          <div class="skeleton" style="height:1rem; margin-bottom:0.5rem;"></div>
          <div class="skeleton" style="height:1rem; margin-bottom:0.5rem; width:80%;"></div>
          <div class="skeleton" style="height:1rem; width:60%;"></div>
        </div>
        <div class="skeleton" style="height:200px; border-radius:12px;"></div>
      </div>
    </div>

    <!-- Event not found -->
    <div v-else-if="!event" class="not-found">
      <div style="font-size:4rem;">🔍</div>
      <h2>Event not found</h2>
      <p>This event may have been deleted or the link is invalid.</p>
      <router-link to="/events" class="btn btn-primary">← Back to Events</router-link>
    </div>

    <!-- Event content -->
    <div v-else>
      <!-- Hero image -->
      <div class="hero">
        <img
          :src="event.imageURL || 'https://via.placeholder.com/1200x400?text=UPM+Event'"
          :alt="event.title"
          class="hero-img"
          @error="$event.target.src = 'https://via.placeholder.com/1200x400?text=UPM+Event'"
        />
        <span class="badge" :class="event.type">
          {{ event.type === 'free' ? 'GRATUIT' : 'PAYANT' }}
        </span>
      </div>

      <!-- Content grid -->
      <div class="content">
        <!-- Left: main info -->
        <div class="main-info">
          <h1>{{ event.title }}</h1>
          <p class="description">{{ event.description }}</p>

          <div class="meta-grid">
            <div class="meta-item">
              <i class="fas fa-calendar-alt"></i>
              <div>
                <strong>Date &amp; Heure</strong>
                <span>{{ formatDate(event.startTime) }}</span>
              </div>
            </div>
            <div class="meta-item">
              <i class="fas fa-map-marker-alt"></i>
              <div>
                <strong>Lieu</strong>
                <span>{{ event.location || 'Non précisé' }}</span>
              </div>
            </div>
            <div class="meta-item">
              <i class="fas fa-tag"></i>
              <div>
                <strong>Prix</strong>
                <span>{{ event.price === 0 || !event.price ? 'Gratuit' : event.price + '€' }}</span>
              </div>
            </div>
            <div class="meta-item" v-if="clubName">
              <i class="fas fa-users"></i>
              <div>
                <strong>Club organisateur</strong>
                <span>{{ clubName }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: registration card -->
        <div class="sidebar">
          <div class="register-card">
            <h3>Participer à cet événement</h3>

            <p class="price-tag" :class="{ free: !event.price || event.price === 0 }">
              {{ !event.price || event.price === 0 ? 'Gratuit' : event.price + '€' }}
            </p>

            <button
              class="btn btn-primary"
              style="width:100%; margin-bottom:0.75rem;"
              @click="registerForEvent"
              :disabled="isRegistered || registering"
            >
              <i class="fas" :class="isRegistered ? 'fa-check-circle' : 'fa-ticket-alt'"></i>
              {{ isRegistered ? 'Déjà inscrit ✓' : registering ? 'Inscription...' : "S'inscrire" }}
            </button>

            <p v-if="registerSuccess" class="success" style="text-align:center;">
              🎉 Inscription confirmée !
            </p>
            <p v-if="registerError" class="error" style="text-align:center;">
              {{ registerError }}
            </p>

            <hr style="margin: 1rem 0; border:none; border-top:1px solid #e2e8f0;" />

            <div class="share-section">
              <p style="font-size:0.85rem; color:#64748b; margin-bottom:0.5rem;">Partager cet événement</p>
              <div style="display:flex; gap:0.5rem;">
                <a :href="`https://wa.me/?text=${encodeURIComponent(event.title + ' - ' + currentUrl)}`"
                   target="_blank" class="share-btn whatsapp">
                  <i class="fab fa-whatsapp"></i>
                </a>
                <a :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`"
                   target="_blank" class="share-btn linkedin">
                  <i class="fab fa-linkedin"></i>
                </a>
                <button class="share-btn copy" @click="copyLink">
                  <i class="fas fa-link"></i>
                </button>
              </div>
              <p v-if="copied" style="font-size:0.8rem; color:#10b981; margin-top:0.4rem;">Link copied! ✓</p>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:2rem;">
        <router-link to="/events" class="btn btn-secondary">
          ← Retour aux événements
        </router-link>
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

const route = useRoute()
const authStore = useAuthStore()

const event = ref(null)
const loading = ref(true)
const clubName = ref('')
const isRegistered = ref(false)
const registering = ref(false)
const registerSuccess = ref(false)
const registerError = ref('')
const copied = ref(false)
const currentUrl = window.location.href

onMounted(async () => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', route.params.id))
    if (eventDoc.exists()) {
      event.value = { id: eventDoc.id, ...eventDoc.data() }

      // Fetch club name
      if (event.value.clubId) {
        const clubDoc = await getDoc(doc(db, 'clubs', event.value.clubId))
        if (clubDoc.exists()) clubName.value = clubDoc.data().name
      }

      // Check if already registered
      if (authStore.user) {
        const regSnap = await getDocs(query(
          collection(db, 'registrations'),
          where('userid', '==', authStore.user.uid),
          where('eventsid', '==', route.params.id)
        ))
        isRegistered.value = !regSnap.empty
      }
    }
  } catch (err) {
    console.error('Error loading event:', err)
  } finally {
    loading.value = false
  }
})

const registerForEvent = async () => {
  if (!authStore.user) return
  registering.value = true
  registerError.value = ''
  try {
    await addDoc(collection(db, 'registrations'), {
      userid: authStore.user.uid,
      eventsid: route.params.id,
      registeredAt: new Date().toISOString()
    })
    isRegistered.value = true
    registerSuccess.value = true
  } catch (err) {
    registerError.value = "Erreur lors de l'inscription"
  } finally {
    registering.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = false
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Date non précisée'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.event-detail {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

/* Hero */
.hero {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 2rem;
  background: #f1f5f9;
}
.hero-img {
  width: 100%;
  height: 380px;
  object-fit: cover;
  display: block;
}
.badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
  color: white;
  text-transform: uppercase;
}
.badge.free { background: #10b981; }
.badge.paid { background: #f59e0b; color: #1f2937; }

/* Content layout */
.content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}

/* Main info */
.main-info h1 {
  font-size: 2rem;
  margin: 0 0 1rem;
  color: #1e293b;
  line-height: 1.3;
}
.description {
  color: #475569;
  line-height: 1.8;
  margin-bottom: 2rem;
  font-size: 1.05rem;
}
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.meta-item i {
  color: #2563eb;
  font-size: 1.2rem;
  margin-top: 0.15rem;
  min-width: 20px;
}
.meta-item div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.meta-item strong {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}
.meta-item span {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
}

/* Register card */
.register-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  padding: 1.5rem;
  position: sticky;
  top: 5rem;
}
.register-card h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1e293b;
}
.price-tag {
  font-size: 2rem;
  font-weight: bold;
  color: #2563eb;
  margin: 0 0 1rem;
}
.price-tag.free { color: #10b981; }

/* Share buttons */
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 1.1rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  background: #f8fafc;
  color: #374151;
}
.share-btn:hover { background: #e2e8f0; }
.share-btn.whatsapp:hover { background: #dcfce7; color: #16a34a; }
.share-btn.linkedin:hover { background: #dbeafe; color: #1d4ed8; }

/* Not found */
.not-found {
  text-align: center;
  padding: 5rem 2rem;
  color: #475569;
}
.not-found h2 { font-size: 1.8rem; margin: 1rem 0 0.5rem; color: #1e293b; }
.not-found p { margin-bottom: 2rem; }

/* Loading */
.loading {
  padding: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content { grid-template-columns: 1fr; }
  .hero-img { height: 220px; }
  .meta-grid { grid-template-columns: 1fr; }
  .register-card { position: static; }
  .main-info h1 { font-size: 1.5rem; }
}
</style>
