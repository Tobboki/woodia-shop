export const environment = {
  production: true,
  apiUrl: 'https://woodia.onrender.com',
  googleSignInClientId: import.meta.env["NG_APP_GOOGLE_SIGN_IN_CLIENT_ID"],
  endpoints: {
    constants: {
      governorate: '/api/Governorate',
    },
    auth: {
      login: '/Auth',
      register: '/Auth/register',
      refreshToken: '/Auth/refresh',
      confirmEmail: '/Auth/confirm-email',
      resendConfirmation: '/Auth/resend-confirmation',
      googleSignIn: '/Auth/google-login',
      googleSignUp: '/Auth/google-Signup',
    },
    customer: {
      me: '/me',
      settings: {
        account: {
          info: '/me/info',
          updateEmail: '/me/change-email',
          verifyEmail: '/me/verify-email',
        },
        shipping: {
          getShippingDetails: '/me/contact-info',
          createShippingDetails: '/me/contact-info',
          updateShippingDetails: '/me/contact-info',
        },
      },
      category: {
        getAll: '/api/Category',
        getBySlug: (slug: string) => `/api/Category/${slug}`,
        getParentCategories: '/api/Category/Parent',
      },
      product: {
        getAll: '/api/Product',
        getById: (id: number) => `/api/Product/${id}`,
        getByCategorySlug: (slug: string) => `/api/Category/${slug}/Products`,
      },
    },
  },
};
