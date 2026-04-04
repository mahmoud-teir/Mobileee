'use client';
import React, { useState } from 'react';
import { UserPlus, Search as SearchIcon, Trash2, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Customers = ({ data, saveData }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    customerId: null,
    customerName: ''
  });

  const addCustomer = async () => {
    if (!formData.name?.trim()) {
      toast.error(t('customers.errorName'));
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error(t('customers.errorPhone'));
      return;
    }

    try {
      const newCustomer = {
        id: editingCustomerId || Date.now(),
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        totalPurchases: formData.totalPurchases || 0,
        lastPurchase: formData.lastPurchase || new Date().toISOString()
      };

      if (editingCustomerId) {
        const updatedCustomers = data.customers.map(c => (c._id || c.id) === editingCustomerId ? newCustomer : c);
        await saveData('customers', updatedCustomers);
        toast.success(t('customers.successUpdate'));
      } else {
        await saveData('customers', [...data.customers, newCustomer]);
        toast.success(t('customers.successAdd'));
      }
      setShowAdd(false);
      setFormData({});
      setEditingCustomerId(null);
    } catch (error) {
      console.error('خطأ في حفظ العميل:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDeleteCustomer = (customer) => {
    setDeleteConfirmation({
      isOpen: true,
      customerId: customer._id || customer.id,
      customerName: customer.name
    });
  };

  const confirmDeleteCustomer = async () => {
    try {
      if (deleteConfirmation.customerId) {
        await saveData('customers', data.customers.filter(c => (c._id || c.id) !== deleteConfirmation.customerId));
        setDeleteConfirmation({ isOpen: false, customerId: null, customerName: '' });
        toast.success(t('customers.successDelete'));
      }
    } catch (error) {
      console.error('خطأ في حذف العميل:', error);
      toast.error(t('common.error'));
    }
  };

  // Helper to normalize Arabic text for better searching
  const normalizeArabic = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, ''); // Remove harakat
  };

  const filteredCustomers = (data.customers || [])
    .filter(customer => {
      const normalizedSearch = normalizeArabic(searchTerm);
      const name = normalizeArabic(customer.name || '');
      const phone = (customer.phone || '');
      return name.includes(normalizedSearch) || phone.includes(searchTerm);
    })
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <UserPlus className="text-indigo-600" />
          {t('customers.title')}
        </h2>
        <button
          onClick={() => { setEditingCustomerId(null); setFormData({}); setShowAdd(true); }}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg"
        >
          <UserPlus className="w-6 h-6" />
          {t('customers.newCustomer')}
        </button>
      </div>

      <div className="relative">
        <SearchIcon className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} />
        <input
          type="text"
          placeholder={t('customers.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`w-full border p-3 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all`}
        />
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800">
            {editingCustomerId ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {editingCustomerId ? t('customers.editTitle') : t('customers.addTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.name')}</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('customers.name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.phone')}</label>
              <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('customers.phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.email')}</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="example@mail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.address')}</label>
              <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('customers.address')} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addCustomer} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg">
              {editingCustomerId ? t('common.update') : t('common.save')}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingCustomerId(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Table View (Desktop Only) */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-600">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('customers.name')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('customers.phone')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('customers.totalPurchases')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('customers.lastPurchase')}</th>
              <th className="p-4 text-center">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(filteredCustomers || []).length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer._id || customer.id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-400">{customer.address || t('common.none')}</div>
                  </td>
                  <td className="p-4 font-mono text-sm">{customer.phone}</td>
                  <td className="p-4">
                    <div className="font-bold text-indigo-600">{(customer.totalPurchases || 0).toFixed(2)} {t('dashboard.currency')}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString(language) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setFormData(customer); setEditingCustomerId(customer._id || customer.id); setShowAdd(true); }} className="text-blue-500 hover:text-blue-700">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteCustomer(customer)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-400">
                  {t('customers.noCustomers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card View (Mobile Only) */}
      <div className="md:hidden space-y-4 pb-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <div key={customer._id || customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{customer.name}</h4>
                  <p className="text-sm text-gray-500">{customer.address || t('common.none')}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                    {t('customers.customer')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('customers.phone')}</span>
                  <a href={`tel:${customer.phone}`} className="font-mono text-gray-800 font-bold">{customer.phone}</a>
                </div>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('customers.totalPurchases')}</span>
                  <span className="font-black text-indigo-600">{(customer.totalPurchases || 0).toFixed(2)} {t('dashboard.currency')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-400">
                  {t('customers.lastPurchase')}: {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString(language) : '-'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFormData(customer); setEditingCustomerId(customer._id || customer.id); setShowAdd(true); }}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95 transition-transform"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            {t('customers.noCustomers')}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, customerId: null, customerName: '' })}
        onConfirm={confirmDeleteCustomer}
        title={t('customers.deleteTitle')}
        message={t('customers.deleteMsg')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default Customers;