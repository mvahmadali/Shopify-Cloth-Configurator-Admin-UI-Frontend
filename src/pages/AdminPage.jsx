import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { productApi } from '../services/api';
import VariationSection from '../components/VariationSection';
import OptionUploadForm from '../components/OptionUploadForm';
import './AdminPage.css';

function AdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);

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

  const handleUploadSuccess = (productId) => {
    // Reload products to get updated model URLs
    loadProducts();
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="error-box">
          <AlertCircle size={40} />
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadProducts}>
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage 3D Models for Product Options</p>
      </header>

      <div className="products-container">
        {products.length === 0 ? (
          <div className="no-products">
            <p>No products found</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card">
              <button
                className="product-header"
                onClick={() => setExpandedProduct(
                  expandedProduct === product._id ? null : product._id
                )}
              >
                <span className="expand-icon">
                  {expandedProduct === product._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </span>
                <div className="product-title">
                  <h3>{product.name}</h3>
                  <span className="sku">SKU: {product.SKU}</span>
                </div>
                <span className="variation-count">
                  {product.variations?.length || 0} variations
                </span>
              </button>

              {expandedProduct === product._id && (
                <div className="product-content">
                  {product.variations && product.variations.length > 0 ? (
                    product.variations.map(variation => (
                      <VariationSection
                        key={variation._id}
                        variation={variation}
                        productId={product._id}
                        renderOptions={(option, variationId, productId) => (
                          <OptionUploadForm
                            key={option._id}
                            productId={productId}
                            variationId={variationId}
                            option={option}
                            onUploadSuccess={() => handleUploadSuccess(productId)}
                          />
                        )}
                      />
                    ))
                  ) : (
                    <p className="no-variations">
                      No variations for this product
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="admin-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

export default AdminPage;
