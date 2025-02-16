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
            : 'bg-gray-700 text-gray-100'}
          break-words
          sm:p-4 p-3
          @media (max-width: 400px) {
            max-w-[90%]
          }
        `}
      >
        <div className="flex justify-between items-start gap-4 sm:gap-4 gap-2">
          <div className="w-full">
            <ReactMarkdown 
              className="prose prose-invert max-w-none break-words sm:text-base text-sm"
              components={{
                p: ({ children }) => <p className="m-0 whitespace-pre-wrap break-words">{children}</p>,
                code: ({ node, inline, className, children, ...props }) => {
                  return (
                    <code
                      className={`${inline ? 'bg-gray-800 px-1 py-0.5 rounded' : 'block bg-gray-800 sm:p-4 p-2 rounded-lg'} 
                                font-mono sm:text-sm text-xs whitespace-pre-wrap break-words`}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => (
                  <pre className="whitespace-pre-wrap break-words overflow-x-auto">{children}</pre>
                )
              }}
            >
              {message}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onCopy}
              className="text-gray-400 hover:text-white transition-colors sm:text-base text-sm"
              title="Copy message"
            >
              <FaCopy size={12} className="sm:w-4 sm:h-4" />
            </button>
            {isUser && (
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-400 transition-colors sm:text-base text-sm"
                title="Delete message"
              >
                <FaTrash size={12} className="sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex justify-end items-center text-xs text-gray-400">
          <span className="sm:text-xs text-[10px]">{formatTimestamp(timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;