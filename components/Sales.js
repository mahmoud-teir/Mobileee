'use client';
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, AlertCircle, Search as SearchIcon, 
  Trash2, FileText, X, CheckCircle, Database, Edit, Printer
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [itemType, setItemType] = useState(''); // 'screen', 'phone', 'sticker', 'accessory', or categoryId
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

  // Helper to get all sellable items
  const getAllItems = () => {
    return [
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
      })),
      ...(data.products || []).map(p => ({
        id: p._id || p.id,
        name: p.name,
        quantity: p.quantity,
        cost: p.cost || 0,
        type: p.categoryId?._id || p.categoryId || 'dynamic',
        minQuantity: p.minQuantity
      }))
    ];
  };

  // تحميل العناصر المتاحة عند الفتح
  useEffect(() => {
    if (showAdd) {
      setFilteredItems(getAllItems());
    }
  }, [showAdd, data.screens, data.accessories, data.phones, data.stickers, data.products]);

  // البحث عن العناصر
  useEffect(() => {
    if (!showAdd) return;

    const allItems = getAllItems();
    
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
  }, [searchTerm, showAdd, data.screens, data.accessories, data.phones, data.stickers, data.products]);

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

      if (saleToEdit.items && Array.isArray(saleToEdit.items)) {
        setCart(saleToEdit.items.map(it => ({ id: it.id, item: it.item, itemType: it.itemType, quantity: it.quantity, price: it.price, cost: it.cost || 0 })));
      } else {
        setCart([{ id: saleToEdit.itemId || null, item: saleToEdit.item || '', itemType: saleToEdit.itemType || 'accessory', quantity: saleToEdit.quantity || 1, price: saleToEdit.price || 0, cost: saleToEdit.cost || 0 }]);
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
      toast.error('حدث خطأ عند بدء التعديل. الرجاء المحاولة مرة أخرى.');
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

      const stockItem = findStockByIdAndType(c.id, c.itemType);

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
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: (parseInt(newCart[existingIndex].quantity)||0) + qty };
    } else {
      newCart.push({ id: itemId, item: formData.item, itemType: itemType, quantity: qty, price: price, cost: cost });
    }
    setCart(newCart);
    setFormData({ ...formData, item: '', quantity: '1', price: '' });
    setItemId(null);
    setItemType('');
    setItemCost(0);
    setStockError('');
  };

  const removeFromCart = (id, type) => {
    setCart(cart.filter(c => !(c.id === id && c.itemType === type)));
  };

  const findStockByIdAndType = (id, type) => {
    if (!id) return null;
    if (type === 'screen') return (data.screens || []).find(s => (s._id || s.id) === id);
    if (type === 'phone') return (data.phones || []).find(p => (p._id || p.id) === id);
    if (type === 'sticker') return (data.stickers || []).find(st => (st._id || st.id) === id);
    if (type === 'accessory') return (data.accessories || []).find(a => (a._id || a.id) === id);
    // Dynamic products
    return (data.products || []).find(p => (p._id || p.id) === id);
  };

  const findStockById = (id) => {
    if (!id) return null;
    return (data.screens || []).find(s => (s._id || s.id) === id)
      || (data.phones || []).find(p => (p._id || p.id) === id)
      || (data.stickers || []).find(st => (st._id || st.id) === id)
      || (data.accessories || []).find(a => (a._id || a.id) === id)
      || (data.products || []).find(p => (p._id || p.id) === id)
      || null;
  };

  const addSale = async () => {
    if (!validateCartStock()) return;

    try {
      if (!formData.paymentMethod) {
        setStockError('الرجاء اختيار طريقة الدفع');
        return;
      }
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
      const profit = parseFloat((total - totalCost).toFixed(2));

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
      
      if (editingSaleId) {
        const oldSale = (data.sales || []).find(s => (s._id || s.id) === editingSaleId);
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

        const keys = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)]));

        for (const key of keys) {
          const splitIdx = key.indexOf('_');
          const type = key.substring(0, splitIdx);
          const id = key.substring(splitIdx + 1);
          
          const oldQty = oldMap[key] || 0;
          const newQty = newMap[key] || 0;
          const delta = newQty - oldQty;

          if (delta === 0) continue;

          if (type === 'screen') {
            const updatedScreens = (data.screens || []).map(s => (s._id || s.id) === id ? { ...s, quantity: s.quantity - delta } : s);
            await saveData('screens', updatedScreens);
          } else if (type === 'phone') {
            const updatedPhones = (data.phones || []).map(p => (p._id || p.id) === id ? { ...p, quantity: p.quantity - delta } : p);
            await saveData('phones', updatedPhones);
          } else if (type === 'sticker') {
            const updatedStickers = (data.stickers || []).map(st => (st._id || st.id) === id ? { ...st, quantity: st.quantity - delta } : st);
            await saveData('stickers', updatedStickers);
          } else if (type === 'accessory') {
            const updatedAccessories = (data.accessories || []).map(a => (a._id || a.id) === id ? { ...a, quantity: a.quantity - delta } : a);
            await saveData('accessories', updatedAccessories);
          } else {
            // Dynamic products
            const updatedProducts = (data.products || []).map(p => (p._id || p.id) === id ? { ...p, quantity: p.quantity - delta } : p);
            await saveData('products', updatedProducts);
          }
        }

        const updatedSales = (data.sales || []).map(s => (s._id || s.id) === editingSaleId ? newSale : s);
        await saveData('sales', updatedSales);
      } else {
        const updatedSales = [...(data.sales || []), newSale];
        await saveData('sales', updatedSales);

        for (const c of cart) {
          const qty = parseInt(c.quantity) || 0;
          if (c.itemType === 'screen') {
            const u = (data.screens || []).map(s => (s._id || s.id) === c.id ? { ...s, quantity: s.quantity - qty } : s);
            await saveData('screens', u);
          } else if (c.itemType === 'phone') {
            const u = (data.phones || []).map(p => (p._id || p.id) === c.id ? { ...p, quantity: p.quantity - qty } : p);
            await saveData('phones', u);
          } else if (c.itemType === 'sticker') {
            const u = (data.stickers || []).map(st => (st._id || st.id) === c.id ? { ...st, quantity: st.quantity - qty } : st);
            await saveData('stickers', u);
          } else if (c.itemType === 'accessory') {
            const u = (data.accessories || []).map(a => (a._id || a.id) === c.id ? { ...a, quantity: a.quantity - qty } : a);
            await saveData('accessories', u);
          } else {
            const u = (data.products || []).map(p => (p._id || p.id) === c.id ? { ...p, quantity: p.quantity - qty } : p);
            await saveData('products', u);
          }
        }
      }
      
      if (showInvoice) {
        setLoadingInvoice(true);
        setTimeout(() => {
          showInvoice({ type: 'sale', data: newSale });
          setLoadingInvoice(false);
        }, 300);
      }
      
      setShowAdd(false);
      setFormData({
        item: '', quantity: '1', price: '', customer: '', discount: '0', discountType: 'percentage', paymentMethod: 'bank'
      });
      setCart([]);
      setItemId(null);
      setItemType('');
      setStockError('');
      setEditingSaleId(null);
      toast.success('تمت عملية البيع بنجاح!');
    } catch (error) {
      console.error('خطأ في عملية البيع:', error);
      toast.error('حدث خطأ أثناء عملية البيع. الرجاء المحاولة مرة أخرى.');
      setLoadingInvoice(false);
    }
  };

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
          if (saleToDelete.items && Array.isArray(saleToDelete.items)) {
            for (const it of saleToDelete.items) {
              const qty = it.quantity || 0;
              if (it.itemType === 'screen') {
                const u = (data.screens || []).map(s => (s._id || s.id) === it.id ? { ...s, quantity: s.quantity + qty } : s);
                await saveData('screens', u);
              } else if (it.itemType === 'phone') {
                const u = (data.phones || []).map(p => (p._id || p.id) === it.id ? { ...p, quantity: p.quantity + qty } : p);
                await saveData('phones', u);
              } else if (it.itemType === 'sticker') {
                const u = (data.stickers || []).map(st => (st._id || st.id) === it.id ? { ...st, quantity: st.quantity + qty } : st);
                await saveData('stickers', u);
              } else if (it.itemType === 'accessory') {
                const u = (data.accessories || []).map(a => (a._id || a.id) === it.id ? { ...a, quantity: a.quantity + qty } : a);
                await saveData('accessories', u);
              } else {
                const u = (data.products || []).map(p => (p._id || p.id) === it.id ? { ...p, quantity: p.quantity + qty } : p);
                await saveData('products', u);
              }
            }
          } else {
            // backward-compatible single-item sale
            const qty = saleToDelete.quantity || 0;
            if (saleToDelete.itemType === 'screen') {
              const u = (data.screens || []).map(s => (s._id || s.id) === saleToDelete.itemId ? { ...s, quantity: s.quantity + qty } : s);
              await saveData('screens', u);
            } else if (saleToDelete.itemType === 'phone') {
              const u = (data.phones || []).map(p => (p._id || p.id) === saleToDelete.itemId ? { ...p, quantity: p.quantity + qty } : p);
              await saveData('phones', u);
            } else if (saleToDelete.itemType === 'sticker') {
              const u = (data.stickers || []).map(st => (st._id || st.id) === saleToDelete.itemId ? { ...st, quantity: st.quantity + qty } : st);
              await saveData('stickers', u);
            } else if (saleToDelete.itemType === 'accessory') {
              const u = (data.accessories || []).map(a => (a._id || a.id) === saleToDelete.itemId ? { ...a, quantity: a.quantity + qty } : a);
              await saveData('accessories', u);
            } else {
              const u = (data.products || []).map(p => (p._id || p.id) === saleToDelete.itemId ? { ...p, quantity: p.quantity + qty } : p);
              await saveData('products', u);
            }
          }
        }

        const updatedSales = data.sales.filter(s => (s._id || s.id) !== deleteConfirmation.saleId);
        await saveData('sales', updatedSales);
        
        setDeleteConfirmation({ isOpen: false, saleId: null, saleItem: '', saleTotal: 0, saleQuantity: 0 });
        toast.success('تم حذف الفاتورة واستعادة الكمية بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف الفاتورة:', error);
      toast.error('حدث خطأ أثناء حذف الفاتورة. الرجاء المحاولة مرة أخرى.');
    }
  };

  const cancelSale = () => {
    setShowAdd(false);
    setFormData({
      item: '', quantity: '1', price: '', customer: '', discount: '0', discountType: 'percentage', paymentMethod: 'bank'
    });
    setCart([]);
    setItemId(null);
    setItemType('');
    setStockError('');
    setEditingSaleId(null);
  };

  const totalSales = (data.sales || []).reduce((sum, s) => sum + (s.total || 0), 0);

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

  const getTypeName = (type) => {
    if (type === 'screen') return 'شاشة';
    if (type === 'phone') return 'جوال';
    if (type === 'sticker') return 'ملصق';
    if (type === 'accessory') return 'إكسسوار';
    const cat = (data.categories || []).find(c => c._id === type);
    return cat ? cat.name : 'صنف';
  };

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
            {editingSaleId ? 'تعديل فاتورة بيع' : 'تسجيل عملية بيع جديدة'}
          </h3>
          
          <div className="space-y-4">
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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium`}>{getTypeName(item.type)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.quantity < item.minQuantity ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <Database className="w-3 h-3 mr-1" />
                              {item.quantity} وحدة
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-gray-600 block">{(item.cost || 0).toFixed(2)} ₪</span>
                          <span className="text-xs text-gray-500 mt-0.5">التكلفة</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.item && (
                <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-rose-800 text-lg">{formData.item}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium`}>{getTypeName(itemType)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Database className="w-4 h-4 text-rose-500" />
                        <span className="font-medium">المتوفر:</span>
                        <span className="font-bold">{itemId ? (findStockById(itemId)?.quantity ?? '---') : '---'}</span>
                      </div>
                    </div>
                    <button onClick={() => { setFormData({...formData, item: ''}); setItemId(null); setItemType(''); }} className="text-red-500 p-1.5 rounded-full hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {stockError && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{stockError}</span>
                </div>
              )}
            </div>
            
            {formData.item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                  <input type="number" value={formData.quantity} onChange={e => { setFormData({...formData, quantity: e.target.value}); setStockError(''); }} className="w-full border p-2 rounded-lg" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة (للوحدة)</label>
                  <input type="number" value={itemCost.toFixed(2)} readOnly className="w-full border p-2 rounded-lg bg-gray-100 text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع (للوحدة)</label>
                  <input type="number" value={formData.price} onChange={e => { setFormData({...formData, price: e.target.value}); setStockError(''); }} className="w-full border p-2 rounded-lg border-rose-300 focus:ring-rose-500" step="0.01" min="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الربح المتوقع</label>
                  <div className={`w-full border p-2 rounded-lg font-bold ${ (parseFloat(formData.price) - itemCost) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' }`}>
                    {((parseFloat(formData.price) || 0) - itemCost).toFixed(2)} ₪
                  </div>
                </div>
                <div className="md:col-span-2">
                    <button onClick={addToCart} className="w-full bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 font-bold flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        أضف للسلة
                    </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                  <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-full border p-2 rounded-lg" step="0.01" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الخصم</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full border p-2 rounded-lg">
                    <option value="percentage">نسبة %</option>
                    <option value="amount">مبلغ</option>
                  </select>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
              <input type="text" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="اسم العميل" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <select value={formData.paymentMethod} onChange={e => { setFormData({...formData, paymentMethod: e.target.value}); setStockError(''); }} className="w-full border p-2 rounded-lg" required>
                <option value="">اختر طريقة الدفع</option>
                <option value="cash">نقداً</option>
                <option value="card">بطاقة</option>
                <option value="bank">تحويل بنكي</option>
                <option value="mobile">محفظة</option>
              </select>
            </div>
            
            {cart.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-2">سلة المشتريات</h4>
                <div className="space-y-2">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{c.item}</div>
                        <div className="text-sm text-gray-500">{getTypeName(c.itemType)} - {c.price.toFixed(2)} ₪</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {editingCartIndex === idx ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-20 border p-1 rounded" />
                            <input type="number" min="0.01" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-28 border p-1 rounded" />
                            <button onClick={() => {
                              const newCart = [...cart];
                              newCart[idx] = { ...newCart[idx], quantity: parseInt(editQty)||0, price: parseFloat(editPrice)||0 };
                              setCart(newCart);
                              setEditingCartIndex(null);
                            }} className="bg-rose-500 text-white px-3 py-1 rounded">حفظ</button>
                            <button onClick={() => setEditingCartIndex(null)} className="bg-gray-200 px-3 py-1 rounded">إلغاء</button>
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
                  ملخص العملية
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>الإجمالي الفرعي:</span>
                    <span>{(cart.length > 0 ? cartSubtotal : previewRawTotal).toFixed(2)} ₪</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span className="text-gray-800">الإجمالي النهائي:</span>
                    <span className="text-rose-600">{(cart.length > 0 ? cartDiscounted : previewDiscounted).toFixed(2)} ₪</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button 
                onClick={addSale} 
                disabled={cart.length === 0 || !formData.paymentMethod || loadingInvoice}
                className={`flex-1 py-3 rounded-lg font-bold text-lg transition ${ (cart.length > 0 && formData.paymentMethod && !loadingInvoice) ? 'bg-rose-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed' }`}
              >
                {loadingInvoice ? 'جاري التحميل...' : 'تسجيل البيع'}
              </button>
              <button onClick={cancelSale} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold text-lg hover:bg-gray-300">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* سجل المبيعات */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="font-bold text-lg">سجل المبيعات</h4>
        </div>
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-right">التاريخ</th>
              <th className="p-4 text-right">المنتج</th>
              <th className="p-4 text-right">الإجمالي</th>
              <th className="p-4 text-right">العميل</th>
              <th className="p-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(data.sales || []).slice().reverse().map(sale => (
              <tr key={sale._id || sale.id} className="border-b hover:bg-gray-50">
                <td className="p-4 whitespace-nowrap text-sm">
                  {new Date(sale.date).toLocaleString('ar-EG')}
                </td>
                <td className="p-4 font-medium">
                  {sale.items ? (sale.items.length > 1 ? `${sale.items[0].item} +${sale.items.length - 1}` : sale.items[0].item) : sale.item}
                </td>
                <td className="p-4 font-bold text-rose-600">{(sale.total || 0).toFixed(2)} ₪</td>
                <td className="p-4">{sale.customer || '---'}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => showInvoice({ type: 'sale', data: sale })} className="text-blue-500 hover:text-blue-700">
                      <FileText className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleEditSale(sale._id || sale.id)} className="text-indigo-500 hover:text-indigo-700">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteSale(sale._id || sale.id, sale.items ? sale.items[0].item : sale.item, sale.total, 0)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, saleId: null, saleItem: '', saleTotal: 0, saleQuantity: 0 })}
        onConfirm={confirmDeleteSale}
        title="تأكيد حذف الفاتورة"
        message={`هل أنت متأكد من حذف هذه الفاتورة؟ سيتم استعادة الكميات المباعة إلى المخزون.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />

      {showPrintTemplates && (
        <PrintTemplates data={data} onClose={() => setShowPrintTemplates(false)} />
      )}
    </div>
  );
};

export default Sales;