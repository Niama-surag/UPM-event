<template>
  <div class="layout">

    <!-- ===== NAVBAR ===== -->
    <header :class="{ scrolled: isScrolled }">
      <nav class="navbar">

        <router-link to="/" class="nav-brand">
          <span class="brand-icon">🎓</span>
          <span>UPM<span class="brand-accent">Event</span></span>
        </router-link>

        <ul class="nav-links" :class="{ open: menuOpen }">
          <li><router-link to="/" class="nav-link" @click="closeMenu"><i class="fas fa-home"></i><span>Home</span></router-link></li>
          <template v-if="authStore.user">
<<<<<<< HEAD
            <li><router-link to="/explore" class="nav-link" @click="closeMenu"><i class="fas fa-compass"></i><span>Explore</span></router-link></li>
            <li><router-link to="/polls" class="nav-link" @click="closeMenu"><i class="fas fa-poll"></i><span>Polls</span></router-link></li>
            <li>
              <router-link to="/notifications" class="nav-link notif-link" @click="closeMenu">
                <i class="fas fa-bell"></i><span>Alerts</span>
                <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
              </router-link>
            </li>
            <li v-if="authStore.userProfile?.role === 'admin'">
              <router-link to="/admin" class="nav-link admin-link" @click="closeMenu"><i class="fas fa-shield-alt"></i><span>Admin</span></router-link>
=======
            <li><router-link to="/my-events">My Events</router-link></li>
            <li><router-link to="/club" @click="closeMenu">Club</router-link></li>
            <li><router-link to="/chat" @click="closeMenu">Chat</router-link></li>
            <li><router-link to="/events" @click="closeMenu">Events</router-link></li>
            <li><router-link to="/polls" @click="closeMenu">Polls</router-link></li>
            <li><router-link to="/dashboard" @click="closeMenu">Dashboard</router-link></li>
            <li><router-link to="/notifications" @click="closeMenu">Notifications</router-link></li>
            <li><router-link to="/profile" @click="closeMenu">Profile</router-link></li>
            <!-- Admin link (only if admin) -->
            <li v-if="authStore.userProfile?.role === 'admin'">
              <router-link to="/admin" @click="closeMenu">Admin</router-link>
>>>>>>> 9aa98d2f5cd44d617e5898c8d55ac524f2881dde
            </li>
          </template>
          <template v-else>
            <li><router-link to="/polls" class="nav-link" @click="closeMenu"><i class="fas fa-poll"></i><span>Polls</span></router-link></li>
          </template>
        </ul>

        <div class="nav-actions">
          <template v-if="authStore.user">
            <div class="profile-menu" @click="toggleProfileMenu" ref="profileMenuRef">
              <img :src="authStore.userProfile?.photoURL || defaultAvatar" class="avatar" alt="avatar" />
              <span class="profile-name">{{ firstName }}</span>
              <i class="fas fa-chevron-down chevron" :class="{ rotated: profileOpen }"></i>
              <Transition name="dropdown">
                <div v-if="profileOpen" class="dropdown">
                  <router-link to="/profile" class="dropdown-item" @click="profileOpen = false"><i class="fas fa-user-circle"></i> My Profile</router-link>
                  <router-link to="/etudiant" class="dropdown-item" @click="profileOpen = false"><i class="fas fa-graduation-cap"></i> Student Space</router-link>
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

    <footer>
      <div class="footer-content">
        <div class="footer-brand">
          <div class="footer-logo"><span>🎓</span> UPM<span class="brand-accent">Event</span></div>
          <p>La plateforme événementielle de l'Université Privée de Marrakech.</p>
          <div class="social-icons">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
        <div class="footer-links">
          <h4>Pages</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/explore">Explore</router-link></li>
            <li><router-link to="/polls">Polls</router-link></li>
            <li v-if="!authStore.user"><router-link to="/login">Login</router-link></li>
            <li v-if="authStore.user"><router-link to="/profile">Profile</router-link></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Contact</h4>
          <ul>
            <li>📍 Marrakech, Maroc</li>
            <li>✉️ events@upm.ac.ma</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© 2025 UPM-Event — Université Privée de Marrakech. All rights reserved.</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { db } from '@/services/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import ChatFloatingButton from '@/components/Layouts/ChatFloatingButton.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'

const authStore = useAuthStore()
const router = useRouter()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const isScrolled = ref(false)
const handleScroll = () => { isScrolled.value = window.scrollY > 50 }
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const menuOpen = ref(false)
const toggleMenu = () => { menuOpen.value = !menuOpen.value }
const closeMenu = () => { menuOpen.value = false }

const profileOpen = ref(false)
const profileMenuRef = ref(null)
const toggleProfileMenu = () => { profileOpen.value = !profileOpen.value }
const handleClickOutside = (e) => {
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target)) profileOpen.value = false
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

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

const handleLogout = async () => {
  profileOpen.value = false
  closeMenu()
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }

header {
  position: sticky; top: 0; z-index: 1000;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s;
}
header.scrolled { background: rgba(255,255,255,0.98); border-bottom-color: #e2e8f0; box-shadow: 0 2px 20px rgba(0,0,0,0.07); }

.navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; height: 64px; max-width: 1280px; margin: 0 auto; width: 100%;
}

.nav-brand {
  display: flex; align-items: center; gap: 0.5rem;
  text-decoration: none; font-size: 1.3rem; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;
}
.brand-icon { font-size: 1.4rem; }
.brand-accent { color: #2563eb; }

.nav-links { display: flex; align-items: center; gap: 0.2rem; list-style: none; margin: 0; padding: 0; }
.nav-link {
  display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.85rem;
  border-radius: 8px; text-decoration: none; font-size: 0.88rem; font-weight: 500;
  color: #475569; transition: all 0.18s;
}
.nav-link:hover { background: #f1f5f9; color: #1e293b; }
.nav-link.router-link-active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.nav-link i { font-size: 0.82rem; }

.notif-link { position: relative; }
.notif-badge {
  position: absolute; top: 2px; right: 2px;
  background: #ef4444; color: white; font-size: 0.62rem; font-weight: 700;
  width: 15px; height: 15px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.admin-link.router-link-active { background: #f5f3ff; color: #7c3aed; }

.nav-actions { display: flex; align-items: center; gap: 0.6rem; }

.btn-login {
  padding: 0.42rem 0.9rem; border-radius: 8px; text-decoration: none;
  font-weight: 500; font-size: 0.88rem; color: #2563eb;
  border: 1.5px solid #2563eb; transition: all 0.18s;
}
.btn-login:hover { background: #eff6ff; }
.btn-register {
  padding: 0.42rem 0.9rem; border-radius: 8px; text-decoration: none;
  font-weight: 500; font-size: 0.88rem; color: white;
  background: #2563eb; transition: all 0.18s;
}
.btn-register:hover { background: #1d4ed8; }

.profile-menu {
  display: flex; align-items: center; gap: 0.45rem; cursor: pointer;
  padding: 0.3rem 0.7rem; border-radius: 10px; border: 1.5px solid #e2e8f0;
  background: #fff; position: relative; transition: all 0.18s; user-select: none;
}
.profile-menu:hover { border-color: #2563eb; }
.avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.profile-name { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
.chevron { font-size: 0.65rem; color: #94a3b8; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12); min-width: 190px; padding: 0.4rem; z-index: 200;
}
.dropdown-item {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.9rem;
  border-radius: 8px; font-size: 0.87rem; font-weight: 500; color: #374151;
  text-decoration: none; background: none; border: none; width: 100%; cursor: pointer; transition: background 0.15s;
}
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item.danger { color: #dc2626; }
.dropdown-item.danger:hover { background: #fef2f2; }
.dropdown-divider { height: 1px; background: #f1f5f9; margin: 0.3rem 0; }

.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

.hamburger {
  display: none; flex-direction: column; justify-content: space-around;
  width: 26px; height: 22px; background: none; border: none; cursor: pointer; padding: 0;
}
.bar { width: 100%; height: 2px; background: #374151; border-radius: 2px; display: block; }

.menu-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 999; backdrop-filter: blur(2px); }

.page-enter-active, .page-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to { opacity: 0; transform: translateY(-6px); }

main { flex: 1; }

footer { background: #0f172a; color: #94a3b8; padding: 3rem 2rem 1.5rem; margin-top: auto; }
.footer-content {
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem;
  max-width: 1280px; margin: 0 auto; padding-bottom: 2rem; border-bottom: 1px solid #1e293b;
}
.footer-logo { font-size: 1.2rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.75rem; }
.footer-brand p { font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem; }
.footer-links h4 { color: #f1f5f9; font-size: 0.88rem; margin-bottom: 1rem; letter-spacing: 0.05em; text-transform: uppercase; }
.footer-links ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.footer-links li, .footer-links a { color: #94a3b8; text-decoration: none; font-size: 0.85rem; transition: color 0.18s; }
.footer-links a:hover { color: #60a5fa; }
.social-icons { display: flex; gap: 0.6rem; }
.social-icons a {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 8px;
  background: #1e293b; color: #94a3b8; text-decoration: none; font-size: 0.85rem; transition: all 0.18s;
}
.social-icons a:hover { background: #2563eb; color: white; }
.footer-bottom { text-align: center; padding-top: 1.5rem; font-size: 0.8rem; max-width: 1280px; margin: 0 auto; }

@media (max-width: 900px) {
  .hamburger { display: flex; }
  .nav-links {
    position: fixed; top: 0; right: -100%; width: 270px; height: 100vh;
    background: #fff; flex-direction: column; justify-content: center; align-items: flex-start;
    gap: 0.2rem; padding: 2rem; transition: right 0.3s ease;
    box-shadow: -4px 0 30px rgba(0,0,0,0.1); z-index: 1000;
  }
  .nav-links.open { right: 0; }
  .nav-link { width: 100%; padding: 0.75rem 1rem; font-size: 0.95rem; }
  .navbar { padding: 0 1rem; }
  .profile-name { display: none; }
  .footer-content { grid-template-columns: 1fr; gap: 2rem; }
}
@media (max-width: 480px) { .btn-login, .btn-register { display: none; } }
</style>
