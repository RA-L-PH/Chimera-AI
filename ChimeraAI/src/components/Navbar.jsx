import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaHome, FaComments, FaRobot , FaUser } from 'react-icons/fa';
import { MdArrowForwardIos, MdArrowBackIos } from 'react-icons/md';
import Logo from '../assets/ChimeraAI.png';

const Sidebar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const NavLink = ({ href, children, icon }) => (
    <div className="relative group">
      <a
        href={href}
        className={`flex items-center ${!isCollapsed ? 'space-x-3' : 'justify-center'} 
                  text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 
                  px-4 py-3 rounded-md transition-all duration-300 ease-in-out 
                  transform hover:scale-105`}
        onClick={(e) => {
          if (isCollapsed) {
            e.preventDefault();
            window.location.href = href;
          }
        }}
      >
        {icon}
        {!isCollapsed && (
          <span className="transition-opacity duration-300 ease-in-out">
            {children}
          </span>
        )}
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 
                        text-white text-sm rounded opacity-0 group-hover:opacity-100 
                        transition-opacity whitespace-nowrap z-50">
            {children}
          </div>
        )}
      </a>
    </div>
  );

  const sidebarClass = `
    ${isCollapsed ? 'w-20' : 'w-64'} 
    ${isMobile ? (isCollapsed ? '-translate-x-full' : 'translate-x-0') : 'translate-x-0'}
    fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-lg
    transition-all duration-500 ease-in-out z-50
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside className={sidebarClass}>
        <div className="flex flex-col h-full">
          {/* Logo and collapse button */}
          <div className={`flex flex-col items-center p-4 ${isCollapsed ? 'space-y-4' : 'justify-between flex-row w-full'}`}>
            <a href="/" className="flex items-center">
              <img 
                className={`transition-all duration-500 ease-in-out ${
                  isCollapsed ? 'h-12 w-12' : 'h-20 w-auto'
                }`} 
                src={Logo} 
                alt="ChimeraAI" 
              />
            </a>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 
                         transition-all duration-500 ease-in-out"
            >
              {isCollapsed ? 
                <MdArrowForwardIos size={20} className="text-gray-600 dark:text-gray-300" /> : 
                <MdArrowBackIos size={20} className="text-gray-600 dark:text-gray-300" />
              }
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 p-4 space-y-2">
            <NavLink href="/" icon={<FaRobot size={20} />}>Chimera AI</NavLink>
            <NavLink href="/home" icon={<FaHome size={20} />}>Home</NavLink>
            <NavLink href="/chat" icon={<FaComments size={20} />}>Chat</NavLink>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <NavLink href="/profile" icon={<FaUser size={20} />}>Profile</NavLink>
            <button 
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-full p-2 rounded-md
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              {!isCollapsed && <span className="ml-2">Toggle Theme</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} ${isMobile ? 'ml-0' : ''}`}>
        {/* Your main content goes here */}
      </main>
    </>
  );
};

export default Sidebar;