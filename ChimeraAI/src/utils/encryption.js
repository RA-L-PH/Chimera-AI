const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Use a secure way to derive a proper length key from the environment variable
const deriveKey = (inputKey) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputKey);
  
  // Create a 32-byte (256-bit) key using SHA-256
  return crypto.subtle.digest('SHA-256', data);
};

// Cache the derived key for better performance
let cachedKey = null;

// Convert string to encryption key
const getKey = async () => {
  try {
    if (cachedKey) return cachedKey;

    const envKey = import.meta.env.VITE_APP_ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error('Encryption key not found in environment variables');
    }

    // Derive a proper length key
    const keyBuffer = await deriveKey(envKey);
    
    // Import the key for AES-GCM
    cachedKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    return cachedKey;
  } catch (error) {
    console.error('Key generation error:', error);
    throw new Error('Failed to generate encryption key');
  }
};

export const generateEncryptionKey = async () => {
  // Generate a proper 256-bit AES-GCM key
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Export key as raw bytes
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported));
};

export const importKey = async (keyData) => {
  try {
    // Ensure keyData is proper length (32 bytes for AES-256)
    if (!keyData || keyData.length !== 32) {
      throw new Error('Invalid key length');
    }

    return await window.crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyData),
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Key import error:', error);
    throw new Error('Failed to import encryption key');
  }
};

export const encryptMessage = async (message, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    encodedMessage
  );

  return {
    encrypted: Array.from(new Uint8Array(encryptedData)),
    iv: Array.from(iv)
  };
};

export const decryptMessage = async (encryptedData, iv, key) => {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: new Uint8Array(iv),
    },
    key,
    new Uint8Array(encryptedData)
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
};

export const encryptForStorage = async (message) => {
  try {
    if (!message) {
      throw new Error('No message to encrypt');
    }

    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    const encryptedData = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodedMessage
    );

    return {
      encrypted: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

export const decryptFromStorage = async (encryptedArray, ivArray) => {
  try {
    if (!encryptedArray || !ivArray) {
      throw new Error('Missing encrypted data or IV');
    }

    const key = await getKey();
    const encryptedData = new Uint8Array(encryptedArray);
    const iv = new Uint8Array(ivArray);

    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};