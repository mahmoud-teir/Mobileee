'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Trash2, Search as SearchIcon, FileText, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Returns = ({ data, saveData }) => {
  const { t, language, isRTL } = useLanguage();
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

  // Return Reasons
  const returnReasons = [
    { id: 'defective', label: t('returns.reasons.defective') },
    { id: 'wrong', label: t('returns.reasons.wrong') },
    { id: 'unsatisfied', label: t('returns.reasons.unsatisfied') },
    { id: 'changeMind', label: t('returns.reasons.changeMind') },
    { id: 'betterPrice', label: t('returns.reasons.betterPrice') },
    { id: 'duplicate', label: t('returns.reasons.duplicate') },
    { id: 'other', label: t('returns.reasons.other') }
  ];

  // Filter Returns
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

  // Search for Sale
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
    // Select all items by default
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

  // Calculate Refund
  const calculateRefund = () => {
    if (!selectedItems.length) return 0;
    return selectedItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + (item.returnQty * item.price), 0);
  };

  // Add Return
  const addReturn = async () => {
    try {
      if (!selectedSale) {
        setError(t('returns.errorNoSale'));
        return;
      }

      const itemsToReturn = selectedItems.filter(item => item.selected);
      if (itemsToReturn.length === 0) {
        setError(t('returns.errorNoItems'));
        return;
      }

      if (!formData.reason) {
        setError(t('returns.errorNoReason'));
        return;
      }

      const refundAmount = formData.refundType === 'partial'
        ? parseFloat(formData.refundAmount) || 0
        : calculateRefund();

      const newReturn = {
        id: Date.now(),
        date: new Date().toISOString(),
        saleId: selectedSale._id || selectedSale.id,
        customerName: selectedSale.customer || t('common.unknown'),
        items: itemsToReturn.map(item => ({
          id: item.productId || item.id,
          item: item.item,
          itemType: item.type || item.itemType,
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

      // Add Return record
      const updatedReturns = [...(data.returns || []), newReturn];
      await saveData('returns', updatedReturns);

      // Restore quantities to stock
      for (const item of itemsToReturn) {
        const qty = item.returnQty;
        const type = item.type || item.itemType;
        const collection = type === 'screen' ? 'screens' : type === 'phone' ? 'phones' : type === 'sticker' ? 'stickers' : type === 'accessory' ? 'accessories' : 'products';
        const items = data[collection] || [];
        const updatedItems = items.map(i => (i._id || i.id) === (item.productId || item.id) ? { ...i, quantity: i.quantity + qty } : i);
        await saveData(collection, updatedItems);
      }

      // Reset form
      setShowAdd(false);
      setFormData({ saleId: '', reason: '', refundType: 'full', refundAmount: '', notes: '' });
      setSelectedSale(null);
      setSelectedItems([]);
      setError('');

      toast.success(t('returns.success'));
    } catch (error) {
      console.error('Error recording return:', error);
      toast.error(t('returns.errorRegister') || 'Error recording return');
    }
  };

  // Delete Return
  const handleDeleteReturn = (ret) => {
    setDeleteConfirmation({ isOpen: true, returnId: ret._id || ret.id });
  };

  const confirmDelete = async () => {
    try {
      const returnToDelete = (data.returns || []).find(r => (r._id || r.id) === deleteConfirmation.returnId);

      if (returnToDelete) {
        // Deduct quantities from stock (reverse return)
        for (const item of returnToDelete.items || []) {
          const qty = item.quantity;
          const type = item.itemType;
          const collection = type === 'screen' ? 'screens' : type === 'phone' ? 'phones' : type === 'sticker' ? 'stickers' : type === 'accessory' ? 'accessories' : 'products';
          const items = data[collection] || [];
          const updatedItems = items.map(i => (i._id || i.id) === (item.productId || item.id) ? { ...i, quantity: Math.max(0, i.quantity - qty) } : i);
          await saveData(collection, updatedItems);
        }
      }

      const updatedReturns = (data.returns || []).filter(r => (r._id || r.id) !== deleteConfirmation.returnId);
      await saveData('returns', updatedReturns);

      setDeleteConfirmation({ isOpen: false, returnId: null });
      toast.success(t('returns.successDelete'));
    } catch (error) {
      console.error('Error deleting return:', error);
      toast.error(t('returns.errorDelete'));
    }
  };

  const totalReturns = (data.returns || []).reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <RotateCcw className="w-8 h-8 text-orange-500" />
          {t('returns.title')}
        </h2>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-orange-500 text-white px-6 py-3 rounded-lg">
            <p className="text-sm">{t('returns.totalReturns')}</p>
            <p className="text-2xl font-bold">{totalReturns.toFixed(2)} {t('dashboard.currency')}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" />
            {t('returns.newReturn')}
          </button>
        </div>
      </div>

      {/* New Return Form */}
      {showAdd && (
        <div className={`bg-white p-6 rounded-xl shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <RotateCcw className="text-orange-500" />
              {t('returns.addTitle')}
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
            {/* Search for Sale */}
            {!selectedSale ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('returns.selectSale')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('returns.searchSalePlaceholder')}
                    onChange={(e) => setFormData({ ...formData, saleId: e.target.value })}
                    className={`w-full border p-3 rounded-lg ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'}`}
                  />
                  <SearchIcon className={`w-5 h-5 text-gray-400 absolute top-3.5 ${isRTL ? 'left-3' : 'right-3'}`} />
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
                          <span className="font-medium">{t('nav.sales')} #{sale._id || sale.id}</span>
                          <span className="text-orange-600 font-bold">{sale.total?.toFixed(2)} {t('dashboard.currency')}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.customer || t('common.unknown')} - {new Date(sale.date).toLocaleDateString(language)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {sale.items?.map(i => i.item).join(', ')}
                        </div>
                      </div>
                    ))}
                    {searchSales(formData.saleId).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        {t('returns.noSalesFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected Sale */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-orange-800">{t('returns.saleSelected')} #{selectedSale._id || selectedSale.id}</h4>
                      <p className="text-sm text-gray-600">{selectedSale.customer || t('common.unknown')}</p>
                      <p className="text-sm text-gray-500">{new Date(selectedSale.date).toLocaleDateString(language)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSale(null);
                        setSelectedItems([]);
                      }}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                </div>

                {/* Select Items for Return */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('returns.selectItems')}
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
                            <span className={`text-sm text-gray-500 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                              ({item.price?.toFixed(2)} {t('dashboard.currency')})
                            </span>
                          </div>
                          {item.selected && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">{t('inventory.quantity')}:</label>
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

                {/* Return Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('returns.reason')}
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full border p-3 rounded-lg"
                  >
                    <option value="">{t('returns.selectReason')}</option>
                    {returnReasons.map(reason => (
                      <option key={reason.id} value={reason.label}>{reason.label}</option>
                    ))}
                  </select>
                </div>

                {/* Refund Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('returns.refundType')}
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="full"
                        checked={formData.refundType === 'full'}
                        onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
                      />
                      {t('returns.refundFull')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="partial"
                        checked={formData.refundType === 'partial'}
                        onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
                      />
                      {t('returns.refundPartial')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="exchange"
                        checked={formData.refundType === 'exchange'}
                        onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
                      />
                      {t('returns.exchange')}
                    </label>
                  </div>
                </div>

                {/* Partial Refund Amount */}
                {formData.refundType === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('returns.refundAmount')}
                    </label>
                    <input
                      type="number"
                      value={formData.refundAmount}
                      onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                      placeholder={t('common.amount') || 'Amount'}
                      className="w-full border p-3 rounded-lg"
                      max={calculateRefund()}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('returns.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('returns.notesPlaceholder') || 'Notes'}
                    className="w-full border p-3 rounded-lg"
                    rows="2"
                  />
                </div>

                {/* Refund Summary */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="font-bold text-orange-800 mb-2">{t('returns.summary')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('returns.itemCount')}:</span>
                      <span className="font-medium">
                        {selectedItems.filter(i => i.selected).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('returns.totalQty')}:</span>
                      <span className="font-medium">
                        {selectedItems.filter(i => i.selected).reduce((s, i) => s + i.returnQty, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-orange-200">
                      <span>{t('returns.refundAmount')}:</span>
                      <span className="text-orange-600">
                        {formData.refundType === 'partial'
                          ? (parseFloat(formData.refundAmount) || 0).toFixed(2)
                          : calculateRefund().toFixed(2)} {t('dashboard.currency')}
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

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={addReturn}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-amber-600"
                  >
                    {t('returns.confirmReturn')}
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
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="relative">
          <input
            type="text"
            placeholder={t('returns.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border p-3 rounded-lg ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'}`}
          />
          <SearchIcon className={`w-5 h-5 text-gray-400 absolute top-3.5 ${isRTL ? 'left-3' : 'right-3'}`} />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-100">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.date')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('nav.sales')} #</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('customers.name') || t('common.name')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('nav.inventory')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('returns.reason')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('returns.refundType')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.total')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length > 0 ? (
              filteredReturns.map(ret => (
                <tr key={ret._id || ret.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-sm">
                    {new Date(ret.date).toLocaleDateString(language, {
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
                      {ret.refundType === 'full' ? t('returns.refundFull') :
                       ret.refundType === 'partial' ? t('returns.refundPartial') : t('returns.exchange')}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-orange-600">
                    {ret.refundAmount?.toFixed(2)} {t('dashboard.currency')}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteReturn(ret)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full"
                      title={t('common.delete')}
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
                    <p className="text-xl font-medium">{t('returns.noReturnsFound') || 'No returns found'}</p>
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
        title={t('returns.deleteTitle')}
        message={t('returns.deleteMsg')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default Returns;
