export const environment = {
  production: true,
  apiUrl: 'https://woodia.onrender.com',
  endpoints: {
    constants: {
      governorate: '/Governorate',
    },
    auth: {
      login: '/Auth',
      register: '/Auth/register',
      refreshToken: '/Auth/refresh',
      confirmEmail: '/Auth/confirm-email',
      resendConfirmation: '/Auth/resend-confirmation',
      googleSignIn: '/Auth/google-signin',
      facebookSignIn: '/Auth/facebook-signin',
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