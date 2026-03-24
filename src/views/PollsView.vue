<template>
  <div class="polls-page">
    <!-- Tutorial hook -->
    <TutorialOverlay
      v-bind="tutorial"
      :step="tutorial.step"
      @next="tutorial.next()"
      @prev="tutorial.prev()"
      @skip="tutorial.skip()"
      @goto="tutorial.currentStep = $event"
    />

    <div class="polls-header">
      <h1><i class="fas fa-poll"></i> Events Voting</h1>
      <p>Vote for the events you're most excited about. Rankings update live.</p>
    </div>

    <!-- Active polls -->
    <div v-if="activePolls.length > 0" class="section">
      <div class="section-label active-label">
        <span class="pulse-dot"></span> Live Polls
      </div>
      <div class="events-grid">
        <PollCard
          v-for="event in activePolls"
          :key="event.id"
          :event="event"
          :total-votes="totalVotes"
          :has-voted="hasVoted(event.id)"
          :is-active="true"
          :poll-end="event.pollEnd"
          @vote="vote(event.id)"
        />
      </div>
    </div>

    <!-- Ended polls with ranking -->
    <div v-if="endedPolls.length > 0" class="section">
      <div class="section-label ended-label">
        <i class="fas fa-trophy"></i> Final Rankings
      </div>
      <div class="ranking-list">
        <div
          v-for="(event, index) in endedPolls"
          :key="event.id"
          class="rank-row"
          :class="{
            'rank-1': index === 0,
            'rank-2': index === 1,
            'rank-3': index === 2,
            'rank-waiting': index >= 3
          }"
        >
          <!-- Rank badge -->
          <div class="rank-badge">
            <span v-if="index === 0">🏆</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else class="rank-num">#{{ index + 1 }}</span>
          </div>

          <!-- Event info -->
          <div class="rank-img-wrap" v-if="event.imageURL">
            <img :src="event.imageURL" :alt="event.title" />
          </div>
          <div class="rank-info">
            <h3>{{ event.title }}</h3>
            <p>{{ event.description ? event.description.slice(0, 80) + '…' : '' }}</p>
            <div class="rank-meta">
              <span><i class="fas fa-map-marker-alt"></i> {{ event.location || 'TBD' }}</span>
              <span class="waiting-tag" v-if="index >= 3">Waiting List</span>
            </div>
          </div>

          <!-- Vote count + bar -->
          <div class="rank-votes">
            <div class="vote-count">{{ event.vote || 0 }}</div>
            <div class="vote-label">votes</div>
            <div class="vote-pct-bar">
              <div
                class="vote-pct-fill"
                :style="{
                  width: votePercent(event.vote) + '%',
                  background: index === 0
                    ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                    : index === 1
                    ? 'linear-gradient(90deg,#94a3b8,#64748b)'
                    : index === 2
                    ? 'linear-gradient(90deg,#b45309,#92400e)'
                    : '#e2e8f0'
                }"
              ></div>
            </div>
            <small>{{ votePercent(event.vote) }}%</small>
          </div>
        </div>
      </div>
    </div>

    <!-- No polls state -->
    <div v-if="!loading && activePolls.length === 0 && endedPolls.length === 0" class="empty-state">
      <div style="font-size:3rem">🗳</div>
      <h3>No polls yet</h3>
      <p>Events with voting enabled will appear here.</p>
    </div>

    <div v-if="loading" class="loading-grid">
      <div v-for="i in 3" :key="i" class="skeleton" style="height:200px; border-radius:14px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '@/services/firebase'
import {
  collection, query, where, addDoc, updateDoc, doc,
  increment, onSnapshot, orderBy
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import TutorialOverlay from '@/components/ui/TutorialOverlay.vue'
import { useTutorial } from '@/composables/useTutorial'
import PollCard from '@/components/PollCard.vue'

const tutorial    = useTutorial('polls')
const auth        = getAuth()
const loading     = ref(true)
const allEvents   = ref([])
const votedEvents = ref([])
let unsubEvents, unsubVotes

// ── Computed: split active vs ended ──────────────────────────
const now = ref(new Date())
let clockInterval

const activePolls = computed(() =>
  allEvents.value
    .filter(e => {
      const end = parseDate(e.pollEnd || e.endDate || e.endTime)
      return !end || now.value <= end  // no end = always active
    })
    .sort((a, b) => (b.vote || 0) - (a.vote || 0))
)

const endedPolls = computed(() =>
  allEvents.value
    .filter(e => {
      const end = parseDate(e.pollEnd || e.endDate || e.endTime)
      return end && now.value > end
    })
    .sort((a, b) => (b.vote || 0) - (a.vote || 0))
)

const totalVotes = computed(() =>
  allEvents.value.reduce((sum, e) => sum + (e.vote || 0), 0)
)

// ── Helpers ───────────────────────────────────────────────────
const parseDate = (val) => {
  if (!val) return null
  return val.toDate ? val.toDate() : new Date(val)
}

const hasVoted = (eventId) => votedEvents.value.includes(eventId)

const votePercent = (votes) => {
  if (!totalVotes.value) return 0
  return Math.round(((votes || 0) / totalVotes.value) * 100)
}

// ── Vote action ───────────────────────────────────────────────
const vote = async (eventId) => {
  const user = auth.currentUser
  if (!user) { alert('Please sign in to vote.'); return }
  if (hasVoted(eventId)) return

  // Check active
  const event = allEvents.value.find(e => e.id === eventId)
  const end   = parseDate(event?.pollEnd || event?.endDate || event?.endTime)
  if (end && new Date() > end) { alert('This poll has ended.'); return }

  try {
    await addDoc(collection(db, 'Votes'), { userid: user.uid, eventsid: eventId })
    await updateDoc(doc(db, 'events', eventId), { vote: increment(1) })
  } catch (e) {
    alert('Vote failed: ' + e.message)
  }
}

// ── Live listeners ────────────────────────────────────────────
onMounted(() => {
  // Tick every second for countdown accuracy
  clockInterval = setInterval(() => { now.value = new Date() }, 1000)

  // Live events
  unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
    allEvents.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => e.status === 'approved' || !e.status) // show approved + legacy
    loading.value = false
  })

  // Live user votes
  const user = auth.currentUser
  if (user) {
    unsubVotes = onSnapshot(
      query(collection(db, 'Votes'), where('userid', '==', user.uid)),
      (snap) => { votedEvents.value = snap.docs.map(d => d.data().eventsid) }
    )
  }
})

onUnmounted(() => {
  clearInterval(clockInterval)
  unsubEvents?.()
  unsubVotes?.()
})
</script>

<style scoped>
.polls-page { max-width: 900px; margin: 0 auto; padding: 2rem; }
.polls-header { margin-bottom: 2rem; }
.polls-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-base, #1e293b); margin: 0 0 0.3rem; }
.polls-header p  { color: var(--text-muted, #64748b); margin: 0; }

.section { margin-bottom: 3rem; }
.section-label {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.82rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; margin-bottom: 1.25rem; padding: 0.3rem 0.8rem;
  border-radius: 20px;
}
.active-label { background: #ecfdf5; color: #059669; }
.ended-label  { background: #fef3c7; color: #b45309; }

.pulse-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #10b981;
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.4); opacity:0.6; } }

.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }

/* ── Ranking list ─────────────────────────────────────────── */
.ranking-list { display: flex; flex-direction: column; gap: 0.75rem; }

.rank-row {
  display: flex; align-items: center; gap: 1rem;
  background: var(--bg-surface, #fff);
  border-radius: 14px; padding: 1.1rem 1.25rem;
  border: 2px solid var(--border, #e2e8f0);
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.07));
}
.rank-row:hover { transform: translateX(4px); }

.rank-1 { border-color: #f59e0b; background: linear-gradient(135deg, #fffbeb, #fff); box-shadow: 0 4px 16px rgba(245,158,11,0.15); }
.rank-2 { border-color: #94a3b8; }
.rank-3 { border-color: #b45309; }
.rank-waiting { opacity: 0.7; }

.rank-badge {
  width: 44px; height: 44px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 1.4rem;
  flex-shrink: 0; background: var(--bg-subtle, #f8fafc);
}
.rank-num { font-size: 0.88rem; font-weight: 700; color: var(--text-muted, #64748b); }

.rank-img-wrap {
  width: 64px; height: 64px; border-radius: 10px; overflow: hidden;
  flex-shrink: 0; background: var(--bg-muted, #e2e8f0);
}
.rank-img-wrap img { width: 100%; height: 100%; object-fit: cover; }

.rank-info { flex: 1; min-width: 0; }
.rank-info h3 { margin: 0 0 0.2rem; font-size: 0.95rem; font-weight: 700; color: var(--text-base, #1e293b); }
.rank-info p  { margin: 0 0 0.35rem; font-size: 0.78rem; color: var(--text-muted, #64748b); }
.rank-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; color: var(--text-faint, #94a3b8); }
.rank-meta i { color: #2563eb; }
.waiting-tag { background: #f1f5f9; color: #64748b; padding: 0.15rem 0.5rem; border-radius: 10px; font-weight: 600; }

.rank-votes { text-align: center; flex-shrink: 0; min-width: 80px; }
.vote-count { font-size: 1.4rem; font-weight: 800; color: var(--text-base, #1e293b); line-height: 1; }
.vote-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-faint, #94a3b8); margin-bottom: 0.4rem; }
.vote-pct-bar { height: 5px; background: var(--bg-muted, #e2e8f0); border-radius: 3px; overflow: hidden; margin-bottom: 0.25rem; }
.vote-pct-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.rank-votes small { font-size: 0.72rem; color: var(--text-faint, #94a3b8); }

.loading-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.25rem; }
.empty-state { text-align: center; padding: 4rem 2rem; }
.empty-state h3 { color: var(--text-base, #1e293b); margin: 0.75rem 0 0.4rem; }
.empty-state p  { color: var(--text-muted, #64748b); }

@media (max-width: 600px) { .polls-page { padding: 1rem; } .rank-row { flex-wrap: wrap; } }
</style>
