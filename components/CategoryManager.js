'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Tag, ShoppingBag, X, Lock } from 'lucide-react';
import { toast } from 'sonner';

const CategoryManager = ({ categories, addItem, deleteItem, onClose }) => {
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'ShoppingBag' });
  const [error, setError] = useState('');

  const hardcodedCategories = [
    { id: 'screens', name: 'الشاشات', isHardcoded: true },
    { id: 'phones', name: 'الجوالات', isHardcoded: true },
    { id: 'stickers', name: 'الملصقات', isHardcoded: true },
    { id: 'accessories', name: 'الإكسسوارات', isHardcoded: true }
  ];

  const allCategoriesToDisplay = [
    ...hardcodedCategories,
    ...(categories || []).map(c => ({ ...c, id: c._id || c.id, isHardcoded: false }))
  ];

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('يرجى إدخال اسم القسم');
      return;
    }

    if (allCategoriesToDisplay.some(c => c.name === newCategory.name.trim())) {
      setError('هذا القسم موجود بالفعل');
      return;
    }

    try {
      await addItem('categories', { name: newCategory.name.trim(), icon: newCategory.icon });
      setNewCategory({ name: '', icon: 'ShoppingBag' });
      setError('');
      toast.success('تم إضافة القسم بنجاح!');
    } catch (err) {
      setError(err.message || 'فشل في إضافة القسم');
      toast.error(err.message || 'فشل في إضافة القسم');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ لا يمكن حذفه إذا كان يحتوي على منتجات.')) {
      try {
        await deleteItem('categories', id);
        toast.success('تم حذف القسم بنجاح!');
      } catch (err) {
        toast.error(err.message || 'فشل في حذف القسم');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Tag className="w-5 h-5" />
            <h3 className="text-xl font-bold">إدارة الأقسام</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم القسم الجديد
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثلاً: تابلت، شواحن..."
                  value={newCategory.name}
                  onChange={(e) => {
                    setNewCategory({ ...newCategory, name: e.target.value });
                    setError('');
                  }}
                  className="flex-1 border p-2 rounded-xl focus:ring-2 focus:ring-rose-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">جميع الأقسام</h4>
            {allCategoriesToDisplay.map((cat) => (
              <div key={cat.id} className={`flex justify-between items-center p-3 rounded-xl transition-colors ${cat.isHardcoded ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-700/50 group hover:bg-rose-50 dark:hover:bg-rose-900/10'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-gray-600 p-2 rounded-lg shadow-sm">
                    {cat.isHardcoded ? <Lock className="w-4 h-4 text-gray-400" /> : <ShoppingBag className="w-4 h-4 text-rose-500" />}
                  </div>
                  <span className={`font-medium ${cat.isHardcoded ? 'text-gray-500' : 'dark:text-gray-200'}`}>
                    {cat.name} {cat.isHardcoded && <span className="text-xs font-normal">(أساسي)</span>}
                  </span>
                </div>
                {!cat.isHardcoded && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف القسم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 text-center">
          <p className="text-xs text-gray-500">ملاحظة: الأقسام الأساسية لا يمكن حذفها أو تعديلها.</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
