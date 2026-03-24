<template>
  <div class="poll-card" :class="{ voted: hasVoted, 'is-top': isTop }">
    <!-- Image -->
    <div class="card-img">
      <img
        v-if="event.imageURL"
        :src="event.imageURL"
        :alt="event.title"
        @error="$event.target.style.display='none'"
      />
      <div v-else class="img-placeholder">
        <i class="fas fa-calendar-star"></i>
      </div>
      <div class="card-badges">
        <span class="type-badge" :class="event.type">
          {{ event.type === 'free' ? 'Free' : event.price + '€' }}
        </span>
        <span v-if="isTop" class="top-badge">🔥 Top</span>
      </div>
    </div>

    <!-- Body -->
    <div class="card-body">
      <h3>{{ event.title }}</h3>
      <!-- Dans PollCard.vue — Ajouter après le titre de l'événement -->
       <div v-if="pollEnd" class="poll-timer" :class="{ urgent: timeLeft < 3600 }">
  <i class="fas fa-clock"></i>
  <span v-if="timeLeft > 0">{{ formatTimeLeft(timeLeft) }}</span>
  <span v-else class="expired-label">Vote terminé</span>
</div>
      <p>{{ shortDesc(event.description) }}</p>

      <!-- Countdown to end -->
      <div v-if="countdown" class="countdown" :class="{ urgent: isUrgent }">
        <i class="fas fa-clock"></i> Ends in {{ countdown }}
      </div>


      <!-- Progress bar -->
      <div class="vote-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: votePct + '%' }"
          ></div>
        </div>
        <div class="vote-stats">
          <span class="vote-num">{{ event.vote || 0 }} votes</span>
          <span class="vote-pct">{{ votePct }}%</span>
        </div>
      </div>

      <!-- Vote button -->
      <button
        class="vote-btn"
        :class="{ voted: hasVoted, disabled: !isActive }"
        @click="$emit('vote')"
        :disabled="hasVoted || !isActive"
      >
        <i :class="hasVoted ? 'fas fa-check' : 'fas fa-thumbs-up'"></i>
        {{ hasVoted ? 'Voted ✓' : isActive ? 'Vote' : 'Poll Ended' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  event:      { type: Object,  required: true },
  totalVotes: { type: Number,  default: 0 },
  hasVoted:   { type: Boolean, default: false },
  isActive:   { type: Boolean, default: false },
  pollEnd:    { type: [Object, String, null], default: null },
})

defineEmits(['vote'])

// ── Countdown timer ───────────────────────────────────────────

const now = ref(Date.now())
let timer = null

onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

const timeLeft = computed(() => {
  if (!props.pollEnd) return Infinity
  const end = props.pollEnd?.toDate ? props.pollEnd.toDate() : new Date(props.pollEnd)
  return Math.max(0, Math.floor((end.getTime() - now.value) / 1000))
})

const formatTimeLeft = seconds => {
  if (seconds === Infinity) return ''
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}j ${h}h restant`
  if (h > 0) return `${h}h ${m}m restant`
  if (m > 0) return `${m}m ${s}s restant`
  return `${s}s restant`
}
const isUrgent = computed(() => {
  if (!endDate.value) return false
  return (endDate.value - now.value) < 3600000 // < 1 hour
})

const votePct = computed(() => {
  if (!props.totalVotes) return 0
  return Math.round(((props.event.vote || 0) / props.totalVotes) * 100)
})

const isTop   = computed(() => votePct.value >= 30 && (props.event.vote || 0) > 0)

const shortDesc = (d) => d ? (d.length > 75 ? d.slice(0, 75) + '…' : d) : ''
</script>

<style scoped>
.poll-card {
  background: var(--bg-surface, #fff);
  border-radius: 14px;
  overflow: hidden;
  border: 1.5px solid var(--border, #e2e8f0);
  box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.07));
  transition: transform 0.2s, box-shadow 0.2s;
}
.poll-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,0.1)); }
.poll-card.is-top { border-color: #f59e0b; box-shadow: 0 4px 20px rgba(245,158,11,0.2); }

/* Image */
.card-img {
  position: relative; height: 155px; background: var(--bg-muted, #e2e8f0); overflow: hidden;
}
.card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; color: var(--text-faint, #94a3b8);
}
.card-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 0.4rem; }
.type-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; color: white; }
.type-badge.free { background: #10b981; }
.type-badge.paid { background: #f59e0b; color: #1f2937; }
.top-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: rgba(239,68,68,0.9); color: white; }

/* Body */
.card-body { padding: 1rem; }
.card-body h3 { margin: 0 0 0.3rem; font-size: 0.95rem; font-weight: 700; color: var(--text-base, #1e293b); }
.card-body p  { margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--text-muted, #64748b); line-height: 1.5; }

/* Countdown */
.countdown {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.75rem; font-weight: 600; color: #2563eb;
  background: #eff6ff; padding: 0.2rem 0.6rem; border-radius: 20px;
  margin-bottom: 0.75rem;
}
.countdown.urgent { background: #fef2f2; color: #dc2626; animation: pulse-red 1s infinite; }
@keyframes pulse-red { 0%,100% { opacity:1; } 50% { opacity:0.6; } }

/* Progress */
.vote-progress { margin-bottom: 0.75rem; }
.progress-bar { height: 6px; background: var(--bg-muted, #e2e8f0); border-radius: 3px; overflow: hidden; margin-bottom: 0.3rem; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #7c3aed); border-radius: 3px; transition: width 0.5s ease; }
.vote-stats { display: flex; justify-content: space-between; }
.vote-num { font-size: 0.75rem; font-weight: 600; color: var(--text-muted, #64748b); }
.vote-pct { font-size: 0.75rem; font-weight: 700; color: #2563eb; }

/* Vote button */
.vote-btn {
  width: 100%; padding: 0.6rem; border-radius: 9px;
  background: #2563eb; color: white; border: none;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  transition: all 0.18s;
}
.vote-btn:hover:not(:disabled) { background: #1d4ed8; }
.vote-btn.voted   { background: #10b981; cursor: default; }
.vote-btn.disabled { background: var(--bg-muted, #e2e8f0); color: var(--text-muted, #64748b); cursor: not-allowed; }
/* Dans PollCard.vue <style scoped> */
.poll-timer {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  margin-top: 0.5rem;
}
.poll-timer.urgent {
  color: #dc2626;
  background: #fef2f2;
  animation: pulse-timer 1s infinite;
}
.expired-label { color: #94a3b8; }
@keyframes pulse-timer { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
</style>
