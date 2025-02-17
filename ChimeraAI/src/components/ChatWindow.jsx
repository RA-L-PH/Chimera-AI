import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import ConstantAPI from '../utils/api'
import { encryptForStorage, decryptFromStorage } from '../utils/encryption';

// Add these markdown helper functions at the top of your component file
const markdownShortcuts = {
  '**': {
    offset: 2
  },
  '*': {
    template: '*$1*',
    offset: 1
  },
  '```': {
    template: '```\n$1\n```',
    offset: 4
  },
  '`': {
    template: '`$1`',
    offset: 1
  },
  '>': {
    template: '> $1',
    offset: 2
  }
};

// Add near the top of the file with other constants
const COMMANDS = {
  '/parallel': 'Process all models simultaneously and combine their responses',
  '/series': 'Process models one after another, each building on the previous response'
};

const ChatWindow = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(0);
  const [conversationContext, setConversationContext] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/dashboard/chat');
          return;
        }

        const chatRef = doc(db, 'Chimera_AI', user.email, 'Chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          setError('Chat not found');
          setTimeout(() => navigate('/dashboard/chat'), 2000);
          return;
        }

        const data = chatSnap.data();
        
        // Decrypt chat history if encrypted
        const decryptedHistory = await Promise.all(
          (data.chatHistory || []).map(async (msg) => {
            if (msg.encrypted && msg.iv) {
              const decryptedMessage = await decryptFromStorage(msg.encrypted, msg.iv);
              return {
                ...msg,
                message: decryptedMessage,
                encrypted: undefined,
                iv: undefined
              };
            }
            return msg;
          })
        );

        setChatData({ ...data, chatHistory: undefined });
        setMessages(decryptedHistory);
      } catch (error) {
        console.error('Error loading chat:', error);
        setError('Failed to load chat');
        setTimeout(() => navigate('/dashboard/chat'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      loadChat();
    }
  }, [chatId, navigate]);

  // Modify the scrollToBottom function
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return;
    
    // Get the chat container
    const chatContainer = messagesEndRef.current.parentElement;
    
    // Check if user is near bottom (within 100px of bottom)
    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
    
    // Only auto-scroll if forced or if user is near bottom
    if (force || isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Update the useEffect for scrolling
  useEffect(() => {
    // Force scroll on initial load
    if (messages.length <= 1) {
      scrollToBottom(true);
      return;
    }
    
    // Normal scroll behavior for new messages
    scrollToBottom(false);
  }, [messages]);

  // Add scroll monitoring to the messages container
  const handleScroll = (e) => {
    const container = e.target;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  // Add before handleSubmit
  const processParallel = async (message, chatRef, aiTimestamp) => {
    const isFirstMessage = messages.length === 0;

    const tempAiMessage = {
      id: Date.now().toString(),
      message: '',
      timestamp: aiTimestamp,
      isUser: false,
      modelId: chatData.modelIds[0], // Use first model as the synthesizer
      isStreaming: true
    };

    setMessages(prev => [...prev, tempAiMessage]);

    try {
      const responses = await Promise.all(
        chatData.modelIds.map(async (modelId) => {
          try {
            // Convert messages to array if needed
            const messageHistory = isFirstMessage ? [] : Array.from(messages);

            const response = await ConstantAPI(
              modelId, 
              message,
              messageHistory,
              () => {}
            );
            if (!response?.choices?.[0]?.message?.content) {
              return { modelId, error: true };
            }
            return { modelId, content: response.choices[0].message.content };
          } catch (error) {
            return { modelId, error: true };
          }
        })
      );

      // Combine valid responses
      const validResponses = responses.filter(r => !r.error);
      if (validResponses.length > 0) {
        const combinedMessage = validResponses
          .map(r => `${r.modelId.split('/').pop()}:\n${r.content}`)
          .join('\n\n---\n\n');

        // Synthesize final response using the first model
        const synthesizedResponse = await ConstantAPI(
          chatData.modelIds[0],
          `Synthesize these model responses into a coherent response:\n\n${combinedMessage}`,
          (partialResponse) => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempAiMessage.id 
                  ? { ...msg, message: partialResponse }
                  : msg
              )
            );
          }
        );

        const finalResponse = synthesizedResponse.choices[0].message.content;
        const { encrypted, iv } = await encryptForStorage(finalResponse);

        const finalAiMessage = {
          ...tempAiMessage,
          message: finalResponse,
          isStreaming: false
        };

        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempAiMessage.id ? finalAiMessage : msg
          )
        );

        const firestoreMessage = {
          id: tempAiMessage.id,
          encrypted,
          iv,
          timestamp: aiTimestamp,
          isUser: false,
          modelId: chatData.modelIds[0],
          isStreaming: false
        };

        // Store encrypted message in Firestore
        await updateDoc(chatRef, {
          chatHistory: arrayUnion(firestoreMessage),
          updatedAt: serverTimestamp()
        });

        return finalResponse;
      }

      throw new Error('All parallel requests failed');
    } catch (error) {
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id));
      setError('Failed to process message in parallel mode');
      throw new Error('Parallel processing failed');
    }
  };

  // Add this function before handleSubmit
  const processSeries = async (message, chatRef, aiTimestamp) => {
    const isFirstMessage = messages.length === 0;

    const tempAiMessage = {
      id: Date.now().toString(),
      message: '',
      timestamp: aiTimestamp,
      isUser: false,
      modelId: chatData.modelIds[0],
      isStreaming: true
    };

    setMessages(prev => [...prev, tempAiMessage]);

    try {
      let responses = {
        input: message
      };

      for (let i = 0; i < chatData.modelIds.length; i++) {
        const modelId = chatData.modelIds[i];
        const modelName = modelId.split('/').pop().replace(':free', '');
        const isFirstModel = i === 0;
        const isLastModel = i === chatData.modelIds.length - 1;

        // Prepare input for current model
        const currentInput = isFirstModel 
          ? responses.input 
          : `Enhance.\n\nPrevious response:\n${responses[`model${i-1}Response`]}`;

        try {
          // Process with current model (only show streaming for final model)
          const response = await ConstantAPI(modelId, currentInput, isFirstMessage ? [] : messages, (partialResponse) => {
            if (isLastModel) {
              // Only update UI for the last model's response
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === tempAiMessage.id 
                    ? { 
                        ...msg, 
                        message: partialResponse,
                        modelId: modelId
                      }
                    : msg
                )
              );
            }
          });

          if (!response?.choices?.[0]?.message?.content) {
            throw new Error(`Model ${modelName} failed to respond`);
          }

          // Store intermediate response (not shown to user)
          responses[`model${i}Response`] = response.choices[0].message.content;

          // Only update UI and save to Firestore for the final model
          if (isLastModel) {
            const finalResponse = response.choices[0].message.content;
            const { encrypted, iv } = await encryptForStorage(finalResponse);

            const firestoreMessage = {
              id: tempAiMessage.id,
              encrypted,
              iv,
              timestamp: aiTimestamp,
              isUser: false,
              modelId: modelId,
              isStreaming: false
            };

            // Store encrypted message in Firestore
            await updateDoc(chatRef, {
              chatHistory: arrayUnion(firestoreMessage),
              updatedAt: serverTimestamp()
            });

            const finalAiMessage = {
              ...tempAiMessage,
              message: finalResponse,
              isStreaming: false,
              modelId: modelId
            };

            // Update UI with final response
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempAiMessage.id ? finalAiMessage : msg
              )
            );

            // Save final response to Firestore
            await updateDoc(chatRef, {
              chatHistory: arrayUnion({
                ...finalAiMessage,
                timestamp: aiTimestamp
              }),
              updatedAt: serverTimestamp()
            });

            return finalResponse;
          }
        } catch (error) {
          setError(`Failed to process with ${modelName}`);
          throw new Error(`Processing failed with ${modelName}`);
        }
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id));
      throw error;
    }
  };

  // Add this new function before handleSubmit
  const processFirstToFinish = async (message, chatRef, aiTimestamp) => {
    const isFirstMessage = messages.length === 0;

    const tempAiMessage = {
      id: Date.now().toString(),
      message: '',
      timestamp: aiTimestamp,
      isUser: false,
      modelId: chatData.modelIds[0],
      isStreaming: true
    };

    setMessages(prev => [...prev, tempAiMessage]);

    try {
      // Create an AbortController for each model
      const controllers = chatData.modelIds.map(() => new AbortController());

      // Create a promise for each model
      const modelPromises = chatData.modelIds.map(async (modelId, index) => {
        try {
          const response = await ConstantAPI(
            modelId, 
            message,
            isFirstMessage ? [] : messages,
            (partialResponse) => {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === tempAiMessage.id 
                    ? { ...msg, message: partialResponse, modelId }
                    : msg
                )
              );
            },
            controllers[index].signal // Pass signal to API
          );
          return { modelId, response, index };
        } catch (error) {
          if (error.name === 'AbortError') {
            return { modelId, error: 'cancelled', index };
          }
          return { modelId, error: true, index };
        }
      });

      // Use Promise.race to get the first successful response
      const winner = await Promise.race(modelPromises);

      // Cancel all other requests
      controllers.forEach((controller, index) => {
        if (index !== winner.index) {
          controller.abort();
        }
      });

      if (winner.error) {
        throw new Error(`Failed to get response from ${winner.modelId}`);
      }

      const finalResponse = winner.response.choices[0].message.content;
      
      // Encrypt response for storage
      const { encrypted, iv } = await encryptForStorage(finalResponse);
      
      const finalAiMessage = {
        ...tempAiMessage,
        encrypted,
        iv,
        message: finalResponse, // Keep decrypted message for local state
        isStreaming: false,
        modelId: winner.modelId
      };

      // Update UI with decrypted message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempAiMessage.id ? {
            ...finalAiMessage,
            encrypted: undefined,
            iv: undefined
          } : msg
        )
      );

      // Before storing in Firestore, remove undefined values and ensure all required fields are present
      const firestoreMessage = {
        id: finalAiMessage.id,
        encrypted,
        iv,
        timestamp: aiTimestamp,
        isUser: false,
        modelId: winner.modelId,
        isStreaming: false
      };

      // Store encrypted message in Firestore
      await updateDoc(chatRef, {
        chatHistory: arrayUnion(firestoreMessage),
        updatedAt: serverTimestamp()
      });

      return finalResponse;
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id));
      setError('Failed to process message');
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    try {
      const currentTimestamp = Timestamp.now();
      const aiTimestamp = Timestamp.now();
      
      // Encrypt message for storage
      const { encrypted, iv } = await encryptForStorage(inputMessage);
      
      const newMessage = {
        id: Date.now().toString(),
        encrypted,
        iv,
        timestamp: currentTimestamp,
        isUser: true,
        userId: user.uid,
        userEmail: user.email
      };

      // Use decrypted message in local state
      setMessages(prev => [...prev, {
        ...newMessage,
        message: inputMessage,
        encrypted: undefined,
        iv: undefined
      }]);
      
      setInputMessage('');
      setIsTyping(true);

      // Update the message storage in handleSubmit:

      // Create message object for Firestore (only include required fields)
      const firestoreMessage = {
        id: newMessage.id,
        encrypted,
        iv,
        timestamp: currentTimestamp,
        isUser: true,
        userId: user.uid,
        userEmail: user.email
      };

      // Store encrypted message in Firestore
      const chatRef = doc(db, 'Chimera_AI', user.email, 'Chats', chatId);
      await updateDoc(chatRef, {
        chatHistory: arrayUnion(firestoreMessage),
        updatedAt: serverTimestamp()
      });

      // Inside handleSubmit, replace the AI processing section with:

      try {
        const messageText = inputMessage.trim();
        const isParallel = messageText.startsWith('/parallel');
        const isSeries = messageText.startsWith('/series');

        // Remove the command prefix and get the actual message
        const actualMessage = isParallel || isSeries 
          ? messageText.slice(messageText.indexOf(' ') + 1)
          : messageText;

        // Choose processing method based on command
        let finalResponse;
        if (isParallel) {
          finalResponse = await processParallel(actualMessage, chatRef, aiTimestamp);
        } else if (isSeries) {
          finalResponse = await processSeries(actualMessage, chatRef, aiTimestamp);
        } else {
          // Default to first-to-finish if no command is used
          finalResponse = await processFirstToFinish(actualMessage, chatRef, aiTimestamp);
        }

        setConversationContext(prev => [...prev, {
          role: "assistant",
          content: finalResponse
        }]);
      } catch (error) {
        setError('Failed to process message. Please try again.');
      }
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Update the handleKeyDown function
  const handleKeyDown = (e) => {
    if (showCommands) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCommand(prev => 
            prev < Object.keys(COMMANDS).length - 1 ? prev + 1 : prev
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCommand(prev => prev > 0 ? prev - 1 : prev);
          return;
        case 'Enter': {
          e.preventDefault();
          const command = Object.keys(COMMANDS)[selectedCommand];
          setInputMessage(command + ' ');
          setShowCommands(false);
          return;
        }
        case 'Escape':
          setShowCommands(false);
          return;
      }
    }
    // ...rest of the function
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertMarkdown('**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*');
          break;
        case 'e':
          e.preventDefault();
          insertMarkdown('`');
          break;
        default:
          break;
      }
    }
  };

  // Replace the existing handleTextareaInput function
  const handleTextareaInput = (e) => {
    const textarea = e.target;
    const text = textarea.value;

    // Show commands when "/" is typed at the start of the input or after a space
    if (text === '/' || text.match(/\s\/$/)) {
      setShowCommands(true);
      setSelectedCommand(0);
    } else if (!text.includes('/')) {
      setShowCommands(false);
    }
    let handled = false;
    // Check for markdown shortcuts
    const cursorPosition = textarea.selectionStart;
    Object.entries(markdownShortcuts).forEach(([trigger, { template, offset }]) => {
      if (text.slice(cursorPosition - trigger.length, cursorPosition) === trigger) {
        e.preventDefault();
        handled = true;
        // Get selected text if any
        const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
        
        // Create new text with template
        const beforeTrigger = text.slice(0, cursorPosition - trigger.length);
        const afterTrigger = text.slice(cursorPosition);
        const newText = beforeTrigger + template.replace('$1', selectedText) + afterTrigger;
        
        // Calculate new cursor position
        const newPosition = cursorPosition - trigger.length + offset;
        
        // Update state and cursor position
        setInputMessage(newText);
        
        // Set cursor position after render
        requestAnimationFrame(() => {
          textarea.selectionStart = newPosition;
          textarea.selectionEnd = newPosition + selectedText.length;
          textarea.focus();
        });
      }
    });
    // If no markdown shortcut was triggered, handle normal input
    if (!handled) {
      // Auto-resize textarea
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      setInputMessage(text);
    }
  };

  // Add this helper function for keyboard shortcuts
  const insertMarkdown = (trigger) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd);
    const { template, offset } = markdownShortcuts[trigger];

    const newText = 
      value.slice(0, selectionStart) + 
      template.replace('$1', selectedText) + 
      value.slice(selectionEnd);

    setInputMessage(newText);

    // Set cursor position after render
    requestAnimationFrame(() => {
      textarea.selectionStart = selectionStart + offset;
      textarea.selectionEnd = selectionStart + offset + selectedText.length;
      textarea.focus();
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 pl-20">
      {/* Chat Header */}
      <div className="bg-gray-800 p-4 shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-semibold text-white">{chatData.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-300 bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-blue-400">Commands:</span>
            <span>/parallel,</span>
            <span>/series</span>
            <span className="text-blue-400 ml-2">Format:</span>
            <span>**bold**,</span>
            <span>*italic*,</span>
            <span>`code`</span>
            <span className="text-gray-500">(Ctrl+B/I/E)</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {chatData.modelIds?.map((modelId, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300 whitespace-nowrap"
            >
              {modelId.split('/').pop().replace(':free', '')}
            </span>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white p-3 m-4 rounded-lg">
          {error}
        </div>
      )}
      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg.message}
            timestamp={msg.timestamp}
            isUser={msg.isUser}
            modelId={msg.modelId}
            isStreaming={msg.isStreaming}
            onCopy={() => navigator.clipboard.writeText(msg.message)}
            onDelete={() => setMessages(messages.filter(m => m.id !== msg.id))}
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

      {/* Add this button just before the input form */}
      {!autoScroll && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-20 right-8 bg-gray-700 hover:bg-gray-600 
                     text-white rounded-full p-2 shadow-lg"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </button>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
        {showCommands && (
          <div className="absolute bottom-[80px] left-4 bg-gray-700 rounded-lg shadow-lg overflow-hidden ml-20">
            {Object.entries(COMMANDS).map(([command, description], index) => (
              <div
                key={command}
                className={`px-4 py-2 hover:bg-gray-600 cursor-pointer ${
                  index === selectedCommand ? 'bg-gray-600' : ''
                }`}
                onClick={() => {
                  setInputMessage(command + ' ');
                  setShowCommands(false);
                }}
              >
                <div className="text-white font-mono">{command}</div>
                <div className="text-gray-400 text-sm">{description}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4">
          <textarea
            value={inputMessage}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands or message..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 
                     border border-gray-600 focus:outline-none focus:border-blue-500
                     resize-none min-h-[44px] max-h-32 font-mono whitespace-pre-wrap"
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 self-end
              ${(!inputMessage.trim() || isTyping)
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