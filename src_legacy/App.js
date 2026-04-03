import React from 'react';
import { useAuth } from './AuthContext';
import Login from './components/Login';
import MobileShopManagement from './MobileShopManagement';

const App = () => {
  const { user, login, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={login} />;
  }

  // Show main app if authenticated
  return <MobileShopManagement />;
};

export default App;
