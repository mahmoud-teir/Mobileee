'use client';
import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, ChevronDown, ChevronUp, Search, Users, Monitor, Smartphone,
  Headphones, Sticker, UserCheck, Truck, ShoppingCart, Wrench, Receipt, RotateCcw,
  CreditCard, Eye, X, Download, Filter, Upload, AlertTriangle, CheckCircle, ShoppingBag, Layers
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const DatabaseViewer = () => {
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const collectionIcons = {
    users: Users, screens: Monitor, phones: Smartphone, accessories: Headphones,
    stickers: Sticker, customers: UserCheck, suppliers: Truck, sales: ShoppingCart,
    repairs: Wrench, expenses: Receipt, returns: RotateCcw, installments: CreditCard,
    products: ShoppingBag, categories: Layers
  };

  const collectionColors = {
    users: 'from-purple-500 to-purple-600',
    screens: 'from-blue-500 to-blue-600',
    phones: 'from-green-500 to-green-600',
    accessories: 'from-yellow-500 to-yellow-600',
    stickers: 'from-pink-500 to-pink-600',
    customers: 'from-indigo-500 to-indigo-600',
    suppliers: 'from-orange-500 to-orange-600',
    sales: 'from-emerald-500 to-emerald-600',
    repairs: 'from-red-500 to-red-600',
    expenses: 'from-gray-500 to-gray-600',
    returns: 'from-cyan-500 to-cyan-600',
    installments: 'from-teal-500 to-teal-600',
    products: 'from-blue-600 to-blue-700',
    categories: 'from-purple-600 to-purple-700'
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dashboard/database-stats`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(t('database.errorFetch') || 'Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (collectionName) => {
    try {
      setLoadingData(true);
      setSelectedCollection(collectionName);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dashboard/collection/${collectionName}?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setCollectionData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleMigration = async () => {
    try {
      setMigrating(true);
      setMigrationResult(null);
      // Logic for migration would go here - placeholder for now
      setMigrationResult({ success: false, message: t('database.migrateNoData') });
    } catch (err) {
      setMigrationResult({ success: false, message: err.message });
    } finally {
      setMigrating(false);
    }
  };

  const exportData = () => {
    if (!collectionData) return;
    const blob = new Blob([JSON.stringify(collectionData.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredData = collectionData?.data?.filter(item => {
    if (!searchTerm) return true;
    return JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderValue = (value, key) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[${value.length} items]`;
      if (value instanceof Date || key.toLowerCase().includes('date') || key.includes('At')) {
        try { return new Date(value).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'); } catch { return String(value); }
      }
      return '{...}';
    }
    if (typeof value === 'number') return value.toLocaleString(isRTL ? 'ar-SA' : 'en-US');
    return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
  };

  const getColumns = () => {
    if (!filteredData?.length) return [];
    const allKeys = new Set();
    filteredData.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
    const priority = ['_id', 'name', 'username', 'model', 'customerName', 'device', 'total', 'quantity', 'status', 'createdAt'];
    return [...allKeys].sort((a, b) => {
      const ai = priority.indexOf(a), bi = priority.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    }).filter(k => k !== '__v');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('database.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3 rounded-xl shadow-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">{t('database.title')}</h2>
            <p className="text-gray-500 text-sm font-medium">{t('database.subtitle')}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={fetchStats} className="bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2">
            <RefreshCw className="w-5 h-5" /> {t('database.refresh')}
          </button>
          <button onClick={() => setShowMigrationModal(true)} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2">
            <Upload className="w-5 h-5" /> {t('database.migrate')}
          </button>
        </div>
      </div>

      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-4 rounded-2xl"><AlertTriangle className="w-8 h-8 text-amber-600" /></div>
              <div>
                <h3 className="text-xl font-black text-gray-900">{t('database.migrateTitle')}</h3>
                <p className="text-gray-500 text-sm font-medium">{t('database.migrateSubtitle')}</p>
              </div>
            </div>
            <p className="text-gray-600 bg-amber-50/50 p-4 rounded-xl text-sm leading-relaxed border border-amber-100">{t('database.migrateDesc')}</p>

            {migrationResult && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${migrationResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {migrationResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="font-bold text-sm">{migrationResult.message}</span>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button disabled={migrating} onClick={() => { setShowMigrationModal(false); setMigrationResult(null); }} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">{t('common.cancel') || 'Cancel'}</button>
              <button disabled={migrating} onClick={handleMigration} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg hover:bg-amber-600 transition flex items-center justify-center gap-2">
                {migrating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {migrating ? t('database.migrating') : t('database.startMigration')}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border-2 border-red-100 text-red-700 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {error}</div>}

      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <Database className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10" />
        <div className="relative z-10">
          <p className="text-rose-100 font-bold uppercase tracking-widest text-xs mb-2">{t('database.allCollections')}</p>
          <h3 className="text-sm font-bold opacity-80 mb-1">{t('database.totalRecords')}</h3>
          <div className="text-6xl font-black">{stats?.totalRecords?.toLocaleString(isRTL ? 'ar-SA' : 'en-US') || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        {stats?.collections && Object.entries(stats.collections).map(([key, value]) => {
          const Icon = collectionIcons[key] || Database;
          const isSelected = selectedCollection === key;
          return (
            <button key={key} onClick={() => fetchCollectionData(key)} className={`p-4 rounded-2xl transition-all duration-300 text-right group ${isSelected ? 'bg-gradient-to-br ' + collectionColors[key] + ' text-white shadow-xl scale-105' : 'bg-white hover:shadow-lg hover:scale-105 border border-gray-100'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isSelected ? 'bg-white/20' : 'bg-gradient-to-br ' + collectionColors[key]}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>{value.count?.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</div>
              <div className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                {t(`db.${key}`) || value.name}
              </div>
            </button>
          );
        })}
      </div>

      {selectedCollection && (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gray-900 p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${collectionColors[selectedCollection]}`}><Database className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-black">{t(`db.${selectedCollection}`) || stats?.collections[selectedCollection]?.name}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{collectionData?.total || 0} {t('db.records')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                <input type="text" placeholder={t('database.search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`bg-white/10 border border-white/10 rounded-xl py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 transition-all ${isRTL ? 'pr-12' : 'pl-12'}`} />
              </div>
              <button onClick={exportData} className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition text-sm">
                <Download className="w-4 h-4" /> {t('database.export')}
              </button>
              <button onClick={() => { setSelectedCollection(null); setCollectionData(null); setSearchTerm(''); }} className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-3 py-2.5 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-2 overflow-x-auto min-h-[400px]">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center p-20"><RefreshCw className="w-12 h-12 text-rose-500 animate-spin mb-4" /><p className="text-gray-400 font-bold">{t('database.loading')}</p></div>
            ) : filteredData?.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className={`px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b ${isRTL ? 'text-right' : 'text-left'}`}>#</th>
                    {getColumns().slice(0, 8).map(col => (
                      <th key={col} className={`px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b ${isRTL ? 'text-right' : 'text-left'}`}>
                        {col === '_id' ? t('database.id') : col}
                      </th>
                    ))}
                    <th className="px-4 py-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-b">{t('database.details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((item, idx) => (
                    <React.Fragment key={item._id || idx}>
                      <tr className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-4 py-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                        {getColumns().slice(0, 8).map(col => (
                          <td key={col} className="px-4 py-4 text-sm font-medium text-gray-700">
                            {col === '_id' ? <span className="font-mono text-[10px] bg-gray-100 p-1.5 rounded-lg opacity-60">...{String(item[col]).slice(-6)}</span> : renderValue(item[col], col)}
                          </td>
                        ))}
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} className={`p-2 rounded-xl transition-all ${expandedRow === idx ? 'bg-gray-200 text-gray-900' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                            {expandedRow === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={10} className="p-6 bg-gray-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.entries(item).filter(([k]) => k !== '__v').map(([k, v]) => (
                                <div key={k} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.01]">
                                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{k}</div>
                                  <div className="text-sm font-bold text-gray-800 break-all leading-relaxed">
                                    {typeof v === 'object' ? <pre className="text-[10px] bg-gray-50 p-3 rounded-xl mt-2 overflow-auto max-h-40">{JSON.stringify(v, null, 2)}</pre> : String(v)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 opacity-40"><Database className="w-20 h-20 mb-4" /><p className="font-black uppercase tracking-widest">{t('database.noData')}</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseViewer;
