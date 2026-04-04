'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon, FileText, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from './LanguageContext';

const Reports = ({ data, saveData }) => {
  const { t, isRTL } = useLanguage();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    type: '',
    dateRange: '',
    message: '',
    title: ''
  });

  // تحليل البيانات الشهرية
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(i);
    return {
      month: date.toLocaleDateString(isRTL ? 'ar' : 'en', { month: 'long' }),
      index: i
    };
  });

  const monthlyData = months.map(({ month, index }) => {
    const monthSales = (data.sales || []).filter(s => new Date(s.date).getMonth() === index);
    const monthRepairs = (data.repairs || []).filter(r => new Date(r.date).getMonth() === index);
    const monthExpenses = (data.expenses || []).filter(e => new Date(e.date).getMonth() === index);

    const sales = monthSales.reduce((sum, s) => sum + s.total, 0);
    const repairs = monthRepairs.reduce((sum, r) => sum + (r.cost || 0), 0);
    const expenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // حساب الربح الصافي من المبيعات (سعر البيع - سعر التكلفة)
    const salesProfit = monthSales.reduce((sum, s) => {
      const profit = s.profit || (s.items || []).reduce((pSum, it) => pSum + ((it.price - (it.cost || 0)) * it.quantity), 0) || 0;
      return sum + profit;
    }, 0);
    
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
        title = t('reports.deleteSales');
        message = `${t('reports.deleteConfirmMsg')} (${dateRange})`;
        break;
      case 'expenses':
        title = t('reports.deleteExpenses');
        message = `${t('reports.deleteConfirmMsg')} (${dateRange})`;
        break;
      case 'all':
        title = t('reports.deleteAll');
        message = `${t('reports.deleteConfirmMsg')} (${dateRange})`;
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
        
        // Helper function to restore stock from old sales
        const restoreStock = async (salesToRestore) => {
          let collections = {
              screens: [...(data.screens || [])],
              phones: [...(data.phones || [])],
              stickers: [...(data.stickers || [])],
              accessories: [...(data.accessories || [])],
              products: [...(data.products || [])]
          };
          let updatedKeys = new Set();
          salesToRestore.forEach(sale => {
            const items = sale.items && Array.isArray(sale.items) ? sale.items : [{ productId: sale.itemId, type: sale.itemType, quantity: sale.quantity }];
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
          for (const key of updatedKeys) { await saveData(key, collections[key]); }
        };
        
        switch(deleteConfirmation.type) {
          case 'sales':
            const oldSales = (data.sales || []).filter(sale => new Date(sale.date) < threeMonthsAgo);
            await restoreStock(oldSales);
            const filteredSales = (data.sales || []).filter(sale => new Date(sale.date) >= threeMonthsAgo);
            await saveData('sales', filteredSales);
            break;
            
          case 'expenses':
            const filteredExpenses = (data.expenses || []).filter(expense => new Date(expense.date) >= threeMonthsAgo);
            await saveData('expenses', filteredExpenses);
            break;
            
          case 'all':
            const oldAllSales = (data.sales || []).filter(sale => new Date(sale.date) < threeMonthsAgo);
            await restoreStock(oldAllSales);
            const filteredAllSales = (data.sales || []).filter(sale => new Date(sale.date) >= threeMonthsAgo);
            const filteredAllExpenses = (data.expenses || []).filter(expense => new Date(expense.date) >= threeMonthsAgo);
            await saveData('sales', filteredAllSales);
            await saveData('expenses', filteredAllExpenses);
            break;
          default:
            break;
        }
        
        setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', message: '', title: '' });
        toast.success(t('reports.deleteSuccess'));
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      toast.error(t('reports.deleteError'));
    }
  };

  // تصدير البيانات إلى Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // ورقة المبيعات الشهرية
      const salesDataExcel = monthlyData.map(item => ({
        [t('reports.month')]: item.month,
        [t('reports.sales')]: item.sales.toFixed(2),
        [t('reports.expenses')]: item.expenses.toFixed(2),
        [t('reports.netProfit')]: item.profit.toFixed(2)
      }));
      const salesSheet = XLSX.utils.json_to_sheet(salesDataExcel);
      
      // ورقة أفضل المنتجات
      const itemSales = {};
      (data.sales || []).forEach(sale => {
        const items = sale.items || (sale.item ? [{ item: sale.item, quantity: sale.quantity }] : []);
        items.forEach(it => {
          itemSales[it.item] = (itemSales[it.item] || 0) + it.quantity;
        });
      });
      
      const topItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, quantity]) => ({ 
          [isRTL ? 'المنتج' : 'Product']: name, 
          [isRTL ? 'الكمية المباعة' : 'Sold Quantity']: quantity 
        }));
      
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
          [t('reports.productCategory')]: name,
          [t('reports.soldQty')]: stats.quantity,
          [t('reports.totalSales')]: stats.sales.toFixed(2),
          [t('reports.totalCost')]: stats.cost.toFixed(2),
          [t('reports.netProfit')]: stats.profit.toFixed(2),
          [t('reports.profitMargin')]: (stats.sales > 0 ? ((stats.profit / stats.sales) * 100).toFixed(1) : 0) + '%'
        }));
      
      const profitSheet = XLSX.utils.json_to_sheet(profitDetailRows);
      
      XLSX.utils.book_append_sheet(wb, salesSheet, isRTL ? 'التقرير الشهري' : 'Monthly Report');
      XLSX.utils.book_append_sheet(wb, itemsSheet, isRTL ? 'أفضل المنتجات' : 'Top Products');
      XLSX.utils.book_append_sheet(wb, profitSheet, isRTL ? 'تفصيل الأرباح' : 'Profit Details');
      
      const fileName = `reports_smartstore_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(t('reports.exportSuccess'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('reports.exportError'));
    }
  };

  const getProductTypeName = (type) => {
    switch(type) {
      case 'screen': return t('inventory.screen');
      case 'phone': return t('inventory.phone');
      case 'sticker': return t('inventory.sticker');
      case 'accessory': return t('inventory.accessory');
      case 'product': return t('inventory.product');
      default: return type || t('common.unknown');
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.title')}</h2>
          <p className={`text-gray-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.subtitle')}</p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition"
        >
          <FileText className="w-5 h-5" />
          {t('reports.exportExcel')}
        </button>
      </div>
      
      {/* خيارات إدارة التقارير */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          <Trash2 className="text-red-500" />
          {t('reports.manageTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-l-4 border-red-500 bg-red-50 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h4 className="font-bold text-red-800 mb-2">{t('reports.deleteSales')}</h4>
            <p className="text-sm text-red-700 mb-3">{t('reports.deleteSalesMsg')}</p>
            <button
              onClick={() => handleDeleteReports('sales', isRTL ? 'الأقدم من 3 أشهر' : 'Older than 3 months')}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('reports.deleteSalesBtn')}
            </button>
          </div>
          
          <div className={`p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h4 className="font-bold text-orange-800 mb-2">{t('reports.deleteExpenses')}</h4>
            <p className="text-sm text-orange-700 mb-3">{t('reports.deleteExpensesMsg')}</p>
            <button
              onClick={() => handleDeleteReports('expenses', isRTL ? 'الأقدم من 3 أشهر' : 'Older than 3 months')}
              className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('reports.deleteExpensesBtn')}
            </button>
          </div>
          
          <div className={`p-4 rounded-lg border-l-4 border-purple-500 bg-purple-50 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h4 className="font-bold text-purple-800 mb-2">{t('reports.deleteAll')}</h4>
            <p className="text-sm text-purple-700 mb-3">{t('reports.deleteAllMsg')}</p>
            <button
              onClick={() => handleDeleteReports('all', isRTL ? 'الأقدم من 3 أشهر' : 'Older than 3 months')}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition text-sm font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {t('reports.deleteAllBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* جدول الربح حسب المنتج */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className={`p-4 border-b bg-rose-50 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-xl font-bold text-rose-800">{t('reports.profitByProduct')}</h3>
          <span className="text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">{t('reports.profitSourceAnalysis')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold">{t('reports.productCategory')}</th>
                <th className="p-4 font-bold">{t('reports.soldQty')}</th>
                <th className="p-4 font-bold">{t('reports.totalSales')}</th>
                <th className="p-4 font-bold">{t('reports.totalCost')}</th>
                <th className="p-4 font-bold">{t('reports.netProfit')}</th>
                <th className="p-4 font-bold text-center">{t('reports.profitMargin')}</th>
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
                        <span className="block text-xs text-gray-400">{getProductTypeName(stats.type)}</span>
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
        <div className={`p-4 border-b bg-blue-50 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-xl font-bold text-blue-800">{t('reports.detailedSalesLog')}</h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">{t('reports.latestSales')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 font-bold">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="p-3 font-bold">{isRTL ? 'المنتجات' : 'Products'}</th>
                <th className="p-3 font-bold">{isRTL ? 'العميل' : 'Customer'}</th>
                <th className="p-3 font-bold">{isRTL ? 'الإجمالي' : 'Total'}</th>
                <th className="p-3 font-bold">{t('reports.profit')}</th>
                <th className="p-3 font-bold">{isRTL ? 'الدفع' : 'Payment'}</th>
              </tr>
            </thead>
            <tbody>
              {(data.sales || []).slice().reverse().slice(0, 50).map((sale, idx) => {
                const totalItemProfit = (sale.items || []).reduce((sum, it) => sum + ((it.price - (it.cost || 0)) * it.quantity), 0) || sale.profit || 0;
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-500">
                      {new Date(sale.date).toLocaleString(isRTL ? 'ar-EG' : 'en-US', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {(sale.items || []).map((it, i) => (
                          <div key={i} className={`flex items-center justify-between gap-4 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-gray-800 font-medium">{it.item} x{it.quantity}</span>
                            <span className="text-blue-600 font-bold">{((it.price - (it.cost||0)) * it.quantity).toFixed(2)} ₪ {t('reports.profit')}</span>
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
                        {sale.paymentMethod === 'cash' ? (isRTL ? 'نقدي' : 'Cash') : 
                         sale.paymentMethod === 'bank' ? (isRTL ? 'تحويل' : 'Transfer') : 
                         sale.paymentMethod === 'card' ? (isRTL ? 'بطاقة' : 'Card') : 
                         sale.paymentMethod === 'installments' ? (isRTL ? 'تقسيط' : 'Installments') :
                         sale.paymentMethod}
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
        <h3 className={`text-xl font-bold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.annualSummary')}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)} ₪`, '']}
              labelFormatter={(label) => `${t('reports.month')}: ${label}`}
              contentStyle={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}
            />
            <Legend />
            <Bar dataKey="sales" fill="#10b981" name={t('reports.sales')} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name={t('reports.expenses')} radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#3b82f6" name={t('reports.profit')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* التقرير الشهري المفصل */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className={`p-4 border-b bg-gray-50 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-xl font-bold">{t('reports.monthlyDetailedReport')}</h3>
          <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Calendar className="w-4 h-4" />
            <span>{t('reports.lastUpdate')}: {new Date().toLocaleDateString(isRTL ? 'ar' : 'en')}</span>
          </div>
        </div>
        <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">{t('reports.month')}</th>
              <th className="p-4">{t('reports.sales')}</th>
              <th className="p-4">{t('reports.expenses')}</th>
              <th className="p-4">{t('reports.profit')}</th>
              <th className="p-4">{t('reports.growthRate')}</th>
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
                    ? `${(((row.profit - monthlyData[i-1].profit) / Math.abs(monthlyData[i-1].profit)) * 100).toFixed(1)}%`
                    : '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: '', dateRange: '', message: '', title: '' })}
        onConfirm={confirmDeleteReports}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        confirmText={isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
        cancelText={isRTL ? 'إلغاء' : 'Cancel'}
        iconType="delete"
      />
    </div>
  );
};

export default Reports;