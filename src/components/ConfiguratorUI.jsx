import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ConfiguratorUI.css';
import ModelViewer from './ModelViewer';

function ConfiguratorUI({ product }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showModel, setShowModel] = useState(false);

  const handleOptionSelect = (variationId, optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [variationId]: optionId
    }));
  };

  // Find currently selected option models
  const selectedModels = product.variations?.map(variation => {
    const selectedOptionId = selectedOptions[variation.id];
    const selectedOption = variation.options?.find(o => o.id === selectedOptionId);
    return selectedOption?.modelUrl;
  }).filter(Boolean) || [];

  const primaryModel = selectedModels[0];

  return (
    <div className="configurator-ui">
      <div className="configurator-header">
        <h2>{product.name}</h2>
        <p className="sku">SKU: {product.SKU}</p>
      </div>

      <div className="configurator-container">
        <div className="options-panel">
          <h3>Configure Product</h3>
          {product.variations && product.variations.length > 0 ? (
            product.variations.map(variation => (
              <div key={variation.id} className="variation-control">
                <label className="variation-label">{variation.name}</label>
                <div className="option-buttons">
                  {variation.options && variation.options.map(option => (
                    <button
                      key={option.id}
                      className={`option-button ${
                        selectedOptions[variation.id] === option.id ? 'active' : ''
                      } ${!option.modelUrl ? 'disabled' : ''}`}
                      onClick={() => handleOptionSelect(variation.id, option.id)}
                      title={!option.modelUrl ? 'Model not uploaded yet' : ''}
                      disabled={!option.modelUrl}
                    >
                      {option.name}
                      {option.modelUrl && <span className="checkmark">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="no-variations">No variations available</p>
          )}

          {primaryModel && (
            <button
              className="view-model-button"
              onClick={() => setShowModel(!showModel)}
            >
              {showModel ? 'Hide Model' : 'View 3D Model'}
            </button>
          )}
        </div>

        {showModel && primaryModel && (
          <div className="model-panel">
            <ModelViewer
              modelUrl={primaryModel}
              label="3D Model Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}

ConfiguratorUI.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    SKU: PropTypes.string.isRequired,
    variations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        modelUrl: PropTypes.string
      }))
    }))
  }).isRequired
};

export default ConfiguratorUI;
