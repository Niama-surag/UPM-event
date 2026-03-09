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
  browserSessionPersistence
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
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

  // UPDATED REGISTER FUNCTION with Firestore document creation
  const register = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    // Create a user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      name: name || '',
      role: 'user', // default role; change to 'admin' manually in Firestore if needed
      hoursSpent: 0,
      eventsJoined: 0,
      createdAt: new Date().toISOString()
    })
    return userCredential
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
    resetPassword
  }
})