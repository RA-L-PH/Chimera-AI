import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCw3TQbo0kR4uwuQdPJHdMYZ8eSkCvwXTI",
  authDomain: "chimera-ai.firebaseapp.com",
  projectId: "chimera-ai",
  storageBucket: "chimera-ai.firebasestorage.app",
  messagingSenderId: "885052782781",
  appId: "1:885052782781:web:6926df1376ed32ec011fd4",
  measurementId: "G-71T0ENY8M6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Add this additional configuration to the Google provider
const configureGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
};

// Authentication helper functions
const signInWithGoogle = async () => {
  try {
    const provider = configureGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    return { 
      success: true, 
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export { 
  auth, 
  db,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOutUser
};