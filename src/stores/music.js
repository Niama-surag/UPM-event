// src/stores/music.js  (UPDATED — playlist support)
// ─────────────────────────────────────────────────────────────
// Global music store — persists across navigation.
// NEW: Firestore-backed playlist + upload from MusicPlayer.
// ─────────────────────────────────────────────────────────────
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, storage } from '@/services/firebase'
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

export const useMusicStore = defineStore('music', () => {
  // ── Audio engine ───────────────────────────────────────────
  let audioInstance = null

  const isPlaying      = ref(false)
  const volume         = ref(0.5)
  const currentTime    = ref(0)
  const duration       = ref(0)
  const isLoaded       = ref(false)
  const currentTrack   = ref(null)   // { id, title, fileUrl }

  // ── Playlist state ─────────────────────────────────────────
  const playlist       = ref([])     // Firestore music docs
  const currentIndex   = ref(-1)
  const loadingPlaylist = ref(false)
  const uploading       = ref(false)
  const uploadProgress  = ref(0)

  const hasPlaylist  = computed(() => playlist.value.length > 0)
  const trackName    = computed(() => currentTrack.value?.title || '')

  // ── Audio instance ─────────────────────────────────────────
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
        // Auto-advance playlist
        playNext()
      })
    }
    return audioInstance
  }

  // ── Load a track object ────────────────────────────────────
  const loadTrack = (track) => {
    const audio    = getAudio()
    isLoaded.value = false
    currentTrack.value = track
    audio.src = track.fileUrl
    audio.load()
  }

  // ── Load from a File directly (local, not Firestore) ───────
  const loadFile = (file) => {
    if (!file?.type.startsWith('audio/')) return
    const url = URL.createObjectURL(file)
    loadTrack({ id: null, title: file.name.replace(/\.[^.]+$/, ''), fileUrl: url })
  }

  // ── Playback controls ──────────────────────────────────────
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
    getAudio().pause()
    isPlaying.value = false
  }

  const stop = () => {
    const audio = getAudio()
    audio.pause()
    audio.currentTime = 0
    isPlaying.value = false
  }

  const togglePlay = () => {
    if (isPlaying.value) pause()
    else play()
  }

  const setVolume = (val) => {
    volume.value = parseFloat(val)
    getAudio().volume = volume.value
  }

  const seek = (time) => {
    const audio = getAudio()
    audio.currentTime = time
    currentTime.value = time
  }

  // ── Playlist navigation ────────────────────────────────────
  const playIndex = async (i) => {
    if (i < 0 || i >= playlist.value.length) return
    currentIndex.value = i
    loadTrack(playlist.value[i])
    // Small delay to let audio.load() start before play()
    setTimeout(play, 80)
  }

  const playNext = () => {
    if (!hasPlaylist.value) return
    const next = (currentIndex.value + 1) % playlist.value.length
    playIndex(next)
  }

  const playPrev = () => {
    if (!hasPlaylist.value) return
    const prev = currentIndex.value <= 0
      ? playlist.value.length - 1
      : currentIndex.value - 1
    playIndex(prev)
  }

  // ── Firestore playlist ─────────────────────────────────────
  const fetchPlaylist = async () => {
    loadingPlaylist.value = true
    try {
      const snap = await getDocs(
        query(collection(db, 'music'), orderBy('createdAt', 'asc'))
      )
      playlist.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.error('Failed to fetch playlist:', e)
    } finally {
      loadingPlaylist.value = false
    }
  }

  // ── Upload audio file to Storage + Firestore ───────────────
  const uploadTrack = (file, uploadedBy = '') => {
    return new Promise((resolve, reject) => {
      if (!file?.type.startsWith('audio/')) {
        reject(new Error('Only audio files are supported'))
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        reject(new Error('File too large (max 50 MB)'))
        return
      }

      uploading.value = true
      uploadProgress.value = 0

      const ext  = file.name.split('.').pop()
      const path = `music/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const sRef = storageRef(storage, path)
      const task = uploadBytesResumable(sRef, file)

      task.on('state_changed',
        (snap) => {
          uploadProgress.value = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        },
        (err) => {
          uploading.value = false
          reject(err)
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          const title = file.name.replace(/\.[^.]+$/, '')
          const docRef = await addDoc(collection(db, 'music'), {
            title,
            fileUrl:    url,
            storagePath: path,
            uploadedBy,
            createdAt:  serverTimestamp()
          })
          const newTrack = { id: docRef.id, title, fileUrl: url, storagePath: path }
          playlist.value.push(newTrack)
          uploading.value = false
          resolve(newTrack)
        }
      )
    })
  }

  // ── Delete a track ─────────────────────────────────────────
  const deleteTrack = async (track) => {
    // Remove from Firestore
    await deleteDoc(doc(db, 'music', track.id))
    // Remove from Storage
    if (track.storagePath) {
      try {
        await deleteObject(storageRef(storage, track.storagePath))
      } catch {}
    }
    playlist.value = playlist.value.filter(t => t.id !== track.id)
    if (currentTrack.value?.id === track.id) stop()
  }

  // ── Time formatter ─────────────────────────────────────────
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return {
    // playback
    isPlaying, volume, currentTime, duration, isLoaded,
    currentTrack, trackName,
    getAudio,
    loadFile, loadTrack,
    play, pause, stop, togglePlay, setVolume, seek,
    // playlist
    playlist, currentIndex, hasPlaylist, loadingPlaylist,
    uploading, uploadProgress,
    fetchPlaylist, uploadTrack, deleteTrack,
    playIndex, playNext, playPrev,
    formatTime
  }
})
