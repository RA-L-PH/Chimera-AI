const ConstantAPI = async (model, message, onChunk) => {
  try {
    // Add error checking for API key
    if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://chimera-ai.vercel.app", // Update with your actual deployed URL
        "X-Title": "ChimeraAI",
        "Content-Type": "application/json",
        "OR-SDK-Version": "1.0.0"
      },
      body: JSON.stringify({
        "model": model,
        "messages": [
          {
            "role": "user",
            "content": message
          }
        ],
        "stream": true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

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
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }

    return {
      choices: [{
        message: {
          content: partialResponse
        }
      }]
    };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default ConstantAPI;