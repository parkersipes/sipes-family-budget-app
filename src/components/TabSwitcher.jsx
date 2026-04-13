export default function TabSwitcher({ value, onChange, tabs }) {
  return (
    <div className="flex bg-bg-raised border border-line rounded-xl p-1">
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium press transition-colors ${
              on ? 'bg-bg-elevated text-ink' : 'text-ink-muted'
            }`}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              {t.label}
              {t.badge != null && (
                <span className={`tnum text-[11px] px-1.5 py-0.5 rounded-full ${
                  on ? 'bg-bg border border-line text-ink-muted' : 'bg-bg text-ink-faint'
                }`}>
                  {t.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
