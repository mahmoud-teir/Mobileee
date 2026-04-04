'use client';
import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Globe, Image as ImageIcon, CheckCircle, AlertCircle, Save, Upload, Stamp, FileText } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const Settings = () => {
  const { t } = useLanguage();
  const { user, authFetch, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    phone: '',
    settings: {
      logo: '',
      stamp: '',
      taxNumber: '',
      receiptHeader: '',
      receiptFooter: ''
    }
  });

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const res = await authFetch('/api/store/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setStoreData(data);
    } catch (error) {
      console.error(error);
      toast.error(t('settings.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('settings.')) {
      const field = name.split('.')[1];
      setStoreData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: value
        }
      }));
    } else {
      setStoreData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setStoreData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/store/settings', {
        method: 'PATCH',
        body: JSON.stringify({ updates: storeData })
      });

      if (!res.ok) throw new Error('Update failed');
      
      const updatedStore = await res.json();
      
      // Sync with global auth state
      updateUser({
        ...user,
        currentStore: updatedStore
      });

      toast.success(t('settings.updateSuccess') || t('settings.saveSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(t('settings.updateError') || t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-rose-100">
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
          </div>
          <p className="mt-2 text-rose-100">{t('settings.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* المعلومات الأساسية */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-rose-500" />
              {t('settings.basicInfo') || 'Basic Info'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.storeName')}</label>
                <div className="relative">
                  <Store className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={storeData.name}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                    placeholder="اسم المحل"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.taxNumber') || 'Tax ID'}</label>
                <div className="relative">
                  <Globe className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="settings.taxNumber"
                    value={storeData.settings?.taxNumber || ''}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                    placeholder="الرقم الضريبي"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.phone')}</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={storeData.phone || ''}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.address')}</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={storeData.address || ''}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                    placeholder="عنوان المحل"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* الهوية البصرية */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <ImageIcon className="w-5 h-5 text-rose-500" />
              {t('settings.branding') || 'Branding'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* اللوجو */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">{t('settings.logo')}</label>
                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition">
                  {storeData.settings?.logo ? (
                    <div className="relative w-32 h-32">
                      <img src={storeData.settings.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setStoreData(prev => ({ ...prev, settings: { ...prev.settings, logo: '' } }))}
                        className="absolute -top-2 -left-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 py-4">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p className="text-xs">{t('settings.uploadHint') || t('settings.imageHint')}</p>
                    </div>
                  )}
                  <label className="cursor-pointer bg-white px-4 py-2 rounded-lg border shadow-sm hover:bg-rose-50 hover:text-rose-600 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{t('settings.chooseFile') || 'Choose Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                  </label>
                </div>
              </div>

              {/* الختم */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">{t('settings.stamp')}</label>
                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition">
                  {storeData.settings?.stamp ? (
                    <div className="relative w-32 h-32">
                      <img src={storeData.settings.stamp} alt="Stamp" className="w-full h-full object-contain rounded-lg opacity-80" />
                      <button
                        type="button"
                        onClick={() => setStoreData(prev => ({ ...prev, settings: { ...prev.settings, stamp: '' } }))}
                        className="absolute -top-2 -left-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 py-4">
                      <Stamp className="w-12 h-12 mb-2" />
                      <p className="text-xs">{t('settings.uploadHint') || t('settings.imageHint')}</p>
                    </div>
                  )}
                  <label className="cursor-pointer bg-white px-4 py-2 rounded-lg border shadow-sm hover:bg-rose-50 hover:text-rose-600 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{t('settings.chooseFile') || 'Choose Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'stamp')} />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* تذييل وهيدر الفاتورة */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-rose-500" />
              {t('settings.invoiceCustomization') || 'Invoice Design'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.receiptHeader')}</label>
                <textarea
                  name="settings.receiptHeader"
                  value={storeData.settings?.receiptHeader || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                  rows="2"
                  placeholder="نص يظهر في أعلى الفاتورة (مثل كلمات ترحيبية)"
                ></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.receiptFooter')}</label>
                <textarea
                  name="settings.receiptFooter"
                  value={storeData.settings?.receiptFooter || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                  rows="2"
                  placeholder="نص يظهر في أسفل الفاتورة (مثل شروط الإرجاع أو شكر)"
                ></textarea>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-3 px-10 rounded-xl shadow-lg flex items-center gap-2 transition hover:scale-105 active:scale-95 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {t('settings.saveButton') || 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
