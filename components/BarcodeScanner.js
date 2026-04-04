'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Search, Keyboard } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const BarcodeScanner = ({ onClose, data }) => {
  const { t, isRTL } = useLanguage();
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const [mode, setMode] = useState('manual'); // 'manual' or 'camera'
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const findProductByBarcode = (barcode) => {
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
      return { ...product, name: product.model || product.name, type };
    }

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
      setError(t('barcode.errorEmpty'));
      return;
    }
    const product = findProductByBarcode(manualCode.trim());
    if (product) {
      setFoundProduct(product);
      setError('');
    } else {
      setFoundProduct(null);
      setError(t('barcode.notFound'));
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'screen': return t('inventory.screen');
      case 'phone': return t('inventory.phone');
      case 'sticker': return t('inventory.sticker');
      case 'accessory': return t('inventory.accessory');
      default: return t('inventory.product');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleManualSearch();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6" />
            {t('barcode.title')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                mode === 'manual' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Keyboard className="w-5 h-5" />
              {t('barcode.manual')}
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                mode === 'camera' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-5 h-5" />
              {t('barcode.camera')}
            </button>
          </div>

          {mode === 'manual' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('barcode.label')}</label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => { setManualCode(e.target.value); setError(''); }}
                    onKeyPress={handleKeyPress}
                    placeholder={t('barcode.placeholder')}
                    className={`w-full border-2 border-gray-200 p-4 rounded-xl text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition ${isRTL ? 'pr-12' : 'pl-12'}`}
                  />
                  <Search className={`w-6 h-6 text-gray-400 absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              <button
                onClick={handleManualSearch}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-purple-700 transition transform hover:scale-[1.02]"
              >
                <Search className="w-6 h-6" />
                {t('barcode.search')}
              </button>

              {foundProduct && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <h4 className="font-bold text-green-800 mb-3">✅ {t('barcode.success')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('barcode.name')}:</span>
                      <span className="font-bold text-gray-800">{foundProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('barcode.type')}:</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm">{getTypeName(foundProduct.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('barcode.price')}:</span>
                      <span className="font-bold text-green-600">{foundProduct.price?.toFixed(2)} ₪</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('barcode.available')}:</span>
                      <span className={`font-bold ${foundProduct.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{foundProduct.quantity}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">{t('barcode.tip')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">{t('barcode.cameraDev')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
