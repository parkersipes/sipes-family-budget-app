import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, right, backTo }) {
  const nav = useNavigate();
  return (
    <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-line px-5 py-3 flex items-center gap-3">
      <button
        onClick={() => (backTo ? nav(backTo) : nav(-1))}
        className="text-ink-muted press p-1 -ml-1"
        aria-label="Back"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-ink font-semibold truncate">{title}</div>
        {subtitle && <div className="text-ink-faint text-xs truncate">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
