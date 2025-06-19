import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCMSs1f_5QQDK_JBHTreIpc7mDRicJiqtU",
  authDomain: "fifa-league-5faa1.firebaseapp.com",
  databaseURL: "https://fifa-league-5faa1-default-rtdb.firebaseio.com",
  projectId: "fifa-league-5faa1",
  storageBucket: "fifa-league-5faa1.firebasestorage.app",
  messagingSenderId: "1088719873438",
  appId: "1:1088719873438:web:b3047203ccd31ac143a28f",
};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

// helpers
export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const listenAuth = (cb: (u: User | null) => void) =>
  onAuthStateChanged(auth, cb);
