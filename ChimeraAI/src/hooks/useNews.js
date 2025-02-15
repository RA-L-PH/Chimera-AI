import { useState, useEffect } from 'react';
import process from 'node:process';

const mockNewsData = {
  status: "ok",
  articles: [
    {
      title: "AI Breakthrough: New Model Surpasses Human Performance",
      publishedAt: "2025-02-15T09:00:00Z",
      url: "https://example.com/ai-news-1",
      source: { name: "Tech Daily" }
    },
    {
      title: "The Future of Cloud Computing: 2025 Trends",
      publishedAt: "2025-02-15T08:30:00Z",
      url: "https://example.com/cloud-news",
      source: { name: "Cloud Weekly" }
    },
    {
      title: "Quantum Computing: A New Era Begins",
      publishedAt: "2025-02-15T08:00:00Z",
      url: "https://example.com/quantum-news",
      source: { name: "Science Today" }
    }
  ]
};

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        let data;
        
        if (process.env.NODE_ENV === 'production') {
          // Production: Use real API
          const response = await fetch(
            `https://newsapi.org/v2/top-headlines?category=technology&pageSize=3&language=en&apiKey=${process.env.REACT_APP_NEWS_API_KEY}`
          );
          data = await response.json();
        } else {
          // Development: Use mock data
          data = mockNewsData;
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (data.status === 'error') {
          throw new Error(data.message);
        }

        const formattedNews = data.articles.map((article, index) => ({
          id: index + 1,
          title: article.title,
          time: new Date(article.publishedAt).toLocaleString(),
          url: article.url,
          source: article.source.name
        }));

        setNews(formattedNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return { news, loading, error };
};