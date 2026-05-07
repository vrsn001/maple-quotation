import React, { useEffect, useState } from "react";

// ── BRAND STYLES ─────────────────────────────────────────────────────────────
// This file controls all UI component styling for Maple Quotation Platform.
// Accent color: Maple Maroon #632a2a
// DO NOT add gold/yellow. DO NOT add serif fonts to UI components.
// ─────────────────────────────────────────────────────────────────────────────

export const BrandStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  :root {
    --bg-page:        #0c0c0e;
    --bg-surface:     #18181b;
    --bg-elevated:    #232329;
    --bg-input:       #1e1e23;
    --border-subtle:  #1f1f25;
    --border-base:    #2e2e36;
    --border-strong:  #3f3f4a;
    --text-primary:   #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted:     #71717a;
    --text-faint:     #52525b;
    --maple:          #632a2a;
    --maple-hover:    #7a3333;
    --maple-deep:     #4a1f1f;
    --maple-glow:     rgba(99,42,42,0.15);
    --maple-tint:     rgba(99,42,42,0.08);
    --green:          #22c55e;
    --green-tint:     rgba(34,197,94,0.08);
  }

  * { box-sizing: border-box; }

  body {
    background: var(--bg-page);
    color: var(--text-primary);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-base); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

  /* Cards */
  .mpl-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-base);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    margin-bottom: 16px;
  }

  .mpl-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .mpl-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    font-family: 'Inter', system-ui, sans-serif;
    letter-spacing: -0.01em;
  }

  /* Inputs */
  .maple-input {
    width: 100%;
    height: 42px;
    padding: 0 14px;
    background: var(--bg-input);
    border: 1.5px solid var(--border-base);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 14px;
    font-family: 'Inter', system-ui, sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .maple-input::placeholder { color: var(--text-faint); }
  .maple-input:hover { border-color: var(--border-strong); }
  .maple-input:focus {
    border-color: var(--maple);
    box-shadow: 0 0 0 3px var(--maple-glow);
  }

  textarea.maple-input {
    height: auto;
    min-height: 90px;
    padding: 12px 14px;
    resize: vertical;
    line-height: 1.5;
  }

  select.maple-input { cursor: pointer; }

  /* Buttons */
  .maple-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 0 18px;
    background: var(--maple);
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .maple-btn-primary:hover { background: var(--maple-hover); }
  .maple-btn-primary:active { transform: scale(0.98); }

  .maple-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 0 16px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', system-ui, sans-serif;
    border: 1px solid var(--border-base);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .maple-btn-secondary:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .maple-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', system-ui, sans-serif;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .maple-btn-ghost:hover { color: var(--text-primary); background: var(--bg-elevated); }

  /* Labels */
  .maple-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--text-muted);
    margin-bottom: 7px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  /* Field grid */
  .maple-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .maple-grid-2 .maple-full { grid-column: 1 / -1; }

  /* Sidebar */
  .maple-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 38px;
    padding: 0 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    margin-bottom: 2px;
    text-align: left;
    font-family: 'Inter', system-ui, sans-serif;
    transition: all 0.1s;
  }
  .maple-nav-item:hover { background: #1a1a1f; color: var(--text-primary); }
  .maple-nav-item.active {
    background: var(--maple-tint);
    color: #c97a7a;
    border-left: 2px solid var(--maple);
    padding-left: 10px;
  }

  /* Badges */
  .maple-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: var(--green-tint);
    border: 1px solid rgba(34,197,94,0.2);
    color: var(--green);
  }
  .maple-badge-live::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--green);
    animation: mplPulse 2s infinite;
  }
  @keyframes mplPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Toast */
  .maple-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .maple-toast {
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg-surface);
    border: 1px solid var(--border-base);
    color: var(--text-primary);
    pointer-events: all;
    animation: mplSlideIn 0.2s ease;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .maple-toast.success { border-color: var(--maple); color: #e88888; }
  .maple-toast.error { border-color: #ef4444; color: #f87171; }
  .maple-toast.info { border-color: var(--border-strong); }
  @keyframes mplSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Shortcut key */
  .maple-key {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-base);
    border-radius: 4px;
    font-size: 10px;
    color: var(--text-muted);
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
`;

// ── LIVE CLOCK ────────────────────────────────────────────────────────────────
export const LiveClock = () => {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <span style={{
      fontSize: '11px',
      color: 'var(--text-faint)',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: "'SF Mono', 'Fira Code', monospace"
    }}>
      {time}
    </span>
  );
};

// ── INPUT COMPONENTS ──────────────────────────────────────────────────────────
export const InputLabel = ({
  label,
  children,
  className = ""
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col ${className}`} style={{ gap: '6px' }}>
    <label className="maple-label">{label}</label>
    {children}
  </div>
);

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`maple-input ${props.className || ""}`} />
);

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    type="number"
    className={`maple-input ${props.className || ""}`}
  />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`maple-input ${props.className || ""}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`maple-input ${props.className || ""}`} />
);
