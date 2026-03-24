# UPM-Event — RBAC System Package

## Files and destinations

| File in ZIP                                  | Destination in your project                   |
|----------------------------------------------|-----------------------------------------------|
| src/composables/useRBAC.js                   | NEW FILE — src/composables/useRBAC.js         |
| src/components/ui/RoleBadge.vue              | NEW FILE — src/components/ui/RoleBadge.vue    |
| src/components/ui/EventStatusBadge.vue       | NEW FILE — src/components/ui/EventStatusBadge.vue |
| src/stores/auth.js                           | REPLACE src/stores/auth.js                    |
| src/services/firebase.js                     | REPLACE src/services/firebase.js              |
| src/router/index.js                          | REPLACE src/router/index.js                   |
| src/views/AdminDashboard.vue                 | REPLACE src/views/AdminDashboard.vue          |
| src/views/ExploreView.vue                    | REPLACE src/views/ExploreView.vue             |
| src/views/ProfileView.vue                    | REPLACE src/views/ProfileView.vue             |

---

## Firestore Data Models

### users/{uid}
```json
{
  "email": "user@upm.ac.ma",
  "name": "Niama",
  "role": "user",          // "user" | "admin"
  "photoURL": "",          // Firebase Storage URL
  "hoursSpent": 0,
  "eventsJoined": 0,
  "createdAt": "ISO string"
}
```

### clubs/{clubId}
```json
{
  "name": "0xEsec",
  "description": "Cybersecurity club",
  "leaderId": "uid_of_creator",
  "members": ["uid1", "uid2"],
  "memberRoles": {
    "uid1": "club_admin",
    "uid2": "member",
    "uid3": "moderator"
  },
  "status": "pending",     // "pending" | "approved"
  "logo": "",
  "createdAt": Timestamp
}
```

### events/{eventId}
```json
{
  "title": "CTF Competition",
  "description": "Capture the flags",
  "clubId": "clubId",
  "startDate": Timestamp,   // NEW — replaces startTime
  "endDate": Timestamp,     // NEW — required for status calculation
  "location": "UPM Campus",
  "type": "free",           // "free" | "paid"
  "price": 0,
  "imageURL": "",
  "createdBy": "uid",
  "createdAt": Timestamp
}
```

### clubRequests/{requestId}
```json
{
  "clubId": "clubId",
  "userId": "uid",
  "status": "pending",      // "pending" | "approved" | "rejected"
  "createdAt": Timestamp
}
```

### registrations/{registrationId}
```json
{
  "userid": "uid",
  "eventsid": "eventId",
  "registeredAt": "ISO string"
}
```

### Votes/{voteId}
```json
{
  "userid": "uid",
  "eventsid": "eventId"
}
```

---

## Firebase Setup Required

### 1. Enable Firebase Storage
Go to Firebase Console → Storage → Get Started
Choose production rules then update them:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 2. Install Firebase Storage SDK (already in package.json if firebase >= 9)
No extra install needed — firebase package includes Storage.

### 3. Make yourself Admin
In Firestore Console, find your user document in the `users` collection,
manually change `role` from `"user"` to `"admin"`.
Then logout and login again (the auth store re-fetches on login).

---

## RBAC Design Decisions

### WHY useRBAC composable?
Single source of truth for all permission logic.
Change one file → fixes every component using it.

### WHY memberRoles map instead of a subcollection?
- Map: one Firestore read gets all roles = cheaper
- Subcollection: N reads for N members = expensive
- Max club size is ~100 for a university club, so map is fine

### WHY check roles in router AND components?
- Router guard: hard block (URL protection)
- Component check: hide/show UI elements
- Both = defence in depth

### WHY startDate + endDate on events?
- Old system only had startTime — impossible to know if event is "running"
- endDate enables: upcoming / running / expired status calculation
- Existing events without endDate will show as "upcoming" (safe default)

---

## After applying

1. Copy all files to their destinations
2. Enable Firebase Storage in your console
3. Add Storage rules above
4. Set your user role to "admin" in Firestore manually
5. npm run dev
6. Go to /admin — you should see the admin dashboard
