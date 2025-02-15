import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ChatForm from '../components/ChatForm';

const mockChats = [
  { id: 1, title: "Project Planning Discussion", date: "2024-02-14", preview: "Let's discuss the architecture..." },
  { id: 2, title: "Code Review Session", date: "2024-02-13", preview: "Here's the review of the latest..." },
  { id: 3, title: "Bug Analysis", date: "2024-02-12", preview: "I found the issue in the..." },
];

const Chat = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleNewChat = () => {
    setIsFormOpen(true);
  };

  const handleSubmit = (chatData) => {
    // Handle the new chat data here
    console.log(chatData);
    setIsFormOpen(false);
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
          {mockChats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">{chat.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{chat.preview}</p>
                </div>
                <span className="text-sm text-gray-500">{chat.date}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {mockChats.length === 0 && (
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