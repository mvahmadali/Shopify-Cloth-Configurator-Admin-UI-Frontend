import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const handleAllProducts = () => {
    navigate('/all-products');
  };

  const handleAddProduct = () => {
    navigate('/add-product');
  };

  const handleEditProduct = () => {
    navigate('/edit-product');
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-primary">
          <div className="hero-copy">
            <h1>Custom Product Configurator</h1>
            <p>
              This admin UI helps you create custom products, define variations, attach option-level assets, and keep everything ready for Shopify integration.
            </p>
          </div>

          <div className="studio-card">
            <h3>Everything needed to build configurable products in one workspace.</h3>
            <p>
              Create a complete product structure with clear variant logic, reusable options, and clean catalog data so your Shopify workflow stays fast and consistent.
            </p>
            <div className="studio-pills">
              <span className="workflow-pill">Add Products</span>
              <span className="workflow-pill">Add Variations</span>
              <span className="workflow-pill">Add Options</span>
              <span className="workflow-pill">Upload Models</span>
            </div>
          </div>
        </div>

        <div className="home-side">
          <div className="menu-section">
            <h2>Product Manager</h2>
            <p className="subtitle">A cleaner command center for your configurable catalog</p>
            
            <div className="button-group">
              <button 
                className="menu-button all-products-btn"
                onClick={handleAllProducts}
              >
                <span className="button-icon button-icon-gold">01</span>
                <div className="button-content">
                  <h3>All Products</h3>
                  <p>View and manage all products</p>
                </div>
              </button>

              <button 
                className="menu-button add-product-btn"
                onClick={handleAddProduct}
              >
                <span className="button-icon button-icon-teal">02</span>
                <div className="button-content">
                  <h3>Add a Product</h3>
                  <p>Create a new 3D configurable product</p>
                </div>
              </button>

              <button 
                className="menu-button edit-product-btn"
                onClick={handleEditProduct}
              >
                <span className="button-icon button-icon-violet">03</span>
                <div className="button-content">
                  <h3>Edit a Product</h3>
                  <p>Modify existing product</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
