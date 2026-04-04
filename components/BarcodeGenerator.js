'use client';
import React, { useRef } from 'react';
import Barcode from 'react-barcode';
import { Printer, X, Download } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const BarcodeGenerator = ({ item, onClose }) => {
  const { t } = useLanguage();
  const printRef = useRef();

  // توليد رقم باركود فريد من ID المنتج
  const generateBarcodeValue = (item) => {
    const prefix = item.type === 'screen' ? '1' :
                   item.type === 'phone' ? '2' :
                   item.type === 'sticker' ? '3' : '4';
    return `${prefix}${String(item.id).padStart(11, '0')}`;
  };

  const barcodeValue = generateBarcodeValue(item);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=400,height=300');

    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة باركود - ${item.name || item.model}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              direction: rtl;
            }
            .barcode-container {
              text-align: center;
              border: 2px dashed #ccc;
              padding: 15px;
              margin: 10px;
              border-radius: 8px;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .product-price {
              font-size: 16px;
              font-weight: bold;
              color: #e11d48;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .barcode-container { border: 1px dashed #999; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const svg = printRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `barcode-${item.name || item.model}-${barcodeValue}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">{t('barcode.generatorTitle')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div ref={printRef} className="barcode-container bg-gray-50 p-6 rounded-xl text-center">
            <p className="product-name text-lg font-bold text-gray-800 mb-4">
              {item.name || item.model}
            </p>

            <div className="flex justify-center">
              <Barcode
                value={barcodeValue}
                width={2}
                height={80}
                fontSize={14}
                margin={10}
                background="#f9fafb"
              />
            </div>

            <p className="product-price text-xl font-bold text-rose-600 mt-4">
              {item.price?.toFixed(2)} ₪
            </p>
          </div>

          {/* Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('barcode.number')}</strong> {barcodeValue}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>{t('barcode.type')}:</strong> {
                item.type === 'screen' ? t('inventory.screen') :
                item.type === 'phone' ? t('inventory.phone') :
                item.type === 'sticker' ? t('inventory.sticker') : t('inventory.accessory')
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePrint}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:from-rose-600 hover:to-pink-700 transition"
            >
              <Printer className="w-5 h-5" />
              {t('barcode.print')}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition"
            >
              <Download className="w-5 h-5" />
              {t('barcode.download')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
