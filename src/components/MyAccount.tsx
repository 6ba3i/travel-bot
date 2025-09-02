import { useState, FC } from 'react';
import { 
  User, CreditCard, Bell, Shield, Globe, Save, 
  ArrowLeft, Eye, EyeOff, Plus, Trash2, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  masked: boolean;
}

const MyAccount: FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    language: 'en',
    timezone: 'America/New_York'
  });
  
  // API Keys management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: '1', name: 'GEMINI_API_KEY', key: 'AIza...', masked: true },
    { id: '2', name: 'SERPAPI_KEY', key: '1234...', masked: true }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' });
  
  const toggleKeyVisibility = (id: string) => {
    setApiKeys(apiKeys.map(key => 
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
          onClick={() => setActiveSection('security')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'security' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
        
        <button
          onClick={() => setActiveSection('api')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'api' 
              ? 'bg-indigo-600/20 text-white border border-indigo-600/50' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Globe className="w-4 h-4" />
          API Keys
        </button>
      </nav>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Profile Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg
                    text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg
                    text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({...profile, language: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg
                    text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="zh">中文</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg
                    text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              
              <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        );
        
      case 'api':
        return (
          <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">API Keys Configuration</h3>
              {saved && (
                <div className="flex items-center gap-2 text-green-400 animate-fade-in">
                  <Check className="w-5 h-5" />
                  <span>Saved to .env</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-400 mb-6">
              Manage your API keys for various services. These keys are stored in your .env file.
            </p>
            
            <div className="space-y-4 mb-6">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">{key.name}</div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-400 font-mono">
                          {key.masked ? '•'.repeat(20) : key.key}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          {key.masked ? (
                            <Eye className="w-4 h-4 text-gray-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {showAddForm ? (
              <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                <h4 className="font-medium text-white mb-4">Add New API Key</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Key Name (e.g., OPENAI_API_KEY)"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({...newApiKey, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg
                      text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="password"
                    placeholder="API Key Value"
                    value={newApiKey.key}
                    onChange={(e) => setNewApiKey({...newApiKey, key: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg
                      text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addApiKey}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      Add Key
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewApiKey({ name: '', key: '' });
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg
                  text-gray-400 hover:border-indigo-500 hover:text-white transition-colors
                  flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New API Key
              </button>
            )}
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={saveToEnv}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save to .env
                  </>
                )}
              </button>
            </div>
          </div>
        );
        
      case 'payment':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Payment Methods</h3>
            <p className="text-gray-400">No payment methods configured yet.</p>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Notification Preferences</h3>
            <p className="text-gray-400">Configure your notification settings here.</p>
          </div>
        );
        
      case 'security':
        return (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Security Settings</h3>
            <p className="text-gray-400">Manage your security preferences and two-factor authentication.</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex">
      {renderSidebar()}
      
      <div className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default MyAccount;