import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'https://shopify-cloth-configurator-admin-ui-production.up.railway.app/api/admin'}`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const productApi = {
  async getAll() {
    console.log('API: Fetching all products...');
    try {
      const response = await api.get('/products');
      console.log('API: Successfully fetched products', response.data);
      return response;
    } catch (error) {
      console.error('API: Error fetching products', error);
      throw error;
    }
  },
  
  async getById(id) {
    console.log(`API: Fetching product ${id}...`);
    try {
      const response = await api.get(`/products/${id}`);
      console.log(`API: Successfully fetched product ${id}`, response.data);
      return response;
    } catch (error) {
      console.error(`API: Error fetching product ${id}`, error);
      throw error;
    }
  },
  
  async create(data) {
    console.log('API: Creating new product...', data);
    try {
      const response = await api.post('/products', data);
      console.log('API: Successfully created product', response.data);
      return response;
    } catch (error) {
      console.error('API: Error creating product', error);
      const errorMsg = error.response?.data?.error || error.message;
      console.error('Server error message:', errorMsg);
      const apiError = new Error(errorMsg);
      apiError.response = error.response;
      throw apiError;
    }
  },

  async update(id, data) {
    console.log(`API: Updating product ${id}...`, data);
    try {
      const response = await api.patch(`/products/${id}`, data);
      console.log(`API: Successfully updated product ${id}`, response.data);
      return response;
    } catch (error) {
      console.error(`API: Error updating product ${id}`, error);
      throw error;
    }
  },

  async deleteProduct(id) {
    console.log(`API: Deleting product ${id}...`);
    try {
      const response = await api.delete(`/products/${id}`);
      console.log(`API: Successfully deleted product ${id}`);
      return response;
    } catch (error) {
      console.error(`API: Error deleting product ${id}`, error);
      throw error;
    }
  },
  
  async addVariation(productId, data) {
    console.log(`API: Adding variation to product ${productId}...`, data);
    try {
      const response = await api.post(`/products/${productId}/variations`, data);
      console.log(`API: Successfully added variation to product ${productId}`, response.data);
      return response;
    } catch (error) {
      console.error(`API: Error adding variation to product ${productId}`, error);
      throw error;
    }
  },
  
  async addOption(productId, variationId, data) {
    console.log(`API: Adding option to variation ${variationId} of product ${productId}...`, data);
    try {
      const response = await api.post(
        `/products/${productId}/variations/${variationId}/options`,
        data
      );
      console.log('API: Successfully added option', response.data);
      return response;
    } catch (error) {
      console.error('API: Error adding option', error);
      throw error;
    }
  },

  async deleteOption(productId, variationId, optionId) {
    console.log('API: Deleting option...', { productId, variationId, optionId });
    try {
      const response = await api.delete(
        `/products/${productId}/variations/${variationId}/options/${optionId}`
      );
      console.log('API: Successfully deleted option');
      return response;
    } catch (error) {
      console.error('API: Error deleting option', error);
      throw error;
    }
  }
};

export const uploadApi = {
  async uploadModel(productId, variationId, optionId, file) {
    console.log(`API: Uploading model for option ${optionId}...`, { fileName: file.name });
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('variationId', variationId);
    formData.append('optionId', optionId);
    formData.append('file', file);

    try {
      const response = await api.post('/upload-model', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('API: Successfully uploaded model', response.data);
      return response;
    } catch (error) {
      console.error('API: Error uploading model', error);
      throw error;
    }
  },

  async uploadBaseModel(productId, file) {
    console.log(`API: Uploading base model for product ${productId}...`, { fileName: file.name });
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('file', file);

    try {
      const response = await api.post('/upload-model/base-model', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('API: Successfully uploaded base model', response.data);
      return response;
    } catch (error) {
      console.error('API: Error uploading base model', error);
      throw error;
    }
  }
};

export default api;
