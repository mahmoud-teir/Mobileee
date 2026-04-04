'use client';
import React, { useState } from 'react';
import { FileText, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

  // Expenses Component
  const Expenses = ({ data, saveData }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const addExpense = async () => {
      if (isSaving) return;
      setIsSaving(true);

      try {
        const newExpense = {
          id: editingExpenseId || Date.now(),
          date: new Date().toISOString(),
          ...formData,
          amount: parseFloat(formData.amount) || 0
        };

        // Prevent accidental duplicates: same description, amount and category within 5 seconds
        if (!editingExpenseId) {
          const duplicate = (data.expenses || []).some(e => {
            const sameDesc = (e.description || '').trim() === (newExpense.description || '').trim();
            const sameAmt = Number(e.amount) === Number(newExpense.amount);
            const sameCat = (e.category || '') === (newExpense.category || '');
            const timeDiff = Math.abs(new Date(e.date).getTime() - new Date(newExpense.date).getTime());
            return sameDesc && sameAmt && sameCat && timeDiff < 5000;
          });

          if (duplicate) {
            toast.error('تم الكشف عن مصروف مطابق تم إضافته للتو. لم يتم إضافة تكرار.');
            setIsSaving(false);
            return;
          }
        }

        if (editingExpenseId) {
          // replace existing
          const updated = (data.expenses || []).map(e => (e._id || e.id) === editingExpenseId ? newExpense : e);
          await saveData('expenses', updated);
          toast.success('تم تحديث المصروف بنجاح!');
        } else {
          await saveData('expenses', [...(data.expenses || []), newExpense]);
          toast.success('تم إضافة المصروف بنجاح!');
        }

        setShowAdd(false);
        setFormData({});
        setEditingExpenseId(null);
      } catch (err) {
        console.error('خطأ عند حفظ المصروف:', err);
        toast.error('حدث خطأ أثناء حفظ المصروف. حاول مرة أخرى.');
      } finally {
        setIsSaving(false);
      }
    };

    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">المصاريف</h2>
          <div className="flex gap-4 items-center">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg">
              <p className="text-sm">إجمالي المصاريف</p>
              <p className="text-2xl font-bold">{totalExpenses.toFixed(2)} ₪</p>
            </div>
            
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="بحث عن مصروف..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <button
              onClick={() => { setShowAdd(true); setEditingExpenseId(null); setFormData({}); }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
              إضافة مصروف
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">{editingExpenseId ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="البيان"
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="المبلغ"
                value={formData.amount || ''}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="border p-2 rounded"
              />
              <select
                value={formData.category || ''}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="border p-2 rounded col-span-2"
              >
                <option value="">اختر الفئة</option>
                <option value="إيجار">إيجار</option>
                <option value="كهرباء">كهرباء</option>
                <option value="رواتب">رواتب</option>
                <option value="صيانة">صيانة</option>
                <option value="مشتريات">مشتريات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addExpense} disabled={isSaving} className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {isSaving ? 'جاري الحفظ...' : (editingExpenseId ? 'تحديث' : 'حفظ')}
              </button>
              <button onClick={() => { setShowAdd(false); setEditingExpenseId(null); setFormData({}); }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-right">التاريخ</th>
                <th className="p-4 text-right">البيان</th>
                <th className="p-4 text-right">الفئة</th>
                <th className="p-4 text-right">المبلغ</th>
                <th className="p-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {((data.expenses || []).slice().reverse().filter(e => !searchTerm || (e.description||'').toLowerCase().includes(searchTerm.toLowerCase()) || (e.category||'').toLowerCase().includes(searchTerm.toLowerCase()))).map(expense => (
                <tr key={expense._id || expense.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{new Date(expense.date).toLocaleDateString('ar')}</td>
                  <td className="p-4">{expense.description}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                      {expense.category}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-red-600">{expense.amount} ₪</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                          // load expense into form for editing
                          setFormData({ description: expense.description, amount: String(expense.amount), category: expense.category });
                          setEditingExpenseId(expense._id || expense.id);
                          setShowAdd(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-full hover:bg-indigo-50 transition"
                        title="تعديل المصروف"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  export default Expenses;