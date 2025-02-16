import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import ChatForm from '../components/ChatForm';
import { onAuthStateChanged } from 'firebase/auth';
import { FiTrash2 } from 'react-icons/fi'; // Add this for the trash icon

// Add this helper function at the top of your component
const truncateMessage = (message, wordLimit = 8) => {
  if (!message) return 'No messages yet';
  const words = message.split(' ');
  if (words.length <= wordLimit) return message;
  return words.slice(0, wordLimit).join(' ') + '...';
};

const Chat = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const loadChats = async () => {
        try {
          const chatsRef = collection(db, 'Chimera_AI', user.email, 'Chats');
          const chatsQuery = query(chatsRef, orderBy('updatedAt', 'desc'));
          const chatsSnap = await getDocs(chatsQuery);

          const chatsData = chatsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setChats(chatsData);
        } catch (error) {
          console.error('Error loading chats:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadChats();
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate]);

  const handleNewChat = () => {
    setIsFormOpen(true);
  };

  const handleSubmit = (chatData) => {
    // Handle the new chat data here
    console.log(chatData);
    setIsFormOpen(false);
  };

  // Update the handleChatClick function:
  const handleChatClick = (chatId) => {
    navigate(`/dashboard/chat/${chatId}`);
  };

  // Add this function to handle chat deletion
  const handleDeleteChat = async (e, chatId, userEmail) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        const chatRef = doc(db, 'Chimera_AI', userEmail, 'Chats', chatId);
        await deleteDoc(chatRef);
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-white">Recent Conversations</h2>
          <button 
            onClick={handleNewChat}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            New Chat
          </button>
        </div>

        <div className="space-y-4">
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              onClick={() => handleChatClick(chat.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">{chat.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {truncateMessage(chat.chatHistory?.[chat.chatHistory.length - 1]?.message)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {chat.updatedAt?.toDate().toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id, auth.currentUser.email)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-700"
                    title="Delete chat"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {chats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No conversations yet. Start a new chat!</p>
          </div>
        )}

        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <ChatForm 
                onSubmit={handleSubmit} 
                onCancel={() => setIsFormOpen(false)} 
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Chat;