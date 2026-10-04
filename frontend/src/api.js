import axios from 'axios';

// Since backend is now a Vercel Serverless Function, it shares the same domain!
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

export const evaluateWaterSample = async (sampleData) => {
  try {
    const response = await apiClient.post('/assess', sampleData);
    return response.data;
  } catch (error) {
    console.error("AquaGravity API Error:", error);
    throw error;
  }
};
