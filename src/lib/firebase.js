import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBope_NMnV904VqM8ynrjkrE9G3u5mBxn8",
  authDomain: "football-schools-app.firebaseapp.com",
  projectId: "football-schools-app",
  storageBucket: "football-schools-app.firebasestorage.app",
  messagingSenderId: "667499672641",
  appId: "1:667499672641:web:0a024d6f5eb002c5c4c2c0",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
