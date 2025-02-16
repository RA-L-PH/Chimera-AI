import { useState, useEffect, useRef } from 'react';
import { FaHome, FaRobot, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { MdArrowForwardIos, MdArrowBackIos } from 'react-icons/md';
import { BiMessageSquareAdd } from "react-icons/bi";
import { PiChatsBold } from "react-icons/pi";
import { signOutUser, auth } from '../firebase/firebaseConfig';
import Logo from '../assets/ChimeraAI.png';
import ChatForm from './ChatForm';
import { IoMdMenu, IoMdClose } from 'react-icons/io';

const Navbar = () => {
  
  // Initialize isCollapsed from localStorage or default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const sidebarRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showChatForm, setShowChatForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const result = await signOutUser();
      if (result.success) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Add handleNewChat function
  const handleNewChat = (e) => {
    e.preventDefault();
    setShowChatForm(true);
  };

  // Add handleChatFormSubmit function
  const handleChatFormSubmit = (chatData) => {
    setShowChatForm(false);
    // Navigation will be handled by ChatForm component
  };

  // Add handleChatFormCancel function
  const handleChatFormCancel = () => {
    setShowChatForm(false);
  };

  // Add effect to save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleClickOutside = (event) => {
      // Check if sidebar ref exists and click is outside
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Only collapse if we're on mobile
        if (window.innerWidth <= 768) {
          setIsCollapsed(true);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Add capture phase to ensure we get the event first
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []); // Remove isMobile dependency

  // First, update the useEffect for auth state to handle both auth methods
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserProfile({
          photoURL: user.photoURL || null,
          displayName: user.displayName || user.email.split('@')[0] // fallback to username from email
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleSidebar = (e) => {
    e.stopPropagation();
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Update the NavLink component
  const NavLink = ({ href, children, icon, isProfileLink, isNewChat }) => (
    <div className="relative group">
      <a
        href={href}
        className={`flex items-center space-x-3 
                  text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 
                  px-4 py-3 rounded-md transition-all duration-300 ease-in-out 
                  transform hover:scale-105 ${!isCollapsed && !isMobile ? '' : isMobile ? 'space-x-3' : 'justify-center'}`}
        onClick={(e) => {
          if (isNewChat) {
            handleNewChat(e);
          } else {
            e.preventDefault();
            window.location.href = href;
          }
        }}
      >
        <div className={`flex-shrink-0 ${isProfileLink ? '' : 'w-6 h-6'}`}>
          {icon}
        </div>
        {(!isCollapsed || isMobile) && (
          <span className="transition-opacity duration-300 ease-in-out">
            {children}
          </span>
        )}
        {isCollapsed && !isMobile && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 
                        text-white text-sm rounded opacity-0 group-hover:opacity-100 
                        transition-opacity whitespace-nowrap z-50">
            {children}
          </div>
        )}
      </a>
    </div>
  );

  // Update the ProfileSection component
  const ProfileSection = () => (
    <div className="relative group">
      <div 
        className={`flex items-center space-x-3 
                  text-gray-900 dark:text-white px-4 py-3 rounded-md
                  ${!isCollapsed && !isMobile ? '' : isMobile ? 'space-x-3' : 'justify-center'}`}
      >
        <div className={`flex-shrink-0`}>
          {userProfile?.photoURL ? (
            <img 
              src={userProfile.photoURL}
              alt={userProfile.displayName || "Profile"} 
              className={`object-cover border-2 border-gray-200 dark:border-gray-600 rounded-full
                       ${isCollapsed && !isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`flex items-center justify-center rounded-full bg-purple-600
                          ${isCollapsed && !isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
              <span className="text-white text-sm font-medium">
                {userProfile?.displayName?.charAt(0).toUpperCase() || <FaUser size={isCollapsed && !isMobile ? 16 : 20} />}
              </span>
            </div>
          )}
        </div>
        {(!isCollapsed || isMobile) && (
          <span className="transition-opacity duration-300 ease-in-out">
            {userProfile?.displayName || "Profile"}
          </span>
        )}
        {isCollapsed && !isMobile && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 
                        text-white text-sm rounded opacity-0 group-hover:opacity-100 
                        transition-opacity whitespace-nowrap z-50">
            {userProfile?.displayName || "Profile"}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Only shows on small screens */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-0 left-0 z-50 p-2 rounded-md bg-gray-800 text-white md:hidden"
        aria-label="Toggle Menu"
      >
        <IoMdMenu size={24} />
      </button>

      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside 
        ref={sidebarRef}
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-lg
          transition-all duration-300 ease-in-out z-50
          flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobile 
            ? isMobileMenuOpen 
              ? 'translate-x-0' 
              : '-translate-x-full'
            : 'translate-x-0'}
          ${isMobile ? 'w-[280px]' : ''}
        `}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-700 text-gray-300"
          >
            <IoMdClose size={24} />
          </button>
        )}

        {/* Rest of the sidebar content */}
        <div className="flex flex-col h-full">
          {/* Modified header section */}
          <div className={`
  flex flex-col items-center justify-start p-4 space-y-4
  ${isMobile ? 'pt-16' : ''}
`}>
  <a href="/" className="flex items-center justify-center">
    <img 
      className={`transition-all duration-500 ease-in-out ${
        isCollapsed && !isMobile 
          ? 'w-[4.5rem] h-[4.5rem] object-contain' // Increased size for collapsed mode
          : 'h-20 w-auto'
      }`} 
      src={Logo} 
      alt="ChimeraAI" 
    />
  </a>
  {!isMobile && (
    <button
      onClick={toggleSidebar}
      className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 
                transition-all duration-500 ease-in-out ${
                  isCollapsed ? 'relative' : 'absolute right-2'
                }`}
    >
      {isCollapsed ? 
        <MdArrowForwardIos size={20} className="text-gray-600 dark:text-gray-300" /> : 
        <MdArrowBackIos size={20} className="text-gray-600 dark:text-gray-300" />
      }
    </button>
  )}
</div>

          {/* Navigation links */}
          <nav className="flex-1 p-4 space-y-2">
            <NavLink href="/" icon={<FaRobot size={25} />}>Chimera AI</NavLink>
            <NavLink href="/dashboard/" icon={<FaHome size={25} />}>Home</NavLink>
            <NavLink href="/dashboard/chat" icon={<PiChatsBold size={25} />}>Chat</NavLink>
            <NavLink 
              href="/dashboard/chat" 
              icon={<BiMessageSquareAdd size={25} />} 
              isNewChat={true}
            >
              New Chat
            </NavLink>
          </nav>

          {/* Bottom section */}
          <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 space-y-2">
            <ProfileSection />
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full p-2 rounded-md
                        hover:bg-red-500 hover:text-white dark:hover:bg-red-600 
                        transition-colors duration-200 text-gray-700 dark:text-gray-200
                        space-x-2"
              aria-label="Logout"
            >
              <FaSignOutAlt size={20} />
              {(!isCollapsed || isMobile) && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content wrapper - Updated margins */}
      <main className={`
        transition-all duration-300
        ${isMobile ? 'ml-0 px-4' : isCollapsed ? 'ml-20' : 'ml-64'}
      `}>
        {/* Your main content goes here */}
      </main>

      {/* Add ChatForm Modal */}
      {showChatForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                      justify-center z-50" onClick={handleChatFormCancel}>
          <ChatForm 
            onSubmit={handleChatFormSubmit}
            onCancel={handleChatFormCancel}
          />
        </div>
      )}
    </>
  );
};

export default Navbar;