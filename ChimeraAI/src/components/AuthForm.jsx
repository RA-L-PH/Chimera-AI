import { useState } from 'react';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, registerWithEmail } from '../firebase/firebaseConfig';

const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin && !formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
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

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = isLogin 
        ? await signInWithEmail(formData.email, formData.password)
        : await registerWithEmail(formData.email, formData.password);

      if (result.success) {
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