'use client';

import { useAuth } from '../components/AuthContext';
import Login from '../components/Login';
import MobileShopManagement from '../components/MobileShopManagement';

export default function Page() {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.25rem', color: '#4B5563' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!user) return <Login onLogin={login} />;
  return <MobileShopManagement />;
}
