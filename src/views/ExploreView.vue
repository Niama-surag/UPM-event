<template>
  <div class="explore">

    <TutorialOverlay
      v-bind="tutorial"
      :step="tutorial.step"
      @next="tutorial.next()"
      @prev="tutorial.prev()"
      @skip="tutorial.skip()"
      @goto="tutorial.currentStep = $event"
    />

    <div class="explore-header">
      <h1>Explore</h1>
      <p>Discover clubs and events at UPM</p>
    </div>

    <div class="explore-tabs">
      <button :class="{ active: activeTab === 'events' }" @click="activeTab = 'events'">
        <i class="fas fa-calendar-alt"></i> Events
        <span class="tab-count">{{ events.length }}</span>
      </button>
      <button :class="{ active: activeTab === 'clubs' }" @click="activeTab = 'clubs'">
        <i class="fas fa-users"></i> Clubs
        <span class="tab-count">{{ approvedClubs.length }}</span>
      </button>
    </div>

    <!-- ══════════════ EVENTS ══════════════ -->
    <div v-if="activeTab === 'events'">
      <div class="filters-bar">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input v-model="eventSearch" placeholder="Search events…" />
        </div>
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
        <select v-model="typeFilter" class="filter-select">
          <option value="">All Types</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div v-if="loadingEvents" class="events-grid">
        <div v-for="i in 6" :key="i" class="skeleton" style="height:260px;border-radius:14px;"></div>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="empty-state">
        <div style="font-size:2.5rem">📅</div>
        <p>No events match your filters.</p>
        <button @click="resetEventFilters" class="btn-reset">Clear filters</button>
      </div>

      <div v-else class="events-grid">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card"
          :class="{ 'is-expired': computeEventStatus(event) === 'expired' }"
          @click="goToEvent(event)"
        >
          <div class="event-img-wrap">
            <img
              :src="event.imageURL || 'https://via.placeholder.com/400x200?text=UPM+Event'"
              :alt="event.title"
              @error="$event.target.src='https://via.placeholder.com/400x200?text=Event'"
            />
            <!-- Price badge -->
            <span class="price-badge" :class="event.type">
              {{ event.type === 'free' ? 'Free' : event.price + '€' }}
            </span>
            <!-- Status badge — computed in real time -->
            <span
              class="status-badge"
              :class="computeEventStatus(event)"
            >
              {{ computeEventStatus(event) === 'active' ? '🟢 Active' : '⏹ Expired' }}
            </span>
          </div>

          <div class="event-body">
            <div class="event-club-tag" v-if="clubName(event.clubId)">
              {{ clubName(event.clubId) }}
            </div>
            <h3>{{ event.title }}</h3>
            <p>{{ shortDesc(event.description) }}</p>
            <div class="event-dates">
              <span><i class="fas fa-play-circle"></i> {{ formatDate(event.startDate || event.startTime) }}</span>
              <span><i class="fas fa-stop-circle"></i> {{ formatDate(event.endDate   || event.endTime) }}</span>
            </div>
            <button
              class="register-btn"
              :class="{
                registered: isRegistered(event.id),
                'btn-expired': computeEventStatus(event) === 'expired'
              }"
              @click.stop="registerForEvent(event)"
              :disabled="isRegistered(event.id) || computeEventStatus(event) === 'expired'"
            >
              <i :class="isRegistered(event.id)
                ? 'fas fa-check'
                : computeEventStatus(event) === 'expired'
                ? 'fas fa-ban'
                : 'fas fa-ticket-alt'"
              ></i>
              {{
                isRegistered(event.id) ? 'Registered'
                : computeEventStatus(event) === 'expired' ? 'Event ended'
                : 'Register'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ CLUBS ══════════════ -->
    <div v-if="activeTab === 'clubs'">
      <div class="filters-bar">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input v-model="clubSearch" placeholder="Search clubs…" />
        </div>
      </div>

      <!-- My club management panel -->
      <div v-if="userClub" class="my-club-panel">
        <div class="my-club-header">
          <div class="club-av-lg">{{ userClub.name?.charAt(0).toUpperCase() }}</div>
          <div>
            <h3>{{ userClub.name }}</h3>
            <RoleBadge :role="rbac.getClubRole(userClub) || 'member'" />
          </div>
        </div>

        <!-- Club management tabs -->
        <div class="club-mgmt-tabs">
          <button :class="{ active: clubTab === 'events' }"   @click="clubTab = 'events'">Events</button>
          <button :class="{ active: clubTab === 'pathways' }" @click="clubTab = 'pathways'">Pathways</button>
          <button :class="{ active: clubTab === 'members' }"  @click="clubTab = 'members'">Members</button>
          <button v-if="rbac.isClubAdmin(userClub)" :class="{ active: clubTab === 'roles' }" @click="clubTab = 'roles'">Custom Roles</button>
          <button v-if="rbac.isClubAdmin(userClub)" :class="{ active: clubTab === 'requests' }" @click="clubTab = 'requests'">Requests</button>
        </div>

        <!-- Events sub-tab -->
        <div v-if="clubTab === 'events' && rbac.can.createEvent(userClub)">
          <button v-if="!showEventForm" @click="showEventForm = true" class="btn-primary-sm">
            <i class="fas fa-plus"></i> Create Event
          </button>
          <div v-if="showEventForm" class="inline-form">
            <h4>New Event</h4>
            <p class="form-hint">⚠️ Event will be reviewed by an admin before going public.</p>
            <div class="form-row">
              <div class="field"><label>Title *</label><input v-model="newEvent.title" /></div>
              <div class="field"><label>Location</label><input v-model="newEvent.location" /></div>
            </div>
            <div class="field"><label>Description *</label><textarea v-model="newEvent.description" rows="3"></textarea></div>
            <div class="form-row">
              <div class="field"><label>Start Date & Time *</label><input type="datetime-local" v-model="newEvent.startDate" /></div>
              <!-- END TIME — required for status computation -->
              <div class="field">
                <label>End Date & Time * <span class="field-hint">(used to compute active/expired)</span></label>
                <input type="datetime-local" v-model="newEvent.endDate" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Type *</label>
                <select v-model="newEvent.type"><option value="free">Free</option><option value="paid">Paid</option></select>
              </div>
              <div class="field" v-if="newEvent.type === 'paid'">
                <label>Price (€)</label>
                <input type="number" v-model="newEvent.price" min="0" step="0.01" />
              </div>
            </div>
            <div class="form-actions">
              <button @click="createEvent" :disabled="creatingEvent" class="btn-primary-sm">
                {{ creatingEvent ? 'Creating…' : 'Create Event' }}
              </button>
              <button @click="showEventForm = false" class="btn-ghost-sm">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Pathways sub-tab -->
        <div v-if="clubTab === 'pathways'">
          <div class="pathways-manager">
            <div class="pathways-sidebar">
              <div class="sidebar-header">
                <h4>Pathways</h4>
                <button v-if="rbac.isClubAdmin(userClub)" @click="newPathwayMode = true" class="btn-icon-sm">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <div
                v-for="pw in clubPathways"
                :key="pw.id"
                class="pathway-nav-item"
                :class="{ active: selectedPathway?.id === pw.id }"
                @click="selectPathway(pw)"
              >
                <span>{{ pw.icon || '📚' }} {{ pw.name }}</span>
                <span class="pw-count">{{ pw.courses?.length || 0 }}</span>
              </div>
              <div v-if="clubPathways.length === 0" class="empty-inline">No pathways yet.</div>
            </div>

            <!-- New pathway form -->
            <div v-if="newPathwayMode" class="pathway-editor">
              <h4>Create Pathway</h4>
              <div class="field"><label>Name *</label><input v-model="newPathway.name" placeholder="e.g. PWN, WEB, REV…" /></div>
              <div class="field"><label>Description</label><textarea v-model="newPathway.description" rows="2"></textarea></div>
              <div class="form-row">
                <div class="field"><label>Icon (emoji)</label><input v-model="newPathway.icon" placeholder="📚" maxlength="2" style="width:80px" /></div>
                <div class="field">
                  <label>Color theme</label>
                  <select v-model="newPathway.color">
                    <option value="linear-gradient(135deg,#2563eb,#7c3aed)">Blue-Purple</option>
                    <option value="linear-gradient(135deg,#059669,#0284c7)">Green-Blue</option>
                    <option value="linear-gradient(135deg,#dc2626,#d97706)">Red-Orange</option>
                    <option value="linear-gradient(135deg,#7c3aed,#ec4899)">Purple-Pink</option>
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button @click="createPathway" :disabled="creatingPathway" class="btn-primary-sm">
                  {{ creatingPathway ? 'Saving…' : 'Create Pathway' }}
                </button>
                <button @click="newPathwayMode = false" class="btn-ghost-sm">Cancel</button>
              </div>
            </div>

            <!-- Pathway detail + courses -->
            <div v-else-if="selectedPathway" class="pathway-editor">
              <div class="pathway-detail-header">
                <h4>{{ selectedPathway.icon || '📚' }} {{ selectedPathway.name }}</h4>
                <button v-if="rbac.isClubAdmin(userClub)" @click="deletePathway(selectedPathway)" class="btn-danger-xs">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <p class="pathway-detail-desc">{{ selectedPathway.description }}</p>

              <h5>Courses</h5>
              <div class="courses-editor">
                <div v-for="(course, i) in editableCourses" :key="i" class="course-edit-row">
                  <span class="course-num-sm">{{ i+1 }}</span>
                  <input v-model="course.title" placeholder="Course title" class="course-title-input" />
                  <input v-model="course.url"   placeholder="URL (optional)" class="course-url-input" />
                  <button @click="removeCourse(i)" class="btn-icon-danger"><i class="fas fa-times"></i></button>
                </div>
                <button v-if="rbac.isClubAdmin(userClub)" @click="addCourse" class="btn-ghost-sm" style="margin-top:0.5rem">
                  <i class="fas fa-plus"></i> Add Course
                </button>
              </div>
              <div class="form-actions" style="margin-top:1rem" v-if="rbac.isClubAdmin(userClub)">
                <button @click="saveCourses" :disabled="savingCourses" class="btn-primary-sm">
                  {{ savingCourses ? 'Saving…' : 'Save Courses' }}
                </button>
              </div>
            </div>

            <div v-else class="pathway-placeholder">
              <p>Select a pathway to manage its courses.</p>
            </div>
          </div>
        </div>

        <!-- Members sub-tab -->
        <div v-if="clubTab === 'members'">
          <h4 class="inner-title">Club Members</h4>
          <div v-if="loadingMembers" class="loading-text">Loading…</div>
          <div v-else class="members-list">
            <div v-for="m in members" :key="m.uid" class="member-row">
              <img :src="m.photoURL || defaultAvatar" class="member-av" :alt="m.name" />
              <div class="member-info">
                <span class="member-name">{{ m.name || m.email }}</span>
                <div class="member-badges">
                  <!-- App role -->
                  <RoleBadge :role="m.clubRole" />
                  <!-- Custom club roles (can have multiple) -->
                  <span
                    v-for="cr in (m.customRoles || [])"
                    :key="cr"
                    class="custom-role-badge"
                  >{{ cr }}</span>
                </div>
              </div>
              <!-- Assign club role -->
              <select
                v-if="rbac.can.assignRoles(userClub) && m.uid !== authStore.user?.uid"
                :value="m.clubRole"
                @change="assignClubRole(m.uid, $event.target.value)"
                class="role-select-sm"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="club_admin">Club Admin</option>
              </select>
              <!-- Assign custom roles -->
              <select
                v-if="rbac.can.assignRoles(userClub) && customRoles.length > 0"
                @change="toggleCustomRole(m.uid, $event.target.value)"
                class="role-select-sm"
              >
                <option value="">+ Custom Role</option>
                <option v-for="cr in customRoles" :key="cr.id" :value="cr.name">{{ cr.name }}</option>
              </select>
              <button
                v-if="rbac.can.manageMembers(userClub) && m.uid !== authStore.user?.uid"
                @click="removeMember(m.uid)"
                class="btn-danger-xs"
              >Remove</button>
            </div>
          </div>
        </div>

        <!-- Custom Roles sub-tab (club_admin only) -->
        <div v-if="clubTab === 'roles' && rbac.isClubAdmin(userClub)">
          <h4 class="inner-title">Custom Roles</h4>
          <p style="font-size:0.82rem;color:#64748b;margin-bottom:1rem">
            Create custom labels like PWN, WEB, REV that can be assigned to members.
          </p>
          <div class="custom-roles-grid">
            <div v-for="cr in customRoles" :key="cr.id" class="custom-role-chip">
              <span class="custom-role-badge">{{ cr.name }}</span>
              <button @click="deleteCustomRole(cr.id)" class="btn-icon-danger" title="Delete role">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="inline-form" style="margin-top:1rem; max-width:360px">
            <div class="form-row">
              <div class="field">
                <label>New Role Name</label>
                <input v-model="newRoleName" placeholder="e.g. PWN, WEB, OSINT" maxlength="20" />
              </div>
            </div>
            <button @click="createCustomRole" :disabled="!newRoleName.trim()" class="btn-primary-sm">
              <i class="fas fa-plus"></i> Add Role
            </button>
          </div>
        </div>

        <!-- Join Requests -->
        <div v-if="clubTab === 'requests' && rbac.isClubAdmin(userClub)">
          <h4 class="inner-title">Join Requests</h4>
          <div v-if="joinRequests.length === 0" class="empty-inline">No pending requests.</div>
          <div v-else class="members-list">
            <div v-for="req in joinRequests" :key="req.id" class="member-row">
              <div class="member-info">
                <span class="member-name">{{ req.userName || req.userId }}</span>
                <small style="color:#94a3b8">{{ formatDate(req.createdAt) }}</small>
              </div>
              <button @click="handleRequest(req, 'approve')" class="btn-approve-xs">✓ Approve</button>
              <button @click="handleRequest(req, 'reject')"  class="btn-reject-xs">✗ Reject</button>
            </div>
          </div>
        </div>
      </div>

      <!-- All approved clubs -->
      <div v-if="loadingClubs" class="events-grid">
        <div v-for="i in 4" :key="i" class="skeleton" style="height:200px;border-radius:14px;"></div>
      </div>
      <div v-else class="clubs-grid">
        <div v-for="club in filteredClubs" :key="club.id" class="club-card">
          <div class="club-card-top">
            <div class="club-av-lg">{{ club.name?.charAt(0).toUpperCase() }}</div>
            <div class="club-card-meta">
              <h3>{{ club.name }}</h3>
              <span><i class="fas fa-users"></i> {{ club.members?.length || 0 }} members</span>
            </div>
          </div>
          <p class="club-desc">{{ shortDesc(club.description) }}</p>
          <div class="club-pathways-preview" v-if="getClubPathways(club.id).length">
            <span v-for="pw in getClubPathways(club.id).slice(0,3)" :key="pw.id" class="pw-pill">
              {{ pw.icon || '📚' }} {{ pw.name }}
            </span>
          </div>
          <RoleBadge v-if="rbac.isClubMember(club)" :role="rbac.getClubRole(club) || 'member'" />
          <div class="club-card-footer">
            <button
              v-if="!rbac.isClubMember(club) && !hasPendingRequest(club.id)"
              @click="joinClub(club.id)"
              class="join-btn"
            >Join</button>
            <button v-else-if="hasPendingRequest(club.id)" disabled class="join-btn pending">⏳ Pending</button>
            <span v-else class="joined-text"><i class="fas fa-check-circle"></i> Joined</span>
          </div>
        </div>
      </div>

      <!-- Pending notice -->
      <div v-if="myPendingClub" class="pending-notice">
        <i class="fas fa-hourglass-half"></i>
        Your club <strong>{{ myPendingClub.name }}</strong> is waiting for admin approval.
      </div>

      <!-- Create club -->
      <div class="create-club-section">
        <button v-if="!showCreateClub && !userClub && !myPendingClub" @click="showCreateClub = true" class="btn-dashed">
          <i class="fas fa-plus"></i> Create a Club
        </button>
        <div v-if="showCreateClub" class="inline-form">
          <h4>Create a New Club</h4>
          <p class="form-hint">⚠️ Your club request will be reviewed by an admin before becoming public.</p>
          <div class="field"><label>Club Name *</label><input v-model="newClub.name" /></div>
          <div class="field"><label>Description *</label><textarea v-model="newClub.description" rows="3"></textarea></div>
          <div class="form-actions">
            <button @click="createClub" :disabled="creatingClub" class="btn-primary-sm">
              {{ creatingClub ? 'Submitting…' : 'Submit Request' }}
            </button>
            <button @click="showCreateClub = false" class="btn-ghost-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRBAC } from '@/composables/useRBAC'
import { db } from '@/services/firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, where, arrayUnion, arrayRemove, serverTimestamp
} from 'firebase/firestore'
import RoleBadge from '@/components/ui/RoleBadge.vue'
import TutorialOverlay from '@/components/ui/TutorialOverlay.vue'
import { useTutorial } from '@/composables/useTutorial'

const route      = useRoute()
const router     = useRouter()
const authStore  = useAuthStore()
const rbac       = useRBAC()
const tutorial   = useTutorial('explore')

const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const activeTab = ref(route.query.tab === 'clubs' ? 'clubs' : 'events')
const clubTab   = ref('events')

// Events
const events          = ref([])
const loadingEvents   = ref(true)
const eventSearch     = ref('')
const statusFilter    = ref('')
const typeFilter      = ref('')
const myRegistrations = ref([])

// Clubs
const allClubs        = ref([])
const allPathways     = ref([])
const loadingClubs    = ref(true)
const clubSearch      = ref('')
const pendingRequests = ref(new Set())
const showCreateClub  = ref(false)
const creatingClub    = ref(false)
const newClub         = ref({ name: '', description: '' })

// My club
const userClub        = ref(null)
const myPendingClub   = ref(null)
const members         = ref([])
const loadingMembers  = ref(false)
const joinRequests    = ref([])

// Pathways
const clubPathways    = ref([])
const selectedPathway = ref(null)
const editableCourses = ref([])
const newPathwayMode  = ref(false)
const creatingPathway = ref(false)
const savingCourses   = ref(false)
const newPathway      = ref({ name: '', description: '', icon: '📚', color: 'linear-gradient(135deg,#2563eb,#7c3aed)' })

// Custom roles
const customRoles     = ref([])
const newRoleName     = ref('')

// Events form
const showEventForm   = ref(false)
const creatingEvent   = ref(false)
const newEvent        = ref({ title: '', description: '', startDate: '', endDate: '', location: '', type: 'free', price: 0 })

const toast = ref({ show: false, message: '', type: 'success' })

// ── Computed ──────────────────────────────────────────────────
const approvedClubs = computed(() => allClubs.value.filter(c => c.status === 'approved'))

// ── Event status logic ─────────────────────────────────────────
// WHY pure function here?
//   → Same logic used in template, filtering, and EventDetailView
//   → No state to manage — just compares timestamps at render time
//   → If endDate changes in Firestore, next re-render picks it up
const computeEventStatus = (event) => {
  const now = new Date()
  const end = event.endDate?.toDate
    ? event.endDate.toDate()
    : event.endTime?.toDate
      ? event.endTime.toDate()
      : new Date(event.endDate || event.endTime || 0)
  return now > end ? 'expired' : 'active'
}

const filteredEvents = computed(() => events.value
  .filter(e => e.status === 'approved')   // only show approved events
  .filter(e => {
    const s  = computeEventStatus(e)
    const ok1 = e.title?.toLowerCase().includes(eventSearch.value.toLowerCase())
    const ok2 = !statusFilter.value || s === statusFilter.value
    const ok3 = !typeFilter.value   || e.type === typeFilter.value
    return ok1 && ok2 && ok3
  })
)

const filteredClubs = computed(() => approvedClubs.value.filter(c =>
  c.name?.toLowerCase().includes(clubSearch.value.toLowerCase())
))

const getClubPathways = (clubId) => allPathways.value.filter(p => p.clubId === clubId)

// ── Data fetching ─────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchEvents(), fetchClubs(), fetchAllPathways()])
  if (authStore.user) await fetchUserClubData()
})

const fetchEvents = async () => {
  loadingEvents.value = true
  const snap = await getDocs(collection(db, 'events'))
  events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  if (authStore.user) {
    const regSnap = await getDocs(query(collection(db, 'registrations'), where('userid', '==', authStore.user.uid)))
    myRegistrations.value = regSnap.docs.map(d => d.data().eventsid)
  }
  loadingEvents.value = false
}

const fetchClubs = async () => {
  loadingClubs.value = true
  const snap = await getDocs(collection(db, 'clubs'))
  allClubs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  if (authStore.user) {
    const reqSnap = await getDocs(query(collection(db, 'clubRequests'), where('userId', '==', authStore.user.uid), where('status', '==', 'pending')))
    pendingRequests.value = new Set(reqSnap.docs.map(d => d.data().clubId))
  }
  loadingClubs.value = false
}

const fetchAllPathways = async () => {
  const snap = await getDocs(collection(db, 'pathways'))
  allPathways.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

const fetchUserClubData = async () => {
  const memberSnap = await getDocs(query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid)))
  if (!memberSnap.empty) {
    userClub.value = { id: memberSnap.docs[0].id, ...memberSnap.docs[0].data() }
    await Promise.all([fetchMembers(), fetchJoinRequests(), fetchClubPathways(), fetchCustomRoles()])
  }
  const pendingSnap = await getDocs(query(collection(db, 'clubs'), where('leaderId', '==', authStore.user.uid), where('status', '==', 'pending')))
  if (!pendingSnap.empty) myPendingClub.value = { id: pendingSnap.docs[0].id, ...pendingSnap.docs[0].data() }
}

const fetchMembers = async () => {
  if (!userClub.value) return
  loadingMembers.value = true
  const memberIds = userClub.value.members || []
  members.value = await Promise.all(memberIds.map(async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid))
    const profile = snap.exists() ? snap.data() : {}
    return {
      uid,
      name:        profile.name || profile.email || uid,
      email:       profile.email || '',
      photoURL:    profile.photoURL || '',
      clubRole:    userClub.value.memberRoles?.[uid] || 'member',
      customRoles: userClub.value.memberCustomRoles?.[uid] || []
    }
  }))
  loadingMembers.value = false
}

const fetchJoinRequests = async () => {
  if (!userClub.value) return
  const snap = await getDocs(query(collection(db, 'clubRequests'), where('clubId', '==', userClub.value.id), where('status', '==', 'pending')))
  joinRequests.value = await Promise.all(snap.docs.map(async (d) => {
    const data = d.data()
    const userSnap = await getDoc(doc(db, 'users', data.userId))
    return { id: d.id, ...data, userName: userSnap.exists() ? userSnap.data().name : data.userId }
  }))
}

const fetchClubPathways = async () => {
  if (!userClub.value) return
  const snap = await getDocs(query(collection(db, 'pathways'), where('clubId', '==', userClub.value.id)))
  clubPathways.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

const fetchCustomRoles = async () => {
  if (!userClub.value) return
  const snap = await getDocs(query(collection(db, 'clubRoles'), where('clubId', '==', userClub.value.id)))
  customRoles.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Pathway management ─────────────────────────────────────────
const selectPathway = (pw) => {
  selectedPathway.value = pw
  editableCourses.value = (pw.courses || []).map(c => ({ ...c }))
}

const createPathway = async () => {
  if (!newPathway.value.name.trim()) return
  creatingPathway.value = true
  try {
    const ref = await addDoc(collection(db, 'pathways'), {
      ...newPathway.value,
      clubId:    userClub.value.id,
      courses:   [],
      createdAt: serverTimestamp()
    })
    const newPw = { id: ref.id, ...newPathway.value, clubId: userClub.value.id, courses: [] }
    clubPathways.value.push(newPw)
    allPathways.value.push(newPw)
    newPathwayMode.value = false
    newPathway.value = { name: '', description: '', icon: '📚', color: 'linear-gradient(135deg,#2563eb,#7c3aed)' }
    showToast('Pathway created ✅', 'success')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { creatingPathway.value = false }
}

const deletePathway = async (pw) => {
  if (!confirm(`Delete pathway "${pw.name}"?`)) return
  await deleteDoc(doc(db, 'pathways', pw.id))
  clubPathways.value = clubPathways.value.filter(p => p.id !== pw.id)
  if (selectedPathway.value?.id === pw.id) selectedPathway.value = null
  showToast('Pathway deleted', 'error')
}

const addCourse    = () => { editableCourses.value.push({ title: '', url: '' }) }
const removeCourse = (i) => { editableCourses.value.splice(i, 1) }

const saveCourses = async () => {
  if (!selectedPathway.value) return
  savingCourses.value = true
  try {
    const clean = editableCourses.value.filter(c => c.title.trim())
    await updateDoc(doc(db, 'pathways', selectedPathway.value.id), { courses: clean })
    selectedPathway.value.courses = clean
    showToast('Courses saved ✅', 'success')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { savingCourses.value = false }
}

// ── Custom roles ──────────────────────────────────────────────
const createCustomRole = async () => {
  if (!newRoleName.value.trim()) return
  const ref = await addDoc(collection(db, 'clubRoles'), {
    clubId: userClub.value.id,
    name:   newRoleName.value.trim().toUpperCase(),
    createdAt: serverTimestamp()
  })
  customRoles.value.push({ id: ref.id, clubId: userClub.value.id, name: newRoleName.value.trim().toUpperCase() })
  newRoleName.value = ''
  showToast('Role created ✅', 'success')
}

const deleteCustomRole = async (id) => {
  await deleteDoc(doc(db, 'clubRoles', id))
  customRoles.value = customRoles.value.filter(r => r.id !== id)
}

const toggleCustomRole = async (uid, roleName) => {
  if (!roleName) return
  const current = userClub.value.memberCustomRoles?.[uid] || []
  const updated = current.includes(roleName) ? current.filter(r => r !== roleName) : [...current, roleName]
  await updateDoc(doc(db, 'clubs', userClub.value.id), { [`memberCustomRoles.${uid}`]: updated })
  const member = members.value.find(m => m.uid === uid)
  if (member) member.customRoles = updated
  showToast(`Role updated`, 'success')
}

// ── Club actions ──────────────────────────────────────────────
const createClub = async () => {
  if (!newClub.value.name.trim()) return
  creatingClub.value = true
  try {
    await addDoc(collection(db, 'clubs'), {
      name: newClub.value.name, description: newClub.value.description,
      leaderId: authStore.user.uid, members: [authStore.user.uid],
      memberRoles: {}, memberCustomRoles: {}, status: 'pending', createdAt: serverTimestamp()
    })
    newClub.value = { name: '', description: '' }
    showCreateClub.value = false
    showToast('Club request submitted! Waiting for admin approval. ⏳', 'success')
    await fetchClubs(); await fetchUserClubData()
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { creatingClub.value = false }
}

const joinClub = async (clubId) => {
  if (!authStore.user) return
  try {
    await addDoc(collection(db, 'clubRequests'), { clubId, userId: authStore.user.uid, status: 'pending', createdAt: serverTimestamp() })
    pendingRequests.value.add(clubId)
    showToast('Join request sent ⏳', 'success')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
}

const handleRequest = async (req, action) => {
  try {
    if (action === 'approve') {
      await updateDoc(doc(db, 'clubs', req.clubId), { members: arrayUnion(req.userId), [`memberRoles.${req.userId}`]: 'member' })
    }
    await updateDoc(doc(db, 'clubRequests', req.id), { status: action === 'approve' ? 'approved' : 'rejected' })
    joinRequests.value = joinRequests.value.filter(r => r.id !== req.id)
    if (action === 'approve') fetchMembers()
    showToast(action === 'approve' ? 'Member approved ✅' : 'Request rejected', action === 'approve' ? 'success' : 'error')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
}

const assignClubRole = async (uid, role) => {
  if (!userClub.value) return
  await updateDoc(doc(db, 'clubs', userClub.value.id), { [`memberRoles.${uid}`]: role })
  const m = members.value.find(m => m.uid === uid)
  if (m) m.clubRole = role
  showToast('Role updated ✅', 'success')
}

const removeMember = async (uid) => {
  if (!confirm('Remove this member?')) return
  await updateDoc(doc(db, 'clubs', userClub.value.id), { members: arrayRemove(uid) })
  members.value = members.value.filter(m => m.uid !== uid)
  showToast('Member removed', 'error')
}

// ── Event actions ─────────────────────────────────────────────
const createEvent = async () => {
  if (!newEvent.value.title || !newEvent.value.startDate || !newEvent.value.endDate) {
    showToast('Fill in all required fields', 'error'); return
  }
  if (new Date(newEvent.value.endDate) <= new Date(newEvent.value.startDate)) {
    showToast('End date must be after start date', 'error'); return
  }
  creatingEvent.value = true
  try {
    await addDoc(collection(db, 'events'), {
      ...newEvent.value,
      clubId:    userClub.value.id,
      status:    'pending',
      startDate: new Date(newEvent.value.startDate),
      endDate:   new Date(newEvent.value.endDate),
      price:     newEvent.value.type === 'free' ? 0 : Number(newEvent.value.price),
      createdAt: serverTimestamp(),
      createdBy: authStore.user.uid
    })
    newEvent.value = { title: '', description: '', startDate: '', endDate: '', location: '', type: 'free', price: 0 }
    showEventForm.value = false
    await fetchEvents()
    showToast('Event submitted for approval ✅', 'success')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { creatingEvent.value = false }
}

const registerForEvent = async (event) => {
  if (!authStore.user || isRegistered(event.id) || computeEventStatus(event) === 'expired') return
  try {
    await addDoc(collection(db, 'registrations'), { userid: authStore.user.uid, eventsid: event.id, registeredAt: new Date().toISOString() })
    myRegistrations.value.push(event.id)
    showToast('Registered! ✅', 'success')
  } catch (e) { showToast('Registration failed', 'error') }
}

const goToEvent = (event) => {
  if (computeEventStatus(event) !== 'expired') router.push(`/event/${event.id}`)
}

// ── Helpers ───────────────────────────────────────────────────
const isRegistered      = (id)  => myRegistrations.value.includes(id)
const hasPendingRequest = (id)  => pendingRequests.value.has(id)
const clubName          = (id)  => allClubs.value.find(c => c.id === id)?.name || ''
const shortDesc         = (d)   => d ? (d.length > 85 ? d.slice(0,85)+'…' : d) : ''
const resetEventFilters = ()    => { eventSearch.value = ''; statusFilter.value = ''; typeFilter.value = '' }
const formatDate = (val) => {
  if (!val) return '—'
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
const showToast = (message, type='success') => {
  toast.value = { show:true, message, type }
  setTimeout(() => { toast.value.show = false }, 3200)
}
</script>

<style scoped>
.explore { max-width:1280px; margin:0 auto; padding:2rem; }
.explore-header { margin-bottom:1.75rem; }
.explore-header h1 { font-size:2rem; font-weight:800; color:#1e293b; margin:0 0 0.25rem; }
.explore-header p  { color:#64748b; margin:0; }

.explore-tabs { display:flex; gap:0.5rem; border-bottom:2px solid #e2e8f0; margin-bottom:2rem; }
.explore-tabs button { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.4rem; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-2px; font-size:0.9rem; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.18s; }
.explore-tabs button:hover { color:#2563eb; }
.explore-tabs button.active { color:#2563eb; border-bottom-color:#2563eb; }
.tab-count { background:#f1f5f9; color:#64748b; font-size:0.72rem; padding:0.15rem 0.5rem; border-radius:10px; font-weight:700; }
.explore-tabs button.active .tab-count { background:#eff6ff; color:#2563eb; }

.filters-bar { display:flex; gap:0.75rem; margin-bottom:1.5rem; flex-wrap:wrap; }
.search-wrap { position:relative; flex:1; min-width:180px; }
.search-wrap i { position:absolute; left:0.85rem; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.82rem; }
.search-wrap input { width:100%; padding:0.62rem 0.85rem 0.62rem 2.2rem; border:1.5px solid #e2e8f0; border-radius:9px; font-size:0.88rem; outline:none; box-sizing:border-box; transition:border-color 0.18s; }
.search-wrap input:focus { border-color:#2563eb; }
.filter-select { padding:0.62rem 0.9rem; border:1.5px solid #e2e8f0; border-radius:9px; font-size:0.88rem; background:white; outline:none; cursor:pointer; }

/* Events */
.events-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1.25rem; }
.event-card { background:white; border-radius:14px; overflow:hidden; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1.5px solid #f1f5f9; transition:transform 0.2s,box-shadow 0.2s; }
.event-card:hover:not(.is-expired) { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.1); }
/* Expired events: dimmed + grayscale */
.event-card.is-expired { opacity:0.55; filter:grayscale(40%); cursor:default; }
.event-img-wrap { position:relative; height:155px; background:#f1f5f9; overflow:hidden; }
.event-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.3s; }
.event-card:hover:not(.is-expired) .event-img-wrap img { transform:scale(1.04); }
.price-badge { position:absolute; top:10px; right:10px; padding:0.22rem 0.6rem; border-radius:20px; font-size:0.7rem; font-weight:700; color:white; }
.price-badge.free { background:#10b981; }
.price-badge.paid { background:#f59e0b; color:#1f2937; }

/* Status badges — computed live */
.status-badge { position:absolute; top:10px; left:10px; padding:0.22rem 0.65rem; border-radius:20px; font-size:0.72rem; font-weight:700; }
.status-badge.active  { background:rgba(16,185,129,0.9); color:white; }
.status-badge.expired { background:rgba(100,116,139,0.85); color:white; }

.event-body { padding:1rem; }
.event-club-tag { display:inline-block; background:#eff6ff; color:#2563eb; font-size:0.7rem; font-weight:600; padding:0.18rem 0.55rem; border-radius:20px; margin-bottom:0.4rem; }
.event-body h3 { font-size:0.92rem; font-weight:700; color:#1e293b; margin:0 0 0.3rem; }
.event-body p  { font-size:0.8rem; color:#64748b; margin:0 0 0.65rem; line-height:1.4; }
.event-dates { display:flex; flex-direction:column; gap:0.2rem; margin-bottom:0.65rem; }
.event-dates span { font-size:0.75rem; color:#94a3b8; display:flex; align-items:center; gap:0.35rem; }
.event-dates i { width:12px; color:#2563eb; }
.register-btn { width:100%; padding:0.52rem; border-radius:8px; background:#2563eb; color:white; border:none; font-size:0.82rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.4rem; transition:background 0.18s; }
.register-btn:hover:not(:disabled) { background:#1d4ed8; }
.register-btn.registered { background:#10b981; cursor:default; }
.register-btn.btn-expired { background:#94a3b8; cursor:not-allowed; }

/* My club panel */
.my-club-panel { background:white; border-radius:14px; padding:1.5rem; border:1.5px solid #e2e8f0; margin-bottom:2rem; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
.my-club-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.25rem; }
.club-av-lg { width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg,#2563eb,#7c3aed); color:white; font-size:1.3rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.my-club-header h3 { margin:0 0 0.3rem; font-size:1.05rem; color:#1e293b; }

.club-mgmt-tabs { display:flex; gap:0.4rem; border-bottom:1.5px solid #f1f5f9; margin-bottom:1.25rem; flex-wrap:wrap; }
.club-mgmt-tabs button { padding:0.5rem 1rem; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-1.5px; font-size:0.85rem; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.15s; }
.club-mgmt-tabs button:hover { color:#2563eb; }
.club-mgmt-tabs button.active { color:#2563eb; border-bottom-color:#2563eb; }

/* Pathways manager */
.pathways-manager { display:grid; grid-template-columns:200px 1fr; gap:1.25rem; min-height:300px; }
.pathways-sidebar { background:#f8fafc; border-radius:10px; padding:0.75rem; }
.sidebar-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
.sidebar-header h4 { font-size:0.85rem; font-weight:700; color:#1e293b; margin:0; }
.pathway-nav-item { display:flex; align-items:center; justify-content:space-between; padding:0.55rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.83rem; font-weight:500; color:#374151; transition:background 0.15s; margin-bottom:0.2rem; }
.pathway-nav-item:hover { background:#e2e8f0; }
.pathway-nav-item.active { background:#eff6ff; color:#2563eb; }
.pw-count { background:#e2e8f0; color:#64748b; font-size:0.7rem; padding:0.1rem 0.35rem; border-radius:8px; }

.pathway-editor { background:#f8fafc; border-radius:10px; padding:1.25rem; }
.pathway-editor h4 { margin:0 0 1rem; font-size:0.95rem; color:#1e293b; }
.pathway-detail-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem; }
.pathway-detail-desc { font-size:0.82rem; color:#64748b; margin:0 0 1rem; }
.pathway-editor h5 { font-size:0.82rem; font-weight:700; color:#374151; margin:0 0 0.5rem; text-transform:uppercase; letter-spacing:0.05em; }
.courses-editor { display:flex; flex-direction:column; gap:0.4rem; }
.course-edit-row { display:flex; align-items:center; gap:0.5rem; }
.course-num-sm { width:20px; height:20px; border-radius:50%; background:#eff6ff; color:#2563eb; font-size:0.68rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.course-title-input { flex:2; padding:0.45rem 0.65rem; border:1.5px solid #e2e8f0; border-radius:7px; font-size:0.82rem; outline:none; }
.course-url-input { flex:1.5; padding:0.45rem 0.65rem; border:1.5px solid #e2e8f0; border-radius:7px; font-size:0.82rem; outline:none; }
.course-title-input:focus, .course-url-input:focus { border-color:#2563eb; }
.pathway-placeholder { display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:0.85rem; }

/* Custom roles */
.custom-roles-grid { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem; }
.custom-role-chip { display:flex; align-items:center; gap:0.35rem; }
.custom-role-badge { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; padding:0.2rem 0.65rem; border-radius:20px; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }

/* Members */
.members-list { display:flex; flex-direction:column; gap:0.5rem; }
.member-row { display:flex; align-items:center; gap:0.75rem; padding:0.75rem; background:#f8fafc; border-radius:10px; flex-wrap:wrap; }
.member-av { width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.member-info { flex:1; display:flex; flex-direction:column; gap:0.3rem; min-width:120px; }
.member-name { font-size:0.88rem; font-weight:600; color:#1e293b; }
.member-badges { display:flex; flex-wrap:wrap; gap:0.3rem; align-items:center; }
.role-select-sm { padding:0.25rem 0.5rem; border:1.5px solid #e2e8f0; border-radius:6px; font-size:0.78rem; cursor:pointer; outline:none; }

/* Clubs grid */
.clubs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1.25rem; }
.club-card { background:white; border-radius:14px; padding:1.25rem; border:1.5px solid #f1f5f9; box-shadow:0 1px 4px rgba(0,0,0,0.06); transition:transform 0.2s; }
.club-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.09); }
.club-card-top { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; }
.club-card-meta h3 { margin:0 0 0.2rem; font-size:0.95rem; color:#1e293b; }
.club-card-meta span { font-size:0.78rem; color:#94a3b8; display:flex; align-items:center; gap:0.3rem; }
.club-desc { font-size:0.82rem; color:#64748b; margin:0 0 0.75rem; line-height:1.5; }
.club-pathways-preview { display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.6rem; }
.pw-pill { background:#f5f3ff; color:#7c3aed; border:1px solid #ddd6fe; font-size:0.7rem; font-weight:600; padding:0.15rem 0.55rem; border-radius:20px; }
.club-card-footer { display:flex; align-items:center; justify-content:flex-end; margin-top:0.75rem; }
.join-btn { padding:0.42rem 1rem; background:#2563eb; color:white; border:none; border-radius:7px; font-size:0.82rem; font-weight:600; cursor:pointer; transition:background 0.18s; }
.join-btn:hover:not(:disabled) { background:#1d4ed8; }
.join-btn.pending { background:#f59e0b; cursor:not-allowed; }
.joined-text { font-size:0.82rem; color:#10b981; font-weight:600; display:flex; align-items:center; gap:0.3rem; }

/* Forms */
.inline-form { background:#f8fafc; border-radius:12px; padding:1.5rem; border:1.5px solid #e2e8f0; margin-top:1rem; }
.inline-form h4 { margin:0 0 0.75rem; font-size:1rem; color:#1e293b; }
.form-hint { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:0.6rem 0.9rem; font-size:0.82rem; color:#92400e; margin-bottom:1rem; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.field { margin-bottom:0.85rem; }
.field label { display:block; font-size:0.82rem; font-weight:600; color:#374151; margin-bottom:0.3rem; }
.field-hint { font-weight:400; color:#94a3b8; font-size:0.75rem; }
.field input,.field textarea,.field select { width:100%; padding:0.6rem 0.8rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.88rem; outline:none; box-sizing:border-box; transition:border-color 0.18s; }
.field input:focus,.field textarea:focus,.field select:focus { border-color:#2563eb; }
.form-actions { display:flex; gap:0.75rem; }
.btn-primary-sm { padding:0.52rem 1.1rem; background:#2563eb; color:white; border:none; border-radius:8px; font-size:0.85rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; transition:background 0.18s; }
.btn-primary-sm:hover:not(:disabled) { background:#1d4ed8; }
.btn-primary-sm:disabled { opacity:0.6; cursor:not-allowed; }
.btn-ghost-sm { padding:0.52rem 1.1rem; background:none; border:1.5px solid #e2e8f0; color:#64748b; border-radius:8px; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.18s; }
.btn-ghost-sm:hover { border-color:#2563eb; color:#2563eb; }
.btn-icon-sm { width:28px; height:28px; border-radius:7px; background:#eff6ff; color:#2563eb; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.78rem; }
.btn-icon-danger { width:24px; height:24px; border-radius:6px; background:#fef2f2; color:#dc2626; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.72rem; flex-shrink:0; }
.btn-approve-xs { padding:0.3rem 0.75rem; background:#10b981; color:white; border:none; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; }
.btn-reject-xs  { padding:0.3rem 0.75rem; background:none; border:1.5px solid #fecaca; color:#dc2626; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; }
.btn-danger-xs  { padding:0.25rem 0.6rem; background:none; border:1.5px solid #fecaca; color:#dc2626; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; }
.btn-dashed { padding:0.7rem 1.4rem; border:2px dashed #cbd5e1; background:none; color:#64748b; border-radius:10px; font-size:0.88rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.5rem; transition:all 0.18s; margin-top:1.5rem; }
.btn-dashed:hover { border-color:#2563eb; color:#2563eb; background:#eff6ff; }
.btn-reset { padding:0.5rem 1.1rem; border:1.5px solid #e2e8f0; background:none; border-radius:8px; color:#64748b; cursor:pointer; font-size:0.85rem; margin-top:0.75rem; }

.pending-notice { background:#fffbeb; border:1.5px solid #fde68a; border-radius:10px; padding:1rem 1.25rem; margin:1rem 0; font-size:0.88rem; color:#92400e; display:flex; align-items:center; gap:0.5rem; }
.create-club-section { margin-top:1.5rem; }
.inner-title { font-size:0.92rem; font-weight:700; color:#1e293b; margin:1rem 0 0.75rem; }
.empty-inline { color:#94a3b8; font-size:0.85rem; padding:0.5rem 0; }
.empty-state { text-align:center; padding:3rem; }
.empty-state p { color:#64748b; margin:0.5rem 0 0.75rem; }
.loading-text { color:#94a3b8; text-align:center; padding:2rem; }

.toast { position:fixed; bottom:5rem; right:1.5rem; z-index:9999; padding:0.85rem 1.5rem; border-radius:10px; font-weight:600; font-size:0.88rem; box-shadow:0 8px 30px rgba(0,0,0,0.15); }
.toast.success { background:#10b981; color:white; }
.toast.error   { background:#dc2626; color:white; }
.toast-enter-active,.toast-leave-active { transition:all 0.22s ease; }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(8px); }

@media (max-width:700px) {
  .explore { padding:1rem; }
  .form-row { grid-template-columns:1fr; }
  .pathways-manager { grid-template-columns:1fr; }
}
</style>
