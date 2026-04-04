'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    storeName: '',
    storeSlug: '',
    secretKey: ''
  });

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/-+/g, '-')      // Replace multiple - with single -
      .trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generate slug when store name changes
      if (name === 'storeName') {
        newData.storeSlug = generateSlug(value);
      } else if (name === 'storeSlug') {
        newData.storeSlug = generateSlug(value);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'owner' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'حدث خطأ ما');

      setSuccess('تم إنشاء المتجر بنجاح! جاري تحويلك لصفحة الدخول...');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إعداد متجر جديد</h1>
            <p className="text-gray-600 font-medium font-sans">نظام إدارة محلات الجوال المحترف (SaaS)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Store Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-100 pb-2">بيانات المتجر</h2>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">اسم المتجر</label>
                  <input
                    type="text"
                    name="storeName"
                    required
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    placeholder="مثال: متجر الأمل"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">رابط المتجر (Slug)</label>
                  <div className="flex flex-row-reverse">
                    <span className="bg-gray-200 px-3 py-2 rounded-l-lg text-gray-600 border border-gray-300 border-r-0 text-sm flex items-center font-bold">.smartstore.com</span>
                    <input
                      type="text"
                      name="storeSlug"
                      required
                      value={formData.storeSlug}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left font-mono"
                      placeholder="alamal-shop"
                    />
                  </div>
                  <p className="text-gray-400 text-[10px] mt-1 text-left">هذا هو المعرف الفريد للمحل في الرابط</p>
                </div>
              </div>

              {/* Owner Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-100 pb-2">بيانات المالك</h2>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    placeholder="الاسم الثلاثي"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">اسم المستخدم</label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Secret Key */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-red-600 font-bold mb-2 text-center text-lg">مفتاح النظام السري (Required)</label>
              <input
                type="password"
                name="secretKey"
                required
                value={formData.secretKey}
                onChange={handleChange}
                className="w-full max-w-xs mx-auto block bg-gray-50 border-2 border-red-200 text-gray-900 rounded-lg px-4 py-3 text-center text-xl tracking-widest focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all shadow-inner"
                placeholder="********"
              />
              <p className="text-gray-400 text-xs text-center mt-2">أدخل الكود الممنوح لك من قبل الإدارة</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-center font-bold animate-pulse">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg text-center font-bold">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition duration-200 transform hover:translate-y-[-2px] shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'جاري إعداد المتجر والبيانات...' : 'إطلاق المتجر الجديد الآن 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
