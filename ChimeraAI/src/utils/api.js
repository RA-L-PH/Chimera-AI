import { getApiKey } from './getApiKey';

const formatInstructions = `Use Markdown Formatting:
- Code snippets: Use appropriate syntax.
- Bold text for emphasis.
- Italic text for subtle highlights.
- Bullet points for structured responses.

Code Representation:
- Maintain original syntax for each programming language.
- Ensure clarity and readability.
- Avoid enclosing code in Markdown within responses.

Enhance Contextual Understanding:
- Interpret user intent flexibly.
- Adjust responses based on previous context.
- Provide detailed explanations when necessary.

Versatility & Depth:
- Adapt responses to different levels of expertise.
- Offer multiple perspectives or solutions when applicable.
- Suggest optimizations and best practices.`;

const ConstantAPI = async (model, message, onChunk) => {
  try {
    const apiKey = await getApiKey();
    
    // Validate API key before making request
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('Invalid API key format');
    }

    const requestBody = {
      model,
      messages: [
        { role: "system", content: formatInstructions },
        { role: "user", content: message }
      ],
      stream: true
    };

    // Add debugging information
    console.log('Request details:', {
      model,
      headers: {
        'Authorization': `Bearer ${apiKey.slice(-4)}...`, // Show last 4 chars only
        'HTTP-Referer': "https://github.com/RA-L-PH/Chimera-AI",
        'X-Title': "ChimeraAI"
      }
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/RA-L-PH/Chimera-AI", // Replace with your actual repository URL
        "X-Title": "ChimeraAI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    // Enhanced error handling
    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorBody);
      } catch (e) {
        parsedError = errorBody;
      }
      
      throw new Error(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        error: parsedError
      }));
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
            console.error('Error parsing chunk:', {
              error: e,
              line: line,
              data: data
            });
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
    console.error('API call failed:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export default ConstantAPI;