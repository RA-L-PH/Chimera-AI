const ConstantAPI = async (model, message, conversationHistory = [], onChunk, signal) => {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('Invalid API key format');
    }

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
      signal
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    if (onChunk) {
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

            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            partialResponse += content;
            onChunk(partialResponse);
          }
        }
      }

      return { choices: [{ message: { content: partialResponse } }] };
    } else {
      return await response.json();
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error('API request failed');
  }
};

export default ConstantAPI;