import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const getApiKey = async () => {
  try {
    const docRef = doc(db, 'env', 'mkDNP8GwJcySZWSbRBAm');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.openrouterapi) {
        throw new Error('OpenRouter API key not found in environment configuration');
      }
      // Fixed validation condition
      if (typeof data.openrouterapi !== 'string' || data.openrouterapi.trim() === '') {
        throw new Error('Invalid OpenRouter API key format');
      }
      
      // Add length validation for OpenRouter API keys
      const apiKey = data.openrouterapi.trim();
      if (apiKey.length < 32) { // OpenRouter API keys are typically longer
        throw new Error('OpenRouter API key appears too short');
      }
      
      return apiKey;
    } else {
      throw new Error('Environment configuration not found in Firestore');
    }
  } catch (error) {
    console.error('Error fetching OpenRouter API key:', error);
    throw error;
  }
};