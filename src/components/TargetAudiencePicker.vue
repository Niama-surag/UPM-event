<template>
  <!-- TargetAudiencePicker.vue
       Usage:
         <TargetAudiencePicker v-model="event.targetAudience" />

       modelValue: string[] — e.g. ["all"] or ["engineering","business"]
  -->
  <div class="tap-root">
    <label class="tap-label">
      <i class="fas fa-bullseye"></i>
      Target Audience
      <span class="tap-hint">Who can see this event?</span>
    </label>

    <div class="tap-options">
      <button
        v-for="opt in OPTIONS"
        :key="opt.value"
        type="button"
        class="tap-option"
        :class="{
          selected: isSelected(opt.value),
          'is-all': opt.value === 'all'
        }"
        @click="toggle(opt.value)"
      >
        <span class="tap-icon">{{ opt.icon }}</span>
        <span class="tap-name">{{ opt.label }}</span>
        <i v-if="isSelected(opt.value)" class="fas fa-check tap-check"></i>
      </button>
    </div>

    <p v-if="modelValue.length === 0" class="tap-warn">
      <i class="fas fa-exclamation-triangle"></i>
      Select at least one audience group.
    </p>

    <!-- Live summary -->
    <div class="tap-summary" v-if="modelValue.length > 0">
      <i class="fas fa-info-circle"></i>
      Visible to:
      <strong>{{ summaryText }}</strong>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => ['all'] }
})
const emit = defineEmits(['update:modelValue'])

// ── Audience options ──────────────────────────────────────────
const OPTIONS = [
  { value: 'all',         label: 'Open to All',     icon: '🌍' },
  { value: 'engineering', label: 'Engineering',      icon: '⚙️' },
  { value: 'business',    label: 'Business',         icon: '💼' },
  { value: 'health',      label: 'Health Sciences',  icon: '🏥' },
  { value: 'law',         label: 'Law',              icon: '⚖️' },
  { value: 'arts',        label: 'Arts & Design',    icon: '🎨' },
]

const isSelected = (val) => props.modelValue.includes(val)

const toggle = (val) => {
  let next = [...props.modelValue]

  if (val === 'all') {
    // "All" is exclusive — selecting it clears others
    next = next.includes('all') ? [] : ['all']
  } else {
    // Selecting a specific field removes "all"
    next = next.filter(v => v !== 'all')
    if (next.includes(val)) {
      next = next.filter(v => v !== val)
    } else {
      next.push(val)
    }
    // If nothing selected, default back to "all"
    if (next.length === 0) next = ['all']
  }

  emit('update:modelValue', next)
}

const summaryText = computed(() => {
  if (props.modelValue.includes('all')) return 'everyone'
  return props.modelValue
    .map(v => OPTIONS.find(o => o.value === v)?.label || v)
    .join(', ')
})
</script>

<style scoped>
.tap-root { width: 100%; }

.tap-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-base, #374151);
  margin-bottom: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tap-label i { color: #2563eb; }

.tap-hint {
  font-weight: 400;
  text-transform: none;
  color: var(--text-muted, #94a3b8);
  letter-spacing: 0;
  margin-left: 0.25rem;
  font-size: 0.78rem;
}

.tap-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tap-option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.9rem;
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 20px;
  background: var(--bg-subtle, #f8fafc);
  color: var(--text-muted, #475569);
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
  user-select: none;
}

.tap-option:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.tap-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.tap-option.is-all.selected {
  border-color: #059669;
  background: #ecfdf5;
  color: #059669;
}

.tap-icon { font-size: 1rem; line-height: 1; }

.tap-check {
  font-size: 0.7rem;
  margin-left: 0.15rem;
}

.tap-warn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: #d97706;
}

.tap-summary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: var(--text-muted, #64748b);
  background: var(--bg-subtle, #f8fafc);
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border, #e2e8f0);
}

.tap-summary i { color: #2563eb; }
</style>
