import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';
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
  '/series': 'Process responses one after another',
  '/parallel': 'Process responses in parallel'
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
  const [conversationContext, setConversationContext] = useState([]);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(0);

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

  // Add before handleSubmit
  const processParallel = async (message, chatRef, aiTimestamp) => {
    // Create a single temporary message for the final response
    const tempAiMessage = {
      id: Date.now().toString(),
      message: '',
      timestamp: aiTimestamp,
      isUser: false,
      modelId: chatData.modelIds[0], // Use first model as the synthesizer
      isStreaming: true
    };
  
    // Add temporary message to state
    setMessages(prev => [...prev, tempAiMessage]);
  
    try {
      // Collect responses from all models in parallel
      const responses = await Promise.all(
        chatData.modelIds.map(async (modelId) => {
          try {
            const response = await ConstantAPI(modelId, message, () => {});
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
    // Single message bubble that will show only the final result
    const tempAiMessage = {
      id: Date.now().toString(),
      message: '', // Stays empty until final model starts responding
      timestamp: aiTimestamp,
      isUser: false,
      modelId: chatData.modelIds[0],
      isStreaming: true
    };
  
    // Add the placeholder message
    setMessages(prev => [...prev, tempAiMessage]);
  
    try {
      // Storage for intermediate responses (not shown to user)
      let responses = {
        input: message
      };
  
      // Process through each model in series
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
          const response = await ConstantAPI(modelId, currentInput, (partialResponse) => {
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
      // Clean up temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessage.id));
      throw error;
    }
  };

  // Add this new function before handleSubmit
  const processFirstToFinish = async (message, chatRef, aiTimestamp) => {
    const tempAiMessage = {
      id: Date.now().toString(),
      message: '',
      timestamp: aiTimestamp,
      isUser: false,
      modelId: chatData.modelIds[0],
      isStreaming: true
    };
  
    // Add temporary message to state
    setMessages(prev => [...prev, tempAiMessage]);
  
    try {
      // Create a promise for each model
      const modelPromises = chatData.modelIds.map(async modelId => {
        try {
          const response = await ConstantAPI(modelId, message, (partialResponse) => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempAiMessage.id 
                  ? { ...msg, message: partialResponse, modelId }
                  : msg
              )
            );
          });
          return { modelId, response };
        } catch (error) {
          console.error(`Error with model ${modelId}:`, error);
          return { modelId, error: true };
        }
      });
  
      // Use Promise.race to get the first successful response
      const winner = await Promise.race(modelPromises);
  
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
      // Clean up temporary message on error
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
        const actualMessage = isParallel || isSeries 
          ? messageText.slice(messageText.indexOf(' ') + 1)
          : messageText;

        // Chain AI responses through models
        const aiTimestamp = Timestamp.now();
        const chatRef = doc(db, 'Chimera_AI', user.email, 'Chats', chatId);

        try {
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
    const cursorPosition = textarea.selectionStart; // Add this line
    
    // Show commands when "/" is typed
    if (text === '/') {
      setShowCommands(true);
      setSelectedCommand(0);
    } else if (!text.startsWith('/')) {
      setShowCommands(false);
    }

    let handled = false;

    // Check for markdown shortcuts
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
        <h1 className="text-xl font-semibold text-white mb-2">{chatData.name}</h1>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
        {/* Add inside the form element, before the textarea */}
        {showCommands && (
          <div className="absolute bottom-[80px] left-4 bg-gray-700 rounded-lg shadow-lg overflow-hidden ml-20">
            {Object.entries(COMMANDS).map(([command, description], index) => (
              <div
                key={command}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-600 ${
                  selectedCommand === index ? 'bg-gray-600' : ''
                }`}
                onClick={() => {
                  setInputMessage(command + ' ');
                  setShowCommands(false);
                }}
              >
                <span className="text-blue-400">{command}</span>
                <span className="text-gray-400 ml-2">{description}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4">
          <textarea
            value={inputMessage}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={`Type your message... (Shift+Enter for new line)- **bold** (Ctrl+B), *italic* (Ctrl+I), \`code\` (Ctrl+E), \`\`\`code block\`\`\`, > quote`}
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