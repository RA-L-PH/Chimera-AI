const ConstantAPI = async (model, message, onChunk) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer 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`,
        "HTTP-Referer": "https://github.com/RA-L-PH/Chimera-AI", // Replace with your actual repository URL
        "X-Title": "ChimeraAI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model,
        "messages": [
          {
            "role": "user",
            "content": `use Markdown(code,bold,itallic,bullets) wherever necessary. As for the codes use their own Syntaxes and not markdown within the response. ${message}`
          }
        ],
        "stream": true
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
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