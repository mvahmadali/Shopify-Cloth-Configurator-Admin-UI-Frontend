import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './VariationSection.css';

function VariationSection({ variation, productId, renderOptions }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="variation-section">
      <button
        className="variation-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="expand-icon">{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
        <h4>{variation.name}</h4>
        <span className="option-count">({variation.options?.length || 0} options)</span>
      </button>

      {expanded && (
        <div className="variation-content">
          {variation.options && variation.options.length > 0 ? (
            variation.options.map(option =>
              renderOptions(option, variation._id, productId)
            )
          ) : (
            <p className="no-options">No options for this variation yet</p>
          )}
        </div>
      )}
    </div>
  );
}

VariationSection.propTypes = {
  variation: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    options: PropTypes.array
  }).isRequired,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  renderOptions: PropTypes.func.isRequired
};

export default VariationSection;
