'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import Login from '../components/Login';
import MobileShopManagement from '../components/MobileShopManagement';

export default function RootPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Logic to decide where to go
      // 1. If super_admin, check if they were impersonating or just show dashboard (via a default slug or admin page)
      // 2. If regular owner, go to their storeSlug
      
      const savedSlug = localStorage.getItem('currentStoreSlug') || user.storeSlug;
      
      if (user.role === 'super_admin') {
        // Super admin stays at root or goes to last impersonated
        if (savedSlug) {
           router.replace(`/${savedSlug}`);
        } else {
           // Stay here, MobileShopManagement will show System Admin by default if no slug
        }
      } else if (user.storeSlug) {
        router.replace(`/${user.storeSlug}`);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.25rem', color: '#4B5563', fontFamily: 'Cairo' }}>جاري التحميل...</div>
      </div>
    );
  }

  // If not logged in, show Login
  if (!user) return <Login onLogin={login} />;

  // Display the management dashboard (includes System Admin for super_admins)
  // If no slug is present in URL, this will be the "Main" view
  return <MobileShopManagement />;
}
