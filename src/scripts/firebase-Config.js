import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDcwHT9nXCOz8K6ysLrKoFBdfXXn-tfVLo",
    authDomain: "ponencia-pruebas.firebaseapp.com",
    projectId: "ponencia-pruebas",
    storageBucket: "ponencia-pruebas.firebasestorage.app",
    messagingSenderId: "141694379657",
    appId: "1:141694379657:web:c18b772d02bd93fc604858",
    measurementId: "G-E0LQ9797PN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);