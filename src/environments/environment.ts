export const environment = {
  production: true,
  apiUrl: 'https://woodia.onrender.com',
  googleSignInClientId: process.env["NG_APP_GOOGLE_SIGN_IN_CLIENT_ID"],
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
          getShippingDetails: '/me/contact-info',
          createShippingDetails: '/me/contact-info',
          updateShippingDetails: '/me/contact-info',
        },
      },
    },
  },
};