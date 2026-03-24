<template>
  <Teleport to="body">
    <!-- Background layer — sits behind everything, z-index: -1 -->
    <Transition name="bg-fade">
      <div
        v-if="settings.background.type !== 'none' && settings.background.url"
        class="site-bg"
        :style="containerStyle"
        aria-hidden="true"
      >
        <!-- Video background -->
        <video
          v-if="settings.background.type === 'video'"
          class="bg-media"
          :src="settings.background.url"
          autoplay
          loop
          muted
          playsinline
        ></video>

        <!-- Image background -->
        <div
          v-else
          class="bg-media bg-image"
          :style="{ backgroundImage: `url(${settings.background.url})` }"
        ></div>

        <!-- Optional dark overlay -->
        <div
          v-if="settings.background.overlay"
          class="bg-overlay"
        ></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

onMounted(() => settings.init())
onUnmounted(() => settings.stop())

const containerStyle = computed(() => ({
  opacity: settings.background.opacity ?? 0.15,
  filter:  settings.background.blur ? `blur(${settings.background.blur}px)` : 'none',
}))
</script>

<style>
/* Global — not scoped so it affects body */
.site-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  transition: opacity 0.6s ease;
}

.bg-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bg-image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.bg-fade-enter-active,
.bg-fade-leave-active { transition: opacity 0.6s ease; }
.bg-fade-enter-from,
.bg-fade-leave-to { opacity: 0 !important; }
</style>
