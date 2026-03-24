<template>
  <div class="music-player" :class="{ expanded: isExpanded }">

    <!-- Collapsed pill -->
    <div v-if="!isExpanded" class="player-pill" @click="openPlayer" title="Open music player">
      <div class="pill-icon" :class="{ playing: musicStore.isPlaying }">
        <i class="fas fa-music"></i>
        <div v-if="musicStore.isPlaying" class="sound-bars">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- Expanded card -->
    <div v-else class="player-card">

      <!-- Header -->
      <div class="player-header">
        <div class="player-tabs">
          <button :class="{ active: view === 'player' }" @click="view = 'player'">
            <i class="fas fa-play-circle"></i>
          </button>
          <button :class="{ active: view === 'playlist' }" @click="view = 'playlist'">
            <i class="fas fa-list-music"></i>
            <span v-if="musicStore.playlist.length" class="pl-badge">{{ musicStore.playlist.length }}</span>
          </button>
          <button :class="{ active: view === 'upload' }" @click="view = 'upload'">
            <i class="fas fa-cloud-upload-alt"></i>
          </button>
        </div>
        <button class="close-btn" @click="isExpanded = false">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>

      <!-- ══ PLAYER VIEW ══ -->
      <div v-if="view === 'player'" class="player-body">
        <div class="track-info">
          <div class="track-artwork" :class="{ spinning: musicStore.isPlaying }">
            <i class="fas fa-music"></i>
          </div>
          <div class="track-meta">
            <p class="track-name">{{ musicStore.trackName || 'No track loaded' }}</p>
            <p class="track-sub">{{ musicStore.isPlaying ? 'Now playing…' : 'Paused' }}</p>
          </div>
        </div>

        <!-- Progress -->
        <div class="progress-row" v-if="musicStore.currentTrack">
          <span class="time">{{ musicStore.formatTime(musicStore.currentTime) }}</span>
          <input
            type="range" class="progress-bar"
            :min="0" :max="musicStore.duration || 100"
            :value="musicStore.currentTime"
            @input="musicStore.seek($event.target.value)"
          />
          <span class="time">{{ musicStore.formatTime(musicStore.duration) }}</span>
        </div>

        <!-- Controls -->
        <div class="controls">
          <button class="ctrl-btn" @click="musicStore.playPrev" :disabled="!musicStore.hasPlaylist" title="Previous">
            <i class="fas fa-step-backward"></i>
          </button>
          <button class="ctrl-btn main-ctrl" @click="musicStore.togglePlay" :disabled="!musicStore.currentTrack">
            <i class="fas" :class="musicStore.isPlaying ? 'fa-pause' : 'fa-play'"></i>
          </button>
          <button class="ctrl-btn" @click="musicStore.playNext" :disabled="!musicStore.hasPlaylist" title="Next">
            <i class="fas fa-step-forward"></i>
          </button>
          <button class="ctrl-btn" @click="musicStore.stop" :disabled="!musicStore.currentTrack" title="Stop">
            <i class="fas fa-stop"></i>
          </button>
        </div>

        <!-- Volume -->
        <div class="volume-row">
          <i class="fas" :class="musicStore.volume === 0 ? 'fa-volume-mute' : 'fa-volume-up'"></i>
          <input
            type="range" class="volume-slider"
            min="0" max="1" step="0.01"
            :value="musicStore.volume"
            @input="musicStore.setVolume($event.target.value)"
          />
          <span class="vol-label">{{ Math.round(musicStore.volume * 100) }}%</span>
        </div>

        <!-- Local file fallback -->
        <label class="upload-local-label">
          <i class="fas fa-folder-open"></i> Play local file
          <input type="file" accept="audio/*" style="display:none" @change="handleLocalFile" />
        </label>
      </div>

      <!-- ══ PLAYLIST VIEW ══ -->
      <div v-if="view === 'playlist'" class="playlist-body">
        <div v-if="musicStore.loadingPlaylist" class="pl-loading">Loading…</div>
        <div v-else-if="!musicStore.playlist.length" class="pl-empty">
          <i class="fas fa-music-slash"></i>
          <p>No tracks uploaded yet.<br>Go to Upload tab to add music.</p>
        </div>
        <div v-else class="pl-list">
          <div
            v-for="(track, i) in musicStore.playlist"
            :key="track.id"
            class="pl-item"
            :class="{ active: musicStore.currentIndex === i }"
            @click="musicStore.playIndex(i)"
          >
            <div class="pl-num-wrap">
              <span v-if="musicStore.currentIndex === i && musicStore.isPlaying" class="pl-playing-indicator">
                <span></span><span></span><span></span>
              </span>
              <span v-else class="pl-num">{{ i + 1 }}</span>
            </div>
            <span class="pl-title">{{ track.title }}</span>
            <button class="pl-delete" @click.stop="confirmDelete(track)" title="Remove">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ══ UPLOAD VIEW ══ -->
      <div v-if="view === 'upload'" class="upload-body">
        <div
          class="upload-zone"
          :class="{ dragging: isDragging, uploading: musicStore.uploading }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.audioInput.click()"
        >
          <input ref="audioInput" type="file" accept="audio/*" style="display:none" @change="handleUpload" />
          <div v-if="musicStore.uploading" class="upload-progress-wrap">
            <div class="upload-progress-bar">
              <div class="upload-progress-fill" :style="{ width: musicStore.uploadProgress + '%' }"></div>
            </div>
            <p>Uploading… {{ musicStore.uploadProgress }}%</p>
          </div>
          <div v-else>
            <i class="fas fa-cloud-upload-alt" style="font-size:2rem; color:#94a3b8; display:block; margin-bottom:0.5rem;"></i>
            <p style="margin:0 0 0.25rem; font-size:0.82rem; font-weight:600; color:#374151;">Click or drag audio file</p>
            <p style="margin:0; font-size:0.72rem; color:#94a3b8;">MP3, OGG, WAV, FLAC — max 50 MB</p>
          </div>
        </div>

        <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
        <p v-if="uploadSuccess" class="upload-ok">✅ Track added to playlist!</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMusicStore } from '@/stores/music'
import { useAuthStore } from '@/stores/auth'

const musicStore  = useMusicStore()
const authStore   = useAuthStore()

const isExpanded    = ref(false)
const view          = ref('player')
const isDragging    = ref(false)
const uploadError   = ref('')
const uploadSuccess = ref(false)
const audioInput    = ref(null)

const openPlayer = () => {
  isExpanded.value = true
  if (!musicStore.playlist.length) musicStore.fetchPlaylist()
}

const handleLocalFile = (e) => {
  const file = e.target.files?.[0]
  if (file) musicStore.loadFile(file)
}

const handleDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) processUpload(file)
}

const handleUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) processUpload(file)
}

const processUpload = async (file) => {
  uploadError.value   = ''
  uploadSuccess.value = false
  try {
    const track = await musicStore.uploadTrack(file, authStore.user?.uid || '')
    uploadSuccess.value = true
    setTimeout(() => {
      uploadSuccess.value = false
      view.value = 'playlist'
    }, 1800)
  } catch (e) {
    uploadError.value = e.message
  }
}

const confirmDelete = async (track) => {
  if (!confirm(`Remove "${track.title}" from playlist?`)) return
  await musicStore.deleteTrack(track)
}

onMounted(() => {
  musicStore.fetchPlaylist()
})
</script>

<style scoped>
.music-player {
  position: fixed;
  bottom: 90px;
  left: 1.25rem;
  z-index: 50;
}

/* Pill */
.player-pill {
  width: 44px; height: 44px;
  background: #1e293b;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.player-pill:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.pill-icon { position: relative; color: white; font-size: 1rem; display: flex; align-items: center; justify-content: center; }

.sound-bars { position: absolute; bottom: -3px; right: -4px; display: flex; align-items: flex-end; gap: 1px; }
.sound-bars span { display: block; width: 3px; background: #10b981; border-radius: 1px; animation: bar 0.8s ease infinite alternate; }
.sound-bars span:nth-child(1) { height: 6px; }
.sound-bars span:nth-child(2) { height: 10px; animation-delay: 0.2s; }
.sound-bars span:nth-child(3) { height: 6px; animation-delay: 0.4s; }
@keyframes bar { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }

/* Card */
.player-card {
  width: 290px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* Header */
.player-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.player-tabs { display: flex; gap: 0.3rem; }
.player-tabs button {
  position: relative;
  width: 34px; height: 34px;
  border-radius: 8px;
  border: none;
  background: none;
  color: #94a3b8;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.18s;
  display: flex; align-items: center; justify-content: center;
}
.player-tabs button:hover { background: #e2e8f0; color: #374151; }
.player-tabs button.active { background: #2563eb; color: white; }
.pl-badge {
  position: absolute; top: 2px; right: 2px;
  background: #ef4444; color: white;
  font-size: 0.55rem; font-weight: 700;
  width: 13px; height: 13px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.close-btn {
  background: none; border: none; cursor: pointer;
  color: #94a3b8; font-size: 0.85rem; padding: 0.2rem;
}
.close-btn:hover { color: #475569; }

/* Player body */
.player-body { padding: 1rem; }

.track-info {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 0.85rem;
}
.track-artwork {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg,#667eea,#764ba2);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.1rem; flex-shrink: 0;
}
.track-artwork.spinning { animation: spin 4s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.track-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; margin: 0 0 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px; }
.track-sub  { font-size: 0.72rem; color: #94a3b8; margin: 0; }

/* Progress */
.progress-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.75rem; }
.time { font-size: 0.68rem; color: #94a3b8; min-width: 26px; }
.progress-bar {
  flex: 1; -webkit-appearance: none; height: 4px;
  border-radius: 2px; background: #e2e8f0; outline: none; cursor: pointer;
}
.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none; width: 11px; height: 11px;
  border-radius: 50%; background: #2563eb; cursor: pointer;
}

/* Controls */
.controls { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.ctrl-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: #f1f5f9; color: #374151; font-size: 0.88rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.18s;
}
.ctrl-btn:hover:not(:disabled) { background: #2563eb; color: white; }
.ctrl-btn:disabled { opacity: 0.38; cursor: not-allowed; }
.main-ctrl { width: 44px; height: 44px; font-size: 1rem; background: #2563eb; color: white; }
.main-ctrl:hover:not(:disabled) { background: #1d4ed8; }
.fa-play { margin-left: 2px; }

/* Volume */
.volume-row { display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.75rem; }
.volume-row i { font-size: 0.82rem; color: #64748b; }
.volume-slider {
  flex: 1; -webkit-appearance: none; height: 4px;
  border-radius: 2px; background: #e2e8f0; outline: none; cursor: pointer;
}
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 11px; height: 11px;
  border-radius: 50%; background: #2563eb; cursor: pointer;
}
.vol-label { font-size: 0.72rem; color: #64748b; min-width: 30px; }

.upload-local-label {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.45rem; border: 1.5px dashed #cbd5e1; border-radius: 8px;
  font-size: 0.75rem; color: #64748b; cursor: pointer; transition: all 0.18s;
}
.upload-local-label:hover { border-color: #2563eb; color: #2563eb; background: #f8faff; }

/* Playlist body */
.playlist-body { max-height: 300px; overflow-y: auto; }
.pl-loading, .pl-empty { padding: 1.5rem; text-align: center; font-size: 0.82rem; color: #94a3b8; }
.pl-empty i { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
.pl-empty p { margin: 0; line-height: 1.5; }

.pl-item {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.65rem 0.85rem; cursor: pointer; transition: background 0.15s;
  border-bottom: 1px solid #f8fafc;
}
.pl-item:hover { background: #f8fafc; }
.pl-item.active { background: #eff6ff; }
.pl-item.active .pl-title { color: #2563eb; font-weight: 600; }

.pl-num-wrap { width: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pl-num { font-size: 0.72rem; color: #94a3b8; }
.pl-playing-indicator { display: flex; align-items: flex-end; gap: 1px; height: 14px; }
.pl-playing-indicator span {
  width: 3px; background: #2563eb; border-radius: 1px;
  animation: bar 0.8s ease infinite alternate;
}
.pl-playing-indicator span:nth-child(1) { height: 6px; }
.pl-playing-indicator span:nth-child(2) { height: 12px; animation-delay: 0.2s; }
.pl-playing-indicator span:nth-child(3) { height: 8px; animation-delay: 0.4s; }

.pl-title { flex: 1; font-size: 0.82rem; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-delete {
  width: 22px; height: 22px; border-radius: 50%; border: none;
  background: none; color: #cbd5e1; cursor: pointer; font-size: 0.68rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.pl-delete:hover { background: #fef2f2; color: #dc2626; }

/* Upload body */
.upload-body { padding: 1rem; }
.upload-zone {
  border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2rem 1rem;
  text-align: center; cursor: pointer; background: #f8fafc;
  transition: all 0.2s;
}
.upload-zone:hover, .upload-zone.dragging { border-color: #2563eb; background: #eff6ff; }
.upload-progress-wrap p { font-size: 0.8rem; color: #2563eb; font-weight: 600; margin: 0.5rem 0 0; }
.upload-progress-bar { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-bottom: 0.4rem; }
.upload-progress-fill { height: 100%; background: #2563eb; border-radius: 3px; transition: width 0.3s; }
.upload-error { color: #dc2626; font-size: 0.78rem; text-align: center; margin-top: 0.5rem; }
.upload-ok    { color: #10b981; font-size: 0.78rem; text-align: center; margin-top: 0.5rem; font-weight: 600; }
</style>
