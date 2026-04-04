'use client';
import React, { useState } from 'react';
import { 
  Truck, Plus, Search as SearchIcon, Trash2, Edit, Phone, Mail, MapPin, Package, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Suppliers = ({ data, saveData }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    supplierId: null,
    supplierName: ''
  });

  const addSupplier = async () => {
    if (!formData.name?.trim()) {
      toast.error(t('suppliers.errorName'));
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error(t('suppliers.errorPhone'));
      return;
    }

    try {
      const newSupplier = {
        id: editingSupplierId || Date.now(),
        created_at: new Date().toISOString(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        notes: formData.notes?.trim() || ''
      };

      if (editingSupplierId) {
        const updatedSuppliers = data.suppliers.map(s => (s._id || s.id) === editingSupplierId ? newSupplier : s);
        await saveData('suppliers', updatedSuppliers);
        toast.success(t('suppliers.successUpdate'));
      } else {
        const updatedSuppliers = [...(data.suppliers || []), newSupplier];
        await saveData('suppliers', updatedSuppliers);
        toast.success(t('suppliers.successAdd'));
      }
      
      setShowAdd(false);
      setFormData({});
      setEditingSupplierId(null);
    } catch (error) {
      console.error('خطأ في حفظ المورد:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDeleteSupplier = (supplier) => {
    setDeleteConfirmation({
      isOpen: true,
      supplierId: supplier._id || supplier.id,
      supplierName: supplier.name
    });
  };

  const confirmDeleteSupplier = async () => {
    try {
      if (deleteConfirmation.supplierId) {
        const updatedSuppliers = data.suppliers.filter(s => (s._id || s.id) !== deleteConfirmation.supplierId);
        await saveData('suppliers', updatedSuppliers);
        setDeleteConfirmation({ isOpen: false, supplierId: null, supplierName: '' });
        toast.success(t('suppliers.successDelete'));
      }
    } catch (error) {
      console.error('خطأ في حذف المورد:', error);
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

  const filteredSuppliers = (data.suppliers || []).filter(supplier => {
    const normalizedSearch = normalizeArabic(searchTerm);
    const name = normalizeArabic(supplier.name || '');
    const phone = (supplier.phone || '');
    const email = normalizeArabic(supplier.email || '');
    
    return name.includes(normalizedSearch) || 
           phone.includes(searchTerm) || 
           email.includes(normalizedSearch);
  });

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="text-amber-600" />
          {t('suppliers.title')}
        </h2>
        <button
          onClick={() => { setEditingSupplierId(null); setFormData({}); setShowAdd(true); }}
          className="bg-amber-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-amber-700 transition shadow-lg"
        >
          <Plus className="w-6 h-6" />
          {t('suppliers.newSupplier')}
        </button>
      </div>

      <div className="relative">
        <SearchIcon className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} />
        <input
          type="text"
          placeholder={t('suppliers.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`w-full border p-3 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl focus:ring-2 focus:ring-amber-500 outline-none shadow-sm transition-all`}
        />
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-800">
            {editingSupplierId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingSupplierId ? t('suppliers.editTitle') : t('suppliers.addTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.name')}</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder={t('suppliers.name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.phone')}</label>
              <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder={t('suppliers.phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.email')}</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="example@mail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.address')}</label>
              <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder={t('suppliers.address')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.notes')}</label>
              <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border p-2 rounded-lg h-20 focus:ring-2 focus:ring-amber-500 outline-none" placeholder={t('suppliers.notes')} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addSupplier} className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-amber-700 transition shadow-lg">
              {editingSupplierId ? t('common.update') : t('common.save')}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingSupplierId(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-600">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('suppliers.name')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('suppliers.phone')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('suppliers.email')}</th>
              <th className="p-4 text-center">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(filteredSuppliers || []).length > 0 ? (
              filteredSuppliers.map(supplier => (
                <tr key={supplier._id || supplier.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{supplier.name}</div>
                    <div className="text-xs text-gray-400">{supplier.address || t('common.none')}</div>
                  </td>
                  <td className="p-4 font-mono text-sm">{supplier.phone}</td>
                  <td className="p-4 text-gray-600">{supplier.email || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setFormData(supplier); setEditingSupplierId(supplier._id || supplier.id); setShowAdd(true); }} className="text-blue-500 hover:text-blue-700">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteSupplier(supplier)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">{t('suppliers.noSuppliers')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, supplierId: null, supplierName: '' })}
        onConfirm={confirmDeleteSupplier}
        title={t('suppliers.deleteTitle')}
        message={t('suppliers.deleteMsg')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default Suppliers;