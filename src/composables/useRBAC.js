// src/composables/useRBAC.js
// ─────────────────────────────────────────────────────────────
// Central RBAC — import this EVERYWHERE you need role checks.
// WHY a composable?
//   → One place to change role logic, fixes everywhere.
//   → Reactive: if userProfile.role changes, every computed updates.
//   → Testable in isolation without mounting components.
// ─────────────────────────────────────────────────────────────
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// ── App-level roles (stored in Firestore users/{uid}.role) ────
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user'
})

// ── Club-level roles (stored in clubs/{id}.memberRoles map) ───
export const CLUB_ROLES = Object.freeze({
  CLUB_ADMIN: 'club_admin',
  MODERATOR:  'moderator',
  MEMBER:     'member'
})

// ── Badge config — used by RoleBadge.vue component ───────────
export const ROLE_CONFIG = {
  [ROLES.ADMIN]:           { label: 'App Admin',   color: '#7c3aed', bg: '#f5f3ff' },
  [ROLES.USER]:            { label: 'User',         color: '#64748b', bg: '#f8fafc' },
  [CLUB_ROLES.CLUB_ADMIN]: { label: 'Club Admin',   color: '#2563eb', bg: '#eff6ff' },
  [CLUB_ROLES.MODERATOR]:  { label: 'Moderator',    color: '#d97706', bg: '#fffbeb' },
  [CLUB_ROLES.MEMBER]:     { label: 'Member',       color: '#059669', bg: '#ecfdf5' },
}

// ── Event status logic (centralised here, not in components) ──
export function getEventStatus(event) {
  const now = new Date()
  const start = event.startDate?.toDate
    ? event.startDate.toDate()
    : new Date(event.startDate)
  const end = event.endDate?.toDate
    ? event.endDate.toDate()
    : new Date(event.endDate)

  if (now < start) return 'upcoming'
  if (now > end)   return 'expired'
  return 'running'
}

export const EVENT_STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: '#2563eb', bg: '#eff6ff', icon: '🗓' },
  running:  { label: 'Running',  color: '#059669', bg: '#ecfdf5', icon: '🟢' },
  expired:  { label: 'Expired',  color: '#94a3b8', bg: '#f8fafc', icon: '⏹' },
}

// ── Main composable ───────────────────────────────────────────
export function useRBAC() {
  const authStore = useAuthStore()

  const isAdmin = computed(() =>
    authStore.userProfile?.role === ROLES.ADMIN
  )

  const isAuthenticated = computed(() => !!authStore.user)

  // Get this user's role inside a specific club
  // club.memberRoles = { [uid]: 'club_admin' | 'moderator' | 'member' }
  const getClubRole = (club) => {
    if (!authStore.user || !club) return null
    return club.memberRoles?.[authStore.user.uid] ?? null
  }

  const isClubAdmin = (club) =>
    getClubRole(club) === CLUB_ROLES.CLUB_ADMIN || isAdmin.value

  const isClubModerator = (club) => {
    const r = getClubRole(club)
    return r === CLUB_ROLES.CLUB_ADMIN || r === CLUB_ROLES.MODERATOR || isAdmin.value
  }

  const isClubMember = (club) =>
    club?.members?.includes(authStore.user?.uid) ?? false

  // ── Permission gates: use these in templates + route guards ──
  const can = {
    approveClub:   ()      => isAdmin.value,
    createClub:    ()      => isAuthenticated.value,
    createEvent:   (club)  => isClubAdmin(club),
    manageMembers: (club)  => isClubModerator(club),
    assignRoles:   (club)  => isClubAdmin(club),
    joinClub:      ()      => isAuthenticated.value,
    viewMembers:   ()      => isAuthenticated.value,
    editProfile:   ()      => isAuthenticated.value,
  }

  return {
    isAdmin,
    isAuthenticated,
    getClubRole,
    isClubAdmin,
    isClubModerator,
    isClubMember,
    can,
    ROLES,
    CLUB_ROLES,
    ROLE_CONFIG,
  }
}
