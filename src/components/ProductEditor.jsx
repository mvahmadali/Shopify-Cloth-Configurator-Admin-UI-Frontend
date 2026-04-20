import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Upload,
  FileBox,
  X
} from 'lucide-react';
import { productApi, uploadApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import './ProductEditor.css';

function ProductEditor({ product, onSaveSuccess, defaultEditable = true, onClearSelection }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const baseModelInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    SKU: '',
    baseModelUrl: ''
  });
  const [variations, setVariations] = useState([]);
  const [newVariation, setNewVariation] = useState({ name: '' });
  const [expandedVariation, setExpandedVariation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copiedLinkKey, setCopiedLinkKey] = useState('');
  const [isEditable, setIsEditable] = useState(defaultEditable);
  const [baseModelUploading, setBaseModelUploading] = useState(false);
  const [baseModelError, setBaseModelError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        SKU: product.SKU || '',
        baseModelUrl: product.baseModelUrl || ''
      });
      setVariations(product.variations || []);
      setSaved(false);
      setExpandedVariation(null);
      setIsEditable(defaultEditable);
    }
  }, [product, defaultEditable]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVariationChange = (e) => {
    const { name, value } = e.target;
    setNewVariation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addVariation = () => {
    if (!newVariation.name.trim()) {
      alert('Please enter a variation name');
      return;
    }
    setVariations(prev => [
      ...prev,
      {
        _id: Date.now().toString(),
        name: newVariation.name,
        type: newVariation.name.toLowerCase(),
        options: []
      }
    ]);
    setNewVariation({ name: '' });
  };

  const removeVariation = (variationId) => {
    setVariations(prev => prev.filter(v => v._id !== variationId));
    setExpandedVariation(null);
  };

  const addOptionToVariation = (variationId, option) => {
    if (!option.name) {
      alert('Please fill in the option field');
      return;
    }
    setVariations(prev => {
      return prev.map(v => {
        if (v._id === variationId) {
          return {
            ...v,
            options: [
              ...v.options,
              {
                _id: Date.now().toString(),
                name: option.name,
                value: option.name,
                priceModifier: parseFloat(option.priceModifier) || 0,
                uploadType: option.uploadType || '',
                file: option.file || null
              }
            ]
          };
        }
        return v;
      });
    });
  };

  const removeOption = (variationId, optionId) => {
    setVariations(prev => {
      return prev.map(v => {
        if (v._id === variationId) {
          return {
            ...v,
            options: v.options.filter(o => o._id !== optionId)
          };
        }
        return v;
      });
    });
  };

  const handleOptionEdit = (variationId, optionId, field, value) => {
    setVariations(prev => prev.map(v => {
      if (v._id === variationId) {
        return {
          ...v,
          options: v.options.map(o => {
            if (o._id === optionId) {
              return { ...o, [field]: value };
            }
            return o;
          })
        };
      }
      return v;
    }));
  };

  const getOptionUrl = (option) => option?.modelUrl || option?.cdnUrl || option?.fileUrl || '';

  const getShortUrlLabel = (url) => {
    if (!url) return '';

    try {
      const parsed = new URL(url);
      const path = parsed.pathname || '/';
      const compactPath = path.length > 26 ? `...${path.slice(-26)}` : path;
      return `${parsed.hostname}${compactPath}`;
    } catch {
      return url.length > 44 ? `${url.slice(0, 20)}...${url.slice(-20)}` : url;
    }
  };

  const copyToClipboard = async (text, key) => {
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const fallbackArea = document.createElement('textarea');
        fallbackArea.value = text;
        fallbackArea.setAttribute('readonly', '');
        fallbackArea.style.position = 'fixed';
        fallbackArea.style.opacity = '0';
        document.body.appendChild(fallbackArea);
        fallbackArea.select();
        document.execCommand('copy');
        document.body.removeChild(fallbackArea);
      }

      setCopiedLinkKey(key);
      setTimeout(() => {
        setCopiedLinkKey((prev) => (prev === key ? '' : prev));
      }, 1400);
    } catch (err) {
      console.error('Failed to copy CDN URL:', err);
      alert('Could not copy URL. Please copy it manually.');
    }
  };

  const handleBaseModelFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - accept GLB and PNG
    const isGLB = file.name.endsWith('.glb') || file.type === 'model/gltf-binary';
    const isPNG = file.name.endsWith('.png') || file.type === 'image/png';
    
    if (!isGLB && !isPNG) {
      setBaseModelError('Only GLB and PNG files are supported');
      return;
    }

    await handleBaseModelUpload(file);
  };

  const handleBaseModelUpload = async (file) => {
    if (!product) {
      setBaseModelError('Product not found');
      return;
    }

    try {
      setBaseModelUploading(true);
      setBaseModelError(null);

      const response = await uploadApi.uploadBaseModel(product._id, file);
      
      // Set the returned CDN URL as baseModelUrl
      setFormData(prev => ({
        ...prev,
        baseModelUrl: response.data.data.modelUrl || response.data.data.cdnUrl
      }));

      if (baseModelInputRef.current) {
        baseModelInputRef.current.value = '';
      }
      
      // Show success message
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      let errorMessage = 'Upload failed';
      
      // Extract meaningful error from backend
      if (err.response?.data?.error) {
        errorMessage = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : err.response.data.error.message || 'Upload failed';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setBaseModelError(errorMessage);
    } finally {
      setBaseModelUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!product) {
      alert('Please select a product');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const updatePayload = {
        name: formData.name,
        baseModelUrl: formData.baseModelUrl
      };
      await productApi.update(product._id, updatePayload);
      setSaved(true);
      addToast(`Product "${formData.name}" saved successfully!`, 'success');
      if (onSaveSuccess) onSaveSuccess();
      
      // Navigate to all products page after 1 second
      setTimeout(() => {
        navigate('/all-products');
      }, 500);
    } catch (err) {
      let errorMessage = 'Failed to save product';
      
      // Extract meaningful error from backend
      if (err.response?.data?.error) {
        errorMessage = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : err.response.data.error.message || 'Failed to save product';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error saving product:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="no-selection">
        <p>Select a product to view details</p>
      </div>
    );
  }

  return (
    <div className="product-editor-container">
      <div className="form-header header-with-edit">
        <h2>{isEditable ? 'Edit Product' : 'Product Details'}</h2>
        {!isEditable && (
          <button 
            type="button" 
            className="toggle-edit-btn"
            onClick={() => setIsEditable(true)}
          >
            <Edit3 size={16} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {saved && (
        <div className="success-message">
          ✓ Product updated successfully!
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            required
            disabled={!isEditable}
          />
        </div>

        <div className="form-group">
          <label htmlFor="SKU">SKU</label>
          <input
            type="text"
            id="SKU"
            value={formData.SKU}
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="baseModelUrl">Base Model</label>
          {baseModelError && (
            <div className="error-message" style={{ marginBottom: '10px' }}>
              {baseModelError}
            </div>
          )}
          <div className="base-model-section">
            <input
              ref={baseModelInputRef}
              id="base-model-file"
              type="file"
              accept=".glb, .png"
              onChange={handleBaseModelFileSelect}
              disabled={baseModelUploading || !isEditable}
              style={{ display: 'none' }}
            />
            {!formData.baseModelUrl && isEditable && (
              <button
                type="button"
                onClick={() => baseModelInputRef.current?.click()}
                disabled={baseModelUploading}
                className="upload-model-btn"
              >
                {baseModelUploading ? (
                  <>
                    <div className="spinner-small" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload Base Model</span>
                  </>
                )}
              </button>
            )}
            {formData.baseModelUrl && (
              <div className="model-set-info">
                <span className="status-badge">
                  <Check size={14} />
                  <span>Model Set</span>
                </span>
                <p className="model-url-preview">{getShortUrlLabel(formData.baseModelUrl)}</p>
                {isEditable && (
                  <button 
                    type="button" 
                    className="change-file-btn"
                    onClick={() => baseModelInputRef.current?.click()}
                    disabled={baseModelUploading}
                  >
                    {baseModelUploading ? '...' : 'Change'}
                  </button>
                )}
              </div>
            )}
            {!formData.baseModelUrl && !isEditable && (
              <p className="no-model">No base model set</p>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Product Variations</h3>
          <p className="section-description">
            {isEditable ? "Edit variations and their options." : "View variations and options for this product."}
          </p>

          {isEditable && (
            <div className="variation-add-control">
              <input
                type="text"
                name="name"
                value={newVariation.name}
                onChange={handleVariationChange}
                placeholder="New Variation Name (e.g., Size, Color)"
                className="variation-input"
              />
              <button
                type="button"
                className="add-variation-btn icon-btn"
                onClick={addVariation}
                title="Add Variation"
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          <div className="variations-list">
            {variations.length === 0 && !isEditable && (
              <p className="no-variations">No variations for this product</p>
            )}
            {variations.map(variation => (
              <div key={variation._id} className="variation-card">
                <div className="variation-header">
                  <div className="variation-info">
                    <h4>{variation.name}</h4>
                    <span className="variation-type">{variation.type}</span>
                  </div>
                  {isEditable && (
                    <button
                      type="button"
                      className="remove-btn icon-btn"
                      onClick={() => removeVariation(variation._id)}
                      title="Remove Variation"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="expand-variation-btn"
                  onClick={() =>
                    setExpandedVariation(
                      expandedVariation === variation._id ? null : variation._id
                    )
                  }
                >
                  {expandedVariation === variation._id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span>Options ({variation.options?.length || 0})</span>
                </button>

                {expandedVariation === variation._id && (
                  <div className="options-section">
                    <div className="options-list">
                      {variation.options && variation.options.length > 0 ? (
                        variation.options.map(option => {
                          const optionUrl = getOptionUrl(option);
                          const copyKey = `${variation._id}-${option._id}`;

                          return (
                          <div key={option._id} className="option-input-group">
                            <input
                              type="text"
                              value={option.name}
                              placeholder="Option"
                              onChange={(e) => handleOptionEdit(variation._id, option._id, 'name', e.target.value)}
                              className="option-display"
                              disabled={!isEditable}
                            />
                            <input
                              type="number"
                              value={option.priceModifier === 0 ? 0 : (option.priceModifier || '')}
                              placeholder="Price"
                              onChange={(e) => handleOptionEdit(variation._id, option._id, 'priceModifier', parseFloat(e.target.value) || 0)}
                              className="option-display"
                              disabled={!isEditable}
                            />
                            <select
                              value={option.uploadType || ''}
                              onChange={(e) => handleOptionEdit(variation._id, option._id, 'uploadType', e.target.value)}
                              className="option-display select-field"
                              disabled={!isEditable}
                            >
                              <option value="" disabled>Upload type</option>
                              <option value="glb">glb</option>
                              <option value="texture">texture</option>
                              <option value="mesh">mesh</option>
                            </select>
                            {isEditable ? (
                              <input 
                                type="file" 
                                accept=".glb,.png" 
                                className="option-display file-input-field" 
                              />
                            ) : (
                              <input
                                type="text"
                                className="option-display"
                                disabled
                                value={optionUrl ? 'File Set' : 'No File'}
                              />
                            )}
                            {isEditable ? (
                              <button
                                type="button"
                                className="remove-option-btn icon-btn"
                                onClick={() => removeOption(variation._id, option._id)}
                                title="Delete option"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <div /> 
                            )}
                            {optionUrl && (
                              <div className="option-cdn-row" title={optionUrl}>
                                <span className="option-cdn-text">{getShortUrlLabel(optionUrl)}</span>
                                <button
                                  type="button"
                                  className="copy-cdn-btn"
                                  onClick={() => copyToClipboard(optionUrl, copyKey)}
                                  title="Copy full CDN URL"
                                >
                                  {copiedLinkKey === copyKey ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedLinkKey === copyKey ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                        })
                      ) : (
                        <p className="no-options" style={{color: '#94a3b8', fontSize: '13px'}}>No options yet.</p>
                      )}

                      {isEditable && (
                        <OptionForm
                          onAddOption={(option) => addOptionToVariation(variation._id, option)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {isEditable && (
          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button"
              className="cancel-btn"
              onClick={() => {
                if (onClearSelection) onClearSelection();
                if (!defaultEditable) setIsEditable(false);
              }}
            >
              {defaultEditable ? 'Clear Selection' : 'Cancel Edit'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function OptionForm({ onAddOption }) {
  const [optionData, setOptionData] = useState({
    name: '',
    priceModifier: '',
    uploadType: '',
    file: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOptionData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!optionData.name) {
      alert('Option name is required');
      return;
    }
    onAddOption(optionData);
    setOptionData({ name: '', priceModifier: '', uploadType: '', file: null });
  };

  return (
    <div className="option-form" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
      <div className="option-input-group">
        <input
          type="text"
          name="name"
          value={optionData.name}
          onChange={handleChange}
          placeholder="New Option"
        />
        <input
          type="number"
          name="priceModifier"
          value={optionData.priceModifier}
          onChange={handleChange}
          placeholder="Price"
          step="0.01"
        />
        <select
          name="uploadType"
          value={optionData.uploadType}
          onChange={handleChange}
        >
          <option value="" disabled>Upload type</option>
          <option value="glb">glb</option>
          <option value="texture">texture</option>
          <option value="mesh">mesh</option>
        </select>
        <input 
          type="file" 
          accept=".png,.glb" 
          onChange={(e) => setOptionData(prev => ({...prev, file: e.target.files[0]}))}
          className="file-input-field"
        />
        <button type="button" className="add-option-btn icon-btn" onClick={handleAdd} title="Add option">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export default ProductEditor;
