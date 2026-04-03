'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search as SearchIcon, Barcode } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import BarcodeGenerator from './BarcodeGenerator';

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

  // تحديث العناصر المفلترة عند تغير البحث أو البيانات
  useEffect(() => {
    const items = view === 'screens' ? (data.screens || [])
                  : view === 'phones' ? (data.phones || [])
                  : view === 'stickers' ? (data.stickers || [])
                  : (data.accessories || []);
    
    const filtered = items.filter(item => {
      const name = item.model || item.name || '';
      const description = item.description || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.price.toString().includes(searchTerm) ||
             item.quantity.toString().includes(searchTerm);
    });
    
    // الفرز
    const sorted = filtered.sort((a, b) => {
      const fieldA = (a[sortField] || '').toString().toLowerCase();
      const fieldB = (b[sortField] || '').toString().toLowerCase();
      
      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
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

      const newItem = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        cost: parseFloat(formData.cost) || 0,
        name: formData.name?.trim() || formData.model?.trim() || '',
        model: formData.model?.trim() || formData.name?.trim() || '',
        description: formData.description?.trim() || ''
      };

      const collectionKey = view; // screens, phones, stickers, accessories

      // if editing, update existing item in MongoDB
      if (editingItemId) {
        if (updateItemInDb) {
          await updateItemInDb(collectionKey, editingItemId, newItem);
        } else {
          // Fallback to old method
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
          // Fallback to old method
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
      model: item.model,
      name: item.name,
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
        const collectionKey = deleteConfirmation.itemType === 'screen' ? 'screens'
                            : deleteConfirmation.itemType === 'phone' ? 'phones'
                            : deleteConfirmation.itemType === 'sticker' ? 'stickers'
                            : 'accessories';

        if (deleteItemFromDb) {
          // Delete from MongoDB directly
          await deleteItemFromDb(collectionKey, deleteConfirmation.itemId);
        } else {
          // Fallback to old method
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
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
          إضافة صنف جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => setView('screens')}
          className={`px-6 py-3 rounded-lg font-bold ${view === 'screens' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          الشاشات ({(data.screens || []).length})
        </button>
        <button
          onClick={() => setView('phones')}
          className={`px-6 py-3 rounded-lg font-bold ${view === 'phones' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          الجوالات ({(data.phones || []).length})
        </button>
        <button
          onClick={() => setView('stickers')}
          className={`px-6 py-3 rounded-lg font-bold ${view === 'stickers' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          الملصقات ({(data.stickers || []).length})
        </button>
        <button
          onClick={() => setView('accessories')}
          className={`px-6 py-3 rounded-lg font-bold ${view === 'accessories' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          الإكسسوارات ({(data.accessories || []).length})
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`ابحث عن ${view === 'screens' ? 'شاشة' : view === 'phones' ? 'جوال' : view === 'stickers' ? 'ملصق' : 'إكسسوار'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border p-3 rounded-lg pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-3.5" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSortField('name');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <span>الاسم</span>
              {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('quantity');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <span>الكمية</span>
              {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('cost');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <span>التكلفة</span>
              {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">إضافة {view === 'screens' ? 'شاشة' : 'إكسسوار'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={view === 'screens' ? 'نوع الجهاز' : 'اسم المنتج'}
              value={formData.model || formData.name || ''}
              onChange={e => setFormData({
                ...formData, 
                [view === 'screens' ? 'model' : 'name']: e.target.value
              })}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="number"
              placeholder="الكمية"
              value={formData.quantity || ''}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              min="1"
            />
            <input
              type="number"
              placeholder="سعر التكلفة (الشراء)"
              value={formData.cost || ''}
              onChange={e => setFormData({...formData, cost: e.target.value})}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              min="0.01"
              step="0.01"
            />
            <textarea
              placeholder="وصف المنتج"
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="border p-2 rounded md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addItem} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex-1">
              حفظ
            </button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 flex-1">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* تنبيهات المخزون */}
      {/* تحذيرات الحد الأدنى أُلغيت — لا يظهر أي تنبيه */}

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-right">الاسم</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => {
                setSortField('quantity');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                الكمية {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 text-right cursor-pointer" onClick={() => {
                setSortField('cost');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                سعر التكلفة {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 text-right">الحالة</th>
              <th className="p-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item._id || item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">
                    <div>
                      <p>{item.model || item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-800">{item.quantity}</td>
                  <td className="p-4">{(item.cost || 0).toFixed(2)} ₪</td>
                  <td className="p-4">
                    {item.quantity === 0 ? (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">غير متوفر</span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">متوفر</span>
                    )}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <button
                      onClick={() => setShowBarcode({
                        ...item,
                        name: item.model || item.name,
                        type: view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory'
                      })}
                      className="text-purple-500 hover:text-purple-700"
                      title="توليد باركود"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-blue-500 hover:text-blue-700"
                      title="تعديل الصنف"
                    >
                      تحرير
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item, item.model || item.name, view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory')}
                      className="text-red-500 hover:text-red-700"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    {searchTerm ? 
                      `لم يتم العثور على ${view === 'screens' ? 'شاشات' : view === 'phones' ? 'جوالات' : view === 'stickers' ? 'ملصقات' : 'إكسسوارات'} تطابق "${searchTerm}"` :
                      `لا توجد ${view === 'screens' ? 'شاشات' : view === 'phones' ? 'جوالات' : view === 'stickers' ? 'ملصقات' : 'إكسسوارات'} في المخزون. أضف صنفاً جديداً.`
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
    </div>
  );
};

export default Inventory;