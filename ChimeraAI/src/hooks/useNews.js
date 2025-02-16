import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const API_KEY = 'a4c4cc4d92317af44c81a1b1fa64254e';
const TECH_KEYWORDS = 'technology OR artificial intelligence OR cybersecurity OR programming';
const GNEWS_URL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(TECH_KEYWORDS)}&lang=en&country=us&max=4&apikey=${API_KEY}&sortby=publishedAt&category=technology`;
const UPDATE_HOURS = [0, 6, 12, 18];

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAndUpdateNews = async () => {
    try {
      console.log('Fetching news from Firestore...');
      const newsRef = collection(db, 'News');
      const snapshot = await getDocs(query(newsRef, orderBy('timestamp', 'desc'), limit(4)));

      if (!snapshot.empty) {
        const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNews(newsData);
        setLoading(false);
        return;
      }

      console.log('Firestore is empty, fetching from GNews API...');
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

      console.log('Updating Firestore with new articles...');
      await Promise.all(
        formattedArticles.map((article, index) => 
          setDoc(doc(newsRef, `article-${index + 1}`), article)
        )
      );

      setNews(formattedArticles);
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
        console.log('Scheduled update triggered...');
        await fetchAndUpdateNews();
      }
    };

    fetchAndUpdateNews();
    const interval = setInterval(checkTimeAndFetch, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { news, loading, error };
};
