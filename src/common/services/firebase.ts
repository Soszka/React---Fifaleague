import { initializeApp } from "firebase/app";
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
