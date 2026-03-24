<template>
  <button
    class="theme-toggle"
    @click="themeStore.toggle()"
    :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :aria-label="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <Transition name="icon-swap" mode="out-in">
      <i v-if="themeStore.isDark" key="sun"  class="fas fa-sun"></i>
      <i v-else                   key="moon" class="fas fa-moon"></i>
    </Transition>
  </button>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--bg-surface, #f1f5f9);
  border: 1.5px solid var(--border, #e2e8f0);
  color: var(--text-muted, #64748b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.88rem;
  transition: all 0.18s;
  flex-shrink: 0;
}
.theme-toggle:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

/* Icon swap transition */
.icon-swap-enter-active,
.icon-swap-leave-active { transition: all 0.15s ease; }
.icon-swap-enter-from   { opacity: 0; transform: rotate(-90deg) scale(0.7); }
.icon-swap-leave-to     { opacity: 0; transform: rotate(90deg) scale(0.7); }
</style>
