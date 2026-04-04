'use client';
import { useAuth } from './AuthContext';

const PrintTemplates = ({ data, onClose }) => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const [templateType, setTemplateType] = useState('sale-a4');
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const componentRef = useRef();

  const store = user?.currentStore || {};
  const storeName = store.name || t('app.name');
  const storeAddress = store.address || t('app.location');
  const storePhone = store.phone || t('app.phone');

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.write(`<html><head><title>${storeName} - ${t('common.print')}</title>`);
    printWindow.document.write('<style>');
    printWindow.document.write(`
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Inter:wght@400;700&display=swap');
      body { 
        font-family: ${isRTL ? "'Cairo', sans-serif" : "'Inter', sans-serif"}; 
        direction: ${isRTL ? 'rtl' : 'ltr'};
        color: #1f2937;
        margin: 0;
        padding: 0;
      }
      .invoice-container { padding: 40px; }
      .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 4px solid #9d174d; padding-bottom: 20px; }
      .store-info h1 { font-size: 32px; font-weight: 800; color: #9d174d; margin: 0; }
      .store-info p { font-size: 14px; color: #6b7280; margin: 4px 0; }
      .invoice-meta { text-align: ${isRTL ? 'left' : 'right'}; }
      .invoice-meta h2 { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
      .invoice-meta p { font-size: 14px; color: #6b7280; margin: 4px 0; }
      .billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
      .billing-box { background: #f9fafb; padding: 20px; rounded: 8px; border: 1px solid #e5e7eb; }
      .billing-box h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #9d174d; margin: 0 0 10px 0; font-weight: 700; }
      .items-table { w-full border-collapse: collapse; margin-bottom: 40px; }
      .items-table th { background: #9d174d; color: white; padding: 12px; text-align: ${isRTL ? 'right' : 'left'}; font-size: 14px; }
      .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
      .items-table tr:nth-child(even) { background: #fdf2f8; }
      .totals-section { display: flex; justify-content: flex-end; }
      .totals-box { width: 300px; }
      .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
      .total-row.final { border-top: 2px solid #9d174d; border-bottom: none; margin-top: 10px; color: #9d174d; }
      .footer { margin-top: 60px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      @media print {
        body { padding: 0; }
        .invoice-container { padding: 20px; }
      }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(componentRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // A4 Sale Invoice
  const SaleA4Template = ({ sale }) => (
    <div ref={componentRef} className="invoice-container bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="header">
        <div className="store-info">
          <h1>{storeName}</h1>
          <p>{t('app.subtitle')}</p>
          <p>{storeAddress}</p>
          <p>{storePhone}</p>
        </div>
        <div className="invoice-meta">
          <h2>{t('reports.sale')}</h2>
          <p><span className="font-bold">{t('print.receiptNumber')}:</span> #F-{sale.id}</p>
          <p><span className="font-bold">{t('common.date')}:</span> {new Date(sale.date).toLocaleDateString(language)}</p>
          <p><span className="font-bold">{t('common.status')}:</span> <span className="text-green-600 font-bold">{t('common.completed')}</span></p>
        </div>
      </div>

      <div className="billing-grid">
        <div className="billing-box">
          <h3>{t('customers.info') || t('nav.customers')}</h3>
          <p className="text-lg font-bold text-gray-900">{sale.customer || t('sales.cashCustomer')}</p>
          <p className="text-gray-600">{t('sales.paymentMethod')}: {
            sale.paymentMethod === 'cash' ? t('sales.cash') :
            sale.paymentMethod === 'card' ? t('sales.card') :
            sale.paymentMethod === 'bank' ? t('sales.bankTransfer') : t('sales.wallet')
          }</p>
        </div>
        <div className="billing-box">
          <h3>{t('sales.summary')}</h3>
          <p className="text-gray-600">{t('inventory.quantity')}: {sale.items ? sale.items.reduce((acc, item) => acc + item.quantity, 0) : 1}</p>
          <p className="text-gray-600">{t('print.printDate')}: {new Date().toLocaleString(language)}</p>
        </div>
      </div>

      <table className="items-table w-full">
        <thead>
          <tr>
            <th style={{ width: '50%' }}>{t('sales.product')}</th>
            <th className="text-center">{t('sales.quantity')}</th>
            <th className="text-center">{t('sales.price')}</th>
            <th className={`${isRTL ? 'text-left' : 'text-right'}`}>{t('sales.total')}</th>
          </tr>
        </thead>
        <tbody>
          {sale.items && sale.items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.item}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-center">{item.price.toFixed(2)}</td>
              <td className={`${isRTL ? 'text-left' : 'text-right'} font-bold`}>
                {(item.quantity * item.price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals-section">
        <div className="totals-box">
          <div className="total-row">
            <span>{t('sales.subtotal')}:</span>
            <span className="font-bold">{(sale.subtotal || sale.total).toFixed(2)} {t('dashboard.currency')}</span>
          </div>
          {sale.discount > 0 && (
            <div className="total-row text-red-600">
              <span>{t('sales.discount')}:</span>
              <span className="font-bold">-{sale.discount} {sale.discountType === 'percentage' ? '%' : ''}</span>
            </div>
          )}
          <div className="total-row final">
            <span className="text-xl font-extrabold">{t('sales.finalTotal')}:</span>
            <span className="text-2xl font-extrabold">{sale.total.toFixed(2)} {t('dashboard.currency')}</span>
          </div>
        </div>
      </div>

      <div className="footer">
        <p className="font-bold">{t('print.thanks')}</p>
        <p>{storeName} | {storeAddress} | {storePhone}</p>
        <p className="mt-2 font-mono" style={{ opacity: 0.5 }}>{t('print.issuedBy')}: SmartStore POS</p>
      </div>
    </div>
  );


  // Thermal Receipt (for cashier)
  const ThermalReceiptTemplate = ({ sale }) => (
    <div ref={componentRef} className="w-80 bg-white text-gray-900 p-4 font-mono select-none" style={{ width: '80mm' }}>
      <div className="text-center mb-4 border-b-2 border-dashed border-gray-300 pb-4">
        <h1 className="text-xl font-bold uppercase">{storeName}</h1>
        <p className="text-xs">{storeAddress}</p>
        <p className="text-xs">{storePhone}</p>
        <div className="mt-2 text-lg font-black tracking-widest border-2 border-black inline-block px-2">
          {t('reports.sale').toUpperCase()}
        </div>
      </div>

      <div className="text-xs space-y-1 mb-4 pb-4 border-b border-dashed border-gray-300">
        <div className="flex justify-between">
          <span className="font-bold">{t('common.date')}:</span>
          <span>{new Date(sale.date).toLocaleDateString(language)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('print.receiptNumber')}:</span>
          <span className="font-bold">#F-{sale.id}</span>
        </div>
      </div>

      <div className="text-xs mb-4 pb-4 border-b border-dashed border-gray-300">
        <div className="grid grid-cols-4 font-bold mb-2 border-b border-gray-200 pb-1">
          <div className="col-span-2">{t('sales.product')}</div>
          <div className="text-center">QTY</div>
          <div className="text-right">{t('sales.total')}</div>
        </div>
        {sale.items && sale.items.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className="grid grid-cols-4">
              <div className="col-span-2 line-clamp-2">{item.item}</div>
              <div className="text-center">x{item.quantity}</div>
              <div className="text-right font-bold">{(item.quantity * item.price).toFixed(2)}</div>
            </div>
            <div className="text-gray-500 text-[10px]">@{item.price.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="text-sm space-y-2 mb-4 pb-4 border-b-2 border-black">
        <div className="flex justify-between">
          <span>{t('sales.subtotal')}:</span>
          <span>{(sale.subtotal || sale.total).toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>{t('sales.discount')}:</span>
            <span>-{sale.discount}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-black pt-2 border-t border-gray-200">
          <span>TOTAL:</span>
          <span>{sale.total.toFixed(2)} {t('dashboard.currency')}</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-600 space-y-1 mt-4">
        <p className="font-bold uppercase">{t('print.thanks')}</p>
        <p>{new Date().toLocaleString(language)}</p>
        <div className="pt-4 opacity-30">Powered by SmartStore POS</div>
      </div>
    </div>
  );

  // Repair Receipt
  const RepairReceiptTemplate = ({ repair }) => (
    <div ref={componentRef} className="invoice-container bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="header" style={{ borderBottomColor: '#ca8a04' }}>
        <div className="store-info">
          <h1 style={{ color: '#ca8a04' }}>{storeName}</h1>
          <p>{t('repairs.title')}</p>
          <p>{storeAddress}</p>
          <p>{storePhone}</p>
        </div>
        <div className="invoice-meta">
          <h2 style={{ color: '#ca8a04' }}>{t('print.repairReceipt')}</h2>
          <p><span className="font-bold">{t('print.receiptNumber')}:</span> #R-{repair.id}</p>
          <p><span className="font-bold">{t('common.date')}:</span> {new Date(repair.date).toLocaleDateString(language)}</p>
        </div>
      </div>

      <div className="billing-grid">
        <div className="billing-box" style={{ borderLeft: '4px solid #ca8a04' }}>
          <h3>{t('customers.info')}</h3>
          <p className="text-lg font-bold">{repair.customerName || t('dashboard.none')}</p>
          <p className="text-gray-600">{t('common.phone')}: {repair.phone || '-'}</p>
        </div>
        <div className="billing-box">
          <h3>{t('repairs.device')}</h3>
          <p className="font-bold">{repair.device}</p>
          <p className="text-red-600 font-bold">{t('repairs.problem')}: {repair.problem}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">{t('repairs.details')}</h3>
        <div className="grid grid-cols-1 gap-4 text-lg">
          <div><span className="font-bold">{t('repairs.notes')}:</span> {repair.notes || '-'}</div>
          <div className="pt-4 border-t border-gray-200">
            <span className="text-2xl font-black text-yellow-700">
              {t('repairs.expectedCost')}: {repair.cost.toFixed(2)} {t('dashboard.currency')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-gray-200">
        <div className="text-center">
          <div className="border-b border-black mb-2 h-10 w-48 mx-auto"></div>
          <p className="text-sm">{t('print.signature')}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black mb-2 h-10 w-48 mx-auto"></div>
          <p className="text-sm uppercase">{t('print.receiver')}</p>
        </div>
      </div>

      <div className="footer mt-auto">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('repairs.notifyOnComplete')}</p>
        <p className="mt-4">{storeName} | {storePhone}</p>
      </div>
    </div>
  );


  // Payment Voucher
  const PaymentVoucherTemplate = ({ sale }) => (
    <div ref={componentRef} className="invoice-container bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="header" style={{ borderBottomColor: '#059669' }}>
        <div className="store-info">
          <h1 style={{ color: '#059669' }}>{storeName}</h1>
          <p>{t('print.paymentVoucher')}</p>
          <p>{storeAddress}</p>
        </div>
        <div className="invoice-meta">
          <h2 style={{ color: '#059669' }}>{t('print.paymentVoucherShort')}</h2>
          <p><span className="font-bold">{t('print.receiptNumber')}:</span> #PV-{Date.now().toString().slice(-6)}</p>
          <p><span className="font-bold">{t('common.date')}:</span> {new Date().toLocaleDateString(language)}</p>
        </div>
      </div>

      <div className="bg-emerald-50 p-10 rounded-2xl border-2 border-emerald-200 mb-10 text-center">
        <p className="text-emerald-800 text-sm font-bold uppercase tracking-widest mb-2">{t('print.amountDigits')}</p>
        <p className="text-6xl font-black text-emerald-600">
          {sale.total.toFixed(2)} <span className="text-2xl">{t('dashboard.currency')}</span>
        </p>
      </div>

      <div className="space-y-6 text-xl text-gray-800">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <span className="font-bold text-gray-500 w-48">{t('print.amountWords')}:</span>
          <span className="flex-1 italic">
            {t('print.amountWordsHint').replace('{riyals}', Math.floor(sale.total)).replace('{halalas}', Math.round((sale.total % 1) * 100))}
          </span>
        </div>
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <span className="font-bold text-gray-500 w-48">{t('common.name')}:</span>
          <span className="flex-1 font-bold">{sale.customer || t('dashboard.none')}</span>
        </div>
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <span className="font-bold text-gray-500 w-48">{t('sales.paymentMethod')}:</span>
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full font-bold">
            {sale.paymentMethod === 'cash' ? t('sales.cash') : sale.paymentMethod === 'card' ? t('sales.card') : t('sales.wallet')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-20 mt-32">
        <div className="text-center">
          <div className="border-b-2 border-gray-300 mb-4 h-12"></div>
          <p className="text-gray-500 font-bold uppercase">{t('print.signature')}</p>
        </div>
        <div className="text-center">
          <div className="border-b-2 border-gray-300 mb-4 h-12"></div>
          <p className="text-gray-500 font-bold uppercase">{t('print.receiver')}</p>
        </div>
      </div>

      <div className="footer mt-auto pt-10">
        <p className="font-mono text-[10px] opacity-40">{t('print.issuedBy')}: {t('app.name')} | {new Date().toLocaleString(language)}</p>
      </div>
    </div>
  );


  // Product Card Template
  const ProductCardTemplate = ({ product, type }) => (
    <div ref={componentRef} className="p-6 bg-white border-2 border-rose-100 rounded-3xl shadow-xl overflow-hidden relative" style={{ width: '80mm', height: '110mm' }}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0 opacity-50"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4 bg-rose-100 w-20 h-20 flex items-center justify-center rounded-2xl mx-auto">
            {type === 'screen' ? '📱' : type === 'phone' ? '📲' : type === 'sticker' ? '🎨' : '🔌'}
          </div>
          <h1 className="text-2xl font-black text-rose-900 leading-tight mb-1">{product.name || product.model}</h1>
          <p className="text-sm font-bold text-rose-400 uppercase tracking-widest">
            {type === 'screen' ? t('inventory.screen') : 
             type === 'phone' ? t('inventory.phone') : 
             type === 'sticker' ? t('inventory.sticker') : t('inventory.accessory')}
          </p>
        </div>

        <div className="bg-rose-900 rounded-2xl p-6 text-center text-white mb-6 shadow-lg shadow-rose-200">
          <p className="text-xs uppercase font-bold text-rose-300 mb-1">{t('sales.price')}</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-black">{product.price.toFixed(2)}</span>
            <span className="text-sm font-bold text-rose-300">{t('dashboard.currency')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400">{t('inventory.quantity')}</p>
            <p className="text-lg font-black text-gray-800">{product.quantity}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400">STORE</p>
            <p className="text-[10px] font-black text-rose-800 truncate">{storeName}</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[8px] text-gray-300 font-bold tracking-widest uppercase">SmartStore Premium Label</p>
      </div>
    </div>
  );


  // Price Label Template
  const PriceLabelTemplate = ({ product, type }) => (
    <div ref={componentRef} className="bg-white p-2 border-2 border-black" style={{ width: '50mm', height: '30mm' }}>
      <div className="h-full flex flex-col justify-between items-center text-center">
        <div className="w-full">
           <p className="text-[8px] font-black uppercase text-gray-400 border-b border-gray-100 pb-1 mb-1">{storeName}</p>
           <h3 className="text-xs font-bold text-gray-900 truncate px-2">{product.name || product.model}</h3>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-2xl font-black text-black">{product.price.toFixed(2)}</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold">{t('dashboard.currency')}</span>
            <span className="text-[8px] opacity-50 uppercase">Incl. VAT</span>
          </div>
        </div>

        <div className="w-full flex justify-between items-end border-t border-gray-100 pt-1">
           <div className="text-[8px] font-mono opacity-40">#{product.id}</div>
           <div className="text-[8px] font-bold text-rose-600 uppercase tracking-tighter">SmartStore</div>
        </div>
      </div>
    </div>
  );


  // Daily Report
  const DailyReportTemplate = () => {
    const todaySales = data.sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
    const todayExpenses = data.expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
    const totalSales = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    return (
      <div ref={componentRef} className="invoice-container bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="header" style={{ borderBottomColor: '#1e40af' }}>
          <div className="store-info">
            <h1 style={{ color: '#1e40af' }}>{storeName}</h1>
            <p>{t('reports.dailyReport')}</p>
            <p>{storeAddress} | {storePhone}</p>
          </div>
          <div className="invoice-meta">
            <h2 style={{ color: '#1e40af' }}>{new Date().toLocaleDateString(language)}</h2>
            <p>{new Date().toLocaleTimeString(language)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-emerald-50 border-b-4 border-emerald-500 p-6 rounded-xl shadow-sm text-center">
            <p className="text-emerald-800 text-xs font-bold uppercase mb-1">{t('reports.totalSales')}</p>
            <p className="text-3xl font-black text-emerald-600">{totalSales.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase">{todaySales.length} {t('nav.sales')}</p>
          </div>

          <div className="bg-rose-50 border-b-4 border-rose-500 p-6 rounded-xl shadow-sm text-center">
            <p className="text-rose-800 text-xs font-bold uppercase mb-1">{t('reports.expenses')}</p>
            <p className="text-3xl font-black text-rose-600">{totalExpenses.toFixed(2)}</p>
            <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{todayExpenses.length} {t('nav.expenses')}</p>
          </div>

          <div className="bg-blue-50 border-b-4 border-blue-500 p-6 rounded-xl shadow-sm text-center">
            <p className="text-blue-800 text-xs font-bold uppercase mb-1 text-nowrap">{t('reports.netProfit')}</p>
            <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{netProfit.toFixed(2)}</p>
            <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">{t('dashboard.currency')}</p>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6 border-l-4 border-blue-800 pl-3">
             <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{t('reports.detailedSalesLog')}</h3>
          </div>
          {todaySales.length > 0 ? (
            <table className="items-table w-full">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#1e40af' }}>{t('common.dateTime')}</th>
                  <th style={{ backgroundColor: '#1e40af' }}>{t('sales.product')}</th>
                  <th style={{ backgroundColor: '#1e40af' }} className="text-center">{t('sales.quantity')}</th>
                  <th style={{ backgroundColor: '#1e40af' }} className="text-right">{t('sales.total')}</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.map(sale => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleTimeString(language)}</td>
                    <td className="font-bold">{sale.items ? `${sale.items[0].item}${sale.items.length > 1 ? '...' : ''}` : sale.item}</td>
                    <td className="text-center">{sale.items ? sale.items.reduce((s, i) => s + i.quantity, 0) : sale.quantity}</td>
                    <td className="text-right font-black">{sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl py-12 text-center">
              <p className="text-gray-400 font-bold italic">{t('reports.noSalesToday') || t('dashboard.none')}</p>
            </div>
          )}
        </div>

        <div className="footer mt-auto">
          <p className="font-bold uppercase tracking-widest text-gray-400">{t('print.issuedBy')}: {t('app.name')}</p>
          <p className="text-[10px] mt-1">{new Date().toLocaleString(language)}</p>
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
          <h2 className="text-2xl font-bold text-rose-800">🖨️ {t('print.title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[500px]">
          {/* Settings and Preview Area */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-l">
            {['sale-a4', 'thermal', 'payment-voucher'].includes(templateType) && (
              <div className="mb-4">
                <label className="block font-bold mb-2">{t('print.selectSale')}:</label>
                <select
                  value={selectedSale?.id || ''}
                  onChange={(e) => {
                    const sale = data.sales.find(s => s.id.toString() === e.target.value);
                    setSelectedSale(sale);
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">{t('print.selectSale')}</option>
                  {data.sales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      #{sale.id} - {sale.customer} ({sale.total.toFixed(2)} {t('dashboard.currency')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateType === 'repair-receipt' && (
              <div className="mb-4">
                <label className="block font-bold mb-2">{t('print.selectRepair')}:</label>
                <select
                  value={selectedRepair?.id || ''}
                  onChange={(e) => {
                    const repair = (data.repairs || []).find(r => r.id.toString() === e.target.value);
                    setSelectedRepair(repair);
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">{t('print.selectRepair')}</option>
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
                <label className="block font-bold mb-2">{t('print.selectProduct')}:</label>
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
                  <option value="">{t('print.selectProduct')}</option>
                  {data.screens.map(s => <option key={s.id} value={`screen-${s.id}`}>{s.model} ({t('inventory.screen')})</option>)}
                  {data.phones?.map(p => <option key={p.id} value={`phone-${p.id}`}>{p.name || p.model} ({t('inventory.phone')})</option>)}
                  {data.stickers?.map(s => <option key={s.id} value={`sticker-${s.id}`}>{s.name} ({t('inventory.sticker')})</option>)}
                  {data.accessories.map(a => <option key={a.id} value={`accessory-${a.id}`}>{a.name} ({t('inventory.accessory')})</option>)}
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
                  {t('common.print')}
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('common.savePDF')}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Menu */}
          <div className="w-64 bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-2">
              <button
                onClick={() => setTemplateType('sale-a4')}
                className={`w-full text-right p-3 rounded ${templateType === 'sale-a4' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.saleA4')}
              </button>
              <button
                onClick={() => setTemplateType('thermal')}
                className={`w-full text-right p-3 rounded ${templateType === 'thermal' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.thermal')}
              </button>
              <button
                onClick={() => setTemplateType('repair-receipt')}
                className={`w-full text-right p-3 rounded ${templateType === 'repair-receipt' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.repairReceipt')}
              </button>
              <button
                onClick={() => setTemplateType('payment-voucher')}
                className={`w-full text-right p-3 rounded ${templateType === 'payment-voucher' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.paymentVoucherShort')}
              </button>
              <button
                onClick={() => setTemplateType('product-card')}
                className={`w-full text-right p-3 rounded ${templateType === 'product-card' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.productCard')}
              </button>
              <button
                onClick={() => setTemplateType('price-label')}
                className={`w-full text-right p-3 rounded ${templateType === 'price-label' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.priceLabel')}
              </button>
              <button
                onClick={() => setTemplateType('daily-report')}
                className={`w-full text-right p-3 rounded ${templateType === 'daily-report' ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {t('print.dailyReport')}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Container */}
        {renderTemplate() && (
          <div className="border-t p-6 bg-gray-50 max-h-96 overflow-auto">
            <div className="bg-white p-4 rounded print:hidden shadow-sm">
              {renderTemplate()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintTemplates;
