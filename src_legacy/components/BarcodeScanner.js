import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Search, Keyboard } from 'lucide-react';

const BarcodeScanner = ({ onClose, data }) => {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const [mode, setMode] = useState('manual'); // 'manual' or 'camera'
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus on input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // البحث عن منتج بالباركود
  const findProductByBarcode = (barcode) => {
    // استخراج النوع والـ ID من الباركود
    // الرقم الأول يحدد النوع: 1=شاشة, 2=جوال, 3=ملصق, 4=إكسسوار
    const prefix = barcode.charAt(0);
    const id = parseInt(barcode.substring(1), 10);

    let product = null;
    let type = '';

    if (prefix === '1') {
      product = (data.screens || []).find(s => s.id === id);
      type = 'screen';
    } else if (prefix === '2') {
      product = (data.phones || []).find(p => p.id === id);
      type = 'phone';
    } else if (prefix === '3') {
      product = (data.stickers || []).find(st => st.id === id);
      type = 'sticker';
    } else if (prefix === '4') {
      product = (data.accessories || []).find(a => a.id === id);
      type = 'accessory';
    }

    if (product) {
      return {
        ...product,
        name: product.model || product.name,
        type
      };
    }

    // البحث بالاسم أو الموديل إذا لم يكن الباركود بالتنسيق المتوقع
    const allProducts = [
      ...(data.screens || []).map(s => ({ ...s, name: s.model, type: 'screen' })),
      ...(data.phones || []).map(p => ({ ...p, name: p.model || p.name, type: 'phone' })),
      ...(data.stickers || []).map(st => ({ ...st, type: 'sticker' })),
      ...(data.accessories || []).map(a => ({ ...a, type: 'accessory' }))
    ];

    return allProducts.find(p =>
      (p.name && p.name.toLowerCase().includes(barcode.toLowerCase())) ||
      (p.model && p.model.toLowerCase().includes(barcode.toLowerCase()))
    );
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      setError('الرجاء إدخال رقم الباركود أو اسم المنتج');
      return;
    }

    const product = findProductByBarcode(manualCode.trim());

    if (product) {
      setFoundProduct(product);
      setError('');
    } else {
      setFoundProduct(null);
      setError('لم يتم العثور على المنتج. تأكد من رقم الباركود.');
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'screen': return 'شاشة';
      case 'phone': return 'جوال';
      case 'sticker': return 'ملصق';
      case 'accessory': return 'إكسسوار';
      default: return 'منتج';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6" />
            ماسح الباركود
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                mode === 'manual'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Keyboard className="w-5 h-5" />
              إدخال يدوي
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                mode === 'camera'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-5 h-5" />
              الكاميرا
            </button>
          </div>

          {mode === 'manual' ? (
            <>
              {/* Manual Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الباركود أو اسم المنتج
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={manualCode}
                      onChange={(e) => {
                        setManualCode(e.target.value);
                        setError('');
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="امسح الباركود أو أدخل الرقم..."
                      className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                      autoFocus
                    />
                    <Search className="w-6 h-6 text-gray-400 absolute left-4 top-4" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleManualSearch}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-purple-700 transition transform hover:scale-[1.02]"
                >
                  <Search className="w-6 h-6" />
                  بحث
                </button>

                {/* نتيجة البحث */}
                {foundProduct && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <h4 className="font-bold text-green-800 mb-3">✅ تم العثور على المنتج!</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">الاسم:</span>
                        <span className="font-bold text-gray-800">{foundProduct.name || foundProduct.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">النوع:</span>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm">
                          {getTypeName(foundProduct.type)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">السعر:</span>
                        <span className="font-bold text-green-600">{foundProduct.price?.toFixed(2)} ₪</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الكمية المتوفرة:</span>
                        <span className={`font-bold ${foundProduct.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {foundProduct.quantity}
                        </span>
                      </div>
                      {foundProduct.description && (
                        <div className="pt-2 border-t border-green-200">
                          <span className="text-gray-600 text-sm">{foundProduct.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>نصيحة:</strong> يمكنك استخدام قارئ الباركود USB مباشرة.
                  فقط امسح الباركود وسيتم إدخاله تلقائياً.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Camera Mode - Placeholder */}
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">
                  ميزة الكاميرا قيد التطوير
                </p>
                <p className="text-sm text-gray-500">
                  استخدم الإدخال اليدوي أو قارئ باركود USB
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
