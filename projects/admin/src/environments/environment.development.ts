export const environment = {
  production: false,
  apiUrl: 'https://woodia.onrender.com',
  endpoints: {
    auth: {
      login: '/Auth',
      register: '/Auth/register',
      refreshToken: '/Auth/refresh',
      confirmEmail: '/Auth/confirm-email',
      resendConfirmation: '/Auth/resend-confirmation',
    },
    upload: '/admin/Upload',
    translation: "/api/Translation/translate",
    category: {
      getAll: '/api/admin/Category',
      getOne: (id: number) => `/api/admin/Category/${id}`,
      create: '/api/admin/Category',
      update: (id: number) => `/api/admin/Category/${id}`,
      delete: (id: number) => `/api/admin/Category/${id}`,
      getParents: '/api/admin/Category/parents',
      getChildren: '/api/admin/Category/childrens',
    },
    product: {
      getAll: '/api/admin/Product',
      getOne: (id: number) => `/api/admin/Product/${id}`,
      create: '/api/admin/Product',
      update: (id: number) => `/api/admin/Product/${id}`,
      delete: (id: number) => `/api/admin/Product/${id}`,
      updateStatus: (id: number) => `/api/admin/Product/${id}/status`,
    },
  },
};
