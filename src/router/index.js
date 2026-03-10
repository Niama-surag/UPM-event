import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/components/Layouts/DefaultLayout.vue'

import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import PollsView from '../views/PollsView.vue'
import EspaceEtudiant from '@/views/EspaceEtudiant.vue'
import EspaceClub from '@/views/EspaceClub.vue'
import EspaceChat from '@/views/EspaceChat.vue'
import EspaceEvents from '@/views/EspaceEvents.vue'
import EspaceDashboard from '@/views/EspaceDashboard.vue'
import EspaceNotification from '@/views/EspaceNotification.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'about', name: 'about', component: AboutView },
      { path: 'login', name: 'login', component: LoginView },
      { path: 'register', name: 'register', component: RegisterView },
      { path: 'profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
      { path: 'admin', name: 'admin', component: AdminDashboard, meta: { requiresAdmin: true } },
      { path: 'etudiant', name: 'etudiant', component: EspaceEtudiant, meta: { requiresAuth: true } },
      { path: 'club', name: 'club', component: EspaceClub, meta: { requiresAuth: true } },
      { path: 'chat', name: 'chat', component: EspaceChat, meta: { requiresAuth: true } },
      { path: 'events', name: 'events', component: EspaceEvents, meta: { requiresAuth: true } },
      { path: 'dashboard', name: 'dashboard', component: EspaceDashboard, meta: { requiresAuth: true } },
      { path: 'notifications', name: 'notifications', component: EspaceNotification, meta: { requiresAuth: true } },
      { path: 'polls', name: 'polls', component: PollsView }
    ]
  }


]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const publicPages = ['login', 'register']
  const authRequired = !publicPages.includes(to.name)
  const loggedIn = authStore.user

  if (authRequired && !loggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin) {
    const isAdmin = authStore.userProfile?.role === 'admin'
    if (!isAdmin) return next({ name: 'home' })
  }
  next()
})

export default router