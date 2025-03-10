import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ChatForm from '../components/ChatForm';
import { auth } from '../firebase/firebaseConfig';
import { useNews } from '../hooks/useNews';

const Home = () => {
  const [greeting, setGreeting] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const { news, loading, error } = useNews();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const fullName = user.displayName || user.email.split('@')[0];
        const firstName = fullName.split(' ')[0];
        setUserName(firstName);
      } else {
        setUserName('User');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const handleNewChat = () => {
    setIsFormOpen(true);
  };

  const handleSubmit = (chatData) => {
    setIsFormOpen(false);
    navigate('/dashboard/chat');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              {greeting}, {userName}
            </span>
          </h1>
          <p className="text-gray-400 text-xl">Welcome back to Chimera AI. Let's explore the latest in AI technology.</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Latest Tech News</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 p-4 rounded-lg bg-red-900/20">{error}</div>
          ) : (
            <div className="space-y-4">
              {news.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  className="block bg-gray-700/50 p-4 rounded-lg cursor-pointer transform transition-transform hover:bg-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{item.title}</h3>
                    <div className="text-right">
                      <span className="text-sm text-blue-400 block">{item.source}</span>
                      <span className="text-sm text-gray-400">{new Date(item.publishedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button onClick={handleNewChat} whileHover={{ scale: 1.05 }} className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 rounded-lg">
            Start New Chat
          </motion.button>
          <motion.button onClick={() => navigate('/dashboard/chat')} whileHover={{ scale: 1.05 }} className="bg-gradient-to-r from-purple-500 to-purple-700 p-4 rounded-lg">
            View Recent Chats
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <ChatForm onSubmit={handleSubmit} onCancel={() => setIsFormOpen(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;