import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaShieldAlt, FaCreditCard, FaGlobe } from 'react-icons/fa';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const SettingSection = ({ icon, title, children }) => (
  <section className="bg-gray-800 rounded-lg p-6 mb-6">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    language: 'en',
    email: '',
    name: '',
    subscriptionPlan: 'free',
    twoFactorEnabled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const settingsRef = doc(db, 'Chimera_AI', user.email);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setSettings(prev => ({
            ...prev,
            ...data,
            email: user.email
          }));
        } else {
          await setDoc(settingsRef, {
            ...settings,
            email: user.email,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [navigate]);

  const handleSettingChange = async (key, value) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      const settingsRef = doc(db, 'Chimera_AI', user.email);
      await updateDoc(settingsRef, {
        [key]: value,
        updatedAt: new Date()
      });

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      setSettings(prev => ({
        ...prev,
        [key]: prev[key]
      }));
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

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
                className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
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
          <div className="flex items-center justify-between">
            <div>
              <span className="block">Two-Factor Authentication</span>
              <span className="text-sm text-gray-400">Add an extra layer of security</span>
            </div>
            <button
              onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
              className={`px-4 py-2 rounded-lg ${
                settings.twoFactorEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {settings.twoFactorEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
        </SettingSection>

        {/* Subscription Settings */}
        <SettingSection icon={<FaCreditCard className="text-xl" />} title="Subscription">
          <div className="flex items-center justify-between">
            <div>
              <span className="block">Current Plan</span>
              <span className="text-sm text-gray-400">
                {settings.subscriptionPlan === 'free' ? 'Free Tier' : 'Premium'}
              </span>
            </div>
            {settings.subscriptionPlan === 'free' && (
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
                Upgrade to Premium
              </button>
            )}
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