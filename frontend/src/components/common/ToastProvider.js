import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "./ToastProvider.css";

const ToastContext = createContext(null);
let nextToastId = 0;

export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((message, type = "info") => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => dismiss(id), 4800);
    return id;
  }, [dismiss]);

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="antique-toaster" aria-label={t("common.notifications")} aria-live="polite">
        {toasts.map((item) => {
          const Icon = item.type === "success" ? FiCheckCircle
            : item.type === "error" ? FiAlertCircle : FiInfo;
          return (
            <div
              className={`antique-toast antique-toast--${item.type}`}
              key={item.id}
              role={item.type === "error" ? "alert" : "status"}
            >
              <span className="antique-toast__icon"><Icon aria-hidden="true" /></span>
              <span className="antique-toast__message">{item.message}</span>
              <button type="button" onClick={() => dismiss(item.id)} aria-label={t("common.dismiss")}>
                <FiX aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context.toast;
}
