<!-- ════════════════════════════════════════════════════════════
     UPDATED App.vue
     Changes:
       1. Import theme CSS variables
       2. Initialize theme store on mount
       3. ThemeToggle is imported into DefaultLayout (see below)
     ════════════════════════════════════════════════════════════ -->
<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'

const authStore    = useAuthStore()
const themeStore   = useThemeStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  authStore.init()          // Start Firebase auth listener
  themeStore.init()         // Apply saved theme preference
  settingsStore.init()      // Load site background
})
</script>

<!-- Import theme CSS -->
<!-- In src/main.js, add: import './assets/theme.css' -->


<!-- ════════════════════════════════════════════════════════════
     HOW TO ADD THEMETOGGLE TO DefaultLayout.vue

     In the .nav-actions section, add ThemeToggle between the
     profile menu and the hamburger button:

     <ThemeToggle />

     And import at top of <script setup>:
     import ThemeToggle from '@/components/ThemeToggle.vue'
     ════════════════════════════════════════════════════════════ -->


<!-- ════════════════════════════════════════════════════════════
     HOW TO ADD COUPONMANAGER TO ClubEvents.vue

     In the event creation form, after the event is created,
     show the coupon manager:

     <CouponManager
       v-if="createdEventId && newEvent.type === 'paid'"
       :event-id="createdEventId"
       :club-id="clubId"
     />

     Track the created event ID:
     const createdEventId = ref(null)
     // After addDoc:
     createdEventId.value = docRef.id

     Import:
     import CouponManager from '@/components/CouponManager.vue'
     ════════════════════════════════════════════════════════════ -->


<!-- ════════════════════════════════════════════════════════════
     FIRESTORE INDEXES NEEDED

     Add these composite indexes in Firebase Console → Firestore → Indexes:

     Collection: coupons
     Fields: eventId ASC, code ASC, isActive ASC

     Collection: Votes
     Fields: userid ASC, eventsid ASC

     Collection: registrations
     Fields: userid ASC, eventsid ASC

     Or add to firestore.indexes.json:
     {
       "indexes": [
         {
           "collectionGroup": "coupons",
           "queryScope": "COLLECTION",
           "fields": [
             { "fieldPath": "eventId", "order": "ASCENDING" },
             { "fieldPath": "code", "order": "ASCENDING" },
             { "fieldPath": "isActive", "order": "ASCENDING" }
           ]
         }
       ]
     }
     ════════════════════════════════════════════════════════════ -->
