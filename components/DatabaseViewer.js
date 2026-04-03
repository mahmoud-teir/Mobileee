'use client';
import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  Monitor,
  Smartphone,
  Headphones,
  Sticker,
  UserCheck,
  Truck,
  ShoppingCart,
  Wrench,
  Receipt,
  RotateCcw,
  CreditCard,
  Eye,
  X,
  Download,
  Filter,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
const migrateLocalDataToMongoDB = async () => { return {}; };

const API_URL = process.env.REACT_APP_API_URL || '/api';

const DatabaseViewer = () => {
  const [stats, setStats] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const collectionIcons = {
    users: Users,
    screens: Monitor,
    phones: Smartphone,
    accessories: Headphones,
    stickers: Sticker,
    customers: UserCheck,
    suppliers: Truck,
    sales: ShoppingCart,
    repairs: Wrench,
    expenses: Receipt,
    returns: RotateCcw,
    installments: CreditCard
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
    installments: 'from-teal-500 to-teal-600'
  };

  // ترحيل البيانات من localStorage إلى MongoDB
  const handleMigration = async () => {
    try {
      setMigrating(true);
      setMigrationResult(null);

      // جلب البيانات المحلية
      const localData = await migrateLocalDataToMongoDB();

      if (Object.keys(localData).length === 0) {
        setMigrationResult({
          success: false,
          message: 'لا توجد بيانات محلية للترحيل'
        });
        return;
      }

      // إرسال البيانات إلى MongoDB
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/backup/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: localData,
          clearExisting: false
        })
      });

      if (!response.ok) {
        throw new Error('فشل في ترحيل البيانات');
      }

      const result = await response.json();

      // حساب عدد العناصر المرحلة
      let totalMigrated = 0;
      Object.values(localData).forEach(arr => {
        if (Array.isArray(arr)) totalMigrated += arr.length;
      });

      setMigrationResult({
        success: true,
        message: `تم ترحيل ${totalMigrated} عنصر بنجاح`,
        details: result
      });

      // إعادة تحميل الإحصائيات
      await fetchStats();
      setShowMigrationModal(false);

    } catch (err) {
      console.error('Migration error:', err);
      setMigrationResult({
        success: false,
        message: err.message
      });
    } finally {
      setMigrating(false);
    }
  };

  // جلب إحصائيات قاعدة البيانات
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/dashboard/database-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `خطأ ${response.status}: فشل في جلب الإحصائيات`);
      }

      const data = await response.json();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Database stats error:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('تعذر الاتصال بالخادم. تأكد من تشغيل الخادم على المنفذ 5000');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // جلب بيانات جدول معين
  const fetchCollectionData = async (collectionName) => {
    try {
      setLoadingData(true);
      setSelectedCollection(collectionName);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dashboard/collection/${collectionName}?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل في جلب البيانات');

      const data = await response.json();
      setCollectionData(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // تصدير البيانات كـ JSON
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
    URL.revokeObjectURL(url);
  };

  // فلترة البيانات
  const filteredData = collectionData?.data?.filter(item => {
    if (!searchTerm) return true;
    return JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
  });

  // عرض قيمة الحقل
  const renderValue = (value, key) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[${value.length} عناصر]`;
      if (value instanceof Date || key.includes('date') || key.includes('Date') || key.includes('At')) {
        try {
          return new Date(value).toLocaleDateString('ar-SA');
        } catch {
          return String(value);
        }
      }
      return '{...}';
    }
    if (typeof value === 'number') return value.toLocaleString('ar-SA');
    return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
  };

  // الحصول على أعمدة الجدول
  const getColumns = () => {
    if (!filteredData?.length) return [];
    const allKeys = new Set();
    filteredData.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    // ترتيب الأعمدة
    const priorityKeys = ['_id', 'name', 'username', 'model', 'customerName', 'device', 'total', 'quantity', 'status', 'createdAt'];
    const sorted = [...allKeys].sort((a, b) => {
      const aIndex = priorityKeys.indexOf(a);
      const bIndex = priorityKeys.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
    return sorted.filter(key => key !== '__v');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* العنوان */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3 rounded-xl">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">قاعدة البيانات</h2>
            <p className="text-gray-500 text-sm">عرض وإدارة جميع البيانات</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            تحديث
          </button>

          <button
            onClick={() => setShowMigrationModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-all"
          >
            <Upload className="w-5 h-5" />
            ترحيل البيانات المحلية
          </button>
        </div>
      </div>

      {/* نافذة ترحيل البيانات */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">ترحيل البيانات</h3>
                <p className="text-gray-500 text-sm">نقل البيانات من المتصفح إلى قاعدة البيانات</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-800 text-sm">
                سيتم نقل جميع البيانات المخزنة في المتصفح (localStorage) إلى قاعدة بيانات MongoDB.
                هذه العملية ستضيف البيانات دون حذف البيانات الموجودة.
              </p>
            </div>

            {migrationResult && (
              <div className={`p-4 rounded-xl mb-4 ${
                migrationResult.success
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {migrationResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <span>{migrationResult.message}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMigrationModal(false);
                  setMigrationResult(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                disabled={migrating}
              >
                إلغاء
              </button>
              <button
                onClick={handleMigration}
                disabled={migrating}
                className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري الترحيل...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    بدء الترحيل
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* إحصائيات عامة */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">إجمالي السجلات</h3>
            <p className="text-rose-100">في جميع الجداول</p>
          </div>
        </div>
        <div className="text-5xl font-bold">
          {stats?.totalRecords?.toLocaleString('ar-SA') || 0}
        </div>
      </div>

      {/* بطاقات الجداول */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        {stats?.collections && Object.entries(stats.collections).map(([key, value]) => {
          const Icon = collectionIcons[key] || Database;
          const isSelected = selectedCollection === key;

          return (
            <button
              key={key}
              onClick={() => fetchCollectionData(key)}
              className={`p-4 rounded-xl transition-all duration-300 text-right ${
                isSelected
                  ? 'bg-gradient-to-br ' + collectionColors[key] + ' text-white shadow-lg scale-105'
                  : 'bg-white hover:shadow-lg hover:scale-105 border border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isSelected ? 'bg-white/20' : 'bg-gradient-to-br ' + collectionColors[key]
              }`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white'}`} />
              </div>
              <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                {value.count?.toLocaleString('ar-SA')}
              </div>
              <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {value.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* عرض بيانات الجدول المحدد */}
      {selectedCollection && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* رأس الجدول */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = collectionIcons[selectedCollection] || Database;
                  return <Icon className="w-6 h-6" />;
                })()}
                <div>
                  <h3 className="text-lg font-bold">
                    {stats?.collections[selectedCollection]?.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {collectionData?.total || 0} سجل
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* البحث */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg pr-10 pl-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* تصدير */}
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  تصدير
                </button>

                {/* إغلاق */}
                <button
                  onClick={() => {
                    setSelectedCollection(null);
                    setCollectionData(null);
                    setSearchTerm('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* محتوى الجدول */}
          {loadingData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
          ) : filteredData?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    {getColumns().slice(0, 8).map(column => (
                      <th
                        key={column}
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {column === '_id' ? 'المعرف' :
                         column === 'name' ? 'الاسم' :
                         column === 'username' ? 'المستخدم' :
                         column === 'model' ? 'الموديل' :
                         column === 'customerName' ? 'العميل' :
                         column === 'device' ? 'الجهاز' :
                         column === 'total' ? 'الإجمالي' :
                         column === 'quantity' ? 'الكمية' :
                         column === 'status' ? 'الحالة' :
                         column === 'createdAt' ? 'تاريخ الإنشاء' :
                         column === 'email' ? 'البريد' :
                         column === 'phone' ? 'الهاتف' :
                         column === 'role' ? 'الدور' :
                         column === 'price' ? 'السعر' :
                         column === 'cost' ? 'التكلفة' :
                         column}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      تفاصيل
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <React.Fragment key={item._id || index}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        {getColumns().slice(0, 8).map(column => (
                          <td key={column} className="px-4 py-3 text-sm text-gray-800">
                            {column === '_id' ? (
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {String(item[column]).substring(0, 8)}...
                              </span>
                            ) : column === 'status' ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item[column] === 'جاهز' ? 'bg-green-100 text-green-700' :
                                item[column] === 'قيد الإصلاح' ? 'bg-yellow-100 text-yellow-700' :
                                item[column] === 'مستلم' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item[column]}
                              </span>
                            ) : column === 'role' ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item[column] === 'admin' ? 'bg-purple-100 text-purple-700' :
                                item[column] === 'manager' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item[column] === 'admin' ? 'مدير' :
                                 item[column] === 'manager' ? 'مشرف' : 'موظف'}
                              </span>
                            ) : (
                              renderValue(item[column], column)
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                          >
                            {expandedRow === index ? (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* صف التفاصيل */}
                      {expandedRow === index && (
                        <tr className="bg-gray-50">
                          <td colSpan={getColumns().slice(0, 8).length + 2} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {Object.entries(item).filter(([key]) => key !== '__v').map(([key, value]) => (
                                <div key={key} className="bg-white p-3 rounded-lg border">
                                  <div className="text-xs text-gray-500 mb-1">{key}</div>
                                  <div className="text-sm text-gray-800 font-medium break-all">
                                    {typeof value === 'object' ? (
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    ) : (
                                      String(value)
                                    )}
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Database className="w-16 h-16 mb-4 text-gray-300" />
              <p>لا توجد بيانات</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseViewer;
