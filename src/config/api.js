// API Configuration
// Update VERCEL_API_URL after deploying your API to Vercel

const config = {
  // IMPORTANT: Replace this with your actual Vercel API URL after deployment
  // Example: 'https://ai-risk-monitor-api.vercel.app'
  VERCEL_API_URL: import.meta.env.VITE_API_URL || 'https://air-isk-monitor-api.vercel.app',

  // API endpoints
  endpoints: {
    openai: '/api/openai',
    // Add more endpoints as needed
  },

  // Development mode detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;

