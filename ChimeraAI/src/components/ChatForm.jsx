import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';

const AI_MODELS = {
  english: [
    { 
      id: 'gemini-pro',
      name: 'Gemini Pro 2.0 Experimental',
      description: 'Advanced language processing and generation',
      context: '2,000,000 tokens',
      modelId: 'google/gemini-2.0-pro-exp-02-05:free'
    },
    { 
      id: 'gemini-flash-lite',
      name: 'Gemini Flash Lite 2.0',
      description: 'Fast and efficient language processing',
      context: '1,000,000 tokens',
      modelId: 'google/gemini-2.0-flash-lite-preview-02-05:free'
    },
    { 
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      description: 'Advanced natural language understanding',
      context: '131,072 tokens',
      modelId: 'deepseek/deepseek-chat:free'
    },
    { 
      id: 'llama-3',
      name: 'Llama 3.3 70B Instruct',
      description: 'Meta\'s powerful language model',
      context: '131,072 tokens',
      modelId: 'meta-llama/llama-3.3-70b-instruct:free'
    },
    { 
      id: 'gemini-exp',
      name: 'Gemini Experimental 1206',
      description: 'Cutting-edge language capabilities',
      context: '2,097,152 tokens',
      modelId: 'google/gemini-exp-1206:free'
    },
    { 
      id: 'phi-3',
      name: 'Phi-3 Medium 128K',
      description: 'Specialized instruction processing',
      context: '8,192 tokens',
      modelId: 'microsoft/phi-3-medium-128k-instruct:free'
    },
    { 
      id: 'openchat',
      name: 'OpenChat 3.5 7B',
      description: 'Efficient conversational AI',
      context: '8,192 tokens',
      modelId: 'openchat/openchat-7b:free'
    },
    { 
      id: 'mythomax',
      name: 'MythoMax 13B',
      description: 'Creative language generation',
      context: '4,096 tokens',
      modelId: 'gryphe/mythomax-l2-13b:free'
    },
    { 
      id: 'mistral-small',
      name: 'Mistral Small 3',
      description: 'Advanced language understanding and generation',
      context: '32,000 tokens',
      modelId: 'mistralai/mistral-small-24b-instruct-2501:free'
    },
    { 
      id: 'rogue-rose',
      name: 'Rogue Rose 103B v0.2',
      description: 'Large-scale language processing',
      context: '4,096 tokens',
      modelId: 'sophosympatheia/rogue-rose-103b-v0.2:free'
    },
    { 
      id: 'mistral-nemo',
      name: 'Mistral Nemo',
      description: 'Balanced language processing',
      context: '128,000 tokens',
      modelId: 'mistralai/mistral-nemo:free'
    },
    { 
      id: 'mistral-7b',
      name: 'Mistral 7B Instruct',
      description: 'Efficient instruction following',
      context: '8,192 tokens',
      modelId: 'mistralai/mistral-7b-instruct:free'
    },
    { 
      id: 'zephyr-7b',
      name: 'Hugging Face: Zephyr 7B',
      description: 'Research-focused language model',
      context: '4,096 tokens',
      modelId: 'huggingfaceh4/zephyr-7b-beta:free'
    }
  ],
  math: [
    { 
      id: 'llama-vision',
      name: 'Llama 3.2 11B Vision',
      description: 'Mathematical visualization and processing',
      context: '131,072 tokens',
      modelId: 'meta-llama/llama-3.2-11b-vision-instruct:free'
    },
    { 
      id: 'learnlm',
      name: 'LearnLM 1.5 Pro',
      description: 'Educational mathematics processing',
      context: '40,960 tokens',
      modelId: 'google/learnlm-1.5-pro-experimental:free'
    },
    { 
      id: 'nemotron',
      name: 'Nemotron 70B Instruct',
      description: 'NVIDIA\'s mathematical computation engine',
      context: '131,072 tokens',
      modelId: 'nvidia/llama-3.1-nemotron-70b-instruct:free'
    },
    { 
      id: 'deepseek-r1-distill',
      name: 'DeepSeek R1 Distill',
      description: 'Efficient mathematical processing',
      context: '128,000 tokens',
      modelId: 'deepseek/deepseek-r1-distill-llama-70b:free'
    },
    { 
      id: 'gemini-flash',
      name: 'Gemini Flash 1.5 8B',
      description: 'Quick mathematical solutions',
      context: '1,000,000 tokens',
      modelId: 'google/gemini-flash-1.5-8b-exp'
    },
    { 
      id: 'qwen-vl',
      name: 'Qwen2.5 VL 72B',
      description: 'Comprehensive mathematical analysis',
      context: '131,072 tokens',
      modelId: 'qwen/qwen2.5-vl-72b-instruct:free'
    },
    { 
      id: 'gemini-flash-thinking',
      name: 'Gemini 2.0 Flash Thinking',
      description: 'Advanced mathematical reasoning',
      context: '1,048,576 tokens',
      modelId: 'google/gemini-2.0-flash-thinking-exp:free'
    },
    { 
      id: 'gemini-flash-thinking-exp',
      name: 'Gemini 2.0 Flash Thinking Exp',
      description: 'Experimental mathematical processing',
      context: '40,000 tokens',
      modelId: 'google/gemini-2.0-flash-thinking-exp-1219:free'
    }
  ],
  code: [
    { 
      id: 'deepseek-r1',
      name: 'DeepSeek R1',
      description: 'Expert code generation and analysis',
      context: '163,840 tokens',
      modelId: 'deepseek/deepseek-r1:free'
    },
    { 
      id: 'gemini-flash-2',
      name: 'Gemini Flash 2.0',
      description: 'Rapid code generation and review',
      context: '1,048,576 tokens',
      modelId: 'google/gemini-2.0-flash-exp:free'
    },
    { 
      id: 'phi-3-mini',
      name: 'Phi-3 Mini 128K',
      description: 'Efficient code assistance',
      context: '8,192 tokens',
      modelId: 'microsoft/phi-3-mini-128k-instruct:free'
    },
    { 
      id: 'dolphin-3',
      name: 'Dolphin3.0 R1 Mistral',
      description: 'Advanced code synthesis',
      context: '32,768 tokens',
      modelId: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free'
    },
    { 
      id: 'qwen-72b',
      name: 'Qwen2.5 VL 72B',
      description: 'Comprehensive code understanding',
      context: '131,072 tokens',
      modelId: 'qwen/qwen2.5-vl-72b-instruct:free'
    },
    { 
      id: 'qwen-plus',
      name: 'Qwen VL Plus',
      description: 'Enhanced code generation capabilities',
      context: '7,500 tokens',
      modelId: 'qwen/qwen-vl-plus:free'
    },
    { 
      id: 'dolphin-mistral',
      name: 'Dolphin3.0 Mistral 24b',
      description: 'Advanced code generation and analysis',
      context: '32,768 tokens',
      modelId: 'cognitivecomputations/dolphin3.0-mistral-24b:free'
    },
    { 
      id: 'gemma-2',
      name: 'Gemma 2 9B',
      description: 'Efficient code generation',
      context: '8,192 tokens',
      modelId: 'google/gemma-2-9b-it:free'
    },
    { 
      id: 'llama-3-8b',
      name: 'Meta: Llama 3 8B Instruct',
      description: 'Lightweight code assistance',
      context: '8,192 tokens',
      modelId: 'meta-llama/llama-3-8b-instruct:free'
    },
    { 
      id: 'toppy-m',
      name: 'Toppy M 7B',
      description: 'Specialized code generation',
      context: '4,096 tokens',
      modelId: 'undi95/toppy-m-7b:free'
    }
  ]
};

const TIER_LIMITS = {
  free: 2,
  premium: Infinity
};

const ModelCard = ({ model, selected, onToggle }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`
      cursor-pointer rounded-lg shadow-md bg-gray-800 p-4 relative
      ${selected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}
      transition-shadow duration-200
    `}
    onClick={() => onToggle(model.id)}
  >
    <input
      type="checkbox"
      checked={selected}
      className="absolute top-4 right-4 h-5 w-5 accent-blue-500"
      onClick={(e) => e.stopPropagation()} // Prevent double triggering
      onChange={() => onToggle(model.id)}
    />
    <h3 className="text-lg font-semibold mb-2 pr-8 text-white">{model.name}</h3>
    <p className="text-gray-400 text-sm mb-2">{model.description}</p>
    <p className="text-xs text-gray-500">Context: {model.context}</p>
  </motion.div>
);

const ModelSection = ({ title, models, selectedModels, onModelToggle, searchTerm }) => {
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            selected={selectedModels.includes(model.id)}
            onToggle={onModelToggle}
          />
        ))}
      </div>
    </div>
  );
};

const ChatForm = ({ onSubmit, onCancel }) => {
  const navigate = useNavigate();
  const [chatName, setChatName] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const defaultName = `New Chat - ${format(new Date(), 'MMM d')}`;
    setChatName(defaultName);
  }, []);

  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'Chimera_AI', currentUser.email);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserTier(userDoc.data().tier || 'free');
          }
        }
      } catch (error) {
        console.error('Error fetching user tier:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTier();
  }, []);

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => {
      const isSelected = prev.includes(modelId);
      const currentCount = prev.length;
      const modelLimit = TIER_LIMITS[userTier];

      if (!isSelected && currentCount >= modelLimit) {
        setError(`Free tier users can only select up to ${modelLimit} models. Upgrade to Premium for unlimited selections.`);
        return prev;
      }

      setError(null);
      return isSelected
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to create a chat');
        return;
      }

      const chatRef = doc(collection(db, 'Chimera_AI', currentUser.email, 'Chats'));
      const chatData = {
        name: chatName,
        chatHistory: [], 
        createdOn: serverTimestamp(),
        modelIds: selectedModels.map(id => {
          const model = [...AI_MODELS.code, ...AI_MODELS.math, ...AI_MODELS.english]
            .find(m => m.id === id);
          return model ? model.modelId : id;
        }),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        updatedAt: serverTimestamp(),
        status: 'active'
      };
      
      await setDoc(chatRef, chatData);
      onSubmit(chatData);
      navigate(`/dashboard/chat/${chatRef.id}`); // Update navigation path
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Error creating chat. Please try again.');
    }
  };

  const TierInfo = () => (
    <div className="mb-4 flex items-center justify-between bg-gray-800 p-3 rounded-lg">
      <div>
        <span className="text-sm text-gray-300">Current Tier: </span>
        <span className={`font-semibold ${userTier === 'premium' ? 'text-gold-400' : 'text-blue-400'}`}>
          {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
        </span>
      </div>
      <div className="text-sm text-gray-300">
        {userTier === 'free' ? (
          <>
            Models: {selectedModels.length}/{TIER_LIMITS.free} max
            <button 
              className="ml-4 text-blue-400 hover:text-blue-300 underline"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Premium
            </button>
          </>
        ) : (
          `Models: ${selectedModels.length} selected`
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl w-[95%] sm:w-11/12 mx-auto p-3 sm:p-6 bg-gray-900 rounded-lg shadow-lg text-white 
                 relative max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-white"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-2 sm:mt-4"> 
        {!isLoading && (
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-800 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
            <div className="mb-2 sm:mb-0">
              <span className="text-gray-300">Current Tier: </span>
              <span className={`font-semibold ${userTier === 'premium' ? 'text-gold-400' : 'text-blue-400'}`}>
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </span>
            </div>
            <div className="text-gray-300">
              {userTier === 'free' ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span>Models: {selectedModels.length}/{TIER_LIMITS.free} max</span>
                  <button 
                    className="text-blue-400 hover:text-blue-300 underline"
                    onClick={() => navigate('/pricing')}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              ) : (
                `Models: ${selectedModels.length} selected`
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Chat Name"
              className="w-full px-3 sm:px-4 py-2 text-sm rounded-lg border border-gray-700 bg-gray-800 text-white 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none 
                placeholder-gray-500"
            />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Models"
              className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 text-sm rounded-lg border border-gray-700 bg-gray-800 
                text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none 
                placeholder-gray-500"
            />
            <svg
              className="absolute left-2 sm:left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <section className='h-[45vh] sm:h-[50vh] overflow-y-auto w-full p-2 sm:p-4 bg-gray-800 rounded-lg'>
          <div className="space-y-4 sm:space-y-8">
            <ModelSection
              title="Code Models"
              models={AI_MODELS.code}
              selectedModels={selectedModels}
              onModelToggle={handleModelToggle}
              searchTerm={searchTerm}
            />
            <ModelSection
              title="Math Models"
              models={AI_MODELS.math}
              selectedModels={selectedModels}
              onModelToggle={handleModelToggle}
              searchTerm={searchTerm}
            />
            <ModelSection
              title="English Models"
              models={AI_MODELS.english}
              selectedModels={selectedModels}
              onModelToggle={handleModelToggle}
              searchTerm={searchTerm}
            />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={!chatName || selectedModels.length === 0}
            className={`
              w-full sm:flex-1 px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base text-white
              ${!chatName || selectedModels.length === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'}
              transition-all duration-200
            `}
          >
            Create Chat
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 px-4 sm:px-6 py-2 rounded-lg border border-gray-700 font-medium 
              text-sm sm:text-base text-gray-300 hover:bg-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatForm;