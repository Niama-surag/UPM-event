<template>
  <div class="create-club-form">
    <h2>Create a New Club</h2>
    <form @submit.prevent="handleCreate">
      <div class="field">
        <label>Club Name</label>
        <input v-model="form.name" required />
      </div>
      <div class="field">
        <label>Description</label>
        <textarea v-model="form.description" rows="4" required></textarea>
      </div>
      <div class="field">
        <label>Logo URL (optional)</label>
        <input v-model="form.logo" placeholder="https://example.com/logo.png" />
      </div>
      <button type="submit" :disabled="creating">{{ creating ? 'Creating...' : 'Create Club' }}</button>
      <button type="button" @click="$emit('cancel')">Cancel</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { db } from '@/services/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const emit = defineEmits(['created', 'cancel'])

const creating = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  description: '',
  logo: ''
})

const handleCreate = async () => {
  creating.value = true
  error.value = ''
  try {
    await addDoc(collection(db, 'clubs'), {
      name: form.name,
      description: form.description,
      logo: form.logo || '',
      leaderId: authStore.user.uid,
      members: [authStore.user.uid], // creator becomes first member
      status: 'pending', // requires admin approval
      createdAt: new Date().toISOString()
    })
    emit('created')
  } catch (err) {
    error.value = err.message
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.create-club-form { max-width: 600px; margin: 2rem auto; padding: 2rem; border: 1px solid #ddd; border-radius: 8px; background: #fff; }
.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.field input, .field textarea { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
button { margin-right: 1rem; padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
button[type="button"] { background: #6c757d; }
.error { color: #d32f2f; margin-top: 1rem; }
</style>