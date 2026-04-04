'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import ar from '../locales/ar.json';
import en from '../locales/en.json';

const LanguageContext = createContext(null);

const translations = { ar, en };

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar'); // Default is Arabic

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'ar';
    setLanguage(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (path, params = {}) => {
    const keys = path.split('.');
    let value = translations[language];
    for (const key of keys) {
      if (!value || value[key] === undefined) return path;
      value = value[key];
    }
    
    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(key => {
        value = value.replace(new RegExp(`{${key}}`, 'g'), params[key]);
      });
    }
    
    return value;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
