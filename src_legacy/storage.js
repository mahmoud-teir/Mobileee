import { useState, useEffect, useCallback } from 'react';

// تحديد عنوان API تلقائياً - يعمل على الشبكة المحلية
const getApiUrl = () => {
  // إذا تم تحديد عنوان مخصص في البيئة
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // استخدام نفس host الذي يعمل عليه الموقع (للشبكة المحلية)
  const host = window.location.hostname;
  return `http://${host}:5000/api`;
};

const API_URL = getApiUrl();

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
  installments: '/installments'
};

// كلاس للتخزين مع MongoDB
class MongoStorage {
  constructor() {
    this.cache = {};
  }

  // جلب البيانات من API
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
      // في حالة فشل الاتصال، استخدم الكاش
      if (this.cache[key]) {
        return { key, value: this.cache[key] };
      }
      return { key, value: [] };
    }
  }

  // حفظ عنصر جديد
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
      return data;
    } catch (error) {
      console.error(`خطأ في إنشاء ${key}:`, error);
      throw error;
    }
  }

  // تحديث عنصر
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
      return data;
    } catch (error) {
      console.error(`خطأ في تحديث ${key}:`, error);
      throw error;
    }
  }

  // حذف عنصر
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

      return true;
    } catch (error) {
      console.error(`خطأ في حذف ${key}:`, error);
      throw error;
    }
  }

  // تحديث الكاش فقط (بدون localStorage)
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

// إنشاء مثيل واحد
export const storage = new MongoStorage();

// Hook لاستخدام التخزين مع MongoDB
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
    installments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // تحميل البيانات من MongoDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const keys = Object.keys(API_ENDPOINTS);
      const loadedData = {};

      // تحميل جميع البيانات بالتوازي
      const promises = keys.map(async (key) => {
        const result = await storage.get(key);
        return { key, value: result?.value || [] };
      });

      const results = await Promise.all(promises);
      results.forEach(({ key, value }) => {
        loadedData[key] = value;
      });

      setData(loadedData);
      console.log('تم تحميل البيانات من MongoDB:', loadedData);
    } catch (err) {
      console.error('خطأ في تحميل البيانات:', err);
      setError(err.message);
      // لا يتم استخدام localStorage - الاعتماد على MongoDB فقط
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    loadData();
  }, [loadData]);

  // حفظ البيانات مع المزامنة إلى MongoDB
  const saveData = useCallback(async (key, newValue) => {
    try {
      const currentData = data[key] || [];

      // اكتشاف العناصر المحذوفة
      const deletedItems = currentData.filter(oldItem => {
        const oldId = oldItem._id || oldItem.id;
        return !newValue.some(newItem => (newItem._id || newItem.id) === oldId);
      });

      // اكتشاف العناصر الجديدة
      const newItems = newValue.filter(newItem => {
        const newId = newItem._id || newItem.id;
        return !currentData.some(oldItem => (oldItem._id || oldItem.id) === newId);
      });

      // اكتشاف العناصر المعدلة
      const updatedItems = newValue.filter(newItem => {
        const newId = newItem._id || newItem.id;
        const oldItem = currentData.find(item => (item._id || item.id) === newId);
        if (!oldItem) return false;
        return JSON.stringify(oldItem) !== JSON.stringify(newItem);
      });

      // تنفيذ عمليات الحذف في MongoDB
      for (const item of deletedItems) {
        const itemId = item._id || item.id;
        try {
          await storage.delete(key, itemId);
          console.log(`تم حذف ${key}:`, itemId);
        } catch (err) {
          console.error(`فشل حذف ${key}:`, err);
        }
      }

      // تنفيذ عمليات الإضافة في MongoDB
      for (const item of newItems) {
        try {
          const result = await storage.create(key, item);
          console.log(`تم إضافة ${key}:`, result);
          // تحديث العنصر في newValue بالـ _id من MongoDB
          const itemIndex = newValue.findIndex(i => (i.id === item.id) || (i._id === item._id));
          if (itemIndex !== -1 && result._id) {
            newValue[itemIndex] = { ...newValue[itemIndex], _id: result._id };
          }
        } catch (err) {
          console.error(`فشل إضافة ${key}:`, err);
          throw err; // رمي الخطأ للأعلى حتى يعرف المستخدم
        }
      }

      // تنفيذ عمليات التحديث في MongoDB
      for (const item of updatedItems) {
        const itemId = item._id || item.id;
        try {
          await storage.update(key, itemId, item);
          console.log(`تم تحديث ${key}:`, itemId);
        } catch (err) {
          console.error(`فشل تحديث ${key}:`, err);
        }
      }

      // تحديث الحالة
      setData(prev => ({
        ...prev,
        [key]: newValue
      }));

      return true;
    } catch (err) {
      console.error(`فشل حفظ ${key}:`, err);
      return false;
    }
  }, [data]);

  // إضافة عنصر جديد
  const addItem = useCallback(async (key, item) => {
    try {
      const result = await storage.create(key, item);

      // تحديث الحالة المحلية
      setData(prev => ({
        ...prev,
        [key]: [...prev[key], result]
      }));

      return result;
    } catch (err) {
      console.error(`فشل إضافة ${key}:`, err);
      throw err;
    }
  }, []);

  // تحديث عنصر
  const updateItem = useCallback(async (key, id, item) => {
    try {
      const result = await storage.update(key, id, item);

      // تحديث الحالة المحلية
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

  // حذف عنصر
  const deleteItem = useCallback(async (key, id) => {
    try {
      await storage.delete(key, id);

      // تحديث الحالة المحلية
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

  // إعادة تحميل البيانات
  const refreshData = useCallback(async (key) => {
    if (key) {
      const result = await storage.get(key);
      setData(prev => ({
        ...prev,
        [key]: result?.value || []
      }));
    } else {
      await loadData();
    }
  }, [loadData]);

  return {
    data,
    loading,
    error,
    saveData,
    addItem,
    updateItem,
    deleteItem,
    refreshData
  };
};

// دالة تهيئة - للتوافق مع الكود القديم
export const initializeStorage = () => {
  console.log('تم تهيئة التخزين - سيتم استخدام MongoDB');
};

// دالة لترحيل البيانات من localStorage إلى MongoDB
export const migrateLocalDataToMongoDB = async () => {
  const keys = Object.keys(API_ENDPOINTS);
  const migratedData = {};

  for (const key of keys) {
    const localData = localStorage.getItem(`mobile_shop_${key}`);
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          migratedData[key] = parsedData;
          console.log(`تم العثور على ${parsedData.length} عنصر في ${key}`);
        }
      } catch (e) {
        console.error(`خطأ في قراءة ${key}:`, e);
      }
    }
  }

  return migratedData;
};
