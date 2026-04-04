'use client';
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle, ShoppingBag, Languages } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Login = ({ onLogin }) => {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || '/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('login.errorGeneric'));
      }

      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call onLogin callback
      onLogin(data.user, data.token);

      // Redirect to store slug if available (for subdirectory routing)
      if (data.storeSlug && data.user.role !== 'super_admin') {
        window.location.href = `/${data.storeSlug}`;
      } else if (data.user.role === 'super_admin') {
        // Super admins can stay at root or go to dashboard
        window.location.href = '/';
      }

    } catch (err) {
      setError(err.message || t('login.errorConnection'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 flex items-center justify-center p-4">
      {/* Language Toggle */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 right-6 lg:top-8 lg:right-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 transition-all active:scale-95"
      >
        <Languages className="w-4 h-4" />
        <span className="text-sm font-medium">
          {language === 'ar' ? 'English' : 'العربية'}
        </span>
      </button>

      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-4 border-4 border-rose-50 transition-transform hover:scale-105 duration-300">
            <ShoppingBag className="w-12 h-12 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('login.title')}</h1>
          <p className="text-rose-200">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-100 rounded-xl mb-3">
              <LogIn className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('login.header')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('login.subHeader')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className={`block text-gray-700 text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('login.username')}
              </label>
              <div className="relative">
                <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all`}
                  placeholder={t('login.usernamePlaceholder')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-gray-700 text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full ${isRTL ? 'pr-10 pl-12 text-right' : 'pl-10 pr-12 text-left'} py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all`}
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('login.loading')}
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t('login.submit')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-rose-200 text-sm mt-6">
          {t('login.footer').replace('{year}', new Date().getFullYear())}
        </p>
      </div>
    </div>
  );
};

export default Login;
