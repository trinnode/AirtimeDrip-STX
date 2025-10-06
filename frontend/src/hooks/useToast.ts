import { useCallback, useState } from "react";
import { ToastMessage, ToastType } from "../components/Toast";

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = `toast-${toastId++}`;
      const toast: ToastMessage = { id, message, type, duration };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback(
    (id: string, message: string, type: ToastType, duration?: number) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, message, type, duration } : t))
      );
    },
    []
  );

  return {
    toasts,
    showToast,
    dismissToast,
    updateToast,
  };
};
