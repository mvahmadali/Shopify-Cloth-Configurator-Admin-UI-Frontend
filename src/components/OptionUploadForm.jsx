import React from 'react';
import PropTypes from 'prop-types';
import FileUpload from './FileUpload';
import './OptionUploadForm.css';

function OptionUploadForm({ option, productId, variationId, onUploadSuccess }) {
  return (
    <div className="option-upload-form">
      <div className="option-header">
        <div className="option-info">
          <h5>{option.name}</h5>
          <p className="option-value">Value: {option.value}</p>
          {option.priceModifier !== 0 && typeof option.priceModifier === 'number' && (
            <p className="price-modifier">
              Price Modifier: ${option.priceModifier.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <div className="upload-section">
        <FileUpload
          productId={productId}
          variationId={variationId}
          optionId={option._id}
          optionName={option.name}
          onUploadSuccess={onUploadSuccess}
        />
      </div>
    </div>
  );
}

OptionUploadForm.propTypes = {
  option: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    glbUrl: PropTypes.string,
    modelUrl: PropTypes.string,
    priceModifier: PropTypes.number
  }).isRequired,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variationId: PropTypes.string.isRequired,
  onUploadSuccess: PropTypes.func
};

export default OptionUploadForm;
