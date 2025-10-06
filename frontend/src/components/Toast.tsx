import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "pending";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const Toast = ({ toast, onDismiss }: ToastProps) => {
  useEffect(() => {
    if (toast.type !== "pending" && toast.duration !== 0) {
      const timeout = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timeout);
    }
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "pending":
        return "⏳";
      default:
        return "ℹ";
    }
  };

  const getClassName = () => {
    switch (toast.type) {
      case "success":
        return "toast toast-success";
      case "error":
        return "toast toast-error";
      case "pending":
        return "toast toast-pending";
      default:
        return "toast toast-info";
    }
  };

  return (
    <div className={getClassName()}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{toast.message}</span>
      {toast.type !== "pending" && (
        <button
          className="toast-close"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;
