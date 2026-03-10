<template>
  <div class="club-edit">
    <h2>Edit Club Information</h2>
    <form @submit.prevent="handleUpdate">
      <div class="field">
        <label>Club Name</label>
        <input v-model="form.name" required />
      </div>
      <div class="field">
        <label>Description</label>
        <textarea v-model="form.description" rows="4" required></textarea>
      </div>
      <div class="field">
        <label>Logo URL (or upload later)</label>
        <input v-model="form.logo" placeholder="https://example.com/logo.png" />
      </div>
      <button type="submit" :disabled="updating">{{ updating ? 'Saving...' : 'Update Club' }}</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { db } from '@/services/firebase'
import { doc, updateDoc } from 'firebase/firestore'

const props = defineProps({
  club: { type: Object, required: true }
})
const emit = defineEmits(['updated'])

const updating = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  name: props.club.name || '',
  description: props.club.description || '',
  logo: props.club.logo || ''
})

const handleUpdate = async () => {
  updating.value = true
  error.value = ''
  success.value = ''
  try {
    await updateDoc(doc(db, 'clubs', props.club.id), {
      name: form.name,
      description: form.description,
      logo: form.logo
    })
    success.value = 'Club updated successfully!'
    emit('updated')
  } catch (err) {
    error.value = err.message
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.club-edit { max-width: 600px; margin: 0 auto; }
.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.field input, .field textarea { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
button { width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
button:disabled { opacity: 0.6; }
.error { color: #d32f2f; margin-top: 1rem; }
.success { color: #388e3c; margin-top: 1rem; }
</style>