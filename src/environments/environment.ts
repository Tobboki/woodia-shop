export const environment = {
  production: true,
  apiUrl: 'https://woodia-production.up.railway.app',
  endpoints: {
    login: '/Auth',
    register: '/Auth/register',
    refreshToken: '/Auth/refresh',
    confirmEmail: '/Auth/confirm-email',
    resendConfirmation: '/Auth/resend-confirmation',
  }
};