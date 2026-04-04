'use client';
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Package, Wrench, DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  FileText, Trash2, Calendar, Database, ArrowUpRight, ArrowDownLeft, Printer
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import PrintTemplates from './PrintTemplates';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = ({ data, setActiveTab, setView, saveData }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    type: '',
    dateRange: '',
    count: 0,
    title: '',
    message: ''
  });
  const [showPrintTemplates, setShowPrintTemplates] = useState(false);

  const handleDeleteReports = (type, dateRange, count) => {
    let title = '';
    let message = '';
    
    switch(type) {
      case 'sales':
        title = 'حذف تقارير المبيعات';
        message = `هل أنت متأكد من حذف ${count} فاتورة مبيعات ${dateRange}? سيتم إعادة الكميات إلى المخزون.`;
        break;
      case 'repairs':
        title = 'حذف تقارير الصيانة';
        message = `هل أنت متأكد من حذف ${count} فاتورة صيانة ${dateRange}? لن تتمكن من استعادة هذه البيانات.`;
        break;
      case 'all':
        title = 'حذف جميع التقارير';
        message = `هل أنت متأكد من حذف جميع التقارير (${count} سجل) ${dateRange}? هذه العملية لا يمكن التراجع عنها.`;
        break;
      default:
        title = 'عملية غير معروفة';
        message = 'الرجاء التحقق من نوع العملية المطلوبة.';
        return;
    }
    
    setDeleteConfirmation({
      isOpen: true,
      type: type,
      dateRange: dateRange,
      count: count,
      title: title,
      message: message
    });
  };

  const confirmDeleteReports = async () => {
    try {
      if (!deleteConfirmation.type) return;
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(currentMonth - 3);
      
      // Helper function to restore stock from old sales
      const restoreStock = async (sales) => {
        let collections = {
            screens: [...(data.screens || [])],
            phones: [...(data.phones || [])],
            stickers: [...(data.stickers || [])],
            accessories: [...(data.accessories || [])],
            products: [...(data.products || [])]
        };

        let updatedKeys = new Set();

        sales.forEach(sale => {
            const items = sale.items && Array.isArray(sale.items) ? sale.items : [{ id: sale.itemId, itemType: sale.itemType, quantity: sale.quantity }];
            
            items.forEach(it => {
                const type = it.type || it.itemType;
                const id = it.productId || it.id;
                const qty = it.quantity || 0;

                let collectionKey = ['screen', 'phone', 'sticker', 'accessory'].includes(type) ? 
                                    (type === 'screen' ? 'screens' : type === 'phone' ? 'phones' : type === 'sticker' ? 'stickers' : 'accessories') :
                                    'products';
                
                const idx = collections[collectionKey].findIndex(s => (s._id || s.id) === id);
                if (idx !== -1) {
                    collections[collectionKey][idx].quantity += qty;
                    updatedKeys.add(collectionKey);
                }
            });
        });

        for (const key of updatedKeys) {
            await saveData(key, collections[key]);
        }
      };
      
      if (deleteConfirmation.type === 'sales' || deleteConfirmation.type === 'all') {
          const oldSales = data.sales.filter(sale => new Date(sale.date) < threeMonthsAgo);
          await restoreStock(oldSales);
          
          const filteredSales = data.sales.filter(sale => new Date(sale.date) >= threeMonthsAgo);
          await saveData('sales', filteredSales);
      }
      
      if (deleteConfirmation.type === 'repairs' || deleteConfirmation.type === 'all') {
          const filteredRepairs = data.repairs.filter(repair => new Date(repair.date) >= threeMonthsAgo);
          await saveData('repairs', filteredRepairs);
      }
      
      setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', count: 0, title: '', message: '' });
      alert(`تم حذف السجلات بنجاح!`);
    } catch (error) {
      console.error('خطأ في حذف التقارير:', error);
      alert('حدث خطأ أثناء حذف التقارير. الرجاء المحاولة مرة أخرى.');
    }
  };

  const monthSales = data.sales.filter(s => {
    const date = new Date(s.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthRepairs = data.repairs.filter(r => {
    const date = new Date(r.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalSales = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const salesProfit = monthSales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const repairsProfit = monthRepairs.reduce((sum, r) => sum + (r.profit || r.cost || 0), 0);
  const monthExpenses = data.expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + e.amount, 0);

  const netProfit = salesProfit + repairsProfit - monthExpenses;
  const activeRepairs = data.repairs.filter(r => !['تم التسليم', 'ملغاة'].includes(r.status)).length;

  const itemSales = {};
  data.sales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(it => {
            itemSales[it.item] = (itemSales[it.item] || 0) + it.quantity;
        });
    } else {
        itemSales[sale.item] = (itemSales[sale.item] || 0) + sale.quantity;
    }
  });
  const topItem = Object.entries(itemSales).sort((a, b) => b[1] - a[1])[0] || ['', 0];

  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(currentMonth - 5 + i);
    const mSales = data.sales.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    });
    return {
      month: month.toLocaleDateString('ar', { month: 'short' }),
      sales: mSales.reduce((sum, s) => sum + s.total, 0)
    };
  });

  const repairStatus = [
    { name: 'قيد الصيانة', value: data.repairs.filter(r => r.status === 'قيد الصيانة').length },
    { name: 'جاهز', value: data.repairs.filter(r => r.status === 'جاهز').length },
    { name: 'تم التسليم', value: data.repairs.filter(r => r.status === 'تم التسليم').length },
    { name: 'ملغاة', value: data.repairs.filter(r => r.status === 'ملغاة').length }
  ];

  // Stock Alerts - Combine all categories
  const stockAlerts = [
    ...(data.screens || []).filter(s => s.quantity < s.minQuantity).map(s => ({ ...s, category: 'شاشة', tab: 'screens' })),
    ...(data.phones || []).filter(p => p.quantity < p.minQuantity).map(p => ({ ...p, name: p.model || p.name, category: 'جوال', tab: 'phones' })),
    ...(data.stickers || []).filter(st => st.quantity < st.minQuantity).map(st => ({ ...st, category: 'ملصق', tab: 'stickers' })),
    ...(data.accessories || []).filter(a => a.quantity < a.minQuantity).map(a => ({ ...a, category: 'إكسسوار', tab: 'accessories' })),
    ...(data.products || []).filter(p => p.quantity < p.minQuantity).map(p => ({ 
        ...p, 
        category: (data.categories?.find(c => c._id === (p.categoryId?._id || p.categoryId))?.name || 'منتج'), 
        tab: p.categoryId?._id || p.categoryId 
    }))
  ];

  const threeMonthsAgoThreshold = new Date();
  threeMonthsAgoThreshold.setMonth(currentMonth - 3);
  const oldSalesCount = data.sales.filter(s => new Date(s.date) < threeMonthsAgoThreshold).length;
  const oldRepairsCount = data.repairs.filter(r => new Date(r.date) < threeMonthsAgoThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">لوحة التحكم الرئيسية</h2>
        <button
          onClick={() => setShowPrintTemplates(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Printer className="w-5 h-5" />
          طباعة وتقارير
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div 
          onClick={() => setActiveTab('reports')}
          className="group cursor-pointer bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1"
        >
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <DollarSign className="w-7 h-7" />
            </div>
            <p className="text-sm text-blue-100 font-medium">إجمالي المبيعات (الشهر)</p>
            <p className="text-3xl font-bold mt-1">{totalSales.toFixed(2)} <span className="text-lg">₪</span></p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('reports')}
          className="group cursor-pointer bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1"
        >
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <TrendingUp className="w-7 h-7" />
            </div>
            <p className="text-sm text-green-100 font-medium">صافي الربح</p>
            <p className="text-3xl font-bold mt-1">{netProfit.toFixed(2)} <span className="text-lg">₪</span></p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('repairs')}
          className="group cursor-pointer bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1"
        >
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <Wrench className="w-7 h-7" />
            </div>
            <p className="text-sm text-purple-100 font-medium">الصيانات النشطة</p>
            <p className="text-3xl font-bold mt-1">{activeRepairs}</p>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <Package className="w-7 h-7" />
            </div>
            <p className="text-sm text-orange-100 font-medium">أكثر صنف مبيعاً</p>
            <p className="text-xl font-bold mt-1 truncate">{topItem[0] || 'لا يوجد'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LineChart className="text-blue-500" />
            المبيعات الشهرية
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#0088FE" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PieChart className="text-purple-500" />
            حالة الصيانات
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={repairStatus} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name }) => name}>
                {repairStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            تنبيهات المخزون
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {stockAlerts.slice(0, 5).map((item, idx) => (
              <div key={idx} className="bg-red-50 border-r-4 border-red-500 p-4 rounded-l-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-red-800">{item.category}: {item.model || item.name}</p>
                  <p className="text-sm text-red-600">الكمية: {item.quantity} (الحد: {item.minQuantity})</p>
                </div>
                <button 
                  onClick={() => {
                    setView(item.tab);
                    setActiveTab('inventory');
                  }}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm font-medium"
                >
                  إعادة التموين
                </button>
              </div>
            ))}
            {stockAlerts.length === 0 && (
              <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded-l-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700 font-medium">المخزون ممتاز</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="text-blue-500" />
            إدارة البيانات القديمة
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-gray-800">سجلات قديمة (أكبر من 3 أشهر)</h4>
                    <p className="text-sm text-gray-600">{oldSalesCount + oldRepairsCount} سجلات قابلة للحذف</p>
                </div>
                <button
                  onClick={() => handleDeleteReports('all', 'الأقدم من 3 أشهر', oldSalesCount + oldRepairsCount)}
                  disabled={oldSalesCount + oldRepairsCount === 0}
                  className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-800">نصيحة الأداء</h4>
                <p className="text-sm text-blue-700">حذف السجلات القديمة يساعد في تسريع التطبيق وتقليل حجم البيانات.</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', count: 0, title: '', message: '' })}
        onConfirm={confirmDeleteReports}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {showPrintTemplates && (
        <PrintTemplates data={data} onClose={() => setShowPrintTemplates(false)} />
      )}
    </div>
  );
};

export default Dashboard;