'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import MobileShopManagement from '@/components/MobileShopManagement';

export default function StorePage() {
  const { storeSlug } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in -> go back to root login
        router.replace('/');
      } else {
        // Multi-tenant protection logic
        if (user.role !== 'super_admin' && user.storeSlug !== storeSlug) {
           // User trying to access a store they don't own
           // Redirect them to their own store
           router.replace(`/${user.storeSlug}`);
           return;
        }
        
        // Sync the slug to localStorage for legacy API calls and persistence
        localStorage.setItem('currentStoreSlug', storeSlug);
      }
    }
  }, [user, loading, storeSlug, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.25rem', color: '#4B5563', fontFamily: 'Cairo' }}>جاري التحميل...</div>
      </div>
    );
  }

  // If user role is NOT super_admin, we must double check the slug
  if (user.role !== 'super_admin' && user.storeSlug !== storeSlug) {
      return null; // Will redirect in useEffect
  }

  return <MobileShopManagement />;
}
