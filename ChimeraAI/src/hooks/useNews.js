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
      // Add rate limiting check
      const lastAttempt = localStorage.getItem('lastNewsAttempt');
      if (lastAttempt) {
        const timeSinceLastAttempt = new Date().getTime() - new Date(lastAttempt).getTime();
        if (timeSinceLastAttempt < 60000) { // 1 minute
          console.log('Too many requests, waiting...');
          return;
        }
      }
      localStorage.setItem('lastNewsAttempt', new Date().toISOString());

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
      console.error('Error details:', {
        message: error.message,
        time: new Date().toLocaleString(),
        lastUpdate: lastUpdateTime?.toLocaleString()
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useNews hook mounted', {
      lastUpdateTime: lastUpdateTime?.toLocaleString(),
      currentTime: new Date().toLocaleString()
    });
    
    const checkAndFetchNews = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // More flexible update window - check within first 5 minutes of target hours
      const shouldUpdate = UPDATE_HOURS.includes(currentHour) && currentMinute <= 5;

      if (shouldUpdate) {
        const timeSinceLastUpdate = lastUpdateTime
          ? now.getTime() - lastUpdateTime.getTime()
          : Infinity;

        // Prevent multiple updates within the same hour
        const minimumUpdateInterval = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
        if (timeSinceLastUpdate >= minimumUpdateInterval) {
          console.log('Triggering scheduled update...', {
            currentTime: now.toLocaleString(),
            lastUpdate: lastUpdateTime?.toLocaleString(),
            timeSinceLastUpdate: Math.round(timeSinceLastUpdate / (60 * 60 * 1000)) + ' hours'
          });
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
