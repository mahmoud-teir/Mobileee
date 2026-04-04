'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Wrench, DollarSign, FileText, Users, Truck, AlertCircle, BarChart as BarChartIcon, Cloud, RotateCcw, CreditCard, Moon, Sun, ScanLine, LogOut, User, Shield, Database, Trash2, Languages, Eye } from 'lucide-react';
import { useStorage, initializeStorage, clearLocalCache } from '@/lib/storage';
import { hasFeature } from '@/lib/planLimits';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { Toaster, toast } from 'sonner';

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
import SystemAdmin from './SystemAdmin';

// تهيئة localStorage عند التشغيل
initializeStorage();

const MobileShopManagement = () => {
  const { data, saveData, addItem, updateItem, deleteItem, loading } = useStorage();
  const { user, logout, sessionWarning } = useAuth();
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeTab');
      if (saved) return saved;
      
      // Default for super_admin who is not impersonating
      if (user?.role === 'super_admin' && !localStorage.getItem('currentStoreSlug')) {
        return 'admin';
      }
    }
    return 'dashboard';
  });
  const [notifications, setNotifications] = useState([]);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [inventoryView, setInventoryView] = useState('screens');
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true';
    }
    return false;
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(() => {
    if (typeof window !== 'undefined') {
      const slugFromUrl = window.location.pathname.split('/')[1];
      const savedSlug = localStorage.getItem('currentStoreSlug');
      // If we are at a slug URL and we are a super_admin, we are impersonating
      return !!slugFromUrl && slugFromUrl !== 'api' && slugFromUrl !== 'admin';
    }
    return false;
  });

  const handleImpersonate = (slug) => {
    localStorage.setItem('currentStoreSlug', slug);
    localStorage.setItem('activeTab', 'dashboard');
    window.location.href = `/${slug}`;
  };

  const handleStopImpersonating = () => {
    localStorage.removeItem('currentStoreSlug');
    localStorage.setItem('activeTab', 'admin');
    window.location.href = '/';
  };

  // تطبيق الوضع المظلم
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // حفظ التبويب النشط
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // التحقق من التنبيهات
  useEffect(() => {
    const checkNotifications = () => {
      if (loading) return;

      const newNotifications = [];

      // تنبيهات المخزون المنخفض لكل الأصناف
      const stockItems = [
        ...(data.screens || []).map(i => ({ ...i, categoryName: t('inventory.screen') })),
        ...(data.phones || []).map(i => ({ ...i, categoryName: t('inventory.phone'), model: i.model || i.name })),
        ...(data.accessories || []).map(i => ({ ...i, categoryName: t('inventory.accessory') })),
        ...(data.stickers || []).map(i => ({ ...i, categoryName: t('inventory.sticker') })),
        ...(data.products || []).map(i => ({ 
            ...i, 
            categoryName: (data.categories?.find(c => c._id === (i.categoryId?._id || i.categoryId))?.name || t('inventory.product'))
        }))
      ];

      stockItems.forEach(item => {
        if (item.quantity < (item.minQuantity || 5)) {
          newNotifications.push({
            id: `stock-${item._id || item.id}`,
            type: 'stock',
            message: `${item.categoryName} ${item.model || item.name} ${t('notifications.stockLow')} ${item.quantity}`,
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
            message: `${t('notifications.repairReady')} ${repair.device} ${t('notifications.forCustomer')} ${repair.customerName}`,
            time: new Date().toISOString()
          });
        });

      setNotifications(newNotifications);
    };

    checkNotifications();
  }, [data, loading, t]);

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

      alert(t('header.backupSuccess') || 'Success!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert(t('header.backupError') || 'Error!');
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

        if (!window.confirm(t('header.restoreConfirm'))) {
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

        alert(t('header.restoreSuccess'));
        window.location.reload();
      } catch (error) {
        console.error('Error restoring backup:', error);
        alert(t('header.restoreError'));
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  // دالة تسجيل الخروج
  const handleLogout = () => {
    if (window.confirm(t('header.logoutConfirm'))) {
      logout();
    }
  };

  // التحقق من الصلاحيات
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isOwner = user?.role === 'owner' || isAdmin;
  const isSuperAdmin = user?.role === 'super_admin';

  // قائمة التبويبات
  const tabs = [
    { id: 'dashboard', label: t('nav.dashboard'), shortLabel: t('nav.dashboardShort'), icon: TrendingUp },
    { id: 'inventory', label: t('nav.inventory'), shortLabel: t('nav.inventoryShort'), icon: ShoppingBag },
    { id: 'repairs', label: t('nav.repairs'), shortLabel: t('nav.repairsShort'), icon: Wrench },
    { id: 'sales', label: t('nav.sales'), shortLabel: t('nav.salesShort'), icon: DollarSign },
    { id: 'expenses', label: t('nav.expenses'), shortLabel: t('nav.expensesShort'), icon: FileText },
    { id: 'customers', label: t('nav.customers'), shortLabel: t('nav.customersShort'), icon: Users },
    { id: 'suppliers', label: t('nav.suppliers'), shortLabel: t('nav.suppliersShort'), icon: Truck },
    { id: 'returns', label: t('nav.returns'), shortLabel: t('nav.returnsShort'), icon: RotateCcw },
    { id: 'installments', label: t('nav.installments'), shortLabel: t('nav.installmentsShort'), icon: CreditCard },
    { id: 'reports', label: t('nav.reports'), shortLabel: t('nav.reportsShort'), icon: BarChartIcon },
    // تبويبات الإدارة والمستخدمين
    ...(isOwner ? [
      { id: 'users', label: t('nav.users'), shortLabel: t('nav.usersShort'), icon: Shield }
    ] : []),
    // تبويب قاعدة البيانات للمدراء فقط
    ...(isAdmin ? [
      { id: 'database', label: t('nav.database'), shortLabel: t('nav.databaseShort'), icon: Database }
    ] : []),
    // تبويب مدير النظام الشامل
    ...(isSuperAdmin ? [
      { id: 'admin', label: 'إدارة النظام', shortLabel: 'النظام', icon: Shield }
    ] : [])
  ].filter(tab => {
    // Super Admin sees everything ONLY when impersonating
    if (isSuperAdmin && !isImpersonating) {
      return ['admin', 'database'].includes(tab.id);
    }
    
    // Check feature gating for other roles or impersonated shops
    const storePlan = user?.currentStore?.subscription?.plan || 'free';
    if (!hasFeature(storePlan, tab.id)) {
      return false;
    }

    return true;
  });

  const isTabVisible = (tabId) => tabs.some(t => t.id === tabId);

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

          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('login.title')}</h2>

          {/* مؤشر التحميل */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <p className="text-gray-600 font-medium">{t('login.loading')}</p>
          <p className="text-gray-400 text-sm mt-2">{t('footer.developedBy')}: Mahmoud AbuTeir</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* نظام التنبيهات */}
      <Toaster richColors position="top-center" dir={isRTL ? 'rtl' : 'ltr'} />

      {/* تحذير انتهاء الجلسة */}
      {sessionWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-3 px-4 text-center shadow-lg animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{sessionWarning}</span>
          </div>
        </div>
      )}

      {/* تنبيه وضع المحاكاة / الدخول كمتجر */}
      {isImpersonating && (
        <div className="bg-indigo-600 text-white py-2 px-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-bold">أنت الآن تتصفح بيانات متجر: {user?.currentStore?.name} ({user?.currentStore?.slug})</span>
          </div>
          <button 
            onClick={handleStopImpersonating}
            className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-xs font-black hover:bg-indigo-50 transition"
          >
            العودة للوحة الإدارة
          </button>
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
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
            {/* اللوجو */}
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/30">
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 drop-shadow-lg">
                {t('login.title')}
              </h1>
              <p className="text-rose-100 mt-1 hidden md:block text-sm">{t('login.subtitle')}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 md:gap-3 mt-4 md:mt-0 flex-wrap ${isRTL ? 'justify-end' : 'justify-start'}`}>
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Languages className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm hidden md:inline font-medium">
                {language === 'ar' ? 'English' : 'العربية'}
              </span>
            </button>

            {/* زر ماسح الباركود */}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title={t('header.scanBarcode')}
            >
              <ScanLine className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* زر الوضع المظلم */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title={darkMode ? t('header.lightMode') : t('header.darkMode')}
            >
              {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </button>

            {/* زر مسح الكاش */}
            <button
              onClick={() => {
                if (window.confirm(t('header.clearCache'))) {
                  clearLocalCache();
                }
              }}
              className="bg-white/20 backdrop-blur-sm hover:bg-red-500/40 text-white p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title={t('header.clearCache')}
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* مدير النسخ الاحتياطية المتقدم */}
            <button
              onClick={() => setShowBackupManager(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl hover:scale-105"
              title={t('header.backupManager')}
            >
              <Cloud className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm hidden md:inline font-medium">{t('header.backups')}</span>
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

            {/* معلومات المستخدم */}
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex items-center gap-2 border border-white/30">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">{user?.name || user?.username || t('header.user')}</span>
            </div>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              title={t('header.logout')}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm hidden sm:inline font-medium">{t('header.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* القائمة */}
      <div className="bg-white shadow-lg sticky top-0 z-10 border-b border-gray-200">
        <div className={`flex overflow-x-auto scrollbar-thin ${isRTL ? '' : 'flex-row-reverse'}`} style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
        {activeTab === 'dashboard' && isTabVisible('dashboard') && <Dashboard data={data} setActiveTab={setActiveTab} setView={setInventoryView} saveData={saveData} />}
        {activeTab === 'inventory' && isTabVisible('inventory') && <Inventory data={data} saveData={saveData} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} view={inventoryView} setView={setInventoryView} />}
        {activeTab === 'repairs' && isTabVisible('repairs') && <Repairs data={data} saveData={saveData} showInvoice={setPrintInvoice} />}
        {activeTab === 'sales' && isTabVisible('sales') && <Sales data={data} saveData={saveData} showInvoice={setPrintInvoice} />}
        {activeTab === 'expenses' && isTabVisible('expenses') && <Expenses data={data} saveData={saveData} />}
        {activeTab === 'customers' && isTabVisible('customers') && <Customers data={data} saveData={saveData} />}
        {activeTab === 'suppliers' && isTabVisible('suppliers') && <Suppliers data={data} saveData={saveData} />}
        {activeTab === 'returns' && isTabVisible('returns') && <Returns data={data} saveData={saveData} />}
        {activeTab === 'installments' && isTabVisible('installments') && <Installments data={data} saveData={saveData} />}
        {activeTab === 'reports' && isTabVisible('reports') && <Reports data={data} saveData={saveData} />}
        {activeTab === 'users' && isTabVisible('users') && <UsersManagement />}
        {activeTab === 'database' && isTabVisible('database') && <DatabaseViewer />}
        {activeTab === 'admin' && isTabVisible('admin') && <SystemAdmin onImpersonate={handleImpersonate} />}

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
        <div className="container mx-auto px-4 text-right">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* معلومات النظام */}
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
              <h3 className="text-xl font-bold text-rose-400 mb-2 flex items-center justify-center md:justify-start gap-2">
                <ShoppingBag className="w-6 h-6" />
                {t('login.title')}
              </h3>
              <p className="text-gray-400 text-sm">{t('footer.subtitle')}</p>
              <p className="text-gray-500 text-xs mt-1">{t('footer.version')}</p>
            </div>

            {/* روابط سريعة */}
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">{t('footer.features')}</h4>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                <span className="bg-gray-700/50 px-2 py-1 rounded">{t('nav.sales')}</span>
                <span className="bg-gray-700/50 px-2 py-1 rounded">{t('nav.inventory')}</span>
                <span className="bg-gray-700/50 px-2 py-1 rounded">{t('nav.repairs')}</span>
                <span className="bg-gray-700/50 px-2 py-1 rounded">{t('nav.reports')}</span>
              </div>
            </div>

            {/* معلومات المطور */}
            <div className={`text-center ${isRTL ? 'md:text-left' : 'md:text-right'}`}>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">{t('footer.developedBy')}</h4>
              <p className="text-rose-400 font-bold text-lg">Mahmoud AbuTeir</p>
              <p className="text-gray-500 text-xs mt-1">Full Stack Developer</p>
            </div>
          </div>

          {/* خط فاصل */}
          <div className="border-t border-gray-700 pt-4">
            <div className={`flex flex-col md:flex-row justify-between items-center gap-2 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} SmartStore POS. {t('footer.rights')}
              </p>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <span>{t('footer.madeWith')}</span>
                <span className="text-red-500">❤</span>
                <span>{t('footer.by')}</span>
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
