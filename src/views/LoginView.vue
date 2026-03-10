<template>
  <div class="auth-container">
    <h2>Sign In</h2>

    <form @submit.prevent="handleLogin">
      <div class="field">
        <label for="email">Email: *</label>
        <input type="email" id="email" v-model="email" placeholder="jheart@dx-email.com" required />
      </div>
      <div class="field">
        <label for="password">Password: *</label>
        <input type="password" id="password" v-model="password" placeholder="*********" required />
      </div>
      <div class="remember-row">
        <label><input type="checkbox" v-model="remember" /> Remember me</label>
        <a href="#" @click.prevent="handleForgotPassword">Forgot password?</a>
      </div>
      <button type="submit" :disabled="loading" class="signin-btn">Sign In</button>
    </form>

    <p class="register-link">Don't have an account? <router-link to="/register">Register</router-link></p>

    <div class="divider">or</div>

    <div class="social-buttons">
      <button @click="handleGoogleLogin" :disabled="loading" class="social-btn google">
        <i class="fab fa-google"></i> Sign In with Google
      </button>
      <button @click="handleMicrosoftLogin" :disabled="loading" class="social-btn microsoft">
        <i class="fab fa-microsoft"></i> Sign In with Microsoft
      </button>
      <button @click="handleLinkedInLogin" :disabled="loading" class="social-btn linkedin">
        <i class="fab fa-linkedin"></i> Sign In with LinkedIn
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(email.value, password.value, remember.value)
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.googleLogin()
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleMicrosoftLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.microsoftLogin()
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleLinkedInLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.linkedinLogin()
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address first.'
    return
  }
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await authStore.resetPassword(email.value)
    successMessage.value = 'Password reset email sent! Check your inbox.'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}
h2 { margin-top: 0; margin-bottom: 1.5rem; }
.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.field input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}
.remember-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.remember-row a { color: #007bff; text-decoration: none; }
.remember-row a:hover { text-decoration: underline; }
.signin-btn {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
.signin-btn:disabled { opacity: 0.6; }
.register-link { text-align: center; margin: 1rem 0; }
.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}
.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #ddd;
}
.divider::before { left: 0; }
.divider::after { right: 0; }
.social-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  font-size: 1rem;
  cursor: pointer;
}
.social-btn:hover { background: #f5f5f5; }
.social-btn:disabled { opacity: 0.6; }
.social-btn i { font-size: 1.2rem; }
.error { color: #d32f2f; margin-top: 1rem; text-align: center; }
.success { color: #388e3c; margin-top: 1rem; text-align: center; }
</style>