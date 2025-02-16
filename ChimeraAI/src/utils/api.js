import { getApiKey } from './getApiKey';

const ConstantAPI = async (model, message, conversationHistory = [], onChunk, signal) => {
  try {
    const apiKey = await getApiKey();
    
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('Invalid API key format');
    }

    // Ensure conversationHistory is an array and format it for the API
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    const messages = [
      ...history.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.message
      })),
      {
        role: "user",
        content: message
      }
    ];

    // Log for debugging
    console.log('Formatted messages:', messages);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/RA-L-PH/Chimera-AI",
        "X-Title": "ChimeraAI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        stream: !!onChunk
      }),
      signal // Add abort signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\nDetails: ${errorBody}`);
    }

    if (onChunk) {
      // Handle streaming response
      const reader = response.body.getReader();
      let partialResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              partialResponse += content;
              onChunk(partialResponse);
            } catch (e) {
              console.error('Chunk parsing error:', e);
            }
          }
        }
      }

      return { choices: [{ message: { content: partialResponse } }] };
    } else {
      const data = await response.json();
      return data;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error; // Re-throw abort errors
    }
    console.error('API call failed:', error);
    throw error;
  }
};

export default ConstantAPI;