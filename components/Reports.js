'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon, FileText, Trash2, AlertCircle, Calendar } from 'lucide-react';
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
        alert('تم حذف التقارير بنجاح!');
      }
    } catch (error) {
      console.error('خطأ في حذف التقارير:', error);
      alert('حدث خطأ أثناء حذف التقارير. الرجاء المحاولة مرة أخرى.');
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
      
      XLSX.utils.book_append_sheet(wb, salesSheet, 'التقرير الشهري');
      XLSX.utils.book_append_sheet(wb, itemsSheet, 'أفضل المنتجات');
      
      const fileName = `reports_smartstore_pos_${new Date().toLocaleDateString('ar').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert('تم تصدير التقرير بنجاح!');
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      alert('حدث خطأ أثناء التصدير. الرجاء المحاولة مرة أخرى.');
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