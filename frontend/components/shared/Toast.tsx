'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  show: boolean;
  message: string;
  autoHide?: number;
  onClose?: () => void;
}

export default function Toast({ show, message, autoHide = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, autoHide);
    return () => clearTimeout(timer);
  }, [show, autoHide, onClose]);

  if (!visible) return null;

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      <div className="toast show align-items-center text-bg-success border-0" role="alert">
        <div className="d-flex">
          <div className="toast-body">
            <i className="bi bi-check-circle me-2"></i>
            {message}
          </div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
          ></button>
        </div>
      </div>
    </div>
  );
}