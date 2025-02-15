import { getApiKey } from './getApiKey';

const formatInstructions = {
  role: "system",
  content: `You are an AI assistant. Please format your responses as follows:

- Use markdown code blocks with language specifications
- Use **bold** for emphasis
- Use *italics* for subtle highlights
- Use bullet points for lists
- Keep code examples clear and readable
- Provide context-aware responses
- Adapt to user expertise levels

For code examples:
\`\`\`language
your code here
\`\`\`
`
};

const ConstantAPI = async (model, message, onChunk) => {
  try {
    const apiKey = await getApiKey();
    
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('Invalid API key format');
    }

    const requestBody = {
      model,
      messages: [
        formatInstructions,
        { role: "user", content: message }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    };

    console.log('Making request to OpenRouter API...', {
      model,
      messageCount: requestBody.messages.length
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/RA-L-PH/Chimera-AI",
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