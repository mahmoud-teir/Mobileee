'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Tag, ShoppingBag, X } from 'lucide-react';

const CategoryManager = ({ categories, addItem, deleteItem, onClose }) => {
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'ShoppingBag' });
  const [error, setError] = useState('');

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('يرجى إدخال اسم القسم');
      return;
    }

    try {
      await addItem('categories', { name: newCategory.name.trim(), icon: newCategory.icon });
      setNewCategory({ name: '', icon: 'ShoppingBag' });
      setError('');
    } catch (err) {
      setError(err.message || 'فشل في إضافة القسم');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ لا يمكن حذفه إذا كان يحتوي على منتجات.')) {
      try {
        await deleteItem('categories', id);
      } catch (err) {
        alert(err.message || 'فشل في حذف القسم');
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
          {/* Form */}
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

          {/* List */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">الأقسام الحالية</h4>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-600 p-2 rounded-lg shadow-sm">
                      <ShoppingBag className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="font-medium dark:text-gray-200">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف القسم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4 text-sm">لا يوجد أقسام مخصصة بعد</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 text-center">
          <p className="text-xs text-gray-500">ملاحظة: لا يمكن حذف قسم إذا كان يحتوي على منتجات في المخزون.</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
