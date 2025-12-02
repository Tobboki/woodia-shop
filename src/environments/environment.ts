export const environment = {
  production: true,
  apiUrl: 'https://woodia.onrender.com',
  endpoints: {
    googleSignInClientId: process.env['NG_APP_GOOGLE_SIGN_IN_CLIENT_ID'] ?? '',
    googleAuthAppSecret: process.env['NG_APP_GOOGLE_AUTH_APP_SECRET'] ?? '',
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