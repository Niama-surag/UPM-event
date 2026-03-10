<template>
  <div class="scroll-images" ref="sectionRef">
    <div class="image-container" :style="imageStyle"></div>
    <div class="scroll-indicator">Scroll down to change image</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const images = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200'
]

const sectionRef = ref(null)
const scrollY = ref(0)

const updateScroll = () => {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  const sectionTop = rect.top
  const sectionHeight = rect.height
  const viewportHeight = window.innerHeight

  let progress = (viewportHeight - sectionTop) / (viewportHeight + sectionHeight)
  progress = Math.max(0, Math.min(1, progress))
  const index = Math.floor(progress * images.length)
  scrollY.value = Math.min(index, images.length - 1)
}

onMounted(() => {
  window.addEventListener('scroll', updateScroll)
  updateScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll)
})

const imageStyle = computed(() => ({
  backgroundImage: `url(${images[scrollY.value]})`
}))
</script>

<style scoped>
.scroll-images {
  height: 200vh;
  position: relative;
}
.image-container {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  transition: background-image 0.3s ease;
}
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0,0,0,0.5);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 1rem;
  z-index: 10;
}
</style>