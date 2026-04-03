'use client';
import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Trash2, Search as SearchIcon,
  Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, X
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const Installments = ({ data, saveData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    totalAmount: '',
    downPayment: '',
    numberOfInstallments: '3',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInstallments, setFilteredInstallments] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    installmentId: null
  });
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    installmentId: null,
    paymentIndex: null
  });
  const [viewDetails, setViewDetails] = useState(null);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // تصفية الأقساط
  useEffect(() => {
    const installments = data.installments || [];
    const filtered = installments.filter(inst => {
      const searchLower = searchTerm.toLowerCase();
      return (
        inst.customerName?.toLowerCase().includes(searchLower) ||
        inst.phone?.includes(searchTerm)
      );
    });
    setFilteredInstallments(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [data.installments, searchTerm]);

  // البحث عن منتجات
  const searchProducts = (term) => {
    if (!term) return [];
    const allProducts = [
      ...(data.screens || []).map(s => ({ ...s, name: s.model, type: 'screen' })),
      ...(data.phones || []).map(p => ({ ...p, name: p.model || p.name, type: 'phone' })),
      ...(data.stickers || []).map(st => ({ ...st, type: 'sticker' })),
      ...(data.accessories || []).map(a => ({ ...a, type: 'accessory' }))
    ];
    return allProducts.filter(p =>
      p.name?.toLowerCase().includes(term.toLowerCase()) && p.quantity > 0
    ).slice(0, 10);
  };

  const addProduct = (product) => {
    const productId = product._id || product.id;
    const exists = selectedItems.find(i => (i._id || i.id) === productId && i.type === product.type);
    if (exists) {
      setSelectedItems(selectedItems.map(i =>
        (i._id || i.id) === productId && i.type === product.type
          ? { ...i, quantity: Math.min(i.quantity + 1, product.quantity) }
          : i
      ));
    } else {
      setSelectedItems([...selectedItems, { ...product, id: productId, quantity: 1 }]);
    }
    setProductSearch('');
  };

  const removeProduct = (id, type) => {
    setSelectedItems(selectedItems.filter(i => !((i._id || i.id) === id && i.type === type)));
  };

  const updateProductQty = (id, type, qty) => {
    setSelectedItems(selectedItems.map(i => {
      if ((i._id || i.id) === id && i.type === type) {
        const collectionKey = i.type === 'accessory' ? 'accessories' : i.type + 's';
        const maxQty = (data[collectionKey] || [])
          .find(p => (p._id || p.id) === id)?.quantity || 1;
        return { ...i, quantity: Math.min(Math.max(1, qty), maxQty) };
      }
      return i;
    }));
  };

  // حساب المجموع
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // توليد جدول الأقساط
  const generatePaymentSchedule = (total, downPayment, numberOfInstallments, startDate) => {
    const remaining = total - downPayment;
    const installmentAmount = remaining / numberOfInstallments;
    const schedule = [];

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      schedule.push({
        number: i + 1,
        amount: Math.round(installmentAmount * 100) / 100,
        dueDate: dueDate.toISOString(),
        paid: false,
        paidDate: null
      });
    }

    return schedule;
  };

  // إضافة قسط جديد
  const addInstallment = async () => {
    try {
      if (!formData.customerName.trim()) {
        setError('الرجاء إدخال اسم العميل');
        return;
      }
      if (!formData.phone.trim()) {
        setError('الرجاء إدخال رقم الهاتف');
        return;
      }
      if (selectedItems.length === 0) {
        setError('الرجاء إضافة منتج واحد على الأقل');
        return;
      }

      const totalAmount = calculateTotal();
      const downPayment = parseFloat(formData.downPayment) || 0;
      const numberOfInstallments = parseInt(formData.numberOfInstallments) || 3;

      if (downPayment >= totalAmount) {
        setError('الدفعة الأولى يجب أن تكون أقل من المبلغ الإجمالي');
        return;
      }

      const paymentSchedule = generatePaymentSchedule(
        totalAmount,
        downPayment,
        numberOfInstallments,
        formData.startDate
      );

      const newInstallment = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        items: selectedItems.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        downPayment,
        remainingAmount: totalAmount - downPayment,
        numberOfInstallments,
        paymentSchedule,
        notes: formData.notes,
        status: 'active' // active, completed, overdue
      };

      // حفظ القسط
      const updatedInstallments = [...(data.installments || []), newInstallment];
      await saveData('installments', updatedInstallments);

      // خصم الكميات من المخزون
      for (const item of selectedItems) {
        const itemId = item._id || item.id;
        if (item.type === 'screen') {
          const updated = (data.screens || []).map(s =>
            (s._id || s.id) === itemId ? { ...s, quantity: s.quantity - item.quantity } : s
          );
          await saveData('screens', updated);
        } else if (item.type === 'phone') {
          const updated = (data.phones || []).map(p =>
            (p._id || p.id) === itemId ? { ...p, quantity: p.quantity - item.quantity } : p
          );
          await saveData('phones', updated);
        } else if (item.type === 'sticker') {
          const updated = (data.stickers || []).map(st =>
            (st._id || st.id) === itemId ? { ...st, quantity: st.quantity - item.quantity } : st
          );
          await saveData('stickers', updated);
        } else {
          const updated = (data.accessories || []).map(a =>
            (a._id || a.id) === itemId ? { ...a, quantity: a.quantity - item.quantity } : a
          );
          await saveData('accessories', updated);
        }
      }

      // إعادة تعيين النموذج
      setShowAdd(false);
      setFormData({
        customerName: '',
        phone: '',
        totalAmount: '',
        downPayment: '',
        numberOfInstallments: '3',
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setSelectedItems([]);
      setError('');

      alert('تم تسجيل القسط بنجاح!');
    } catch (error) {
      console.error('خطأ في تسجيل القسط:', error);
      alert('حدث خطأ أثناء تسجيل القسط');
    }
  };

  // تسديد قسط
  const payInstallment = async () => {
    try {
      const { installmentId, paymentIndex } = paymentModal;
      const installment = (data.installments || []).find(i => (i._id || i.id) === installmentId);

      if (!installment) return;

      const updatedSchedule = [...installment.paymentSchedule];
      updatedSchedule[paymentIndex] = {
        ...updatedSchedule[paymentIndex],
        paid: true,
        paidDate: new Date().toISOString()
      };

      const paidAmount = updatedSchedule.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
      const remaining = installment.totalAmount - installment.downPayment - paidAmount;
      const allPaid = updatedSchedule.every(p => p.paid);

      const updatedInstallment = {
        ...installment,
        paymentSchedule: updatedSchedule,
        remainingAmount: remaining,
        status: allPaid ? 'completed' : installment.status
      };

      const updatedInstallments = (data.installments || []).map(i =>
        (i._id || i.id) === installmentId ? updatedInstallment : i
      );

      await saveData('installments', updatedInstallments);
      setPaymentModal({ isOpen: false, installmentId: null, paymentIndex: null });

      alert('تم تسديد القسط بنجاح!');
    } catch (error) {
      console.error('خطأ في تسديد القسط:', error);
      alert('حدث خطأ أثناء تسديد القسط');
    }
  };

  // حذف قسط
  const handleDeleteInstallment = (inst) => {
    setDeleteConfirmation({ isOpen: true, installmentId: inst._id || inst.id });
  };

  const confirmDelete = async () => {
    try {
      const installmentToDelete = (data.installments || []).find(i => (i._id || i.id) === deleteConfirmation.installmentId);

      if (installmentToDelete) {
        // إعادة الكميات للمخزون
        for (const item of installmentToDelete.items || []) {
          const itemId = item._id || item.id;
          if (item.type === 'screen') {
            const updated = (data.screens || []).map(s =>
              (s._id || s.id) === itemId ? { ...s, quantity: s.quantity + item.quantity } : s
            );
            await saveData('screens', updated);
          } else if (item.type === 'phone') {
            const updated = (data.phones || []).map(p =>
              (p._id || p.id) === itemId ? { ...p, quantity: p.quantity + item.quantity } : p
            );
            await saveData('phones', updated);
          } else if (item.type === 'sticker') {
            const updated = (data.stickers || []).map(st =>
              (st._id || st.id) === itemId ? { ...st, quantity: st.quantity + item.quantity } : st
            );
            await saveData('stickers', updated);
          } else {
            const updated = (data.accessories || []).map(a =>
              (a._id || a.id) === itemId ? { ...a, quantity: a.quantity + item.quantity } : a
            );
            await saveData('accessories', updated);
          }
        }
      }

      const updatedInstallments = (data.installments || []).filter(i => (i._id || i.id) !== deleteConfirmation.installmentId);
      await saveData('installments', updatedInstallments);

      setDeleteConfirmation({ isOpen: false, installmentId: null });
      alert('تم حذف القسط بنجاح وتم إعادة الكميات للمخزون!');
    } catch (error) {
      console.error('خطأ في حذف القسط:', error);
      alert('حدث خطأ أثناء حذف القسط');
    }
  };

  // حساب الأقساط المتأخرة
  const getOverdueCount = () => {
    const today = new Date();
    return (data.installments || []).reduce((count, inst) => {
      const overdue = inst.paymentSchedule?.filter(p =>
        !p.paid && new Date(p.dueDate) < today
      ).length || 0;
      return count + overdue;
    }, 0);
  };

  // حساب إجمالي المبالغ المتبقية
  const getTotalRemaining = () => {
    return (data.installments || [])
      .filter(i => i.status !== 'completed')
      .reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-purple-500" />
          الأقساط والتقسيط
        </h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-purple-500 text-white px-6 py-3 rounded-lg">
            <p className="text-sm">المبالغ المتبقية</p>
            <p className="text-2xl font-bold">{getTotalRemaining().toFixed(2)} ₪</p>
          </div>
          {getOverdueCount() > 0 && (
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg">
              <p className="text-sm">أقساط متأخرة</p>
              <p className="text-2xl font-bold">{getOverdueCount()}</p>
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            بيع بالتقسيط
          </button>
        </div>
      </div>

      {/* نموذج إضافة قسط */}
      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="text-purple-500" />
              بيع بالتقسيط
            </h3>
            <button onClick={() => {
              setShowAdd(false);
              setSelectedItems([]);
              setError('');
            }} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* معلومات العميل */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-700 border-b pb-2">معلومات العميل</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  placeholder="أدخل اسم العميل..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  placeholder="أدخل رقم الهاتف..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الدفعة الأولى (₪)
                </label>
                <input
                  type="number"
                  value={formData.downPayment}
                  onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عدد الأقساط
                  </label>
                  <select
                    value={formData.numberOfInstallments}
                    onChange={(e) => setFormData({ ...formData, numberOfInstallments: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  >
                    {[2, 3, 4, 6, 9, 12, 18, 24].map(n => (
                      <option key={n} value={n}>{n} أقساط</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  rows="2"
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>

            {/* المنتجات */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-700 border-b pb-2">المنتجات</h4>

              {/* بحث عن منتج */}
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full border p-3 rounded-lg pl-10"
                  placeholder="ابحث عن منتج لإضافته..."
                />
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />

                {productSearch && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {searchProducts(productSearch).map(product => (
                      <div
                        key={`${product.type}-${product.id}`}
                        onClick={() => addProduct(product)}
                        className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-purple-600 font-bold">{product.price?.toFixed(2)} ₪</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.type === 'screen' ? 'شاشة' :
                           product.type === 'phone' ? 'جوال' :
                           product.type === 'sticker' ? 'ملصق' : 'إكسسوار'} -
                          متوفر: {product.quantity}
                        </div>
                      </div>
                    ))}
                    {searchProducts(productSearch).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        لم يتم العثور على منتجات
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* المنتجات المختارة */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-500 mr-2">
                        ({item.price?.toFixed(2)} ₪)
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={item.maxQty || 99}
                      value={item.quantity}
                      onChange={(e) => updateProductQty(item.id, item.type, parseInt(e.target.value) || 1)}
                      className="w-20 border p-2 rounded text-center"
                    />
                    <button
                      onClick={() => removeProduct(item.id, item.type)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {selectedItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لم تتم إضافة منتجات بعد
                  </div>
                )}
              </div>

              {/* ملخص */}
              {selectedItems.length > 0 && (
                <div className="bg-purple-600 text-white p-4 rounded-xl">
                  <h4 className="font-bold mb-3">ملخص التقسيط</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-100">إجمالي المبلغ:</span>
                      <span className="font-bold text-white">{calculateTotal().toFixed(2)} ₪</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-100">الدفعة الأولى:</span>
                      <span className="font-medium text-white">{(parseFloat(formData.downPayment) || 0).toFixed(2)} ₪</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-100">المبلغ المتبقي:</span>
                      <span className="font-medium text-white">
                        {(calculateTotal() - (parseFloat(formData.downPayment) || 0)).toFixed(2)} ₪
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-purple-400 pt-2 mt-2">
                      <span className="text-purple-100">قيمة القسط الشهري:</span>
                      <span className="font-bold text-yellow-300 text-lg">
                        {((calculateTotal() - (parseFloat(formData.downPayment) || 0)) /
                          (parseInt(formData.numberOfInstallments) || 3)).toFixed(2)} ₪
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={addInstallment}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:from-purple-600 hover:to-indigo-600"
            >
              تأكيد البيع بالتقسيط
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setSelectedItems([]);
                setError('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* شريط البحث */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border p-3 rounded-lg pl-10"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* جدول الأقساط */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-right">التاريخ</th>
              <th className="p-4 text-right">العميل</th>
              <th className="p-4 text-right">الهاتف</th>
              <th className="p-4 text-right">المبلغ الكلي</th>
              <th className="p-4 text-right">الدفعة الأولى</th>
              <th className="p-4 text-right">المتبقي</th>
              <th className="p-4 text-right">الأقساط</th>
              <th className="p-4 text-right">الحالة</th>
              <th className="p-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstallments.length > 0 ? (
              filteredInstallments.map(inst => {
                const paidCount = inst.paymentSchedule?.filter(p => p.paid).length || 0;
                const totalCount = inst.paymentSchedule?.length || 0;
                const hasOverdue = inst.paymentSchedule?.some(p =>
                  !p.paid && new Date(p.dueDate) < new Date()
                );

                return (
                  <tr key={inst._id || inst.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      {new Date(inst.createdAt).toLocaleDateString('ar')}
                    </td>
                    <td className="p-4 font-medium">{inst.customerName}</td>
                    <td className="p-4">{inst.phone}</td>
                    <td className="p-4 font-bold">{inst.totalAmount?.toFixed(2)} ₪</td>
                    <td className="p-4">{inst.downPayment?.toFixed(2)} ₪</td>
                    <td className="p-4 font-bold text-purple-600">
                      {inst.remainingAmount?.toFixed(2)} ₪
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(paidCount / totalCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{paidCount}/{totalCount}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {inst.status === 'completed' ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                          <CheckCircle className="w-4 h-4" />
                          مكتمل
                        </span>
                      ) : hasOverdue ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-4 h-4" />
                          متأخر
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                          <Clock className="w-4 h-4" />
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewDetails(inst)}
                          className="text-purple-500 hover:text-purple-700 p-2 hover:bg-purple-50 rounded-full"
                          title="عرض التفاصيل"
                        >
                          <Calendar className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInstallment(inst)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-xl font-medium">لا توجد عمليات تقسيط</p>
                    <p className="text-sm">سجل أول عملية بيع بالتقسيط</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* مودال تفاصيل القسط */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold">تفاصيل التقسيط</h3>
              <button onClick={() => setViewDetails(null)} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* معلومات العميل */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">العميل</span>
                  <p className="font-bold text-lg">{viewDetails.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">الهاتف</span>
                  <p className="font-bold text-lg">{viewDetails.phone}</p>
                </div>
              </div>

              {/* المنتجات */}
              <div>
                <h4 className="font-bold text-gray-700 mb-2">المنتجات</h4>
                <div className="space-y-2">
                  {viewDetails.items?.map((item, i) => (
                    <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)} ₪</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ملخص المبالغ */}
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-gray-500 text-sm">المبلغ الكلي</span>
                    <p className="font-bold text-lg">{viewDetails.totalAmount?.toFixed(2)} ₪</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">الدفعة الأولى</span>
                    <p className="font-bold text-lg">{viewDetails.downPayment?.toFixed(2)} ₪</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">المتبقي</span>
                    <p className="font-bold text-lg text-purple-600">{viewDetails.remainingAmount?.toFixed(2)} ₪</p>
                  </div>
                </div>
              </div>

              {/* جدول الأقساط */}
              <div>
                <h4 className="font-bold text-gray-700 mb-3">جدول السداد</h4>
                <div className="space-y-2">
                  {viewDetails.paymentSchedule?.map((payment, index) => {
                    const isOverdue = !payment.paid && new Date(payment.dueDate) < new Date();

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          payment.paid ? 'bg-green-50 border-green-200' :
                          isOverdue ? 'bg-red-50 border-red-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {payment.paid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : isOverdue ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <span className="font-medium">القسط {payment.number}</span>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.dueDate).toLocaleDateString('ar')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{payment.amount?.toFixed(2)} ₪</span>
                          {!payment.paid && (
                            <button
                              onClick={() => setPaymentModal({
                                isOpen: true,
                                installmentId: viewDetails._id || viewDetails.id,
                                paymentIndex: index
                              })}
                              className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600"
                            >
                              تسديد
                            </button>
                          )}
                          {payment.paid && payment.paidDate && (
                            <span className="text-sm text-green-600">
                              تم بتاريخ {new Date(payment.paidDate).toLocaleDateString('ar')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد الدفع */}
      <ConfirmationModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, installmentId: null, paymentIndex: null })}
        onConfirm={payInstallment}
        title="تأكيد تسديد القسط"
        message="هل تم استلام مبلغ القسط من العميل؟"
        confirmText="تأكيد الدفع"
        cancelText="إلغاء"
      />

      {/* مودال تأكيد الحذف */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, installmentId: null })}
        onConfirm={confirmDelete}
        title="تأكيد حذف التقسيط"
        message="هل أنت متأكد من حذف هذا التقسيط؟ سيتم إعادة الكميات للمخزون."
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default Installments;
