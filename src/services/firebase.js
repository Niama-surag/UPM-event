// src/services/firebase.js
// Added: Firebase Storage (needed for profile image upload)
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            "AIzaSyBgFak7TTw6RKtG42UcEOdEIkt1B_gS6-w",
  authDomain:        "upm-events-9f6f6.firebaseapp.com",
  projectId:         "upm-events-9f6f6",
  storageBucket:     "upm-events-9f6f6.appspot.com",
  messagingSenderId: "929988477171",
  appId:             "1:929988477171:web:c0008cde377b39fd2bf786"
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)   // ← NEW: used by auth store for avatar uploads
