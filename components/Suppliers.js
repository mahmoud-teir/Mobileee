'use client';
import React, { useState } from 'react';
import { 
  Truck, Plus, Search, Trash2, FileText, 
  Package, Wrench, DollarSign, TrendingUp, AlertCircle, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';

const Suppliers = ({ data, saveData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    supplierId: null,
    supplierName: ''
  });

  // دالة إضافة مورد
  const addSupplier = async () => {
    // التحقق من البيانات الإلزامية أولاً
    if (!formData.name?.trim()) {
      toast.error('الرجاء إدخال اسم المورد');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف');
      return;
    }

    try {
      const newSupplier = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        products: formData.products?.trim() || '',
        notes: formData.notes?.trim() || ''
      };

      // إضافة المورد الجديد
      const updatedSuppliers = [...(data.suppliers || []), newSupplier];
      
      // حفظ البيانات
      await saveData('suppliers', updatedSuppliers);
      
      // إعادة تعيين النماذج
      setShowAdd(false);
      setFormData({});
      
      toast.success('تمت إضافة المورد بنجاح!');
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      toast.error('حدث خطأ أثناء إضافة المورد. الرجاء المحاولة مرة أخرى.');
    }
  };

  // دالة حذف مورد
  const handleDeleteSupplier = (supplier) => {
    setDeleteConfirmation({
      isOpen: true,
      supplierId: supplier._id || supplier.id,
      supplierName: supplier.name
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirmation.supplierId) {
        const updatedSuppliers = data.suppliers.filter(s => (s._id || s.id) !== deleteConfirmation.supplierId);
        await saveData('suppliers', updatedSuppliers);
        setDeleteConfirmation({ isOpen: false, supplierId: null, supplierName: '' });
        toast.success('تم حذف المورد بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف المورد:', error);
      toast.error('حدث خطأ أثناء حذف المورد. الرجاء المحاولة مرة أخرى.');
    }
  };

  // البحث عن الموردين
  const filteredSuppliers = (data.suppliers || []).filter(supplier => 
    (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.phone || '').includes(searchTerm) ||
    (supplier.products && supplier.products.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold">إدارة الموردين</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="ابحث عن مورد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-full pl-10"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 min-w-[180px]"
          >
            <Plus className="w-5 h-5" />
            مورد جديد
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">إضافة مورد جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم المورد"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="المنتجات الموردة"
              value={formData.products || ''}
              onChange={e => setFormData({...formData, products: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="ملاحظات"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="border p-2 rounded md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addSupplier} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition flex-1">
              حفظ المورد
            </button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition flex-1">
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <tr>
              <th className="p-4 text-right">اسم المورد</th>
              <th className="p-4 text-right">المنتجات</th>
              <th className="p-4 text-right">الهاتف</th>
              <th className="p-4 text-right">البريد الإلكتروني</th>
              <th className="p-4 text-right">التاريخ</th>
              <th className="p-4 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(filteredSuppliers || []).length > 0 ? (
              filteredSuppliers.map(supplier => (
                <tr key={supplier._id || supplier.id} className="border-b hover:bg-purple-50 transition-colors">
                  <td className="p-4 font-bold">{supplier.name}</td>
                  <td className="p-4 max-w-xs truncate">{supplier.products}</td>
                  <td className="p-4">{supplier.phone}</td>
                  <td className="p-4 text-blue-600 truncate">{supplier.email || '-'}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(supplier.created_at).toLocaleDateString('ar')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-purple-500 hover:text-purple-700">
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  لم يتم العثور على موردين. أضف مورداً جديداً لبدء الإدارة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* مودال التأكيد */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, supplierId: null, supplierName: '' })}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف المورد "${deleteConfirmation.supplierName}"؟ لن تتمكن من استعادة هذه البيانات.`}
        confirmText="حذف"
        cancelText="إلغاء"
        iconType="delete"
      />
    </div>
  );
};

export default Suppliers;