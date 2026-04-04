'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search as SearchIcon, Barcode, Tag, Settings, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import BarcodeGenerator from './BarcodeGenerator';
import CategoryManager from './CategoryManager';
import { useLanguage } from './LanguageContext';

const Inventory = ({ data, saveData, addItem: addItemToDb, updateItem: updateItemInDb, deleteItem: deleteItemFromDb, view: propView, setView: propSetView }) => {
  const { t, isRTL } = useLanguage();
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

  useEffect(() => {
    const isDynamic = !['screens', 'phones', 'stickers', 'accessories'].includes(view);
    
    let items = [];
    if (isDynamic) {
        items = (data.products || []).filter(p => (p.categoryId?._id || p.categoryId) === view);
    } else {
        items = view === 'screens' ? (data.screens || [])
              : view === 'phones' ? (data.phones || [])
              : view === 'stickers' ? (data.stickers || [])
              : (data.accessories || []);
    }
    
    // Helper to normalize Arabic text for better searching
    const normalizeArabic = (text) => {
      if (!text) return '';
      return text.toString().toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, ''); // Remove harakat
    };

    const filtered = items.filter(item => {
      const normalizedSearch = normalizeArabic(searchTerm);
      const keywords = normalizedSearch.split(/\s+/).filter(k => k.length > 0);
      
      const name = (item.model || item.name || '');
      const description = (item.description || '');
      const barcode = (item.barcode || '');
      const price = (item.cost || 0).toString();
      const quantity = (item.quantity || 0).toString();
      
      const textToSearch = normalizeArabic(`${name} ${description} ${barcode} ${price} ${quantity}`);
      
      return keywords.every(kw => textToSearch.includes(kw));
    });
    
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
        toast.error(t('inventory.errorName'));
        return;
      }

      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        toast.error(t('inventory.errorQuantity'));
        return;
      }

      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        toast.error(t('inventory.errorCost'));
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

      if (editingItemId) {
        if (updateItemInDb) {
          await updateItemInDb(collectionKey, editingItemId, newItem);
        } else {
          const items = data[collectionKey] || [];
          const updatedItems = items.map(i => (i.id === editingItemId || i._id === editingItemId) ? { ...i, ...newItem } : i);
          await saveData(collectionKey, updatedItems);
        }
        setEditingItemId(null);
        toast.success(t('inventory.updateSuccess'));
      } else {
        if (addItemToDb) {
          await addItemToDb(collectionKey, newItem);
        } else {
          const items = data[collectionKey] || [];
          const updatedItems = [...items, { id: Date.now(), created_at: new Date().toISOString(), ...newItem }];
          await saveData(collectionKey, updatedItems);
        }
        toast.success(t('inventory.addSuccess'));
      }

      setShowAdd(false);
      setFormData({});
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
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
        toast.success(t('inventory.deleteSuccess').replace('{name}', deleteConfirmation.itemName));
        setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '', itemType: '' });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('login.errorGeneric') + ': ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">{t('inventory.title')}</h2>
        <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryManager(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
              title={t('inventory.categories')}
            >
              <Settings className="w-5 h-5" />
              {t('inventory.categories')}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              {t('inventory.addItem')}
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { id: 'screens', name: t('inventory.screens'), count: (data.screens || []).length },
          { id: 'phones', name: t('inventory.phones'), count: (data.phones || []).length },
          { id: 'stickers', name: t('inventory.stickers'), count: (data.stickers || []).length },
          { id: 'accessories', name: t('inventory.accessories'), count: (data.accessories || []).length }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setView(cat.id)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${view === cat.id ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
        
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

      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('inventory.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border p-3 rounded-xl ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <SearchIcon className={`w-6 h-6 text-gray-400 absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5`} />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSortField('name');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors"
            >
              <span>{t('inventory.name')}</span>
              {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('quantity');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors"
            >
              <span>{t('inventory.quantity')}</span>
              {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('cost');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors"
            >
              <span>{t('inventory.cost')}</span>
              {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-50 ring-4 ring-blue-50/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="text-blue-500" />
            {editingItemId ? t('inventory.editItem') : t('inventory.addItem')} {
              ['screens', 'phones', 'stickers', 'accessories'].includes(view) 
                ? (view === 'screens' ? t('inventory.screen') : view === 'phones' ? t('inventory.phone') : view === 'stickers' ? t('inventory.sticker') : t('inventory.accessory'))
                : (data.categories?.find(c => c._id === view)?.name || t('inventory.product'))
            }
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={view === 'screens' ? t('inventory.model') : t('inventory.name')}
              value={formData.model || formData.name || ''}
              onChange={e => setFormData({
                ...formData, 
                [view === 'screens' ? 'model' : 'name']: e.target.value
              })}
              className={`border p-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
              required
            />
            <input
              type="number"
              placeholder={t('inventory.quantity')}
              value={formData.quantity || ''}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              className={`border p-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
              required
              min="1"
            />
            <input
              type="number"
              placeholder={t('inventory.cost')}
              value={formData.cost || ''}
              onChange={e => setFormData({...formData, cost: e.target.value})}
              className={`border p-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
              required
              min="0.01"
              step="0.01"
            />
            <textarea
              placeholder={t('inventory.description')}
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className={`border p-2 rounded-xl md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
              rows="2"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={addItem} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 flex-1 font-bold shadow-sm transition-colors">
              {t('common.save')}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingItemId(null); setFormData({}); }} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-200 flex-1 font-bold transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Table View (Desktop Only) */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-100">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-gray-500 font-semibold`}>{t('inventory.name')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-gray-500 font-semibold cursor-pointer`} onClick={() => {
                setSortField('quantity');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                {t('inventory.quantity')} {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-gray-500 font-semibold cursor-pointer`} onClick={() => {
                setSortField('cost');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                {t('inventory.cost')} {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-gray-500 font-semibold`}>{t('inventory.status')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-gray-500 font-semibold`}>{t('inventory.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item._id || item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className={`p-4 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div>
                      <p className="text-gray-900">{item.model || item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td className={`p-4 font-bold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>{item.quantity}</td>
                  <td className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{(item.cost || 0).toFixed(2)} {t('dashboard.currency')}</td>
                  <td className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {item.quantity === 0 ? (
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">{t('inventory.outOfStock')}</span>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-100">{t('inventory.available')}</span>
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
                      title={t('inventory.generateBarcode')}
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-blue-500 hover:text-blue-700 p-2 font-medium"
                      title={t('inventory.edit')}
                    >
                      {t('inventory.edit')}
                    </button>
                    <button
                      onClick={() => {
                        const type = ['screens', 'phones', 'stickers', 'accessories'].includes(view) ? (view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory') : 'dynamic';
                        handleDeleteItem(item, item.model || item.name, type);
                      }}
                      className="text-red-500 hover:text-red-700 p-2"
                      title={t('inventory.delete')}
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
                       t('inventory.noResults').replace('{term}', searchTerm) :
                       t('inventory.noItems')
                    }
                  </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card View (Mobile Only) */}
      <div className="md:hidden space-y-4 pb-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item._id || item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{item.model || item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.quantity === 0 ? (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-100">{t('inventory.outOfStock')}</span>
                  ) : (
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-100">{t('inventory.available')}</span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">ID: {(item._id || item.id || '').substring(0, 8)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('inventory.quantity')}</span>
                  <span className="font-black text-gray-800 text-lg">{item.quantity}</span>
                </div>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('inventory.cost')}</span>
                  <span className="font-black text-rose-600 text-lg">{(item.cost || 0).toFixed(2)} {t('dashboard.currency')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBarcode({
                      ...item,
                      name: item.model || item.name,
                      type: ['screens', 'phones', 'stickers', 'accessories'].includes(view) ? (view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory') : view
                    })}
                    className="p-2.5 bg-purple-50 text-purple-600 rounded-xl active:scale-95 transition-transform"
                  >
                    <Barcode className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95 transition-transform"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    const type = ['screens', 'phones', 'stickers', 'accessories'].includes(view) ? (view === 'screens' ? 'screen' : view === 'phones' ? 'phone' : view === 'stickers' ? 'sticker' : 'accessory') : 'dynamic';
                    handleDeleteItem(item, item.model || item.name, type);
                  }}
                  className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-xl active:scale-95 transition-transform px-4 font-bold text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('inventory.delete')}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            {searchTerm ? t('inventory.noResults').replace('{term}', searchTerm) : t('inventory.noItems')}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '', itemType: '' })}
        onConfirm={confirmDelete}
        title={t('inventory.deleteConfirmTitle')}
        message={t('inventory.deleteConfirmMsg').replace('{name}', deleteConfirmation.itemName)}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />

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