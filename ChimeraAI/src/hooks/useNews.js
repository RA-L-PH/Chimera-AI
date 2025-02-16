import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  limit,
  deleteDoc 
} from 'firebase/firestore';

const API_KEY = 'a4c4cc4d92317af44c81a1b1fa64254e';
const TECH_KEYWORDS = 'technology OR artificial intelligence OR cybersecurity OR programming';
const GNEWS_URL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(TECH_KEYWORDS)}&lang=en&country=us&max=4&apikey=${API_KEY}&sortby=publishedAt&category=technology`;
const UPDATE_HOURS = [0, 6, 12, 18];

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(() => {
    // Get stored last update time from localStorage
    const stored = localStorage.getItem('lastNewsUpdate');
    return stored ? new Date(stored) : null;
  });

  const fetchAndUpdateNews = async (isScheduledUpdate = false) => {
    try {
      console.log('Fetching news...', { isScheduledUpdate, time: new Date().toLocaleString() });
      const newsRef = collection(db, 'News');

      // Fetch new articles from GNews
      const response = await fetch(GNEWS_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.articles?.length) {
        throw new Error('No tech articles returned from API');
      }

      const formattedArticles = data.articles.map((article, index) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.image || null,
        publishedAt: article.publishedAt,
        source: article.source.name,
        category: 'technology',
        timestamp: new Date(),
        id: `article-${index + 1}`
      }));

      // Clear existing articles
      const existingDocs = await getDocs(newsRef);
      await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Store new articles with fixed IDs
      await Promise.all(
        formattedArticles.map(article => 
          setDoc(doc(newsRef, article.id), article)
        )
      );

      setNews(formattedArticles);
      const updateTime = new Date();
      setLastUpdateTime(updateTime);
      localStorage.setItem('lastNewsUpdate', updateTime.toISOString());
      console.log('News updated successfully at:', updateTime.toLocaleString());
    } catch (error) {
      console.error('Error fetching/updating news:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAndFetchNews = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if it's time to update
      const shouldUpdate = UPDATE_HOURS.includes(currentHour) && currentMinute === 0;

      if (shouldUpdate) {
        const timeSinceLastUpdate = lastUpdateTime
          ? now.getTime() - lastUpdateTime.getTime()
          : Infinity;

        // Update if no previous update or if it's been at least 5.9 hours
        if (timeSinceLastUpdate >= 5.9 * 60 * 60 * 1000) {
          console.log('Triggering scheduled update...');
          fetchAndUpdateNews(true);
        }
      }
    };

    // Initial fetch if needed
    const initialFetch = async () => {
      const newsRef = collection(db, 'News');
      const snapshot = await getDocs(query(newsRef, orderBy('timestamp', 'desc'), limit(4)));
      
      if (snapshot.empty || !lastUpdateTime) {
        console.log('Performing initial fetch...');
        await fetchAndUpdateNews(false);
      } else {
        const newsData = snapshot.docs.map(doc => doc.data());
        setNews(newsData);
        setLoading(false);
      }
    };

    initialFetch();

    // Check every minute
    const interval = setInterval(checkAndFetchNews, 60 * 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  return { news, loading, error, lastUpdateTime };
};
