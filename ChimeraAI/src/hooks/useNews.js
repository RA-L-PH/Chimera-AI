import { useState, useEffect } from 'react';

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/top-headlines?category=technology&pageSize=3&language=en&apiKey=85c9baff60144ee1a80edc0048f10235`
        );
        const data = await response.json();

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