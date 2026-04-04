export const PLAN_LIMITS = {
  free: {
    maxUsers: 1,
    features: ['inventory', 'repairs', 'sales', 'expenses', 'customers', 'suppliers', 'returns', 'dashboard'],
    label: 'المجانية'
  },
  pro: {
    maxUsers: 5,
    features: ['inventory', 'repairs', 'sales', 'expenses', 'customers', 'suppliers', 'returns', 'dashboard', 'installments', 'reports', 'users'],
    label: 'المحترفة'
  },
  enterprise: {
    maxUsers: Infinity,
    features: ['inventory', 'repairs', 'sales', 'expenses', 'customers', 'suppliers', 'returns', 'dashboard', 'installments', 'reports', 'users'],
    label: 'المؤسسات'
  }
};

export const hasFeature = (plan, feature) => {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits.features.includes(feature);
};

export const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};
