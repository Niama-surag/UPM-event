// src/stores/music.js
// Global music store — persists across navigation, audio never restarts on route change
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useMusicStore = defineStore('music', () => {
  // The single shared Audio instance — created once, lives forever
  let audioInstance = null

  const isPlaying = ref(false)
  const volume = ref(0.5)
  const currentTrackName = ref('')
  const currentTrackUrl = ref('')
  const duration = ref(0)
  const currentTime = ref(0)
  const isLoaded = ref(false)

  // Initialize or reuse the audio element
  const getAudio = () => {
    if (!audioInstance) {
      audioInstance = new Audio()
      audioInstance.volume = volume.value

      audioInstance.addEventListener('timeupdate', () => {
        currentTime.value = audioInstance.currentTime
      })
      audioInstance.addEventListener('loadedmetadata', () => {
        duration.value = audioInstance.duration
        isLoaded.value = true
      })
      audioInstance.addEventListener('ended', () => {
        // Loop by default
        audioInstance.currentTime = 0
        audioInstance.play()
      })
    }
    return audioInstance
  }

  // Load a file from an <input type="file"> event
  const loadFile = (file) => {
    if (!file || !file.type.startsWith('audio/')) return
    const url = URL.createObjectURL(file)
    loadUrl(url, file.name)
  }

  // Load from a URL string
  const loadUrl = (url, name = 'Track') => {
    const audio = getAudio()
    isLoaded.value = false
    currentTrackUrl.value = url
    currentTrackName.value = name
    audio.src = url
    audio.load()
  }

  const play = async () => {
    const audio = getAudio()
    if (!audio.src) return
    try {
      await audio.play()
      isPlaying.value = true
    } catch (e) {
      console.warn('Playback failed:', e)
    }
  }

  const pause = () => {
    const audio = getAudio()
    audio.pause()
    isPlaying.value = false
  }

  const togglePlay = () => {
    if (isPlaying.value) pause()
    else play()
  }

  const setVolume = (val) => {
    volume.value = val
    const audio = getAudio()
    audio.volume = val
  }

  const seek = (time) => {
    const audio = getAudio()
    audio.currentTime = time
    currentTime.value = time
  }

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return {
    isPlaying,
    volume,
    currentTrackName,
    currentTrackUrl,
    duration,
    currentTime,
    isLoaded,
    loadFile,
    loadUrl,
    play,
    pause,
    togglePlay,
    setVolume,
    seek,
    formatTime
  }
})
