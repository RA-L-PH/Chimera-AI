import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/ChimeraAI.png';

const NotFound = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = () => {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem);
    });
  };

  useEffect(() => {
    setIsMobile(checkMobile());
  }, []);

  const handleTryAgain = () => {
    if (!isMobile) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-lg mx-4">
        <img 
          src={Logo} 
          alt="Chimera AI Logo" 
          className="mx-auto h-32 w-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Mobile View Not Supported
        </h1>
        <p className="text-gray-600 mb-8">
          Please switch to desktop mode or use a laptop/desktop computer to access Chimera AI.
          Mobile view is currently not supported.
        </p>
        <button
          onClick={handleTryAgain}
          className="inline-block rounded-full bg-purple-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-purple-700 hover:shadow-lg"
        >
          Switch to Desktop
        </button>
      </div>
    </div>
  );
};

export default NotFound;