import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, AlertCircle, Search as SearchIcon, Package, X, Edit, CheckCircle, Database, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Repairs = ({ data, saveData, showInvoice }) => {
  const { t, language, isRTL } = useLanguage();

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ 
    status: t('repairs.statusInRepair') || 'قيد الصيانة', 
    paid: false, 
    useScreen: false 
  });

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

  const statusOptions = [
    { key: 'statusInRepair', label: t('repairs.statusInRepair') || 'قيد الصيانة' },
    { key: 'statusReady', label: t('repairs.statusReady') || 'جاهز' },
    { key: 'statusDelivered', label: t('repairs.statusDelivered') || 'تم التسليم' },
    { key: 'statusCancelled', label: t('repairs.statusCancelled') || 'ملغاة' }
  ];

  // Helper to normalize Arabic text for better searching
  const normalizeArabic = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, ''); // Remove harakat
  };

  // Search Screens
  useEffect(() => {
    if (!showAdd || !formData.useScreen) return;

    const screens = (data.screens || []).filter(s => s.quantity > 0);

    if (searchTerm) {
      const normalizedSearch = normalizeArabic(searchTerm);
      const keywords = normalizedSearch.split(/\s+/).filter(k => k.length > 0);

      const results = screens.filter(screen => {
        const textToSearch = normalizeArabic(`${screen.model || ''} ${screen.name || ''} ${screen.description || ''}`);
        return keywords.every(kw => textToSearch.includes(kw));
      });
      setFilteredScreens(results);
      setSearchResultsVisible(true);
    } else {
      setFilteredScreens(screens);
      // Visibility controlled by focus
    }
  }, [searchTerm, showAdd, data.screens, formData.useScreen]);

  // Select Screen
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

  // Remove Selected Screen
  const removeSelectedScreen = () => {
    setSelectedScreen(null);
    setFormData({
      ...formData,
      screenId: null,
      screenName: '',
      screenCost: 0
    });
  };

  // Edit Repair
  const handleEditRepair = (repair) => {
    setEditingRepairId(repair._id || repair.id);
    setOriginalRepair(repair);
    setFormData({
      customerName: repair.customerName || '',
      phone: repair.phone || '',
      device: repair.device || '',
      problem: repair.problem || '',
      cost: repair.cost || '',
      status: repair.status || t('repairs.statusInRepair'),
      paid: repair.paid || false,
      useScreen: repair.useScreen || false,

      screenId: repair.screenId || null,
      screenName: repair.screenName || '',
      screenCost: repair.screenCost || 0,
      notes: repair.notes || ''
    });

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
      if (!formData.customerName?.trim()) {
        toast.error(t('customers.errorName'));
        return;
      }
      if (!formData.device?.trim()) {
        toast.error(t('repairs.errorDevice'));
        return;
      }
      if (!formData.problem?.trim()) {
        toast.error(t('repairs.errorProblem'));
        return;
      }
      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        toast.error(t('repairs.errorCost'));
        return;
      }

      const serviceCost = parseFloat(formData.cost) || 0;
      const screenCost = formData.useScreen && selectedScreen ? (parseFloat(formData.screenCost) || 0) : 0;
      const totalCost = serviceCost; 
      const profit = serviceCost - screenCost;

      if (editingRepairId) {
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

        const oldScreenId = originalRepair?.screenId;
        const newScreenId = formData.useScreen ? formData.screenId : null;
        const oldUseScreen = originalRepair?.useScreen;
        const newUseScreen = formData.useScreen;

        if (oldUseScreen && oldScreenId && oldScreenId !== newScreenId) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === oldScreenId ? { ...s, quantity: s.quantity + 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        if (newUseScreen && newScreenId && oldScreenId !== newScreenId) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === newScreenId ? { ...s, quantity: s.quantity - 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        if (oldUseScreen && oldScreenId && !newUseScreen) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === oldScreenId ? { ...s, quantity: s.quantity + 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        const updatedRepairs = data.repairs.map(r =>
          (r._id || r.id) === editingRepairId ? updatedRepair : r
        );
        await saveData('repairs', updatedRepairs);

        setShowAdd(false);
        setFormData({ status: t('repairs.statusInRepair'), paid: false, useScreen: false });
        setSelectedScreen(null);
        setSearchTerm('');
        setEditingRepairId(null);
        setOriginalRepair(null);
        toast.success(t('repairs.successUpdate'));

      } else {
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

        await saveData('repairs', [...data.repairs, newRepair]);

        if (formData.useScreen && selectedScreen) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === (selectedScreen._id || selectedScreen.id) ? { ...s, quantity: s.quantity - 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        setShowAdd(false);
        setFormData({ status: t('repairs.statusInRepair'), paid: false, useScreen: false });
        setSelectedScreen(null);
        setSearchTerm('');
        toast.success(t('repairs.successAdd'));
      }
    } catch (error) {
      console.error('Error saving repair:', error);
      toast.error(t('common.errorGeneric'));
    }
  };

  const updateStatus = (id, newStatusLabel) => {
    const updated = data.repairs.map(r =>
      (r._id || r.id) === id ? { ...r, status: newStatusLabel } : r
    );
    saveData('repairs', updated);
  };

  // Delete Repair Invoice
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

        if (repairToDelete && repairToDelete.useScreen && repairToDelete.screenId) {
          const updatedScreens = data.screens.map(s =>
            (s._id || s.id) === repairToDelete.screenId ? { ...s, quantity: s.quantity + 1 } : s
          );
          await saveData('screens', updatedScreens);
        }

        const updatedRepairs = data.repairs.filter(r => (r._id || r.id) !== deleteConfirmation.repairId);
        await saveData('repairs', updatedRepairs);

        setDeleteConfirmation({ isOpen: false, repairId: null, customerName: '', cost: 0 });
        toast.success(t('repairs.successDelete'));
      }
    } catch (error) {
      console.error('Error deleting repair:', error);
      toast.error(t('repairs.errorDelete'));
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-blue-600" />
          {t('repairs.title')}
        </h2>
        <button
          onClick={() => {
            setFormData({ status: t('repairs.statusInRepair'), paid: false, useScreen: false });
            setSelectedScreen(null);
            setEditingRepairId(null);
            setShowAdd(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md"
        >
          <Plus className="w-5 h-5" />
          {t('repairs.newRepair')}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="text-blue-500" />
            {editingRepairId ? t('repairs.editRepair') : t('repairs.newRepair')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('repairs.customerName')}</label>
              <input type="text" value={formData.customerName || ''} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('repairs.customerName')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('repairs.phone')}</label>
              <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('repairs.phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('repairs.device')}</label>
              <input type="text" value={formData.device || ''} onChange={e => setFormData({...formData, device: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('repairs.device')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('repairs.problem')}</label>
              <textarea value={formData.problem || ''} onChange={e => setFormData({...formData, problem: e.target.value})} className="w-full border p-2 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('repairs.problem')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('repairs.cost')}</label>
              <input type="number" value={formData.cost || ''} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('repairs.status')}</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                {statusOptions.map(opt => (
                  <option key={opt.key} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <input type="checkbox" checked={formData.useScreen} onChange={e => setFormData({...formData, useScreen: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                <span className="font-medium text-gray-700">{t('repairs.useScreen')}</span>
              </label>
            </div>

            {formData.useScreen && (
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-2">{t('repairs.searchScreen')}</label>
                {!selectedScreen ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={t('repairs.searchScreen')} 
                      value={searchTerm} 
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setSearchResultsVisible(true);
                      }} 
                      onFocus={() => setSearchResultsVisible(true)}
                      onBlur={() => setTimeout(() => setSearchResultsVisible(false), 200)}
                      className={`w-full border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none py-2 ${isRTL ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'}`} 
                    />
                    <SearchIcon className={`absolute top-2.5 text-gray-400 w-5 h-5 ${isRTL ? 'right-3' : 'left-3'}`} />
                    {searchResultsVisible && searchTerm && (
                      <div className="absolute z-50 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
                        {data.screens.filter(s => {
                          const searchLower = searchTerm.toLowerCase();
                          const keywords = searchLower.split(/\s+/).filter(k => k.length > 0);
                          const textToSearch = `${s.model || ''} ${s.name || ''} ${s.description || ''}`.toLowerCase();
                          return s.quantity > 0 && keywords.every(kw => textToSearch.includes(kw));
                        }).map(screen => (
                          <div 
                            key={screen._id || screen.id} 
                            onClick={() => selectScreen(screen)} 
                            className="p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0 transition flex justify-between items-center group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-white transition shadow-sm">
                                <Monitor className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{screen.model || screen.name}</p>
                                <div className="text-xs text-gray-500">ID: {(screen._id || screen.id || '').substring(0, 8)}</div>
                              </div>
                            </div>
                            <div className="text-left rtl:text-right">
                              <div className={`text-sm font-medium ${screen.quantity <= (screen.minQuantity || 5) ? 'text-red-600' : 'text-green-600'}`}>
                                {t('sales.itemsCount', { count: screen.quantity })}
                              </div>
                              <div className="text-[10px] text-gray-400">{(screen.cost || 0).toFixed(2)} {t('dashboard.currency')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-blue-300 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-blue-800">{selectedScreen.model || selectedScreen.name}</p>
                      <p className="text-sm text-gray-600">{t('inventory.quantity')}: {selectedScreen.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" value={formData.screenCost || ''} onChange={e => setFormData({...formData, screenCost: e.target.value})} className="w-24 border p-1 rounded text-center font-bold" />
                      <button onClick={removeSelectedScreen} className="text-red-500 hover:text-red-700"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                {t('repairs.summary')}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">{t('repairs.servicePrice')}</span>
                  <span className="text-lg font-bold">{(parseFloat(formData.cost) || 0).toFixed(2)} {t('dashboard.currency')}</span>
                </div>
                {formData.useScreen && selectedScreen && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t('repairs.screenCost')}</span>
                    <span className="text-lg font-bold text-red-600">{(parseFloat(formData.screenCost) || 0).toFixed(2)} {t('dashboard.currency')}</span>
                  </div>
                )}
                <div className="flex flex-col border-t pt-2 col-span-2">
                  <span className="text-sm text-gray-500">{t('repairs.profit')}</span>
                  <span className={`text-xl font-black ${ (parseFloat(formData.cost) - (formData.useScreen ? (parseFloat(formData.screenCost) || 0) : 0)) >= 0 ? 'text-green-600' : 'text-red-600' }`}>
                    {(parseFloat(formData.cost) - (formData.useScreen ? (parseFloat(formData.screenCost) || 0) : 0)).toFixed(2)} {t('dashboard.currency')}
                  </span>
                </div>
              </div>
            </div>

            <textarea placeholder={t('repairs.notes')} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="border p-2 rounded md:col-span-2 focus:ring-2 focus:ring-blue-500 outline-none" rows="3" />
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={formData.paid} onChange={e => setFormData({...formData, paid: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-gray-700">{t('repairs.paid')}</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addRepair} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
              <Plus className="w-6 h-6" />
              {editingRepairId ? t('common.update') : t('repairs.newRepair')}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingRepairId(null); setOriginalRepair(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusOptions.slice(0, 3).map(statusOpt => (
          <div key={statusOpt.key} className="bg-white p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                statusOpt.key === 'statusInRepair' ? 'bg-yellow-500' :
                statusOpt.key === 'statusReady' ? 'bg-green-500' : 'bg-blue-500'
              }`} />
              {statusOpt.label}
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {data.repairs.filter(r => r.status === statusOpt.label).map(repair => (
                <div key={repair._id || repair.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors relative group">
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                    <button onClick={() => handleEditRepair(repair)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded-full" title={t('common.edit')}><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteRepair(repair._id || repair.id, repair.customerName, repair.cost)} className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded-full" title={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    {repair.paid ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        {t('repairs.paid')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <X className="w-4 h-4" />
                        {t('repairs.notPaid')}
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800">{repair.customerName}</span>
                      <span className="text-blue-600 font-bold">{repair.cost} {t('dashboard.currency')}</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <div className="font-medium">{repair.device}</div>
                      <div className="text-xs mt-1 text-gray-500">{repair.problem}</div>
                    </div>
                    {repair.useScreen && (
                      <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 p-1 rounded">
                        <Package className="w-3 h-3" />
                        <span>{t('repairs.useScreen')}: {repair.screenName}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t">
                      {statusOpt.key !== 'statusDelivered' && (
                        <button onClick={() => updateStatus(repair._id || repair.id, statusOpt.key === 'statusInRepair' ? t('repairs.statusReady') : t('repairs.statusDelivered'))} className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" />
                          {t('repairs.updateStatus')}
                        </button>
                      )}
                      <button onClick={() => showInvoice({ type: 'repair', data: repair })} className="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-blue-600 hover:text-white transition">
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {data.repairs.filter(r => r.status === statusOpt.label).length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {t('repairs.noRepairs')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
        onConfirm={confirmDeleteRepair}
        title={t('repairs.deleteConfirmTitle')}
        message={t('repairs.deleteConfirmMsg')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default Repairs;
