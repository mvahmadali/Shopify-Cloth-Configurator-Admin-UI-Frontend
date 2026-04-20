import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import ProductEditor from '../components/ProductEditor';
import './EditProductPage.css';

function EditProductPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getAll();
      setProducts(response.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  if (loading && products.length === 0) {
    return <div className="edit-product-page"><div className="loading">Loading products...</div></div>;
  }

  return (
    <div className="edit-product-page">
      {/* Left side - Products list */}
      <div className="products-list-section">
        <div className="list-header">
          <h2>Select Product</h2>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadProducts}>Try Again</button>
          </div>
        )}

        {products.length === 0 ? (
          <div className="no-products">
            <p>No products found. Create one first from the main menu.</p>
          </div>
        ) : (
          <div className="products-list">
            {products.map(product => (
              <div 
                key={product._id}
                className={`product-item ${selectedProduct?._id === product._id ? 'active' : ''}`}
                onClick={() => handleSelectProduct(product)}
              >
                <div className="product-item-header">
                  <h4>{product.name}</h4>
                  <span className="sku-badge">{product.SKU}</span>
                </div>
                <p className="variations-count">{product.variations?.length || 0} variations</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Edit form */}
      <div className="edit-form-section">
        <ProductEditor 
          product={selectedProduct} 
          onSaveSuccess={loadProducts} 
          defaultEditable={true} 
          onClearSelection={() => setSelectedProduct(null)} 
        />
      </div>
    </div>
  );
}

export default EditProductPage;
