'use client';
import React from 'react';
import { LanguageProvider } from './LanguageContext';
import { AuthProvider } from './AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </LanguageProvider>
  );
}
