<template>
  <span class="role-badge" :style="{ color: config.color, background: config.bg }">
    {{ config.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { ROLE_CONFIG } from '@/composables/useRBAC'

const props = defineProps({
  role: { type: String, required: true }
})

const config = computed(() =>
  ROLE_CONFIG[props.role] ?? { label: props.role, color: '#64748b', bg: '#f8fafc' }
)
</script>

<style scoped>
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.6rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
