import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_DEMO_KEY_REPLACE_WITH_YOURS",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-indoor-plant-demo.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://smart-indoor-plant-demo-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-indoor-plant-demo",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-indoor-plant-demo.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demoappidentity000000",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMOPROJECT"
};

// Initialize Firebase safely (avoid multiple initializations in HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const database = getDatabase(app);
export default app;
