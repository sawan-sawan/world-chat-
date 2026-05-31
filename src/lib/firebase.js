import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAL4amlMBdMBZ_i2VukZ8yU6Pc_KarlPDk",
  authDomain: "talknesty.firebaseapp.com",
  projectId: "talknesty",
  storageBucket: "talknesty.firebasestorage.app",
  messagingSenderId: "65424435392",
  appId: "1:65424435392:web:04af03ff37e38e1a6d6525",
  measurementId: "G-LTHQLXVX7L",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
