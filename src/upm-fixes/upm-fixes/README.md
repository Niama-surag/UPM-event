# UPM-Event — Fix Instructions

## Files in this package and where to paste them

| File in this ZIP              | Replace this file in your project                          |
|-------------------------------|------------------------------------------------------------|
| index.html                    | E:\UPM-event\index.html                                    |
| src/assets/main.css           | E:\UPM-event\src\assets\main.css                           |
| src/stores/auth.js            | E:\UPM-event\src\stores\auth.js                            |
| src/router/index.js           | E:\UPM-event\src\router\index.js                           |
| src/views/EspaceEtudiant.vue  | E:\UPM-event\src\views\EspaceEtudiant.vue                  |
| src/views/EventDetailView.vue | E:\UPM-event\src\views\EventDetailView.vue  (NEW FILE)     |

## What each fix does

1. index.html
   - Changes title from "Vite App" to "UPM-Event"
   - Adds Cloudinary script so image upload works

2. src/assets/main.css
   - Removes the broken 2-column grid that was destroying page layouts
   - Adds useful utility classes (btn, card, field, skeleton)

3. src/stores/auth.js
   - Adds the missing updateUserProfile() function
   - Without this, saving your profile would silently crash

4. src/router/index.js
   - Fixes the auth guard so Home and About are accessible without login
   - Adds route for EventDetailView (/event/:id)

5. src/views/EspaceEtudiant.vue
   - Fixes wrong ProfileEdit import (was using unstyled version)
   - Improves tabs styling

6. src/views/EventDetailView.vue (NEW)
   - Full event detail page with hero image, meta info, registration, share buttons
   - Clicking an event card now navigates here

## How to apply

1. Download this ZIP
2. Extract it
3. Copy each file to the matching path in your project (see table above)
4. Run: npm run dev
5. Done!
