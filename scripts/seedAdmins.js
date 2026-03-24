// scripts/seedAdmins.js
// ─────────────────────────────────────────────────────────────
// One-time script to create the 3 predefined admin accounts.
//
// WHY a script instead of hardcoding in the app?
//   → App code is exposed to the client. Embedding credentials
//     there would leak them in the JS bundle.
//   → This script runs ONCE in a trusted environment (your machine),
//     never ships to the browser.
//
// HOW TO RUN:
//   node scripts/seedAdmins.js
//
// REQUIREMENTS:
//   npm install firebase dotenv
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

// ── Firebase config (same as your app) ───────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBgFak7TTw6RKtG42UcEOdEIkt1B_gS6-w",
  authDomain:        "upm-events-9f6f6.firebaseapp.com",
  projectId:         "upm-events-9f6f6",
  storageBucket:     "upm-events-9f6f6.appspot.com",
  messagingSenderId: "929988477171",
  appId:             "1:929988477171:web:c0008cde377b39fd2bf786"
}

// ── Admin accounts to seed ────────────────────────────────────
// ⚠️  SECURITY NOTE: These credentials are used ONLY to create
//    the accounts. After running this script, delete or
//    .gitignore this file — never commit credentials to git.
const ADMIN_ACCOUNTS = [
  {
    email:    'haytam@gmail.com',
    password: 'hayta1234',
    name:     'Haytam'
  },
  {
    email:    'niama@gmail.com',
    password: 'niama1234',
    name:     'Niama'
  },
  {
    email:    'malika@gmail.com',
    password: 'malika1234',
    name:     'Malika'
  }
]

// ─────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

// ── Seed one admin ────────────────────────────────────────────
async function seedAdmin({ email, password, name }) {
  console.log(`\n▶  Processing: ${email}`)

  // Check if account already exists (idempotent — safe to run twice)
  // WHY fetchSignInMethodsForEmail?
  //   → Avoids duplicate account error crashing the whole script
  const methods = await fetchSignInMethodsForEmail(auth, email)

  let uid

  if (methods.length > 0) {
    console.log(`   ⚠️  Auth account already exists — signing in to get UID`)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      uid = cred.user.uid
    } catch (e) {
      console.log(`   ❌ Could not sign in (wrong password?): ${e.message}`)
      return
    }
  } else {
    console.log(`   ✅ Creating Firebase Auth account`)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    uid = cred.user.uid
  }

  // Check if Firestore profile already exists
  const userRef  = doc(db, 'users', uid)
  const existing = await getDoc(userRef)

  if (existing.exists() && existing.data().role === 'admin') {
    console.log(`   ⚠️  Firestore profile already admin — skipping`)
    return
  }

  // Create / update Firestore user document
  // WHY setDoc with merge:true?
  //   → If profile exists but role isn't admin, merge updates only
  //     the role without wiping other fields (name, photoURL, etc.)
  await setDoc(userRef, {
    email,
    name,
    role:          'admin',     // ← THE CRITICAL FIELD
    photoURL:      '',
    hoursSpent:    0,
    eventsJoined:  0,
    createdAt:     serverTimestamp(),
    seededAt:      new Date().toISOString(),
    seededBy:      'seedAdmins.js'
  }, { merge: true })

  console.log(`   ✅ Admin profile created/updated in Firestore — UID: ${uid}`)
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════')
  console.log('   UPM-Event — Admin Seeding Script    ')
  console.log('═══════════════════════════════════════')

  let success = 0
  let failed  = 0

  for (const account of ADMIN_ACCOUNTS) {
    try {
      await seedAdmin(account)
      success++
    } catch (err) {
      console.error(`   ❌ Failed for ${account.email}: ${err.message}`)
      failed++
    }
  }

  console.log('\n═══════════════════════════════════════')
  console.log(`   Done: ${success} succeeded, ${failed} failed`)
  console.log('═══════════════════════════════════════')
  console.log('\n⚠️  Remember:')
  console.log('   1. Delete or .gitignore this file before committing')
  console.log('   2. Ask admins to change their passwords after first login')
  console.log('   3. Test by logging in at /login with one admin account\n')

  process.exit(0)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
