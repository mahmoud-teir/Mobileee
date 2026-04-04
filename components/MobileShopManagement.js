'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Wrench, DollarSign, FileText, Users, Truck, AlertCircle, BarChart as BarChartIcon, Cloud, RotateCcw, CreditCard, Moon, Sun, ScanLine, LogOut, User, Shield, Database, Trash2 } from 'lucide-react';
import { useStorage, initializeStorage, clearLocalCache } from '@/lib/storage';
import { useAuth } from './AuthContext';

// استيراد المكونات
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Repairs from './Repairs';
import Sales from './Sales';
import Expenses from './Expenses';
import Customers from './Customers';
import Suppliers from './Suppliers';
import Reports from './Reports';
import Invoice from './Invoice';
import BackupManager from './BackupManager';
import Returns from './Returns';
import Installments from './Installments';
import BarcodeScanner from './BarcodeScanner';
import UsersManagement from './UsersManagement';
import DatabaseViewer from './DatabaseViewer';

// تهيئة localStorage عند التشغيل
initializeStorage();

const MobileShopManagement = () => {
  const { data, saveData, addItem, updateItem, deleteItem, loading } = useStorage();
  const { user, logout, sessionWarning } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [inventoryView, setInventoryView] = useState('screens');
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // تطبيق الوضع المظلم
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // التحقق من التنبيهات
  useEffect(() => {
    const checkNotifications = () => {
      if (loading) return;

      const newNotifications = [];

      // تنبيهات المخزون المنخفض لكل الأصناف
      const stockItems = [
        ...(data.screens || []).map(i => ({ ...i, categoryName: 'شاشة' })),
        ...(data.phones || []).map(i => ({ ...i, categoryName: 'جوال', model: i.model || i.name })),
        ...(data.accessories || []).map(i => ({ ...i, categoryName: 'إكسسوار' })),
        ...(data.stickers || []).map(i => ({ ...i, categoryName: 'ملصق' })),
        ...(data.products || []).map(i => ({ 
            ...i, 
            categoryName: (data.categories?.find(c => c._id === (i.categoryId?._id || i.categoryId))?.name || 'منتج')
        }))
      ];

      stockItems.forEach(item => {
        if (item.quantity < (item.minQuantity || 5)) {
          newNotifications.push({
            id: `stock-${item._id || item.id}`,
            type: 'stock',
            message: `${item.categoryName} ${item.model || item.name} ناقص في المخزون! الكمية: ${item.quantity}`,
            time: new Date().toISOString()
          });
        }
      });

      // تنبيهات الصيانات الجاهزة
      data.repairs
        .filter(r => r.status === 'جاهز' && !r.notified)
        .forEach(repair => {
          newNotifications.push({
            id: `repair-${repair._id || repair.id}`,
            type: 'repair',
            message: `جهاز ${repair.device} للعميل ${repair.customerName} جاهز للتسليم`,
            time: new Date().toISOString()
          });
        });

      setNotifications(newNotifications);
    };

    checkNotifications();
  }, [data, loading]);

  // دالة النسخ الاحتياطي
  const handleBackup = () => {
    try {
      const backupData = {
        screens: data.screens,
        phones: data.phones,
        accessories: data.accessories,
        stickers: data.stickers,
        categories: data.categories,
        products: data.products,
        repairs: data.repairs,
        sales: data.sales,
        expenses: data.expenses,
        customers: data.customers,
        suppliers: data.suppliers,
        timestamp: new Date().toISOString(),
        version: '2.5'
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_mobile_shop_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      alert('تم إنشاء نسخة احتياطية ناجحة!');
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية. الرجاء المحاولة مرة أخرى.');
    }
  };

  // دالة استعادة النسخة الاحتياطية
  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const backupData = JSON.parse(content);

        if (!window.confirm('تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. هل أنت متأكد؟')) {
          return;
        }

        // حفظ البيانات من النسخة الاحتياطية
        const keys = [
            'screens', 'phones', 'accessories', 'stickers', 
            'categories', 'products', 
            'repairs', 'sales', 'expenses', 
            'customers', 'suppliers'
        ];

        for (const key of keys) {
          if (backupData[key] !== undefined) {
            await saveData(key, backupData[key]);
          }
        }

        alert('تمت استعادة النسخة الاحتياطية بنجاح!');
        window.location.reload();
      } catch (error) {
        console.error('خطأ في استعادة النسخة الاحتياطية:', error);
        alert('حدث خطأ أثناء استعادة النسخة الاحتياطية. الرجاء التحقق من ملف النسخة الاحتياطية.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  // دالة تسجيل الخروج
  const handleLogout = () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      logout();
    }
  };

  // التحقق من صلاحية المدير
  const isAdmin = user?.role === 'admin';

  // قائمة التبويبات
  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', shortLabel: 'الرئيسية', icon: TrendingUp },
    { id: 'inventory', label: 'المخزون', shortLabel: 'مخزون', icon: ShoppingBag },
    { id: 'repairs', label: 'الصيانة', shortLabel: 'صيانة', icon: Wrench },
    { id: 'sales', label: 'المبيعات', shortLabel: 'مبيعات', icon: DollarSign },
    { id: 'expenses', label: 'المصاريف', shortLabel: 'مصاريف', icon: FileText },
    { id: 'customers', label: 'العملاء', shortLabel: 'عملاء', icon: Users },
    { id: 'suppliers', label: 'الموردين', shortLabel: 'موردين', icon: Truck },
    { id: 'returns', label: 'المرتجعات', shortLabel: 'مرتجع', icon: RotateCcw },
    { id: 'installments', label: 'الأقساط', shortLabel: 'أقساط', icon: CreditCard },
    { id: 'reports', label: 'التقارير', shortLabel: 'تقارير', icon: BarChartIcon },
    // تبويبات المدير فقط
    ...(isAdmin ? [
      { id: 'users', label: 'المستخدمين', shortLabel: 'مستخدمين', icon: Shield },
      { id: 'database', label: 'قاعدة البيانات', shortLabel: 'قاعدة', icon: Database }
    ] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          {/* اللوجو المتحرك */}
          <div className="mb-6 animate-bounce">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-4 rounded-2xl shadow-2xl inline-block">
              <ShoppingBag className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">SmartStore POS</h2>

          {/* مؤشر التحميل */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <p className="text-gray-600 font-medium">جاري تحميل النظام...</p>
          <p className="text-gray-400 text-sm mt-2">تطوير: Mahmoud AbuTeir</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`} dir="rtl">
      {/* تحذير انتهاء الجلسة */}
      {sessionWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-3 px-4 text-center shadow-lg animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">تحذير: ستنتهي الجلسة خلال دقيقة واحدة بسبب عدم النشاط. قم بأي نشاط للبقاء متصلاً.</span>
          </div>
        </div>
      )}

      {/* الهيدر */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-pink-800 text-white shadow-2xl relative overflow-hidden">
        {/* خلفية ديكورية */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative z-10 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center gap-4">
            {/* اللوجو */}
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/30">
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 drop-shadow-lg">
                SmartStore POS
              </h1>
              <p className="text-rose-100 mt-1 hidden md:block text-sm">نظام إدارة متكامل للمحلات</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-0 flex-wrap justify-end">
            {/* زر ماسح الباركود */}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title="مسح باركود"
            >
              <ScanLine className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* زر الوضع المظلم */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title={darkMode ? 'الوضع الفاتح' : 'الوضع المظلم'}
            >
              {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </button>

            {/* مدير النسخ الاحتياطية المتقدم */}
            <button
              onClick={() => setShowBackupManager(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title="مدير النسخ الاحتياطية"
            >
              <Cloud className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm hidden md:inline font-medium">نسخ احتياطية</span>
            </button>

            {/* استعادة النسخة الاحتياطية - مخفي على الجوال */}
            <div className="relative group hidden sm:block">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="restore-backup"
              />
              <label
                htmlFor="restore-backup"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl cursor-pointer flex items-center justify-center transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
                title="استعادة نسخة احتياطية"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
              </label>
            </div>

            {/* النسخ الاحتياطي - مخفي على الجوال */}
            <button
              onClick={handleBackup}
              className="hidden sm:flex bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title="إنشاء نسخة احتياطية"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* إشعارات */}
            <div className="relative">
              <button
                onClick={() => setNotifications(prev => prev.length > 0 ? [] : prev)}
                className="relative bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center animate-pulse shadow-lg text-[10px] md:text-xs">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* زر مسح الكاش */}
            <button
              onClick={() => {
                if(window.confirm('هل أنت متأكد من مسح الذاكرة المؤقتة؟ سيتم حذف النسخ الاحتياطية المحلية وإعادة تحميل الصفحة.')) {
                  clearLocalCache();
                }
              }}
              className="bg-orange-500/80 hover:bg-orange-600 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title="مسح الذاكرة المؤقتة"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* معلومات المستخدم */}
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex items-center gap-2 border border-white/30">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">{user?.name || user?.username || 'مستخدم'}</span>
            </div>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm hidden sm:inline font-medium">خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* القائمة */}
      <div className="bg-white shadow-lg sticky top-0 z-10 border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex-shrink-0 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-semibold whitespace-nowrap transition-all duration-300 relative text-xs sm:text-sm md:text-base ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-rose-600'
              }`}
            >
              <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-300 ${
                activeTab === tab.id ? '' : 'group-hover:scale-110'
              }`} />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>

              {/* مؤشر التبويب النشط */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-4 md:p-6">
        {activeTab === 'dashboard' && <Dashboard data={data} setActiveTab={setActiveTab} setView={setInventoryView} saveData={saveData} />}
        {activeTab === 'inventory' && <Inventory data={data} saveData={saveData} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} view={inventoryView} setView={setInventoryView} />}
        {activeTab === 'repairs' && <Repairs data={data} saveData={saveData} showInvoice={setPrintInvoice} />}
        {activeTab === 'sales' && <Sales data={data} saveData={saveData} showInvoice={setPrintInvoice} />}
        {activeTab === 'expenses' && <Expenses data={data} saveData={saveData} />}
        {activeTab === 'customers' && <Customers data={data} saveData={saveData} />}
        {activeTab === 'suppliers' && <Suppliers data={data} saveData={saveData} />}
        {activeTab === 'returns' && <Returns data={data} saveData={saveData} />}
        {activeTab === 'installments' && <Installments data={data} saveData={saveData} />}
        {activeTab === 'reports' && <Reports data={data} />}
        {activeTab === 'users' && isAdmin && <UsersManagement />}
        {activeTab === 'database' && isAdmin && <DatabaseViewer />}

        {/* الفاتورة المنبثقة */}
        {printInvoice && (
          <Invoice
            type={printInvoice.type}
            data={printInvoice.data}
            onClose={() => setPrintInvoice(null)}
          />
        )}

        {/* مدير النسخ الاحتياطية */}
        {showBackupManager && (
          <BackupManager
            data={data}
            saveData={saveData}
            onClose={() => setShowBackupManager(false)}
          />
        )}

        {/* ماسح الباركود */}
        {showBarcodeScanner && (
          <BarcodeScanner
            data={data}
            onClose={() => setShowBarcodeScanner(false)}
          />
        )}
      </div>

      {/* فوتر */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* معلومات النظام */}
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold text-rose-400 mb-2 flex items-center justify-center md:justify-start gap-2">
                <ShoppingBag className="w-6 h-6" />
                SmartStore POS
              </h3>
              <p className="text-gray-400 text-sm">نظام إدارة متكامل لمحلات الموبايلات</p>
              <p className="text-gray-500 text-xs mt-1">الإصدار 2.0</p>
            </div>

            {/* روابط سريعة */}
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">الميزات الرئيسية</h4>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                <span className="bg-gray-700/50 px-2 py-1 rounded">المبيعات</span>
                <span className="bg-gray-700/50 px-2 py-1 rounded">المخزون</span>
                <span className="bg-gray-700/50 px-2 py-1 rounded">الصيانة</span>
                <span className="bg-gray-700/50 px-2 py-1 rounded">التقارير</span>
              </div>
            </div>

            {/* معلومات المطور */}
            <div className="text-center md:text-left">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">تطوير وتصميم</h4>
              <p className="text-rose-400 font-bold text-lg">Mahmoud AbuTeir</p>
              <p className="text-gray-500 text-xs mt-1">Full Stack Developer</p>
            </div>
          </div>

          {/* خط فاصل */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} SmartStore POS. جميع الحقوق محفوظة.
              </p>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <span>صنع بـ</span>
                <span className="text-red-500">❤</span>
                <span>بواسطة</span>
                <span className="text-rose-400 font-medium">Mahmoud AbuTeir</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileShopManagement;
