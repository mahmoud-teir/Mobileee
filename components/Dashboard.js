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

const Dashboard = ({ data, setActiveTab, setView, saveData }) => { // إضافة saveData كـ prop
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

  // حذف التقارير حسب النوع والنطاق الزمني
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
      
      switch(deleteConfirmation.type) {
        case 'sales':
          // إعادة الكميات إلى المخزون قبل الحذف
          const oldSales = data.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate < threeMonthsAgo;
          });
          
          // إعادة كمية كل بيع إلى المخزون
          let updatedScreens = [...data.screens];
          let updatedAccessories = [...data.accessories];
          
          oldSales.forEach(sale => {
            if (sale.itemType === 'screen') {
              const screenIndex = updatedScreens.findIndex(s => (s._id || s.id) === sale.itemId);
              if (screenIndex !== -1) {
                updatedScreens[screenIndex].quantity += sale.quantity;
              }
            } else if (sale.itemType === 'accessory') {
              const accessoryIndex = updatedAccessories.findIndex(a => (a._id || a.id) === sale.itemId);
              if (accessoryIndex !== -1) {
                updatedAccessories[accessoryIndex].quantity += sale.quantity;
              }
            }
          });
          
          // حفظ المخزون المحدّث
          await saveData('screens', updatedScreens);
          await saveData('accessories', updatedAccessories);
          
          // حذف المبيعات القديمة
          const filteredSales = data.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= threeMonthsAgo;
          });
          await saveData('sales', filteredSales);
          break;
          
        case 'repairs':
          const filteredRepairs = data.repairs.filter(repair => {
            const repairDate = new Date(repair.date);
            return repairDate >= threeMonthsAgo;
          });
          await saveData('repairs', filteredRepairs);
          break;
          
        case 'all':
          // إعادة كميات المبيعات القديمة إلى المخزون
          const allOldSales = data.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate < threeMonthsAgo;
          });
          
          let allUpdatedScreens = [...data.screens];
          let allUpdatedAccessories = [...data.accessories];
          
          allOldSales.forEach(sale => {
            if (sale.itemType === 'screen') {
              const screenIndex = allUpdatedScreens.findIndex(s => (s._id || s.id) === sale.itemId);
              if (screenIndex !== -1) {
                allUpdatedScreens[screenIndex].quantity += sale.quantity;
              }
            } else if (sale.itemType === 'accessory') {
              const accessoryIndex = allUpdatedAccessories.findIndex(a => (a._id || a.id) === sale.itemId);
              if (accessoryIndex !== -1) {
                allUpdatedAccessories[accessoryIndex].quantity += sale.quantity;
              }
            }
          });
          
          // حفظ المخزون المحدّث
          await saveData('screens', allUpdatedScreens);
          await saveData('accessories', allUpdatedAccessories);
          
          // حذف جميع التقارير القديمة
          const filteredAllSales = data.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= threeMonthsAgo;
          });
          const filteredAllRepairs = data.repairs.filter(repair => {
            const repairDate = new Date(repair.date);
            return repairDate >= threeMonthsAgo;
          });
          
          await saveData('sales', filteredAllSales);
          await saveData('repairs', filteredAllRepairs);
          break;
        default:
          console.warn('نوع حذف غير معروف:', deleteConfirmation.type);
          return;
      }
      
      setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', count: 0, title: '', message: '' });
      alert(`تم حذف ${deleteConfirmation.count} سجل${deleteConfirmation.count > 1 ? 'ات' : ''} بنجاح!`);
    } catch (error) {
      console.error('خطأ في حذف التقارير:', error);
      alert('حدث خطأ أثناء حذف التقارير. الرجاء المحاولة مرة أخرى.');
    }
  };

  // حساب البيانات المطلوبة
  const monthSales = data.sales.filter(s => {
    const date = new Date(s.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthRepairs = data.repairs.filter(r => {
    const date = new Date(r.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalSales = monthSales.reduce((sum, s) => sum + s.total, 0);
  // حساب الربح الصافي من المبيعات (سعر البيع - سعر التكلفة)
  const salesProfit = monthSales.reduce((sum, s) => sum + (s.profit || 0), 0);
  // حساب الربح الصافي من الصيانة
  const repairsProfit = monthRepairs.reduce((sum, r) => sum + (r.profit || r.cost || 0), 0);
  const monthExpenses = data.expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + e.amount, 0);

  // الربح الصافي = ربح المبيعات + ربح الصيانة - المصاريف
  const netProfit = salesProfit + repairsProfit - monthExpenses;
  const activeRepairs = data.repairs.filter(r => !['تم التسليم', 'ملغاة'].includes(r.status)).length;

  // أكثر صنف مبيعاً
  const itemSales = {};
  data.sales.forEach(sale => {
    itemSales[sale.item] = (itemSales[sale.item] || 0) + sale.quantity;
  });
  const topItem = Object.entries(itemSales).sort((a, b) => b[1] - a[1])[0] || ['', 0];

  // بيانات المبيعات الشهرية
  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(currentMonth - 5 + i);
    const monthSales = data.sales.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    });
    return {
      month: month.toLocaleDateString('ar', { month: 'short' }),
      sales: monthSales.reduce((sum, s) => sum + s.total, 0)
    };
  });

  // بيانات حالة الصيانة
  const repairStatus = [
    { name: 'قيد الصيانة', value: data.repairs.filter(r => r.status === 'قيد الصيانة').length },
    { name: 'جاهز', value: data.repairs.filter(r => r.status === 'جاهز').length },
    { name: 'تم التسليم', value: data.repairs.filter(r => r.status === 'تم التسليم').length },
    { name: 'ملغاة', value: data.repairs.filter(r => r.status === 'ملغاة').length }
  ];

  // تحليل المنتجات الأكثر مبيعاً
  const topSellingItems = Object.entries(itemSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  // تحليل التقارير القديمة
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(currentMonth - 3);
  
  const oldSales = data.sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate < threeMonthsAgo;
  });
  
  const oldRepairs = data.repairs.filter(repair => {
    const repairDate = new Date(repair.date);
    return repairDate < threeMonthsAgo;
  });

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
      
      {/* المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* بطاقة المبيعات */}
        <div className="group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-16 -mr-8 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -mb-12 -ml-6"></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <DollarSign className="w-7 h-7" />
            </div>
            <p className="text-sm text-blue-100 font-medium">إجمالي المبيعات (الشهر)</p>
            <p className="text-3xl font-bold mt-1">{totalSales.toFixed(2)} <span className="text-lg">₪</span></p>
          </div>
        </div>

        {/* بطاقة الربح */}
        <div className="group bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-16 -mr-8 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -mb-12 -ml-6"></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <TrendingUp className="w-7 h-7" />
            </div>
            <p className="text-sm text-green-100 font-medium">صافي الربح</p>
            <p className="text-3xl font-bold mt-1">{netProfit.toFixed(2)} <span className="text-lg">₪</span></p>
          </div>
        </div>

        {/* بطاقة الصيانات */}
        <div className="group bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-16 -mr-8 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -mb-12 -ml-6"></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <Wrench className="w-7 h-7" />
            </div>
            <p className="text-sm text-purple-100 font-medium">الصيانات النشطة</p>
            <p className="text-3xl font-bold mt-1">{activeRepairs}</p>
          </div>
        </div>

        {/* بطاقة أكثر صنف مبيعاً */}
        <div className="group bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-16 -mr-8 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -mb-12 -ml-6"></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-lg">
              <Package className="w-7 h-7" />
            </div>
            <p className="text-sm text-orange-100 font-medium">أكثر صنف مبيعاً</p>
            <p className="text-xl font-bold mt-1 truncate">{topItem[0] || 'لا يوجد'}</p>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LineChart className="text-blue-500" />
            المبيعات الشهرية (آخر 6 أشهر)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#0088FE" 
                name="المبيعات" 
                strokeWidth={3}
                dot={{ fill: '#0088FE', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
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
              <Pie
                data={repairStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {repairStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* تنبيهات المخزون والإجراءات السريعة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تنبيهات المخزون */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            تنبيهات المخزون
          </h3>
          <div className="space-y-2">
            {data.screens.filter(s => s.quantity < s.minQuantity).map(screen => (
              <div key={screen._id || screen.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-red-800">شاشة {screen.model}</p>
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    الكمية: {screen.quantity} (الحد الأدنى: {screen.minQuantity})
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setView('screens');
                    setActiveTab('inventory');
                  }}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition text-sm font-medium flex items-center gap-1"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  إعادة التموين
                </button>
              </div>
            ))}
            {data.accessories.filter(a => a.quantity < a.minQuantity).map(acc => (
              <div key={acc._id || acc.id} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-orange-800">{acc.name}</p>
                  <p className="text-sm text-orange-600 flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    الكمية: {acc.quantity} (الحد الأدنى: {acc.minQuantity})
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setView('accessories');
                    setActiveTab('inventory');
                  }}
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 transition text-sm font-medium flex items-center gap-1"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  إعادة التموين
                </button>
              </div>
            ))}
            {data.screens.filter(s => s.quantity < s.minQuantity).length === 0 && 
             data.accessories.filter(a => a.quantity < a.minQuantity).length === 0 && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700 font-medium">جميع الأصناف متوفرة بكميات كافية</p>
              </div>
            )}
          </div>
        </div>
        
        {/* إدارة الفواتير/التقارير */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="text-blue-500" />
            إدارة الفواتير والسجلات
          </h3>
          <div className="space-y-3">
            {/* تقارير المبيعات القديمة */}
            <div className={`p-4 rounded-lg border ${
              oldSales.length > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-800 flex items-center gap-1">
                      <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                      فواتير المبيعات القديمة
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      oldSales.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {oldSales.length} {oldSales.length > 1 ? 'فاتورة' : 'فاتورة'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {oldSales.length > 0 
                      ? 'فواتير أقدم من 3 أشهر تحتاج للمراجعة' 
                      : 'لا توجد فواتير قديمة - البيانات نظيفة'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    آخر تحديث: {new Date().toLocaleDateString('ar')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteReports('sales', 'الأقدم من 3 أشهر', oldSales.length)}
                  disabled={oldSales.length === 0}
                  className={`p-2 rounded-full ${
                    oldSales.length > 0 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={oldSales.length > 0 ? 'حذف الفواتير القديمة' : 'لا توجد فواتير للحذف'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* تقارير الصيانة القديمة */}
            <div className={`p-4 rounded-lg border ${
              oldRepairs.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-800 flex items-center gap-1">
                      <Wrench className="w-4 h-4 text-purple-500" />
                      فواتير الصيانة القديمة
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      oldRepairs.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {oldRepairs.length} {oldRepairs.length > 1 ? 'فاتورة' : 'فاتورة'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {oldRepairs.length > 0 
                      ? 'فواتير صيانة أقدم من 3 أشهر' 
                      : 'لا توجد فواتير صيانة قديمة'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    آخر تحديث: {new Date().toLocaleDateString('ar')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteReports('repairs', 'الأقدم من 3 أشهر', oldRepairs.length)}
                  disabled={oldRepairs.length === 0}
                  className={`p-2 rounded-full ${
                    oldRepairs.length > 0 
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={oldRepairs.length > 0 ? 'حذف فواتير الصيانة القديمة' : 'لا توجد فواتير للحذف'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* حذف جميع التقارير */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <Database className="w-4 h-4 text-blue-500" />
                    تنظيف قاعدة البيانات
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    احذف جميع السجلات الأقدم من 3 أشهر لتحسين أداء النظام
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    ⚠️ تحذير: هذه العملية لا يمكن التراجع عنها
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteReports('all', 'الأقدم من 3 أشهر', oldSales.length + oldRepairs.length)}
                  disabled={oldSales.length + oldRepairs.length === 0}
                  className={`p-2 rounded-full ${
                    oldSales.length + oldRepairs.length > 0 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={oldSales.length + oldRepairs.length > 0 ? 'حذف جميع السجلات القديمة' : 'لا توجد سجلات للحذف'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مودال التأكيد للحذف */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', count: 0, title: '', message: '' })}
        onConfirm={confirmDeleteReports}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
        iconType="delete"
      />

      {/* مودال قوالب الطباعة */}
      {showPrintTemplates && (
        <PrintTemplates
          data={data}
          onClose={() => setShowPrintTemplates(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;