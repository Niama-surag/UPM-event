// src/stores/settings.js
// Global site settings store — background image/video managed by admin
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, storage } from '@/services/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

export const useSettingsStore = defineStore('settings', () => {
  // ── State ──────────────────────────────────────────────────
  const background = ref({
    type:    'none',    // 'none' | 'image' | 'video'
    url:     '',
    opacity: 0.15,      // 0-1 — how visible the background is
    blur:    0,         // px blur
    overlay: true,      // dark overlay on top
  })
  const loading   = ref(true)
  const uploading = ref(false)
  const uploadProgress = ref(0)

  // ── Live listener — updates all clients immediately ─────────
  let unsubscribe = null

  const init = () => {
    unsubscribe = onSnapshot(doc(db, 'settings', 'background'), (snap) => {
      if (snap.exists()) {
        background.value = { ...background.value, ...snap.data() }
      }
      loading.value = false
    }, () => {
      loading.value = false
    })
  }

  const stop = () => { if (unsubscribe) unsubscribe() }

  // ── Save settings (admin only) ──────────────────────────────
  const saveBackground = async (data) => {
    await setDoc(doc(db, 'settings', 'background'), data, { merge: true })
    background.value = { ...background.value, ...data }
  }

  // ── Upload media file ───────────────────────────────────────
  // Returns { url, type } on success
  const uploadMedia = (file) => {
    return new Promise((resolve, reject) => {
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      if (!isVideo && !isImage) {
        reject(new Error('Only image or video files are allowed'))
        return
      }

      uploading.value = true
      uploadProgress.value = 0

      const ext  = file.name.split('.').pop()
      const path = `site/background.${ext}`
      const sRef = storageRef(storage, path)
      const task = uploadBytesResumable(sRef, file)

      task.on('state_changed',
        (snap) => {
          uploadProgress.value = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        },
        (err) => {
          uploading.value    = false
          uploadProgress.value = 0
          reject(err)
        },
        async () => {
          const url  = await getDownloadURL(task.snapshot.ref)
          uploading.value    = false
          uploadProgress.value = 100
          resolve({ url, type: isVideo ? 'video' : 'image' })
        }
      )
    })
  }

  // ── Remove background ───────────────────────────────────────
  const removeBackground = async () => {
    await saveBackground({ type: 'none', url: '', opacity: 0.15, blur: 0, overlay: true })
  }

  return {
    background,
    loading,
    uploading,
    uploadProgress,
    init,
    stop,
    saveBackground,
    uploadMedia,
    removeBackground
  }
})
