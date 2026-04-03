'use client';
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, AlertCircle, Search as SearchIcon, 
  Trash2, FileText, X, CheckCircle, Database, Edit, Printer
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import PrintTemplates from './PrintTemplates';

const Sales = ({ data, saveData, showInvoice }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    quantity: '1',
    price: '',
    customer: '',
    discount: '0',
    discountType: 'percentage', // 'percentage' or 'amount'
    paymentMethod: 'bank' // تحويل بنكي كقيمة افتراضية
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [stockError, setStockError] = useState('');
  const [itemType, setItemType] = useState(''); // 'screen' or 'accessory'
  const [itemId, setItemId] = useState(null);
  const [itemCost, setItemCost] = useState(0); // سعر التكلفة للمنتج المحدد
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    saleId: null,
    saleItem: '',
    saleTotal: 0,
    saleQuantity: 0
  });
  const [searchResultsVisible, setSearchResultsVisible] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [cart, setCart] = useState([]);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [editQty, setEditQty] = useState('1');
  const [editPrice, setEditPrice] = useState('');
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [showPrintTemplates, setShowPrintTemplates] = useState(false);

  // تحميل العناصر المتاحة عند الفتح
  useEffect(() => {
    if (showAdd) {
      const allItems = [
        ...(data.screens || []).map(s => ({
          id: s._id || s.id,
          name: s.model,
          quantity: s.quantity,
          cost: s.cost || 0,
          type: 'screen',
          minQuantity: s.minQuantity
        })),
        ...(data.phones || []).map(p => ({
          id: p._id || p.id,
          name: p.model || p.name,
          quantity: p.quantity,
          cost: p.cost || 0,
          type: 'phone',
          minQuantity: p.minQuantity
        })),
        ...(data.accessories || []).map(a => ({
          id: a._id || a.id,
          name: a.name,
          quantity: a.quantity,
          cost: a.cost || 0,
          type: 'accessory',
          minQuantity: a.minQuantity
        })),
        ...(data.stickers || []).map(st => ({
          id: st._id || st.id,
          name: st.name,
          quantity: st.quantity,
          cost: st.cost || 0,
          type: 'sticker',
          minQuantity: st.minQuantity
        }))
      ];
      setFilteredItems(allItems);
    }
  }, [showAdd, data.screens, data.accessories, data.phones, data.stickers]);

  // البحث عن العناصر
  useEffect(() => {
    if (!showAdd) return;

    const allItems = [
      ...(data.screens || []).map(s => ({
        id: s._id || s.id,
        name: s.model,
        quantity: s.quantity,
        cost: s.cost || 0,
        type: 'screen',
        minQuantity: s.minQuantity
      })),
      ...(data.phones || []).map(p => ({ id: p._id || p.id, name: p.model || p.name, quantity: p.quantity, cost: p.cost || 0, type: 'phone', minQuantity: p.minQuantity })),
      ...(data.accessories || []).map(a => ({
        id: a._id || a.id,
        name: a.name,
        quantity: a.quantity,
        cost: a.cost || 0,
        type: 'accessory',
        minQuantity: a.minQuantity
      })),
      ...(data.stickers || []).map(st => ({ id: st._id || st.id, name: st.name, quantity: st.quantity, cost: st.cost || 0, type: 'sticker', minQuantity: st.minQuantity }))
    ];
    
    if (searchTerm) {
      const results = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(results);
      setSearchResultsVisible(results.length > 0);
    } else {
      setFilteredItems(allItems);
      setSearchResultsVisible(false);
    }
  }, [searchTerm, showAdd, data.screens, data.accessories, data.phones, data.stickers]);

  // اختيار عنصر من القائمة
  const selectItem = (item) => {
    setFormData({
      ...formData,
      item: item.name,
      price: '', // المستخدم يدخل سعر البيع
      quantity: '1'
    });
    setItemType(item.type);
    setItemId(item.id);
    setItemCost(item.cost || 0);
    setStockError('');
    setSearchTerm('');
    setSearchResultsVisible(false);
  };

  const handleEditSale = async (saleId) => {
    try {
      const saleToEdit = data.sales.find(s => (s._id || s.id) === saleId);
      if (!saleToEdit) return;

      // لا نحذف الفاتورة ولا نعيد الكميات هنا — نحتفظ بالسجل كما هو حتى يتم حفظ التعديل
      // ضع بيانات الفاتورة في واجهة التحرير فقط
      if (saleToEdit.items && Array.isArray(saleToEdit.items)) {
        setCart(saleToEdit.items.map(it => ({ id: it.id, item: it.item, itemType: it.itemType, quantity: it.quantity, price: it.price })));
      } else {
        setCart([{ id: saleToEdit.itemId || null, item: saleToEdit.item || '', itemType: saleToEdit.itemType || 'accessory', quantity: saleToEdit.quantity || 1, price: saleToEdit.price || 0 }]);
      }

      setFormData({
        ...formData,
        customer: saleToEdit.customer || '',
        discount: saleToEdit.discount != null ? String(saleToEdit.discount) : '0',
        discountType: saleToEdit.discountType || 'percentage',
        paymentMethod: saleToEdit.paymentMethod || ''
      });

      setEditingSaleId(saleId);
      setShowAdd(true);
      setStockError('');
    } catch (error) {
      console.error('خطأ عند بدء تعديل الفاتورة:', error);
      alert('حدث خطأ عند بدء التعديل. الرجاء المحاولة مرة أخرى.');
    }
  };

  

  const validateCartStock = () => {
    if (!cart || cart.length === 0) {
      setStockError('الرجاء إضافة منتج واحد على الأقل إلى السلة');
      return false;
    }

    for (const c of cart) {
      const qty = parseInt(c.quantity) || 0;
      if (qty <= 0) {
        setStockError('الكمية يجب أن تكون أكبر من الصفر لكل سلعة في السلة');
        return false;
      }

      const stockItem = (c.itemType === 'screen' ? (data.screens || []).find(s => (s._id || s.id) === c.id)
        : c.itemType === 'phone' ? (data.phones || []).find(p => (p._id || p.id) === c.id)
        : c.itemType === 'sticker' ? (data.stickers || []).find(st => (st._id || st.id) === c.id)
        : (data.accessories || []).find(a => (a._id || a.id) === c.id));

      if (!stockItem) {
        setStockError(`المنتج ${c.item} غير موجود في المخزون`);
        return false;
      }

      if (stockItem.quantity < qty) {
        setStockError(`الكمية غير كافية للمنتج ${c.item}. المتوفر: ${stockItem.quantity}`);
        return false;
      }
    }

    setStockError('');
    return true;
  };

  const addToCart = () => {
    if (!formData.item || !itemId) {
      setStockError('الرجاء اختيار منتج لإضافته إلى السلة');
      return;
    }
    const qty = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    const cost = itemCost || 0;
    if (qty <= 0 || price <= 0) {
      setStockError('الكمية والسعر يجب أن يكونا أكبر من الصفر');
      return;
    }

    const existingIndex = cart.findIndex(c => c.id === itemId && c.itemType === itemType);
    let newCart = [...cart];
    if (existingIndex >= 0) {
      // دمج مع السطر الحالي
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: (parseInt(newCart[existingIndex].quantity)||0) + qty };
    } else {
      newCart.push({ id: itemId, item: formData.item, itemType: itemType, quantity: qty, price: price, cost: cost });
    }
    setCart(newCart);
    // reset selected item inputs
    setFormData({ ...formData, item: '', quantity: '1', price: '' });
    setItemId(null);
    setItemType('');
    setItemCost(0);
    setStockError('');
  };

  const removeFromCart = (id, type) => {
    setCart(cart.filter(c => !(c.id === id && c.itemType === type)));
  };

  

  // helper to find stock item by id across all collections
  const findStockById = (id) => {
    if (!id) return null;
    return (data.screens || []).find(s => (s._id || s.id) === id)
      || (data.phones || []).find(p => (p._id || p.id) === id)
      || (data.stickers || []).find(st => (st._id || st.id) === id)
      || (data.accessories || []).find(a => (a._id || a.id) === id)
      || null;
  };

  // إضافة عملية بيع جديدة
  const addSale = async () => {
    // for multi-item support use cart validation
    if (!validateCartStock()) return;

    try {
      if (!formData.paymentMethod) {
        setStockError('الرجاء اختيار طريقة الدفع');
        return;
      }
      // compute subtotal from cart
      let rawTotal = 0;
      let totalCost = 0;
      for (const c of cart) {
        const qty = parseInt(c.quantity) || 0;
        rawTotal += qty * (parseFloat(c.price) || 0);
        totalCost += qty * (parseFloat(c.cost) || 0);
      }

      const discountVal = parseFloat(formData.discount) || 0;
      let discountedTotal = rawTotal;

      if (formData.discountType === 'percentage') {
        const pct = Math.min(Math.max(discountVal, 0), 100);
        discountedTotal = rawTotal * (1 - pct / 100);
      } else {
        discountedTotal = rawTotal - discountVal;
      }
      const total = Math.max(0, parseFloat(discountedTotal.toFixed(2)));
      const profit = parseFloat((total - totalCost).toFixed(2)); // الربح الصافي = سعر البيع - سعر التكلفة

      const newSale = {
        id: editingSaleId || Date.now(),
        date: new Date().toISOString(),
        items: cart.map(c => ({ id: c.id, item: c.item, itemType: c.itemType, quantity: parseInt(c.quantity) || 0, price: parseFloat(c.price) || 0, cost: parseFloat(c.cost) || 0 })),
        subtotal: rawTotal,
        totalCost: totalCost,
        total: total,
        profit: profit,
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType || 'percentage',
        paymentMethod: formData.paymentMethod,
        customer: formData.customer || 'غير معروف'
      };
      
      // حفظ عملية البيع
      if (editingSaleId) {
        // تعديل موجود - نحتاج لاستبدال الفاتورة ومطابقة المخزون بناءً على الفروق
        const oldSale = (data.sales || []).find(s => s.id === editingSaleId);

        // maps keyed by type_id
        const oldMap = {};
        if (oldSale && oldSale.items && Array.isArray(oldSale.items)) {
          for (const it of oldSale.items) {
            const key = `${it.itemType}_${it.id}`;
            oldMap[key] = (oldMap[key] || 0) + (it.quantity || 0);
          }
        }

        const newMap = {};
        for (const c of cart) {
          const key = `${c.itemType}_${c.id}`;
          newMap[key] = (newMap[key] || 0) + (parseInt(c.quantity) || 0);
        }

        // union of keys
        const keys = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)]));

        // apply deltas to inventories
        for (const key of keys) {
          const [type, id] = key.split('_');
          const oldQty = oldMap[key] || 0;
          const newQty = newMap[key] || 0;
          const delta = newQty - oldQty; // positive -> need to reduce stock more; negative -> restore stock

          if (delta === 0) continue;

          if (type === 'screen') {
            const updatedScreens = (data.screens || []).map(screen => (screen._id || screen.id) === id ? { ...screen, quantity: screen.quantity - delta } : screen);
            await saveData('screens', updatedScreens);
          } else if (type === 'phone') {
            const updatedPhones = (data.phones || []).map(phone => (phone._id || phone.id) === id ? { ...phone, quantity: phone.quantity - delta } : phone);
            await saveData('phones', updatedPhones);
          } else if (type === 'sticker') {
            const updatedStickers = (data.stickers || []).map(st => (st._id || st.id) === id ? { ...st, quantity: st.quantity - delta } : st);
            await saveData('stickers', updatedStickers);
          } else {
            const updatedAccessories = (data.accessories || []).map(accessory => (accessory._id || accessory.id) === id ? { ...accessory, quantity: accessory.quantity - delta } : accessory);
            await saveData('accessories', updatedAccessories);
          }
        }

        // استبدال الفاتورة في السجل
        const updatedSales = (data.sales || []).map(s => s.id === editingSaleId ? newSale : s);
        await saveData('sales', updatedSales);
      } else {
        // عملية جديدة
        const updatedSales = [...(data.sales || []), newSale];
        await saveData('sales', updatedSales);

        // خصم الكميات من المخزون لكل عنصر في السلة
        for (const c of cart) {
          const qty = parseInt(c.quantity) || 0;
          if (c.itemType === 'screen') {
            const updatedScreens = (data.screens || []).map(screen => (screen._id || screen.id) === c.id ? { ...screen, quantity: screen.quantity - qty } : screen);
            await saveData('screens', updatedScreens);
          } else if (c.itemType === 'phone') {
            const updatedPhones = (data.phones || []).map(phone => (phone._id || phone.id) === c.id ? { ...phone, quantity: phone.quantity - qty } : phone);
            await saveData('phones', updatedPhones);
          } else if (c.itemType === 'sticker') {
            const updatedStickers = (data.stickers || []).map(st => (st._id || st.id) === c.id ? { ...st, quantity: st.quantity - qty } : st);
            await saveData('stickers', updatedStickers);
          } else {
            const updatedAccessories = (data.accessories || []).map(accessory => (accessory._id || accessory.id) === c.id ? { ...accessory, quantity: accessory.quantity - qty } : accessory);
            await saveData('accessories', updatedAccessories);
          }
        }
      }
      
      // إظهار الفاتورة
      if (showInvoice) {
        setLoadingInvoice(true);
        // محاكاة تأخير قصير لتحسين تجربة المستخدم
        setTimeout(() => {
          showInvoice({
            type: 'sale',
            data: newSale
          });
          setLoadingInvoice(false);
        }, 300);
      }
      
      // إعادة تعيين النماذج
      setShowAdd(false);
      setFormData({
        item: '',
        quantity: '1',
        price: '',
        customer: '',
        discount: '0',
        discountType: 'percentage',
        paymentMethod: 'bank'
      });
      setCart([]);
      setItemId(null);
      setItemType('');
      setStockError('');
      setEditingSaleId(null);
      
      alert('تمت عملية البيع بنجاح!');
    } catch (error) {
      console.error('خطأ في عملية البيع:', error);
      alert('حدث خطأ أثناء عملية البيع. الرجاء المحاولة مرة أخرى.');
      setLoadingInvoice(false);
    }
  };

  // حذف فاتورة بيع
  const handleDeleteSale = (id, item, total, quantity) => {
    setDeleteConfirmation({
      isOpen: true,
      saleId: id,
      saleItem: item,
      saleTotal: total,
      saleQuantity: quantity
    });
  };

  const confirmDeleteSale = async () => {
    try {
      if (deleteConfirmation.saleId) {
        const saleToDelete = data.sales.find(s => (s._id || s.id) === deleteConfirmation.saleId);

        if (saleToDelete) {
          // إعادة الكمية إلى المخزون (شاشات، جوالات، ملصقات، إكسسوارات)
          if (saleToDelete.items && Array.isArray(saleToDelete.items)) {
            for (const it of saleToDelete.items) {
              const qty = it.quantity || 0;
              if (it.itemType === 'screen') {
                const updatedScreens = (data.screens || []).map(screen => (screen._id || screen.id) === it.id ? { ...screen, quantity: screen.quantity + qty } : screen);
                await saveData('screens', updatedScreens);
              } else if (it.itemType === 'phone') {
                const updatedPhones = (data.phones || []).map(phone => (phone._id || phone.id) === it.id ? { ...phone, quantity: phone.quantity + qty } : phone);
                await saveData('phones', updatedPhones);
              } else if (it.itemType === 'sticker') {
                const updatedStickers = (data.stickers || []).map(st => (st._id || st.id) === it.id ? { ...st, quantity: st.quantity + qty } : st);
                await saveData('stickers', updatedStickers);
              } else {
                const updatedAccessories = (data.accessories || []).map(accessory => (accessory._id || accessory.id) === it.id ? { ...accessory, quantity: accessory.quantity + qty } : accessory);
                await saveData('accessories', updatedAccessories);
              }
            }
          } else {
            // backward-compatible single-item sale
            if (saleToDelete.itemType === 'screen') {
              const updatedScreens = (data.screens || []).map(screen => (screen._id || screen.id) === saleToDelete.itemId ? { ...screen, quantity: screen.quantity + saleToDelete.quantity } : screen);
              await saveData('screens', updatedScreens);
            } else if (saleToDelete.itemType === 'phone') {
              const updatedPhones = (data.phones || []).map(phone => (phone._id || phone.id) === saleToDelete.itemId ? { ...phone, quantity: phone.quantity + saleToDelete.quantity } : phone);
              await saveData('phones', updatedPhones);
            } else if (saleToDelete.itemType === 'sticker') {
              const updatedStickers = (data.stickers || []).map(st => (st._id || st.id) === saleToDelete.itemId ? { ...st, quantity: st.quantity + saleToDelete.quantity } : st);
              await saveData('stickers', updatedStickers);
            } else {
              const updatedAccessories = (data.accessories || []).map(accessory => (accessory._id || accessory.id) === saleToDelete.itemId ? { ...accessory, quantity: accessory.quantity + saleToDelete.quantity } : accessory);
              await saveData('accessories', updatedAccessories);
            }
          }
        }

        // حذف عملية البيع
        const updatedSales = data.sales.filter(s => (s._id || s.id) !== deleteConfirmation.saleId);
        await saveData('sales', updatedSales);
        
        setDeleteConfirmation({ isOpen: false, saleId: null, saleItem: '', saleTotal: 0, saleQuantity: 0 });
        alert('تم حذف الفاتورة واستعادة الكمية بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف الفاتورة:', error);
      alert('حدث خطأ أثناء حذف الفاتورة. الرجاء المحاولة مرة أخرى.');
    }
  };

  // إلغاء عملية البيع
  const cancelSale = () => {
    setShowAdd(false);
    setFormData({
      item: '',
      quantity: '1',
      price: '',
      customer: '',
      discount: '0',
      discountType: 'percentage',
      paymentMethod: 'bank'
    });
    setItemId(null);
    setItemType('');
    setStockError('');
  };

  const totalSales = data.sales.reduce((sum, s) => sum + s.total, 0);

  // حساب المعاينة الإجمالية والخصم قبل الحفظ
  const previewQuantity = parseInt(formData.quantity) || 0;
  const previewPrice = parseFloat(formData.price) || 0;
  const previewRawTotal = previewQuantity * previewPrice;
  const previewDiscountVal = parseFloat(formData.discount) || 0;
  let previewDiscounted = previewRawTotal;

  if (formData.discountType === 'percentage') {
    const pct = Math.min(Math.max(previewDiscountVal, 0), 100);
    previewDiscounted = previewRawTotal * (1 - pct / 100);
  } else {
    previewDiscounted = previewRawTotal - previewDiscountVal;
  }
  previewDiscounted = Math.max(0, parseFloat(previewDiscounted.toFixed(2)));

  // cart totals when using multi-item sale
  const cartSubtotal = cart.reduce((s, c) => s + ((parseInt(c.quantity) || 0) * (parseFloat(c.price) || 0)), 0);
  const cartDiscountVal = parseFloat(formData.discount) || 0;
  let cartDiscounted = cartSubtotal;
  if (formData.discountType === 'percentage') {
    const pct = Math.min(Math.max(cartDiscountVal, 0), 100);
    cartDiscounted = cartSubtotal * (1 - pct / 100);
  } else {
    cartDiscounted = cartSubtotal - cartDiscountVal;
  }
  cartDiscounted = Math.max(0, parseFloat(cartDiscounted.toFixed(2)));
  const cartDiscountAmount = (cartSubtotal - cartDiscounted).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">المبيعات</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-lg">
            <p className="text-sm">إجمالي المبيعات</p>
            <p className="text-2xl font-bold">{totalSales.toFixed(2)} ₪</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700"
          >
            <Plus className="w-5 h-5" />
            عملية بيع جديدة
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="text-rose-500" />
            تسجيل عملية بيع جديدة
          </h3>
          
          <div className="space-y-4">
            {/* اختيار المنتج */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اختيار المنتج
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchResultsVisible(true);
                  }}
                  onFocus={() => setSearchResultsVisible(true)}
                  onBlur={() => setTimeout(() => setSearchResultsVisible(false), 200)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              </div>
              
              {/* قائمة المنتجات المقترحة - مُحسّنة */}
              {searchResultsVisible && searchTerm && filteredItems.length > 0 && (
                <div className="absolute z-50 w-full md:w-1/2 lg:w-1/3 bg-white border border-gray-200 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-xl animate-fade-in">
                  <div className="p-2 bg-rose-50 border-b border-rose-100 sticky top-0 z-10">
                    <p className="text-sm font-medium text-rose-800">
                      {filteredItems.length} نتيجة بحث - اختر منتج
                    </p>
                  </div>
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`p-3 cursor-pointer transition-colors ${
                        item.quantity < item.minQuantity 
                          ? 'bg-red-50 hover:bg-red-100' 
                          : item.quantity < item.minQuantity * 2 
                          ? 'bg-yellow-50 hover:bg-yellow-100' 
                          : 'hover:bg-rose-50'
                      } border-b last:border-b-0`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 truncate">{item.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium`}> {
                              item.type === 'screen' ? 'شاشة' : item.type === 'phone' ? 'جوال' : item.type === 'sticker' ? 'ملصق' : 'إكسسوار'
                            }</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.quantity < item.minQuantity 
                                ? 'bg-red-100 text-red-800' 
                                : item.quantity < item.minQuantity * 2 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              <Database className="w-3 h-3 mr-1" />
                              {item.quantity} وحدة
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.quantity < item.minQuantity 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {item.quantity < item.minQuantity ? 'ناقص' : 'متوفر'}
                            </span>
                          </div>
                        </div>
                          <div className="text-left">
                          <span className="font-bold text-gray-600 block">{(item.cost || 0).toFixed(2)} ₪</span>
                          <span className="text-xs text-gray-500 mt-0.5">سعر التكلفة</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredItems.length > 10 && (
                    <div className="p-2 text-center text-sm text-blue-600 bg-blue-50 border-t border-blue-100 sticky bottom-0">
                      اسحب للأسفل لعرض المزيد من النتائج
                    </div>
                  )}
                </div>
              )}
              
              {/* حالة عدم وجود نتائج بحث */}
              {searchResultsVisible && searchTerm && filteredItems.length === 0 && (
                <div className="absolute z-50 w-full md:w-1/2 lg:w-1/3 bg-white border border-gray-200 rounded-lg mt-1 p-4 shadow-lg animate-fade-in">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <SearchIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700">لم يتم العثور على نتائج</p>
                    <p className="text-sm text-gray-500">جرب بحثاً آخر أو أضف منتج جديد</p>
                  </div>
                </div>
              )}
              
              {/* المنتج المختار */}
              {formData.item && (
                <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-rose-800 text-lg">{formData.item}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium`}>{
                          itemType === 'screen' ? 'شاشة' : itemType === 'phone' ? 'جوال' : itemType === 'sticker' ? 'ملصق' : 'إكسسوار'
                        }</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Database className="w-4 h-4 text-rose-500" />
                          <span className="font-medium">الكمية المتوفرة:</span>
                          <span className={`font-bold ${
                            itemId ? 
                            ((findStockById(itemId)?.quantity || 0) < ((findStockById(itemId)?.minQuantity || 0) * 2)
                              ? 'text-red-600'
                              : 'text-green-600')
                            : 'text-gray-500'
                          }`}>
                            {itemId ? (findStockById(itemId)?.quantity ?? '---') : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({...formData, item: ''});
                        setItemId(null);
                        setItemType('');
                      }}
                      className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-full hover:bg-red-100 transition"
                      title="إزالة المنتج"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {stockError && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{stockError}</span>
                </div>
              )}
            </div>
            
            {/* الكمية والسعر - مع عرض الكمية المتوفرة */}
            {formData.item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      الكمية
                      {itemId && (
                                <span className={`text-sm font-normal ${
                                  (findStockById(itemId)?.quantity || 0) < ((findStockById(itemId)?.minQuantity || 0) * 2)
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                                }`}>
                                  (المتوفر: {findStockById(itemId)?.quantity ?? 0})
                                </span>
                      )}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={e => {
                      setFormData({...formData, quantity: e.target.value});
                      setStockError('');
                    }}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر للوحدة
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => {
                      setFormData({...formData, price: e.target.value});
                      setStockError('');
                    }}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0.01"
                  />
                </div>
              </div>
            )}

            {/* زر لإضافة العنصر إلى السلة */}
            {formData.item && (
                <div className="flex gap-2">
                <button
                  onClick={addToCart}
                  className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600"
                >أضف إلى السلة</button>
                <button
                  onClick={() => { setFormData({...formData, item: '', quantity: '1', price: ''}); setItemId(null); setItemType(''); }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >مسح الاختيار</button>
              </div>
            )}
            
            {/* خصم (قيمة أو نسبة) */}
            {formData.item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={e => setFormData({...formData, discount: e.target.value})}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الخصم</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({...formData, discountType: e.target.value})}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percentage">نسبة %</option>
                    <option value="amount">مبلغ</option>
                  </select>
                </div>
              </div>
            )}

            {/* العميل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم العميل (اختياري)
              </label>
              <input
                type="text"
                value={formData.customer}
                onChange={e => setFormData({...formData, customer: e.target.value})}
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم العميل"
              />
            </div>

            {/* طريقة الدفع (مطلوب) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <select
                value={formData.paymentMethod}
                onChange={e => { setFormData({...formData, paymentMethod: e.target.value}); setStockError(''); }}
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر طريقة الدفع</option>
                <option value="cash">نقداً</option>
                <option value="card">بطاقة</option>
                <option value="bank">تحويل بنكي</option>
                <option value="mobile">محفظة</option>
              </select>
            </div>
            
            {/* سلة المشتريات وملخص البيع */}
            {cart.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-2">سلة المشتريات</h4>
                <div className="space-y-2">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{c.item}</div>
                        <div className="text-sm text-gray-500">{c.itemType === 'screen' ? 'شاشة' : c.itemType === 'phone' ? 'جوال' : c.itemType === 'sticker' ? 'ملصق' : 'إكسسوار'} - {(parseFloat(c.price)||0).toFixed(2)} ₪</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {editingCartIndex === idx ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-20 border p-1 rounded" />
                            <input type="number" min="0.01" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-28 border p-1 rounded" />
                            <button onClick={() => {
                              // save edit
                              const newCart = [...cart];
                              newCart[idx] = { ...newCart[idx], quantity: parseInt(editQty)||0, price: parseFloat(editPrice)||0 };
                              setCart(newCart);
                              setEditingCartIndex(null);
                            }} className="bg-rose-500 text-white px-3 py-1 rounded">حفظ</button>
                            <button onClick={() => { setEditingCartIndex(null); setStockError(''); }} className="bg-gray-200 px-3 py-1 rounded">إلغاء</button>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-rose-600">{c.quantity}</div>
                            <button onClick={() => { setEditingCartIndex(idx); setEditQty(String(c.quantity)); setEditPrice(String(c.price)); }} className="text-rose-600 hover:text-rose-800">تعديل</button>
                            <button onClick={() => removeFromCart(c.id, c.itemType)} className="text-red-500 hover:text-red-700">إزالة</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            { (cart.length > 0 || (formData.item && formData.quantity && formData.price)) && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-200">
                <h4 className="font-bold text-rose-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-rose-500" />
                  ملخص البيع
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>الإجمالي الفرعي:</span>
                    <span className="font-medium">{(cart.length > 0 ? cartSubtotal : previewRawTotal).toFixed(2)} ₪</span>
                  </div>
                  <div className="flex justify-between text-gray-700 mt-1">
                    <span>الخصم ({formData.discountType === 'percentage' ? formData.discount + '%' : formData.discount + ' ₪'}):</span>
                    <span className="font-medium">{(cart.length > 0 ? cartDiscountAmount : (previewRawTotal - previewDiscounted).toFixed(2))} ₪</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span className="text-gray-800">الإجمالي بعد الخصم:</span>
                    <span className="text-rose-600">{(cart.length > 0 ? cartDiscounted : previewDiscounted).toFixed(2)} ₪</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* أزرار التحكم */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button onClick={addSale} 
                disabled={cart.length === 0 || !formData.paymentMethod || loadingInvoice}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition transform hover:scale-[1.02] ${
                  (cart.length > 0 && formData.paymentMethod && !loadingInvoice) 
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg hover:from-rose-600 hover:to-rose-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loadingInvoice ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التحميل...
                  </div>
                ) : 'تسجيل البيع'}
              </button>
              <button onClick={cancelSale} 
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white py-3 px-4 rounded-lg font-bold text-lg hover:from-gray-500 hover:to-gray-600 transition transform hover:scale-[1.02] shadow"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* جدول المبيعات */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h4 className="font-bold text-lg">سجل المبيعات</h4>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث في المبيعات..."
              className="border p-2 rounded w-full pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-100">
              <tr className="bg-gray-100">
                <th className="p-4 text-right whitespace-nowrap">التاريخ</th>
                <th className="p-4 text-right">المنتج</th>
                <th className="p-4 text-center">النوع</th>
                <th className="p-4 text-right">الكمية</th>
                <th className="p-4 text-right">السعر</th>
                <th className="p-4 text-right">الإجمالي</th>
                <th className="p-4 text-right">العميل</th>
                
                <th className="p-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.slice().reverse().map(sale => (
                <tr key={sale._id || sale.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 whitespace-nowrap text-sm">{new Date(sale.date).toLocaleDateString('ar', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                    <td className="p-4 font-medium">{sale.items ? (sale.items.length > 1 ? `${sale.items[0].item} +${sale.items.length - 1}` : sale.items[0].item) : sale.item}</td>
                    <td className="p-4 text-center">{(sale.items ? [...new Set(sale.items.map(it => it.itemType))] : [sale.itemType]).map(t => t === 'screen' ? 'شاشة' : t === 'phone' ? 'جوال' : t === 'sticker' ? 'ملصق' : 'إكسسوار').join(', ')}</td>
                    <td className="p-4 font-bold text-blue-600">{sale.items ? sale.items.reduce((s, it) => s + (it.quantity || 0), 0) : sale.quantity}</td>
                    <td className="p-4">{(sale.subtotal ? sale.subtotal : (sale.price || 0)).toFixed ? (sale.subtotal ? sale.subtotal.toFixed(2) : (sale.price || 0).toFixed(2)) : (sale.subtotal || sale.price || 0).toFixed(2)} ₪</td>
                    <td className="p-4 font-bold text-green-600">{(sale.total || 0).toFixed(2)} ₪</td>
                    <td className="p-4">{sale.customer || 'غير معروف'}</td>
                    
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setLoadingInvoice(true);
                                setTimeout(() => {
                                  showInvoice({ type: 'sale', data: sale });
                                  setLoadingInvoice(false);
                                }, 300);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1.5 rounded-full hover:bg-blue-50 transition flex items-center gap-1"
                              title="عرض الفاتورة"
                              disabled={loadingInvoice}
                            >
                              {loadingInvoice ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => setShowPrintTemplates(sale._id || sale.id)}
                              className="text-purple-500 hover:text-purple-700 p-1.5 rounded-full hover:bg-purple-50 transition"
                              title="طباعة قوالب"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditSale(sale._id || sale.id)}
                              className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-full hover:bg-indigo-50 transition"
                              title="تعديل الفاتورة"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSale(sale._id || sale.id, sale.items ? (sale.items[0]?.item || '') : sale.item, sale.total, sale.items ? sale.items.reduce((s, it) => s + (it.quantity || 0), 0) : sale.quantity)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                      </div>
                    </td>
                </tr>
              ))}
              {data.sales.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-xl font-medium text-gray-700 mb-2">لا توجد مبيعات حتى الآن</p>
                      <p className="text-gray-500">ابدأ بتسجيل أول عملية بيع</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال التأكيد للحذف */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, saleId: null, saleItem: '', saleTotal: 0, saleQuantity: 0 })}
        onConfirm={confirmDeleteSale}
        title="تأكيد حذف الفاتورة"
        message={`هل أنت متأكد من حذف فاتورة بيع "${deleteConfirmation.saleItem}" بمبلغ ${deleteConfirmation.saleTotal.toFixed(2)} ₪؟ سيتم إعادة الكمية (${deleteConfirmation.saleQuantity}) إلى المخزون.`}
        confirmText="حذف الفاتورة"
        cancelText="إلغاء"
        iconType="delete"
      />

      {/* مودال قوالب الطباعة */}
      {showPrintTemplates && (
        <PrintTemplates
          data={data}
          onClose={() => setShowPrintTemplates(false)}
        />
      )}
    </div>
  );
};

export default Sales;