import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productApi } from '../services/api';
import ConfiguratorUI from '../components/ConfiguratorUI';
import './ConfiguratorPage.css';

function ConfiguratorPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getById(productId);
      setProduct(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="configurator-page">
        <div className="loading">Loading configurator...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="configurator-page">
        <div className="error-box">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadProduct}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="configurator-page">
        <div className="error-box">
          <h3>Product Not Found</h3>
          <p>The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="configurator-page">
      <ConfiguratorUI product={product} />
    </div>
  );
}

export default ConfiguratorPage;
