/**
 * API Service for HTS Data
 */

const BASE_URL = '/api';

export const apiService = {
  /**
   * Search HTS records by query and optional categories
   */
  searchHTS: async (query, filters = {}) => {
    try {
      const { gender, material, fabric, feature } = filters;
      let url = `${BASE_URL}/search?q=${encodeURIComponent(query || '')}`;
      
      if (gender && gender !== 'All') url += `&gender=${encodeURIComponent(gender)}`;
      if (material && material !== 'All') url += `&material=${encodeURIComponent(material)}`;
      if (fabric && fabric !== 'All') url += `&fabric=${encodeURIComponent(fabric)}`;
      if (feature && feature !== 'All') url += `&feature=${encodeURIComponent(feature)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("API Error: searchHTS failed", error);
      throw error;
    }
  },

  syncHTS: async () => {
    try {
      const res = await fetch(`${BASE_URL}/sync`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Server error (${res.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return await res.json();
    } catch (error) {
      console.error("API Error: syncHTS failed", error);
      // Ensure we pass the meaningful message upwards
      throw error;
    }
  },

  getMetadata: async () => {
    try {
      const res = await fetch(`${BASE_URL}/metadata`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("API Error: getMetadata failed", error);
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
  },
  /**
   * Get ancestors and siblings for a code
   */
  getHierarchy: async (code) => {
    const response = await fetch(`${BASE_URL}/hierarchy/${code}`);
    if (!response.ok) throw new Error('Failed to fetch hierarchy');
    return response.json();
  }
};
