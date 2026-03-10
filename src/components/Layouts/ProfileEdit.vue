<template>
  <div class="profile-edit">
    <h2>Edit Profile</h2>
    <form @submit.prevent="handleUpdate">
      <div class="avatar-section">
        <div class="avatar-preview">
          <img :src="previewImage || authStore.userProfile?.photoURL || defaultAvatar" alt="avatar" />
        </div>
        <label for="photo-upload" class="upload-btn"><i class="fas fa-camera"></i> Change Photo</label>
        <input type="file" id="photo-upload" accept="image/*" @change="handleFileChange" style="display:none" />
      </div>
      <div class="field">
        <label>Name</label>
        <input v-model="form.name" required />
      </div>
      <button type="submit" :disabled="updating">{{ updating ? 'Saving...' : 'Update Profile' }}</button>
    </form>

    <hr />
    <h2>Change Password</h2>
    <form @submit.prevent="handleChangePassword">
      <div class="field">
        <label>Current Password</label>
        <input type="password" v-model="passwordForm.current" required />
      </div>
      <div class="field">
        <label>New Password</label>
        <input type="password" v-model="passwordForm.new" required />
      </div>
      <div class="field">
        <label>Confirm New Password</label>
        <input type="password" v-model="passwordForm.confirm" required />
      </div>
      <button type="submit" :disabled="changing">{{ changing ? 'Changing...' : 'Change Password' }}</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'

const authStore = useAuthStore()
const auth = getAuth()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const updating = ref(false)
const changing = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  name: authStore.userProfile?.name || authStore.user?.displayName || ''
})

const selectedFile = ref(null)
const previewImage = ref(null)

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => (previewImage.value = e.target.result)
    reader.readAsDataURL(file)
  }
}

const handleUpdate = async () => {
  updating.value = true
  error.value = ''
  success.value = ''
  try {
    await authStore.updateUserProfile({
      name: form.name,
      photoFile: selectedFile.value
    })
    success.value = 'Profile updated!'
    selectedFile.value = null
    previewImage.value = null
  } catch (err) {
    error.value = err.message
  } finally {
    updating.value = false
  }
}

const handleChangePassword = async () => {
  if (passwordForm.new !== passwordForm.confirm) {
    error.value = 'New passwords do not match'
    return
  }
  changing.value = true
  error.value = ''
  success.value = ''
  try {
    const user = auth.currentUser
    const credential = EmailAuthProvider.credential(user.email, passwordForm.current)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, passwordForm.new)
    success.value = 'Password changed successfully!'
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
  } catch (err) {
    error.value = err.message
  } finally {
    changing.value = false
  }
}
</script>

<style scoped>
.profile-edit { max-width: 500px; margin: 0 auto; }
.avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; }
.avatar-preview { width: 150px; height: 150px; border-radius: 50%; overflow: hidden; border: 3px solid #007bff; margin-bottom: 1rem; }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.upload-btn { background: #f0f0f0; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.field input { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
button { width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; }
button:disabled { opacity: 0.6; }
hr { margin: 2rem 0; }
.error { color: #d32f2f; margin-top: 1rem; text-align: center; }
.success { color: #388e3c; margin-top: 1rem; text-align: center; }
</style>