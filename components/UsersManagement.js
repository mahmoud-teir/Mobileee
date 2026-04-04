'use client';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X, Eye, EyeOff, Shield, UserCheck, UserX, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { PLAN_LIMITS } from '@/lib/planLimits';

const UsersManagement = () => {
  const { t, isRTL } = useLanguage();
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'employee'
  });

  const API_URL = process.env.REACT_APP_API_URL || '/api';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const slug = localStorage.getItem('currentStoreSlug');
      const response = await fetch(`${API_URL}/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-store-slug': slug || ''
        }
      });
      if (!response.ok) throw new Error(t('users.errorFetch'));
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', name: '', role: 'employee' });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      name: user.name || '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingUser ? `${API_URL}/users/${editingUser._id}` : `${API_URL}/users`;
      const method = editingUser ? 'PUT' : 'POST';
      const body = { ...formData };
      if (editingUser && !body.password) delete body.password;

      const slug = localStorage.getItem('currentStoreSlug');
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'x-store-slug': slug || ''
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error occurred');

      toast.success(editingUser ? t('users.updateSuccess') : t('users.createSuccess'));
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (userId) => {
    if (userId === currentUser._id) {
      toast.error(t('users.errorDeleteSelf'));
      return;
    }
    setDeleteModal({ isOpen: true, userId });
  };

  const confirmDelete = async () => {
    const userId = deleteModal.userId;
    setDeleteModal({ isOpen: false, userId: null });
    
    try {
      const slug = localStorage.getItem('currentStoreSlug');
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-store-slug': slug || ''
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Delete failed');
      }
      toast.success(t('users.deleteSuccess'));
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    if (userId === currentUser._id) {
      toast.error(t('users.errorToggleSelf'));
      return;
    }
    try {
      const slug = localStorage.getItem('currentStoreSlug');
      const response = await fetch(`${API_URL}/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'x-store-slug': slug || ''
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('users.errorToggle'));
      }
      toast.success(isActive ? t('users.inactive') : t('users.active'));
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-indigo-100 text-indigo-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'super_admin': return t('users.super_admin');
      case 'admin': return t('users.admin');
      case 'manager': return t('users.manager');
      default: return t('users.employee');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('users.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-rose-600" />
            {t('users.title')}
          </h2>
          <p className="text-gray-500 mt-1">{t('users.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* عرض حالة الخطة */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('common.plan')}</span>
            <span className="text-sm font-black text-rose-600 uppercase tracking-tighter">
              {PLAN_LIMITS[currentUser?.currentStore?.subscription?.plan || 'free']?.label}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={users.length >= (PLAN_LIMITS[currentUser?.currentStore?.subscription?.plan || 'free']?.maxUsers || 1)}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              users.length >= (PLAN_LIMITS[currentUser?.currentStore?.subscription?.plan || 'free']?.maxUsers || 1)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg'
            }`}
          >
            <Plus className="w-5 h-5" />
            {t('users.addUser')}
          </button>
        </div>
      </div>

      {users.length >= (PLAN_LIMITS[currentUser?.currentStore?.subscription?.plan || 'free']?.maxUsers || 1) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>
              {t('users.limitReached', { limit: PLAN_LIMITS[currentUser?.currentStore?.subscription?.plan || 'free']?.maxUsers })}
            </span>
          </div>
          <button 
             onClick={() => window.location.href = '#admin'} // or just inform them
             className="text-amber-800 font-bold underline px-2 py-1 hover:bg-amber-100 rounded-lg transition"
          >
            {t('common.upgrade')}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('users.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
          />
          <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'right-4' : 'left-4'}`} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
              <tr>
                <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('users.user')}</th>
                <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('users.email')}</th>
                <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('users.role')}</th>
                <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('users.status')}</th>
                <th className={`px-6 py-4 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('users.lastLogin')}</th>
                <th className="px-6 py-4 text-center font-semibold">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {t('users.noUsers')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="min-w-[40px] h-10 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {(user.name || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{user.name || user.username}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                        {user._id === currentUser._id && (
                          <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t('users.you')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? t('users.active') : t('users.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })
                        : t('users.neverLoggedIn')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t('common.edit')}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user._id, user.isActive)}
                          className={`p-2 rounded-lg transition ${user.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={user.isActive ? t('users.inactive') : t('users.active')}
                          disabled={user._id === currentUser._id}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title={t('common.delete')}
                          disabled={user._id === currentUser._id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-blue-500" />} label={t('users.total')} value={users.length} color="blue" />
        <StatCard icon={<UserCheck className="text-green-500" />} label={t('users.activeCount')} value={users.filter(u => u.isActive).length} color="green" />
        <StatCard icon={<Shield className="text-rose-500" />} label={t('users.adminCount')} value={users.filter(u => u.role === 'admin').length} color="rose" />
        <StatCard icon={<UserX className="text-purple-500" />} label={t('users.inactiveCount')} value={users.filter(u => !u.isActive).length} color="purple" />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{editingUser ? t('users.modalEditTitle') : t('users.modalAddTitle')}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <InputGroup label={t('users.username')} required value={formData.username} onChange={val => setFormData({...formData, username: val})} placeholder={t('users.usernamePlaceholder')} />
              <InputGroup label={t('users.fullName')} value={formData.name} onChange={val => setFormData({...formData, name: val})} placeholder={t('users.namePlaceholder')} />
              <InputGroup label={t('users.email')} required type="email" value={formData.email} onChange={val => setFormData({...formData, email: val})} placeholder={t('users.emailPlaceholder')} />
              
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
                  {t('users.password')} {!editingUser && <span className="text-red-500">*</span>}
                  {editingUser && <span className="text-gray-400 font-normal italic mx-2">{t('users.passwordHint')}</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all ${isRTL ? 'pl-12' : 'pr-12'}`}
                    placeholder={editingUser ? '••••••••' : t('users.passwordPlaceholder')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">{t('users.role')} <span className="text-red-500">*</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all bg-white"
                >
                  <option value="employee">{t('users.employee')}</option>
                  <option value="manager">{t('users.manager')}</option>
                  <option value="admin">{t('users.admin')}</option>
                  {currentUser.role === 'super_admin' && (
                    <option value="super_admin">{t('users.super_admin')}</option>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {editingUser ? t('users.save') : t('users.create')}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  {t('users.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null })}
        onConfirm={confirmDelete}
        title={t('users.deleteConfirm')}
        message={t('users.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        iconType="delete"
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-md border border-gray-50 flex items-center gap-4">
    <div className={`p-3 bg-${color}-50 rounded-xl`}>{icon}</div>
    <div>
      <p className="text-xl font-black text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const InputGroup = ({ label, required, value, onChange, placeholder, type = "text" }) => (
  <div>
    <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 transition-all"
      placeholder={placeholder}
    />
  </div>
);

export default UsersManagement;
