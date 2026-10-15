import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyADx2AvcjDOJNCPiUqxBcH-DMpsVe-kqNI",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-plant-monitor-3c171.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://smart-plant-monitor-3c171-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-plant-monitor-3c171",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-plant-monitor-3c171.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "849155838832",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:849155838832:web:32675f94bce345cd62b5b5",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XZWX6P0WXX"
};

// Initialize Firebase safely (avoid multiple initializations in HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const database = getDatabase(app);
export default app;