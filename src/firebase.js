import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Export this so adminDash.js can use it for the secondary app
export const firebaseConfig = {
  apiKey: "AIzaSyALGHSJlamvkhVwDVLhYQVcrBLZaOd6XqI",
  authDomain: "biasdetection-8e483.firebaseapp.com",
  databaseURL: "https://biasdetection-8e483-default-rtdb.firebaseio.com",
  projectId: "biasdetection-8e483",
  storageBucket: "biasdetection-8e483.firebasestorage.app",
  messagingSenderId: "38882764031",
  appId: "1:38882764031:web:63586f0cf5aafb582ed8ca",
  measurementId: "G-NVM83R1K24"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);