import Logo from '../assets/ChimeraAI.png';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { FaRobot, FaCode, FaMagic, FaUserFriends, FaBrain, FaUsersCog } from 'react-icons/fa';

const About = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  const handleTryNowClick = () => {
    if (isMobile) {
      navigate('/not-found');
    } else if (auth.currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <FaRobot className="w-8 h-8" />,
      title: "Multiple AI Models",
      description: "Access to cutting-edge models like Gemini Pro, DeepSeek, and Llama 3"
    },
    {
      icon: <FaCode className="w-8 h-8" />,
      title: "Advanced Commands",
      description: "/parallel - Process models simultaneously\n/series - Chain models sequentially"
    },
    {
      icon: <FaMagic className="w-8 h-8" />,
      title: "Real-time Processing",
      description: "Stream responses in real-time with intelligent model selection"
    }
  ];

  const chatFeatures = [
    {
      icon: <FaBrain className="w-8 h-8" />,
      title: "Specialized Models",
      description: "Models optimized for code, math, and general language tasks"
    },
    {
      icon: <FaUserFriends className="w-8 h-8" />,
      title: "Multi-Model Chat",
      description: "Create chats with multiple AI models working together"
    },
    {
      icon: <FaUsersCog className="w-8 h-8" />,
      title: "Custom Interactions",
      description: "Configure how models collaborate and process your requests"
    }
  ];

  useEffect(() => {
    setIsMobile(checkMobile());
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src={Logo} alt="Chimera AI Logo" className="mx-auto h-32 w-auto mb-8" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Chimera AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Unleash the power of multiple AI models working in harmony
          </p>
          <button
            onClick={handleTryNowClick}
            className="px-8 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            Get Started Now
          </button>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            How to Use Chimera AI
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-800/50 p-6 rounded-xl hover:bg-gray-800 transition-all duration-300"
              >
                <div className="text-purple-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 whitespace-pre-line">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Advanced Chat Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {chatFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-800/50 p-6 rounded-xl hover:bg-gray-800 transition-all duration-300"
              >
                <div className="text-purple-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Quick Start Guide
          </h2>
          <div className="max-w-3xl mx-auto bg-gray-800/50 rounded-xl p-8">
            <ol className="space-y-6 text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-purple-400 mr-4">1.</span>
                <p>Sign up or log in to access the dashboard</p>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-purple-400 mr-4">2.</span>
                <p>Create a new chat and select your preferred AI models</p>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-purple-400 mr-4">3.</span>
                <p>Use commands like /parallel or /series to control how models work together</p>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-purple-400 mr-4">4.</span>
                <p>Start chatting and experience the power of multiple AI models</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>© 2025 Chimera AI. All rights reserved.</div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a 
                href="https://github.com/RA-L-PH" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-purple-400 transition-colors"
              >
                GitHub
              </a>
              <a 
                href="mailto:ralphaacarvalho@gmail.com"
                className="hover:text-purple-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;