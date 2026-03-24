# UPM-Event — Fixes & Feature Implementation Guide
## How to integrate each file

---

### 1. `services/imageUpload.js`  ← REPLACE existing file

**What changed:**
- `uploadBytesResumable` used correctly with proper progress events
- Validates `type.startsWith("image/")` AND exact MIME list
- Validates `size < 5 MB` with friendly error messages
- Unique filenames via `Date.now() + random` (prevents collisions)
- Convenience wrappers: `uploadAvatar`, `uploadEventImage`, `uploadClubLogo`

**Replace all direct upload code with:**
```js
import { uploadAvatar, uploadEventImage } from '@/services/imageUpload'

// In ProfileView.vue — savePhoto():
const url = await uploadAvatar(selectedFile.value, authStore.user.uid, (pct) => {
  uploadPercent.value = pct
})

// In ClubEvents.vue — createEvent():
const url = await uploadEventImage(file, userClub.id, (pct) => {
  uploadProgress.value = pct
})
```

**Firebase Storage rules** (add to `storage.rules`):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /events/{clubId}/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /music/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 50 * 1024 * 1024
        && request.resource.contentType.matches('audio/.*');
    }
    match /site/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

### 2. `stores/notifications.js`  ← NEW FILE

**Integration in `App.vue` or `DefaultLayout.vue`:**
```js
// In setup():
import { useNotificationsStore } from '@/stores/notifications'
const notifStore = useNotificationsStore()

// After auth resolves:
watch(() => authStore.user, (user) => {
  if (user) notifStore.startListening(user.uid)
  else notifStore.stopListening()
}, { immediate: true })
```

**Navbar badge** (already in DefaultLayout, but change the query):
```html
<!-- Replace the existing unreadCount logic in DefaultLayout.vue -->
<span v-if="notifStore.unreadCount > 0" class="notif-badge">
  {{ notifStore.unreadCount }}
</span>
```

**When admin approves a club** (in AdminDashboard.vue `approveClub()`):
```js
import { useNotificationsStore } from '@/stores/notifications'
const notifStore = useNotificationsStore()

// After updateDoc:
await notifStore.notifyClubApproved(club.leaderId, club.name)
```

**When admin rejects:**
```js
await notifStore.notifyClubRejected(club.leaderId, club.name, rejectModal.value.reason)
```

**Firestore index needed** (create in Firebase Console):
```
Collection: notifications
Fields: userId (ASC), createdAt (DESC)
```

---

### 3. `components/AttendanceList.vue`  ← NEW FILE

**Usage in AdminDashboard.vue or AdminClubView.vue:**
```html
<AttendanceList :event-id="selectedEventId" />
```

```js
import AttendanceList from '@/components/AttendanceList.vue'
```

**Firestore field note:** The component queries `eventsid` (lowercase, no space)
which matches your existing `registrations` collection. If you also have `eventsId`
(capital I) in older docs, add a second query or normalise the field.

---

### 4. `components/TargetAudiencePicker.vue`  ← NEW FILE

**Usage in ClubEvents.vue event creation form:**
```html
<TargetAudiencePicker v-model="newEvent.targetAudience" />
```

**In your `newEvent` ref, add:**
```js
const newEvent = ref({
  ...
  targetAudience: ['all'],   // ← add this field
})
```

**Save to Firestore:**
```js
const eventData = {
  ...newEvent.value,
  targetAudience: newEvent.value.targetAudience,
  // existing fields...
}
```

**Filter in HomeView / ExploreView:**
```js
// In filteredEvents computed:
const userField = authStore.userProfile?.field || 'all'

const filteredEvents = computed(() => events.value.filter(e => {
  const ta = e.targetAudience || ['all']
  if (ta.includes('all')) return true
  return ta.includes(userField)
}))
```

**Add `field` to user registration** (RegisterView.vue form):
```html
<select v-model="field">
  <option value="all">General</option>
  <option value="engineering">Engineering</option>
  <option value="business">Business</option>
  <option value="health">Health Sciences</option>
  <option value="law">Law</option>
  <option value="arts">Arts & Design</option>
</select>
```

```js
// In register():
await setDoc(doc(db, 'users', cred.user.uid), {
  ...
  field: field.value || 'all',
})
```

---

### 5. `views/AdminClubView.vue`  ← NEW FILE (was empty)

**Add to AdminDashboard.vue** — in the clubs tab, add a "View Details" button:
```html
<!-- In the approvedClubs table row: -->
<button class="btn-sm-blue" @click="openClubDetails(club.id)">
  <i class="fas fa-chart-bar"></i> Stats
</button>

<!-- Drawer/modal: -->
<div v-if="selectedClubId" class="club-detail-drawer">
  <button @click="selectedClubId = null">← Back</button>
  <AdminClubView :club-id="selectedClubId" />
</div>
```

```js
import AdminClubView from '@/views/AdminClubView.vue'
const selectedClubId = ref(null)
const openClubDetails = (id) => { selectedClubId.value = id }
```

---

### 6. `stores/music.js`  ← REPLACE existing

**Changes:**
- Adds `playlist` array backed by Firestore `music` collection
- `uploadTrack(file, uid)` — uploads to Storage + saves to Firestore
- `deleteTrack(track)` — removes from Storage + Firestore
- `playIndex(i)`, `playNext()`, `playPrev()` — playlist navigation
- `fetchPlaylist()` — loads from Firestore on demand
- `trackName` computed from `currentTrack.title`

**MusicPlayer.vue** now auto-calls `fetchPlaylist()` on mount.

---

### 7. `components/Layouts/MusicPlayer.vue`  ← REPLACE existing

**Changes:**
- 3-tab UI: Player | Playlist | Upload
- Playlist renders all Firestore tracks; click any to play
- Upload tab: drag-and-drop or click to upload audio
- Previous/Next controls integrated
- Delete track from playlist
- Local file fallback still works

---

## Firestore Collections Summary

```
music/
  {id}: { title, fileUrl, storagePath, uploadedBy, createdAt }

notifications/
  {id}: { userId, type, message, meta, read, createdAt }

registrations/
  {id}: { userid, eventsid, pricePaid, couponUsed, registeredAt }
  (note: userId field also used in older docs — both should work)

clubs/
  {id}: {
    name, description, logoUrl,
    createdBy, leaderId,
    status: "pending"|"approved"|"rejected",
    members: string[],
    memberRoles: { [uid]: "club_admin"|"moderator"|"member" },
    memberCustomRoles: { [uid]: string[] },
    createdAt
  }

events/
  {id}: {
    ...existing fields...,
    targetAudience: string[]   // ["all"] or ["engineering","business"]
  }
```

---

## Quick Checklist

- [ ] Copy `services/imageUpload.js` → `src/services/imageUpload.js`
- [ ] Copy `stores/notifications.js` → `src/stores/notifications.js`
- [ ] Copy `stores/music.js` → `src/stores/music.js`
- [ ] Copy `components/AttendanceList.vue` → `src/components/AttendanceList.vue`
- [ ] Copy `components/TargetAudiencePicker.vue` → `src/components/TargetAudiencePicker.vue`
- [ ] Copy `views/AdminClubView.vue` → `src/views/AdminClubView.vue`
- [ ] Copy `components/Layouts/MusicPlayer.vue` → `src/components/Layouts/MusicPlayer.vue`
- [ ] Update Firebase Storage rules (see above)
- [ ] Create Firestore index: `notifications` → `userId ASC, createdAt DESC`
- [ ] Add `field` to user profile (RegisterView + auth store)
- [ ] Wire `notifyClubApproved/Rejected` in AdminDashboard approveClub / confirmReject
- [ ] Wire `notifStore.startListening(uid)` in DefaultLayout or App.vue
- [ ] Add `targetAudience` field to event creation forms
- [ ] Filter events by `targetAudience` in HomeView and ExploreView
