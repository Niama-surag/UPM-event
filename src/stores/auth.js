// src/stores/auth.js
// Full auth store with:
//   - Role-aware registration (always user, never self-admin)
//   - Profile update with Firebase Storage
//   - First-login detection for seeded admins
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '@/services/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/services/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user        = ref(null)
  const userProfile = ref(null)
  const loading     = ref(true)

  // ── Fetch Firestore profile ──────────────────────────────────
  const fetchUserProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid))
    userProfile.value = snap.exists() ? snap.data() : null
  }

  // ── Auth state listener ──────────────────────────────────────
  const init = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid)

        // Edge case: admin was seeded but logged in via Google/SSO
        // If no Firestore profile exists yet, create a default one.
        // WHY: seedAdmins.js creates the Firestore doc, but if somehow
        //      it was skipped, the app would behave as if the user has no role.
        if (!userProfile.value) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email:      firebaseUser.email,
            name:       firebaseUser.displayName || '',
            role:       'user',   // safe default — admin must be set manually
            photoURL:   firebaseUser.photoURL || '',
            createdAt:  serverTimestamp()
          })
          await fetchUserProfile(firebaseUser.uid)
        }
      } else {
        userProfile.value = null
      }
      loading.value = false
    })
  }

  // ── Login ────────────────────────────────────────────────────
  const login = async (email, password, remember = false) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const cred = await signInWithEmailAndPassword(auth, email, password)

    // Ensure Firestore profile exists after login
    // WHY: seeded admins have a Firestore doc, but we re-fetch to ensure
    //      userProfile.role is loaded before any route guard runs
    await fetchUserProfile(cred.user.uid)
    return cred
  }

  // ── Register (always creates role = "user") ──────────────────
  // WHY enforce role = "user" here even though Firestore rules do it too?
  //   → Defence in depth: both layers must agree
  //   → If Firestore rules ever change, this is still a safe fallback
  const register = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      name:         name || '',
      role:         'user',      // ← ALWAYS user — never admin on self-registration
      photoURL:     '',
      hoursSpent:   0,
      eventsJoined: 0,
      createdAt:    serverTimestamp()
    })
    return cred
  }

  // ── Profile update with Firebase Storage ─────────────────────
  const updateUserProfile = async ({ name, photoFile }) => {
    if (!user.value) throw new Error('Not authenticated')

    let photoURL = userProfile.value?.photoURL || ''

    if (photoFile) {
      const ext  = photoFile.name.split('.').pop()
      const path = `avatars/${user.value.uid}/${Date.now()}.${ext}`
      const sRef = storageRef(storage, path)
      const snap = await uploadBytes(sRef, photoFile)
      photoURL   = await getDownloadURL(snap.ref)
    }

    await updateProfile(auth.currentUser, {
      displayName: name,
      photoURL:    photoURL || auth.currentUser.photoURL || ''
    })

    await updateDoc(doc(db, 'users', user.value.uid), { name, photoURL })
    await fetchUserProfile(user.value.uid)
  }

  // ── Social logins ─────────────────────────────────────────────
  const googleLogin = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    // Create profile if first time with Google
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', cred.user.uid), {
        email:      cred.user.email,
        name:       cred.user.displayName || '',
        role:       'user',
        photoURL:   cred.user.photoURL || '',
        createdAt:  serverTimestamp()
      })
    }
    return cred
  }

  const microsoftLogin = () => signInWithPopup(auth, new OAuthProvider('microsoft.com'))
  const linkedinLogin  = () => signInWithPopup(auth, new OAuthProvider('linkedin.com'))
  const logout         = () => signOut(auth)
  const resetPassword  = (e) => sendPasswordResetEmail(auth, e)

  // ── Convenience getters ───────────────────────────────────────
  const isAdmin = () => userProfile.value?.role === 'admin'

  return {
    user, userProfile, loading,
    init, login, register, logout,
    googleLogin, microsoftLogin, linkedinLogin,
    resetPassword, updateUserProfile, fetchUserProfile,
    isAdmin
  }
})
