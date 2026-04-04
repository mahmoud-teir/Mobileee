'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

// مدة الجلسة بالمللي ثانية (10 دقائق)
const SESSION_TIMEOUT = 10 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || '/api';

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setLoading(false); // Set loading to false immediately to show UI

      // Verify token is still valid in the background
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Token is invalid, logout
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      // Keep user logged in if server is unreachable
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    // The userData now includes storeSlug from our API update
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionWarning(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('currentStoreSlug');
    localStorage.removeItem('activeTab');

    // مسح المؤقتات
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  // إعادة تعيين مؤقت الجلسة عند أي نشاط
  const resetSessionTimeout = useCallback(() => {
    if (!user) return;

    // تحديث وقت آخر نشاط
    localStorage.setItem('lastActivity', Date.now().toString());
    setSessionWarning(false);

    // مسح المؤقتات السابقة
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // تحذير قبل دقيقة من انتهاء الجلسة
    warningTimeoutRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT - 60000);

    // إنهاء الجلسة بعد 10 دقائق
    timeoutRef.current = setTimeout(() => {
      alert('تم إنهاء الجلسة بسبب عدم النشاط');
      logout();
    }, SESSION_TIMEOUT);
  }, [user, logout]);

  // مراقبة نشاط المستخدم
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetSessionTimeout();
    };

    // إضافة المستمعين
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // بدء المؤقت
    resetSessionTimeout();

    // تنظيف عند إلغاء التحميل
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, resetSessionTimeout]);

  // التحقق من انتهاء الجلسة عند تحميل الصفحة
  useEffect(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity && user) {
      const elapsed = Date.now() - parseInt(lastActivity);
      if (elapsed > SESSION_TIMEOUT) {
        alert('تم إنهاء الجلسة بسبب عدم النشاط');
        logout();
      }
    }
  }, [user, logout]);

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Add token to API calls
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Inject store slug for multi-tenancy
    // Priority: 1. Explicit header, 2. localStorage (current session), 3. user object
    const currentSlug = headers['x-store-slug'] || 
                        localStorage.getItem('currentStoreSlug') || 
                        user?.storeSlug;

    if (currentSlug) {
      headers['x-store-slug'] = currentSlug;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized (invalid token), logout
    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    // If forbidden (role issue or store issue)
    if (response.status === 403) {
      // If it's a store-related 403, we might want to clear the slug
      console.error('Access Forbidden (403). Possible store mismatch or role issue.');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    authFetch,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'admin' || user?.role === 'manager',
    sessionWarning,
    resetSessionTimeout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
