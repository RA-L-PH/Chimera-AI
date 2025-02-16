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
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const fetchAndUpdateNews = async (isScheduledUpdate = false) => {
    try {
      console.log('Fetching news...', { isScheduledUpdate });
      const newsRef = collection(db, 'News');

      // Only check Firestore for initial load, not for scheduled updates
      if (!isScheduledUpdate) {
        const snapshot = await getDocs(query(newsRef, orderBy('timestamp', 'desc'), limit(4)));
        if (!snapshot.empty) {
          const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNews(newsData);
          setLoading(false);
          return;
        }
      }

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
        timestamp: new Date()
      }));

      // Clear existing articles before adding new ones
      const existingDocs = await getDocs(newsRef);
      await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Store new articles
      await Promise.all(
        formattedArticles.map((article, index) => 
          setDoc(doc(newsRef, `article-${index + 1}`), article)
        )
      );

      setNews(formattedArticles);
      setLastUpdateTime(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching/updating news:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkTimeAndFetch = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      if (minutes === 0 && UPDATE_HOURS.includes(hours)) {
        // Only update if 5.9 hours have passed since last update
        if (!lastUpdateTime || 
            now.getTime() - lastUpdateTime.getTime() >= 5.9 * 60 * 60 * 1000) {
          console.log('Scheduled update triggered...');
          await fetchAndUpdateNews(true);
        }
      }
    };

    // Initial fetch
    fetchAndUpdateNews(false);

    // Check every minute for scheduled updates
    const interval = setInterval(checkTimeAndFetch, 60 * 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime]); // Add lastUpdateTime as dependency

  return { news, loading, error, lastUpdateTime };
};
