// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0yOUvC0m_IFYEISWaR1tKhA599EqtqMs",
  authDomain: "project-management-syste-dba4b.firebaseapp.com",
  projectId: "project-management-syste-dba4b",
  storageBucket: "project-management-syste-dba4b.firebasestorage.app",
  messagingSenderId: "80651715198",
  appId: "1:80651715198:web:4b03ccbbf0eeb144e64e2f"
};

// INITIALIZE APP FIRST
const app = initializeApp(firebaseConfig);

// EXPORT SERVICES AFTER
export const auth = getAuth(app);
export const db = getFirestore(app);