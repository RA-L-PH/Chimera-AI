import { getApiKey } from './getApiKey';


const ConstantAPI = async (model, message) => {
  try {
    const apiKey = await getApiKey();
    
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('Invalid API key format');
    }


    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model,
        "messages": [
          {
            "role": "user",
            "content": message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\nDetails: ${errorBody}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('API call failed:', error.message);
    throw error;
  }
};

export default ConstantAPI;