'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon, FileText, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import ConfirmationModal from './ConfirmationModal';

const Reports = ({ data, saveData }) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    type: '',
    dateRange: '',
    message: ''
  });

  // تحليل البيانات الشهرية
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(i);
    return {
      month: date.toLocaleDateString('ar', { month: 'long' }),
      index: i
    };
  });

  const monthlyData = months.map(({ month, index }) => {
    const monthSales = data.sales.filter(s => new Date(s.date).getMonth() === index);
    const monthRepairs = data.repairs.filter(r => new Date(r.date).getMonth() === index);
    const monthExpenses = data.expenses.filter(e => new Date(e.date).getMonth() === index);

    const sales = monthSales.reduce((sum, s) => sum + s.total, 0);
    const repairs = monthRepairs.reduce((sum, r) => sum + (r.cost || 0), 0);
    const expenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    // حساب الربح الصافي من المبيعات (سعر البيع - سعر التكلفة)
    const salesProfit = monthSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    // حساب الربح الصافي من الصيانة
    const repairsProfit = monthRepairs.reduce((sum, r) => sum + (r.profit || r.cost || 0), 0);
    // الربح الإجمالي = ربح المبيعات + ربح الصيانة - المصاريف
    const totalProfit = salesProfit + repairsProfit - expenses;

    return {
      month,
      sales,
      repairs,
      expenses,
      salesProfit,
      repairsProfit,
      profit: totalProfit // صافي الربح بعد خصم المصاريف
    };
  });

  // حذف التقارير حسب النطاق الزمني
  const handleDeleteReports = (type, dateRange) => {
    let message = '';
    let title = '';
    
    switch(type) {
      case 'sales':
        title = 'حذف تقارير المبيعات';
        message = `هل أنت متأكد من حذف جميع تقارير المبيعات ${dateRange}? لن تتمكن من استعادة هذه البيانات.`;
        break;
      case 'expenses':
        title = 'حذف تقارير المصاريف';
        message = `هل أنت متأكد من حذف جميع تقارير المصاريف ${dateRange}? لن تتمكن من استعادة هذه البيانات.`;
        break;
      case 'all':
        title = 'حذف جميع التقارير';
        message = `هل أنت متأكد من حذف جميع التقارير المالية ${dateRange}? هذه العملية لا يمكن التراجع عنها.`;
        break;
      default:
        return;
    }
    
    setDeleteConfirmation({
      isOpen: true,
      type: type,
      dateRange: dateRange,
      message: message,
      title: title
    });
  };

  const confirmDeleteReports = async () => {
    try {
      if (deleteConfirmation.type) {
        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
        
        switch(deleteConfirmation.type) {
          case 'sales':
            const filteredSales = data.sales.filter(sale => {
              const saleDate = new Date(sale.date);
              return saleDate < threeMonthsAgo;
            });
            await saveData('sales', filteredSales);
            break;
            
          case 'expenses':
            const filteredExpenses = data.expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate < threeMonthsAgo;
            });
            await saveData('expenses', filteredExpenses);
            break;
            
          case 'all':
            const filteredAllSales = data.sales.filter(sale => {
              const saleDate = new Date(sale.date);
              return saleDate < threeMonthsAgo;
            });
            const filteredAllExpenses = data.expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate < threeMonthsAgo;
            });
            await saveData('sales', filteredAllSales);
            await saveData('expenses', filteredAllExpenses);
            break;
        }
        
        setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', message: '', title: '' });
        toast.success('تم حذف التقارير بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف التقارير:', error);
      toast.error('حدث خطأ أثناء حذف التقارير. الرجاء المحاولة مرة أخرى.');
    }
  };

  // تصدير البيانات إلى Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // ورقة المبيعات الشهرية
      const salesSheet = XLSX.utils.json_to_sheet(monthlyData.map(item => ({
        الشهر: item.month,
        المبيعات: item.sales.toFixed(2),
        المصاريف: item.expenses.toFixed(2),
        'صافي الربح': item.profit.toFixed(2)
      })));
      
      // ورقة أفضل المنتجات
      const itemSales = {};
      data.sales.forEach(sale => {
        itemSales[sale.item] = (itemSales[sale.item] || 0) + sale.quantity;
      });
      
      const topItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, quantity]) => ({ المنتج: name, 'الكمية المباعة': quantity }));
      
      const itemsSheet = XLSX.utils.json_to_sheet(topItems);
      
      // ورقة تفصيل الأرباح
      const profitByItemMap = {};
      (data.sales || []).forEach(sale => {
        const items = sale.items || (sale.item ? [{ item: sale.item, quantity: sale.quantity, price: sale.price, cost: sale.cost || 0 }] : []);
        items.forEach(it => {
          if (!profitByItemMap[it.item]) {
            profitByItemMap[it.item] = { quantity: 0, sales: 0, cost: 0, profit: 0 };
          }
          const q = it.quantity || 0;
          const s = q * (it.price || 0);
          const c = q * (it.cost || 0);
          profitByItemMap[it.item].quantity += q;
          profitByItemMap[it.item].sales += s;
          profitByItemMap[it.item].cost += c;
          profitByItemMap[it.item].profit += (s - c);
        });
      });

      const profitDetailRows = Object.entries(profitByItemMap)
        .sort((a, b) => b[1].profit - a[1].profit)
        .map(([name, stats]) => ({
          المنتج: name,
          'الكمية المباعة': stats.quantity,
          'إجمالي المبيعات': stats.sales.toFixed(2),
          'إجمالي التكلفة': stats.cost.toFixed(2),
          'صافي الربح': stats.profit.toFixed(2),
          'هامش الربح %': (stats.sales > 0 ? ((stats.profit / stats.sales) * 100).toFixed(1) : 0) + '%'
        }));
      
      const profitSheet = XLSX.utils.json_to_sheet(profitDetailRows);
      
      XLSX.utils.book_append_sheet(wb, salesSheet, 'التقرير الشهري');
      XLSX.utils.book_append_sheet(wb, itemsSheet, 'أفضل المنتجات');
      XLSX.utils.book_append_sheet(wb, profitSheet, 'تفصيل الأرباح');
      
      const fileName = `reports_smartstore_pos_${new Date().toLocaleDateString('ar').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('تم تصدير التقرير بنجاح!');
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      toast.error('حدث خطأ أثناء التصدير. الرجاء المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">التقارير المالية المتقدمة</h2>
          <p className="text-gray-600 mt-1">تحليل شامل لأداء المحل مع إمكانية الحذف والإدارة</p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition"
        >
          <FileText className="w-5 h-5" />
          تصدير إلى Excel
        </button>
      </div>
      
      {/* خيارات حذف التقارير */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trash2 className="text-red-500" />
          إدارة التقارير
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h4 className="font-bold text-red-800 mb-2">حذف تقارير المبيعات</h4>
            <p className="text-sm text-red-700 mb-3">يمكنك حذف المبيعات الأقدم من 3 أشهر</p>
            <button
              onClick={() => handleDeleteReports('sales', 'الأقدم من 3 أشهر')}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition text-sm font-medium"
            >
              <Trash2 className="w-4 h-4 inline-block mr-1" />
              حذف المبيعات القديمة
            </button>
          </div>
          
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <h4 className="font-bold text-orange-800 mb-2">حذف تقارير المصاريف</h4>
            <p className="text-sm text-orange-700 mb-3">يمكنك حذف المصاريف الأقدم من 3 أشهر</p>
            <button
              onClick={() => handleDeleteReports('expenses', 'الأقدم من 3 أشهر')}
              className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition text-sm font-medium"
            >
              <Trash2 className="w-4 h-4 inline-block mr-1" />
              حذف المصاريف القديمة
            </button>
          </div>
          
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h4 className="font-bold text-purple-800 mb-2">حذف جميع التقارير</h4>
            <p className="text-sm text-purple-700 mb-3">حذف جميع البيانات المالية الأقدم من 3 أشهر</p>
            <button
              onClick={() => handleDeleteReports('all', 'الأقدم من 3 أشهر')}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 inline-block mr-1" />
              حذف جميع التقارير
            </button>
          </div>
        </div>
      </div>

      {/* جدول تفصيل الربح حسب المنتج */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-rose-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-rose-800">تفصيل الربح حسب المنتج</h3>
          <span className="text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">تحليل مصادر الربح</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold">المنتج / الصنف</th>
                <th className="p-4 font-bold">الكمية المباعة</th>
                <th className="p-4 font-bold">إجمالي المبيعات</th>
                <th className="p-4 font-bold">إجمالي التكلفة</th>
                <th className="p-4 font-bold">صافي الربح</th>
                <th className="p-4 font-bold text-center">هامش الربح</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const profitByItem = {};
                (data.sales || []).forEach(sale => {
                  const items = sale.items || (sale.item ? [{ item: sale.item, quantity: sale.quantity, price: sale.price, cost: sale.cost || 0, type: sale.itemType }] : []);
                  items.forEach(it => {
                    if (!profitByItem[it.item]) {
                      profitByItem[it.item] = { quantity: 0, sales: 0, cost: 0, profit: 0, type: it.type || it.itemType };
                    }
                    const q = it.quantity || 0;
                    const s = q * (it.price || 0);
                    const c = q * (it.cost || 0);
                    profitByItem[it.item].quantity += q;
                    profitByItem[it.item].sales += s;
                    profitByItem[it.item].cost += c;
                    profitByItem[it.item].profit += (s - c);
                  });
                });

                return Object.entries(profitByItem)
                  .sort((a, b) => b[1].profit - a[1].profit)
                  .map(([name, stats], idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">
                        {name}
                        <span className="block text-xs text-gray-400">{(stats.type === 'screen' ? 'شاشة' : stats.type === 'phone' ? 'جوال' : stats.type === 'sticker' ? 'ملصق' : stats.type === 'accessory' ? 'إكسسوار' : stats.type === 'product' ? 'منتج عام' : stats.type) || 'غير محدد'}</span>
                      </td>
                      <td className="p-4 text-gray-600">{stats.quantity}</td>
                      <td className="p-4 font-medium text-green-600">{stats.sales.toFixed(2)} ₪</td>
                      <td className="p-4 text-gray-500">{stats.cost.toFixed(2)} ₪</td>
                      <td className="p-4 font-bold text-blue-600">{stats.profit.toFixed(2)} ₪</td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                          {stats.sales > 0 ? ((stats.profit / stats.sales) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </tr>
                  ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* سجل المبيعات التفصيلي */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-blue-800">سجل المبيعات التفصيلي</h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">أحدث المبيعات</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 font-bold">التاريخ</th>
                <th className="p-3 font-bold">المنتجات</th>
                <th className="p-3 font-bold">العميل</th>
                <th className="p-3 font-bold">الإجمالي</th>
                <th className="p-3 font-bold">الربح</th>
                <th className="p-3 font-bold">الدفع</th>
              </tr>
            </thead>
            <tbody>
              {(data.sales || []).slice().reverse().slice(0, 50).map((sale, idx) => {
                const totalItemProfit = (sale.items || []).reduce((sum, it) => sum + ((it.price - (it.cost || 0)) * it.quantity), 0) || sale.profit || 0;
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-500">{new Date(sale.date).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {(sale.items || []).map((it, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-gray-800 font-medium">{it.item} x{it.quantity}</span>
                            <span className="text-blue-600 font-bold">{((it.price - (it.cost||0)) * it.quantity).toFixed(2)} ₪ ربح</span>
                          </div>
                        ))}
                        {!sale.items && <span className="text-gray-800">{sale.item} x{sale.quantity}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{sale.customerName || sale.customer || '---'}</td>
                    <td className="p-3 font-bold text-green-600">{sale.total.toFixed(2)} ₪</td>
                    <td className="p-3 font-bold text-blue-600 bg-blue-50/50">{totalItemProfit.toFixed(2)} ₪</td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {sale.paymentMethod === 'cash' ? 'نقدي' : sale.paymentMethod === 'bank' ? 'تحويل' : sale.paymentMethod === 'card' ? 'بطاقة' : sale.paymentMethod === 'mobile' ? 'محفظة' : sale.paymentMethod}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* الرسم البياني */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">الملخص السنوي</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)} ₪`, 'المبلغ']}
              labelFormatter={(label) => `الشهر: ${label}`}
            />
            <Legend />
            <Bar dataKey="sales" fill="#10b981" name="المبيعات" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="المصاريف" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#3b82f6" name="الربح" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* جدول التقارير */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold">التقرير الشهري المفصل</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>آخر تحديث: {new Date().toLocaleDateString('ar')}</span>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-right">الشهر</th>
              <th className="p-4 text-right">المبيعات</th>
              <th className="p-4 text-right">المصاريف</th>
              <th className="p-4 text-right">صافي الربح</th>
              <th className="p-4 text-right">نسبة النمو</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold">{row.month}</td>
                <td className="p-4 text-green-600">{row.sales.toFixed(2)} ₪</td>
                <td className="p-4 text-red-600">{row.expenses.toFixed(2)} ₪</td>
                <td className={`p-4 font-bold ${
                  row.profit >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {row.profit.toFixed(2)} ₪
                </td>
                <td className={`p-4 font-medium ${
                  i > 0 && monthlyData[i-1].profit !== 0 
                  ? (row.profit > monthlyData[i-1].profit ? 'text-green-600' : 'text-red-600')
                  : 'text-gray-500'
                }`}>
                  {i > 0 && monthlyData[i-1].profit !== 0
                    ? `${(((row.profit - monthlyData[i-1].profit) / monthlyData[i-1].profit) * 100).toFixed(1)}%`
                    : '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* مودال التأكيد للحذف */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', message: '', title: '' })}
        onConfirm={confirmDeleteReports}
        title={deleteConfirmation.title || "تأكيد الحذف"}
        message={deleteConfirmation.message || "هل أنت متأكد من هذه العملية؟"}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
        iconType="delete"
      />
    </div>
  );
};

export default Reports;