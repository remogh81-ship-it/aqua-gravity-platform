import axios from 'axios';

// Nginx is configured to reverse-proxy requests from '/api/' to the FastAPI backend.
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Sends water sample data to the AquaGravity deterministic engine for full evaluation.
 * @param {Object} sampleData - The physicochemical and microbial parameters.
 * @returns {Promise<Object>} Assessment output (Compliance, WQI, Stability, Dosage, Treatment)
 */
export const evaluateWaterSample = async (sampleData) => {
  try {
    const response = await apiClient.post('/assess', sampleData);
    return response.data;
  } catch (error) {
    console.error("AquaGravity API Error:", error);
    throw error;
  }
};
