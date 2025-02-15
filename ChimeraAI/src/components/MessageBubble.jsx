import { useState } from 'react';
import { format } from 'date-fns';
import { FaCopy, FaTrash, FaUser, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

const MessageBubble = ({
  message,
  timestamp,
  isUser,
  onCopy,
  onDelete,
  isStreaming
}) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] rounded-lg p-4 
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-100'
          }
        `}
      >
        <div className="flex justify-between items-start gap-4">
          <ReactMarkdown 
            className="prose prose-invert max-w-none whitespace-pre-wrap break-words"
            components={{
              p: ({ children }) => <p className="m-0 whitespace-pre-line">{children}</p>,
              code: ({ node, inline, className, children, ...props }) => {
                return (
                  <code
                    className={`${inline ? 'bg-gray-800 px-1 py-0.5 rounded' : 'block bg-gray-800 p-4 rounded-lg'} 
                              font-mono text-sm whitespace-pre`}
                    {...props}
                  >
                    {children}
                  </code>
                )
              }
            }}
          >
            {message}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
          <div className="flex gap-2">
            <button
              onClick={onCopy}
              className="text-gray-400 hover:text-white transition-colors"
              title="Copy message"
            >
              <FaCopy size={14} />
            </button>
            {isUser && (
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Delete message"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex justify-end items-center text-xs text-gray-400">
          <span>{formatTimestamp(timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;