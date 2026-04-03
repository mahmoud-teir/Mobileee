import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Printer, X, AlertCircle, CreditCard, Wallet, Smartphone, Tag, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

const Invoice = ({ type, data, onClose }) => {
  const componentRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  // paymentMethod, discount and discountType are taken from the passed `data` (sale/repair)

  // التحقق من البيانات الأساسية
  useEffect(() => {
    if (data) {
      setIsLoading(false);
      
          // previously this component allowed editing payment/discount and restored
          // last values from localStorage. That behavior was removed: invoice
          // should only display discount/payment provided with the sale data.
    }
  }, [data]);

  // قيم افتراضية آمنة
  const safeData = useMemo(() => {
    if (!data) {
      return {
        id: Date.now(),
        date: new Date().toISOString(),
        item: 'منتج غير معروف',
        quantity: 1,
        price: 0,
        total: 0,
        customer: 'عميل غير معروف',
        phone: '',
        device: '',
        problem: '',
        cost: 0,
        status: 'قيد المعالجة',
        notes: '',
        itemType: 'screen',
        itemId: null,
        discount: 0,
        discountType: 'percentage',
        paymentMethod: 'غير محدد'
      };
    }
    
    return {
      id: data.id || Date.now(),
      date: data.date || new Date().toISOString(),
      item: data.item || 'منتج غير معروف',
      quantity: data.quantity || 1,
      price: data.price || 0,
      total: data.total || (data.quantity * data.price) || 0,
      customer: data.customer || data.customerName || 'عميل غير معروف',
      phone: data.phone || '',
      device: data.device || '',
      problem: data.problem || '',
      cost: data.cost || 0,
      status: data.status || 'قيد المعالجة',
      notes: data.notes || '',
      itemType: data.itemType || 'screen',
      itemId: data.itemId || null
      ,
      // new fields: support multi-item sales and saved discount/payment
      items: data.items || null,
      subtotal: data.subtotal || (data.items ? data.items.reduce((s, it) => s + ((it.quantity || 0) * (it.price || 0)), 0) : undefined),
      discount: typeof data.discount !== 'undefined' ? data.discount : 0,
      discountType: data.discountType || 'percentage',
      paymentMethod: data.paymentMethod || 'غير محدد'
    };
  }, [data]);


  // حساب المبلغ بعد الخصم
  const calculateDiscountedTotal = () => {
    const originalTotal = type === 'repair' ? safeData.cost : safeData.total;
    let discountedTotal = originalTotal;

    const disc = parseFloat(safeData.discount || 0);
    const discType = safeData.discountType || 'percentage';

    if (disc > 0) {
      if (discType === 'percentage') {
        discountedTotal = originalTotal * (1 - disc / 100);
      } else {
        discountedTotal = originalTotal - disc;
      }
    }

    return Math.max(0, discountedTotal).toFixed(2);
  };

  // حفظ كـ PDF
  const saveAsPDF = async () => {
    setIsLoading(true);
    try {
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاتورة_${type === 'repair' ? 'صيانة' : 'بيع'}_${safeData.id}.pdf`);
      
      alert('تم حفظ الفاتورة كـ PDF بنجاح!');
    } catch (error) {
      console.error('خطأ في حفظ PDF:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة كـ PDF. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ كـ صورة
  const saveAsImage = async () => {
    setIsLoading(true);
    try {
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      canvas.toBlob((blob) => {
        saveAs(blob, `فاتورة_${type === 'repair' ? 'صيانة' : 'بيع'}_${safeData.id}.png`);
        alert('تم حفظ الفاتورة كصورة بنجاح!');
      }, 'image/png');
    } catch (error) {
      console.error('خطأ في حفظ الصورة:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة كصورة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ كـ Word
  const saveAsWord = async () => {
    setIsLoading(true);
    try {
      const total = calculateDiscountedTotal();
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
                  text: 'فاتورة رسمية',
              heading: HeadingLevel.HEADING_1,
              alignment: 'center',
              spacing: { after: 200 }
            }),
            new Paragraph({
                  text: `كرزة موبايل 🍒`,
              heading: HeadingLevel.HEADING_2,
              alignment: 'center',
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: `نوع الفاتورة: ${type === 'repair' ? 'صيانة' : 'بيع'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `العميل: ${safeData.customer}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `التاريخ: ${new Date(safeData.date).toLocaleDateString('ar')}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `المجموع: ${type === 'repair' ? safeData.cost.toFixed(2) : (typeof safeData.subtotal !== 'undefined' ? safeData.subtotal.toFixed(2) : safeData.total.toFixed(2))} ₪`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `الخصم: ${safeData.discount || 0} ${safeData.discountType === 'percentage' ? '%' : '₪'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `المبلغ المستحق: ${total} ₪`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `طريقة الدفع: ${
                (safeData.paymentMethod || 'غير محدد') === 'cash' ? 'نقدي' :
                (safeData.paymentMethod || 'غير محدد') === 'card' ? 'بطاقة' :
                (safeData.paymentMethod || 'غير محدد') === 'bank' ? 'تحويل بنكي' :
                (safeData.paymentMethod || 'غير محدد') === 'mobile' ? 'محفظة إلكترونية' :
                'غير محدد'
              }`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `رقم الفاتورة: ${safeData.id}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: 'شكرًا لزيارتكم! نتمنى لكم تجربة ممتعة',
              alignment: 'center',
              spacing: { before: 100 }
            })
          ]
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `فاتورة_${type === 'repair' ? 'صيانة' : 'بيع'}_${safeData.id}.docx`);
      
      alert('تم حفظ الفاتورة كـ Word بنجاح!');
    } catch (error) {
      console.error('خطأ في حفظ Word:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة كـ Word. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ كـ نص عادي
  const saveAsText = () => {
    const total = calculateDiscountedTotal();
    const textContent = `
فاتورة رسمية
============
كرزة موبايل 🍒

نوع الفاتورة: ${type === 'repair' ? 'صيانة' : 'بيع'}
العميل: ${safeData.customer}
التاريخ: ${new Date(safeData.date).toLocaleDateString('ar')}
=============================

${type === 'repair' ? 
`نوع الجهاز: ${safeData.device}
المشكلة: ${safeData.problem}
التكلفة: ${safeData.cost.toFixed(2)} ₪` : 
`المنتج: ${safeData.item}
الكمية: ${safeData.quantity}
سعر الوحدة: ${safeData.price.toFixed(2)} ₪
المجموع: ${(typeof safeData.subtotal !== 'undefined' ? safeData.subtotal : safeData.total).toFixed(2)} ₪`
}

الخصم: ${safeData.discount || 0} ${safeData.discountType === 'percentage' ? '%' : '₪'}
المبلغ المستحق: ${total} ₪
طريقة الدفع: ${
  (safeData.paymentMethod || 'غير محدد') === 'cash' ? 'نقدي' :
  (safeData.paymentMethod || 'غير محدد') === 'card' ? 'بطاقة' :
  (safeData.paymentMethod || 'غير محدد') === 'bank' ? 'تحويل بنكي' :
  (safeData.paymentMethod || 'غير محدد') === 'mobile' ? 'محفظة إلكترونية' :
  'غير محدد'
}
رقم الفاتورة: ${safeData.id}

شكرًا لزيارتكم! نتمنى لكم تجربة ممتعة
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `فاتورة_${type === 'repair' ? 'صيانة' : 'بيع'}_${safeData.id}.txt`);
    
    alert('تم حفظ الفاتورة كنص عادي بنجاح!');
  };

  if (isLoading && !data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 shadow-2xl text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">جاري تحميل الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl text-center">
          <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">خطأ في البيانات</h3>
          <p className="text-gray-600 mb-4">لم يتم تحميل بيانات الفاتورة بشكل صحيح. الرجاء المحاولة مرة أخرى.</p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ar', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return new Date().toLocaleDateString('ar');
    }
  };

  // دالة للحصول على معلومات طريقة الدفع
  const getPaymentMethodInfo = (pm = safeData.paymentMethod || 'cash') => {
    switch(pm) {
      case 'cash':
        return { icon: Wallet, label: 'نقدي', color: 'bg-green-100 text-green-700' };
      case 'card':
        return { icon: CreditCard, label: 'بطاقة', color: 'bg-blue-100 text-blue-700' };
      case 'bank':
        return { icon: Smartphone, label: 'تحويل بنكي', color: 'bg-purple-100 text-purple-700' };
      case 'mobile':
        return { icon: Smartphone, label: 'محفظة إلكترونية', color: 'bg-indigo-100 text-indigo-700' };
      default:
        return { icon: Wallet, label: 'غير محدد', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const totalAmount = calculateDiscountedTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl relative">
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* منطقة الطباعة */}
        <div id="printable-area" ref={componentRef} className="p-8 print:p-4">
          {/* رأس الفاتورة */}
          <div className="border-b border-rose-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {/* اللوجو */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3 rounded-xl shadow-lg">
                  <span className="text-3xl">🍒</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent print:text-rose-800 print:text-2xl">
                    كرزة موبايل
                  </h1>
                  <p className="text-gray-600 text-sm mt-1 print:text-xs">نظام إدارة متكامل للمحلات</p>
                </div>
              </div>
              <div className="text-left">
                <div className={`px-4 py-2 rounded-xl inline-block font-bold shadow-sm ${
                  type === 'repair'
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200'
                    : 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                } print:text-sm`}>
                  {type === 'repair' ? 'فاتورة صيانة' : 'فاتورة بيع'}
                </div>
                <p className="mt-2 font-mono text-lg text-gray-700 print:text-base">#F-{safeData.id}</p>
              </div>
            </div>
            
            {/* معلومات العميل والتاريخ */}
                <div className="mt-6 bg-rose-50 p-4 rounded-lg print:p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-gray-800 text-lg print:text-base">العميل:</p>
                  <p className="text-xl font-medium text-gray-900 print:text-lg">
                    {type === 'repair' ? safeData.customerName || safeData.customer : safeData.customer}
                  </p>
                  {safeData.phone && (
                    <p className="text-gray-700 mt-1 print:text-sm">
                      هاتف: {safeData.phone}
                    </p>
                  )}
                </div>
                <div className="text-left md:text-right">
                  <p className="font-bold text-gray-800 text-lg print:text-base">التاريخ:</p>
                  <p className="text-xl font-medium text-gray-900 print:text-lg">{formatDate(safeData.date)}</p>
                  <p className="text-gray-700 mt-1 print:text-sm">
                    {new Date().toLocaleDateString('ar', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* تفاصيل الفاتورة */}
          <div className="mb-8 print:mb-6">
            {type === 'repair' ? (
              // فاتورة الصيانة
              <div className="space-y-6 print:space-y-4">
                <div className="bg-gray-50 p-5 rounded-lg print:p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-gray-800">نوع الجهاز:</span>
                      <p className="text-lg font-medium text-gray-900 mt-1 print:text-base">{safeData.device || 'غير محدد'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">المشكلة:</span>
                      <p className="text-lg font-medium text-red-600 mt-1 print:text-base">{safeData.problem || 'لم يتم تحديد المشكلة'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="font-bold text-gray-800">التكلفة:</span>
                    <p className="text-2xl font-bold text-blue-600 mt-1 print:text-xl">{safeData.cost.toFixed(2)} ₪</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-5 print:p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg print:text-base">حالة الصيانة:</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      safeData.status === 'تم التسليم' ? 'bg-green-100 text-green-700' :
                      safeData.status === 'جاهز' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {safeData.status}
                    </span>
                  </div>
                  
                  {safeData.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-bold text-gray-800 text-lg mb-2 print:text-base">ملاحظات:</p>
                      <p className="text-gray-700 leading-relaxed print:text-sm">{safeData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // فاتورة البيع
              <div>
                <table className="w-full mb-6 print:mb-4 border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 text-right font-bold text-gray-800 border print:text-sm">المنتج</th>
                      <th className="py-3 px-4 text-right font-bold text-gray-800 border print:text-sm">الكمية</th>
                      <th className="py-3 px-4 text-right font-bold text-gray-800 border print:text-sm">السعر</th>
                      <th className="py-3 px-4 text-right font-bold text-gray-800 border print:text-sm">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeData.items && safeData.items.length > 0 ? (
                      safeData.items.map((it, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-4 px-4 font-medium text-gray-900 print:text-sm">{it.item}</td>
                          <td className="py-4 px-4 font-bold text-blue-600 print:text-sm">{it.quantity}</td>
                          <td className="py-4 px-4 text-green-600 print:text-sm">{(it.price || 0).toFixed(2)} ₪</td>
                          <td className="py-4 px-4 font-bold text-green-600 print:text-sm">{((it.quantity || 0) * (it.price || 0)).toFixed(2)} ₪</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b">
                        <td className="py-4 px-4 font-medium text-gray-900 print:text-sm">{safeData.item}</td>
                        <td className="py-4 px-4 font-bold text-blue-600 print:text-sm">{safeData.quantity}</td>
                        <td className="py-4 px-4 text-green-600 print:text-sm">{safeData.price.toFixed(2)} ₪</td>
                        <td className="py-4 px-4 font-bold text-green-600 print:text-sm">{safeData.total.toFixed(2)} ₪</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold text-xl">
                      <td colSpan="3" className="text-left py-4 px-4 text-gray-800 border print:text-lg">الإجمالي:</td>
                      <td className="py-4 px-4 text-green-600 border print:text-lg">{(typeof safeData.subtotal !== 'undefined' ? safeData.subtotal : safeData.total).toFixed(2)} ₪</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            
            {/* ملخص الدفع والخصم (قراءة فقط) */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-100 mb-6">
              <h4 className="font-bold text-xl text-indigo-800 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                ملخص الدفع والخصم
              </h4>

                <div className="p-4 bg-white rounded-lg border border-rose-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">المجموع الأصلي:</span>
                  <span className="font-bold text-gray-900">{type === 'repair' ? safeData.cost.toFixed(2) : (typeof safeData.subtotal !== 'undefined' ? safeData.subtotal.toFixed(2) : safeData.total.toFixed(2))} ₪</span>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">قيمة الخصم:</span>
                  <span className={`font-bold ${parseFloat(safeData.discount || 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {parseFloat(safeData.discount || 0) > 0 ? `${safeData.discount}${(safeData.discountType === 'percentage' ? '%' : '₪')}` : '0'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                  <span className="font-bold text-lg text-indigo-800">المبلغ المستحق:</span>
                  <span className="font-bold text-xl text-green-600">{totalAmount} ₪</span>
                </div>

                <div className="mt-2 flex items-center justify-end text-sm text-indigo-600">
                    {(() => {
                      const paymentInfo = getPaymentMethodInfo(safeData.paymentMethod);
                      const IconComponent = paymentInfo.icon;
                      return (
                        <>
                          <IconComponent className="w-4 h-4 mr-1" />
                          <span>{paymentInfo.label}</span>
                        </>
                      );
                    })()}
                </div>
              </div>
            </div>
          </div>
          
          {/* تذييل الفاتورة */}
          <div className="border-t pt-6 text-center space-y-3">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg print:p-2 border border-rose-100">
              <p className="font-bold text-lg text-rose-800 print:text-base">
                شكراً لثقتك بنا! نتمنى لك تجربة ممتعة
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-gray-700 print:text-sm">
              <span>كرزة موبايل</span>
              <span className="hidden sm:inline">|</span>
              <span>خدمة العملاء على مدار الساعة</span>
            </div>
            <p className="text-gray-600 text-sm mt-1 print:text-xs">
              هذه الفاتورة صحيحة بدون ختم. يمكن التحقق من صحتها عبر النظام
            </p>

            {/* معلومات المطور */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-xs">
                نظام إدارة كرزة موبايل | تطوير وتصميم: <span className="text-rose-600 font-medium">Mahmoud AbuTeir</span>
              </p>
            </div>

            <div className="mt-2 pt-2 text-gray-500 text-sm print:hidden">
              <p>تفاصيل الدفع والخصم مأخوذة من بيانات الفاتورة ولا يمكن تعديلها هنا.</p>
            </div>
          </div>
        </div>
        
        {/* أزرار التحكم - خارج منطقة الطباعة */}
        <div className="p-4 border-t flex flex-col sm:flex-row justify-center gap-4 bg-gray-50 print:hidden">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={saveAsPDF}
              disabled={isLoading}
              className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="حفظ كـ PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={saveAsImage}
              disabled={isLoading}
              className={`bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="حفظ كصورة"
            >
              <Download className="w-4 h-4" />
              صورة
            </button>
            <button
              onClick={saveAsWord}
              disabled={isLoading}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="حفظ كـ Word"
            >
              <Download className="w-4 h-4" />
              Word
            </button>
            <button
              onClick={saveAsText}
              disabled={isLoading}
              className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="حفظ كنص"
            >
              <Download className="w-4 h-4" />
              نص
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition flex items-center gap-2 mt-2 sm:mt-0"
          >
            <X className="w-4 h-4" />
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;