// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGY5NomLOyQvp6YEzOluf759empaHeIwU",
  authDomain: "inventory-management-6b6a9.firebaseapp.com",
  projectId: "inventory-management-6b6a9",
  storageBucket: "inventory-management-6b6a9.appspot.com",
  messagingSenderId: "140264288196",
  appId: "1:140264288196:web:796c5202615bf1631e3e91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };