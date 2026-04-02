/**
 * API Service for HTS Data
 */

const BASE_URL = '/api';

export const apiService = {
  /**
   * Search HTS records by query (code or description)
   */
  searchHTS: async (query) => {
    try {
      const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("API Error: searchHTS failed", error);
      throw error;
    }
  },

  /**
   * Get HTS record by exact code
   */
  getByCode: async (code) => {
    try {
      const res = await fetch(`${BASE_URL}/code/${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("API Error: getByCode failed", error);
      throw error;
    }
  },

  getStatus: async () => {
    try {
      const res = await fetch(`${BASE_URL}/status`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("API Error: getStatus failed", error);
      throw error;
    }
  }
};
