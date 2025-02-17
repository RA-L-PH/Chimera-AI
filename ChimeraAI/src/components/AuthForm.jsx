import { useState, useCallback } from 'react';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, registerWithEmail } from '../firebase/firebaseConfig';
import { doc, setDoc, collection, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const initialFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
};

// Form validation function
const validateForm = (formData, isLogin, setErrors) => {
  const newErrors = {};

  if (!isLogin && !formData.name?.trim()) {
    newErrors.name = 'Name is required';
  }

  if (!formData.email?.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
  }

  if (!formData.password) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  if (!isLogin && formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// User document creation function
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) throw new Error('No user provided');

  try {
    const collectionName = encodeURIComponent('Chimera_AI');
    const userRef = doc(db, collectionName, user.email);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const displayName = user.displayName || additionalData.name || user.email.split('@')[0];
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        chats: [],
        settings: {
          theme: 'dark',
          notifications: true
        },
        tier: 'free',
        ...additionalData
      };
      await setDoc(userRef, userData);
    } else {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    }

    return userRef;
  } catch (error) {
    throw new Error('Failed to create/update user profile. Please try again.');
  }
};

const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '', submit: '' }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData, isLogin, setErrors)) return;

    setIsLoading(true);
    try {
      const result = isLogin 
        ? await signInWithEmail(formData.email, formData.password)
        : await registerWithEmail(formData.email, formData.password, formData.name);

      if (result.success) {
        if (!isLogin) {
          await createUserDocument(result.user, {
            name: formData.name,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        }
        navigate('/dashboard');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        await createUserDocument(result.user);
        navigate('/dashboard');
      } else {
        setErrors({ submit: result.error });
      }
    } catch {
      setErrors({ submit: 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="max-w-md mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg text-white"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        {isLogin ? 'Login' : 'Register'}
      </h2>

      {!isLogin && (
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none 
                     placeholder-gray-500"
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none 
                     placeholder-gray-500"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none 
                     placeholder-gray-500"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-white"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {!isLogin && (
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-300">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none 
                       placeholder-gray-500"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-white"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {errors.submit && (
          <p className="text-red-400 text-sm text-center">{errors.submit}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-6 py-2 rounded-lg font-medium text-white
            ${isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'}
            transition-all duration-200`}
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="animate-spin mx-auto" />
          ) : (
            isLogin ? 'Login' : 'Register'
          )}
        </button>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full px-6 py-2 rounded-lg border border-gray-700 font-medium 
                     text-gray-300 hover:bg-gray-800 transition-colors duration-200 
                     flex items-center justify-center gap-2"
        >
          <FaGoogle />
          Continue with Google
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300"
          >
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </div>

        {isLogin && (
          <div className="text-center">
            <a href="/forgot-password" className="text-blue-400 hover:text-blue-300">
              Forgot Password?
            </a>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default AuthForm;