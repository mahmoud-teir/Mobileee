'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search as SearchIcon, Barcode, Tag, Settings } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import BarcodeGenerator from './BarcodeGenerator';
import CategoryManager from './CategoryManager';

const Inventory = ({ data, saveData, addItem: addItemToDb, updateItem: updateItemInDb, deleteItem: deleteItemFromDb, view: propView, setView: propSetView }) => {
  const [localView, setLocalView] = useState('screens');
  const view = propView || localView;
  const setView = propSetView || setLocalView;
  
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    itemId: null,
    itemName: '',
    itemType: ''
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showBarcode, setShowBarcode] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // تحديث العناصر المفلترة عند تغير البحث أو البيانات
  useEffect(() => {
    const isDynamic = !['screens', 'phones', 'stickers', 'accessories'].includes(view);
    
    let items = [];
    if (isDynamic) {
        // Find products belonging to this category
        items = (data.products || []).filter(p => (p.categoryId?._id || p.categoryId) === view);
    } else {
        items = view === 'screens' ? (data.screens || [])
              : view === 'phones' ? (data.phones || [])
              : view === 'stickers' ? (data.stickers || [])
              : (data.accessories || []);
    }
    
    const filtered = items.filter(item => {
      const name = item.model || item.name || '';
      const description = item.description || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.cost || 0).toString().includes(searchTerm) ||
             (item.quantity || 0).toString().includes(searchTerm);
    });
    
    // الفرز
    const sorted = [...filtered].sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredItems(sorted);
  }, [searchTerm, data, view, sortField, sortOrder]);

  const addItem = async () => {
    try {
      if (!formData.name && !formData.model) {
        alert('يرجى إدخال اسم الصنف');
        return;
      }

      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        alert('يرجى إدخال كمية صالحة');
        return;
      }

      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        alert('يرجى إدخال سعر التكلفة');
        return;
      }

      const isDynamic = !['screens', 'phones', 'stickers', 'accessories'].includes(view);
      const collectionKey = isDynamic ? 'products' : view;

      const newItem = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        cost: parseFloat(formData.cost) || 0,
        name: formData.name?.trim() || formData.model?.trim() || '',
        model: formData.model?.trim() || formData.name?.trim() || '',
        description: formData.description?.trim() || '',
        ...(isDynamic ? { categoryId: view } : {})
      };

      // if editing, update existing item in MongoDB
      if (editingItemId) {
        if (updateItemInDb) {
          await updateItemInDb(collectionKey, editingItemId, newItem);
        } else {
          // Fallback
          const items = data[collectionKey] || [];
          const updatedItems = items.map(i => (i.id === editingItemId || i._id === editingItemId) ? { ...i, ...newItem } : i);
          await saveData(collectionKey, updatedItems);
        }
        setEditingItemId(null);
        alert('تم تحديث الصنف بنجاح!');
      } else {
        // Add new item to MongoDB
        if (addItemToDb) {
          await addItemToDb(collectionKey, newItem);
        } else {
          // Fallback
          const items = data[collectionKey] || [];
          const updatedItems = [...items, { id: Date.now(), created_at: new Date().toISOString(), ...newItem }];
          await saveData(collectionKey, updatedItems);
        }
        alert('تمت إضافة الصنف بنجاح!');
      }

      setShowAdd(false);
      setFormData({});
    } catch (error) {
      console.error('خطأ في إضافة الصنف:', error);
      alert('حدث خطأ أثناء إضافة الصنف: ' + error.message);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item._id || item.id);
    setFormData({
      model: item.model || item.name,
      name: item.name || item.model,
      quantity: item.quantity,
      cost: item.cost || 0,
      price: item.price,
      description: item.description
    });
    setShowAdd(true);
  };

  const handleDeleteItem = (item, name, type) => {
    setDeleteConfirmation({
      isOpen: true,
      itemId: item._id || item.id,
      itemName: name,
      itemType: type
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirmation.itemId) {
        const isDynamic = !['screen', 'phone', 'sticker', 'accessory'].includes(deleteConfirmation.itemType);
        const collectionKey = isDynamic ? 'products' : 
                            deleteConfirmation.itemType === 'screen' ? 'screens'
                            : deleteConfirmation.itemType === 'phone' ? 'phones'
                            : deleteConfirmation.itemType === 'sticker' ? 'stickers'
                            : 'accessories';

        if (deleteItemFromDb) {
          await deleteItemFromDb(collectionKey, deleteConfirmation.itemId);
        } else {
          const items = data[collectionKey] || [];
          const updatedItems = items.filter(i => i.id !== deleteConfirmation.itemId && i._id !== deleteConfirmation.itemId);
          await saveData(collectionKey, updatedItems);
        }
        setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '', itemType: '' });
      }
    } catch (error) {
      console.error('خطأ في حذف الصنف:', error);
      alert('حدث خطأ أثناء حذف الصنف: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">إدارة المخزون</h2>
        <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryManager(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
              title="إدارة الأقسام"
            >
              <Settings className="w-5 h-5" />
              الأقسام
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              إضافة صنف
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { id: 'screens', name: 'الشاشات', count: (data.screens || []).length },
          { id: 'phones', name: 'الجوالات', count: (data.phones || []).length },
          { id: 'stickers', name: 'الملصقات', count: (data.stickers || []).length },
          { id: 'accessories', name: 'الإكسسوارات', count: (data.accessories || []).length }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setView(cat.id)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${view === cat.id ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
        
        {/* Dynamic Category Tabs */}
        {(data.categories || []).map(cat => (
          <button
            key={cat._id}
            onClick={() => setView(cat._id)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${view === cat._id ? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100'}`}
          >
            <Tag className="w-4 h-4" />
            {cat.name} ({(data.products || []).filter(p => (p.categoryId?._id || p.categoryId) === cat._id).length})
          </button>
        ))}
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`ابحث في هذا القسم...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border p-3 rounded-xl pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-gray-200"
            />
            <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-3.5" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSortField('name');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors"
            >
              <span>الاسم</span>
              {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('quantity');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors"
            >
              <span>الكمية</span>
              {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('cost');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors"
            >
              <span>التكلفة</span>
              {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-50 ring-4 ring-blue-50/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="text-blue-500" />
            {editingItemId ? 'تعديل' : 'إضافة'} {
              ['screens', 'phones', 'stickers', 'accessories'].includes(view) 
                ? (view === 'screens' ? 'شاشة' : view === 'phones' ? 'جوال' : view === 'stickers' ? 'ملصق' : 'إكسسوار')
                : (data.categories?.find(c => c._id === view)?.name || 'صنف')
            }
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={view === 'screens' ? 'نوع الجهاز' : 'اسم المنتج'}
              value={formData.model || formData.name || ''}
              onChange={e => setFormData({
                ...formData, 
                [view === 'screens' ? 'model' : 'name']: e.target.value
              })}
              className="border p-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200"
              required
            />
            <input
              type="number"
              placeholder="الكمية"
              value={formData.quantity || ''}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              className="border p-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200"
              required
              min="1"
            />
            <input
              type="number"
              placeholder="سعر التكلفة (الشراء)"
              value={formData.cost || ''}
              onChange={e => setFormData({...formData, cost: e.target.value})}
              className="border p-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200"
              required
              min="0.01"
              step="0.01"
            />
            <textarea
              placeholder="وصف المنتج"
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="border p-2 rounded-xl md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200"
              rows="2"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={addItem} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex-1 font-bold shadow-sm transition-colors">
              حفظ
            </button>
            <button onClick={() => { setShowAdd(false); setEditingItemId(null); setFormData({}); }} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-200 flex-1 font-bold transition-colors">
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-100">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-right text-gray-500 font-semibold">الاسم</th>
              <th className="p-4 text-right text-gray-500 font-semibold cursor-pointer" onClick={() => {
                setSortField('quantity');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                الكمية {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 text-right text-gray-500 font-semibold cursor-pointer" onClick={() => {
                setSortField('cost');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                سعر التكلفة {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 text-right text-gray-500 font-semibold">الحالة</th>
              <th className="p-4 text-right text-gray-500 font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item._id || item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">
                    <div>
                      <p className="text-gray-900">{item.model || item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-800">{item.quantity}</td>
                  <td className="p-4">{(item.cost || 0).toFixed(2)} ₪</td>
                  <td className="p-4">
                    {item.quantity === 0 ? (
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">غير متوفر</span>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-100">متوفر</span>
                    )}
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <button
                      onClick={() => setShowBarcode({
                        ...item,
                        name: item.model || item.name,
                        type: ['screens', 'phones', 'stickers', 'accessories'].includes(view) ? (view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory') : view
                      })}
                      className="text-purple-500 hover:text-purple-700 bg-purple-50 p-2 rounded-lg"
                      title="توليد باركود"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-blue-500 hover:text-blue-700 p-2"
                      title="تعديل الصنف"
                    >
                      تحرير
                    </button>
                    <button
                      onClick={() => {
                        const type = ['screens', 'phones', 'stickers', 'accessories'].includes(view) ? (view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory') : 'dynamic';
                        handleDeleteItem(item, item.model || item.name, type);
                      }}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400">
                    {searchTerm ? 
                       `لا توجد نتائج بحث تطابق "${searchTerm}"` :
                       `لا توجد أصناف في هذا القسم حالياً.`
                    }
                  </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '', itemType: '' })}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deleteConfirmation.itemName}"؟ سيتم حذف هذا الصنف نهائياً من المخزون.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />

      {/* مودال الباركود */}
      {showBarcode && (
        <BarcodeGenerator
          item={showBarcode}
          onClose={() => setShowBarcode(null)}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={data.categories || []}
          addItem={addItemToDb}
          deleteItem={deleteItemFromDb}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
};

export default Inventory;