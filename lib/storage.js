'use client';

import { useState, useEffect, useCallback } from 'react';

// In Next.js, API is same-origin — no LAN detection needed
const API_URL = '/api';

// Helper للحصول على التوكن
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// خريطة الـ API endpoints
const API_ENDPOINTS = {
  screens: '/screens',
  phones: '/phones',
  accessories: '/accessories',
  stickers: '/stickers',
  customers: '/customers',
  suppliers: '/suppliers',
  sales: '/sales',
  repairs: '/repairs',
  expenses: '/expenses',
  returns: '/returns',
  installments: '/installments',
  categories: '/categories',
  products: '/products'
};

// كلاس للتخزين مع MongoDB
class MongoStorage {
  constructor() {
    this.cache = {};
  }

  async get(key) {
    try {
      const endpoint = API_ENDPOINTS[key];
      if (!endpoint) {
        console.warn(`لا يوجد endpoint لـ ${key}`);
        return { key, value: [] };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache[key] = data;
      return { key, value: data };
    } catch (error) {
      console.error(`خطأ في جلب بيانات ${key}:`, error);
      if (this.cache[key]) {
        return { key, value: this.cache[key] };
      }
      return { key, value: [] };
    }
  }

  async create(key, item) {
    try {
      const endpoint = API_ENDPOINTS[key];
      if (!endpoint) throw new Error(`لا يوجد endpoint لـ ${key}`);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في الإنشاء');
      }

      const data = await response.json();
      // Update cache
      if (!this.cache[key]) this.cache[key] = [];
      this.cache[key] = [...this.cache[key], data];
      return data;
    } catch (error) {
      console.error(`خطأ في إنشاء ${key}:`, error);
      throw error;
    }
  }

  async update(key, id, item) {
    try {
      const endpoint = API_ENDPOINTS[key];
      if (!endpoint) throw new Error(`لا يوجد endpoint لـ ${key}`);

      const response = await fetch(`${API_URL}${endpoint}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في التحديث');
      }

      const data = await response.json();
      // Update cache
      if (this.cache[key]) {
        this.cache[key] = this.cache[key].map(i => (i._id === id || i.id === id) ? data : i);
      }
      return data;
    } catch (error) {
      console.error(`خطأ في تحديث ${key}:`, error);
      throw error;
    }
  }

  async delete(key, id) {
    try {
      const endpoint = API_ENDPOINTS[key];
      if (!endpoint) throw new Error(`لا يوجد endpoint لـ ${key}`);

      const response = await fetch(`${API_URL}${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في الحذف');
      }

      // Update cache
      if (this.cache[key]) {
        this.cache[key] = this.cache[key].filter(i => i._id !== id && i.id !== id);
      }
      return true;
    } catch (error) {
      console.error(`خطأ في حذف ${key}:`, error);
      throw error;
    }
  }

  async set(key, value) {
    try {
      this.cache[key] = value;
      return true;
    } catch (error) {
      console.error(`خطأ في حفظ بيانات ${key}:`, error);
      return false;
    }
  }
}

export const storage = new MongoStorage();

export const useStorage = () => {
  const [data, setData] = useState({
    screens: [],
    phones: [],
    accessories: [],
    stickers: [],
    customers: [],
    suppliers: [],
    sales: [],
    repairs: [],
    expenses: [],
    returns: [],
    installments: [],
    categories: [],
    products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const keys = Object.keys(API_ENDPOINTS);
      const promises = keys.map(async (key) => {
        const result = await storage.get(key);
        return { key, value: result?.value || [] };
      });

      const results = await Promise.all(promises);
      const loadedData = {};
      results.forEach(({ key, value }) => {
        loadedData[key] = value;
      });

      setData(loadedData);
    } catch (err) {
      console.error('خطأ في تحميل البيانات:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = useCallback(async (key, newValue) => {
    try {
      const currentData = data[key] || [];

      const deletedItems = currentData.filter(oldItem => {
        const oldId = oldItem._id || oldItem.id;
        return !newValue.some(newItem => (newItem._id || newItem.id) === oldId);
      });

      const newItems = newValue.filter(newItem => {
        const newId = newItem._id || newItem.id;
        return !currentData.some(oldItem => (oldItem._id || oldItem.id) === newId);
      });

      const updatedItems = newValue.filter(newItem => {
        const newId = newItem._id || newItem.id;
        const oldItem = currentData.find(item => (item._id || item.id) === newId);
        if (!oldItem) return false;
        return JSON.stringify(oldItem) !== JSON.stringify(newItem);
      });

      for (const item of deletedItems) {
        const itemId = item._id || item.id;
        try { await storage.delete(key, itemId); } catch (err) { console.error(`فشل حذف ${key}:`, err); }
      }

      for (const item of newItems) {
        try {
          const result = await storage.create(key, item);
          const itemIndex = newValue.findIndex(i => (i.id === item.id) || (i._id === item._id));
          if (itemIndex !== -1 && result._id) {
            newValue[itemIndex] = { ...newValue[itemIndex], _id: result._id };
          }
        } catch (err) {
          console.error(`فشل إضافة ${key}:`, err);
          throw err;
        }
      }

      for (const item of updatedItems) {
        const itemId = item._id || item.id;
        try { await storage.update(key, itemId, item); } catch (err) { console.error(`فشل تحديث ${key}:`, err); }
      }

      setData(prev => ({ ...prev, [key]: newValue }));
      return true;
    } catch (err) {
      console.error(`فشل حفظ ${key}:`, err);
      return false;
    }
  }, [data]);

  const addItem = useCallback(async (key, item) => {
    try {
      const result = await storage.create(key, item);
      setData(prev => {
        const currentList = Array.isArray(prev[key]) ? prev[key] : [];
        return { ...prev, [key]: [...currentList, result] };
      });
      return result;
    } catch (err) {
      console.error(`فشل إضافة ${key}:`, err);
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (key, id, item) => {
    try {
      const result = await storage.update(key, id, item);
      setData(prev => ({
        ...prev,
        [key]: prev[key].map(i => (i._id === id || i.id === id) ? result : i)
      }));
      return result;
    } catch (err) {
      console.error(`فشل تحديث ${key}:`, err);
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (key, id) => {
    try {
      await storage.delete(key, id);
      setData(prev => ({
        ...prev,
        [key]: prev[key].filter(i => i._id !== id && i.id !== id)
      }));
      return true;
    } catch (err) {
      console.error(`فشل حذف ${key}:`, err);
      throw err;
    }
  }, []);

  const refreshData = useCallback(async (key) => {
    if (key) {
      const result = await storage.get(key);
      setData(prev => ({ ...prev, [key]: result?.value || [] }));
    } else {
      await loadData();
    }
  }, [loadData]);

  return { data, loading, error, saveData, addItem, updateItem, deleteItem, refreshData };
};

export const initializeStorage = () => {
  console.log('تم تهيئة التخزين - سيتم استخدام MongoDB');
};

export const clearLocalCache = () => {
  const allKeys = Object.keys(localStorage);
  // Keep only the essential token and user for session
  const keysToKeep = ['token', 'user', 'darkMode'];
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  console.log('تم مسح التخزين المحلي بنجاح - تم الإبقاء على الجلسة فقط');
  window.location.reload();
};
