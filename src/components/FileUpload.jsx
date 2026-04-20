import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { uploadApi } from '../services/api';
import './FileUpload.css';

function FileUpload({ productId, variationId, optionId, optionName, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - accept GLB and PNG
    const isGLB = file.name.endsWith('.glb') || file.type === 'model/gltf-binary';
    const isPNG = file.name.endsWith('.png') || file.type === 'image/png';
    
    if (!isGLB && !isPNG) {
      setError('Only GLB and PNG files are supported');
      return;
    }

    await handleUpload(file);
  };

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const response = await uploadApi.uploadModel(
        productId,
        variationId,
        optionId,
        file
      );

      setSuccess(true);
      onUploadSuccess?.(response.data);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      let errorMessage = 'Upload failed';
      if (err.response?.data?.error) {
        errorMessage = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : err.response.data.error.message || 'Upload failed';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <label htmlFor={`file-${optionId}`} className="upload-label">
        {optionName}
      </label>
      <div className="upload-controls">
        <input
          ref={fileInputRef}
          id={`file-${optionId}`}
          type="file"
          accept=".glb, .png"
          onChange={handleFileSelect}
          disabled={uploading}
          className="file-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Choose File'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">✓ Uploaded successfully</div>}
    </div>
  );
}

FileUpload.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variationId: PropTypes.string.isRequired,
  optionId: PropTypes.string.isRequired,
  optionName: PropTypes.string.isRequired,
  onUploadSuccess: PropTypes.func
};

export default FileUpload;
