<template>
  <!-- Only render when a track is loaded OR player is expanded -->
  <Transition name="player-slide">
    <div v-if="musicStore.currentTrackName || expanded" class="music-player" :class="{ expanded }">

      <!-- Collapsed bar -->
      <div class="player-bar" @click="expanded = !expanded">
        <div class="player-left">
          <button class="play-btn" @click.stop="musicStore.togglePlay">
            <i :class="musicStore.isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
          </button>
          <div class="track-info">
            <span class="track-name">{{ musicStore.currentTrackName || 'No track loaded' }}</span>
            <span class="track-time" v-if="musicStore.isLoaded">
              {{ musicStore.formatTime(musicStore.currentTime) }} / {{ musicStore.formatTime(musicStore.duration) }}
            </span>
          </div>
        </div>

        <div class="player-right">
          <i class="fas fa-music pulse-icon" :class="{ playing: musicStore.isPlaying }"></i>
          <i :class="expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" class="expand-icon"></i>
        </div>
      </div>

      <!-- Expanded panel -->
      <Transition name="expand">
        <div v-if="expanded" class="player-expanded">

          <!-- Progress bar -->
          <div class="progress-section">
            <span class="time-label">{{ musicStore.formatTime(musicStore.currentTime) }}</span>
            <input
              type="range"
              class="progress-slider"
              :max="musicStore.duration || 100"
              :value="musicStore.currentTime"
              @input="musicStore.seek(Number($event.target.value))"
              step="0.1"
            />
            <span class="time-label">{{ musicStore.formatTime(musicStore.duration) }}</span>
          </div>

          <!-- Volume -->
          <div class="volume-section">
            <i class="fas fa-volume-down vol-icon"></i>
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="1"
              step="0.01"
              :value="musicStore.volume"
              @input="musicStore.setVolume(Number($event.target.value))"
            />
            <i class="fas fa-volume-up vol-icon"></i>
          </div>

          <!-- Upload your own music -->
          <label class="upload-btn">
            <i class="fas fa-upload"></i>
            Upload Music
            <input type="file" accept="audio/*" @change="handleFileUpload" style="display:none" />
          </label>

          <!-- Quick track suggestions -->
          <div class="quick-tracks">
            <p class="quick-label">Or try a sample:</p>
            <div class="track-pills">
              <button
                v-for="track in sampleTracks"
                :key="track.name"
                class="track-pill"
                :class="{ active: musicStore.currentTrackName === track.name }"
                @click="loadSample(track)"
              >
                {{ track.name }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- Floating music note button (when player is hidden) -->
  <button
    v-if="!musicStore.currentTrackName"
    class="music-fab"
    @click="expanded = true"
    title="Add background music"
  >
    <i class="fas fa-music"></i>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useMusicStore } from '@/stores/music'

const musicStore = useMusicStore()
const expanded = ref(false)

const sampleTracks = [
  { name: 'Lo-Fi Study', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Ambient Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Upbeat Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
]

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    musicStore.loadFile(file)
    setTimeout(() => musicStore.play(), 300)
  }
}

const loadSample = (track) => {
  musicStore.loadUrl(track.url, track.name)
  setTimeout(() => musicStore.play(), 300)
}
</script>

<style scoped>
/* Floating button shown before track is loaded */
.music-fab {
  position: fixed;
  bottom: 90px;
  left: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1e293b;
  color: #94a3b8;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  transition: all 0.2s;
  z-index: 990;
  display: flex;
  align-items: center;
  justify-content: center;
}
.music-fab:hover { background: #2563eb; color: white; transform: scale(1.08); }

/* Player bar */
.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.97);
  backdrop-filter: blur(16px);
  color: #f1f5f9;
  z-index: 990;
  border-top: 1px solid #1e293b;
}

.player-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.5rem;
  cursor: pointer;
  transition: background 0.15s;
}
.player-bar:hover { background: rgba(255,255,255,0.04); }

.player-left { display: flex; align-items: center; gap: 0.75rem; }

.play-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.play-btn:hover { background: #1d4ed8; transform: scale(1.05); }

.track-info { display: flex; flex-direction: column; }
.track-name { font-size: 0.85rem; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.track-time { font-size: 0.72rem; color: #64748b; }

.player-right { display: flex; align-items: center; gap: 0.75rem; }
.pulse-icon { font-size: 0.85rem; color: #64748b; transition: color 0.2s; }
.pulse-icon.playing { color: #2563eb; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.expand-icon { font-size: 0.7rem; color: #64748b; }

/* Expanded panel */
.player-expanded {
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.time-label { font-size: 0.72rem; color: #64748b; white-space: nowrap; min-width: 32px; }

.progress-slider, .volume-slider {
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #1e293b;
  outline: none;
  cursor: pointer;
}
.progress-slider { flex: 1; }
.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%; background: #2563eb; cursor: pointer;
}
.volume-slider { width: 100px; }
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%; background: #60a5fa; cursor: pointer;
}

.volume-section { display: flex; align-items: center; gap: 0.75rem; }
.vol-icon { font-size: 0.85rem; color: #64748b; }

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #1e293b;
  color: #94a3b8;
  font-size: 0.82rem;
  cursor: pointer;
  border: 1px solid #334155;
  transition: all 0.18s;
  align-self: flex-start;
}
.upload-btn:hover { background: #334155; color: #f1f5f9; }

.quick-tracks { }
.quick-label { font-size: 0.78rem; color: #64748b; margin-bottom: 0.4rem; }
.track-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.track-pill {
  padding: 0.3rem 0.75rem; border-radius: 20px;
  background: #1e293b; color: #94a3b8; border: 1px solid #334155;
  font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
}
.track-pill:hover { background: #334155; color: #f1f5f9; }
.track-pill.active { background: #1d4ed8; color: white; border-color: #2563eb; }

/* Transitions */
.player-slide-enter-active, .player-slide-leave-active { transition: transform 0.25s ease; }
.player-slide-enter-from, .player-slide-leave-to { transform: translateY(100%); }

.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding: 0 1.5rem; }
.expand-enter-to, .expand-leave-from { max-height: 300px; }

@media (max-width: 600px) {
  .player-bar { padding: 0.5rem 1rem; }
  .track-name { max-width: 130px; }
  .volume-slider { width: 70px; }
}
</style>
