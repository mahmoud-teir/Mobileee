export const PLAN_LIMITS = {
  free: {
    maxUsers: 1,
    features: ['inventory', 'repairs', 'sales', 'expenses', 'customers', 'suppliers', 'returns', 'dashboard', 'settings']
  },
  pro: {
    maxUsers: 5,
    features: ['inventory', 'repairs', 'sales', 'expenses', 'customers', 'suppliers', 'returns', 'dashboard', 'installments', 'reports', 'users', 'settings']
  },
  enterprise: {
    maxUsers: Infinity,
    features: ['inventory', 'repairs', 'sales', 'expenses', 'customers', 'suppliers', 'returns', 'dashboard', 'installments', 'reports', 'users', 'settings']
  }
};

export const hasFeature = (plan, feature) => {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  
  // Inventory sub-features mapping
  const inventorySubFeatures = ['screens', 'phones', 'accessories', 'stickers', 'products', 'categories'];
  if (inventorySubFeatures.includes(feature) && limits.features.includes('inventory')) {
    return true;
  }

  return limits.features.includes(feature);
};

export const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};
