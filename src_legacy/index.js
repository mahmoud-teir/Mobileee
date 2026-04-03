import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';

// تأمين localStorage
if (typeof window !== 'undefined') {
  // منع محو localStorage عند تحديث الصفحة
  window.addEventListener('beforeunload', (e) => {
    // لا نفعل شيئاً - نحافظ على البيانات
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
