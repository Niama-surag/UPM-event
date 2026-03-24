<template>
  <div class="pathways-page">

    <!-- Tutorial -->
    <TutorialOverlay
      v-bind="tutorial"
      :step="tutorial.step"
      @next="tutorial.next()"
      @prev="tutorial.prev()"
      @skip="tutorial.skip()"
      @goto="tutorial.currentStep = $event"
    />

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1><i class="fas fa-road"></i> Pathway Courses</h1>
        <p>Structured learning tracks from UPM clubs — pick a pathway and start learning.</p>
      </div>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <div class="search-wrap">
        <i class="fas fa-search"></i>
        <input v-model="search" placeholder="Search pathways or courses…" />
      </div>
      <select v-model="clubFilter" class="filter-select">
        <option value="">All Clubs</option>
        <option v-for="c in clubs" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="loading" class="skeleton-grid">
      <div v-for="i in 6" :key="i" class="skeleton" style="height:220px; border-radius:14px;"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div style="font-size:3rem">🛤</div>
      <p>No pathways found matching your search.</p>
    </div>

    <!-- Pathways grid — grouped by club -->
    <div v-else>
      <div v-for="group in filtered" :key="group.clubId" class="club-group">
        <div class="club-group-header">
          <div class="club-avatar-sm">{{ group.clubName?.charAt(0).toUpperCase() }}</div>
          <div>
            <h2>{{ group.clubName }}</h2>
            <span class="pathway-count">{{ group.pathways.length }} pathway{{ group.pathways.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div class="pathways-grid">
          <div v-for="pw in group.pathways" :key="pw.id" class="pathway-card">
            <div class="pathway-header" :style="{ background: pw.color || 'linear-gradient(135deg,#2563eb,#7c3aed)' }">
              <span class="pathway-icon">{{ pw.icon || '📚' }}</span>
              <h3>{{ pw.name }}</h3>
              <span class="course-count">{{ pw.courses?.length || 0 }} courses</span>
            </div>
            <div class="pathway-body">
              <p class="pathway-desc">{{ pw.description || 'No description yet.' }}</p>
              <div class="courses-list" v-if="pw.courses?.length">
                <div
                  v-for="(course, ci) in pw.courses"
                  :key="ci"
                  class="course-item"
                >
                  <span class="course-num">{{ ci + 1 }}</span>
                  <div class="course-info">
                    <span class="course-title">{{ course.title }}</span>
                    <span v-if="course.url" class="course-url">
                      <a :href="course.url" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-external-link-alt"></i> Open
                      </a>
                    </span>
                  </div>
                </div>
              </div>
              <p v-else class="no-courses">No courses added yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import TutorialOverlay from '@/components/ui/TutorialOverlay.vue'
import { useTutorial } from '@/composables/useTutorial'

const tutorial = useTutorial('pathways')

const loading    = ref(true)
const search     = ref('')
const clubFilter = ref('')
const clubs      = ref([])
const groups     = ref([])   // [{ clubId, clubName, pathways: [...] }]

onMounted(async () => {
  // Fetch approved clubs
  const clubSnap = await getDocs(query(collection(db, 'clubs'), where('status', '==', 'approved')))
  clubs.value = clubSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Fetch all pathways
  const pwSnap = await getDocs(collection(db, 'pathways'))
  const allPathways = pwSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Group pathways by club
  const grouped = {}
  clubs.value.forEach(club => {
    grouped[club.id] = { clubId: club.id, clubName: club.name, pathways: [] }
  })
  allPathways.forEach(pw => {
    if (grouped[pw.clubId]) grouped[pw.clubId].pathways.push(pw)
  })

  groups.value = Object.values(grouped).filter(g => g.pathways.length > 0)
  loading.value = false
})

const filtered = computed(() => {
  const s = search.value.toLowerCase()
  return groups.value
    .filter(g => !clubFilter.value || g.clubId === clubFilter.value)
    .map(g => ({
      ...g,
      pathways: g.pathways.filter(pw =>
        pw.name?.toLowerCase().includes(s) ||
        pw.description?.toLowerCase().includes(s) ||
        pw.courses?.some(c => c.title?.toLowerCase().includes(s))
      )
    }))
    .filter(g => g.pathways.length > 0)
})
</script>

<style scoped>
.pathways-page { max-width: 1280px; margin: 0 auto; padding: 2rem; }

.page-header { margin-bottom: 2rem; }
.page-header h1 { font-size: 1.9rem; font-weight: 800; color: #1e293b; margin: 0 0 0.3rem; display: flex; align-items: center; gap: 0.5rem; }
.page-header h1 i { color: #2563eb; }
.page-header p { color: #64748b; margin: 0; }

.search-bar { display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-wrap i { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem; }
.search-wrap input { width: 100%; padding: 0.65rem 0.9rem 0.65rem 2.3rem; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.9rem; outline: none; box-sizing: border-box; transition: border-color 0.18s; }
.search-wrap input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.filter-select { padding: 0.65rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.88rem; outline: none; cursor: pointer; background: white; transition: border-color 0.18s; }

/* Club group */
.club-group { margin-bottom: 3rem; }
.club-group-header { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.25rem; }
.club-avatar-sm { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#7c3aed); color: white; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.club-group-header h2 { margin: 0 0 0.2rem; font-size: 1.15rem; font-weight: 700; color: #1e293b; }
.pathway-count { font-size: 0.78rem; color: #94a3b8; }

/* Pathways grid */
.pathways-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }

.pathway-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); border: 1.5px solid #f1f5f9; transition: transform 0.2s, box-shadow 0.2s; }
.pathway-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

.pathway-header { padding: 1.5rem; color: white; position: relative; }
.pathway-icon { font-size: 2rem; display: block; margin-bottom: 0.6rem; }
.pathway-header h3 { margin: 0 0 0.4rem; font-size: 1.05rem; font-weight: 700; }
.course-count { font-size: 0.75rem; opacity: 0.8; background: rgba(255,255,255,0.2); padding: 0.18rem 0.55rem; border-radius: 20px; }

.pathway-body { padding: 1.25rem; }
.pathway-desc { font-size: 0.82rem; color: #64748b; margin: 0 0 1rem; line-height: 1.5; }

.courses-list { display: flex; flex-direction: column; gap: 0.5rem; }
.course-item { display: flex; align-items: flex-start; gap: 0.65rem; }
.course-num { width: 22px; height: 22px; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.course-info { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.course-title { font-size: 0.83rem; color: #374151; font-weight: 500; }
.course-url a { font-size: 0.75rem; color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; }
.course-url a:hover { text-decoration: underline; }

.no-courses { font-size: 0.8rem; color: #94a3b8; font-style: italic; margin: 0; }

.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.empty-state { text-align: center; padding: 4rem; }
.empty-state p { color: #64748b; margin-top: 0.5rem; }

@media (max-width: 600px) { .pathways-page { padding: 1rem; } }
</style>
