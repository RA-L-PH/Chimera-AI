import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import ConstantAPI from '../utils/api'

// Add these markdown helper functions at the top of your component file
const markdownShortcuts = {
  '**': {
    template: '**$1**',
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
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 640);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);

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
          setTimeout(() => {
            navigate('/dashboard/chat');
          }, 2000);
          return;
        }

        const data = chatSnap.data();
        setChatData(data);
        setMessages(data.chatHistory || []);
      } catch (error) {
        console.error('Error loading chat:', error);
        setError('Failed to load chat');
        setTimeout(() => {
          navigate('/dashboard/chat');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      loadChat();
    }
  }, [chatId, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640);
      if (window.innerWidth > 640) {
        setShowFormattingHelp(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            return {
              modelId,
              content: response.choices[0].message.content
            };
          } catch (error) {
            console.error(`Error with model ${modelId}:`, error);
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
        const finalResponse = await ConstantAPI(
          chatData.modelIds[0],
          `Synthesize these model responses into a coherent response:\n\n${combinedMessage}`,
          (partialResponse) => {
            // Update the temporary message with streaming response
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempAiMessage.id 
                  ? { ...msg, message: partialResponse }
                  : msg
              )
            );
          }
        );
  
        // Update final message
        const finalAiMessage = {
          ...tempAiMessage,
          message: finalResponse.choices[0].message.content,
          isStreaming: false
        };
  
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempAiMessage.id ? finalAiMessage : msg
          )
        );
  
        // Update Firestore
        await updateDoc(chatRef, {
          chatHistory: arrayUnion({
            ...finalAiMessage,
            timestamp: aiTimestamp
          }),
          updatedAt: serverTimestamp()
        });
  
        return finalResponse.choices[0].message.content;
      }
      
      throw new Error('All parallel requests failed');
    } catch (error) {
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id));
      throw error;
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
            throw new Error(`No response from ${modelName}`);
          }
  
          // Store intermediate response (not shown to user)
          responses[`model${i}Response`] = response.choices[0].message.content;
  
          // Only update UI and save to Firestore for the final model
          if (isLastModel) {
            const finalResponse = response.choices[0].message.content;
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
          console.error(`Error with ${modelName}:`, error);
          throw new Error(`Failed to process with ${modelName}`);
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
            console.log(`Request for ${modelId} was cancelled`);
            return { modelId, error: 'cancelled', index };
          }
          console.error(`Error with model ${modelId}:`, error);
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
      const finalAiMessage = {
        ...tempAiMessage,
        message: finalResponse,
        isStreaming: false,
        modelId: winner.modelId
      };
  
      // Update UI with final response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempAiMessage.id ? finalAiMessage : msg
        )
      );
  
      // Save to Firestore
      await updateDoc(chatRef, {
        chatHistory: arrayUnion({
          ...finalAiMessage,
          timestamp: aiTimestamp
        }),
        updatedAt: serverTimestamp()
      });
  
      return finalResponse;
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id));
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
      const aiTimestamp = Timestamp.now(); // Add this line to define aiTimestamp
      const newMessage = {
        id: Date.now().toString(),
        message: inputMessage,
        timestamp: currentTimestamp,
        isUser: true,
        userId: user.uid,
        userEmail: user.email
      };

      // Update local state with user message
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      setIsTyping(true);

      // Update Firestore with user message
      const chatRef = doc(db, 'Chimera_AI', user.email, 'Chats', chatId);
      await updateDoc(chatRef, {
        chatHistory: arrayUnion({
          ...newMessage,
          timestamp: currentTimestamp
        }),
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
        console.error('Error processing message:', error);
        setError(error.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

    // Handle Enter key differently for desktop and mobile
    if (e.key === 'Enter') {
      if (isSmallScreen) {
        // Mobile: Enter creates new line
        if (!e.shiftKey) {
          return; // Allow default behavior for new line
        }
      } else {
        // Desktop: Enter submits, Shift+Enter creates new line
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
          return;
        }
      }
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

  // Update the handleTextareaInput function
  const handleTextareaInput = (e) => {
    const textarea = e.target;
    let text = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    // Auto-complete markdown symbols
    const markdownPairs = {
      '*': '*',  // Italic
      '**': '**', // Bold
      '`': '`',   // Code
    };
  
    for (const [symbol, completion] of Object.entries(markdownPairs)) {
      if (text.slice(cursorPosition - symbol.length, cursorPosition) === symbol) {
        text = text.slice(0, cursorPosition) + completion + text.slice(cursorPosition);
        setInputMessage(text);
  
        requestAnimationFrame(() => {
          textarea.selectionStart = cursorPosition;
          textarea.selectionEnd = cursorPosition;
        });
  
        return; // Prevent unnecessary reassignments
      }
    }
  
    setInputMessage(text);
  
    // Show commands when "/" is typed
    if (text.endsWith('/')) {
      setShowCommands(true);
      setSelectedCommand(0);
    } else if (!text.includes('/')) {
      setShowCommands(false);
    }
  
    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
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
    <div className={`flex flex-col h-screen bg-gray-900 ${isSmallScreen ? 'pl-0' : 'pl-20'}`}>
      {/* Responsive Header */}
      <div className="bg-gray-800 py-2 pt-10 sm:py-4 px-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          {/* Center chat name on mobile */}
          <h1 className="text-lg mt-5 sm:text-xl font-semibold text-white w-full sm:w-auto text-center sm:text-left">
            {chatData.name}
          </h1>
          
          {/* Show formatting info only on larger screens */}
          {!isSmallScreen && (
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
          )}
        </div>

        {/* Scrollable model tags - hidden on mobile */}
        <div className="hidden sm:flex gap-2 overflow-x-auto py-2 -mx-2 px-2">
          {chatData.modelIds?.map((modelId, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300 whitespace-nowrap flex-shrink-0"
            >
              {modelId.split('/').pop().replace(':free', '')}
            </span>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
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

      {/* Mobile Formatting Help Modal */}
      {isSmallScreen && showFormattingHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:hidden">
          <div className="w-full bg-gray-800 rounded-t-2xl shadow-lg p-4 max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white text-lg font-medium">Formatting Tips</h3>
              <button 
                onClick={() => setShowFormattingHelp(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-blue-400 text-sm font-medium">Commands</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-700 p-2 rounded">
                    <code className="text-sm text-blue-400">/parallel</code>
                    <p className="text-xs text-gray-300 mt-1">Process models simultaneously</p>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <code className="text-sm text-blue-400">/series</code>
                    <p className="text-xs text-gray-300 mt-1">Process models in sequence</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-blue-400 text-sm font-medium">Text Formatting</h4>
                <div className="grid gap-2">
                  <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                    <code className="text-sm">**bold**</code>
                    <span className="text-xs text-gray-400">Double tap * key</span>
                  </div>
                  <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                    <code className="text-sm">*italic*</code>
                    <span className="text-xs text-gray-400">Single tap * key</span>
                  </div>
                  <div className="bg-gray-700 p-2 rounded flex items-center justify-between">
                    <code className="text-sm">`code`</code>
                    <span className="text-xs text-gray-400">Tap ` key</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="py-2 sm:py-4 px-6 bg-gray-800">
        <div className="relative flex gap-2 sm:gap-4 items-stretch">
          {/* Command Suggestions Popup */}
          {showCommands && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              {Object.entries(COMMANDS).map(([command, description], index) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => {
                    setInputMessage(command + ' ');
                    setShowCommands(false);
                    document.querySelector('textarea').focus();
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-600
                    ${selectedCommand === index ? 'bg-gray-600' : ''}
                    ${index !== 0 ? 'border-t border-gray-600' : ''}`}
                >
                  <span className="text-blue-400 font-mono">{command}</span>
                  <span className="text-gray-300 text-sm truncate">{description}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1">
            {/* Info button - Mobile Only */}
            {isSmallScreen && (
              <button
                type="button"
                onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                className="absolute left-3 top-3 text-gray-400 hover:text-white transition-colors z-10"
                title="Formatting Help"
              >
                <FaInfoCircle size={18} />
              </button>
            )}
            
            <textarea
              value={inputMessage}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Type '/' for commands..."
              className={`w-full rounded-lg bg-gray-700 text-white placeholder-gray-400 
                       border border-gray-600 focus:outline-none focus:border-blue-500
                       resize-none min-h-[44px] max-h-32 
                       text-[15px] leading-[1.4]
                       font-mono whitespace-pre-wrap
                       ${isSmallScreen ? 'pl-10' : 'pl-3'} pr-3 py-2.5`}
              style={{
                fontSize: isSmallScreen ? '15px' : '16px',
                lineHeight: '1.4'
              }}
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className={`rounded-lg flex items-center justify-center min-h-[40px] sm:min-h-[44px] w-[40px] sm:w-[44px]
              ${(!inputMessage.trim() || isTyping)
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90'
              }`}
          >
            <FaPaperPlane className="text-white text-sm sm:text-base" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;