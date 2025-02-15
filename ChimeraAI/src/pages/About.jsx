import Logo from '../assets/ChimeraAI.png';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const About = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const handleTryNowClick = () => {
    if (auth.currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center text-white min-h-screen">
        <div className="mb-8">
          <img 
            src={Logo} 
            alt="Chimera AI Logo" 
            className="mx-auto h-80 w-auto"
          />
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight">
          Welcome to Chimera AI – Revolutionizing Chatbot Technology
        </h1>
        <p className="mb-8 text-xl">
          Experience the power of multiple AI models working together to deliver superior conversational experiences.
        </p>
        <button
          onClick={handleTryNowClick}
          className="inline-block rounded-full bg-white px-8 py-3 text-lg font-semibold text-purple-600 transition-all hover:bg-purple-100 hover:shadow-lg"
        >
          Try Now
        </button>
      </section>

      {/* Features Section */}
      
      <section className="bg-white py-23">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature Card 1 */}
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-4 text-4xl text-purple-600">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">Multi-Model Integration</h3>
              <p className="text-gray-600">Combine multiple AI models for enhanced capabilities and superior performance.</p>
            </div>

            {/* Feature Card 2 */}
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-4 text-4xl text-purple-600">
                <i className="fas fa-sliders-h"></i>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">Advanced Customization</h3>
              <p className="text-gray-600">Tailor your chatbot with extensive configuration options for your specific needs.</p>
            </div>

            {/* Feature Card 3 */}
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-4 text-4xl text-purple-600">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">Versatile Applications</h3>
              <p className="text-gray-600">Perfect for customer service, sales, marketing, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-22">
        <div className="container mx-auto px-6">
          <h2 className="mb-12 text-center text-4xl font-bold text-gray-800">Key Benefits</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <h3 className="mb-3 text-xl font-bold text-purple-600">Enhanced Capabilities</h3>
              <p className="text-gray-600">Powerful combination of multiple AI models for superior performance.</p>
            </div>
            <div className="text-center">
              <h3 className="mb-3 text-xl font-bold text-purple-600">Personalization</h3>
              <p className="text-gray-600">Create uniquely tailored interactions for better user engagement.</p>
            </div>
            <div className="text-center">
              <h3 className="mb-3 text-xl font-bold text-purple-600">Efficiency</h3>
              <p className="text-gray-600">Automate tasks and processes for improved operational performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-sm">
              © 2025 Chimera AI. All rights reserved.
            </div>
            <div className="space-x-6">
              <a href="/about" className="hover:text-purple-400">About</a>
              <a href="/privacy" className="hover:text-purple-400">Privacy Policy</a>
              <a href="/terms" className="hover:text-purple-400">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;