<template>
  <span class="status-badge" :style="{ color: cfg.color, background: cfg.bg }">
    {{ cfg.icon }} {{ cfg.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getEventStatus, EVENT_STATUS_CONFIG } from '@/composables/useRBAC'

const props = defineProps({
  event: { type: Object, required: true }
})

const status = computed(() => getEventStatus(props.event))
const cfg    = computed(() => EVENT_STATUS_CONFIG[status.value])
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.7rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
