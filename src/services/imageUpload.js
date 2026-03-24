// src/services/imageUpload.js
// ─────────────────────────────────────────────────────────────
// Centralised image + media upload service
// WHY a service module?
//   → All upload logic in one place — components stay thin
//   → Consistent validation across the app
//   → Progress callbacks work reliably with uploadBytesResumable
// ─────────────────────────────────────────────────────────────
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/services/firebase'

// ── Validation constants ──────────────────────────────────────
const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5 MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024  // 50 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac']

// ── Core uploader ─────────────────────────────────────────────
/**
 * Upload a file to Firebase Storage with progress reporting.
 *
 * @param {File}     file         - The File object from an <input type="file">
 * @param {string}   path         - Storage path, e.g. "avatars/uid/avatar.jpg"
 * @param {Function} onProgress   - Optional: called with (percent 0–100)
 * @returns {Promise<string>}     - Download URL on success
 * @throws {Error}                - Validation or upload error
 */
export function uploadFile(file, path, onProgress = null) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    const sRef = storageRef(storage, path)
    const task = uploadBytesResumable(sRef, file)

    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      (error) => {
        // Firebase storage error codes → readable messages
        const messages = {
          'storage/unauthorized':    'You do not have permission to upload this file.',
          'storage/canceled':        'Upload was cancelled.',
          'storage/unknown':         'Unknown upload error. Please try again.',
          'storage/quota-exceeded':  'Storage quota exceeded.',
          'storage/object-not-found': 'File not found.',
        }
        reject(new Error(messages[error.code] || error.message))
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

// ── Image upload (with validation) ───────────────────────────
/**
 * Upload a profile/event/club image.
 * Validates type and size before uploading.
 *
 * @param {File}     file
 * @param {string}   folder       - e.g. "avatars/uid" or "events/clubId"
 * @param {Function} onProgress
 * @returns {Promise<string>}     - Download URL
 */
export async function uploadImage(file, folder, onProgress = null) {
  // ── Validation ────────────────────────────────────────────
  if (!file) throw new Error('Please select an image file.')

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: JPG, PNG, WebP, GIF. Got: ${file.type}`)
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`Image too large (${sizeMB} MB). Maximum is 5 MB.`)
  }

  // ── Unique filename to prevent collisions ─────────────────
  const ext      = file.name.split('.').pop().toLowerCase()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path     = `${folder}/${filename}`

  return uploadFile(file, path, onProgress)
}

// ── Audio upload (with validation) ───────────────────────────
export async function uploadAudio(file, folder = 'music', onProgress = null) {
  if (!file) throw new Error('Please select an audio file.')

  if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !file.type.startsWith('audio/')) {
    throw new Error('Only audio files are allowed.')
  }

  if (file.size > MAX_AUDIO_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(0)
    throw new Error(`Audio file too large (${sizeMB} MB). Maximum is 50 MB.`)
  }

  const ext      = file.name.split('.').pop().toLowerCase()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path     = `${folder}/${filename}`

  return uploadFile(file, path, onProgress)
}

// ── Convenience wrappers ──────────────────────────────────────
export const uploadAvatar     = (file, uid, cb)     => uploadImage(file, `avatars/${uid}`, cb)
export const uploadEventImage = (file, clubId, cb)  => uploadImage(file, `events/${clubId}`, cb)
export const uploadClubLogo   = (file, clubId, cb)  => uploadImage(file, `clubs/${clubId}/logo`, cb)
export const uploadBackground = (file, cb)          => uploadImage(file, 'site', cb)

// ── Local preview helper ──────────────────────────────────────
/**
 * Generate a local object URL for image preview (no upload).
 * Remember to call URL.revokeObjectURL(url) when done.
 */
export function createPreviewUrl(file) {
  if (!file || !file.type.startsWith('image/')) return null
  return URL.createObjectURL(file)
}

// ── Format file size ──────────────────────────────────────────
export function formatFileSize(bytes) {
  if (bytes < 1024)            return `${bytes} B`
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
