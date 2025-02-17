import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const getApiKey = async () => {
  try {
    const docRef = doc(db, 'env', 'mkDNP8GwJcySZWSbRBAm');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.openrouterapi) {
        throw new Error('API key not found');
      }
      
      const apiKey = data.openrouterapi.trim();
      if (typeof apiKey !== 'string' || apiKey.length < 32) {
        throw new Error('Invalid API key');
      }
      
      return apiKey;
    } else {
      throw new Error('Configuration not found');
    }
  } catch (error) {
    throw new Error('Failed to retrieve API key');
  }
};