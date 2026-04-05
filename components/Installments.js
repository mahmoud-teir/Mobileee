'use client';
import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Trash2, Search as SearchIcon,
  Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, X
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Installments = ({ data, saveData }) => {
  const { t, isRTL } = useLanguage();
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
      ...(data.accessories || []).map(a => ({ ...a, type: 'accessory' })),
      ...(data.products || []).map(p => ({ ...p, type: 'product' }))
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
        let collectionKey = 'products';
        if (i.type === 'accessory') collectionKey = 'accessories';
        else if (i.type === 'screen') collectionKey = 'screens';
        else if (i.type === 'phone') collectionKey = 'phones';
        else if (i.type === 'sticker') collectionKey = 'stickers';

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
        setError(t('installments.errorNoCustomer'));
        return;
      }
      if (!formData.phone.trim()) {
        setError(t('installments.errorNoPhone'));
        return;
      }
      if (selectedItems.length === 0) {
        setError(t('installments.errorNoProducts'));
        return;
      }

      const totalAmount = calculateTotal();
      const downPayment = parseFloat(formData.downPayment) || 0;
      const numberOfInstallments = parseInt(formData.numberOfInstallments) || 3;

      if (downPayment >= totalAmount) {
        setError(t('installments.errorDownPayment'));
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
        let collectionKey = 'products';
        if (item.type === 'accessory') collectionKey = 'accessories';
        else if (item.type === 'screen') collectionKey = 'screens';
        else if (item.type === 'phone') collectionKey = 'phones';
        else if (item.type === 'sticker') collectionKey = 'stickers';

        const updated = (data[collectionKey] || []).map(p =>
          (p._id || p.id) === itemId ? { ...p, quantity: p.quantity - item.quantity } : p
        );
        await saveData(collectionKey, updated);
      }

      // إضافة عملية بيع للتقارير (اختياري، يفضل إضافتها كفاتورة بيع بنوع "تقسيط")
      const newSale = {
        id: Date.now(),
        date: new Date().toISOString(),
        customer: formData.customerName.trim(),
        items: selectedItems.map(item => ({
          id: item.id,
          item: item.name,
          itemType: item.type,
          quantity: item.quantity,
          price: item.price
        })),
        total: totalAmount,
        paymentMethod: 'installments',
        paidAmount: downPayment,
        installmentId: newInstallment.id
      };
      const updatedSales = [...(data.sales || []), newSale];
      await saveData('sales', updatedSales);

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

      toast.success(t('installments.success'));
    } catch (error) {
      console.error('Error recording installment:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء تسجيل القسط' : 'An error occurred while recording the installment');
    }
  };

  // تسديد قسط
  const handlePayment = (installmentId, paymentIndex) => {
    setPaymentModal({ isOpen: true, installmentId, paymentIndex });
  };

  const confirmPayment = async () => {
    try {
      const { installmentId, paymentIndex } = paymentModal;
      const allInstallments = data.installments || [];
      const installmentIndex = allInstallments.findIndex(i => (i._id || i.id) === installmentId);

      if (installmentIndex === -1) return;

      const installment = allInstallments[installmentIndex];
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
        remainingAmount: Math.max(0, remaining),
        status: allPaid ? 'completed' : installment.status
      };

      const updatedInstallments = [...allInstallments];
      updatedInstallments[installmentIndex] = updatedInstallment;

      await saveData('installments', updatedInstallments);

      // تحديث التفاصيل المعروضة إذا كانت مفتوحة
      if (viewDetails && (viewDetails._id || viewDetails.id) === installmentId) {
        setViewDetails(updatedInstallment);
      }

      setPaymentModal({ isOpen: false, installmentId: null, paymentIndex: null });
      toast.success(t('installments.successPayment'));
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء تسديد القسط' : 'An error occurred while paying the installment');
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
          let collectionKey = 'products';
          if (item.type === 'accessory') collectionKey = 'accessories';
          else if (item.type === 'screen') collectionKey = 'screens';
          else if (item.type === 'phone') collectionKey = 'phones';
          else if (item.type === 'sticker') collectionKey = 'stickers';

          const updated = (data[collectionKey] || []).map(p =>
            (p._id || p.id) === itemId ? { ...p, quantity: p.quantity + item.quantity } : p
          );
          await saveData(collectionKey, updated);
        }
      }

      const updatedInstallments = (data.installments || []).filter(i => (i._id || i.id) !== deleteConfirmation.installmentId);
      await saveData('installments', updatedInstallments);

      setDeleteConfirmation({ isOpen: false, installmentId: null });
      toast.success(t('installments.deleteMsg'));
    } catch (error) {
      console.error('Error deleting installment:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء حذف القسط' : 'An error occurred while deleting the installment');
    }
  };

  // حساب الأقساط المتأخرة
  const getOverdueCount = () => {
    const today = new Date();
    return (data.installments || []).reduce((count, inst) => {
      const overdue = inst.paymentSchedule?.filter(p =>
        !p.paid && new Date(p.dueDate) < today
      ).length || 0;
      return count + (inst.status !== 'completed' ? overdue : 0);
    }, 0);
  };

  // حساب إجمالي المبالغ المتبقية
  const getTotalRemaining = () => {
    return (data.installments || [])
      .filter(i => i.status !== 'completed')
      .reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-purple-500" />
          {t('installments.title')}
        </h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-purple-500 text-white px-6 py-3 rounded-lg">
            <p className="text-sm">{t('installments.remainingAmount')}</p>
            <p className="text-2xl font-bold">{getTotalRemaining().toFixed(2)} ₪</p>
          </div>
          {getOverdueCount() > 0 && (
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg">
              <p className="text-sm">{t('installments.overdueCount')}</p>
              <p className="text-2xl font-bold">{getOverdueCount()}</p>
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            {t('installments.newInstallment')}
          </button>
        </div>
      </div>

      {/* نموذج إضافة قسط */}
      {showAdd && (
        <div className={`bg-white p-6 rounded-xl shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="text-purple-500" />
              {t('installments.newInstallment')}
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
              <h4 className="font-bold text-gray-700 border-b pb-2">{t('installments.customerInfo')}</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('installments.customerName')}
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  placeholder={isRTL ? 'أدخل اسم العميل...' : 'Enter customer name...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('installments.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  placeholder={isRTL ? 'أدخل رقم الهاتف...' : 'Enter phone number...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('installments.downPayment')}
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
                    {t('installments.installmentCount')}
                  </label>
                  <select
                    value={formData.numberOfInstallments}
                    onChange={(e) => setFormData({ ...formData, numberOfInstallments: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  >
                    {[2, 3, 4, 6, 9, 12, 18, 24].map(n => (
                      <option key={n} value={n}>{n} {isRTL ? 'أقساط' : 'Installments'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('installments.startDate')}
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
                  {t('installments.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  rows="2"
                  placeholder={isRTL ? 'ملاحظات إضافية...' : 'Additional notes...'}
                />
              </div>
            </div>

            {/* المنتجات */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-700 border-b pb-2">{t('installments.products')}</h4>

              {/* بحث عن منتج */}
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={`w-full border p-3 rounded-lg ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'}`}
                  placeholder={t('installments.searchProduct')}
                />
                <SearchIcon className={`w-5 h-5 text-gray-400 absolute top-3.5 ${isRTL ? 'left-3' : 'right-3'}`} />

                {productSearch && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {searchProducts(productSearch).map(product => (
                      <div
                        key={`${product.type}-${product.id || product._id}`}
                        onClick={() => addProduct(product)}
                        className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-purple-600 font-bold">{product.price?.toFixed(2)} ₪</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.type === 'screen' ? t('inventory.screen') :
                            product.type === 'phone' ? t('inventory.phone') :
                              product.type === 'sticker' ? t('inventory.sticker') :
                                product.type === 'accessory' ? t('inventory.accessory') : t('inventory.product')} -
                          {isRTL ? 'متوفر' : 'Available'}: {product.quantity}
                        </div>
                      </div>
                    ))}
                    {searchProducts(productSearch).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        {t('installments.noProducts')}
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
                      <span className={`text-sm text-gray-500 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                        ({item.price?.toFixed(2)} ₪)
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity || 99}
                      value={item.quantity}
                      onChange={(e) => updateProductQty(item._id || item.id, item.type, parseInt(e.target.value) || 1)}
                      className="w-20 border p-2 rounded text-center"
                    />
                    <button
                      onClick={() => removeProduct(item._id || item.id, item.type)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {selectedItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {t('installments.noProductsAdded')}
                  </div>
                )}
              </div>

              {/* ملخص */}
              {selectedItems.length > 0 && (
                <div className="bg-purple-600 text-white p-4 rounded-xl">
                  <h4 className="font-bold mb-3">{t('installments.summary')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-100">{t('installments.totalAmount')}:</span>
                      <span className="font-bold text-white">{calculateTotal().toFixed(2)} ₪</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-100">{t('installments.downPayment')}:</span>
                      <span className="font-medium text-white">{(parseFloat(formData.downPayment) || 0).toFixed(2)} ₪</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-100">{t('installments.remaining')}:</span>
                      <span className="font-medium text-white">
                        {(calculateTotal() - (parseFloat(formData.downPayment) || 0)).toFixed(2)} ₪
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-purple-400 pt-2 mt-2">
                      <span className="text-purple-100">{t('installments.monthlyInstallment')}:</span>
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
              {t('installments.confirmSale')}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setSelectedItems([]);
                setError('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* شريط البحث */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="relative">
          <input
            type="text"
            placeholder={t('installments.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border p-3 rounded-lg ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'}`}
          />
          <SearchIcon className={`w-5 h-5 text-gray-400 absolute top-3.5 ${isRTL ? 'left-3' : 'right-3'}`} />
        </div>
      </div>

      {/* جدول الأقساط */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-100">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'التاريخ' : 'Date'}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'العميل' : 'Customer'}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الهاتف' : 'Phone'}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('installments.totalAmount')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('installments.downPayment')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('installments.remaining')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('installments.totalPaid')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('installments.status')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الإجراءات' : 'Actions'}</th>
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
                      {new Date(inst.createdAt).toLocaleDateString(isRTL ? 'ar' : 'en')}
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
                          {t('installments.statusCompleted')}
                        </span>
                      ) : hasOverdue ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-4 h-4" />
                          {t('installments.statusOverdue')}
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit">
                          <Clock className="w-4 h-4" />
                          {t('installments.statusActive')}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewDetails(inst)}
                          className="text-purple-500 hover:text-purple-700 p-2 hover:bg-purple-50 rounded-full"
                          title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <Calendar className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInstallment(inst)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full"
                          title={isRTL ? 'حذف' : 'Delete'}
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
                    <p className="text-xl font-medium">{isRTL ? 'لا توجد عمليات تقسيط' : 'No installments found'}</p>
                    <p className="text-sm">{isRTL ? 'سجل أول عملية بيع بالتقسيط' : 'Record your first installment sale'}</p>
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
              <h3 className="text-xl font-bold">{t('installments.details')}</h3>
              <button onClick={() => setViewDetails(null)} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-6 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              {/* معلومات العميل */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">{isRTL ? 'العميل' : 'Customer'}</span>
                  <p className="font-bold text-lg">{viewDetails.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">{isRTL ? 'الهاتف' : 'Phone'}</span>
                  <p className="font-bold text-lg">{viewDetails.phone}</p>
                </div>
              </div>

              {/* المنتجات */}
              <div>
                <h4 className="font-bold text-gray-700 mb-2">{t('installments.products')}</h4>
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
                    <span className="text-gray-500 text-sm">{t('installments.totalAmount')}</span>
                    <p className="font-bold text-lg">{viewDetails.totalAmount?.toFixed(2)} ₪</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">{t('installments.downPayment')}</span>
                    <p className="font-bold text-lg">{viewDetails.downPayment?.toFixed(2)} ₪</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">{t('installments.remaining')}</span>
                    <p className="font-bold text-lg text-purple-600">{viewDetails.remainingAmount?.toFixed(2)} ₪</p>
                  </div>
                </div>
              </div>

              {/* جدول الأقساط */}
              <div>
                <h4 className="font-bold text-gray-700 mb-3">{t('installments.paymentSchedule')}</h4>
                <div className="space-y-2">
                  {viewDetails.paymentSchedule?.map((payment, index) => {
                    const isOverdue = !payment.paid && new Date(payment.dueDate) < new Date();

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${payment.paid ? 'bg-green-50 border-green-200' :
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
                            <span className="font-medium">{t('installments.paymentNumber')} {payment.number}</span>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.dueDate).toLocaleDateString(isRTL ? 'ar' : 'en')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{payment.amount?.toFixed(2)} ₪</span>
                          {payment.paid ? (
                            <span className="text-green-600 text-sm font-medium">{t('installments.paid')}</span>
                          ) : (
                            <button
                              onClick={() => handlePayment(viewDetails._id || viewDetails.id, index)}
                              className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition"
                            >
                              {t('installments.payNow')}
                            </button>
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
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{isRTL ? 'تأكيد عملية الدفع' : 'Confirm Payment'}</h3>
            <p className="text-gray-600 mb-6">
              {isRTL ? 'هل أنت متأكد من تسجيل استلام مبلغ القسط؟' : 'Are you sure you want to record the installment payment?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmPayment}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
              >
                {isRTL ? 'تأكيد' : 'Confirm'}
              </button>
              <button
                onClick={() => setPaymentModal({ isOpen: false, installmentId: null, paymentIndex: null })}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, installmentId: null })}
        onConfirm={confirmDelete}
        title={t('installments.deleteTitle')}
        message={t('installments.deleteMsg')}
        confirmText={isRTL ? 'حذف' : 'Delete'}
        cancelText={isRTL ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};

export default Installments;
