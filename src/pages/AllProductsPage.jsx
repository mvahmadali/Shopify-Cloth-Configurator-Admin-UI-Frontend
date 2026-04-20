import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { productApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import ProductEditor from '../components/ProductEditor';
import './AllProductsPage.css';

function AllProductsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
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
      const productsData = response.data.data || [];
      setProducts(productsData);
      if (productsData.length > 0) {
        setSelectedProduct(productsData[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productApi.deleteProduct(productId);
      addToast('Product deleted successfully!', 'success');
      loadProducts();
    } catch (err) {
      const errorMsg = err.message || 'Error deleting product';
      addToast(errorMsg, 'error');
      alert('Error deleting product: ' + errorMsg);
    }
  };

  const handleUploadSuccess = () => {
    loadProducts();
  };

  if (loading) {
    return <div className="all-products-page"><div className="loading">Loading products...</div></div>;
  }

  return (
    <div className="all-products-page">
      {/* Left side - Products list */}
      <div className="products-list-section">
        <div className="list-header">
          <h2>All Products</h2>
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
            <p>No products yet. Create one from the main menu.</p>
          </div>
        ) : (
          <div className="products-list">
            {products.map(product => (
              <div 
                key={product._id}
                className={`product-item ${selectedProduct?._id === product._id ? 'active' : ''}`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="product-item-header">
                  <h4>{product.name}</h4>
                  <span className="sku-badge">{product.SKU}</span>
                </div>
                <p className="variations-count">{product.variations?.length || 0} variations</p>
                <button 
                  className="delete-item-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProduct(product._id);
                  }}
                >
                  <Trash2 size={14} /> <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Product details */}
      <div className="product-details-section">
        <ProductEditor 
          product={selectedProduct} 
          onSaveSuccess={handleUploadSuccess} 
          defaultEditable={false} 
          onClearSelection={() => setSelectedProduct(null)} 
        />
      </div>
    </div>
  );
}

export default AllProductsPage;
