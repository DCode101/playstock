import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "AIzaSyC5WAVF1sJ5u0Mgm6Mr4rvvmzgHzSzR7v0",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "playstock-53b0f-3b540.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "playstock-53b0f-3b540",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "playstock-53b0f-3b540.firebasestorage.app",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "121206034752",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:121206034752:web:cff3e842881d074497aaa5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
