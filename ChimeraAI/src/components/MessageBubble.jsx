import { useState } from 'react';
import { format } from 'date-fns';
import { FaCopy, FaTrash, FaUser, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const MessageBubble = ({
  message,
  timestamp,
  isUser,
  onCopy,
  onDelete
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const formatTimestamp = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / 1000 / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return format(messageDate, 'h:mm a');
    return format(messageDate, 'MMM d, h:mm a');
  };

  return (
    <div
      className={`flex gap-2 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
        {isUser ? (
          <FaUser className="text-blue-500" />
        ) : (
          <FaRobot className="text-gray-500" />
        )}
      </div>

      {/* Message Content */}
      <div className={`relative max-w-[70%] group ${
        isUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'
      } rounded-lg p-3 shadow`}>
        {/* Message Text with Markdown Support */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTimestamp(timestamp)}
        </div>

        {/* Action Buttons */}
        {showOptions && (
          <div className={`absolute top-2 ${
            isUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
          } flex gap-2 px-2`}>
            <button
              onClick={() => onCopy(message)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy message"
            >
              <FaCopy className="text-gray-600" />
            </button>
            <button
              onClick={() => onDelete()}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete message"
            >
              <FaTrash className="text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;