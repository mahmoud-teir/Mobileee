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
        <div className={`bg-white p-6 rounded-xl shadow-lg border border-orange-100 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-orange-800">
              <RotateCcw className="text-orange-500" />
              {t('returns.addTitle')}
            </h3>
            <button onClick={() => {
              setShowAdd(false);
              setSelectedSale(null);
              setSelectedItems([]);
              setError('');
            }} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition">
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
                    className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none ${isRTL ? 'pr-3 pl-10' : 'pl-3 pr-10'}`}
                  />
                  <SearchIcon className={`w-5 h-5 text-gray-400 absolute top-3.5 ${isRTL ? 'left-3' : 'right-3'}`} />
                </div>

                {formData.saleId && (
                  <div className="mt-2 border rounded-xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                    {searchSales(formData.saleId).map(sale => (
                      <div
                        key={sale._id || sale.id}
                        onClick={() => selectSale(sale)}
                        className="p-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0 transition"
                      >
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-800">{t('nav.sales')} #{sale._id || sale.id}</span>
                          <span className="text-orange-600 font-black">{sale.total?.toFixed(2)} {t('dashboard.currency')}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {sale.customer || t('common.unknown')} - {new Date(sale.date).toLocaleDateString(language)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {sale.items?.map(i => i.item).join(', ')}
                        </div>
                      </div>
                    ))}
                    {searchSales(formData.saleId).length === 0 && (
                      <div className="p-4 text-center text-gray-400 bg-gray-50">
                        {t('returns.noSalesFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected Sale */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-orange-800 text-lg uppercase tracking-tight">{t('returns.saleSelected')} #{selectedSale._id || selectedSale.id}</h4>
                      <p className="font-medium text-gray-700">{selectedSale.customer || t('common.unknown')}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(selectedSale.date).toLocaleDateString(language)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSale(null);
                        setSelectedItems([]);
                      }}
                      className="px-3 py-1 bg-white text-orange-600 border border-orange-200 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-100 transition"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                </div>

                {/* Select Items for Return */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    {t('returns.selectItems')}
                  </label>
                  <div className="grid gap-3">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-xl transition-all ${item.selected ? 'border-orange-400 bg-orange-50/50 shadow-sm' : 'border-gray-100 bg-white'}`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItemSelection(index)}
                            className="w-6 h-6 accent-orange-600 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-gray-900">{item.item}</span>
                            <div className="text-sm font-black text-orange-600">
                              {item.price?.toFixed(2)} {t('dashboard.currency')}
                            </div>
                          </div>
                          {item.selected && (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-inner">
                                <input
                                  type="number"
                                  min="1"
                                  max={selectedSale?.items?.[index]?.quantity || 1}
                                  value={item.returnQty}
                                  onChange={(e) => updateReturnQty(index, e.target.value)}
                                  className="w-12 bg-transparent text-center font-bold outline-none"
                                />
                                <span className="text-xs text-gray-400 border-l pl-2">
                                  / {selectedSale?.items?.[index]?.quantity || 1}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return Reason & Refund Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('returns.reason')}
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white shadow-sm"
                    >
                      <option value="">{t('returns.selectReason')}</option>
                      {returnReasons.map(reason => (
                        <option key={reason.id} value={reason.label}>{reason.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('returns.refundType')}
                    </label>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                      {['full', 'partial', 'exchange'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFormData({ ...formData, refundType: type })}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all ${formData.refundType === type ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                          {type === 'full' ? t('returns.refundFull') :
                            type === 'partial' ? t('returns.refundPartial') : t('returns.exchange')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Partial Refund Amount */}
                {formData.refundType === 'partial' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('returns.refundAmount')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.refundAmount}
                        onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                        placeholder="0.00"
                        className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-orange-600 text-lg"
                        max={calculateRefund()}
                      />
                      <span className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 font-bold`}>{t('dashboard.currency')}</span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('returns.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('returns.notesPlaceholder') || 'Notes'}
                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                    rows="2"
                  />
                </div>

                {/* Refund Summary */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-5 rounded-2xl text-white shadow-lg shadow-orange-200">
                  <h4 className="font-bold border-b border-white/20 pb-2 mb-3 tracking-widest uppercase text-xs opacity-90">{t('returns.summary')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="opacity-80 text-sm">{t('returns.itemCount')}</span>
                      <span className="font-black">
                        {selectedItems.filter(i => i.selected).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-80 text-sm">{t('returns.totalQty')}</span>
                      <span className="font-black">
                        {selectedItems.filter(i => i.selected).reduce((s, i) => s + i.returnQty, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/20 mt-1">
                      <span className="font-bold text-lg">{t('returns.refundAmount')}</span>
                      <span className="text-3xl font-black">
                        {formData.refundType === 'partial'
                          ? (parseFloat(formData.refundAmount) || 0).toFixed(2)
                          : calculateRefund().toFixed(2)} {t('dashboard.currency')}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 font-bold">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={addReturn}
                    className="flex-[2] bg-gray-900 text-white py-4 rounded-xl font-black text-lg hover:bg-black transition shadow-xl active:scale-95"
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
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95"
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
      <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={t('returns.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border-none p-4 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none text-lg ${isRTL ? 'pr-4 pl-12' : 'pl-4 pr-12'}`}
          />
          <SearchIcon className={`w-6 h-6 text-gray-400 absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`} />
        </div>
      </div>

      {/* Table View (Desktop Only) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b uppercase text-xs font-bold text-gray-600">
            <tr>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.date')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('nav.sales')} #</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('customers.name') || t('common.name')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('nav.inventory')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('returns.reason')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('returns.refundType')}</th>
              <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.total')}</th>
              <th className={`p-4 ${isRTL ? 'text-center' : 'text-center'}`}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReturns.map(ret => (
              <tr key={ret._id || ret.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-xs text-gray-400 font-mono">
                  {new Date(ret.date).toLocaleDateString(language, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="p-4 font-bold text-indigo-600">#{ret.saleId}</td>
                <td className="p-4 font-bold text-gray-900">{ret.customerName}</td>
                <td className="p-4">
                  <div className="text-xs space-y-0.5">
                    {ret.items?.map((item, i) => (
                      <div key={i} className="text-gray-600">
                        • {item.item} <span className="font-bold">({item.quantity})</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-orange-100">
                    {ret.reason}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${ret.refundType === 'full' ? 'bg-green-50 text-green-700 border border-green-100' :
                    ret.refundType === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                    {ret.refundType === 'full' ? t('returns.refundFull') :
                      ret.refundType === 'partial' ? t('returns.refundPartial') : t('returns.exchange')}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-lg font-black text-orange-600">
                    {ret.refundAmount?.toFixed(2)} {t('dashboard.currency')}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleDeleteReturn(ret)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition active:scale-90"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredReturns.length === 0 && (
              <tr>
                <td colSpan="8" className="p-20 text-center text-gray-300">
                  <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-medium">{t('returns.noReturnsFound') || 'No returns found'}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card View (Mobile Only) */}
      <div className="md:hidden space-y-4 pb-4">
        {filteredReturns.length > 0 ? (
          filteredReturns.map(ret => (
            <div key={ret._id || ret.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400 font-mono">
                    {new Date(ret.date).toLocaleDateString(language, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <h4 className="font-bold text-gray-900 mt-1">{ret.customerName}</h4>
                  <p className="text-xs text-indigo-600 font-medium">#{ret.saleId}</p>
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-orange-600 font-black text-lg">
                    {ret.refundAmount?.toFixed(2)} {t('dashboard.currency')}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${ret.refundType === 'full' ? 'bg-green-100 text-green-700' :
                    ret.refundType === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {ret.refundType === 'full' ? t('returns.refundFull') :
                      ret.refundType === 'partial' ? t('returns.refundPartial') : t('returns.exchange')}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('nav.inventory')}</p>
                {ret.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{item.item}</span>
                    <span className="text-gray-500 font-bold">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-100">
                  {ret.reason}
                </span>
                <button
                  onClick={() => handleDeleteReturn(ret)}
                  className="p-2.5 bg-red-50 text-red-600 rounded-xl active:scale-95 transition-transform"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <RotateCcw className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p>{t('returns.noReturnsFound') || 'No returns found'}</p>
          </div>
        )}
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
