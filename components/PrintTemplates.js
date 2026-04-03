'use client';
import React, { useState, useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

const PrintTemplates = ({ data, onClose }) => {
  const [templateType, setTemplateType] = useState('sale-a4');
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const componentRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=500,width=800');
    printWindow.document.write('<html><head><title>طباعة</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; direction: rtl; }
      @media print {
        body { margin: 0; padding: 20px; }
      }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(componentRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 100);
  };

  // A4 فاتورة مبيعات
  const SaleA4Template = ({ sale }) => (
    <div ref={componentRef} className="w-full bg-white p-8 text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-rose-800">SmartStore POS 🏬</h1>
        <p className="text-gray-600 mt-2">نظام إدارة المحل الذكي</p>
        <p className="text-sm text-gray-500">الرياض - شارع الملك عبدالعزيز</p>
        <p className="text-sm text-gray-500">الهاتف: +966 50 123 4567</p>
      </div>

      <div className="border-t-2 border-b-2 border-rose-800 py-4 mb-8">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-sm text-gray-600">رقم الفاتورة</p>
            <p className="text-2xl font-bold text-rose-800">#F-{sale.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">التاريخ</p>
            <p className="text-lg font-bold">{new Date(sale.date).toLocaleDateString('ar')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">الحالة</p>
            <p className="text-lg font-bold text-green-600">مكتملة</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-rose-800">بيانات العميل</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-bold text-lg">{sale.customer || 'عميل عام'}</p>
          <p className="text-sm text-gray-600">عدد المنتجات: {sale.items ? sale.items.length : 1}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-rose-800">تفاصيل المشتريات</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-rose-100">
              <th className="border border-gray-300 p-2 text-right">المنتج</th>
              <th className="border border-gray-300 p-2 text-center">الكمية</th>
              <th className="border border-gray-300 p-2 text-center">السعر</th>
              <th className="border border-gray-300 p-2 text-center">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sale.items && sale.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 p-2">{item.item}</td>
                <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-center">{item.price.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-center font-bold">{(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8 bg-rose-50 p-6 rounded">
        <div className="flex justify-between mb-2">
          <span className="font-bold">الإجمالي الفرعي:</span>
          <span className="text-lg font-bold">{(sale.subtotal || sale.total).toFixed(2)} ₪</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between mb-2 text-red-600">
            <span className="font-bold">الخصم ({sale.discountType === 'percentage' ? '%' : '₪'}):</span>
            <span className="text-lg font-bold">-{sale.discount}</span>
          </div>
        )}
        <div className="flex justify-between pt-4 border-t-2 border-rose-200">
          <span className="text-2xl font-bold text-rose-800">المجموع النهائي:</span>
          <span className="text-3xl font-bold text-rose-800">{sale.total.toFixed(2)} ₪</span>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 mt-8">
        <p>طريقة الدفع: {
          sale.paymentMethod === 'cash' ? 'نقداً' :
          sale.paymentMethod === 'card' ? 'بطاقة' :
          sale.paymentMethod === 'bank' ? 'تحويل بنكي' : 'محفظة'
        }</p>
        <p className="mt-4">شكراً لتعاملكم معنا 🙏</p>
        <p className="text-xs mt-4 text-gray-500">تاريخ الطباعة: {new Date().toLocaleString('ar')}</p>
      </div>
    </div>
  );

  // فاتورة حرارية (للكاشير)
  const ThermalReceiptTemplate = ({ sale }) => (
    <div ref={componentRef} className="w-80 bg-white text-gray-800 p-4" style={{ width: '80mm' }}>
      <div className="text-center mb-3 border-b pb-3">
        <h1 className="text-lg font-bold text-rose-800">SmartStore POS</h1>
        <p className="text-xs text-gray-600">وصل استلام</p>
      </div>

      <div className="text-xs space-y-1 mb-3 pb-3 border-b">
        <div className="flex justify-between">
          <span>التاريخ:</span>
          <span>{new Date(sale.date).toLocaleDateString('ar')}</span>
        </div>
        <div className="flex justify-between">
          <span>الوقت:</span>
          <span>{new Date(sale.date).toLocaleTimeString('ar')}</span>
        </div>
        <div className="flex justify-between">
          <span>الفاتورة:</span>
          <span>#F-{sale.id}</span>
        </div>
      </div>

      <div className="text-xs space-y-1 mb-3 pb-3 border-b">
        {sale.items && sale.items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between">
              <span className="font-bold">{item.item}</span>
              <span>{item.quantity}x {item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-end text-gray-600">
              {(item.quantity * item.price).toFixed(2)} ₪
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm font-bold space-y-1 mb-3 pb-3 border-b">
        <div className="flex justify-between">
          <span>الإجمالي:</span>
          <span>{(sale.subtotal || sale.total).toFixed(2)} ₪</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>الخصم:</span>
            <span>-{sale.discount}</span>
          </div>
        )}
        <div className="flex justify-between text-rose-700 text-lg">
          <span>المجموع:</span>
          <span>{sale.total.toFixed(2)} ₪</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 space-y-1">
        <p>الدفع: {
          sale.paymentMethod === 'cash' ? 'نقداً' :
          sale.paymentMethod === 'card' ? 'بطاقة' : 'محفظة'
        }</p>
        <p className="pt-2">شكراً 🙏</p>
        <p className="text-xs text-gray-400">{new Date().toLocaleTimeString('ar')}</p>
      </div>
    </div>
  );

  // وصل استلام صيانة
  const RepairReceiptTemplate = ({ repair }) => (
    <div ref={componentRef} className="w-full bg-white p-8 text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-rose-800">SmartStore POS 🏬</h1>
        <p className="text-lg font-bold mt-2">وصل استلام صيانة</p>
      </div>

      <div className="border-2 border-rose-800 p-6 mb-6 rounded">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600">رقم الوصل</p>
            <p className="text-2xl font-bold text-rose-800">#R-{repair.id}</p>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-600">التاريخ والوقت</p>
            <p className="text-lg font-bold">{new Date(repair.date).toLocaleDateString('ar')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 text-rose-800">بيانات العميل</h3>
        <div className="bg-gray-50 p-4 rounded space-y-2">
          <p><span className="font-bold">الاسم:</span> {repair.customerName || 'غير محدد'}</p>
          <p><span className="font-bold">الهاتف:</span> {repair.phone || 'غير متوفر'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 text-rose-800">تفاصيل الجهاز</h3>
        <div className="bg-gray-50 p-4 rounded space-y-2">
          <p><span className="font-bold">نوع الجهاز:</span> {repair.device}</p>
          <p><span className="font-bold">المشكلة:</span> {repair.problem}</p>
          <p><span className="font-bold">ملاحظات إضافية:</span> {repair.notes || '-'}</p>
        </div>
      </div>

      <div className="mb-6 bg-yellow-50 p-4 rounded border-l-4 border-yellow-600">
        <p className="font-bold text-lg">التكلفة المتوقعة: {repair.cost.toFixed(2)} ₪</p>
      </div>

      <div className="text-center text-sm text-gray-600 space-y-2 mt-12 pt-6 border-t">
        <p>توقيع الاستقبال: _________________</p>
        <p className="text-xs text-gray-500">سيتم إخطاركم عند اكتمال الصيانة</p>
      </div>
    </div>
  );

  // وصل دفع مبلغ
  const PaymentVoucherTemplate = ({ sale }) => (
    <div ref={componentRef} className="w-full bg-white p-8 text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-rose-800">SmartStore POS 🏬</h1>
        <p className="text-2xl font-bold mt-4 bg-yellow-100 p-3 rounded inline-block">وصل دفع مبلغ</p>
      </div>

      <div className="border-2 border-rose-800 p-6 mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-gray-600">وصل رقم</p>
            <p className="text-3xl font-bold text-rose-800">#P-{Date.now().toString().slice(-6)}</p>
          </div>
          <div className="text-left">
            <p className="text-gray-600">التاريخ</p>
            <p className="text-2xl font-bold">{new Date().toLocaleDateString('ar')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 text-lg space-y-3">
        <div className="flex justify-between">
          <span className="font-bold">المبلغ (بالأرقام):</span>
          <span className="text-3xl font-bold text-rose-600">{sale.total.toFixed(2)} ₪</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">المبلغ (بالكلمات):</span>
          <span>{Math.floor(sale.total)} ريال و {Math.round((sale.total % 1) * 100)} هللة</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">العميل:</span>
          <span>{sale.customer || 'غير محدد'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">طريقة الدفع:</span>
          <span className="bg-green-100 px-3 py-1 rounded font-bold">
            {sale.paymentMethod === 'cash' ? 'نقداً' : sale.paymentMethod === 'card' ? 'بطاقة' : 'محفظة'}
          </span>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t space-y-4 text-center">
        <p>المستقبل: _____________________</p>
        <p>التوقيع: _____________________</p>
      </div>

      <div className="text-xs text-gray-500 text-center mt-8">
        صادر من: SmartStore POS | التاريخ: {new Date().toLocaleString('ar')}
      </div>
    </div>
  );

  // بطاقة معلومات المنتج
  const ProductCardTemplate = ({ product, type }) => (
    <div ref={componentRef} className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-lg shadow-lg" style={{ width: '250px', height: '350px' }}>
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">📱</div>
        <p className="text-2xl font-bold text-rose-800">{product.name || product.model}</p>
        <p className="text-sm text-gray-600">{type === 'screen' ? 'شاشة' : type === 'phone' ? 'جوال' : 'إكسسوار'}</p>
      </div>

      <div className="bg-white rounded p-3 mb-4 text-center">
        <p className="text-sm text-gray-600">السعر</p>
        <p className="text-3xl font-bold text-rose-600">{product.price.toFixed(2)} ₪</p>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between bg-white p-2 rounded">
          <span className="text-gray-600">المخزون:</span>
          <span className="font-bold">{product.quantity} وحدة</span>
        </div>
        <div className="flex justify-between bg-white p-2 rounded">
          <span className="text-gray-600">الحد الأدنى:</span>
          <span className="font-bold">{product.minQuantity || 0}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-auto pt-4 border-t">
        <p>SmartStore POS 🏬</p>
        <p className="text-gray-500">www.mobileshop.com</p>
      </div>
    </div>
  );

  // ملصقات أسعار
  const PriceLabelTemplate = ({ product, type }) => (
    <div ref={componentRef} className="bg-white" style={{ width: '100mm', height: '100mm' }}>
      <div className="w-full h-full flex flex-col items-center justify-center border-4 border-rose-600 p-4 text-center">
        <p className="text-sm text-gray-600">{type === 'screen' ? 'شاشة' : type === 'phone' ? 'جوال' : 'إكسسوار'}</p>
        <p className="text-lg font-bold text-gray-800 my-2">{product.name || product.model}</p>
        <div className="bg-rose-100 px-4 py-2 rounded">
          <p className="text-xs text-gray-600">السعر</p>
          <p className="text-4xl font-bold text-rose-800">{product.price.toFixed(2)}</p>
          <p className="text-sm text-rose-600">₪</p>
        </div>
      </div>
    </div>
  );

  // تقرير يومي
  const DailyReportTemplate = () => {
    const todaySales = data.sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
    const todayExpenses = data.expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
    const totalSales = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    return (
      <div ref={componentRef} className="w-full bg-white p-8 text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rose-800">SmartStore POS 🏬</h1>
          <p className="text-2xl font-bold mt-4">التقرير اليومي</p>
          <p className="text-lg text-gray-600 mt-2">{new Date().toLocaleDateString('ar')}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 p-6 rounded border-2 border-green-500 text-center">
            <p className="text-gray-600">إجمالي المبيعات</p>
            <p className="text-3xl font-bold text-green-600">{totalSales.toFixed(2)}</p>
            <p className="text-sm text-gray-600">({todaySales.length} عملية)</p>
          </div>

          <div className="bg-red-50 p-6 rounded border-2 border-red-500 text-center">
            <p className="text-gray-600">المصاريف</p>
            <p className="text-3xl font-bold text-red-600">{totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-600">({todayExpenses.length} بند)</p>
          </div>

          <div className="bg-blue-50 p-6 rounded border-2 border-blue-500 text-center">
            <p className="text-gray-600">الربح الصافي</p>
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{netProfit.toFixed(2)}</p>
            <p className="text-sm text-gray-600">₪</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-rose-800">تفاصيل المبيعات</h3>
          {todaySales.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-rose-100">
                  <th className="border p-2 text-right">الوقت</th>
                  <th className="border p-2 text-right">المنتج</th>
                  <th className="border p-2 text-center">الكمية</th>
                  <th className="border p-2 text-center">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.map(sale => (
                  <tr key={sale.id}>
                    <td className="border p-2">{new Date(sale.date).toLocaleTimeString('ar')}</td>
                    <td className="border p-2">{sale.items ? `${sale.items[0].item}...` : sale.item}</td>
                    <td className="border p-2 text-center">{sale.items ? sale.items.reduce((s, i) => s + i.quantity, 0) : sale.quantity}</td>
                    <td className="border p-2 text-center font-bold">{sale.total.toFixed(2)} ₪</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-8">لا توجد مبيعات اليوم</p>
          )}
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>تم الإنشاء بواسطة: نظام إدارة SmartStore POS</p>
          <p>{new Date().toLocaleString('ar')}</p>
        </div>
      </div>
    );
  };

  const renderTemplate = () => {
    switch (templateType) {
      case 'sale-a4':
        return selectedSale && <SaleA4Template sale={selectedSale} />;
      case 'thermal':
        return selectedSale && <ThermalReceiptTemplate sale={selectedSale} />;
      case 'repair-receipt':
        return selectedRepair && <RepairReceiptTemplate repair={selectedRepair} />;
      case 'payment-voucher':
        return selectedSale && <PaymentVoucherTemplate sale={selectedSale} />;
      case 'product-card':
        return selectedProduct && <ProductCardTemplate product={selectedProduct.data} type={selectedProduct.type} />;
      case 'price-label':
        return selectedProduct && <PriceLabelTemplate product={selectedProduct.data} type={selectedProduct.type} />;
      case 'daily-report':
        return <DailyReportTemplate />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-rose-800">🖨️ قوالب الطباعة المتقدمة</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-96">
          {/* القائمة الجانبية */}
          <div className="w-56 bg-gray-50 p-4 border-r overflow-y-auto">
            <div className="space-y-2">
              <button
                onClick={() => setTemplateType('sale-a4')}
                className={`w-full text-right p-3 rounded ${templateType === 'sale-a4' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                📄 فاتورة A4
              </button>
              <button
                onClick={() => setTemplateType('thermal')}
                className={`w-full text-right p-3 rounded ${templateType === 'thermal' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                🧾 فاتورة حرارية
              </button>
              <button
                onClick={() => setTemplateType('repair-receipt')}
                className={`w-full text-right p-3 rounded ${templateType === 'repair-receipt' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                🔧 وصل صيانة
              </button>
              <button
                onClick={() => setTemplateType('payment-voucher')}
                className={`w-full text-right p-3 rounded ${templateType === 'payment-voucher' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                💳 وصل دفع
              </button>
              <button
                onClick={() => setTemplateType('product-card')}
                className={`w-full text-right p-3 rounded ${templateType === 'product-card' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                📋 بطاقة منتج
              </button>
              <button
                onClick={() => setTemplateType('price-label')}
                className={`w-full text-right p-3 rounded ${templateType === 'price-label' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                🏷️ ملصق سعر
              </button>
              <button
                onClick={() => setTemplateType('daily-report')}
                className={`w-full text-right p-3 rounded ${templateType === 'daily-report' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                📊 تقرير يومي
              </button>
            </div>
          </div>

          {/* منطقة الإعدادات والمعاينة */}
          <div className="flex-1 p-6 overflow-y-auto">
            {['sale-a4', 'thermal', 'payment-voucher'].includes(templateType) && (
              <div className="mb-4">
                <label className="block font-bold mb-2">اختر المبيعة:</label>
                <select
                  value={selectedSale?.id || ''}
                  onChange={(e) => {
                    const sale = data.sales.find(s => s.id.toString() === e.target.value);
                    setSelectedSale(sale);
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">-- اختر مبيعة --</option>
                  {data.sales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      #{sale.id} - {sale.customer} ({sale.total.toFixed(2)} ₪)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateType === 'repair-receipt' && (
              <div className="mb-4">
                <label className="block font-bold mb-2">اختر الصيانة:</label>
                <select
                  value={selectedRepair?.id || ''}
                  onChange={(e) => {
                    const repair = (data.repairs || []).find(r => r.id.toString() === e.target.value);
                    setSelectedRepair(repair);
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">-- اختر صيانة --</option>
                  {(data.repairs || []).map(repair => (
                    <option key={repair.id} value={repair.id}>
                      #{repair.id} - {repair.device} ({repair.customerName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {['product-card', 'price-label'].includes(templateType) && (
              <div className="mb-4">
                <label className="block font-bold mb-2">اختر المنتج:</label>
                <select
                  value={selectedProduct?.data.id || ''}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split('-');
                    let product;
                    if (type === 'screen') product = data.screens.find(s => s.id.toString() === id);
                    else if (type === 'phone') product = data.phones?.find(p => p.id.toString() === id);
                    else if (type === 'sticker') product = data.stickers?.find(s => s.id.toString() === id);
                    else product = data.accessories.find(a => a.id.toString() === id);
                    if (product) setSelectedProduct({ data: product, type });
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">-- اختر منتج --</option>
                  {data.screens.map(s => <option key={s.id} value={`screen-${s.id}`}>{s.model} (شاشة)</option>)}
                  {data.phones?.map(p => <option key={p.id} value={`phone-${p.id}`}>{p.name || p.model} (جوال)</option>)}
                  {data.stickers?.map(s => <option key={s.id} value={`sticker-${s.id}`}>{s.name} (ملصق)</option>)}
                  {data.accessories.map(a => <option key={a.id} value={`accessory-${a.id}`}>{a.name} (إكسسوار)</option>)}
                </select>
              </div>
            )}

            {renderTemplate() && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  حفظ PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* معاينة القالب */}
        {renderTemplate() && (
          <div className="border-t p-6 bg-gray-50 max-h-96 overflow-auto">
            <div className="bg-white p-4 rounded print:hidden">
              {renderTemplate()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintTemplates;
