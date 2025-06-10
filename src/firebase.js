
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDW9tTWIH6HR1B-SGdYwxNEGI3YEn10d3E",
  authDomain: "trial-9a8f0.firebaseapp.com",
  databaseURL: "https://trial-9a8f0-default-rtdb.firebaseio.com/",
  projectId: "trial-9a8f0",
  storageBucket: "trial-9a8f0.firebasestorage.app",
  messagingSenderId: "117300973339",
  appId: "1:117300973339:web:9e2e8c510710c2bb61cdbe",
  measurementId: "G-7951QLSC9V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

export { auth, provider, db, ref, set, onValue };
