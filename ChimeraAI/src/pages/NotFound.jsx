import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/ChimeraAI.png';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = () => {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem);
    });
  };

  useEffect(() => {
    setIsMobile(checkMobile());
  }, []);

  const handleTryAgain = () => {
    if (!isMobile) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl max-w-lg mx-4 border border-gray-700"
      >
        <img 
          src={Logo} 
          alt="Chimera AI Logo" 
          className="mx-auto h-32 w-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
          Mobile View Not Supported
        </h1>
        <p className="text-gray-300 mb-8">
          Please switch to desktop mode or use a laptop/desktop computer to access Chimera AI.
          Mobile view is currently not supported.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTryAgain}
          className="px-8 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200"
        >
          Switch to Desktop
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFound;