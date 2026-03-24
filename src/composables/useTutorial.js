// src/composables/useTutorial.js
// ─────────────────────────────────────────────────────────────
// WHY the tutorial never closed:
//   useTutorial returned plain { isVisible: Ref<boolean>, ... }
//   When passed via v-bind="tutorial" in a template, Vue does NOT
//   auto-unwrap refs inside a plain object — only inside reactive().
//   The child received a Ref object (always truthy) as the isVisible
//   prop, so v-if="isVisible" was always true.
//
// FIX: wrap the return in reactive(). Refs nested inside reactive()
//   ARE automatically unwrapped, so v-bind="tutorial" correctly
//   passes isVisible as a boolean.
// ─────────────────────────────────────────────────────────────
import { ref, reactive, onMounted } from 'vue'

const STORAGE_KEY = 'upm_tutorials_seen'

function getSeenPages() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}
function markPageSeen(pageKey) {
  const seen = getSeenPages()
  seen[pageKey] = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
}
function hasSeenPage(pageKey) {
  return !!getSeenPages()[pageKey]
}

export const TUTORIALS = {
  home: {
    title: 'Welcome to UPM-Event 🎓',
    steps: [
      { icon: '🏠', title: 'Your Campus Hub', text: 'This is your home page. See upcoming events, active clubs, and your personal stats all in one place.' },
      { icon: '🧭', title: 'Explore Events & Clubs', text: 'Click "Explore" in the navbar to discover all clubs and events. Filter by category and register directly.' },
      { icon: '🎵', title: 'Background Music', text: 'Notice the music player at the bottom-left? Upload your own music or pick a sample to play while you browse.' }
    ]
  },
  explore: {
    title: 'Explore Clubs & Events',
    steps: [
      { icon: '🔍', title: 'Two Tabs, One Page', text: 'Switch between Events and Clubs using the tabs at the top. Both are searchable and filterable.' },
      { icon: '📅', title: 'Register for Events', text: 'Click Register on any active event. Expired events are greyed out and disabled automatically.' },
      { icon: '🏛', title: 'Join or Create a Club', text: 'Found a club? Click Join. Want your own? Scroll down and click "Create a Club" — an admin will review it.' },
      { icon: '🛤', title: 'Club Pathways', text: 'Some clubs have Pathways — structured learning tracks with courses inside. Look for the pathway pills on club cards.' }
    ]
  },
  polls: {
    title: 'Events Voting',
    steps: [
      { icon: '🗳', title: 'Vote for Your Favorite', text: 'Each event card has a Vote button. Cast your vote to influence which events get more visibility.' },
      { icon: '🏆', title: 'Live Leaderboard', text: 'The top event is highlighted with a trophy. Results update in real-time as others vote.' }
    ]
  },
  pathways: {
    title: 'Pathway Courses',
    steps: [
      { icon: '🛤', title: 'Learning Tracks by Club', text: 'Each club creates pathways — structured sequences of courses. Browse by club or search by topic.' },
      { icon: '🔗', title: 'Open Course Links', text: 'Click "Open" next to any course to go directly to the resource. Links open in a new tab.' }
    ]
  },
  profile: {
    title: 'Your Profile',
    steps: [
      { icon: '📷', title: 'Upload a Profile Photo', text: 'Click your avatar to upload a photo. It is saved to Firebase Storage and loads on every device after refresh.' },
      { icon: '✏️', title: 'Change Your Display Name', text: 'Edit your name in Personal Info and click Save. Updates everywhere instantly.' },
      { icon: '🔒', title: 'Change Your Password', text: 'Use the Change Password section. You need your current password first for security re-authentication.' }
    ]
  },
  admin: {
    title: 'Admin Dashboard',
    steps: [
      { icon: '✅', title: 'Pending Approvals', text: 'Club and Event requests from users appear here. Approve or Reject each one — rejections can include a reason.' },
      { icon: '👥', title: 'User Management', text: 'In the Users tab you can promote users to Admin or change their roles.' },
      { icon: '🎨', title: 'Site Background', text: 'In the Settings tab, upload a background image or video that all users will see across the whole app.' }
    ]
  },
  club: {
    title: 'Club Management',
    steps: [
      { icon: '🛤', title: 'Club Pathways', text: 'As a Club Admin, create learning pathways here — structured tracks of courses for your members.' },
      { icon: '🎖', title: 'Member Roles', text: 'Assign custom roles to members (PWN, WEB, REV, etc.) using the Members tab. Roles appear as badges.' },
      { icon: '📨', title: 'Join Requests', text: 'Members requesting to join appear in the Requests tab. Approve or reject each request individually.' }
    ]
  }
}

export function useTutorial(pageKey) {
  if (!TUTORIALS[pageKey]) console.warn(`[useTutorial] No tutorial for: "${pageKey}"`)

  const def   = TUTORIALS[pageKey] || { title: '', steps: [] }
  const total = def.steps.length

  // ── Use refs internally ──────────────────────────────────────
  const isVisible   = ref(false)
  const currentStep = ref(0)

  onMounted(() => {
    if (!hasSeenPage(pageKey)) {
      setTimeout(() => { isVisible.value = true }, 700)
    }
  })

  const next = () => {
    if (currentStep.value < total - 1) currentStep.value++
    else finish()
  }
  const prev = () => { if (currentStep.value > 0) currentStep.value-- }
  const finish = () => { isVisible.value = false; markPageSeen(pageKey) }
  const skip   = () => { isVisible.value = false; markPageSeen(pageKey) }
  const replay = () => { currentStep.value = 0; isVisible.value = true }
  const step   = () => def.steps[currentStep.value] || {}

  // ── KEY FIX: wrap in reactive() so refs auto-unwrap on v-bind ──
  // Without this, isVisible arrives in the child as a Ref object
  // (always truthy). With reactive(), Vue unwraps it to a boolean.
  return reactive({
    isVisible,
    currentStep,
    total,
    title: def.title,
    step,
    next,
    prev,
    finish,
    skip,
    replay
  })
}

export function resetAllTutorials() {
  localStorage.removeItem(STORAGE_KEY)
}
