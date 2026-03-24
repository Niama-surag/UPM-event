// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/components/Layouts/DefaultLayout.vue'

import HomeView    from '@/views/HomeView.vue'
import LoginView   from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

// Lazy-loaded — only downloaded when the route is hit
const ExploreView        = () => import('@/views/ExploreView.vue')
const PathwaysView       = () => import('@/views/PathwaysView.vue')
const ProfileView        = () => import('@/views/ProfileView.vue')
const EspaceEtudiant     = () => import('@/views/EspaceEtudiant.vue')
const PollsView          = () => import('@/views/PollsView.vue')
const EspaceNotification = () => import('@/views/EspaceNotification.vue')
const AdminDashboard     = () => import('@/views/AdminDashboard.vue')
const EventDetailView    = () => import('@/views/EventDetailView.vue')
const AboutView          = () => import('@/views/AboutView.vue')
const CreateEventView    = () => import('@/views/CreateEventView.vue')  // 👈 AJOUTÉ

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      // Public
      { path: '',         name: 'home',          component: HomeView },
      { path: 'about',    name: 'about',          component: AboutView },
      { path: 'login',    name: 'login',          component: LoginView },
      { path: 'register', name: 'register',       component: RegisterView },
      { path: 'create',   name: 'create',         component: CreateEventView, meta: { requiresAuth: true } }, // 👈 AJOUTÉ
      { path: 'polls',    name: 'polls',          component: PollsView },

      // Public pathway browser
      { path: 'pathways', name: 'pathways',       component: PathwaysView },

      // Authenticated
      { path: 'explore',        name: 'explore',        component: ExploreView,        meta: { requiresAuth: true } },
      { path: 'profile',        name: 'profile',        component: ProfileView,        meta: { requiresAuth: true } },
      { path: 'etudiant',       name: 'etudiant',       component: EspaceEtudiant,     meta: { requiresAuth: true } },
      { path: 'notifications',  name: 'notifications',  component: EspaceNotification, meta: { requiresAuth: true } },
      { path: 'event/:id',      name: 'event-detail',   component: EventDetailView,    meta: { requiresAuth: true } },

      // Admin
      { path: 'admin', name: 'admin', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },

      // Backward compat
      { path: 'club',      redirect: '/explore?tab=clubs' },
      { path: 'events',    redirect: '/explore' },
      { path: 'dashboard', redirect: '/' },
      { path: 'chat',      redirect: '/explore' }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' })
})

// ── Navigation guard ──────────────────────────────────────────
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for Firebase auth to resolve on cold start
  // WHY: Hard refresh causes a race — auth isn't resolved yet when guard fires
  if (authStore.loading) {
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (!authStore.loading) { clearInterval(timer); resolve() }
      }, 50)
      // Safety timeout after 3s
      setTimeout(() => { clearInterval(timer); resolve() }, 3000)
    })
  }

  const loggedIn = !!authStore.user

  if (to.meta.requiresAuth && !loggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin) {
    if (!loggedIn) return next({ name: 'login' })
    if (authStore.userProfile?.role !== 'admin') return next({ name: 'home' })
  }

  next()
})

export default router