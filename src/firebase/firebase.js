// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBKD04HtWsI9vb_Ka7G-6t8BrRXJrVbo_k",
    authDomain: "lagoinhamusic-dc9f6.firebaseapp.com",
    projectId: "lagoinhamusic-dc9f6",
    storageBucket: "lagoinhamusic-dc9f6.appspot.com",
    messagingSenderId: "822418720763",
    appId: "1:822418720763:web:18d1b66cf07ada87242d5e",
    measurementId: "G-6NNBWZT2EK"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };