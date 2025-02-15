import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';

const ChatWindow = () => {
  const location = useLocation();
  const chatData = location.state || {
    name: "New Chat",
    models: ["Default Model"]
  };

  const chatInfo = {
    title: chatData.name,
    models: chatData.models
  };

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      message: inputMessage,
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        message: "This is a sample AI response with **markdown** support.",
        timestamp: new Date().toISOString(),
        isUser: false
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (messageId) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 pl-20">
      {/* Chat Header */}
      <div className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-semibold text-white mb-2">{chatInfo.title}</h1>
        <div className="flex gap-2">
          {chatInfo.models.map((model, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
            >
              {model}
            </span>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg.message}
            timestamp={msg.timestamp}
            isUser={msg.isUser}
            onCopy={() => handleCopy(msg.message)}
            onDelete={() => handleDelete(msg.id)}
          />
        ))}
        {isTyping && (
          <div className="flex gap-2 items-center text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
        <div className="flex gap-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 
                     border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className={`px-4 py-2 rounded-lg flex items-center gap-2
              ${!inputMessage.trim() 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90'
              }`}
          >
            <FaPaperPlane className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;