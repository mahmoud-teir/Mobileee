'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Download, Upload, Lock, Calendar, AlertCircle, CheckCircle, Trash2, Eye, EyeOff, LogOut, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

// Google Drive Configuration
const GDRIVE_CLIENT_ID = process.env.REACT_APP_GDRIVE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const BackupManager = ({ data, saveData, onClose }) => {
  const { t, isRTL } = useLanguage();
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
      console.warn('Google Drive Client ID not configured.');
      return;
    }

    if (window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp.error) {
            toast.error(t('backup.authError'));
            console.error('token error', resp);
            return;
          }
          setGDriveAccessToken(resp.access_token);
          setGDriveAuthorized(true);
          localStorage.setItem('gDriveAuthorized', 'true');
          setBackupMessage(`✅ ${t('backup.driveSuccess')}`);
          setTimeout(() => setBackupMessage(''), 3000);
        }
      });
      setTokenClient(client);
    }
  }, [t]);

  // Google Drive Helper Functions
  const initGoogleIdentity = useCallback(() => {
    if (!tokenClient && window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp.error) {
            toast.error(t('backup.authError'));
            return;
          }
          setGDriveAccessToken(resp.access_token);
          setGDriveAuthorized(true);
          localStorage.setItem('gDriveAuthorized', 'true');
        }
      });
      setTokenClient(client);
    }
  }, [tokenClient, t]);

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
        console.error('Error revoking token:', error);
      }
    }
    setGDriveAccessToken(null);
    setGDriveAuthorized(false);
    localStorage.removeItem('gDriveAuthorized');
    setBackupMessage(`✅ ${t('backup.disconnectDrive')}`);
    setTimeout(() => setBackupMessage(''), 2000);
  }, [gDriveAccessToken, t]);

  const uploadBackupToDrive = useCallback(async (filename, jsonBody) => {
    if (!gDriveAccessToken) {
      toast.error(t('backup.errorDrive'));
      return false;
    }

    setIsUploadingToDrive(true);
    try {
      const q = `name='${filename}' and trashed=false`;
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${gDriveAccessToken}` } }
      );
      const listData = await listRes.json();

      if (listData.files && listData.files.length > 0) {
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
          setBackupMessage(`✅ ${t('backup.driveUpdateSuccess')}`);
          setTimeout(() => setBackupMessage(''), 3000);
          return true;
        }
      } else {
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
          setBackupMessage(`✅ ${t('backup.driveSaveSuccess')}`);
          setTimeout(() => setBackupMessage(''), 3000);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error uploading backup:', error);
      toast.error(t('backup.errorDrive'));
      return false;
    } finally {
      setIsUploadingToDrive(false);
    }
  }, [gDriveAccessToken, t]);

  const downloadBackupFromDrive = useCallback(async (filename) => {
    if (!gDriveAccessToken) {
      toast.error(t('backup.errorDrive'));
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
      console.error('Error downloading backup:', error);
      toast.error(t('backup.errorDrive'));
      return null;
    }
  }, [gDriveAccessToken, t]);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    try {
      const stored = localStorage.getItem('backupsList');
      if (stored) {
        setBackups(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const createAutoBackup = useCallback(() => {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(isRTL ? 'ar' : 'en'),
        time: new Date().toLocaleTimeString(isRTL ? 'ar' : 'en'),
        isAuto: true,
        data: data,
        hash: generateHash(JSON.stringify(data))
      };

      let backupsList = JSON.parse(localStorage.getItem('backupsList') || '[]');
      if (backupsList.length >= 30) backupsList.shift();
      backupsList.push(backupData);
      localStorage.setItem('backupsList', JSON.stringify(backupsList));
      localStorage.setItem('lastAutoBackupDate', new Date().toDateString());

      setBackups(backupsList);
      setLastBackupTime(backupData.time);
    } catch (error) {
      console.error('Error creating auto backup:', error);
    }
  }, [data, isRTL]);

  useEffect(() => {
    if (!autoBackupEnabled) return;
    if (localStorage.getItem('lastAutoBackupDate') !== new Date().toDateString()) {
      createAutoBackup();
    }
  }, [autoBackupEnabled, createAutoBackup]);

  const generateHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  const encryptData = (dataToEncrypt, pass) => btoa(dataToEncrypt + '|' + pass);
  const decryptData = (encrypted, pass) => {
    try {
      const decrypted = atob(encrypted);
      const parts = decrypted.split('|');
      if (parts[parts.length - 1] === pass) return parts.slice(0, -1).join('|');
      return null;
    } catch (e) { return null; }
  };

  const createManualBackup = () => {
    if (isCreatingBackup) return;
    setIsCreatingBackup(true);

    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(isRTL ? 'ar' : 'en'),
        time: new Date().toLocaleTimeString(isRTL ? 'ar' : 'en'),
        isAuto: false,
        data: data,
        hash: generateHash(JSON.stringify(data))
      };

      if (passwordProtected && backupPassword) {
        backupData.encrypted = true;
        backupData.encryptedData = encryptData(JSON.stringify(backupData.data), backupPassword);
        delete backupData.data;
      }

      let backupsList = JSON.parse(localStorage.getItem('backupsList') || '[]');
      if (backupsList.length >= 30) backupsList.shift();
      backupsList.push(backupData);
      localStorage.setItem('backupsList', JSON.stringify(backupsList));
      localStorage.setItem('lastBackupTime', backupData.time);

      setBackups(backupsList);
      setLastBackupTime(backupData.time);
      setBackupMessage(`✅ ${t('backup.successCreate')}`);
      setTimeout(() => setBackupMessage(''), 3000);

      downloadBackupFile(backupData);

      if (cloudSyncEnabled && gDriveAccessToken) {
        uploadBackupToDrive('smartstore_backup.json', backupData);
      }
    } catch (error) {
      toast.error(t('backup.errorCreate'));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackupFile = (backupData) => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `backup_smartstore_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const restoreBackup = (backup) => {
    if (isRestoringBackup) return;
    if (backup.encrypted && !restorePassword) {
      toast.error(t('backup.passwordPlaceholder'));
      return;
    }

    setIsRestoringBackup(true);
    try {
      let dataToRestore = backup.data;
      if (backup.encrypted) {
        const decrypted = decryptData(backup.encryptedData, restorePassword);
        if (!decrypted) {
          toast.error(t('backup.wrongPassword'));
          setIsRestoringBackup(false);
          return;
        }
        dataToRestore = JSON.parse(decrypted);
      }
      saveData(dataToRestore);
      setBackupMessage(`✅ ${t('backup.successRestore')}`);
      setRestorePassword('');
      setSelectedBackup(null);
      setTimeout(() => setBackupMessage(''), 3000);
    } catch (error) {
      toast.error(t('backup.errorRestore'));
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const deleteBackup = (idx) => {
    const newBackups = backups.filter((_, i) => i !== idx);
    setBackups(newBackups);
    localStorage.setItem('backupsList', JSON.stringify(newBackups));
    setBackupMessage(`✅ ${t('backup.successDelete')}`);
    setTimeout(() => setBackupMessage(''), 2000);
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      const salesData = (data.sales || []).map(s => ({
        [isRTL ? 'رقم الفاتورة' : 'Invoice #']: s.id,
        [isRTL ? 'التاريخ' : 'Date']: new Date(s.date).toLocaleDateString(isRTL ? 'ar' : 'en'),
        [isRTL ? 'العميل' : 'Customer']: s.customer,
        [isRTL ? 'الإجمالي' : 'Total']: s.total,
        [isRTL ? 'طريقة الدفع' : 'Payment']: s.paymentMethod
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesData), isRTL ? 'المبيعات' : 'Sales');

      const repairsData = (data.repairs || []).map(r => ({
        [isRTL ? 'رقم الصيانة' : 'Repair #']: r.id,
        [isRTL ? 'العميل' : 'Customer']: r.customerName,
        [isRTL ? 'الجهاز' : 'Device']: r.device,
        [isRTL ? 'التكلفة' : 'Cost']: r.cost,
        [isRTL ? 'الحالة' : 'Status']: r.status
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(repairsData), isRTL ? 'الصيانات' : 'Repairs');

      XLSX.writeFile(workbook, `smartstore_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      setBackupMessage(`✅ ${t('common.success')}`);
      setTimeout(() => setBackupMessage(''), 2000);
    } catch (error) {
      toast.error(t('reports.exportError'));
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text(`${t('app.name')} - ${t('backup.title')}`, pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`${t('common.date')}: ${new Date().toLocaleDateString(isRTL ? 'ar' : 'en')}`, pageWidth / 2, 30, { align: 'center' });

      const summary = [
        [t('dashboard.sales'), (data.sales || []).length],
        [t('dashboard.totalSales'), `${(data.sales || []).reduce((sum, s) => sum + s.total, 0).toFixed(2)} ₪`],
        [t('dashboard.pendingRepairs'), (data.repairs || []).filter(r => r.status !== 'delivered').length],
        [t('dashboard.outOfStock'), (data.screens || []).filter(s => s.quantity <= 0).length]
      ];

      doc.autoTable({
        startY: 40,
        head: [[isRTL ? 'البيان' : 'Item', isRTL ? 'القيمة' : 'Value']],
        body: summary,
        theme: 'grid',
        styles: { halign: isRTL ? 'right' : 'left' }
      });

      doc.save(`smartstore_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setBackupMessage(`✅ ${t('common.success')}`);
      setTimeout(() => setBackupMessage(''), 2000);
    } catch (e) { toast.error(t('reports.exportError')); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            {t('backup.title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {backupMessage && (
            <div className={`p-4 rounded-xl flex items-center gap-2 ${backupMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <CheckCircle className="w-5 h-5" />
              {backupMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                {t('backup.settings')}
              </h3>
              
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition">
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => {
                    setAutoBackupEnabled(e.target.checked);
                    localStorage.setItem('autoBackupEnabled', e.target.checked);
                  }}
                  className="w-5 h-5 rounded text-rose-600"
                />
                <div>
                  <span className="font-medium block">{t('backup.autoBackup')}</span>
                  <span className="text-xs text-gray-500">{t('backup.autoBackupHint')}</span>
                </div>
              </label>

              {lastBackupTime && (
                <div className="text-sm text-gray-600 bg-white p-2 rounded-lg border flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {t('backup.lastBackup')}: {lastBackupTime}
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passwordProtected}
                    onChange={(e) => setPasswordProtected(e.target.checked)}
                    className="w-5 h-5 rounded text-rose-600"
                  />
                  <span className="font-medium">{t('backup.passwordProtect')}</span>
                </label>
                {passwordProtected && (
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        placeholder={t('backup.passwordPlaceholder')}
                        className={`w-full border p-2 rounded-lg text-sm ${isRTL ? 'pl-10' : 'pr-10'}`}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className={`absolute top-2 ${isRTL ? 'left-3' : 'right-3'}`}>
                        {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                {t('backup.cloudSync')}
              </h3>
              
              {!gDriveAuthorized ? (
                <button
                  onClick={requestDriveToken}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition"
                >
                  <Cloud className="w-5 h-5" />
                  {t('backup.connectDrive')}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100">
                    <span className="text-sm font-medium text-blue-700">{t('backup.driveConnected')}</span>
                    <button onClick={revokeDriveToken} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => uploadBackupToDrive('smartstore_backup.json', data)}
                    disabled={isUploadingToDrive}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white p-2 rounded-xl text-sm font-bold transition"
                  >
                    {isUploadingToDrive ? t('backup.uploading') : t('backup.uploadNow')}
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={cloudSyncEnabled}
                      onChange={(e) => {
                        setCloudSyncEnabled(e.target.checked);
                        localStorage.setItem('cloudSyncEnabled', e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-medium text-gray-600">{t('backup.autoUpload')}</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={createManualBackup}
              disabled={isCreatingBackup}
              className="bg-white border-2 border-rose-500 text-rose-600 p-4 rounded-2xl font-bold flex flex-col items-center gap-2 hover:bg-rose-50 transition"
            >
              <Download className="w-6 h-6" />
              {t('backup.createBackup')}
            </button>
            <button
              onClick={exportToExcel}
              className="bg-white border-2 border-blue-500 text-blue-600 p-4 rounded-2xl font-bold flex flex-col items-center gap-2 hover:bg-blue-50 transition"
            >
              <Upload className="w-6 h-6" />
              {t('backup.exportExcel')}
            </button>
            <button
              onClick={exportToPDF}
              className="bg-white border-2 border-red-500 text-red-600 p-4 rounded-2xl font-bold flex flex-col items-center gap-2 hover:bg-red-50 transition"
            >
              <FileText className="w-6 h-6" />
              {t('backup.exportPDF')}
            </button>
            {gDriveAuthorized && (
              <button
                onClick={async () => {
                  const cloudBackup = await downloadBackupFromDrive('smartstore_backup.json');
                  if (cloudBackup) restoreBackup(cloudBackup);
                  else toast.error(t('backup.noDriveBackup'));
                }}
                className="bg-white border-2 border-indigo-500 text-indigo-600 p-4 rounded-2xl font-bold flex flex-col items-center gap-2 hover:bg-indigo-50 transition"
              >
                <Cloud className="w-6 h-6" />
                {t('backup.restoreDrive')}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t('backup.savedBackups')} ({backups.length}/30)</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {backups.slice().reverse().map((backup, index) => {
                const actualIdx = backups.length - index - 1;
                return (
                  <div key={actualIdx} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-rose-200 transition">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <Calendar className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{backup.date} - {backup.time}</span>
                          {backup.isAuto && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{t('backup.auto')}</span>}
                          {backup.encrypted && <Lock className="w-3 h-3 text-rose-500" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {isRTL ? 'إجمالي المبيعات' : 'Total Sales'}: {backup.data?.sales?.length || 0} | 
                          {isRTL ? 'العملاء' : 'Customers'}: {backup.data?.customers?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedBackup === actualIdx ? (
                        <div className="flex items-center gap-2">
                          {backup.encrypted && (
                            <input
                              type="password"
                              placeholder={t('backup.passwordPlaceholder')}
                              value={restorePassword}
                              onChange={(e) => setRestorePassword(e.target.value)}
                              className="w-32 border p-1 rounded text-xs"
                            />
                          )}
                          <button
                            onClick={() => restoreBackup(backup)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-700"
                          >
                            {t('backup.restore')}
                          </button>
                          <button onClick={() => setSelectedBackup(null)} className="text-gray-400 hover:text-gray-600">
                             <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedBackup(actualIdx)}
                            className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition"
                          >
                            {t('backup.restore')}
                          </button>
                          <button
                            onClick={() => deleteBackup(actualIdx)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
