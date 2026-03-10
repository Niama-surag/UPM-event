import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/components/Layouts/DefaultLayout.vue'

import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'about', name: 'about', component: AboutView },
      { path: 'login', name: 'login', component: LoginView },
      { path: 'register', name: 'register', component: RegisterView }
    ]
  },
  {
    path: '/admin',
    component: DefaultLayout,
    children: [
      { path: '', name: 'admin', component: AdminDashboard, meta: { requiresAdmin: true } }
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

  // if (to.meta.requiresAdmin) {
  //   const isAdmin = authStore.userProfile?.role === 'admin'
  //   if (!isAdmin) {
  //     return next({ name: 'home' })
  //   }
  // }
  next()
})

export default router