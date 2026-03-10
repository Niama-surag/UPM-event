<template>
  <div class="event-card" @click="goToDetail">
    <div class="image-container">
      <img 
        :src="event.imageURL || 'https://via.placeholder.com/300x200?text=UPM+Event'" 
        :alt="event.title"
      >
      <BadgeStatus :type="event.type" />
    </div>
    
    <div class="content">
      <h3>{{ event.title }}</h3>
      <p class="description">{{ shortDescription }}</p>
      
      <div class="details">
        <span class="date">📅 {{ formatDate(event.date) }}</span>
        <span class="price" :class="{ free: event.price === 0 }">
          {{ event.price === 0 || !event.price ? 'Gratuit' : event.price + '€' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BadgeStatus from './BadgeStatus.vue'

const props = defineProps({
  event: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/event/${props.event.id}`)
}

const shortDescription = computed(() => {
  if (!props.event.description) return ''
  return props.event.description.length > 80 
    ? props.event.description.substring(0, 80) + '...' 
    : props.event.description
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}
</script>

<style scoped>
.event-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-container {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  padding: 15px;
}

.content h3 {
  margin: 0 0 8px 0;
  font-size: 1.1em;
  color: #333;
}

.description {
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
  margin-bottom: 12px;
  height: 40px;
  overflow: hidden;
}

.details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.date {
  color: #888;
}

.price {
  font-weight: bold;
  color: #42b983;
}

.price.free {
  color: #4caf50;
}
</style>