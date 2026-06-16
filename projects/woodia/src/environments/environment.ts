export const environment = {
  production: true,
  apiUrl: 'https://woodia.onrender.com',
  googleSignInClientId: import.meta.env["NG_APP_GOOGLE_SIGN_IN_CLIENT_ID"],
  endpoints: {
    upload: "/admin/Upload",
    translation: "/api/Translation/translate",
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
          addProfileImage: '/me/profile-image',
          updateProfileImage: '/me/profile-image',
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
        create: '/api/admin/Product',
        getAll: '/api/Product',
        getById: (id: number) => `/api/Product/${id}`,
        getByCategorySlug: (slug: string) => `/api/Category/${slug}/Products`,
        getPopularDesigns: '/api/Product/most-loved',
      },
      job: {
        create: '/api/Job',
        update: (id: number) => `/api/Job/${id}`,
        myJobs: '/api/Job',
        getById: (id: number) => `/api/Job/${id}`,
        updateStatusComplete: (id: number) => `/api/Job/${id}/complete`,
        updateStatusCanceled: (id: number) => `/api/Job/${id}/cancele`,
        updateStatusInProgress: (id: number) => `/api/Job/${id}/inprogress`,
      },
    },
    maker: {
      me: '/me',
      info: '/me/info',
      profile: {
        professional: '/Carpenter/professional-profile',
        portfolio: '/Carpenter/Portfolio-Item',
        portfolioItems: '/Carpenter/Portfolio-Items',
      },
      jobs: {
        available: '/api/carpenter/Job/available',
        getById: (id: number) => `/api/carpenter/Job/${id}`,
        submitOffer: (jobId: number) => `/api/carpenter/jobs/${jobId}/offers`,
        myOffers: '/api/carpenter/Offers',
        offerDetails: (id: number) => `/api/carpenter/Offers/${id}`,
        withdrawOffer: (id: number) => `/api/carpenter/Offers/${id}/withdraw`,
      },
      settings: {
        account: {
          addProfileImage: '/me/profile-image',
          updateProfileImage: '/me/profile-image',
        },
        contactInfo: {
          getContactInfo: '/me/contact-info',
          createContactInfo: '/me/contact-info',
          updateContactInfo: '/me/contact-info',
        }
      }
    },
  },
};
