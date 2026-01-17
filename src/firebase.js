import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
    apiKey: "AIzaSyADx2AvcjDOJNCPiUqxBcH-DMpsVe-kqNI",
    authDomain: "smart-plant-monitor-3c171.firebaseapp.com",
    databaseURL: "https://smart-plant-monitor-3c171-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-plant-monitor-3c171",
    storageBucket: "smart-plant-monitor-3c171.firebasestorage.app",
    messagingSenderId: "849155838832",
    appId: "1:849155838832:web:32675f94bce345cd62b5b5",
    measurementId: "G-XZWX6P0WXX"
};

// Start Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);