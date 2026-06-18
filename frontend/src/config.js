// Automatically determine the API URL based on the environment
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://proyecto-compras-w9z3.onrender.com/api' : 'http://localhost:3001/api');
