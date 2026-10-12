import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, tone = 'info' }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, tone }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '380px',
          width: 'calc(100vw - 2.5rem)',
        }}
      >
        {toasts.map((toast) => {
          const borderMap = {
            success: 'var(--ce-success)',
            danger: 'var(--ce-danger)',
            warning: 'var(--ce-warning)',
            info: 'var(--ce-accent)',
          };
          return (
            <div
              key={toast.id}
              className="ce-card"
              style={{
                padding: '0.85rem 1rem',
                borderLeft: `4px solid ${borderMap[toast.tone] || borderMap.info}`,
                boxShadow: 'var(--ce-shadow-float)',
              }}
            >
              <div className="ce-row-between" style={{ alignItems: 'flex-start' }}>
                <div className="ce-row" style={{ alignItems: 'flex-start', gap: '0.55rem' }}>
                  {toast.tone === 'success' && <CheckCircle2 size={18} color="var(--ce-success)" />}
                  {toast.tone === 'danger' && <AlertCircle size={18} color="var(--ce-danger)" />}
                  {toast.tone !== 'success' && toast.tone !== 'danger' && (
                    <Info size={18} color="var(--ce-accent)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{toast.title}</div>
                    {toast.description && (
                      <div className="ce-muted" style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>
                        {toast.description}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="ce-btn ce-btn-ghost ce-btn-sm"
                  style={{ padding: '0.2rem' }}
                  aria-label="Close notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}
