import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, AlertCircle, Search as SearchIcon,
  Trash2, FileText, X, CheckCircle, Database, Edit, Printer,
  Monitor, Smartphone, Headphones, Sticker, Package, User
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import PrintTemplates from './PrintTemplates';
import { useLanguage } from './LanguageContext';

const Sales = ({ data, saveData, showInvoice }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';


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
        barcode: s.barcode || '',
        description: s.description || '',
        quantity: s.quantity,
        cost: s.cost || 0,
        type: 'screen',
        minQuantity: s.minQuantity
      })),
      ...(data.phones || []).map(p => ({
        id: p._id || p.id,
        name: p.model || p.name,
        barcode: p.barcode || '',
        description: p.description || '',
        quantity: p.quantity,
        cost: p.cost || 0,
        type: 'phone',
        minQuantity: p.minQuantity
      })),
      ...(data.accessories || []).map(a => ({
        id: a._id || a.id,
        name: a.name,
        barcode: a.barcode || '',
        description: a.description || '',
        quantity: a.quantity,
        cost: a.cost || 0,
        type: 'accessory',
        minQuantity: a.minQuantity
      })),
      ...(data.stickers || []).map(st => ({
        id: st._id || st.id,
        name: st.name,
        barcode: st.barcode || '',
        description: st.description || '',
        quantity: st.quantity,
        cost: st.cost || 0,
        type: 'sticker',
        minQuantity: st.minQuantity
      })),
      ...(data.products || []).map(p => ({
        id: p._id || p.id,
        name: p.name,
        barcode: p.barcode || '',
        description: p.description || '',
        quantity: p.quantity,
        cost: p.cost || 0,
        type: 'product',
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

  // Helper to normalize Arabic text for better searching
  const normalizeArabic = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, ''); // Remove harakat
  };

  // البحث عن العناصر
  useEffect(() => {
    if (!showAdd) return;

    const allItems = getAllItems();

    if (searchTerm) {
      const normalizedSearch = normalizeArabic(searchTerm);
      const keywords = normalizedSearch.split(/\s+/).filter(k => k.length > 0);

      const results = allItems.filter(item => {
        const textToSearch = normalizeArabic(`${item.name} ${item.barcode} ${item.description}`);
        // All keywords must match
        return keywords.every(kw => textToSearch.includes(kw));
      });
      setFilteredItems(results);
      setSearchResultsVisible(true); // Always show if we have a term
    } else {
      setFilteredItems(allItems);
      // Don't hide results if focused even if term is empty
      // We rely on the input focus state for visibility when empty
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
        setCart(saleToEdit.items.map(it => ({ id: it.productId || it.id, item: it.item, itemType: it.type || it.itemType, quantity: it.quantity, price: it.price, cost: it.cost || 0 })));
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
      console.error('Error starting invoice edit:', error);
      toast.error(t('sales.errorUpdate'));
    }
  };

  const validateCartStock = () => {
    if (!cart || cart.length === 0) {
      setStockError(t('sales.errorNoProduct'));
      return false;
    }

    for (const c of cart) {
      const qty = parseInt(c.quantity) || 0;
      if (qty <= 0) {
        setStockError(t('sales.errorQuantity'));
        return false;
      }

      const stockItem = findStockByIdAndType(c.id, c.itemType);

      if (!stockItem) {
        setStockError(t('sales.errorNoProduct'));
        return false;
      }

      if (stockItem.quantity < qty) {
        setStockError(`${t('sales.errorStock')} ${c.item}. ${t('sales.available')} ${stockItem.quantity}`);
        return false;
      }
    }

    setStockError('');
    return true;
  };

  const addToCart = () => {
    if (!formData.item || !itemId) {
      setStockError(t('sales.errorNoProduct'));
      return;
    }

    const qty = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    const cost = itemCost || 0;
    if (qty <= 0 || price <= 0) {
      setStockError(t('sales.errorQuantity') || 'Quantity and price must be greater than zero');
      return;
    }

    const existingIndex = cart.findIndex(c => c.id === itemId && c.itemType === itemType);
    let newCart = [...cart];
    if (existingIndex >= 0) {
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: (parseInt(newCart[existingIndex].quantity) || 0) + qty };
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
        setStockError(t('sales.errorPayment'));
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
        items: cart.map(c => ({ productId: c.id, item: c.item, type: c.itemType, quantity: parseInt(c.quantity) || 0, price: parseFloat(c.price) || 0, cost: parseFloat(c.cost) || 0 })),
        subtotal: rawTotal,
        totalCost: totalCost,
        total: total,
        profit: profit,
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType || 'percentage',
        paymentMethod: formData.paymentMethod || 'cash',
        customerName: formData.customer || t('sales.cashCustomer')
      };


      if (editingSaleId) {
        const updatedSalesList = (data.sales || []).map(s => (s._id || s.id) === editingSaleId ? newSale : s);

        // reconcile stock
        const oldSale = (data.sales || []).find(s => (s._id || s.id) === editingSaleId);
        const oldMap = {};
        if (oldSale && oldSale.items && Array.isArray(oldSale.items)) {
          for (const it of oldSale.items) {
            const key = `${it.type}_${it.productId}`;
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
          if (splitIdx === -1) continue;
          const type = key.substring(0, splitIdx);
          const id = key.substring(splitIdx + 1);
          const delta = (newMap[key] || 0) - (oldMap[key] || 0);
          if (delta === 0) continue;

          const collection = type === 'screen' ? 'screens' : type === 'phone' ? 'phones' : type === 'sticker' ? 'stickers' : type === 'accessory' ? 'accessories' : 'products';
          const items = data[collection] || [];
          const updatedItems = items.map(i => (i._id || i.id) === id ? { ...i, quantity: i.quantity - delta } : i);
          await saveData(collection, updatedItems);
        }

        const success = await saveData('sales', updatedSalesList);
        if (!success) {
          toast.error(t('sales.errorUpdate'));
          return;
        }

      } else {
        const updatedSalesList = [...(data.sales || []), newSale];
        const success = await saveData('sales', updatedSalesList);
        if (!success) {
          toast.error(t('sales.errorRegister'));
          return;
        }


        // Update stock for new sale
        for (const c of cart) {
          const qty = parseInt(c.quantity) || 0;
          const collection = c.itemType === 'screen' ? 'screens' : c.itemType === 'phone' ? 'phones' : c.itemType === 'sticker' ? 'stickers' : c.itemType === 'accessory' ? 'accessories' : 'products';
          const items = data[collection] || [];
          const updatedItems = items.map(i => (i._id || i.id) === c.id ? { ...i, quantity: i.quantity - qty } : i);
          await saveData(collection, updatedItems);
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
      toast.success(t('sales.success'));
    } catch (error) {
      console.error('Sale process error:', error);
      toast.error(t('sales.errorRegister'));
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
        toast.success(t('sales.successDelete'));
      }
    } catch (error) {
      console.error('Delete sale error:', error);
      toast.error(t('sales.errorDelete'));
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
    if (type === 'screen') return t('inventory.screen');
    if (type === 'phone') return t('inventory.phone');
    if (type === 'sticker') return t('inventory.sticker');
    if (type === 'accessory') return t('inventory.accessory');
    const cat = (data.categories || []).find(c => c._id === type);
    return cat ? cat.name : t('inventory.product');
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">{t('sales.title')}</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-lg">
            <p className="text-sm">{t('sales.totalSales')}</p>
            <p className="text-2xl font-bold">{totalSales.toFixed(2)} {t('dashboard.currency')}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700"
          >
            <Plus className="w-5 h-5" />
            {t('sales.newSale')}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="text-rose-500" />
            {editingSaleId ? t('sales.editSale') : t('sales.registerSale')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('sales.selectProduct')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('sales.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchResultsVisible(true);
                  }}
                  onFocus={() => setSearchResultsVisible(true)}
                  onBlur={() => setTimeout(() => setSearchResultsVisible(false), 200)}
                  className={`w-full border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 py-2 ${isRTL ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'}`}
                />
                <SearchIcon className={`w-5 h-5 text-gray-400 absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'}`} />
              </div>

              {searchResultsVisible && searchTerm && filteredItems.length > 0 && (
                <div className="absolute z-50 w-full md:w-1/2 lg:w-1/3 bg-white border border-gray-200 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-xl animate-fade-in">
                  <div className="p-2 bg-rose-50 border-b border-rose-100 sticky top-0 z-10">
                    <p className="text-sm font-medium text-rose-800">
                      {filteredItems.length} {t('sales.searchResults')}
                    </p>
                  </div>
                  {filteredItems.map(item => {
                    const getItemIcon = () => {
                      switch (item.type) {
                        case 'screen': return <Monitor className="w-4 h-4 text-orange-500" />;
                        case 'phone': return <Smartphone className="w-4 h-4 text-blue-500" />;
                        case 'accessory': return <Headphones className="w-4 h-4 text-purple-500" />;
                        case 'sticker': return <Sticker className="w-4 h-4 text-pink-500" />;
                        default: return <Package className="w-4 h-4 text-gray-500" />;
                      }
                    };

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => selectItem(item)}
                        className="p-3 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-0 transition flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.type === 'screen' ? 'bg-orange-50' :
                            item.type === 'phone' ? 'bg-blue-50' :
                              item.type === 'accessory' ? 'bg-purple-50' :
                                item.type === 'sticker' ? 'bg-pink-50' : 'bg-rose-50'
                            } group-hover:bg-white transition shadow-sm`}>
                            {getItemIcon()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-500 flex gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.type === 'screen' ? 'bg-orange-100 text-orange-700' :
                                item.type === 'phone' ? 'bg-blue-100 text-blue-700' :
                                  item.type === 'accessory' ? 'bg-purple-100 text-purple-700' :
                                    item.type === 'sticker' ? 'bg-pink-100 text-pink-700' : 'bg-rose-100 text-rose-700'
                                }`}>{getTypeName(item.type)}</span>
                              {item.barcode && <span>• {item.barcode}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-left rtl:text-right">
                          <div className={`text-sm font-medium ${item.quantity <= (item.minQuantity || 5) ? 'text-red-600' : 'text-green-600'}`}>
                            {t('sales.itemsCount', { count: item.quantity })}
                          </div>
                          <div className="text-[10px] text-gray-400">{(item.cost || 0).toFixed(2)} {t('dashboard.currency')}</div>
                        </div>
                      </div>
                    );
                  })}
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
                        <span className="font-medium">{t('sales.available')}</span>
                        <span className="font-bold">{itemId ? (findStockById(itemId)?.quantity ?? '---') : '---'}</span>
                      </div>
                    </div>
                    <button onClick={() => { setFormData({ ...formData, item: '' }); setItemId(null); setItemType(''); }} className="text-red-500 p-1.5 rounded-full hover:bg-red-50">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.quantity')}</label>
                  <input type="number" value={formData.quantity} onChange={e => { setFormData({ ...formData, quantity: e.target.value }); setStockError(''); }} className="w-full border p-2 rounded-lg" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.cost')}</label>
                  <input type="number" value={itemCost.toFixed(2)} readOnly className="w-full border p-2 rounded-lg bg-gray-100 text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.price')}</label>
                  <input type="number" value={formData.price} onChange={e => { setFormData({ ...formData, price: e.target.value }); setStockError(''); }} className="w-full border p-2 rounded-lg border-rose-300 focus:ring-rose-500" step="0.01" min="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.expectedProfit')}</label>
                  <div className={`w-full border p-2 rounded-lg font-bold ${(parseFloat(formData.price) - itemCost) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {((parseFloat(formData.price) || 0) - itemCost).toFixed(2)} {t('dashboard.currency')}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <button onClick={addToCart} className="w-full bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 font-bold flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('sales.addToCart')}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.discount')}</label>
                <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="w-full border p-2 rounded-lg" step="0.01" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.discountType')}</label>
                <select value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })} className="w-full border p-2 rounded-lg">
                  <option value="percentage">{t('sales.percentage')}</option>
                  <option value="amount">{t('sales.amount')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customerName')}</label>
              <input type="text" value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} className="w-full border p-2 rounded-lg" placeholder={t('sales.customerName')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.paymentMethod')}</label>
              <select value={formData.paymentMethod} onChange={e => { setFormData({ ...formData, paymentMethod: e.target.value }); setStockError(''); }} className="w-full border p-2 rounded-lg" required>
                <option value="">{t('sales.selectPayment')}</option>
                <option value="cash">{t('sales.cash')}</option>
                <option value="card">{t('sales.card')}</option>
                <option value="bank">{t('sales.bankTransfer')}</option>
                <option value="mobile">{t('sales.wallet')}</option>
              </select>
            </div>

            {cart.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-2">{t('sales.cart')}</h4>
                <div className="space-y-2">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{c.item}</div>
                        <div className="text-sm text-gray-500">{getTypeName(c.itemType)} - {c.price.toFixed(2)} {t('dashboard.currency')}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {editingCartIndex === idx ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-20 border p-1 rounded" />
                            <input type="number" min="0.01" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-28 border p-1 rounded" />
                            <button onClick={() => {
                              const newCart = [...cart];
                              newCart[idx] = { ...newCart[idx], quantity: parseInt(editQty) || 0, price: parseFloat(editPrice) || 0 };
                              setCart(newCart);
                              setEditingCartIndex(null);
                            }} className="bg-rose-500 text-white px-3 py-1 rounded">{t('common.save')}</button>
                            <button onClick={() => setEditingCartIndex(null)} className="bg-gray-200 px-3 py-1 rounded">{t('common.cancel')}</button>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-rose-600">{c.quantity}</div>
                            <button onClick={() => { setEditingCartIndex(idx); setEditQty(String(c.quantity)); setEditPrice(String(c.price)); }} className="text-rose-600 hover:text-rose-800">{t('common.edit')}</button>
                            <button onClick={() => removeFromCart(c.id, c.itemType)} className="text-red-500 hover:text-red-700">{t('common.delete')}</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(cart.length > 0 || (formData.item && formData.quantity && formData.price)) && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-200">
                <h4 className="font-bold text-rose-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-rose-500" />
                  {t('sales.summary')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('sales.subtotal')}</span>
                    <span>{(cart.length > 0 ? cartSubtotal : previewRawTotal).toFixed(2)} {t('dashboard.currency')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span className="text-gray-800">{t('sales.finalTotal')}</span>
                    <span className="text-rose-600">{(cart.length > 0 ? cartDiscounted : previewDiscounted).toFixed(2)} {t('dashboard.currency')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={addSale}
                disabled={cart.length === 0 || !formData.paymentMethod || loadingInvoice}
                className={`flex-1 py-3 rounded-lg font-bold text-lg transition ${(cart.length > 0 && formData.paymentMethod && !loadingInvoice) ? 'bg-rose-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {loadingInvoice ? t('common.loading') : t('sales.registerSale')}
              </button>
              <button onClick={cancelSale} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold text-lg hover:bg-gray-300">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* سجل المبيعات */}
      {/* سجل المبيعات - Desktop Only */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-x-auto">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="font-bold text-lg">{t('sales.history')}</h4>
        </div>
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-100">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('sales.date')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('sales.product')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.total')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('sales.customerName')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(data.sales || []).slice().reverse().map(sale => (
              <tr key={sale._id || sale.id} className="border-b hover:bg-gray-50">
                <td className="p-4 whitespace-nowrap text-sm">
                  {new Date(sale.date).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                </td>
                <td className="p-4 font-medium">
                  {sale.items ? (sale.items.length > 1 ? `${sale.items[0].item} +${sale.items.length - 1}` : sale.items[0].item) : sale.item}
                </td>
                <td className="p-4 font-bold text-rose-600">{(sale.total || 0).toFixed(2)} {t('dashboard.currency')}</td>
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

      {/* سجل المبيعات - Mobile Only Card View */}
      <div className="md:hidden space-y-4 pb-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-b flex justify-between items-center">
          <h4 className="font-bold text-lg">{t('sales.history')}</h4>
        </div>
        {(data.sales || []).length > 0 ? (
          (data.sales || []).slice().reverse().map(sale => (
            <div key={sale._id || sale.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(sale.date).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                  </p>
                  <h4 className="font-bold text-gray-900 mt-1">
                    {sale.items ? (sale.items.length > 1 ? `${sale.items[0].item} +${sale.items.length - 1}` : sale.items[0].item) : sale.item}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{sale.customer || '---'}</span>
                  </div>
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-rose-600 font-black text-lg">
                    {(sale.total || 0).toFixed(2)} {t('dashboard.currency')}
                  </p>
                  <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                    {sale.paymentMethod || t('sales.cash')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 uppercase text-xs font-bold">
                <button
                  onClick={() => showInvoice({ type: 'sale', data: sale })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg active:scale-95 transition-transform"
                >
                  <FileText className="w-4 h-4" />
                  {t('common.invoice') || 'فاتورة'}
                </button>
                <button
                  onClick={() => handleEditSale(sale._id || sale.id)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition-transform"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSale(sale._id || sale.id, sale.items ? sale.items[0].item : sale.item, sale.total, 0)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-95 transition-transform"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            {t('inventory.noItems')}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, saleId: null, saleItem: '', saleTotal: 0, saleQuantity: 0 })}
        onConfirm={confirmDeleteSale}
        title={t('inventory.confirmDelete')}
        message={t('inventory.deleteMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />

      {showPrintTemplates && (
        <PrintTemplates data={data} onClose={() => setShowPrintTemplates(false)} />
      )}
    </div>
  );
};

export default Sales;