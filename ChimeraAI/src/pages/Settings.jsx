import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMoon, FaSun, FaCheck, FaUser, FaKey, FaCreditCard, 
  FaShieldAlt, FaBell, FaGlobe, FaCode 
} from 'react-icons/fa';

const SettingSection = ({ icon, title, children }) => (
  <section className="bg-gray-800 rounded-lg p-6 mb-6">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </section>
);

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'dark',
    fontSize: localStorage.getItem('fontSize') || 'medium',
    messageSound: localStorage.getItem('messageSound') === 'true',
    codeTheme: localStorage.getItem('codeTheme') || 'dark',
    language: localStorage.getItem('language') || 'en',
    email: 'user@example.com', // This would come from your auth system
    name: 'John Doe',
    subscriptionPlan: 'free',
    apiCredits: 1000,
    twoFactorEnabled: false
  });

  // Apply theme on mount and when changed
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    localStorage.setItem('theme', settings.theme);
  }, [settings.theme]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem(key, value);
      return newSettings;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Account Settings */}
        <SettingSection icon={<FaUser className="text-xl" />} title="Account">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleSettingChange('name', e.target.value)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 
                         focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                value={settings.email}
                readOnly
                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </SettingSection>

        {/* Security Settings */}
        <SettingSection icon={<FaShieldAlt className="text-xl" />} title="Security">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block">Two-Factor Authentication</span>
                <span className="text-sm text-gray-400">Add an extra layer of security</span>
              </div>
              <button
                onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
                className={`px-4 py-2 rounded-lg ${
                  settings.twoFactorEnabled
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {settings.twoFactorEnabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="block">Change Password</span>
                <span className="text-sm text-gray-400">Update your password regularly</span>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">
                Update
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Subscription Settings */}
        <SettingSection icon={<FaCreditCard className="text-xl" />} title="Subscription">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block">Current Plan</span>
                <span className="text-sm text-gray-400">
                  {settings.subscriptionPlan === 'free' ? 'Free Tier' : 'Premium'}
                </span>
              </div>
              {settings.subscriptionPlan === 'free' && (
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 
                               hover:opacity-90">
                  Upgrade to Premium
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="block">API Credits</span>
                <span className="text-sm text-gray-400">Available tokens</span>
              </div>
              <span className="text-xl font-semibold">{settings.apiCredits}</span>
            </div>
          </div>
        </SettingSection>

        {/* API Settings */}
        <SettingSection icon={<FaKey className="text-xl" />} title="API Access">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value="************************************************"
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-gray-400"
                />
                <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                  Regenerate
                </button>
              </div>
              <span className="text-xs text-gray-400">Last regenerated: 2024-02-15</span>
            </div>
          </div>
        </SettingSection>

        {/* Theme Setting */}
        <SettingSection icon={<FaGlobe className="text-xl" />} title="Appearance">
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <div className="flex gap-4">
              <button
                onClick={() => handleSettingChange('theme', 'light')}
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  settings.theme === 'light'
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <FaSun />
                Light
                {settings.theme === 'light' && <FaCheck className="ml-2" />}
              </button>
              <button
                onClick={() => handleSettingChange('theme', 'dark')}
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <FaMoon />
                Dark
                {settings.theme === 'dark' && <FaCheck className="ml-2" />}
              </button>
            </div>
          </div>

          {/* Font Size Setting */}
          <div className="flex items-center justify-between">
            <span>Font Size</span>
            <select
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </SettingSection>

        {/* Code Display Settings */}
        <SettingSection icon={<FaCode className="text-xl" />} title="Code Display">
          <div className="flex items-center justify-between">
            <span>Code Theme</span>
            <select
              value={settings.codeTheme}
              onChange={(e) => handleSettingChange('codeTheme', e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="dracula">Dracula</option>
              <option value="monokai">Monokai</option>
            </select>
          </div>
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection icon={<FaBell className="text-xl" />} title="Notifications">
          <div className="flex items-center justify-between">
            <span>Message Sound</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.messageSound}
                onChange={(e) => handleSettingChange('messageSound', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 
                            peer-focus:ring-blue-800 rounded-full peer 
                            peer-checked:after:translate-x-full peer-checked:bg-blue-600
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:rounded-full after:h-5 after:w-5 
                            after:transition-all">
              </div>
            </label>
          </div>
        </SettingSection>

        {/* Language Settings */}
        <SettingSection icon={<FaGlobe className="text-xl" />} title="Language">
          <div className="flex items-center justify-between">
            <span>Interface Language</span>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </SettingSection>
      </motion.div>
    </div>
  );
};

export default Settings;