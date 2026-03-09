q
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgFak7TTw6RKtG42UcEOdEIkt1B_gS6-w",
  authDomain: "upm-events-9f6f6.firebaseapp.com",
  projectId: "upm-events-9f6f6",
  storageBucket: "upm-events-9f6f6.firebasestorage.app",
  messagingSenderId: "929988477171",
  appId: "1:929988477171:web:c0008cde377b39fd2bf786"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)