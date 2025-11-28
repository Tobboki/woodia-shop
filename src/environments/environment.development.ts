export const environment = {
  production: false,
  apiUrl: 'https://woodia.onrender.com',
  endpoints: {
    login: '/Auth',
    register: '/Auth/register',
    refreshToken: '/Auth/refresh',
    confirmEmail: '/Auth/confirm-email',
    resendConfirmation: '/Auth/resend-confirmation',
    constants: {
      governorate: '/Governorate',
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
          createShippingDetails: '/me/contact-info',
          updateShippingDetails: '/me/contact-info',
        },
      },
    },
  },
};