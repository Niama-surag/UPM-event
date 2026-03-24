<template>
  <div class="layout">
    <header :class="{ scrolled: isScrolled }">
      <nav class="navbar">
        <router-link to="/" class="nav-brand">
          <span class="brand-icon">🎓</span>
          <span>UPM<span class="brand-accent">Event</span></span>
        </router-link>
        <ul class="nav-links" :class="{ open: menuOpen }">
          <li><router-link to="/" class="nav-link" @click="closeMenu"><i class="fas fa-home"></i><span>Home</span></router-link></li>
          <li><router-link to="/explore" class="nav-link" @click="closeMenu"><i class="fas fa-compass"></i><span>Explore</span></router-link></li>
          <li><router-link to="/polls" class="nav-link" @click="closeMenu"><i class="fas fa-poll"></i><span>Polls</span></router-link></li>
          <li><router-link to="/pathways" class="nav-link" @click="closeMenu"><i class="fas fa-road"></i><span>Pathway Courses</span></router-link></li>
          
          <!-- 👈 NOUVEAU : My Events link -->
          <li v-if="authStore.user">
            <router-link to="/my-events" class="nav-link" @click="closeMenu">
              <i class="fas fa-calendar-alt"></i><span>My Events</span>
            </router-link>
          </li>
          
          <template v-if="authStore.user">
            <li>
              <router-link to="/notifications" class="nav-link notif-link" @click="closeMenu">
                <i class="fas fa-bell"></i><span>Alerts</span>
                <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
              </router-link>
            </li>
            <li v-if="authStore.isAdmin()">
              <router-link to="/admin" class="nav-link admin-link" @click="closeMenu"><i class="fas fa-shield-alt"></i><span>Admin Dashboard</span></router-link>
            </li>
          </template>
        </ul>
        <div class="nav-actions">
          <template v-if="authStore.user">
            <div class="profile-menu" @click.stop="toggleProfileMenu" ref="profileMenuRef">
              <img :src="authStore.userProfile?.photoURL || defaultAvatar" class="avatar" alt="avatar" />
              <span class="profile-name">{{ firstName }}</span>
              <i class="fas fa-chevron-down chevron" :class="{ rotated: profileOpen }"></i>
              <Transition name="dropdown">
                <div v-if="profileOpen" class="dropdown">
                  <router-link to="/profile" class="dropdown-item" @click="profileOpen = false"><i class="fas fa-user-circle"></i> My Profile</router-link>
                  <router-link to="/etudiant" class="dropdown-item" @click="profileOpen = false"><i class="fas fa-graduation-cap"></i> Student Space</router-link>
                  <!-- 👈 NOUVEAU : My Events dans le dropdown aussi -->
                  <router-link to="/my-events" class="dropdown-item" @click="profileOpen = false">
                    <i class="fas fa-calendar-alt"></i> My Events
                  </router-link>
                  <button class="dropdown-item" @click="replayTutorial"><i class="fas fa-question-circle"></i> Help / Tutorial</button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item danger" @click="handleLogout"><i class="fas fa-sign-out-alt"></i> Logout</button>
                </div>
              </Transition>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-login">Sign In</router-link>
            <router-link to="/register" class="btn-register">Register</router-link>
          </template>
          <button class="hamburger" @click="toggleMenu">
            <span class="bar"></span><span class="bar"></span><span class="bar"></span>
          </button>
        </div>
      </nav>
    </header>

    <div class="menu-overlay" v-if="menuOpen" @click="closeMenu"></div>

    <main>
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <ChatFloatingButton v-if="authStore.user" />
    <MusicPlayer />
    <BackgroundManager />

    <footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">🎓 UPM<span class="brand-accent">Event</span></div>
          <p>La plateforme événementielle officielle de l'Université Privée de Marrakech.</p>
          <div class="social-row">
            <a href="https://www.instagram.com/upmarrakech" target="_blank" rel="noopener noreferrer" class="social-btn instagram"><i class="fab fa-instagram"></i></a>
            <a href="https://web.facebook.com/profile.php?id=100086744453854" target="_blank" rel="noopener noreferrer" class="social-btn facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.linkedin.com/school/universit%C3%A9-priv%C3%A9e-de-marrakech-e2im/posts/?feedView=all" target="_blank" rel="noopener noreferrer" class="social-btn linkedin"><i class="fab fa-linkedin-in"></i></a>
            <a href="http://upm.ac.ma/" target="_blank" rel="noopener noreferrer" class="social-btn website"><i class="fas fa-globe"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/explore">Explore</router-link></li>
            <li><router-link to="/polls">Polls</router-link></li>
            <li><router-link to="/pathways">Pathway Courses</router-link></li>
            <!-- 👈 NOUVEAU : My Events dans le footer -->
            <li v-if="authStore.user"><router-link to="/my-events">My Events</router-link></li>
            <li v-if="!authStore.user"><router-link to="/login">Sign In</router-link></li>
            <li v-if="authStore.user"><router-link to="/profile">My Profile</router-link></li>
            <li v-if="authStore.isAdmin()"><router-link to="/admin">Admin Dashboard</router-link></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4><i class="fas fa-map-marker-alt"></i> Location</h4>
          <address>
            <p>Université Privée de Marrakech</p>
            <p>Km 13, route d'Amizmiz</p>
            <p>Marrakesh, Morocco, 42312</p>
          </address>
          <a href="https://maps.google.com/?q=Université+Privée+de+Marrakech" target="_blank" rel="noopener noreferrer" class="map-link"><i class="fas fa-external-link-alt"></i> Open in Google Maps</a>
          <h4 style="margin-top:1.25rem"><i class="fas fa-globe"></i> Official Site</h4>
          <a href="http://upm.ac.ma/" target="_blank" rel="noopener noreferrer" class="map-link">upm.ac.ma</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} UPM-Event — Université Privée de Marrakech. All rights reserved.</span>
        <span class="footer-made">Built with ❤️ for UPM students</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { db } from '@/services/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import ChatFloatingButton from '@/components/Layouts/ChatFloatingButton.vue'
import MusicPlayer from '@/components/Layouts/MusicPlayer.vue'
import BackgroundManager from '@/components/BackgroundManager.vue'

const authStore = useAuthStore()
const router    = useRouter()
const route     = useRoute()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const isScrolled = ref(false)
const onScroll   = () => { isScrolled.value = window.scrollY > 50 }
onMounted(()  => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const menuOpen   = ref(false)
const toggleMenu = () => { menuOpen.value = !menuOpen.value }
const closeMenu  = () => { menuOpen.value = false }

const profileOpen    = ref(false)
const profileMenuRef = ref(null)
const toggleProfileMenu = () => { profileOpen.value = !profileOpen.value }
const clickOutside = (e) => {
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target)) profileOpen.value = false
}
onMounted(()  => document.addEventListener('click', clickOutside))
onUnmounted(() => document.removeEventListener('click', clickOutside))

const firstName = computed(() => {
  const name = authStore.userProfile?.name || authStore.user?.displayName || ''
  return name.split(' ')[0] || 'Me'
})

const unreadCount = ref(0)
let unsubNotif = null
onMounted(() => {
  if (authStore.user) {
    const q = query(collection(db, 'notifications'), where('userId', '==', authStore.user.uid), where('read', '==', false))
    unsubNotif = onSnapshot(q, (snap) => { unreadCount.value = snap.size })
  }
})
onUnmounted(() => { if (unsubNotif) unsubNotif() })

const replayTutorial = () => {
  profileOpen.value = false
  const seen = JSON.parse(localStorage.getItem('upm_tutorials_seen') || '{}')
  delete seen[route.name || '']
  localStorage.setItem('upm_tutorials_seen', JSON.stringify(seen))
  router.go(0)
}

const handleLogout = async () => {
  profileOpen.value = false; closeMenu()
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }

header { position: sticky; top: 0; z-index: 1000; background: rgba(255,255,255,0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid transparent; transition: all 0.3s; }
header.scrolled { background: rgba(255,255,255,0.98); border-bottom-color: #e2e8f0; box-shadow: 0 2px 20px rgba(0,0,0,0.07); }

.navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 64px; max-width: 1280px; margin: 0 auto; width: 100%; }
.nav-brand { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.3rem; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
.brand-icon { font-size: 1.4rem; }
.brand-accent { color: #2563eb; }

.nav-links { display: flex; align-items: center; gap: 0.15rem; list-style: none; margin: 0; padding: 0; }
.nav-link { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.8rem; border-radius: 8px; text-decoration: none; font-size: 0.86rem; font-weight: 500; color: #475569; transition: all 0.18s; white-space: nowrap; }
.nav-link:hover { background: #f1f5f9; color: #1e293b; }
.nav-link.router-link-active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.nav-link i { font-size: 0.8rem; }
.admin-link.router-link-active { background: #f5f3ff; color: #7c3aed; }
.admin-link:hover { background: #f5f3ff !important; color: #7c3aed !important; }
.notif-link { position: relative; }
.notif-badge { position: absolute; top: 1px; right: 1px; background: #ef4444; color: white; font-size: 0.6rem; font-weight: 700; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

.nav-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
.btn-login { padding: 0.4rem 0.85rem; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 0.86rem; color: #2563eb; border: 1.5px solid #2563eb; transition: all 0.18s; }
.btn-login:hover { background: #eff6ff; }
.btn-register { padding: 0.4rem 0.85rem; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 0.86rem; color: white; background: #2563eb; transition: all 0.18s; }
.btn-register:hover { background: #1d4ed8; }

.profile-menu { display: flex; align-items: center; gap: 0.45rem; cursor: pointer; padding: 0.3rem 0.65rem; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; position: relative; transition: all 0.18s; user-select: none; }
.profile-menu:hover { border-color: #2563eb; }
.avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.profile-name { font-size: 0.86rem; font-weight: 600; color: #1e293b; }
.chevron { font-size: 0.62rem; color: #94a3b8; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); min-width: 195px; padding: 0.4rem; z-index: 200; }
.dropdown-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.58rem 0.88rem; border-radius: 8px; font-size: 0.86rem; font-weight: 500; color: #374151; text-decoration: none; background: none; border: none; width: 100%; cursor: pointer; transition: background 0.15s; }
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item.danger { color: #dc2626; }
.dropdown-item.danger:hover { background: #fef2f2; }
.dropdown-divider { height: 1px; background: #f1f5f9; margin: 0.3rem 0; }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

.hamburger { display: none; flex-direction: column; justify-content: space-around; width: 26px; height: 22px; background: none; border: none; cursor: pointer; padding: 0; }
.bar { width: 100%; height: 2px; background: #374151; border-radius: 2px; display: block; }
.menu-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 999; backdrop-filter: blur(2px); }

.page-enter-active, .page-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }
main { flex: 1; }

.site-footer { background: #0f172a; color: #94a3b8; padding: 3.5rem 2rem 0; margin-top: auto; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1.2fr; gap: 3rem; max-width: 1280px; margin: 0 auto; padding-bottom: 2.5rem; border-bottom: 1px solid #1e293b; }
.footer-logo { font-size: 1.25rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.85rem; }
.footer-brand p { font-size: 0.83rem; line-height: 1.7; margin-bottom: 1.5rem; }
.social-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.social-btn { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; text-decoration: none; font-size: 0.95rem; background: #1e293b; color: #94a3b8; transition: all 0.2s; }
.social-btn:hover { transform: translateY(-2px); color: white; }
.social-btn.instagram:hover { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.social-btn.facebook:hover  { background: #1877f2; }
.social-btn.linkedin:hover  { background: #0a66c2; }
.social-btn.website:hover   { background: #2563eb; }
.footer-col h4 { color: #f1f5f9; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem; }
.footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.footer-col li a, .footer-col a { color: #94a3b8; text-decoration: none; font-size: 0.85rem; transition: color 0.18s; }
.footer-col li a:hover, .footer-col a:hover { color: #60a5fa; }
address { font-style: normal; display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }
address p { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.map-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: #60a5fa; text-decoration: none; transition: color 0.18s; }
.map-link:hover { color: #93c5fd; }
.footer-bottom { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; max-width: 1280px; margin: 0 auto; font-size: 0.78rem; flex-wrap: wrap; gap: 0.5rem; }
.footer-made { color: #475569; }

@media (max-width: 960px) {
  .hamburger { display: flex; }
  .nav-links { position: fixed; top: 0; right: -100%; width: 280px; height: 100vh; background: #fff; flex-direction: column; justify-content: center; align-items: flex-start; gap: 0.2rem; padding: 2rem; transition: right 0.3s ease; box-shadow: -4px 0 30px rgba(0,0,0,0.1); z-index: 1000; }
  .nav-links.open { right: 0; }
  .nav-link { width: 100%; padding: 0.72rem 1rem; font-size: 0.92rem; }
  .navbar { padding: 0 1rem; }
  .profile-name { display: none; }
  .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
}
@media (max-width: 480px) {
  .btn-login, .btn-register { display: none; }
  .footer-bottom { justify-content: center; text-align: center; }
}
</style>