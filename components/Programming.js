'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Search as SearchIcon, X, Edit, CheckCircle, Bell, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Programming = ({ data, saveData, showInvoice }) => {
  const { t, language, isRTL } = useLanguage();

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    status: t('programming.statusInProgramming') || 'قيد البرمجة',
    paid: false
  });

  const [editingProgrammingId, setEditingProgrammingId] = useState(null);
  const [originalProgramming, setOriginalProgramming] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    programmingId: null,
    customerName: '',
    cost: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMobileColumn, setActiveMobileColumn] = useState('statusInProgramming');

  const statusOptions = [
    { key: 'statusInProgramming', label: t('programming.statusInProgramming') || 'قيد البرمجة' },
    { key: 'statusReady', label: t('programming.statusReady') || 'جاهز' },
    { key: 'statusDelivered', label: t('programming.statusDelivered') || 'تم التسليم' },
    { key: 'statusCancelled', label: t('programming.statusCancelled') || 'ملغاة' }
  ];

  const getStatusLabel = (statusKey) => {
    return statusOptions.find(s => s.key === statusKey)?.label || statusKey;
  };

  const filteredProgramming = (data.programming || []).filter(p => {
    if (!searchTerm) return true;
    const normalizedSearch = searchTerm.toLowerCase();
    return (
      (p.customerName || '').toLowerCase().includes(normalizedSearch) ||
      (p.device || '').toLowerCase().includes(normalizedSearch) ||
      (p.programmingType || '').toLowerCase().includes(normalizedSearch) ||
      (p.phone || '').includes(normalizedSearch)
    );
  });

  const programmingByStatus = statusOptions.map(status => ({
    ...status,
    items: filteredProgramming.filter(p => p.status === getStatusLabel(status.key))
  }));

  const addProgramming = async () => {
    try {
      if (!formData.customerName) {
        toast.error(t('programming.errorCustomerName'));
        return;
      }
      if (!formData.device) {
        toast.error(t('programming.errorDevice'));
        return;
      }
      if (!formData.programmingType) {
        toast.error(t('programming.errorProgrammingType'));
        return;
      }
      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        toast.error(t('programming.errorCost'));
        return;
      }

      const newItem = {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        date: formData.date || new Date().toISOString(),
        status: formData.status || (t('programming.statusInProgramming') || 'قيد البرمجة'),
        paid: formData.paid || false,
        notified: formData.notified || false
      };

      if (editingProgrammingId) {
        const items = data.programming || [];
        const updatedItems = items.map(i => (i._id === editingProgrammingId || i.id === editingProgrammingId) ? { ...i, ...newItem } : i);
        await saveData('programming', updatedItems);
        setEditingProgrammingId(null);
        toast.success(t('programming.updateSuccess'));
      } else {
        const items = data.programming || [];
        const updatedItems = [...items, { id: Date.now(), created_at: new Date().toISOString(), ...newItem }];
        await saveData('programming', updatedItems);
        toast.success(t('programming.addSuccess'));
      }

      setShowAdd(false);
      setFormData({
        status: t('programming.statusInProgramming') || 'قيد البرمجة',
        paid: false
      });
    } catch (error) {
      console.error('Error adding programming:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
    }
  };

  const handleEditProgramming = (programming) => {
    setEditingProgrammingId(programming._id || programming.id);
    setOriginalProgramming(programming);
    setFormData({
      customerName: programming.customerName || '',
      phone: programming.phone || '',
      device: programming.device || '',
      programmingType: programming.programmingType || '',
      cost: programming.cost || 0,
      status: programming.status || (t('programming.statusInProgramming') || 'قيد البرمجة'),
      paid: programming.paid || false,
      notified: programming.notified || false,
      notes: programming.notes || '',
      date: programming.date ? new Date(programming.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowAdd(true);
  };

  const handleDeleteProgramming = (programming) => {
    setDeleteConfirmation({
      isOpen: true,
      programmingId: programming._id || programming.id,
      customerName: programming.customerName || '',
      cost: programming.cost || 0
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirmation.programmingId) {
        const items = data.programming || [];
        const updatedItems = items.filter(i => (i._id || i.id) !== deleteConfirmation.programmingId);
        await saveData('programming', updatedItems);
        toast.success(t('programming.deleteSuccess').replace('{name}', deleteConfirmation.customerName));
        setDeleteConfirmation({ isOpen: false, programmingId: null, customerName: '', cost: 0 });
      }
    } catch (error) {
      console.error('Error deleting programming:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
    }
  };

  const updateStatus = async (programmingId, newStatus) => {
    try {
      const items = data.programming || [];
      const updatedItems = items.map(i => {
        if ((i._id || i.id) === programmingId) {
          return { ...i, status: newStatus };
        }
        return i;
      });
      await saveData('programming', updatedItems);
      toast.success(t('programming.statusUpdated'));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
    }
  };

  const markAsPaid = async (programmingId) => {
    try {
      const items = data.programming || [];
      const updatedItems = items.map(i => {
        if ((i._id || i.id) === programmingId) {
          return { ...i, paid: true };
        }
        return i;
      });
      await saveData('programming', updatedItems);
      toast.success(t('programming.markedAsPaid'));
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
    }
  };

  const markAsNotified = async (programmingId) => {
    try {
      const items = data.programming || [];
      const updatedItems = items.map(i => {
        if ((i._id || i.id) === programmingId) {
          return { ...i, notified: true };
        }
        return i;
      });
      await saveData('programming', updatedItems);
      toast.success(t('programming.markedAsNotified'));
    } catch (error) {
      console.error('Error marking as notified:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
    }
  };

  const totalRevenue = (data.programming || []).reduce((sum, p) => sum + (p.cost || 0), 0);
  const paidCount = (data.programming || []).filter(p => p.paid).length;
  const readyCount = (data.programming || []).filter(p => p.status === (t('programming.statusReady') || 'جاهز')).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">{t('programming.title')}</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {t('programming.addProgramming')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('programming.totalProgramming')}</p>
              <p className="text-3xl font-bold mt-1">{(data.programming || []).length}</p>
            </div>
            <AlertCircle className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('programming.totalRevenue')}</p>
              <p className="text-3xl font-bold mt-1">{totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('programming.paidCount')}</p>
              <p className="text-3xl font-bold mt-1">{paidCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('programming.readyCount')}</p>
              <p className="text-3xl font-bold mt-1">{readyCount}</p>
            </div>
            <Bell className="w-10 h-10 opacity-50" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={t('programming.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border p-3 rounded-xl ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <SearchIcon className={`w-6 h-6 text-gray-400 absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5`} />
        </div>
      </div>

      {/* Status Columns */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {programmingByStatus.map(status => (
          <div key={status.key} className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              {status.label}
              <span className="text-sm text-gray-500">({status.items.length})</span>
            </h3>
            <div className="space-y-3">
              {status.items.map(programming => (
                <div key={programming._id || programming.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{programming.customerName}</h4>
                      <p className="text-sm text-gray-600">{programming.device}</p>
                      <p className="text-xs text-gray-500 mt-1">{programming.programmingType}</p>
                    </div>
                    {programming.paid && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                        {t('programming.paid')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-lg text-rose-600">{(programming.cost || 0).toFixed(2)} {t('dashboard.currency')}</span>
                    <div className="flex gap-2">
                      {!programming.paid && (
                        <button
                          onClick={() => markAsPaid(programming._id || programming.id)}
                          className="text-green-500 hover:text-green-700 p-1"
                          title={t('programming.markAsPaid')}
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      {!programming.notified && programming.status === (t('programming.statusReady') || 'جاهز') && (
                        <button
                          onClick={() => markAsNotified(programming._id || programming.id)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title={t('programming.markAsNotified')}
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditProgramming(programming)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title={t('programming.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProgramming(programming)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={t('programming.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {programming.phone && (
                    <p className="text-xs text-gray-500 mt-2">📱 {programming.phone}</p>
                  )}
                  {programming.notes && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{programming.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(programming.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              ))}
              {status.items.length === 0 && (
                <p className="text-center text-gray-400 py-4">{t('programming.noItems')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {statusOptions.map(status => (
            <button
              key={status.key}
              onClick={() => setActiveMobileColumn(status.key)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium ${
                activeMobileColumn === status.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {programmingByStatus
            .find(s => s.key === activeMobileColumn)
            ?.items.map(programming => (
              <div key={programming._id || programming.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{programming.customerName}</h4>
                    <p className="text-sm text-gray-600">{programming.device}</p>
                  </div>
                  {programming.paid && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                      {t('programming.paid')}
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm"><strong>{t('programming.type')}:</strong> {programming.programmingType}</p>
                  <p className="text-sm"><strong>{t('programming.cost')}:</strong> {(programming.cost || 0).toFixed(2)} {t('dashboard.currency')}</p>
                  <p className="text-sm"><strong>{t('inventory.date')}:</strong> {new Date(programming.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</p>
                </div>
                <div className="flex gap-2">
                  {!programming.paid && (
                    <button
                      onClick={() => markAsPaid(programming._id || programming.id)}
                      className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm font-medium"
                    >
                      {t('programming.markAsPaid')}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditProgramming(programming)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium"
                  >
                    {t('programming.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteProgramming(programming)}
                    className="px-3 bg-red-50 text-red-600 py-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-50 ring-4 ring-blue-50/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="text-blue-500" />
            {editingProgrammingId ? t('programming.editProgramming') : t('programming.addProgramming')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t('programming.customerName')}
              value={formData.customerName || ''}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <input
              type="text"
              placeholder={t('programming.phone')}
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <input
              type="text"
              placeholder={t('programming.device')}
              value={formData.device || ''}
              onChange={(e) => setFormData({ ...formData, device: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <input
              type="text"
              placeholder={t('programming.programmingType')}
              value={formData.programmingType || ''}
              onChange={(e) => setFormData({ ...formData, programmingType: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <input
              type="number"
              placeholder={t('programming.cost')}
              value={formData.cost || ''}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
              step="0.01"
              min="0"
            />
            <input
              type="date"
              value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <select
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              {statusOptions.map(status => (
                <option key={status.key} value={status.label}>
                  {status.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.paid || false}
                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                className="w-5 h-5"
              />
              <span>{t('programming.paid')}</span>
            </div>
            <textarea
              placeholder={t('programming.notes')}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 border-gray-200 md:col-span-2 ${isRTL ? 'text-right' : 'text-left'}`}
              rows="3"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addProgramming}
              className="flex-1 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors font-bold"
            >
              {editingProgrammingId ? t('programming.update') : t('programming.save')}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setEditingProgrammingId(null);
                setFormData({
                  status: t('programming.statusInProgramming') || 'قيد البرمجة',
                  paid: false
                });
              }}
              className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-bold"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, programmingId: null, customerName: '', cost: 0 })}
        onConfirm={confirmDelete}
        title={t('programming.confirmDelete')}
        message={t('programming.confirmDeleteMessage').replace('{name}', deleteConfirmation.customerName)}
      />
    </div>
  );
};

export default Programming;
