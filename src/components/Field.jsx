export function TextField({ label, ...props }) {
  return (
    <label className="block">
      <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">{label}</div>
      <input
        {...props}
        className={`w-full bg-bg border border-line rounded-lg px-4 py-3 text-ink focus:border-accent focus:outline-none ${props.className || ''}`}
      />
    </label>
  );
}

export function AmountField({ label, value, onChange, autoFocus }) {
  return (
    <label className="block">
      <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">{label}</div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted tnum">$</span>
        <input
          inputMode="decimal"
          type="text"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          className="w-full bg-bg border border-line rounded-lg pl-8 pr-4 py-3 text-ink tnum text-lg focus:border-accent focus:outline-none"
        />
      </div>
    </label>
  );
}

export function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block">
      <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border border-line rounded-lg px-4 py-3 text-ink focus:border-accent focus:outline-none appearance-none"
      >
        {children}
      </select>
    </label>
  );
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`w-full bg-accent text-black font-semibold rounded-lg py-3 press disabled:opacity-60 ${props.className || ''}`}
    >
      {children}
    </button>
  );
}
