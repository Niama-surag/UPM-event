<template>
  <div class="coupon-manager">
    <div class="cm-header">
      <h4><i class="fas fa-ticket-alt"></i> Coupons / Tickets</h4>
      <button @click="showForm = !showForm" class="btn-primary-sm">
        <i class="fas fa-plus"></i> New Coupon
      </button>
    </div>

    <!-- Create form -->
    <Transition name="slide-down">
      <div v-if="showForm" class="coupon-form">
        <div class="form-row">
          <div class="field">
            <label>Code *</label>
            <input
              v-model="form.code"
              placeholder="e.g. UPMFREE"
              @input="form.code = form.code.toUpperCase()"
              maxlength="20"
            />
          </div>
          <div class="field">
            <label>Discount Type *</label>
            <select v-model="form.discountType">
              <option value="percent">Percentage (%)</option>
              <option value="free">100% Free</option>
            </select>
          </div>
        </div>

        <div class="form-row" v-if="form.discountType === 'percent'">
          <div class="field">
            <label>Discount % *</label>
            <input type="number" v-model="form.discountValue" min="1" max="99" placeholder="e.g. 50" />
          </div>
          <div class="field">
            <label>Usage Limit (0 = unlimited)</label>
            <input type="number" v-model="form.usageLimit" min="0" placeholder="0" />
          </div>
        </div>
        <div class="form-row" v-else>
          <div class="field">
            <label>Usage Limit (0 = unlimited)</label>
            <input type="number" v-model="form.usageLimit" min="0" placeholder="0" />
          </div>
        </div>

        <div class="field">
          <label>Expiry Date (optional)</label>
          <input type="datetime-local" v-model="form.expiresAt" />
        </div>

        <div class="form-actions">
          <button @click="createCoupon" :disabled="creating" class="btn-primary-sm">
            {{ creating ? 'Creating…' : 'Create Coupon' }}
          </button>
          <button @click="showForm = false" class="btn-ghost-sm">Cancel</button>
        </div>
        <p v-if="formError" class="err-msg"><i class="fas fa-exclamation-circle"></i> {{ formError }}</p>
      </div>
    </Transition>

    <!-- Coupon list -->
    <div v-if="loading" class="loading-text">Loading coupons…</div>
    <div v-else-if="coupons.length === 0" class="empty-coupons">
      No coupons created yet for this event.
    </div>
    <div v-else class="coupon-list">
      <div v-for="c in coupons" :key="c.id" class="coupon-chip" :class="{ inactive: !c.isActive }">
        <div class="coupon-code">{{ c.code }}</div>
        <div class="coupon-meta">
          <span class="discount-tag" :class="c.discountType">
            {{ c.discountType === 'free' ? 'FREE' : c.discountValue + '% off' }}
          </span>
          <span class="usage-tag">
            {{ c.usageCount }} / {{ c.usageLimit || '∞' }} used
          </span>
          <span v-if="c.expiresAt" class="expiry-tag" :class="{ expired: isExpired(c.expiresAt) }">
            <i class="fas fa-clock"></i>
            {{ formatExpiry(c.expiresAt) }}
          </span>
        </div>
        <button
          v-if="c.isActive"
          @click="deactivate(c.id)"
          class="btn-deactivate"
          title="Deactivate coupon"
        >
          <i class="fas fa-ban"></i>
        </button>
        <span v-else class="inactive-label">Inactive</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCouponStore } from '@/stores/coupons'
import { useAuthStore }   from '@/stores/auth'

const props = defineProps({
  eventId: { type: String, required: true },
  clubId:  { type: String, required: true }
})

const couponStore = useCouponStore()
const authStore   = useAuthStore()

const coupons  = ref([])
const loading  = ref(true)
const creating = ref(false)
const showForm = ref(false)
const formError = ref('')

const form = ref({
  code: '', discountType: 'percent', discountValue: 50,
  usageLimit: 10, expiresAt: ''
})

onMounted(async () => {
  coupons.value = await couponStore.fetchEventCoupons(props.eventId)
  loading.value = false
})

const createCoupon = async () => {
  creating.value = true; formError.value = ''
  try {
    const coupon = await couponStore.createCoupon({
      eventId:       props.eventId,
      clubId:        props.clubId,
      code:          form.value.code,
      discountType:  form.value.discountType,
      discountValue: form.value.discountValue,
      usageLimit:    form.value.usageLimit,
      expiresAt:     form.value.expiresAt || null,
      createdBy:     authStore.user.uid
    })
    coupons.value.unshift(coupon)
    showForm.value = false
    form.value = { code: '', discountType: 'percent', discountValue: 50, usageLimit: 10, expiresAt: '' }
  } catch (e) {
    formError.value = e.message
  } finally {
    creating.value = false
  }
}

const deactivate = async (id) => {
  await couponStore.deactivateCoupon(id)
  const c = coupons.value.find(x => x.id === id)
  if (c) c.isActive = false
}

const isExpired = (val) => {
  if (!val) return false
  const d = val.toDate ? val.toDate() : new Date(val)
  return new Date() > d
}

const formatExpiry = (val) => {
  if (!val) return ''
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.coupon-manager { margin-top: 1.25rem; }
.cm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.cm-header h4 { font-size: 0.9rem; font-weight: 700; color: var(--text-base, #1e293b); margin: 0; display: flex; align-items: center; gap: 0.4rem; }
.cm-header h4 i { color: #2563eb; }

.coupon-form { background: var(--bg-subtle, #f8fafc); border-radius: 10px; padding: 1.25rem; border: 1.5px solid var(--border, #e2e8f0); margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.field { margin-bottom: 0.75rem; }
.field label { display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted, #64748b); margin-bottom: 0.25rem; }
.field input, .field select { width: 100%; padding: 0.55rem 0.75rem; border: 1.5px solid var(--border, #e2e8f0); border-radius: 8px; font-size: 0.85rem; outline: none; background: var(--bg-surface, #fff); color: var(--text-base, #1e293b); box-sizing: border-box; }
.field input:focus, .field select:focus { border-color: #2563eb; }
.form-actions { display: flex; gap: 0.6rem; }
.err-msg { color: #dc2626; font-size: 0.78rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.3rem; }

/* Coupon list */
.coupon-list { display: flex; flex-direction: column; gap: 0.5rem; }
.coupon-chip {
  display: flex; align-items: center; gap: 0.75rem;
  background: var(--bg-surface, #fff);
  border: 1.5px dashed #2563eb;
  border-radius: 10px; padding: 0.75rem 1rem;
  transition: opacity 0.2s;
}
.coupon-chip.inactive { border-color: var(--border, #e2e8f0); opacity: 0.6; }
.coupon-code { font-family: 'Courier New', monospace; font-weight: 700; font-size: 0.95rem; color: #2563eb; min-width: 80px; }
.coupon-meta { flex: 1; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
.discount-tag { padding: 0.15rem 0.55rem; border-radius: 12px; font-size: 0.72rem; font-weight: 700; }
.discount-tag.percent { background: #eff6ff; color: #2563eb; }
.discount-tag.free    { background: #ecfdf5; color: #059669; }
.usage-tag   { font-size: 0.72rem; color: var(--text-faint, #94a3b8); }
.expiry-tag  { font-size: 0.7rem; color: #64748b; display: flex; align-items: center; gap: 0.2rem; }
.expiry-tag.expired { color: #dc2626; }
.btn-deactivate { background: none; border: 1px solid #fecaca; border-radius: 6px; color: #dc2626; padding: 0.2rem 0.55rem; font-size: 0.75rem; cursor: pointer; transition: background 0.15s; }
.btn-deactivate:hover { background: #fef2f2; }
.inactive-label { font-size: 0.72rem; color: var(--text-faint, #94a3b8); }

.empty-coupons { font-size: 0.82rem; color: var(--text-faint, #94a3b8); padding: 0.5rem 0; }
.loading-text  { font-size: 0.82rem; color: var(--text-faint, #94a3b8); }

/* Transitions */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); max-height: 0; }
.slide-down-enter-to, .slide-down-leave-from { max-height: 600px; }

/* Shared button styles */
.btn-primary-sm { padding: 0.48rem 1rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; }
.btn-primary-sm:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary-sm:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost-sm { padding: 0.48rem 0.9rem; background: none; border: 1.5px solid var(--border, #e2e8f0); color: var(--text-muted, #64748b); border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.btn-ghost-sm:hover { border-color: #2563eb; color: #2563eb; }
</style>
