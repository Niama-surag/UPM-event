<template>
  <div class="login-page">
    <!-- Full-screen background -->
    <div class="login-bg" :style="{ backgroundImage: `url(${bgImage})` }"></div>
    <div class="login-overlay"></div>

    <div class="login-card">
      <!-- Logo / Brand -->
      <div class="login-brand">
        <span class="brand-icon">🎓</span>
        <span class="brand-name">UPM<span class="accent">Event</span></span>
      </div>

      <h2>Welcome Back</h2>
      <p class="login-sub">Sign in to your campus account</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="email">Email</label>
          <div class="input-wrap">
            <i class="fas fa-envelope"></i>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="your@upm.ac.ma"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="input-wrap">
            <i class="fas fa-lock"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
            <button type="button" class="eye-toggle" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="remember-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="remember" />
            <span>Remember me</span>
          </label>
          <button type="button" class="forgot-link" @click="handleForgotPassword">
            Forgot password?
          </button>
        </div>

        <button type="submit" :disabled="loading" class="btn-signin">
          <span v-if="!loading">Sign In <i class="fas fa-arrow-right"></i></span>
          <span v-else><i class="fas fa-spinner fa-spin"></i> Signing in…</span>
        </button>
      </form>

      <p class="register-hint">
        No account?
        <router-link to="/register">Create one free</router-link>
      </p>

      <div class="divider"><span>or continue with</span></div>

      <div class="social-grid">
        <button @click="handleGoogleLogin" :disabled="loading" class="social-btn" title="Google">
          <i class="fab fa-google"></i>
          <span>Google</span>
        </button>
        <button @click="handleMicrosoftLogin" :disabled="loading" class="social-btn" title="Microsoft">
          <i class="fab fa-microsoft"></i>
          <span>Microsoft</span>
        </button>
        <button @click="handleLinkedInLogin" :disabled="loading" class="social-btn" title="LinkedIn">
          <i class="fab fa-linkedin"></i>
          <span>LinkedIn</span>
        </button>
      </div>

      <Transition name="fade">
        <p v-if="error" class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>
      </Transition>
      <Transition name="fade">
        <p v-if="successMessage" class="success-msg"><i class="fas fa-check-circle"></i> {{ successMessage }}</p>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

// ── Background image ──────────────────────────────────────────
// Using the provided URL. For production, download and put in /public/login-bg.jpg
const bgImage = 'https://st.perplexity.ai/estatic/0b226c450798410ac541646c86ec31afd840e5beab817a5d84fa821e7db61981ec84c3b4a3f072a7a2e1899c9fb06c6ee188b36952e5e79a35e5b8058ab7a9c62bef32ea31b50d428860cdffb1aa35243b4aba664ce131bdbabfc433871a378d'

const authStore = useAuthStore()
const router    = useRouter()
const route     = useRoute()

const email          = ref('')
const password       = ref('')
const remember       = ref(false)
const loading        = ref(false)
const error          = ref('')
const successMessage = ref('')
const showPassword   = ref(false)

const redirectPath = route.query.redirect || '/'

const clearMessages = () => { error.value = ''; successMessage.value = '' }

const handleLogin = async () => {
  loading.value = true
  clearMessages()
  try {
    await authStore.login(email.value, password.value, remember.value)
    router.push(redirectPath)
  } catch (err) {
    // Map Firebase error codes to friendly messages
    const codes = {
      'auth/user-not-found':      'No account found with this email.',
      'auth/wrong-password':      'Incorrect password. Please try again.',
      'auth/invalid-credential':  'Invalid credentials. Check your email and password.',
      'auth/too-many-requests':   'Too many failed attempts. Try again later.',
      'auth/user-disabled':       'This account has been disabled.',
      'auth/invalid-email':       'Please enter a valid email address.',
    }
    error.value = codes[err.code] || err.message
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  loading.value = true; clearMessages()
  try { await authStore.googleLogin(); router.push(redirectPath) }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
}

const handleMicrosoftLogin = async () => {
  loading.value = true; clearMessages()
  try { await authStore.microsoftLogin(); router.push(redirectPath) }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
}

const handleLinkedInLogin = async () => {
  loading.value = true; clearMessages()
  try { await authStore.linkedinLogin(); router.push(redirectPath) }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
}

const handleForgotPassword = async () => {
  if (!email.value) { error.value = 'Enter your email address first.'; return }
  loading.value = true; clearMessages()
  try {
    await authStore.resetPassword(email.value)
    successMessage.value = 'Reset link sent! Check your inbox.'
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────── */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

/* Background layers */
.login-bg {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* Fallback gradient if image fails */
  background-color: #0f172a;
  transform: scale(1.05); /* Slight scale to hide loading edge */
  transition: transform 0.5s ease;
  z-index: 0;
}

.login-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.75) 0%,
    rgba(37, 99, 235, 0.35) 100%
  );
  backdrop-filter: blur(2px);
  z-index: 1;
}

/* ── Card ────────────────────────────────────────────────────── */
.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  padding: 2.5rem 2.25rem;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

[data-theme='dark'] .login-card {
  background: rgba(15, 23, 42, 0.97);
  color: #f1f5f9;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08);
}

/* ── Brand ───────────────────────────────────────────────────── */
.login-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1.5rem;
}
[data-theme='dark'] .login-brand { color: #f1f5f9; }
.brand-icon { font-size: 1.5rem; }
.accent { color: #2563eb; }

.login-card h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 0.25rem;
}
[data-theme='dark'] .login-card h2 { color: #f1f5f9; }
.login-sub { color: #64748b; font-size: 0.9rem; margin: 0 0 1.75rem; }

/* ── Form fields ─────────────────────────────────────────────── */
.login-form { display: flex; flex-direction: column; gap: 0; }
.field { margin-bottom: 1rem; }
.field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
[data-theme='dark'] .field label { color: #94a3b8; }

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrap > i:first-child {
  position: absolute;
  left: 0.9rem;
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}
.input-wrap input {
  width: 100%;
  padding: 0.72rem 0.9rem 0.72rem 2.4rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  color: #1e293b;
  transition: all 0.18s;
  box-sizing: border-box;
}
[data-theme='dark'] .input-wrap input {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}
.input-wrap input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
[data-theme='dark'] .input-wrap input:focus {
  background: #0f172a;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
}
.input-wrap input:autofill { background: #f8fafc; }

.eye-toggle {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.88rem;
  padding: 0.25rem;
  transition: color 0.18s;
}
.eye-toggle:hover { color: #2563eb; }

/* ── Remember / forgot ────────────────────────────────────────── */
.remember-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  color: #475569;
  cursor: pointer;
}
[data-theme='dark'] .checkbox-label { color: #94a3b8; }
.checkbox-label input { accent-color: #2563eb; }

.forgot-link {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.82rem;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
}
.forgot-link:hover { text-decoration: underline; }

/* ── Sign-in button ───────────────────────────────────────────── */
.btn-signin {
  width: 100%;
  padding: 0.78rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}
.btn-signin:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
}
.btn-signin:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

/* ── Register hint ────────────────────────────────────────────── */
.register-hint {
  text-align: center;
  font-size: 0.83rem;
  color: #64748b;
  margin: 1rem 0;
}
.register-hint a { color: #2563eb; text-decoration: none; font-weight: 600; }
.register-hint a:hover { text-decoration: underline; }

/* ── Divider ──────────────────────────────────────────────────── */
.divider {
  position: relative;
  text-align: center;
  margin: 0.75rem 0 1rem;
}
.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}
[data-theme='dark'] .divider::before { background: #334155; }
.divider span {
  position: relative;
  background: rgba(255,255,255,0.97);
  padding: 0 0.75rem;
  font-size: 0.78rem;
  color: #94a3b8;
}
[data-theme='dark'] .divider span { background: rgba(15,23,42,0.97); }

/* ── Social buttons ──────────────────────────────────────────── */
.social-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}
.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.65rem 0.5rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 0.72rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.18s;
  font-weight: 500;
}
[data-theme='dark'] .social-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}
.social-btn i { font-size: 1.15rem; }
.social-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
  transform: translateY(-1px);
}
[data-theme='dark'] .social-btn:hover:not(:disabled) { background: #1e3a5f; }
.social-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Messages ─────────────────────────────────────────────────── */
.error-msg, .success-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 500;
}
.error-msg   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.success-msg { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .login-card { padding: 2rem 1.5rem; border-radius: 16px; }
}
</style>
