import React, { useState } from 'react';
import { 
  ArrowLeft, User, CreditCard, Bell, Shield, Settings, Key, 
  Save, Plus, Trash2, Eye, EyeOff, Database, Code,
  Mail, Phone, MapPin, Calendar, ChevronRight, Check,
  AlertCircle, Loader2, HelpCircle, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  masked: boolean;
}

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    address: '123 Main St, New York, NY 10001',
    birthDate: '1990-01-01'
  });
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: '1', name: 'DEEPSEEK_API_KEY', key: 'sk-33c5a760c9074a85a2b6e7eb4ecd7383', masked: true },
    { id: '2', name: 'SERPAPI_KEY', key: '1b739dafbfcfe36edffcbb8dcb0bcead1a5af026a3045a70a08bf184d35bbfaf', masked: true },
    { id: '3', name: 'FIREBASE_API_KEY', key: 'AIzaSyAgERl4vc5PJgJkEvXfTnqzczQcOCAxGho', masked: true },
    { id: '4', name: 'OPENWEATHER_KEY', key: 'dc8531a23a889455ca7eba6736a88b4c', masked: true }
  ]);
  
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Payment methods state
  const [paymentMethods] = useState([
    { id: '1', type: 'card', last4: '4242', brand: 'Visa', default: true },
    { id: '2', type: 'card', last4: '8888', brand: 'Mastercard', default: false }
  ]);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
    updates: true,
    bookings: true
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'friends',
    showEmail: false,
    showPhone: false,
    dataCollection: true,
    personalizedAds: true,
    twoFactorAuth: false
  });

  const toggleApiKeyVisibility = (id: string) => {
    setApiKeys(keys => keys.map(key => 
      key.id === id ? { ...key, masked: !key.masked } : key
    ));
  };

  const addApiKey = () => {
    if (newApiKey.name && newApiKey.key) {
      setApiKeys([...apiKeys, {
        id: Date.now().toString(),
        name: newApiKey.name,
        key: newApiKey.key,
        masked: true
      }]);
      setNewApiKey({ name: '', key: '' });
      setShowAddForm(false);
      saveToEnv();
    }
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    saveToEnv();
  };

  const saveToEnv = async () => {
    setLoading(true);
    // Simulate saving to .env file
    const envContent = apiKeys.map(key => `${key.name}=${key.key}`).join('\n');
    
    try {
      // In a real app, this would be an API call to save the .env file
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving to .env:', envContent);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving .env file:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 p-4">
      <button
        onClick={() => navigate('/chat')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Chat
      </button>
      
      <h2 className="text-xl font-bold text-white mb-6">My Account</h2>
      
      <nav className="space-y-2">
        <button
          onClick={() => setActiveSection('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'profile' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        
        <button
          onClick={() => setActiveSection('payment')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'payment' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment Methods
        </button>
        
        <button
          onClick={() => setActiveSection('notifications')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'notifications' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
        
        <button
          onClick={() => setActiveSection('privacy')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'privacy' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Shield className="w-4 h-4" />
          Privacy & Security
        </button>
        
        <button
          onClick={() => setActiveSection('api')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'api' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Key className="w-4 h-4" />
          API Settings
        </button>
      </nav>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl">
      <h3 className="text-2xl font-bold text-white mb-6">Profile Information</h3>
      
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Birth Date
              </label>
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          
          <button className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">API Settings</h3>
        {saved && (
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            Saved to .env file
          </div>
        )}
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700/50 mb-6">
        <div className="flex items-center gap-2 mb-4 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">These API keys will be saved to your .env file</span>
        </div>
        
        <div className="space-y-4">
          {apiKeys.map(apiKey => (
            <div key={apiKey.id} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <Code className="w-5 h-5 text-gray-400" />
              
              <div className="flex-1">
                <div className="text-white font-medium">{apiKey.name}</div>
                <div className="text-gray-400 text-sm font-mono mt-1">
                  {apiKey.masked ? '•'.repeat(40) : apiKey.key}
                </div>
              </div>
              
              <button
                onClick={() => toggleApiKeyVisibility(apiKey.id)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {apiKey.masked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => deleteApiKey(apiKey.id)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {showAddForm ? (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="API Key Name (e.g., OPENAI_API_KEY)"
                value={newApiKey.name}
                onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="API Key Value"
                value={newApiKey.key}
                onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={addApiKey}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Key
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewApiKey({ name: '', key: '' });
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            <Plus className="w-4 h-4" />
            Add New API Key
          </button>
        )}
        
        <button
          onClick={saveToEnv}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save to .env File
            </>
          )}
        </button>
      </div>
      
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">API Key Usage</h4>
            <p className="text-gray-400 text-sm">
              These API keys are used to connect to various services:
            </p>
            <ul className="text-gray-400 text-sm mt-2 space-y-1">
              <li>• <strong>DEEPSEEK_API_KEY:</strong> AI model processing</li>
              <li>• <strong>SERPAPI_KEY:</strong> Flight and hotel searches</li>
              <li>• <strong>FIREBASE_API_KEY:</strong> Authentication and database</li>
              <li>• <strong>OPENWEATHER_KEY:</strong> Weather forecasts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfile();
      case 'api':
        return renderApiSettings();
      case 'payment':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Payment Methods</h3>
            <div className="space-y-4">
              {paymentMethods.map(method => (
                <div key={method.id} className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-4 border border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">
                        {method.brand} ending in {method.last4}
                      </div>
                      {method.default && (
                        <span className="text-xs text-green-400">Default</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors">
                + Add Payment Method
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Notification Preferences</h3>
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700/50">
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${value ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Privacy & Security</h3>
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700/50">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Profile Visibility</label>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-white">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${value ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900">
      {renderSidebar()}
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;