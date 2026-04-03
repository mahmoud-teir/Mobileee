'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Download, Upload, Lock, Calendar, AlertCircle, CheckCircle, Trash2, Eye, EyeOff, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Google Drive Configuration
const GDRIVE_CLIENT_ID = process.env.REACT_APP_GDRIVE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const BackupManager = ({ data, saveData, onClose }) => {
  const [backups, setBackups] = useState([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem('autoBackupEnabled') === 'true');
  const [backupPassword, setBackupPassword] = useState('');
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(localStorage.getItem('cloudSyncEnabled') === 'true');
  const [lastBackupTime, setLastBackupTime] = useState(localStorage.getItem('lastBackupTime'));
  const [backupMessage, setBackupMessage] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  
  // Google Drive states
  const [gDriveAuthorized, setGDriveAuthorized] = useState(localStorage.getItem('gDriveAuthorized') === 'true');
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [gDriveAccessToken, setGDriveAccessToken] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);

  // Initialize Google Identity Services
  useEffect(() => {
    if (GDRIVE_CLIENT_ID === 'YOUR_CLIENT_ID.apps.googleusercontent.com') {
      console.warn('Google Drive Client ID not configured. Please set REACT_APP_GDRIVE_CLIENT_ID in .env');
      return;
    }

    if (window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp.error) {
            setBackupMessage('❌ خطأ في المصادقة مع Google');
            console.error('token error', resp);
            return;
          }
          setGDriveAccessToken(resp.access_token);
          setGDriveAuthorized(true);
          localStorage.setItem('gDriveAuthorized', 'true');
          setBackupMessage('✅ تم الاتصال بـ Google Drive بنجاح');
          setTimeout(() => setBackupMessage(''), 3000);
        }
      });
      setTokenClient(client);
    }
  }, []);

  // Google Drive Helper Functions
  const initGoogleIdentity = useCallback(() => {
    if (!tokenClient && window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp.error) {
            setBackupMessage('❌ خطأ في المصادقة مع Google');
            return;
          }
          setGDriveAccessToken(resp.access_token);
          setGDriveAuthorized(true);
          localStorage.setItem('gDriveAuthorized', 'true');
        }
      });
      setTokenClient(client);
    }
  }, [tokenClient]);

  const requestDriveToken = useCallback(() => {
    if (!tokenClient) {
      initGoogleIdentity();
      return;
    }
    tokenClient.requestAccessToken();
  }, [tokenClient, initGoogleIdentity]);

  const revokeDriveToken = useCallback(async () => {
    if (gDriveAccessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${gDriveAccessToken}`, { method: 'POST' });
      } catch (error) {
        console.error('خطأ في إلغاء الاتصال:', error);
      }
    }
    setGDriveAccessToken(null);
    setGDriveAuthorized(false);
    localStorage.removeItem('gDriveAuthorized');
    setBackupMessage('✅ تم قطع الاتصال بـ Google Drive');
    setTimeout(() => setBackupMessage(''), 2000);
  }, [gDriveAccessToken]);

  const uploadBackupToDrive = useCallback(async (filename, jsonBody) => {
    if (!gDriveAccessToken) {
      setBackupMessage('❌ الرجاء الاتصال بـ Google Drive أولاً');
      return false;
    }

    setIsUploadingToDrive(true);
    try {
      // Search for existing file
      const q = `name='${filename}' and trashed=false`;
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${gDriveAccessToken}` } }
      );
      const listData = await listRes.json();

      if (listData.files && listData.files.length > 0) {
        // Update existing file
        const fileId = listData.files[0].id;
        const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${gDriveAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonBody)
        });
        if (res.ok) {
          setBackupMessage('✅ تم تحديث النسخة الاحتياطية في Google Drive');
          setTimeout(() => setBackupMessage(''), 3000);
          return true;
        }
      } else {
        // Create new file
        const metadata = { name: filename, parents: ['appDataFolder'] };
        const boundary = 'foo_bar_baz';
        const multipartBody =
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(jsonBody)}\r\n--${boundary}--`;

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gDriveAccessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartBody
        });
        if (res.ok) {
          setBackupMessage('✅ تم حفظ النسخة الاحتياطية في Google Drive');
          setTimeout(() => setBackupMessage(''), 3000);
          return true;
        }
      }
      setBackupMessage('❌ خطأ في حفظ النسخة في Google Drive');
      return false;
    } catch (error) {
      console.error('خطأ في رفع النسخة:', error);
      setBackupMessage('❌ خطأ في الاتصال بـ Google Drive');
      return false;
    } finally {
      setIsUploadingToDrive(false);
    }
  }, [gDriveAccessToken]);

  const downloadBackupFromDrive = useCallback(async (filename) => {
    if (!gDriveAccessToken) {
      setBackupMessage('❌ الرجاء الاتصال بـ Google Drive أولاً');
      return null;
    }

    try {
      const q = `name='${filename}' and trashed=false`;
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${gDriveAccessToken}` } }
      );
      const listData = await listRes.json();

      if (listData.files && listData.files.length > 0) {
        const fileId = listData.files[0].id;
        const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${gDriveAccessToken}` }
        });
        return await downloadRes.json();
      }
      return null;
    } catch (error) {
      console.error('خطأ في تحميل النسخة:', error);
      setBackupMessage('❌ خطأ في تحميل النسخة من Google Drive');
      return null;
    }
  }, [gDriveAccessToken]);

  // تحميل النسخ الاحتياطية من التخزين المحلي
  useEffect(() => {
    loadBackups();
  }, []);

  // تحميل قائمة النسخ الاحتياطية
  const loadBackups = () => {
    try {
      const stored = localStorage.getItem('backupsList');
      if (stored) {
        const parsed = JSON.parse(stored);
        setBackups(parsed);
      }
    } catch (error) {
      console.error('خطأ في تحميل النسخ الاحتياطية:', error);
    }
  };

  // إنشاء نسخة احتياطية تلقائية
  const createAutoBackup = useCallback(() => {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ar'),
        time: new Date().toLocaleTimeString('ar'),
        isAuto: true,
        data: data,
        hash: generateHash(JSON.stringify(data))
      };

      let backupsList = [];
      try {
        backupsList = JSON.parse(localStorage.getItem('backupsList') || '[]');
      } catch (e) {
        backupsList = [];
      }

      // الاحتفاظ فقط بآخر 30 نسخة احتياطية
      if (backupsList.length >= 30) {
        backupsList.shift();
      }

      backupsList.push(backupData);
      localStorage.setItem('backupsList', JSON.stringify(backupsList));
      localStorage.setItem('lastAutoBackupDate', new Date().toDateString());

      setBackups(backupsList);
      setLastBackupTime(backupData.time);
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية التلقائية:', error);
    }
  }, [data]);

  // التحقق من النسخة الاحتياطية التلقائية اليومية
  useEffect(() => {
    if (!autoBackupEnabled) return;

    const lastBackup = localStorage.getItem('lastAutoBackupDate');
    const today = new Date().toDateString();

    if (lastBackup !== today) {
      createAutoBackup();
    }
  }, [autoBackupEnabled, createAutoBackup]);

  // إنشاء نسخة احتياطية يدوية
  const createManualBackup = () => {
    if (isCreatingBackup) return;
    setIsCreatingBackup(true);

    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ar'),
        time: new Date().toLocaleTimeString('ar'),
        isAuto: false,
        data: data,
        hash: generateHash(JSON.stringify(data))
      };

      // تشفير النسخة الاحتياطية إذا كانت محمية بكلمة مرور
      if (passwordProtected && backupPassword) {
        backupData.encrypted = true;
        backupData.encryptedData = encryptData(JSON.stringify(backupData.data), backupPassword);
        delete backupData.data;
      }

      let backupsList = [];
      try {
        backupsList = JSON.parse(localStorage.getItem('backupsList') || '[]');
      } catch (e) {
        backupsList = [];
      }

      // الاحتفاظ فقط بآخر 30 نسخة احتياطية
      if (backupsList.length >= 30) {
        backupsList.shift();
      }

      backupsList.push(backupData);
      localStorage.setItem('backupsList', JSON.stringify(backupsList));
      localStorage.setItem('lastBackupTime', backupData.time);

      setBackups(backupsList);
      setLastBackupTime(backupData.time);
      setBackupMessage('✅ تم إنشاء النسخة الاحتياطية بنجاح');
      setTimeout(() => setBackupMessage(''), 3000);

      // تحميل النسخة الاحتياطية كملف
      downloadBackupFile(backupData);

      // رفع إلى Google Drive إذا كانت مفعلة
      if (cloudSyncEnabled && gDriveAccessToken) {
        uploadBackupToDrive('kerza_backup.json', backupData);
      }
    } catch (error) {
      setBackupMessage('❌ خطأ في إنشاء النسخة الاحتياطية');
      console.error(error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // دالة تشفير بسيطة
  const encryptData = (data, password) => {
    // استخدام بطريقة بسيطة - يمكن استبدالها بمكتبة تشفير احترافية
    return btoa(data + '|' + password);
  };

  // دالة فك التشفير
  const decryptData = (encrypted, password) => {
    try {
      const decrypted = atob(encrypted);
      const parts = decrypted.split('|');
      if (parts[parts.length - 1] === password) {
        return parts.slice(0, -1).join('|');
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // توليد بصمة للبيانات
  const generateHash = (data) => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  // تحميل ملف النسخة الاحتياطية
  const downloadBackupFile = (backupData) => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `backup_smartstore_pos_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // استرجاع النسخة الاحتياطية
  const restoreBackup = (backup) => {
    if (isRestoringBackup) return;

    if (backup.encrypted && !restorePassword) {
      setBackupMessage('❌ يرجى إدخال كلمة المرور');
      return;
    }

    setIsRestoringBackup(true);

    try {
      let dataToRestore = backup.data;

      if (backup.encrypted) {
        const decrypted = decryptData(backup.encryptedData, restorePassword);
        if (!decrypted) {
          setBackupMessage('❌ كلمة المرور غير صحيحة');
          setIsRestoringBackup(false);
          return;
        }
        dataToRestore = JSON.parse(decrypted);
      }

      // إنشاء نسخة احتياطية من البيانات الحالية قبل الاسترجاع
      const currentBackup = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ar'),
        time: new Date().toLocaleTimeString('ar'),
        isAuto: false,
        data: data,
        hash: generateHash(JSON.stringify(data))
      };

      let backupsList = JSON.parse(localStorage.getItem('backupsList') || '[]');
      if (backupsList.length >= 30) {
        backupsList.shift();
      }
      backupsList.push(currentBackup);
      localStorage.setItem('backupsList', JSON.stringify(backupsList));

      // استرجاع البيانات القديمة
      saveData(dataToRestore);
      setBackupMessage('✅ تم استرجاع النسخة الاحتياطية بنجاح');
      setRestorePassword('');
      setSelectedBackup(null);
      setTimeout(() => setBackupMessage(''), 3000);
    } catch (error) {
      setBackupMessage('❌ خطأ في استرجاع النسخة الاحتياطية');
      console.error(error);
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // حذف نسخة احتياطية
  const deleteBackup = (index) => {
    const newBackups = backups.filter((_, i) => i !== index);
    setBackups(newBackups);
    localStorage.setItem('backupsList', JSON.stringify(newBackups));
    setBackupMessage('✅ تم حذف النسخة الاحتياطية');
    setTimeout(() => setBackupMessage(''), 2000);
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // ورقة المبيعات
      const salesSheet = XLSX.utils.json_to_sheet(
        data.sales.map(s => ({
          'رقم الفاتورة': s.id,
          'التاريخ': new Date(s.date).toLocaleDateString('ar'),
          'العميل': s.customer,
          'المنتج': s.item,
          'الكمية': s.quantity,
          'السعر الإجمالي': s.total,
          'الحالة': 'مكتملة'
        }))
      );
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'المبيعات');

      // ورقة الصيانات
      const repairsSheet = XLSX.utils.json_to_sheet(
        data.repairs.map(r => ({
          'رقم الصيانة': r.id,
          'التاريخ': new Date(r.date).toLocaleDateString('ar'),
          'العميل': r.customerName,
          'الجهاز': r.device,
          'المشكلة': r.problem,
          'التكلفة': r.cost,
          'الحالة': r.status || 'قيد الصيانة'
        }))
      );
      XLSX.utils.book_append_sheet(workbook, repairsSheet, 'الصيانات');

      // ورقة المصاريف
      const expensesSheet = XLSX.utils.json_to_sheet(
        data.expenses.map(e => ({
          'الفئة': e.category,
          'الوصف': e.description,
          'المبلغ': e.amount,
          'التاريخ': new Date(e.date).toLocaleDateString('ar'),
          'ملاحظات': e.notes
        }))
      );
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'المصاريف');

      // ورقة المخزون
      const inventorySheet = XLSX.utils.json_to_sheet([
        ...data.screens.map(s => ({
          'النوع': 'شاشة',
          'الموديل': s.model,
          'الكمية': s.quantity,
          'السعر': s.price,
          'الفئة': s.category
        })),
        ...data.accessories.map(a => ({
          'النوع': 'إكسسوار',
          'الموديل': a.name,
          'الكمية': a.quantity,
          'السعر': a.price,
          'الفئة': a.category
        }))
      ]);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'المخزون');

      XLSX.writeFile(workbook, `backup_smartstore_pos_${new Date().toISOString().split('T')[0]}.xlsx`);
      setBackupMessage('✅ تم تصدير Excel بنجاح');
      setTimeout(() => setBackupMessage(''), 2000);
    } catch (error) {
      setBackupMessage('❌ خطأ في التصدير');
      console.error(error);
    }
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // رأس الصفحة
      doc.setFontSize(16);
      doc.text('نسخة احتياطية من نظام SmartStore POS 🏬', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`التاريخ: ${new Date().toLocaleDateString('ar')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // ملخص البيانات
      doc.setFontSize(12);
      doc.text('ملخص البيانات', 20, yPosition);
      yPosition += 7;

      const summary = [
        ['عدد المبيعات', data.sales.length],
        ['إجمالي المبيعات', `${data.sales.reduce((sum, s) => sum + s.total, 0).toFixed(2)} ₪`],
        ['عدد الصيانات', data.repairs.length],
        ['عدد المصاريف', data.expenses.length],
        ['عدد العملاء', data.customers?.length || 0],
        ['عدد الموردين', data.suppliers?.length || 0]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['البيان', 'القيمة']],
        body: summary,
        theme: 'grid',
        styles: { halign: 'right' }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // جدول المبيعات
      if (data.sales.length > 0) {
        doc.setFontSize(11);
        doc.text('المبيعات الأخيرة', 20, yPosition);
        yPosition += 7;

        doc.autoTable({
          startY: yPosition,
          head: [['التاريخ', 'العميل', 'المنتج', 'الكمية', 'الإجمالي']],
          body: data.sales.slice(-10).map(s => [
            new Date(s.date).toLocaleDateString('ar'),
            s.customer,
            s.item,
            s.quantity,
            `${s.total.toFixed(2)} ₪`
          ]),
          theme: 'grid',
          styles: { halign: 'right' }
        });
      }

      doc.save(`backup_smartstore_pos_${new Date().toISOString().split('T')[0]}.pdf`);
      setBackupMessage('✅ تم تصدير PDF بنجاح');
      setTimeout(() => setBackupMessage(''), 2000);
    } catch (error) {
      setBackupMessage('❌ خطأ في التصدير');
      console.error(error);
    }
  };

  // تفعيل النسخ الاحتياطي التلقائي
  const toggleAutoBackup = (enabled) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('autoBackupEnabled', enabled);
    if (enabled) {
      createAutoBackup();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-rose-600 to-pink-600 text-white p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            مدير النسخ الاحتياطية
          </h2>
          <button onClick={onClose} className="text-white hover:bg-rose-700 p-2 rounded-lg">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* رسالة التأكيد */}
          {backupMessage && (
            <div className={`p-4 rounded-lg ${backupMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {backupMessage}
            </div>
          )}

          {/* إعدادات النسخ الاحتياطي */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-800">⚙️ إعدادات النسخ الاحتياطي</h3>

            {/* النسخ الاحتياطي التلقائي */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => toggleAutoBackup(e.target.checked)}
                className="w-5 h-5 rounded text-rose-600"
              />
              <span className="font-medium">تفعيل النسخ الاحتياطي التلقائي اليومي</span>
              <span className="text-xs text-gray-600">(يتم كل يوم تلقائياً)</span>
            </label>

            {lastBackupTime && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                آخر نسخة احتياطية: {lastBackupTime}
              </p>
            )}

            {/* حماية بكلمة مرور */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={passwordProtected}
                onChange={(e) => setPasswordProtected(e.target.checked)}
                className="w-5 h-5 rounded text-rose-600"
              />
              <span className="font-medium">حماية النسخة الاحتياطية بكلمة مرور</span>
            </label>

            {passwordProtected && (
              <div className="ml-8 relative">
                <div className="flex gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="أدخل كلمة المرور"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* مزامنة السحابة */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                Google Drive
              </h4>

              {!gDriveAuthorized ? (
                <button
                  onClick={requestDriveToken}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Cloud className="w-4 h-4" />
                  الاتصال بـ Google Drive
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    متصل بـ Google Drive ✅
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => uploadBackupToDrive('kerza_backup.json', data)}
                      disabled={isUploadingToDrive}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm"
                    >
                      {isUploadingToDrive ? '⏳ جاري الرفع...' : '☁️ رفع الآن'}
                    </button>
                    <button
                      onClick={revokeDriveToken}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      قطع الاتصال
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={cloudSyncEnabled}
                  onChange={(e) => {
                    setCloudSyncEnabled(e.target.checked);
                    localStorage.setItem('cloudSyncEnabled', e.target.checked);
                  }}
                  disabled={!gDriveAuthorized}
                  className="w-5 h-5 rounded text-rose-600 disabled:text-gray-400"
                />
                <span className="font-medium text-sm">رفع تلقائي مع كل نسخة احتياطية</span>
              </label>
            </div>
          </div>

          {/* أزرار الإجراءات الرئيسية */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={createManualBackup}
              disabled={isCreatingBackup || (passwordProtected && !backupPassword)}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              إنشاء نسخة
            </button>

            <button
              onClick={exportToExcel}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              تصدير Excel
            </button>

            <button
              onClick={exportToPDF}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              تصدير PDF
            </button>

            <button
              onClick={createAutoBackup}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Cloud className="w-4 h-4" />
              نسخة الآن
            </button>

            {gDriveAuthorized && (
              <button
                onClick={async () => {
                  const cloudBackup = await downloadBackupFromDrive('kerza_backup.json');
                  if (cloudBackup) {
                    restoreBackup(cloudBackup);
                  } else {
                    setBackupMessage('❌ لم يتم العثور على نسخة في Google Drive');
                    setTimeout(() => setBackupMessage(''), 2000);
                  }
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                استرجاع من Drive
              </button>
            )}
          </div>

          {/* قائمة النسخ الاحتياطية */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4">📋 النسخ الاحتياطية المحفوظة ({backups.length}/30)</h3>

            {backups.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {backups.slice().reverse().map((backup, index) => (
                  <div key={backups.length - index - 1} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{backup.date} - {backup.time}</span>
                        {backup.isAuto && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">تلقائي</span>}
                        {backup.encrypted && <Lock className="w-4 h-4 text-rose-600" />}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">عدد المبيعات: {backup.data?.sales?.length || 0}</p>
                    </div>

                    {selectedBackup === backups.length - index - 1 && (
                      <div className="ml-4 flex gap-2 items-end">
                        {backup.encrypted && (
                          <input
                            type="password"
                            placeholder="كلمة المرور"
                            value={restorePassword}
                            onChange={(e) => setRestorePassword(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        )}
                        <button
                          onClick={() => restoreBackup(backup)}
                          disabled={isRestoringBackup}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                          {isRestoringBackup ? '⏳' : 'استرجاع'}
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBackup(selectedBackup === backups.length - index - 1 ? null : backups.length - index - 1)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        {selectedBackup === backups.length - index - 1 ? '✓' : 'اختيار'}
                      </button>
                      <button
                        onClick={() => deleteBackup(backups.length - index - 1)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">لا توجد نسخ احتياطية حتى الآن</p>
            )}
          </div>

          {/* نصائح الأمان */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-bold mb-1">💡 نصائح الأمان:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>قم بإنشاء نسخ احتياطية منتظمة للحفاظ على بيانات آمنة</li>
                  <li>استخدم كلمات مرور قوية عند حماية النسخ الاحتياطية</li>
                  <li>احفظ النسخ الاحتياطية في أماكن آمنة</li>
                  <li>اختبر استرجاع النسخ الاحتياطية بشكل دوري</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
