import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD0WlZa4bgQngNSjNZs6ceM6_NWRqvi_-s",
  authDomain: "new-rls-hackathon.firebaseapp.com",
  projectId: "new-rls-hackathon",
  storageBucket: "new-rls-hackathon.firebasestorage.app",
  messagingSenderId: "439635656418",
  appId: "1:439635656418:web:b22f5be7b65544aa35e8bb",
  measurementId: "G-5EE8LSJJGV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;
