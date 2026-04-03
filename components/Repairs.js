'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, AlertCircle, Search as SearchIcon, Package, X, Edit } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const Repairs = ({ data, saveData, showInvoice }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ status: 'قيد الصيانة', paid: false, useScreen: false });
  const [editingRepairId, setEditingRepairId] = useState(null);
  const [originalRepair, setOriginalRepair] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    repairId: null,
    customerName: '',
    cost: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredScreens, setFilteredScreens] = useState([]);
  const [searchResultsVisible, setSearchResultsVisible] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);

  // البحث عن الشاشات
  useEffect(() => {
    if (!showAdd || !formData.useScreen) return;

    const screens = (data.screens || []).filter(s => s.quantity > 0);

    if (searchTerm) {
      const results = screens.filter(screen =>
        (screen.model || screen.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredScreens(results);
      setSearchResultsVisible(results.length > 0);
    } else {
      setFilteredScreens(screens);
      setSearchResultsVisible(false);
    }
  }, [searchTerm, showAdd, data.screens, formData.useScreen]);

  // اختيار شاشة
  const selectScreen = (screen) => {
    setSelectedScreen(screen);
    setFormData({
      ...formData,
      screenId: screen._id || screen.id,
      screenName: screen.model || screen.name,
      screenCost: screen.cost || 0
    });
    setSearchTerm('');
    setSearchResultsVisible(false);
  };

  // إزالة الشاشة المختارة
  const removeSelectedScreen = () => {
    setSelectedScreen(null);
    setFormData({
      ...formData,
      screenId: null,
      screenName: '',
      screenCost: 0
    });
  };

  // تعديل صيانة
  const handleEditRepair = (repair) => {
    setEditingRepairId(repair._id || repair.id);
    setOriginalRepair(repair);
    setFormData({
      customerName: repair.customerName || '',
      phone: repair.phone || '',
      device: repair.device || '',
      problem: repair.problem || '',
      cost: repair.cost || '',
      status: repair.status || 'قيد الصيانة',
      paid: repair.paid || false,
      useScreen: repair.useScreen || false,
      screenId: repair.screenId || null,
      screenName: repair.screenName || '',
      screenCost: repair.screenCost || 0,
      notes: repair.notes || ''
    });

    // إذا كانت هناك شاشة مستخدمة، نضعها في selectedScreen
    if (repair.useScreen && repair.screenId) {
      const screen = (data.screens || []).find(s => (s._id || s.id) === repair.screenId);
      if (screen) {
        setSelectedScreen(screen);
      }
    }

    setShowAdd(true);
  };

  const addRepair = async () => {
    try {
      // التحقق من الحقول المطلوبة
      if (!formData.customerName?.trim()) {
        alert('الرجاء إدخال اسم العميل');
        return;
      }
      if (!formData.device?.trim()) {
        alert('الرجاء إدخال نوع الجهاز');
        return;
      }
      if (!formData.problem?.trim()) {
        alert('الرجاء إدخال وصف المشكلة');
        return;
      }
      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        alert('الرجاء إدخال سعر الخدمة');
        return;
      }

      const serviceCost = parseFloat(formData.cost) || 0;
      const screenCost = formData.useScreen && selectedScreen ? (parseFloat(formData.screenCost) || 0) : 0;
      const totalCost = serviceCost; // سعر الخدمة فقط (سعر البيع للعميل)
      const profit = serviceCost - screenCost; // الربح = سعر الخدمة - تكلفة الشاشة

      if (editingRepairId) {
        // وضع التعديل
        const updatedRepair = {
          ...originalRepair,
          ...formData,
          cost: totalCost,
          screenCost: screenCost,
          profit: profit,
          useScreen: formData.useScreen || false,
          screenId: formData.useScreen ? formData.screenId : null,
          screenName: formData.useScreen ? formData.screenName : null
        };

        // التعامل مع تغيير الشاشة
        const oldScreenId = originalRepair?.screenId;
        const newScreenId = formData.useScreen ? formData.screenId : null;
        const oldUseScreen = originalRepair?.useScreen;
        const newUseScreen = formData.useScreen;

        // إذا كانت الشاشة القديمة مختلفة عن الجديدة، نعيد القديمة ونخصم الجديدة
        if (oldUseScreen && oldScreenId && oldScreenId !== newScreenId) {
          // إعادة الشاشة القديمة للمخزون
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === oldScreenId ? { ...s, quantity: s.quantity + 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        if (newUseScreen && newScreenId && oldScreenId !== newScreenId) {
          // خصم الشاشة الجديدة
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === newScreenId ? { ...s, quantity: s.quantity - 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        // إذا كان المستخدم ألغى استخدام الشاشة
        if (oldUseScreen && oldScreenId && !newUseScreen) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === oldScreenId ? { ...s, quantity: s.quantity + 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        // تحديث الصيانة
        const updatedRepairs = data.repairs.map(r =>
          (r._id || r.id) === editingRepairId ? updatedRepair : r
        );
        await saveData('repairs', updatedRepairs);

        setShowAdd(false);
        setFormData({ status: 'قيد الصيانة', paid: false, useScreen: false });
        setSelectedScreen(null);
        setSearchTerm('');
        setEditingRepairId(null);
        setOriginalRepair(null);
        alert('تم تحديث الصيانة بنجاح!');
      } else {
        // إضافة جديدة
        const newRepair = {
          id: Date.now(),
          date: new Date().toISOString(),
          ...formData,
          cost: totalCost,
          screenCost: screenCost,
          profit: profit,
          useScreen: formData.useScreen || false,
          screenId: formData.useScreen ? formData.screenId : null,
          screenName: formData.useScreen ? formData.screenName : null
        };

        // حفظ الصيانة
        await saveData('repairs', [...data.repairs, newRepair]);

        // خصم الشاشة من المخزون إذا تم اختيارها
        if (formData.useScreen && selectedScreen) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === (selectedScreen._id || selectedScreen.id) ? { ...s, quantity: s.quantity - 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        setShowAdd(false);
        setFormData({ status: 'قيد الصيانة', paid: false, useScreen: false });
        setSelectedScreen(null);
        setSearchTerm('');
        alert('تم إضافة الصيانة بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حفظ الصيانة:', error);
      alert('حدث خطأ أثناء حفظ الصيانة.');
    }
  };

  const updateStatus = (id, newStatus) => {
    const updated = data.repairs.map(r =>
      (r._id || r.id) === id ? { ...r, status: newStatus } : r
    );
    saveData('repairs', updated);
  };

  // حذف فاتورة صيانة
  const handleDeleteRepair = (id, customerName, cost) => {
    setDeleteConfirmation({
      isOpen: true,
      repairId: id,
      customerName: customerName,
      cost: cost
    });
  };

  const confirmDeleteRepair = async () => {
    try {
      if (deleteConfirmation.repairId) {
        const repairToDelete = data.repairs.find(r => (r._id || r.id) === deleteConfirmation.repairId);

        // إعادة الشاشة للمخزون إذا كانت مستخدمة
        if (repairToDelete && repairToDelete.useScreen && repairToDelete.screenId) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === repairToDelete.screenId ? { ...s, quantity: s.quantity + 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        // حذف عملية الصيانة
        const updatedRepairs = data.repairs.filter(r => (r._id || r.id) !== deleteConfirmation.repairId);
        await saveData('repairs', updatedRepairs);

        setDeleteConfirmation({ isOpen: false, repairId: null, customerName: '', cost: 0 });
        alert('تم حذف فاتورة الصيانة بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف فاتورة الصيانة:', error);
      alert('حدث خطأ أثناء حذف فاتورة الصيانة. الرجاء المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">إدارة الصيانة</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
          صيانة جديدة
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">{editingRepairId ? 'تعديل بيانات الصيانة' : 'استقبال جهاز للصيانة'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم العميل"
              value={formData.customerName || ''}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="رقم الهاتف"
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="نوع الجهاز"
              value={formData.device || ''}
              onChange={e => setFormData({...formData, device: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="المشكلة"
              value={formData.problem || ''}
              onChange={e => setFormData({...formData, problem: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />

            {/* خيار استخدام شاشة من المخزون */}
            <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useScreen || false}
                  onChange={e => {
                    setFormData({...formData, useScreen: e.target.checked, screenId: null, screenName: '', screenCost: 0});
                    setSelectedScreen(null);
                    setSearchTerm('');
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-blue-800">استخدام شاشة من المخزون</span>
              </label>

              {formData.useScreen && (
                <div className="mt-4 space-y-3">
                  {/* البحث عن شاشة */}
                  {!selectedScreen && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ابحث عن شاشة..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSearchResultsVisible(true);
                        }}
                        onFocus={() => setSearchResultsVisible(true)}
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />

                      {/* قائمة الشاشات */}
                      {searchResultsVisible && filteredScreens.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
                          {filteredScreens.map(screen => (
                            <div
                              key={screen._id || screen.id}
                              onClick={() => selectScreen(screen)}
                              className="p-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{screen.model || screen.name}</p>
                                  <p className="text-sm text-gray-500">الكمية: {screen.quantity}</p>
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-blue-600">{(screen.cost || 0).toFixed(2)} ₪</p>
                                  <p className="text-xs text-gray-500">سعر التكلفة</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* الشاشة المختارة */}
                  {selectedScreen && (
                    <div className="p-3 bg-white rounded-lg border border-blue-300 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-blue-500" />
                        <div>
                          <p className="font-bold text-blue-800">{selectedScreen.model || selectedScreen.name}</p>
                          <p className="text-sm text-gray-600">الكمية المتوفرة: {selectedScreen.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <input
                            type="number"
                            value={formData.screenCost || ''}
                            onChange={e => setFormData({...formData, screenCost: e.target.value})}
                            className="w-24 border p-1 rounded text-center font-bold"
                            step="0.01"
                            min="0"
                          />
                          <p className="text-xs text-gray-500 text-center">سعر التكلفة</p>
                        </div>
                        <button
                          onClick={removeSelectedScreen}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="سعر الخدمة (للعميل)"
              value={formData.cost || ''}
              onChange={e => setFormData({...formData, cost: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="0.01"
              required
            />
            <select
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="قيد الصيانة">قيد الصيانة</option>
              <option value="في الانتظار">في الانتظار</option>
              <option value="جاهز">جاهز</option>
              <option value="تم التسليم">تم التسليم</option>
            </select>

            {/* ملخص الربح */}
            {formData.cost && (
              <div className="md:col-span-2 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 mb-2">ملخص العملية</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">سعر الخدمة</p>
                    <p className="font-bold text-blue-600">{(parseFloat(formData.cost) || 0).toFixed(2)} ₪</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تكلفة الشاشة</p>
                    <p className="font-bold text-red-600">{(formData.useScreen ? (parseFloat(formData.screenCost) || 0) : 0).toFixed(2)} ₪</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">صافي الربح</p>
                    <p className="font-bold text-green-600">
                      {((parseFloat(formData.cost) || 0) - (formData.useScreen ? (parseFloat(formData.screenCost) || 0) : 0)).toFixed(2)} ₪
                    </p>
                  </div>
                </div>
              </div>
            )}

            <textarea
              placeholder="ملاحظات"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="border p-2 rounded md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={formData.paid}
                onChange={e => setFormData({...formData, paid: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">تم الدفع</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addRepair} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex-1 font-medium">
              {editingRepairId ? 'تحديث' : 'حفظ'}
            </button>
            <button onClick={() => {
              setShowAdd(false);
              setFormData({ status: 'قيد الصيانة', paid: false, useScreen: false });
              setSelectedScreen(null);
              setSearchTerm('');
              setEditingRepairId(null);
              setOriginalRepair(null);
            }} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 flex-1 font-medium">
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['قيد الصيانة', 'جاهز', 'تم التسليم'].map(status => (
          <div key={status} className="bg-white p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'قيد الصيانة' ? 'bg-yellow-500' :
                status === 'جاهز' ? 'bg-green-500' : 'bg-blue-500'
              }`} />
              {status}
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {data.repairs.filter(r => r.status === status).map(repair => (
                <div key={repair._id || repair.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors relative group">
                  {/* أزرار التعديل والحذف تظهر عند التمرير */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                    <button
                      onClick={() => handleEditRepair(repair)}
                      className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded-full hover:bg-blue-100"
                      title="تعديل الصيانة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRepair(repair._id || repair.id, repair.customerName, repair.cost)}
                      className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded-full hover:bg-red-100"
                      title="حذف الفاتورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pr-6"> {/* مساحة لزر الحذف */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{repair.customerName}</p>
                        <p className="text-sm text-blue-600 font-medium">{repair.phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        repair.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {repair.paid ? 'مدفوع' : 'غير مدفوع'}
                      </span>
                    </div>

                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-700">{repair.device}</p>
                      <p className="text-sm text-red-600 mt-1">{repair.problem}</p>
                    </div>

                    {/* عرض الشاشة المستخدمة */}
                    {repair.useScreen && repair.screenName && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-purple-700">شاشة: {repair.screenName}</span>
                        <span className="text-xs text-purple-500">({(repair.screenCost || 0).toFixed(2)} ₪)</span>
                      </div>
                    )}

                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">سعر الخدمة</p>
                        <p className="font-bold text-blue-600 text-lg">{(repair.cost || 0).toFixed(2)} ₪</p>
                        {repair.profit !== undefined && (
                          <p className="text-xs text-green-600">ربح: {(repair.profit || 0).toFixed(2)} ₪</p>
                        )}
                      </div>
                      <button
                        onClick={() => showInvoice({ type: 'repair', data: repair })}
                        className="text-blue-500 hover:text-blue-700"
                        title="عرض الفاتورة"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {status !== 'تم التسليم' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تحديث الحالة
                      </label>
                      <select
                        value={repair.status}
                        onChange={(e) => updateStatus(repair._id || repair.id, e.target.value)}
                        className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="قيد الصيانة">قيد الصيانة</option>
                        <option value="في الانتظار">في الانتظار</option>
                        <option value="جاهز">جاهز</option>
                        <option value="تم التسليم">تم التسليم</option>
                      </select>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500 text-left">
                    {new Date(repair.date).toLocaleDateString('ar', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
              {data.repairs.filter(r => r.status === status).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>لا توجد صيانات في هذه الحالة</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* مودال التأكيد للحذف */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, repairId: null, customerName: '', cost: 0 })}
        onConfirm={confirmDeleteRepair}
        title="تأكيد حذف فاتورة الصيانة"
        message={`هل أنت متأكد من حذف فاتورة صيانة العميل "${deleteConfirmation.customerName}" بمبلغ ${deleteConfirmation.cost.toFixed(2)} ₪؟ سيتم حذف جميع البيانات المتعلقة بهذه الصيانة نهائياً وإعادة الشاشة للمخزون إن وجدت.`}
        confirmText="حذف الفاتورة"
        cancelText="إلغاء"
        iconType="delete"
      />
    </div>
  );
};

export default Repairs;
