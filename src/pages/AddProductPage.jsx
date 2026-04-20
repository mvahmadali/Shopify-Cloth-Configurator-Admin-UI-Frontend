import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  Check, 
  X, 
  ArrowLeft,
  FileBox
} from 'lucide-react';
import { productApi, uploadApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import './AddProductPage.css';

function AddProductPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const baseModelInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    SKU: '',
    baseModelUrl: ''
  });
  const [variations, setVariations] = useState([]);
  const [newVariation, setNewVariation] = useState({
    name: ''
  });
  const [expandedVariation, setExpandedVariation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [baseModelUploading, setBaseModelUploading] = useState(false);
  const [baseModelError, setBaseModelError] = useState(null);
  const [baseModelFile, setBaseModelFile] = useState(null);
  const [baseModelFileName, setBaseModelFileName] = useState(null);

  // Log variations whenever they change
  useEffect(() => {
    console.log('Variations updated:', variations);
  }, [variations]);

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
    if (!newVariation.name) {
      alert('Please fill in the variation name');
      return;
    }

    const variation = {
      id: Date.now(),
      name: newVariation.name,
      type: 'option',
      options: []
    };

    setVariations(prev => [...prev, variation]);
    setNewVariation({ name: '' });
  };

  const removeVariation = (variationId) => {
    setVariations(prev => prev.filter(v => v.id !== variationId));
    if (expandedVariation === variationId) {
      setExpandedVariation(null);
    }
  };

  const addOptionToVariation = (variationId, option) => {
    if (!option.name) {
      alert('Please fill in the option field');
      return;
    }

    console.log('✅ ADDING OPTION (NO UPLOAD YET):', { variationId, option });

    setVariations(prev => {
      const updated = prev.map(v => {
        if (v.id === variationId) {
          const newOption = {
            id: Date.now(),
            name: option.name,
            value: option.name,
            priceModifier: parseFloat(option.priceModifier) || 0,
            uploadType: option.uploadType || '',
            file: option.file || null
          };
          console.log('New option created (file stored, not uploaded):', newOption);
          return {
            ...v,
            options: [...v.options, newOption]
          };
        }
        return v;
      });
      
      console.log('After add state:', JSON.parse(JSON.stringify(updated)));
      return updated;
    });
  };

  const removeOption = (variationId, optionId) => {
    console.log('❌ DELETE CLICKED - Before removal:', { variationId, optionId });
    console.log('Current variations before removal:', JSON.parse(JSON.stringify(variations)));

    setVariations(prev => {
      const updated = prev.map(v => {
        if (v.id === variationId) {
          const originalCount = v.options.length;
          const newOptions = v.options.filter(o => {
            console.log(`Checking option: id=${o.id}, optionId=${optionId}, match=${o.id === optionId}`);
            return o.id !== optionId;
          });
          console.log(`Variation ${variationId}: ${originalCount} options → ${newOptions.length} options`);
          return {
            ...v,
            options: newOptions
          };
        }
        return v;
      });
      
      console.log('After removal state:', JSON.parse(JSON.stringify(updated)));
      return updated;
    });
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

    // Store the file for later upload
    setBaseModelError(null);
    setBaseModelFile(file);
    setBaseModelFileName(file.name);

    // Clear the input
    if (baseModelInputRef.current) {
      baseModelInputRef.current.value = '';
    }
  };

  const handleBaseModelUpload = async (file) => {
    // Create temporary product first to get ID
    if (!formData.name || !formData.SKU) {
      setBaseModelError('Please fill in product name and SKU first');
      return;
    }

    try {
      setBaseModelUploading(true);
      setBaseModelError(null);

      // For now, we'll store the file and upload it after product creation
      // This is a temporary approach - you can create product first if needed
      const response = await uploadApi.uploadBaseModel('temp', file);
      
      // Set the returned CDN URL as baseModelUrl
      setFormData(prev => ({
        ...prev,
        baseModelUrl: response.data.modelUrl || response.data.cdnUrl
      }));

      if (baseModelInputRef.current) {
        baseModelInputRef.current.value = '';
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.SKU) {
      setError('Product name and SKU are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload all files at once (base model + option models)
      let uploadedModelUrl = null;
      
      // Upload base model if selected
      if (baseModelFile) {
        try {
          setBaseModelUploading(true);
          console.log('Uploading base model...');
          const uploadResponse = await uploadApi.uploadBaseModel('temp', baseModelFile);
          uploadedModelUrl = uploadResponse.data.data.modelUrl || uploadResponse.data.data.cdnUrl;
          console.log('Base model uploaded:', uploadedModelUrl);
          setBaseModelUploading(false);
        } catch (err) {
          console.error('Error uploading base model:', err);
          throw new Error('Failed to upload base model');
        }
      }

      // Upload all option files
      const uploadedVariations = await Promise.all(
        variations.map(async (variation) => {
          const uploadedOptions = await Promise.all(
            variation.options.map(async (option) => {
              let modelUrl = null;
              if (option.file) {
                try {
                  console.log('Uploading option file:', option.file.name);
                  const uploadResponse = await uploadApi.uploadBaseModel('temp', option.file);
                  console.log('Upload response:', uploadResponse.data);
                  modelUrl = uploadResponse.data.data.modelUrl || uploadResponse.data.data.cdnUrl;
                  console.log('Option file uploaded - modelUrl:', modelUrl);
                } catch (err) {
                  console.error('Error uploading option file:', err);
                  throw new Error(`Failed to upload file for option: ${option.name}`);
                }
              }
              console.log('Returning option:', { name: option.name, modelUrl });
              return {
                name: option.name,
                value: option.value,
                priceModifier: option.priceModifier,
                uploadType: option.uploadType,
                modelUrl: modelUrl
              };
            })
          );
          return {
            name: variation.name,
            type: variation.type,
            options: uploadedOptions
          };
        })
      );

      // Create product with all uploaded URLs
      const productPayload = {
        name: formData.name,
        SKU: formData.SKU,
        baseModelUrl: uploadedModelUrl || null,
        variations: uploadedVariations
      };

      console.log('Creating product with payload:', productPayload);
      const createResponse = await productApi.create(productPayload);
      if (!createResponse?.data?.success) {
        throw new Error('Product creation did not complete successfully');
      }

      setSuccess(true);
      addToast(`Product "${formData.name}" created successfully!`, 'success');
      
      setTimeout(() => {
        navigate('/all-products');
      }, 2000);
    } catch (err) {
      let errorMessage = 'Failed to create product';
      
      // Extract meaningful error from backend
      if (err.response?.data?.error) {
        errorMessage = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : err.response.data.error.message || 'Failed to create product';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('❌ Product creation error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: errorMessage,
        fullError: err
      });
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
      setBaseModelUploading(false);
    }
  };

  return (
    <div className="add-product-page">
      <div className="form-container">
        <div className="form-header">
          <h2>Add New Product</h2>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>Back to Menu</span>
          </button>
        </div>

        {success && (
          <div className="success-message">
            ✓ Product created successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Product Basic Info */}
          <div className="form-section">
            <h3>Product Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., Custom T-Shirt, Sports Jacket"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="SKU">SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                id="SKU"
                name="SKU"
                value={formData.SKU}
                onChange={handleFormChange}
                placeholder="e.g., TSHIRT-001"
                required
              />
            </div>
          </div>

          {/* Variations Section */}
          <div className="form-section">
            <h3>Product Variations</h3>
            <p className="section-description">
              Create variations like Size, Color, Style, etc., and add options for each.
            </p>

            <div className="variation-input-group">
              <div className="form-group">
                <label>Variation Name</label>
                <input
                  type="text"
                  name="name"
                  value={newVariation.name}
                  onChange={handleVariationChange}
                  placeholder="e.g., Size, Color, Style"
                />
              </div>

              <button
                type="button"
                className="add-variation-btn"
                onClick={addVariation}
              >
                <Plus size={18} />
                <span>Add Variation</span>
              </button>
            </div>

            {/* Variations List */}
            <div className="variations-list">
              {variations.map(variation => (
                <div key={variation.id} className="variation-card">
                  <div className="variation-header">
                    <div className="variation-info">
                      <h4>{variation.name}</h4>
                      <span className="variation-type">{variation.type}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeVariation(variation.id)}
                      title="Remove Variation"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="expand-variation-btn"
                    onClick={() =>
                      setExpandedVariation(
                        expandedVariation === variation.id ? null : variation.id
                      )
                    }
                  >
                    {expandedVariation === variation.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span>Options ({variation.options.length})</span>
                  </button>

                  {expandedVariation === variation.id && (
                    <div className="options-section">
                      <div className="options-list">
                        {variation.options.map(option => (
                          <div key={option.id} className="option-input-group">
                            <input
                              type="text"
                              value={option.name}
                              placeholder="Option"
                              disabled
                              className="option-display"
                            />
                            <input
                              type="number"
                              value={option.priceModifier || ''}
                              placeholder="Price"
                              disabled
                              className="option-display"
                            />
                            <select 
                              value={option.uploadType || ''} 
                              disabled 
                              className="option-display select-field"
                            >
                              <option value="" disabled>Upload type</option>
                              <option value="glb">glb</option>
                              <option value="texture">texture</option>
                              <option value="mesh">mesh</option>
                            </select>
                            {option.file ? (
                              <input
                                type="text"
                                value={option.file.name}
                                disabled
                                className="option-display"
                                title={option.file.name}
                              />
                            ) : (
                              <input 
                                type="file" 
                                accept=".glb,.png" 
                                disabled 
                                className="option-display file-input-field" 
                              />
                            )}
                            <button
                              type="button"
                              className="remove-option-btn"
                              onClick={() =>
                                removeOption(variation.id, option.id)
                              }
                              title="Delete option"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}

                        <OptionForm
                          onAddOption={(option) =>
                            addOptionToVariation(variation.id, option)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Base Model Section */}
          <div className="form-section">
            <h3>Base Model</h3>
            <p className="section-description">
              Upload a base GLB or PNG model that will be used as the default 3D model for this product.
            </p>
            
            {baseModelError && (
              <div className="error-message">
                <span>{baseModelError}</span>
              </div>
            )}

            <div className="base-model-upload">
              <input
                ref={baseModelInputRef}
                id="base-model-file"
                type="file"
                accept=".glb, .png"
                onChange={handleBaseModelFileSelect}
                disabled={baseModelUploading}
                className="file-input"
                style={{ display: 'none' }}
              />
              <div className="upload-area">
                {!baseModelFileName ? (
                  <button
                    type="button"
                    onClick={() => baseModelInputRef.current?.click()}
                    disabled={baseModelUploading}
                    className="upload-button"
                  >
                    {baseModelUploading ? 'Uploading...' : 'Upload Base Model'}
                  </button>
                ) : (
                  <div className="model-set-info">
                    <span className="status-badge">
                      <Check size={14} />
                      <span>File Selected</span>
                    </span>
                    <p className="model-url-preview">{baseModelFileName}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseModelFileName(null);
                        setBaseModelFile(null);
                        if (baseModelInputRef.current) {
                          baseModelInputRef.current.value = '';
                        }
                      }}
                      className="change-file-btn"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper component for option input form
function OptionForm({ onAddOption }) {
  const fileInputRef = useRef(null);
  const [optionData, setOptionData] = useState({
    name: '',
    priceModifier: '',
    uploadType: 'glb',
    file: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setOptionData(prev => ({
      ...prev,
      file: e.target.files[0] || null
    }));
  };

  const handleAdd = () => {
    console.log('🔵 HANDLE ADD CALLED');
    console.log('Current optionData:', optionData);
    
    if (!optionData.name) {
      alert('Option is required');
      return;
    }
    
    console.log('✅ VALIDATION PASSED - calling onAddOption');
    onAddOption(optionData);
    
    console.log('Option added, resetting form');
    setOptionData({ name: '', priceModifier: '', uploadType: 'glb', file: null });
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="option-form">
      <div className="option-input-group">
        <input
          type="text"
          name="name"
          value={optionData.name}
          onChange={handleChange}
          placeholder="Option (e.g., Small, Medium, Large)"
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
          <option value="glb">glb</option>
          <option value="texture">texture</option>
          <option value="mesh">mesh</option>
        </select>
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".glb,.png" 
          onChange={handleFileChange}
          className="file-input-field"
        />
        <button type="button" className="add-option-btn" onClick={handleAdd} title="Add option">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export default AddProductPage;
