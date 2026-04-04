'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Search as SearchIcon, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

const Expenses = ({ data, saveData }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', category: 'other' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddExpense = async () => {
    if (isSaving) return;
    
    if (!formData.description?.trim()) {
      toast.error(t('expenses.errorDescription') || 'Please enter description');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t('expenses.errorAmount') || 'Please enter valid amount');
      return;
    }
    if (!formData.category) {
      toast.error(t('expenses.errorCategory') || 'Please select category');
      return;
    }

    setIsSaving(true);

    try {
      const newExpense = {
        _id: editingExpenseId || Date.now().toString(),
        id: editingExpenseId || Date.now().toString(),
        date: new Date().toISOString(),
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category
      };

      let updatedExpenses;
      if (editingExpenseId) {
        updatedExpenses = (data.expenses || []).map(e => (e._id || e.id) === editingExpenseId ? newExpense : e);
        toast.success(t('expenses.successUpdate') || 'Updated successfully');
      } else {
        updatedExpenses = [...(data.expenses || []), newExpense];
        toast.success(t('expenses.success') || 'Added successfully');
      }

      const success = await saveData('expenses', updatedExpenses);
      if (success) {
        setShowAdd(false);
        setFormData({ description: '', amount: '', category: 'other' });
        setEditingExpenseId(null);
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      toast.error(t('common.errorGeneric') || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm(t('inventory.deleteMessage'))) return;

    try {
      const updatedExpenses = (data.expenses || []).filter(e => (e._id || e.id) !== id);
      await saveData('expenses', updatedExpenses);
      toast.success(t('expenses.successDelete') || 'Deleted successfully');
    } catch (error) {
      console.error('Delete expense error:', error);
      toast.error(t('common.errorGeneric'));
    }
  };

  const totalExpenses = (data.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const filteredExpenses = (data.expenses || []).filter(e => 
    !searchTerm || 
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).reverse();

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="text-amber-600" />
          {t('expenses.title')}
        </h2>
        <div className="flex gap-4 items-center">
          <div className="bg-amber-100 text-amber-800 px-6 py-3 rounded-xl border border-amber-200">
            <p className="text-sm font-medium">{t('expenses.totalExpenses')}</p>
            <p className="text-2xl font-black">{totalExpenses.toFixed(2)} {t('dashboard.currency')}</p>
          </div>
          <button
            onClick={() => { 
              setEditingExpenseId(null); 
              setFormData({ description: '', amount: '', category: 'other' }); 
              setShowAdd(!showAdd); 
            }}
            className="bg-amber-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-amber-700 transition shadow-lg"
          >
            <Plus className={`w-6 h-6 transition-transform ${showAdd ? 'rotate-45' : ''}`} />
            {t('expenses.newExpense')}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-800">
            {editingExpenseId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingExpenseId ? t('expenses.edit') : t('expenses.add')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.description')}</label>
              <input 
                type="text" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                placeholder={t('expenses.description')} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.amount')}</label>
              <input 
                type="number" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-600" 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.category')}</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {Object.entries(t('expenses.categories') || {}).map(([key, val]) => (
                  <option key={key} value={key}>{val}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleAddExpense} 
              disabled={isSaving}
              className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-amber-700 transition shadow-lg disabled:opacity-50"
            >
              {isSaving ? t('common.loading') : (editingExpenseId ? t('common.update') : t('common.save'))}
            </button>
            <button 
              onClick={() => { setShowAdd(false); setEditingExpenseId(null); }} 
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="relative max-w-md">
            <SearchIcon className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
            <input 
              type="text" 
              placeholder={t('expenses.searchPlaceholder')} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className={`w-full border p-2 rounded-lg ${isRTL ? 'pr-10' : 'pl-10'} focus:ring-2 focus:ring-amber-500 outline-none text-sm`} 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b uppercase text-xs font-bold text-gray-600">
              <tr>
                <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('sales.date')}</th>
                <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.description')}</th>
                <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.category')}</th>
                <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.amount')}</th>
                <th className="p-4 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map(exp => (
                <tr key={exp._id || exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="text-xs text-gray-400 font-mono">
                      {new Date(exp.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{exp.description}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                      {t(`expenses.categories.${exp.category}`) || exp.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-lg font-black text-amber-600">
                      {exp.amount.toFixed(2)} {t('dashboard.currency')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setFormData({ 
                            description: exp.description, 
                            amount: String(exp.amount), 
                            category: exp.category 
                          });
                          setEditingExpenseId(exp._id || exp.id);
                          setShowAdd(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp._id || exp.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    {t('expenses.noExpenses')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;