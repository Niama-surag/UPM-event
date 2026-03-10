<template>
  <span class="badge" :class="type">
    {{ type === 'free' ? ' GRATUIT' : ' PAYANT' }}
  </span>
</template>

<script setup>
// On reçoit le type (free ou paid) du parent
defineProps({
  type: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: bold;
  color: white;
  z-index: 1;
}

.badge.free {
  background: linear-gradient(135deg, #4caf50, #45a049);
}

.badge.paid {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}
</style>
