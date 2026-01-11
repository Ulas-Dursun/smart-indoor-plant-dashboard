import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDlDOQHNLevlsCrmA3qqP19Vs3hkB01p6w",
    authDomain: "smart-indoor-plant-syste-6edf1.firebaseapp.com",
    databaseURL: "https://smart-indoor-plant-syste-6edf1-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-indoor-plant-syste-6edf1",
    storageBucket: "smart-indoor-plant-syste-6edf1.firebasestorage.app",
    messagingSenderId: "414003180146",
    appId: "1:414003180146:web:4253c06ca7938809da08eb"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
