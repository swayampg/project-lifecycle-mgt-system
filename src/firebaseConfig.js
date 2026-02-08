// 1. Import the necessary tools from the Firebase "library" we installed
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * 🔹 TO THE DATABASE TEAM:
 * 1. Go to https://console.firebase.google.com/
 * 2. Click on your Project Name.
 * 3. Click the Gear Icon (Project Settings) > General.
 * 4. Scroll down to "Your Apps" and click the (</>) Web icon.
 * 5. Copy the 'firebaseConfig' object and paste the values below.
 */

const firebaseConfig = {
  // The 'Key' that allows our website to talk to your Firebase project
  apiKey: "PASTE_API_KEY_HERE",

  // Your project's unique address on the internet
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",

  // The unique ID of your Firebase project
  projectId: "PASTE_PROJECT_ID_HERE",

  // Where images/files will be stored (if we use it later)
  storageBucket: "PASTE_PROJECT_ID.appspot.com",

  // Used for sending notifications/messages
  messagingSenderId: "PASTE_SENDER_ID_HERE",

  // The unique ID for this specific Web App
  appId: "PASTE_APP_ID_HERE"
};

// 2. This line "turns on" the connection using the settings above
const app = initializeApp(firebaseConfig);

// 3. This line "turns on" the Authentication feature (the Login/Sign-up part)
// Make sure you have enabled "Email/Password" in the Firebase Console under Build > Authentication
export const auth = getAuth(app);