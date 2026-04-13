import { useEffect } from 'react';

export default function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full bg-bg-raised border-t border-line rounded-t-2xl max-h-[92vh] flex flex-col animate-[slideUp_220ms_cubic-bezier(.2,.8,.2,1)]">
        <div className="pt-2.5 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>
        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <div className="text-ink text-lg font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="text-ink-muted text-sm press"
            aria-label="Close"
          >
            Cancel
          </button>
        </div>
        <div className="px-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line">{footer}</div>}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
