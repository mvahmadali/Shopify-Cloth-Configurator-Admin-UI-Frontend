import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Toast.css';

function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' && <CheckCircle className="toast-icon" />}
            {toast.type === 'error' && <AlertCircle className="toast-icon" />}
            {toast.type === 'info' && <Info className="toast-icon" />}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close toast"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
