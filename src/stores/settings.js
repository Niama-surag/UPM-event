// src/stores/settings.js
// Global site settings store — background image/video managed by admin
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

// Configuration Cloudinary
const CLOUD_NAME = 'delbtkoa4'
const UPLOAD_PRESET = 'upm-events-preset'

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

  // ── Upload media file via Cloudinary Widget ─────────────────
  const uploadMedia = (file) => {
    return new Promise((resolve, reject) => {
      // Vérifier que le script Cloudinary est chargé
      if (!window.cloudinary) {
        reject(new Error('Cloudinary script not loaded. Please refresh the page.'))
        return
      }

      // Vérifier le type de fichier
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      if (!isVideo && !isImage) {
        reject(new Error('Only image or video files are allowed'))
        return
      }

      uploading.value = true
      uploadProgress.value = 0

      // Créer le widget Cloudinary
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          sources: ['local'],
          multiple: false,
          maxFileSize: 50 * 1024 * 1024, // 50 MB
          folder: 'site-backgrounds',
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'],
          resourceType: isVideo ? 'video' : 'image'
        },
        (error, result) => {
          if (error) {
            uploading.value = false
            uploadProgress.value = 0
            reject(error)
            return
          }
          
          if (result && result.event === 'success') {
            uploading.value = false
            uploadProgress.value = 100
            const url = result.info.secure_url
            const type = result.info.resource_type === 'video' ? 'video' : 'image'
            
            // Sauvegarder automatiquement dans Firestore
            saveBackground({ 
              type, 
              url, 
              opacity: 0.15, 
              blur: 0, 
              overlay: true 
            })
            
            resolve({ url, type })
          } else if (result && result.event === 'progress') {
            uploadProgress.value = Math.round((result.bytesUploaded / result.totalBytes) * 100)
          } else if (result && result.event === 'close') {
            // Widget fermé sans upload
            uploading.value = false
            uploadProgress.value = 0
          }
        }
      )
      
      // Ouvrir le widget
      widget.open()
    })
  }

  // ── Remove background ───────────────────────────────────────
  const removeBackground = async () => {
    await saveBackground({ type: 'none', url: '', opacity: 0.15, blur: 0, overlay: true })
  }

  // ── Appliquer le background au DOM (optionnel) ──────────────
  const applyBackgroundToApp = () => {
    const bg = background.value
    
    if (bg.type === 'none' || !bg.url) {
      // Retirer le style global
      const style = document.getElementById('global-bg-style')
      if (style) style.remove()
      return
    }
    
    let style = document.getElementById('global-bg-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'global-bg-style'
      document.head.appendChild(style)
    }
    
    style.textContent = `
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('${bg.url}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        z-index: -2;
        opacity: ${bg.opacity || 0.15};
        filter: blur(${bg.blur || 0}px);
      }
      ${bg.overlay !== false ? `
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        z-index: -1;
      }
      ` : 'body::after { display: none; }'}
    `
  }

  // Écouter les changements pour appliquer le style
  const initWithStyle = () => {
    init()
    // Observer les changements de background
    setInterval(() => {
      applyBackgroundToApp()
    }, 1000)
  }

  return {
    background,
    loading,
    uploading,
    uploadProgress,
    init: initWithStyle,
    stop,
    saveBackground,
    uploadMedia,
    removeBackground,
    applyBackgroundToApp
  }
})