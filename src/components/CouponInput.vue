<template>
  <div class="coupon-input">
    <div class="input-row">
      <input
        v-model="code"
        placeholder="Enter coupon code…"
        @keyup.enter="apply"
        :disabled="applied || loading"
        class="coupon-field"
        :class="{ valid: applied, invalid: error }"
      />
      <button
        @click="applied ? clear() : apply()"
        :disabled="loading || (!code.trim() && !applied)"
        class="coupon-btn"
        :class="{ clear: applied }"
      >
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        <i v-else-if="applied" class="fas fa-times"></i>
        <i v-else class="fas fa-tag"></i>
        {{ loading ? '' : applied ? 'Remove' : 'Apply' }}
      </button>
    </div>

    <!-- Success -->
    <Transition name="fade">
      <div v-if="applied" class="coupon-success">
        <i class="fas fa-check-circle"></i>
        <div>
          <strong>{{ couponResult.coupon.code }}</strong> applied!
          <span v-if="couponResult.coupon.discountType === 'free'">
            → Event is now <strong>FREE</strong>
          </span>
          <span v-else>
            → {{ couponResult.coupon.discountValue }}% off
            → New price: <strong>€{{ couponResult.finalPrice.toFixed(2) }}</strong>
          </span>
        </div>
      </div>
    </Transition>

    <!-- Error -->
    <Transition name="fade">
      <p v-if="error" class="coupon-error">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </p>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCouponStore } from '@/stores/coupons'

const props = defineProps({
  eventId:  { type: String, required: true },
  basePrice: { type: Number, default: 0 }
})

const emit = defineEmits(['applied', 'cleared'])

const couponStore  = useCouponStore()
const code         = ref('')
const loading      = ref(false)
const error        = ref('')
const applied      = ref(false)
const couponResult = ref(null)

const apply = async () => {
  if (!code.value.trim()) return
  loading.value = true; error.value = ''
  try {
    const result = await couponStore.validateCoupon(code.value, props.eventId, props.basePrice)
    if (!result.valid) {
      error.value = result.error
    } else {
      applied.value      = true
      couponResult.value = result
      emit('applied', result)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const clear = () => {
  code.value         = ''
  applied.value      = false
  couponResult.value = null
  error.value        = ''
  emit('cleared')
}
</script>

<style scoped>
.coupon-input { margin-top: 0.5rem; }
.input-row { display: flex; gap: 0.5rem; }
.coupon-field {
  flex: 1; padding: 0.6rem 0.85rem;
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 8px; font-size: 0.88rem; outline: none;
  font-family: 'Courier New', monospace; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  background: var(--bg-surface, #fff); color: var(--text-base, #1e293b);
  transition: border-color 0.18s;
}
.coupon-field:focus { border-color: #2563eb; }
.coupon-field.valid   { border-color: #10b981; background: #f0fdf4; }
.coupon-field.invalid { border-color: #dc2626; }
.coupon-field:disabled { opacity: 0.7; }

.coupon-btn {
  padding: 0.6rem 1rem; border-radius: 8px; border: none;
  background: #2563eb; color: white; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 0.35rem;
  white-space: nowrap; transition: background 0.18s;
}
.coupon-btn:hover:not(:disabled) { background: #1d4ed8; }
.coupon-btn.clear { background: #dc2626; }
.coupon-btn.clear:hover { background: #b91c1c; }
.coupon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.coupon-success {
  display: flex; align-items: flex-start; gap: 0.4rem;
  margin-top: 0.6rem; padding: 0.65rem 0.9rem;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 8px; font-size: 0.82rem; color: #15803d;
}
.coupon-success i { font-size: 0.9rem; margin-top: 2px; }

.coupon-error {
  display: flex; align-items: center; gap: 0.35rem;
  margin-top: 0.5rem; font-size: 0.8rem; color: #dc2626;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
