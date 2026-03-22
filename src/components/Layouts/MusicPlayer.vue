<template>
  <!-- Music player: fixed bottom-left, minimal footprint -->
  <div class="music-player" :class="{ expanded: isExpanded }">

    <!-- Collapsed state: just a small pill -->
    <div v-if="!isExpanded" class="player-pill" @click="isExpanded = true" title="Open music player">
      <div class="pill-icon" :class="{ playing: musicStore.isPlaying }">
        <i class="fas" :class="musicStore.isPlaying ? 'fa-music' : 'fa-music'"></i>
        <div v-if="musicStore.isPlaying" class="sound-bars">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- Expanded state: full mini-player -->
    <div v-else class="player-card">
      <div class="player-header">
        <span class="player-title">
          <i class="fas fa-headphones"></i>
          Background Music
        </span>
        <button class="close-btn" @click="isExpanded = false" title="Minimize">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>

      <!-- Track info -->
      <div class="track-info">
        <div class="track-artwork" :class="{ spinning: musicStore.isPlaying }">
          <i class="fas fa-music"></i>
        </div>
        <div class="track-meta">
          <p class="track-name">{{ musicStore.trackName || 'No track loaded' }}</p>
          <p class="track-sub">{{ musicStore.isPlaying ? 'Playing...' : 'Paused' }}</p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-row" v-if="musicStore.trackName">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          class="progress-bar"
          :min="0"
          :max="duration || 100"
          :value="currentTime"
          @input="seek($event.target.value)"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button class="ctrl-btn" @click="musicStore.togglePlay" :disabled="!musicStore.trackName">
          <i class="fas" :class="musicStore.isPlaying ? 'fa-pause' : 'fa-play'"></i>
        </button>
        <button class="ctrl-btn" @click="musicStore.stop" :disabled="!musicStore.trackName">
          <i class="fas fa-stop"></i>
        </button>
      </div>

      <!-- Volume -->
      <div class="volume-row">
        <i class="fas" :class="musicStore.volume === 0 ? 'fa-volume-mute' : 'fa-volume-up'" style="color:#64748b; font-size:0.85rem;"></i>
        <input
          type="range"
          class="volume-slider"
          min="0" max="1" step="0.01"
          :value="musicStore.volume"
          @input="musicStore.setVolume($event.target.value)"
        />
        <span class="vol-label">{{ Math.round(musicStore.volume * 100) }}%</span>
      </div>

      <!-- Upload -->
      <label class="upload-label">
        <i class="fas fa-upload"></i>
        {{ musicStore.trackName ? 'Change track' : 'Upload audio file' }}
        <input
          type="file"
          accept="audio/*"
          style="display:none"
          @change="handleUpload"
        />
      </label>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMusicStore } from '@/stores/music'

const musicStore = useMusicStore()
const isExpanded = ref(false)
const currentTime = ref(0)
const duration = ref(0)

let interval = null

// Sync time display with audio element
onMounted(() => {
  interval = setInterval(() => {
    if (musicStore.audio) {
      currentTime.value = musicStore.audio.currentTime || 0
      duration.value = musicStore.audio.duration || 0
    }
  }, 500)
})

onUnmounted(() => {
  clearInterval(interval)
})

const seek = (val) => {
  if (musicStore.audio) {
    musicStore.audio.currentTime = val
  }
}

const handleUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    musicStore.loadTrack(file)
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.music-player {
  position: fixed;
  bottom: 90px; /* above the chat button */
  left: 1.25rem;
  z-index: 50;
}

/* Pill (collapsed) */
.player-pill {
  width: 44px;
  height: 44px;
  background: #1e293b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.player-pill:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.pill-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

/* Animated sound bars */
.sound-bars {
  position: absolute;
  bottom: -3px;
  right: -3px;
  display: flex;
  align-items: flex-end;
  gap: 1px;
}
.sound-bars span {
  display: block;
  width: 3px;
  background: #10b981;
  border-radius: 1px;
  animation: bar 0.8s ease infinite alternate;
}
.sound-bars span:nth-child(1) { height: 6px; animation-delay: 0s; }
.sound-bars span:nth-child(2) { height: 10px; animation-delay: 0.2s; }
.sound-bars span:nth-child(3) { height: 6px; animation-delay: 0.4s; }

@keyframes bar {
  from { transform: scaleY(0.4); }
  to { transform: scaleY(1); }
}

/* Expanded card */
.player-card {
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.player-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 0.2rem;
  transition: color 0.2s;
}
.close-btn:hover { color: #475569; }

/* Track info */
.track-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.track-artwork {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
  transition: transform 2s linear;
}
.track-artwork.spinning {
  animation: spin 4s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.track-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.track-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Progress */
.progress-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.time { font-size: 0.7rem; color: #94a3b8; min-width: 28px; }
.progress-bar {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  outline: none;
  cursor: pointer;
}
.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
}

/* Controls */
.controls {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.ctrl-btn {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.ctrl-btn:hover:not(:disabled) { background: #2563eb; color: white; }
.ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ctrl-btn .fa-play { margin-left: 2px; }

/* Volume */
.volume-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.volume-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  outline: none;
  cursor: pointer;
}
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
}
.vol-label { font-size: 0.75rem; color: #64748b; min-width: 32px; }

/* Upload */
.upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-label:hover { border-color: #2563eb; color: #2563eb; background: #f8faff; }
</style>
