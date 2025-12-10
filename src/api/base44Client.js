// Base44 SDK has been replaced by Supabase/Lovable Cloud
// This file exists for backward compatibility but is not used

export const base44 = {
  auth: {
    isAuthenticated: async () => false,
    me: async () => null,
    redirectToLogin: () => {},
    logout: () => {},
  },
  entities: {},
  integrations: {
    Core: {
      UploadFile: async () => ({ file_url: '' }),
      SendEmail: async () => ({}),
      InvokeLLM: async () => ({}),
      GenerateImage: async () => ({}),
    }
  },
  functions: {}
};