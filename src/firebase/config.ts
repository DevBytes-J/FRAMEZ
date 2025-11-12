import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBYpMPfZAUFp-32LMJ3j2sUYQQdzvvppH8",
  authDomain: "framezapp-95e17.firebaseapp.com",
  projectId: "framezapp-95e17",
  storageBucket: "framezapp-95e17.firebasestorage.app",
  messagingSenderId: "892126402173",
  appId: "1:892126402173:web:7b651f6980093517eac314",
  measurementId: "G-MD2FJMXKZZ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
