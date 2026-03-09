<template>
  <div class="layout">
    <header>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
        <template v-if="authStore.user">
          <router-link v-if="authStore.userProfile?.role === 'admin'" to="/admin">Admin</router-link>
          <span>Welcome, {{ authStore.userProfile?.name || authStore.user.email }}</span>
          <button @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Register</router-link>
        </template>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>My App Footer</footer>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
header { background: #f8f9fa; padding: 1rem; }
nav { display: flex; gap: 1rem; align-items: center; }
main { flex: 1; padding: 2rem; }
footer { background: #f8f9fa; padding: 1rem; text-align: center; }
</style>