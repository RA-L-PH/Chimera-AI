import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, addDoc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { getNextScheduleTime } from '../utils/schedule';

const API_KEY = 'a4c4cc4d92317af44c81a1b1fa64254e';
const TECH_KEYWORDS = 'technology OR artificial intelligence OR cybersecurity OR programming';
const GNEWS_URL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(TECH_KEYWORDS)}&lang=en&country=us&max=4&apikey=${API_KEY}&sortby=publishedAt&category=technology`;

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);

  const fetchAndUpdateNews = async () => {
    try {
      const newsRef = collection(db, 'news');
      const response = await fetch(GNEWS_URL);
      const data = await response.json();

      if (!data.articles) {
        throw new Error('No tech articles returned from API');
      }

      const formattedArticles = data.articles.map((article, index) => ({
        id: index + 1,
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        image: article.image || null,
        publishedAt: article.publishedAt,
        source: article.source.name,
        category: 'technology',
        timestamp: new Date(),
        lastUpdated: new Date()
      }));

      try {
        await Promise.all([
          getDocs(newsRef).then(snapshot => 
            Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)))
          ),
          ...formattedArticles.map(article => 
            addDoc(collection(db, 'news'), article)
          )
        ]);
      } catch (firestoreError) {
        console.warn('Firestore operation failed:', firestoreError);
      }

      setNews(formattedArticles);
      setError(null);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError(error.message);
      
      try {
        const cachedNews = await getDocs(
          query(collection(db, 'news'), 
          orderBy('timestamp', 'desc'), 
          limit(4))
        );
        const newsData = cachedNews.docs.map(doc => doc.data());
        if (newsData.length > 0) {
          setNews(newsData);
          setError(null);
        }
      } catch (cacheError) {
        console.error('Cache fallback failed:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setupNewsSchedule = () => {
      const next = getNextScheduleTime();
      setNextUpdate(next);

      const timeUntilNext = next.getTime() - new Date().getTime();
      const timer = setTimeout(() => {
        fetchAndUpdateNews();
        setupNewsSchedule(); // Setup next schedule after fetching
      }, timeUntilNext);

      return () => clearTimeout(timer);
    };

    // Initial fetch
    fetchAndUpdateNews();
    // Setup next schedule
    const cleanup = setupNewsSchedule();

    return () => cleanup();
  }, []);

  return { news, loading, error, nextUpdate };
};