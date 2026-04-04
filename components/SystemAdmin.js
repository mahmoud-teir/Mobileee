'use client';
import React, { useState, useEffect } from 'react';
import { Store, User, Shield, CheckCircle, XCircle, ExternalLink, Activity, DollarSign, Users, Plus, Edit, Save, X, Info, Crown, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

const SystemAdmin = ({ onImpersonate }) => {
  const { t, isRTL } = useLanguage();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
    ownerUsername: '',
    ownerPassword: ''
  });

  const fetchStores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/stores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(t('admin.errorFetch') || 'فشل تحميل المتاجر');
      const data = await res.json();
      setStores(data);
      
      const active = data.filter(s => s.isActive).length;
      setStats({
        total: data.length,
        active,
        revenue: 0 
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSaveStore = async () => {
    try {
      const token = localStorage.getItem('token');
      const method = editingStoreId ? 'PATCH' : 'POST';
      const body = editingStoreId 
        ? { id: editingStoreId, updates: { name: formData.name, slug: formData.slug } }
        : formData;

      const res = await fetch('/api/admin/stores', {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل الحفظ');
      }

      toast.success(editingStoreId ? t('admin.successUpdate') || 'تم تحديث المتجر' : t('admin.successCreate') || 'تم إنشاء المتجر بنجاح');
      setShowAddForm(false);
      setEditingStoreId(null);
      setFormData({ name: '', slug: '', ownerEmail: '', ownerUsername: '', ownerPassword: '' });
      fetchStores();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleStoreStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/stores', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ id, updates: { isActive: !currentStatus } })
      });
      if (res.ok) {
        toast.success(currentStatus ? t('admin.successDisable') : t('admin.successEnable'));
        fetchStores();
      }
    } catch (error) {
      toast.error(t('admin.errorStatusUpdate') || 'حدث خطأ في تحديث الحالة');
    }
  };

  const updatePlan = async (id, plan) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/stores', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ id, updates: { 'subscription.plan': plan } })
      });
      toast.success(t('admin.successPlanUpdate') || 'تم تحديث الباقة');
      fetchStores();
    } catch (error) {
      toast.error(t('admin.errorUpdatePlan') || 'فشل تحديث الباقة');
    }
  };

  if (loading && stores.length === 0) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between border-b-4 border-indigo-800">
          <div>
            <p className="text-indigo-100 text-sm font-bold opacity-80">{t('admin.store')}</p>
            <h3 className="text-3xl font-black">{stats.total}</h3>
          </div>
          <Store className="w-12 h-12 opacity-20" />
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between border-b-4 border-emerald-800">
          <div>
            <p className="text-emerald-100 text-sm font-bold opacity-80">{t('admin.status')}</p>
            <h3 className="text-3xl font-black">{stats.active}</h3>
          </div>
          <Activity className="w-12 h-12 opacity-20" />
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between border-b-4 border-amber-800">
          <div>
            <p className="text-amber-100 text-sm font-bold opacity-80">{t('admin.owner')}</p>
            <h3 className="text-3xl font-black">{stores.reduce((acc, s) => acc + (s.userCount || 1), 0)}</h3>
          </div>
          <Users className="w-12 h-12 opacity-20" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black flex items-center gap-2 text-gray-800">
            <Shield className="text-indigo-600 w-8 h-8" />
            {t('admin.stores')}
        </h2>
        <button 
          onClick={() => { setShowAddForm(!showAddForm); setEditingStoreId(null); setFormData({ name: '', slug: '', ownerEmail: '', ownerUsername: '', ownerPassword: '' }); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          {t('admin.newStore')}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800">
            {editingStoreId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingStoreId ? t('admin.editStore') : t('admin.newStoreDesc')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.storeName')}</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('admin.storeNamePlaceholder') || "مثلاً: محل سمارت فون"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.storeSlug')}</label>
              <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="smart-phone" />
            </div>
            {!editingStoreId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ownerEmail')}</label>
                  <input type="email" value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="owner@mail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ownerUsername')}</label>
                  <input type="text" value={formData.ownerUsername} onChange={e => setFormData({...formData, ownerUsername: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="owner123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ownerPassword')}</label>
                  <input type="password" value={formData.ownerPassword} onChange={e => setFormData({...formData, ownerPassword: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="********" />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={handleSaveStore} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              {editingStoreId ? t('admin.updateStoreBtn') : t('admin.createStoreBtn')}
            </button>
            <button onClick={() => { setShowAddForm(false); setEditingStoreId(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2">
              <X className="w-5 h-5" />
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 text-center">{t('admin.store')}</th>
                <th className="p-4 text-center">{t('admin.owner')}</th>
                <th className="p-4 text-center">{t('admin.plan')}</th>
                <th className="p-4 text-center">{t('admin.status')}</th>
                <th className="p-4 text-center">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.map(store => (
                <tr key={store._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{store.name}</div>
                    <div className="text-xs text-indigo-600 font-mono">/{store.slug}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-medium text-gray-800">{store.owner?.name || '---'}</div>
                    <div className="text-xs text-gray-400">{store.owner?.email}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1 group relative">
                      <div className="flex items-center gap-2">
                        {store.subscription?.plan === 'enterprise' ? <Crown className="w-4 h-4 text-amber-500" /> :
                         store.subscription?.plan === 'pro' ? <Star className="w-4 h-4 text-indigo-500" /> :
                         <Zap className="w-4 h-4 text-gray-400" />}
                        
                        <select 
                            value={store.subscription?.plan || 'free'} 
                            onChange={(e) => updatePlan(store._id, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                store.subscription?.plan === 'enterprise' ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' :
                                store.subscription?.plan === 'pro' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 
                                'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <option value="free">{t('admin.plans.free')}</option>
                            <option value="pro">{t('admin.plans.pro')}</option>
                            <option value="enterprise">{t('admin.plans.enterprise')}</option>
                        </select>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 z-20 bg-white shadow-2xl p-3 rounded-xl border border-gray-100 w-48 pointer-events-none">
                          <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                              {store.subscription?.plan === 'enterprise' ? t('admin.plans.enterpriseDesc') :
                               store.subscription?.plan === 'pro' ? t('admin.plans.proDesc') :
                               t('admin.plans.freeDesc')}
                          </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStoreStatus(store._id, store.isActive)} className="hover:scale-105 transition-transform">
                      {store.isActive ? 
                        <span className="flex items-center gap-1 justify-center text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
                          <CheckCircle className="w-3 h-3" /> {t('admin.active')}
                        </span> : 
                        <span className="flex items-center gap-1 justify-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-100 shadow-sm">
                          <XCircle className="w-3 h-3" /> {t('admin.inactive')}
                        </span>
                      }
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => {
                            setEditingStoreId(store._id);
                            setFormData({ name: store.name, slug: store.slug });
                            setShowAddForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onImpersonate(store.slug)}
                        title={t('admin.impersonate')}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemAdmin;
