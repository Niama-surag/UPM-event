<template>
  <div class="create-event">
    <h1>➕ Créer un événement</h1>
    
    <form @submit.prevent="submitForm" class="event-form">
      
      <!-- Titre -->
      <div class="form-group">
        <label>Titre de l'événement *</label>
        <input type="text" v-model="form.title" required>
      </div>
      
      <!-- Description -->
      <div class="form-group">
        <label>Description *</label>
        <textarea v-model="form.description" rows="4" required></textarea>
      </div>
      
      <!-- Date -->
      <div class="form-group">
        <label>Date *</label>
        <input type="date" v-model="form.date" required>
      </div>
      
      <!-- Type et prix -->
      <div class="form-row">
        <div class="form-group">
          <label>Type *</label>
          <select v-model="form.type">
            <option value="free">Gratuit</option>
            <option value="paid">Payant</option>
          </select>
        </div>
        
        <div class="form-group" v-if="form.type === 'paid'">
          <label>Prix (€) *</label>
          <input type="number" v-model="form.price" min="0" step="0.01" required>
        </div>
      </div>
      
      <!-- Image Uploader (ton composant) -->
      <div class="form-group">
        <label>Image de l'événement *</label>
        <ImageUploader v-model="form.imageURL" />
        <p v-if="submitted && !form.imageURL" class="error">
          L'image est obligatoire
        </p>
      </div>
      
      <!-- Bouton -->
      <button type="submit" :disabled="loading">
        {{ loading ? 'Création...' : 'Créer événement' }}
      </button>
      
      <!-- Messages -->
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">✅ Événement créé !</p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const success = ref(false)
const submitted = ref(false)

const form = reactive({
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  type: 'free',
  price: 0,
  imageURL: ''
})

const submitForm = async () => {
  submitted.value = true
  error.value = ''
  
  if (!form.imageURL) {
    error.value = 'Veuillez ajouter une image'
    return
  }
  
  loading.value = true
  
  try {
    const eventData = {
      ...form,
      price: form.type === 'free' ? 0 : Number(form.price),
      createdAt: new Date().toISOString()
    }
    
    await addDoc(collection(db, "events"), eventData)
    success.value = true
    
    setTimeout(() => {
      router.push('/')
    }, 2000)
    
  } catch (err) {
    error.value = "Erreur lors de la création"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-event {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.event-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 15px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  color: #ff4444;
}
.success {
  color: #4caf50;
}
</style>