'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Trash2, Search as SearchIcon, FileText, X, AlertCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const Returns = ({ data, saveData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    saleId: '',
    reason: '',
    refundType: 'full', // 'full', 'partial', 'exchange'
    refundAmount: '',
    notes: ''
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    returnId: null
  });
  const [error, setError] = useState('');

  // أسباب الإرجاع
  const returnReasons = [
    'منتج معيب',
    'منتج خاطئ',
    'غير راضٍ عن المنتج',
    'تغيير الرأي',
    'وجد سعر أفضل',
    'تكرار الطلب',
    'أخرى'
  ];

  // تصفية المرتجعات
  useEffect(() => {
    const returns = data.returns || [];
    const filtered = returns.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      return (
        r.customerName?.toLowerCase().includes(searchLower) ||
        r.reason?.toLowerCase().includes(searchLower) ||
        r.items?.some(item => item.item?.toLowerCase().includes(searchLower))
      );
    });
    setFilteredReturns(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, [data.returns, searchTerm]);

  // البحث عن فاتورة
  const searchSales = (term) => {
    if (!term) return [];
    return (data.sales || []).filter(sale => {
      const searchLower = term.toLowerCase();
      const saleId = sale._id || sale.id;
      return (
        sale.customer?.toLowerCase().includes(searchLower) ||
        saleId.toString().includes(term) ||
        sale.items?.some(item => item.item?.toLowerCase().includes(searchLower))
      );
    }).slice(0, 10);
  };

  const selectSale = (sale) => {
    setSelectedSale(sale);
    setFormData({ ...formData, saleId: sale._id || sale.id });
    // تحديد كل العناصر بشكل افتراضي
    setSelectedItems(sale.items?.map(item => ({ ...item, selected: true, returnQty: item.quantity })) || []);
    setError('');
  };

  const toggleItemSelection = (index) => {
    const updated = [...selectedItems];
    updated[index].selected = !updated[index].selected;
    setSelectedItems(updated);
  };

  const updateReturnQty = (index, qty) => {
    const updated = [...selectedItems];
    const maxQty = selectedSale?.items?.[index]?.quantity || 1;
    updated[index].returnQty = Math.min(Math.max(1, parseInt(qty) || 1), maxQty);
    setSelectedItems(updated);
  };

  // حساب مبلغ الاسترداد
  const calculateRefund = () => {
    if (!selectedItems.length) return 0;
    return selectedItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + (item.returnQty * item.price), 0);
  };

  // إضافة مرتجع
  const addReturn = async () => {
    try {
      if (!selectedSale) {
        setError('الرجاء اختيار فاتورة');
        return;
      }

      const itemsToReturn = selectedItems.filter(item => item.selected);
      if (itemsToReturn.length === 0) {
        setError('الرجاء اختيار منتج واحد على الأقل للإرجاع');
        return;
      }

      if (!formData.reason) {
        setError('الرجاء اختيار سبب الإرجاع');
        return;
      }

      const refundAmount = formData.refundType === 'partial'
        ? parseFloat(formData.refundAmount) || 0
        : calculateRefund();

      const newReturn = {
        id: Date.now(),
        date: new Date().toISOString(),
        saleId: selectedSale._id || selectedSale.id,
        customerName: selectedSale.customer || 'غير معروف',
        items: itemsToReturn.map(item => ({
          id: item.id,
          item: item.item,
          itemType: item.itemType,
          quantity: item.returnQty,
          price: item.price
        })),
        originalTotal: selectedSale.total,
        refundAmount: refundAmount,
        refundType: formData.refundType,
        reason: formData.reason,
        notes: formData.notes,
        status: 'completed'
      };

      // إضافة المرتجع
      const updatedReturns = [...(data.returns || []), newReturn];
      await saveData('returns', updatedReturns);

      // إعادة الكميات للمخزون
      for (const item of itemsToReturn) {
        const qty = item.returnQty;
        if (item.itemType === 'screen') {
          const updatedScreens = (data.screens || []).map(s =>
            (s._id || s.id) === item.id ? { ...s, quantity: s.quantity + qty } : s
          );
          await saveData('screens', updatedScreens);
        } else if (item.itemType === 'phone') {
          const updatedPhones = (data.phones || []).map(p =>
            (p._id || p.id) === item.id ? { ...p, quantity: p.quantity + qty } : p
          );
          await saveData('phones', updatedPhones);
        } else if (item.itemType === 'sticker') {
          const updatedStickers = (data.stickers || []).map(st =>
            (st._id || st.id) === item.id ? { ...st, quantity: st.quantity + qty } : st
          );
          await saveData('stickers', updatedStickers);
        } else {
          const updatedAccessories = (data.accessories || []).map(a =>
            (a._id || a.id) === item.id ? { ...a, quantity: a.quantity + qty } : a
          );
          await saveData('accessories', updatedAccessories);
        }
      }

      // إعادة تعيين النموذج
      setShowAdd(false);
      setFormData({ saleId: '', reason: '', refundType: 'full', refundAmount: '', notes: '' });
      setSelectedSale(null);
      setSelectedItems([]);
      setError('');

      alert('تم تسجيل المرتجع بنجاح وتم إعادة الكميات للمخزون!');
    } catch (error) {
      console.error('خطأ في تسجيل المرتجع:', error);
      alert('حدث خطأ أثناء تسجيل المرتجع');
    }
  };

  // حذف مرتجع
  const handleDeleteReturn = (ret) => {
    setDeleteConfirmation({ isOpen: true, returnId: ret._id || ret.id });
  };

  const confirmDelete = async () => {
    try {
      const returnToDelete = (data.returns || []).find(r => (r._id || r.id) === deleteConfirmation.returnId);

      if (returnToDelete) {
        // خصم الكميات من المخزون (عكس عملية الإرجاع)
        for (const item of returnToDelete.items || []) {
          const qty = item.quantity;
          if (item.itemType === 'screen') {
            const updatedScreens = (data.screens || []).map(s =>
              (s._id || s.id) === item.id ? { ...s, quantity: Math.max(0, s.quantity - qty) } : s
            );
            await saveData('screens', updatedScreens);
          } else if (item.itemType === 'phone') {
            const updatedPhones = (data.phones || []).map(p =>
              (p._id || p.id) === item.id ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p
            );
            await saveData('phones', updatedPhones);
          } else if (item.itemType === 'sticker') {
            const updatedStickers = (data.stickers || []).map(st =>
              (st._id || st.id) === item.id ? { ...st, quantity: Math.max(0, st.quantity - qty) } : st
            );
            await saveData('stickers', updatedStickers);
          } else {
            const updatedAccessories = (data.accessories || []).map(a =>
              (a._id || a.id) === item.id ? { ...a, quantity: Math.max(0, a.quantity - qty) } : a
            );
            await saveData('accessories', updatedAccessories);
          }
        }
      }

      const updatedReturns = (data.returns || []).filter(r => (r._id || r.id) !== deleteConfirmation.returnId);
      await saveData('returns', updatedReturns);

      setDeleteConfirmation({ isOpen: false, returnId: null });
      alert('تم حذف المرتجع بنجاح!');
    } catch (error) {
      console.error('خطأ في حذف المرتجع:', error);
      alert('حدث خطأ أثناء حذف المرتجع');
    }
  };

  const totalReturns = (data.returns || []).reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <RotateCcw className="w-8 h-8 text-orange-500" />
          المرتجعات
        </h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-orange-500 text-white px-6 py-3 rounded-lg">
            <p className="text-sm">إجمالي المرتجعات</p>
            <p className="text-2xl font-bold">{totalReturns.toFixed(2)} ₪</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" />
            تسجيل مرتجع
          </button>
        </div>
      </div>

      {/* نموذج إضافة مرتجع */}
      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <RotateCcw className="text-orange-500" />
              تسجيل مرتجع جديد
            </h3>
            <button onClick={() => {
              setShowAdd(false);
              setSelectedSale(null);
              setSelectedItems([]);
              setError('');
            }} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* البحث عن فاتورة */}
            {!selectedSale ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البحث عن فاتورة البيع
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث برقم الفاتورة أو اسم العميل أو المنتج..."
                    onChange={(e) => setFormData({ ...formData, saleId: e.target.value })}
                    className="w-full border p-3 rounded-lg pl-10"
                  />
                  <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>

                {formData.saleId && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                    {searchSales(formData.saleId).map(sale => (
                      <div
                        key={sale._id || sale.id}
                        onClick={() => selectSale(sale)}
                        className="p-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">فاتورة #{sale._id || sale.id}</span>
                          <span className="text-orange-600 font-bold">{sale.total?.toFixed(2)} ₪</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.customer || 'غير معروف'} - {new Date(sale.date).toLocaleDateString('ar')}
                        </div>
                        <div className="text-sm text-gray-400">
                          {sale.items?.map(i => i.item).join(', ')}
                        </div>
                      </div>
                    ))}
                    {searchSales(formData.saleId).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        لم يتم العثور على فواتير
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* الفاتورة المختارة */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-orange-800">فاتورة #{selectedSale._id || selectedSale.id}</h4>
                      <p className="text-sm text-gray-600">{selectedSale.customer || 'غير معروف'}</p>
                      <p className="text-sm text-gray-500">{new Date(selectedSale.date).toLocaleDateString('ar')}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSale(null);
                        setSelectedItems([]);
                      }}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      تغيير
                    </button>
                  </div>
                </div>

                {/* اختيار المنتجات للإرجاع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر المنتجات للإرجاع
                  </label>
                  <div className="space-y-2">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${item.selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItemSelection(index)}
                            className="w-5 h-5 text-orange-600 rounded"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{item.item}</span>
                            <span className="text-sm text-gray-500 mr-2">
                              ({item.price?.toFixed(2)} ₪)
                            </span>
                          </div>
                          {item.selected && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">الكمية:</label>
                              <input
                                type="number"
                                min="1"
                                max={selectedSale?.items?.[index]?.quantity || 1}
                                value={item.returnQty}
                                onChange={(e) => updateReturnQty(index, e.target.value)}
                                className="w-20 border p-1 rounded text-center"
                              />
                              <span className="text-sm text-gray-500">
                                / {selectedSale?.items?.[index]?.quantity || 1}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* سبب الإرجاع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سبب الإرجاع
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  >
                    <option value="">اختر السبب...</option>
                    {returnReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                {/* نوع الاسترداد */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الاسترداد
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="full"
                        checked={formData.refundType === 'full'}
                        onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
                      />
                      استرداد كامل
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="partial"
                        checked={formData.refundType === 'partial'}
                        onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
                      />
                      استرداد جزئي
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="exchange"
                        checked={formData.refundType === 'exchange'}
                        onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
                      />
                      استبدال
                    </label>
                  </div>
                </div>

                {/* مبلغ الاسترداد الجزئي */}
                {formData.refundType === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مبلغ الاسترداد
                    </label>
                    <input
                      type="number"
                      value={formData.refundAmount}
                      onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                      placeholder="أدخل المبلغ..."
                      className="w-full border p-3 rounded-lg"
                      max={calculateRefund()}
                    />
                  </div>
                )}

                {/* ملاحظات */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية..."
                    className="w-full border p-3 rounded-lg"
                    rows="2"
                  />
                </div>

                {/* ملخص الاسترداد */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="font-bold text-orange-800 mb-2">ملخص المرتجع</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>عدد المنتجات:</span>
                      <span className="font-medium">
                        {selectedItems.filter(i => i.selected).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الكميات:</span>
                      <span className="font-medium">
                        {selectedItems.filter(i => i.selected).reduce((s, i) => s + i.returnQty, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-orange-200">
                      <span>مبلغ الاسترداد:</span>
                      <span className="text-orange-600">
                        {formData.refundType === 'partial'
                          ? (parseFloat(formData.refundAmount) || 0).toFixed(2)
                          : calculateRefund().toFixed(2)} ₪
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                {/* أزرار */}
                <div className="flex gap-3">
                  <button
                    onClick={addReturn}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-amber-600"
                  >
                    تأكيد المرتجع
                  </button>
                  <button
                    onClick={() => {
                      setShowAdd(false);
                      setSelectedSale(null);
                      setSelectedItems([]);
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* شريط البحث */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="بحث في المرتجعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border p-3 rounded-lg pl-10"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* جدول المرتجعات */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-right">التاريخ</th>
              <th className="p-4 text-right">رقم الفاتورة</th>
              <th className="p-4 text-right">العميل</th>
              <th className="p-4 text-right">المنتجات</th>
              <th className="p-4 text-right">السبب</th>
              <th className="p-4 text-right">نوع الاسترداد</th>
              <th className="p-4 text-right">المبلغ</th>
              <th className="p-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length > 0 ? (
              filteredReturns.map(ret => (
                <tr key={ret._id || ret.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-sm">
                    {new Date(ret.date).toLocaleDateString('ar', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 font-medium">#{ret.saleId}</td>
                  <td className="p-4">{ret.customerName}</td>
                  <td className="p-4">
                    <div className="text-sm">
                      {ret.items?.map((item, i) => (
                        <div key={i}>
                          {item.item} ({item.quantity})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm">
                      {ret.reason}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      ret.refundType === 'full' ? 'bg-green-100 text-green-700' :
                      ret.refundType === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {ret.refundType === 'full' ? 'كامل' :
                       ret.refundType === 'partial' ? 'جزئي' : 'استبدال'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-orange-600">
                    {ret.refundAmount?.toFixed(2)} ₪
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteReturn(ret)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full"
                      title="حذف المرتجع"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <RotateCcw className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-xl font-medium">لا توجد مرتجعات</p>
                    <p className="text-sm">سجل أول عملية مرتجع</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, returnId: null })}
        onConfirm={confirmDelete}
        title="تأكيد حذف المرتجع"
        message="هل أنت متأكد من حذف هذا المرتجع؟ سيتم خصم الكميات من المخزون."
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default Returns;
