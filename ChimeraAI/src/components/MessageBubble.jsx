import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { FaCopy, FaTrash, FaUser, FaCode, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import Logo from '../assets/ChimeraAI.png';
import { defaultSchema } from 'rehype-sanitize';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return '';
  }
};

// Add a new prop for the markdown processing state
const MessageBubble = ({
  message,
  timestamp,
  isUser,
  onCopy,
  onDelete,
  isStreaming,
  photoURL,
  isApplyingMarkdown = false // Add this new prop
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [expandedCodeBlock, setExpandedCodeBlock] = useState({});
  const messageRef = useRef(null);
  const bubbleRef = useRef(null);

  // Handle hover state
  const handleMouseEnter = () => setShowOptions(true);
  const handleMouseLeave = () => setShowOptions(false);

  useEffect(() => {
    // Load MathJax dynamically if needed
    if (typeof window !== 'undefined' && !window.MathJax) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.async = true;
      script.onload = () => {
        if (window.MathJax) {
          window.MathJax.config = {
            tex: {
              inlineMath: [['\\(', '\\)']],
              displayMath: [['\\[', '\\]']],
            },
            svg: {
              fontCache: 'global'
            }
          };
        }
      };
      document.head.appendChild(script);
    }
    
    // Process with MathJax once loaded
    const typeset = () => {
      if (window.MathJax && messageRef.current) {
        window.MathJax.typesetPromise([messageRef.current])
          .catch((err) => console.log('MathJax typesetting failed: ' + err.message));
      }
    };

    // Try to typeset now, or wait for MathJax to load
    if (window.MathJax) {
      typeset();
    } else {
      const interval = setInterval(() => {
        if (window.MathJax) {
          typeset();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [message]);

  // Detect code language from class name
  const getLanguage = (className) => {
    if (!className) return 'text';
    const match = /language-(\w+)/.exec(className || '');
    return match ? match[1] : 'text';
  };

  // Toggle code block expansion
  const toggleCodeBlock = (id) => {
    setExpandedCodeBlock(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      ref={bubbleRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-start gap-2 max-w-[85%] min-w-0`}>
        {/* AI Avatar - Using Logo */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-white-600 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden shadow-glow">
            <img 
              src={Logo} 
              alt="ChimeraAI" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Message Content */}
        <motion.div
          layout
          className={`
            rounded-2xl px-4 py-3 w-full
            ${isUser 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue' 
              : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 shadow-gray'}
            ${isApplyingMarkdown ? 'border border-blue-400 animate-pulse' : ''}
            break-words shadow-md hover:shadow-lg transition-shadow
          `}
        >
          <div className="flex justify-between items-start">
            <div className="w-full">
              <div ref={messageRef} className="message-content">
                <ReactMarkdown
                  className="prose prose-invert max-w-none break-words"
                  rehypePlugins={[
                    [rehypeSanitize, {
                      ...defaultSchema,
                      attributes: {
                        ...defaultSchema.attributes,
                        code: [...(defaultSchema.attributes.code || []), ['className']]
                      }
                    }]
                  ]}
                  remarkPlugins={[remarkGfm]}
                  skipHtml={false}  // Add this
                  // Add these options to ensure code blocks are handled correctly
                  remarkRehypeOptions={{ allowDangerousHtml: true }}
                  components={{
                    p: ({ children }) => (
                      <p className="my-2 whitespace-pre-wrap break-words leading-relaxed">
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold my-3 pb-2 border-b border-gray-600">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold my-3 pb-1 border-b border-gray-700">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-md font-semibold my-2">{children}</h3>
                    ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-300 hover:text-blue-200 underline transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="my-1">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-500 pl-4 italic my-3 text-gray-300">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3">
                        <table className="border-collapse min-w-full">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-600 px-4 py-2 bg-gray-700">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-600 px-4 py-2">{children}</td>
                    ),
                    // Fix the processing order by handling pre elements first
                    pre: ({ children }) => {
                      // Pre tags should override any inline formatting
                      // This is critical for code blocks
                      if (children && children.props && children.props.node && 
                          children.props.node.tagName === 'code') {
                        // Extract the raw content and language from the code element
                        const { className, children: codeChildren } = children.props;
                        const language = getLanguage(className) || 'text';
                        const content = String(codeChildren).replace(/\n$/, '');
                        
                        // Generate unique ID for this code block
                        const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;
                        const isExpanded = expandedCodeBlock[codeId] !== false;
                        
                        // Return the custom code block component directly
                        return (
                          <div className="code-block-container my-3 rounded-md overflow-hidden border border-gray-700 bg-gray-900">
                            <div className="code-block-header bg-gray-800 px-4 py-2 flex justify-between items-center">
                              <div className="font-semibold text-gray-300 flex items-center">
                                <FaCode className="mr-2" /> 
                                <span>{language}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onCopy(content)}
                                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                                  title="Copy code"
                                >
                                  <FaCopy size={14} />
                                </button>
                                <button
                                  onClick={() => toggleCodeBlock(codeId)}
                                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                                </button>
                              </div>
                            </div>
                            <div className={`code-block-content relative ${!isExpanded ? 'max-h-52 overflow-hidden' : ''}`}>
                              <SyntaxHighlighter
                                language={language}
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  padding: '1rem',
                                  fontSize: '0.9rem',
                                  background: '#1e1e1e',
                                }}
                                // This is important - we're telling it not to process children as markdown
                                PreTag="div"
                              >
                                {content}
                              </SyntaxHighlighter>
                              {!isExpanded && (
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1e1e1e] to-transparent">
                                  <button
                                    onClick={() => toggleCodeBlock(codeId)}
                                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-blue-300 hover:text-blue-200 transition-colors bg-gray-800 px-3 py-1 rounded-full"
                                  >
                                    Show more
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      // For other pre elements
                      return <div className="whitespace-pre-wrap break-words">{children}</div>;
                    },
                    
                    // Handle inline code only
                    code: ({ node, inline, className, children, ...props }) => {
                      // Only process if it's inline code - codeblocks are handled by pre
                      if (inline) {
                        return (
                          <span 
                            className="inline-code-tag bg-blue-900/30 text-blue-300 px-2 py-0.5 mx-1 rounded-md text-sm font-mono border border-blue-800"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </span>
                        );
                      }
                      
                      // Let pre handle code blocks
                      return <code className={className} {...props}>{children}</code>;
                    },
                  }}
                  >
                    {message}
              </ReactMarkdown>
              </div>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Add this just after the message content */}
          {isApplyingMarkdown && (
            <div className="text-blue-300 text-sm mt-2 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Applying markdown formatting...
            </div>
          )}
          
          <div className="mt-2 flex justify-between items-center text-xs">
            <span className="text-gray-400">{formatTimestamp(timestamp)}</span>
            
            <AnimatePresence>
              {(showOptions || isUser) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2"
                >
                  <button
                    onClick={() => onCopy(message)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                    title="Copy message"
                  >
                    <FaCopy size={12} />
                  </button>
                  {isUser && (
                    <button
                      onClick={onDelete}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-700"
                      title="Delete message"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* User Avatar - Using photoUrl from Firebase */}
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden shadow-glow">
            {photoURL ? (
              <img 
                src={photoURL} 
                alt="User" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default user icon if image fails to load
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center"><FaUser size={14} className="text-white" /></div>';
                }}
              />
            ) : (
              <FaUser size={14} className="text-white" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.string.isRequired,
  timestamp: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.number]),
  isUser: PropTypes.bool,
  onCopy: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  isStreaming: PropTypes.bool,
  photoURL: PropTypes.string,
  isApplyingMarkdown: PropTypes.bool
};

MessageBubble.defaultProps = {
  isUser: false,
  isStreaming: false,
  isApplyingMarkdown: false,
  timestamp: null,
  photoURL: null,
};

export default MessageBubble;