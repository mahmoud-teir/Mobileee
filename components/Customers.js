'use client';
// إضافة مكونات جديدة للعملاء والموردين
import React, { useState } from 'react';
import { Users, Plus, Search, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';

const Customers = ({ data, saveData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    customerId: null,
    customerName: ''
  });

  const addCustomer = async () => {
    // التحقق من الحقول المطلوبة
    if (!formData.name?.trim()) {
      toast.error('الرجاء إدخال اسم العميل');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('الرجاء إدخال رقم الهاتف');
      return;
    }

    try {
      const newCustomer = {
        id: Date.now(),
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        totalPurchases: 0,
        lastPurchase: new Date().toISOString()
      };
      await saveData('customers', [...data.customers, newCustomer]);
      setShowAdd(false);
      setFormData({});
      toast.success('تم إضافة العميل بنجاح!');
    } catch (error) {
      console.error('خطأ في إضافة العميل:', error);
      toast.error('حدث خطأ أثناء إضافة العميل');
    }
  };

  // دالة لبدء عملية الحذف (تفتح مودال التأكيد)
  const handleDeleteCustomer = (customer) => {
    setDeleteConfirmation({
      isOpen: true,
      customerId: customer._id || customer.id,
      customerName: customer.name
    });
  };

  // دالة تأكيد الحذف الفعلي
  const confirmDelete = async () => {
    try {
      if (deleteConfirmation.customerId) {
        await saveData('customers', data.customers.filter(c => (c._id || c.id) !== deleteConfirmation.customerId));
        setDeleteConfirmation({ isOpen: false, customerId: null, customerName: '' });
        toast.success('تم حذف العميل بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف العميل:', error);
      toast.error('حدث خطأ أثناء حذف العميل');
    }
  };

  // البحث والفرز
  const filteredCustomers = (data.customers || [])
    .filter(customer => 
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold">إدارة العملاء</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="ابحث عن عميل..."
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
            عميل جديد
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">إضافة عميل جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم العميل"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="border p-2 rounded"
              required
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="border p-2 rounded"
              required
            />
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="العنوان"
              value={formData.address || ''}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="border p-2 rounded"
            />
            <textarea
              placeholder="ملاحظات"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="border p-2 rounded md:col-span-2"
              rows="3"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addCustomer} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition flex-1">
              حفظ العميل
            </button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition flex-1">
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <tr>
              <th className="p-4 text-right cursor-pointer" onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>
                الاسم {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 text-right">الهاتف</th>
              <th className="p-4 text-right">البريد الإلكتروني</th>
              <th className="p-4 text-right">إجمالي المشتريات</th>
              <th className="p-4 text-right">آخر عملية</th>
              <th className="p-4 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(filteredCustomers || []).map(customer => (
              <tr key={customer._id || customer.id} className="border-b hover:bg-blue-50 transition-colors">
                <td className="p-4 font-bold">{customer.name}</td>
                <td className="p-4">{customer.phone}</td>
                <td className="p-4 text-blue-600">{customer.email || '-'}</td>
                <td className="p-4 text-green-600 font-bold">{customer.totalPurchases?.toFixed(2) || '0.00'} ₪</td>
                <td className="p-4">
                  {customer.lastPurchase ?
                    new Date(customer.lastPurchase).toLocaleDateString('ar') :
                    '-'}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-blue-500 hover:text-blue-700">
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(filteredCustomers || []).length === 0 && (
          <div className="p-8 text-center text-gray-500">
            لم يتم العثور على عملاء. أضف عميلاً جديداً لبدء الإدارة
          </div>
        )}
      </div>

      {/* مودال التأكيد للحذف */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, customerId: null, customerName: '' })}
        onConfirm={confirmDelete}
        title="تأكيد حذف العميل"
        message={`هل أنت متأكد من حذف العميل "${deleteConfirmation.customerName}"؟ سيتم حذف جميع السجلات المرتبطة بهذا العميل نهائياً.`}
        confirmText="حذف"
        cancelText="إلغاء"
        iconType="delete"
      />
    </div>
  );
};

export default Customers;