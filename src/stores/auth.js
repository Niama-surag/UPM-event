// src/stores/auth.js
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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)

  const fetchUserProfile = async (uid) => {
    const docSnap = await getDoc(doc(db, 'users', uid))
    if (docSnap.exists()) {
      userProfile.value = docSnap.data()
    } else {
      userProfile.value = null
    }
  }

  const init = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid)
      } else {
        userProfile.value = null
      }
      loading.value = false
    })
  }

  const login = async (email, password, remember = false) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    return signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    await updateProfile(firebaseUser, { displayName: name })
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      email: firebaseUser.email,
      name: name || '',
      role: 'user',
      hoursSpent: 0,
      eventsJoined: 0,
      photoURL: '',
      createdAt: new Date().toISOString()
    })
    return userCredential
  }

  // ✅ THIS WAS MISSING — fixes ProfileEdit crash
  const updateUserProfile = async ({ name, photoFile }) => {
    if (!user.value) throw new Error('Not authenticated')

    let photoURL = userProfile.value?.photoURL || ''

    if (photoFile) {
      photoURL = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(photoFile)
      })
    }

    await updateProfile(auth.currentUser, {
      displayName: name,
      photoURL: photoURL || auth.currentUser.photoURL || ''
    })

    await updateDoc(doc(db, 'users', user.value.uid), {
      name,
      photoURL
    })

    await fetchUserProfile(user.value.uid)
  }

  const logout = () => signOut(auth)

  const googleLogin = () => {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  const microsoftLogin = () => {
    const provider = new OAuthProvider('microsoft.com')
    return signInWithPopup(auth, provider)
  }

  const linkedinLogin = () => {
    const provider = new OAuthProvider('linkedin.com')
    return signInWithPopup(auth, provider)
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  return {
    user,
    userProfile,
    loading,
    init,
    login,
    register,
    logout,
    googleLogin,
    microsoftLogin,
    linkedinLogin,
    resetPassword,
    updateUserProfile
  }
})
