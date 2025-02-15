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
            "content": `Use Markdown Formatting:

Code snippets: Use appropriate syntax.
Bold text for emphasis.
Italic text for subtle highlights.
Bullet points for structured responses.
Code Representation:

Maintain original syntax for each programming language.
Ensure clarity and readability.
Avoid enclosing code in Markdown ("``` ```") within responses.
Enhance Contextual Understanding:

Interpret user intent flexibly.
Adjust responses based on previous context.
Provide detailed explanations when necessary.
Versatility & Depth:

Adapt responses to different levels of expertise (beginner to advanced).
Offer multiple perspectives or solutions when applicable.
Suggest optimizations and best practices. ${message}`
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